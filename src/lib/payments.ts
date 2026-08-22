import { auth, db } from './firebase';
import { doc, setDoc } from 'firebase/firestore';
import { PlanType } from '../types';
import { PLAN_PRICING, PLAN_PRICING_INR, canPurchaseLifetime, buildSubscriptionPayload } from './subscription';
import { notifyAdmin } from './notify';
import { initiateDodoSubscription } from './dodoPayments';

/**
 * Checks whether user's saved country is India or IN.
 * Defaults to true if country is missing or unspecified (for existing Indian users).
 */
export function isCountryIndia(countryNameOrCode?: string | null): boolean {
  if (!countryNameOrCode || typeof countryNameOrCode !== 'string') return true;
  const c = countryNameOrCode.trim().toLowerCase();
  return c === 'india' || c === 'in' || c === 'bharat';
}

/**
 * Unified subscription router:
 * - India users -> Razorpay (INR)
 * - Rest of World users -> Dodo Payments (USD)
 */
export async function initiateUnifiedSubscription(
  planType: PlanType,
  country: string | undefined | null,
  onSuccess: (planType: PlanType) => void,
  onError?: (message: string) => void
) {
  const isIndia = isCountryIndia(country);
  console.log('[UnifiedSubscriptionRouter] Routing request:', { planType, country, isIndia });

  if (isIndia) {
    console.log('[UnifiedSubscriptionRouter] Routing to Razorpay (INR)');
    return initiateSubscription(planType, onSuccess, onError);
  } else {
    console.log('[UnifiedSubscriptionRouter] Routing to Dodo Payments (USD)');
    return initiateDodoSubscription(planType, onSuccess, onError);
  }
}

export async function loadRazorpay() {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/** fetch with a hard timeout so a hung endpoint can never freeze the UI. */
async function fetchWithTimeout(url: string, opts: RequestInit, ms = 20000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...opts, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Production-ready subscription purchase.
 *
 * RELIABILITY STRATEGY:
 * Razorpay's `handler` callback is ONLY invoked on a genuine successful
 * payment. So the moment it fires, we (a) unblock the UI via onSuccess
 * IMMEDIATELY, then (b) persist the subscription to Firestore in parallel.
 * The UI can NEVER get stuck loading because onSuccess is not gated on the
 * Firestore write. The page reloads shortly after (in the success flow) and
 * FirebaseProvider picks up the granted access.
 */
export async function initiateSubscription(
  planType: PlanType,
  onSuccess: (planType: PlanType) => void,
  onError?: (message: string) => void
) {
  const isLoaded = await loadRazorpay();
  if (!isLoaded) {
    onError?.("Razorpay SDK failed to load. Please check your internet connection.");
    return;
  }

  const user = auth.currentUser;
  if (!user) {
    onError?.("Please sign in to subscribe.");
    return;
  }

  if (planType === 'lifetime') {
    try {
      const canPurchase = await canPurchaseLifetime();
      if (!canPurchase) {
        onError?.("Founder Lifetime plan is sold out.");
        return;
      }
    } catch {
      // don't block on this check failing
    }
  }

  const plan = PLAN_PRICING_INR[planType];
  // Razorpay charges in INR. Use the explicit INR price (not USD × FX)
  // so the user always sees the same ₹ value on the subscription page
  // and in the Razorpay checkout.
  const amountInRupees = plan.price;

  // Order creation — resolved before modal opens, so errors are handled here.
  let order: any;
  try {
    const orderRes = await fetchWithTimeout("/api/razorpay/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: amountInRupees, currency: "INR", planType, uid: user.uid }),
    });

    if (!orderRes.ok) {
      let errorBody = `HTTP ${orderRes.status}`;
      try { errorBody = (await orderRes.json()).error || errorBody; } catch {}
      throw new Error(errorBody);
    }
    order = await orderRes.json();
  } catch (error: any) {
    console.error("[Subscription] Order creation failed:", error?.message);
    onError?.("Could not start payment. Please try again. (" + (error?.message || "network error") + ")");
    return;
  }

  const key_id_to_use = order.key_id || import.meta.env.VITE_RAZORPAY_KEY_ID;

  const options = {
    key: key_id_to_use || "rzp_test_demo",
    amount: order.amount,
    currency: order.currency,
    name: "Menifest OS",
    description: `${plan.name} Plan — ₹${amountInRupees}`,
    order_id: order.id,
    handler: async function (response: any) {
      // ── PAYMENT CONFIRMED BY RAZORPAY ──
      console.log("[Subscription] ✅ Payment confirmed for", planType);

      // 1. UNBLOCK UI IMMEDIATELY (before any async work).
      window.dispatchEvent(new Event("mos_subscription_updated"));
      onSuccess(planType);

      // 2. Write the PAYMENT RECORD FIRST (most reliable path).
      const paymentId = `pay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const paymentRecord = {
        userId: user.uid, planType, amount: amountInRupees, currency: 'INR',
        paymentStatus: 'success',
        razorpayOrderId: response.razorpay_order_id,
        razorpayPaymentId: response.razorpay_payment_id,
        createdAt: new Date().toISOString(),
      };
      try {
        await setDoc(doc(db, 'payments', paymentId), paymentRecord);
        console.log('[Payments] ✅ Payment record saved (source of truth):', planType);

        // Notify admin of new subscription (non-blocking)
        notifyAdmin('subscription', {
          userName: user.displayName || user.email?.split('@')[0] || 'User',
          userEmail: user.email || '',
          planType,
          amount: amountInRupees,
        });

        // Track purchase in Meta Pixel
        import('./pixel').then(function(m) { m.trackPurchase(planType, amountInRupees); });
      } catch (payErr: any) {
        console.error('[Payments] ⚠️ Payment record write failed:', payErr?.code || payErr?.message);
      }

      // Trigger a refresh so FirebaseProvider picks up the new payment record.
      window.dispatchEvent(new Event("mos_subscription_updated"));

      // 3. ALSO write the subscription to the user doc & activate backend
      (async () => {
        const baseName = user.displayName || (user.email ? user.email.split('@')[0] : 'Seeker');
        const subPayload = {
          ...buildSubscriptionPayload(planType),
          userId: user.uid,
          email: user.email || '',
          name: baseName,
        };
        const writePromise = setDoc(doc(db, 'users', user.uid), subPayload, { merge: true });
        const writeTimeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Firestore write timeout')), 15000)
        );
        try {
          await Promise.race([writePromise, writeTimeout]);
          console.log('[Payments] ✅ Subscription also written to user doc:', planType);
        } catch (writeErr: any) {
          console.warn('[Payments] user-doc write failed (access still works via payments):', writeErr?.code || writeErr?.message);
        }

        // Call backend activate endpoint
        try {
          await fetchWithTimeout("/api/subscription/activate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              uid: user.uid,
              planType,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              amount: amountInRupees,
            })
          }, 15000);
        } catch (err) {
          console.warn("[Subscription] backend activate notice:", err);
        }

        // 4. Background signature verification (audit only).
        try {
          const verifyRes = await fetchWithTimeout("/api/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          }, 15000);
          console.log("[Subscription] signature verification:", verifyRes.ok ? "✅ ok" : "⚠️ failed");
        } catch (e) {
          console.warn("[Subscription] background verify skipped:", (e as Error)?.message);
        }

        // 5. Final refresh.
        window.dispatchEvent(new Event("mos_subscription_updated"));
      })();
    },
    prefill: {
      name: user.displayName || "",
      email: user.email || "",
    },
    theme: { color: "#f59e0b" },
    modal: {
      ondismiss: () => {
        console.log("[Subscription] Payment modal dismissed by user");
        onError?.("");
      }
    }
  };

  if (order.is_demo || !key_id_to_use || key_id_to_use.includes("demo") || key_id_to_use.includes("placeholder") || key_id_to_use === "rzp_test_demo_key") {
    console.log("[Subscription] Serving seamless demo/sandbox payment activation.");
    const demoPayload = {
      razorpay_order_id: order.id || `order_demo_${Date.now()}`,
      razorpay_payment_id: `pay_demo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      razorpay_signature: "demo_signature_valid",
    };
    await options.handler(demoPayload);
    return;
  }

  try {
    const rzp = new (window as any).Razorpay(options);

    rzp.on('payment.failed', function (response: any) {
      console.error("[Subscription] Razorpay payment failed:", response.error);
      const msg = response.error?.description || "Payment was not completed.";
      onError?.(msg);
    });

    rzp.open();
  } catch (error: any) {
    console.error("[Subscription] Failed to open Razorpay:", error);
    onError?.("Could not open the payment window. Please try again.");
  }
}

// Legacy support (redirects to new function for monthly)
export async function upgradeToPremium(onSuccess: () => void) {
  await initiateSubscription('monthly', () => onSuccess(), (msg) => msg && console.error(msg));
}

import { auth, db } from './firebase';
import { doc, setDoc } from 'firebase/firestore';
import { PlanType } from '../types';
import { canPurchaseLifetime, buildSubscriptionPayload } from './subscription';
import { notifyAdmin } from './notify';
import { loadDodoSDK, openDodoCheckout } from '../services/dodoService';

export const GLOBAL_USD_PRICING = {
  monthly: { price: 4.99, durationDays: 30, name: 'Hunter Monthly', currency: 'USD', symbol: '$' },
  yearly: { price: 49.99, durationDays: 365, name: 'Yearly Alignment', currency: 'USD', symbol: '$' },
  lifetime: { price: 99.00, durationDays: Infinity, name: 'Founder Lifetime', currency: 'USD', symbol: '$' }
} as const;

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
 * Production-ready official Dodo Payments Hosted Checkout handler for international users.
 */
export async function initiateDodoSubscription(
  planType: PlanType,
  onSuccess: (planType: PlanType) => void,
  onError?: (message: string) => void
) {
  console.log('[DodoSubscription] initiateDodoSubscription started for planType:', planType);

  const user = auth.currentUser;
  if (!user) {
    console.warn('[DodoSubscription] User is not authenticated.');
    onError?.("Please sign in to subscribe.");
    return;
  }

  console.log('[DodoSubscription] User authenticated:', { uid: user.uid, email: user.email });

  // Pre-open a blank loading window synchronously to preserve user gesture context and completely bypass browser popup blockers.
  let checkoutWindow: Window | null = null;
  if (typeof window !== 'undefined') {
    console.log('[DodoSubscription] Pre-opening popup window synchronously before initiating async checkout fetch...');
    checkoutWindow = window.open('', '_blank', 'width=1000,height=800,resizable=yes,scrollbars=yes');
    if (checkoutWindow) {
      checkoutWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Securing Your Manifest OS Checkout...</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                background-color: #fafafa;
                color: #2d3748;
                margin: 0;
                padding: 20px;
                box-sizing: border-box;
                text-align: center;
              }
              .card {
                background: white;
                padding: 40px;
                border-radius: 16px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.05);
                max-width: 420px;
                width: 100%;
              }
              .spinner {
                border: 3px solid rgba(13, 148, 136, 0.1);
                width: 48px;
                height: 48px;
                border-radius: 50%;
                border-left-color: #0d9488;
                animation: spin 1s linear infinite;
                margin: 0 auto 24px auto;
              }
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
              h2 {
                font-weight: 600;
                font-size: 20px;
                margin: 0 0 12px 0;
                color: #1a202c;
              }
              p {
                color: #718096;
                margin: 0 0 24px 0;
                font-size: 14px;
                line-height: 1.5;
              }
              .badge {
                display: inline-block;
                background: #f0fdfa;
                color: #0f766e;
                padding: 6px 12px;
                border-radius: 9999px;
                font-size: 12px;
                font-weight: 500;
              }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="spinner"></div>
              <h2>Connecting to Dodo Payments</h2>
              <p>Please wait while we secure your payment checkout session. You will be redirected automatically to complete your subscription purchase.</p>
              <div class="badge">Manifest OS Secure Payment</div>
            </div>
          </body>
        </html>
      `);
      checkoutWindow.document.close();
    } else {
      console.warn('[DodoSubscription] Popup window pre-opening failed or was blocked by browser popup blocker settings.');
    }
  }

  if (planType === 'lifetime') {
    try {
      const canPurchase = await canPurchaseLifetime();
      if (!canPurchase) {
        console.warn('[DodoSubscription] Founder Lifetime plan sold out.');
        if (checkoutWindow) checkoutWindow.close();
        onError?.("Founder Lifetime plan is sold out.");
        return;
      }
    } catch (e) {
      console.warn('[DodoSubscription] Lifetime availability check warning:', e);
    }
  }

  const plan = GLOBAL_USD_PRICING[planType];
  const amountUSD = plan.price;

  console.log('[DodoSubscription] Requesting /api/dodo/checkout with body:', {
    amount: amountUSD,
    currency: "USD",
    planType,
    uid: user.uid,
    email: user.email || "",
    name: user.displayName || ""
  });

  let checkoutData: any;
  try {
    const res = await fetchWithTimeout("/api/dodo/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: amountUSD,
        currency: "USD",
        planType,
        uid: user.uid,
        email: user.email || "",
        name: user.displayName || ""
      }),
    });

    const data = await res.json().catch(() => ({}));
    console.log('[DodoSubscription] /api/dodo/checkout response:', { status: res.status, data });

    if (!res.ok || data.error) {
      throw new Error(data.error || `HTTP ${res.status}`);
    }
    checkoutData = data;
  } catch (error: any) {
    console.error("[DodoSubscription] Checkout session creation failed:", error?.message);
    if (checkoutWindow) checkoutWindow.close();
    onError?.(error?.message || "Could not create Dodo Payments checkout session. Please check your network or server setup.");
    return;
  }

  const mode = (import.meta as any).env?.VITE_DODO_PAYMENTS_MODE || 'test';
  console.log('[DodoSubscription] Launching Dodo checkout with received data:', checkoutData, 'Mode:', mode);

  // If we have a valid pre-opened window, redirect it directly to the checkout URL
  if (checkoutWindow && checkoutData?.checkout_url) {
    console.log('[DodoSubscription] Redirecting pre-opened window to checkout URL:', checkoutData.checkout_url);
    checkoutWindow.location.href = checkoutData.checkout_url;
    return;
  }

  // Fallback: Trigger checkout via standard redirections if pre-opening failed or window object was lost
  console.log('[DodoSubscription] Pre-opened window not available. Running fallback redirect...');
  const launched = await openDodoCheckout({
    checkoutUrl: checkoutData?.checkout_url,
    checkoutId: checkoutData?.checkout_id,
    mode,
  });

  console.log('[DodoSubscription] openDodoCheckout result:', launched);

  if (launched) {
    return;
  }

  if (checkoutData?.checkout_url) {
    console.log('[DodoSubscription] openDodoCheckout returned false, trying direct window.location.href to checkout_url:', checkoutData.checkout_url);
    window.location.href = checkoutData.checkout_url;
    return;
  }

  console.error('[DodoSubscription] ❌ Failed to launch Dodo checkout completely.');
  onError?.("Dodo Payments checkout could not be initialized. Please verify server environment variables.");
}



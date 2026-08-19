import { auth, db } from './firebase';
import { doc, getDoc, updateDoc, setDoc, collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { SubscriptionData, PaymentRecord, PlanType, SubscriptionStatus } from '../types';

const FOUNDER_LIFETIME_LIMIT = 100;
export const TRIAL_DURATION_DAYS = 1;

// Global pricing — same for every user worldwide (USD).
// Razorpay will charge in INR locally; Dodo will charge in USD.
export const PLAN_PRICING = {
  monthly: { price: 4.99, currency: 'USD', durationDays: 30, name: 'Hunter Monthly' },
  yearly: { price: 39.99, currency: 'USD', durationDays: 365, name: 'Yearly Alignment' },
  lifetime: { price: 99.99, currency: 'USD', durationDays: Infinity, name: 'Founder Lifetime' }
} as const;

/** Default currency code used in payments. */
export const DEFAULT_CURRENCY = 'USD';

/**
 * Build the Firestore fields to persist when a payment succeeds.
 * Used by the client after the backend verifies the Razorpay signature.
 */
export function buildSubscriptionPayload(planType: PlanType): Record<string, unknown> {
  const plan = PLAN_PRICING[planType];
  const now = new Date();
  if (planType === 'lifetime') {
    return {
      currentPlan: planType,
      subscriptionStatus: 'lifetime',
      lifetimeAccess: true,
      purchaseDate: now.toISOString(),
      expiryDate: null,
      founderSlotUsed: true,
      updatedAt: now.toISOString(),
    };
  }
  const expiry = new Date(now);
  expiry.setDate(expiry.getDate() + plan.durationDays);
  return {
    currentPlan: planType,
    subscriptionStatus: 'active',
    lifetimeAccess: false,
    purchaseDate: now.toISOString(),
    expiryDate: expiry.toISOString(),
    updatedAt: now.toISOString(),
  };
}

/** End-of-trial date = start + TRIAL_DURATION_DAYS */
export function getTrialEndDate(startDate = new Date()): Date {
  const end = new Date(startDate);
  end.setDate(end.getDate() + TRIAL_DURATION_DAYS);
  return end;
}

/**
 * Derive subscription access from the user's PAYMENT records (source of truth).
 * This is the bulletproof path: the `payments` collection has always allowed
 * owners to create records, so even if the user-doc rules block a subscription
 * write, access can be derived from the payments that DID get saved.
 */
interface PaymentRecordLite {
  planType: string;
  createdAt: string;
  paymentStatus?: string;
  amount?: number;
}

export function deriveAccessFromPayments(payments: PaymentRecordLite[]): {
  hasAccess: boolean;
  planType: PlanType | null;
  expiryDate: string | null;
  lifetime: boolean;
} {
  if (!payments || payments.length === 0) {
    return { hasAccess: false, planType: null, expiryDate: null, lifetime: false };
  }

  const now = Date.now();
  const success = payments
    .filter((p) => (p.paymentStatus || 'success') === 'success' && p.planType && p.createdAt)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Lifetime: any lifetime payment -> forever
  if (success.some((p) => p.planType === 'lifetime')) {
    return { hasAccess: true, planType: 'lifetime', expiryDate: null, lifetime: true };
  }

  // Most recent monthly/yearly payment whose window is still valid
  for (const p of success) {
    if (p.planType === 'monthly' || p.planType === 'yearly') {
      const plan = PLAN_PRICING[p.planType as PlanType];
      const days = plan?.durationDays ?? (p.planType === 'yearly' ? 365 : 30);
      const paidAt = new Date(p.createdAt).getTime();
      const expiryMs = paidAt + days * 24 * 60 * 60 * 1000;
      if (expiryMs > now) {
        return {
          hasAccess: true,
          planType: p.planType as PlanType,
          expiryDate: new Date(expiryMs).toISOString(),
          lifetime: false,
        };
      }
    }
  }

  return { hasAccess: false, planType: null, expiryDate: null, lifetime: false };
}

/** Returns trial info (active + time left) or null if user is not on a trial. */
export function getTrialInfo(sub: SubscriptionData | null): { active: boolean; hoursRemaining: number; daysRemaining: number; endDate: Date | null } | null {
  if (!sub || sub.subscriptionStatus !== 'trial') return null;
  const end = sub.trialEndDate ? new Date(sub.trialEndDate) : null;
  if (!end) return { active: false, hoursRemaining: 0, daysRemaining: 0, endDate: null };
  const ms = end.getTime() - Date.now();
  return {
    active: ms > 0,
    hoursRemaining: Math.max(0, Math.ceil(ms / (1000 * 60 * 60))),
    daysRemaining: Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24))),
    endDate: end,
  };
}

/** 
 * Premium access = Lifetime OR active paid subscription.
 */
export function hasActiveAccess(subscription: SubscriptionData | null): boolean {
  if (!subscription) return false;

  if (subscription.lifetimeAccess || subscription.subscriptionStatus === 'lifetime') {
    return true;
  }
  if ((subscription.subscriptionStatus as string) === 'premium') {
    return true;
  }
  if (subscription.subscriptionStatus === 'active' && subscription.expiryDate) {
    return new Date(subscription.expiryDate) > new Date();
  }
  return false;
}

export function getDaysRemaining(subscription: SubscriptionData | null): number {
  if (!subscription) return 0;

  if (subscription.lifetimeAccess || subscription.subscriptionStatus === 'lifetime') {
    return Infinity;
  }

  const now = new Date();

  if (subscription.subscriptionStatus === 'active' && subscription.expiryDate) {
    const end = new Date(subscription.expiryDate);
    return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  }

  // Trial days (for display only, not for premium features)
  if (subscription.subscriptionStatus === 'trial' && subscription.trialEndDate) {
    const end = new Date(subscription.trialEndDate);
    return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  }

  return 0;
}

export function getPlanBadgeText(subscription: SubscriptionData | null): string {
  if (!subscription) return 'FREE';
  if (subscription.lifetimeAccess || subscription.subscriptionStatus === 'lifetime') return 'LIFETIME';
  if (subscription.currentPlan === 'monthly') return 'MONTHLY';
  if (subscription.currentPlan === 'yearly') return 'YEARLY';
  if (subscription.subscriptionStatus === 'trial') return 'TRIAL';
  return 'FREE';
}

export function getSubscriptionDetails(subscription: SubscriptionData | null) {
  if (!subscription) {
    return { planName: 'Free', badge: 'FREE', statusText: 'Free Tier', expiryText: null, daysRemaining: 0, isActive: false, isLifetime: false };
  }

  const isLifetime = !!(subscription.lifetimeAccess || subscription.subscriptionStatus === 'lifetime');
  const isActive = hasActiveAccess(subscription);
  const days = getDaysRemaining(subscription);

  let planName = 'Free';
  let badge = 'FREE';
  let statusText = 'Free Tier';
  let expiryText: string | null = null;

  if (isLifetime) {
    planName = 'Founder Lifetime';
    badge = 'LIFETIME';
    statusText = 'Lifetime Premium';
    expiryText = 'Forever';
  } else if (subscription.currentPlan === 'monthly') {
    planName = 'Monthly Premium';
    badge = 'MONTHLY';
    statusText = 'Monthly Premium Active';
    if (subscription.expiryDate) expiryText = `Active until ${new Date(subscription.expiryDate).toLocaleDateString()}`;
  } else if (subscription.currentPlan === 'yearly') {
    planName = 'Yearly Premium';
    badge = 'YEARLY';
    statusText = 'Yearly Premium Active';
    if (subscription.expiryDate) expiryText = `Active until ${new Date(subscription.expiryDate).toLocaleDateString()}`;
  } else if (subscription.subscriptionStatus === 'trial') {
    planName = 'Free Trial';
    badge = 'TRIAL';
    statusText = 'Trial Active';
    const trialEnd = subscription.trialEndDate || subscription.expiryDate;
    if (trialEnd) expiryText = `Ends on ${new Date(trialEnd).toLocaleDateString()}`;
  }

  return { planName, badge, statusText, expiryText, daysRemaining: days, isActive, isLifetime };
}

export async function activateSubscription(uid: string, planType: PlanType, paymentData: { razorpayOrderId: string; razorpayPaymentId: string; amount: number }) {
  try {
    const userRef = doc(db, 'users', uid);
    const now = new Date();
    let expiryDate: Date | null = null;
    let status: SubscriptionStatus = 'active';
    let lifetimeAccess = false;

    const plan = PLAN_PRICING[planType];

    if (planType === 'lifetime') {
      lifetimeAccess = true;
      status = 'lifetime';
    } else {
      expiryDate = new Date(now);
      expiryDate.setDate(expiryDate.getDate() + plan.durationDays);
    }

    await updateDoc(userRef, {
      currentPlan: planType,
      subscriptionStatus: status,
      purchaseDate: now.toISOString(),
      expiryDate: expiryDate ? expiryDate.toISOString() : null,
      lifetimeAccess,
      updatedAt: now.toISOString(),
      ...(planType === 'lifetime' ? { founderSlotUsed: true } : {})
    });

    await addDoc(collection(db, 'payments'), {
      userId: uid,
      planType,
      amount: paymentData.amount,
      currency: 'INR',
      paymentStatus: 'success',
      razorpayOrderId: paymentData.razorpayOrderId,
      razorpayPaymentId: paymentData.razorpayPaymentId,
      createdAt: now.toISOString()
    });

    return { success: true, message: 'Subscription activated successfully' };
  } catch (error) {
    console.error('Activate subscription error:', error);
    return { success: false, message: 'Failed to activate subscription' };
  }
}

export async function getRemainingFounderSlots(): Promise<number> {
  try {
    const q = query(collection(db, 'payments'), where('planType', '==', 'lifetime'), where('paymentStatus', '==', 'success'));
    const snap = await getDocs(q);
    return Math.max(0, FOUNDER_LIFETIME_LIMIT - snap.size);
  } catch {
    return FOUNDER_LIFETIME_LIMIT;
  }
}

export async function canPurchaseLifetime(): Promise<boolean> {
  return (await getRemainingFounderSlots()) > 0;
}

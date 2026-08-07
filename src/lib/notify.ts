import { auth, db } from './firebase';

/**
 * Notify system — sends emails to BOTH admin and user.
 * All non-blocking (never breaks the app flow).
 */

// Generic helper to call the notification endpoint
async function callNotify(payload: any) {
  try {
    const user = auth.currentUser;
    if (!user) return;
    const token = await user.getIdToken();
    const res = await fetch('/api/notifications/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    const result = await res.json().catch(() => ({}));
    if (result.sent) {
      console.log('[notify] ✅ Email sent:', payload.event, '→', payload.to || 'admin');
    } else {
      console.warn('[notify] ⚠️ Response:', res.status, result?.error || result?.reason || '');
    }
  } catch (err: any) {
    console.error('[notify] ❌ Failed:', err?.message);
  }
}

/**
 * NEW USER SIGNUP — sends welcome email to USER + notification to ADMIN.
 */
export async function notifySignup(data: {
  userName?: string;
  userEmail?: string;
  phone?: string;
}) {
  // 1. Welcome email to user (emotionally triggering)
  callNotify({
    event: 'user-welcome',
    to: data.userEmail,
    userName: data.userName || 'Seeker',
    userEmail: data.userEmail,
    phone: data.phone,
  });

  // 2. Notification to admin
  callNotify({
    event: 'admin-signup',
    userName: data.userName || 'Unknown',
    userEmail: data.userEmail || 'No email',
    phone: data.phone,
  });
}

/**
 * NEW SUBSCRIPTION — sends confirmation to USER + notification to ADMIN.
 */
export async function notifySubscription(data: {
  userName?: string;
  userEmail?: string;
  phone?: string;
  planType?: string;
  amount?: number;
}) {
  // 1. Celebration email to user
  callNotify({
    event: 'user-subscription',
    to: data.userEmail,
    userName: data.userName,
    userEmail: data.userEmail,
    planType: data.planType,
    amount: data.amount,
  });

  // 2. Revenue notification to admin
  callNotify({
    event: 'admin-subscription',
    userName: data.userName,
    userEmail: data.userEmail,
    planType: data.planType,
    amount: data.amount,
  });
}

// Legacy compat (so old code keeps working)
export async function notifyAdmin(
  event: 'signup' | 'subscription',
  data: { userName?: string; userEmail?: string; phone?: string; planType?: string; amount?: number }
) {
  if (event === 'signup') {
    notifySignup(data);
  } else {
    notifySubscription(data);
  }
}

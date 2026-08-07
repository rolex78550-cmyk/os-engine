import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { auth } from '../lib/firebase';
import { hasActiveAccess, PLAN_PRICING } from '../lib/subscription';

type PlanType = 'monthly' | 'yearly' | 'lifetime';
const PLAN_RANK: Record<string, number> = { lifetime: 3, yearly: 2, monthly: 1 };

interface PaidUser {
  uid: string;
  email: string;
  name: string;
  planType: string;
  amount: number;
  paymentDate: string;
  source: string;
  userSubscription: any;
  hasAccess: boolean;
  accessReason: string;
  computedExpiry: string | null;
  computedLifetime: boolean;
  windowValid: boolean;     // is the paid plan's window still active?
  status: 'access_ok' | 'should_fix' | 'expired_plan' | 'error';
}

/** Compute the correct subscription window from the payment date. */
function computeWindow(planType: string, paymentDate: string) {
  const start = paymentDate ? new Date(paymentDate) : new Date();
  if (isNaN(start.getTime())) { /* invalid date → assume now */ }
  const base = (!isNaN(start.getTime())) ? start : new Date();
  if (planType === 'lifetime') {
    return { lifetime: true, expiry: null as string | null };
  }
  const days = PLAN_PRICING[planType as PlanType]?.durationDays ?? (planType === 'yearly' ? 365 : 30);
  const expiry = new Date(base);
  expiry.setDate(expiry.getDate() + days);
  return { lifetime: false, expiry: expiry.toISOString() };
}

/** Build the Firestore fields to write when granting access. */
function buildGrant(planType: string, paymentDate: string) {
  const w = computeWindow(planType, paymentDate);
  const now = new Date().toISOString();
  if (w.lifetime) {
    return {
      currentPlan: planType,
      subscriptionStatus: 'lifetime',
      lifetimeAccess: true,
      purchaseDate: paymentDate || now,
      expiryDate: null,
      founderSlotUsed: true,
      updatedAt: now,
    };
  }
  return {
    currentPlan: planType,
    subscriptionStatus: 'active',
    lifetimeAccess: false,
    purchaseDate: paymentDate || now,
    expiryDate: w.expiry,
    updatedAt: now,
  };
}

export default function RealPaymentAudit() {
  const [loading, setLoading] = useState(true);
  const [fixing, setFixing] = useState(false);
  const [fetchingRzp, setFetchingRzp] = useState(false);
  const [paidUsers, setPaidUsers] = useState<PaidUser[]>([]);
  const [log, setLog] = useState<string[]>([]);

  const runAudit = async () => {
    setLoading(true);
    setLog([]);
    try {
      // 1. Gather ALL payment records from every collection (source of truth).
      const payments: { uid: string; planType: string; amount: number; date: string; source: string }[] = [];

      const addCollection = async (name: string, statusField: string) => {
        try {
          const snap = await getDocs(collection(db, name));
          snap.forEach((d) => {
            const data = d.data() as any;
            const ok = data[statusField] === 'success';
            if (!ok) return;
            if (!data.userId || !data.planType) return;
            payments.push({
              uid: data.userId,
              planType: data.planType,
              amount: Number(data.amount) || 0,
              date: data.createdAt || data.timestamp || data.date || new Date().toISOString(),
              source: name,
            });
          });
        } catch (e) {
          console.warn(`[audit] could not read ${name}:`, (e as Error)?.message);
        }
      };

      await addCollection('payments', 'paymentStatus');          // real Razorpay ledger
      await addCollection('simulated_payments', 'status');       // legacy admin grants

      // 2. Dedupe by uid — keep the BEST plan; on tie, the most recent payment.
      const byUid = new Map<string, typeof payments[number]>();
      for (const p of payments) {
        const existing = byUid.get(p.uid);
        if (!existing) { byUid.set(p.uid, p); continue; }
        const rankExisting = PLAN_RANK[existing.planType] || 0;
        const rankNew = PLAN_RANK[p.planType] || 0;
        if (rankNew > rankExisting || (rankNew === rankExisting && new Date(p.date) > new Date(existing.date))) {
          byUid.set(p.uid, p);
        }
      }

      // 3. For each unique paid user, read their current doc + evaluate.
      const results: PaidUser[] = [];
      for (const p of byUid.values()) {
        try {
          const userDoc = await getDoc(doc(db, 'users', p.uid));
          const userData = userDoc.exists() ? (userDoc.data() as any) : {};

          const sub = {
            currentPlan: userData.currentPlan || 'free',
            subscriptionStatus: userData.subscriptionStatus || 'free',
            lifetimeAccess: userData.lifetimeAccess || false,
            expiryDate: userData.expiryDate,
          };
          const hasAccess = hasActiveAccess(sub as any);

          const w = computeWindow(p.planType, p.date);
          const windowValid = w.lifetime || (!!w.expiry && new Date(w.expiry) > new Date());

          let accessReason = '';
          let status: PaidUser['status'];
          if (sub.lifetimeAccess || sub.subscriptionStatus === 'lifetime') {
            accessReason = 'Lifetime access ✅';
          } else if (sub.subscriptionStatus === 'active' && sub.expiryDate) {
            accessReason = `Active till ${new Date(sub.expiryDate).toLocaleDateString()}`;
          } else if (sub.subscriptionStatus === 'premium') {
            accessReason = 'Legacy "premium" status (no expiry → no guaranteed access)';
          } else {
            accessReason = `Status: ${sub.subscriptionStatus}`;
          }

          if (hasAccess) {
            status = 'access_ok';
          } else if (windowValid) {
            status = 'should_fix';   // paid, window still valid, but missing access
            accessReason = 'PAID but no access — needs fix';
          } else {
            status = 'expired_plan'; // paid but the plan window already lapsed
            accessReason = 'Plan window expired (needs resubscription)';
          }

          results.push({
            uid: p.uid,
            email: userData.email || 'Unknown',
            name: userData.name || 'Unknown',
            planType: p.planType,
            amount: p.amount,
            paymentDate: p.date,
            source: p.source,
            userSubscription: sub,
            hasAccess,
            accessReason,
            computedExpiry: w.expiry,
            computedLifetime: w.lifetime,
            windowValid,
            status,
          });
        } catch (e) {
          results.push({
            uid: p.uid, email: 'Unknown', name: 'Unknown', planType: p.planType,
            amount: p.amount, paymentDate: p.date, source: p.source,
            userSubscription: {}, hasAccess: false, accessReason: 'Error reading user',
            computedExpiry: null, computedLifetime: false, windowValid: false, status: 'error',
          });
        }
      }

      // Sort: should_fix first, then expired, then ok
      const order = { should_fix: 0, expired_plan: 1, error: 2, access_ok: 3 };
      results.sort((a, b) => order[a.status] - order[b.status]);

      setPaidUsers(results);
    } catch (error) {
      console.error('Audit failed:', error);
      setLog([`❌ Audit failed: ${(error as Error)?.message}`]);
    } finally {
      setLoading(false);
    }
  };

  // Grant access to every "should_fix" user (paid, window valid, but no access).
  const fixMismatches = async () => {
    const toFix = paidUsers.filter((u) => u.status === 'should_fix');
    if (toFix.length === 0) {
      setLog(['ℹ️ No users need fixing (all paid users either have access or their plan already expired).']);
      return;
    }
    if (!confirm(`Grant access to ${toFix.length} paid user(s) according to their plan?`)) return;

    setFixing(true);
    const results: string[] = [];
    for (const user of toFix) {
      try {
        const grant = buildGrant(user.planType, user.paymentDate);
        await setDoc(doc(db, 'users', user.uid), grant, { merge: true });
        const exp = grant.expiryDate ? `till ${new Date(grant.expiryDate).toLocaleDateString()}` : 'forever';
        results.push(`✅ ${user.email || user.uid} → ${user.planType} (${exp})`);
      } catch (err: any) {
        results.push(`❌ ${user.email || user.uid} — ${err?.message}`);
      }
    }
    setLog(results);
    setFixing(false);
    setTimeout(() => runAudit(), 1200);
  };

  // OPTIONAL: pull real payments directly from Razorpay (needs working admin
  // auth + Razorpay keys on the server). Writes subscriptions to user docs.
  const fetchFromRazorpay = async () => {
    setFetchingRzp(true);
    setLog([]);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) { setLog(['❌ Not signed in as admin. Please sign in and retry.']); setFetchingRzp(false); return; }

      const res = await fetch('/api/admin/reconcile-razorpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        let detail = '';
        try { detail = (await res.json()).error || ''; } catch { detail = await res.text(); }
        throw new Error(`HTTP ${res.status} — ${String(detail).slice(0, 140)}`);
      }

      const data = await res.json();
      const rzpPayments: any[] = data.payments || [];
      const out: string[] = [`🔎 Razorpay returned ${rzpPayments.length} paid order(s).`];

      if (rzpPayments.length === 0) {
        out.push('ℹ️ No paid orders with userId/planType notes found.');
        setLog(out);
        setFetchingRzp(false);
        return;
      }

      // Dedupe best plan per uid
      const byUid = new Map<string, any>();
      for (const p of rzpPayments) {
        const ex = byUid.get(p.uid);
        if (!ex || (PLAN_RANK[p.planType] || 0) >= (PLAN_RANK[ex.planType] || 0)) byUid.set(p.uid, p);
      }

      if (!confirm(`Grant access to ${byUid.size} user(s) found in Razorpay?\n(Computed from payment date: monthly=30d, yearly=365d, lifetime=forever)`)) {
        setFetchingRzp(false);
        return;
      }

      for (const p of byUid.values()) {
        try {
          const grant = buildGrant(p.planType, p.date);
          await setDoc(doc(db, 'users', p.uid), grant, { merge: true });
          const exp = grant.expiryDate ? `till ${new Date(grant.expiryDate).toLocaleDateString()}` : 'forever';
          out.push(`✅ ${p.uid.slice(0, 8)}… → ${p.planType} (${exp})`);
        } catch (err: any) {
          out.push(`❌ ${p.uid.slice(0, 8)}… — ${err?.message}`);
        }
      }
      setLog(out);
      setTimeout(() => runAudit(), 1200);
    } catch (err: any) {
      const msg = err?.message || String(err);
      let hint = '';
      if (msg.includes('401')) hint = ' — admin token could not be verified. Refresh the page & sign in again as admin.';
      else if (msg.includes('403')) hint = ' — your account is not whitelisted as admin.';
      else if (msg.includes('credentials')) hint = ' — Razorpay keys missing in Vercel env.';
      setLog([`⚠️ Razorpay fetch failed: ${msg}${hint}`]);
    } finally {
      setFetchingRzp(false);
    }
  };

  useEffect(() => { runAudit(); }, []);

  const summary = {
    total: paidUsers.length,
    ok: paidUsers.filter((u) => u.status === 'access_ok').length,
    toFix: paidUsers.filter((u) => u.status === 'should_fix').length,
    expired: paidUsers.filter((u) => u.status === 'expired_plan').length,
  };

  return (
    <div className="space-y-6 p-6 bg-black/40 rounded-3xl border border-white/10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Payment → Access Reconciliation</h2>
          <p className="text-xs text-white/50 mt-1">
            Scans <span className="font-mono text-amber-300">payments</span> + <span className="font-mono text-amber-300">simulated_payments</span>, grants access per plan &amp; payment date.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={runAudit} disabled={loading || fixing} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-xs font-mono uppercase tracking-widest rounded-xl disabled:opacity-50">
            {loading ? 'Auditing…' : 'Re-run Audit'}
          </button>
          <button onClick={fetchFromRazorpay} disabled={fetchingRzp || loading} className="px-4 py-2 bg-indigo-500/20 border border-indigo-500/40 text-indigo-200 text-xs font-mono uppercase tracking-widest rounded-xl disabled:opacity-50">
            {fetchingRzp ? 'Fetching…' : 'Pull from Razorpay'}
          </button>
          {summary.toFix > 0 && (
            <button onClick={fixMismatches} disabled={fixing || loading} className="px-4 py-2 bg-emerald-500 text-black text-xs font-mono uppercase tracking-widest rounded-xl disabled:opacity-50 font-bold">
              {fixing ? 'Granting…' : `Grant Access (${summary.toFix})`}
            </button>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
          <div className="text-[10px] uppercase tracking-widest text-white/50">Paid Users</div>
          <div className="text-2xl font-bold text-white">{summary.total}</div>
        </div>
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
          <div className="text-[10px] uppercase tracking-widest text-emerald-400">Have Access</div>
          <div className="text-2xl font-bold text-emerald-400">{summary.ok}</div>
        </div>
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
          <div className="text-[10px] uppercase tracking-widest text-amber-400">Paid, Need Fix</div>
          <div className="text-2xl font-bold text-amber-400">{summary.toFix}</div>
        </div>
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
          <div className="text-[10px] uppercase tracking-widest text-white/50">Plan Expired</div>
          <div className="text-2xl font-bold text-white/70">{summary.expired}</div>
        </div>
      </div>

      {summary.toFix > 0 && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-sm text-amber-200">
          ⚠️ {summary.toFix} user(s) paid but have no access. Click <strong>Grant Access</strong> to write the correct subscription based on their plan &amp; payment date.
        </div>
      )}

      {log.length > 0 && (
        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-xs font-mono space-y-1 max-h-40 overflow-auto">
          {log.map((r, i) => <div key={i}>{r}</div>)}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full text-xs whitespace-nowrap">
          <thead className="bg-white/5 text-white/60">
            <tr>
              <th className="p-3 text-left">User</th>
              <th className="p-3">Plan</th>
              <th className="p-3">Amt</th>
              <th className="p-3">Paid On</th>
              <th className="p-3">Current Fields</th>
              <th className="p-3">Verdict</th>
              <th className="p-3 text-left">Reason</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {paidUsers.map((u, idx) => {
              const tint =
                u.status === 'should_fix' ? 'bg-amber-500/5' :
                u.status === 'expired_plan' ? 'bg-white/[0.02]' :
                u.status === 'error' ? 'bg-red-500/5' : '';
              return (
                <tr key={idx} className={tint}>
                  <td className="p-3">
                    <div className="font-medium text-white">{u.name}</div>
                    <div className="text-[10px] text-white/40">{u.email}</div>
                    <div className="text-[9px] text-white/30 font-mono">{u.uid.slice(0, 10)}…</div>
                  </td>
                  <td className="p-3 font-mono text-amber-400 text-center">{u.planType}</td>
                  <td className="p-3 text-emerald-400 text-center">₹{u.amount}</td>
                  <td className="p-3 text-white/60 text-[10px] text-center">{u.paymentDate ? new Date(u.paymentDate).toLocaleDateString() : '—'}</td>
                  <td className="p-3 text-[10px] font-mono text-center">
                    {u.userSubscription.currentPlan || '—'} / {u.userSubscription.subscriptionStatus || '—'}
                    {u.userSubscription.lifetimeAccess && <span className="text-amber-400 ml-1">(LIFETIME)</span>}
                  </td>
                  <td className="p-3 text-center">
                    {u.status === 'access_ok' && <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] rounded-full">OK</span>}
                    {u.status === 'should_fix' && <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] rounded-full">FIX</span>}
                    {u.status === 'expired_plan' && <span className="px-2 py-0.5 bg-white/10 text-white/50 text-[10px] rounded-full">EXPIRED</span>}
                    {u.status === 'error' && <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-[10px] rounded-full">ERR</span>}
                  </td>
                  <td className="p-3 text-[10px] text-white/70">{u.accessReason}</td>
                </tr>
              );
            })}
            {paidUsers.length === 0 && !loading && (
              <tr><td colSpan={7} className="p-8 text-center text-white/40">
                No payment records found in Firestore. If users paid, click <strong>Pull from Razorpay</strong> to import real transactions.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="text-[10px] text-white/40 leading-relaxed">
        <p>• <strong>Access windows</strong> are computed from the payment date: monthly = 30 days, yearly = 365 days, lifetime = forever.</p>
        <p>• <strong>Grant Access</strong> only fixes users whose plan is still within its valid window. Expired plans are left as-is (the user must resubscribe).</p>
        <p>• All writes happen via your authenticated admin session — no server credentials required.</p>
      </div>
    </div>
  );
}

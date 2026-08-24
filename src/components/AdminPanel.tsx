import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, UserCheck, IndianRupee, CreditCard, Clock, RefreshCw,
  Crown, ShieldCheck
} from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { collection, getDocs } from "firebase/firestore";

interface EnhancedUser {
  id: string;
  name: string;
  email: string;
  subscriptionStatus: string;
  currentPlan: string;
  level?: number;
  streak?: number;
  createdAt?: string;
}

interface PaymentRecord {
  id: string;
  userId: string;
  planType: string;
  amount: number;
  paymentStatus: string;
  createdAt: string;
}

export default function AdminPanel() {
  const [users, setUsers] = useState<EnhancedUser[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [togglingUid, setTogglingUid] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [usersSnap, paymentsSnap] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'payments')),
      ]);

      const payList: PaymentRecord[] = [];
      paymentsSnap.forEach((d) => {
        const p = d.data() as any;
        payList.push({ id: d.id, ...p, createdAt: p.createdAt || p.timestamp || '' });
      });
      payList.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setPayments(payList);

      const usersList: EnhancedUser[] = [];
      usersSnap.forEach((docSnap) => {
        const data = docSnap.data() as any;
        usersList.push({
          id: docSnap.id,
          name: data.name || 'Unknown',
          email: data.email || '',
          subscriptionStatus: data.subscriptionStatus || 'free',
          currentPlan: data.currentPlan || 'free',
          level: data.level || 1,
          streak: data.streak || 0,
          createdAt: data.createdAt,
        });
      });
      setUsers(usersList);
    } catch (error) {
      console.error('Admin fetch error:', error);
      setActionMsg('⚠️ Failed to load data. Check console.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ── REAL DERIVED STATS (no fabricated fallback numbers) ──
  const totalUsers = users.length;
  const premiumUsers = users.filter(u =>
    u.currentPlan !== 'free' || u.subscriptionStatus === 'active' ||
    u.subscriptionStatus === 'lifetime' || u.subscriptionStatus === 'premium'
  ).length;
  const trialUsers = users.filter(u => u.subscriptionStatus === 'trial').length;
  const freeUsers = Math.max(0, totalUsers - premiumUsers - trialUsers);
  const totalRevenue = payments
    .filter(p => p.paymentStatus === 'success')
    .reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const paymentsCount = payments.filter(p => p.paymentStatus === 'success').length;

  // Real transactions (no demo fallback)
  const recentTransactions = payments.slice(0, 8).map((p) => {
    const user = users.find(u => u.id === p.userId);
    return {
      id: p.id,
      user: user?.email || (p.userId ? p.userId.slice(0, 8) + '…' : '—'),
      type: p.planType === 'yearly' ? 'Premium Yearly'
        : p.planType === 'monthly' ? 'Premium Monthly'
        : p.planType === 'lifetime' ? 'Lifetime'
        : 'Payment',
      amount: Number(p.amount) || 0,
      status: p.paymentStatus === 'success' ? 'Success' : 'Failed',
      date: p.createdAt
        ? new Date(p.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        : '—',
    };
  });

  const formatMoney = (n: number) => `₹${(n || 0).toLocaleString('en-IN')}`;

  const isPremium = (u: EnhancedUser) =>
    u.subscriptionStatus === 'active' || u.subscriptionStatus === 'lifetime' ||
    u.subscriptionStatus === 'premium' || u.currentPlan !== 'free';

  // ── ADMIN ACTION: toggle user subscription (real server endpoint) ──
  const toggleSubscription = async (user: EnhancedUser) => {
    if (!auth.currentUser) return;
    setTogglingUid(user.id);
    setActionMsg(null);
    try {
      const token = await auth.currentUser.getIdToken();
      const makePremium = !isPremium(user);
      const res = await fetch('/api/admin/user/toggle-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ uid: user.id, status: makePremium ? 'premium' : 'free' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setActionMsg(`❌ ${data.error || 'Failed to toggle subscription.'}`);
        return;
      }
      setActionMsg(`✅ ${user.email || user.name} → ${makePremium ? 'Premium' : 'Free'}.`);
      // Refresh local list to reflect the change immediately
      setUsers(prev => prev.map(u =>
        u.id === user.id ? { ...u, subscriptionStatus: makePremium ? 'premium' : 'free' } : u
      ));
    } catch (e: any) {
      setActionMsg(`❌ ${e?.message || 'Toggle failed.'}`);
    } finally {
      setTogglingUid(null);
    }
  };

  if (loading) {
    return (
      <div className="text-white flex items-center justify-center py-20">
        <RefreshCw size={20} className="animate-spin text-purple-400 mr-2" />
        <span className="text-sm text-white/60">Loading admin data…</span>
      </div>
    );
  }

  return (
    <div className="text-white">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-xs font-mono tracking-[1.5px] text-purple-400 mb-1">ADMIN DASHBOARD</div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
          <p className="text-sm text-white/60 mt-0.5">Live data from Firestore — no demo numbers.</p>
        </div>
        <button
          onClick={fetchAll}
          disabled={loading}
          className="flex items-center gap-1 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-xl text-xs border border-white/10"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* KPI STATS ROW — REAL */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
        <div className="bg-zinc-950 border border-white/10 rounded-3xl p-4">
          <div className="flex items-center gap-2 text-xs text-white/60 mb-1"><Users size={15} /> Total Users</div>
          <div className="text-3xl font-bold tabular-nums">{totalUsers.toLocaleString()}</div>
        </div>
        <div className="bg-zinc-950 border border-white/10 rounded-3xl p-4">
          <div className="flex items-center gap-2 text-xs text-white/60 mb-1"><Crown size={15} /> Premium</div>
          <div className="text-3xl font-bold tabular-nums">{premiumUsers.toLocaleString()}</div>
        </div>
        <div className="bg-zinc-950 border border-white/10 rounded-3xl p-4">
          <div className="flex items-center gap-2 text-xs text-white/60 mb-1"><Clock size={15} /> Trials</div>
          <div className="text-3xl font-bold tabular-nums">{trialUsers.toLocaleString()}</div>
        </div>
        <div className="bg-zinc-950 border border-white/10 rounded-3xl p-4">
          <div className="flex items-center gap-2 text-xs text-white/60 mb-1"><IndianRupee size={15} /> Revenue</div>
          <div className="text-3xl font-bold tabular-nums">{formatMoney(totalRevenue)}</div>
        </div>
        <div className="bg-zinc-950 border border-white/10 rounded-3xl p-4">
          <div className="flex items-center gap-2 text-xs text-white/60 mb-1"><CreditCard size={15} /> Payments</div>
          <div className="text-3xl font-bold tabular-nums">{paymentsCount.toLocaleString()}</div>
        </div>
      </div>

      {/* Action Message */}
      {actionMsg && (
        <div className="mb-4 p-3 bg-white/5 border border-white/10 rounded-2xl text-sm font-mono text-center">
          {actionMsg}
        </div>
      )}

      {/* USER MANAGEMENT TABLE */}
      <div className="bg-zinc-950 border border-white/10 rounded-3xl p-5 mb-5">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck size={16} className="text-purple-400" />
          <div className="font-semibold">Users</div>
          <span className="text-xs text-white/40 ml-auto">{totalUsers} total</span>
        </div>
        {users.length === 0 ? (
          <p className="text-sm text-white/40 py-6 text-center">No users yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-white/50 border-b border-white/10">
                  <th className="text-left py-2 font-medium">User</th>
                  <th className="text-left py-2 font-medium">Plan</th>
                  <th className="text-left py-2 font-medium">Status</th>
                  <th className="text-left py-2 font-medium">Level</th>
                  <th className="text-left py-2 font-medium">Streak</th>
                  <th className="text-right py-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="py-2.5 pr-2">
                      <div className="font-medium">{u.name}</div>
                      <div className="text-xs text-white/50">{u.email}</div>
                    </td>
                    <td className="py-2.5 pr-2 text-white/70">{u.currentPlan || 'free'}</td>
                    <td className="py-2.5 pr-2">
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        isPremium(u) ? 'bg-purple-500/20 text-purple-300' : 'bg-white/10 text-white/50'
                      }`}>
                        {u.subscriptionStatus}
                      </span>
                    </td>
                    <td className="py-2.5 pr-2 font-mono text-white/60">{u.level ?? 1}</td>
                    <td className="py-2.5 pr-2 font-mono text-white/60">{u.streak ?? 0}d</td>
                    <td className="py-2.5 text-right">
                      <button
                        onClick={() => toggleSubscription(u)}
                        disabled={togglingUid === u.id}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition active:scale-95 disabled:opacity-40 ${
                          isPremium(u)
                            ? 'bg-white/10 text-white hover:bg-white/15'
                            : 'bg-purple-500 text-white hover:bg-purple-400'
                        }`}
                      >
                        {togglingUid === u.id ? '…' : isPremium(u) ? 'Revoke Premium' : 'Grant Premium'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* RECENT TRANSACTIONS TABLE — REAL */}
      <div className="bg-zinc-950 border border-white/10 rounded-3xl p-5">
        <div className="font-semibold mb-3">Recent Transactions</div>
        {recentTransactions.length === 0 ? (
          <p className="text-sm text-white/40 py-6 text-center">No transactions yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-white/50 border-b border-white/10">
                  <th className="text-left py-2 font-medium">User</th>
                  <th className="text-left py-2 font-medium">Type</th>
                  <th className="text-left py-2 font-medium">Amount</th>
                  <th className="text-left py-2 font-medium">Status</th>
                  <th className="text-left py-2 font-medium hidden md:table-cell">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {recentTransactions.map((t) => (
                  <tr key={t.id}>
                    <td className="py-2.5 pr-2 font-medium">{t.user}</td>
                    <td className="py-2.5 pr-2 text-white/70">{t.type}</td>
                    <td className="py-2.5 pr-2 font-mono text-emerald-400">{formatMoney(t.amount)}</td>
                    <td className="py-2.5 pr-2">
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        t.status === 'Success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-xs text-white/50 hidden md:table-cell">{t.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer note */}
      <div className="mt-6 text-center text-xs text-white/30">
        Admin access restricted to authorized users only • Menifest OS
      </div>
    </div>
  );
}

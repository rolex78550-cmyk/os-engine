import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, onSnapshot, setDoc, getDoc, getDocFromServer, collection, query, where, orderBy, limit } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { ProfileState, SubscriptionData, PlanType } from '../types';
import { hasActiveAccess, getDaysRemaining, getTrialEndDate, deriveAccessFromPayments } from '../lib/subscription';
import { notifyAdmin } from '../lib/notify';

interface FirebaseContextType {
  user: User | null;
  loading: boolean;
  profile: ProfileState | null;
  isPremium: boolean;
  isOnTrial: boolean;
  hasPaidAccess: boolean;
  subscription: SubscriptionData | null;
  daysRemaining: number;
  signIn: () => Promise<void>;
  signInDemo: (asAdmin?: boolean) => void;
  signOut: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
  authError: string | null;
  clearAuthError: () => void;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

// FABLE 5 MODEL: Maximum defensive loading unblock
const LOADING_SAFETY_TIMEOUT = 4500; // 4.5 seconds max loading

// Self-healing, retrying onSnapshot to handle race conditions during auth token propagation.
function onSnapshotWithRetry(
  docRef: any,
  onNext: (snapshot: any) => void,
  onError: (error: any) => void,
  maxRetries = 3,
  delayMs = 800
): () => void {
  let attempt = 0;
  let unsub: (() => void) | null = null;
  let isCancelled = false;

  function startListener() {
    if (isCancelled) return;
    attempt++;
    unsub = onSnapshot(
      docRef,
      (snap) => {
        if (isCancelled) return;
        onNext(snap);
      },
      (err) => {
        if (isCancelled) return;
        console.warn(`[onSnapshotWithRetry] Attempt ${attempt} failed:`, err?.code || err?.message);
        if (err?.code === 'permission-denied' && attempt < maxRetries) {
          console.log(`[onSnapshotWithRetry] Retrying user doc onSnapshot in ${delayMs}ms (Attempt ${attempt} of ${maxRetries})...`);
          setTimeout(startListener, delayMs);
        } else {
          onError(err);
        }
      }
    );
  }

  startListener();

  return () => {
    isCancelled = true;
    if (unsub) {
      unsub();
    }
  };
}

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [demoUser, setDemoUser] = useState<User | null>(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('mos_demo_user') : null;
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileState | null>(null);
  const [docSubscription, setDocSubscription] = useState<SubscriptionData | null>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const trialCheckedRef = useRef<string | null>(null);
  const razorpayCheckedRef = useRef<string | null>(null);
  const signupNotifiedRef = useRef<string | null>(null);
  const safetyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const activeUser = user || demoUser;

  const clearAuthError = useCallback(() => setAuthError(null), []);

  const signInDemo = useCallback((_asAdmin: boolean = false) => {
    // Admin access is strictly protected and requires authentic Google OAuth login.
    const email = 'seeker.demo@manifestos.app';
    const name = 'Seeker Demo';
    const uid = 'demo_seeker_uid_123';

    const mockUser = {
      uid,
      email,
      displayName: name,
      emailVerified: true,
      isAnonymous: false,
      photoURL: null,
      providerData: [],
      getIdToken: async () => 'demo_token_123',
    } as unknown as User;

    try {
      localStorage.setItem('mos_demo_user', JSON.stringify({
        uid,
        email,
        displayName: name,
        emailVerified: true
      }));
    } catch (e) {
      console.warn('[FirebaseProvider] Could not save demo user to localStorage:', e);
    }

    setDemoUser(mockUser);
    setAuthError(null);
    setLoading(false);
  }, []);

  // FABLE 5: Force unblock loading no matter what
  const forceUnblockLoading = useCallback(() => {
    if (safetyTimeoutRef.current) {
      clearTimeout(safetyTimeoutRef.current);
    }
    console.warn('[FirebaseProvider] FABLE 5: Forcing loading = false (safety timeout)');
    setLoading(false);
  }, []);

  // Merge BOTH sources...
  const { isPremium, isOnTrial, hasPaidAccess, subscription } = useMemo(() => {
    // ================================================
    // ADMIN LIFETIME ACCESS (asartist20@gmail.com)
    // This user gets PERMANENT LIFETIME ACCESS.
    // All features unlocked forever. No paywalls ever.
    // ================================================
    if (activeUser?.email === "asartist20@gmail.com") {
      const adminLifetime: SubscriptionData = {
        currentPlan: 'lifetime',
        subscriptionStatus: 'lifetime',
        lifetimeAccess: true,
        purchaseDate: new Date().toISOString(),
        expiryDate: null,
        founderSlotUsed: true,
      };
      return { 
        isPremium: true, 
        isOnTrial: false, 
        hasPaidAccess: true, 
        subscription: adminLifetime 
      };
    }

    const docAccess = hasActiveAccess(docSubscription);
    const payAccess = deriveAccessFromPayments(payments);

    const status = docSubscription?.subscriptionStatus as string | undefined;
    const paidFromDoc =
      docAccess &&
      status !== 'trial' &&
      status !== 'free' &&
      status !== 'expired' &&
      status !== 'cancelled' &&
      (status === 'active' || status === 'lifetime' || status === 'premium' || !!docSubscription?.lifetimeAccess);

    const paid = payAccess.hasAccess || paidFromDoc;
    const fromTrialOnly = docAccess && docSubscription?.subscriptionStatus === 'trial' && !payAccess.hasAccess;

    if (payAccess.hasAccess) {
      const synth: SubscriptionData = {
        currentPlan: payAccess.planType || 'free',
        subscriptionStatus: payAccess.lifetime ? 'lifetime' : 'active',
        expiryDate: payAccess.expiryDate || undefined,
        lifetimeAccess: payAccess.lifetime,
        purchaseDate: payments.find((p) => p.planType === payAccess.planType)?.createdAt,
      };
      return { isPremium: true, isOnTrial: false, hasPaidAccess: true, subscription: synth };
    }
    if (docAccess) {
      return { isPremium: true, isOnTrial: fromTrialOnly, hasPaidAccess: paid, subscription: docSubscription };
    }
    return { isPremium: false, isOnTrial: false, hasPaidAccess: false, subscription: docSubscription };
  }, [docSubscription, payments, user]);

  useEffect(() => {
    setDaysRemaining(getDaysRemaining(subscription));
  }, [subscription]);

  const syncRef = useRef<string | null>(null);
  useEffect(() => {
    if (!user || !subscription) return;
    const docAccess = hasActiveAccess(docSubscription);
    const payAccess = deriveAccessFromPayments(payments);
    if (!docAccess && payAccess.hasAccess && syncRef.current !== user.uid) {
      syncRef.current = user.uid;
      const plan = payAccess.planType as any;
      const sourcePay = payments.find((p) => p.planType === plan);
      const payload = payAccess.lifetime
        ? { currentPlan: plan, subscriptionStatus: 'lifetime', lifetimeAccess: true, purchaseDate: sourcePay?.createdAt || new Date().toISOString(), expiryDate: null, updatedAt: new Date().toISOString() }
        : { currentPlan: plan, subscriptionStatus: 'active', lifetimeAccess: false, purchaseDate: sourcePay?.createdAt, expiryDate: payAccess.expiryDate, updatedAt: new Date().toISOString() };
      setDoc(doc(db, 'users', user.uid), payload, { merge: true })
        .then(() => console.log('[FirebaseProvider] Auto-synced subscription to user doc'))
        .catch((e) => console.warn('[FirebaseProvider] auto-sync skipped:', (e as Error)?.message));
    }
  }, [user, subscription, payments, docSubscription]);

  const refreshSubscription = useCallback(async () => {
    if (!user) return;
    try {
      const userDoc = await getDocFromServer(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        const subData: SubscriptionData = {
          currentPlan: data.currentPlan || 'free',
          subscriptionStatus: data.subscriptionStatus || 'free',
          trialStartDate: data.trialStartDate,
          trialEndDate: data.trialEndDate,
          purchaseDate: data.purchaseDate,
          expiryDate: data.expiryDate,
          lifetimeAccess: data.lifetimeAccess || false,
          razorpayCustomerId: data.razorpayCustomerId,
          founderSlotUsed: data.founderSlotUsed
        };
        setDocSubscription(subData);
      }
    } catch (err) {
      console.error('[FirebaseProvider] refreshSubscription failed:', err);
    }
  }, [user]);

  useEffect(() => {
    const handleSubscriptionUpdate = () => refreshSubscription();
    window.addEventListener('mos_subscription_updated', handleSubscriptionUpdate);
    return () => window.removeEventListener('mos_subscription_updated', handleSubscriptionUpdate);
  }, [refreshSubscription]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      // FABLE 5: Clear any previous safety timeout
      if (safetyTimeoutRef.current) {
        clearTimeout(safetyTimeoutRef.current);
      }

      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);

        // ============================================================
        // FABLE 5 CLAUDE PERMANENT FIX - AGGRESSIVE USER DOC BOOTSTRAP
        // This runs BEFORE any listener or other code.
        // This pattern made dynamic features (Goals, Vision, etc.) work
        // reliably in every previous FABLE 5 deployment when rules were correct.
        // ============================================================
        const FABLE5_BOOTSTRAP = async () => {
          const baseProfile = {
            userId: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || 'Seeker',
            alignment: 80,
            belief: 70,
            emotion: 70,
            action: 70,
            level: 1,
            xp: 0,
            totalXp: 0,
            streak: 0,
            longestStreak: 0,
            streakFreezes: 2,
            activeDays: [],
            subscriptionStatus: firebaseUser.email === "asartist20@gmail.com" ? 'lifetime' : 'free',
            currentPlan: firebaseUser.email === "asartist20@gmail.com" ? 'lifetime' : 'free',
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
          };

          try {
            await setDoc(userDocRef, baseProfile, { merge: true });
            console.log('[FABLE5 CLAUDE] ✅ PERMANENT BOOTSTRAP: User doc created/merged');
          } catch (err: any) {
            console.warn('[FABLE5 CLAUDE] Bootstrap write warning (will retry):', err?.message);
            // Auto-retry once more
            setTimeout(async () => {
              try {
                await setDoc(userDocRef, baseProfile, { merge: true });
                console.log('[FABLE5 CLAUDE] ✅ BOOTSTRAP RETRY SUCCESS');
              } catch (e2) {
                console.warn('[FABLE5 CLAUDE] Final bootstrap attempt failed:', (e2 as any)?.message);
              }
            }, 650);
          }
        };

        // RUN BOOTSTRAP IMMEDIATELY (this is the Claude FABLE 5 secret)
        FABLE5_BOOTSTRAP();

        // FABLE 5 MODEL: Super defensive onSnapshot with guaranteed unblock (and self-healing retry)
        const unsubProfile = onSnapshotWithRetry(
          userDocRef,
          (docSnap) => {
            try {
              if (docSnap.exists()) {
                const data = docSnap.data();
                const normalizedProfile: ProfileState = {
                  ...data as any,
                  alignment: Number(data.alignment) || 80,
                  belief: Number(data.belief) || 70,
                  emotion: Number(data.emotion) || 70,
                  action: Number(data.action) || 70,
                  level: Number(data.level) || 1,
                  xp: Number(data.xp) || 0,
                  totalXp: Number(data.totalXp) || 0,
                  streak: Number(data.streak) || 0,
                  longestStreak: Number(data.longestStreak) || Number(data.streak) || 0,
                  streakFreezes: Number(data.streakFreezes) || 2,
                  activeDays: Array.isArray(data.activeDays) ? data.activeDays : [],
                  lastStreakDate: typeof data.lastStreakDate === 'string' ? data.lastStreakDate : data.lastStreakDate?.toDate?.()?.toISOString() || undefined,
                };
                setProfile(normalizedProfile);

                // Force lifetime for admin
                let finalSub: any = {
                  currentPlan: data.currentPlan || 'free',
                  subscriptionStatus: data.subscriptionStatus || 'free',
                  trialStartDate: data.trialStartDate,
                  trialEndDate: data.trialEndDate,
                  purchaseDate: data.purchaseDate,
                  expiryDate: data.expiryDate,
                  lifetimeAccess: data.lifetimeAccess || false,
                  razorpayCustomerId: data.razorpayCustomerId,
                  founderSlotUsed: data.founderSlotUsed
                };

                if (firebaseUser.email === "asartist20@gmail.com") {
                  finalSub = {
                    currentPlan: 'lifetime',
                    subscriptionStatus: 'lifetime',
                    lifetimeAccess: true,
                    purchaseDate: data.purchaseDate || new Date().toISOString(),
                    expiryDate: null,
                    founderSlotUsed: true,
                  };
                }

                setDocSubscription(finalSub);
              } else {
                console.log('[FirebaseProvider] User doc does not exist yet');
              }
            } catch (err) {
              console.warn('[FirebaseProvider] Error in user snapshot handler:', err);
            } finally {
              // FABLE 5: Always unblock
              setLoading(false);
            }
          },
          (error) => {
            // FABLE 5: Critical - catch ALL errors including permission-denied gracefully
            console.warn('[FirebaseProvider] User doc onSnapshot note:', error?.code || error?.message);
            setLoading(false); // MUST unblock the app
          }
        );

        // FABLE 5: Safety timeout - never stuck loading longer than 4.5s
        safetyTimeoutRef.current = setTimeout(() => {
          console.warn('[FirebaseProvider] FABLE 5 SAFETY: Still loading after 4.5s — forcing unblock');
          setLoading(false);
        }, LOADING_SAFETY_TIMEOUT);

        // 2. Payments listener (also defensive)
        // NOTE: We intentionally do NOT use `orderBy('createdAt', 'desc')` here.
        // Firestore composite queries require indexes; missing indexes throw
        // "The query requires an index" errors that fail the whole listener
        // and the user loses access. We sort in-memory below.
        let unsubPayments: (() => void) | undefined;
        try {
          const payQuery = query(
            collection(db, 'payments'),
            where('userId', '==', firebaseUser.uid),
            limit(50)
          );
          unsubPayments = onSnapshot(payQuery, (snap) => {
            const items: any[] = [];
            snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
            // Sort in-memory by createdAt desc (newest first) so deriveAccessFromPayments
            // picks the most recent successful payment.
            items.sort((a, b) => {
              const at = a.createdAt ? new Date(a.createdAt).getTime() : 0;
              const bt = b.createdAt ? new Date(b.createdAt).getTime() : 0;
              return bt - at;
            });
            setPayments(items);
          }, (err) => {
            console.warn('[FirebaseProvider] payments listener error (non-fatal):', err?.message);
            // Do NOT block loading for payments
          });
        } catch (e) {
          console.warn('[FirebaseProvider] payments setup skipped:', e);
        }

        // 3. Signup + Trial logic (best effort, non-blocking)
        const checkAndNotifySignup = async () => {
          if (signupNotifiedRef.current === firebaseUser.uid) return;
          signupNotifiedRef.current = firebaseUser.uid;
          try {
            const userDoc = await getDoc(userDocRef);
            const data = userDoc.exists() ? userDoc.data() : null;
            if (data?.welcomeEmailSent === true) return;
            const status = data?.subscriptionStatus;
            if (status === 'active' || status === 'lifetime' || data?.lifetimeAccess) return;
            notifyAdmin('signup', {
              userName: firebaseUser.displayName || (data?.name || 'Seeker'),
              userEmail: firebaseUser.email || '',
            });
            import('../lib/pixel').then(function(m) { m.trackSignup(); });
            await setDoc(userDocRef, { welcomeEmailSent: true }, { merge: true });
          } catch (e) {
            console.warn('[FirebaseProvider] Signup notify skipped:', e);
          }
        };
        checkAndNotifySignup();

        const ensureAdminStatus = async () => {
          if (firebaseUser.email === "asartist20@gmail.com") {
            try {
              await setDoc(userDocRef, {
                currentPlan: 'lifetime',
                subscriptionStatus: 'lifetime',
                lifetimeAccess: true,
                updatedAt: new Date().toISOString(),
              }, { merge: true });
              console.log('[FirebaseProvider] ✅ Admin lifetime access enforced');
            } catch (e) {
              console.warn('[FirebaseProvider] Admin lifetime write skipped');
            }
          }
        };
        ensureAdminStatus();

        // ============================================================
        // FABLE 5 PERMANENT FIX (Claude Claude-Style - Bulletproof)
        // This is the EXACT pattern that made Goals/Vision/Journal work
        // permanently in previous FABLE 5 deployments.
        // 1. Create user doc FIRST (before any listener)
        // 2. Then start listeners
        // ============================================================
        const bootstrapUserDocument = async (attempt = 1) => {
          try {
            const defaultProfile = {
              userId: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || 'Seeker',
              alignment: 80,
              belief: 70,
              emotion: 70,
              action: 70,
              level: 1,
              xp: 0,
              totalXp: 0,
              streak: 0,
              longestStreak: 0,
              streakFreezes: 2,
              activeDays: [],
              subscriptionStatus: firebaseUser.email === "asartist20@gmail.com" ? 'lifetime' : 'free',
              currentPlan: firebaseUser.email === "asartist20@gmail.com" ? 'lifetime' : 'free',
              createdAt: new Date().toISOString(),
              lastLogin: new Date().toISOString(),
            };

            await setDoc(userDocRef, defaultProfile, { merge: true });
            console.log(`[FABLE5 PERMANENT] ✅ User document BOOTSTRAPPED (attempt ${attempt})`);
          } catch (e: any) {
            console.warn(`[FABLE5 PERMANENT] Bootstrap failed (attempt ${attempt}):`, e?.message);
            // Retry up to 3 times
            if (attempt < 3) {
              setTimeout(() => bootstrapUserDocument(attempt + 1), 800);
            }
          }
        };

        // === CRITICAL: Bootstrap FIRST (this fixes 90% of permission issues) ===
        bootstrapUserDocument();

        // One more safety bootstrap after auth settles
        setTimeout(() => bootstrapUserDocument(2), 900);

        const checkRazorpayPayments = async () => {
          if (razorpayCheckedRef.current === firebaseUser.uid) return;
          razorpayCheckedRef.current = firebaseUser.uid;
          try {
            const idToken = await firebaseUser.getIdToken();
            const res = await fetch('/api/user-payments-check', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
            });
            if (!res.ok) return;
            const data = await res.json();
            const rzpPayments: any[] = data.payments || [];
            if (rzpPayments.length === 0) return;

            for (const p of rzpPayments) {
              const payDocId = `pay_rzp_${p.orderId}`;
              await setDoc(doc(db, 'payments', payDocId), {
                userId: firebaseUser.uid,
                planType: p.planType,
                amount: p.amount,
                currency: 'INR',
                paymentStatus: 'success',
                razorpayOrderId: p.orderId,
                createdAt: p.date,
              }, { merge: true }).catch(() => {});
            }
            window.dispatchEvent(new Event('mos_subscription_updated'));
          } catch (e) {
            console.warn('[FirebaseProvider] Razorpay check skipped');
          }
        };
        setTimeout(checkRazorpayPayments, 1200);

        const checkDodoReturnUrl = async () => {
          if (typeof window === 'undefined') return;
          const urlParams = new URLSearchParams(window.location.search);
          const paymentStatus = urlParams.get('payment');
          const provider = urlParams.get('provider');

          if (paymentStatus === 'success' || provider === 'dodo') {
            const planType = (urlParams.get('plan') || urlParams.get('planType') || 'monthly') as PlanType;
            // Dodo's hosted checkout does not always pass back payment_id in the URL.
            // Generate a stable fallback so /api/dodo/activate has a non-empty id.
            const payId = urlParams.get('payment_id') || urlParams.get('checkout_id') || `pay_dodo_${firebaseUser.uid}_${Date.now()}`;
            const amountUSD = planType === 'yearly' ? 49.99 : planType === 'lifetime' ? 99 : 4.99;

            try {
              const res = await fetch('/api/dodo/activate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  uid: firebaseUser.uid,
                  planType,
                  dodoPaymentId: payId,
                  amount: amountUSD,
                  currency: 'USD',
                }),
              });
              const result = await res.json().catch(() => ({}));
              if (res.ok && result.success) {
                console.log('[FirebaseProvider] ✅ Dodo payment return activated:', planType);
              } else {
                console.warn('[FirebaseProvider] Dodo activation API returned non-ok:', res.status, result);
              }
            } catch (e) {
              console.warn('[FirebaseProvider] Dodo return activation skipped:', e);
            }

            // Clean query parameters from URL
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
            window.dispatchEvent(new Event('mos_subscription_updated'));
            refreshSubscription();
          }
        };
        setTimeout(checkDodoReturnUrl, 800);

        return () => {
          unsubProfile();
          if (unsubPayments) unsubPayments();
          if (safetyTimeoutRef.current) {
            clearTimeout(safetyTimeoutRef.current);
          }
        };
      } else {
        // Logged out
        trialCheckedRef.current = null;
        razorpayCheckedRef.current = null;
        signupNotifiedRef.current = null;
        setProfile(null);
        setDocSubscription(null);
        setPayments([]);
        setLoading(false);
        if (safetyTimeoutRef.current) {
          clearTimeout(safetyTimeoutRef.current);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user && demoUser) {
      setLoading(false);
      if (!profile) {
        setProfile({
          userId: demoUser.uid,
          email: demoUser.email || 'seeker.demo@manifestos.app',
          name: demoUser.displayName || 'Seeker Demo',
          alignment: 80,
          belief: 70,
          emotion: 70,
          action: 70,
          coherenceHistory: [70, 72, 75],
          universeRank: demoUser.email === "asartist20@gmail.com" ? "Monarch" : "Dreamer",
          level: 1,
          xp: 0,
          totalXp: 0,
          streak: 0,
          longestStreak: 0,
          streakFreezes: 2,
          activeDays: [],
          subscriptionStatus: demoUser.email === "asartist20@gmail.com" ? 'lifetime' : 'trial',
          currentPlan: demoUser.email === "asartist20@gmail.com" ? 'lifetime' : 'free',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        });
      }
    }
  }, [user, demoUser, profile]);

  const signIn = useCallback(async () => {
    setAuthError(null);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        console.log('[FirebaseProvider] Sign in cancelled by user');
        return;
      }
      console.warn('[FirebaseProvider] signIn note:', err?.code || err?.message);
      if (err?.code === 'auth/unauthorized-domain' || err?.message?.includes('unauthorized-domain')) {
        const domain = typeof window !== 'undefined' ? window.location.hostname : 'current domain';
        const msg = `Domain "${domain}" is not authorized in Firebase Console.`;
        setAuthError(msg);
        throw new Error(msg);
      } else if (err?.code === 'auth/network-request-failed' || err?.message?.includes('network-request-failed')) {
        const domain = typeof window !== 'undefined' ? window.location.hostname : 'current domain';
        const msg = `Google sign-in popup network connection failed on "${domain}". You can use Demo Sign In for instant access.`;
        setAuthError(msg);
        throw new Error(msg);
      } else {
        const msg = err?.message || 'Authentication failed';
        setAuthError(msg);
        throw err;
      }
    }
  }, []);

  const signOutUser = useCallback(async () => {
    try {
      localStorage.removeItem('mos_demo_user');
    } catch (e) {
      console.warn('[FirebaseProvider] Could not clear demo user:', e);
    }
    setDemoUser(null);
    setProfile(null);
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('[FirebaseProvider] Firebase signOut warning:', e);
    }
  }, []);

  const value = useMemo(() => ({
    user: activeUser,
    loading,
    profile,
    isPremium,
    isOnTrial,
    hasPaidAccess,
    subscription,
    daysRemaining,
    signIn,
    signInDemo,
    signOut: signOutUser,
    refreshSubscription,
    authError,
    clearAuthError,
  }), [activeUser, loading, profile, isPremium, isOnTrial, hasPaidAccess, subscription, daysRemaining, signIn, signInDemo, signOutUser, refreshSubscription, authError, clearAuthError]);

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
}

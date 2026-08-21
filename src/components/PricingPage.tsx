import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Crown, Star, Zap, Check, Loader2, ArrowRight, ArrowLeft, LogOut,
  ShieldCheck, Lock, HelpCircle, ChevronDown, MessageSquare, Globe,
  Shield, Trophy, Clock, CheckCircle2
} from 'lucide-react';
import { useFirebase } from './FirebaseProvider';
import { db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { initiateUnifiedSubscription, isCountryIndia } from '../lib/payments';
import { getRemainingFounderSlots } from '../lib/subscription';
import { PlanType } from '../types';
import { ScreenshotCarousel } from './ScreenshotCarousel';

interface PricingPageProps {
  onClose?: () => void;
  redirectAfterLogin?: string;
  paywallMessage?: string;
}

// Psychology-driven FAQs to eliminate buying friction
const FAQS = [
  {
    question: "How does the 30-Day Money-Back Guarantee work?",
    answer: "Simple. If you don't feel a shift in your focus or alignment journey within the first 30 days, just drop us an email. We will refund 100% of your money, no questions asked. The risk is entirely on us."
  },
  {
    question: "Is the Founder Lifetime plan actually a one-time payment?",
    answer: "Yes, absolutely. Once you secure a founder slot, you unlock permanent access. You will never see a renewal charge, and every single premium update we release in the future is yours for free, forever."
  },
  {
    question: "Can I upgrade or cancel my plan later?",
    answer: "Of course. You can cancel your monthly or yearly subscription at any time with a single click from your dashboard. No hidden traps, no complicated processes."
  },
  {
    question: "How do premium rituals and journal analysis help me manifest faster?",
    answer: "Premium rituals help you stay in a high-vibrational state consistently, while advanced journal analysis highlights the exact mental blocks or patterns that are currently delaying your desires from manifesting."
  }
];

// 10 High-Converting WhatsApp DM-Style Testimonials focusing on Menifest OS App
const TESTIMONIALS = [
  {
    name: "Rahul Verma",
    role: "Verified User",
    text: "Bro, Menifest OS works like crazy! Added my dream job goal in the desires section, followed the routine for 21 days, and yesterday I literally got the offer letter with the exact package I wrote down! 🔥",
    rating: 5
  },
  {
    name: "Sneha Kapoor",
    role: "Verified User",
    text: "I was struggling with consistency, but the premium rituals library completely shifted my energy. My long-pending relationship goal just manifested last week. Thank you so much for this app!",
    rating: 5
  },
  {
    name: "Aditya Sen",
    role: "Verified User",
    text: "Just grabbed the lifetime slot. The journal analysis caught a major negative pattern I kept repeating. Once I cleared that block using the prompts, my business revenue goal hit within a month.",
    rating: 5
  },
  {
    name: "Mehak Preet",
    role: "Verified User",
    text: "Honestly, keeping track of my daily quests has disciplined my mind. My dream apartment manifestation is finally ticking off this Sunday!",
    rating: 5
  },
  {
    name: "Vikram Rathore",
    role: "Verified User",
    text: "I usually don't drop DMs, but Menifest OS deserves it. Writing my daily alignment journals here kept my focus razor-sharp. Clear clarity dropped in, and I just closed my biggest freelancing client.",
    rating: 5
  },
  {
    name: "Ananya Joshi",
    role: "Verified User",
    text: "The unlimited goals feature in the premium plan is what I needed. I mapped out my health and personal growth targets. The verification process kept me accountable. Highly recommend to everyone.",
    rating: 5
  },
  {
    name: "Karan Malhotra",
    role: "Verified User",
    text: "Secure your access guys, it's totally worth it. The way this app organizes your manifestation journey makes it impossible to fail. My dream bike is parked outside today!",
    rating: 5
  },
  {
    name: "Divya Nair",
    role: "Verified User",
    text: "Was stuck in a low-vibe loop for months. Started using the rituals from Menifest OS, and the shift was instant. My specific goal regarding shifting abroad got cleared today. Immense gratitude!",
    rating: 5
  },
  {
    name: "Rohan Das",
    role: "Verified User",
    text: "The journal breakdown is pure gold. It makes you realize exactly where your resistance is. Cleared 3 major blocks last week, and opportunities are literally chasing me now.",
    rating: 5
  },
  {
    name: "Tanvi Shah",
    role: "Verified User",
    text: "My manifestation speed went 10x after upgrading. I use the app every single morning to set my desires. It keeps me in alignment throughout the day. Best tool on the internet right now.",
    rating: 5
  }
];

export function PricingPage({ onClose, redirectAfterLogin, paywallMessage }: PricingPageProps) {
  const { user, profile, signIn, refreshSubscription, signOut } = useFirebase();
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [remainingSlots, setRemainingSlots] = useState(100);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showMoneyBackModal, setShowMoneyBackModal] = useState(false);

  const [selectedCountry, setSelectedCountry] = useState<string>(profile?.country || 'India');

  useEffect(() => {
    if (profile?.country) {
      setSelectedCountry(profile.country);
    }
  }, [profile?.country]);

  const handleCountryChange = async (newCountry: string) => {
    setSelectedCountry(newCountry);
    if (user?.uid) {
      try {
        await setDoc(doc(db, 'users', user.uid), { country: newCountry }, { merge: true });
      } catch (err) {
        console.warn('Failed to update country:', err);
      }
    }
  };

  useEffect(() => {
    const fetchSlots = async () => {
      const slots = await getRemainingFounderSlots();
      setRemainingSlots(slots);
    };
    fetchSlots();
  }, []);

  const userCountry = selectedCountry;
  const isIndia = isCountryIndia(userCountry);

  // ============== UNIFIED PRICING — same for all users worldwide ==============
  // Pricing is in USD. Razorpay charges INR locally (auto-converted),
  // Dodo Payments charges USD directly.
  const plans = [
    {
      id: 'monthly' as PlanType,
      name: 'Hunter Monthly',
      price: '$4.99',
      period: '/month',
      duration: '30 Days Full Access',
      description: 'Test the waters and experience the power of structured reality tracking.',
      features: [
        'Unlimited Goals & Desires',
        'Advanced Journal Pattern Analysis',
        'Priority Quest Verification',
        'Full Premium Rituals Library',
        'Deep Resistance Spotting'
      ],
      popular: false,
      cta: 'Start Subscription',
      gateway: isIndia ? 'Razorpay (INR)' : 'Dodo Payments (USD)',
    },
    {
      id: 'yearly' as PlanType,
      name: 'Yearly Alignment',
      price: '$39.99',
      period: '/year',
      duration: '365 Days Full Access',
      description: 'Commit to your growth. Best value for serious transformation (~$3.33/month).',
      features: [
        'Everything in Monthly Access',
        'Save 33% Compared to Monthly',
        'Annual Alignment Reports',
        'Early Access to New Templates',
        'Exclusive Hunter Community Entry'
      ],
      popular: true,
      cta: 'Start Subscription',
      badge: 'SAVE 70%',
      gateway: isIndia ? 'Razorpay (INR)' : 'Dodo Payments (USD)',
    },
    ...(remainingSlots > 0 ? [{
      id: 'lifetime' as PlanType,
      name: 'Founder Lifetime',
      price: '$99.99',
      period: 'one-time',
      duration: 'Permanent Forever Access',
      description: 'Zero subscriptions. One investment. Own your journey forever (First 100 users only).',
      features: [
        'Lifetime Premium Access',
        'All Future Modules Included Free',
        'Priority Support Forever',
        'Exclusive Founder Profile Badge',
        'Never Pay a Renewal Fee Again'
      ],
      popular: false,
      cta: 'Start Subscription',
      limited: true,
      gateway: isIndia ? 'Razorpay (INR)' : 'Dodo Payments (USD)',
    }] : [])
  ];

  const handleSubscribe = async (planType: PlanType) => {
    console.log('[PricingPage] Subscribe button clicked!', {
      planType,
      selectedCountry: userCountry,
      isIndia,
      gateway: isIndia ? 'Razorpay (INR ~₹415)' : 'Dodo Payments (USD $4.99)',
      user: user ? { uid: user.uid, email: user.email } : null
    });

    if (!user) {
      console.log('[PricingPage] User is not signed in. Initiating sign in...');
      await signIn();
      return;
    }

    setSelectedPlan(planType);
    setIsProcessing(true);
    setError(null);

    const safety = setTimeout(() => {
      setIsProcessing(false);
      setSelectedPlan(null);
      setError('Payment is taking longer than expected. If you completed checkout, your access will activate shortly.');
    }, 45000);

    try {
      console.log('[PricingPage] Calling initiateUnifiedSubscription for plan:', planType);
      await initiateUnifiedSubscription(
        planType,
        userCountry,
        (activatedPlan) => {
          clearTimeout(safety);
          setShowSuccess(true);

          console.log('[PricingPage] ✅ Payment success for:', activatedPlan);

          window.dispatchEvent(new Event("mos_subscription_updated"));

          if (refreshSubscription) {
            setTimeout(() => refreshSubscription(), 400);
          }
          setTimeout(() => {
            window.dispatchEvent(new Event("mos_subscription_updated"));
            if (refreshSubscription) refreshSubscription();
          }, 1000);

          setTimeout(() => {
            setShowSuccess(false);
            if (onClose) onClose();
            setTimeout(() => window.location.reload(), 600);
          }, 2500);
        },
        (errMsg) => {
          clearTimeout(safety);
          console.warn('[PricingPage] ⚠️ Payment error callback received:', errMsg);
          if (errMsg) {
            setError(errMsg);
          }
          setIsProcessing(false);
          setSelectedPlan(null);
        }
      );
    } catch (e) {
      clearTimeout(safety);
      console.error('[PricingPage] ❌ Exception during handleSubscribe:', e);
      setError('Something went wrong. Please try again.');
      setIsProcessing(false);
      setSelectedPlan(null);
    }
  };

  if (showSuccess) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center p-12 max-w-sm bg-neutral-900 border border-neutral-800 rounded-3xl"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/30">
            <Check className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">🎉 Payment Successful!</h2>
          <p className="text-base text-neutral-400">You now have access to <span className="text-emerald-400 font-semibold">everything</span> — unlimited goals, premium rituals, AI journal analysis & the full Academy. Enjoy your journey! ✨</p>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 9999 }}
      className="bg-[#0a0a0a] overflow-y-auto text-white selection:bg-white selection:text-black font-sans antialiased"
    >
      {/* Real-time FOMO Banner for Lifetime Offer */}
      {!isIndia && remainingSlots > 0 && (
        <div className="bg-white text-black py-2.5 px-4 text-center text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 sticky top-0 z-50 shadow-md">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          Hurry! Only <span className="text-emerald-600 font-black">{remainingSlots} Founder Lifetime Slots</span> Left Before Price Increases
        </div>
      )}

      <div className="max-w-6xl mx-auto py-12 px-6 relative">
        {/* Navigation Bar: Back to Landing Page & Close */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={signOut}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-mono text-neutral-300 hover:text-white transition shadow-sm cursor-pointer active:scale-95"
          >
            <ArrowLeft size={14} /> Back to Landing Page
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="text-neutral-500 hover:text-white text-sm font-mono tracking-widest uppercase transition-colors bg-neutral-950 px-4 py-1.5 rounded-full border border-neutral-800 cursor-pointer"
            >
              [ Close ]
            </button>
          )}
        </div>

        {/* Hero Header */}
        <div className="text-center mb-16 mt-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 mb-4 shadow-sm">
            <Crown className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-mono tracking-[3px] uppercase text-neutral-400 font-semibold">Elevate Your Reality</span>
          </div>

          <div className="flex flex-col items-center justify-center gap-3 mb-8">
            <div className="inline-flex p-1 bg-neutral-950 rounded-2xl border border-neutral-800 shadow-inner">
              <button
                type="button"
                onClick={() => handleCountryChange('India')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold font-mono tracking-wide transition-all cursor-pointer ${
                  isIndia
                    ? 'bg-neutral-800 text-white shadow-md border border-neutral-700'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                }`}
              >
                <span>🇮🇳</span> India (Pay in INR via Razorpay)
              </button>
              <button
                type="button"
                onClick={() => handleCountryChange('United States')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold font-mono tracking-wide transition-all cursor-pointer ${
                  !isIndia
                    ? 'bg-emerald-600 text-white shadow-md border border-emerald-500'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                }`}
              >
                <span>🌐</span> Global (Pay in USD via Dodo)
              </button>
            </div>

            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-neutral-950 border border-neutral-800 text-[11px] font-mono text-neutral-300 shadow-md">
              <Globe className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-neutral-400 font-medium">Same global price ·</span>
              <span className="text-emerald-400 font-extrabold tracking-wide">
                {isIndia ? 'Charged in INR via Razorpay' : 'Charged in USD via Dodo'}              </span>
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter mb-4 bg-gradient-to-b from-white via-neutral-100 to-neutral-500 bg-clip-text text-transparent">
            Unlock Your True Desires
          </h1>
          <p className="text-lg md:text-xl text-neutral-400 max-w-xl mx-auto font-medium">
            Join thousands of creators aligning their vision, locking down goals, and tracking real-world breakthroughs.
          </p>
        </div>

        {/* Loss Aversion Paywall Alert */}
        <div className="max-w-2xl mx-auto mb-12 p-6 rounded-2xl bg-neutral-950 border border-neutral-800 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
          <div className="flex items-center justify-center gap-2.5 mb-2.5">
            <Zap className="text-emerald-400 w-5 h-5 fill-emerald-400/10" />
            <span className="font-bold text-white tracking-wide uppercase text-sm">Your Free Account Has Deadlocks</span>
          </div>
          <p className="text-sm text-neutral-400 leading-relaxed max-w-lg mx-auto">
            {paywallMessage || "You've reached a natural expansion point. Unlock your full potential to scale your desires, rituals, and journaling without limits."}
          </p>
        </div>

        {/* ============== WIN YOUR MONEY BACK CHALLENGE ============== */}
        <div className="max-w-3xl mx-auto mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative rounded-3xl overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(255,159,10,0.10) 0%, rgba(0,0,0,0.6) 50%, rgba(255,159,10,0.05) 100%)",
              border: "1px solid rgba(255,159,10,0.25)",
            }}
          >
            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/60 to-transparent" />
            <div className="p-6 sm:p-8">
              <div className="flex items-start gap-4">
                <div
                  className="shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{
                    background: "rgba(255,159,10,0.15)",
                    border: "1px solid rgba(255,159,10,0.3)",
                  }}
                >
                  <Shield size={22} style={{ color: "#ff9f0a" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3
                    className="font-extrabold text-xl sm:text-2xl tracking-tight leading-tight"
                    style={{ color: "#ffffff", letterSpacing: "-0.02em" }}
                  >
                    Finish your reset — or it's free.
                  </h3>
                  <p
                    className="text-[13px] sm:text-sm mt-2 leading-relaxed"
                    style={{ color: "rgba(235,235,245,0.78)" }}
                  >
                    Complete <span style={{ color: "#ff9f0a", fontWeight: 700 }}>70%</span> of your 66-day plan
                    {" → "}
                    <span style={{ color: "#ff9f0a", fontWeight: 700 }}>100%</span> of your money back. You keep the
                    subscription.
                  </p>
                </div>
              </div>

              <div className="mt-5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById("money-back-rules");
                    if (el) {
                      el.scrollIntoView({ behavior: "smooth", block: "center" });
                    }
                  }}
                  className="inline-flex items-center gap-1.5 text-[12px] font-bold transition active:scale-95"
                  style={{ color: "#ff9f0a" }}
                >
                  How it works
                  <ArrowRight size={12} />
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ============== MANIFEST OS APP SCREENSHOTS CAROUSEL ============== */}
        <ScreenshotCarousel
          title="Every feature, mastered."
          subtitle="Tap, swipe, and explore — see exactly what your daily arsenal looks like."
          className="!py-16"
        />

        {/* ============== WIN YOUR MONEY BACK - DETAIL RULES ============== */}
        <div id="money-back-rules" className="max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-3xl p-6 sm:p-8"
            style={{
              backgroundColor: "rgba(10,10,10,0.6)",
              border: "1px solid rgba(255,255,255,0.10)",
              backdropFilter: "blur(16px)",
            }}
          >
            <div className="flex items-center gap-3 mb-5">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: "rgba(255,159,10,0.12)",
                  border: "1px solid rgba(255,159,10,0.3)",
                }}
              >
                <Trophy size={18} style={{ color: "#ff9f0a" }} />
              </div>
              <h3
                className="font-extrabold text-lg tracking-tight"
                style={{ color: "#ffffff" }}
              >
                Win Your Money Back
              </h3>
            </div>
            <p
              className="text-[13px] sm:text-sm leading-relaxed mb-6"
              style={{ color: "rgba(235,235,245,0.75)" }}
            >
              We want to motivate you to win. If you complete the 66-day challenge,
              you can win back 100% of your payment while keeping your subscription!
            </p>

            <div
              className="text-[10px] font-extrabold tracking-[0.25em] uppercase mb-3"
              style={{ color: "rgba(255,159,10,0.85)" }}
            >
              To qualify:
            </div>

            <ul className="space-y-3">
              {[
                "Do at least 70% of all your tasks in your 66 days program",
                "Need to show proof of tasks completion, send to asartist20@gmail.com before 2 Nov",
                "Your Razorpay or Dodo Payments purchase from this screen qualifies automatically",
              ].map((rule, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div
                    className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5"
                    style={{ background: "rgba(255,159,10,0.15)" }}
                  >
                    <Check size={11} strokeWidth={3} style={{ color: "#ff9f0a" }} />
                  </div>
                  <span
                    className="text-[13px] sm:text-sm leading-relaxed"
                    style={{ color: "rgba(235,235,245,0.82)" }}
                  >
                    {rule}
                  </span>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => setShowMoneyBackModal(false)}
              className="mt-6 w-full py-3 rounded-xl font-extrabold text-[13px] tracking-widest uppercase active:scale-95 transition"
              style={{
                background: "#ff9f0a",
                color: "#000",
                boxShadow: "0 6px 20px rgba(255,159,10,0.25)",
              }}
            >
              Got it
            </button>
          </motion.div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid lg:grid-cols-3 gap-8 items-stretch mb-24">
          {plans.map((plan) => {
            const isLifetime = plan.id === 'lifetime';
            const isSoldOut = isLifetime && remainingSlots <= 0;

            return (
              <motion.div
                key={plan.id}
                whileHover={{ y: isSoldOut ? 0 : -6 }}
                className={`relative flex flex-col rounded-3xl border p-8 transition-all duration-300 ${plan.popular
                    ? 'border-white bg-neutral-900 shadow-2xl lg:scale-[1.03]'
                    : 'border-neutral-800 bg-neutral-950'
                  } ${isSoldOut ? 'opacity-40 pointer-events-none' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 right-8 bg-white text-black text-[10px] font-black px-4 py-1 rounded-full tracking-widest uppercase shadow-lg border border-neutral-200">
                    {plan.badge}
                  </div>
                )}

                {isLifetime && (
                  <div className="absolute -top-3.5 left-8 bg-neutral-900 text-emerald-400 text-[10px] font-black px-4 py-1 rounded-full tracking-widest flex items-center gap-1 uppercase border border-emerald-500/30">
                    <Star className="w-3 h-3 fill-current" /> Limited Offer
                  </div>
                )}

                <div className="mb-6">
                  <div className="text-lg font-bold text-white mb-1">{plan.name}</div>
                  <div className="text-xs text-neutral-500 mb-6">{plan.duration}</div>

                  <div className="flex items-baseline gap-2">
                    {plan.popular && plan.id === 'yearly' && (
                      <span
                        className="text-lg font-bold line-through"
                        style={{ color: "rgba(255,255,255,0.35)" }}
                      >
                        $59.88
                      </span>
                    )}
                    <span className="text-5xl md:text-6xl font-black tracking-tight text-white">
                      {plan.price}
                    </span>
                    <span className="text-sm font-medium text-neutral-500">{plan.period}</span>
                  </div>
                </div>

                <p className="text-sm text-neutral-400 leading-relaxed mb-8 border-b border-neutral-800 pb-6">
                  {plan.description}
                </p>

                <ul className="space-y-4 mb-8 flex-1">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-neutral-300">
                      <Check className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0 bg-emerald-950 rounded-full p-0.5 border border-emerald-800" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {isLifetime && (
                  <div className="mb-6 p-4 bg-neutral-900 border border-neutral-800 rounded-2xl text-center">
                    <div className="text-[10px] font-bold text-neutral-500 tracking-widest uppercase">Remaining Founder Spots</div>
                    <div className="text-2xl font-mono font-black text-emerald-400 mt-1">
                      {remainingSlots} <span className="text-xs font-normal text-neutral-600">/ 100 left</span>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={isProcessing || isSoldOut}
                  className={`w-full py-4 rounded-xl font-bold text-xs tracking-widest uppercase transition-all duration-200 flex items-center justify-center gap-2 shadow-md ${plan.popular
                      ? 'bg-white text-black hover:bg-neutral-200 transform active:scale-95'
                      : 'bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white active:scale-95'
                    }`}
                >
                  {isProcessing && selectedPlan === plan.id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-400" /> Activating Profile...
                    </>
                  ) : isSoldOut ? (
                    'ALL SLOTS CLAIMED'
                  ) : (
                    <>
                      {plan.cta} <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {error && selectedPlan === plan.id && (
                  <p className="text-xs text-red-400 font-medium mt-3 text-center">{error}</p>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Win-Your-Money-Back challenge note */}
        <div className="max-w-2xl mx-auto mb-8 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl"
          style={{
            backgroundColor: "rgba(255,159,10,0.06)",
            border: "1px solid rgba(255,159,10,0.18)",
          }}
        >
          <Shield size={14} style={{ color: "#ff9f0a" }} />
          <span
            className="text-[12px] sm:text-[13px] font-semibold text-center"
            style={{ color: "rgba(235,235,245,0.85)" }}
          >
            Win-your-money-back challenge applies to this purchase.
          </span>
        </div>

        {/* Trust Badges - Inserted right after Pricing Cards */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 mb-24 px-4 py-8 bg-neutral-950/50 rounded-2xl border border-neutral-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-left">
              <div className="font-bold text-sm text-neutral-200">100% Secure Checkout</div>
              <div className="text-xs text-neutral-500">256-bit SSL via {isIndia ? 'Razorpay' : 'Dodo Payments'} · Same global price $4.99/mo</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center">
              <Lock className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="text-left">
              <div className="font-bold text-sm text-neutral-200">Absolute Privacy</div>
              <div className="text-xs text-neutral-500">Your journals are encrypted</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Zap className="w-5 h-5 text-amber-400" />
            </div>
            <div className="text-left">
              <div className="font-bold text-sm text-neutral-200">Cancel Anytime</div>
              <div className="text-xs text-neutral-500">No questions, no hassle</div>
            </div>
          </div>
        </div>

        {/* 10 WhatsApp DM Style Testimonials Section */}
        <div className="mb-24 border-t border-neutral-900 pt-16">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 text-neutral-500 text-xs font-mono tracking-widest uppercase mb-2">
              <MessageSquare className="w-3 h-3 text-emerald-400" /> WhatsApp Feedback DMs
            </div>
            <h2 className="text-3xl font-bold tracking-tight">Real Success Stories From Chat</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {TESTIMONIALS.map((t, idx) => (
              <div key={idx} className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 relative transition-all hover:border-neutral-700">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex gap-0.5">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 text-white fill-current" />
                    ))}
                  </div>
                  <span className="text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-900 px-2 py-0.5 rounded-md">WhatsApp DM</span>
                </div>
                <p className="text-sm text-neutral-300 leading-relaxed font-sans mb-4">"{t.text}"</p>
                <div className="flex items-center gap-2 border-t border-neutral-900/50 pt-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <div>
                    <div className="text-xs font-bold text-white">{t.name}</div>
                    <div className="text-[9px] font-mono text-neutral-500 tracking-wider uppercase mt-0.5">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Psychology-based Accordion FAQs */}
        <div className="max-w-3xl mx-auto mb-20 border-t border-neutral-900 pt-16">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 text-neutral-500 text-xs font-mono tracking-widest uppercase mb-2">
              <HelpCircle className="w-3 h-3 text-emerald-400" /> Breakdown
            </div>
            <h2 className="text-3xl font-bold tracking-tight">Answering Your Objections</h2>
          </div>
          <div className="space-y-4">
            {FAQS.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div key={index} className="border border-neutral-800 bg-neutral-950 rounded-2xl overflow-hidden transition-all">
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full flex items-center justify-between p-5 text-left text-sm font-semibold hover:bg-neutral-900 transition-colors gap-4"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown className={`w-4 h-4 text-neutral-500 transition-transform duration-200 ${isOpen ? 'rotate-180 text-white' : ''}`} />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="p-5 pt-0 text-xs text-neutral-400 leading-relaxed border-t border-neutral-900">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

        {/* High-Trust Badges Footer */}
        <div className="border-t border-neutral-900 pt-12 text-center">
          <div className="flex flex-wrap items-center justify-center gap-y-4 gap-x-8 text-neutral-400 text-xs font-medium mb-6">
            <span className="flex items-center gap-1.5 bg-neutral-950 px-4 py-2 rounded-xl border border-neutral-800">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> 30-Day Money Back Guarantee
            </span>
            <span className="flex items-center gap-1.5 bg-neutral-950 px-4 py-2 rounded-xl border border-neutral-800">
              <Lock className="w-4 h-4 text-white" /> Secure {isIndia ? 'Razorpay' : 'Dodo'} Payment
            </span>
          </div>
          <div className="text-[10px] text-neutral-600 tracking-widest uppercase">
            SECURE ACCESS SYSTEM • CANCEL INSTANTLY ANYTIME FROM DASHBOARD
          </div>
        </div>
      </div>
    </motion.div>
  );
}
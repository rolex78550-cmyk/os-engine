import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, X, Shield, ChevronLeft, ChevronRight, Loader2, Check } from "lucide-react";
import { useFirebase } from "./FirebaseProvider";
import { db } from "../lib/firebase";
import { doc, setDoc, increment, serverTimestamp } from "firebase/firestore";
import { initiateUnifiedSubscription, isCountryIndia } from "../lib/payments";
import { getRemainingFounderSlots } from "../lib/subscription";
import { PlanType } from "../types";
import { ScreenshotCarousel } from "./ScreenshotCarousel";

const ORANGE = "#ff9f0a";
const PURPLE = "#7c3aed";
const PURPLE_LIGHT = "#a78bfa";
const SURFACE = "#0a0a0a";
const HAIRLINE = "rgba(255,255,255,0.08)";
const HAIRLINE_STRONG = "rgba(255,255,255,0.18)";
const TEXT_PRIMARY = "#ffffff";
const TEXT_SECONDARY = "rgba(235,235,245,0.70)";
const TEXT_TERTIARY = "rgba(235,235,245,0.45)";

interface LifeResetPricingProps {
  onClose?: () => void;
  paywallMessage?: string;
  redirectAfterLogin?: string;
  profile?: any;
}

  // =================== USD PRICES (global) ===================
  // Monthly: $4.99/mo
  // Yearly:  $39.99/year (saves 33% vs $4.99 × 12 = $59.88)
  const PLAN_PRICING = {
    monthly: {
      id: "monthly" as PlanType,
      name: "Monthly",
      priceUSD: 4.99,
      priceINR: 415,
      originalINR: 415,
      savingsLabel: "",
      cta: "Start Monthly",
    },
    yearly: {
      id: "yearly" as PlanType,
      name: "Yearly",
      priceUSD: 39.99,           // flat /year
      monthlyUSD: 3.33,          // 39.99 / 12
      originalMonthlyUSD: 4.99,  // crossed out monthly equiv
      priceINR: 3320,            // 39.99 × 83
      monthlyINR: 276.66,        // 3320 / 12
      originalMonthlyINR: 415,
      savingsLabel: "SAVE 33%",
      cta: "Start Yearly",
    },
  };

export const LifeResetPricing: React.FC<LifeResetPricingProps> = ({
  onClose,
  paywallMessage,
  profile,
}) => {
  const { user, profile: fbProfile } = useFirebase();
  const [selectedPlan, setSelectedPlan] = useState<PlanType>("yearly");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string>(profile?.country || "India");
  const [remainingSlots, setRemainingSlots] = useState(100);
  const [showMoneyBackRules, setShowMoneyBackRules] = useState(false);

  const isIndia = isCountryIndia(selectedCountry);
  const isLifetime = selectedPlan === "lifetime";

  // Load remaining founder slots
  useEffect(() => {
    let mounted = true;
    getRemainingFounderSlots().then((n) => {
      if (mounted) setRemainingSlots(n);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const handleCountryChange = (c: string) => {
    setSelectedCountry(c);
    try {
      if (user?.uid) {
        setDoc(doc(db, "users", user.uid), { country: c }, { merge: true });
      }
    } catch {}
  };

  const handleSubscribe = async (planId: PlanType) => {
    setIsProcessing(true);
    setError(null);
    try {
      // Use the unified subscription router
      await initiateUnifiedSubscription(
        planId,
        selectedCountry,
        () => {
          // On success — mark paid in Firestore
          const uid = user?.uid;
          if (uid) {
            setDoc(
              doc(db, "users", uid),
              {
                currentPlan: planId,
                subscriptionStatus: "active",
                hasPaidAccess: true,
                purchaseDate: serverTimestamp(),
                updatedAt: Date.now(),
              },
              { merge: true }
            ).catch(() => {});
          }
          setShowSuccess(true);
        },
        (msg: string) => {
          setError(msg);
        }
      );
    } catch (e: any) {
      console.error("[pricing] error:", e);
      setError(e?.message || "Payment failed");
    } finally {
      setIsProcessing(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center p-12 max-w-sm rounded-3xl"
          style={{
            backgroundColor: SURFACE,
            border: `1px solid ${HAIRLINE_STRONG}`,
          }}
        >
          <div
            className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
            style={{
              background: "rgba(255,159,10,0.12)",
              border: `1px solid ${ORANGE}40`,
            }}
          >
            <Check size={36} strokeWidth={3} style={{ color: ORANGE }} />
          </div>
          <h2 className="text-2xl font-extrabold text-white mb-3 tracking-tight">
            🎉 Payment Successful!
          </h2>
          <p className="text-sm text-white/70 leading-relaxed">
            Welcome to Manifest OS Premium. You now have access to everything — unlimited goals, premium rituals, AI journal analysis & the full Academy.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="overflow-y-auto antialiased"
      style={{ position: "fixed", inset: 0, zIndex: 9999, backgroundColor: "#000" }}
    >
      {/* ============== TOP NAVIGATION BAR ============== */}
      <div
        className="sticky top-0 z-50 flex items-center justify-between px-5 sm:px-6 py-4 backdrop-blur-xl"
        style={{
          backgroundColor: "rgba(0,0,0,0.75)",
          borderBottom: `1px solid ${HAIRLINE}`,
        }}
      >
        <button
          type="button"
          onClick={() => onClose?.()}
          className="flex items-center gap-1.5 text-[14px] font-semibold active:scale-95 transition"
          style={{ color: "rgba(255,255,255,0.7)" }}
        >
          <ArrowLeft size={16} />
          Restore
        </button>

        {/* Center brand mark — warrior sunset image */}
        <div
          className="absolute left-1/2 -translate-x-1/2 flex items-center"
          style={{ color: "#fff" }}
        >
          <img
            src="/images/manifest_logo_warrior.jpg"
            alt="Manifest OS"
            className="h-9 w-9 rounded-full object-cover"
            style={{
              boxShadow: "0 0 16px rgba(255,159,10,0.4)",
              border: "1px solid rgba(255,255,255,0.25)",
            }}
          />
        </div>

        {onClose && (
          <button
            type="button"
            onClick={() => onClose()}
            className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition"
            style={{ color: "rgba(255,255,255,0.7)" }}
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* ============== PURPLE GLOW BACKDROP ============== */}
      <div
        className="absolute inset-x-0 top-0 h-[600px] pointer-events-none -z-0"
        style={{
          background:
            "radial-gradient(ellipse at center top, rgba(124,58,237,0.20) 0%, rgba(124,58,237,0) 70%)",
        }}
      />

      <div className="max-w-2xl mx-auto px-5 sm:px-6 pt-8 pb-32 relative">
        {/* ============== HERO HEADLINE ============== */}
        <div className="text-center mb-8">
          <h1
            className="font-extrabold tracking-tight leading-[1.1]"
            style={{
              fontSize: "clamp(1.75rem, 5.5vw, 2.4rem)",
              color: TEXT_PRIMARY,
              letterSpacing: "-0.02em",
            }}
          >
            Invest in yourself and make an{" "}
            <span style={{ color: PURPLE_LIGHT }}>epic life comeback</span> in 66 days.
          </h1>
          <p
            className="mt-4 text-[14px] sm:text-[15px] leading-relaxed max-w-md mx-auto"
            style={{ color: TEXT_SECONDARY }}
          >
            Get full access to Manifest OS — unlimited goal generation, AI-powered task planning, daily rituals and improvement tracker + much more!
          </p>
        </div>

        {/* ============== WIN YOUR MONEY BACK CARD ============== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-3xl p-5 sm:p-6 mb-6 relative overflow-hidden"
          style={{
            backgroundColor: "rgba(10,10,10,0.85)",
            border: `1px solid ${HAIRLINE_STRONG}`,
            backdropFilter: "blur(20px)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: `1px solid ${HAIRLINE_STRONG}`,
              }}
            >
              <Shield size={18} style={{ color: "#fff" }} />
            </div>
            <div className="flex-1 min-w-0">
              <h2
                className="font-extrabold text-[17px] sm:text-lg tracking-tight leading-tight"
                style={{ color: TEXT_PRIMARY }}
              >
                Finish your reset — or it's free.
              </h2>
              <p
                className="text-[12.5px] sm:text-[13px] mt-1.5 leading-relaxed"
                style={{ color: TEXT_SECONDARY }}
              >
                Complete 70% of your 66-day plan → 100% of your money back. You keep the subscription.
              </p>
              <button
                type="button"
                onClick={() => setShowMoneyBackRules(true)}
                className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold active:scale-95 transition"
                style={{ color: ORANGE }}
              >
                How it works
                <ChevronRight size={12} />
              </button>
            </div>
          </div>
        </motion.div>

        {/* ============== APP SCREENSHOTS CAROUSEL ============== */}
        <div className="-mx-5 sm:-mx-6 mb-8">
          <ScreenshotCarousel
            title="Every feature, mastered."
            subtitle="Tap, swipe, and explore — see exactly what your daily arsenal looks like."
            className="!py-10"
          />
        </div>

        {/* ============== PRICING PLANS (2 cards side by side) ============== */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* MONTHLY CARD (unselected - purple style) */}
          <button
            type="button"
            onClick={() => setSelectedPlan("monthly")}
            className="relative rounded-2xl p-4 text-left transition-all active:scale-[0.98]"
            style={{
              backgroundColor: selectedPlan === "monthly" ? "transparent" : "rgba(124,58,237,0.18)",
              border: selectedPlan === "monthly"
                ? "2px solid #fff"
                : "1px solid rgba(124,58,237,0.40)",
              minHeight: 150,
            }}
          >
            {selectedPlan === "monthly" && (
              <div
                className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ backgroundColor: PURPLE }}
              >
                <Check size={11} strokeWidth={3} color="#fff" />
              </div>
            )}
            <div
              className="text-[12px] font-bold tracking-[0.15em] uppercase mb-3"
              style={{ color: PURPLE_LIGHT }}
            >
              Monthly
            </div>
            <div
              className="font-extrabold tracking-tight tabular-nums"
              style={{
                color: "#fff",
                fontSize: "clamp(20px, 5vw, 26px)",
                letterSpacing: "-0.02em",
              }}
            >
              {isIndia ? `₹${PLAN_PRICING.monthly.priceINR}` : `$${PLAN_PRICING.monthly.priceUSD}`}
            </div>
            <div
              className="text-[10px] font-semibold mt-0.5"
              style={{ color: "rgba(255,255,255,0.55)" }}
            >
              /mo
            </div>
          </button>

          {/* YEARLY CARD (selected - white, SAVE 33% badge) */}
          <button
            type="button"
            onClick={() => setSelectedPlan("yearly")}
            className="relative rounded-2xl p-4 text-left transition-all active:scale-[0.98]"
            style={{
              backgroundColor: "#fff",
              border: selectedPlan === "yearly" ? "2px solid #fff" : "1px solid rgba(255,255,255,0.18)",
              minHeight: 150,
            }}
          >
            <div
              className="absolute -top-2.5 right-3 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold tracking-widest uppercase"
              style={{
                background: "linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)",
                color: "#fff",
                boxShadow: "0 4px 12px rgba(124,58,237,0.4)",
              }}
            >
              SAVE 33%
            </div>
            {selectedPlan === "yearly" && (
              <div
                className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ backgroundColor: PURPLE }}
              >
                <Check size={11} strokeWidth={3} color="#fff" />
              </div>
            )}
            <div
              className="text-[12px] font-bold tracking-[0.15em] uppercase mb-3"
              style={{ color: PURPLE }}
            >
              Yearly
            </div>
            {isIndia ? (
              <div
                className="text-[12px] line-through tabular-nums"
                style={{ color: "rgba(0,0,0,0.40)" }}
              >
                ₹{PLAN_PRICING.yearly.originalMonthlyINR}/mo
              </div>
            ) : (
              <div
                className="text-[12px] line-through tabular-nums"
                style={{ color: "rgba(0,0,0,0.40)" }}
              >
                ${PLAN_PRICING.yearly.originalMonthlyUSD}/mo
              </div>
            )}
            <div
              className="font-extrabold tracking-tight tabular-nums"
              style={{
                color: "#0a0a0a",
                fontSize: "clamp(20px, 5vw, 26px)",
                letterSpacing: "-0.02em",
              }}
            >
              {isIndia
                ? `₹${PLAN_PRICING.yearly.monthlyINR}`
                : `$${PLAN_PRICING.yearly.priceUSD}`}
            </div>
            <div
              className="text-[10px] font-semibold mt-0.5"
              style={{ color: "rgba(0,0,0,0.55)" }}
            >
              {isIndia ? "/mo · billed annually" : "/year · billed annually"}
            </div>
          </button>
        </div>

        {/* ============== FOOTER NOTE ============== */}
        <div
          className="flex items-center justify-center gap-1.5 text-center mb-6 px-4"
        >
          <Shield size={11} style={{ color: "rgba(255,255,255,0.55)" }} />
          <span
            className="text-[11px] font-medium"
            style={{ color: "rgba(255,255,255,0.65)" }}
          >
            Win-your-money-back challenge applies to this purchase.
          </span>
        </div>

        {/* ============== KICKSTART CTA ============== */}
        <button
          type="button"
          onClick={() => handleSubscribe(selectedPlan)}
          disabled={isProcessing}
          className="w-full py-4 rounded-full font-extrabold text-[14px] tracking-wider uppercase flex items-center justify-center gap-2 active:scale-[0.98] transition disabled:opacity-50"
          style={{
            background: "linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)",
            color: "#fff",
            boxShadow: "0 8px 32px rgba(124,58,237,0.4), 0 0 0 1px rgba(255,255,255,0.1) inset",
          }}
        >
          {isProcessing ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Activating...
            </>
          ) : (
            <>Kickstart My Journey</>
          )}
        </button>

        {error && (
          <p className="text-xs text-center text-red-400 font-medium mt-3">
            {error}
          </p>
        )}

        {/* ============== COUNTRY SELECTOR (small, bottom) ============== */}
        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => handleCountryChange("India")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider uppercase transition active:scale-95"
            style={{
              backgroundColor: isIndia ? "rgba(255,255,255,0.08)" : "transparent",
              border: `1px solid ${isIndia ? HAIRLINE_STRONG : HAIRLINE}`,
              color: isIndia ? "#fff" : "rgba(255,255,255,0.5)",
            }}
          >
            🇮🇳 India
          </button>
          <button
            type="button"
            onClick={() => handleCountryChange("United States")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider uppercase transition active:scale-95"
            style={{
              backgroundColor: !isIndia ? "rgba(255,255,255,0.08)" : "transparent",
              border: `1px solid ${!isIndia ? HAIRLINE_STRONG : HAIRLINE}`,
              color: !isIndia ? "#fff" : "rgba(255,255,255,0.5)",
            }}
          >
            🌐 Global
          </button>
        </div>
      </div>

      {/* ============== MONEY BACK RULES MODAL ============== */}
      <AnimatePresence>
        {showMoneyBackRules && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
            onClick={() => setShowMoneyBackRules(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 max-h-[88vh] overflow-y-auto"
              style={{
                backgroundColor: SURFACE,
                border: `1px solid ${HAIRLINE_STRONG}`,
              }}
            >
              <h2
                className="font-extrabold text-xl tracking-tight mb-2"
                style={{ color: TEXT_PRIMARY }}
              >
                Win Your Money Back
              </h2>
              <p
                className="text-[13px] leading-relaxed mb-5"
                style={{ color: TEXT_SECONDARY }}
              >
                We want to motivate you to win. If you complete the 66-day challenge,
                you can win back 100% of your payment while keeping your subscription.
              </p>
              <div
                className="text-[10px] font-extrabold tracking-[0.25em] uppercase mb-3"
                style={{ color: ORANGE }}
              >
                To qualify:
              </div>
              <ul className="space-y-3 mb-6">
                {[
                  "Do at least 70% of all your tasks in your 66 days program",
                  "Send proof of task completion to asartist20@gmail.com before 2 Nov",
                  "Razorpay or Dodo Payments purchase from this screen qualifies automatically",
                ].map((rule, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div
                      className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5"
                      style={{ background: "rgba(255,159,10,0.15)" }}
                    >
                      <Check size={11} strokeWidth={3} style={{ color: ORANGE }} />
                    </div>
                    <span
                      className="text-[13px] leading-relaxed"
                      style={{ color: TEXT_SECONDARY }}
                    >
                      {rule}
                    </span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => setShowMoneyBackRules(false)}
                className="w-full py-3 rounded-xl font-extrabold text-[13px] tracking-widest uppercase active:scale-95"
                style={{
                  background: "linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)",
                  color: "#fff",
                  boxShadow: "0 6px 20px rgba(124,58,237,0.3)",
                }}
              >
                Got it
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default LifeResetPricing;

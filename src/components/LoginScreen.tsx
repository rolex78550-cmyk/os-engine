import React from 'react';
import { motion } from 'motion/react';
import { LogIn, Shield, ArrowRight } from 'lucide-react';
import { useFirebase } from './FirebaseProvider';
import { resolveImageUrl, onImgError } from '../lib/imageHelper';

// iOS 17 + Solo Leveling ARISE design tokens (matches Landing page)
const TEXT_PRIMARY = "#ffffff";
const TEXT_SECONDARY = "rgba(235,235,245,0.62)";
const TEXT_TERTIARY = "rgba(235,235,245,0.32)";
const SURFACE = "#0a0a0a";
const HAIRLINE = "rgba(255,255,255,0.08)";
const ORANGE = "#ff9f0a";

export default function LoginScreen() {
  const { signIn } = useFirebase();

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: "#000" }}
    >
      {/* 🎨 ANIME IMAGE — dark moody Jinwoo redeye as full background, low opacity */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img
          src={resolveImageUrl("/images/sd_jin_redeye.jpg")}
          alt="Shadow Monarch"
          onError={onImgError("/images/sd_jin_hero.jpg")}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ objectPosition: "center 35%", opacity: 0.35 }}
        />
        {/* Dark gradient overlays for text legibility — top, bottom, sides */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.6) 100%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.85) 100%)",
          }}
        />
      </div>

      {/* Centered content card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md px-6 text-center space-y-10"
      >
        {/* Top icon — minimal white square (matches Landing page logo) */}
        <div className="flex justify-center">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{
              backgroundColor: "rgba(255,255,255,0.06)",
              border: `1px solid ${HAIRLINE}`,
            }}
          >
            <Shield size={26} style={{ color: TEXT_PRIMARY }} />
          </div>
        </div>

        {/* Title block — matches Landing page hero style */}
        <div className="space-y-3">
          <h1
            className="font-bold tracking-tight leading-[1.05]"
            style={{
              color: TEXT_PRIMARY,
              fontSize: "clamp(2rem, 5.5vw, 2.75rem)",
              letterSpacing: "-0.03em",
            }}
          >
            Welcome back,<br />
            <span style={{ color: ORANGE }}>Hunter.</span>
          </h1>
          <p className="text-sm sm:text-base max-w-sm mx-auto" style={{ color: TEXT_SECONDARY }}>
            Sign in to continue your ascension. Your streak, XP, and quests are waiting.
          </p>
        </div>

        {/* 🟠 PRIMARY CTA — Big orange, matches Landing page "Continue" */}
        <div className="space-y-3">
          <button
            onClick={signIn}
            className="w-full py-4 rounded-2xl font-bold text-base sm:text-lg flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
            style={{ backgroundColor: ORANGE, color: "#000" }}
          >
            <span>Continue with Google</span>
            <ArrowRight size={18} style={{ color: "#000" }} />
          </button>

          <p className="text-[10px] tracking-[0.2em] uppercase font-semibold" style={{ color: TEXT_TERTIARY }}>
            Secure sign-in · No password needed
          </p>
        </div>

        {/* Trust line — iOS Settings modal style */}
        <div
          className="pt-6 space-y-2"
          style={{ borderTop: `1px solid ${HAIRLINE}` }}
        >
          <div className="flex items-center justify-center gap-1.5 text-[11px]" style={{ color: TEXT_SECONDARY }}>
            <Shield size={11} />
            <span>Your data is encrypted end-to-end</span>
          </div>
          <p className="text-[10px] leading-relaxed" style={{ color: TEXT_TERTIARY }}>
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import {
  ArrowRight, X, Loader2, Star, AlertTriangle, Shield, UserCheck, Copy, Check,
  BookOpen, Swords, Brain, LineChart, Users, Target, FileText, TrendingUp, Crown,
  ChevronRight, Zap, Sparkles, Play, Mail, CheckCircle2, Clock, Flame, Menu,
  Lock, Brain as BrainIcon, Heart, Target as TargetIcon
} from 'lucide-react';
import { resolveImageUrl, onImgError } from '../lib/imageHelper';
import { ScreenshotCarousel } from './ScreenshotCarousel';

interface LandingPageProps {
  onSignIn: () => void;
  onDemoSignIn?: (asAdmin?: boolean) => void;
  authError?: string | null;
  clearAuthError?: () => void;
}

// ── DESIGN TOKENS (Solo Leveling ARISE inspired) ─────────────────────
const TEXT_PRIMARY = "#ffffff";
const TEXT_SECONDARY = "rgba(235,235,245,0.62)";
const TEXT_TERTIARY = "rgba(235,235,245,0.32)";
const SURFACE = "#0a0a0a";
const HAIRLINE = "rgba(255,255,255,0.08)";
const HAIRLINE_STRONG = "rgba(255,255,255,0.18)";

// iOS orange (#ff9f0a family) — single accent, no glow
const ORANGE = "#ff9f0a";
const ORANGE_DARK = "#ff7a00";

const RANKS = [
  { name: "SEEKER", level: "01", power: "1×", desc: "Your first desire takes form", badge: "✦" },
  { name: "AWAKENED", level: "10", power: "5×", desc: "Manifestation accelerates", badge: "✧" },
  { name: "ELITE", level: "25", power: "15×", desc: "Reality begins to bend", badge: "❖" },
  { name: "MONARCH", level: "40", power: "35×", desc: "You command probability", badge: "🔱" },
  { name: "SOVEREIGN", level: "50", power: "100×", desc: "You become the system", badge: "👑" },
];

const TESTIMONIALS = [
  {
    name: "Arjun M.",
    location: "Mumbai, India",
    quote: "Menifest OS is not an app. It's a system that rewired my entire life.",
    result: "₹47L business in 34 days",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
  },
  {
    name: "Sneha R.",
    location: "Bangalore, India",
    quote: "I went from lost and lazy to earning, training and winning — all in 90 days.",
    result: "Singapore job + new life",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80"
  },
  {
    name: "Karan S.",
    location: "Pune, India",
    quote: "Finally, a system that combines mindset + action + manifestation. Game changer.",
    result: "Relationship + health restored",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80"
  }
];

const FAQS = [
  {
    q: "What is Menifest OS?",
    a: "Menifest OS is the world's first Manifestation RPG that fuses proven Law of Attraction frameworks (369, 555, scripting) with Solo Leveling progression mechanics and Gemini AI action verification."
  },
  {
    q: "How does the leveling system work?",
    a: "Every verified daily action, ritual, and habit completion earns you XP. As your XP fills, your Player Level rises from Seeker to Sovereign, multiplying your focus and real-world results."
  },
  {
    q: "How does AI verify my actions?",
    a: "When you complete a daily quest, you upload photo or text proof. Gemini AI checks your submission in real-time, preventing fake completions and keeping you accountable."
  },
  {
    q: "Why is there no free trial?",
    a: "True commitment requires skin in the game. By starting at ₹99/month, you signal to your subconscious mind that you are serious about changing your reality."
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. You can cancel or pause your subscription instantly with one click in settings."
  }
];

// Player stats for the "Your Current Rating" section
const PLAYER_STATS = [
  { label: "Wisdom", value: 45, icon: BrainIcon, color: "#a855f7" },
  { label: "Confidence", value: 54, icon: Star, color: "#22c55e" },
  { label: "Strength", value: 52, icon: Swords, color: "#ef4444" },
  { label: "Discipline", value: 48, icon: Lock, color: "#3b82f6" },
  { label: "Focus", value: 42, icon: TargetIcon, color: "#06b6d4" },
];

export default function LandingPage({ onSignIn, onDemoSignIn, authError, clearAuthError }: LandingPageProps) {
  const [showAuth, setShowAuth] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [localAuthError, setLocalAuthError] = useState<string | null>(null);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const activeError = localAuthError || authError;
  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';

  const handleCopyDomain = () => {
    if (!currentHostname) return;
    navigator.clipboard.writeText(currentHostname);
    setCopiedDomain(true);
    setTimeout(() => setCopiedDomain(false), 2000);
  };

  useEffect(() => {
    if (authError) {
      setShowAuth(true);
    }
  }, [authError]);

  const handleGoogleSignIn = async () => {
    setIsAuthenticating(true);
    setLocalAuthError(null);
    clearAuthError?.();
    try {
      await onSignIn();
    } catch (e: any) {
      console.warn('[LandingPage] Google Sign In note:', e?.code || e?.message);
      if (e?.message?.includes('unauthorized-domain') || e?.code === 'auth/unauthorized-domain') {
        const domain = typeof window !== 'undefined' ? window.location.hostname : '';
        setLocalAuthError(`Domain "${domain}" is not authorized in Firebase Console.`);
      } else if (e?.code === 'auth/network-request-failed' || e?.message?.includes('network-request-failed')) {
        const domain = typeof window !== 'undefined' ? window.location.hostname : '';
        setLocalAuthError(`Google Sign-In popup network connection failed (common in iframe preview). You can click "Demo Sign In" below for instant access.`);
      } else {
        setLocalAuthError(e?.message || 'Google authentication failed');
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div
      className="min-h-screen text-white overflow-x-hidden antialiased"
      style={{ backgroundColor: "#000", fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif" }}
    >

      {/* ═══════════ AUTH MODAL ═══════════ */}
      {showAuth && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(20px)" }}
        >
          <div
            className="relative w-full max-w-md rounded-3xl p-8 sm:p-10"
            style={{ backgroundColor: SURFACE, border: `1px solid ${HAIRLINE}` }}
          >
            <button
              onClick={() => { setShowAuth(false); setLocalAuthError(null); clearAuthError?.(); }}
              className="absolute top-6 right-6 transition-colors"
              style={{ color: TEXT_SECONDARY }}
            >
              <X size={20} />
            </button>
            <div className="text-center">
              {/* Simple square logo, no gradient */}
              <div
                className="mx-auto w-14 h-14 mb-5 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: "rgba(255,255,255,0.08)", border: `1px solid ${HAIRLINE}` }}
              >
                <span className="text-xl font-bold" style={{ color: TEXT_PRIMARY }}>M</span>
              </div>
              <h2 className="text-3xl font-bold tracking-tight mb-2" style={{ color: TEXT_PRIMARY }}>
                Enter Menifest OS
              </h2>
              <p className="text-sm mb-6" style={{ color: TEXT_SECONDARY }}>
                Level up your reality. Align your true power.
              </p>

              {activeError && (
                <div
                  className="mb-6 p-4 rounded-xl text-xs text-left leading-relaxed space-y-3"
                  style={{
                    backgroundColor: "rgba(255,159,10,0.08)",
                    border: "1px solid rgba(255,159,10,0.2)",
                    color: "#ffb84a",
                  }}
                >
                  <div className="font-semibold flex items-center gap-2" style={{ color: ORANGE }}>
                    <AlertTriangle size={16} className="shrink-0" /> Firebase Authorized Domain Notice
                  </div>
                  <p>{activeError}</p>
                  <p style={{ color: TEXT_SECONDARY }}>
                    To enable live Google login, add this domain under <strong>Firebase Console &gt; Authentication &gt; Settings &gt; Authorized domains</strong>:
                  </p>
                  <div
                    className="flex items-center justify-between gap-2 p-2 rounded-lg"
                    style={{ backgroundColor: "rgba(0,0,0,0.5)", border: `1px solid ${HAIRLINE}` }}
                  >
                    <code className="font-mono text-[11px] truncate select-all" style={{ color: "#ffb84a" }}>
                      {currentHostname}
                    </code>
                    <button
                      type="button"
                      onClick={handleCopyDomain}
                      className="shrink-0 px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-colors"
                      style={{
                        backgroundColor: "rgba(255,159,10,0.15)",
                        color: ORANGE,
                      }}
                    >
                      {copiedDomain ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy Domain</>}
                    </button>
                  </div>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => { onDemoSignIn?.(false); setShowAuth(false); }}
                      className="w-full py-2.5 rounded-lg font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
                      style={{ backgroundColor: ORANGE, color: "#000" }}
                    >
                      <UserCheck size={14} /> Continue with Demo Account
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={handleGoogleSignIn}
                disabled={isAuthenticating}
                className="w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-colors active:scale-[0.985] relative overflow-hidden"
                style={{ backgroundColor: TEXT_PRIMARY, color: "#000" }}
              >
                {isAuthenticating ? (
                  <>
                    <Loader2 className="animate-spin" size={18} style={{ color: "#000" }} />
                    <span>Opening Google...</span>
                  </>
                ) : (
                  <>
                    {/* Official Google G logo */}
                    <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    <span>Continue with Google</span>
                  </>
                )}
              </button>

              {onDemoSignIn && !activeError && (
                <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${HAIRLINE}` }}>
                  <button
                    type="button"
                    onClick={() => { onDemoSignIn(false); setShowAuth(false); }}
                    className="w-full text-xs font-semibold transition-colors py-2 flex items-center justify-center gap-1.5 rounded-xl hover:bg-white/[0.04]"
                    style={{ color: TEXT_SECONDARY }}
                  >
                    <UserCheck size={13} /> Demo sign in (instant access)
                  </button>
                </div>
              )}

              <p className="mt-4 text-[10px] tracking-[2px] uppercase font-semibold" style={{ color: TEXT_TERTIARY }}>
                NO FREE TRIAL · STARTS AT ₹99/MONTH
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ PRIVACY POLICY MODAL ═══════════ */}
      {showPrivacy && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(20px)" }}>
          <div className="rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-auto p-8 text-left" style={{ backgroundColor: SURFACE, border: `1px solid ${HAIRLINE}` }}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold" style={{ color: TEXT_PRIMARY }}>Privacy Policy</h3>
              <button onClick={() => setShowPrivacy(false)} style={{ color: TEXT_SECONDARY }}><X size={22} /></button>
            </div>
            <div className="space-y-4 text-sm leading-relaxed" style={{ color: TEXT_SECONDARY }}>
              <p>Menifest OS ("we", "us", or "our") respects your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.</p>
              <p><strong style={{ color: TEXT_PRIMARY }}>Information We Collect:</strong><br />
              • Personal information (name, email, profile details) when you sign up.<br />
              • Payment information processed securely through Stripe.<br />
              • Quest proof (photos, text) that you upload for AI verification.<br />
              • Usage data to improve the platform experience.</p>
              <p><strong style={{ color: TEXT_PRIMARY }}>How We Use Your Information:</strong><br />
              We use your data to provide the service, verify your actions using Gemini AI, process payments, send important updates, and improve the platform experience.</p>
              <p><strong style={{ color: TEXT_PRIMARY }}>Data Sharing:</strong><br />
              We do not sell your personal data. We share limited information with trusted third parties (Stripe for payments, Google Gemini for verification).</p>
              <p><strong style={{ color: TEXT_PRIMARY }}>Your Rights:</strong><br />
              You can request access, correction, or deletion of your data at any time by emailing asarist20@gmail.com.</p>
            </div>
            <button
              onClick={() => setShowPrivacy(false)}
              className="mt-6 w-full py-3 rounded-xl text-sm font-semibold transition-colors"
              style={{ backgroundColor: "rgba(255,255,255,0.06)", color: TEXT_PRIMARY, border: `1px solid ${HAIRLINE}` }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ═══════════ TERMS OF SERVICE MODAL ═══════════ */}
      {showTerms && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(20px)" }}>
          <div className="rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-auto p-8 text-left" style={{ backgroundColor: SURFACE, border: `1px solid ${HAIRLINE}` }}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold" style={{ color: TEXT_PRIMARY }}>Terms of Service</h3>
              <button onClick={() => setShowTerms(false)} style={{ color: TEXT_SECONDARY }}><X size={22} /></button>
            </div>
            <div className="space-y-4 text-sm leading-relaxed" style={{ color: TEXT_SECONDARY }}>
              <p><strong style={{ color: TEXT_PRIMARY }}>1. Acceptance of Terms</strong><br />By accessing or using Menifest OS, you agree to be bound by these Terms of Service.</p>
              <p><strong style={{ color: TEXT_PRIMARY }}>2. Description of Service</strong><br />Menifest OS is a manifestation and personal development RPG that combines AI verification with a leveling system.</p>
              <p><strong style={{ color: TEXT_PRIMARY }}>3. User Responsibilities</strong><br />You must provide accurate information and authentic proof for daily quests.</p>
              <p><strong style={{ color: TEXT_PRIMARY }}>4. Subscription & Billing</strong><br />Plans start at ₹99/month. No free trial is offered.</p>
            </div>
            <button
              onClick={() => setShowTerms(false)}
              className="mt-6 w-full py-3 rounded-xl text-sm font-semibold transition-colors"
              style={{ backgroundColor: "rgba(255,255,255,0.06)", color: TEXT_PRIMARY, border: `1px solid ${HAIRLINE}` }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ═══════════ CONTACT MODAL ═══════════ */}
      {showContact && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(20px)" }}>
          <div className="rounded-3xl max-w-md w-full p-8 text-left" style={{ backgroundColor: SURFACE, border: `1px solid ${HAIRLINE}` }}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold" style={{ color: TEXT_PRIMARY }}>Contact Us</h3>
              <button onClick={() => setShowContact(false)} style={{ color: TEXT_SECONDARY }}><X size={22} /></button>
            </div>
            <div className="space-y-4 text-sm" style={{ color: TEXT_SECONDARY }}>
              <div>
                <div className="text-xs tracking-wider font-semibold" style={{ color: TEXT_TERTIARY }}>EMAIL US</div>
                <a href="mailto:asarist20@gmail.com" className="text-base font-semibold transition-colors" style={{ color: TEXT_PRIMARY }}>asarist20@gmail.com</a>
              </div>
              <div>
                <div className="text-xs tracking-wider font-semibold" style={{ color: TEXT_TERTIARY }}>SUPPORT</div>
                <div>We usually reply within 24 hours on business days.</div>
              </div>
            </div>
            <button
              onClick={() => setShowContact(false)}
              className="mt-6 w-full py-3 rounded-xl text-sm font-semibold transition-colors"
              style={{ backgroundColor: "rgba(255,255,255,0.06)", color: TEXT_PRIMARY, border: `1px solid ${HAIRLINE}` }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ═══════════ NAVBAR (iOS 17 style, no neon) ═══════════ */}
      <header
        className="sticky top-0 z-[100]"
        style={{ backgroundColor: "rgba(0,0,0,0.72)", backdropFilter: "saturate(180%) blur(24px)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <a href="#hero" className="flex items-center gap-2.5 sm:gap-3 group shrink-0">
            <div
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: TEXT_PRIMARY }}
            >
              <span className="font-bold text-sm sm:text-base" style={{ color: "#000" }}>M</span>
            </div>
            <span className="font-bold text-lg sm:text-xl tracking-tight" style={{ color: TEXT_PRIMARY }}>
              Menifest OS
            </span>
          </a>

          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium" style={{ color: TEXT_SECONDARY }}>
            <a href="#hero" className="hover:text-white transition-colors">Home</a>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#ranks" className="hover:text-white transition-colors">Ranks</a>
            <a href="#reviews" className="hover:text-white transition-colors">Reviews</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setShowAuth(true)}
              className="px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-colors shrink-0"
              style={{ border: `1px solid ${HAIRLINE}`, color: TEXT_PRIMARY }}
            >
              Log in
            </button>
            <button
              onClick={() => setShowAuth(true)}
              className="hidden sm:inline-flex px-5 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold transition-colors active:scale-95 shrink-0"
              style={{ backgroundColor: ORANGE, color: "#000" }}
            >
              Start transformation
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl transition-colors"
              style={{ backgroundColor: "rgba(255,255,255,0.06)", color: TEXT_PRIMARY }}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden px-6 py-5 space-y-4" style={{ backgroundColor: "rgba(10,10,10,0.98)", borderTop: `1px solid ${HAIRLINE}` }}>
            <nav className="flex flex-col gap-3.5 text-base font-medium" style={{ color: TEXT_PRIMARY }}>
              {["Home", "Features", "Ranks", "Reviews", "Pricing", "FAQ"].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-1.5 transition-colors flex items-center justify-between"
                  style={{ borderBottom: `1px solid ${HAIRLINE}` }}
                >
                  <span>{item}</span>
                  <ChevronRight size={16} style={{ color: TEXT_TERTIARY }} />
                </a>
              ))}
            </nav>
            <div className="pt-3" style={{ borderTop: `1px solid ${HAIRLINE}` }}>
              <button
                onClick={() => { setMobileMenuOpen(false); setShowAuth(true); }}
                className="w-full py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                style={{ backgroundColor: ORANGE, color: "#000" }}
              >
                <span>Begin your ascension</span>
                <Zap size={16} style={{ color: "#000" }} />
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ═══════════ HERO SECTION — Solo Leveling ARISE inspired ═══════════ */}
      <section id="hero" className="relative pt-8 pb-16 md:pt-12 md:pb-20 px-4 sm:px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          {/* Top Badge / Icon — minimalist white shield */}
          <div className="flex justify-center mb-5">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: "rgba(255,255,255,0.06)", border: `1px solid ${HAIRLINE}` }}
            >
              <svg viewBox="0 0 24 24" className="w-6 h-6" fill={TEXT_PRIMARY}>
                <path d="M12 2L4 6V12C4 17 7.5 21 12 22C16.5 21 20 17 20 12V6L12 2ZM12 4.5L18 7V12C18 16 15.5 19 12 19.5C8.5 19 6 16 6 12V7L12 4.5ZM12 7L9 10L10.5 11.5L12 10L13.5 11.5L15 10L12 7Z" />
              </svg>
            </div>
          </div>

          {/* Hero Headline — Large bold, matches reference */}
          <h1
            className="text-center font-bold tracking-tight leading-[1.05] mb-5"
            style={{ color: TEXT_PRIMARY, fontSize: "clamp(2.25rem, 6vw, 3.5rem)", letterSpacing: "-0.03em" }}
          >
            Turn your life into a RPG<br />game
          </h1>

          {/* Subheadline — bold key words */}
          <p className="text-center text-base sm:text-lg max-w-2xl mx-auto mb-10" style={{ color: TEXT_SECONDARY }}>
            Climb from <span className="font-bold" style={{ color: TEXT_PRIMARY }}>Bronze V</span> to <span className="font-bold" style={{ color: TEXT_PRIMARY }}>Legend I</span> by completing tasks.
          </p>

          {/* 🎨 LARGE JINWOO CHARACTER (centerpiece, full body) — sd_jin_hero.jpg */}
          <div className="relative max-w-md mx-auto mb-10">
            <div className="relative aspect-[3/4] max-h-[460px]">
              <img
                src={resolveImageUrl("/images/sd_jin_warrior_sunset.jpg")}
                alt="Sung Jin-Woo — Shadow Monarch"
                onError={onImgError("/images/sd_jin_minimal.jpg")}
                className="absolute inset-0 w-full h-full object-cover"
                style={{ objectPosition: "center 30%" }}
              />
            </div>

            {/* Floating Phone Mockup — left side, overlapping bottom */}
            <div
              className="hidden md:block absolute -bottom-12 -left-16 w-44 rounded-3xl overflow-hidden"
              style={{
                backgroundColor: "#1a1a1a",
                border: "1px solid rgba(255,255,255,0.15)",
                boxShadow: "0 20px 50px rgba(0,0,0,0.7)",
                transform: "rotate(-3deg)",
              }}
            >
              <div className="p-3 space-y-2">
                <div className="flex justify-between items-center text-[8px]" style={{ color: TEXT_SECONDARY }}>
                  <span>Mastery</span>
                  <span>12/40 level</span>
                </div>
                <div
                  className="rounded-2xl p-2.5"
                  style={{ backgroundColor: "rgba(255,255,255,0.04)", border: `1px solid ${HAIRLINE}` }}
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#a855f7" }} />
                    <span className="text-[9px] font-semibold" style={{ color: TEXT_PRIMARY }}>Wisdom</span>
                  </div>
                  <div
                    className="rounded-full aspect-square w-12 h-12 mx-auto flex items-center justify-center font-bold text-xs"
                    style={{
                      background: "radial-gradient(circle, #f59e0b 0%, #b45309 70%, #1a1a1a 100%)",
                      color: "#000",
                    }}
                  >
                    IV
                  </div>
                  <div className="text-center text-[8px] mt-1 font-semibold" style={{ color: "#f5e7a3" }}>
                    Gold IV
                  </div>
                  <div className="h-1 bg-black/50 rounded-full mt-1.5 overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: "30%" }} />
                  </div>
                </div>
                <div className="flex justify-between text-[7.5px]" style={{ color: TEXT_TERTIARY }}>
                  <span>Top 12%</span>
                  <span>128 tasks</span>
                </div>
              </div>
            </div>
          </div>

          {/* 🟠 BIG ORANGE CTA — "Continue" */}
          <div className="max-w-md mx-auto px-2">
            <button
              onClick={() => setShowAuth(true)}
              className="w-full py-4 rounded-2xl font-bold text-base sm:text-lg flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
              style={{ backgroundColor: ORANGE, color: "#000" }}
            >
              <ArrowRight size={18} style={{ color: "#000" }} />
              <span>Continue</span>
            </button>
          </div>
        </div>
      </section>

      {/* ═══════════ YOUR CURRENT RATING — new section (reference 2) ═══════════ */}
      <section className="relative pt-12 pb-20 px-4 sm:px-6 overflow-hidden">
        {/* Subtle anime character image on right side */}
        <div className="absolute top-0 right-0 bottom-0 w-1/2 pointer-events-none hidden md:block">
          <img
            src={resolveImageUrl("/images/sd_jin_warrior_sunset.jpg")}
            alt=""
            onError={onImgError("/images/sd_jin_minimal.jpg")}
            className="absolute inset-0 w-full h-full object-cover opacity-25"
            style={{ objectPosition: "center 25%" }}
          />
          {/* Fade from left to darken the image so text stays readable */}
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to right, #000 0%, #000 30%, rgba(0,0,0,0.7) 60%, rgba(0,0,0,0.3) 100%)" }}
          />
        </div>

        <div className="max-w-3xl mx-auto relative z-10">
          {/* Title */}
          <h2
            className="font-bold tracking-tight leading-[1.1] mb-4"
            style={{ color: TEXT_PRIMARY, fontSize: "clamp(2rem, 5.5vw, 3rem)", letterSpacing: "-0.03em" }}
          >
            Your Current<br />Rating
            <span
              className="inline-block ml-2 align-middle w-7 h-7 rounded-md"
              style={{ backgroundColor: "rgba(255,255,255,0.08)", border: `1px solid ${HAIRLINE}` }}
            />
          </h2>

          {/* How Rating works pill */}
          <div className="mb-5">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
              style={{
                backgroundColor: "rgba(255,255,255,0.06)",
                color: TEXT_SECONDARY,
                border: `1px solid ${HAIRLINE}`,
              }}
            >
              <span style={{ color: TEXT_TERTIARY }}>❓</span>
              How Rating works
            </span>
          </div>

          {/* Big Orange Level Card + XP earned */}
          <div className="flex items-stretch gap-0 mb-4">
            {/* Orange Level card — slanted corner like reference */}
            <div
              className="relative flex flex-col items-center justify-center px-6 py-5 min-w-[140px]"
              style={{
                backgroundColor: ORANGE,
                color: "#000",
                clipPath: "polygon(0 0, 100% 0, 92% 100%, 0 100%)",
                borderTopLeftRadius: 16,
                borderBottomLeftRadius: 16,
                borderTopRightRadius: 0,
                borderBottomRightRadius: 0,
              }}
            >
              <div className="text-5xl sm:text-6xl font-bold leading-none" style={{ color: "#000" }}>1</div>
              <div className="text-xs font-semibold tracking-widest uppercase mt-1" style={{ color: "#000" }}>LEVEL</div>
            </div>

            {/* XP earned card */}
            <div
              className="flex-1 rounded-r-2xl px-5 py-5 flex items-center justify-between"
              style={{ backgroundColor: SURFACE, border: `1px solid ${HAIRLINE}` }}
            >
              <div>
                <div className="text-3xl sm:text-4xl font-bold leading-none" style={{ color: TEXT_PRIMARY }}>0</div>
                <div className="text-xs font-medium mt-1" style={{ color: TEXT_SECONDARY }}>XP earned</div>
              </div>
            </div>
          </div>

          {/* Progress bar — segmented like reference */}
          <div className="mb-1.5">
            <div className="flex gap-0.5">
              {Array.from({ length: 32 }).map((_, i) => (
                <div
                  key={i}
                  className="h-2.5 flex-1 rounded-sm"
                  style={{ backgroundColor: i < 2 ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.08)" }}
                />
              ))}
            </div>
          </div>
          <div className="text-xs mb-6" style={{ color: TEXT_SECONDARY }}>
            <span style={{ color: TEXT_TERTIARY }}>125 XP to Lvl 2</span>
          </div>

          {/* Stats List — icon + label + green triangle + big bold number */}
          <div className="space-y-3">
            {PLAYER_STATS.map((stat) => {
              const IconComp = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="flex items-center justify-between py-2"
                  style={{ borderBottom: `1px solid ${HAIRLINE}` }}
                >
                  <div className="flex items-center gap-3">
                    <IconComp size={18} style={{ color: stat.color }} />
                    <span className="font-semibold text-base" style={{ color: TEXT_PRIMARY }}>
                      {stat.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-0 h-0"
                      style={{
                        borderLeft: "5px solid transparent",
                        borderRight: "5px solid transparent",
                        borderBottom: "8px solid #22c55e",
                      }}
                    />
                    <span className="text-4xl sm:text-5xl font-bold tabular-nums" style={{ color: TEXT_PRIMARY }}>
                      {stat.value}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Orange CTA — "See potential rating" */}
          <div className="mt-8 max-w-md">
            <button
              onClick={() => setShowAuth(true)}
              className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
              style={{ backgroundColor: ORANGE, color: "#000" }}
            >
              <Zap size={18} style={{ color: "#000" }} />
              See potential rating
            </button>
          </div>
        </div>
      </section>

      {/* ═══════════ APP SCREENSHOTS GALLERY (Carousel) ═══════════ */}
      <ScreenshotCarousel
        title="Every feature, mastered."
        subtitle="Tap, swipe, and explore — see exactly what your daily arsenal looks like."
      />

      {/* ═══════════ FEATURES GRID ═══════════ */}
      <section id="features" className="py-20 px-4 sm:px-6" style={{ borderTop: `1px solid ${HAIRLINE}` }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="text-xs font-semibold tracking-[0.2em] uppercase mb-3" style={{ color: TEXT_TERTIARY }}>
              Built for your evolution
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: TEXT_PRIMARY, letterSpacing: "-0.02em" }}>
              Everything you need to become <span style={{ color: ORANGE }}>limitless.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: BookOpen, title: "Manifestation OS", desc: "Powerful methods like 369, 555, scripting, visualization and more — all in one place." },
              { icon: Swords, title: "RPG Life System", desc: "Earn XP, level up, unlock abilities and evolve into your greatest version." },
              { icon: Brain, title: "AI Blueprint", desc: "AI builds a custom plan for your goals. Real steps. Real results." },
              { icon: LineChart, title: "Track. Reflect. Evolve.", desc: "Track habits, mindset, income and growth in one powerful dashboard." },
              { icon: Users, title: "Community of Warriors", desc: "Join a global tribe of high achievers on the same mission as you." },
            ].map((feature) => {
              const IconComp = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="p-6 rounded-2xl transition-colors"
                  style={{ backgroundColor: SURFACE, border: `1px solid ${HAIRLINE}` }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = HAIRLINE_STRONG; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = HAIRLINE; }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
                  >
                    <IconComp size={22} style={{ color: TEXT_PRIMARY }} />
                  </div>
                  <h3 className="text-lg font-bold mb-2" style={{ color: TEXT_PRIMARY }}>{feature.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: TEXT_SECONDARY }}>{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════ BEFORE vs AFTER ═══════════ */}
      <section className="py-20 px-4 sm:px-6" style={{ borderTop: `1px solid ${HAIRLINE}` }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-semibold tracking-wider uppercase mb-4"
                 style={{ backgroundColor: "rgba(255,69,58,0.08)", color: "#ff453a", border: "1px solid rgba(255,69,58,0.2)" }}>
              The honest truth
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3" style={{ color: TEXT_PRIMARY, letterSpacing: "-0.02em" }}>
              Where you are <span style={{ color: TEXT_TERTIARY }}>vs.</span> where you could be
            </h2>
            <p className="text-sm sm:text-base" style={{ color: TEXT_SECONDARY }}>
              Most people stay stuck because they only have willpower. We replace willpower with a system.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-2xl p-6 sm:p-8 space-y-4" style={{ backgroundColor: SURFACE, border: `1px solid ${HAIRLINE}` }}>
              <h3 className="text-base font-bold" style={{ color: "#ff453a" }}>Without Menifest OS</h3>
              <ul className="space-y-2.5 text-sm" style={{ color: TEXT_SECONDARY }}>
                {[
                  "Setting vague goals like 'get fit' or 'make money'",
                  "Waking up with no clear direction or daily plan",
                  "Motivating yourself every single day from zero",
                  "Guilt and shame when you skip a day, then quit completely",
                  "Tracking progress in 5 different apps that don't talk",
                  "Reading motivation quotes but never taking action",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <X size={14} className="mt-0.5 shrink-0" style={{ color: "#ff453a" }} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl p-6 sm:p-8 space-y-4" style={{ backgroundColor: SURFACE, border: `1px solid ${HAIRLINE}` }}>
              <h3 className="text-base font-bold" style={{ color: "#34c759" }}>With Menifest OS</h3>
              <ul className="space-y-2.5 text-sm" style={{ color: TEXT_PRIMARY }}>
                {[
                  "AI-generated 90-day blueprints with daily micro-actions",
                  "Wake up to a clear quest list designed by your future self",
                  "XP, streaks, and badges keep you locked in automatically",
                  "Streak freezes protect your momentum when life happens",
                  "All your goals, journal, vision board in one unified OS",
                  "Solo Dominion RPG turns your life into an addictive game",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 size={14} className="mt-0.5 shrink-0" style={{ color: "#34c759" }} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6" style={{ borderTop: `1px solid ${HAIRLINE}` }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="text-xs font-semibold tracking-[0.2em] uppercase mb-3" style={{ color: TEXT_TERTIARY }}>
              How it works
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: TEXT_PRIMARY, letterSpacing: "-0.02em" }}>
              Your journey. Your rules. <span style={{ color: ORANGE }}>Your rise.</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { num: "01", icon: Target, title: "Set your intent", desc: "Define your ultimate goal. AI creates your personalized transformation blueprint." },
              { num: "02", icon: FileText, title: "Take real action", desc: "Complete daily quests, build habits, and earn XP like a true warrior." },
              { num: "03", icon: TrendingUp, title: "Level up", desc: "Upgrade your player card, unlock new powers and become a higher version of yourself." },
              { num: "04", icon: Crown, title: "Manifest & ascend", desc: "See real-world results. Live your dream life. Inspire millions." },
            ].map((step) => {
              const IconComp = step.icon;
              return (
                <div
                  key={step.num}
                  className="p-6 rounded-2xl relative transition-colors"
                  style={{ backgroundColor: SURFACE, border: `1px solid ${HAIRLINE}` }}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm mb-5"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.06)",
                      color: TEXT_PRIMARY,
                      border: `1px solid ${HAIRLINE}`,
                    }}
                  >
                    {step.num}
                  </div>
                  <div className="mb-3" style={{ color: TEXT_PRIMARY }}>
                    <IconComp size={24} />
                  </div>
                  <h3 className="text-base font-bold mb-1.5" style={{ color: TEXT_PRIMARY }}>{step.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: TEXT_SECONDARY }}>{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════ PRICING (Life Reset style) ═══════════ */}
      <section id="pricing" className="py-20 px-4 sm:px-6 relative overflow-hidden" style={{ borderTop: `1px solid ${HAIRLINE}` }}>
        {/* Purple radial glow backdrop */}
        <div
          className="absolute inset-x-0 top-0 h-[600px] pointer-events-none -z-0"
          style={{
            background:
              "radial-gradient(ellipse at center top, rgba(124,58,237,0.20) 0%, rgba(124,58,237,0) 70%)",
          }}
        />
        <div className="max-w-2xl mx-auto relative z-10">
          {/* Headline */}
          <div className="text-center mb-8">
            <h2
              className="font-extrabold tracking-tight leading-[1.1]"
              style={{
                fontSize: "clamp(1.6rem, 5vw, 2.2rem)",
                color: TEXT_PRIMARY,
                letterSpacing: "-0.02em",
              }}
            >
              Invest in yourself and make an{" "}
              <span style={{ color: "#a78bfa" }}>epic life comeback</span> in 66 days.
            </h2>
            <p
              className="mt-4 text-[14px] sm:text-[15px] leading-relaxed max-w-md mx-auto"
              style={{ color: TEXT_SECONDARY }}
            >
              Get full access to Manifest OS — unlimited goal generation, AI-powered task planning, daily rituals and improvement tracker + much more!
            </p>
          </div>

          {/* Win Your Money Back card */}
          <div
            className="rounded-3xl p-5 sm:p-6 mb-6"
            style={{
              backgroundColor: "rgba(10,10,10,0.85)",
              border: `1px solid ${HAIRLINE}`,
              backdropFilter: "blur(20px)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            }}
          >
            <div className="flex items-start gap-3">
              <div
                className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: `1px solid ${HAIRLINE}`,
                }}
              >
                <Shield size={18} style={{ color: "#fff" }} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-extrabold text-[17px] sm:text-lg tracking-tight leading-tight" style={{ color: TEXT_PRIMARY }}>
                  Finish your reset — or it's free.
                </h3>
                <p className="text-[12.5px] sm:text-[13px] mt-1.5 leading-relaxed" style={{ color: TEXT_SECONDARY }}>
                  Complete 70% of your 66-day plan → 100% of your money back. You keep the subscription.
                </p>
                <div className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold" style={{ color: ORANGE }}>
                  How it works
                  <span>›</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2 pricing cards side-by-side */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* Monthly (purple, unselected) */}
            <button
              type="button"
              onClick={() => setShowAuth(true)}
              className="relative rounded-2xl p-4 text-left transition-all active:scale-[0.98]"
              style={{
                backgroundColor: "rgba(124,58,237,0.18)",
                border: "1px solid rgba(124,58,237,0.40)",
                minHeight: 150,
              }}
            >
              <div className="text-[12px] font-bold tracking-[0.15em] uppercase mb-3" style={{ color: "#a78bfa" }}>
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
                $4.99
              </div>
              <div className="text-[10px] font-semibold mt-0.5" style={{ color: "rgba(255,255,255,0.55)" }}>
                /mo
              </div>
            </button>

            {/* Yearly (WHITE, selected, SAVE 33%) */}
            <button
              type="button"
              onClick={() => setShowAuth(true)}
              className="relative rounded-2xl p-4 text-left transition-all active:scale-[0.98]"
              style={{
                backgroundColor: "#fff",
                border: "2px solid #fff",
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
              <div
                className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "#7c3aed" }}
              >
                <span style={{ color: "#fff", fontSize: 10, fontWeight: 800 }}>✓</span>
              </div>
              <div className="text-[12px] font-bold tracking-[0.15em] uppercase mb-3" style={{ color: "#7c3aed" }}>
                Yearly
              </div>
              <div className="text-[12px] line-through tabular-nums" style={{ color: "rgba(0,0,0,0.40)" }}>
                $4.99/mo
              </div>
              <div
                className="font-extrabold tracking-tight tabular-nums"
                style={{
                  color: "#0a0a0a",
                  fontSize: "clamp(20px, 5vw, 26px)",
                  letterSpacing: "-0.02em",
                }}
              >
                $39.99
              </div>
              <div className="text-[10px] font-semibold mt-0.5" style={{ color: "rgba(0,0,0,0.55)" }}>
                /year · billed annually
              </div>
            </button>
          </div>

          {/* Footer note */}
          <div className="flex items-center justify-center gap-1.5 text-center mb-6 px-4">
            <Shield size={11} style={{ color: "rgba(255,255,255,0.55)" }} />
            <span className="text-[11px] font-medium" style={{ color: "rgba(255,255,255,0.65)" }}>
              Win-your-money-back challenge applies to this purchase.
            </span>
          </div>

          {/* CTA */}
          <button
            onClick={() => setShowAuth(true)}
            className="w-full py-4 rounded-full font-extrabold text-[14px] tracking-wider uppercase flex items-center justify-center gap-2 active:scale-[0.98] transition"
            style={{
              background: "linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)",
              color: "#fff",
              boxShadow: "0 8px 32px rgba(124,58,237,0.4), 0 0 0 1px rgba(255,255,255,0.1) inset",
            }}
          >
            Kickstart My Journey
          </button>
        </div>
      </section>

      {/* ═══════════ RANKS ═══════════ */}
      <section id="ranks" className="py-20 px-4 sm:px-6" style={{ borderTop: `1px solid ${HAIRLINE}` }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="text-xs font-semibold tracking-[0.2em] uppercase mb-3" style={{ color: TEXT_TERTIARY }}>
              Your ascension path
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3" style={{ color: TEXT_PRIMARY, letterSpacing: "-0.02em" }}>
              Rise through the ranks
            </h2>
            <p className="text-base" style={{ color: TEXT_SECONDARY }}>Every rank permanently multiplies your manifestation power.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {RANKS.map((rank) => (
              <div
                key={rank.name}
                className="rounded-2xl p-5 flex flex-col gap-3 transition-colors"
                style={{ backgroundColor: SURFACE, border: `1px solid ${HAIRLINE}` }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = HAIRLINE_STRONG; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = HAIRLINE; }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                    style={{ backgroundColor: "rgba(255,255,255,0.06)", color: TEXT_SECONDARY }}
                  >
                    RANK {rank.level}
                  </span>
                  <span className="text-lg">{rank.badge}</span>
                </div>
                <div>
                  <div className="text-lg font-bold" style={{ color: TEXT_PRIMARY }}>{rank.name}</div>
                  <div className="text-xs font-semibold mt-0.5" style={{ color: ORANGE }}>{rank.power} power multiplier</div>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: TEXT_SECONDARY }}>{rank.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ REVIEWS ═══════════ */}
      <section id="reviews" className="py-20 px-4 sm:px-6" style={{ borderTop: `1px solid ${HAIRLINE}` }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="text-xs font-semibold tracking-[0.2em] uppercase mb-3" style={{ color: TEXT_TERTIARY }}>
              Loved by warriors worldwide
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: TEXT_PRIMARY, letterSpacing: "-0.02em" }}>
              Real people. Real transformations.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className="p-6 rounded-2xl flex flex-col justify-between"
                style={{ backgroundColor: SURFACE, border: `1px solid ${HAIRLINE}` }}
              >
                <div>
                  <div className="flex gap-1 mb-4" style={{ color: ORANGE }}>
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} fill="currentColor" />
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed mb-5" style={{ color: TEXT_PRIMARY }}>
                    "{t.quote}"
                  </p>
                </div>
                <div className="flex items-center gap-3 pt-4" style={{ borderTop: `1px solid ${HAIRLINE}` }}>
                  <img src={t.avatar} alt={t.name} className="w-9 h-9 rounded-full object-cover" style={{ border: `1px solid ${HAIRLINE}` }} />
                  <div>
                    <div className="text-sm font-semibold" style={{ color: TEXT_PRIMARY }}>{t.name}</div>
                    <div className="text-xs" style={{ color: TEXT_SECONDARY }}>{t.location}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ FAQ ═══════════ */}
      <section id="faq" className="py-20 px-4 sm:px-6" style={{ borderTop: `1px solid ${HAIRLINE}` }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-xs font-semibold tracking-[0.2em] uppercase mb-3" style={{ color: TEXT_TERTIARY }}>
              Got questions?
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: TEXT_PRIMARY, letterSpacing: "-0.02em" }}>
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="rounded-2xl overflow-hidden transition-colors"
                  style={{ backgroundColor: SURFACE, border: `1px solid ${HAIRLINE}` }}
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full p-5 text-left flex justify-between items-center font-semibold text-base transition-colors"
                    style={{ color: TEXT_PRIMARY }}
                  >
                    <span>{faq.q}</span>
                    <span className="text-xl font-bold" style={{ color: TEXT_SECONDARY }}>{isOpen ? "−" : "+"}</span>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-sm leading-relaxed" style={{ color: TEXT_SECONDARY, borderTop: `1px solid ${HAIRLINE}`, paddingTop: 12 }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════ FINAL CTA ═══════════ */}
      <section className="py-20 px-4 sm:px-6 relative overflow-hidden" style={{ borderTop: `1px solid ${HAIRLINE}` }}>
        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-6">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-semibold tracking-wider uppercase"
            style={{ backgroundColor: "rgba(255,159,10,0.08)", color: ORANGE, border: "1px solid rgba(255,159,10,0.2)" }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: ORANGE }}
            />
            Founder's pricing · ends soon
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-[1.05]" style={{ color: TEXT_PRIMARY, letterSpacing: "-0.02em" }}>
            Your next chapter starts<br />
            <span style={{ color: ORANGE }}>the moment you decide.</span>
          </h2>
          <p className="text-base sm:text-lg max-w-2xl mx-auto" style={{ color: TEXT_SECONDARY }}>
            Every day you wait is a day your future self doesn't get to live. Start today — for less than a coffee a day.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setShowAuth(true)}
              className="px-10 py-4 rounded-2xl font-bold text-base sm:text-lg flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
              style={{ backgroundColor: ORANGE, color: "#000" }}
            >
              <span>Claim your spot — ₹99/mo</span>
              <Zap size={18} style={{ color: "#000" }} />
            </button>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs pt-2" style={{ color: TEXT_SECONDARY }}>
            <span className="flex items-center gap-1.5"><CheckCircle2 size={13} style={{ color: "#34c759" }} /> 30-day refund</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 size={13} style={{ color: "#34c759" }} /> Cancel anytime</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 size={13} style={{ color: "#34c759" }} /> No hidden fees</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 size={13} style={{ color: "#34c759" }} /> Secure checkout</span>
          </div>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="pt-12 pb-8 text-xs" style={{ backgroundColor: "#030303", borderTop: `1px solid ${HAIRLINE}`, color: TEXT_SECONDARY }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            <div className="col-span-2">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: TEXT_PRIMARY }}>
                  <span className="text-xs font-bold" style={{ color: "#000" }}>M</span>
                </div>
                <span className="font-bold text-base" style={{ color: TEXT_PRIMARY }}>Menifest OS</span>
              </div>
              <p className="text-xs leading-relaxed max-w-sm" style={{ color: TEXT_TERTIARY }}>
                The manifestation RPG that turns your desires into real power. Align your mind, complete verified quests, and level up your reality.
              </p>
            </div>

            <div>
              <div className="font-semibold text-xs tracking-wider uppercase mb-3" style={{ color: TEXT_PRIMARY }}>Product</div>
              <ul className="space-y-2 text-xs">
                <li><a href="#features" className="transition-colors" style={{ color: TEXT_SECONDARY }}>Features</a></li>
                <li><a href="#ranks" className="transition-colors" style={{ color: TEXT_SECONDARY }}>Ranks</a></li>
                <li><a href="#pricing" className="transition-colors" style={{ color: TEXT_SECONDARY }}>Pricing</a></li>
                <li><a href="#faq" className="transition-colors" style={{ color: TEXT_SECONDARY }}>FAQ</a></li>
              </ul>
            </div>

            <div>
              <div className="font-semibold text-xs tracking-wider uppercase mb-3" style={{ color: TEXT_PRIMARY }}>Legal</div>
              <ul className="space-y-2 text-xs">
                <li><button onClick={() => setShowPrivacy(true)} className="transition-colors" style={{ color: TEXT_SECONDARY }}>Privacy Policy</button></li>
                <li><button onClick={() => setShowTerms(true)} className="transition-colors" style={{ color: TEXT_SECONDARY }}>Terms of Service</button></li>
                <li><button onClick={() => setShowContact(true)} className="transition-colors" style={{ color: TEXT_SECONDARY }}>Refund Policy</button></li>
              </ul>
            </div>

            <div>
              <div className="font-semibold text-xs tracking-wider uppercase mb-3" style={{ color: TEXT_PRIMARY }}>Support</div>
              <ul className="space-y-2 text-xs">
                <li><button onClick={() => setShowContact(true)} className="transition-colors" style={{ color: TEXT_SECONDARY }}>Help Center</button></li>
                <li><button onClick={() => setShowContact(true)} className="transition-colors" style={{ color: TEXT_SECONDARY }}>Contact Us</button></li>
                <li><a href="mailto:hello@menifestos.in" className="transition-colors" style={{ color: TEXT_SECONDARY }}>hello@menifestos.in</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-6 flex flex-col md:flex-row justify-between items-center text-xs gap-3" style={{ borderTop: `1px solid ${HAIRLINE}`, color: TEXT_TERTIARY }}>
            <div>© {new Date().getFullYear()} Menifest OS. All rights reserved.</div>
            <div>Made for those who refuse to stay ordinary.</div>
          </div>
        </div>
      </footer>

    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, X, Loader2, Star, AlertTriangle, Shield, UserCheck, Copy, Check,
  BookOpen, Swords, Brain, LineChart, Users, Target, FileText, TrendingUp, Crown,
  ChevronLeft, ChevronRight, Zap, Sparkles, Lock, Play, HelpCircle, Mail, Send, CheckCircle2, Clock, Flame, Menu
} from 'lucide-react';

import shadowMonarchImg from '../assets/images/anime_shadow_monarch_1785176449409.jpg';
import shadowKnightImg from '../assets/images/anime_shadow_knight_1785176768012.jpg';
import redWarriorImg from '../assets/images/anime_red_warrior_1785177142520.jpg';
import traineeWarriorImg from '../assets/images/anime_trainee_warrior_1785176432904.jpg';
import heroArtworkImg from '../assets/images/anime_hero_artwork_1785263718355.jpg';
import shadowMonarchCrowsImg from '../assets/images/shadow_monarch_crows_1785330753705.jpg';

interface LandingPageProps {
  onSignIn: () => void;
  onDemoSignIn?: (asAdmin?: boolean) => void;
  authError?: string | null;
  clearAuthError?: () => void;
}

const RANKS = [
  { name: "SEEKER", level: "01", power: "1×", desc: "Your first desire takes form", badge: "✦", image: traineeWarriorImg },
  { name: "AWAKENED", level: "10", power: "5×", desc: "Manifestation accelerates", badge: "✧", image: redWarriorImg },
  { name: "ELITE", level: "25", power: "15×", desc: "Reality begins to bend", badge: "❖", image: shadowKnightImg },
  { name: "MONARCH", level: "40", power: "35×", desc: "You command probability", badge: "🔱", image: shadowMonarchImg },
  { name: "SOVEREIGN", level: "50", power: "100×", desc: "You become the system", badge: "👑", image: "/images/intro-ascend.jpg" },
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
    <div className="min-h-screen bg-[#050505] text-white font-sans overflow-x-hidden antialiased selection:bg-amber-500 selection:text-black">
      
      {/* AUTH MODAL */}
      {showAuth && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl animate-fade-in">
          <div className="relative w-full max-w-md bg-[#0a0a0d] border border-amber-500/30 rounded-3xl p-8 sm:p-10 shadow-[0_0_60px_rgba(234,179,8,0.25)]">
            <button 
              onClick={() => {
                setShowAuth(false);
                setLocalAuthError(null);
                clearAuthError?.();
              }} 
              className="absolute top-6 right-6 text-white/40 hover:text-white transition"
            >
              <X size={20} />
            </button>
            <div className="text-center">
              <div className="mx-auto w-14 h-14 mb-5 rounded-2xl bg-gradient-to-br from-amber-500 via-yellow-500 to-amber-600 border border-amber-400/50 flex items-center justify-center shadow-[0_0_25px_rgba(234,179,8,0.4)]">
                <span className="text-xl font-bold tracking-[-1px] font-luxury-title text-black">MO</span>
              </div>
              <h2 className="text-3xl font-luxury-title font-bold tracking-tight mb-2 text-gradient-gold">
                Enter Menifest OS
              </h2>
              <p className="text-amber-100/70 text-sm mb-6">Level up your reality. Align your true power.</p>

              {activeError && (
                <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs text-left leading-relaxed space-y-3">
                  <div className="font-semibold text-amber-400 flex items-center gap-2">
                    <AlertTriangle size={16} className="shrink-0" /> Firebase Authorized Domain Notice
                  </div>
                  <p>{activeError}</p>
                  <p className="text-white/70">
                    To enable live Google login, add this domain under <strong>Firebase Console &gt; Authentication &gt; Settings &gt; Authorized domains</strong>:
                  </p>
                  <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-black/70 border border-amber-500/30">
                    <code className="text-amber-300 font-mono text-[11px] truncate select-all">{currentHostname}</code>
                    <button
                      type="button"
                      onClick={handleCopyDomain}
                      className="shrink-0 px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-semibold flex items-center gap-1 transition"
                    >
                      {copiedDomain ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy Domain</>}
                    </button>
                  </div>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        onDemoSignIn?.(false);
                        setShowAuth(false);
                      }}
                      className="w-full py-2.5 rounded-lg bg-amber-500 text-black font-semibold text-xs flex items-center justify-center gap-2 hover:bg-amber-400 transition"
                    >
                      <UserCheck size={14} /> Continue with Demo Account
                    </button>
                  </div>
                </div>
              )}

              <button 
                onClick={handleGoogleSignIn} 
                disabled={isAuthenticating}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 hover:from-amber-400 hover:to-yellow-400 text-black font-bold flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(234,179,8,0.4)] active:scale-[0.985] transition-all"
              >
                {isAuthenticating ? <Loader2 className="animate-spin" size={18} /> : <>Continue with Google <ArrowRight size={17} /></>}
              </button>

              {onDemoSignIn && !activeError && (
                <div className="mt-4 pt-4 border-t border-amber-500/15">
                  <button
                    type="button"
                    onClick={() => {
                      onDemoSignIn(false);
                      setShowAuth(false);
                    }}
                    className="w-full text-xs text-amber-300/80 hover:text-white transition py-1 flex items-center justify-center gap-1.5"
                  >
                    <UserCheck size={13} /> Demo Sign In (Instant Access)
                  </button>
                </div>
              )}

              <p className="mt-4 text-[10px] tracking-[2px] text-amber-300/40 uppercase font-mono">NO FREE TRIAL • STARTS AT ₹99/MONTH</p>
            </div>
          </div>
        </div>
      )}

      {/* PRIVACY POLICY MODAL */}
      {showPrivacy && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg">
          <div className="bg-[#0a0a0d] border border-amber-500/30 rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-auto p-8 text-left">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-luxury-title font-bold text-white">Privacy Policy</h3>
              <button onClick={() => setShowPrivacy(false)}><X size={22} className="text-white/60 hover:text-white" /></button>
            </div>
            <div className="space-y-4 text-sm text-amber-100/80 leading-relaxed">
              <p>Menifest OS ("we", "us", or "our") respects your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.</p>
              
              <p><strong>Information We Collect:</strong><br />
              • Personal information (name, email, profile details) when you sign up.<br />
              • Payment information processed securely through Stripe.<br />
              • Quest proof (photos, text) that you upload for AI verification.<br />
              • Usage data to improve the platform experience.</p>
              
              <p><strong>How We Use Your Information:</strong><br />
              We use your data to provide the service, verify your actions using Gemini AI, process payments, send important updates, and improve the platform experience.</p>
              
              <p><strong>Data Sharing:</strong><br />
              We do not sell your personal data. We share limited information with trusted third parties (Stripe for payments, Google Gemini for verification).</p>
              
              <p><strong>Your Rights:</strong><br />
              You can request access, correction, or deletion of your data at any time by emailing hello@menifestos.in.</p>
            </div>
            <button onClick={() => setShowPrivacy(false)} className="mt-6 w-full py-3 border border-amber-500/30 rounded-xl text-amber-200 hover:bg-amber-500/10 transition">Close</button>
          </div>
        </div>
      )}

      {/* TERMS OF SERVICE MODAL */}
      {showTerms && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg">
          <div className="bg-[#0a0a0d] border border-amber-500/30 rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-auto p-8 text-left">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-luxury-title font-bold text-white">Terms of Service</h3>
              <button onClick={() => setShowTerms(false)}><X size={22} className="text-white/60 hover:text-white" /></button>
            </div>
            <div className="space-y-4 text-sm text-amber-100/80 leading-relaxed">
              <p><strong>1. Acceptance of Terms</strong><br />By accessing or using Menifest OS, you agree to be bound by these Terms of Service.</p>
              <p><strong>2. Description of Service</strong><br />Menifest OS is a manifestation and personal development RPG that combines AI verification with a leveling system.</p>
              <p><strong>3. User Responsibilities</strong><br />You must provide accurate information and authentic proof for daily quests.</p>
              <p><strong>4. Subscription & Billing</strong><br />Plans start at ₹99/month. No free trial is offered.</p>
            </div>
            <button onClick={() => setShowTerms(false)} className="mt-6 w-full py-3 border border-amber-500/30 rounded-xl text-amber-200 hover:bg-amber-500/10 transition">Close</button>
          </div>
        </div>
      )}

      {/* CONTACT MODAL */}
      {showContact && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg">
          <div className="bg-[#0a0a0d] border border-amber-500/30 rounded-3xl max-w-md w-full p-8 text-left">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-luxury-title font-bold text-white">Contact Us</h3>
              <button onClick={() => setShowContact(false)}><X size={22} className="text-white/60 hover:text-white" /></button>
            </div>
            <div className="space-y-4 text-sm text-amber-100/80">
              <div>
                <div className="text-amber-400 text-xs tracking-wider font-mono">EMAIL US</div>
                <a href="mailto:hello@menifestos.in" className="text-white hover:underline text-base font-semibold">hello@menifestos.in</a>
              </div>
              <div>
                <div className="text-amber-400 text-xs tracking-wider font-mono">SUPPORT</div>
                <div>We usually reply within 24 hours on business days.</div>
              </div>
            </div>
            <button onClick={() => setShowContact(false)} className="mt-6 w-full py-3 border border-amber-500/30 rounded-xl text-amber-200 hover:bg-amber-500/10 transition">Close</button>
          </div>
        </div>
      )}

      {/* NAVBAR */}
      <header className="sticky top-0 z-[100] bg-[#050505]/95 backdrop-blur-2xl border-b border-amber-500/20 shadow-[0_4px_30px_rgba(0,0,0,0.8)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          
          {/* Logo */}
          <a href="#hero" className="flex items-center gap-2.5 sm:gap-3 group shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-amber-500 via-yellow-500 to-amber-600 border border-amber-400/60 flex items-center justify-center shadow-[0_0_15px_rgba(234,179,8,0.4)] group-hover:scale-105 transition-transform">
              <span className="text-black font-luxury-title font-bold text-sm sm:text-base tracking-tighter">MO</span>
            </div>
            <span className="font-luxury-title font-bold text-lg sm:text-xl tracking-tight text-white group-hover:text-amber-300 transition-colors">
              Menifest OS
            </span>
          </a>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-amber-100/70">
            <a href="#hero" className="hover:text-amber-300 transition-colors">Home</a>
            <a href="#features" className="hover:text-amber-300 transition-colors">Features</a>
            <a href="#ranks" className="hover:text-amber-300 transition-colors">Ranks</a>
            <a href="#reviews" className="hover:text-amber-300 transition-colors">Reviews</a>
            <a href="#pricing" className="hover:text-amber-300 transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-amber-300 transition-colors">FAQ</a>
          </nav>

          {/* Nav Buttons & Mobile Menu Toggle */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button 
              onClick={() => setShowAuth(true)}
              className="px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full border border-amber-500/30 text-xs sm:text-sm font-medium text-amber-200 hover:bg-amber-500/15 hover:border-amber-500/50 transition-all shrink-0"
            >
              Log in
            </button>
            <button 
              onClick={() => setShowAuth(true)}
              className="hidden sm:inline-flex px-5 sm:px-6 py-2 sm:py-2.5 rounded-full bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 hover:from-amber-400 hover:to-yellow-400 text-black text-xs sm:text-sm font-bold shadow-[0_0_25px_rgba(234,179,8,0.4)] active:scale-95 transition-all shrink-0"
            >
              Start Transformation
            </button>

            {/* Mobile Hamburger Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:text-white hover:bg-amber-500/20 transition-all"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Navigation Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#0a0a0d]/98 border-b border-amber-500/30 px-6 py-5 space-y-4 shadow-[0_15px_30px_rgba(0,0,0,0.9)]">
            <nav className="flex flex-col gap-3.5 text-base font-medium text-amber-100/80">
              <a 
                href="#hero" 
                onClick={() => setMobileMenuOpen(false)} 
                className="py-1.5 hover:text-amber-300 transition-colors flex items-center justify-between border-b border-white/5"
              >
                <span>Home</span>
                <ChevronRight size={16} className="text-amber-500/50" />
              </a>
              <a 
                href="#features" 
                onClick={() => setMobileMenuOpen(false)} 
                className="py-1.5 hover:text-amber-300 transition-colors flex items-center justify-between border-b border-white/5"
              >
                <span>Features</span>
                <ChevronRight size={16} className="text-amber-500/50" />
              </a>
              <a 
                href="#ranks" 
                onClick={() => setMobileMenuOpen(false)} 
                className="py-1.5 hover:text-amber-300 transition-colors flex items-center justify-between border-b border-white/5"
              >
                <span>Ranks</span>
                <ChevronRight size={16} className="text-amber-500/50" />
              </a>
              <a 
                href="#reviews" 
                onClick={() => setMobileMenuOpen(false)} 
                className="py-1.5 hover:text-amber-300 transition-colors flex items-center justify-between border-b border-white/5"
              >
                <span>Reviews</span>
                <ChevronRight size={16} className="text-amber-500/50" />
              </a>
              <a 
                href="#pricing" 
                onClick={() => setMobileMenuOpen(false)} 
                className="py-1.5 hover:text-amber-300 transition-colors flex items-center justify-between border-b border-white/5"
              >
                <span>Pricing</span>
                <ChevronRight size={16} className="text-amber-500/50" />
              </a>
              <a 
                href="#faq" 
                onClick={() => setMobileMenuOpen(false)} 
                className="py-1.5 hover:text-amber-300 transition-colors flex items-center justify-between"
              >
                <span>FAQ</span>
                <ChevronRight size={16} className="text-amber-500/50" />
              </a>
            </nav>

            <div className="pt-3 border-t border-amber-500/20">
              <button 
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowAuth(true);
                }}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 text-black font-luxury-title font-bold text-sm flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(234,179,8,0.4)] active:scale-98 transition-all"
              >
                <span>Begin Your Ascension</span>
                <Zap size={16} className="fill-black text-black" />
              </button>
            </div>
          </div>
        )}
      </header>

      {/* HERO SECTION WITH BACKGROUND IMAGE */}
      <section id="hero" className="relative pt-12 pb-24 md:pt-16 md:pb-32 px-6 overflow-hidden">
        
        {/* Full Hero Background Image with Smokey Golden Lightning Aura Overlay */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          {/* Main Background Image */}
          <img 
            src={shadowMonarchImg} 
            alt="Hero Background Warrior" 
            className="w-full h-full object-cover object-right-top opacity-35 filter contrast-125 saturate-125 scale-105"
          />
          {/* Dark Gradients to ensure perfect contrast and legibility */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/90 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-[#050505]/80" />
          <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-amber-500/20 blur-[150px] rounded-full" />
          <div className="absolute bottom-10 left-10 w-[500px] h-[500px] bg-emerald-500/10 blur-[160px] rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 items-center relative z-10">
          
          {/* Hero Left Content */}
          <div className="lg:col-span-7 text-left">
            
            {/* Solo Level up Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-950/60 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold tracking-wider uppercase mb-6 shadow-[0_0_20px_rgba(234,179,8,0.2)]">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              SOLO LEVELING × MANIFESTATION
            </div>

            {/* Headline with Gold Shimmer */}
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-luxury-title font-semibold tracking-tight leading-[1.08] mb-6 text-white">
              Become The Main Character. <br />
              <span className="text-gradient-gold drop-shadow-[0_0_35px_rgba(234,179,8,0.5)]">
                Level Up Your Reality.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-amber-100/90 font-luxury-serif font-semibold leading-relaxed max-w-2xl mb-8">
              The AI-powered life system that transforms your goals into daily quests,
              your habits into XP, and your identity into your greatest asset.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-10">
              <button 
                onClick={() => setShowAuth(true)}
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-black font-luxury-title font-bold text-base flex items-center justify-center gap-3 shadow-[0_0_35px_rgba(234,179,8,0.5)] active:scale-[0.98] transition-all group"
              >
                <span>Begin Your Ascension</span>
                <Zap size={18} className="fill-black text-black group-hover:scale-125 transition-transform" />
              </button>

              <a 
                href="#how-it-works"
                className="px-8 py-4 rounded-2xl bg-black/60 hover:bg-emerald-950/40 border border-emerald-500/50 text-emerald-300 font-luxury-title font-semibold text-base flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(34,197,94,0.15)]"
              >
                <Play size={16} className="fill-emerald-400 text-emerald-400" />
                <span>Watch Your Evolution</span>
              </a>
            </div>

            {/* Micro Metrics Row */}
            <div className="pt-6 border-t border-amber-500/15 flex flex-wrap items-center gap-6 text-xs sm:text-sm text-amber-200/80 font-medium">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-amber-400" />
                <span>4,872+ Warriors Rising</span>
              </div>
              <div className="flex items-center gap-2">
                <Brain size={16} className="text-amber-400" />
                <span>AI-Powered Blueprints</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-amber-400" />
                <span>No Fluff. Only Transformation.</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-amber-400" />
                <span>Trusted by Achievers Worldwide</span>
              </div>
            </div>
          </div>

          {/* Hero Right Visual & Player Status Card */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              
              {/* Main Character Image with Gold Lighting Aura Frame */}
              <div className="relative rounded-3xl overflow-hidden border border-amber-500/40 bg-[#0a0a0d] shadow-[0_0_80px_rgba(234,179,8,0.35)] group">
                <img 
                  src={shadowMonarchCrowsImg} 
                  alt="Solo Leveling Shadow Monarch"
                  className="w-full h-[520px] object-cover object-center opacity-90 hover:scale-105 transition-transform duration-700" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/20 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-amber-900/20 via-transparent to-amber-900/20 pointer-events-none" />
                
                {/* Floating Solo Leveling Monarch Wings Crest */}
                <div className="absolute top-6 right-6 p-3 rounded-2xl bg-black/80 backdrop-blur-md border border-amber-500/50 shadow-[0_0_25px_rgba(234,179,8,0.5)]">
                  <Crown className="w-8 h-8 text-amber-400 animate-pulse" />
                </div>

                {/* Floating Player Status HUD */}
                <div className="absolute bottom-6 left-6 right-6 bg-[#0a0a0d]/95 backdrop-blur-xl border border-amber-500/40 rounded-2xl p-5 shadow-[0_0_35px_rgba(0,0,0,0.9)]">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="text-[10px] font-mono tracking-widest text-amber-400 uppercase font-bold">PLAYER STATUS</div>
                      <div className="text-2xl font-luxury-title font-bold text-white flex items-center gap-2">
                        LEVEL 27
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-sans font-semibold">
                          ASCENDED
                        </span>
                      </div>
                    </div>

                    {/* Rank Badge Emblem */}
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 p-0.5 shadow-[0_0_20px_rgba(234,179,8,0.6)]">
                      <div className="w-full h-full bg-[#0a0a0d] rounded-[10px] flex items-center justify-center text-amber-300">
                        <svg className="w-7 h-7 fill-amber-400 text-amber-400 filter drop-shadow-[0_0_8px_rgba(234,179,8,0.8)]" viewBox="0 0 24 24">
                          <path d="M12 2L15 8L21 9L16.5 13.5L18 19.5L12 16L6 19.5L7.5 13.5L3 9L9 8L12 2Z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* XP Bar */}
                  <div>
                    <div className="flex justify-between text-[11px] font-mono text-amber-200/80 mb-1.5">
                      <span>XP PROGRESS</span>
                      <span>12,450 / 15,000 XP</span>
                    </div>
                    <div className="h-2.5 w-full bg-amber-950/80 rounded-full overflow-hidden p-0.5 border border-amber-500/30">
                      <div className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 rounded-full shadow-[0_0_12px_rgba(234,179,8,0.9)]" style={{ width: '83%' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES GRID SECTION */}
      <section id="features" className="py-24 px-6 border-t border-amber-500/15 bg-gradient-to-b from-[#050505] via-[#0a0a0d] to-[#050505]">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="text-xs font-mono tracking-[4px] text-amber-400 uppercase font-semibold mb-3">
              BUILT FOR YOUR EVOLUTION
            </div>
            <h2 className="text-3xl sm:text-5xl font-luxury-title font-bold text-white tracking-tight leading-tight">
              Everything You Need to Become <span className="text-gradient-green">Limitless.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Feature 1 */}
            <div className="p-8 rounded-3xl bg-[#0a0a0d] border border-amber-500/20 hover:border-amber-500/50 hover:shadow-[0_0_30px_rgba(234,179,8,0.2)] transition-all group">
              <div className="w-14 h-14 rounded-2xl bg-amber-950/50 border border-amber-500/40 flex items-center justify-center text-amber-400 mb-6 group-hover:scale-110 transition-transform">
                <BookOpen size={26} />
              </div>
              <h3 className="text-xl font-luxury-title font-bold text-white mb-3">Manifestation OS</h3>
              <p className="text-amber-100/60 text-sm leading-relaxed">
                Powerful methods like 369, 555, scripting, visualization and more — all in one place.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-3xl bg-[#0a0a0d] border border-amber-500/20 hover:border-amber-500/50 hover:shadow-[0_0_30px_rgba(234,179,8,0.2)] transition-all group">
              <div className="w-14 h-14 rounded-2xl bg-amber-950/50 border border-amber-500/40 flex items-center justify-center text-amber-400 mb-6 group-hover:scale-110 transition-transform">
                <Swords size={26} />
              </div>
              <h3 className="text-xl font-luxury-title font-bold text-white mb-3">RPG Life System</h3>
              <p className="text-amber-100/60 text-sm leading-relaxed">
                Earn XP, level up, unlock abilities and evolve into your greatest version.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 rounded-3xl bg-[#0a0a0d] border border-emerald-500/20 hover:border-emerald-500/50 hover:shadow-[0_0_30px_rgba(34,197,94,0.2)] transition-all group">
              <div className="w-14 h-14 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
                <Brain size={26} />
              </div>
              <h3 className="text-xl font-luxury-title font-bold text-white mb-3">AI Blueprint</h3>
              <p className="text-amber-100/60 text-sm leading-relaxed">
                AI builds a custom plan for your goals. Real steps. Real results.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-8 rounded-3xl bg-[#0a0a0d] border border-amber-500/20 hover:border-amber-500/50 hover:shadow-[0_0_30px_rgba(234,179,8,0.2)] transition-all group">
              <div className="w-14 h-14 rounded-2xl bg-amber-950/50 border border-amber-500/40 flex items-center justify-center text-amber-400 mb-6 group-hover:scale-110 transition-transform">
                <LineChart size={26} />
              </div>
              <h3 className="text-xl font-luxury-title font-bold text-white mb-3">Track. Reflect. Evolve.</h3>
              <p className="text-amber-100/60 text-sm leading-relaxed">
                Track habits, mindset, income and growth in one powerful dashboard.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-8 rounded-3xl bg-[#0a0a0d] border border-emerald-500/20 hover:border-emerald-500/50 hover:shadow-[0_0_30px_rgba(34,197,94,0.2)] transition-all group md:col-span-2 lg:col-span-1">
              <div className="w-14 h-14 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
                <Users size={26} />
              </div>
              <h3 className="text-xl font-luxury-title font-bold text-white mb-3">Community of Warriors</h3>
              <p className="text-amber-100/60 text-sm leading-relaxed">
                Join a global tribe of high achievers on the same mission as you.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* HOW IT WORKS / STEP PROCESS SECTION */}
      <section id="how-it-works" className="py-24 px-6 border-t border-amber-500/15">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="text-xs font-mono tracking-[4px] text-amber-400 uppercase font-semibold mb-3">
              HOW IT WORKS
            </div>
            <h2 className="text-3xl sm:text-5xl font-luxury-title font-bold text-white tracking-tight">
              Your Journey. Your Rules. <span className="text-gradient-green">Your Rise.</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            
            {/* Step 1 */}
            <div className="p-8 rounded-3xl bg-[#0a0a0d] border border-emerald-500/30 relative hover:border-emerald-500 transition-all">
              <div className="w-10 h-10 rounded-full border border-emerald-400 text-emerald-400 font-mono font-bold flex items-center justify-center text-sm mb-6 shadow-[0_0_15px_rgba(34,197,94,0.4)]">
                01
              </div>
              <div className="text-emerald-400 mb-4"><Target size={28} /></div>
              <h3 className="text-lg font-luxury-title font-bold text-white mb-2">Set Your Intent</h3>
              <p className="text-amber-100/60 text-sm leading-relaxed">
                Define your ultimate goal. AI creates your personalized transformation blueprint.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-8 rounded-3xl bg-[#0a0a0d] border border-emerald-500/30 relative hover:border-emerald-500 transition-all">
              <div className="w-10 h-10 rounded-full border border-emerald-400 text-emerald-400 font-mono font-bold flex items-center justify-center text-sm mb-6 shadow-[0_0_15px_rgba(34,197,94,0.4)]">
                02
              </div>
              <div className="text-emerald-400 mb-4"><FileText size={28} /></div>
              <h3 className="text-lg font-luxury-title font-bold text-white mb-2">Take Real Action</h3>
              <p className="text-amber-100/60 text-sm leading-relaxed">
                Complete daily quests, build habits, and earn XP like a true warrior.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-8 rounded-3xl bg-[#0a0a0d] border border-emerald-500/30 relative hover:border-emerald-500 transition-all">
              <div className="w-10 h-10 rounded-full border border-emerald-400 text-emerald-400 font-mono font-bold flex items-center justify-center text-sm mb-6 shadow-[0_0_15px_rgba(34,197,94,0.4)]">
                03
              </div>
              <div className="text-emerald-400 mb-4"><TrendingUp size={28} /></div>
              <h3 className="text-lg font-luxury-title font-bold text-white mb-2">Level Up</h3>
              <p className="text-amber-100/60 text-sm leading-relaxed">
                Upgrade your player card, unlock new powers and become a higher version of yourself.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-8 rounded-3xl bg-[#0a0a0d] border border-emerald-500/30 relative hover:border-emerald-500 transition-all">
              <div className="w-10 h-10 rounded-full border border-emerald-400 text-emerald-400 font-mono font-bold flex items-center justify-center text-sm mb-6 shadow-[0_0_15px_rgba(34,197,94,0.4)]">
                04
              </div>
              <div className="text-amber-400 mb-4"><Crown size={28} /></div>
              <h3 className="text-lg font-luxury-title font-bold text-white mb-2">Manifest & Ascend</h3>
              <p className="text-amber-100/60 text-sm leading-relaxed">
                See real-world results. Live your dream life. Inspire millions.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* NEW SECTION FROM REFERENCE IMAGE: "THIS IS YOUR NEW IDENTITY" PLAYER STATS CARD */}
      <section className="py-24 px-6 border-t border-amber-500/15 bg-gradient-to-b from-[#050505] via-[#0d0d12] to-[#050505]">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="text-xs font-mono tracking-[4px] text-amber-400 uppercase font-semibold mb-3">
              THIS ISN'T JUST PROGRESS.
            </div>
            <h2 className="text-3xl sm:text-5xl font-luxury-title font-bold text-white tracking-tight mb-4">
              This is Your New Identity.
            </h2>
            <p className="text-amber-100/70 text-base">
              Every action counts. Every habit earns you XP. Every level unlocks a stronger you.
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Player Character Card */}
            <div className="lg:col-span-5 relative">
              <div className="rounded-3xl bg-[#0a0a0d] border-2 border-amber-500/40 p-6 shadow-[0_0_60px_rgba(234,179,8,0.25)] relative overflow-hidden group">
                
                {/* Background Warrior Graphic */}
                <div className="absolute inset-0 z-0">
                  <img src={shadowKnightImg} alt="Character" className="w-full h-full object-cover object-top opacity-40 mix-blend-luminosity group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0d] via-[#0a0a0d]/70 to-transparent" />
                </div>

                <div className="relative z-10 space-y-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-white text-xl">ANURAG</div>
                      <div className="text-xs text-amber-400 font-mono">The Dream Chaser</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-luxury-title font-bold text-amber-400">LEVEL 27</div>
                      <div className="text-[10px] text-emerald-400 font-mono font-bold">ASCENDED</div>
                    </div>
                  </div>

                  {/* XP Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono text-amber-200/80">
                      <span>XP PROGRESS</span>
                      <span>12,450 / 15,000 XP</span>
                    </div>
                    <div className="h-2 w-full bg-black/80 rounded-full overflow-hidden p-0.5 border border-amber-500/30">
                      <div className="h-full bg-amber-400 rounded-full" style={{ width: '83%' }} />
                    </div>
                  </div>

                  {/* Character Stats Breakdown */}
                  <div className="space-y-2.5 pt-3 border-t border-amber-500/20 text-xs font-mono">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-amber-200/80">🧠 Mindset</span>
                      <span className="text-amber-400 font-bold">92</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-amber-200/80">🛡️ Discipline</span>
                      <span className="text-amber-400 font-bold">95</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-amber-200/80">⚡ Action</span>
                      <span className="text-amber-400 font-bold">90</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-amber-200/80">🔥 Energy</span>
                      <span className="text-amber-400 font-bold">88</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-amber-200/80">✨ Faith</span>
                      <span className="text-amber-400 font-bold">93</span>
                    </div>
                  </div>

                  {/* Current Rank Badge Footer */}
                  <div className="pt-4 border-t border-amber-500/20 flex items-center justify-between">
                    <div className="text-[10px] font-mono text-amber-300/60 uppercase">CURRENT RANK</div>
                    <div className="flex items-center gap-2 text-amber-400 font-bold font-luxury-title">
                      <span>❖ GOLD III</span>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* Right Stats Grid & Testimonial Box */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* 4 Stat Boxes */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-[#0a0a0d] border border-amber-500/20 text-center">
                  <div className="text-3xl font-luxury-title font-extrabold text-amber-400 mb-1">128</div>
                  <div className="text-xs text-amber-200/60">Quests Completed</div>
                </div>
                <div className="p-5 rounded-2xl bg-[#0a0a0d] border border-amber-500/20 text-center">
                  <div className="text-3xl font-luxury-title font-extrabold text-amber-400 mb-1">47</div>
                  <div className="text-xs text-amber-200/60">Day Streak</div>
                </div>
                <div className="p-5 rounded-2xl bg-[#0a0a0d] border border-amber-500/20 text-center">
                  <div className="text-3xl font-luxury-title font-extrabold text-amber-400 mb-1">16</div>
                  <div className="text-xs text-amber-200/60">Powers Unlocked</div>
                </div>
                <div className="p-5 rounded-2xl bg-[#0a0a0d] border border-amber-500/20 text-center">
                  <div className="text-3xl font-luxury-title font-extrabold text-emerald-400 mb-1">98%</div>
                  <div className="text-xs text-amber-200/60">Transformation Rate</div>
                </div>
              </div>

              {/* Highlight Quote Box */}
              <div className="p-8 rounded-3xl bg-[#0a0a0d] border border-amber-500/30 relative shadow-[0_0_30px_rgba(0,0,0,0.8)]">
                <p className="text-base sm:text-lg text-amber-100 font-luxury-serif italic leading-relaxed mb-6">
                  “The system changed my mindset, habits and bank balance. I'm not the same person anymore.”
                </p>
                <div className="flex items-center gap-3">
                  <img 
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80" 
                    alt="Rohit T." 
                    className="w-10 h-10 rounded-full object-cover border border-amber-500/40" 
                  />
                  <div>
                    <div className="font-bold text-white text-sm">Rohit T.</div>
                    <div className="text-xs text-amber-300/60">Delhi, India</div>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* PREMIUM MEMBERSHIP PRICING SECTION */}
      <section id="pricing" className="py-24 px-6 border-t border-amber-500/15 bg-[#050505] relative overflow-hidden">
        {/* Background ambient glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-amber-500/10 blur-[150px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-emerald-500/10 blur-[130px] rounded-full pointer-events-none" />

        <div className="max-w-4xl mx-auto relative z-10 text-center">
          
          {/* Section Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-950/60 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold tracking-[3px] uppercase mb-6 shadow-[0_0_20px_rgba(234,179,8,0.2)]">
            <Crown size={14} className="text-amber-400" />
            MEMBERSHIP
          </div>

          {/* Headline */}
          <h2 className="text-3xl sm:text-5xl font-luxury-title font-bold text-white tracking-tight mb-4 leading-tight">
            You're Not Buying An App.<br />
            <span className="text-gradient-gold drop-shadow-[0_0_35px_rgba(234,179,8,0.5)]">
              You're Unlocking Your Next Identity.
            </span>
          </h2>

          {/* Subheadline */}
          <p className="text-amber-100/70 text-base sm:text-lg max-w-2xl mx-auto mb-14 font-light leading-relaxed">
            Every day without a system keeps your future self locked. Start your evolution today.
          </p>

          {/* Single Centered Pricing Card */}
          <div className="max-w-md mx-auto relative rounded-3xl bg-[#0a0a0d]/90 backdrop-blur-2xl border-2 border-amber-500/50 shadow-[0_0_60px_rgba(234,179,8,0.25)] p-8 sm:p-10 hover:border-amber-400 hover:shadow-[0_0_80px_rgba(234,179,8,0.35)] transition-all duration-500 group text-left">
            
            {/* Most Popular Badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-5 py-1 rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-black text-xs font-mono font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(234,179,8,0.6)] flex items-center gap-1.5">
              <Sparkles size={13} className="fill-black text-black" />
              <span>MOST POPULAR</span>
            </div>

            {/* Card Header */}
            <div className="text-center pb-6 border-b border-amber-500/20">
              <h3 className="text-2xl font-luxury-title font-bold text-white mb-2">Hunter Membership</h3>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-5xl sm:text-6xl font-luxury-title font-extrabold text-white tracking-tight">₹99</span>
                <span className="text-amber-300/70 text-sm font-mono">/month</span>
              </div>
            </div>

            {/* Includes Checklist */}
            <div className="py-6 space-y-3.5">
              <div className="text-xs font-mono tracking-wider text-amber-400 font-semibold uppercase mb-2">Includes:</div>
              <div className="flex items-center gap-3 text-sm text-amber-100/90">
                <CheckCircle2 size={18} className="text-emerald-400 shrink-0 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                <span>AI-Powered Transformation Blueprint</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-amber-100/90">
                <CheckCircle2 size={18} className="text-emerald-400 shrink-0 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                <span>Solo Leveling RPG Progression</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-amber-100/90">
                <CheckCircle2 size={18} className="text-emerald-400 shrink-0 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                <span>Daily Quests & XP System</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-amber-100/90">
                <CheckCircle2 size={18} className="text-emerald-400 shrink-0 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                <span>Manifestation Journal</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-amber-100/90">
                <CheckCircle2 size={18} className="text-emerald-400 shrink-0 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                <span>Identity Evolution Tracking</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-amber-100/90">
                <CheckCircle2 size={18} className="text-emerald-400 shrink-0 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                <span>Progress Analytics</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-amber-100/90">
                <CheckCircle2 size={18} className="text-emerald-400 shrink-0 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                <span>Future Updates</span>
              </div>
            </div>

            {/* Primary CTA */}
            <div className="pt-2">
              <button 
                onClick={() => setShowAuth(true)}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-black font-luxury-title font-bold text-base flex items-center justify-center gap-2 shadow-[0_0_35px_rgba(234,179,8,0.5)] active:scale-[0.98] transition-all group/btn"
              >
                <span>Begin Your Ascension</span>
                <Zap size={18} className="fill-black text-black group-hover/btn:scale-125 transition-transform" />
              </button>
            </div>

            {/* Trust Text */}
            <div className="mt-6 pt-5 border-t border-amber-500/15 flex flex-wrap justify-center gap-x-4 gap-y-2 text-[11px] font-mono text-amber-300/80">
              <span className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-emerald-400" /> Cancel Anytime</span>
              <span className="flex items-center gap-1.5"><Zap size={13} className="text-amber-400" /> Instant Access</span>
              <span className="flex items-center gap-1.5"><Shield size={13} className="text-amber-400" /> 7-Day Money-Back Guarantee</span>
            </div>

          </div>

          {/* Bottom Closing Statement */}
          <p className="mt-10 text-sm font-mono text-amber-300/80 tracking-wide font-medium">
            The Cost Of Staying The Same Is Greater Than ₹99.
          </p>

        </div>
      </section>

      {/* RANKS / ASCENSION PATH */}
      <section id="ranks" className="py-24 px-6 border-t border-amber-500/15 bg-[#08080a]">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="text-xs font-mono tracking-[4px] text-amber-400 uppercase font-semibold mb-3">
              YOUR ASCENSION PATH
            </div>
            <h2 className="text-3xl sm:text-5xl font-luxury-title font-bold text-white tracking-tight mb-3">
              Rise Through the Ranks
            </h2>
            <p className="text-amber-200/60 text-base">Every rank permanently multiplies your manifestation power.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {RANKS.map((rank, i) => (
              <div 
                key={i} 
                className="rounded-3xl bg-[#0a0a0d] border border-amber-500/20 hover:border-amber-500/60 hover:shadow-[0_0_30px_rgba(234,179,8,0.3)] transition-all flex flex-col justify-between overflow-hidden group"
              >
                <div className="relative h-32 w-full overflow-hidden bg-black/40">
                  <img 
                    src={rank.image} 
                    alt={rank.name} 
                    className="w-full h-full object-cover object-top opacity-75 group-hover:scale-110 transition-transform duration-500" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0d] via-[#0a0a0d]/50 to-transparent" />
                  <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-black/80 border border-amber-500/40 text-[10px] font-mono text-amber-300">
                    RANK {rank.level}
                  </div>
                  <div className="absolute top-3 right-3 text-lg text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]">
                    {rank.badge}
                  </div>
                </div>

                <div className="p-5 pt-1">
                  <div className="font-luxury-title font-bold text-xl text-white mb-1">{rank.name}</div>
                  <div className="text-amber-400 font-mono text-xs font-semibold mb-3">{rank.power} Power Multiplier</div>
                  <p className="text-xs text-amber-200/60 leading-relaxed pt-3 border-t border-amber-500/15">
                    {rank.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* REVIEWS / TESTIMONIALS SECTION */}
      <section id="reviews" className="py-24 px-6 border-t border-amber-500/15">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="text-xs font-mono tracking-[4px] text-amber-400 uppercase font-semibold mb-3">
              LOVED BY WARRIORS WORLDWIDE
            </div>
            <h2 className="text-3xl sm:text-5xl font-luxury-title font-bold text-white tracking-tight">
              Real People. Real Transformations.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="p-8 rounded-3xl bg-[#0a0a0d] border border-amber-500/20 flex flex-col justify-between">
                <div>
                  <div className="flex gap-1 text-amber-400 mb-6">
                    {[...Array(5)].map((_, starI) => (
                      <Star key={starI} size={16} className="fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-amber-100/90 text-base font-luxury-serif italic leading-relaxed mb-6">
                    “{t.quote}”
                  </p>
                </div>

                <div className="flex items-center gap-4 pt-6 border-t border-amber-500/15">
                  <img src={t.avatar} alt={t.name} className="w-12 h-12 rounded-full object-cover border border-amber-500/30" />
                  <div>
                    <div className="font-bold text-white text-sm">{t.name}</div>
                    <div className="text-xs text-amber-300/60">{t.location}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="py-24 px-6 border-t border-amber-500/15 bg-[#08080a]">
        <div className="max-w-4xl mx-auto">
          
          <div className="text-center mb-16">
            <div className="text-xs font-mono tracking-[4px] text-amber-400 uppercase font-semibold mb-3">
              GOT QUESTIONS?
            </div>
            <h2 className="text-3xl sm:text-5xl font-luxury-title font-bold text-white tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div 
                  key={index}
                  className="rounded-2xl bg-[#0a0a0d] border border-amber-500/20 overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full p-6 text-left flex justify-between items-center font-luxury-title text-lg font-semibold text-white hover:text-amber-300 transition"
                  >
                    <span>{faq.q}</span>
                    <span className="text-amber-400 font-mono text-xl">{isOpen ? "−" : "+"}</span>
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-6 text-amber-200/70 text-sm leading-relaxed border-t border-amber-500/10 pt-4">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* CALL TO ACTION BANNER */}
      <section className="py-24 px-6 border-t border-amber-500/15 bg-gradient-to-b from-[#08080a] via-[#0a0a0d] to-[#050505]">
        <div className="max-w-6xl mx-auto p-8 sm:p-12 rounded-3xl bg-[#0a0a0d] border border-amber-500/30 shadow-[0_0_80px_rgba(234,179,8,0.25)] grid lg:grid-cols-12 gap-8 items-center overflow-hidden relative">
          
          {/* Subtle background glow */}
          <div className="absolute -right-20 top-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/20 blur-[100px] pointer-events-none rounded-full" />

          {/* Left Text Column */}
          <div className="lg:col-span-5 text-left z-10">
            <h2 className="text-3xl sm:text-4xl font-luxury-title font-extrabold text-white tracking-tight leading-tight mb-4">
              YOUR NEW LIFE IS WAITING.<br />
              ARE YOU READY TO <br />
              <span className="text-gradient-green drop-shadow-[0_0_25px_rgba(34,197,94,0.5)]">BECOME LEGENDARY?</span>
            </h2>
            <p className="text-amber-200/70 text-sm font-light leading-relaxed">
              Stop wishing. Start becoming.<br />
              Your transformation begins now.
            </p>
          </div>

          {/* Middle Card Column */}
          <div className="lg:col-span-4 p-6 sm:p-8 rounded-2xl bg-[#050505]/90 backdrop-blur-xl border border-amber-500/30 text-center z-10 shadow-[0_0_30px_rgba(0,0,0,0.8)]">
            <p className="text-xs text-amber-200/80 mb-4 font-medium">
              Join 4,872+ warriors and start your transformation today.
            </p>
            
            <button 
              onClick={() => setShowAuth(true)}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-black font-extrabold text-sm sm:text-base shadow-[0_0_35px_rgba(234,179,8,0.5)] flex items-center justify-center gap-2 mb-4 active:scale-95 transition-all"
            >
              <span>START YOUR JOURNEY NOW</span>
              <Zap size={18} className="fill-black text-black" />
            </button>

            <div className="flex justify-center flex-wrap gap-3 text-[11px] font-mono text-amber-300/80">
              <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-amber-400" /> 1 Day Access</span>
              <span className="flex items-center gap-1"><Clock size={12} className="text-amber-400" /> Cancel Anytime</span>
              <span className="flex items-center gap-1"><Zap size={12} className="text-amber-400" /> Instant Access</span>
            </div>
          </div>

          {/* Right Monarch Wings Graphic Emblem Column */}
          <div className="lg:col-span-3 hidden lg:flex items-center justify-center relative z-10">
            <div className="relative w-48 h-48 rounded-3xl bg-gradient-to-br from-amber-950/60 via-[#0a0a0d] to-[#050505] border border-amber-500/40 p-4 flex items-center justify-center shadow-[0_0_50px_rgba(234,179,8,0.4)] group overflow-hidden">
              <div className="absolute inset-0 bg-amber-500/10 blur-xl group-hover:bg-amber-500/25 transition-all" />
              
              {/* Gold Wings SVG Crest */}
              <div className="relative z-10 flex flex-col items-center">
                <svg className="w-28 h-28 text-amber-400 filter drop-shadow-[0_0_15px_rgba(234,179,8,0.8)] animate-pulse" viewBox="0 0 100 100" fill="none" stroke="currentColor">
                  <path d="M50 15 L58 32 L75 22 L68 40 L90 42 L72 58 L85 75 L62 68 L50 90 L38 68 L15 75 L28 58 L10 42 L32 40 L25 22 L42 32 Z" fill="url(#goldGrad)" stroke="rgba(253,224,71,0.9)" strokeWidth="1.5" />
                  <circle cx="50" cy="50" r="10" fill="#eab308" className="animate-ping opacity-30" />
                  <circle cx="50" cy="50" r="6" fill="#fef08a" />
                  <defs>
                    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ca8a04" />
                      <stop offset="50%" stopColor="#eab308" />
                      <stop offset="100%" stopColor="#fef08a" />
                    </linearGradient>
                  </defs>
                </svg>
                <span className="mt-2 text-[10px] font-mono tracking-widest text-amber-300/90 font-bold uppercase">MONARCH RISE</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#030303] border-t border-amber-500/15 pt-16 pb-12 text-amber-200/60 text-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
            
            {/* Brand Info */}
            <div className="col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-amber-500 border border-amber-400/50 flex items-center justify-center">
                  <span className="text-black font-luxury-title font-bold text-sm">MO</span>
                </div>
                <span className="font-luxury-title font-bold text-xl text-white">Menifest OS</span>
              </div>
              <p className="text-xs text-amber-300/50 leading-relaxed max-w-sm">
                The manifestation RPG that turns your desires into real power. Align your mind, complete verified quests, and level up your reality.
              </p>
            </div>

            {/* Product Links */}
            <div>
              <div className="font-semibold text-white mb-4 text-xs tracking-wider uppercase font-mono">Product</div>
              <ul className="space-y-2.5 text-xs">
                <li><a href="#features" className="hover:text-white transition">Features</a></li>
                <li><a href="#ranks" className="hover:text-white transition">Ranks</a></li>
                <li><a href="#pricing" className="hover:text-white transition">Pricing</a></li>
                <li><a href="#faq" className="hover:text-white transition">FAQ</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <div className="font-semibold text-white mb-4 text-xs tracking-wider uppercase font-mono">Legal</div>
              <ul className="space-y-2.5 text-xs">
                <li><button onClick={() => setShowPrivacy(true)} className="hover:text-white transition">Privacy Policy</button></li>
                <li><button onClick={() => setShowTerms(true)} className="hover:text-white transition">Terms of Service</button></li>
                <li><button onClick={() => setShowContact(true)} className="hover:text-white transition">Refund Policy</button></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <div className="font-semibold text-white mb-4 text-xs tracking-wider uppercase font-mono">Support</div>
              <ul className="space-y-2.5 text-xs">
                <li><button onClick={() => setShowContact(true)} className="hover:text-white transition">Help Center</button></li>
                <li><button onClick={() => setShowContact(true)} className="hover:text-white transition">Contact Us</button></li>
                <li><a href="mailto:hello@menifestos.in" className="hover:text-white transition">hello@menifestos.in</a></li>
              </ul>
            </div>

          </div>

          <div className="mt-16 pt-8 border-t border-amber-500/10 flex flex-col md:flex-row justify-between items-center text-xs text-amber-300/40 gap-4">
            <div>© {new Date().getFullYear()} Menifest OS. All rights reserved.</div>
            <div>Made for those who refuse to stay ordinary.</div>
          </div>
        </div>
      </footer>

    </div>
  );
}

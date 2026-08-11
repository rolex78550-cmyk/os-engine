import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { onImgError } from '../lib/imageHelper';
import { 
  ArrowRight, ArrowLeft, Sparkles, Target, Flame, Brain, 
  Trophy, Shield, Zap, CheckCircle2, Lock, Search, Globe, 
  Dumbbell, Briefcase, DollarSign, Heart, Smile, TrendingUp, 
  Clock, Compass, User, AlertCircle, Check, Star, RefreshCw, LogOut
} from 'lucide-react';
import { useFirebase } from './FirebaseProvider';

interface ManifestOnboardingProps {
  onComplete: (data: {
    profile: any;
    aiGeneratedSystem?: any;
    triggerPricing?: boolean;
  }) => void;
}

// 20 STEPS CONSTANTS
const TOTAL_STEPS = 20;

// COUNTRIES FOR STEP 3
const COUNTRIES = [
  { code: "IN", name: "India", flag: "🇮🇳" },
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "AU", name: "Australia", flag: "🇦🇺" },
  { code: "AE", name: "United Arab Emirates", flag: "🇦🇪" },
  { code: "SG", name: "Singapore", flag: "🇸🇬" },
  { code: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "NP", name: "Nepal", flag: "🇳🇵" },
  { code: "BD", name: "Bangladesh", flag: "🇧🇩" },
  { code: "PK", name: "Pakistan", flag: "🇵🇰" },
  { code: "ES", name: "Spain", flag: "🇪🇸" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "IT", name: "Italy", flag: "🇮🇹" },
  { code: "BR", name: "Brazil", flag: "🇧🇷" },
  { code: "JP", name: "Japan", flag: "🇯🇵" },
  { code: "MX", name: "Mexico", flag: "🇲🇽" },
  { code: "ID", name: "Indonesia", flag: "🇮🇩" },
  { code: "SA", name: "Saudi Arabia", flag: "🇸🇦" },
  { code: "NG", name: "Nigeria", flag: "🇳🇬" },
  { code: "OTHER", name: "Global / Other", flag: "🌍" },
];

// STEP 6 LIFE AREAS
const LIFE_AREAS = [
  { id: "fitness", label: "Fitness & Health", icon: "💪", desc: "Body transformation & energy" },
  { id: "career", label: "Career", icon: "💼", desc: "Jobs, promotions & high income" },
  { id: "business", label: "Business", icon: "🚀", desc: "Startups, products & scaling" },
  { id: "money", label: "Money", icon: "💰", desc: "Wealth, savings & cashflow" },
  { id: "relationships", label: "Relationships", icon: "❤️", desc: "Deep connections & romance" },
  { id: "mindset", label: "Mindset", icon: "🧠", desc: "Mental toughness & clarity" },
  { id: "discipline", label: "Discipline", icon: "⚡", desc: "Iron will & zero excuses" },
  { id: "productivity", label: "Productivity", icon: "📈", desc: "Focused deep work" },
  { id: "learning", label: "Learning", icon: "📚", desc: "Rapid skill acquisition" },
  { id: "sleep", label: "Sleep", icon: "😴", desc: "Peak recovery & vitality" },
  { id: "confidence", label: "Confidence", icon: "😊", desc: "Self-belief & presence" },
  { id: "creativity", label: "Creativity", icon: "🎨", desc: "Artistic output & innovation" },
  { id: "spirituality", label: "Spirituality", icon: "🙏", desc: "Inner peace & alignment" },
  { id: "other", label: "Other", icon: "✨", desc: "Custom growth objective" },
];

// STEP 7 PRIORITY OPTIONS
const ALL_PRIORITIES = [
  { id: "lose_fat", label: "Lose Fat", category: "fitness" },
  { id: "build_muscle", label: "Build Muscle", category: "fitness" },
  { id: "get_sixpack", label: "Get Six Pack", category: "fitness" },
  { id: "earn_1l_month", label: "Earn ₹1L+ / month", category: "money" },
  { id: "get_high_paying_job", label: "Get High Paying Job", category: "career" },
  { id: "get_promotion", label: "Get Promotion", category: "career" },
  { id: "build_startup", label: "Build Startup", category: "business" },
  { id: "launch_clothing_brand", label: "Launch Brand", category: "business" },
  { id: "grow_business", label: "Grow Business 2x", category: "business" },
  { id: "improve_relationship", label: "Improve Relationship", category: "relationships" },
  { id: "become_confident", label: "Become More Confident", category: "confidence" },
  { id: "reduce_stress", label: "Reduce Stress & Anxiety", category: "mindset" },
  { id: "improve_focus", label: "Improve Focus & Discipline", category: "productivity" },
];

// STEP 10 BLOCKERS
const BLOCKER_OPTIONS = [
  "Lack of Discipline", "No Clear Plan", "Phone Addiction", "Fear of Failure",
  "Overthinking", "Low Confidence", "Procrastination", "No Time",
  "Financial Problems", "Health Problems", "Negative Environment",
  "Lack of Skills", "Poor Habits", "Consistency Issues", "Other"
];

// STEP 11 FEARS
const FEAR_OPTIONS = [
  "Staying Average",
  "Wasting My Potential",
  "Regretting My Life",
  "Never Becoming Financially Free",
  "Failing Again",
  "Being Judged",
  "Never Achieving My Dream",
  "Other"
];

// STEP 12 MOTIVATIONS
const MOTIVATIONS = [
  "Family 👨‍👩‍👧‍👦", "Money 💰", "Freedom 🕊️", "Success 🏆", "Health 🏋️",
  "Love ❤️", "Luxury Lifestyle 🏎️", "Respect 👑", "Purpose ✨",
  "Self Growth 📈", "Travel 🌍"
];

// STEP 14 DREAM LIFE CARDS
const DREAM_LIFE_CARDS = [
  { id: "financial_freedom", label: "Financial Freedom", icon: "💰", desc: "Multiple income streams & zero money worries" },
  { id: "million_business", label: "Million Dollar Business", icon: "🚀", desc: "Scalable enterprise with global impact" },
  { id: "dream_body", label: "Dream Body", icon: "💪", desc: "Peak physical aesthetics & endless energy" },
  { id: "luxury_lifestyle", label: "Luxury Lifestyle", icon: "🏎️", desc: "Top tier comfort, penthouse & travel" },
  { id: "dream_career", label: "Dream Career", icon: "💼", desc: "Industry leader & recognized authority" },
  { id: "happy_family", label: "Happy Family", icon: "❤️", desc: "Deep love, security & lifelong memories" },
  { id: "travel_world", label: "Travel The World", icon: "🌍", desc: "Location freedom & cultural adventures" },
  { id: "mentally_unstoppable", label: "Mentally Unstoppable", icon: "🧠", desc: "Zero anxiety, razor focus & calm confidence" },
  { id: "custom_vision", label: "Custom Vision", icon: "✨", desc: "Your unique sovereign destiny" },
];

// STEP 17 COACH STYLES
const COACH_STYLES = [
  { id: "strict", title: "Strict Coach ⚔️", desc: "Ruthless accountability & zero excuses" },
  { id: "balanced", title: "Balanced Mentor ⚖️", desc: "Wise guidance, feedback & encouragement" },
  { id: "friend", title: "Supportive Friend 🤝", desc: "Warm, understanding & uplifting support" },
  { id: "military", title: "Military Discipline 🎖️", desc: "Tactical precision & relentless daily drill" },
  { id: "scientific", title: "Scientific & Logical 🧬", desc: "Data-driven & psychological optimization" },
  { id: "motivational", title: "Motivational ⚡", desc: "High energy, inspiring drive & vision" },
];

// STEP 19 ANALYSIS ROTATING MESSAGES
const ANALYSIS_MESSAGES = [
  "Analyzing your psychology...",
  "Understanding your goals...",
  "Detecting hidden blockers...",
  "Creating your identity profile...",
  "Building your Life Blueprint...",
  "Designing Daily Missions...",
  "Generating RPG Progression...",
  "Calculating Success Probability...",
  "Preparing your AI Coach...",
  "Finalizing your personalized system..."
];

export function ManifestOnboarding({ onComplete }: ManifestOnboardingProps) {
  const { signOut } = useFirebase();
  const [step, setStep] = useState(1);
  const [countrySearch, setCountrySearch] = useState("");

  // Form states
  const [name, setName] = useState("");
  const [country, setCountry] = useState("India");
  const [ageGroup, setAgeGroup] = useState("18–24");
  const [gender, setGender] = useState("Prefer not to say");
  const [selectedLifeAreas, setSelectedLifeAreas] = useState<string[]>(["fitness", "career", "money"]);
  const [primaryPriority, setPrimaryPriority] = useState("Earn ₹1L+ / month");
  
  // Situation fields
  const [currentWeight, setCurrentWeight] = useState("72 kg");
  const [targetWeight, setTargetWeight] = useState("65 kg");
  const [workoutFreq, setWorkoutFreq] = useState("3-4 days/week");
  const [currentRole, setCurrentRole] = useState("Professional / Creator");
  const [monthlyIncome, setMonthlyIncome] = useState("₹50,000 / $1,000");
  const [focusedWorkHours, setFocusedWorkHours] = useState("4 Hours");

  const [lifeSatisfaction, setLifeSatisfaction] = useState(5);
  const [selectedBlockers, setSelectedBlockers] = useState<string[]>(["Procrastination", "Lack of Discipline"]);
  const [biggestFear, setBiggestFear] = useState("Wasting My Potential");
  const [primaryMotivation, setPrimaryMotivation] = useState("Freedom 🕊️");
  const [target90Days, setTarget90Days] = useState("Build consistent discipline & hit $3,000/mo income");
  const [dreamLifeCard, setDreamLifeCard] = useState("financial_freedom");
  const [whyImportant, setWhyImportant] = useState("");
  const [dailyTimeCommitment, setDailyTimeCommitment] = useState("30 Minutes");
  const [coachingStyle, setCoachingStyle] = useState("balanced");
  const [confidenceWithoutGuidance, setConfidenceWithoutGuidance] = useState(4);

  // Analysis Loading step state
  const [analysisIndex, setAnalysisIndex] = useState(0);

  // Audio effect on start
  useEffect(() => {
    const audio = new Audio('/audio/onboarding-intro.mp3');
    audio.volume = 0.5;
    audio.play().catch(() => {});
  }, []);

  // Step 19 interval timer
  useEffect(() => {
    if (step === 19) {
      const interval = setInterval(() => {
        setAnalysisIndex(prev => {
          if (prev >= ANALYSIS_MESSAGES.length - 1) {
            clearInterval(interval);
            setTimeout(() => setStep(20), 800);
            return prev;
          }
          return prev + 1;
        });
      }, 700);
      return () => clearInterval(interval);
    }
  }, [step]);

  const progressPercentage = Math.round((step / TOTAL_STEPS) * 100);

  const goNext = () => {
    if (step < TOTAL_STEPS) {
      setStep(prev => prev + 1);
    }
  };

  const goBack = () => {
    if (step > 1 && step !== 19) {
      setStep(prev => prev - 1);
    }
  };

  const toggleLifeArea = (id: string) => {
    setSelectedLifeAreas(prev => 
      prev.includes(id) ? (prev.length > 1 ? prev.filter(a => a !== id) : prev) : [...prev, id]
    );
  };

  const toggleBlocker = (blocker: string) => {
    setSelectedBlockers(prev => 
      prev.includes(blocker) ? prev.filter(b => b !== blocker) : [...prev, blocker]
    );
  };

  // Calculate life score & generated blueprint metrics
  const calculatedLifeScore = Math.min(
    95, 
    Math.max(25, (lifeSatisfaction * 6) + (confidenceWithoutGuidance * 3) + (10 - selectedBlockers.length * 2))
  );

  const generateAIProfileData = () => {
    return {
      profile: {
        name: name.trim() || "Hunter",
        country,
        ageGroup,
        gender,
        selectedLifeAreas,
        primaryPriority,
        currentSituation: {
          currentWeight, targetWeight, workoutFreq, currentRole, monthlyIncome, focusedWorkHours
        },
        lifeSatisfaction,
        selectedBlockers,
        biggestFear,
        primaryMotivation,
        target90Days,
        dreamLifeCard,
        whyImportant,
        dailyTimeCommitment,
        coachingStyle,
        confidenceWithoutGuidance,
        calculatedLifeScore,
        onboarded: true,
      },
      aiGeneratedSystem: {
        primaryMission: `Master ${primaryPriority} in 90 Days & Build Sovereign Discipline`,
        identityArchetype: coachingStyle === "strict" ? "Sovereign Commander" : "Catalyst Achiever",
        biggestStrength: "High Ambition & Clarity of Vision",
        biggestWeakness: selectedBlockers[0] || "Consistency Bottleneck",
        firstDailyMission: "10-Min Morning Focus Ritual + Complete Priority Action Item",
        currentLifeScore: calculatedLifeScore,
        aiCoachingStyle: COACH_STYLES.find(c => c.id === coachingStyle)?.title || "Balanced Mentor",
        successProbability: Math.min(98, 70 + (dailyTimeCommitment.includes("60") ? 20 : 12)),
      }
    };
  };

  const handleUnlockFullSystem = () => {
    const data = generateAIProfileData();
    onComplete({
      profile: data.profile,
      aiGeneratedSystem: data.aiGeneratedSystem,
      triggerPricing: true,
    });
  };

  const filteredCountries = COUNTRIES.filter(c => 
    c.name.toLowerCase().includes(countrySearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[500] bg-black text-white flex flex-col justify-between overflow-hidden font-sans select-none">
      
      {/* Anime Visual Background Backdrop */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <img
          src="/images/anime_onboarding_bg_1785264614926.jpg"
          alt="Anime Visual Backdrop"
          onError={onImgError("/images/onboarding-hero.jpg")}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center opacity-35 scale-105 filter blur-[1px] transition-all duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/90" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px]" />
      </div>

      {/* TOP HEADER & PROGRESS BAR (Only if step < 19) */}
      {step < 19 && (
        <div className="relative z-20 w-full max-w-xl mx-auto pt-4 px-4 sm:px-6 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-mono tracking-wider text-emerald-400">
            <button 
              onClick={goBack} 
              disabled={step === 1}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition ${step === 1 ? 'opacity-30 cursor-not-allowed cursor-default' : 'opacity-100 cursor-pointer'}`}
            >
              <ArrowLeft size={14} /> Back
            </button>
            <div className="flex items-center gap-1.5 font-bold">
              <Sparkles size={13} className="text-amber-400 animate-pulse" />
              <span>STEP {step} OF {TOTAL_STEPS}</span>
            </div>
            <div className="text-zinc-400 font-bold">{progressPercentage}%</div>
          </div>

          {/* Progress Bar Line */}
          <div className="w-full h-1.5 bg-zinc-900 border border-white/10 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <div className="relative z-10 flex-1 w-full max-w-lg mx-auto px-4 sm:px-6 py-4 flex flex-col justify-center overflow-y-auto custom-scrollbar">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className="w-full my-auto"
          >

            {/* STEP 1: WELCOME */}
            {step === 1 && (
              <div className="text-center space-y-6">
                <div className="relative mx-auto w-24 h-24 rounded-3xl bg-emerald-950/50 border border-emerald-500/40 flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.3)]">
                  <Sparkles size={48} className="text-emerald-400 animate-pulse" />
                </div>
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono tracking-widest uppercase">
                    AI Life Operating System
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                    Welcome to Your<br />
                    <span className="bg-gradient-to-r from-emerald-400 via-amber-300 to-emerald-300 bg-clip-text text-transparent">
                      New Life.
                    </span>
                  </h1>
                  <p className="text-zinc-400 text-sm sm:text-base max-w-sm mx-auto">
                    In just 2 minutes, we'll build your personalized AI Life System.
                  </p>
                </div>
                <button
                  onClick={goNext}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-amber-400 text-black font-extrabold text-base tracking-wide shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  Start Assessment <ArrowRight size={20} />
                </button>
              </div>
            )}

            {/* STEP 2: NAME */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="space-y-2 text-center sm:text-left">
                  <div className="text-emerald-400 text-xs font-mono uppercase tracking-widest">Identify Yourself</div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white">What should we call you?</h2>
                </div>
                <div className="space-y-4">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your first name"
                    autoFocus
                    className="w-full bg-zinc-900/90 border border-emerald-500/40 focus:border-emerald-400 rounded-2xl px-5 py-4 text-xl text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition shadow-inner"
                    onKeyDown={(e) => e.key === 'Enter' && name.trim() && goNext()}
                  />
                  <button
                    onClick={goNext}
                    disabled={!name.trim()}
                    className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black font-bold text-base transition flex items-center justify-center gap-2 shadow-lg"
                  >
                    Continue <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: COUNTRY */}
            {step === 3 && (
              <div className="space-y-5">
                <div className="space-y-1">
                  <div className="text-emerald-400 text-xs font-mono uppercase tracking-widest">Origin</div>
                  <h2 className="text-2xl font-bold text-white">Select your country</h2>
                </div>
                
                {/* Search Bar */}
                <div className="relative">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    value={countrySearch}
                    onChange={(e) => setCountrySearch(e.target.value)}
                    placeholder="Search country..."
                    className="w-full bg-zinc-900/80 border border-white/10 focus:border-emerald-500 rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none"
                  />
                </div>

                {/* Country List */}
                <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {filteredCountries.map(c => (
                    <button
                      key={c.code}
                      onClick={() => { setCountry(c.name); goNext(); }}
                      className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all ${
                        country === c.name 
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 font-bold' 
                          : 'border-white/10 hover:border-white/20 bg-zinc-900/50 text-zinc-300'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <span className="text-2xl">{c.flag}</span>
                        <span className="text-sm">{c.name}</span>
                      </span>
                      {country === c.name && <Check size={16} className="text-emerald-400" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 4: AGE */}
            {step === 4 && (
              <div className="space-y-6">
                <div className="space-y-1 text-center">
                  <div className="text-emerald-400 text-xs font-mono uppercase tracking-widest">Age Group</div>
                  <h2 className="text-2xl font-bold text-white">How old are you?</h2>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {["13–17", "18–24", "25–34", "35–44", "45+"].map(age => (
                    <button
                      key={age}
                      onClick={() => { setAgeGroup(age); goNext(); }}
                      className={`p-4 rounded-2xl border text-center text-lg font-bold transition-all ${
                        ageGroup === age 
                          ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.2)]' 
                          : 'border-white/10 hover:border-white/20 bg-zinc-900/60 text-zinc-300'
                      }`}
                    >
                      {age}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 5: GENDER */}
            {step === 5 && (
              <div className="space-y-6">
                <div className="space-y-1 text-center">
                  <div className="text-emerald-400 text-xs font-mono uppercase tracking-widest">Gender (Optional)</div>
                  <h2 className="text-2xl font-bold text-white">Select your gender</h2>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {["Male", "Female", "Prefer not to say"].map(g => (
                    <button
                      key={g}
                      onClick={() => { setGender(g); goNext(); }}
                      className={`p-4 rounded-2xl border text-center text-lg font-bold transition-all ${
                        gender === g 
                          ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300' 
                          : 'border-white/10 hover:border-white/20 bg-zinc-900/60 text-zinc-300'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 6: LIFE AREAS (MULTI SELECT) */}
            {step === 6 && (
              <div className="space-y-5">
                <div className="space-y-1">
                  <div className="text-emerald-400 text-xs font-mono uppercase tracking-widest">Multi-Select</div>
                  <h2 className="text-2xl font-bold text-white">Which areas do you want to improve?</h2>
                </div>
                <div className="grid grid-cols-2 gap-2.5 max-h-[340px] overflow-y-auto pr-1 custom-scrollbar">
                  {LIFE_AREAS.map(area => {
                    const isSelected = selectedLifeAreas.includes(area.id);
                    return (
                      <button
                        key={area.id}
                        onClick={() => toggleLifeArea(area.id)}
                        className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                          isSelected 
                            ? 'border-emerald-500 bg-emerald-500/15 text-white shadow-[0_0_15px_rgba(16,185,129,0.15)]' 
                            : 'border-white/10 hover:border-white/20 bg-zinc-900/50 text-zinc-400'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <span className="text-2xl">{area.icon}</span>
                          {isSelected && <CheckCircle2 size={16} className="text-emerald-400" />}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-white">{area.label}</div>
                          <div className="text-[10px] text-zinc-400">{area.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={goNext}
                  className="w-full py-3.5 rounded-2xl bg-emerald-500 text-black font-bold transition"
                >
                  Next Step ({selectedLifeAreas.length} Selected)
                </button>
              </div>
            )}

            {/* STEP 7: #1 PRIORITY */}
            {step === 7 && (
              <div className="space-y-5">
                <div className="space-y-1">
                  <div className="text-emerald-400 text-xs font-mono uppercase tracking-widest">Core Focus</div>
                  <h2 className="text-2xl font-bold text-white">What's your #1 Priority?</h2>
                </div>
                <div className="grid grid-cols-1 gap-2.5 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
                  {ALL_PRIORITIES.map(p => (
                    <button
                      key={p.id}
                      onClick={() => { setPrimaryPriority(p.label); goNext(); }}
                      className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                        primaryPriority === p.label 
                          ? 'border-amber-400 bg-amber-400/15 text-amber-200 font-bold' 
                          : 'border-white/10 hover:border-white/20 bg-zinc-900/60 text-zinc-300'
                      }`}
                    >
                      <span className="text-base">{p.label}</span>
                      {primaryPriority === p.label && <Sparkles size={18} className="text-amber-400" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 8: CURRENT SITUATION DYNAMIC FIELDS */}
            {step === 8 && (
              <div className="space-y-5">
                <div className="space-y-1">
                  <div className="text-emerald-400 text-xs font-mono uppercase tracking-widest">Reality Check</div>
                  <h2 className="text-2xl font-bold text-white">Tell us about your current situation</h2>
                </div>
                
                <div className="space-y-4 bg-zinc-900/80 border border-white/10 p-5 rounded-3xl">
                  {selectedLifeAreas.includes("fitness") && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-mono text-zinc-400 uppercase">Current Weight</label>
                        <input 
                          type="text" 
                          value={currentWeight} 
                          onChange={(e) => setCurrentWeight(e.target.value)}
                          className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" 
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono text-zinc-400 uppercase">Target Weight</label>
                        <input 
                          type="text" 
                          value={targetWeight} 
                          onChange={(e) => setTargetWeight(e.target.value)}
                          className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" 
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-[10px] font-mono text-zinc-400 uppercase">Current Role / Occupation</label>
                    <input 
                      type="text" 
                      value={currentRole} 
                      onChange={(e) => setCurrentRole(e.target.value)}
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-mono text-zinc-400 uppercase">Monthly Income</label>
                      <input 
                        type="text" 
                        value={monthlyIncome} 
                        onChange={(e) => setMonthlyIncome(e.target.value)}
                        className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-zinc-400 uppercase">Focused Hours / Day</label>
                      <input 
                        type="text" 
                        value={focusedWorkHours} 
                        onChange={(e) => setFocusedWorkHours(e.target.value)}
                        className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" 
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={goNext}
                  className="w-full py-3.5 rounded-2xl bg-emerald-500 text-black font-bold transition"
                >
                  Continue
                </button>
              </div>
            )}

            {/* STEP 9: LIFE SATISFACTION SLIDER */}
            {step === 9 && (
              <div className="space-y-6 text-center">
                <div className="space-y-1">
                  <div className="text-emerald-400 text-xs font-mono uppercase tracking-widest">Self Assessment</div>
                  <h2 className="text-2xl font-bold text-white">How satisfied are you with your current life?</h2>
                </div>

                <div className="py-8 space-y-6">
                  <div className="text-5xl font-extrabold text-emerald-400 font-mono">
                    {lifeSatisfaction} <span className="text-2xl text-zinc-500">/ 10</span>
                  </div>
                  
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={lifeSatisfaction}
                    onChange={(e) => setLifeSatisfaction(Number(e.target.value))}
                    className="w-full h-3 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />

                  <div className="text-sm font-semibold text-amber-300">
                    {lifeSatisfaction <= 3 && "Struggling & Overwhelmed 🌧️"}
                    {lifeSatisfaction >= 4 && lifeSatisfaction <= 6 && "Surviving / Average 🌤️"}
                    {lifeSatisfaction >= 7 && lifeSatisfaction <= 8 && "Growing & Steady 📈"}
                    {lifeSatisfaction >= 9 && "Thriving & Unstoppable 🔥"}
                  </div>
                </div>

                <button
                  onClick={goNext}
                  className="w-full py-4 rounded-2xl bg-emerald-500 text-black font-bold transition"
                >
                  Next
                </button>
              </div>
            )}

            {/* STEP 10: BLOCKERS (MULTI SELECT) */}
            {step === 10 && (
              <div className="space-y-5">
                <div className="space-y-1">
                  <div className="text-emerald-400 text-xs font-mono uppercase tracking-widest">Friction Factors</div>
                  <h2 className="text-2xl font-bold text-white">What's stopping you?</h2>
                </div>

                <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                  {BLOCKER_OPTIONS.map(b => {
                    const isSelected = selectedBlockers.includes(b);
                    return (
                      <button
                        key={b}
                        onClick={() => toggleBlocker(b)}
                        className={`p-3 rounded-xl border text-xs font-semibold text-left transition-all ${
                          isSelected 
                            ? 'border-emerald-500 bg-emerald-500/20 text-emerald-200' 
                            : 'border-white/10 bg-zinc-900/50 text-zinc-400'
                        }`}
                      >
                        {b}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={goNext}
                  className="w-full py-3.5 rounded-2xl bg-emerald-500 text-black font-bold transition"
                >
                  Next
                </button>
              </div>
            )}

            {/* STEP 11: BIGGEST FEAR */}
            {step === 11 && (
              <div className="space-y-5">
                <div className="space-y-1">
                  <div className="text-emerald-400 text-xs font-mono uppercase tracking-widest">Psychology</div>
                  <h2 className="text-2xl font-bold text-white">What's your biggest fear?</h2>
                </div>

                <div className="grid grid-cols-1 gap-2.5 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                  {FEAR_OPTIONS.map(fear => (
                    <button
                      key={fear}
                      onClick={() => { setBiggestFear(fear); goNext(); }}
                      className={`p-3.5 rounded-2xl border text-left text-sm font-semibold transition-all ${
                        biggestFear === fear 
                          ? 'border-emerald-500 bg-emerald-500/20 text-emerald-200' 
                          : 'border-white/10 bg-zinc-900/60 text-zinc-300'
                      }`}
                    >
                      {fear}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 12: MOTIVATIONS */}
            {step === 12 && (
              <div className="space-y-5">
                <div className="space-y-1">
                  <div className="text-emerald-400 text-xs font-mono uppercase tracking-widest">Internal Fuel</div>
                  <h2 className="text-2xl font-bold text-white">What motivates you the most?</h2>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {MOTIVATIONS.map(m => (
                    <button
                      key={m}
                      onClick={() => { setPrimaryMotivation(m); goNext(); }}
                      className={`p-3.5 rounded-2xl border text-sm font-bold text-center transition-all ${
                        primaryMotivation === m 
                          ? 'border-amber-400 bg-amber-400/20 text-amber-200' 
                          : 'border-white/10 bg-zinc-900/60 text-zinc-300'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 13: 90 DAYS TARGET */}
            {step === 13 && (
              <div className="space-y-5">
                <div className="space-y-1">
                  <div className="text-emerald-400 text-xs font-mono uppercase tracking-widest">90-Day Horizon</div>
                  <h2 className="text-2xl font-bold text-white">What do you want to achieve in 90 days?</h2>
                </div>

                <textarea
                  rows={3}
                  value={target90Days}
                  onChange={(e) => setTarget90Days(e.target.value)}
                  className="w-full bg-zinc-900/90 border border-emerald-500/40 rounded-2xl p-4 text-white placeholder-zinc-500 focus:outline-none"
                />

                <button
                  onClick={goNext}
                  className="w-full py-4 rounded-2xl bg-emerald-500 text-black font-bold transition"
                >
                  Continue
                </button>
              </div>
            )}

            {/* STEP 14: DREAM LIFE 5 YEARS (LARGE CARDS) */}
            {step === 14 && (
              <div className="space-y-5">
                <div className="space-y-1">
                  <div className="text-emerald-400 text-xs font-mono uppercase tracking-widest">5-Year Vision</div>
                  <h2 className="text-2xl font-bold text-white">What does your dream life look like?</h2>
                </div>

                <div className="grid grid-cols-1 gap-2.5 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                  {DREAM_LIFE_CARDS.map(card => (
                    <button
                      key={card.id}
                      onClick={() => { setDreamLifeCard(card.id); goNext(); }}
                      className={`p-4 rounded-2xl border text-left flex items-center gap-4 transition-all ${
                        dreamLifeCard === card.id 
                          ? 'border-amber-400 bg-amber-400/15 text-white shadow-lg' 
                          : 'border-white/10 bg-zinc-900/60 text-zinc-300'
                      }`}
                    >
                      <span className="text-3xl">{card.icon}</span>
                      <div>
                        <div className="font-bold text-base text-white">{card.label}</div>
                        <div className="text-xs text-zinc-400">{card.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 15: WHY IMPORTANT */}
            {step === 15 && (
              <div className="space-y-5">
                <div className="space-y-1">
                  <div className="text-emerald-400 text-xs font-mono uppercase tracking-widest">Emotional Anchor</div>
                  <h2 className="text-2xl font-bold text-white">Why is this goal important to you?</h2>
                </div>

                <div className="relative">
                  <textarea
                    rows={4}
                    maxLength={150}
                    value={whyImportant}
                    onChange={(e) => setWhyImportant(e.target.value)}
                    placeholder="If you achieve this goal, how will your life change?"
                    className="w-full bg-zinc-900/90 border border-emerald-500/40 rounded-2xl p-4 text-white placeholder-zinc-500 focus:outline-none"
                  />
                  <div className="absolute right-3 bottom-3 text-xs font-mono text-zinc-500">
                    {whyImportant.length} / 150
                  </div>
                </div>

                <button
                  onClick={goNext}
                  className="w-full py-4 rounded-2xl bg-emerald-500 text-black font-bold transition"
                >
                  Continue
                </button>
              </div>
            )}

            {/* STEP 16: DAILY TIME COMMITMENT */}
            {step === 16 && (
              <div className="space-y-5">
                <div className="space-y-1 text-center">
                  <div className="text-emerald-400 text-xs font-mono uppercase tracking-widest">Daily Investment</div>
                  <h2 className="text-2xl font-bold text-white">How much time can you invest daily?</h2>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {["10 Minutes", "20 Minutes", "30 Minutes", "45 Minutes", "60+ Minutes"].map(time => (
                    <button
                      key={time}
                      onClick={() => { setDailyTimeCommitment(time); goNext(); }}
                      className={`p-4 rounded-2xl border text-center font-bold text-lg transition-all ${
                        dailyTimeCommitment === time 
                          ? 'border-emerald-500 bg-emerald-500/20 text-emerald-200' 
                          : 'border-white/10 bg-zinc-900/60 text-zinc-300'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 17: AI COACHING STYLE */}
            {step === 17 && (
              <div className="space-y-5">
                <div className="space-y-1">
                  <div className="text-emerald-400 text-xs font-mono uppercase tracking-widest">AI Persona</div>
                  <h2 className="text-2xl font-bold text-white">How should your AI Coach guide you?</h2>
                </div>

                <div className="grid grid-cols-1 gap-2.5 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                  {COACH_STYLES.map(coach => (
                    <button
                      key={coach.id}
                      onClick={() => { setCoachingStyle(coach.id); goNext(); }}
                      className={`p-3.5 rounded-2xl border text-left transition-all ${
                        coachingStyle === coach.id 
                          ? 'border-emerald-500 bg-emerald-500/20 text-emerald-200' 
                          : 'border-white/10 bg-zinc-900/60 text-zinc-300'
                      }`}
                    >
                      <div className="font-bold text-base text-white">{coach.title}</div>
                      <div className="text-xs text-zinc-400">{coach.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 18: CONFIDENCE WITHOUT GUIDANCE */}
            {step === 18 && (
              <div className="space-y-6 text-center">
                <div className="space-y-1">
                  <div className="text-emerald-400 text-xs font-mono uppercase tracking-widest">Reality Check</div>
                  <h2 className="text-2xl font-bold text-white">Confidence without guidance?</h2>
                </div>

                <div className="py-6 space-y-6">
                  <div className="text-5xl font-extrabold text-amber-400 font-mono">
                    {confidenceWithoutGuidance} <span className="text-2xl text-zinc-500">/ 10</span>
                  </div>

                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={confidenceWithoutGuidance}
                    onChange={(e) => setConfidenceWithoutGuidance(Number(e.target.value))}
                    className="w-full h-3 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                  />

                  <div className="text-sm font-semibold text-zinc-400">
                    {confidenceWithoutGuidance <= 4 && "Requires structured AI accountability system"}
                    {confidenceWithoutGuidance >= 5 && confidenceWithoutGuidance <= 7 && "Moderate confidence with potential bottlenecks"}
                    {confidenceWithoutGuidance >= 8 && "High drive needing precision tactical roadmap"}
                  </div>
                </div>

                <button
                  onClick={goNext}
                  className="w-full py-4 rounded-2xl bg-emerald-500 text-black font-bold transition"
                >
                  Generate AI Analysis
                </button>
              </div>
            )}

            {/* STEP 19: FULL SCREEN AI ANALYSIS LOADING */}
            {step === 19 && (
              <div className="text-center space-y-8 py-10">
                <div className="relative mx-auto w-32 h-32 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 border-t-emerald-400 animate-spin" />
                  <div className="absolute inset-2 rounded-full border-4 border-amber-400/20 border-b-amber-400 animate-spin-slow" />
                  <Brain size={48} className="text-emerald-400 animate-pulse" />
                </div>

                <div className="space-y-3">
                  <div className="text-emerald-400 text-xs font-mono uppercase tracking-widest">
                    SYNTHESIZING SYSTEM ({analysisIndex + 1}/10)
                  </div>
                  <h2 className="text-2xl font-extrabold text-white min-h-[36px] transition-all">
                    {ANALYSIS_MESSAGES[analysisIndex]}
                  </h2>
                  <p className="text-xs text-zinc-500">
                    Constructing your custom Life Blueprint &amp; RPG Engine...
                  </p>
                </div>
              </div>
            )}

            {/* STEP 20: PERSONALIZED PREVIEW BEFORE PAYMENT */}
            {step === 20 && (
              <div className="space-y-5 my-auto py-2">
                
                {/* Header */}
                <div className="text-center space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold">
                    <CheckCircle2 size={13} /> YOUR PERSONALIZED LIFE SYSTEM IS READY
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                    System Diagnostic complete.
                  </h2>
                </div>

                {/* Unlocked Highlights */}
                <div className="bg-zinc-900/90 border border-emerald-500/40 p-4 rounded-3xl space-y-3 shadow-xl">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="text-xs text-zinc-400 uppercase font-mono">Primary Mission</span>
                    <span className="text-xs font-bold text-emerald-400">ACTIVATED</span>
                  </div>
                  <p className="font-bold text-sm text-white">
                    {primaryPriority} — Master in 90 Days
                  </p>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="bg-black/40 p-2.5 rounded-xl border border-white/5">
                      <div className="text-[10px] text-zinc-500 uppercase font-mono">Life Score</div>
                      <div className="text-xl font-black text-amber-400 font-mono">{calculatedLifeScore} / 100</div>
                    </div>
                    <div className="bg-black/40 p-2.5 rounded-xl border border-white/5">
                      <div className="text-[10px] text-zinc-500 uppercase font-mono">Biggest Strength</div>
                      <div className="text-xs font-bold text-emerald-300">High Ambition</div>
                    </div>
                  </div>

                  <div className="bg-black/40 p-2.5 rounded-xl border border-white/5">
                    <div className="text-[10px] text-zinc-500 uppercase font-mono">First Daily Mission</div>
                    <div className="text-xs font-bold text-white">10-Min Morning Focus Ritual + Priorities Task</div>
                  </div>
                </div>

                {/* Locked System Insights (Blurred Grid) */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest text-center">
                    LOCKED SYSTEM INSIGHTS
                  </div>
                  <div className="grid grid-cols-2 gap-2 relative">
                    {[
                      "90-Day Blueprint", "AI Coach", "Daily Missions",
                      "RPG XP System", "Achievement System", "Habit Tracker",
                      "Manifestation Dashboard", "Analytics"
                    ].map((item, i) => (
                      <div 
                        key={i} 
                        className="bg-zinc-950/80 border border-amber-500/30 p-2.5 rounded-2xl flex items-center justify-between backdrop-blur-md"
                      >
                        <span className="text-xs font-semibold text-zinc-400 blur-[2px]">{item}</span>
                        <Lock size={12} className="text-amber-400" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Unlock CTA Button */}
                <button
                  onClick={handleUnlockFullSystem}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-400 text-black font-extrabold text-base tracking-wide shadow-[0_0_35px_rgba(16,185,129,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles size={18} /> Unlock Your Complete AI Life System
                </button>

                {/* Back to Landing Page Button */}
                <button
                  onClick={signOut}
                  className="w-full py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white text-xs font-mono transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogOut size={14} /> Back to Landing Page (Sign Out)
                </button>

              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

    </div>
  );
}

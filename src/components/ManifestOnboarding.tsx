import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { onImgError } from '../lib/imageHelper';
import {
  ArrowRight, ArrowLeft, Sparkles, Brain, Search, Check, CheckCircle2,
  Lock, LogOut, Shield, ChevronRight
} from 'lucide-react';
import { useFirebase } from './FirebaseProvider';

interface ManifestOnboardingProps {
  onComplete: (data: {
    profile: any;
    aiGeneratedSystem?: any;
    triggerPricing?: boolean;
    onboardingGoals?: Array<{
      id: string;
      title: string;
      description: string;
      rank: "E" | "D" | "C" | "B" | "A";
      xp: number;
      progress: number;
      image: string;
      jpLabel: string;
      icon: string;
      category: string;
      deadline?: string;
      totalMilestones?: number;
      completedMilestones?: number;
      source?: "onboarding" | "manual";
    }>;
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
  "Finalizing your personalized system...",
];

// ── DESIGN TOKENS (Solo Leveling ARISE style — matches Landing page) ──
const TEXT_PRIMARY = "#ffffff";
const TEXT_SECONDARY = "rgba(235,235,245,0.62)";
const TEXT_TERTIARY = "rgba(235,235,245,0.32)";
const SURFACE = "#0a0a0a";
const HAIRLINE = "rgba(255,255,255,0.08)";
const HAIRLINE_STRONG = "rgba(255,255,255,0.18)";
const ORANGE = "#ff9f0a";
const ORANGE_DARK = "#ff7a00";

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

  // ============== CATEGORY GOAL ANSWERS (used to seed Goals page) ==============
  const [lifestyleGoal, setLifestyleGoal] = useState("");
  const [healthGoal, setHealthGoal] = useState("");
  const [careerGoal, setCareerGoal] = useState("");
  const [wealthGoal, setWealthGoal] = useState("");
  const [knowledgeGoal, setKnowledgeGoal] = useState("");
  const [relationshipsGoal, setRelationshipsGoal] = useState("");

  // Build GoalItem array from onboarding answers
  const CATEGORY_GOAL_DEFS: Array<{
    key: string;
    category: string;
    jpLabel: string;
    icon: string;
    rank: "E" | "D" | "C" | "B" | "A";
    xp: number;
    description: string;
  }> = [
    {
      key: "lifestyle",
      category: "Lifestyle",
      jpLabel: "ライフスタイル",
      icon: "🏠",
      rank: "B",
      xp: 300,
      description: "Build the daily life you've always envisioned.",
    },
    {
      key: "health",
      category: "Health",
      jpLabel: "健康",
      icon: "💪",
      rank: "C",
      xp: 250,
      description: "Forge a body and mind that serve your goals.",
    },
    {
      key: "career",
      category: "Career",
      jpLabel: "キャリア",
      icon: "🚀",
      rank: "A",
      xp: 500,
      description: "Build the professional life you deserve.",
    },
    {
      key: "wealth",
      category: "Wealth",
      jpLabel: "富",
      icon: "💰",
      rank: "A",
      xp: 450,
      description: "Achieve financial freedom and security.",
    },
    {
      key: "knowledge",
      category: "Knowledge",
      jpLabel: "知識",
      icon: "📚",
      rank: "C",
      xp: 200,
      description: "Master skills and ideas that compound over time.",
    },
    {
      key: "relationships",
      category: "Relationships",
      jpLabel: "関係",
      icon: "🤝",
      rank: "B",
      xp: 280,
      description: "Cultivate deep, meaningful connections.",
    },
  ];

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

    // Build onboarding goals array from category answers
    const answerMap: Record<string, string> = {
      lifestyle: lifestyleGoal,
      health: healthGoal,
      career: careerGoal,
      wealth: wealthGoal,
      knowledge: knowledgeGoal,
      relationships: relationshipsGoal,
    };

    const onboardingGoals = CATEGORY_GOAL_DEFS
      .map((def) => {
        const userAnswer = (answerMap[def.key] || "").trim();
        const goalTitle = userAnswer || getDefaultGoalTitle(def.key, primaryPriority);
        return {
          id: `onb_${def.key}_${Date.now()}`,
          title: goalTitle,
          description: def.description,
          rank: def.rank,
          xp: def.xp,
          progress: 0,
          image: getDefaultGoalImage(def.key),
          jpLabel: def.jpLabel,
          icon: def.icon,
          category: def.category,
          deadline: deriveDeadline(def.key),
          totalMilestones: 10,
          completedMilestones: 0,
          source: "onboarding" as const,
        };
      })
      // Only include if the user gave a meaningful answer OR this category is in selected life areas
      .filter((g) => {
        const answer = (answerMap[
          g.category.toLowerCase()
        ] || "").trim();
        const catKey = g.category.toLowerCase();
        const lifeAreaMap: Record<string, string> = {
          lifestyle: "lifestyle",
          health: "fitness",
          career: "career",
          wealth: "money",
          knowledge: "knowledge",
          relationships: "relationships",
        };
        const lifeArea = lifeAreaMap[catKey];
        return answer.length > 0 || (lifeArea && selectedLifeAreas.includes(lifeArea));
      });

    onComplete({
      profile: data.profile,
      aiGeneratedSystem: data.aiGeneratedSystem,
      triggerPricing: true,
      onboardingGoals,
    });
  };

  const filteredCountries = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-[500] text-white flex flex-col justify-between overflow-hidden select-none"
      style={{ backgroundColor: "#000", fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif" }}
    >

      {/* ═══════════ ANIME BACKGROUND BACKDROP — subtle Jinwoo on welcome + final steps ═══════════ */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {(step === 1 || step === 19 || step === 20) && (
          <>
            <img
              src={step === 19 || step === 20
                ? "/images/sd_jin_redeye.jpg"
                : "/images/sd_jin_hero.jpg"}
              alt=""
              onError={onImgError("/images/sd_jin_minimal.jpg")}
              className="w-full h-full object-cover"
              style={{
                objectPosition: step === 19 || step === 20 ? "center 35%" : "center 30%",
                opacity: step === 19 || step === 20 ? 0.25 : 0.15,
              }}
            />
            {/* Top + bottom dark gradient for text legibility */}
            <div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 40%, rgba(0,0,0,0.7) 100%)",
              }}
            />
            {/* Center vignette */}
            <div
              className="absolute inset-0"
              style={{
                background: "radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.7) 100%)",
              }}
            />
          </>
        )}
      </div>

      {/* ═══════════ TOP HEADER & PROGRESS BAR ═══════════ */}
      {step < 19 && (
        <div className="relative z-20 w-full max-w-xl mx-auto pt-4 px-4 sm:px-6 flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs font-semibold" style={{ color: TEXT_SECONDARY }}>
            <button
              onClick={goBack}
              disabled={step === 1}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${step === 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/[0.06]'}`}
              style={{ border: `1px solid ${HAIRLINE}`, color: TEXT_PRIMARY }}
            >
              <ArrowLeft size={13} /> Back
            </button>
            <div className="flex items-center gap-1.5" style={{ color: ORANGE }}>
              <Sparkles size={12} />
              <span className="font-bold tracking-wider">STEP {step} OF {TOTAL_STEPS}</span>
            </div>
            <div className="font-bold tabular-nums" style={{ color: TEXT_PRIMARY }}>{progressPercentage}%</div>
          </div>

          {/* Progress Bar — iOS segmented style, orange fill */}
          <div
            className="w-full h-1.5 rounded-full overflow-hidden"
            style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: ORANGE }}
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      )}

      {/* ═══════════ MAIN CONTENT AREA ═══════════ */}
      <div className="relative z-10 flex-1 w-full max-w-lg mx-auto px-4 sm:px-6 py-4 flex flex-col justify-center overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className="w-full my-auto"
          >

            {/* ═══════ STEP 1: WELCOME ═══════ */}
            {step === 1 && (
              <div className="text-center space-y-6">
                {/* Top icon — white square (matches Landing page) */}
                <div className="flex justify-center">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: "rgba(255,255,255,0.06)", border: `1px solid ${HAIRLINE}` }}
                  >
                    <Shield size={32} style={{ color: TEXT_PRIMARY }} />
                  </div>
                </div>
                <div className="space-y-3">
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase"
                    style={{ backgroundColor: "rgba(255,255,255,0.06)", color: TEXT_PRIMARY, border: `1px solid ${HAIRLINE}` }}
                  >
                    AI Life Operating System
                  </span>
                  <h1
                    className="font-bold tracking-tight leading-[1.05]"
                    style={{ color: TEXT_PRIMARY, fontSize: "clamp(2rem, 5.5vw, 2.75rem)", letterSpacing: "-0.03em" }}
                  >
                    Welcome to your<br />
                    <span style={{ color: ORANGE }}>new life.</span>
                  </h1>
                  <p className="text-sm sm:text-base max-w-sm mx-auto" style={{ color: TEXT_SECONDARY }}>
                    In just 2 minutes, we'll build your personalized AI Life System.
                  </p>
                </div>
                <button
                  onClick={goNext}
                  className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
                  style={{ backgroundColor: ORANGE, color: "#000" }}
                >
                  Start assessment <ArrowRight size={18} style={{ color: "#000" }} />
                </button>
              </div>
            )}

            {/* ═══════ STEP 2: NAME ═══════ */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="space-y-2 text-center sm:text-left">
                  <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: TEXT_TERTIARY }}>Identify yourself</div>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: TEXT_PRIMARY, letterSpacing: "-0.02em" }}>
                    What should we call you?
                  </h2>
                </div>
                <div className="space-y-4">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your first name"
                    autoFocus
                    className="w-full rounded-2xl px-5 py-4 text-xl focus:outline-none transition-colors"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.04)",
                      border: `1px solid ${HAIRLINE}`,
                      color: TEXT_PRIMARY,
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && name.trim() && goNext()}
                  />
                  <button
                    onClick={goNext}
                    disabled={!name.trim()}
                    className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-colors disabled:opacity-30"
                    style={{ backgroundColor: ORANGE, color: "#000" }}
                  >
                    Continue <ArrowRight size={18} style={{ color: "#000" }} />
                  </button>
                </div>
              </div>
            )}

            {/* ═══════ STEP 3: COUNTRY ═══════ */}
            {step === 3 && (
              <div className="space-y-5">
                <div className="space-y-1">
                  <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: TEXT_TERTIARY }}>Origin</div>
                  <h2 className="text-2xl font-bold tracking-tight" style={{ color: TEXT_PRIMARY, letterSpacing: "-0.02em" }}>
                    Select your country
                  </h2>
                </div>

                <div className="relative">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: TEXT_TERTIARY }} />
                  <input
                    type="text"
                    value={countrySearch}
                    onChange={(e) => setCountrySearch(e.target.value)}
                    placeholder="Search country..."
                    className="w-full rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none transition-colors"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.04)",
                      border: `1px solid ${HAIRLINE}`,
                      color: TEXT_PRIMARY,
                    }}
                  />
                </div>

                <div className="max-h-60 overflow-y-auto space-y-2 pr-1" style={{ scrollbarWidth: "thin" }}>
                  {filteredCountries.map(c => {
                    const isSelected = country === c.name;
                    return (
                      <button
                        key={c.code}
                        onClick={() => { setCountry(c.name); goNext(); }}
                        className="w-full p-3 rounded-xl flex items-center justify-between transition-colors"
                        style={{
                          backgroundColor: isSelected ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.02)",
                          border: `1px solid ${isSelected ? HAIRLINE_STRONG : HAIRLINE}`,
                          color: isSelected ? TEXT_PRIMARY : TEXT_SECONDARY,
                          fontWeight: isSelected ? 600 : 400,
                        }}
                      >
                        <span className="flex items-center gap-3">
                          <span className="text-2xl">{c.flag}</span>
                          <span className="text-sm">{c.name}</span>
                        </span>
                        {isSelected && <Check size={16} style={{ color: TEXT_PRIMARY }} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ═══════ STEP 4: AGE ═══════ */}
            {step === 4 && (
              <div className="space-y-6">
                <div className="space-y-1 text-center">
                  <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: TEXT_TERTIARY }}>Age group</div>
                  <h2 className="text-2xl font-bold tracking-tight" style={{ color: TEXT_PRIMARY, letterSpacing: "-0.02em" }}>
                    How old are you?
                  </h2>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {["13–17", "18–24", "25–34", "35–44", "45+"].map(age => {
                    const isSelected = ageGroup === age;
                    return (
                      <button
                        key={age}
                        onClick={() => { setAgeGroup(age); goNext(); }}
                        className="p-4 rounded-2xl text-center text-lg font-semibold transition-colors"
                        style={{
                          backgroundColor: isSelected ? "rgba(255,159,10,0.15)" : "rgba(255,255,255,0.02)",
                          border: `1px solid ${isSelected ? ORANGE : HAIRLINE}`,
                          color: isSelected ? ORANGE : TEXT_PRIMARY,
                        }}
                      >
                        {age}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ═══════ STEP 5: GENDER ═══════ */}
            {step === 5 && (
              <div className="space-y-6">
                <div className="space-y-1 text-center">
                  <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: TEXT_TERTIARY }}>Gender (optional)</div>
                  <h2 className="text-2xl font-bold tracking-tight" style={{ color: TEXT_PRIMARY, letterSpacing: "-0.02em" }}>
                    Select your gender
                  </h2>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {["Male", "Female", "Prefer not to say"].map(g => {
                    const isSelected = gender === g;
                    return (
                      <button
                        key={g}
                        onClick={() => { setGender(g); goNext(); }}
                        className="p-4 rounded-2xl text-center text-lg font-semibold transition-colors"
                        style={{
                          backgroundColor: isSelected ? "rgba(255,159,10,0.15)" : "rgba(255,255,255,0.02)",
                          border: `1px solid ${isSelected ? ORANGE : HAIRLINE}`,
                          color: isSelected ? ORANGE : TEXT_PRIMARY,
                        }}
                      >
                        {g}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ═══════ STEP 6: LIFE AREAS (MULTI SELECT) ═══════ */}
            {step === 6 && (
              <div className="space-y-5">
                <div className="space-y-1">
                  <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: TEXT_TERTIARY }}>Multi-select</div>
                  <h2 className="text-2xl font-bold tracking-tight" style={{ color: TEXT_PRIMARY, letterSpacing: "-0.02em" }}>
                    Which areas do you want to improve?
                  </h2>
                </div>
                <div className="grid grid-cols-2 gap-2.5 max-h-[340px] overflow-y-auto pr-1" style={{ scrollbarWidth: "thin" }}>
                  {LIFE_AREAS.map(area => {
                    const isSelected = selectedLifeAreas.includes(area.id);
                    return (
                      <button
                        key={area.id}
                        onClick={() => toggleLifeArea(area.id)}
                        className="p-3 rounded-2xl text-left transition-colors flex flex-col justify-between"
                        style={{
                          backgroundColor: isSelected ? "rgba(255,159,10,0.15)" : "rgba(255,255,255,0.02)",
                          border: `1px solid ${isSelected ? ORANGE : HAIRLINE}`,
                        }}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <span className="text-2xl">{area.icon}</span>
                          {isSelected && <CheckCircle2 size={16} style={{ color: ORANGE }} />}
                        </div>
                        <div>
                          <div className="font-semibold text-sm" style={{ color: TEXT_PRIMARY }}>{area.label}</div>
                          <div className="text-[10px]" style={{ color: TEXT_TERTIARY }}>{area.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={goNext}
                  className="w-full py-3.5 rounded-2xl font-bold transition-colors"
                  style={{ backgroundColor: ORANGE, color: "#000" }}
                >
                  Next step ({selectedLifeAreas.length} selected)
                </button>
              </div>
            )}

            {/* ═══════ STEP 7: #1 PRIORITY ═══════ */}
            {step === 7 && (
              <div className="space-y-5">
                <div className="space-y-1">
                  <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: TEXT_TERTIARY }}>Core focus</div>
                  <h2 className="text-2xl font-bold tracking-tight" style={{ color: TEXT_PRIMARY, letterSpacing: "-0.02em" }}>
                    What's your #1 priority?
                  </h2>
                </div>
                <div className="grid grid-cols-1 gap-2.5 max-h-[320px] overflow-y-auto pr-1" style={{ scrollbarWidth: "thin" }}>
                  {ALL_PRIORITIES.map(p => {
                    const isSelected = primaryPriority === p.label;
                    return (
                      <button
                        key={p.id}
                        onClick={() => { setPrimaryPriority(p.label); goNext(); }}
                        className="p-4 rounded-2xl text-left flex items-center justify-between transition-colors"
                        style={{
                          backgroundColor: isSelected ? "rgba(255,159,10,0.15)" : "rgba(255,255,255,0.02)",
                          border: `1px solid ${isSelected ? ORANGE : HAIRLINE}`,
                          color: isSelected ? ORANGE : TEXT_PRIMARY,
                          fontWeight: isSelected ? 600 : 400,
                        }}
                      >
                        <span className="text-base">{p.label}</span>
                        {isSelected && <Sparkles size={18} style={{ color: ORANGE }} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ═══════ STEP 8: CURRENT SITUATION ═══════ */}
            {step === 8 && (
              <div className="space-y-5">
                <div className="space-y-1">
                  <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: TEXT_TERTIARY }}>Reality check</div>
                  <h2 className="text-2xl font-bold tracking-tight" style={{ color: TEXT_PRIMARY, letterSpacing: "-0.02em" }}>
                    Tell us about your current situation
                  </h2>
                </div>

                <div className="space-y-4 p-5 rounded-3xl" style={{ backgroundColor: "rgba(255,255,255,0.02)", border: `1px solid ${HAIRLINE}` }}>
                  {selectedLifeAreas.includes("fitness") && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] uppercase font-semibold block mb-1" style={{ color: TEXT_TERTIARY }}>Current weight</label>
                        <input
                          type="text"
                          value={currentWeight}
                          onChange={(e) => setCurrentWeight(e.target.value)}
                          className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none transition-colors"
                          style={{ backgroundColor: "rgba(0,0,0,0.4)", border: `1px solid ${HAIRLINE}`, color: TEXT_PRIMARY }}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-semibold block mb-1" style={{ color: TEXT_TERTIARY }}>Target weight</label>
                        <input
                          type="text"
                          value={targetWeight}
                          onChange={(e) => setTargetWeight(e.target.value)}
                          className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none transition-colors"
                          style={{ backgroundColor: "rgba(0,0,0,0.4)", border: `1px solid ${HAIRLINE}`, color: TEXT_PRIMARY }}
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-[10px] uppercase font-semibold block mb-1" style={{ color: TEXT_TERTIARY }}>Current role / occupation</label>
                    <input
                      type="text"
                      value={currentRole}
                      onChange={(e) => setCurrentRole(e.target.value)}
                      className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none transition-colors"
                      style={{ backgroundColor: "rgba(0,0,0,0.4)", border: `1px solid ${HAIRLINE}`, color: TEXT_PRIMARY }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] uppercase font-semibold block mb-1" style={{ color: TEXT_TERTIARY }}>Monthly income</label>
                      <input
                        type="text"
                        value={monthlyIncome}
                        onChange={(e) => setMonthlyIncome(e.target.value)}
                        className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none transition-colors"
                        style={{ backgroundColor: "rgba(0,0,0,0.4)", border: `1px solid ${HAIRLINE}`, color: TEXT_PRIMARY }}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-semibold block mb-1" style={{ color: TEXT_TERTIARY }}>Focused hours / day</label>
                      <input
                        type="text"
                        value={focusedWorkHours}
                        onChange={(e) => setFocusedWorkHours(e.target.value)}
                        className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none transition-colors"
                        style={{ backgroundColor: "rgba(0,0,0,0.4)", border: `1px solid ${HAIRLINE}`, color: TEXT_PRIMARY }}
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={goNext}
                  className="w-full py-3.5 rounded-2xl font-bold transition-colors"
                  style={{ backgroundColor: ORANGE, color: "#000" }}
                >
                  Continue
                </button>
              </div>
            )}

            {/* ═══════ STEP 9: LIFE SATISFACTION SLIDER ═══════ */}
            {step === 9 && (
              <div className="space-y-6 text-center">
                <div className="space-y-1">
                  <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: TEXT_TERTIARY }}>Self assessment</div>
                  <h2 className="text-2xl font-bold tracking-tight" style={{ color: TEXT_PRIMARY, letterSpacing: "-0.02em" }}>
                    How satisfied are you with your current life?
                  </h2>
                </div>

                <div className="py-8 space-y-6">
                  <div className="text-5xl font-bold tabular-nums" style={{ color: ORANGE }}>
                    {lifeSatisfaction} <span className="text-2xl" style={{ color: TEXT_TERTIARY }}>/ 10</span>
                  </div>

                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={lifeSatisfaction}
                    onChange={(e) => setLifeSatisfaction(Number(e.target.value))}
                    className="w-full h-3 rounded-lg appearance-none cursor-pointer"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.08)",
                      accentColor: ORANGE,
                    }}
                  />

                  <div className="text-sm font-semibold" style={{ color: TEXT_PRIMARY }}>
                    {lifeSatisfaction <= 3 && "Struggling & overwhelmed"}
                    {lifeSatisfaction >= 4 && lifeSatisfaction <= 6 && "Surviving / average"}
                    {lifeSatisfaction >= 7 && lifeSatisfaction <= 8 && "Growing & steady"}
                    {lifeSatisfaction >= 9 && "Thriving & unstoppable"}
                  </div>
                </div>

                <button
                  onClick={goNext}
                  className="w-full py-4 rounded-2xl font-bold transition-colors"
                  style={{ backgroundColor: ORANGE, color: "#000" }}
                >
                  Next
                </button>
              </div>
            )}

            {/* ═══════ STEP 10: BLOCKERS (MULTI SELECT) ═══════ */}
            {step === 10 && (
              <div className="space-y-5">
                <div className="space-y-1">
                  <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: TEXT_TERTIARY }}>Friction factors</div>
                  <h2 className="text-2xl font-bold tracking-tight" style={{ color: TEXT_PRIMARY, letterSpacing: "-0.02em" }}>
                    What's stopping you?
                  </h2>
                </div>

                <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1" style={{ scrollbarWidth: "thin" }}>
                  {BLOCKER_OPTIONS.map(b => {
                    const isSelected = selectedBlockers.includes(b);
                    return (
                      <button
                        key={b}
                        onClick={() => toggleBlocker(b)}
                        className="p-3 rounded-xl text-xs font-semibold text-left transition-colors"
                        style={{
                          backgroundColor: isSelected ? "rgba(255,159,10,0.15)" : "rgba(255,255,255,0.02)",
                          border: `1px solid ${isSelected ? ORANGE : HAIRLINE}`,
                          color: isSelected ? ORANGE : TEXT_SECONDARY,
                        }}
                      >
                        {b}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={goNext}
                  className="w-full py-3.5 rounded-2xl font-bold transition-colors"
                  style={{ backgroundColor: ORANGE, color: "#000" }}
                >
                  Next
                </button>
              </div>
            )}

            {/* ═══════ STEP 11: BIGGEST FEAR ═══════ */}
            {step === 11 && (
              <div className="space-y-5">
                <div className="space-y-1">
                  <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: TEXT_TERTIARY }}>Psychology</div>
                  <h2 className="text-2xl font-bold tracking-tight" style={{ color: TEXT_PRIMARY, letterSpacing: "-0.02em" }}>
                    What's your biggest fear?
                  </h2>
                </div>

                <div className="grid grid-cols-1 gap-2.5 max-h-[300px] overflow-y-auto pr-1" style={{ scrollbarWidth: "thin" }}>
                  {FEAR_OPTIONS.map(fear => {
                    const isSelected = biggestFear === fear;
                    return (
                      <button
                        key={fear}
                        onClick={() => { setBiggestFear(fear); goNext(); }}
                        className="p-3.5 rounded-2xl text-left text-sm font-semibold transition-colors"
                        style={{
                          backgroundColor: isSelected ? "rgba(255,159,10,0.15)" : "rgba(255,255,255,0.02)",
                          border: `1px solid ${isSelected ? ORANGE : HAIRLINE}`,
                          color: isSelected ? ORANGE : TEXT_PRIMARY,
                        }}
                      >
                        {fear}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ═══════ STEP 12: MOTIVATIONS ═══════ */}
            {step === 12 && (
              <div className="space-y-5">
                <div className="space-y-1">
                  <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: TEXT_TERTIARY }}>Internal fuel</div>
                  <h2 className="text-2xl font-bold tracking-tight" style={{ color: TEXT_PRIMARY, letterSpacing: "-0.02em" }}>
                    What motivates you the most?
                  </h2>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {MOTIVATIONS.map(m => {
                    const isSelected = primaryMotivation === m;
                    return (
                      <button
                        key={m}
                        onClick={() => { setPrimaryMotivation(m); goNext(); }}
                        className="p-3.5 rounded-2xl text-sm font-bold text-center transition-colors"
                        style={{
                          backgroundColor: isSelected ? "rgba(255,159,10,0.15)" : "rgba(255,255,255,0.02)",
                          border: `1px solid ${isSelected ? ORANGE : HAIRLINE}`,
                          color: isSelected ? ORANGE : TEXT_PRIMARY,
                        }}
                      >
                        {m}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ═══════ STEP 13: 90 DAYS TARGET ═══════ */}
            {step === 13 && (
              <div className="space-y-5">
                <div className="space-y-1">
                  <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: TEXT_TERTIARY }}>90-day horizon</div>
                  <h2 className="text-2xl font-bold tracking-tight" style={{ color: TEXT_PRIMARY, letterSpacing: "-0.02em" }}>
                    What do you want to achieve in 90 days?
                  </h2>
                </div>

                <textarea
                  rows={3}
                  value={target90Days}
                  onChange={(e) => setTarget90Days(e.target.value)}
                  className="w-full rounded-2xl p-4 focus:outline-none transition-colors"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.04)",
                    border: `1px solid ${HAIRLINE}`,
                    color: TEXT_PRIMARY,
                  }}
                />

                <button
                  onClick={goNext}
                  className="w-full py-4 rounded-2xl font-bold transition-colors"
                  style={{ backgroundColor: ORANGE, color: "#000" }}
                >
                  Continue
                </button>
              </div>
            )}

            {/* ═══════ STEP 14: DREAM LIFE 5 YEARS ═══════ */}
            {step === 14 && (
              <div className="space-y-5">
                <div className="space-y-1">
                  <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: TEXT_TERTIARY }}>5-year vision</div>
                  <h2 className="text-2xl font-bold tracking-tight" style={{ color: TEXT_PRIMARY, letterSpacing: "-0.02em" }}>
                    What does your dream life look like?
                  </h2>
                </div>

                <div className="grid grid-cols-1 gap-2.5 max-h-[300px] overflow-y-auto pr-1" style={{ scrollbarWidth: "thin" }}>
                  {DREAM_LIFE_CARDS.map(card => {
                    const isSelected = dreamLifeCard === card.id;
                    return (
                      <button
                        key={card.id}
                        onClick={() => { setDreamLifeCard(card.id); goNext(); }}
                        className="p-4 rounded-2xl text-left flex items-center gap-4 transition-colors"
                        style={{
                          backgroundColor: isSelected ? "rgba(255,159,10,0.15)" : "rgba(255,255,255,0.02)",
                          border: `1px solid ${isSelected ? ORANGE : HAIRLINE}`,
                        }}
                      >
                        <span className="text-3xl">{card.icon}</span>
                        <div>
                          <div className="font-bold text-base" style={{ color: isSelected ? ORANGE : TEXT_PRIMARY }}>{card.label}</div>
                          <div className="text-xs" style={{ color: TEXT_SECONDARY }}>{card.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ═══════ STEP 15: WHY IMPORTANT ═══════ */}
            {step === 15 && (
              <div className="space-y-5">
                <div className="space-y-1">
                  <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: TEXT_TERTIARY }}>Emotional anchor</div>
                  <h2 className="text-2xl font-bold tracking-tight" style={{ color: TEXT_PRIMARY, letterSpacing: "-0.02em" }}>
                    Why is this goal important to you?
                  </h2>
                </div>

                <div className="relative">
                  <textarea
                    rows={4}
                    maxLength={150}
                    value={whyImportant}
                    onChange={(e) => setWhyImportant(e.target.value)}
                    placeholder="If you achieve this goal, how will your life change?"
                    className="w-full rounded-2xl p-4 focus:outline-none transition-colors"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.04)",
                      border: `1px solid ${HAIRLINE}`,
                      color: TEXT_PRIMARY,
                    }}
                  />
                  <div className="absolute right-3 bottom-3 text-xs" style={{ color: TEXT_TERTIARY }}>
                    {whyImportant.length} / 150
                  </div>
                </div>

                <button
                  onClick={goNext}
                  className="w-full py-4 rounded-2xl font-bold transition-colors"
                  style={{ backgroundColor: ORANGE, color: "#000" }}
                >
                  Continue
                </button>
              </div>
            )}

            {/* ═══════ STEP 16: DAILY TIME COMMITMENT ═══════ */}
            {step === 16 && (
              <div className="space-y-5">
                <div className="space-y-1 text-center">
                  <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: TEXT_TERTIARY }}>Daily investment</div>
                  <h2 className="text-2xl font-bold tracking-tight" style={{ color: TEXT_PRIMARY, letterSpacing: "-0.02em" }}>
                    How much time can you invest daily?
                  </h2>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {["10 Minutes", "20 Minutes", "30 Minutes", "45 Minutes", "60+ Minutes"].map(time => {
                    const isSelected = dailyTimeCommitment === time;
                    return (
                      <button
                        key={time}
                        onClick={() => { setDailyTimeCommitment(time); goNext(); }}
                        className="p-4 rounded-2xl text-center font-bold text-lg transition-colors"
                        style={{
                          backgroundColor: isSelected ? "rgba(255,159,10,0.15)" : "rgba(255,255,255,0.02)",
                          border: `1px solid ${isSelected ? ORANGE : HAIRLINE}`,
                          color: isSelected ? ORANGE : TEXT_PRIMARY,
                        }}
                      >
                        {time}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ═══════ STEP 17: AI COACHING STYLE ═══════ */}
            {step === 17 && (
              <div className="space-y-5">
                <div className="space-y-1">
                  <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: TEXT_TERTIARY }}>AI persona</div>
                  <h2 className="text-2xl font-bold tracking-tight" style={{ color: TEXT_PRIMARY, letterSpacing: "-0.02em" }}>
                    How should your AI Coach guide you?
                  </h2>
                </div>

                <div className="grid grid-cols-1 gap-2.5 max-h-[300px] overflow-y-auto pr-1" style={{ scrollbarWidth: "thin" }}>
                  {COACH_STYLES.map(coach => {
                    const isSelected = coachingStyle === coach.id;
                    return (
                      <button
                        key={coach.id}
                        onClick={() => { setCoachingStyle(coach.id); goNext(); }}
                        className="p-3.5 rounded-2xl text-left transition-colors"
                        style={{
                          backgroundColor: isSelected ? "rgba(255,159,10,0.15)" : "rgba(255,255,255,0.02)",
                          border: `1px solid ${isSelected ? ORANGE : HAIRLINE}`,
                        }}
                      >
                        <div className="font-bold text-base" style={{ color: isSelected ? ORANGE : TEXT_PRIMARY }}>{coach.title}</div>
                        <div className="text-xs" style={{ color: TEXT_SECONDARY }}>{coach.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ═══════ STEP 18: CONFIDENCE WITHOUT GUIDANCE ═══════ */}
            {step === 18 && (
              <div className="space-y-5 text-left">
                <div className="space-y-1 text-center">
                  <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: TEXT_TERTIARY }}>Define your goals</div>
                  <h2 className="text-2xl font-bold tracking-tight" style={{ color: TEXT_PRIMARY, letterSpacing: "-0.02em" }}>
                    What do you want to achieve?
                  </h2>
                  <p className="text-xs" style={{ color: TEXT_SECONDARY }}>
                    Describe one goal in each life area. These will appear in your Goals page.
                  </p>
                </div>

                <div className="space-y-3 max-h-[44vh] overflow-y-auto pr-1">
                  <GoalInput label="🏠 Lifestyle" value={lifestyleGoal} onChange={setLifestyleGoal} placeholder="e.g., Move to my dream apartment" />
                  <GoalInput label="💪 Health" value={healthGoal} onChange={setHealthGoal} placeholder="e.g., Run a half marathon" />
                  <GoalInput label="🚀 Career" value={careerGoal} onChange={setCareerGoal} placeholder="e.g., Get promoted to senior role" />
                  <GoalInput label="💰 Wealth" value={wealthGoal} onChange={setWealthGoal} placeholder="e.g., Save ₹10L for house down payment" />
                  <GoalInput label="📚 Knowledge" value={knowledgeGoal} onChange={setKnowledgeGoal} placeholder="e.g., Master React & build 3 apps" />
                  <GoalInput label="🤝 Relationships" value={relationshipsGoal} onChange={setRelationshipsGoal} placeholder="e.g., Reconnect with 5 old friends" />
                </div>

                <button
                  onClick={goNext}
                  className="w-full py-4 rounded-2xl font-bold transition-colors"
                  style={{ backgroundColor: ORANGE, color: "#000" }}
                >
                  Generate AI analysis →
                </button>
              </div>
            )}

            {/* ═══════ STEP 19: FULL SCREEN AI ANALYSIS LOADING — Jinwoo redeye background ═══════ */}
            {step === 19 && (
              <div className="text-center space-y-8 py-10">
                <div className="relative mx-auto w-32 h-32 flex items-center justify-center">
                  {/* Outer ring (orange) */}
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      border: "4px solid rgba(255,159,10,0.2)",
                      borderTopColor: ORANGE,
                      animation: "spin 1s linear infinite",
                    }}
                  />
                  {/* Inner ring (white) */}
                  <div
                    className="absolute inset-2 rounded-full"
                    style={{
                      border: "4px solid rgba(255,255,255,0.1)",
                      borderBottomColor: TEXT_PRIMARY,
                      animation: "spin 1.4s linear infinite reverse",
                    }}
                  />
                  <Brain size={48} style={{ color: ORANGE }} />
                </div>

                <div className="space-y-3">
                  <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: ORANGE }}>
                    Synthesizing system ({analysisIndex + 1}/10)
                  </div>
                  <h2 className="text-2xl font-bold min-h-[36px] transition-all" style={{ color: TEXT_PRIMARY }}>
                    {ANALYSIS_MESSAGES[analysisIndex]}
                  </h2>
                  <p className="text-xs" style={{ color: TEXT_SECONDARY }}>
                    Constructing your custom Life Blueprint &amp; RPG Engine...
                  </p>
                </div>

                <style>{`
                  @keyframes spin { to { transform: rotate(360deg); } }
                `}</style>
              </div>
            )}

            {/* ═══════ STEP 20: PERSONALIZED PREVIEW + UNLOCK CTA — Jinwoo redeye background ═══════ */}
            {step === 20 && (
              <div className="space-y-5 my-auto py-2">

                <div className="text-center space-y-2">
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                    style={{
                      backgroundColor: "rgba(255,159,10,0.15)",
                      color: ORANGE,
                      border: `1px solid ${ORANGE}`,
                    }}
                  >
                    <CheckCircle2 size={13} /> Your personalized life system is ready
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: TEXT_PRIMARY, letterSpacing: "-0.02em" }}>
                    System diagnostic complete.
                  </h2>
                </div>

                {/* Unlocked Highlights */}
                <div
                  className="p-4 rounded-3xl space-y-3"
                  style={{ backgroundColor: "rgba(255,255,255,0.04)", border: `1px solid ${HAIRLINE}` }}
                >
                  <div className="flex items-center justify-between" style={{ borderBottom: `1px solid ${HAIRLINE}`, paddingBottom: 8 }}>
                    <span className="text-xs uppercase font-semibold" style={{ color: TEXT_TERTIARY }}>Primary mission</span>
                    <span className="text-xs font-bold" style={{ color: ORANGE }}>Activated</span>
                  </div>
                  <p className="font-bold text-sm" style={{ color: TEXT_PRIMARY }}>
                    {primaryPriority} — master in 90 days
                  </p>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div
                      className="p-2.5 rounded-xl"
                      style={{ backgroundColor: "rgba(0,0,0,0.4)", border: `1px solid ${HAIRLINE}` }}
                    >
                      <div className="text-[10px] uppercase font-semibold" style={{ color: TEXT_TERTIARY }}>Life score</div>
                      <div className="text-xl font-bold tabular-nums" style={{ color: ORANGE }}>{calculatedLifeScore} / 100</div>
                    </div>
                    <div
                      className="p-2.5 rounded-xl"
                      style={{ backgroundColor: "rgba(0,0,0,0.4)", border: `1px solid ${HAIRLINE}` }}
                    >
                      <div className="text-[10px] uppercase font-semibold" style={{ color: TEXT_TERTIARY }}>Biggest strength</div>
                      <div className="text-xs font-semibold" style={{ color: TEXT_PRIMARY }}>High ambition</div>
                    </div>
                  </div>

                  <div
                    className="p-2.5 rounded-xl"
                    style={{ backgroundColor: "rgba(0,0,0,0.4)", border: `1px solid ${HAIRLINE}` }}
                  >
                    <div className="text-[10px] uppercase font-semibold" style={{ color: TEXT_TERTIARY }}>First daily mission</div>
                    <div className="text-xs font-bold" style={{ color: TEXT_PRIMARY }}>10-min morning focus ritual + priorities task</div>
                  </div>
                </div>

                {/* Locked System Insights */}
                <div className="space-y-1.5">
                  <div className="text-[10px] uppercase font-semibold tracking-wider text-center" style={{ color: TEXT_TERTIARY }}>
                    Locked system insights
                  </div>
                  <div className="grid grid-cols-2 gap-2 relative">
                    {[
                      "90-Day Blueprint", "AI Coach", "Daily Missions",
                      "RPG XP System", "Achievement System", "Habit Tracker",
                      "Manifestation Dashboard", "Analytics"
                    ].map((item, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-2xl flex items-center justify-between"
                        style={{
                          backgroundColor: "rgba(255,255,255,0.02)",
                          border: `1px solid ${HAIRLINE}`,
                        }}
                      >
                        <span className="text-xs font-semibold" style={{ color: TEXT_TERTIARY, filter: "blur(2px)" }}>{item}</span>
                        <Lock size={12} style={{ color: ORANGE }} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* 🟠 Unlock CTA — big orange */}
                <button
                  onClick={handleUnlockFullSystem}
                  className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
                  style={{ backgroundColor: ORANGE, color: "#000" }}
                >
                  <Sparkles size={18} style={{ color: "#000" }} />
                  Unlock your complete AI life system
                </button>

                <button
                  onClick={signOut}
                  className="w-full py-2.5 rounded-2xl text-xs font-medium transition-colors flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.04)",
                    border: `1px solid ${HAIRLINE}`,
                    color: TEXT_SECONDARY,
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = TEXT_PRIMARY; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = TEXT_SECONDARY; }}
                >
                  <LogOut size={14} /> Back to landing page (sign out)
                </button>

              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

    </div>
  );
}

// ============== HELPER FUNCTIONS FOR ONBOARDING GOALS ==============
function getDefaultGoalTitle(category: string, primaryPriority: string): string {
  const map: Record<string, string> = {
    lifestyle: "Build Your Ideal Lifestyle",
    health: "Achieve Peak Health & Fitness",
    career: "Advance Your Career Path",
    wealth: "Build Long-Term Wealth",
    knowledge: "Master a New Skill",
    relationships: "Deepen Key Relationships",
  };
  // If the user's primaryPriority is in this category, use it
  const priority = (primaryPriority || "").toLowerCase();
  if (
    category === "wealth" &&
    (priority.includes("earn") ||
      priority.includes("₹") ||
      priority.includes("$") ||
      priority.includes("income") ||
      priority.includes("money"))
  ) {
    return primaryPriority;
  }
  if (
    category === "career" &&
    (priority.includes("job") ||
      priority.includes("promotion") ||
      priority.includes("startup") ||
      priority.includes("brand") ||
      priority.includes("business") ||
      priority.includes("career"))
  ) {
    return primaryPriority;
  }
  if (
    category === "health" &&
    (priority.includes("fat") ||
      priority.includes("muscle") ||
      priority.includes("six pack") ||
      priority.includes("fitness") ||
      priority.includes("weight"))
  ) {
    return primaryPriority;
  }
  return map[category] || `Achieve your ${category} goal`;
}

function getDefaultGoalImage(category: string): string {
  const map: Record<string, string> = {
    lifestyle: "/images/goal_house.jpg",
    health: "/images/goal_jinwoo.jpg",
    career: "/images/goal_jinwoo.jpg",
    wealth: "/images/goal_house.jpg",
    knowledge: "/images/goal_jinwoo.jpg",
    relationships: "/images/goal_house.jpg",
  };
  return map[category] || "/images/goal_jinwoo.jpg";
}

function deriveDeadline(category: string): string {
  // 90 days from now for most, 365 for wealth/career
  const now = new Date();
  const days = category === "wealth" || category === "career" ? 365 : 90;
  now.setDate(now.getDate() + days);
  return now.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ============== GOAL INPUT (reusable for category goal entry) ==============
const GoalInput: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}> = ({ label, value, onChange, placeholder }) => (
  <div
    className="rounded-xl p-3"
    style={{
      backgroundColor: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.08)",
    }}
  >
    <label
      className="text-[10px] font-bold tracking-widest uppercase mb-1.5 block"
      style={{ color: "rgba(235,235,245,0.62)" }}
    >
      {label}
    </label>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      maxLength={80}
      className="w-full px-2.5 py-2 rounded-lg text-[13px] outline-none"
      style={{
        backgroundColor: "#000",
        border: "1px solid rgba(255,255,255,0.08)",
        color: "#ffffff",
        fontFamily: "inherit",
      }}
      placeholder={placeholder}
    />
  </div>
);

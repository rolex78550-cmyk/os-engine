import React, { useState } from "react";
import {
  Target, Plus, Sparkles, Loader2, Calendar, Flag, ArrowRight,
  ChevronDown, ChevronUp, Trash2, Star, CheckCircle, Edit2, Zap,
  Award, Bot, Filter, CheckSquare, Square, Flame, RefreshCw, Sliders, X
} from "lucide-react";
import { Desire, GoalCategory, ProfileState } from "../../types";
import { resolveImageUrl, onImgError } from "../../lib/imageHelper";

interface GoalsViewProps {
  newGoalTitle: string;
  setNewGoalTitle: (v: string) => void;
  newGoalCategory: GoalCategory;
  setNewGoalCategory: (v: GoalCategory) => void;
  newGoalIcon: string;
  setNewGoalIcon: (v: string) => void;
  handleCreateGoal: (e: React.FormEvent) => Promise<void>;
  desires: Desire[];
  handleDeleteGoal?: (id: string) => void;
  handleUpdateGoal?: (id: string, updates: Partial<Desire>) => Promise<void> | void;
  isCreatingGoal?: boolean;
  setNotificationMsg: (msg: string | null) => void;
  profile?: ProfileState;
}

// iOS 17 design tokens — pure neutral, no neon, no glow.
const TEXT_PRIMARY = "#ffffff";
const TEXT_SECONDARY = "rgba(235,235,245,0.62)";
const TEXT_TERTIARY = "rgba(235,235,245,0.32)";
const SURFACE = "#0a0a0a";
const HAIRLINE = "rgba(255,255,255,0.08)";
const HAIRLINE_STRONG = "rgba(255,255,255,0.18)";

export const GoalsView: React.FC<GoalsViewProps> = ({
  newGoalTitle, setNewGoalTitle, newGoalCategory, setNewGoalCategory,
  newGoalIcon, setNewGoalIcon, handleCreateGoal, desires, handleDeleteGoal, handleUpdateGoal,
  isCreatingGoal = false, setNotificationMsg, profile
}) => {
  const [selectedGoal, setSelectedGoal] = useState<any>(null);
  const [primaryGoalId, setPrimaryGoalId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showAllGoals, setShowAllGoals] = useState(false);
  const [selectedTimelineStep, setSelectedTimelineStep] = useState<number | null>(null);
  const [aiCoachAdvice, setAiCoachAdvice] = useState<string | null>(null);
  const [isGeneratingAdvice, setIsGeneratingAdvice] = useState(false);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editNextMission, setEditNextMission] = useState("");

  // Milestone completion map per goal
  const [completedMilestones, setCompletedMilestones] = useState<Record<string, number[]>>({});

  // Fallback goals if desires is empty
  const fallbackGoals = [
    { id: "g1", title: "Dream House", cat: "Lifestyle", category: "lifestyle", pct: 78, next: "Increase Savings", date: "31 Dec 2027", xp: 300, color: "#3b82f6", icon: "🏠" },
    { id: "g2", title: "Build Six Pack", cat: "Health", category: "health", pct: 62, next: "Complete 4 Workouts", date: "30 Nov 2025", xp: 250, color: "#10b981", icon: "💪" },
    { id: "g3", title: "Launch SaaS", cat: "Career", category: "career", pct: 45, next: "Build Landing Page", date: "15 Jan 2026", xp: 400, color: "#a855f7", icon: "🚀" },
    { id: "g4", title: "Financial Freedom", cat: "Wealth", category: "wealth", pct: 55, next: "Invest in Index Funds", date: "31 Dec 2026", xp: 350, color: "#f59e0b", icon: "💰" },
  ];

  // Dynamic mapping for real desires — accent color stays neutral white for active state
  const mapDesireToGoal = (d: Desire, idx: number) => {
    const title = d.title || "Untitled Goal";
    const catRaw = (d.category || "lifestyle").toLowerCase();
    const catLabel = catRaw.charAt(0).toUpperCase() + catRaw.slice(1);

    let color = "#ffffff"; // neutral white
    let icon = d.icon || "🎯";
    let next = (d as any).nextMission || "Take massive action";
    let xp = 320;

    const tl = title.toLowerCase();

    if (catRaw === "wealth" || tl.includes("money") || tl.includes("financial") || tl.includes("freedom")) {
      icon = d.icon || "💰"; xp = 350; next = (d as any).nextMission || "Invest in Index Funds";
    } else if (["health", "fitness"].includes(catRaw) || tl.includes("pack") || tl.includes("six") || tl.includes("body")) {
      icon = d.icon || "💪"; xp = 250; next = (d as any).nextMission || "Complete 4 Workouts";
    } else if (catRaw === "career" || tl.includes("saas") || tl.includes("launch") || tl.includes("business")) {
      icon = d.icon || "🚀"; xp = 400; next = (d as any).nextMission || "Build Landing Page";
    } else if (catRaw === "lifestyle" || tl.includes("house") || tl.includes("dream") || tl.includes("home")) {
      icon = d.icon || "🏠"; xp = 300; next = (d as any).nextMission || "Increase Savings";
    }

    if (tl.includes("house") || tl.includes("dream")) { icon = d.icon || "🏠"; }
    if (tl.includes("six") || tl.includes("pack") || tl.includes("abs")) { icon = d.icon || "💪"; }
    if (tl.includes("saas") || tl.includes("launch")) { icon = d.icon || "🚀"; }
    if (tl.includes("financial") || tl.includes("freedom") || tl.includes("million")) { icon = d.icon || "💰"; }

    return {
      id: d.id,
      title,
      cat: catLabel,
      category: catRaw,
      pct: Math.max(5, Math.min(100, d.progress ?? (38 + (idx % 4) * 12))),
      next,
      date: d.expectedReality || "31 Dec 2026",
      xp,
      color,
      icon,
      originalDesire: d
    };
  };

  // All active goals
  const allActiveGoals = desires.length > 0
    ? desires.map((d, i) => mapDesireToGoal(d, i))
    : fallbackGoals;

  // Category Filter
  const filteredGoals = selectedCategory === "all"
    ? allActiveGoals
    : allActiveGoals.filter(g => g.category.toLowerCase() === selectedCategory.toLowerCase());

  // Displayed goals (4 or all)
  const displayedGoals = showAllGoals ? filteredGoals : filteredGoals.slice(0, 4);
  const hasMore = filteredGoals.length > 4;

  // Primary Goal selection
  const primaryGoal = allActiveGoals.find(g => g.id === primaryGoalId) || allActiveGoals[0] || fallbackGoals[0];

  // Suggestions for rapid creation
  const suggestions = [
    { icon: "💪", label: "Build Six Pack", cat: "fitness" as GoalCategory },
    { icon: "💰", label: "Make $1 Million", cat: "wealth" as GoalCategory },
    { icon: "🏠", label: "Dream House", cat: "lifestyle" as GoalCategory },
    { icon: "🚗", label: "BMW M4", cat: "lifestyle" as GoalCategory },
    { icon: "✈️", label: "Japan Trip", cat: "lifestyle" as GoalCategory },
    { icon: "🚀", label: "Launch SaaS Product", cat: "career" as GoalCategory },
  ];

  const categories = [
    { id: "all", label: "All Goals", icon: "✨" },
    { id: "wealth", label: "Wealth", icon: "💰" },
    { id: "career", label: "Career", icon: "🚀" },
    { id: "health", label: "Health", icon: "💪" },
    { id: "lifestyle", label: "Lifestyle", icon: "✨" },
  ];

  const iconOptions = ["🏠", "💰", "🚀", "💪", "🏎️", "✈️", "❤️", "🏆", "✨", "🧠", "🌊"];

  const timelineSteps = [
    { phase: 1, l: "Define Identity", d: "Embody the self that already achieved it.", pctRange: "0 - 15%" },
    { phase: 2, l: "Milestone 1", d: "Build Strong Foundation & Systems", pctRange: "16 - 35%" },
    { phase: 3, l: "Milestone 2", d: "Take Massive Daily Action", pctRange: "36 - 55%" },
    { phase: 4, l: "Milestone 3", d: "Overcome Obstacles & Friction", pctRange: "56 - 75%" },
    { phase: 5, l: "Breakthrough Phase", d: "Rapid Compound Acceleration", pctRange: "76 - 95%" },
    { phase: 6, l: "Reality Manifested", d: "Goal Transformed into Living Reality", pctRange: "96 - 100%" },
  ];

  // 6 Milestones per goal for interactive roadmap
  const getGoalMilestones = (goal: any) => [
    { title: "Define Core Identity & Vision", desc: "Clarity on why this goal matters deeply." },
    { title: "Establish Daily Habit Loop", desc: "Set up 1 non-negotiable daily action." },
    { title: "Execute First Major Sprint", desc: "Complete 14 consecutive days of execution." },
    { title: "Overcome Initial Roadblock", desc: "Resolve friction and refine strategy." },
    { title: "Cross 75% Completion Threshold", desc: "Compound momentum taking effect." },
    { title: "Final Integration & Manifestation", desc: "Celebrate success and maintain mastery." },
  ];

  // Handlers
  const handleSelectPrimary = (id: string, title: string) => {
    setPrimaryGoalId(id);
    setNotificationMsg(`Set "${title}" as your Primary Future Identity`);
    setTimeout(() => setNotificationMsg(null), 2500);
  };

  const handleApplySuggestion = (s: { label: string; icon: string; cat: GoalCategory }) => {
    setNewGoalTitle(s.label);
    setNewGoalCategory(s.cat);
    setNewGoalIcon(s.icon);
    setNotificationMsg(`Applied template: ${s.icon} ${s.label}`);
    setTimeout(() => setNotificationMsg(null), 2000);
  };

  const handleUpdateProgress = async (goalId: string, currentPct: number, delta: number) => {
    const newPct = Math.min(100, Math.max(0, currentPct + delta));
    if (handleUpdateGoal) {
      await handleUpdateGoal(goalId, { progress: newPct });
    }
    setNotificationMsg(`Progress updated to ${newPct}% (+${Math.abs(delta * 5)} XP)`);
    setTimeout(() => setNotificationMsg(null), 2200);

    if (selectedGoal && selectedGoal.id === goalId) {
      setSelectedGoal((prev: any) => ({ ...prev, pct: newPct }));
    }
  };

  const handleToggleMilestone = async (goalId: string, idx: number, currentPct: number) => {
    const currentCompleted = completedMilestones[goalId] || [];
    const isDone = currentCompleted.includes(idx);
    const updated = isDone
      ? currentCompleted.filter(i => i !== idx)
      : [...currentCompleted, idx];

    setCompletedMilestones(prev => ({ ...prev, [goalId]: updated }));

    // Auto update progress %
    const calculatedPct = Math.min(100, Math.round((updated.length / 6) * 100));
    if (handleUpdateGoal) {
      await handleUpdateGoal(goalId, { progress: calculatedPct });
    }

    if (selectedGoal && selectedGoal.id === goalId) {
      setSelectedGoal((prev: any) => ({ ...prev, pct: calculatedPct }));
    }

    setNotificationMsg(isDone ? `Milestone unchecked` : `Milestone completed. Progress ${calculatedPct}% (+50 XP)`);
    setTimeout(() => setNotificationMsg(null), 2200);
  };

  const handleGenerateAICoach = (goal: any) => {
    setIsGeneratingAdvice(true);
    setAiCoachAdvice(null);

    setTimeout(() => {
      const adviceList = [
        `Quantum Strategy for ${goal.title}:\n1. Focus on identity shift first: feel as if you already achieved ${goal.title}.\n2. Break into 15-min daily focus blocks.\n3. Remove top friction: batch decision-making to the night before.`,
        `Accelerated Blueprint for ${goal.title}:\n1. Eliminate competing low-yield tasks.\n2. Execute 1 key sprint task every morning at 8:00 AM.\n3. Track alignment daily for maximum compounding power.`,
        `Reality Alignment for ${goal.title}:\n1. Re-anchor your core belief level to 90%+.\n2. Implement a 369 scripting session before sleep.\n3. Celebrate small weekly wins to sustain momentum.`
      ];
      setAiCoachAdvice(adviceList[Math.floor(Math.random() * adviceList.length)]);
      setIsGeneratingAdvice(false);
    }, 1200);
  };

  const handleOpenGoalModal = (goal: any) => {
    setSelectedGoal(goal);
    setEditTitle(goal.title);
    setEditDate(goal.date);
    setEditNextMission(goal.next);
    setIsEditingGoal(false);
    setAiCoachAdvice(null);
  };

  const handleSaveGoalEdits = async () => {
    if (!selectedGoal) return;
    if (handleUpdateGoal) {
      await handleUpdateGoal(selectedGoal.id, {
        title: editTitle,
        expectedReality: editDate,
        ...( { nextMission: editNextMission } as any)
      });
    }
    setSelectedGoal((prev: any) => ({
      ...prev,
      title: editTitle,
      date: editDate,
      next: editNextMission
    }));
    setIsEditingGoal(false);
    setNotificationMsg("Goal updated successfully");
    setTimeout(() => setNotificationMsg(null), 2200);
  };

  return (
    <div className="text-white space-y-4 sm:space-y-5">

      {/* HEADER BAR */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl p-4"
        style={{ backgroundColor: SURFACE, border: `1px solid ${HAIRLINE}` }}
      >
        <div>
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2" style={{ color: TEXT_PRIMARY }}>
            <Target className="w-5 h-5" style={{ color: TEXT_PRIMARY }} />
            Reality Architect & Goal Engine
          </h2>
          <p className="text-xs mt-0.5" style={{ color: TEXT_SECONDARY }}>Design your future identity. Track milestones. Manifest results.</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-[11px] font-semibold px-3 py-1.5 rounded-full"
            style={{
              backgroundColor: "rgba(255,255,255,0.06)",
              color: TEXT_PRIMARY,
              border: `1px solid ${HAIRLINE}`,
            }}
          >
            {allActiveGoals.length} active goals
          </span>
        </div>
      </div>

      {/* ONBOARDING DYNAMIC BLUEPRINT BANNER */}
      {(profile?.target90Days || profile?.longTermGoal || profile?.primaryPriority || profile?.primaryFocus) && (
        <div
          className="p-5 sm:p-6 rounded-3xl relative overflow-hidden"
          style={{ backgroundColor: SURFACE, border: `1px solid ${HAIRLINE}` }}
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
            <div className="space-y-2 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.06)",
                    color: TEXT_PRIMARY,
                    border: `1px solid ${HAIRLINE}`,
                  }}
                >
                  <Sparkles size={11} /> Onboarding manifest alignment
                </span>
                {profile?.identityArchetype && (
                  <span
                    className="text-[10px] font-medium px-2.5 py-0.5 rounded-full"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.04)",
                      color: TEXT_SECONDARY,
                      border: `1px solid ${HAIRLINE}`,
                    }}
                  >
                    Archetype: {profile.identityArchetype}
                  </span>
                )}
                {profile?.coachStyle && (
                  <span
                    className="text-[10px] font-medium px-2.5 py-0.5 rounded-full"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.04)",
                      color: TEXT_SECONDARY,
                      border: `1px solid ${HAIRLINE}`,
                    }}
                  >
                    {profile.coachStyle}
                  </span>
                )}
              </div>

              <h3 className="text-lg sm:text-xl font-bold tracking-tight" style={{ color: TEXT_PRIMARY }}>
                90-Day Target: <span style={{ color: TEXT_SECONDARY }}>"{profile?.target90Days || profile?.longTermGoal}"</span>
              </h3>

              <p className="text-xs leading-relaxed" style={{ color: TEXT_SECONDARY }}>
                Your entire Goal System is dynamically calibrated to conquer your primary priority (<strong style={{ color: TEXT_PRIMARY }}>{profile?.primaryPriority || profile?.primaryFocus || "Wealth & Business"}</strong>) with a daily commitment of <strong style={{ color: TEXT_PRIMARY }}>{profile?.commitment || "2 Hours/Day"}</strong>.
              </p>

              {/* Blockers being actively destroyed */}
              {Array.isArray(profile?.blockers) && profile.blockers.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] font-medium" style={{ color: TEXT_TERTIARY }}>TARGETED BLOCKERS:</span>
                  {profile.blockers.map((b, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] px-2 py-0.5 rounded-md font-medium"
                      style={{
                        backgroundColor: "rgba(255,69,58,0.08)",
                        color: "#ff453a",
                        border: "1px solid rgba(255,69,58,0.2)",
                      }}
                    >
                      {b}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => {
                const targetTitle = profile?.target90Days || profile?.longTermGoal || "90-Day Vision";
                setNewGoalTitle(targetTitle);
                setNewGoalCategory((profile?.primaryFocus || "wealth") as any);
                setNewGoalIcon("🎯");
                setNotificationMsg(`Loaded Onboarding Goal into Creator: "${targetTitle}"`);
                setTimeout(() => setNotificationMsg(null), 2500);
              }}
              className="w-full md:w-auto px-4 py-2.5 text-xs rounded-2xl flex items-center justify-center gap-2 transition-colors shrink-0"
              style={{ backgroundColor: TEXT_PRIMARY, color: "#000" }}
            >
              <Zap size={14} />
              Sync onboarding target as goal
            </button>
          </div>
        </div>
      )}

      {/* HERO FUTURE IDENTITY CARD — with low-opacity anime image background */}
      <div
        className="relative rounded-3xl overflow-hidden min-h-[220px]"
        style={{ backgroundColor: SURFACE, border: `1px solid ${HAIRLINE}` }}
      >
        {/* 🎨 ANIME IMAGE #1 — low opacity background, focused on the future-identity theme */}
        <img
          src={resolveImageUrl("/images/sd_jin_shadow.jpg")}
          className="absolute inset-0 w-full h-full object-cover"
          alt="Future identity"
          onError={onImgError("/images/sd_jin_minimal.jpg")}
          style={{ opacity: 0.18, objectPosition: "right center" }}
        />
        {/* Dark overlay for text legibility */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(to right, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.7) 60%, rgba(0,0,0,0.4) 100%)",
          }}
        />

        <div className="relative p-6 sm:p-7 flex flex-col justify-between h-full space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: TEXT_SECONDARY }}>
                  Primary Future Identity
                </span>
                <span
                  className="text-[9.5px] px-2 py-0.5 rounded-full font-semibold"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.08)",
                    color: TEXT_PRIMARY,
                    border: `1px solid ${HAIRLINE_STRONG}`,
                  }}
                >
                  Active focus
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2" style={{ color: TEXT_PRIMARY }}>
                <span>{primaryGoal.icon}</span> {primaryGoal.title}
              </h3>
            </div>

            <button
              onClick={() => handleOpenGoalModal(primaryGoal)}
              className="px-4 py-2 text-xs rounded-xl flex items-center gap-1.5 transition-colors"
              style={{ backgroundColor: TEXT_PRIMARY, color: "#000" }}
            >
              Continue journey <ArrowRight size={14} />
            </button>
          </div>

          <div>
            <div className="flex items-end justify-between mb-1.5 flex-wrap gap-2">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-bold tabular-nums tracking-tight" style={{ color: TEXT_PRIMARY }}>
                  {primaryGoal.pct}%
                </span>
                <span className="text-xs font-medium" style={{ color: TEXT_SECONDARY }}>Manifested progress</span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleUpdateProgress(primaryGoal.id, primaryGoal.pct, 5)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.06)",
                    color: TEXT_PRIMARY,
                    border: `1px solid ${HAIRLINE}`,
                  }}
                  title="Boost progress +5%"
                >
                  +5% boost
                </button>
                <button
                  onClick={() => handleUpdateProgress(primaryGoal.id, primaryGoal.pct, 10)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors"
                  style={{
                    backgroundColor: TEXT_PRIMARY,
                    color: "#000",
                  }}
                  title="Boost progress +10%"
                >
                  +10% boost
                </button>
              </div>
            </div>

            {/* Progress Bar — neutral white, no neon gradient */}
            <div
              className="h-2.5 rounded-full mb-3 overflow-hidden"
              style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${primaryGoal.pct}%`, backgroundColor: TEXT_PRIMARY }}
              />
            </div>

            {/* Meta Row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs" style={{ color: TEXT_SECONDARY }}>
              <div className="flex items-center gap-1.5">
                <Calendar size={12} />
                Target: <span className="font-semibold" style={{ color: TEXT_PRIMARY }}>{primaryGoal.date}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap size={12} />
                Coherence: <span className="font-semibold" style={{ color: TEXT_PRIMARY }}>{Math.min(99, Math.round(primaryGoal.pct * 0.8 + 20))}%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Flag size={12} />
                Next: <span className="font-semibold truncate max-w-[200px]" style={{ color: TEXT_PRIMARY }}>{primaryGoal.next}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN GRID: Create New Reality + Active Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">

        {/* CREATE NEW REALITY PANEL */}
        <div
          className="lg:col-span-5 rounded-3xl p-5 space-y-4"
          style={{ backgroundColor: SURFACE, border: `1px solid ${HAIRLINE}` }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" style={{ color: TEXT_PRIMARY }} />
              <h3 className="font-bold text-base tracking-tight" style={{ color: TEXT_PRIMARY }}>Create new reality</h3>
            </div>
            <span className="text-[10px] font-semibold" style={{ color: TEXT_TERTIARY }}>STEP 1 / BLUEPRINT</span>
          </div>
          <p className="text-xs -mt-2" style={{ color: TEXT_SECONDARY }}>Define what you want to bring into physical form.</p>

          <form onSubmit={handleCreateGoal} className="space-y-4">
            <div>
              <label className="block text-[10.5px] font-semibold mb-1.5 uppercase tracking-wider" style={{ color: TEXT_SECONDARY }}>Goal title</label>
              <input
                value={newGoalTitle}
                onChange={e => setNewGoalTitle(e.target.value)}
                placeholder="e.g. Build 6 pack abs or Launch SaaS MVP"
                className="w-full rounded-2xl px-4 py-3 text-sm focus:outline-none transition-colors"
                style={{
                  backgroundColor: "rgba(255,255,255,0.04)",
                  border: `1px solid ${HAIRLINE}`,
                  color: TEXT_PRIMARY,
                }}
                required
              />
            </div>

            {/* AI Suggestions */}
            <div>
              <div className="text-[10px] font-semibold mb-2 uppercase tracking-wider" style={{ color: TEXT_SECONDARY }}>Quick templates</div>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleApplySuggestion(s)}
                    className="text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.04)",
                      color: TEXT_PRIMARY,
                      border: `1px solid ${HAIRLINE}`,
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.08)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.04)"; }}
                  >
                    <span>{s.icon}</span>
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Category selection */}
            <div>
              <div className="text-[10px] font-semibold mb-1.5 uppercase tracking-wider" style={{ color: TEXT_SECONDARY }}>Category</div>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                {categories.filter(c => c.id !== "all").map(c => {
                  const isActive = newGoalCategory === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setNewGoalCategory(c.id as GoalCategory)}
                      className="px-3 py-2 rounded-xl border flex items-center gap-2 transition-colors font-medium"
                      style={{
                        backgroundColor: isActive ? TEXT_PRIMARY : "rgba(255,255,255,0.04)",
                        color: isActive ? "#000" : TEXT_PRIMARY,
                        border: `1px solid ${isActive ? TEXT_PRIMARY : HAIRLINE}`,
                      }}
                    >
                      <span>{c.icon}</span>
                      <span>{c.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Icon Picker */}
            <div>
              <div className="text-[10px] font-semibold mb-1.5 uppercase tracking-wider" style={{ color: TEXT_SECONDARY }}>Goal icon</div>
              <div className="flex flex-wrap gap-1.5">
                {iconOptions.map(ic => {
                  const isActive = newGoalIcon === ic;
                  return (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setNewGoalIcon(ic)}
                      className="w-9 h-9 rounded-xl text-base flex items-center justify-center transition-colors"
                      style={{
                        backgroundColor: isActive ? TEXT_PRIMARY : "rgba(255,255,255,0.04)",
                        color: isActive ? "#000" : TEXT_SECONDARY,
                        border: `1px solid ${isActive ? TEXT_PRIMARY : HAIRLINE}`,
                      }}
                    >
                      {ic}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={isCreatingGoal || !newGoalTitle.trim()}
              className="w-full py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
              style={{ backgroundColor: TEXT_PRIMARY, color: "#000" }}
            >
              {isCreatingGoal ? <Loader2 className="animate-spin w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
              Generate reality blueprint
            </button>
          </form>
        </div>

        {/* ACTIVE GOALS GRID */}
        <div className="lg:col-span-7 space-y-3">

          {/* Header & Filter Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base" style={{ color: TEXT_PRIMARY }}>Active goals</h3>
              <span className="text-xs font-medium" style={{ color: TEXT_SECONDARY }}>({displayedGoals.length} of {allActiveGoals.length})</span>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
              {categories.map(cat => {
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className="text-[11px] font-medium px-2.5 py-1 rounded-lg transition-colors"
                    style={{
                      backgroundColor: isActive ? TEXT_PRIMARY : "rgba(255,255,255,0.04)",
                      color: isActive ? "#000" : TEXT_SECONDARY,
                      border: `1px solid ${isActive ? TEXT_PRIMARY : HAIRLINE}`,
                    }}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Goal Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {displayedGoals.map((g) => {
              const isPrimary = g.id === primaryGoal.id;
              return (
                <div
                  key={g.id}
                  onClick={() => handleOpenGoalModal(g)}
                  className="rounded-3xl p-4 transition-colors cursor-pointer relative flex flex-col justify-between"
                  style={{
                    backgroundColor: isPrimary ? "rgba(255,255,255,0.05)" : SURFACE,
                    border: `1px solid ${isPrimary ? HAIRLINE_STRONG : HAIRLINE}`,
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = HAIRLINE_STRONG; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = isPrimary ? HAIRLINE_STRONG : HAIRLINE; }}
                >
                  <div>
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{g.icon}</span>
                        <div>
                          <h4 className="font-bold text-base leading-snug line-clamp-1" style={{ color: TEXT_PRIMARY }}>{g.title}</h4>
                          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: TEXT_SECONDARY }}>{g.cat}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => handleSelectPrimary(g.id, g.title)}
                          className="p-1.5 rounded-lg border transition-colors"
                          style={{
                            backgroundColor: isPrimary ? "rgba(255,255,255,0.08)" : "transparent",
                            color: isPrimary ? TEXT_PRIMARY : TEXT_TERTIARY,
                            borderColor: isPrimary ? HAIRLINE_STRONG : "transparent",
                          }}
                          title="Set as primary future identity"
                        >
                          <Star size={13} fill={isPrimary ? "currentColor" : "none"} />
                        </button>
                        {handleDeleteGoal && (
                          <button
                            onClick={() => handleDeleteGoal(g.id)}
                            className="p-1.5 rounded-lg transition-colors"
                            style={{ color: TEXT_TERTIARY }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#ff453a"; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = TEXT_TERTIARY; }}
                            title="Delete goal"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="space-y-1 my-3">
                      <div className="flex justify-between text-xs">
                        <span className="text-[11px]" style={{ color: TEXT_SECONDARY }}>Progress</span>
                        <span className="font-semibold tabular-nums" style={{ color: TEXT_PRIMARY }}>{g.pct}%</span>
                      </div>
                      <div
                        className="h-2 rounded-full overflow-hidden"
                        style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${g.pct}%`, backgroundColor: TEXT_PRIMARY }}
                        />
                      </div>
                    </div>

                    {/* Next Mission */}
                    <div
                      className="rounded-2xl p-2.5 space-y-1"
                      style={{ backgroundColor: "rgba(255,255,255,0.02)", border: `1px solid ${HAIRLINE}` }}
                    >
                      <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: TEXT_TERTIARY }}>Next mission</div>
                      <div className="text-xs font-semibold truncate" style={{ color: TEXT_PRIMARY }}>{g.next}</div>
                    </div>
                  </div>

                  {/* Card Bottom Meta */}
                  <div className="flex items-center justify-between mt-3 pt-2.5 text-xs" style={{ borderTop: `1px solid ${HAIRLINE}` }}>
                    <span className="text-[10px] font-medium" style={{ color: TEXT_SECONDARY }}>{g.date}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdateProgress(g.id, g.pct, 10);
                      }}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-colors"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.06)",
                        color: TEXT_PRIMARY,
                        border: `1px solid ${HAIRLINE}`,
                      }}
                    >
                      +10%
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* View More Button */}
          {hasMore && (
            <button
              onClick={() => setShowAllGoals(!showAllGoals)}
              className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-2xl transition-colors"
              style={{
                backgroundColor: "rgba(255,255,255,0.04)",
                color: TEXT_PRIMARY,
                border: `1px solid ${HAIRLINE}`,
              }}
            >
              {showAllGoals ? (
                <>Show less <ChevronUp size={14} /></>
              ) : (
                <>View all goals ({allActiveGoals.length}) <ChevronDown size={14} /></>
              )}
            </button>
          )}
        </div>
      </div>

      {/* GOAL BLUEPRINT TIMELINE — with subtle anime image on large screens */}
      <div
        className="relative rounded-3xl p-5 sm:p-6 space-y-4 overflow-hidden"
        style={{ backgroundColor: SURFACE, border: `1px solid ${HAIRLINE}` }}
      >
        {/* 🎨 ANIME IMAGE #2 — very subtle right-side accent (hidden on mobile) */}
        <img
          src={resolveImageUrl("/images/sd_jin_minimal.jpg")}
          className="hidden lg:block absolute top-0 right-0 h-full w-1/3 object-cover pointer-events-none"
          alt=""
          onError={onImgError("/images/sd_jin_shadow.jpg")}
          style={{ opacity: 0.08, objectPosition: "center 20%" }}
        />
        {/* Fade overlay so it never competes with content */}
        <div
          className="hidden lg:block absolute top-0 right-0 h-full w-1/3 pointer-events-none"
          style={{ background: "linear-gradient(to right, rgba(10,10,10,1) 0%, rgba(10,10,10,0.6) 40%, rgba(10,10,10,0) 100%)" }}
        />

        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base tracking-tight flex items-center gap-2" style={{ color: TEXT_PRIMARY }}>
              <Flame className="w-4 h-4" />
              Goal blueprint manifestation path
            </h3>
            <p className="text-xs mt-0.5" style={{ color: TEXT_SECONDARY }}>Interactive 6-stage blueprint from intention to physical reality.</p>
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {timelineSteps.map((step, idx) => {
            const isCurrent = primaryGoal.pct >= (idx * 16) && primaryGoal.pct < ((idx + 1) * 17);
            const isSelected = selectedTimelineStep === idx;
            return (
              <div
                key={idx}
                onClick={() => setSelectedTimelineStep(selectedTimelineStep === idx ? null : idx)}
                className="p-3 rounded-2xl transition-colors cursor-pointer flex flex-col justify-between h-[110px]"
                style={{
                  backgroundColor: isSelected ? "rgba(255,255,255,0.08)" : isCurrent ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.02)",
                  border: `1px solid ${isSelected ? HAIRLINE_STRONG : isCurrent ? "rgba(255,255,255,0.18)" : HAIRLINE}`,
                }}
              >
                <div className="flex items-center justify-between text-[10px] font-semibold" style={{ color: TEXT_TERTIARY }}>
                  <span>STAGE {step.phase}</span>
                  <span style={{ color: TEXT_SECONDARY }}>{step.pctRange}</span>
                </div>
                <div>
                  <div className="font-bold text-xs line-clamp-1" style={{ color: TEXT_PRIMARY }}>{step.l}</div>
                  <div className="text-[10px] line-clamp-2 mt-0.5" style={{ color: TEXT_SECONDARY }}>{step.d}</div>
                </div>
                {isCurrent && (
                  <span
                    className="text-[9px] font-semibold px-1.5 py-0.5 rounded text-center"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.08)",
                      color: TEXT_PRIMARY,
                    }}
                  >
                    Primary stage
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Selected Timeline Step Insight */}
        {selectedTimelineStep !== null && (
          <div
            className="relative z-10 rounded-2xl p-4 text-xs space-y-2"
            style={{
              backgroundColor: "rgba(255,255,255,0.04)",
              border: `1px solid ${HAIRLINE}`,
            }}
          >
            <div className="flex items-center justify-between font-semibold" style={{ color: TEXT_PRIMARY }}>
              <span>STAGE {timelineSteps[selectedTimelineStep].phase}: {timelineSteps[selectedTimelineStep].l}</span>
              <button onClick={() => setSelectedTimelineStep(null)} style={{ color: TEXT_SECONDARY }}>
                <X size={14} />
              </button>
            </div>
            <p style={{ color: TEXT_SECONDARY }}>{timelineSteps[selectedTimelineStep].d}</p>
            <div className="text-[11px] font-medium" style={{ color: TEXT_TERTIARY }}>
              Matching goals currently in this stage: {allActiveGoals.filter(g => g.pct >= (selectedTimelineStep * 16) && g.pct <= ((selectedTimelineStep + 1) * 17)).map(g => g.title).join(", ") || "None currently in range"}
            </div>
          </div>
        )}
      </div>

      {/* RICH GOAL DETAIL MODAL */}
      {selectedGoal && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 overflow-y-auto"
          style={{ backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(20px)" }}
          onClick={() => setSelectedGoal(null)}
        >
          <div
            className="rounded-3xl w-full max-w-xl p-6 space-y-5 max-h-[90vh] overflow-y-auto relative"
            style={{ backgroundColor: "#0a0a0a", border: `1px solid ${HAIRLINE}` }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b pb-4" style={{ borderColor: HAIRLINE }}>
              <div className="flex items-center gap-3">
                <span className="text-4xl">{selectedGoal.icon}</span>
                <div>
                  <h3 className="font-bold text-xl" style={{ color: TEXT_PRIMARY }}>{selectedGoal.title}</h3>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span
                      className="text-[10.5px] font-semibold px-2.5 py-0.5 rounded-full"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.06)",
                        color: TEXT_PRIMARY,
                        border: `1px solid ${HAIRLINE}`,
                      }}
                    >
                      {selectedGoal.cat}
                    </span>
                    <span className="text-[11px] font-medium" style={{ color: TEXT_SECONDARY }}>Target: {selectedGoal.date}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedGoal(null)}
                className="p-1.5 rounded-full transition-colors"
                style={{ backgroundColor: "rgba(255,255,255,0.04)", color: TEXT_SECONDARY }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = TEXT_PRIMARY; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = TEXT_SECONDARY; }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Progress Section */}
            <div
              className="rounded-2xl p-4 space-y-3"
              style={{ backgroundColor: "rgba(255,255,255,0.02)", border: `1px solid ${HAIRLINE}` }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: TEXT_SECONDARY }}>Manifestation progress</span>
                <span className="text-xl font-bold tabular-nums" style={{ color: TEXT_PRIMARY }}>{selectedGoal.pct}%</span>
              </div>

              <div
                className="h-2.5 rounded-full overflow-hidden"
                style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${selectedGoal.pct}%`, backgroundColor: TEXT_PRIMARY }}
                />
              </div>

              {/* Quick progress controls */}
              <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                <span className="text-[11px]" style={{ color: TEXT_SECONDARY }}>Quick boost:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => handleUpdateProgress(selectedGoal.id, selectedGoal.pct, -10)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.04)",
                      color: TEXT_PRIMARY,
                      border: `1px solid ${HAIRLINE}`,
                    }}
                  >
                    -10%
                  </button>
                  <button
                    onClick={() => handleUpdateProgress(selectedGoal.id, selectedGoal.pct, 10)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.08)",
                      color: TEXT_PRIMARY,
                      border: `1px solid ${HAIRLINE_STRONG}`,
                    }}
                  >
                    +10%
                  </button>
                  <button
                    onClick={() => handleUpdateProgress(selectedGoal.id, selectedGoal.pct, 25)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors"
                    style={{ backgroundColor: TEXT_PRIMARY, color: "#000" }}
                  >
                    +25%
                  </button>
                  <button
                    onClick={() => handleUpdateProgress(selectedGoal.id, selectedGoal.pct, 100 - selectedGoal.pct)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors"
                    style={{ backgroundColor: TEXT_PRIMARY, color: "#000" }}
                  >
                    100% manifested
                  </button>
                </div>
              </div>
            </div>

            {/* 6-Step Roadmap Milestones Checklist */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold flex items-center gap-2" style={{ color: TEXT_PRIMARY }}>
                  <CheckSquare size={15} />
                  Roadmap & action milestones
                </h4>
                <span className="text-[11px] font-medium" style={{ color: TEXT_TERTIARY }}>
                  {(completedMilestones[selectedGoal.id] || []).length} / 6 completed
                </span>
              </div>

              <div className="space-y-2">
                {getGoalMilestones(selectedGoal).map((ms, idx) => {
                  const isDone = (completedMilestones[selectedGoal.id] || []).includes(idx);
                  return (
                    <div
                      key={idx}
                      onClick={() => handleToggleMilestone(selectedGoal.id, idx, selectedGoal.pct)}
                      className="p-3 rounded-2xl transition-colors cursor-pointer flex items-center gap-3"
                      style={{
                        backgroundColor: isDone ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.02)",
                        border: `1px solid ${isDone ? HAIRLINE_STRONG : HAIRLINE}`,
                      }}
                    >
                      <button className="shrink-0">
                        {isDone
                          ? <CheckCircle className="w-5 h-5" style={{ color: TEXT_PRIMARY }} />
                          : <Square className="w-5 h-5" style={{ color: TEXT_TERTIARY }} />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div
                          className="font-semibold text-xs"
                          style={{
                            color: isDone ? TEXT_SECONDARY : TEXT_PRIMARY,
                            textDecoration: isDone ? "line-through" : "none",
                          }}
                        >
                          {idx + 1}. {ms.title}
                        </div>
                        <div className="text-[11px]" style={{ color: TEXT_SECONDARY }}>{ms.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI Reality Strategy Generator */}
            <div
              className="rounded-2xl p-4 space-y-3"
              style={{
                backgroundColor: "rgba(255,255,255,0.02)",
                border: `1px solid ${HAIRLINE}`,
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-xs" style={{ color: TEXT_PRIMARY }}>
                  <Bot size={15} />
                  AI reality strategy advisor
                </div>
                <button
                  onClick={() => handleGenerateAICoach(selectedGoal)}
                  disabled={isGeneratingAdvice}
                  className="px-3 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-colors"
                  style={{
                    backgroundColor: TEXT_PRIMARY,
                    color: "#000",
                  }}
                >
                  {isGeneratingAdvice ? <Loader2 className="animate-spin w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
                  Generate strategy
                </button>
              </div>

              {aiCoachAdvice && (
                <div
                  className="p-3 rounded-xl text-xs whitespace-pre-line leading-relaxed"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.04)",
                    border: `1px solid ${HAIRLINE}`,
                    color: TEXT_PRIMARY,
                  }}
                >
                  {aiCoachAdvice}
                </div>
              )}
            </div>

            {/* Inline Goal Editor */}
            {isEditingGoal ? (
              <div
                className="p-4 rounded-2xl space-y-3"
                style={{
                  backgroundColor: "rgba(255,255,255,0.02)",
                  border: `1px solid ${HAIRLINE}`,
                }}
              >
                <h4 className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: TEXT_SECONDARY }}>Edit goal details</h4>
                <div>
                  <label className="text-[10px] block mb-1" style={{ color: TEXT_TERTIARY }}>Title</label>
                  <input
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    className="w-full rounded-xl px-3 py-2 text-xs focus:outline-none transition-colors"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.04)",
                      border: `1px solid ${HAIRLINE}`,
                      color: TEXT_PRIMARY,
                    }}
                  />
                </div>
                <div>
                  <label className="text-[10px] block mb-1" style={{ color: TEXT_TERTIARY }}>Target date</label>
                  <input
                    value={editDate}
                    onChange={e => setEditDate(e.target.value)}
                    className="w-full rounded-xl px-3 py-2 text-xs focus:outline-none transition-colors"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.04)",
                      border: `1px solid ${HAIRLINE}`,
                      color: TEXT_PRIMARY,
                    }}
                  />
                </div>
                <div>
                  <label className="text-[10px] block mb-1" style={{ color: TEXT_TERTIARY }}>Next mission</label>
                  <input
                    value={editNextMission}
                    onChange={e => setEditNextMission(e.target.value)}
                    className="w-full rounded-xl px-3 py-2 text-xs focus:outline-none transition-colors"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.04)",
                      border: `1px solid ${HAIRLINE}`,
                      color: TEXT_PRIMARY,
                    }}
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleSaveGoalEdits}
                    className="flex-1 py-2 rounded-xl text-xs font-bold"
                    style={{ backgroundColor: TEXT_PRIMARY, color: "#000" }}
                  >
                    Save changes
                  </button>
                  <button
                    onClick={() => setIsEditingGoal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-medium"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.06)",
                      color: TEXT_PRIMARY,
                      border: `1px solid ${HAIRLINE}`,
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditingGoal(true)}
                  className="flex-1 py-2.5 rounded-2xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.04)",
                    color: TEXT_PRIMARY,
                    border: `1px solid ${HAIRLINE}`,
                  }}
                >
                  <Edit2 size={13} />
                  Edit goal info
                </button>
                {handleDeleteGoal && (
                  <button
                    onClick={() => {
                      handleDeleteGoal(selectedGoal.id);
                      setSelectedGoal(null);
                    }}
                    className="px-4 py-2.5 rounded-2xl text-xs font-semibold transition-colors"
                    style={{
                      backgroundColor: "rgba(255,69,58,0.08)",
                      color: "#ff453a",
                      border: "1px solid rgba(255,69,58,0.2)",
                    }}
                  >
                    Delete goal
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GoalsView;

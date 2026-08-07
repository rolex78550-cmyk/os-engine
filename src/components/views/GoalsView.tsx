import React, { useState } from "react";
import { 
  Target, Plus, Sparkles, Loader2, Calendar, Flag, ArrowRight, 
  ChevronDown, ChevronUp, Trash2, Star, CheckCircle, Edit2, Zap, 
  Award, Bot, Filter, CheckSquare, Square, Flame, RefreshCw, Sliders, X
} from "lucide-react";
import { Desire, GoalCategory, ProfileState } from "../../types";

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

  // Dynamic mapping for real desires
  const mapDesireToGoal = (d: Desire, idx: number) => {
    const title = d.title || "Untitled Goal";
    const catRaw = (d.category || "lifestyle").toLowerCase();
    const catLabel = catRaw.charAt(0).toUpperCase() + catRaw.slice(1);

    let color = "#a855f7";
    let icon = d.icon || "🎯";
    let next = (d as any).nextMission || "Take massive action";
    let xp = 320;

    const tl = title.toLowerCase();

    if (catRaw === "wealth" || tl.includes("money") || tl.includes("financial") || tl.includes("freedom")) {
      color = "#f59e0b"; icon = d.icon || "💰"; xp = 350; next = (d as any).nextMission || "Invest in Index Funds";
    } else if (["health", "fitness"].includes(catRaw) || tl.includes("pack") || tl.includes("six") || tl.includes("body")) {
      color = "#10b981"; icon = d.icon || "💪"; xp = 250; next = (d as any).nextMission || "Complete 4 Workouts";
    } else if (catRaw === "career" || tl.includes("saas") || tl.includes("launch") || tl.includes("business")) {
      color = "#3b82f6"; icon = d.icon || "🚀"; xp = 400; next = (d as any).nextMission || "Build Landing Page";
    } else if (catRaw === "lifestyle" || tl.includes("house") || tl.includes("dream") || tl.includes("home")) {
      color = "#3b82f6"; icon = d.icon || "🏠"; xp = 300; next = (d as any).nextMission || "Increase Savings";
    }

    if (tl.includes("house") || tl.includes("dream")) { icon = d.icon || "🏠"; color = "#3b82f6"; }
    if (tl.includes("six") || tl.includes("pack") || tl.includes("abs")) { icon = d.icon || "💪"; color = "#10b981"; }
    if (tl.includes("saas") || tl.includes("launch")) { icon = d.icon || "🚀"; color = "#a855f7"; }
    if (tl.includes("financial") || tl.includes("freedom") || tl.includes("million")) { icon = d.icon || "💰"; color = "#f59e0b"; }

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
    setNotificationMsg(`🌟 Set "${title}" as your Primary Future Identity!`);
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
    setNotificationMsg(`⚡ Progress updated to ${newPct}%! (+${Math.abs(delta * 5)} XP)`);
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

    setNotificationMsg(isDone ? `Milestone unchecked.` : `🏆 Milestone completed! Progress set to ${calculatedPct}% (+50 XP)`);
    setTimeout(() => setNotificationMsg(null), 2200);
  };

  const handleGenerateAICoach = (goal: any) => {
    setIsGeneratingAdvice(true);
    setAiCoachAdvice(null);

    setTimeout(() => {
      const adviceList = [
        `🔥 **Quantum Strategy for ${goal.title}**:\n1. Focus on identity shift first: feel as if you already achieved ${goal.title}.\n2. Break into 15-min daily focus blocks.\n3. Remove top friction: batch decision-making to the night before.`,
        `🚀 **Accelerated Blueprint for ${goal.title}**:\n1. Eliminate competing low-yield tasks.\n2. Execute 1 key sprint task every morning at 8:00 AM.\n3. Track alignment daily for maximum compounding power.`,
        `💡 **Reality Alignment for ${goal.title}**:\n1. Re-anchor your core belief level to 90%+.\n2. Implement a 369 scripting session before sleep.\n3. Celebrate small weekly wins to sustain momentum.`
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
    setNotificationMsg("Goal updated successfully!");
    setTimeout(() => setNotificationMsg(null), 2200);
  };

  return (
    <div className="text-white space-y-6">
      
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-950 border border-white/10 rounded-2xl p-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-400" />
            Reality Architect & Goal Engine
          </h2>
          <p className="text-xs text-white/55 mt-0.5">Design your future identity. Track milestones. Manifest results into reality.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono bg-purple-950/80 text-purple-300 border border-purple-500/30 px-3 py-1.5 rounded-xl font-semibold">
            {allActiveGoals.length} Active Goals
          </span>
        </div>
      </div>

      {/* ONBOARDING DYNAMIC BLUEPRINT BANNER */}
      {(profile?.target90Days || profile?.longTermGoal || profile?.primaryPriority || profile?.primaryFocus) && (
        <div className="p-5 sm:p-6 bg-gradient-to-br from-amber-950/40 via-zinc-900 to-purple-950/30 border border-amber-500/30 rounded-3xl relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
            <div className="space-y-2 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                  <Sparkles size={11} /> ONBOARDING MANIFEST ALIGNMENT
                </span>
                {profile?.identityArchetype && (
                  <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-mono px-2.5 py-0.5 rounded-full">
                    👑 Archetype: {profile.identityArchetype}
                  </span>
                )}
                {profile?.coachStyle && (
                  <span className="bg-zinc-800 text-zinc-300 border border-white/10 text-[10px] font-mono px-2.5 py-0.5 rounded-full">
                    ⚔️ {profile.coachStyle}
                  </span>
                )}
              </div>

              <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                90-Day Target: <span className="text-amber-400">"{profile?.target90Days || profile?.longTermGoal}"</span>
              </h3>

              <p className="text-xs text-zinc-300 leading-relaxed">
                Your entire Goal System is dynamically calibrated to conquer your primary priority (<strong className="text-amber-200">{profile?.primaryPriority || profile?.primaryFocus || "Wealth & Business"}</strong>) with a daily commitment of <strong className="text-white">{profile?.commitment || "2 Hours/Day"}</strong>.
              </p>

              {/* Blockers being actively destroyed */}
              {Array.isArray(profile?.blockers) && profile.blockers.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-zinc-400 font-mono">TARGETED BLOCKERS:</span>
                  {profile.blockers.map((b, idx) => (
                    <span key={idx} className="bg-red-500/15 border border-red-500/30 text-red-300 text-[10px] px-2 py-0.5 rounded-md font-mono">
                      🛡️ {b}
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
              className="w-full md:w-auto px-4 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 active:scale-[0.98] text-black font-extrabold text-xs rounded-2xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all shrink-0"
            >
              <Zap size={14} className="fill-black" />
              Sync Onboarding Target as Goal
            </button>
          </div>
        </div>
      )}

      {/* HERO FUTURE IDENTITY CARD */}
      <div className="relative rounded-3xl overflow-hidden border border-white/10 min-h-[220px] shadow-2xl">
        <img 
          src="/assets/dashboard-hero.jpg" 
          className="absolute inset-0 w-full h-full object-cover opacity-35" 
          alt="Future Identity Hero" 
        />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/90 to-purple-950/40" />

        <div className="relative p-6 sm:p-7 flex flex-col justify-between h-full space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono tracking-[2.5px] text-purple-400 uppercase font-bold">PRIMARY FUTURE IDENTITY</span>
                <span className="bg-yellow-400/20 text-yellow-300 border border-yellow-400/30 text-[9px] px-2 py-0.5 rounded-full font-mono">
                  ACTIVE FOCUS
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                <span>{primaryGoal.icon}</span> {primaryGoal.title}
              </h3>
            </div>

            <button
              onClick={() => handleOpenGoalModal(primaryGoal)}
              className="px-4 py-2 bg-yellow-400 hover:bg-yellow-300 active:bg-yellow-500 text-black font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-yellow-500/20 transition-all active:scale-[0.98]"
            >
              Continue Journey <ArrowRight size={14} />
            </button>
          </div>

          <div>
            <div className="flex items-end justify-between mb-1.5">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-extrabold tabular-nums tracking-tight text-white">
                  {primaryGoal.pct}%
                </span>
                <span className="text-xs text-white/60 font-medium">Manifested Progress</span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleUpdateProgress(primaryGoal.id, primaryGoal.pct, 5)}
                  className="px-2.5 py-1 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-xs font-mono font-bold text-emerald-400 transition"
                  title="Boost Progress +5%"
                >
                  +5% Boost
                </button>
                <button
                  onClick={() => handleUpdateProgress(primaryGoal.id, primaryGoal.pct, 10)}
                  className="px-2.5 py-1 bg-purple-600/80 hover:bg-purple-500 border border-purple-400/30 rounded-lg text-xs font-mono font-bold text-white transition"
                  title="Boost Progress +10%"
                >
                  +10% Boost
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="h-2.5 bg-white/10 rounded-full mb-3 overflow-hidden p-0.5 border border-white/5">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-300 transition-all duration-700" 
                style={{ width: `${primaryGoal.pct}%` }} 
              />
            </div>

            {/* Meta Row */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-white/70">
              <div className="flex items-center gap-1.5">
                <Calendar size={13} className="text-purple-400" /> 
                Target: <span className="font-mono text-white font-semibold">{primaryGoal.date}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap size={13} className="text-yellow-400" /> 
                Coherence Alignment: <span className="font-mono text-white font-semibold">{Math.min(99, Math.round(primaryGoal.pct * 0.8 + 20))}%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Flag size={13} className="text-emerald-400" /> 
                Next Mission: <span className="font-semibold text-white truncate max-w-[200px]">{primaryGoal.next}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN GRID: Create New Reality + Active Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* CREATE NEW REALITY PANEL */}
        <div className="lg:col-span-5 bg-zinc-950 border border-white/10 rounded-3xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
              <h3 className="font-bold text-white text-base tracking-tight">Create New Reality</h3>
            </div>
            <span className="text-[10px] font-mono text-white/40">STEP 1 / BLUEPRINT</span>
          </div>
          <p className="text-xs text-white/50 -mt-2">Define what you want to bring into physical form.</p>

          <form onSubmit={handleCreateGoal} className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono text-white/60 mb-1.5 uppercase tracking-wider">Goal Title</label>
              <input
                value={newGoalTitle}
                onChange={e => setNewGoalTitle(e.target.value)}
                placeholder="e.g. Build 6 pack abs or Launch SaaS MVP"
                className="w-full bg-black/80 border border-white/15 focus:border-purple-400/80 rounded-2xl px-4 py-3 text-sm placeholder:text-white/35 focus:outline-none transition-all text-white"
                required
              />
            </div>

            {/* AI Suggestions */}
            <div>
              <div className="text-[10px] font-mono text-white/50 mb-2 uppercase tracking-wider">AI QUICK TEMPLATES</div>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((s, i) => (
                  <button 
                    key={i} 
                    type="button" 
                    onClick={() => handleApplySuggestion(s)} 
                    className="text-xs bg-white/5 hover:bg-white/10 active:bg-white/15 px-3 py-1.5 rounded-xl flex items-center gap-1.5 border border-white/10 hover:border-purple-400/40 text-white/80 transition-all"
                  >
                    <span>{s.icon}</span>
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Category selection */}
            <div>
              <div className="text-[10px] font-mono text-white/50 mb-1.5 uppercase tracking-wider">CATEGORY</div>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                {categories.filter(c => c.id !== "all").map(c => (
                  <button 
                    key={c.id} 
                    type="button" 
                    onClick={() => setNewGoalCategory(c.id as GoalCategory)} 
                    className={`px-3 py-2 rounded-xl border flex items-center gap-2 transition-all font-medium ${newGoalCategory === c.id 
                      ? "bg-purple-600/80 border-purple-400/60 text-white shadow-lg shadow-purple-900/30" 
                      : "bg-white/5 border-white/10 hover:bg-white/10 text-white/70"}`}
                  >
                    <span>{c.icon}</span> 
                    <span>{c.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Icon Picker */}
            <div>
              <div className="text-[10px] font-mono text-white/50 mb-1.5 uppercase tracking-wider">GOAL ICON</div>
              <div className="flex flex-wrap gap-1.5">
                {iconOptions.map(ic => (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => setNewGoalIcon(ic)}
                    className={`w-9 h-9 rounded-xl border text-base flex items-center justify-center transition ${newGoalIcon === ic ? 'bg-purple-600/80 border-purple-400 text-white scale-105' : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/60'}`}
                  >
                    {ic}
                  </button>
                ))}
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isCreatingGoal || !newGoalTitle.trim()} 
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-xl shadow-purple-900/30 active:scale-[0.98]"
            >
              {isCreatingGoal ? <Loader2 className="animate-spin w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
              Generate Reality Blueprint
            </button>
          </form>
        </div>

        {/* ACTIVE GOALS GRID */}
        <div className="lg:col-span-7 space-y-3">
          
          {/* Header & Filter Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-base">Active Goals</h3>
              <span className="text-xs text-white/50 font-mono">({displayedGoals.length} of {allActiveGoals.length})</span>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border transition ${selectedCategory === cat.id ? 'bg-white/15 border-white/30 text-white font-semibold' : 'bg-white/5 border-white/5 text-white/50 hover:text-white'}`}
                >
                  {cat.label}
                </button>
              ))}
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
                  className={`group bg-zinc-950 border rounded-3xl p-4 transition-all cursor-pointer relative flex flex-col justify-between hover:shadow-xl ${isPrimary ? 'border-purple-500/50 bg-gradient-to-b from-purple-950/20 to-zinc-950' : 'border-white/10 hover:border-white/25'}`}
                >
                  <div>
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl group-hover:scale-110 transition-transform">{g.icon}</span>
                        <div>
                          <h4 className="font-bold text-white text-base leading-snug line-clamp-1">{g.title}</h4>
                          <span className="text-[10px] font-mono text-purple-300/80 uppercase">{g.cat}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => handleSelectPrimary(g.id, g.title)}
                          className={`p-1.5 rounded-lg border transition ${isPrimary ? 'bg-yellow-400/20 text-yellow-300 border-yellow-400/40' : 'text-white/30 hover:text-white/80 border-transparent'}`}
                          title="Set as Primary Future Identity"
                        >
                          <Star size={13} fill={isPrimary ? "currentColor" : "none"} />
                        </button>
                        {handleDeleteGoal && (
                          <button 
                            onClick={() => handleDeleteGoal(g.id)} 
                            className="p-1.5 rounded-lg text-white/30 hover:text-rose-400 hover:bg-rose-500/10 transition"
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
                        <span className="text-white/50 text-[11px]">Progress</span>
                        <span className="font-mono font-bold text-white">{g.pct}%</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden p-0.5">
                        <div 
                          className="h-full rounded-full transition-all duration-500" 
                          style={{ width: `${g.pct}%`, backgroundColor: g.color }} 
                        />
                      </div>
                    </div>

                    {/* Next Mission */}
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-2.5 space-y-1">
                      <div className="text-[10px] font-mono text-white/40 uppercase">NEXT MISSION</div>
                      <div className="text-xs font-semibold text-white/90 truncate">{g.next}</div>
                    </div>
                  </div>

                  {/* Card Bottom Meta */}
                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-white/5 text-xs">
                    <span className="text-white/40 font-mono text-[10px]">{g.date}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdateProgress(g.id, g.pct, 10);
                      }}
                      className="px-2 py-0.5 bg-purple-600/60 hover:bg-purple-500 text-white rounded-lg text-[10px] font-mono font-bold transition"
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
              className="w-full flex items-center justify-center gap-1.5 text-xs text-purple-300 hover:text-purple-200 font-semibold py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition"
            >
              {showAllGoals ? (
                <>Show Less <ChevronUp size={14} /></>
              ) : (
                <>View All Goals ({allActiveGoals.length}) <ChevronDown size={14} /></>
              )}
            </button>
          )}
        </div>
      </div>

      {/* GOAL BLUEPRINT TIMELINE */}
      <div className="bg-zinc-950 border border-white/10 rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white text-base tracking-tight flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              Goal Blueprint Manifestation Path
            </h3>
            <p className="text-xs text-white/50">Interactive 6-stage blueprint from intention to physical reality.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {timelineSteps.map((step, idx) => {
            const isCurrent = primaryGoal.pct >= (idx * 16) && primaryGoal.pct < ((idx + 1) * 17);
            return (
              <div 
                key={idx} 
                onClick={() => setSelectedTimelineStep(selectedTimelineStep === idx ? null : idx)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between h-[110px] ${selectedTimelineStep === idx ? 'bg-purple-600/30 border-purple-400' : isCurrent ? 'bg-yellow-500/10 border-yellow-400/40' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono text-white/40">
                  <span>STAGE {step.phase}</span>
                  <span className="text-purple-300">{step.pctRange}</span>
                </div>
                <div>
                  <div className="font-bold text-xs text-white line-clamp-1">{step.l}</div>
                  <div className="text-[10px] text-white/50 line-clamp-2 mt-0.5">{step.d}</div>
                </div>
                {isCurrent && (
                  <span className="text-[9px] font-mono font-bold text-yellow-300 bg-yellow-400/20 px-1.5 py-0.5 rounded text-center">
                    PRIMARY STAGE
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Selected Timeline Step Insight */}
        {selectedTimelineStep !== null && (
          <div className="bg-purple-950/40 border border-purple-500/30 rounded-2xl p-4 text-xs space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between font-bold text-purple-200">
              <span>STAGE {timelineSteps[selectedTimelineStep].phase}: {timelineSteps[selectedTimelineStep].l}</span>
              <button onClick={() => setSelectedTimelineStep(null)} className="text-white/50 hover:text-white">
                <X size={14} />
              </button>
            </div>
            <p className="text-white/80">{timelineSteps[selectedTimelineStep].d}</p>
            <div className="text-[11px] text-purple-300/80 font-mono">
              Matching goals currently in this stage: {allActiveGoals.filter(g => g.pct >= (selectedTimelineStep * 16) && g.pct <= ((selectedTimelineStep + 1) * 17)).map(g => g.title).join(", ") || "None currently in range"}
            </div>
          </div>
        )}
      </div>

      {/* RICH GOAL DETAIL MODAL */}
      {selectedGoal && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 overflow-y-auto" 
          onClick={() => setSelectedGoal(null)}
        >
          <div 
            className="bg-zinc-950 border border-white/15 rounded-3xl w-full max-w-xl p-6 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl relative" 
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{selectedGoal.icon}</span>
                <div>
                  <h3 className="font-extrabold text-xl text-white">{selectedGoal.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-mono uppercase bg-purple-950 text-purple-300 border border-purple-500/30 px-2.5 py-0.5 rounded-full font-semibold">
                      {selectedGoal.cat}
                    </span>
                    <span className="text-xs text-white/50 font-mono">Target: {selectedGoal.date}</span>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setSelectedGoal(null)} 
                className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Progress Section */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">Manifestation Progress</span>
                <span className="text-xl font-extrabold font-mono text-purple-300">{selectedGoal.pct}%</span>
              </div>

              <div className="h-3 bg-white/10 rounded-full overflow-hidden p-0.5">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-purple-500 to-amber-400 transition-all duration-500"
                  style={{ width: `${selectedGoal.pct}%` }}
                />
              </div>

              {/* Quick progress controls */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <span className="text-[11px] text-white/50">Quick Boost:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleUpdateProgress(selectedGoal.id, selectedGoal.pct, -10)}
                    className="px-2.5 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-mono text-white/70"
                  >
                    -10%
                  </button>
                  <button
                    onClick={() => handleUpdateProgress(selectedGoal.id, selectedGoal.pct, 10)}
                    className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-mono font-bold"
                  >
                    +10%
                  </button>
                  <button
                    onClick={() => handleUpdateProgress(selectedGoal.id, selectedGoal.pct, 25)}
                    className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-black rounded-lg text-xs font-mono font-bold"
                  >
                    +25%
                  </button>
                  <button
                    onClick={() => handleUpdateProgress(selectedGoal.id, selectedGoal.pct, 100 - selectedGoal.pct)}
                    className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-black rounded-lg text-xs font-mono font-bold"
                  >
                    100% Manifested!
                  </button>
                </div>
              </div>
            </div>

            {/* 6-Step Roadmap Milestones Checklist */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <CheckSquare size={16} className="text-purple-400" />
                  Roadmap & Action Milestones
                </h4>
                <span className="text-xs font-mono text-white/40">
                  {(completedMilestones[selectedGoal.id] || []).length} / 6 Completed
                </span>
              </div>

              <div className="space-y-2">
                {getGoalMilestones(selectedGoal).map((ms, idx) => {
                  const isDone = (completedMilestones[selectedGoal.id] || []).includes(idx);
                  return (
                    <div
                      key={idx}
                      onClick={() => handleToggleMilestone(selectedGoal.id, idx, selectedGoal.pct)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${isDone ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200' : 'bg-white/5 border-white/5 hover:bg-white/10 text-white/80'}`}
                    >
                      <button className="shrink-0">
                        {isDone ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <Square className="w-5 h-5 text-white/30" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className={`font-semibold text-xs ${isDone ? 'line-through text-emerald-300/70' : 'text-white'}`}>
                          {idx + 1}. {ms.title}
                        </div>
                        <div className="text-[11px] text-white/50">{ms.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI Reality Strategy Generator */}
            <div className="bg-purple-950/30 border border-purple-500/30 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-purple-200 font-bold text-xs">
                  <Bot size={16} className="text-purple-400" />
                  AI Reality Strategy Advisor
                </div>
                <button
                  onClick={() => handleGenerateAICoach(selectedGoal)}
                  disabled={isGeneratingAdvice}
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                >
                  {isGeneratingAdvice ? <Loader2 className="animate-spin w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
                  Generate Strategy
                </button>
              </div>

              {aiCoachAdvice && (
                <div className="bg-black/50 p-3 rounded-xl border border-purple-500/20 text-xs text-purple-100 whitespace-pre-line leading-relaxed">
                  {aiCoachAdvice}
                </div>
              )}
            </div>

            {/* Inline Goal Editor */}
            {isEditingGoal ? (
              <div className="bg-white/5 border border-white/10 p-4 rounded-2xl space-y-3">
                <h4 className="text-xs font-mono font-bold text-white uppercase">Edit Goal Details</h4>
                <div>
                  <label className="text-[10px] text-white/50 block mb-1">Title</label>
                  <input
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-white/50 block mb-1">Target Date</label>
                  <input
                    value={editDate}
                    onChange={e => setEditDate(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-white/50 block mb-1">Next Mission</label>
                  <input
                    value={editNextMission}
                    onChange={e => setEditNextMission(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={handleSaveGoalEdits} className="flex-1 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold">
                    Save Changes
                  </button>
                  <button onClick={() => setIsEditingGoal(false)} className="px-4 py-2 bg-white/10 text-white/70 rounded-xl text-xs">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditingGoal(true)}
                  className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  <Edit2 size={14} />
                  Edit Goal Info
                </button>
                {handleDeleteGoal && (
                  <button
                    onClick={() => {
                      handleDeleteGoal(selectedGoal.id);
                      setSelectedGoal(null);
                    }}
                    className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 rounded-2xl text-xs font-semibold transition"
                  >
                    Delete Goal
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

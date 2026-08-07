import React, { useState } from "react";
import { 
  Flame, Trophy, CheckCircle, Check, ArrowUpRight, Plus, 
  TrendingUp, Dumbbell, BookOpen, Target, DollarSign,
  Briefcase, GraduationCap, User, Wrench, Sparkles, X, Sun, Moon,
  Shield, Image as ImageIcon, Users, Award, ChevronRight, Zap, Play, Heart
} from "lucide-react";
export const DashboardView: React.FC<any> = (props) => {
  const logic = props;

  const { 
    profile, desires = [], rituals = [], journalEntries = [], quests = [],
    visionItems = [], communityPosts = [], coins = 0, currentRank = "Civilian",
    setActiveTab, handleToggleRitual, handleQuestComplete, handleCreateGoal,
    handleLikeCommunityPost, isCreatingGoal, newGoalTitle, setNewGoalTitle,
    newGoalCategory, setNewGoalCategory, newGoalIcon, setNewGoalIcon,
    todayPlans, handleTogglePlan, handleAddPlan: dbHandleAddPlan, handleDeletePlan,
    updateUserProfile
  } = logic;

  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Archetype Badge Filter
  const [activeArchetype, setActiveArchetype] = useState<string>("DISCIPLINE");

  const [newPlanText, setNewPlanText] = useState("");
  const [showAddPlanModal, setShowAddPlanModal] = useState(false);

  // Quick Goal Add Modal State
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);

  const getTodayStr = () => new Date().toISOString().slice(0, 10);
  const today = getTodayStr();

  // Habit completion calculation
  const defaultHabitList = [
    { id: "def_1", label: "Morning Routine", icon: "☀️", timeOfDay: "morning" },
    { id: "def_2", label: "Workout & Movement", icon: "🏋️", timeOfDay: "morning" },
    { id: "def_3", label: "Meditation / Silence", icon: "🧘", timeOfDay: "morning" },
    { id: "def_4", label: "Journal Scripting", icon: "📖", timeOfDay: "night" },
    { id: "def_5", label: "Vision Board Focus", icon: "✨", timeOfDay: "any" },
    { id: "def_6", label: "No Fap & High Vibrational Energy", icon: "🎯", timeOfDay: "any" },
    { id: "def_7", label: "Healthy Clean Nutrition", icon: "🥗", timeOfDay: "any" },
    { id: "def_8", label: "Sleep by 10:30 PM", icon: "🌙", timeOfDay: "night" },
  ];

  const activeHabits = rituals.length > 0 ? rituals : defaultHabitList;

  const completedHabitsCount = activeHabits.filter((r: any) => 
    r.lastCompletedDate === today || (r.completedDates || []).includes(today)
  ).length;

  const habitCompletionPercent = activeHabits.length > 0 
    ? Math.round((completedHabitsCount / activeHabits.length) * 100) 
    : 0;

  const completedQuestsCount = quests.filter((q: any) => q.completed).length;

  const toggleTodayPlan = (planId: string, currentDone: boolean) => {
    if (handleTogglePlan) {
      handleTogglePlan(planId, !currentDone);
    }
  };

  const handleAddPlan = () => {
    if (!newPlanText.trim()) return;
    if (dbHandleAddPlan) {
      dbHandleAddPlan(newPlanText.trim());
    }
    setNewPlanText("");
    setShowAddPlanModal(false);
  };

  return (
    <div className={`min-h-screen p-2 sm:p-4 md:p-6 space-y-6 font-sans transition-colors duration-300 ${
      isDarkMode ? "bg-black text-white" : "bg-zinc-950 text-white"
    }`}>

      {/* HEADER HERO SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* Left Headline & Archetypes */}
        <div className="lg:col-span-7 bg-zinc-950/80 border border-emerald-500/20 rounded-3xl p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden shadow-2xl group">
          {/* Subtle Emerald Background Glow */}
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-emerald-500/20 transition-all duration-700" />

          <div className="space-y-4 relative z-10">
            {/* Top Brand Tag */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_12px_#10b981]" />
                <span className="text-[11px] font-mono tracking-[3px] text-emerald-400 font-bold uppercase">
                  SIGMA MENIFEST OS • ACTIVE
                </span>
              </div>
              <div className="text-xs font-mono text-zinc-400 bg-white/5 border border-white/10 px-3 py-1 rounded-full flex items-center gap-2">
                <span className="text-amber-300 font-bold">LEVEL {profile?.level || 1}</span>
                <span>•</span>
                <span className="text-emerald-300 font-bold">{currentRank}</span>
              </div>
            </div>

            {/* Giant Display Title */}
            <div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter text-white uppercase leading-[0.95]">
                BECOME <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-300 to-teal-200 drop-shadow-[0_0_25px_rgba(16,185,129,0.4)]">
                  UNIGNORABLE.
                </span>
              </h1>
              <p className="text-xs sm:text-sm font-mono tracking-[3px] text-zinc-400 mt-2 uppercase font-semibold">
                FOCUS. DISCIPLINE. CONSISTENCY.
              </p>
            </div>

            {/* Role / Focus Filter Badges */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              {[
                { id: "DISCIPLINE", label: "DISCIPLINE", icon: Shield },
                { id: "WEALTH", label: "WEALTH", icon: DollarSign },
                { id: "MINDSET", label: "MINDSET", icon: Sparkles },
                { id: "HEALTH", label: "HEALTH", icon: Dumbbell },
                { id: "ACADEMY", label: "ACADEMY", icon: GraduationCap },
              ].map((role) => {
                const IconComp = role.icon;
                const isActive = activeArchetype === role.id;
                return (
                  <button
                    key={role.id}
                    onClick={() => setActiveArchetype(role.id)}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all border ${
                      isActive
                        ? "bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)] scale-105"
                        : "bg-zinc-900/80 border-white/10 text-zinc-400 hover:text-white hover:border-emerald-500/40"
                    }`}
                  >
                    <IconComp size={13} className={isActive ? "text-emerald-300" : "text-zinc-500"} />
                    <span>{role.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Center Anime Hero Artwork / Background Video */}
        <div className="lg:col-span-3 relative rounded-3xl overflow-hidden border border-emerald-500/30 bg-zinc-950 flex items-center justify-center min-h-[220px] group shadow-2xl">
          <video 
            ref={(el) => {
              if (el) {
                el.muted = true;
                el.play().catch(() => {});
              }
            }}
            autoPlay 
            loop 
            muted 
            playsInline
            preload="auto"
            poster="/src/assets/images/anime_hero_artwork_1785263718355.jpg"
            className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
          >
            <source src="/videos/hero_anime_loop.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />
          <div className="absolute bottom-3 left-3 right-3 text-center bg-black/70 backdrop-blur-md rounded-2xl py-2 px-3 border border-emerald-500/20 z-10 pointer-events-none">
            <div className="text-[10px] font-mono text-emerald-300 font-bold uppercase tracking-widest flex items-center justify-center gap-1.5">
              <Zap size={12} className="text-emerald-400 animate-bounce" />
              MAXIMUM ALIGNMENT STATE
            </div>
            <div className="text-[9px] font-mono text-zinc-400 mt-0.5">
              XP: {profile?.xp || 0} • Coins: {coins}
            </div>
          </div>
        </div>

        {/* Right Widget: Daily Reminder + Light/Dark Toggle */}
        <div className="lg:col-span-2 bg-zinc-950/80 border border-emerald-500/20 rounded-3xl p-5 flex flex-col justify-between shadow-2xl space-y-4">
          {/* Top Toggle Switch */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase">THEME</span>
            <div className="flex items-center bg-zinc-900 border border-white/10 rounded-full p-1 gap-1">
              <button 
                onClick={() => setIsDarkMode(true)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold transition ${
                  isDarkMode ? "bg-emerald-500 text-black shadow-md" : "text-zinc-400"
                }`}
              >
                <Moon size={10} /> DARK
              </button>
              <button 
                onClick={() => setIsDarkMode(false)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold transition ${
                  !isDarkMode ? "bg-emerald-500 text-black shadow-md" : "text-zinc-400"
                }`}
              >
                <Sun size={10} /> LIGHT
              </button>
            </div>
          </div>

          {/* Daily Reminder Box */}
          <div className="space-y-2 py-1">
            <div className="text-[10px] font-mono text-emerald-400 font-bold tracking-widest uppercase flex items-center gap-1">
              <CheckCircle size={12} className="text-emerald-400" />
              DAILY REMINDER
            </div>
            <p className="text-xs font-serif italic text-zinc-300 leading-relaxed">
              “You don't find time. You build habits that make time work for you.”
            </p>
          </div>

          <button 
            onClick={() => setActiveTab("journal")}
            className="w-full py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-mono text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition"
          >
            <span>Write Reflection</span>
            <ChevronRight size={12} />
          </button>
        </div>

      </div>

      {/* TOP STATS ROW: WEEKLY STREAK BAR | CURRENT STREAK | LONGEST STREAK */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        
        {/* Weekly Streak Bar */}
        <div className="md:col-span-6 bg-zinc-950/80 border border-emerald-500/20 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-widest">
              WEEKLY RESONANCE STREAK
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">
              {profile?.streak || 0} Day Active
            </span>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((day, idx) => {
              const isActiveDay = (profile?.streak || 0) > idx || (profile?.activeDays || []).length > idx;
              return (
                <div key={day} className="flex flex-col items-center space-y-1.5">
                  <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isActiveDay 
                      ? "bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.5)] font-extrabold"
                      : "bg-zinc-900 border border-white/10 text-zinc-600"
                  }`}>
                    {isActiveDay ? <Check size={16} className="font-bold stroke-[3]" /> : idx + 1}
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400 font-bold">{day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Current Streak Card */}
        <div className="md:col-span-3 bg-zinc-950/80 border border-emerald-500/20 rounded-2xl p-4 flex items-center justify-between relative overflow-hidden">
          <div className="space-y-1 z-10">
            <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-widest">
              CURRENT STREAK
            </span>
            <div className="text-4xl font-black text-emerald-400 tracking-tight flex items-baseline gap-1">
              {profile?.streak || 0} <span className="text-xs font-mono text-zinc-400 font-bold">DAYS</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400/80 flex items-center gap-1">
              <TrendingUp size={12} /> {profile?.streakFreezes || 2} Freeze Shields Active
            </span>
          </div>

          {/* Mini Rising Trend Sparkline SVG */}
          <div className="w-20 h-14 shrink-0">
            <svg viewBox="0 0 100 60" className="w-full h-full">
              <path 
                d="M5 50 L25 40 L45 42 L65 20 L85 25 L95 5" 
                fill="none" 
                stroke="#10b981" 
                strokeWidth="4" 
                strokeLinecap="round"
              />
              <path 
                d="M5 50 L25 40 L45 42 L65 20 L85 25 L95 5 L95 60 L5 60 Z" 
                fill="rgba(16,185,129,0.15)" 
              />
            </svg>
          </div>
        </div>

        {/* Longest Streak & Solo Dominion Launcher Card */}
        <div className="md:col-span-3 bg-zinc-950/80 border border-emerald-500/20 rounded-2xl p-4 flex items-center justify-between group cursor-pointer hover:border-emerald-500/40 transition" onClick={() => setActiveTab("streaks")}>
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-widest">
              HUNTER RANK & STREAK
            </span>
            <div className="text-2xl font-black text-white tracking-tight flex items-baseline gap-1">
              {currentRank}
            </div>
            <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1">
              <span>Solo Dominion RPG</span>
              <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
            </span>
          </div>

          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shadow-lg group-hover:scale-110 transition-transform">
            <Trophy size={26} />
          </div>
        </div>

      </div>

      {/* CONSISTENCY OVERVIEW & WEEKLY METRICS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Consistency Overview Graph */}
        <div className="lg:col-span-8 bg-zinc-950/80 border border-emerald-500/20 rounded-3xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="space-y-0.5">
              <h3 className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-widest">
                CONSISTENCY OVERVIEW
              </h3>
              <p className="text-[10px] text-zinc-500">Quantum Coherence Trajectory</p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-mono font-bold flex items-center gap-1">
              <TrendingUp size={13} /> Alignment {profile?.alignment || 80}%
            </span>
          </div>

          {/* Dynamic Trajectory SVG Chart */}
          <div className="relative h-48 sm:h-56 w-full pt-4">
            <svg viewBox="0 0 500 200" className="w-full h-full overflow-visible">
              <line x1="0" y1="40" x2="500" y2="40" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
              <line x1="0" y1="90" x2="500" y2="90" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
              <line x1="0" y1="140" x2="500" y2="140" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />

              <text x="0" y="45" fill="#71717a" fontSize="10" fontFamily="monospace">100%</text>
              <text x="0" y="95" fill="#71717a" fontSize="10" fontFamily="monospace">50%</text>
              <text x="0" y="145" fill="#71717a" fontSize="10" fontFamily="monospace">0%</text>

              <defs>
                <linearGradient id="emeraldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              <path 
                d="M 50 140 L 120 110 L 180 70 L 240 90 L 300 45 L 360 65 L 420 40 L 480 50" 
                fill="none" 
                stroke="#10b981" 
                strokeWidth="4" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
              <path 
                d="M 50 140 L 120 110 L 180 70 L 240 90 L 300 45 L 360 65 L 420 40 L 480 50 L 480 180 L 50 180 Z" 
                fill="url(#emeraldGrad)" 
              />

              {[
                { x: 50, y: 140 }, { x: 120, y: 110 }, { x: 180, y: 70 },
                { x: 240, y: 90 }, { x: 300, y: 45 }, { x: 360, y: 65 },
                { x: 420, y: 40 }, { x: 480, y: 50 }
              ].map((pt, i) => (
                <circle key={i} cx={pt.x} cy={pt.y} r="5" fill="#10b981" stroke="#000" strokeWidth="2" />
              ))}
            </svg>

            <div className="flex justify-between text-[10px] font-mono text-zinc-500 pt-2 px-6">
              <span>WEEK 1</span>
              <span>WEEK 2</span>
              <span>WEEK 3</span>
              <span>WEEK 4</span>
              <span className="text-emerald-400 font-bold">THIS WEEK</span>
            </div>
          </div>
        </div>

        {/* Weekly Metrics Box */}
        <div className="lg:col-span-4 bg-zinc-950/80 border border-emerald-500/20 rounded-3xl p-5 space-y-4 flex flex-col justify-between">
          <div className="border-b border-white/10 pb-3">
            <h3 className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-widest">
              SAAS CORE METRICS
            </h3>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="flex justify-between items-center py-1.5 border-b border-white/5">
              <span className="text-zinc-400 flex items-center gap-2">
                <Target size={14} className="text-emerald-400" /> Focus Alignment
              </span>
              <span className="font-bold text-emerald-300">{profile?.alignment || 80}%</span>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-white/5">
              <span className="text-zinc-400 flex items-center gap-2">
                <CheckCircle size={14} className="text-emerald-400" /> Habits Completed Today
              </span>
              <span className="font-bold text-emerald-300">{completedHabitsCount} / {activeHabits.length}</span>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-white/5">
              <span className="text-zinc-400 flex items-center gap-2">
                <Flame size={14} className="text-amber-400" /> Active RPG Quests
              </span>
              <span className="font-bold text-white">{completedQuestsCount} / {quests.length}</span>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-white/5">
              <span className="text-zinc-400 flex items-center gap-2">
                <Sparkles size={14} className="text-emerald-400" /> Desires & Goals
              </span>
              <span className="font-bold text-white">{desires.length} Tracked</span>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-white/5">
              <span className="text-zinc-400 flex items-center gap-2">
                <BookOpen size={14} className="text-emerald-400" /> Journal Reflections
              </span>
              <span className="font-bold text-white">{journalEntries.length} Entries</span>
            </div>

            <div className="flex justify-between items-center py-1.5">
              <span className="text-zinc-400 flex items-center gap-2">
                <ImageIcon size={14} className="text-emerald-400" /> Vision Board
              </span>
              <span className="font-bold text-white">{visionItems.length} Visuals</span>
            </div>
          </div>
        </div>

      </div>

      {/* TRACKERS ROW: DYNAMIC HABITS | RPG QUESTS | GOALS & DESIRES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* 1. HIGH-VIBRATION HABITS & RITUALS (Real Firestore Data) */}
        <div className="lg:col-span-4 bg-zinc-950/80 border border-emerald-500/20 rounded-3xl p-5 space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-emerald-400" />
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                HABITS & RITUALS
              </h3>
            </div>
            <button 
              onClick={() => setActiveTab("goals")}
              className="text-[10px] font-mono text-emerald-400 hover:underline flex items-center gap-1 font-bold"
            >
              <span>Manage</span>
              <ChevronRight size={12} />
            </button>
          </div>

          <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1 scrollbar-none">
            {activeHabits.map((habit: any) => {
              const isDone = habit.lastCompletedDate === today || (habit.completedDates || []).includes(today);
              return (
                <div 
                  key={habit.id} 
                  onClick={() => handleToggleRitual && handleToggleRitual(habit.id)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                    isDone 
                      ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-200" 
                      : "bg-zinc-900 border-white/10 text-zinc-300 hover:border-emerald-400/50"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base">{habit.icon || "🔥"}</span>
                    <span className="text-xs font-mono font-bold truncate">{habit.label}</span>
                  </div>

                  <button className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                    isDone 
                      ? "bg-emerald-500 text-black shadow-[0_0_10px_rgba(16,185,129,0.5)]" 
                      : "bg-zinc-800 border border-white/20 hover:border-emerald-400"
                  }`}>
                    {isDone && <Check size={14} className="stroke-[3]" />}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="border-t border-white/10 pt-3 flex items-center justify-between text-[10px] font-mono">
            <span className="text-zinc-400 font-bold uppercase">
              Progress: {completedHabitsCount}/{activeHabits.length} ({habitCompletionPercent}%)
            </span>
            <button 
              onClick={() => setActiveTab("goals")}
              className="text-emerald-400 font-bold hover:underline"
            >
              + Add Habit
            </button>
          </div>
        </div>

        {/* 2. DAILY RPG QUESTS & ADRENALINE TASKS (Real Firestore Data) */}
        <div className="lg:col-span-4 bg-zinc-950/80 border border-emerald-500/20 rounded-3xl p-5 space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Flame size={16} className="text-amber-400" />
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                DAILY RPG QUESTS
              </h3>
            </div>
            <button 
              onClick={() => setActiveTab("streaks")}
              className="text-[10px] font-mono text-amber-400 hover:underline flex items-center gap-1 font-bold"
            >
              <span>Dominion</span>
              <ChevronRight size={12} />
            </button>
          </div>

          <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1 scrollbar-none">
            {quests.length === 0 ? (
              <div className="text-center py-8 text-zinc-500 text-xs font-mono">
                No active quests. Generating daily missions...
              </div>
            ) : (
              quests.map((quest: any) => (
                <div 
                  key={quest.id} 
                  className={`p-3 rounded-xl border space-y-1.5 transition-all ${
                    quest.completed 
                      ? "bg-zinc-900/40 border-emerald-500/30 opacity-70" 
                      : "bg-zinc-900 border-white/10 hover:border-emerald-500/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className={`text-xs font-mono font-bold ${quest.completed ? "line-through text-zinc-400" : "text-white"}`}>
                      {quest.title}
                    </span>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-400/30">
                      +{quest.xpValue || quest.xpReward || 50} XP
                    </span>
                  </div>

                  <p className="text-[10px] text-zinc-400 line-clamp-2">{quest.description}</p>

                  <div className="flex justify-between items-center pt-1">
                    <span className="text-[9px] font-mono text-emerald-400 font-bold uppercase">
                      Category: {quest.category || "Main Quest"}
                    </span>

                    {!quest.completed ? (
                      <button 
                        onClick={() => handleQuestComplete && handleQuestComplete(quest.id)}
                        className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-[10px] uppercase shadow-md transition"
                      >
                        Complete Quest
                      </button>
                    ) : (
                      <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1">
                        <Check size={12} /> Completed
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-white/10 pt-3 text-center">
            <span className="text-[9px] font-mono text-zinc-400 tracking-wider uppercase font-bold">
              EARN XP • LEVEL UP • CLAIM DOMINION
            </span>
          </div>
        </div>

        {/* 3. MANIFESTATION GOALS & DESIRES (Real Firestore Data) */}
        <div className="lg:col-span-4 bg-zinc-950/80 border border-emerald-500/20 rounded-3xl p-5 space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-emerald-400" />
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                GOALS & DESIRES
              </h3>
            </div>
            <button 
              onClick={() => setShowAddGoalModal(true)}
              className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500 hover:text-black text-[10px] font-mono font-bold transition flex items-center gap-1"
            >
              <Plus size={12} /> Goal
            </button>
          </div>

          <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1 scrollbar-none">
            {desires.length === 0 ? (
              <div className="text-center py-8 text-zinc-500 text-xs font-mono space-y-2">
                <p>No desires tracked yet.</p>
                <button 
                  onClick={() => setShowAddGoalModal(true)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500 text-black font-bold text-xs"
                >
                  Create First Goal
                </button>
              </div>
            ) : (
              desires.map((goal: any) => (
                <div key={goal.id} className="bg-zinc-900/60 p-3 rounded-2xl border border-white/5 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                      <span>{goal.icon || "✨"}</span>
                      <span className="truncate">{goal.title}</span>
                    </span>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 uppercase">
                      {goal.category}
                    </span>
                  </div>

                  <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-400 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${goal.progress || 50}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[9px] font-mono text-zinc-400">
                    <span>Belief: {goal.beliefLevel || 70}%</span>
                    <span>State: {goal.expectedReality || "Consolidating"}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <button 
            onClick={() => setActiveTab("goals")}
            className="w-full py-2 rounded-xl bg-zinc-900 hover:bg-white/5 border border-white/10 text-zinc-300 font-mono text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition"
          >
            <span>Open Goals Engine</span>
            <ChevronRight size={12} />
          </button>
        </div>

      </div>

      {/* SAAS ECOSYSTEM CARDS: VISION BOARD | COMMUNITY FEED | ACADEMY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Vision Board Spotlight */}
        <div className="lg:col-span-4 bg-zinc-950/80 border border-emerald-500/20 rounded-3xl p-5 space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <ImageIcon size={16} className="text-emerald-400" />
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                VISION BOARD SPOTLIGHT
              </h3>
            </div>
            <button onClick={() => setActiveTab("vision")} className="text-[10px] font-mono text-emerald-400 hover:underline font-bold flex items-center gap-1">
              <span>View All</span>
              <ChevronRight size={12} />
            </button>
          </div>

          {visionItems.length === 0 ? (
            <div 
              onClick={() => setActiveTab("vision")} 
              className="border-2 border-dashed border-white/10 rounded-2xl p-6 text-center cursor-pointer hover:border-emerald-500/40 transition space-y-2"
            >
              <ImageIcon size={28} className="mx-auto text-zinc-600" />
              <div className="text-xs font-mono text-zinc-400">Upload your dream reality visuals</div>
              <span className="inline-block px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-[10px] font-bold font-mono">
                + Add Vision Image
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-hidden">
              {visionItems.slice(0, 2).map((item: any) => (
                <div key={item.id} className="relative rounded-2xl overflow-hidden h-36 border border-white/10 group">
                  <img src={item.imageUrl} alt={item.caption} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2 text-[10px] font-mono font-bold text-white truncate">
                    {item.caption || "Manifest Reality"}
                  </div>
                </div>
              ))}
            </div>
          )}

          <button 
            onClick={() => setActiveTab("vision")}
            className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition"
          >
            <span>VISUALIZE DREAM LIFE</span>
            <ArrowUpRight size={14} />
          </button>
        </div>

        {/* High Vibrational Community Feed */}
        <div className="lg:col-span-4 bg-zinc-950/80 border border-emerald-500/20 rounded-3xl p-5 space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-emerald-400" />
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                COMMUNITY FEED
              </h3>
            </div>
            <button onClick={() => setActiveTab("community")} className="text-[10px] font-mono text-emerald-400 hover:underline font-bold flex items-center gap-1">
              <span>Feed</span>
              <ChevronRight size={12} />
            </button>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {communityPosts.length === 0 ? (
              <div className="text-center py-6 text-zinc-500 text-xs">
                Connect with high-vibration seekers worldwide.
              </div>
            ) : (
              communityPosts.slice(0, 2).map((post: any) => (
                <div key={post.id} className="bg-zinc-900/60 p-3 rounded-2xl border border-white/5 space-y-1.5">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-bold text-emerald-300">{post.authorName || "Seeker"}</span>
                    <span className="text-zinc-500">{post.category || "Manifestation"}</span>
                  </div>
                  <p className="text-zinc-300 text-[11px] line-clamp-2">{post.content}</p>
                  <div className="flex justify-between items-center text-[9px] text-zinc-500 pt-1">
                    <button 
                      onClick={() => handleLikeCommunityPost && handleLikeCommunityPost(post.id)}
                      className="flex items-center gap-1 text-emerald-400 font-bold hover:underline"
                    >
                      <Heart size={10} fill="currentColor" /> {post.likesCount || 0} Vibrations
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <button 
            onClick={() => setActiveTab("community")}
            className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition"
          >
            <span>JOIN DISCUSSIONS</span>
            <ArrowUpRight size={14} />
          </button>
        </div>

        {/* Academy Masterclass & Mindset */}
        <div className="lg:col-span-4 bg-zinc-950/80 border border-emerald-500/20 rounded-3xl p-5 space-y-4 flex flex-col justify-between">
          <div className="border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <GraduationCap size={16} className="text-emerald-400" />
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                ACADEMY & MINDSET
              </h3>
            </div>
            <p className="text-[10px] font-mono text-zinc-500 mt-0.5">MASTERY MODULES</p>
          </div>

          <div className="space-y-2.5 font-mono text-xs">
            <div className="bg-zinc-900/60 p-3 rounded-2xl border border-white/5 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="font-bold text-white text-[11px]">Quantum Reality Creation</span>
                <span className="text-[9px] text-emerald-400 font-bold">Active</span>
              </div>
              <p className="text-[10px] text-zinc-400">Master sensory scripting & brainwave alignment.</p>
              <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-400 h-full w-[70%] rounded-full" />
              </div>
            </div>

            <div className="bg-zinc-900/60 p-3 rounded-2xl border border-white/5 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="font-bold text-white text-[11px]">Solo Leveling Discipline</span>
                <span className="text-[9px] text-amber-300 font-bold">Recommended</span>
              </div>
              <p className="text-[10px] text-zinc-400">Build unshakeable daily habits and grit.</p>
            </div>
          </div>

          <button 
            onClick={() => setActiveTab("academy")}
            className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition"
          >
            <span>RESUME MASTERCLASS</span>
            <Play size={12} />
          </button>
        </div>

      </div>

      {/* BOTTOM MOTIVATION & TODAY'S PLAN ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Today's Plan Checklist */}
        <div className="lg:col-span-4 bg-zinc-950/80 border border-emerald-500/20 rounded-3xl p-5 space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              TODAY'S ACTION PLAN
            </h3>
            <button 
              onClick={() => setShowAddPlanModal(true)}
              className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500 hover:text-black transition text-xs font-mono font-bold flex items-center gap-1"
            >
              <Plus size={12} /> Add
            </button>
          </div>

          <div className="space-y-2 font-mono text-xs">
            {(todayPlans || []).map((plan) => (
              <div 
                key={plan.id} 
                className="group/item flex items-center justify-between p-2.5 rounded-xl border bg-zinc-900 border-white/10 text-white hover:border-emerald-400/50 transition-all"
              >
                <div 
                  onClick={() => toggleTodayPlan(plan.id, plan.done)}
                  className={`flex items-center gap-3 cursor-pointer select-none flex-grow ${
                    plan.done 
                      ? "text-zinc-400 line-through" 
                      : "text-white"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                    plan.done ? "bg-emerald-500 text-black" : "bg-zinc-800 border border-white/20"
                  }`}>
                    {plan.done && <Check size={12} className="stroke-[3]" />}
                  </div>
                  <span>{plan.text}</span>
                </div>
                <button 
                  onClick={() => handleDeletePlan && handleDeletePlan(plan.id)}
                  className="opacity-0 group-hover/item:opacity-100 hover:text-red-400 text-zinc-500 p-1 transition"
                  title="Delete Item"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Big Quote Box */}
        <div className="lg:col-span-4 bg-zinc-950/80 border border-emerald-500/20 rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden group">
          <div className="text-4xl text-emerald-500/30 font-serif font-black">“</div>
          <div className="text-center space-y-3 my-auto">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase leading-tight font-serif italic">
              I'M BUILDING MY FUTURE, <br />
              ONE HABIT AT A TIME.
            </h2>
            <div className="text-xl font-serif text-emerald-400 italic">
              Sigma Menifest OS
            </div>
          </div>
          <div className="text-right text-4xl text-emerald-500/30 font-serif font-black">”</div>
        </div>

        {/* Note To Self */}
        <div className="lg:col-span-4 bg-zinc-950/80 border border-emerald-500/20 rounded-3xl p-6 flex flex-col justify-between">
          <div className="border-b border-white/10 pb-2">
            <h3 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-widest">
              NOTE TO SELF
            </h3>
          </div>

          <div className="my-auto space-y-2">
            <p className="text-sm font-mono text-zinc-200 leading-relaxed italic">
              “{profile?.noteToSelf || "You're not behind. You're just getting started. Keep showing up."}”
            </p>
            <div className="text-xs font-mono text-emerald-400 font-bold text-right">
              — Future You
            </div>
          </div>

          <button 
            onClick={async () => {
              const currentNote = profile?.noteToSelf || "You're not behind. You're just getting started. Keep showing up.";
              const updated = prompt("Update your Note to Self:", currentNote);
              if (updated && updateUserProfile) {
                await updateUserProfile({ noteToSelf: updated });
              }
            }}
            className="text-[10px] font-mono text-zinc-500 hover:text-emerald-400 uppercase tracking-widest text-left"
          >
            ✏️ Edit Note
          </button>
        </div>

      </div>

      {/* QUICK SAAS NAVIGATION BAR */}
      <div className="bg-zinc-950 border border-emerald-500/30 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider px-2">
          QUICK SAAS NAVIGATION:
        </span>

        <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
          {[
            { id: "dashboard", label: "Dashboard" },
            { id: "goals", label: "Goals & Habits" },
            { id: "journal", label: "Journal" },
            { id: "vision", label: "Vision Board" },
            { id: "academy", label: "Academy" },
            { id: "community", label: "Community" },
            { id: "streaks", label: "Solo Dominion" },
            { id: "profile", label: "Profile" },
          ].map((nav) => (
            <button
              key={nav.id}
              onClick={() => setActiveTab(nav.id)}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-300 border border-white/10 transition"
            >
              {nav.label}
            </button>
          ))}
        </div>
      </div>

      {/* FOOTER BANNER */}
      <div className="bg-zinc-950/90 border border-emerald-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between text-center gap-2">
        <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
          <span className="text-lg">Σ</span>
          <span className="font-mono tracking-[4px]">SIGMA MENIFEST OS</span>
        </div>

        <div className="text-xs font-mono tracking-[6px] text-zinc-400 uppercase font-black">
          SILENCE . DISCIPLINE . DOMINANCE .
        </div>

        <div className="text-emerald-400/60 font-mono text-xs">
          🐺 100% UNSTOPPABLE
        </div>
      </div>

      {/* ADD TODAY'S PLAN MODAL */}
      {showAddPlanModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-emerald-500/40 rounded-3xl p-6 w-full max-w-md space-y-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="font-bold text-white text-base font-mono">Add Today's Action Plan</h3>
              <button onClick={() => setShowAddPlanModal(false)} className="text-zinc-500 hover:text-white"><X size={18} /></button>
            </div>
            <input 
              type="text" 
              placeholder="e.g., Complete 2 chapters of mindset scripting..." 
              value={newPlanText}
              onChange={(e) => setNewPlanText(e.target.value)}
              className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-emerald-400 font-mono"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowAddPlanModal(false)} className="px-4 py-2 rounded-xl text-xs font-mono text-zinc-400 hover:text-white">Cancel</button>
              <button onClick={handleAddPlan} className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold font-mono text-xs shadow-lg">Add Task</button>
            </div>
          </div>
        </div>
      )}

      {/* ADD GOAL MODAL */}
      {showAddGoalModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-emerald-500/40 rounded-3xl p-6 w-full max-w-md space-y-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="font-bold text-white text-base font-mono">Create New Desire Goal</h3>
              <button onClick={() => setShowAddGoalModal(false)} className="text-zinc-500 hover:text-white"><X size={18} /></button>
            </div>

            <form onSubmit={async (e) => {
              if (handleCreateGoal) {
                await handleCreateGoal(e);
                setShowAddGoalModal(false);
              }
            }} className="space-y-3 font-mono text-xs">
              <div>
                <label className="text-zinc-400 text-[10px] uppercase font-bold">Goal Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. $10k/mo Financial Freedom" 
                  value={newGoalTitle}
                  onChange={(e) => setNewGoalTitle(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-white focus:border-emerald-400 mt-1"
                  required
                />
              </div>

              <div>
                <label className="text-zinc-400 text-[10px] uppercase font-bold">Category</label>
                <select 
                  value={newGoalCategory} 
                  onChange={(e) => setNewGoalCategory(e.target.value as any)}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-white mt-1"
                >
                  <option value="wealth">Wealth & Abundance</option>
                  <option value="health">Health & Fitness</option>
                  <option value="mindset">Mindset & Discipline</option>
                  <option value="career">Career & Empire</option>
                  <option value="relationships">Relationships</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <button type="button" onClick={() => setShowAddGoalModal(false)} className="px-4 py-2 text-zinc-400">Cancel</button>
                <button type="submit" disabled={isCreatingGoal} className="px-5 py-2 bg-emerald-500 text-black font-bold rounded-xl">
                  {isCreatingGoal ? "Creating..." : "Save Goal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default DashboardView;

import React, { useState, useEffect } from "react";
import { resolveImageUrl, onImgError } from "../../lib/imageHelper";
import {
  Flame, Trophy, CheckCircle, Check, ArrowUpRight, Plus,
  TrendingUp, Dumbbell, BookOpen, Target, DollarSign,
  Briefcase, GraduationCap, User, Wrench, Sparkles, X, Sun, Moon,
  Shield, Image as ImageIcon, Users, Award, ChevronRight, Zap, Play, Heart,
  Settings2, RotateCcw, Eye, EyeOff
} from "lucide-react";

// iOS 17 design tokens (no neon, no glow, no gradient text).
// Pure neutral palette: black/white/grey with one subtle accent (#0a84ff) for
// primary actions — same approach Strava/Apple Fitness/Whoop use.
const ACCENT = "#0a84ff"; // iOS system blue
const TEXT_PRIMARY = "#ffffff";
const TEXT_SECONDARY = "rgba(235,235,245,0.62)";
const TEXT_TERTIARY = "rgba(235,235,245,0.32)";
const SURFACE = "#0a0a0a";
const SURFACE_RAISED = "#141414";
const HAIRLINE = "rgba(255,255,255,0.08)";

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

  // ============== DASHBOARD CUSTOMIZATION (state only — sections not wired yet) ==============
  const HIDDEN_SECTIONS_KEY = "manifest_dashboard_hidden_v1";
  const [hiddenSections, setHiddenSections] = useState<string[]>(() => {
    try {
      const raw =
        typeof window !== "undefined"
          ? window.localStorage.getItem(HIDDEN_SECTIONS_KEY)
          : null;
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [showCustomizePanel, setShowCustomizePanel] = useState(false);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        HIDDEN_SECTIONS_KEY,
        JSON.stringify(hiddenSections)
      );
    } catch {}
  }, [hiddenSections]);

  const TOGGLEABLE_SECTIONS: { id: string; label: string }[] = [
    { id: "hero", label: "Header hero (rank + tagline)" },
    { id: "stats-row", label: "Stats row (streak, rank, level)" },
    { id: "consistency", label: "Consistency overview + weekly metrics" },
    { id: "bottom-row", label: "Vision + goals + journal previews" },
  ];
  const isHidden = (id: string) => hiddenSections.includes(id);
  const toggleSection = (id: string) => {
    setHiddenSections((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };
  const restoreAll = () => setHiddenSections([]);

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
    <div
      className="min-h-screen p-2 sm:p-4 md:p-6 space-y-4 sm:space-y-5 font-sans"
      style={{ backgroundColor: "#000", color: TEXT_PRIMARY }}
    >

      {/* HEADER HERO SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-stretch">

        {/* Left Headline & Archetypes */}
        <div
          className="lg:col-span-7 rounded-3xl p-6 sm:p-7 flex flex-col justify-between relative overflow-hidden"
          style={{ backgroundColor: SURFACE, border: `1px solid ${HAIRLINE}` }}
        >
          {/* Top Brand Tag */}
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: "#34c759" }}
              />
              <span
                className="text-[10.5px] font-semibold tracking-widest uppercase"
                style={{ color: TEXT_SECONDARY }}
              >
                Menifest OS · Active
              </span>
            </div>
            <div
              className="text-[10.5px] font-medium px-3 py-1 rounded-full flex items-center gap-2"
              style={{
                backgroundColor: "rgba(255,255,255,0.04)",
                border: `1px solid ${HAIRLINE}`,
                color: TEXT_SECONDARY,
              }}
            >
              <span style={{ color: TEXT_PRIMARY, fontWeight: 600 }}>Level {profile?.level || 1}</span>
              <span style={{ color: TEXT_TERTIARY }}>·</span>
              <span style={{ color: TEXT_PRIMARY, fontWeight: 600 }}>{currentRank}</span>
            </div>
          </div>

          {/* Giant Display Title */}
          <div className="relative z-10 mt-6">
            <h1
              className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[0.95]"
              style={{ color: TEXT_PRIMARY, letterSpacing: "-0.03em" }}
            >
              Become<br />
              <span style={{ color: TEXT_PRIMARY }}>Unignorable.</span>
            </h1>
            <p
              className="text-[11px] sm:text-xs font-medium tracking-[0.2em] mt-3 uppercase"
              style={{ color: TEXT_SECONDARY }}
            >
              Focus · Discipline · Consistency
            </p>
          </div>

          {/* Role / Focus Filter Badges — iOS-style segmented pills */}
          <div className="flex flex-wrap items-center gap-1.5 pt-4 relative z-10">
            {[
              { id: "DISCIPLINE", label: "Discipline", icon: Shield },
              { id: "WEALTH", label: "Wealth", icon: DollarSign },
              { id: "MINDSET", label: "Mindset", icon: Sparkles },
              { id: "HEALTH", label: "Health", icon: Dumbbell },
              { id: "ACADEMY", label: "Academy", icon: GraduationCap },
            ].map((role) => {
              const IconComp = role.icon;
              const isActive = activeArchetype === role.id;
              return (
                <button
                  key={role.id}
                  onClick={() => setActiveArchetype(role.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors"
                  style={{
                    backgroundColor: isActive ? TEXT_PRIMARY : "rgba(255,255,255,0.04)",
                    color: isActive ? "#000" : TEXT_SECONDARY,
                    border: `1px solid ${isActive ? TEXT_PRIMARY : HAIRLINE}`,
                  }}
                >
                  <IconComp size={12} />
                  <span>{role.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* (Maximum Alignment section removed — was a duplicate anime hero) */}

        {/* Right Widget: Daily Reminder + Light/Dark Toggle */}
        <div
          className="lg:col-span-2 rounded-3xl p-4 flex flex-col justify-between"
          style={{ backgroundColor: SURFACE, border: `1px solid ${HAIRLINE}` }}
        >
          {/* (Theme toggle removed) */}

          {/* Daily Reminder Box */}
          <div className="space-y-2 py-1">
            <div
              className="text-[10px] font-semibold tracking-widest uppercase flex items-center gap-1"
              style={{ color: TEXT_SECONDARY }}
            >
              <CheckCircle size={11} style={{ color: "#34c759" }} />
              Daily Reminder
            </div>
            <p className="text-[12px] italic leading-relaxed" style={{ color: TEXT_PRIMARY }}>
              "You don't find time. You build habits that make time work for you."
            </p>
          </div>

          <button
            onClick={() => setActiveTab("journal")}
            className="w-full py-2 rounded-xl font-medium text-[11px] uppercase tracking-wider flex items-center justify-center gap-1 transition-colors"
            style={{
              backgroundColor: "rgba(255,255,255,0.06)",
              color: TEXT_PRIMARY,
              border: `1px solid ${HAIRLINE}`,
            }}
          >
            <span>Write Reflection</span>
            <ChevronRight size={12} />
          </button>
        </div>

      </div>

      {/* TOP STATS ROW: WEEKLY STREAK BAR | CURRENT STREAK | LONGEST STREAK */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4">

        {/* Weekly Streak Bar */}
        <div
          className="md:col-span-6 rounded-2xl p-4 flex flex-col justify-between"
          style={{ backgroundColor: SURFACE, border: `1px solid ${HAIRLINE}` }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: TEXT_SECONDARY }}>
              Weekly Resonance Streak
            </span>
            <span className="text-[10px] font-semibold" style={{ color: TEXT_PRIMARY }}>
              {profile?.streak || 0} day active
            </span>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((day, idx) => {
              const isActiveDay = (profile?.streak || 0) > idx || (profile?.activeDays || []).length > idx;
              return (
                <div key={day} className="flex flex-col items-center space-y-1.5">
                  <div
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs font-semibold transition-colors"
                    style={{
                      backgroundColor: isActiveDay ? TEXT_PRIMARY : "rgba(255,255,255,0.04)",
                      color: isActiveDay ? "#000" : TEXT_TERTIARY,
                      border: `1px solid ${isActiveDay ? TEXT_PRIMARY : HAIRLINE}`,
                    }}
                  >
                    {isActiveDay ? <Check size={16} strokeWidth={3} /> : idx + 1}
                  </div>
                  <span className="text-[10px] font-semibold" style={{ color: TEXT_SECONDARY }}>{day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Current Streak Card */}
        <div
          className="md:col-span-3 rounded-2xl p-4 flex items-center justify-between relative overflow-hidden"
          style={{ backgroundColor: SURFACE, border: `1px solid ${HAIRLINE}` }}
        >
          <div className="space-y-1 z-10">
            <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: TEXT_SECONDARY }}>
              Current Streak
            </span>
            <div className="text-4xl font-bold tracking-tight flex items-baseline gap-1" style={{ color: TEXT_PRIMARY }}>
              {profile?.streak || 0} <span className="text-xs font-semibold" style={{ color: TEXT_SECONDARY }}>days</span>
            </div>
            <span className="text-[10px] font-medium flex items-center gap-1" style={{ color: TEXT_SECONDARY }}>
              <TrendingUp size={11} /> {profile?.streakFreezes || 2} freeze shields
            </span>
          </div>

          {/* Mini Rising Trend Sparkline SVG — neutral stroke */}
          <div className="w-20 h-14 shrink-0">
            <svg viewBox="0 0 100 60" className="w-full h-full">
              <path
                d="M5 50 L25 40 L45 42 L65 20 L85 25 L95 5"
                fill="none"
                stroke="#ffffff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeOpacity="0.85"
              />
            </svg>
          </div>
        </div>

        {/* Longest Streak & Solo Dominion Launcher Card */}
        <div
          className="md:col-span-3 rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-colors"
          style={{ backgroundColor: SURFACE, border: `1px solid ${HAIRLINE}` }}
          onClick={() => setActiveTab("streaks")}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.18)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = HAIRLINE; }}
        >
          <div className="space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: TEXT_SECONDARY }}>
              Hunter Rank
            </span>
            <div className="text-2xl font-bold tracking-tight" style={{ color: TEXT_PRIMARY }}>
              {currentRank}
            </div>
            <span className="text-[10px] font-semibold flex items-center gap-1" style={{ color: TEXT_SECONDARY }}>
              <span>Solo Dominion RPG</span>
              <ChevronRight size={11} />
            </span>
          </div>

          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
          >
            <Trophy size={22} style={{ color: TEXT_PRIMARY }} />
          </div>
        </div>

      </div>

      {/* CONSISTENCY OVERVIEW & WEEKLY METRICS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">

        {/* Consistency Overview Graph */}
        <div
          className="lg:col-span-8 rounded-3xl p-5 space-y-4"
          style={{ backgroundColor: SURFACE, border: `1px solid ${HAIRLINE}` }}
        >
          <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: HAIRLINE }}>
            <div className="space-y-0.5">
              <h3 className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: TEXT_PRIMARY }}>
                Consistency Overview
              </h3>
              <p className="text-[10px]" style={{ color: TEXT_SECONDARY }}>Quantum Coherence Trajectory</p>
            </div>
            <span
              className="px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1"
              style={{ backgroundColor: "rgba(255,255,255,0.06)", color: TEXT_PRIMARY }}
            >
              <TrendingUp size={12} /> Alignment {profile?.alignment || 80}%
            </span>
          </div>

          {/* Dynamic Trajectory SVG Chart — neutral strokes */}
          <div className="relative h-48 sm:h-56 w-full pt-4">
            <svg viewBox="0 0 500 200" className="w-full h-full overflow-visible">
              <line x1="0" y1="40" x2="500" y2="40" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
              <line x1="0" y1="90" x2="500" y2="90" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
              <line x1="0" y1="140" x2="500" y2="140" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />

              <text x="0" y="45" fill="#71717a" fontSize="10" fontFamily="system-ui">100%</text>
              <text x="0" y="95" fill="#71717a" fontSize="10" fontFamily="system-ui">50%</text>
              <text x="0" y="145" fill="#71717a" fontSize="10" fontFamily="system-ui">0%</text>

              <defs>
                <linearGradient id="neutralGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                </linearGradient>
              </defs>

              <path
                d="M 50 140 L 120 110 L 180 70 L 240 90 L 300 45 L 360 65 L 420 40 L 480 50"
                fill="none"
                stroke="#ffffff"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M 50 140 L 120 110 L 180 70 L 240 90 L 300 45 L 360 65 L 420 40 L 480 50 L 480 180 L 50 180 Z"
                fill="url(#neutralGrad)"
              />

              {[
                { x: 50, y: 140 }, { x: 120, y: 110 }, { x: 180, y: 70 },
                { x: 240, y: 90 }, { x: 300, y: 45 }, { x: 360, y: 65 },
                { x: 420, y: 40 }, { x: 480, y: 50 }
              ].map((pt, i) => (
                <circle key={i} cx={pt.x} cy={pt.y} r="4" fill="#ffffff" stroke="#000" strokeWidth="2" />
              ))}
            </svg>

            <div className="flex justify-between text-[10px] font-medium pt-2 px-6" style={{ color: TEXT_SECONDARY }}>
              <span>Week 1</span>
              <span>Week 2</span>
              <span>Week 3</span>
              <span>Week 4</span>
              <span style={{ color: TEXT_PRIMARY, fontWeight: 600 }}>This week</span>
            </div>
          </div>
        </div>

        {/* Weekly Metrics Box */}
        <div
          className="lg:col-span-4 rounded-3xl p-5 space-y-4 flex flex-col justify-between"
          style={{ backgroundColor: SURFACE, border: `1px solid ${HAIRLINE}` }}
        >
          <div className="border-b pb-3" style={{ borderColor: HAIRLINE }}>
            <h3 className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: TEXT_PRIMARY }}>
              Core Metrics
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-1.5 border-b" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
              <span className="flex items-center gap-2" style={{ color: TEXT_SECONDARY }}>
                <Target size={13} style={{ color: TEXT_PRIMARY }} /> Focus Alignment
              </span>
              <span className="font-semibold" style={{ color: TEXT_PRIMARY }}>{profile?.alignment || 80}%</span>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
              <span className="flex items-center gap-2" style={{ color: TEXT_SECONDARY }}>
                <CheckCircle size={13} style={{ color: TEXT_PRIMARY }} /> Habits Completed Today
              </span>
              <span className="font-semibold" style={{ color: TEXT_PRIMARY }}>{completedHabitsCount} / {activeHabits.length}</span>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
              <span className="flex items-center gap-2" style={{ color: TEXT_SECONDARY }}>
                <Flame size={13} style={{ color: TEXT_PRIMARY }} /> Active RPG Quests
              </span>
              <span className="font-semibold" style={{ color: TEXT_PRIMARY }}>{completedQuestsCount} / {quests.length}</span>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
              <span className="flex items-center gap-2" style={{ color: TEXT_SECONDARY }}>
                <Sparkles size={13} style={{ color: TEXT_PRIMARY }} /> Desires & Goals
              </span>
              <span className="font-semibold" style={{ color: TEXT_PRIMARY }}>{desires.length} tracked</span>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
              <span className="flex items-center gap-2" style={{ color: TEXT_SECONDARY }}>
                <BookOpen size={13} style={{ color: TEXT_PRIMARY }} /> Journal Reflections
              </span>
              <span className="font-semibold" style={{ color: TEXT_PRIMARY }}>{journalEntries.length} entries</span>
            </div>

            <div className="flex justify-between items-center py-1.5">
              <span className="flex items-center gap-2" style={{ color: TEXT_SECONDARY }}>
                <ImageIcon size={13} style={{ color: TEXT_PRIMARY }} /> Vision Board
              </span>
              <span className="font-semibold" style={{ color: TEXT_PRIMARY }}>{visionItems.length} visuals</span>
            </div>
          </div>
        </div>

      </div>

      {/* SAAS ECOSYSTEM CARDS: VISION BOARD ONLY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">

        {/* Vision Board Spotlight */}
        <div
          className="lg:col-span-4 rounded-3xl p-5 space-y-4 flex flex-col justify-between"
          style={{ backgroundColor: SURFACE, border: `1px solid ${HAIRLINE}` }}
        >
          <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: HAIRLINE }}>
            <div className="flex items-center gap-2">
              <ImageIcon size={15} style={{ color: TEXT_PRIMARY }} />
              <h3 className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: TEXT_PRIMARY }}>
                Vision Board Spotlight
              </h3>
            </div>
            <button
              onClick={() => setActiveTab("vision")}
              className="text-[10px] font-semibold flex items-center gap-1 transition-colors"
              style={{ color: TEXT_SECONDARY }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = TEXT_PRIMARY; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = TEXT_SECONDARY; }}
            >
              <span>View all</span>
              <ChevronRight size={11} />
            </button>
          </div>

          {visionItems.length === 0 ? (
            <div
              onClick={() => setActiveTab("vision")}
              className="border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors space-y-2"
              style={{ borderColor: HAIRLINE }}
            >
              <ImageIcon size={26} className="mx-auto" style={{ color: TEXT_TERTIARY }} />
              <div className="text-xs font-medium" style={{ color: TEXT_SECONDARY }}>Upload your dream visuals</div>
              <span
                className="inline-block px-3 py-1 rounded-lg text-[10px] font-semibold"
                style={{
                  backgroundColor: "rgba(255,255,255,0.06)",
                  color: TEXT_PRIMARY,
                }}
              >
                + Add vision image
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-hidden">
              {visionItems.slice(0, 2).map((item: any) => (
                <div key={item.id} className="relative rounded-2xl overflow-hidden h-36 group" style={{ border: `1px solid ${HAIRLINE}` }}>
                  <img src={resolveImageUrl(item.imageUrl)} alt={item.caption} onError={onImgError("/images/onboarding-hero.jpg")} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 60%)" }} />
                  <div className="absolute bottom-2 left-2 right-2 text-[10px] font-semibold truncate" style={{ color: TEXT_PRIMARY }}>
                    {item.caption || "Manifest Reality"}
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => setActiveTab("vision")}
            className="w-full py-2.5 rounded-xl font-semibold text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
            style={{
              backgroundColor: "rgba(255,255,255,0.04)",
              color: TEXT_PRIMARY,
              border: `1px solid ${HAIRLINE}`,
            }}
          >
            <span>Visualize Dream Life</span>
            <ArrowUpRight size={13} />
          </button>
        </div>

      </div>

      {/* BOTTOM MOTIVATION & TODAY'S PLAN ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">

        {/* Today's Plan Checklist */}
        <div
          className="lg:col-span-4 rounded-3xl p-5 space-y-3 flex flex-col justify-between"
          style={{ backgroundColor: SURFACE, border: `1px solid ${HAIRLINE}` }}
        >
          <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: HAIRLINE }}>
            <h3 className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: TEXT_PRIMARY }}>
              Today's Action Plan
            </h3>
            <button
              onClick={() => setShowAddPlanModal(true)}
              className="px-2.5 py-1 rounded-lg font-semibold text-[11px] flex items-center gap-1 transition-colors"
              style={{
                backgroundColor: "rgba(255,255,255,0.06)",
                color: TEXT_PRIMARY,
                border: `1px solid ${HAIRLINE}`,
              }}
            >
              <Plus size={11} /> Add
            </button>
          </div>

          <div className="space-y-2 text-xs">
            {(todayPlans || []).map((plan) => (
              <div
                key={plan.id}
                className="group/item flex items-center justify-between p-2.5 rounded-xl transition-colors"
                style={{
                  backgroundColor: "rgba(255,255,255,0.02)",
                  border: `1px solid ${HAIRLINE}`,
                }}
              >
                <div
                  onClick={() => toggleTodayPlan(plan.id, plan.done)}
                  className="flex items-center gap-3 cursor-pointer select-none flex-grow"
                  style={{
                    color: plan.done ? TEXT_SECONDARY : TEXT_PRIMARY,
                    textDecoration: plan.done ? "line-through" : "none",
                  }}
                >
                  <div
                    className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: plan.done ? TEXT_PRIMARY : "transparent",
                      border: `1px solid ${plan.done ? TEXT_PRIMARY : HAIRLINE}`,
                    }}
                  >
                    {plan.done && <Check size={12} strokeWidth={3} style={{ color: "#000" }} />}
                  </div>
                  <span>{plan.text}</span>
                </div>
                <button
                  onClick={() => handleDeletePlan && handleDeletePlan(plan.id)}
                  className="opacity-0 group-hover/item:opacity-100 p-1 transition"
                  style={{ color: TEXT_SECONDARY }}
                  title="Delete item"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Big Quote Box */}
        <div
          className="lg:col-span-4 rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden group"
          style={{ backgroundColor: SURFACE, border: `1px solid ${HAIRLINE}` }}
        >
          <div className="text-4xl font-serif" style={{ color: TEXT_TERTIARY }}>"</div>
          <div className="text-center space-y-3 my-auto">
            <h2
              className="text-2xl sm:text-3xl font-bold tracking-tight leading-tight italic"
              style={{ color: TEXT_PRIMARY }}
            >
              I'm building my future,<br />
              one habit at a time.
            </h2>
            <div className="text-base font-medium italic" style={{ color: TEXT_SECONDARY }}>
              Menifest OS
            </div>
          </div>
          <div className="text-right text-4xl font-serif" style={{ color: TEXT_TERTIARY }}>"</div>
        </div>

        {/* Note To Self */}
        <div
          className="lg:col-span-4 rounded-3xl p-6 flex flex-col justify-between"
          style={{ backgroundColor: SURFACE, border: `1px solid ${HAIRLINE}` }}
        >
          <div className="border-b pb-2" style={{ borderColor: HAIRLINE }}>
            <h3 className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: TEXT_SECONDARY }}>
              Note to Self
            </h3>
          </div>

          <div className="my-auto space-y-2">
            <p className="text-sm italic leading-relaxed" style={{ color: TEXT_PRIMARY }}>
              "{profile?.noteToSelf || "You're not behind. You're just getting started. Keep showing up."}"
            </p>
            <div className="text-xs font-semibold text-right" style={{ color: TEXT_SECONDARY }}>
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
            className="text-[10px] font-semibold uppercase tracking-widest text-left transition-colors"
            style={{ color: TEXT_SECONDARY }}
          >
            ✎ Edit note
          </button>
        </div>

      </div>

      {/* QUICK SAAS NAVIGATION BAR */}
      <div
        className="rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2"
        style={{ backgroundColor: SURFACE, border: `1px solid ${HAIRLINE}` }}
      >
        <span className="text-[11px] font-semibold uppercase tracking-wider px-2" style={{ color: TEXT_SECONDARY }}>
          Quick navigation
        </span>

        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {[
            { id: "dashboard", label: "Dashboard" },
            { id: "goals", label: "Goals & Habits" },
            { id: "journal", label: "Journal" },
            { id: "vision", label: "Vision Board" },
            { id: "streaks", label: "Solo Dominion" },
            { id: "profile", label: "Profile" },
          ].map((nav) => (
            <button
              key={nav.id}
              onClick={() => setActiveTab(nav.id)}
              className="px-3 py-1.5 rounded-full font-medium transition-colors"
              style={{
                backgroundColor: "rgba(255,255,255,0.04)",
                color: TEXT_PRIMARY,
                border: `1px solid ${HAIRLINE}`,
              }}
            >
              {nav.label}
            </button>
          ))}
        </div>
      </div>

      {/* FOOTER BANNER */}
      <div
        className="rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between text-center gap-2"
        style={{ backgroundColor: SURFACE, border: `1px solid ${HAIRLINE}` }}
      >
        <div className="flex items-center gap-2 font-semibold text-sm" style={{ color: TEXT_PRIMARY }}>
          <span className="text-base">Σ</span>
          <span className="tracking-widest">MENIFEST OS</span>
        </div>

        <div className="text-[10px] font-semibold tracking-[0.3em] uppercase" style={{ color: TEXT_SECONDARY }}>
          Silence · Discipline · Dominance
        </div>

        <div className="text-xs font-medium" style={{ color: TEXT_SECONDARY }}>
          100% Unstoppable
        </div>
      </div>

      {/* ADD TODAY'S PLAN MODAL */}
      {showAddPlanModal && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(20px)" }}
        >
          <div
            className="rounded-3xl p-6 w-full max-w-md space-y-4"
            style={{ backgroundColor: "#0a0a0a", border: `1px solid ${HAIRLINE}` }}
          >
            <div className="flex justify-between items-center border-b pb-3" style={{ borderColor: HAIRLINE }}>
              <h3 className="font-semibold text-base" style={{ color: TEXT_PRIMARY }}>Add today's plan</h3>
              <button onClick={() => setShowAddPlanModal(false)} className="transition-colors" style={{ color: TEXT_SECONDARY }}>
                <X size={18} />
              </button>
            </div>
            <input
              type="text"
              placeholder="e.g., Complete 2 chapters of mindset scripting..."
              value={newPlanText}
              onChange={(e) => setNewPlanText(e.target.value)}
              className="w-full rounded-2xl px-4 py-3 text-xs focus:outline-none transition-colors"
              style={{
                backgroundColor: "rgba(255,255,255,0.04)",
                border: `1px solid ${HAIRLINE}`,
                color: TEXT_PRIMARY,
              }}
            />
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowAddPlanModal(false)} className="px-4 py-2 rounded-xl text-xs font-medium transition-colors" style={{ color: TEXT_SECONDARY }}>
                Cancel
              </button>
              <button
                onClick={handleAddPlan}
                className="px-5 py-2 rounded-xl font-semibold text-xs transition-colors"
                style={{ backgroundColor: TEXT_PRIMARY, color: "#000" }}
              >
                Add task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD GOAL MODAL */}
      {showAddGoalModal && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(20px)" }}
        >
          <div
            className="rounded-3xl p-6 w-full max-w-md space-y-4"
            style={{ backgroundColor: "#0a0a0a", border: `1px solid ${HAIRLINE}` }}
          >
            <div className="flex justify-between items-center border-b pb-3" style={{ borderColor: HAIRLINE }}>
              <h3 className="font-semibold text-base" style={{ color: TEXT_PRIMARY }}>Create new goal</h3>
              <button onClick={() => setShowAddGoalModal(false)} className="transition-colors" style={{ color: TEXT_SECONDARY }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={async (e) => {
              if (handleCreateGoal) {
                await handleCreateGoal(e);
                setShowAddGoalModal(false);
              }
            }} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] uppercase font-semibold" style={{ color: TEXT_SECONDARY }}>Goal title</label>
                <input
                  type="text"
                  placeholder="e.g. $10k/mo Financial Freedom"
                  value={newGoalTitle}
                  onChange={(e) => setNewGoalTitle(e.target.value)}
                  className="w-full rounded-xl p-3 mt-1 focus:outline-none transition-colors"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.04)",
                    border: `1px solid ${HAIRLINE}`,
                    color: TEXT_PRIMARY,
                  }}
                  required
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-semibold" style={{ color: TEXT_SECONDARY }}>Category</label>
                <select
                  value={newGoalCategory}
                  onChange={(e) => setNewGoalCategory(e.target.value as any)}
                  className="w-full rounded-xl p-3 mt-1 focus:outline-none transition-colors"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.04)",
                    border: `1px solid ${HAIRLINE}`,
                    color: TEXT_PRIMARY,
                  }}
                >
                  <option value="wealth">Wealth & Abundance</option>
                  <option value="health">Health & Fitness</option>
                  <option value="mindset">Mindset & Discipline</option>
                  <option value="career">Career & Empire</option>
                  <option value="relationships">Relationships</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t" style={{ borderColor: HAIRLINE }}>
                <button type="button" onClick={() => setShowAddGoalModal(false)} className="px-4 py-2 font-medium" style={{ color: TEXT_SECONDARY }}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingGoal}
                  className="px-5 py-2 rounded-xl font-semibold transition-colors"
                  style={{ backgroundColor: TEXT_PRIMARY, color: "#000" }}
                >
                  {isCreatingGoal ? "Creating..." : "Save goal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== CUSTOMIZE FLOATING BUTTON ===================== */}
      <button
        onClick={() => setShowCustomizePanel(true)}
        className="fixed bottom-24 right-4 z-40 flex items-center gap-1.5 px-3.5 py-2.5 rounded-full active:scale-95 transition shadow-2xl"
        style={{
          backgroundColor: "rgba(10,10,10,0.95)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.18)",
          color: "#ffffff",
        }}
        aria-label="Customize dashboard"
      >
        <Settings2 size={14} />
        <span className="text-[11px] font-bold">Customize</span>
        {hiddenSections.length > 0 && (
          <span
            className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full"
            style={{ backgroundColor: "#0a84ff", color: "#fff" }}
          >
            {hiddenSections.length}
          </span>
        )}
      </button>

      {/* ===================== CUSTOMIZE PANEL MODAL ===================== */}
      {showCustomizePanel && (
        <div
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.75)" }}
          onClick={() => setShowCustomizePanel(false)}
        >
          <div
            className="w-full max-w-[420px] rounded-t-3xl sm:rounded-3xl p-5 max-h-[80vh] overflow-y-auto"
            style={{
              backgroundColor: "#0a0a0a",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2">
              <div
                className="text-[10px] font-bold tracking-widest uppercase"
                style={{ color: "rgba(235,235,245,0.32)" }}
              >
                Customize Dashboard
              </div>
              <button
                onClick={() => setShowCustomizePanel(false)}
                className="p-1 rounded-lg active:scale-90"
                style={{ color: "rgba(235,235,245,0.32)" }}
              >
                <X size={16} />
              </button>
            </div>
            <p
              className="text-[12px] mb-4"
              style={{ color: "rgba(235,235,245,0.62)" }}
            >
              Hide sections you don't need. Tap the eye icon to toggle.
            </p>

            <div className="space-y-2 mb-4">
              {TOGGLEABLE_SECTIONS.map((s) => {
                const hidden = isHidden(s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() => toggleSection(s.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left active:scale-[0.99] transition"
                    style={{
                      backgroundColor: hidden
                        ? "rgba(255,255,255,0.02)"
                        : "rgba(10,132,255,0.06)",
                      border: `1px solid ${
                        hidden
                          ? "rgba(255,255,255,0.06)"
                          : "rgba(10,132,255,0.18)"
                      }`,
                    }}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: hidden
                          ? "rgba(255,255,255,0.04)"
                          : "rgba(10,132,255,0.15)",
                        color: hidden
                          ? "rgba(235,235,245,0.32)"
                          : "#0a84ff",
                      }}
                    >
                      {hidden ? <EyeOff size={13} /> : <Eye size={13} />}
                    </div>
                    <span
                      className="flex-1 text-[12.5px] font-semibold"
                      style={{
                        color: hidden
                          ? "rgba(235,235,245,0.45)"
                          : "#ffffff",
                        textDecoration: hidden ? "line-through" : "none",
                      }}
                    >
                      {s.label}
                    </span>
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
                      style={{
                        backgroundColor: hidden
                          ? "rgba(255,255,255,0.05)"
                          : "rgba(52,199,89,0.15)",
                        color: hidden
                          ? "rgba(235,235,245,0.32)"
                          : "#34c759",
                      }}
                    >
                      {hidden ? "Hidden" : "Visible"}
                    </span>
                  </button>
                );
              })}
            </div>

            {hiddenSections.length > 0 && (
              <button
                onClick={restoreAll}
                className="w-full py-3 rounded-xl text-[12px] font-extrabold flex items-center justify-center gap-2 active:scale-95"
                style={{
                  backgroundColor: "#0a84ff",
                  color: "#fff",
                }}
              >
                <RotateCcw size={13} /> Restore all sections ({hiddenSections.length} hidden)
              </button>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default DashboardView;

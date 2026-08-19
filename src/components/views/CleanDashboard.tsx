import React, { useState, useEffect } from "react";
import { resolveImageUrl, onImgError } from "../../lib/imageHelper";
import {
  Flame, Trophy, CheckCircle, Check, ArrowUpRight, Plus,
  TrendingUp, Image as ImageIcon, Award, ChevronRight, Zap,
  Settings2, RotateCcw, Eye, EyeOff, Sparkles, X, Target
} from "lucide-react";

// iOS 17 + Solo Leveling ARISE design tokens (no neon)
const TEXT_PRIMARY = "#ffffff";
const TEXT_SECONDARY = "rgba(235,235,245,0.62)";
const TEXT_TERTIARY = "rgba(235,235,245,0.32)";
const SURFACE = "#0a0a0a";
const SURFACE_RAISED = "#141414";
const HAIRLINE = "rgba(255,255,255,0.08)";
const HAIRLINE_STRONG = "rgba(255,255,255,0.18)";
const ORANGE = "#ff9f0a";
const ORANGE_DARK = "#ff7a00";
const IOS_GREEN = "#34c759";
const IOS_RED = "#ff453a";

interface CleanDashboardProps {
  profile?: any;
  desires?: any[];
  rituals?: any[];
  journalEntries?: any[];
  quests?: any[];
  visionItems?: any[];
  coins?: number;
  currentRank?: string;
  setActiveTab?: (tab: any) => void;
  todayPlans?: any[];
  handleTogglePlan?: (...args: any[]) => void;
  handleAddPlan?: (...args: any[]) => void;
  handleDeletePlan?: (...args: any[]) => void;
  newGoalTitle?: string;
  setNewGoalTitle?: (...args: any[]) => void;
  newGoalCategory?: any;
  setNewGoalCategory?: (...args: any[]) => void;
  newGoalIcon?: string;
  setNewGoalIcon?: (...args: any[]) => void;
  isCreatingGoal?: boolean;
  handleCreateGoal?: (...args: any[]) => any;
  updateUserProfile?: (u: any) => Promise<void>;
  [k: string]: any;
}

const RANK_TIERS: Array<{ tier: string; name: string; min: number; color: string }> = [
  { tier: "TIER I", name: "SEEKER", min: 0, color: "#a78bfa" },
  { tier: "TIER II", name: "RISING HUNTER", min: 5, color: "#0a84ff" },
  { tier: "TIER III", name: "NATIONAL HUNTER", min: 20, color: "#34c759" },
  { tier: "TIER IV", name: "SHADOW MONARCH", min: 35, color: "#ff9f0a" },
  { tier: "TIER V", name: "LEGENDARY MONARCH", min: 50, color: "#ff453a" },
];

const ATTRIBUTES = [
  { key: "wisdom", label: "Wisdom", icon: "💡", color: "#a78bfa" },
  { key: "confidence", label: "Confidence", icon: "▲", color: IOS_GREEN },
  { key: "strength", label: "Strength", icon: "💪", color: IOS_RED },
  { key: "discipline", label: "Discipline", icon: "🔒", color: "#5e5ce6" },
  { key: "focus", label: "Focus", icon: "◎", color: "#0a84ff" },
];

function getRankInfo(level: number) {
  let info = RANK_TIERS[0];
  for (const t of RANK_TIERS) if (level >= t.min) info = t;
  return info;
}

const ATTR_TIPS: Record<string, string> = {
  wisdom: "Boosted by journaling, reading, and AI coach interactions.",
  confidence: "Grows when you complete public tasks and daily rituals.",
  strength: "Earned through Solo Dominion workouts and physical goals.",
  discipline: "Tracked by streak consistency and routine completions.",
  focus: "Increases with deep work sessions and Pomodoro completions.",
};

export const CleanDashboard: React.FC<CleanDashboardProps> = (props) => {
  const {
    profile, desires = [], journalEntries = [], visionItems = [],
    currentRank = "SEEKER", setActiveTab, todayPlans = [],
    handleTogglePlan, handleAddPlan, handleDeletePlan,
    updateUserProfile,
  } = props;

  const userName = profile?.name || "Hunter";
  const level = Number(profile?.level) || 1;
  const totalXp = Number(profile?.totalXp) || Number(profile?.xp) || 0;
  const xpInLevel = totalXp % 1000;
  const xpForNextLevel = 1000;
  const xpPct = Math.round((xpInLevel / xpForNextLevel) * 100);
  const streak = Number(profile?.streak) || 0;
  const rank = getRankInfo(level);

  // Stat values derived from XP
  const baseStat = Math.floor((totalXp + level * 50) / 12);

  // Local state
  const [showAddPlanModal, setShowAddPlanModal] = useState(false);
  const [newPlanText, setNewPlanText] = useState("");
  const [showCustomizePanel, setShowCustomizePanel] = useState(false);
  const [showHowRating, setShowHowRating] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  // Hidden sections
  const HIDDEN_KEY = "manifest_clean_dashboard_hidden_v1";
  const [hiddenSections, setHiddenSections] = useState<string[]>(() => {
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(HIDDEN_KEY) : null;
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });
  useEffect(() => {
    try {
      window.localStorage.setItem(HIDDEN_KEY, JSON.stringify(hiddenSections));
    } catch {}
  }, [hiddenSections]);

  const SECTIONS: { id: string; label: string }[] = [
    { id: "hero", label: "Header (welcome + rating card)" },
    { id: "stats-row", label: "Quick stats (streak, rank, coins)" },
    { id: "stats-bars", label: "Attribute bars (Wisdom → Focus)" },
    { id: "goals", label: "Active goals" },
    { id: "journal", label: "Recent journal entries" },
    { id: "vision", label: "Vision board preview" },
    { id: "today-plans", label: "Today's action plans" },
  ];
  const isHidden = (id: string) => hiddenSections.includes(id);
  const toggleSection = (id: string) =>
    setHiddenSections((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );

  // Toast auto-dismiss
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 2400);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const showToast = (msg: string, type: "ok" | "err" = "ok") =>
    setToast({ msg, type });

  const addPlan = () => {
    if (!newPlanText.trim()) return;
    if (handleAddPlan) handleAddPlan(newPlanText.trim());
    setNewPlanText("");
    setShowAddPlanModal(false);
    showToast("Plan added", "ok");
  };

  const today = new Date().toISOString().slice(0, 10);
  const completedPlans = todayPlans.filter((p: any) => p.completed).length;

  return (
    <div
      className="min-h-screen p-2 sm:p-4 md:p-6 space-y-4 sm:space-y-5 font-sans relative"
      style={{ backgroundColor: "#000", color: TEXT_PRIMARY }}
    >
      {/* ===================== ANIME BACKGROUND (subtle) ===================== */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: "url(/images/sd_jin_blue_eyes.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center 20%",
          backgroundRepeat: "no-repeat",
          opacity: 0.12,
        }}
      />
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.4) 30%, rgba(0,0,0,0.85) 100%)",
        }}
      />

      <div className="relative z-10 space-y-4 sm:space-y-5">
        {/* ===================== HERO + RATING CARD ===================== */}
        {!isHidden("hero") && (
          <section
            className="rounded-3xl p-6 sm:p-7 flex flex-col justify-between relative overflow-hidden"
            style={{
              backgroundColor: SURFACE,
              border: `1px solid ${HAIRLINE}`,
              minHeight: 280,
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: IOS_GREEN }}
                />
                <span
                  className="text-[10.5px] font-semibold tracking-widest uppercase"
                  style={{ color: TEXT_SECONDARY }}
                >
                  Manifest OS · Active
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
                <span style={{ color: TEXT_PRIMARY, fontWeight: 600 }}>Level {level}</span>
                <span style={{ color: TEXT_TERTIARY }}>·</span>
                <span style={{ color: rank.color, fontWeight: 600 }}>{rank.name}</span>
              </div>
            </div>

            <div>
              <h1
                className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[0.95]"
                style={{ color: TEXT_PRIMARY, letterSpacing: "-0.03em" }}
              >
                Welcome,<br />
                <span style={{ color: TEXT_PRIMARY }}>{userName}.</span>
              </h1>
              <p
                className="text-[11px] sm:text-xs font-medium tracking-[0.2em] mt-3 uppercase"
                style={{ color: TEXT_SECONDARY }}
              >
                Focus · Discipline · Consistency
              </p>
            </div>

            {/* Rating card (slanted orange level + XP earned + segmented bar) */}
            <div
              className="mt-6 rounded-2xl p-4 relative"
              style={{
                backgroundColor: "#000",
                border: `1px solid ${HAIRLINE}`,
                minHeight: 130,
              }}
            >
              <div className="flex items-center gap-4">
                {/* Slanted orange Level card */}
                <div
                  className="flex flex-col items-center justify-center shrink-0"
                  style={{
                    width: 80,
                    height: 80,
                    backgroundColor: ORANGE,
                    transform: "skewX(-8deg)",
                    borderRadius: 10,
                    boxShadow: "0 6px 18px rgba(255,159,10,0.3)",
                  }}
                >
                  <div
                    className="font-extrabold leading-none"
                    style={{
                      color: "#000",
                      fontSize: 32,
                      letterSpacing: "-0.04em",
                      transform: "skewX(8deg)",
                    }}
                  >
                    {level}
                  </div>
                  <div
                    className="text-[8px] font-extrabold tracking-widest uppercase mt-0.5"
                    style={{ color: "#000", transform: "skewX(8deg)" }}
                  >
                    Level
                  </div>
                </div>

                {/* Right text + XP */}
                <div className="flex-1 min-w-0">
                  <div className="text-right">
                    <div
                      className="font-extrabold leading-none"
                      style={{ color: TEXT_PRIMARY, fontSize: 22, letterSpacing: "-0.03em" }}
                    >
                      {xpInLevel}
                    </div>
                    <div
                      className="text-[10px] font-semibold mt-0.5"
                      style={{ color: TEXT_SECONDARY }}
                    >
                      XP earned
                    </div>
                  </div>
                </div>
              </div>

              {/* Segmented XP bar */}
              <div className="mt-3 flex items-center gap-0.5">
                {Array.from({ length: 28 }).map((_, i) => {
                  const filledCount = Math.round((xpPct / 100) * 28);
                  const isFilled = i < filledCount;
                  return (
                    <div
                      key={i}
                      className="h-1.5 flex-1 rounded-[1.5px]"
                      style={{
                        backgroundColor: isFilled
                          ? ORANGE
                          : "rgba(255,255,255,0.05)",
                      }}
                    />
                  );
                })}
              </div>
              <div
                className="text-[10px] mt-1.5"
                style={{ color: TEXT_SECONDARY }}
              >
                <span style={{ color: ORANGE, fontWeight: 700 }}>
                  {Math.max(0, xpForNextLevel - xpInLevel)} XP
                </span>{" "}
                to Lvl {level + 1}
              </div>
            </div>
          </section>
        )}

        {/* ===================== STATS ROW (Streak · Rank · Coins) ===================== */}
        {!isHidden("stats-row") && (
          <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Streak */}
            <div
              className="rounded-2xl p-4 flex items-center justify-between"
              style={{ backgroundColor: SURFACE, border: `1px solid ${HAIRLINE}` }}
            >
              <div className="space-y-1">
                <span
                  className="text-[10px] font-semibold uppercase tracking-widest"
                  style={{ color: TEXT_SECONDARY }}
                >
                  Current Streak
                </span>
                <div
                  className="text-3xl font-bold tracking-tight tabular-nums"
                  style={{ color: TEXT_PRIMARY }}
                >
                  {streak}
                </div>
                <div
                  className="text-[10px] font-medium"
                  style={{ color: TEXT_TERTIARY }}
                >
                  days in a row
                </div>
              </div>
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: "rgba(255,159,10,0.1)" }}
              >
                <Flame size={24} style={{ color: ORANGE }} />
              </div>
            </div>

            {/* Rank */}
            <div
              className="rounded-2xl p-4 flex items-center justify-between cursor-pointer active:scale-[0.99] transition"
              onClick={() => setActiveTab && setActiveTab("streaks")}
              style={{ backgroundColor: SURFACE, border: `1px solid ${HAIRLINE}` }}
            >
              <div className="space-y-1">
                <span
                  className="text-[10px] font-semibold uppercase tracking-widest"
                  style={{ color: TEXT_SECONDARY }}
                >
                  Hunter Rank
                </span>
                <div
                  className="text-2xl font-bold tracking-tight"
                  style={{ color: TEXT_PRIMARY }}
                >
                  {rank.name}
                </div>
                <div
                  className="text-[10px] font-medium"
                  style={{ color: rank.color }}
                >
                  {rank.tier}
                </div>
              </div>
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
              >
                <Trophy size={22} style={{ color: TEXT_PRIMARY }} />
              </div>
            </div>

            {/* Coins */}
            <div
              className="rounded-2xl p-4 flex items-center justify-between"
              style={{ backgroundColor: SURFACE, border: `1px solid ${HAIRLINE}` }}
            >
              <div className="space-y-1">
                <span
                  className="text-[10px] font-semibold uppercase tracking-widest"
                  style={{ color: TEXT_SECONDARY }}
                >
                  Coins
                </span>
                <div
                  className="text-3xl font-bold tracking-tight tabular-nums"
                  style={{ color: ORANGE }}
                >
                  {(Number(profile?.coins) || 0).toLocaleString()}
                </div>
                <div
                  className="text-[10px] font-medium"
                  style={{ color: TEXT_TERTIARY }}
                >
                  XP earned
                </div>
              </div>
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: "rgba(255,159,10,0.1)" }}
              >
                <span style={{ fontSize: 20, fontWeight: 800, color: ORANGE }}>XP</span>
              </div>
            </div>
          </section>
        )}

        {/* ===================== ATTRIBUTE BARS (Wisdom → Focus) ===================== */}
        {!isHidden("stats-bars") && (
          <section
            className="rounded-3xl p-5"
            style={{ backgroundColor: SURFACE, border: `1px solid ${HAIRLINE}` }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3
                className="text-[11px] font-semibold uppercase tracking-widest"
                style={{ color: TEXT_PRIMARY }}
              >
                Character Stats
              </h3>
              <button
                onClick={() => setShowHowRating(true)}
                className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
                style={{
                  backgroundColor: "rgba(255,255,255,0.04)",
                  color: TEXT_SECONDARY,
                  border: `1px solid ${HAIRLINE}`,
                }}
              >
                ? How it works
              </button>
            </div>
            <div className="space-y-3">
              {ATTRIBUTES.map((attr) => {
                const val = baseStat + (profile?.[attr.key] || 0);
                return (
                  <div key={attr.key} className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-base"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.04)",
                        border: `1px solid ${HAIRLINE}`,
                        color: attr.color,
                      }}
                    >
                      {attr.icon}
                    </div>
                    <div className="flex-1">
                      <div
                        className="text-[12px] font-semibold mb-1"
                        style={{ color: TEXT_PRIMARY }}
                      >
                        {attr.label}
                      </div>
                      <div
                        className="h-1.5 rounded-full overflow-hidden"
                        style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(100, val % 100)}%`,
                            background: `linear-gradient(90deg, ${attr.color}88, ${attr.color})`,
                          }}
                        />
                      </div>
                    </div>
                    <span
                      className="text-[15px] font-extrabold tabular-nums w-10 text-right"
                      style={{ color: TEXT_PRIMARY }}
                    >
                      {val}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ===================== ACTIVE GOALS ===================== */}
        {!isHidden("goals") && (
          <section
            className="rounded-3xl p-5"
            style={{ backgroundColor: SURFACE, border: `1px solid ${HAIRLINE}` }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3
                className="text-[11px] font-semibold uppercase tracking-widest"
                style={{ color: TEXT_PRIMARY }}
              >
                Active Goals
              </h3>
              <button
                onClick={() => setActiveTab && setActiveTab("goals")}
                className="text-[10px] font-bold flex items-center gap-1"
                style={{ color: ORANGE }}
              >
                View all <ChevronRight size={11} />
              </button>
            </div>
            {desires.length === 0 ? (
              <button
                onClick={() => setActiveTab && setActiveTab("goals")}
                className="w-full py-8 rounded-2xl flex flex-col items-center gap-2"
                style={{
                  border: `1px dashed ${HAIRLINE_STRONG}`,
                  color: TEXT_TERTIARY,
                }}
              >
                <Target size={24} style={{ color: TEXT_TERTIARY }} />
                <span className="text-[12px] font-semibold">No goals yet</span>
                <span className="text-[10px]">Tap to create your first goal</span>
              </button>
            ) : (
              <div className="space-y-2">
                {desires.slice(0, 3).map((g: any) => {
                  const pct = g.progress || 0;
                  return (
                    <div
                      key={g.id}
                      className="flex items-center gap-3 p-2.5 rounded-xl"
                      style={{ backgroundColor: "rgba(255,255,255,0.02)" }}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-base"
                        style={{
                          backgroundColor: "rgba(255,255,255,0.04)",
                          border: `1px solid ${HAIRLINE}`,
                        }}
                      >
                        {g.icon || "🎯"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className="text-[12.5px] font-semibold truncate"
                          style={{ color: TEXT_PRIMARY }}
                        >
                          {g.title}
                        </div>
                        <div
                          className="mt-1 h-1 rounded-full overflow-hidden"
                          style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                        >
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min(100, pct)}%`,
                              background: `linear-gradient(90deg, ${ORANGE_DARK}, ${ORANGE})`,
                            }}
                          />
                        </div>
                      </div>
                      <span
                        className="text-[11px] font-bold tabular-nums"
                        style={{ color: ORANGE }}
                      >
                        {pct}%
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ===================== TODAY'S PLANS ===================== */}
        {!isHidden("today-plans") && (
          <section
            className="rounded-3xl p-5"
            style={{ backgroundColor: SURFACE, border: `1px solid ${HAIRLINE}` }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3
                className="text-[11px] font-semibold uppercase tracking-widest"
                style={{ color: TEXT_PRIMARY }}
              >
                Today's Action Plans
              </h3>
              <div className="flex items-center gap-2">
                <span
                  className="text-[10px] font-bold tabular-nums"
                  style={{ color: ORANGE }}
                >
                  {completedPlans}/{todayPlans.length}
                </span>
                <button
                  onClick={() => setShowAddPlanModal(true)}
                  className="w-7 h-7 rounded-full flex items-center justify-center active:scale-90"
                  style={{ backgroundColor: ORANGE, color: "#000" }}
                >
                  <Plus size={14} strokeWidth={2.5} />
                </button>
              </div>
            </div>
            {todayPlans.length === 0 ? (
              <button
                onClick={() => setShowAddPlanModal(true)}
                className="w-full py-6 rounded-2xl flex flex-col items-center gap-1.5"
                style={{
                  border: `1px dashed ${HAIRLINE_STRONG}`,
                  color: TEXT_TERTIARY,
                }}
              >
                <Zap size={20} style={{ color: ORANGE }} />
                <span className="text-[12px] font-semibold" style={{ color: TEXT_SECONDARY }}>
                  Add today's plan
                </span>
              </button>
            ) : (
              <div className="space-y-2">
                {todayPlans.map((p: any) => (
                  <button
                    key={p.id}
                    onClick={() => handleTogglePlan && handleTogglePlan(p.id, p.completed)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left active:scale-[0.99]"
                    style={{
                      backgroundColor: p.completed
                        ? "rgba(52,199,89,0.08)"
                        : "rgba(255,255,255,0.02)",
                      border: `1px solid ${
                        p.completed ? "rgba(52,199,89,0.18)" : HAIRLINE
                      }`,
                    }}
                  >
                    <div
                      className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: p.completed ? IOS_GREEN : "transparent",
                        border: `1.5px solid ${p.completed ? IOS_GREEN : HAIRLINE_STRONG}`,
                      }}
                    >
                      {p.completed && <Check size={12} strokeWidth={3} color="#fff" />}
                    </div>
                    <span
                      className="flex-1 text-[12.5px] font-medium"
                      style={{
                        color: p.completed ? TEXT_TERTIARY : TEXT_PRIMARY,
                        textDecoration: p.completed ? "line-through" : "none",
                      }}
                    >
                      {p.text}
                    </span>
                    {handleDeletePlan && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePlan(p.id);
                          showToast("Plan removed", "ok");
                        }}
                        className="p-1 rounded active:scale-90"
                        style={{ color: TEXT_TERTIARY }}
                      >
                        <X size={12} />
                      </button>
                    )}
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ===================== RECENT JOURNAL ===================== */}
        {!isHidden("journal") && (
          <section
            className="rounded-3xl p-5"
            style={{ backgroundColor: SURFACE, border: `1px solid ${HAIRLINE}` }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3
                className="text-[11px] font-semibold uppercase tracking-widest"
                style={{ color: TEXT_PRIMARY }}
              >
                Recent Journal
              </h3>
              <button
                onClick={() => setActiveTab && setActiveTab("journal")}
                className="text-[10px] font-bold flex items-center gap-1"
                style={{ color: ORANGE }}
              >
                Open <ChevronRight size={11} />
              </button>
            </div>
            {journalEntries.length === 0 ? (
              <div
                className="py-6 text-center text-[12px]"
                style={{ color: TEXT_TERTIARY }}
              >
                No journal entries yet
              </div>
            ) : (
              <div className="space-y-2">
                {journalEntries.slice(0, 2).map((e: any) => (
                  <div
                    key={e.id}
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: "rgba(255,255,255,0.02)" }}
                  >
                    <div
                      className="text-[10px] mb-1"
                      style={{ color: TEXT_TERTIARY }}
                    >
                      {new Date(e.date || Date.now()).toLocaleDateString()}
                    </div>
                    <p
                      className="text-[12.5px] line-clamp-2"
                      style={{ color: TEXT_PRIMARY }}
                    >
                      {e.text || e.content || ""}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ===================== VISION BOARD PREVIEW ===================== */}
        {!isHidden("vision") && visionItems.length > 0 && (
          <section
            className="rounded-3xl p-5"
            style={{ backgroundColor: SURFACE, border: `1px solid ${HAIRLINE}` }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3
                className="text-[11px] font-semibold uppercase tracking-widest"
                style={{ color: TEXT_PRIMARY }}
              >
                Vision Board
              </h3>
              <button
                onClick={() => setActiveTab && setActiveTab("vision")}
                className="text-[10px] font-bold flex items-center gap-1"
                style={{ color: ORANGE }}
              >
                Open <ChevronRight size={11} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {visionItems.slice(0, 6).map((v: any) => (
                <div
                  key={v.id}
                  className="aspect-square rounded-xl overflow-hidden"
                  style={{
                    backgroundImage: `url(${resolveImageUrl(v.url || v.imageUrl)})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    border: `1px solid ${HAIRLINE}`,
                  }}
                />
              ))}
            </div>
          </section>
        )}
      </div>

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

      {/* ===================== CUSTOMIZE MODAL ===================== */}
      {showCustomizePanel && (
        <div
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.75)" }}
          onClick={() => setShowCustomizePanel(false)}
        >
          <div
            className="w-full max-w-[420px] rounded-t-3xl sm:rounded-3xl p-5 max-h-[80vh] overflow-y-auto"
            style={{ backgroundColor: SURFACE, border: `1px solid ${HAIRLINE}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className="text-[10px] font-bold tracking-widest uppercase"
                style={{ color: TEXT_TERTIARY }}
              >
                Customize Dashboard
              </div>
              <button
                onClick={() => setShowCustomizePanel(false)}
                className="p-1 rounded-lg"
                style={{ color: TEXT_TERTIARY }}
              >
                <X size={16} />
              </button>
            </div>
            <p
              className="text-[12px] mb-4"
              style={{ color: TEXT_SECONDARY }}
            >
              Hide sections you don't need.
            </p>
            <div className="space-y-2 mb-4">
              {SECTIONS.map((s) => {
                const hidden = isHidden(s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() => toggleSection(s.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left active:scale-[0.99]"
                    style={{
                      backgroundColor: hidden
                        ? "rgba(255,255,255,0.02)"
                        : "rgba(10,132,255,0.06)",
                      border: `1px solid ${
                        hidden ? HAIRLINE : "rgba(10,132,255,0.18)"
                      }`,
                    }}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: hidden
                          ? "rgba(255,255,255,0.04)"
                          : "rgba(10,132,255,0.15)",
                        color: hidden ? TEXT_TERTIARY : "#0a84ff",
                      }}
                    >
                      {hidden ? <EyeOff size={13} /> : <Eye size={13} />}
                    </div>
                    <span
                      className="flex-1 text-[12.5px] font-semibold"
                      style={{
                        color: hidden ? TEXT_TERTIARY : TEXT_PRIMARY,
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
                        color: hidden ? TEXT_TERTIARY : IOS_GREEN,
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
                onClick={() => setHiddenSections([])}
                className="w-full py-3 rounded-xl text-[12px] font-extrabold flex items-center justify-center gap-2 active:scale-95"
                style={{ backgroundColor: "#0a84ff", color: "#fff" }}
              >
                <RotateCcw size={13} /> Restore all ({hiddenSections.length})
              </button>
            )}
          </div>
        </div>
      )}

      {/* ===================== HOW RATING WORKS MODAL ===================== */}
      {showHowRating && (
        <div
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.75)" }}
          onClick={() => setShowHowRating(false)}
        >
          <div
            className="w-full max-w-[420px] rounded-t-3xl sm:rounded-3xl p-5 max-h-[80vh] overflow-y-auto"
            style={{ backgroundColor: SURFACE, border: `1px solid ${HAIRLINE}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className="text-[10px] font-bold tracking-widest uppercase"
                style={{ color: TEXT_TERTIARY }}
              >
                How Rating Works
              </div>
              <button
                onClick={() => setShowHowRating(false)}
                className="p-1 rounded-lg"
                style={{ color: TEXT_TERTIARY }}
              >
                <X size={16} />
              </button>
            </div>
            <h2
              className="font-extrabold text-xl mb-3"
              style={{ color: TEXT_PRIMARY }}
            >
              Your Current Rating
            </h2>
            <p
              className="text-[12.5px] mb-4"
              style={{ color: TEXT_SECONDARY }}
            >
              Every action in the system awards XP. As you earn XP, you level up
              and unlock higher Hunter Ranks.
            </p>
            <div className="space-y-3">
              {RANK_TIERS.map((r) => (
                <div
                  key={r.name}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{
                    backgroundColor: level >= r.min
                      ? "rgba(255,159,10,0.08)"
                      : "rgba(255,255,255,0.02)",
                    border: `1px solid ${
                      level >= r.min ? "rgba(255,159,10,0.2)" : HAIRLINE
                    }`,
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center font-extrabold"
                    style={{
                      backgroundColor: level >= r.min ? r.color : "rgba(255,255,255,0.04)",
                      color: level >= r.min ? "#000" : TEXT_TERTIARY,
                      fontSize: 11,
                    }}
                  >
                    {r.tier.split(" ")[1]}
                  </div>
                  <div className="flex-1">
                    <div
                      className="text-[12.5px] font-bold"
                      style={{ color: TEXT_PRIMARY }}
                    >
                      {r.name}
                    </div>
                    <div
                      className="text-[10px]"
                      style={{ color: TEXT_TERTIARY }}
                    >
                      Level {r.min}+
                    </div>
                  </div>
                  {level >= r.min && (
                    <Check size={14} style={{ color: IOS_GREEN }} />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-5 space-y-2">
              <h3
                className="text-[10px] font-bold tracking-widest uppercase"
                style={{ color: TEXT_TERTIARY }}
              >
                How each stat grows
              </h3>
              {ATTRIBUTES.map((a) => (
                <div
                  key={a.key}
                  className="flex items-start gap-2.5 p-2.5 rounded-xl"
                  style={{ backgroundColor: "rgba(255,255,255,0.02)" }}
                >
                  <span
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-sm"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.04)",
                      color: a.color,
                    }}
                  >
                    {a.icon}
                  </span>
                  <div className="flex-1">
                    <div
                      className="text-[12px] font-bold"
                      style={{ color: TEXT_PRIMARY }}
                    >
                      {a.label}
                    </div>
                    <p
                      className="text-[10.5px] mt-0.5"
                      style={{ color: TEXT_TERTIARY }}
                    >
                      {ATTR_TIPS[a.key]}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===================== ADD PLAN MODAL ===================== */}
      {showAddPlanModal && (
        <div
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.75)" }}
          onClick={() => setShowAddPlanModal(false)}
        >
          <div
            className="w-full max-w-[420px] rounded-t-3xl sm:rounded-3xl p-5"
            style={{ backgroundColor: SURFACE, border: `1px solid ${HAIRLINE}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="text-[10px] font-bold tracking-widest uppercase mb-2"
              style={{ color: TEXT_TERTIARY }}
            >
              Add Today's Plan
            </div>
            <input
              type="text"
              value={newPlanText}
              onChange={(e) => setNewPlanText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addPlan()}
              maxLength={80}
              className="w-full px-3 py-2.5 rounded-xl text-[14px] outline-none"
              style={{
                backgroundColor: "#000",
                border: `1px solid ${HAIRLINE}`,
                color: TEXT_PRIMARY,
                fontFamily: "inherit",
              }}
              placeholder="e.g., 30 min deep work"
              autoFocus
            />
            <div
              className="text-[10px] text-right mt-1 mb-3"
              style={{ color: TEXT_TERTIARY }}
            >
              {newPlanText.length}/80
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddPlanModal(false)}
                className="flex-1 py-3 rounded-xl font-bold text-[13px]"
                style={{
                  backgroundColor: SURFACE,
                  border: `1px solid ${HAIRLINE}`,
                  color: TEXT_PRIMARY,
                }}
              >
                Cancel
              </button>
              <button
                onClick={addPlan}
                className="flex-1 py-3 rounded-xl font-extrabold text-[13px]"
                style={{ backgroundColor: ORANGE, color: "#000" }}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TOAST ===================== */}
      {toast && (
        <div
          className="fixed left-1/2 -translate-x-1/2 z-[300] px-4 py-2.5 rounded-2xl text-[12px] font-bold flex items-center gap-2"
          style={{
            bottom: "calc(env(safe-area-inset-bottom, 0px) + 90px)",
            backgroundColor:
              toast.type === "ok" ? "rgba(52,199,89,0.95)" : "rgba(255,69,58,0.95)",
            color: "#fff",
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            minWidth: 200,
          }}
        >
          {toast.type === "ok" ? <Check size={14} /> : <X size={14} />}
          {toast.msg}
        </div>
      )}
    </div>
  );
};

export default CleanDashboard;

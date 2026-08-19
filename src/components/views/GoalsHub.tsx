import React, { useState } from "react";
import { resolveImageUrl } from "../../lib/imageHelper";
import {
  Plus, Target, Trophy, Flame, X, Check, Sparkles, Edit3, Trash2
} from "lucide-react";

// Design tokens (matches Solo Dominion style)
const TEXT_PRIMARY = "#ffffff";
const TEXT_SECONDARY = "rgba(235,235,245,0.62)";
const TEXT_TERTIARY = "rgba(235,235,245,0.32)";
const SURFACE = "#0a0a0a";
const HAIRLINE = "rgba(255,255,255,0.08)";
const HAIRLINE_STRONG = "rgba(255,255,255,0.18)";
const ORANGE = "#ff9f0a";
const ORANGE_DARK = "#ff7a00";
const IOS_GREEN = "#34c759";
const IOS_RED = "#ff453a";

export interface GoalItem {
  id: string;
  title: string;
  description: string;
  rank: "E" | "D" | "C" | "B" | "A";
  xp: number;
  progress: number;
  image: string;
  jpLabel: string;
  icon: string;
  category?: string;
  deadline?: string;
  totalMilestones?: number;
  completedMilestones?: number;
}

const FALLBACK_GOALS: GoalItem[] = [
  {
    id: "g1",
    title: "Dream House",
    description: "Save and build the home of your dreams. 3-year plan with monthly milestones.",
    rank: "B",
    xp: 300,
    progress: 60,
    image: "/images/goal_house.jpg",
    jpLabel: "理想の家",
    icon: "🏠",
    category: "Lifestyle",
    deadline: "31 Dec 2027",
    totalMilestones: 12,
    completedMilestones: 7,
  },
  {
    id: "g2",
    title: "6 Pack in 6 Months",
    description: "Build your dream body. Daily workouts + strict nutrition tracking.",
    rank: "C",
    xp: 250,
    progress: 45,
    image: "/images/goal_jinwoo.jpg",
    jpLabel: "肉体改造",
    icon: "💪",
    category: "Health",
    deadline: "30 Nov 2025",
    totalMilestones: 8,
    completedMilestones: 3,
  },
  {
    id: "g3",
    title: "Launch a SaaS",
    description: "Build and ship your software product. MVP, beta, public launch in 90 days.",
    rank: "A",
    xp: 500,
    progress: 25,
    image: "/images/goal_jinwoo.jpg",
    jpLabel: "起業",
    icon: "🚀",
    category: "Career",
    deadline: "15 Jan 2026",
    totalMilestones: 10,
    completedMilestones: 2,
  },
  {
    id: "g4",
    title: "Financial Freedom",
    description: "Build wealth through smart investments. Index funds + side income streams.",
    rank: "A",
    xp: 450,
    progress: 50,
    image: "/images/goal_house.jpg",
    jpLabel: "経済的自由",
    icon: "💰",
    category: "Wealth",
    deadline: "31 Dec 2026",
    totalMilestones: 15,
    completedMilestones: 7,
  },
  {
    id: "g5",
    title: "Read 50 Books",
    description: "Read 50 high-value books this year. One book every 7 days, no skipping.",
    rank: "C",
    xp: 200,
    progress: 70,
    image: "/images/goal_jinwoo.jpg",
    jpLabel: "読書",
    icon: "📚",
    category: "Knowledge",
    deadline: "31 Dec 2025",
    totalMilestones: 50,
    completedMilestones: 35,
  },
  {
    id: "g6",
    title: "Learn Japanese",
    description: "Master conversational Japanese. Daily Anki + weekly tutor sessions.",
    rank: "B",
    xp: 350,
    progress: 30,
    image: "/images/goal_house.jpg",
    jpLabel: "日本語",
    icon: "🗾",
    category: "Knowledge",
    deadline: "30 Jun 2026",
    totalMilestones: 20,
    completedMilestones: 6,
  },
];

interface GoalsHubProps {
  playerName?: string;
  goals?: GoalItem[];
  onCreateGoal?: () => void;
  onGoalClick?: (goal: GoalItem) => void;
  onBack?: () => void;
  onEditGoal?: (goal: GoalItem) => void;
  onDeleteGoal?: (goal: GoalItem) => void;
  [k: string]: any;
}

export const GoalsHub: React.FC<GoalsHubProps> = ({
  playerName = "Hunter",
  goals = FALLBACK_GOALS,
  onCreateGoal,
  onGoalClick,
  onEditGoal,
  onDeleteGoal,
}) => {
  const [hovered, setHovered] = useState<string | null>(null);

  // Stats
  const activeCount = goals.length;
  const totalXp = goals.reduce((sum, g) => sum + Math.round((g.xp * g.progress) / 100), 0);
  const avgProgress = goals.length > 0
    ? Math.round(goals.reduce((s, g) => s + g.progress, 0) / goals.length)
    : 0;

  return (
    <div
      className="relative w-full"
      style={{ backgroundColor: "#000", minHeight: "100vh" }}
    >
      {/* ===================== HERO SECTION ===================== */}
      <section
        className="relative w-full"
        style={{ minHeight: "min(420px, 55vh)" }}
      >
        {/* Jinwoo background image */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "url(/images/goal_jinwoo.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center 20%",
            backgroundRepeat: "no-repeat",
            opacity: 0.4,
          }}
        />
        {/* Dark gradient overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.3) 35%, rgba(0,0,0,0.85) 100%)",
          }}
        />

        {/* Top status bar */}
        <div
          className="relative z-10 flex items-center justify-between px-5 pt-6 text-[11px] font-semibold tracking-wider"
          style={{ color: TEXT_TERTIARY }}
        >
          <span>HUNTER · GOALS</span>
          <span style={{ color: ORANGE }}>● {activeCount} ACTIVE</span>
        </div>

        {/* Center content */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-10 pb-6">
          {/* Target icon */}
          <div
            className="mb-5 flex items-center justify-center"
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              border: `1px solid ${HAIRLINE_STRONG}`,
              backgroundColor: SURFACE,
            }}
          >
            <Target size={24} strokeWidth={1.8} style={{ color: ORANGE }} />
          </div>

          {/* Main heading */}
          <h1
            className="font-extrabold leading-[1.05] tracking-tight"
            style={{
              color: TEXT_PRIMARY,
              fontSize: "clamp(1.75rem, 5vw, 2.75rem)",
              letterSpacing: "-0.02em",
              maxWidth: "640px",
            }}
          >
            Build your <span style={{ color: ORANGE }}>dream life</span>.
          </h1>

          {/* Subtitle */}
          <p
            className="mt-3 text-[14px] leading-relaxed"
            style={{ color: TEXT_SECONDARY, maxWidth: "400px" }}
          >
            Forge your <span style={{ color: TEXT_PRIMARY, fontWeight: 600 }}>future identity</span>.
            Set goals, complete milestones, claim XP, ascend the ranks.
          </p>
        </div>
      </section>

      {/* ===================== STATS STRIP ===================== */}
      <section className="px-5 pt-2 pb-4">
        <div
          className="grid grid-cols-3 gap-px overflow-hidden rounded-2xl"
          style={{ backgroundColor: HAIRLINE, border: `1px solid ${HAIRLINE}` }}
        >
          {[
            { label: "Active", val: activeCount.toString(), icon: "◆", color: ORANGE },
            { label: "Earned", val: totalXp.toLocaleString(), icon: "XP", color: IOS_GREEN },
            { label: "Progress", val: `${avgProgress}%`, icon: "▲", color: ORANGE },
          ].map((s) => (
            <div
              key={s.label}
              className="flex flex-col items-center py-3.5"
              style={{ backgroundColor: "#000" }}
            >
              <div className="flex items-center gap-1">
                <span style={{ color: s.color, fontSize: 9, fontWeight: 700 }}>
                  {s.icon}
                </span>
                <span
                  className="text-[17px] font-extrabold tabular-nums"
                  style={{ color: TEXT_PRIMARY, letterSpacing: "-0.02em" }}
                >
                  {s.val}
                </span>
              </div>
              <span
                className="text-[9px] uppercase tracking-wider mt-0.5"
                style={{ color: TEXT_TERTIARY }}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ===================== GOAL CARDS ===================== */}
      <section className="px-4 pt-3 pb-24">
        <div className="flex items-end justify-between mb-3 px-1">
          <h2
            className="text-[20px] font-extrabold tracking-tight"
            style={{ color: TEXT_PRIMARY, letterSpacing: "-0.01em" }}
          >
            Your Goals
          </h2>
          <span
            className="text-[11px] uppercase tracking-wider"
            style={{ color: TEXT_TERTIARY }}
          >
            Tap to enter →
          </span>
        </div>

        <div className="space-y-3">
          {goals.map((goal) => {
            const isHovered = hovered === goal.id;
            const earnedXp = Math.round((goal.xp * goal.progress) / 100);
            const filledBars = Math.round((goal.progress / 100) * 28);

            return (
              <div
                key={goal.id}
                onMouseEnter={() => setHovered(goal.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => onGoalClick?.(goal)}
                className="relative flex items-stretch gap-3 rounded-2xl p-3 cursor-pointer transition active:scale-[0.99]"
                style={{
                  backgroundColor: SURFACE,
                  border: `1px solid ${isHovered ? HAIRLINE_STRONG : HAIRLINE}`,
                }}
              >
                {/* Left: Goal image + rank badge */}
                <div
                  className="relative shrink-0 rounded-xl overflow-hidden"
                  style={{ width: 84, height: 100 }}
                >
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage: `url(${resolveImageUrl(goal.image)})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(180deg, rgba(0,0,0,0.0) 40%, rgba(0,0,0,0.7) 100%)",
                    }}
                  />
                  {/* Rank badge bottom-left */}
                  <div
                    className="absolute bottom-1.5 left-1.5 flex items-center justify-center font-extrabold text-[12px]"
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      backgroundColor: ORANGE,
                      color: "#000",
                    }}
                  >
                    {goal.rank}
                  </div>
                </div>

                {/* Middle: JP label + title + desc + progress */}
                <div className="flex-1 min-w-0 py-1">
                  <div
                    className="text-[9px] font-semibold tracking-widest mb-1 uppercase"
                    style={{ color: TEXT_TERTIARY }}
                  >
                    {goal.jpLabel}
                  </div>
                  <h3
                    className="text-[15px] font-extrabold tracking-tight leading-tight"
                    style={{ color: TEXT_PRIMARY, letterSpacing: "-0.005em" }}
                  >
                    {goal.icon} {goal.title}
                  </h3>
                  <p
                    className="text-[11px] mt-1 leading-snug line-clamp-2"
                    style={{ color: TEXT_SECONDARY }}
                  >
                    {goal.description}
                  </p>

                  {/* Segmented progress bar */}
                  <div className="mt-2 flex items-center gap-0.5">
                    {Array.from({ length: 28 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-1 flex-1 rounded-[1px]"
                        style={{
                          backgroundColor:
                            i < filledBars ? ORANGE : "rgba(255,255,255,0.05)",
                        }}
                      />
                    ))}
                  </div>
                  <div
                    className="flex items-center justify-between mt-1.5"
                  >
                    <span
                      className="text-[10px] font-bold"
                      style={{ color: ORANGE }}
                    >
                      {goal.progress}%
                    </span>
                    {goal.completedMilestones !== undefined && goal.totalMilestones !== undefined && (
                      <span
                        className="text-[10px] font-medium"
                        style={{ color: TEXT_TERTIARY }}
                      >
                        {goal.completedMilestones}/{goal.totalMilestones} milestones
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: XP earned + arrow */}
                <div className="flex flex-col items-end justify-center shrink-0 pl-1">
                  <span
                    className="text-[9px] font-bold tracking-wider uppercase"
                    style={{ color: TEXT_TERTIARY }}
                  >
                    Earned
                  </span>
                  <span
                    className="font-extrabold leading-none tabular-nums"
                    style={{
                      color: ORANGE,
                      fontSize: 20,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    +{earnedXp}
                  </span>
                  <span
                    className="text-[9px] mt-0.5 font-bold tracking-wider uppercase"
                    style={{ color: TEXT_TERTIARY }}
                  >
                    /{goal.xp} XP
                  </span>
                  <span
                    className="mt-1.5 text-[14px]"
                    style={{ color: TEXT_TERTIARY }}
                  >
                    →
                  </span>
                </div>

                {/* Action buttons (edit/delete) — top right corner */}
                <div className="absolute top-2 right-2 flex items-center gap-1">
                  {onEditGoal && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditGoal(goal);
                      }}
                      className="p-1 rounded active:scale-90"
                      style={{
                        backgroundColor: "rgba(0,0,0,0.5)",
                        color: TEXT_SECONDARY,
                      }}
                      aria-label="Edit goal"
                    >
                      <Edit3 size={11} />
                    </button>
                  )}
                  {onDeleteGoal && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Delete "${goal.title}"?`)) {
                          onDeleteGoal(goal);
                        }
                      }}
                      className="p-1 rounded active:scale-90"
                      style={{
                        backgroundColor: "rgba(0,0,0,0.5)",
                        color: IOS_RED,
                      }}
                      aria-label="Delete goal"
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ===================== STICKY CREATE BUTTON ===================== */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 px-5 pb-6 pt-4"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.85) 30%, rgba(0,0,0,1) 100%)",
        }}
      >
        <button
          onClick={onCreateGoal}
          className="w-full max-w-[420px] mx-auto flex items-center justify-center gap-2 font-extrabold text-[15px] py-3.5 rounded-2xl transition-transform active:scale-[0.98]"
          style={{
            backgroundColor: ORANGE,
            color: "#000",
            boxShadow: "0 8px 24px rgba(255,159,10,0.25)",
          }}
        >
          <Plus size={18} strokeWidth={2.5} />
          <span>Create New Goal</span>
        </button>
      </div>
    </div>
  );
};

export default GoalsHub;

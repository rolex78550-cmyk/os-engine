import React, { useState, useEffect } from "react";

const TEXT_PRIMARY = "#ffffff";
const TEXT_SECONDARY = "rgba(235,235,245,0.62)";
const TEXT_TERTIARY = "rgba(235,235,245,0.32)";
const SURFACE = "#0a0a0a";
const HAIRLINE = "rgba(255,255,255,0.08)";
const HAIRLINE_STRONG = "rgba(255,255,255,0.18)";
const ORANGE = "#ff9f0a";
const IOS_GREEN = "#34c759";

export type TaskId =
  | "pushup"
  | "plank"
  | "squat"
  | "sprint"
  | "writing"
  | "water"
  | "affirmation"
  | "gratitude"
  | "script369";

export interface TaskDef {
  id: TaskId;
  title: string;
  unit: string;
  xpPerUnit: number;
  defaultGoal: number;
  icon: string;
  image: string;
  jpLabel: string;
  description: string;
  rank: "E" | "D" | "C" | "B";
}

export const TASKS: TaskDef[] = [
  {
    id: "pushup",
    title: "Push-ups",
    unit: "reps",
    xpPerUnit: 2,
    defaultGoal: 50,
    icon: "💪",
    image: "/images/anime_pushup_hero.jpg",
    jpLabel: "腕立て伏せ",
    description: "Drop and give reps. Quality form, full range of motion.",
    rank: "C",
  },
  {
    id: "plank",
    title: "Plank",
    unit: "seconds",
    xpPerUnit: 1,
    defaultGoal: 120,
    icon: "🧘",
    image: "/images/anime_plank_hero.jpg",
    jpLabel: "プランク",
    description: "Hold a straight-arm plank. Tight core, no sagging.",
    rank: "D",
  },
  {
    id: "squat",
    title: "Squats",
    unit: "reps",
    xpPerUnit: 2,
    defaultGoal: 50,
    icon: "🦵",
    image: "/images/anime_squat_hero.jpg",
    jpLabel: "スクワット",
    description: "Bodyweight squats. Thighs parallel, drive through heels.",
    rank: "C",
  },
  {
    id: "sprint",
    title: "Sprint",
    unit: "seconds",
    xpPerUnit: 2,
    defaultGoal: 60,
    icon: "⚡",
    image: "/images/anime_sprint_hero.jpg",
    jpLabel: "スプリント",
    description: "All-out effort sprint. Bursts, not marathons.",
    rank: "B",
  },
  {
    id: "writing",
    title: "Writing",
    unit: "words",
    xpPerUnit: 1,
    defaultGoal: 200,
    icon: "✍️",
    image: "/images/anime_writing_hero.jpg",
    jpLabel: "執筆",
    description: "Focused writing — journal, story, or goal planning.",
    rank: "D",
  },
  {
    id: "water",
    title: "Drinking Water",
    unit: "glasses",
    xpPerUnit: 5,
    defaultGoal: 8,
    icon: "💧",
    image: "/images/anime_water_hero.jpg",
    jpLabel: "水分補給",
    description: "Stay hydrated. 8 glasses is the minimum.",
    rank: "E",
  },
  {
    id: "affirmation",
    title: "Affirmation Reading",
    unit: "rounds",
    xpPerUnit: 15,
    defaultGoal: 3,
    icon: "📖",
    image: "/images/goal_jinwoo.jpg",
    jpLabel: "アファメーション",
    description:
      "Read your I AM affirmations aloud with conviction. Speak the identity into existence.",
    rank: "D",
  },
  {
    id: "gratitude",
    title: "Gratitude Script",
    unit: "entries",
    xpPerUnit: 20,
    defaultGoal: 5,
    icon: "🙏",
    image: "/images/goal_jinwoo.jpg",
    jpLabel: "感謝",
    description:
      "Write 5 things you're deeply grateful for. Specific, emotional, felt in the body.",
    rank: "D",
  },
  {
    id: "script369",
    title: "369 Script",
    unit: "rounds",
    xpPerUnit: 25,
    defaultGoal: 3,
    icon: "🔁",
    image: "/images/goal_jinwoo.jpg",
    jpLabel: "369メソッド",
    description:
      "Write your desire 3x in morning, 6x in afternoon, 9x at night. Tesla's manifestation method.",
    rank: "C",
  },
];

interface TaskListViewProps {
  onBack: () => void;
  onTaskClick?: (task: TaskDef) => void;
}

export const TaskListView: React.FC<TaskListViewProps> = ({
  onBack,
  onTaskClick,
}) => {
  const [hovered, setHovered] = useState<TaskId | null>(null);

  // ============== PER-TASK PROGRESS (persisted in localStorage) ==============
  const PROGRESS_KEY = "manifest_task_progress_v1";
  const [taskProgress, setTaskProgress] = useState<Record<TaskId, number>>(() => {
    try {
      const raw = localStorage.getItem(PROGRESS_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return {} as Record<TaskId, number>;
  });

  useEffect(() => {
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(taskProgress));
    } catch {}
  }, [taskProgress]);

  const getTaskProgress = (id: TaskId): number => taskProgress[id] ?? 0;

  return (
    <div
      className="relative w-full"
      style={{ backgroundColor: "#000", minHeight: "100vh" }}
    >
      {/* ===================== TOP BAR ===================== */}
      <div
        className="sticky top-0 z-30 flex items-center justify-between px-4 pt-5 pb-3"
        style={{ backgroundColor: "#000", borderBottom: `1px solid ${HAIRLINE}` }}
      >
        <div className="flex items-center gap-2.5">
          <button
            onClick={onBack}
            className="flex items-center justify-center"
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              backgroundColor: SURFACE,
              border: `1px solid ${HAIRLINE_STRONG}`,
              color: TEXT_PRIMARY,
            }}
          >
            ←
          </button>
          <div className="flex flex-col">
            <div
              className="font-extrabold tracking-tight leading-none"
              style={{
                color: TEXT_PRIMARY,
                fontSize: 16,
                letterSpacing: "-0.01em",
              }}
            >
              Tasks
            </div>
            <div
              className="text-[10px] mt-0.5 uppercase tracking-wider"
              style={{ color: TEXT_TERTIARY }}
            >
              Solo Dominion
            </div>
          </div>
        </div>
        <div
          className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase"
          style={{
            backgroundColor: SURFACE,
            border: `1px solid ${HAIRLINE_STRONG}`,
            color: ORANGE,
          }}
        >
          タスク
        </div>
      </div>

      {/* ===================== HERO HEADER ===================== */}
      <section className="px-5 pt-5 pb-2">
        <h1
          className="font-extrabold leading-[1.05] tracking-tight"
          style={{
            color: TEXT_PRIMARY,
            fontSize: "clamp(1.5rem, 4.5vw, 2.25rem)",
            letterSpacing: "-0.02em",
          }}
        >
          Choose your <span style={{ color: ORANGE }}>task</span>.
        </h1>
        <p
          className="mt-2 text-[13px] leading-relaxed"
          style={{ color: TEXT_SECONDARY, maxWidth: 400 }}
        >
          Nine disciplines. Each one forges a different part of your shadow.
          Body, mind, and spirit — complete to earn XP and climb the ranks.
        </p>
      </section>

      {/* ===================== TASK GRID ===================== */}
      <section className="px-4 pt-5 pb-16">
        <div className="grid grid-cols-1 gap-3">
          {TASKS.map((task) => {
            const isHovered = hovered === task.id;
            const currentProgress = getTaskProgress(task.id);
            const isComplete = currentProgress >= task.defaultGoal;
            return (
              <button
                key={task.id}
                onClick={() => onTaskClick?.(task)}
                onMouseEnter={() => setHovered(task.id)}
                onMouseLeave={() => setHovered(null)}
                className="relative flex items-stretch gap-3 rounded-2xl p-3 text-left transition-all active:scale-[0.99]"
                style={{
                  backgroundColor: SURFACE,
                  border: `1px solid ${
                    isHovered ? HAIRLINE_STRONG : HAIRLINE
                  }`,
                }}
              >
                {/* Left: Boss image + rank badge */}
                <div
                  className="relative shrink-0 rounded-xl overflow-hidden"
                  style={{ width: 84, height: 100 }}
                >
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage: `url(${task.image})`,
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
                  {task.rank}
                </div>
                {/* Segmented progress overlay on image */}
                <div
                  className="absolute top-1.5 right-1.5 flex items-center gap-px"
                  style={{
                    backgroundColor: "rgba(0,0,0,0.5)",
                    padding: "2px 4px",
                    borderRadius: 4,
                    backdropFilter: "blur(4px)",
                  }}
                >
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div
                      key={i}
                      style={{
                        width: 3,
                        height: 8,
                        borderRadius: 1,
                        backgroundColor:
                          i < Math.round((currentProgress / Math.max(1, task.defaultGoal)) * 7)
                            ? ORANGE
                            : "rgba(255,255,255,0.2)",
                      }}
                    />
                  ))}
                </div>
                </div>

                {/* Middle: JP label + title + desc + xp row */}
                <div className="flex-1 min-w-0 py-1">
                  <div
                    className="text-[9px] font-semibold tracking-widest mb-1 uppercase"
                    style={{ color: TEXT_TERTIARY }}
                  >
                    {task.jpLabel}
                  </div>
                  <h3
                    className="text-[16px] font-extrabold tracking-tight leading-tight"
                    style={{
                      color: TEXT_PRIMARY,
                      letterSpacing: "-0.005em",
                    }}
                  >
                    {task.icon} {task.title}
                  </h3>
                  <p
                    className="text-[11px] mt-1 leading-snug line-clamp-2"
                    style={{ color: TEXT_SECONDARY }}
                  >
                    {task.description}
                  </p>
                  <div
                    className="flex items-center gap-2 mt-1.5"
                    style={{ color: TEXT_TERTIARY }}
                  >
                    <span
                      className="px-1.5 py-0.5 rounded-md text-[9px] font-extrabold tracking-wider uppercase"
                      style={{
                        backgroundColor: "rgba(255,159,10,0.1)",
                        color: ORANGE,
                        border: `1px solid rgba(255,159,10,0.25)`,
                      }}
                    >
                      {task.xpPerUnit} XP / {task.unit}
                    </span>
                    <span className="text-[10px] font-medium">
                      Goal: {task.defaultGoal} {task.unit}
                    </span>
                  </div>
                </div>

                {/* Right: progress + Total XP + arrow */}
                <div className="flex flex-col items-end justify-center shrink-0 pl-1">
                  <span
                    className="text-[9px] font-bold tracking-wider uppercase"
                    style={{ color: TEXT_TERTIARY }}
                  >
                    {isComplete ? "Done" : "Max"}
                  </span>
                  <span
                    className="font-extrabold leading-none tabular-nums"
                    style={{
                      color: isComplete ? IOS_GREEN : ORANGE,
                      fontSize: 20,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {currentProgress}/{task.defaultGoal}
                  </span>
                  <span
                    className="text-[9px] mt-0.5 font-bold tracking-wider uppercase"
                    style={{ color: TEXT_TERTIARY }}
                  >
                    {task.unit}
                  </span>
                  <span
                    className="mt-2 text-[14px]"
                    style={{ color: TEXT_TERTIARY }}
                  >
                    →
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
};

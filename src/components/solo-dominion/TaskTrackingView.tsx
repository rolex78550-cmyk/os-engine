import React, { useState, useEffect, useRef } from "react";
import { WorkoutTracker } from "./WorkoutTracker";

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

export type TrackingTaskId =
  | "pushup"
  | "plank"
  | "squat"
  | "sprint"
  | "writing"
  | "crunch"
  | "water"
  | "affirmation"
  | "gratitude"
  | "script369";

interface TaskTrackingViewProps {
  taskId: TrackingTaskId;
  onBack: () => void;
  onComplete?: (xp: number) => void;
}

const TASK_META: Record<
  TrackingTaskId,
  {
    title: string;
    jpLabel: string;
    icon: string;
    image: string;
    rank: "E" | "D" | "C" | "B";
    unit: string;
    xpPerUnit: number;
    goal: number;
    mode: "sensor" | "timer" | "counter";
  }
> = {
  pushup: {
    title: "Push-ups",
    jpLabel: "腕立て伏せ",
    icon: "💪",
    image: "/images/anime_pushup_hero.jpg",
    rank: "C",
    unit: "reps",
    xpPerUnit: 2,
    goal: 50,
    mode: "sensor",
  },
  plank: {
    title: "Plank",
    jpLabel: "プランク",
    icon: "🧘",
    image: "/images/anime_plank_hero.jpg",
    rank: "D",
    unit: "seconds",
    xpPerUnit: 1,
    goal: 120,
    mode: "sensor",
  },
  squat: {
    title: "Squats",
    jpLabel: "スクワット",
    icon: "🦵",
    image: "/images/anime_squat_hero.jpg",
    rank: "C",
    unit: "reps",
    xpPerUnit: 2,
    goal: 50,
    mode: "sensor",
  },
  sprint: {
    title: "Sprinting",
    jpLabel: "スプリント",
    icon: "⚡",
    image: "/images/anime_sprint_hero.jpg",
    rank: "B",
    unit: "seconds",
    xpPerUnit: 2,
    goal: 60,
    mode: "timer",
  },
  writing: {
    title: "Scripting",
    jpLabel: "スクリプティング",
    icon: "✍️",
    image: "/images/anime_writing_hero.jpg",
    rank: "D",
    unit: "words",
    xpPerUnit: 1,
    goal: 200,
    mode: "counter",
  },
  crunch: {
    title: "Crunch for Abs",
    jpLabel: "腹筋",
    icon: "🔥",
    image: "/images/anime_squat_hero.jpg",
    rank: "D",
    unit: "reps",
    xpPerUnit: 1,
    goal: 50,
    mode: "counter",
  },
  water: {
    title: "Drinking Water",
    jpLabel: "水分補給",
    icon: "💧",
    image: "/images/anime_water_hero.jpg",
    rank: "E",
    unit: "glasses",
    xpPerUnit: 5,
    goal: 8,
    mode: "counter",
  },
  affirmation: {
    title: "Affirmation Reading",
    jpLabel: "アファメーション",
    icon: "📖",
    image: "/images/goal_jinwoo.jpg",
    rank: "D",
    unit: "rounds",
    xpPerUnit: 15,
    goal: 3,
    mode: "counter",
  },
  gratitude: {
    title: "Gratitude Script",
    jpLabel: "感謝",
    icon: "🙏",
    image: "/images/goal_jinwoo.jpg",
    rank: "D",
    unit: "entries",
    xpPerUnit: 20,
    goal: 5,
    mode: "counter",
  },
  script369: {
    title: "369 Script",
    jpLabel: "369メソッド",
    icon: "🔁",
    image: "/images/goal_jinwoo.jpg",
    rank: "C",
    unit: "rounds",
    xpPerUnit: 25,
    goal: 3,
    mode: "counter",
  },
};

/**
 * Top-level task tracking view. Picks the right tracker:
 *  - sensor mode → existing WorkoutTracker (pushup / plank / squat)
 *  - timer mode  → simple sprint timer (seconds-based)
 *  - counter mode → +/- counter (writing words, water glasses)
 */
export const TaskTrackingView: React.FC<TaskTrackingViewProps> = ({
  taskId,
  onBack,
  onComplete,
}) => {
  const meta = TASK_META[taskId];
  const [completed, setCompleted] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);

  const handleComplete = (xp: number) => {
    setXpEarned(xp);
    setCompleted(true);
    onComplete?.(xp);
  };

  if (meta.mode === "sensor") {
    return (
      <div
        className="relative w-full"
        style={{ backgroundColor: "#000", minHeight: "100vh" }}
      >
        {/* Top bar with back */}
        <div
          className="sticky top-0 z-30 flex items-center justify-between px-4 pt-5 pb-3"
          style={{ backgroundColor: "#000", borderBottom: `1px solid ${HAIRLINE}` }}
        >
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
          <div className="flex flex-col items-center">
            <div
              className="font-extrabold tracking-tight leading-none"
              style={{ color: TEXT_PRIMARY, fontSize: 15, letterSpacing: "-0.01em" }}
            >
              {meta.icon} {meta.title}
            </div>
            <div
              className="text-[10px] mt-0.5 uppercase tracking-wider"
              style={{ color: TEXT_TERTIARY }}
            >
              {meta.jpLabel}
            </div>
          </div>
          <div
            className="px-2.5 py-1 rounded-full text-[10px] font-extrabold"
            style={{
              backgroundColor: ORANGE,
              color: "#000",
            }}
          >
            {meta.rank}
          </div>
        </div>

        <WorkoutTracker
          workoutType={
            taskId === "pushup"
              ? "pushup"
              : taskId === "plank"
              ? "plank"
              : "squat"
          }
          missionTitle={meta.title}
          targetValue={meta.goal}
          onComplete={(state) =>
            handleComplete(state.count * meta.xpPerUnit)
          }
          onCancel={onBack}
        />
      </div>
    );
  }

  if (meta.mode === "timer") {
    return (
      <TimerTracker meta={meta} onBack={onBack} onComplete={handleComplete} />
    );
  }

  // counter mode (writing / water)
  return (
    <CounterTracker
      taskId={taskId}
      meta={meta}
      onBack={onBack}
      onComplete={handleComplete}
    />
  );
};

// ===================== TIMER TRACKER (sprint) =====================
const TimerTracker: React.FC<{
  meta: typeof TASK_META[keyof typeof TASK_META];
  onBack: () => void;
  onComplete: (xp: number) => void;
}> = ({ meta, onBack, onComplete }) => {
  const [running, setRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [done, setDone] = useState(false);
  const tickRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    tickRef.current = window.setInterval(() => {
      if (startRef.current != null) {
        setElapsedMs(Date.now() - startRef.current);
      }
    }, 100);
    return () => {
      if (tickRef.current != null) window.clearInterval(tickRef.current);
    };
  }, [running]);

  const start = () => {
    setRunning(true);
    setDone(false);
    startRef.current = Date.now() - elapsedMs;
  };

  const stop = () => {
    setRunning(false);
    const secs = Math.floor(elapsedMs / 1000);
    const xp = Math.min(secs, meta.goal) * meta.xpPerUnit;
    if (secs >= 1) {
      onComplete(xp);
    }
    setDone(true);
  };

  const reset = () => {
    setRunning(false);
    setDone(false);
    setElapsedMs(0);
    startRef.current = null;
  };

  const totalSec = Math.floor(elapsedMs / 1000);
  const mm = Math.floor(totalSec / 60);
  const ss = totalSec % 60;
  const pct = Math.min(100, (totalSec / meta.goal) * 100);

  return (
    <TrackingShell meta={meta} onBack={onBack}>
      <div className="flex flex-col items-center px-5 pt-8 pb-32">
        {/* Large timer display */}
        <div
          className="flex items-center justify-center font-extrabold tabular-nums leading-none"
          style={{
            color: TEXT_PRIMARY,
            fontSize: "clamp(4rem, 18vw, 7rem)",
            letterSpacing: "-0.04em",
          }}
        >
          {String(mm).padStart(2, "0")}
          <span style={{ color: ORANGE }}>:</span>
          {String(ss).padStart(2, "0")}
        </div>

        <div
          className="text-[12px] font-semibold uppercase tracking-widest mt-3"
          style={{ color: TEXT_TERTIARY }}
        >
          {meta.unit} · Goal {meta.goal}s
        </div>

        {/* Progress bar */}
        <div
          className="w-full max-w-[340px] mt-8 h-2 rounded-full overflow-hidden"
          style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
        >
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${pct}%`,
              background: `linear-gradient(90deg, ${ORANGE_DARK}, ${ORANGE})`,
            }}
          />
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-[340px] mt-8">
          <TrackerStat label="Reps" value={`${totalSec}`} unit={meta.unit} />
          <TrackerStat
            label="XP Earned"
            value={`+${totalSec * meta.xpPerUnit}`}
            unit="xp"
            highlight
          />
          <TrackerStat
            label="Pace"
            value={`${meta.xpPerUnit}`}
            unit="xp/s"
          />
        </div>

        {done && (
          <div
            className="mt-6 px-4 py-2 rounded-xl text-[13px] font-bold"
            style={{
              backgroundColor: "rgba(52,199,89,0.12)",
              color: IOS_GREEN,
              border: `1px solid rgba(52,199,89,0.3)`,
            }}
          >
            ✓ Session recorded · +{Math.min(totalSec, meta.goal) * meta.xpPerUnit} XP
          </div>
        )}
      </div>

      {/* Bottom action bar */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 px-5 pb-6 pt-4"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.85) 30%, rgba(0,0,0,1) 100%)",
        }}
      >
        <div className="flex gap-3 max-w-[420px] mx-auto">
          <button
            onClick={reset}
            className="flex-1 py-3.5 rounded-2xl font-bold text-[14px] transition active:scale-[0.98]"
            style={{
              backgroundColor: SURFACE,
              color: TEXT_PRIMARY,
              border: `1px solid ${HAIRLINE}`,
            }}
          >
            Reset
          </button>
          {!running ? (
            <button
              onClick={start}
              className="flex-[2] py-3.5 rounded-2xl font-extrabold text-[15px] transition active:scale-[0.98]"
              style={{
                backgroundColor: ORANGE,
                color: "#000",
                boxShadow: "0 8px 24px rgba(255,159,10,0.25)",
              }}
            >
              {elapsedMs > 0 ? "▶ Resume" : "▶ Start Sprint"}
            </button>
          ) : (
            <button
              onClick={stop}
              className="flex-[2] py-3.5 rounded-2xl font-extrabold text-[15px] transition active:scale-[0.98]"
              style={{
                backgroundColor: IOS_RED,
                color: "#fff",
              }}
            >
              ■ Stop & Save
            </button>
          )}
        </div>
      </div>
    </TrackingShell>
  );
};

// ===================== COUNTER TRACKER (writing / water) =====================
const CounterTracker: React.FC<{
  taskId: TrackingTaskId;
  meta: typeof TASK_META[keyof typeof TASK_META];
  onBack: () => void;
  onComplete: (xp: number) => void;
}> = ({ taskId, meta, onBack, onComplete }) => {
  const [count, setCount] = useState(0);
  const [done, setDone] = useState(false);

  const inc = () => setCount((c) => c + 1);
  const dec = () => setCount((c) => Math.max(0, c - 1));
  const reset = () => {
    setCount(0);
    setDone(false);
  };

  const submit = () => {
    if (count === 0) return;
    const xp = Math.min(count, meta.goal * 2) * meta.xpPerUnit;
    onComplete(xp);
    setDone(true);
  };

  const pct = Math.min(100, (count / meta.goal) * 100);
  const xp = count * meta.xpPerUnit;

  return (
    <TrackingShell meta={meta} onBack={onBack}>
      <div className="flex flex-col items-center px-5 pt-8 pb-32">
        {/* Count display */}
        <div
          className="flex items-baseline gap-2"
          style={{ color: TEXT_PRIMARY }}
        >
          <span
            className="font-extrabold leading-none tabular-nums"
            style={{
              fontSize: "clamp(5rem, 22vw, 8rem)",
              letterSpacing: "-0.04em",
            }}
          >
            {count}
          </span>
          <span
            className="text-[16px] font-bold"
            style={{ color: TEXT_TERTIARY }}
          >
            {meta.unit}
          </span>
        </div>

        <div
          className="text-[12px] font-semibold uppercase tracking-widest mt-2"
          style={{ color: TEXT_TERTIARY }}
        >
          Goal: {meta.goal} {meta.unit}
        </div>

        {/* Progress bar */}
        <div
          className="w-full max-w-[340px] mt-8 h-2 rounded-full overflow-hidden"
          style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
        >
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${pct}%`,
              background: `linear-gradient(90deg, ${ORANGE_DARK}, ${ORANGE})`,
            }}
          />
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3 w-full max-w-[340px] mt-8">
          <TrackerStat label="Count" value={`${count}`} unit={meta.unit} />
          <TrackerStat
            label="XP Earned"
            value={`+${xp}`}
            unit="xp"
            highlight
          />
        </div>

        {/* +/- buttons */}
        <div className="flex items-center gap-4 mt-10">
          <button
            onClick={dec}
            className="flex items-center justify-center font-extrabold text-[28px] transition active:scale-[0.95]"
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: SURFACE,
              color: TEXT_PRIMARY,
              border: `1px solid ${HAIRLINE_STRONG}`,
            }}
          >
            −
          </button>
          <button
            onClick={inc}
            className="flex items-center justify-center font-extrabold text-[36px] transition active:scale-[0.95]"
            style={{
              width: 96,
              height: 96,
              borderRadius: 48,
              backgroundColor: ORANGE,
              color: "#000",
              boxShadow: "0 8px 24px rgba(255,159,10,0.25)",
            }}
          >
            +
          </button>
        </div>

        {done && (
          <div
            className="mt-6 px-4 py-2 rounded-xl text-[13px] font-bold"
            style={{
              backgroundColor: "rgba(52,199,89,0.12)",
              color: IOS_GREEN,
              border: `1px solid rgba(52,199,89,0.3)`,
            }}
          >
            ✓ Saved · +{count * meta.xpPerUnit} XP earned
          </div>
        )}

        {taskId === "writing" && (
          <p
            className="text-[11px] mt-4 text-center"
            style={{ color: TEXT_TERTIARY, maxWidth: 300 }}
          >
            Tap + for each chunk of words. No auto-counter needed — just log
            your progress honestly.
          </p>
        )}
      </div>

      {/* Bottom action bar */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 px-5 pb-6 pt-4"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.85) 30%, rgba(0,0,0,1) 100%)",
        }}
      >
        <div className="flex gap-3 max-w-[420px] mx-auto">
          <button
            onClick={reset}
            className="flex-1 py-3.5 rounded-2xl font-bold text-[14px] transition active:scale-[0.98]"
            style={{
              backgroundColor: SURFACE,
              color: TEXT_PRIMARY,
              border: `1px solid ${HAIRLINE}`,
            }}
          >
            Reset
          </button>
          <button
            onClick={submit}
            disabled={count === 0}
            className="flex-[2] py-3.5 rounded-2xl font-extrabold text-[15px] transition active:scale-[0.98] disabled:opacity-40"
            style={{
              backgroundColor: ORANGE,
              color: "#000",
              boxShadow: count > 0 ? "0 8px 24px rgba(255,159,10,0.25)" : "none",
            }}
          >
            ✓ Save · +{count * meta.xpPerUnit} XP
          </button>
        </div>
      </div>
    </TrackingShell>
  );
};

// ===================== SHARED SHELL =====================
const TrackingShell: React.FC<{
  meta: typeof TASK_META[keyof typeof TASK_META];
  onBack: () => void;
  children: React.ReactNode;
}> = ({ meta, onBack, children }) => {
  return (
    <div
      className="relative w-full"
      style={{ backgroundColor: "#000", minHeight: "100vh" }}
    >
      {/* Subtle hero image at top */}
      <div
        className="absolute top-0 left-0 right-0 h-[180px] pointer-events-none"
        style={{
          backgroundImage: `url(${meta.image})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.15,
        }}
      />
      <div
        className="absolute top-0 left-0 right-0 h-[180px] pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,1) 100%)",
        }}
      />

      {/* Top bar */}
      <div
        className="sticky top-0 z-30 flex items-center justify-between px-4 pt-5 pb-3"
        style={{ backgroundColor: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)", borderBottom: `1px solid ${HAIRLINE}` }}
      >
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
        <div className="flex flex-col items-center">
          <div
            className="font-extrabold tracking-tight leading-none"
            style={{ color: TEXT_PRIMARY, fontSize: 15, letterSpacing: "-0.01em" }}
          >
            {meta.icon} {meta.title}
          </div>
          <div
            className="text-[10px] mt-0.5 uppercase tracking-wider"
            style={{ color: TEXT_TERTIARY }}
          >
            {meta.jpLabel}
          </div>
        </div>
        <div
          className="px-2.5 py-1 rounded-full text-[10px] font-extrabold"
          style={{
            backgroundColor: ORANGE,
            color: "#000",
          }}
        >
          {meta.rank}
        </div>
      </div>

      <div className="relative z-10">{children}</div>
    </div>
  );
};

// ===================== TINY STAT BLOCK =====================
const TrackerStat: React.FC<{
  label: string;
  value: string;
  unit: string;
  highlight?: boolean;
}> = ({ label, value, unit, highlight }) => (
  <div
    className="rounded-2xl px-3 py-3 text-center"
    style={{
      backgroundColor: SURFACE,
      border: `1px solid ${HAIRLINE}`,
    }}
  >
    <div
      className="text-[9px] font-bold uppercase tracking-widest"
      style={{ color: TEXT_TERTIARY }}
    >
      {label}
    </div>
    <div
      className="text-[20px] font-extrabold tabular-nums leading-none mt-1"
      style={{ color: highlight ? ORANGE : TEXT_PRIMARY, letterSpacing: "-0.02em" }}
    >
      {value}
    </div>
    <div
      className="text-[9px] mt-0.5 uppercase tracking-wider"
      style={{ color: TEXT_TERTIARY }}
    >
      {unit}
    </div>
  </div>
);

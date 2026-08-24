import React, { useState, useEffect } from "react";
import { TaskProofCamera, type ProofTaskId } from "./TaskProofCamera";
import { db } from "../../lib/firebase";
import { doc, setDoc, increment, serverTimestamp } from "firebase/firestore";
import { Sparkles, Camera } from "lucide-react";

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
  | "crunch"
  | "water"
  | "dress"
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
  /** Fixed XP reward on task completion (saved to DB). Default 50. */
  xpReward?: number;
}

/** Standard XP reward per completed task — saved to Firestore. */
export const XP_REWARD_PER_TASK = 50;

export const TASKS: TaskDef[] = [
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
    xpReward: 50,
  },
  {
    id: "writing",
    title: "Scripting",
    unit: "words",
    xpPerUnit: 1,
    defaultGoal: 200,
    icon: "✍️",
    image: "/images/anime_writing_hero.jpg",
    jpLabel: "スクリプティング",
    description:
      "Write your manifestation script in present tense. Feel it as already done.",
    rank: "D",
    xpReward: 50,
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
    xpReward: 50,
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
    xpReward: 50,
  },
  {
    id: "pushup",
    title: "50 Push-ups",
    unit: "reps",
    xpPerUnit: 2,
    defaultGoal: 50,
    icon: "💪",
    image: "/images/anime_pushup_hero.jpg",
    jpLabel: "腕立て伏せ",
    description: "Drop and give 50 reps. Quality form, full range of motion.",
    rank: "C",
    xpReward: 50,
  },
  {
    id: "plank",
    title: "2 Min 5-Set Plank",
    unit: "seconds",
    xpPerUnit: 1,
    defaultGoal: 120,
    icon: "🧘",
    image: "/images/anime_plank_hero.jpg",
    jpLabel: "プランク",
    description:
      "Hold a straight-arm plank for 2 minutes. 5 sets. Tight core, no sagging.",
    rank: "D",
    xpReward: 50,
  },
  {
    id: "crunch",
    title: "Crunch for Abs",
    unit: "reps",
    xpPerUnit: 1,
    defaultGoal: 50,
    icon: "🔥",
    image: "/images/anime_squat_hero.jpg",
    jpLabel: "腹筋",
    description: "Knock out crunches for chiseled abs. Form over quantity.",
    rank: "D",
    xpReward: 50,
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
    xpReward: 50,
  },
  {
    id: "sprint",
    title: "Sprinting",
    unit: "seconds",
    xpPerUnit: 2,
    defaultGoal: 60,
    icon: "⚡",
    image: "/images/anime_sprint_hero.jpg",
    jpLabel: "スプリント",
    description: "All-out effort sprint. Bursts, not marathons.",
    rank: "B",
    xpReward: 50,
  },
  {
    id: "water",
    title: "3 Litre Water",
    unit: "glasses",
    xpPerUnit: 5,
    defaultGoal: 8,
    icon: "💧",
    image: "/images/anime_water_hero.jpg",
    jpLabel: "水分補給",
    description: "Stay hydrated. 8 glasses = ~3 litres. Minimum daily target.",
    rank: "E",
    xpReward: 50,
  },
  {
    id: "dress",
    title: "Dress Like Your Future Self",
    unit: "outfit",
    xpPerUnit: 50,
    defaultGoal: 1,
    icon: "👔",
    image: "/images/anime_shadow_knight_1785176768012.jpg",
    jpLabel: "なりきり",
    description: "Wear what your FUTURE self would wear today. Post a photo proof — AI verifies it's authentic, not a screenshot.",
    rank: "C",
    xpReward: 50,
  },
];

interface TaskListViewProps {
  onBack: () => void;
  onTaskClick?: (task: TaskDef) => void;
  currentUser?: any;
  currentProfile?: any;
  updateUserProfile?: (u: any) => Promise<void>;
  setFbProfile?: (p: any) => void;
}

export const TaskListView: React.FC<TaskListViewProps> = ({
  onBack,
  onTaskClick,
  currentUser,
  currentProfile,
  updateUserProfile,
  setFbProfile,
}) => {
  const [hovered, setHovered] = useState<TaskId | null>(null);

  // ============== AI CAMERA PROOF MODAL ==============
  const [proofTask, setProofTask] = useState<ProofTaskId | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [proofError, setProofError] = useState<string | null>(null);

  // ============== PER-TASK PROGRESS (persisted in localStorage, resets at midnight) ==============
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

  // Listen for midnight reset event from App.tsx
  useEffect(() => {
    const onReset = () => {
      console.log("[TaskListView] received tasks reset event — clearing progress");
      setTaskProgress({} as Record<TaskId, number>);
    };
    window.addEventListener("manifest_tasks_reset", onReset as EventListener);
    return () => window.removeEventListener("manifest_tasks_reset", onReset as EventListener);
  }, []);

  // Also check at mount + every 60s if date rolled over
  useEffect(() => {
    const LAST_DATE_KEY = "manifest_last_active_date_tasklist";
    const check = () => {
      try {
        const today = new Date().toLocaleDateString("en-CA");
        const last = window.localStorage.getItem(LAST_DATE_KEY);
        if (last && last !== today) {
          setTaskProgress({} as Record<TaskId, number>);
        }
        window.localStorage.setItem(LAST_DATE_KEY, today);
      } catch {}
    };
    check();
    const interval = setInterval(check, 60_000);
    return () => clearInterval(interval);
  }, []);

  const handleTaskClickInternal = async (task: TaskDef) => {
    // Writing tasks go through AI Camera Proof flow
    if (task.id === "writing" || task.id === "gratitude" || task.id === "script369" || task.id === "dress") {
      setProofError(null);
      setProofTask(task.id as ProofTaskId);
      return;
    }
    // Other tasks (workouts) go through normal tracker
    onTaskClick?.(task);
  };

  const handleProofVerified = async (result: {
    verified: boolean;
    score: number;
    feedback: string;
    imageBase64?: string;
    imageHash?: string;
  }) => {
    if (!proofTask) return;
    if (!result.verified) {
      setProofError(result.feedback || "AI didn't verify. Try again with a fresh photo.");
      return;
    }
    // Award 50 XP
    setVerifying(true);
    try {
      const uid = (currentUser as any)?.uid;
      const taskDef = TASKS.find((t) => t.id === proofTask);
      const xpReward = taskDef?.xpReward ?? 50;
      const profileObj = (currentProfile as any) || {};
      const currentTotalXp = Number(profileObj.totalXp) || Number(profileObj.xp) || 0;
      const currentXp = Number(profileObj.xp) || currentTotalXp;
      const newTotalXp = currentTotalXp + xpReward;
      const newXp = currentXp + xpReward;
      const newLevel = Math.floor(newTotalXp / 1000) + 1;
      const oldLevel = Number(profileObj.level) || 1;
      console.log(
        `[proof] awarding ${xpReward} XP: totalXp ${currentTotalXp} -> ${newTotalXp}, level ${oldLevel} -> ${newLevel}`
      );
      // Single atomic increment — race-safe, no double count. onSnapshot
      // (FirebaseProvider) re-renders the UI with the true value.
      if (uid) {
        try {
          await setDoc(
            doc(db, "users", uid),
            {
              totalXp: increment(xpReward),
              xp: increment(xpReward),
              level: newLevel,
              [`lastProof_${proofTask}`]: serverTimestamp(),
              updatedAt: Date.now(),
            },
            { merge: true }
          );
          console.log("[proof] atomic XP write OK");
        } catch (e) {
          console.warn("[proof] direct write failed:", e);
        }
      }
      // Mark task progress as complete for today
      const today = new Date().toLocaleDateString("en-CA");
      try {
        const raw = window.localStorage.getItem(PROGRESS_KEY);
        const progress = raw ? JSON.parse(raw) : {};
        progress[proofTask] = taskDef?.defaultGoal ?? 100;
        window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
        setTaskProgress((p) => ({ ...p, [proofTask]: taskDef?.defaultGoal ?? 100 }));
      } catch {}
      // Mark as completed today (so can't claim again)
      try {
        window.localStorage.setItem(
          `manifest_proof_completed_${proofTask}_${today}`,
          "1"
        );
      } catch {}
      // Close modal + show toast
      setProofTask(null);
      window.dispatchEvent(new CustomEvent("manifest_sfx_levelup"));
      window.dispatchEvent(new CustomEvent("manifest_sfx_success"));
      window.dispatchEvent(
        new CustomEvent("manifest_toast", {
          detail: {
            msg: `+${xpReward} XP · ${taskDef?.title} verified by AI`,
            type: "ok",
          },
        })
      );
    } catch (e: any) {
      console.error("[proof] award error:", e);
      setProofError(e?.message || "Failed to award XP");
    } finally {
      setVerifying(false);
    }
  };

  // ============== AI PROOF MODE — full page (no modal) ==============
  // When proofTask is set, return ONLY the camera proof page
  if (proofTask) {
    return (
      <TaskProofCamera
        taskId={proofTask}
        taskTitle={TASKS.find((t) => t.id === proofTask)?.title || proofTask}
        taskDescription={
          TASKS.find((t) => t.id === proofTask)?.description ||
          "Submit photo proof of today's practice"
        }
        onVerified={handleProofVerified}
        onClose={() => {
          setProofTask(null);
          setProofError(null);
        }}
      />
    );
  }

  const getTaskProgress = (id: TaskId): number => taskProgress[id] ?? 0;

  return (
    <div
      className="relative w-full"
      style={{ backgroundColor: "#000", minHeight: "100dvh" }}
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
                onClick={() => handleTaskClickInternal(task)}
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
                {/* AI Proof badge for writing tasks */}
                {(task.id === "writing" || task.id === "gratitude" || task.id === "script369" || task.id === "dress") && (
                  <div
                    className="absolute top-1.5 left-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded-md"
                    style={{
                      backgroundColor: "rgba(0,0,0,0.7)",
                      backdropFilter: "blur(4px)",
                    }}
                  >
                    <Camera size={9} style={{ color: ORANGE }} />
                    <span
                      className="text-[8px] font-extrabold tracking-wider uppercase"
                      style={{ color: ORANGE }}
                    >
                      AI PROOF
                    </span>
                  </div>
                )}
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

      {/* ============== TOAST ============== */}
      {(proofError || verifying) && (
        <div
          className="fixed left-1/2 -translate-x-1/2 z-[300] px-4 py-2.5 rounded-2xl text-[12px] font-bold flex items-center gap-2"
          style={{
            bottom: "calc(env(safe-area-inset-bottom, 0px) + 100px)",
            backgroundColor: proofError
              ? "rgba(255,69,58,0.95)"
              : "rgba(255,159,10,0.95)",
            color: "#fff",
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            minWidth: 200,
          }}
        >
          {proofError ? "❌" : "⏳"} {proofError || "Awarding XP..."}
        </div>
      )}
    </div>
  );
};

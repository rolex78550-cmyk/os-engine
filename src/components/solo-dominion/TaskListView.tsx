import React, { useState, useEffect, useCallback } from "react";
import { TaskProofCamera } from "./TaskProofCamera";
import { Camera, CheckCircle2, Droplets, BookOpen, Loader2, ShieldCheck } from "lucide-react";
import {
  TASKS as CATALOG_TASKS,
  type TaskSpec,
  type TaskId as CatalogTaskId,
  MAX_PROOF_ATTEMPTS_PER_DAY,
} from "../../lib/taskCatalog";
import { XP_PER_TASK } from "../../lib/xpSeason";
import { claimTask, fetchTodayClaims, type TodayClaims } from "../../lib/taskClaimApi";

const TEXT_PRIMARY = "#ffffff";
const TEXT_SECONDARY = "rgba(235,235,245,0.62)";
const TEXT_TERTIARY = "rgba(235,235,245,0.32)";
const SURFACE = "#0a0a0a";
const HAIRLINE = "rgba(255,255,255,0.08)";
const HAIRLINE_STRONG = "rgba(255,255,255,0.18)";
const ORANGE = "#ff9f0a";
const IOS_GREEN = "#34c759";
const IOS_RED = "#ff453a";

// ---- Public types (kept for SoloDominion.tsx compatibility) ----
export type TaskId = CatalogTaskId;
export type TaskDef = TaskSpec & {
  /** Fixed XP reward on task completion. Always XP_PER_TASK (50). */
  xpReward: number;
  /** Legacy fields kept so older call-sites keep compiling. */
  defaultGoal: number;
  unit: string;
  xpPerUnit: number;
};

/** Standard XP reward per completed task — awarded by the SERVER only. */
export const XP_REWARD_PER_TASK = XP_PER_TASK;

/** The 11 daily tasks, from the shared catalog. */
export const TASKS: TaskDef[] = CATALOG_TASKS.map((t) => ({
  ...t,
  xpReward: XP_PER_TASK,
  defaultGoal: 1,
  unit: "proof",
  xpPerUnit: XP_PER_TASK,
}));

interface TaskListViewProps {
  onBack: () => void;
  /** Called for tasks that navigate elsewhere (affirmation → Affirmation Hub). */
  onTaskClick?: (task: TaskDef) => void;
  currentUser?: any;
  currentProfile?: any;
  updateUserProfile?: (u: any) => Promise<void>;
  setFbProfile?: (p: any) => void;
}

const proofBadge = (mode: TaskSpec["proofMode"]) =>
  mode === "camera"
    ? { icon: <Camera size={9} style={{ color: ORANGE }} />, label: "AI PROOF" }
    : mode === "flips"
    ? { icon: <BookOpen size={9} style={{ color: ORANGE }} />, label: "READ 10" }
    : { icon: <Droplets size={9} style={{ color: ORANGE }} />, label: "HONOR" };

export const TaskListView: React.FC<TaskListViewProps> = ({
  onBack,
  onTaskClick,
  currentUser,
}) => {
  const [hovered, setHovered] = useState<TaskId | null>(null);
  const [proofTask, setProofTask] = useState<TaskId | null>(null);
  const [busyTask, setBusyTask] = useState<TaskId | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  // ============== TODAY'S CLAIMS — SERVER IS THE SOURCE OF TRUTH ==============
  // (No localStorage: clearing storage / another device / changing the
  // phone clock can no longer unlock a second claim.)
  const [today, setToday] = useState<TodayClaims | null>(null);
  const [loadingClaims, setLoadingClaims] = useState(true);

  const refreshClaims = useCallback(async () => {
    const t = await fetchTodayClaims();
    if (t) setToday(t);
    setLoadingClaims(false);
  }, []);

  useEffect(() => {
    refreshClaims();
    const id = window.setInterval(refreshClaims, 60_000);
    // Affirmation bridge (App.tsx) fires this after it claims via the server
    window.addEventListener("manifest_task_claimed", refreshClaims);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("manifest_task_claimed", refreshClaims);
    };
  }, [refreshClaims, currentUser?.uid]);

  const claimOf = (id: TaskId) => today?.claims?.[id];
  const isDone = (id: TaskId) => !!claimOf(id)?.verified;
  const attemptsOf = (id: TaskId) => Number(claimOf(id)?.attempts) || 0;
  const doneCount = TASKS.filter((t) => isDone(t.id)).length;

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    window.setTimeout(() => setToast(null), 3200);
  };

  // ============== CLICK ROUTING ==============
  const handleTaskClickInternal = async (task: TaskDef) => {
    if (isDone(task.id)) {
      showToast(`✅ ${task.title} already completed today`, true);
      return;
    }
    if (task.proofMode === "camera") {
      if (attemptsOf(task.id) >= MAX_PROOF_ATTEMPTS_PER_DAY) {
        showToast(`❌ No proof attempts left for ${task.title} today`, false);
        return;
      }
      setProofTask(task.id);
      return;
    }
    if (task.proofMode === "flips") {
      // Affirmation → Affirmation Hub (bridge claims via server after 10 reads)
      onTaskClick?.(task);
      return;
    }
    // honor (water): one tap → server claim (still server-side so it's once/day)
    if (busyTask) return;
    setBusyTask(task.id);
    try {
      const r = await claimTask(task.id);
      if (r.verified) {
        window.dispatchEvent(new CustomEvent("manifest_sfx_xp"));
        window.dispatchEvent(
          new CustomEvent("manifest_toast", { detail: { msg: `+${r.xpAwarded ?? XP_PER_TASK} XP · ${task.title} logged`, type: "ok" } })
        );
        showToast(`+${r.xpAwarded ?? XP_PER_TASK} XP · ${task.title} logged`, true);
        if (r.leveledUp) window.dispatchEvent(new CustomEvent("manifest_sfx_levelup"));
      } else if (r.error === "ALREADY_CLAIMED") {
        showToast(`✅ ${task.title} already completed today`, true);
      } else {
        showToast(r.message || "Could not log task. Try again.", false);
      }
    } catch (e: any) {
      showToast(e?.message || "Could not log task. Try again.", false);
    } finally {
      setBusyTask(null);
      refreshClaims();
    }
  };

  // Camera flow: server already verified + awarded XP before this fires.
  const handleProofVerified = (result: { xpAwarded: number; leveledUp?: boolean }) => {
    const task = TASKS.find((t) => t.id === proofTask);
    setProofTask(null);
    window.dispatchEvent(new CustomEvent("manifest_sfx_xp"));
    window.dispatchEvent(new CustomEvent("manifest_sfx_success"));
    if (result.leveledUp) window.dispatchEvent(new CustomEvent("manifest_sfx_levelup"));
    window.dispatchEvent(
      new CustomEvent("manifest_toast", {
        detail: { msg: `+${result.xpAwarded} XP · ${task?.title} verified by AI`, type: "ok" },
      })
    );
    showToast(`+${result.xpAwarded} XP · ${task?.title} verified by AI`, true);
    refreshClaims();
  };

  // ============== CAMERA PROOF PAGE ==============
  if (proofTask) {
    const t = TASKS.find((x) => x.id === proofTask)!;
    return (
      <TaskProofCamera
        taskId={proofTask}
        taskTitle={t.title}
        taskDescription={t.description}
        attemptsUsed={attemptsOf(proofTask)}
        onVerified={handleProofVerified}
        onClose={() => {
          setProofTask(null);
          refreshClaims();
        }}
      />
    );
  }

  // ============== MAIN LIST ==============
  return (
    <div className="relative w-full" style={{ backgroundColor: "#000", minHeight: "100dvh" }}>
      {/* ===================== TOP BAR ===================== */}
      <div
        className="sticky top-0 z-30 flex items-center justify-between px-4 pt-5 pb-3"
        style={{ backgroundColor: "#000", borderBottom: `1px solid ${HAIRLINE}` }}
      >
        <div className="flex items-center gap-2.5">
          <button
            onClick={onBack}
            className="flex items-center justify-center"
            style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: SURFACE, border: `1px solid ${HAIRLINE_STRONG}`, color: TEXT_PRIMARY }}
          >
            ←
          </button>
          <div className="flex flex-col">
            <div className="font-extrabold tracking-tight leading-none" style={{ color: TEXT_PRIMARY, fontSize: 16, letterSpacing: "-0.01em" }}>
              Tasks
            </div>
            <div className="text-[10px] mt-0.5 uppercase tracking-wider" style={{ color: TEXT_TERTIARY }}>
              {loadingClaims ? "Syncing…" : `${doneCount} / ${TASKS.length} done today`}
            </div>
          </div>
        </div>
        <div
          className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase"
          style={{ backgroundColor: SURFACE, border: `1px solid ${HAIRLINE_STRONG}`, color: ORANGE }}
        >
          タスク
        </div>
      </div>

      {/* ===================== HERO HEADER ===================== */}
      <section className="px-5 pt-5 pb-2">
        <h1
          className="font-extrabold leading-[1.05] tracking-tight"
          style={{ color: TEXT_PRIMARY, fontSize: "clamp(1.5rem, 4.5vw, 2.25rem)", letterSpacing: "-0.02em" }}
        >
          Choose your <span style={{ color: ORANGE }}>task</span>.
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed" style={{ color: TEXT_SECONDARY, maxWidth: 420 }}>
          Eleven disciplines · {XP_PER_TASK} XP each · proof verified by AI from a live photo.
          Every task can be claimed once per day.
        </p>
        <div className="mt-3 flex items-center gap-1.5 text-[10px]" style={{ color: TEXT_TERTIARY }}>
          <ShieldCheck size={11} style={{ color: ORANGE }} />
          Server-verified · {MAX_PROOF_ATTEMPTS_PER_DAY} photo attempts per task per day
        </div>
      </section>

      {/* ===================== TASK GRID ===================== */}
      <section className="px-4 pt-5 pb-16">
        <div className="grid grid-cols-1 gap-3">
          {TASKS.map((task) => {
            const isHovered = hovered === task.id;
            const done = isDone(task.id);
            const attempts = attemptsOf(task.id);
            const exhausted = task.proofMode === "camera" && !done && attempts >= MAX_PROOF_ATTEMPTS_PER_DAY;
            const lastFeedback = !done ? claimOf(task.id)?.feedback : null;
            const badge = proofBadge(task.proofMode);
            const busy = busyTask === task.id;
            return (
              <button
                key={task.id}
                onClick={() => handleTaskClickInternal(task)}
                onMouseEnter={() => setHovered(task.id)}
                onMouseLeave={() => setHovered(null)}
                disabled={busy}
                className="relative flex items-stretch gap-3 rounded-2xl p-3 text-left transition-all active:scale-[0.99]"
                style={{
                  backgroundColor: SURFACE,
                  border: `1px solid ${done ? "rgba(52,199,89,0.45)" : isHovered ? HAIRLINE_STRONG : HAIRLINE}`,
                  opacity: exhausted ? 0.6 : 1,
                }}
              >
                {/* Left: image + rank + proof badge */}
                <div className="relative shrink-0 rounded-xl overflow-hidden" style={{ width: 84, height: 100 }}>
                  <div className="absolute inset-0" style={{ backgroundImage: `url(${task.image})`, backgroundSize: "cover", backgroundPosition: "center" }} />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.0) 40%, rgba(0,0,0,0.7) 100%)" }} />
                  <div
                    className="absolute bottom-1.5 left-1.5 flex items-center justify-center font-extrabold text-[12px]"
                    style={{ width: 22, height: 22, borderRadius: 6, backgroundColor: ORANGE, color: "#000" }}
                  >
                    {task.rank}
                  </div>
                  <div
                    className="absolute top-1.5 left-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded-md"
                    style={{ backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
                  >
                    {badge.icon}
                    <span className="text-[8px] font-extrabold tracking-wider uppercase" style={{ color: ORANGE }}>
                      {badge.label}
                    </span>
                  </div>
                  {done && (
                    <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
                      <CheckCircle2 size={30} style={{ color: IOS_GREEN }} />
                    </div>
                  )}
                </div>

                {/* Middle: JP label + title + desc + proof row */}
                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                  <div>
                    <div className="text-[9px] tracking-[0.2em] uppercase font-bold" style={{ color: TEXT_TERTIARY }}>
                      {task.jpLabel}
                    </div>
                    <div className="font-extrabold text-[15px] leading-tight mt-0.5 truncate" style={{ color: done ? IOS_GREEN : TEXT_PRIMARY }}>
                      {task.icon} {task.title}
                    </div>
                    <div className="text-[11px] mt-1 leading-snug line-clamp-2" style={{ color: TEXT_SECONDARY }}>
                      {task.description}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-[10px]" style={{ color: TEXT_TERTIARY }}>
                    <span className="font-bold" style={{ color: ORANGE }}>+{XP_PER_TASK} XP</span>
                    <span>·</span>
                    <span>
                      {task.proofMode === "camera"
                        ? done
                          ? `AI verified · score ${claimOf(task.id)?.score ?? "—"}`
                          : exhausted
                          ? "No attempts left today"
                          : `${MAX_PROOF_ATTEMPTS_PER_DAY - attempts}/${MAX_PROOF_ATTEMPTS_PER_DAY} attempts left`
                        : task.proofMode === "flips"
                        ? done ? "10 cards read" : "Read 10 affirmation cards"
                        : done ? "Logged" : "Tap to log · honor system"}
                    </span>
                  </div>
                  {lastFeedback && attempts > 0 && (
                    <div className="text-[10px] mt-1 leading-snug line-clamp-2" style={{ color: IOS_RED }}>
                      Last try: {lastFeedback}
                    </div>
                  )}
                </div>

                {/* Right: status */}
                <div className="shrink-0 flex flex-col items-end justify-between py-0.5">
                  <div
                    className="text-[10px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded-full"
                    style={{
                      color: done ? IOS_GREEN : exhausted ? IOS_RED : ORANGE,
                      border: `1px solid ${done ? "rgba(52,199,89,0.5)" : exhausted ? "rgba(255,69,58,0.5)" : "rgba(255,159,10,0.4)"}`,
                    }}
                  >
                    {done ? "Done" : exhausted ? "Locked" : task.proofMode === "camera" ? "Prove" : task.proofMode === "flips" ? "Read" : "Log"}
                  </div>
                  <div style={{ color: TEXT_TERTIARY }}>
                    {busy ? <Loader2 size={16} className="animate-spin" /> : done ? "✓" : "→"}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ===================== TOAST ===================== */}
      {toast && (
        <div
          className="fixed left-1/2 -translate-x-1/2 bottom-6 z-50 px-4 py-2.5 rounded-xl text-[12px] font-bold shadow-2xl"
          style={{
            backgroundColor: toast.ok ? "rgba(52,199,89,0.15)" : "rgba(255,69,58,0.15)",
            border: `1px solid ${toast.ok ? "rgba(52,199,89,0.5)" : "rgba(255,69,58,0.5)"}`,
            color: toast.ok ? IOS_GREEN : IOS_RED,
            backdropFilter: "blur(10px)",
          }}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
};

export default TaskListView;

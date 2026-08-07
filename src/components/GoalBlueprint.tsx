import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Flame, Shield, Compass, Clock,
  CheckCircle2, Camera,
} from "lucide-react";
import type { GoalBlueprint, BlueprintTask, GoalProgress } from "../types";
import GoalGraph from "./GoalGraph";
import AdaptiveIntelligence from "./AdaptiveIntelligence";
import ProofVerification from "./ProofVerification";

interface GoalBlueprintProps {
  blueprint: GoalBlueprint;
}

/* ── Single directive row with verify action ── */
function TaskRow({ task, index, onVerify }: {
  task: BlueprintTask;
  index: number;
  onVerify: () => void;
}) {
  const done = !!task.completed;
  const verified = !!task.verified;
  return (
    <div className="flex items-start gap-4 py-3" style={{ borderTop: index === 0 ? "none" : "1px solid var(--atelier-faint)" }}>
      <span className="chapter-num pt-0.5 shrink-0" style={{ minWidth: 28 }}>{String(index + 1).padStart(2, "0")}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-3 mb-1">
          <h4 className="text-[13px] font-semibold flex items-center gap-1.5" style={{ color: "var(--atelier-ink)", textDecoration: done ? "line-through" : "none", opacity: done ? 0.7 : 1 }}>
            {task.title}
          </h4>
          <div className="flex items-center gap-2 shrink-0">
            {task.priority === "High" && <span className="text-[9px] font-mono tracking-wider" style={{ color: "#C98B6B" }}>● {task.priority}</span>}
            {task.priority === "Medium" && <span className="text-[9px] font-mono tracking-wider" style={{ color: "var(--atelier-brass-soft)" }}>● {task.priority}</span>}
            {task.priority === "Low" && <span className="text-[9px] font-mono tracking-wider" style={{ color: "var(--atelier-muted)" }}>● {task.priority}</span>}
          </div>
        </div>
        <p className="text-[12px] leading-relaxed mb-2" style={{ color: "var(--atelier-muted)" }}>{task.description}</p>

        <div className="flex items-center gap-3">
          {done ? (
            <>
              <span className="eyebrow flex items-center gap-1" style={{ fontSize: 9, color: verified ? "var(--atelier-sage)" : "var(--atelier-muted)" }}>
                {verified ? <CheckCircle2 size={10} /> : <CheckCircle2 size={10} />}
                {verified ? `Verified · ${task.verificationScore}/100` : "Completed"}
              </span>
              {task.hasProofImage && <span className="eyebrow flex items-center gap-1" style={{ fontSize: 8, color: "var(--atelier-brass)" }}><Camera size={9} />photo</span>}
              <button onClick={onVerify} className="eyebrow ml-auto" style={{ fontSize: 9, color: "var(--atelier-brass)" }}>re-verify</button>
            </>
          ) : (
            <>
              <span className="eyebrow" style={{ fontSize: 9, color: "var(--atelier-brass)" }}>+{task.xp} xp</span>
              <span className="eyebrow flex items-center gap-1" style={{ fontSize: 9 }}><Clock size={9} />{task.estimated_minutes} min</span>
              <button
                onClick={onVerify}
                className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all hover:scale-[1.03]"
                style={{ background: "var(--atelier-brass)", color: "#0A0908", fontWeight: 700, fontSize: 10, letterSpacing: "0.08em" }}
              >
                <Camera size={11} /> Verify
              </button>
            </>
          )}
        </div>

        {/* Feedback line if verified */}
        {done && task.verificationFeedback && (
          <p className="text-[11px] italic mt-2 pt-2" style={{ color: verified ? "var(--atelier-sage)" : "#C98B6B", borderTop: "1px solid var(--atelier-faint)" }}>
            “{task.verificationFeedback}”
          </p>
        )}
      </div>
    </div>
  );
}

export default function GoalBlueprintView({ blueprint: initialBlueprint }: GoalBlueprintProps) {
  const [blueprint, setBlueprint] = useState<GoalBlueprint>(initialBlueprint);
  const [activeTab, setActiveTab] = useState<"map" | "tasks" | "mindset" | "detail">("tasks");
  const [verifyingTask, setVerifyingTask] = useState<number | null>(null);

  const tabs = [
    { id: "map", label: "Topology" },
    { id: "tasks", label: "Directives" },
    { id: "mindset", label: "Protocol" },
    { id: "detail", label: "Analysis" },
  ] as const;

  const markTaskVerified = (index: number, result: { verified: boolean; score: number; feedback: string; imageAttached: boolean; proofText: string }) => {
    setBlueprint((prev) => {
      const tasks = [...prev.daily_tasks];
      tasks[index] = {
        ...tasks[index],
        completed: true,
        completedAt: new Date().toISOString(),
        verified: result.verified,
        verificationScore: result.score,
        verificationFeedback: result.feedback,
        proofText: result.proofText,
        hasProofImage: result.imageAttached,
        verifiedAt: new Date().toISOString(),
      };
      return { ...prev, daily_tasks: tasks };
    });
  };

  const onProgress = (p: GoalProgress) => {
    setBlueprint((prev) => ({ ...prev, progress: p }));
  };

  const completedCount = blueprint.daily_tasks.filter((t) => t.completed).length;

  return (
    <div className="space-y-5">
      {/* ═══ MASTHEAD ═══ */}
      <div className="dossier atelier-grain rounded-[20px] overflow-hidden" style={{ animation: "dossier-rise 0.5s cubic-bezier(0.22,1,0.36,1)" }}>
        <div className="px-6 sm:px-8 pt-7 pb-5" style={{ borderBottom: "1px solid var(--atelier-faint)" }}>
          <div className="flex items-center justify-between mb-4">
            <span className="eyebrow flex items-center gap-2">
              <Compass size={11} style={{ color: "var(--atelier-brass)" }} />
              Strategic Dossier
            </span>
            <span className="eyebrow" style={{ color: blueprint.aiGenerated ? "var(--atelier-sage)" : "var(--atelier-muted)" }}>
              {blueprint.aiGenerated ? `◆ Authored by ${blueprint.modelUsed || "Gemini"}` : "○ Draft template · AI offline"}
            </span>
          </div>

          <h2 className="serif text-2xl sm:text-[28px] leading-[1.15] mb-4" style={{ color: "var(--atelier-ink)", fontWeight: 700, letterSpacing: "-0.02em" }}>
            {blueprint.goal_name}
          </h2>

          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
            <div className="flex items-baseline gap-1.5">
              <span className="figure text-xl">{blueprint.progress?.updatedSuccessProbability ?? blueprint.success_probability}</span>
              <span className="text-[11px]" style={{ color: "var(--atelier-muted)" }}>% success{blueprint.progress ? "" : " (base)"}</span>
            </div>
            <span style={{ color: "var(--atelier-faint)" }}>·</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[13px] font-semibold" style={{ color: "var(--atelier-ink)" }}>{blueprint.difficulty}</span>
              <span className="text-[11px]" style={{ color: "var(--atelier-muted)" }}>difficulty</span>
            </div>
            <span style={{ color: "var(--atelier-faint)" }}>·</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[13px] font-semibold" style={{ color: "var(--atelier-ink)" }}>{blueprint.estimated_duration}</span>
            </div>
            <span style={{ color: "var(--atelier-faint)" }}>·</span>
            <div className="flex items-baseline gap-1.5">
              <span className="figure text-xl">{completedCount}</span>
              <span className="text-[11px]" style={{ color: "var(--atelier-muted)" }}>/ {blueprint.daily_tasks.length} done</span>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="px-6 sm:px-8 flex items-center gap-6 overflow-x-auto scrollbar-none" style={{ borderBottom: "1px solid var(--atelier-faint)" }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id as any)} className="tab-ink whitespace-nowrap" data-active={activeTab === t.id}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Fallback notice */}
        {!blueprint.aiGenerated && (
          <div className="px-6 sm:px-8 py-3 flex items-center gap-2" style={{ background: "rgba(201,169,97,0.06)", borderBottom: "1px solid var(--atelier-faint)" }}>
            <span style={{ color: "var(--atelier-brass)", fontSize: 11 }}>⚠</span>
            <p className="text-[11px]" style={{ color: "var(--atelier-muted)" }}>
              {blueprint.fallbackReason || "AI offline — this is a tailored draft, not a live AI blueprint."}
            </p>
          </div>
        )}
      </div>

      {/* ═══ CONTENT ═══ */}
      <div className="px-1">
        <AnimatePresence mode="wait">
          {/* TOPOLOGY */}
          {activeTab === "map" && (
            <motion.div key="map" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>
              <div className="dossier atelier-grain rounded-[20px] p-5 sm:p-7">
                <GoalGraph blueprint={blueprint} />
              </div>
            </motion.div>
          )}

          {/* DIRECTIVES */}
          {activeTab === "tasks" && (
            <motion.div key="tasks" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }} className="space-y-4">
              <div className="dossier atelier-grain rounded-[20px] p-5 sm:p-7">
                <div className="flex items-baseline gap-3 mb-4">
                  <span className="chapter-num">01</span>
                  <h3 className="serif text-lg" style={{ color: "var(--atelier-ink)", fontWeight: 600 }}>Daily Directives</h3>
                </div>
                <div className="space-y-1">
                  {blueprint.daily_tasks.map((task, i) => (
                    <TaskRow key={i} task={task} index={i} onVerify={() => setVerifyingTask(i)} />
                  ))}
                </div>
              </div>

              {/* Adaptive intelligence appears once a task is done */}
              {completedCount > 0 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <AdaptiveIntelligence blueprint={blueprint} onProgress={onProgress} />
                </motion.div>
              )}

              {/* Habits */}
              <div className="dossier atelier-grain rounded-[20px] p-5 sm:p-7">
                <div className="flex items-baseline gap-3 mb-4">
                  <span className="chapter-num">02</span>
                  <h3 className="serif text-lg" style={{ color: "var(--atelier-ink)", fontWeight: 600 }}>Foundational Habits</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {blueprint.habits.map((habit, i) => (
                    <div key={i} className="p-4 rounded-lg" style={{ background: "var(--atelier-surface)", border: "1px solid var(--atelier-faint)" }}>
                      <div className="flex items-center justify-between mb-2">
                        <Flame size={13} style={{ color: "var(--atelier-sage)" }} />
                        <span className="tag-ink">{habit.time}</span>
                      </div>
                      <h4 className="text-[13px] font-semibold mb-1" style={{ color: "var(--atelier-ink)" }}>{habit.label}</h4>
                      <p className="text-[11px] leading-relaxed" style={{ color: "var(--atelier-muted)" }}>{habit.why}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* PROTOCOL */}
          {activeTab === "mindset" && (
            <motion.div key="mindset" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }} className="space-y-4">
              <div className="dossier atelier-grain rounded-[20px] p-5 sm:p-7">
                <div className="flex items-baseline gap-3 mb-4">
                  <span className="chapter-num">01</span>
                  <h3 className="serif text-lg" style={{ color: "var(--atelier-ink)", fontWeight: 600 }}>Identity Shift</h3>
                </div>
                <blockquote className="pullquote text-[15px] leading-relaxed">{blueprint.identity_shift}</blockquote>
              </div>
              <div className="dossier atelier-grain rounded-[20px] p-5 sm:p-7">
                <div className="flex items-baseline gap-3 mb-4">
                  <span className="chapter-num">02</span>
                  <h3 className="serif text-lg" style={{ color: "var(--atelier-ink)", fontWeight: 600 }}>Core Beliefs</h3>
                </div>
                <div className="space-y-3">
                  {blueprint.mindset.map((m, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <span className="chapter-num pt-0.5 shrink-0" style={{ minWidth: 28 }}>{String(i + 1).padStart(2, "0")}</span>
                      <p className="text-[13px] leading-relaxed" style={{ color: "#C9C0B0" }}>{m}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="dossier atelier-grain rounded-[20px] p-5 sm:p-7">
                <div className="flex items-baseline gap-3 mb-4">
                  <span className="chapter-num">03</span>
                  <h3 className="serif text-lg" style={{ color: "var(--atelier-ink)", fontWeight: 600 }}>Daily Affirmations</h3>
                </div>
                <div className="space-y-2.5">
                  {blueprint.affirmations.map((a, i) => (
                    <p key={i} className="serif italic text-[14px] py-2" style={{ color: "var(--atelier-ink)", borderTop: "1px solid var(--atelier-faint)" }}>{a}</p>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ANALYSIS */}
          {activeTab === "detail" && (
            <motion.div key="detail" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }} className="space-y-4">
              <div className="dossier atelier-grain rounded-[20px] p-5 sm:p-7">
                <div className="flex items-baseline gap-3 mb-3">
                  <span className="chapter-num">01</span>
                  <h3 className="serif text-lg" style={{ color: "var(--atelier-ink)", fontWeight: 600 }}>Visualization</h3>
                </div>
                <p className="text-[13px] leading-relaxed" style={{ color: "#C9C0B0" }}>{blueprint.visualization}</p>
              </div>
              <div className="dossier atelier-grain rounded-[20px] p-5 sm:p-7">
                <div className="flex items-baseline gap-3 mb-4">
                  <span className="chapter-num">02</span>
                  <h3 className="serif text-lg" style={{ color: "var(--atelier-ink)", fontWeight: 600 }}>Milestone Timeline</h3>
                </div>
                <div className="space-y-0">
                  {blueprint.milestones.map((m, i) => (
                    <div key={i} className="flex items-start gap-4 py-3" style={{ borderTop: "1px solid var(--atelier-faint)" }}>
                      <span className="chapter-num pt-0.5 shrink-0" style={{ minWidth: 28 }}>{String(i + 1).padStart(2, "0")}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-3 mb-0.5">
                          <h4 className="text-[13px] font-semibold" style={{ color: "var(--atelier-ink)" }}>{m.title}</h4>
                          <span className="eyebrow flex items-center gap-1 shrink-0" style={{ fontSize: 9 }}><Clock size={9} />{m.estimated_days}d</span>
                        </div>
                        <p className="text-[11px] leading-relaxed" style={{ color: "var(--atelier-muted)" }}>{m.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="dossier atelier-grain rounded-[20px] p-5 sm:p-7">
                <div className="flex items-baseline gap-3 mb-4">
                  <span className="chapter-num">03</span>
                  <h3 className="serif text-lg" style={{ color: "var(--atelier-ink)", fontWeight: 600 }}>Risk &amp; Contingency</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
                  {blueprint.obstacles.map((o, i) => (
                    <div key={"o" + i} className="flex items-start gap-2.5 py-1.5">
                      <Shield size={11} className="shrink-0 mt-0.5" style={{ color: "#C98B6B" }} />
                      <p className="text-[12px] leading-snug" style={{ color: "var(--atelier-muted)" }}>{o}</p>
                    </div>
                  ))}
                  {blueprint.solutions.map((s, i) => (
                    <div key={"s" + i} className="flex items-start gap-2.5 py-1.5">
                      <CheckCircle2 size={11} className="shrink-0 mt-0.5" style={{ color: "var(--atelier-sage)" }} />
                      <p className="text-[12px] leading-snug" style={{ color: "var(--atelier-muted)" }}>{s}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="dossier atelier-grain rounded-[20px] p-5 sm:p-7">
                <div className="flex items-baseline gap-3 mb-3">
                  <span className="chapter-num">04</span>
                  <h3 className="serif text-lg" style={{ color: "var(--atelier-ink)", fontWeight: 600 }}>Required Capabilities</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {blueprint.skills.map((s, i) => (
                    <span key={i} className="tag-ink">{s}</span>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Proof verification modal */}
      {verifyingTask !== null && blueprint.daily_tasks[verifyingTask] && (
        <ProofVerification
          task={blueprint.daily_tasks[verifyingTask]}
          taskIndex={verifyingTask}
          onClose={() => setVerifyingTask(null)}
          onVerified={(result) => markTaskVerified(verifyingTask, result)}
        />
      )}
    </div>
  );
}

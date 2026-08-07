import { useState } from "react";
import { motion } from "motion/react";
import { Activity, TrendingUp, Calendar, Flame, AlertTriangle } from "lucide-react";
import type { GoalBlueprint, GoalProgress } from "../types";

interface AdaptiveIntelligenceProps {
  blueprint: GoalBlueprint;
  onProgress: (p: GoalProgress) => void;
}

const RISK_COLOR: Record<string, string> = {
  Low: "#8FA98E",
  Medium: "#C9A961",
  High: "#C98B6B",
};

const TREND_ARROW: Record<string, string> = {
  rising: "▲",
  stable: "▬",
  declining: "▼",
};
const TREND_COLOR: Record<string, string> = {
  rising: "#8FA98E",
  stable: "#837A6D",
  declining: "#C98B6B",
};

function MetricBar({ label, value, delay }: { label: string; value: number; delay: number }) {
  const [shown, setShown] = useState(0);
  useState(() => { const t = setTimeout(() => setShown(value), delay + 100); return () => clearTimeout(t); });
  // trigger animation on mount/refresh
  if (shown === 0) setTimeout(() => setShown(value), delay + 100);
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="eyebrow" style={{ fontSize: 9 }}>{label}</span>
        <span className="figure" style={{ fontSize: 15 }}>{value}</span>
      </div>
      <div className="h-[3px] w-full rounded-full" style={{ background: "var(--atelier-faint)" }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: "linear-gradient(90deg, var(--atelier-brass-soft), var(--atelier-brass))" }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}

export default function AdaptiveIntelligence({ blueprint, onProgress }: AdaptiveIntelligenceProps) {
  const [loading, setLoading] = useState(false);
  const progress = blueprint.progress;

  const totalTasks = blueprint.daily_tasks.length;
  const completedTasks = blueprint.daily_tasks.filter((t) => t.completed).length;
  const verifiedTasks = blueprint.daily_tasks.filter((t) => t.verified).length;

  const recalculate = async () => {
    setLoading(true);
    try {
      const { recalculateGoal } = await import("../lib/goalApi");
      const p = await recalculateGoal({ blueprint });
      onProgress(p);
    } catch (e) {
      console.error("[adaptive] recalc failed", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dossier atelier-grain rounded-[20px] p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity size={14} style={{ color: "var(--atelier-brass)" }} />
          <span className="eyebrow">Adaptive Intelligence</span>
        </div>
        <button
          onClick={recalculate}
          disabled={loading}
          className="eyebrow flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all disabled:opacity-50"
          style={{ border: "1px solid var(--atelier-faint)", color: loading ? "var(--atelier-muted)" : "var(--atelier-ink)" }}
        >
          <TrendingUp size={11} className={loading ? "animate-pulse" : ""} style={{ color: "var(--atelier-brass)" }} />
          {loading ? "Analyzing…" : "Recalculate"}
        </button>
      </div>

      {/* Completion summary */}
      <div className="flex items-center gap-3 mb-5 pb-4" style={{ borderBottom: "1px solid var(--atelier-faint)" }}>
        <div className="flex items-baseline gap-1">
          <span className="figure" style={{ fontSize: 26 }}>{completedTasks}</span>
          <span className="text-[12px]" style={{ color: "var(--atelier-muted)" }}>/ {totalTasks} done</span>
        </div>
        <span style={{ color: "var(--atelier-faint)" }}>·</span>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--atelier-sage)" }} />
          <span className="eyebrow" style={{ fontSize: 9 }}>{verifiedTasks} verified</span>
        </div>
      </div>

      {!progress ? (
        <div className="text-center py-6">
          <p className="text-[12px] mb-3" style={{ color: "var(--atelier-muted)" }}>
            Complete directives and tap Recalculate to reveal your live momentum, discipline, and projected completion.
          </p>
          <button
            onClick={recalculate}
            disabled={loading || totalTasks === 0}
            className="eyebrow px-4 py-2 rounded-md transition-all disabled:opacity-40"
            style={{ background: "var(--atelier-brass)", color: "#0A0908", fontWeight: 700 }}
          >
            {loading ? "Analyzing…" : "Generate baseline"}
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Metric bars */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <MetricBar label="Momentum" value={progress.momentum} delay={0} />
            <MetricBar label="Discipline" value={progress.discipline} delay={0.08} />
            <MetricBar label="Execution" value={progress.execution} delay={0.16} />
            <MetricBar label="Focus" value={progress.focus} delay={0.24} />
          </div>

          {/* AI insight */}
          <div className="p-3 rounded-lg" style={{ background: "var(--atelier-surface)", border: "1px solid var(--atelier-faint)" }}>
            <div className="flex items-start gap-2">
              <span style={{ color: "var(--atelier-brass)", fontSize: 12 }}>◆</span>
              <p className="text-[12px] leading-relaxed" style={{ color: "var(--atelier-ink)" }}>{progress.aiInsight}</p>
            </div>
          </div>

          {/* Bottom stats: probability + projected + risks */}
          <div className="grid grid-cols-3 gap-3 pt-1">
            <div>
              <div className="flex items-center gap-1 mb-1">
                <TrendingUp size={10} style={{ color: "var(--atelier-muted)" }} />
                <span className="eyebrow" style={{ fontSize: 8 }}>Success</span>
              </div>
              <p className="figure" style={{ fontSize: 18, color: "var(--atelier-brass)" }}>{progress.updatedSuccessProbability}%</p>
            </div>
            <div>
              <div className="flex items-center gap-1 mb-1">
                <Calendar size={10} style={{ color: "var(--atelier-muted)" }} />
                <span className="eyebrow" style={{ fontSize: 8 }}>Projected</span>
              </div>
              <p className="text-[11px] font-semibold" style={{ color: "var(--atelier-ink)" }}>
                {new Date(progress.projectedCompletionDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-1 mb-1">
                <Flame size={10} style={{ color: TREND_COLOR[progress.momentumTrend] }} />
                <span className="eyebrow" style={{ fontSize: 8 }}>Trend</span>
              </div>
              <p className="text-[11px] font-semibold" style={{ color: TREND_COLOR[progress.momentumTrend] }}>
                {TREND_ARROW[progress.momentumTrend]} {progress.momentumTrend}
              </p>
            </div>
          </div>

          {/* Risks row */}
          <div className="flex items-center gap-4 pt-2" style={{ borderTop: "1px solid var(--atelier-faint)" }}>
            <div className="flex items-center gap-1.5">
              <AlertTriangle size={10} style={{ color: RISK_COLOR[progress.delayRisk] }} />
              <span className="eyebrow" style={{ fontSize: 8 }}>Delay</span>
              <span className="eyebrow" style={{ fontSize: 9, color: RISK_COLOR[progress.delayRisk] }}>{progress.delayRisk}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <AlertTriangle size={10} style={{ color: RISK_COLOR[progress.burnoutRisk] }} />
              <span className="eyebrow" style={{ fontSize: 8 }}>Burnout</span>
              <span className="eyebrow" style={{ fontSize: 9, color: RISK_COLOR[progress.burnoutRisk] }}>{progress.burnoutRisk}</span>
            </div>
            {progress.aiGenerated && (
              <span className="eyebrow ml-auto" style={{ fontSize: 8, color: "var(--atelier-sage)" }}>◆ AI-tuned</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

import { motion } from "motion/react";
import { Zap, Sparkles, Orbit } from "lucide-react";

interface StreakDisplayProps {
  streakDays: number;
}

export default function StreakDisplay({ streakDays }: StreakDisplayProps) {
  // Creating a beautiful 12-day quantum streak grid tracker representing their streak alignment
  const cycles = Array.from({ length: 12 }, (_, i) => ({
    day: i + 1,
    active: i < streakDays,
  }));

  return (
    <div
      id="progress-in-motion-card"
      className="relative rounded-[24px] bg-black border border-amber-500/[0.06] p-7 overflow-hidden flex flex-col justify-between accent-glow"
    >
      {/* Absolute decorative accent vectors */}

      {/* Header Row */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/5 border border-amber-500/10">
            <Orbit size={18} className="text-amber-400" />
          </div>
          <span className="text-sm font-sans font-semibold text-amber-50 tracking-tight uppercase tracking-[0.1em]">Daily Streak</span>
        </div>
        <span className="text-[10px] font-mono tracking-widest text-amber-200/30 uppercase bg-amber-500/3 border border-amber-500/5 px-3 py-1.5 rounded-full font-bold shadow-sm">
          Active
        </span>
      </div>

      {/* Main Copy */}
      <p className="text-sm text-amber-100/50 leading-relaxed font-sans mb-8">
        You are currently on a <strong className="text-amber-200 font-bold font-sans tracking-tight">{streakDays} day</strong> consistent habit streak. Show up every day to reinforce your focus and growth.
      </p>

      {/* Streak Grid Indicators representing consistency coordinates */}
      <div className="space-y-8">
        <div>
          <span className="text-[9px] font-mono text-amber-200/30 uppercase tracking-[0.2em] mb-4 block">
            Streak Track (12 Day Cycle)
          </span>
          <div className="grid grid-cols-6 sm:grid-cols-12 gap-2.5">
            {cycles.map((cycle) => (
              <div
                key={cycle.day}
                id={`streak-node-day-${cycle.day}`}
                className="relative flex flex-col items-center justify-center aspect-square rounded-xl border text-[10px] font-mono transition-all duration-300"
                style={{
                  backgroundColor: cycle.active ? "rgba(245, 158, 11, 0.1)" : "rgba(255, 255, 255, 0.02)",
                  borderColor: cycle.active ? "rgba(245, 158, 11, 0.35)" : "rgba(255, 255, 255, 0.06)",
                  color: cycle.active ? "#fbbf24" : "rgba(255, 255, 255, 0.2)",
                  boxShadow: cycle.active ? "0 0 10px rgba(245, 158, 11, 0.08)" : "none"
                }}
              >
                <span>{cycle.day}</span>
                {cycle.active && (
                  <motion.span
                    layoutId="activeStreakDot"
                    className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Small Glowing Progress Bars reflecting deeper system diagnostics */}
        <div className="space-y-5 pt-4 border-t border-amber-500/5">
          {/* Diagnostic Metric 1 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] font-mono text-amber-200/30 uppercase tracking-[0.2em]">
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.3)]" /> Focus Stability
              </span>
              <span className="text-amber-200/60">{Math.min(98, 50 + streakDays * 3)}%</span>
            </div>
            <div className="w-full h-1 rounded-full bg-amber-500/[0.06] overflow-hidden shadow-inner">
              <div className="h-full bg-amber-400 rounded-full" style={{ width: `${Math.min(98, 50 + streakDays * 3)}%` }} />
            </div>
          </div>

          {/* Diagnostic Metric 2 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] font-mono text-amber-200/30 uppercase tracking-[0.2em]">
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-300/70 shadow-[0_0_6px_rgba(251,191,36,0.2)]" /> Focus Rate
              </span>
              <span className="text-amber-200/60">{Math.min(98, 45 + streakDays * 4)}%</span>
            </div>
            <div className="w-full h-1 rounded-full bg-amber-500/[0.06] overflow-hidden shadow-inner">
              <div className="h-full bg-amber-300/70 rounded-full" style={{ width: `${Math.min(98, 45 + streakDays * 4)}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

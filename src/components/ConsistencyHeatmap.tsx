import { motion } from "motion/react";
import { Activity } from "lucide-react";
import { StreakEvent } from "../types";
import React, { memo } from "react";

interface ConsistencyHeatmapProps {
  activeDays: string[];
  events: StreakEvent[];
  last90: string[];
}

function ConsistencyHeatmapComponent({ activeDays, events, last90 }: ConsistencyHeatmapProps) {
  // We have exactly 90 days. Reverse them to go from oldest to newest for the grid.
  const dates = [...last90].reverse();

  return (
    <div className="w-full flex flex-col h-[300px]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity size={14} className="text-emerald-300/50" />
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-emerald-200/40">90-Day Matrix</span>
        </div>
        <div className="flex items-center gap-1.5 text-[8px] font-mono uppercase text-white/30">
          <span>Less</span>
          <div className="flex gap-0.5">
            <div className="w-2 h-2 rounded-[2px] bg-white/[0.02] border border-white/5" />
            <div className="w-2 h-2 rounded-[2px] bg-emerald-500/20 border border-emerald-500/20" />
            <div className="w-2 h-2 rounded-[2px] bg-emerald-500/50 border border-emerald-500/40" />
            <div className="w-2 h-2 rounded-[2px] bg-emerald-400 border border-emerald-400/50" />
          </div>
          <span>More</span>
        </div>
      </div>

      <div className="flex-1 w-full overflow-x-auto pb-2 scrollbar-none">
        <div className="grid grid-rows-7 grid-flow-col gap-1 w-max">
          {dates.map((date) => {
            const active = activeDays.includes(date);
            const intensity = events.filter((e) => e.localDate === date).length;
            return (
              <div
                key={date}
                title={`${date}: ${intensity} actions`}
                className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-[2px] border transition-all duration-300 hover:scale-125 ${
                  active
                    ? intensity > 2
                      ? "border-emerald-200/40 bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.4)] z-10"
                      : intensity > 1
                      ? "border-emerald-400/30 bg-emerald-500/80 shadow-[0_0_6px_rgba(16,185,129,0.2)]"
                      : "border-emerald-500/20 bg-emerald-500/40"
                    : "border-white/5 bg-white/[0.02]"
                }`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default memo(ConsistencyHeatmapComponent);

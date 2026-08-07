import { useState, useEffect } from "react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip,
} from "recharts";
import { EnergyPoint } from "../types";

interface AlignmentChartProps {
  data: EnergyPoint[];
}

export default function AlignmentChart({ data }: AlignmentChartProps) {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => { setIsMounted(true); }, []);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-silver rounded-xl p-3 shadow-2xl">
          <p className="text-white/40 font-mono text-[9px] tracking-widest uppercase mb-2">{label}</p>
          <div className="space-y-1.5">
            {payload.map((item: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between gap-8">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color, boxShadow: `0 0 6px ${item.color}` }} />
                  <span className="text-white/60 text-xs capitalize">{item.name}</span>
                </div>
                <span className="text-white text-sm font-mono font-bold">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  if (!isMounted) {
    return <div className="w-full h-[240px] rounded-2xl bg-white/[0.02] animate-pulse" />;
  }

  return (
    <div className="w-full space-y-3">
      <div className="relative space-bg rounded-2xl overflow-hidden border border-white/[0.04]" style={{ height: 220 }}>
        {/* Ambient glow behind chart */}
        <div className="absolute top-0 left-1/4 w-32 h-32 bg-purple-500/5 blur-[60px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-28 h-28 bg-cyan-500/4 blur-[60px] rounded-full" />

        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ top: 10, right: 5, left: -35, bottom: 0 }}>
            <defs>
              {/* Cyan - Belief */}
              <linearGradient id="gBelief" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
              </linearGradient>
              {/* Purple - Emotion */}
              <linearGradient id="gEmotion" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
              {/* Gold - Action */}
              <linearGradient id="gAction" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 6" stroke="rgba(255,255,255,0.03)" vertical={false} />
            <XAxis dataKey="day" axisLine={false} tickLine={false}
              tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 8, fontFamily: "monospace" }} dy={10} />
            <YAxis domain={[0, 100]} hide />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(255,255,255,0.08)", strokeWidth: 1 }} />

            {/* Action - Gold */}
            <Area type="monotone" dataKey="action" stroke="#f59e0b" strokeWidth={2}
              fill="url(#gAction)" animationDuration={1800}
              activeDot={{ r: 4, fill: "#f59e0b", stroke: "#07090F", strokeWidth: 1 }} />

            {/* Emotion - Purple */}
            <Area type="monotone" dataKey="emotion" stroke="#8b5cf6" strokeWidth={2}
              fill="url(#gEmotion)" animationDuration={1500}
              activeDot={{ r: 4, fill: "#8b5cf6", stroke: "#07090F", strokeWidth: 1 }} />

            {/* Belief - Cyan */}
            <Area type="monotone" dataKey="belief" stroke="#22d3ee" strokeWidth={2}
              fill="url(#gBelief)" animationDuration={1200}
              activeDot={{ r: 4, fill: "#22d3ee", stroke: "#07090F", strokeWidth: 1 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6">
        <div className="flex items-center gap-2">
          <span className="w-3 h-[2px] rounded-full bg-cyan-400" style={{ boxShadow: "0 0 6px #22d3ee" }} />
          <span className="text-[9px] font-mono uppercase tracking-wider text-cyan-400/70">Belief</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-[2px] rounded-full bg-purple-400" style={{ boxShadow: "0 0 6px #8b5cf6" }} />
          <span className="text-[9px] font-mono uppercase tracking-wider text-purple-400/70">Emotion</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-[2px] rounded-full bg-amber-400" style={{ boxShadow: "0 0 6px #f59e0b" }} />
          <span className="text-[9px] font-mono uppercase tracking-wider text-amber-400/70">Action</span>
        </div>
      </div>
    </div>
  );
}

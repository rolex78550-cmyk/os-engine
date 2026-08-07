import { motion } from "motion/react";

interface MetricRingProps {
  value: number;
  size?: number;
  strokeWidth?: number;
}

export default function MetricRing({ value, size = 160, strokeWidth = 10 }: MetricRingProps) {
  const safeValue = Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (safeValue / 100) * circumference;

  return (
    <div id="metric-ring" className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="w-full h-full transform -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <defs>
          {/* Gold→Cyan gradient ring */}
          <linearGradient id="luxRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="50%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
          {/* Glow filter */}
          <filter id="luxGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#f59e0b" floodOpacity="0.6" />
          </filter>
        </defs>

        {/* Dark track */}
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={strokeWidth} />

        {/* Progress ring with gradient */}
        <motion.circle
          cx={size/2} cy={size/2} r={radius}
          fill="none" stroke="url(#luxRingGrad)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          strokeLinecap="round"
          filter="url(#luxGlow)"
        />

        {/* Glowing endpoint dot - use safeValue to prevent NaN */}
        <motion.circle
          cx={size/2 + radius * Math.cos(((safeValue/100) * 360 * Math.PI) / 180)}
          cy={size/2 + radius * Math.sin(((safeValue/100) * 360 * Math.PI) / 180)}
          r="5" fill="#fbbf24"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="shadow-[0_0_16px_rgba(251,191,36,0.8)]"
        />
      </svg>

      {/* Center content */}
      <div className="absolute flex flex-col items-center justify-center text-center">
        <motion.div
          className="flex items-baseline"
          initial={{ scale: 0.75, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <span className="stat-number text-4xl sm:text-5xl text-white">{value}</span>
          <span className="text-xl font-medium text-amber-400/50 ml-0.5">%</span>
        </motion.div>
        <motion.div
          className="flex items-center gap-1.5 mt-1 text-[10px] font-mono tracking-[0.2em] text-white/30 uppercase"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <span className="w-1 h-1 rounded-full bg-cyan-400/70" />
          Aligned
        </motion.div>
      </div>
    </div>
  );
}

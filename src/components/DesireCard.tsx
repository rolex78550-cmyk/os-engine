import { motion } from "motion/react";
import { Sparkles, SlidersHorizontal, Compass, Trophy } from "lucide-react";
import { Desire } from "../types";

interface DesireCardProps {
  key?: string;
  desire: Desire;
  activeCalibrationId: string | null;
  onStartCalibration: (id: string) => void;
  onUpdateMetric: (id: string, metric: "beliefLevel" | "emotionalState" | "consistencyScore", value: number) => void;
  onCloseCalibration: () => void;
}

export default function DesireCard({
  desire,
  activeCalibrationId,
  onStartCalibration,
  onUpdateMetric,
  onCloseCalibration,
}: DesireCardProps) {
  const isCalibrating = activeCalibrationId === desire.id;

  return (
    <div
      id={`desire-card-${desire.id}`}
      className="relative flex-shrink-0 w-[280px] sm:w-[320px] rounded-[24px] bg-card-bg border border-border-subtle p-7 text-white overflow-hidden transition-all duration-300 hover:border-white/15 accent-glow"
    >
      {/* Decorative cosmic alignment background glow */}
      <div 
        className="absolute -top-12 -right-12 w-32 h-32 rounded-full  opacity-20 pointer-events-none" 
        style={{
          background: "rgba(255, 255, 255, 0.05)"
        }}
      />

      <div className="flex flex-col h-full justify-between">
        {/* Top Header */}
        <div>
          <div className="flex items-start justify-between mb-8">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/5 shadow-inner">
              <span className="text-2xl" id={`desire-icon-${desire.id}`}>{desire.icon}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-mono tracking-widest text-text-muted uppercase py-1 px-3 rounded-full border border-border-subtle bg-white/3">
                {desire.expectedReality}
              </span>
              <span className="text-[9px] font-mono text-text-muted mt-1.5 uppercase tracking-[0.15em]">{desire.category}</span>
            </div>
          </div>

          <h3 className="text-lg font-display font-semibold text-white tracking-tight leading-tight mb-8" id={`desire-title-${desire.id}`}>
            {desire.title}
          </h3>
        </div>

        {/* Dynamic Inner Body (Progress State) */}
        {!isCalibrating ? (
          <div>
            {/* Progress Metrics Row */}
            <div className="flex items-end justify-between text-[10px] mb-3 font-mono uppercase tracking-[0.2em]">
              <span className="text-text-muted">Progress</span>
              <span className="text-white font-bold">{desire.progress}%</span>
            </div>

            {/* Glowing Custom Progress Track */}
            <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden mb-8 shadow-inner">
              <motion.div
                className="h-full rounded-full premium-gradient"
                initial={{ width: 0 }}
                animate={{ width: `${desire.progress}%` }}
                transition={{ duration: 1.2, ease: "circOut" }}
              />
            </div>

            {/* Trigger Calibration Action Button */}
            <button
              id={`calibrate-btn-${desire.id}`}
              onClick={() => onStartCalibration(desire.id)}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 px-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 text-[10px] uppercase font-mono tracking-widest text-text-secondary hover:text-white transition-all duration-300 hover-lift"
            >
              <SlidersHorizontal size={14} className="text-white" />
              Adjust Metrics
            </button>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-5 bg-black  p-5 rounded-3xl border border-white/10 mt-2 shadow-2xl"
          >
            <div className="text-[10px] font-mono tracking-widest text-text-muted uppercase flex items-center justify-between mb-2">
              <span>Adjustment</span>
              <button onClick={onCloseCalibration} className="text-white hover:underline cursor-pointer font-bold">Done</button>
            </div>

            {/* Belief Level Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] font-mono text-text-secondary uppercase tracking-tighter">
                <span>Mindset Focus</span>
                <span className="text-white font-bold">{desire.beliefLevel}%</span>
              </div>
              <input
                id={`belief-slider-${desire.id}`}
                type="range"
                min="10"
                max="100"
                value={desire.beliefLevel}
                onChange={(e) => onUpdateMetric(desire.id, "beliefLevel", Number(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
              />
            </div>

            {/* Emotional Alignment State Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] font-mono text-text-secondary uppercase tracking-tighter">
                <span>Feeling Focus</span>
                <span className="text-white/70 font-bold">{desire.emotionalState}%</span>
              </div>
              <input
                id={`emotion-slider-${desire.id}`}
                type="range"
                min="10"
                max="100"
                value={desire.emotionalState}
                onChange={(e) => onUpdateMetric(desire.id, "emotionalState", Number(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
              />
            </div>

            {/* Consistency/Action Score Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] font-mono text-text-secondary uppercase tracking-tighter">
                <span>Consistency</span>
                <span className="text-white font-bold">{desire.consistencyScore}%</span>
              </div>
              <input
                id={`consistency-slider-${desire.id}`}
                type="range"
                min="10"
                max="100"
                value={desire.consistencyScore}
                onChange={(e) => onUpdateMetric(desire.id, "consistencyScore", Number(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
              />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

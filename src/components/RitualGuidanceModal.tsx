import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Sparkles, Send, Play, Pause, RefreshCw, Star } from "lucide-react";

interface RitualGuidanceModalProps {
  ritualId: string | null;
  onClose: () => void;
  onComplete: (ritualId: string, text?: string) => void;
}

export default function RitualGuidanceModal({ ritualId, onClose, onComplete }: RitualGuidanceModalProps) {
  const [breatheState, setBreatheState] = useState<"inhale" | "hold" | "exhale">("inhale");
  const [secondsLeft, setSecondsLeft] = useState(15);
  const [timerActive, setTimerActive] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [currentStep, setCurrentStep] = useState(1);

  // Breathing guidance intervals
  useEffect(() => {
    if (ritualId !== "visualization") return;
    
    const interval = setInterval(() => {
      setBreatheState((prev) => {
        if (prev === "inhale") return "hold";
        if (prev === "hold") return "exhale";
        return "inhale";
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [ritualId]);

  // Breathing timer counter
  useEffect(() => {
    if (!timerActive || secondsLeft <= 0) {
      if (secondsLeft === 0) setTimerActive(false);
      return;
    }
    const timer = setTimeout(() => setSecondsLeft(secondsLeft - 1), 1000);
    return () => clearTimeout(timer);
  }, [timerActive, secondsLeft]);

  if (!ritualId) return null;

  // Render contextual content according to exact clicked ritual
  const getRitualData = () => {
    switch (ritualId) {
      case "visualization":
        return {
          title: "Quantum Visualization Focus",
          description: "Close your eyes and sensory-project yourself into the reality of having already accomplished your active desire. Rest in complete sensory certainty.",
          instruction: "Follow the respiratory swell pattern below to stabilize your autonomic state.",
        };
      case "gratitude":
        return {
          title: "Sovereign Gratitude Call",
          description: "Declare what you are deeply grateful for right now. Gratitude is the matching frequency of already receiving the manifestation.",
          placeholder: "I am profoundly grateful for...",
        };
      case "affirmations":
        return {
          title: "Divine Affirmation Tuning",
          description: "Type a core conviction in the absolute present state. It must carry visceral confidence.",
          placeholder: "I am the embodiment of...",
        };
      case "scripting":
        return {
          title: "Future-Self Scripting",
          description: "Write a diary entry from 12 months in the future. Write with absolute detail: what you see, feel, and touch.",
          placeholder: "It is now 12 months later, and my life has transformed...",
        };
      case "the369method":
        return {
          title: "369 Quantum Projector",
          description: "Write your active focus twice to complete the sequence: 3 times in the morning (focus details), 6 times in the afternoon (emotional charging), 9 times at night (complete surrender).",
          placeholder: "I align with...",
        };
      default:
        return {
          title: "Ritual Alignment",
          description: "Engage in focal grounding to clear logical resistance states.",
          placeholder: "Enter details...",
        };
    }
  };

  const data = getRitualData();

  const handleCompleteSubmit = () => {
    onComplete(ritualId, userInput);
    onClose();
  };

  return (
    <div id="ritual-modal-backdrop" className="fixed inset-0 bg-black/95  z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg rounded-3xl bg-black border border-white/5 overflow-hidden text-white"
        id="ritual-modal-content"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <Sparkles size={18} className="text-white" />
            <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-text-muted font-bold">Calibration session</span>
          </div>
          <button
            id="close-ritual-modal-btn"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-text-muted hover:text-white transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Main Context */}
          <div>
            <h2 className="text-xl font-sans font-bold text-white tracking-wide mb-2">
              {data.title}
            </h2>
            <p className="text-sm text-gray-400 font-sans leading-relaxed">
              {data.description}
            </p>
          </div>

          {/* Interactive Core: Breathing Guide for Visualization */}
          {ritualId === "visualization" && (
            <div className="flex flex-col items-center justify-center py-6 space-y-8 bg-black/30 rounded-2xl border border-white/5">
              {/* Pulsing Breathing Bubble */}
              <div className="relative flex items-center justify-center w-32 h-32">
                <AnimatePresence mode="popLayout">
                  <motion.div
                    key={breatheState}
                    initial={{ scale: breatheState === "inhale" ? 0.7 : breatheState === "hold" ? 1.2 : 1.2, opacity: 0.3 }}
                    animate={{ scale: breatheState === "hold" ? 1.2 : breatheState === "inhale" ? 1.2 : 0.7, opacity: 0.8 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 4, ease: "easeInOut" }}
                    className="absolute inset-0 rounded-full bg-white/5 border border-white/20 flex items-center justify-center shadow-lg"
                  />
                </AnimatePresence>
                
                <span className="absolute text-[10px] font-mono uppercase tracking-[0.2em] text-white font-bold">
                  {breatheState}
                </span>
              </div>

              {/* Support copy */}
              <div className="text-center px-6">
                <p className="text-xs text-text-muted mb-6 leading-relaxed">{data.instruction}</p>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => {
                      setTimerActive(!timerActive);
                      if (secondsLeft === 0) setSecondsLeft(15);
                    }}
                    className="flex items-center gap-2 py-2 px-6 rounded-2xl bg-white/5 hover:bg-white/10 border border-border-subtle text-[10px] text-white font-mono uppercase tracking-widest font-bold transition-all cursor-pointer"
                  >
                    {timerActive ? <Pause size={12} /> : <Play size={12} />}
                    {timerActive ? "Pause" : secondsLeft === 15 ? "Begin" : "Resume"}
                  </button>
                  <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest font-bold">
                    Focus: {secondsLeft}s
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Interactive Core: Writing terminals for the journaling components */}
          {ritualId !== "visualization" && (
            <div className="space-y-4">
              <textarea
                id="ritual-input-area"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder={data.placeholder}
                rows={4}
                className="w-full bg-white/3 border border-border-subtle focus:border-accent-cyan/30 rounded-2xl p-5 text-sm text-white placeholder-text-muted outline-none transition-all resize-none shadow-inner"
              />

              {/* 369 Support Indicators */}
              {ritualId === "the369method" && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white/3 border border-border-subtle rounded-2xl p-3 text-center shadow-inner">
                    <span className="block text-[10px] font-mono font-bold text-white/80 uppercase tracking-widest">03 Focus</span>
                    <span className="text-[9px] font-mono text-text-muted uppercase tracking-tighter">Morning</span>
                  </div>
                  <div className="bg-white/3 border border-border-subtle rounded-2xl p-3 text-center shadow-inner">
                    <span className="block text-[10px] font-mono font-bold text-white/80 uppercase tracking-widest">06 Charge</span>
                    <span className="text-[9px] font-mono text-text-muted uppercase tracking-tighter">Afternoon</span>
                  </div>
                  <div className="bg-white/3 border border-border-subtle rounded-2xl p-3 text-center shadow-inner">
                    <span className="block text-[10px] font-mono font-bold text-white uppercase tracking-widest">09 Release</span>
                    <span className="text-[9px] font-mono text-text-muted uppercase tracking-tighter">Night</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-white/5 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/3 hover:bg-white/5 text-xs text-gray-400 font-sans cursor-pointer"
          >
            Cancel
          </button>
          
          <button
            id="crystallize-frequency-btn"
            onClick={handleCompleteSubmit}
            disabled={ritualId !== "visualization" && userInput.trim().length === 0}
            className="flex items-center gap-2 py-3 px-8 rounded-2xl bg-white text-black font-display font-bold text-[10px] tracking-[0.2em] uppercase transition-all cursor-pointer hover-lift shadow-lg"
          >
            <Star size={14} className="stroke-[3]" />
            Crystallize
          </button>
        </div>
      </motion.div>
    </div>
  );
}

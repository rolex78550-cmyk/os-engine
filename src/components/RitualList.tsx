import React from "react";
import { useState, useEffect } from "react";
import { Check, Flame, ChevronRight, Plus, Trash2, X } from "lucide-react";
import { motion } from "motion/react";
import { RitualItem } from "../types";

interface RitualListProps {
  items: RitualItem[];
  onToggleItem: (id: string) => void;
  onLaunchRitualGuidance: (ritualId: string) => void;
  onAddRitual?: (label: string, timeOfDay: "morning" | "noon" | "night" | "any") => void;
  onDeleteRitual?: (id: string) => void;
}

/** Local YYYY-MM-DD (user timezone) — resets at local midnight */
function getLocalTodayStr() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function RitualList({ 
  items = [], 
  onToggleItem, 
  onLaunchRitualGuidance,
  onAddRitual,
  onDeleteRitual
}: RitualListProps) {
  const [tick, setTick] = useState(0);
  const today = getLocalTodayStr();

  // Re-render every 60s so checkboxes auto-reset at local midnight
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  const completedCount = (items || []).filter((item) => 
    item.lastCompletedDate === today || (item.completedDates || []).includes(today)
  ).length;
  const isFullyComplete = completedCount === (items || []).length && (items || []).length > 0;

  const [isAdding, setIsAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newTime, setNewTime] = useState<"morning" | "noon" | "night" | "any">("any");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;
    if (onAddRitual) {
      onAddRitual(newLabel, newTime);
    }
    setNewLabel("");
    setIsAdding(false);
  };

  return (
    <div
      id="daily-ritual-tracker"
      className="rounded-[24px] bg-black border border-amber-500/[0.06] p-7 relative overflow-hidden"
    >
      {/* Header Row */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/5 border border-amber-500/10">
            <Flame size={18} className="text-amber-400" />
          </div>
          <span className="text-sm font-display font-semibold text-amber-50 tracking-tight uppercase tracking-[0.1em]">Daily Rituals</span>
        </div>
 
        {/* Dynamic Completion Badge */}
        <div 
          id="ritual-completion-badge"
          className="flex items-center gap-2 transition-all duration-500"
        >
          <span className="text-[10px] font-mono font-medium text-amber-200/30 uppercase tracking-[0.2em]">Flow:</span>
          <span 
            className="text-[10px] font-mono font-bold px-3.5 py-1.5 rounded-full border transition-all duration-300 uppercase tracking-widest shadow-inner scale-105"
            style={{
              backgroundColor: isFullyComplete ? "rgba(245, 158, 11, 0.1)" : "rgba(245, 158, 11, 0.03)",
              borderColor: isFullyComplete ? "rgba(245, 158, 11, 0.25)" : "rgba(245, 158, 11, 0.08)",
              color: isFullyComplete ? "#fbbf24" : "var(--color-text-secondary)",
            }}
          >
            {completedCount}/{items.length} Done
          </span>
        </div>
      </div>
 
      {/* Core Checklist */}
      <div className="grid gap-3" id="checklist">
        {items.map((item) => {
          const isDoneToday = item.lastCompletedDate === today || (item.completedDates || []).includes(today);
          return (
            <motion.div
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={item.id}
              id={`ritual-row-${item.id}`}
              className={`relative overflow-hidden flex items-center justify-between p-4 rounded-2xl border transition-all duration-500 ${
                isDoneToday 
                  ? 'bg-emerald-500/[0.05] border-emerald-500/30 shadow-[inset_0_0_20px_rgba(16,185,129,0.05)]' 
                  : 'bg-black border-white/10 hover:border-amber-500/30 hover:bg-white/[0.02]'
              }`}
            >
              {isDoneToday && (
                <div className="absolute -right-8 -top-8 w-24 h-24 bg-emerald-500/20 blur-2xl rounded-full" />
              )}
              
              {/* Clickable checklist box area */}
              <button
                onClick={() => onToggleItem(item.id)}
                className="flex items-center gap-4 text-left flex-grow cursor-pointer select-none relative z-10"
                id={`ritual-toggle-btn-${item.id}`}
                type="button"
              >
                <div
                  className={`w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all duration-300 shadow-sm flex-shrink-0 ${
                    isDoneToday 
                      ? "bg-emerald-500 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]" 
                      : "bg-transparent border-white/20"
                  }`}
                >
                  {isDoneToday && <Check size={16} className="text-black stroke-[3.5]" />}
                </div>
                <div className="flex flex-col">
                  <span
                    className={`text-base tracking-tight transition-all duration-300 font-sans font-bold ${
                      isDoneToday ? "text-emerald-50/60 line-through" : "text-white"
                    }`}
                  >
                    {item.label}
                  </span>
                  {item.timeOfDay && item.timeOfDay !== "any" && (
                    <span className={`text-[10px] font-mono uppercase tracking-widest mt-1 ${isDoneToday ? "text-emerald-500/40" : "text-amber-400/50"}`}>
                      🌅 {item.timeOfDay}
                    </span>
                  )}
                </div>
              </button>
 
              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-shrink-0 relative z-10">
                {/* Micro Quick Start Guidance Button */}
                {!isDoneToday && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onLaunchRitualGuidance(item.id);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-all text-[10px] font-mono uppercase tracking-[0.2em] flex items-center gap-1 cursor-pointer font-bold"
                  >
                    Tune <ChevronRight size={12} />
                  </button>
                )}

                {/* Delete Custom Habit */}
                {onDeleteRitual && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Are you sure you want to delete "${item.label}"?`)) {
                        onDeleteRitual(item.id);
                      }
                    }}
                    className="p-2 rounded-lg bg-white/5 text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-all cursor-pointer"
                    title="Delete Habit"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}

        {items.length === 0 && (
          <div className="text-center py-8 text-amber-200/30 font-mono text-xs">
            No habits listed. Click the button below to add your first daily ritual!
          </div>
        )}
      </div>

      {/* Add Custom Habit Form inline trigger */}
      {!isAdding ? (
        <button
          onClick={() => setIsAdding(true)}
          className="mt-5 w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-amber-500/[0.01] border border-dashed border-amber-500/10 hover:border-amber-500/20 text-xs font-mono text-amber-200/30 hover:text-amber-200 transition-all cursor-pointer"
        >
          <Plus size={14} />
          Add Custom Habit (Gym, Meditation, etc.)
        </button>
      ) : (
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-5 p-5 rounded-2xl bg-amber-500/[0.02] border border-rose-500/10 space-y-4"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-amber-200/30 uppercase tracking-widest font-bold">New Custom Daily Habit</span>
            <button 
              type="button" 
              onClick={() => { setIsAdding(false); setNewLabel(""); }} 
              className="text-amber-200/30 hover:text-amber-200 cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="e.g., Morning Gym Workout, 20 Min Vipassana"
                className="w-full bg-black border border-amber-500/10 rounded-xl px-4 py-3 text-sm text-amber-50 placeholder-amber-200/20 outline-none focus:border-amber-500/20 transition-all"
                autoFocus
                required
              />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-mono text-amber-200/30 uppercase tracking-widest font-semibold block">Preferred Schedule</span>
              <div className="grid grid-cols-4 gap-2">
                {(["morning", "noon", "night", "any"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setNewTime(t)}
                    className={`py-2 px-1 rounded-lg text-[9px] font-mono uppercase tracking-wider font-bold transition-all cursor-pointer text-center ${
                      newTime === t ? "bg-amber-400 text-black font-extrabold" : "bg-amber-500/5 text-amber-200/40 hover:bg-amber-500/10 hover:text-amber-200"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-amber-500/5">
              <button
                type="button"
                onClick={() => { setIsAdding(false); setNewLabel(""); }}
                className="px-4 py-2 text-[10px] font-mono uppercase tracking-widest text-amber-200/30 hover:text-amber-200 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newLabel.trim()}
                className="px-5 py-2.5 rounded-xl bg-amber-400 text-black font-sans font-bold text-[10px] uppercase tracking-widest transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none hover:bg-amber-300"
              >
                Assemble Habit
              </button>
            </div>
          </div>
        </motion.form>
      )}
    </div>
  );
}

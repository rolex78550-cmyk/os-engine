import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, Sparkles } from "lucide-react";

export type UniversePortalEvent = {
  id: number;
  title: string;
  message: string;
  icon?: string;
  source?: "ritual" | "journal" | "quest" | "academy" | "community" | "goal" | "achievement";
};

interface UniversePortalAnimationProps {
  event: UniversePortalEvent | null;
  onComplete: () => void;
}

const sourceLabel: Record<NonNullable<UniversePortalEvent["source"]>, string> = {
  ritual: "Ritual Signal",
  journal: "Scripted Timeline",
  quest: "Quest Proof",
  academy: "Academy Code",
  community: "Community Broadcast",
  goal: "Goal Blueprint",
  achievement: "Achievement Reveal",
};

export default function UniversePortalAnimation({ event, onComplete }: UniversePortalAnimationProps) {
  return (
    <AnimatePresence>
      {event && (
        <motion.div
          key={event.id}
          className="fixed inset-0 z-[140] pointer-events-none flex items-center justify-center overflow-hidden bg-black/90 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          onAnimationComplete={() => undefined}
        >
          {/* Black Hole Effect Container */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[800px] aspect-square flex items-center justify-center">
            
            {/* Dark core */}
            <motion.div 
              className="absolute z-20 w-32 h-32 md:w-48 md:h-48 rounded-full bg-black shadow-[inset_0_0_50px_rgba(0,0,0,1)]"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
              style={{ boxShadow: '0 0 100px 20px rgba(0,0,0,0.9), inset 0 0 20px 20px rgba(0,0,0,1)' }}
            />

            {/* Event Horizon (Bright inner ring) */}
            <motion.div
              className="absolute z-10 rounded-full border-2 border-orange-400/80 mix-blend-screen"
              style={{ width: '130px', height: '130px', boxShadow: '0 0 60px 10px rgba(255,165,0,0.8)' }}
              initial={{ scale: 0, rotate: 0 }}
              animate={{ scale: [0, 1.2, 1.5], rotate: 360 }}
              transition={{ duration: 3, ease: "easeOut" }}
            />
            
            <motion.div
              className="absolute z-10 rounded-full border border-amber-300/60 mix-blend-screen"
              style={{ width: '150px', height: '150px', boxShadow: '0 0 80px 20px rgba(255,100,0,0.6)' }}
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: [0, 1.5, 2], rotate: -360 }}
              transition={{ duration: 3.5, ease: "easeOut" }}
            />

            {/* Accretion Disk (Swirling glowing dust rings) */}
            {Array.from({ length: 4 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute z-0 rounded-full border border-orange-500/20 mix-blend-screen hidden md:block"
                style={{ 
                  width: `${200 + i * 80}px`, 
                  height: `${200 + i * 80}px`,
                  boxShadow: `0 0 ${40 + i * 10}px ${5 + i * 2}px rgba(255,${140 - i * 10},0,0.15), inset 0 0 ${30 + i * 10}px rgba(255,80,0,0.1)`
                }}
                initial={{ opacity: 0, rotateX: 60, rotateY: 10, rotateZ: 0, scale: 0.5 }}
                animate={{ 
                  opacity: [0, 0.8, 0.4], 
                  rotateZ: 360, 
                  scale: [0.5, 1, 1.1] 
                }}
                transition={{ 
                  duration: 4 + i * 0.5, 
                  repeat: Infinity, 
                  repeatType: 'reverse', 
                  ease: "linear" 
                }}
              />
            ))}

            {/* Particle Swarm pulling into the hole */}
            {Array.from({ length: window.innerWidth < 768 ? 20 : 60 }).map((_, i) => (
              <motion.div
                key={`p-${i}`}
                className="absolute rounded-full mix-blend-screen"
                style={{
                  width: Math.random() * 3 + 1 + 'px',
                  height: Math.random() * 3 + 1 + 'px',
                  backgroundColor: Math.random() > 0.5 ? '#fca5a5' : '#fbbf24',
                  boxShadow: '0 0 8px 2px rgba(255,165,0,0.8)'
                }}
                initial={{
                  x: (Math.random() - 0.5) * 600,
                  y: (Math.random() - 0.5) * 600,
                  scale: 0,
                  opacity: 0,
                }}
                animate={{
                  x: 0,
                  y: 0,
                  scale: [0, 1.5, 0],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 1.5 + Math.random() * 2,
                  delay: Math.random() * 1.5,
                  ease: "circIn", // accelerates as it approaches center
                }}
              />
            ))}
          </div>

          {/* Flying message capsule entering the black hole */}
          <motion.div
            className="absolute left-1/2 top-[70%] w-[86vw] max-w-sm -translate-x-1/2 rounded-[28px] border border-orange-500/30 bg-black/80 p-4 shadow-[0_0_60px_rgba(255,100,0,0.3)] backdrop-blur-md z-30"
            initial={{ y: 150, scale: 1, opacity: 0, filter: "blur(0px)" }}
            animate={{
              y: [150, 0, -150, -250],
              scale: [1, 1, 0.4, 0],
              opacity: [0, 1, 1, 0],
              rotate: [0, 0, 15, 45],
              filter: ["blur(0px)", "blur(0px)", "blur(2px)", "blur(10px)"],
            }}
            transition={{ duration: 2.8, times: [0, 0.3, 0.8, 1], ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-500/20 border border-orange-500/40 text-2xl shadow-[0_0_20px_rgba(255,165,0,0.4)]">
                {event.icon || "✨"}
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-orange-300/80">
                  {sourceLabel[event.source || "ritual"]} • Transmitting
                </p>
                <h3 className="mt-1 truncate text-sm font-black text-white sm:text-base">{event.title}</h3>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/60">{event.message}</p>
              </div>
            </div>
          </motion.div>

          {/* Confirmation reveal */}
          <motion.div
            className="absolute bottom-[10%] left-1/2 w-[90vw] max-w-md -translate-x-1/2 text-center z-30"
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: [24, 24, 0], opacity: [0, 0, 1] }}
            transition={{ duration: 3, times: [0, 0.75, 1] }}
            onAnimationComplete={onComplete}
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-orange-500/40 bg-orange-500/10 shadow-[0_0_30px_rgba(255,165,0,0.3)]">
              <CheckCircle2 className="text-orange-400" size={28} />
            </div>
            <p className="text-[10px] font-mono font-black uppercase tracking-[0.3em] text-orange-300/80">Signal Absorbed</p>
            <h2 className="mt-2 text-xl font-black text-white sm:text-3xl tracking-tight">Timeline Shift Initiated</h2>
            <p className="mt-2 text-xs text-white/50 sm:text-sm max-w-xs mx-auto">
              Your intention has collapsed into the quantum field. Act as if it is already done.
            </p>
          </motion.div>

          {/* Top text indicator */}
          <motion.div
            className="absolute top-[10%] left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full border border-orange-500/20 bg-black/60 px-5 py-2.5 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-orange-200/80 shadow-[0_0_20px_rgba(255,100,0,0.2)]"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: [0, 1, 1, 0], y: [-20, 0, 0, -10] }}
            transition={{ duration: 2.5, times: [0, 0.2, 0.8, 1] }}
          >
            <Sparkles size={14} className="text-orange-400" /> Opening Event Horizon
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

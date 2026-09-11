import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { XP_PER_LEVEL } from "../lib/xpSeason";

/**
 * Global XP celebration overlay.
 *
 * Fire from anywhere with:
 *   window.dispatchEvent(new CustomEvent("manifest_xp_celebrate", {
 *     detail: { xp: 50, title: "Gratitude Script", seasonXp: 1950, newLevel: 1, leveledUp: false }
 *   }));
 *
 * Rendered through a portal on <body> so it is never clipped by the
 * transformed tab wrappers in App.tsx (same bug the proof camera hit).
 */

export interface XpCelebrateDetail {
  xp: number;
  title?: string;
  seasonXp?: number;
  lifetimeXp?: number;
  newLevel?: number;
  leveledUp?: boolean;
  source?: "ai" | "flips" | "honor" | string;
}

const AUTO_DISMISS_MS = 3400;
const LEVELUP_DISMISS_MS = 5200;
const PARTICLE_COUNT = 44;
const SPARK_COUNT = 16;

const CONFETTI_COLORS = ["#ff7a00", "#ffb457", "#ffd166", "#ffffff", "#ff4d6d", "#7cffb2", "#5ad8ff"];

interface Particle {
  id: number;
  x: number; // px offset from centre at the end of the burst
  y: number;
  rot: number;
  size: number;
  color: string;
  delay: number;
  round: boolean;
}

function makeParticles(seed: number): Particle[] {
  // deterministic-ish pseudo random so re-renders don't reshuffle mid-animation
  let s = seed || 1;
  const rnd = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    // fountain: mostly upwards/outwards, then gravity pulls it down
    const angle = -Math.PI / 2 + (rnd() - 0.5) * Math.PI * 1.5;
    const dist = 150 + rnd() * 210;
    return {
      id: i,
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist,
      rot: rnd() * 900 - 450,
      size: 9 + rnd() * 9,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      delay: rnd() * 0.15,
      round: rnd() > 0.6,
    };
  });
}

function useCountUp(target: number, durationMs: number, start: boolean) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs, start]);
  return value;
}

const Ring: React.FC<{ delay: number; color: string }> = ({ delay, color }) => (
  <motion.span
    aria-hidden
    initial={{ scale: 0.2, opacity: 0.9 }}
    animate={{ scale: 3.2, opacity: 0 }}
    transition={{ duration: 1.1, delay, ease: "easeOut" }}
    style={{
      position: "absolute",
      left: "50%",
      top: "50%",
      width: 120,
      height: 120,
      marginLeft: -60,
      marginTop: -60,
      borderRadius: "50%",
      border: `3px solid ${color}`,
      boxShadow: `0 0 40px ${color}55`,
    }}
  />
);

const CelebrationCard: React.FC<{ detail: XpCelebrateDetail; runId: number; onDone: () => void }> = ({
  detail,
  runId,
  onDone,
}) => {
  const particles = useMemo(() => makeParticles(runId * 7919), [runId]);
  const [ready, setReady] = useState(false);
  const shown = useCountUp(detail.xp, 900, ready);
  const leveledUp = !!detail.leveledUp;

  useEffect(() => {
    const r = requestAnimationFrame(() => setReady(true));
    const t = setTimeout(onDone, leveledUp ? LEVELUP_DISMISS_MS : AUTO_DISMISS_MS);
    // haptic tap where supported (Android Chrome)
    try {
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(leveledUp ? [40, 60, 40, 60, 120] : [30, 40, 60]);
      }
    } catch {
      /* ignore */
    }
    return () => {
      cancelAnimationFrame(r);
      clearTimeout(t);
    };
  }, [onDone, leveledUp]);

  const seasonXp = typeof detail.seasonXp === "number" ? detail.seasonXp : null;
  const pct = seasonXp != null ? Math.min(100, Math.round(((seasonXp % XP_PER_LEVEL) / XP_PER_LEVEL) * 100)) : null;

  return (
    <motion.div
      key={`xp-celebrate-${runId}`}
      role="status"
      aria-live="polite"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.25 } }}
      onClick={onDone}
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100dvh",
        zIndex: 900,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: leveledUp
          ? "radial-gradient(circle at 50% 45%, rgba(255,122,0,0.35) 0%, rgba(0,0,0,0.82) 60%)"
          : "radial-gradient(circle at 50% 45%, rgba(255,122,0,0.22) 0%, rgba(0,0,0,0.72) 60%)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        cursor: "pointer",
        touchAction: "manipulation",
      }}
    >
      {/* shockwave rings */}
      <Ring delay={0} color="#ff7a00" />
      <Ring delay={0.12} color="#ffd166" />
      {leveledUp && <Ring delay={0.26} color="#ffffff" />}

      {/* card */}
      <motion.div
        initial={{ scale: 0.6, y: 30, opacity: 0 }}
        animate={{ scale: [0.6, 1.08, 1], y: 0, opacity: 1 }}
        transition={{ duration: 0.55, ease: [0.34, 1.56, 0.64, 1] }}
        style={{
          position: "relative",
          zIndex: 2,
          width: "min(86vw, 360px)",
          padding: "28px 24px 22px",
          borderRadius: 28,
          background: "linear-gradient(180deg, rgba(28,20,12,0.96) 0%, rgba(12,10,8,0.98) 100%)",
          border: "1px solid rgba(255,164,74,0.35)",
          boxShadow: "0 30px 80px rgba(0,0,0,0.6), 0 0 60px rgba(255,122,0,0.25), inset 0 1px 0 rgba(255,255,255,0.08)",
          textAlign: "center",
          color: "#fff",
        }}
      >
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 260, damping: 14 }}
          style={{
            width: 72,
            height: 72,
            margin: "0 auto 10px",
            borderRadius: 22,
            display: "grid",
            placeItems: "center",
            fontSize: 36,
            background: "linear-gradient(135deg, #ff7a00, #ffb457)",
            boxShadow: "0 12px 30px rgba(255,122,0,0.45)",
          }}
        >
          {leveledUp ? "👑" : detail.source === "ai" ? "🛡️" : "⚡"}
        </motion.div>

        <div
          style={{
            fontSize: 11,
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            color: "#ffb457",
            fontWeight: 800,
            marginBottom: 6,
          }}
        >
          {leveledUp ? "Level Up" : detail.source === "ai" ? "Verified by AI" : "Task Complete"}
        </div>

        <motion.div
          initial={{ scale: 0.7 }}
          animate={{ scale: [0.7, 1.15, 1] }}
          transition={{ delay: 0.25, duration: 0.5 }}
          style={{
            fontSize: 64,
            lineHeight: 1,
            fontWeight: 900,
            letterSpacing: "-0.03em",
            background: "linear-gradient(180deg, #fff 0%, #ffd166 55%, #ff7a00 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            textShadow: "none",
            filter: "drop-shadow(0 6px 18px rgba(255,122,0,0.45))",
          }}
        >
          +{shown}
          <span style={{ fontSize: 22, marginLeft: 6, letterSpacing: "0.1em" }}>XP</span>
        </motion.div>

        {detail.title && (
          <div style={{ marginTop: 10, fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.92)" }}>
            {detail.title}
          </div>
        )}

        {leveledUp && detail.newLevel ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            style={{
              marginTop: 12,
              display: "inline-block",
              padding: "8px 16px",
              borderRadius: 999,
              background: "rgba(255,122,0,0.18)",
              border: "1px solid rgba(255,164,74,0.5)",
              fontWeight: 800,
              letterSpacing: "0.08em",
              fontSize: 14,
            }}
          >
            ⬆ LEVEL {detail.newLevel} REACHED
          </motion.div>
        ) : null}

        {seasonXp != null && (
          <div style={{ marginTop: 16 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 11,
                color: "rgba(255,255,255,0.6)",
                letterSpacing: "0.08em",
                marginBottom: 6,
              }}
            >
              <span>SEASON XP</span>
              <span style={{ color: "#ffb457", fontWeight: 800 }}>
                {seasonXp.toLocaleString()} / {XP_PER_LEVEL.toLocaleString()}
              </span>
            </div>
            <div style={{ height: 8, borderRadius: 999, background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
              <motion.div
                initial={{ width: `${Math.max(0, (pct ?? 0) - Math.round((detail.xp / XP_PER_LEVEL) * 100) - 1)}%` }}
                animate={{ width: `${pct ?? 0}%` }}
                transition={{ delay: 0.5, duration: 0.9, ease: "easeOut" }}
                style={{
                  height: "100%",
                  borderRadius: 999,
                  background: "linear-gradient(90deg, #ff7a00, #ffd166)",
                  boxShadow: "0 0 14px rgba(255,180,87,0.8)",
                }}
              />
            </div>
          </div>
        )}

        <div style={{ marginTop: 14, fontSize: 11, color: "rgba(255,255,255,0.45)", letterSpacing: "0.06em" }}>
          TAP ANYWHERE TO CONTINUE
        </div>
      </motion.div>
      {/* confetti burst */}
      <div aria-hidden style={{ position: "absolute", left: "50%", top: "44%", width: 0, height: 0, zIndex: 3, pointerEvents: "none" }}>
        {particles.map((p) => (
          <motion.span
            key={p.id}
            initial={{ x: 0, y: 0, opacity: 1, scale: 0.3, rotate: 0 }}
            animate={{
              x: [0, p.x * 0.7, p.x],
              y: [0, p.y, p.y + 260],
              opacity: [1, 1, 0],
              scale: [0.3, 1.1, 0.9],
              rotate: p.rot,
            }}
            transition={{ duration: 1.9, delay: p.delay, ease: ["easeOut", "easeIn"], times: [0, 0.42, 1] }}
            style={{
              position: "absolute",
              width: p.size,
              height: p.round ? p.size : p.size * 0.45,
              borderRadius: p.round ? "50%" : 2,
              background: p.color,
              boxShadow: `0 0 8px ${p.color}aa`,
            }}
          />
        ))}
        {Array.from({ length: SPARK_COUNT }, (_, i) => {
          const a = (i / SPARK_COUNT) * Math.PI * 2;
          return (
            <motion.span
              key={`spark-${i}`}
              initial={{ x: 0, y: 0, opacity: 1, scaleX: 0.2 }}
              animate={{ x: Math.cos(a) * 230, y: Math.sin(a) * 230, opacity: 0, scaleX: 1 }}
              transition={{ duration: 0.7, delay: 0.05, ease: "easeOut" }}
              style={{
                position: "absolute",
                width: 34,
                height: 3,
                marginTop: -1.5,
                borderRadius: 2,
                background: "linear-gradient(90deg, transparent, #fff)",
                transform: `rotate(${(a * 180) / Math.PI}deg)`,
                transformOrigin: "0 50%",
              }}
            />
          );
        })}
      </div>

    </motion.div>
  );
};

export const XpCelebration: React.FC = () => {
  const [current, setCurrent] = useState<{ detail: XpCelebrateDetail; runId: number } | null>(null);
  const queue = useRef<XpCelebrateDetail[]>([]);
  const counter = useRef(0);

  useEffect(() => {
    const onCelebrate = (e: Event) => {
      const d = (e as CustomEvent<XpCelebrateDetail>).detail;
      if (!d || !(Number(d.xp) > 0)) return;
      queue.current.push(d);
      setCurrent((cur) => {
        if (cur) return cur; // will be picked up when the current one closes
        const next = queue.current.shift()!;
        counter.current += 1;
        return { detail: next, runId: counter.current };
      });
    };
    window.addEventListener("manifest_xp_celebrate", onCelebrate);
    return () => window.removeEventListener("manifest_xp_celebrate", onCelebrate);
  }, []);

  const handleDone = React.useCallback(() => {
    setCurrent(() => {
      const next = queue.current.shift();
      if (!next) return null;
      counter.current += 1;
      return { detail: next, runId: counter.current };
    });
  }, []);

  if (typeof document === "undefined") return null;
  return createPortal(
    <AnimatePresence mode="wait">
      {current && <CelebrationCard key={current.runId} detail={current.detail} runId={current.runId} onDone={handleDone} />}
    </AnimatePresence>,
    document.body
  );
};

/** Convenience helper so call-sites stay one line. */
export function celebrateXp(detail: XpCelebrateDetail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<XpCelebrateDetail>("manifest_xp_celebrate", { detail }));
}

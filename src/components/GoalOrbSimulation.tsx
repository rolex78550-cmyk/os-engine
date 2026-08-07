import { useMemo } from "react";
import { motion } from "motion/react";

interface GoalOrbSimulationProps {
  goalName: string;
  goalIcon?: string;
  /** 0-100 */
  successProbability?: number;
}

/* 3D rotating goal simulation — sits at the top of the blueprint page.
   Multiple orbiting rings on different axes + a glowing brass core,
   with traveling nodes and ambient particles. Pure CSS 3D transforms. */

export default function GoalOrbSimulation({ goalName, goalIcon = "✦", successProbability = 72 }: GoalOrbSimulationProps) {
  const rings = useMemo(() => [
    { r: 130, cls: "ring-spin-y", dur: 18, nodes: 3 },
    { r: 100, cls: "ring-spin-y2", dur: 13, nodes: 2 },
    { r: 158, cls: "ring-spin-tilt", dur: 26, nodes: 2 },
    { r: 80, cls: "ring-spin-vert", dur: 9, nodes: 1 },
  ], []);

  const particles = useMemo(() => Array.from({ length: 14 }, (_, i) => ({
    id: i,
    px: `${(Math.random() - 0.5) * 60}px`,
    py: `${-30 - Math.random() * 50}px`,
    left: `${50 + (Math.random() - 0.5) * 70}%`,
    top: `${50 + (Math.random() - 0.5) * 70}%`,
    size: 1.5 + Math.random() * 2.5,
    dur: 5 + Math.random() * 5,
    delay: Math.random() * 6,
  })), []);

  return (
    <div className="relative w-full overflow-hidden" style={{ height: 340, marginBottom: 8 }}>
      {/* Ambient radial backdrop */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(circle at 50% 50%, rgba(201,169,97,0.10) 0%, transparent 55%)",
      }} />

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        {particles.map(p => (
          <span key={p.id} className="absolute rounded-full" style={{
            left: p.left, top: p.top, width: p.size, height: p.size,
            background: "var(--atelier-brass)", boxShadow: "0 0 6px rgba(201,169,97,0.6)",
            ["--px" as any]: p.px, ["--py" as any]: p.py,
            animation: `orb-particle ${p.dur}s linear infinite`, animationDelay: `${p.delay}s`,
          }} />
        ))}
      </div>

      {/* 3D scene */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ perspective: "900px" }}>
        <div className="relative" style={{ width: 320, height: 320, transformStyle: "preserve-3d", animation: "orb-tumble 30s linear infinite" }}>

          {/* Orbiting rings */}
          {rings.map((ring, i) => (
            <div key={i} className="absolute" style={{
              left: "50%", top: "50%", width: ring.r * 2, height: ring.r * 2,
              marginLeft: -ring.r, marginTop: -ring.r,
              borderRadius: "50%",
              border: "1px solid rgba(201,169,97,0.28)",
              boxShadow: "0 0 12px rgba(201,169,97,0.10)",
              transformStyle: "preserve-3d",
              animation: `${ring.cls} ${ring.dur}s linear infinite`,
            }}>
              {/* nodes riding this ring */}
              {Array.from({ length: ring.nodes }).map((_, n) => (
                <span key={n} className="absolute rounded-full" style={{
                  width: 7, height: 7, background: "var(--atelier-ink)",
                  boxShadow: "0 0 10px 2px rgba(201,169,97,0.7)",
                  left: ring.r - 3.5, top: -3.5,
                  animation: `${ring.cls} ${ring.dur}s linear infinite`,
                  animationDelay: `${(n / ring.nodes) * ring.dur}s`,
                }} />
              ))}
            </div>
          ))}

          {/* Scanning equator highlight (faster arc) */}
          <div className="absolute pointer-events-none" style={{
            left: "50%", top: "50%", width: 260, height: 260, marginLeft: -130, marginTop: -130,
            borderRadius: "50%",
            border: "1px solid transparent",
            borderTopColor: "rgba(201,169,97,0.8)",
            borderRightColor: "rgba(201,169,97,0.4)",
            transformStyle: "preserve-3d",
            animation: "orb-scan 4s linear infinite",
          }} />

          {/* Faint static inner guide ring */}
          <div className="absolute" style={{
            left: "50%", top: "50%", width: 130, height: 130, marginLeft: -65, marginTop: -65,
            borderRadius: "50%", border: "1px dashed rgba(201,169,97,0.18)",
            transformStyle: "preserve-3d",
          }} />

          {/* Glowing brass core */}
          <div className="absolute rounded-full" style={{
            left: "50%", top: "50%", width: 72, height: 72,
            background: "radial-gradient(circle at 35% 30%, #FFF8EC 0%, #E8D9B8 30%, #C9A961 70%, #8A7544 100%)",
            animation: "orb-core-breathe 4s ease-in-out infinite",
          }}>
            <div className="w-full h-full flex items-center justify-center" style={{ fontSize: 30 }}>
              {goalIcon}
            </div>
          </div>
        </div>
      </div>

      {/* Goal name overlay (sits below the orb, not rotating) */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="absolute left-0 right-0 text-center" style={{ bottom: 4 }}
      >
        <p className="eyebrow" style={{ marginBottom: 4 }}>◇ Goal Simulation</p>
        <p className="serif" style={{ fontSize: 13, fontWeight: 600, color: "var(--atelier-ink)" }}>
          {goalName.slice(0, 40)}
        </p>
      </motion.div>

      {/* Probability readout (corner HUD) */}
      <div className="absolute" style={{ top: 14, left: 16 }}>
        <p className="eyebrow" style={{ fontSize: 9, marginBottom: 2 }}>Projection</p>
        <p className="figure" style={{ fontSize: 22, color: "var(--atelier-brass)" }}>
          {successProbability}<span style={{ fontSize: 11, color: "var(--atelier-muted)" }}>%</span>
        </p>
      </div>
      <div className="absolute" style={{ top: 14, right: 16, textAlign: "right" }}>
        <p className="eyebrow" style={{ fontSize: 9, marginBottom: 2 }}>Status</p>
        <p className="eyebrow" style={{ fontSize: 10, color: "var(--atelier-sage)" }}>● Tracking</p>
      </div>
    </div>
  );
}

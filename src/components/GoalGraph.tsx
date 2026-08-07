import React from "react";
import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Clock, Shield, Zap } from "lucide-react";
import type { GoalBlueprint, BlueprintNode } from "../types";

interface GoalGraphProps {
  blueprint: GoalBlueprint;
}

/* ── Atelier 3D topology: warm ink + brass ── */
const INK = "#ECE4D4";
const MUTED = "#837A6D";
const BRASS = "#C9A961";
const SAGE = "#8FA98E";

const CANVAS = 640;
const CENTER = CANVAS / 2;

interface Pos { x: number; y: number; ring: number; }
interface Conn { from: string; to: string; }

function computeLayout(bp: GoalBlueprint): { positions: Record<string, Pos>; connections: Conn[] } {
  const baseNodes = bp.graph_nodes;
  const positions: Record<string, Pos> = {};
  const connections: Conn[] = [];
  const placed = new Set<string>();
  const enriched = [...baseNodes];

  const anchorNode = baseNodes.find(n => n.type === 'action' || n.type === 'success') || baseNodes[baseNodes.length - 1];
  if (anchorNode) {
    bp.milestones.forEach((m, i) => {
      const id = "ms_" + i;
      enriched.push({ id, title: m.title, type: "evidence", connected_to: [], description: m.description, estimated_days: m.estimated_days, difficulty: m.difficulty, xp: 50 });
      anchorNode.connected_to.push(id);
    });
  }
  const actionPillar = baseNodes.find(n => n.type === 'action');
  if (actionPillar) {
    bp.daily_tasks.slice(0, 4).forEach((t, i) => {
      const id = "dt_" + i;
      enriched.push({ id, title: t.title, type: "action", connected_to: [], description: t.description, estimated_days: 1, difficulty: t.priority, xp: t.xp });
      actionPillar.connected_to.push(id);
    });
  }
  const habitPillar = baseNodes.find(n => n.type === 'habit');
  if (habitPillar) {
    bp.habits.slice(0, 3).forEach((h, i) => {
      const id = "hb_" + i;
      enriched.push({ id, title: h.label, type: "habit", connected_to: [], description: h.why, estimated_days: 21, difficulty: "Medium", xp: 30 });
      habitPillar.connected_to.push(id);
    });
  }

  const root = enriched.find(n => n.type === 'identity') || enriched[0];
  if (!root) return { positions, connections };
  positions[root.id] = { x: 0, y: 0, ring: 0 };
  placed.add(root.id);

  const PILLAR_R = 150;
  const ring1 = enriched.filter(n => root.connected_to.includes(n.id) && !placed.has(n.id));
  ring1.forEach((node, i) => {
    const angle = (i / Math.max(ring1.length, 1)) * Math.PI * 2 - Math.PI / 2;
    positions[node.id] = { x: Math.cos(angle) * PILLAR_R, y: Math.sin(angle) * PILLAR_R, ring: 1 };
    placed.add(node.id);
    connections.push({ from: root.id, to: node.id });
  });

  const SUB_R = 250;
  ring1.forEach(pillar => {
    const subs = enriched.filter(n => pillar.connected_to.includes(n.id) && !placed.has(n.id));
    const pAngle = Math.atan2(positions[pillar.id].y, positions[pillar.id].x);
    subs.forEach((node, i) => {
      const spread = 0.5;
      const offset = subs.length > 1 ? (i - (subs.length - 1) / 2) * (spread / subs.length) : 0;
      const angle = pAngle + offset;
      positions[node.id] = { x: Math.cos(angle) * SUB_R, y: Math.sin(angle) * SUB_R, ring: 2 };
      placed.add(node.id);
      connections.push({ from: pillar.id, to: node.id });
    });
  });

  enriched.filter(n => !placed.has(n.id)).forEach((node, i) => {
    const angle = (i / 6) * Math.PI * 2;
    positions[node.id] = { x: Math.cos(angle) * SUB_R, y: Math.sin(angle) * SUB_R, ring: 2 };
    connections.push({ from: root.id, to: node.id });
  });

  return { positions, connections };
}

export default function GoalGraph({ blueprint }: GoalGraphProps) {
  const [selected, setSelected] = useState<BlueprintNode | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [spin, setSpin] = useState(true);

  useEffect(() => { const t = setTimeout(() => setMounted(true), 200); return () => clearTimeout(t); }, []);

  const { positions, connections } = useMemo(() => computeLayout(blueprint), [blueprint]);

  const allNodes = useMemo(() => {
    const base = [...blueprint.graph_nodes];
    blueprint.milestones.forEach((m, i) => base.push({ id: "ms_" + i, title: m.title, type: "evidence", connected_to: [], description: m.description, estimated_days: m.estimated_days, difficulty: m.difficulty, xp: 50 }));
    blueprint.daily_tasks.slice(0, 4).forEach((t, i) => base.push({ id: "dt_" + i, title: t.title, type: "action", connected_to: [], description: t.description, estimated_days: 1, difficulty: t.priority, xp: t.xp }));
    blueprint.habits.slice(0, 3).forEach((h, i) => base.push({ id: "hb_" + i, title: h.label, type: "habit", connected_to: [], description: h.why, estimated_days: 21, difficulty: "Medium", xp: 30 }));
    return base;
  }, [blueprint]);

  const hover = useCallback((id: string | null) => () => setHoveredId(id), []);
  const pick = useCallback((node: BlueprintNode) => (e: React.MouseEvent) => { e.stopPropagation(); setSelected(node); }, []);

  return (
    <div className="relative w-full">
      {/* Top meta row */}
      <div className="flex items-center justify-between mb-3">
        <span className="eyebrow">Figure · Topology</span>
        <button
          onClick={() => setSpin(s => !s)}
          className="eyebrow transition-opacity hover:opacity-100"
          style={{ fontSize: 9, opacity: 0.7, color: spin ? BRASS : MUTED }}
        >
          {spin ? "● rotating" : "○ paused"} · tap
        </button>
      </div>

      {/* 3D simulation canvas */}
      <div
        className="relative w-full overflow-hidden rounded-xl atelier-grain"
        style={{ height: "min(520px, 70vh)", background: "var(--atelier-bg)", border: "1px solid var(--atelier-faint)", perspective: "1000px" }}
      >
        {/* Ambient backdrop glow */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(circle at 50% 45%, rgba(201,169,97,0.10) 0%, transparent 55%)",
        }} />

        {/* Subtle grid floor */}
        <div className="absolute inset-0 opacity-[0.4] pointer-events-none" style={{
          backgroundImage: "linear-gradient(rgba(131,122,109,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(131,122,109,0.12) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage: "radial-gradient(circle at center, black 0%, transparent 78%)",
          WebkitMaskImage: "radial-gradient(circle at center, black 0%, transparent 78%)",
        }} />

        {/* 3D scene */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="relative"
            style={{
              width: CANVAS, height: CANVAS, transformStyle: "preserve-3d",
              animation: spin ? "topo-tumble 38s linear infinite" : "none",
              transform: spin ? undefined : "rotateX(58deg)",
            }}
          >
            {/* Guide orbit rings on the plane */}
            <div className="absolute rounded-full" style={{ left: CENTER, top: CENTER, width: 300, height: 300, marginLeft: -150, marginTop: -150, border: "1px dashed rgba(201,169,97,0.16)", transformStyle: "preserve-3d" }} />
            <div className="absolute rounded-full" style={{ left: CENTER, top: CENTER, width: 500, height: 500, marginLeft: -250, marginTop: -250, border: "1px dashed rgba(201,169,97,0.10)", transformStyle: "preserve-3d" }} />
            {/* Bright scan arc */}
            <div className="absolute rounded-full pointer-events-none" style={{ left: CENTER, top: CENTER, width: 380, height: 380, marginLeft: -190, marginTop: -190, border: "1px solid transparent", borderTopColor: "rgba(201,169,97,0.7)", borderRightColor: "rgba(201,169,97,0.35)", transformStyle: "preserve-3d", animation: "topo-tumble 6s linear infinite" }} />

            {/* Connection lines (SVG on the same plane) */}
            <svg className="absolute inset-0" width={CANVAS} height={CANVAS} style={{ overflow: "visible" }}>
              {connections.map((conn, i) => {
                const from = positions[conn.from]; const to = positions[conn.to];
                if (!from || !to) return null;
                const fx = from.x + CENTER, fy = from.y + CENTER, tx = to.x + CENTER, ty = to.y + CENTER;
                const isActive = hoveredId === conn.from || hoveredId === conn.to;
                return (
                  <g key={i}>
                    <line x1={fx} y1={fy} x2={tx} y2={ty} stroke={isActive ? BRASS : INK} strokeWidth={isActive ? 1.4 : 0.7} opacity={isActive ? 0.85 : 0.30} style={{ transition: "stroke 0.3s, opacity 0.3s" }} />
                    {isActive && (
                      <line x1={fx} y1={fy} x2={tx} y2={ty} stroke={BRASS} strokeWidth="1.5" strokeDasharray="3 7" style={{ animation: "topo-flow 1.4s linear infinite" }} />
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Nodes */}
            {mounted && allNodes.map((node, i) => {
              const pos = positions[node.id];
              if (!pos) return null;
              const isRoot = pos.ring === 0;
              const isPillar = pos.ring === 1;
              const r = isRoot ? 8 : isPillar ? 6 : 4;
              const left = pos.x + CENTER;
              const top = pos.y + CENTER;
              const isActive = hoveredId === node.id;
              const fill = isRoot ? BRASS : isPillar ? INK : MUTED;

              return (
                <motion.div
                  key={node.id}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: pos.ring * 0.16 + i * 0.04, type: "spring", stiffness: 130, damping: 14 }}
                  className="absolute cursor-pointer"
                  style={{ left: left - 18, top: top - 18, width: 36, height: 36, zIndex: isActive ? 20 : 10 }}
                  onMouseEnter={hover(node.id)}
                  onMouseLeave={hover(null)}
                  onClick={pick(node)}
                >
                  <svg viewBox="0 0 36 36" className="w-full h-full">
                    {isRoot && <circle cx="18" cy="18" r="15" fill="none" stroke={BRASS} strokeWidth="0.5" opacity="0.45" />}
                    {(isPillar || isRoot) && <circle cx="18" cy="18" r={r + 5} fill="none" stroke={isActive ? BRASS : MUTED} strokeWidth="0.5" opacity={isActive ? 0.9 : 0.35} />}
                    <circle cx="18" cy="18" r={r} fill={fill} style={{ transition: "fill 0.3s", filter: isRoot || isActive ? `drop-shadow(0 0 6px ${BRASS})` : "none" }} />
                    {isActive && <circle cx="18" cy="18" r={r + 2} fill="none" stroke={BRASS} strokeWidth="1" />}
                  </svg>
                </motion.div>
              );
            })}

            {/* Core glow */}
            <div className="absolute rounded-full pointer-events-none" style={{
              left: CENTER, top: CENTER, width: 60, height: 60, marginLeft: -30, marginTop: -30,
              background: "radial-gradient(circle, rgba(201,169,97,0.35) 0%, transparent 70%)",
              animation: "topo-pulse 4s ease-in-out infinite",
            }} />
          </div>
        </div>

        {/* Hovering node label (fixed overlay, not rotating) */}
        {mounted && hoveredId && (() => {
          const n = allNodes.find(x => x.id === hoveredId);
          if (!n) return null;
          return (
            <div className="absolute left-3 right-3 pointer-events-none" style={{ top: 12 }}>
              <div className="dossier px-3 py-2 inline-block" style={{ maxWidth: "100%" }}>
                <p className="eyebrow mb-0.5" style={{ fontSize: 8 }}>{n.type} · node</p>
                <p className="text-[11px]" style={{ color: INK }}>{n.title}</p>
              </div>
            </div>
          );
        })()}

        {/* Legend bottom */}
        <div className="absolute left-3 flex items-center gap-4" style={{ bottom: 12 }}>
          <span className="flex items-center gap-1.5 eyebrow" style={{ fontSize: 9 }}>
            <span className="inline-block rounded-full" style={{ width: 7, height: 7, background: BRASS }} /> Core
          </span>
          <span className="flex items-center gap-1.5 eyebrow" style={{ fontSize: 9 }}>
            <span className="inline-block rounded-full" style={{ width: 5, height: 5, background: INK }} /> Pillar
          </span>
          <span className="flex items-center gap-1.5 eyebrow" style={{ fontSize: 9 }}>
            <span className="inline-block rounded-full" style={{ width: 3.5, height: 3.5, background: MUTED, opacity: 0.7 }} /> Step
          </span>
        </div>
        <div className="absolute eyebrow" style={{ bottom: 12, right: 12, fontSize: 9, color: MUTED }}>
          {allNodes.length} nodes · {connections.length} paths
        </div>
      </div>

      {/* Node detail drawer */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setSelected(null)}>
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 18 }}
              transition={{ ease: [0.22, 1, 0.36, 1] }} onClick={(e) => e.stopPropagation()}
              className="dossier atelier-grain w-full max-w-md rounded-[20px] p-6 relative">
              <button onClick={() => setSelected(null)} className="absolute top-4 right-4" style={{ color: MUTED }}><X size={18} /></button>
              <p className="eyebrow mb-3">{selected.type} · node</p>
              <h3 className="serif text-xl mb-3" style={{ color: INK, fontWeight: 700 }}>{selected.title}</h3>
              <hr className="rule mb-4" />
              <p className="text-sm leading-relaxed mb-5" style={{ color: "#B8AFA0" }}>{selected.description}</p>
              <div className="grid grid-cols-3 gap-3" style={{ borderTop: `1px solid var(--atelier-faint)`, paddingTop: 14 }}>
                <div>
                  <p className="eyebrow mb-1" style={{ fontSize: 8 }}>Duration</p>
                  <p className="figure text-base">{selected.estimated_days}<span className="text-[10px]" style={{ color: MUTED }}>d</span></p>
                </div>
                <div>
                  <p className="eyebrow mb-1" style={{ fontSize: 8 }}>Difficulty</p>
                  <p className="text-[13px] font-semibold" style={{ color: INK }}>{selected.difficulty}</p>
                </div>
                <div>
                  <p className="eyebrow mb-1" style={{ fontSize: 8 }}>Reward</p>
                  <p className="figure text-base" style={{ color: BRASS }}>+{selected.xp}</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

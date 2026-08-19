import React, { useState } from "react";

// Design tokens (iOS 17 + Solo Leveling ARISE style)
const TEXT_PRIMARY = "#ffffff";
const TEXT_SECONDARY = "rgba(235,235,245,0.62)";
const TEXT_TERTIARY = "rgba(235,235,245,0.32)";
const SURFACE = "#0a0a0a";
const HAIRLINE = "rgba(255,255,255,0.08)";
const HAIRLINE_STRONG = "rgba(255,255,255,0.18)";
const ORANGE = "#ff9f0a";
const ORANGE_DARK = "#ff7a00";
const IOS_GREEN = "#34c759";

export type DominionFeature = "tasks" | "leaderboard";

export interface PlayerStats {
  level: number;
  rank: string;
  totalXP: number;
  currentLevelXP: number;
  nextLevelXP: number;
  streak: number;
  totalQuests: number;
  wisdom: number;
  confidence: number;
  strength: number;
  discipline: number;
  focus: number;
}

const DEFAULT_STATS: PlayerStats = {
  level: 1,
  rank: "Seeker",
  totalXP: 242,
  currentLevelXP: 0,
  nextLevelXP: 800,
  streak: 0,
  totalQuests: 0,
  wisdom: 0,
  confidence: 0,
  strength: 0,
  discipline: 0,
  focus: 0,
};

interface HubProps {
  stats?: PlayerStats;
  playerName?: string;
  onOpenTasks: () => void;
  onOpenLeaderboard: () => void;
}

export const SoloDominionHub: React.FC<HubProps> = ({
  stats = DEFAULT_STATS,
  playerName = "Hunter",
  onOpenTasks,
  onOpenLeaderboard,
}) => {
  const [hovered, setHovered] = useState<DominionFeature | null>(null);

  const xpPct = Math.max(
    0,
    Math.min(100, (stats.currentLevelXP / stats.nextLevelXP) * 100)
  );

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ backgroundColor: "#000", minHeight: "100vh" }}
    >
      {/* ===================== HERO SECTION ===================== */}
      <section
        className="relative w-full"
        style={{ minHeight: "min(560px, 65vh)" }}
      >
        {/* Jinwoo background image */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "url(/images/sd_jin_hero.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center top",
            backgroundRepeat: "no-repeat",
            opacity: 0.3,
          }}
        />
        {/* Dark gradient overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.55) 45%, rgba(0,0,0,0.95) 100%)",
          }}
        />

        {/* Top status bar */}
        <div
          className="relative z-10 flex items-center justify-between px-5 pt-6 text-[11px] font-semibold tracking-wider"
          style={{ color: TEXT_TERTIARY }}
        >
          <span>HUNTER · ONLINE</span>
          <span style={{ color: ORANGE }}>● LV {stats.level}</span>
        </div>

        {/* Center content */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-10 pb-8">
          {/* Shield icon */}
          <div
            className="mb-5 flex items-center justify-center"
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              border: `1px solid ${HAIRLINE_STRONG}`,
              backgroundColor: SURFACE,
            }}
          >
            <svg width="22" height="26" viewBox="0 0 22 26" fill="none">
              <path
                d="M11 1 L21 5 L21 13 C21 19 16 23.5 11 25 C6 23.5 1 19 1 13 L1 5 Z"
                stroke={ORANGE}
                strokeWidth="1.6"
                fill="none"
              />
              <path
                d="M11 8 L11 18 M7 13 L15 13"
                stroke={ORANGE}
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* Main heading */}
          <h1
            className="font-extrabold leading-[1.05] tracking-tight"
            style={{
              color: TEXT_PRIMARY,
              fontSize: "clamp(1.75rem, 5vw, 2.75rem)",
              letterSpacing: "-0.02em",
              maxWidth: "640px",
            }}
          >
            Welcome back,{" "}
            <span style={{ color: ORANGE }}>{playerName}</span>.
          </h1>

          {/* Subtitle */}
          <p
            className="mt-4 text-[14px] leading-relaxed"
            style={{ color: TEXT_SECONDARY, maxWidth: "400px" }}
          >
            Step into the <span style={{ color: TEXT_PRIMARY, fontWeight: 600 }}>dominion</span>.
            Complete tasks, climb the ranks, conquer yourself.
          </p>

          {/* Compact rating row */}
          <div
            className="mt-6 flex items-center gap-5 px-5 py-2.5 rounded-full"
            style={{
              backgroundColor: SURFACE,
              border: `1px solid ${HAIRLINE}`,
            }}
          >
            <div className="flex items-center gap-2">
              <div
                className="flex items-center justify-center font-extrabold text-[11px]"
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  backgroundColor: ORANGE,
                  color: "#000",
                }}
              >
                {stats.level}
              </div>
              <span
                className="text-[12px] font-bold"
                style={{ color: TEXT_PRIMARY }}
              >
                {stats.rank}
              </span>
            </div>
            <div
              className="w-px h-4"
              style={{ backgroundColor: HAIRLINE }}
            />
            <div className="flex items-center gap-1.5">
              <span
                className="text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: TEXT_TERTIARY }}
              >
                XP
              </span>
              <span
                className="text-[12px] font-bold tabular-nums"
                style={{ color: ORANGE }}
              >
                {stats.currentLevelXP}/{stats.nextLevelXP}
              </span>
            </div>
            <div
              className="w-px h-4"
              style={{ backgroundColor: HAIRLINE }}
            />
            <div className="flex items-center gap-1.5">
              <span style={{ color: IOS_GREEN, fontSize: 12 }}>🔥</span>
              <span
                className="text-[12px] font-bold tabular-nums"
                style={{ color: TEXT_PRIMARY }}
              >
                {stats.streak}d
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== TWO MAIN OPTIONS ===================== */}
      <section className="px-5 pt-4 pb-20">
        <div className="flex items-end justify-between mb-4">
          <h2
            className="text-[20px] font-extrabold tracking-tight"
            style={{ color: TEXT_PRIMARY, letterSpacing: "-0.01em" }}
          >
            Your Path
          </h2>
          <span
            className="text-[11px] uppercase tracking-wider"
            style={{ color: TEXT_TERTIARY }}
          >
            Choose your action →
          </span>
        </div>

        <div className="flex flex-col gap-3">
          {/* TASKS BUTTON */}
          <button
            onClick={onOpenTasks}
            onMouseEnter={() => setHovered("tasks")}
            onMouseLeave={() => setHovered(null)}
            className="relative rounded-2xl p-5 text-left transition-all active:scale-[0.99]"
            style={{
              backgroundColor: SURFACE,
              border: `1px solid ${
                hovered === "tasks" ? HAIRLINE_STRONG : HAIRLINE
              }`,
            }}
          >
            <div className="flex items-center gap-4">
              <div
                className="flex items-center justify-center text-2xl shrink-0"
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 14,
                  backgroundColor: "rgba(255,159,10,0.1)",
                  border: `1px solid ${HAIRLINE_STRONG}`,
                }}
              >
                ⚔️
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className="text-[9px] font-semibold tracking-widest mb-1 uppercase"
                  style={{ color: TEXT_TERTIARY }}
                >
                  タスク
                </div>
                <h3
                  className="text-[18px] font-extrabold tracking-tight"
                  style={{
                    color: TEXT_PRIMARY,
                    letterSpacing: "-0.01em",
                  }}
                >
                  Tasks
                </h3>
                <p
                  className="text-[12px] mt-0.5 leading-snug"
                  style={{ color: TEXT_SECONDARY }}
                >
                  Push-ups, planks, water — earn XP
                </p>
              </div>
              <div className="flex flex-col items-end shrink-0">
                <span
                  className="px-2 py-0.5 rounded-md text-[10px] font-extrabold tabular-nums"
                  style={{
                    backgroundColor: "rgba(255,159,10,0.15)",
                    color: ORANGE,
                    border: `1px solid rgba(255,159,10,0.3)`,
                  }}
                >
                  6
                </span>
                <span
                  className="text-[20px] mt-2"
                  style={{ color: TEXT_TERTIARY }}
                >
                  →
                </span>
              </div>
            </div>
          </button>

          {/* LEADERBOARD BUTTON */}
          <button
            onClick={onOpenLeaderboard}
            onMouseEnter={() => setHovered("leaderboard")}
            onMouseLeave={() => setHovered(null)}
            className="relative rounded-2xl p-5 text-left transition-all active:scale-[0.99]"
            style={{
              backgroundColor: SURFACE,
              border: `1px solid ${
                hovered === "leaderboard" ? HAIRLINE_STRONG : HAIRLINE
              }`,
            }}
          >
            <div className="flex items-center gap-4">
              <div
                className="flex items-center justify-center text-2xl shrink-0"
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 14,
                  backgroundColor: "rgba(52,199,89,0.1)",
                  border: `1px solid ${HAIRLINE_STRONG}`,
                }}
              >
                👑
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className="text-[9px] font-semibold tracking-widest mb-1 uppercase"
                  style={{ color: TEXT_TERTIARY }}
                >
                  ランキング
                </div>
                <h3
                  className="text-[18px] font-extrabold tracking-tight"
                  style={{
                    color: TEXT_PRIMARY,
                    letterSpacing: "-0.01em",
                  }}
                >
                  Leaderboard
                </h3>
                <p
                  className="text-[12px] mt-0.5 leading-snug"
                  style={{ color: TEXT_SECONDARY }}
                >
                  See where you stand globally
                </p>
              </div>
              <div className="flex flex-col items-end shrink-0">
                <span
                  className="px-2 py-0.5 rounded-md text-[10px] font-extrabold tabular-nums"
                  style={{
                    backgroundColor: "rgba(52,199,89,0.15)",
                    color: IOS_GREEN,
                    border: `1px solid rgba(52,199,89,0.3)`,
                  }}
                >
                  #142
                </span>
                <span
                  className="text-[20px] mt-2"
                  style={{ color: TEXT_TERTIARY }}
                >
                  →
                </span>
              </div>
            </div>
          </button>
        </div>
      </section>
    </div>
  );
};

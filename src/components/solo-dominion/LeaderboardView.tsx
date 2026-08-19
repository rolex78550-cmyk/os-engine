import React, { useState } from "react";

const TEXT_PRIMARY = "#ffffff";
const TEXT_SECONDARY = "rgba(235,235,245,0.62)";
const TEXT_TERTIARY = "rgba(235,235,245,0.32)";
const SURFACE = "#0a0a0a";
const HAIRLINE = "rgba(255,255,255,0.08)";
const HAIRLINE_STRONG = "rgba(255,255,255,0.18)";
const ORANGE = "#ff9f0a";
const IOS_GREEN = "#34c759";

export interface LeaderboardEntry {
  rank: number;
  name: string;
  level: number;
  xp: number;
  totalXP: number;
  rankTitle: string;
  isYou?: boolean;
  avatar?: string;
}

const DEMO_ENTRIES: LeaderboardEntry[] = [
  { rank: 1, name: "Arise_Shadow", level: 87, xp: 64200, totalXP: 64200, rankTitle: "Shadow Monarch" },
  { rank: 2, name: "Monarch_Kane", level: 84, xp: 58940, totalXP: 58940, rankTitle: "Monarch" },
  { rank: 3, name: "Vanguard99", level: 81, xp: 54120, totalXP: 54120, rankTitle: "Monarch" },
  { rank: 4, name: "IronWolf_X", level: 78, xp: 49880, totalXP: 49880, rankTitle: "S-Rank" },
  { rank: 5, name: "NightBlade", level: 76, xp: 47230, totalXP: 47230, rankTitle: "S-Rank" },
  { rank: 6, name: "DemonSlayer_07", level: 74, xp: 45010, totalXP: 45010, rankTitle: "A-Rank" },
  { rank: 7, name: "SteelFist_Ryo", level: 71, xp: 41880, totalXP: 41880, rankTitle: "A-Rank" },
  { rank: 8, name: "Phoenix_Fang", level: 68, xp: 39450, totalXP: 39450, rankTitle: "A-Rank" },
  { rank: 9, name: "VoidStriker", level: 65, xp: 36120, totalXP: 36120, rankTitle: "B-Rank" },
  { rank: 10, name: "CrimsonHunter", level: 62, xp: 33440, totalXP: 33440, rankTitle: "B-Rank" },
  { rank: 142, name: "You", level: 1, xp: 242, totalXP: 242, rankTitle: "Seeker", isYou: true },
];

interface LeaderboardViewProps {
  onBack: () => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  onBack,
}) => {
  const [tab, setTab] = useState<"all" | "weekly" | "guild">("all");
  const [hoveredRank, setHoveredRank] = useState<number | null>(null);

  const tabLabel = (t: "all" | "weekly" | "guild") =>
    t === "all" ? "All Time" : t === "weekly" ? "This Week" : "Guild";

  return (
    <div
      className="relative w-full"
      style={{ backgroundColor: "#000", minHeight: "100vh" }}
    >
      {/* ===================== TOP BAR ===================== */}
      <div
        className="sticky top-0 z-30 flex items-center justify-between px-4 pt-5 pb-3"
        style={{ backgroundColor: "#000", borderBottom: `1px solid ${HAIRLINE}` }}
      >
        <div className="flex items-center gap-2.5">
          <button
            onClick={onBack}
            className="flex items-center justify-center"
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              backgroundColor: SURFACE,
              border: `1px solid ${HAIRLINE_STRONG}`,
              color: TEXT_PRIMARY,
            }}
          >
            ←
          </button>
          <div className="flex flex-col">
            <div
              className="font-extrabold tracking-tight leading-none"
              style={{
                color: TEXT_PRIMARY,
                fontSize: 16,
                letterSpacing: "-0.01em",
              }}
            >
              Leaderboard
            </div>
            <div
              className="text-[10px] mt-0.5 uppercase tracking-wider"
              style={{ color: TEXT_TERTIARY }}
            >
              Solo Dominion
            </div>
          </div>
        </div>
        <div
          className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase"
          style={{
            backgroundColor: SURFACE,
            border: `1px solid ${HAIRLINE_STRONG}`,
            color: ORANGE,
          }}
        >
          ランキング
        </div>
      </div>

      {/* ===================== HERO HEADER ===================== */}
      <section className="px-5 pt-5 pb-2">
        <h1
          className="font-extrabold leading-[1.05] tracking-tight"
          style={{
            color: TEXT_PRIMARY,
            fontSize: "clamp(1.5rem, 4.5vw, 2.25rem)",
            letterSpacing: "-0.02em",
          }}
        >
          Top <span style={{ color: ORANGE }}>hunters</span>.
        </h1>
        <p
          className="mt-2 text-[13px] leading-relaxed"
          style={{ color: TEXT_SECONDARY, maxWidth: 400 }}
        >
          The strongest shadows in the dominion. Climb the ranks by completing
          your daily tasks.
        </p>
      </section>

      {/* ===================== TABS ===================== */}
      <section className="px-4 pt-4">
        <div
          className="grid grid-cols-3 gap-1 p-1 rounded-2xl"
          style={{ backgroundColor: SURFACE, border: `1px solid ${HAIRLINE}` }}
        >
          {(["all", "weekly", "guild"] as const).map((t) => {
            const active = tab === t;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="py-2 rounded-xl text-[12px] font-bold transition-colors"
                style={{
                  backgroundColor: active ? ORANGE : "transparent",
                  color: active ? "#000" : TEXT_SECONDARY,
                }}
              >
                {tabLabel(t)}
              </button>
            );
          })}
        </div>
      </section>

      {/* ===================== TOP 3 PODIUM ===================== */}
      <section className="px-4 pt-6">
        <div className="grid grid-cols-3 gap-2">
          {DEMO_ENTRIES.slice(0, 3).map((e, idx) => {
            const heights = ["h-[110px]", "h-[140px]", "h-[100px]"];
            const order = [1, 0, 2]; // visual: 2nd, 1st, 3rd
            const e2 = DEMO_ENTRIES[order[idx]];
            return (
              <div key={e2.rank} className="flex flex-col items-center">
                {/* Avatar */}
                <div
                  className="flex items-center justify-center font-extrabold text-[14px] mb-1.5"
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: SURFACE,
                    border: `2px solid ${
                      e2.rank === 1 ? ORANGE : HAIRLINE_STRONG
                    }`,
                    color: TEXT_PRIMARY,
                  }}
                >
                  {e2.name.slice(0, 2).toUpperCase()}
                </div>
                <div
                  className="text-[10px] font-bold truncate w-full text-center"
                  style={{ color: TEXT_PRIMARY }}
                >
                  {e2.name}
                </div>
                <div
                  className="text-[9px] tabular-nums"
                  style={{ color: TEXT_TERTIARY }}
                >
                  {e2.totalXP.toLocaleString()} XP
                </div>
                {/* Podium block */}
                <div
                  className={`mt-2 w-full ${heights[idx]} rounded-t-xl flex items-center justify-center font-extrabold text-[20px]`}
                  style={{
                    backgroundColor: SURFACE,
                    border: `1px solid ${
                      e2.rank === 1 ? ORANGE : HAIRLINE
                    }`,
                    borderBottom: "none",
                    color: e2.rank === 1 ? ORANGE : TEXT_PRIMARY,
                  }}
                >
                  {e2.rank}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ===================== RANKINGS LIST ===================== */}
      <section className="px-4 pt-6 pb-16">
        <div
          className="text-[10px] font-bold tracking-widest uppercase mb-3 px-1"
          style={{ color: TEXT_TERTIARY }}
        >
          Full Rankings
        </div>
        <div
          className="rounded-2xl overflow-hidden"
          style={{ backgroundColor: SURFACE, border: `1px solid ${HAIRLINE}` }}
        >
          {DEMO_ENTRIES.map((e, idx) => {
            const isHovered = hoveredRank === e.rank;
            return (
              <div
                key={e.rank}
                onMouseEnter={() => setHoveredRank(e.rank)}
                onMouseLeave={() => setHoveredRank(null)}
                className="flex items-center gap-3 px-3 py-3 transition-colors"
                style={{
                  borderTop: idx === 0 ? "none" : `1px solid ${HAIRLINE}`,
                  backgroundColor: e.isYou
                    ? "rgba(255,159,10,0.08)"
                    : isHovered
                    ? "rgba(255,255,255,0.02)"
                    : "transparent",
                }}
              >
                {/* Rank */}
                <div
                  className="flex items-center justify-center font-extrabold text-[13px] tabular-nums shrink-0"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    backgroundColor:
                      e.rank <= 3 ? ORANGE : "rgba(255,255,255,0.05)",
                    color: e.rank <= 3 ? "#000" : TEXT_PRIMARY,
                  }}
                >
                  {e.rank}
                </div>

                {/* Name + rank title */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[13px] font-bold truncate"
                      style={{
                        color: e.isYou ? ORANGE : TEXT_PRIMARY,
                      }}
                    >
                      {e.name}
                    </span>
                    {e.isYou && (
                      <span
                        className="px-1.5 py-0.5 rounded text-[8px] font-extrabold tracking-wider"
                        style={{
                          backgroundColor: ORANGE,
                          color: "#000",
                        }}
                      >
                        YOU
                      </span>
                    )}
                  </div>
                  <div
                    className="text-[10px] mt-0.5"
                    style={{ color: TEXT_TERTIARY }}
                  >
                    {e.rankTitle} · LV {e.level}
                  </div>
                </div>

                {/* XP */}
                <div className="text-right shrink-0">
                  <div
                    className="text-[13px] font-extrabold tabular-nums"
                    style={{
                      color: e.rank <= 3 ? ORANGE : TEXT_PRIMARY,
                    }}
                  >
                    {e.totalXP.toLocaleString()}
                  </div>
                  <div
                    className="text-[9px] font-bold tracking-wider uppercase"
                    style={{ color: TEXT_TERTIARY }}
                  >
                    Total XP
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

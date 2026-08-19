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

export type DominionFeature =
  | "battles"
  | "quests"
  | "rituals"
  | "shadows"
  | "inventory"
  | "stats"
  | "achievements"
  | "leaderboard";

export interface FeatureCard {
  id: DominionFeature;
  title: string;
  subtitle: string;
  icon: string;
  jpLabel: string;
  badge?: string;
  glowColor: string;
  level?: number;
}

export const FEATURE_CARDS: FeatureCard[] = [
  {
    id: "battles",
    title: "Boss Battles",
    subtitle: "Face the demons within",
    icon: "⚔️",
    jpLabel: "ボス戦",
    badge: "3 Active",
    glowColor: "#ff9f0a",
  },
  {
    id: "quests",
    title: "Daily Quests",
    subtitle: "Forge your legend",
    icon: "📜",
    jpLabel: "クエスト",
    badge: "12 Pending",
    glowColor: "#34c759",
  },
  {
    id: "rituals",
    title: "Rituals",
    subtitle: "Daily shadow work",
    icon: "🕯️",
    jpLabel: "儀式",
    badge: "Streak 7d",
    glowColor: "#ff9f0a",
  },
  {
    id: "shadows",
    title: "Shadow Army",
    subtitle: "Extract your soldiers",
    icon: "👤",
    jpLabel: "影の軍隊",
    badge: "14 Soldiers",
    glowColor: "#5e5ce6",
  },
  {
    id: "inventory",
    title: "Inventory",
    subtitle: "Artifacts & titles",
    icon: "💎",
    jpLabel: "インベントリ",
    badge: "28 Items",
    glowColor: "#ff9f0a",
  },
  {
    id: "stats",
    title: "Character Stats",
    subtitle: "Strength, wisdom, focus",
    icon: "📊",
    jpLabel: "ステータス",
    badge: "Level 42",
    glowColor: "#34c759",
  },
  {
    id: "achievements",
    title: "Achievements",
    subtitle: "Titles & milestones",
    icon: "🏆",
    jpLabel: "実績",
    badge: "23/100",
    glowColor: "#ff9f0a",
  },
  {
    id: "leaderboard",
    title: "Leaderboard",
    subtitle: "Top hunters worldwide",
    icon: "👑",
    jpLabel: "ランキング",
    badge: "Rank #142",
    glowColor: "#ff453a",
  },
];

export interface PlayerStats {
  level: number;
  rank: string;
  rankColor: string;
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
  level: 42,
  rank: "Gold IV",
  rankColor: "#ff9f0a",
  totalXP: 12480,
  currentLevelXP: 480,
  nextLevelXP: 1000,
  streak: 7,
  totalQuests: 247,
  wisdom: 78,
  confidence: 64,
  strength: 52,
  discipline: 71,
  focus: 58,
};

interface HubProps {
  stats?: PlayerStats;
  playerName?: string;
  onEnterFeature: (feature: DominionFeature) => void;
  onContinue: () => void;
  onOpenQuests?: () => void;
}

export const SoloDominionHub: React.FC<HubProps> = ({
  stats = DEFAULT_STATS,
  playerName = "Hunter",
  onEnterFeature,
  onContinue,
  onOpenQuests,
}) => {
  const [hovered, setHovered] = useState<DominionFeature | null>(null);

  const xpPct = Math.round(
    (stats.currentLevelXP / stats.nextLevelXP) * 100
  );

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ backgroundColor: "#000", minHeight: "100vh" }}
    >
      {/* ===================== HERO SECTION ===================== */}
      <section className="relative w-full" style={{ minHeight: "min(640px, 78vh)" }}>
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
        {/* Dark gradient overlay (95% top → 30% bottom) */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.55) 45%, rgba(0,0,0,0.92) 100%)",
          }}
        />

        {/* Top status bar */}
        <div className="relative z-10 flex items-center justify-between px-5 pt-6 text-[11px] font-semibold tracking-wider"
          style={{ color: TEXT_TERTIARY }}>
          <span>HUNTER · ONLINE</span>
          <span style={{ color: ORANGE }}>● LV {stats.level}</span>
        </div>

        {/* Center content */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-12 pb-10">
          {/* Shield icon */}
          <div
            className="mb-6 flex items-center justify-center"
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
              fontSize: "clamp(2rem, 5.5vw, 3.25rem)",
              letterSpacing: "-0.02em",
              maxWidth: "640px",
            }}
          >
            Welcome back,{" "}
            <span style={{ color: ORANGE }}>{playerName}</span>.
          </h1>

          {/* Subtitle */}
          <p
            className="mt-5 text-[15px] leading-relaxed"
            style={{ color: TEXT_SECONDARY, maxWidth: "420px" }}
          >
            Your <span style={{ color: TEXT_PRIMARY, fontWeight: 600 }}>shadow army awaits</span>. Complete daily rituals, defeat boss battles, and climb from{" "}
            <span style={{ color: ORANGE, fontWeight: 600 }}>Bronze V</span> to{" "}
            <span style={{ color: ORANGE, fontWeight: 600 }}>Legend I</span>.
          </p>

          {/* Rank & level card */}
          <div
            className="mt-8 w-full max-w-[360px] rounded-2xl p-4"
            style={{
              backgroundColor: SURFACE,
              border: `1px solid ${HAIRLINE}`,
              backdropFilter: "blur(20px)",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div
                  className="flex items-center justify-center font-extrabold text-sm"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: ORANGE,
                    color: "#000",
                  }}
                >
                  {stats.level}
                </div>
                <div className="text-left">
                  <div
                    className="text-[11px] uppercase tracking-wider"
                    style={{ color: TEXT_TERTIARY }}
                  >
                    Current Rating
                  </div>
                  <div
                    className="text-[15px] font-bold"
                    style={{ color: TEXT_PRIMARY }}
                  >
                    {stats.rank}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div
                  className="text-[11px] uppercase tracking-wider"
                  style={{ color: TEXT_TERTIARY }}
                >
                  Streak
                </div>
                <div
                  className="text-[15px] font-bold"
                  style={{ color: "#ff9f0a" }}
                >
                  {stats.streak} days
                </div>
              </div>
            </div>

            {/* XP bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-semibold"
                style={{ color: TEXT_TERTIARY }}>
                <span>EXPERIENCE</span>
                <span style={{ color: TEXT_SECONDARY }}>
                  {stats.currentLevelXP} / {stats.nextLevelXP} XP
                </span>
              </div>
              <div
                className="relative h-1.5 overflow-hidden rounded-full"
                style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
              >
                <div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    width: `${xpPct}%`,
                    background: `linear-gradient(90deg, ${ORANGE_DARK}, ${ORANGE})`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== STATS STRIP ===================== */}
      <section className="px-5 pt-2 pb-6">
        <div
          className="grid grid-cols-5 gap-px overflow-hidden rounded-2xl"
          style={{ backgroundColor: HAIRLINE, border: `1px solid ${HAIRLINE}` }}
        >
          {[
            { label: "Wisdom", val: stats.wisdom, icon: "◆" },
            { label: "Confidence", val: stats.confidence, icon: "▲" },
            { label: "Strength", val: stats.strength, icon: "▰" },
            { label: "Discipline", val: stats.discipline, icon: "●" },
            { label: "Focus", val: stats.focus, icon: "◇" },
          ].map((s) => (
            <div
              key={s.label}
              className="flex flex-col items-center py-3.5"
              style={{ backgroundColor: "#000" }}
            >
              <div className="flex items-center gap-1">
                <span style={{ color: "#34c759", fontSize: 9 }}>{s.icon}</span>
                <span
                  className="text-[17px] font-extrabold"
                  style={{ color: TEXT_PRIMARY }}
                >
                  {s.val}
                </span>
              </div>
              <span
                className="text-[9px] uppercase tracking-wider mt-0.5"
                style={{ color: TEXT_TERTIARY }}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ===================== FEATURE GRID ===================== */}
      <section className="px-5 pt-2 pb-32">
        <div className="flex items-end justify-between mb-4">
          <h2
            className="text-[22px] font-extrabold tracking-tight"
            style={{ color: TEXT_PRIMARY, letterSpacing: "-0.01em" }}
          >
            Your Dominion
          </h2>
          <span
            className="text-[11px] uppercase tracking-wider"
            style={{ color: TEXT_TERTIARY }}
          >
            Tap to enter →
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {FEATURE_CARDS.map((card) => {
            const isHovered = hovered === card.id;
            return (
              <button
                key={card.id}
                onClick={() => {
                  if (card.id === "quests" && onOpenQuests) {
                    onOpenQuests();
                  } else {
                    onEnterFeature(card.id);
                  }
                }}
                onMouseEnter={() => setHovered(card.id)}
                onMouseLeave={() => setHovered(null)}
                className="relative text-left rounded-2xl p-4 transition-all duration-200 active:scale-[0.98]"
                style={{
                  backgroundColor: SURFACE,
                  border: `1px solid ${isHovered ? HAIRLINE_STRONG : HAIRLINE}`,
                  minHeight: 132,
                }}
              >
                {/* JP label */}
                <div
                  className="text-[9px] font-semibold tracking-widest mb-2 uppercase"
                  style={{ color: TEXT_TERTIARY }}
                >
                  {card.jpLabel}
                </div>

                {/* Icon + title */}
                <div className="flex items-center gap-2 mb-1.5">
                  <span style={{ fontSize: 20 }}>{card.icon}</span>
                  <h3
                    className="text-[15px] font-bold leading-tight"
                    style={{ color: TEXT_PRIMARY }}
                  >
                    {card.title}
                  </h3>
                </div>

                {/* Subtitle */}
                <p
                  className="text-[12px] leading-relaxed mb-2"
                  style={{ color: TEXT_SECONDARY }}
                >
                  {card.subtitle}
                </p>

                {/* Badge */}
                {card.badge && (
                  <div className="flex items-center gap-1.5">
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: card.glowColor }}
                    />
                    <span
                      className="text-[10px] font-semibold uppercase tracking-wider"
                      style={{ color: TEXT_SECONDARY }}
                    >
                      {card.badge}
                    </span>
                  </div>
                )}

                {/* Arrow */}
                <div
                  className="absolute top-4 right-4 text-[14px]"
                  style={{ color: TEXT_TERTIARY }}
                >
                  →
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ===================== STICKY CONTINUE BUTTON ===================== */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 px-5 pb-6 pt-4 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.85) 30%, rgba(0,0,0,1) 100%)",
        }}
      >
        <button
          onClick={onContinue}
          className="pointer-events-auto w-full max-w-[420px] mx-auto flex items-center justify-center gap-2 font-bold text-[15px] py-3.5 rounded-2xl transition-transform active:scale-[0.98]"
          style={{
            backgroundColor: ORANGE,
            color: "#000",
            boxShadow: "0 8px 24px rgba(255,159,10,0.25)",
          }}
        >
          <span>Continue Your Journey</span>
          <span style={{ fontSize: 18 }}>→</span>
        </button>
      </div>
    </div>
  );
};

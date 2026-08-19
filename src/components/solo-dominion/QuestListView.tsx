import React from "react";

const TEXT_PRIMARY = "#ffffff";
const TEXT_SECONDARY = "rgba(235,235,245,0.62)";
const TEXT_TERTIARY = "rgba(235,235,245,0.32)";
const SURFACE = "#0a0a0a";
const SURFACE_RAISED = "#141414";
const HAIRLINE = "rgba(255,255,255,0.08)";
const HAIRLINE_STRONG = "rgba(255,255,255,0.18)";
const ORANGE = "#ff9f0a";
const ORANGE_DARK = "#ff7a00";
const IOS_GREEN = "#34c759";
const IOS_RED = "#ff453a";

export interface QuestListItem {
  id: string;
  title: string;
  description: string;
  rank: "E" | "D" | "C" | "B" | "A" | "S";
  xp: number;
  category?: string;
  image: string;
  status?: "available" | "submitted" | "completed";
  /** when true, shows the long description in card body */
  expanded?: boolean;
}

export interface QuestSection {
  id: string;
  title: string;
  jpLabel: string;
  count: number;
  quests: QuestListItem[];
}

interface QuestListViewProps {
  playerName?: string;
  level?: number;
  tier?: string;
  rankTitle?: string;
  rankSubtitle?: string;
  xpToday?: number;
  xpTodayMax?: number;
  nextRankLabel?: string;
  xpTotal?: number;
  xpTotalMax?: number;
  questsCompleted?: number;
  questsTotal?: number;
  dailyXP?: number;
  segments?: number;
  sections: QuestSection[];
  onBack: () => void;
  onQuestClick?: (q: QuestListItem) => void;
  onHowRating?: () => void;
}

/**
 * Solo Dominion Quest List — exact Solo Leveling ARISE layout:
 *  - Top hub header (back + JP label)
 *  - Level ring + Tier + Rank title card
 *  - XP Today row (pill + next rank label)
 *  - Segmented XP bar
 *  - 3 stats (XP total / Quests / Daily)
 *  - Sectioned quest list (Main / Side)
 *  - Each card: boss image + rank pill + title + desc + status + XP reward
 */
export const QuestListView: React.FC<QuestListViewProps> = ({
  playerName = "Hunter",
  level = 1,
  tier = "Tier I",
  rankTitle = "SEEKER",
  rankSubtitle = "The first step. You have entered the dominion of your own life.",
  xpToday = 0,
  xpTodayMax = 800,
  nextRankLabel = "DEMON SLAYER @ Lv.5",
  xpTotal = 0,
  xpTotalMax = 500,
  questsCompleted = 0,
  questsTotal = 14,
  dailyXP = 0,
  segments = 28,
  sections,
  onBack,
  onQuestClick,
  onHowRating,
}) => {
  const todayPct = Math.max(0, Math.min(100, (xpToday / xpTodayMax) * 100));
  const totalPct = Math.max(0, Math.min(100, (xpTotal / xpTotalMax) * 100));
  const filled = Math.round((totalPct / 100) * segments);

  return (
    <div
      className="relative w-full"
      style={{ backgroundColor: "#000", minHeight: "100vh" }}
    >
      {/* ===================== TOP BAR ===================== */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-4 pt-5 pb-3"
        style={{ backgroundColor: "#000", borderBottom: `1px solid ${HAIRLINE}` }}>
        <div className="flex items-center gap-2.5">
          <div
            className="flex items-center justify-center font-extrabold"
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              border: `1px solid ${HAIRLINE_STRONG}`,
              color: TEXT_PRIMARY,
              fontSize: 15,
              backgroundColor: SURFACE,
            }}
          >
            M
          </div>
          <div className="flex flex-col">
            <div
              className="font-extrabold tracking-tight leading-none"
              style={{ color: TEXT_PRIMARY, fontSize: 16, letterSpacing: "-0.01em" }}
            >
              MANIFEST OS
            </div>
            <div
              className="text-[10px] mt-0.5 uppercase tracking-wider"
              style={{ color: TEXT_TERTIARY }}
            >
              Solo Dominion
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center font-bold text-[12px]"
            style={{
              minWidth: 26,
              height: 26,
              borderRadius: 13,
              padding: "0 7px",
              backgroundColor: IOS_RED,
              color: "#fff",
            }}
          >
            9+
          </div>
          <div
            className="w-9 h-9 rounded-full overflow-hidden"
            style={{
              backgroundImage: "url(/images/avatar.jpg)",
              backgroundSize: "cover",
              backgroundPosition: "center",
              border: `1px solid ${HAIRLINE_STRONG}`,
            }}
          />
        </div>
      </div>

      {/* ===================== HUB HEADER ROW (back + section label) ===================== */}
      <div className="flex items-center justify-between px-5 pt-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-[12px] font-semibold transition-opacity active:opacity-60"
          style={{ color: TEXT_SECONDARY }}
        >
          <span style={{ fontSize: 14 }}>←</span>
          <span>Back</span>
        </button>
        <div
          className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase"
          style={{
            backgroundColor: SURFACE,
            border: `1px solid ${HAIRLINE_STRONG}`,
            color: ORANGE,
          }}
        >
          クエスト
        </div>
      </div>

      {/* ===================== RATING CARD ===================== */}
      <section className="px-4 pt-4">
        <div
          className="rounded-3xl p-5 relative overflow-hidden"
          style={{ backgroundColor: SURFACE, border: `1px solid ${HAIRLINE}` }}
        >
          {/* Top: Level ring + Tier + Rank title */}
          <div className="flex items-center gap-5">
            {/* Level ring */}
            <div className="relative shrink-0" style={{ width: 96, height: 96 }}>
              <svg width="96" height="96" viewBox="0 0 96 96" className="block">
                <circle cx="48" cy="48" r="44" fill="none" stroke={HAIRLINE} strokeWidth="2" />
                <circle
                  cx="48"
                  cy="48"
                  r="44"
                  fill="none"
                  stroke={ORANGE}
                  strokeWidth="3"
                  strokeDasharray="276"
                  strokeDashoffset="276"
                  strokeLinecap="round"
                  transform="rotate(-90 48 48)"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  className="text-[9px] font-bold tracking-widest uppercase"
                  style={{ color: TEXT_TERTIARY }}
                >
                  Level
                </span>
                <span
                  className="font-extrabold leading-none"
                  style={{ color: TEXT_PRIMARY, fontSize: 36, letterSpacing: "-0.02em" }}
                >
                  {level}
                </span>
              </div>
            </div>

            {/* Right text */}
            <div className="flex-1 min-w-0">
              <div
                className="text-[10px] font-bold tracking-widest uppercase mb-1"
                style={{ color: TEXT_TERTIARY }}
              >
                {tier}
              </div>
              <div
                className="font-extrabold leading-none"
                style={{
                  color: TEXT_PRIMARY,
                  fontSize: "clamp(1.5rem, 5vw, 2rem)",
                  letterSpacing: "-0.02em",
                }}
              >
                {rankTitle}
              </div>
              <p
                className="mt-2 text-[12px] leading-snug"
                style={{ color: TEXT_SECONDARY }}
              >
                {rankSubtitle}
              </p>
            </div>
          </div>

          {/* XP TODAY row */}
          <div className="flex items-center justify-between mt-6 mb-2">
            <div className="flex items-center gap-2">
              <span
                className="text-[10px] font-bold tracking-widest uppercase"
                style={{ color: TEXT_TERTIARY }}
              >
                XP Today
              </span>
              <span
                className="px-2.5 py-0.5 rounded-md text-[11px] font-bold tabular-nums"
                style={{
                  backgroundColor: "rgba(255,159,10,0.15)",
                  color: ORANGE,
                  border: `1px solid rgba(255,159,10,0.3)`,
                }}
              >
                {xpToday} / {xpTodayMax}
              </span>
            </div>
            <span
              className="text-[10px] font-semibold"
              style={{ color: TEXT_TERTIARY }}
            >
              Next · {nextRankLabel}
            </span>
          </div>

          {/* Segmented XP bar (today) */}
          <div className="flex items-center gap-0.5">
            {Array.from({ length: segments }).map((_, i) => {
              const filledUpTo = Math.round((todayPct / 100) * segments);
              const isFilled = i < filledUpTo;
              return (
                <div
                  key={i}
                  className="h-1.5 flex-1 rounded-[1.5px]"
                  style={{
                    backgroundColor: isFilled ? ORANGE : HAIRLINE,
                  }}
                />
              );
            })}
          </div>

          {/* 3 stats row */}
          <div className="grid grid-cols-3 gap-3 mt-5">
            <StatPill
              label="Total"
              value={`${xpTotal} / ${xpTotalMax} XP`}
              valueColor={ORANGE}
            />
            <StatPill
              label="Quests"
              value={`${questsCompleted} / ${questsTotal}`}
              valueColor={TEXT_PRIMARY}
              labelAlign="center"
            />
            <StatPill
              label="Daily"
              value={`${dailyXP} XP`}
              valueColor={TEXT_PRIMARY}
              labelAlign="right"
            />
          </div>
        </div>
      </section>

      {/* ===================== QUEST SECTIONS ===================== */}
      <section className="px-4 pt-6 pb-16 space-y-7">
        {sections.map((section) => (
          <div key={section.id}>
            {/* Section header */}
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 14, color: ORANGE }}>
                  {section.id === "main" ? "🔥" : section.id === "side" ? "◎" : "✦"}
                </span>
                <h3
                  className="text-[15px] font-extrabold tracking-tight"
                  style={{ color: TEXT_PRIMARY, letterSpacing: "-0.01em" }}
                >
                  {section.title.toUpperCase()}
                </h3>
              </div>
              <span
                className="text-[12px] font-bold tabular-nums"
                style={{ color: TEXT_TERTIARY }}
              >
                {section.count}
              </span>
            </div>

            {/* Quest cards */}
            <div className="space-y-3">
              {section.quests.map((q) => (
                <QuestCard
                  key={q.id}
                  quest={q}
                  onClick={() => onQuestClick?.(q)}
                />
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};

// ===================== STAT PILL =====================
const StatPill: React.FC<{
  label: string;
  value: string;
  valueColor: string;
  labelAlign?: "left" | "center" | "right";
}> = ({ label, value, valueColor, labelAlign = "left" }) => (
  <div className="flex flex-col" style={{ alignItems: labelAlign === "center" ? "center" : labelAlign === "right" ? "flex-end" : "flex-start" }}>
    <span
      className="text-[10px] uppercase tracking-wider"
      style={{ color: TEXT_TERTIARY }}
    >
      {label}
    </span>
    <span
      className="text-[12px] font-bold mt-0.5 tabular-nums"
      style={{ color: valueColor }}
    >
      {value}
    </span>
  </div>
);

// ===================== QUEST CARD =====================
const QuestCard: React.FC<{
  quest: QuestListItem;
  onClick?: () => void;
}> = ({ quest, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-stretch gap-3 rounded-2xl p-3 text-left transition-transform active:scale-[0.99]"
      style={{
        backgroundColor: SURFACE,
        border: `1px solid ${HAIRLINE}`,
      }}
    >
      {/* Left: Boss image + rank badge */}
      <div
        className="relative shrink-0 rounded-xl overflow-hidden"
        style={{ width: 80, height: 96 }}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${quest.image})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        {/* dark gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.0) 40%, rgba(0,0,0,0.6) 100%)",
          }}
        />
        {/* Rank badge bottom-left */}
        <div
          className="absolute bottom-1.5 left-1.5 flex items-center justify-center font-extrabold text-[12px]"
          style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            backgroundColor: ORANGE,
            color: "#000",
          }}
        >
          {quest.rank}
        </div>
      </div>

      {/* Middle: Rank pill + title + desc + status */}
      <div className="flex-1 min-w-0 py-1">
        <div className="flex items-center gap-1.5 mb-1">
          <span
            className="px-1.5 py-0.5 rounded-md text-[9px] font-extrabold tracking-wider uppercase"
            style={{
              border: `1px solid ${ORANGE}`,
              color: ORANGE,
              backgroundColor: "rgba(255,159,10,0.08)",
            }}
          >
            {quest.rank}-RANK
          </span>
          {quest.category && (
            <span
              className="text-[9px] font-bold tracking-wider uppercase"
              style={{ color: TEXT_TERTIARY }}
            >
              {quest.category}
            </span>
          )}
        </div>
        <h4
          className="text-[14px] font-extrabold tracking-tight leading-tight"
          style={{ color: TEXT_PRIMARY, letterSpacing: "-0.005em" }}
        >
          {quest.title}
        </h4>
        <p
          className="text-[11px] mt-1 leading-snug line-clamp-2"
          style={{ color: TEXT_SECONDARY }}
        >
          {quest.description}
        </p>
        <div
          className="text-[10px] mt-1.5 font-medium"
          style={{
            color: quest.status === "submitted" ? IOS_GREEN : TEXT_TERTIARY,
          }}
        >
          {quest.status === "submitted"
            ? "✓ Proof submitted"
            : quest.status === "completed"
            ? "✓ Slain"
            : "Submit proof to claim"}
        </div>
      </div>

      {/* Right: XP reward + arrow */}
      <div className="flex flex-col items-end justify-center shrink-0 pl-1">
        <span
          className="font-extrabold leading-none tabular-nums"
          style={{ color: ORANGE, fontSize: 22, letterSpacing: "-0.02em" }}
        >
          +{quest.xp}
        </span>
        <span
          className="text-[9px] mt-0.5 font-bold tracking-wider uppercase"
          style={{ color: TEXT_TERTIARY }}
        >
          XP
        </span>
        <span
          className="mt-2 text-[14px]"
          style={{ color: TEXT_TERTIARY }}
        >
          →
        </span>
      </div>
    </button>
  );
};

// ===================== DEMO DATA =====================
export const DEMO_MAIN_QUESTS: QuestListItem[] = [
  {
    id: "m1",
    title: "90 MIN DEEP WORK",
    description: "Complete 90 minutes of uninterrupted, phone-silenced focused work on your #1 priority goal.",
    rank: "C",
    xp: 120,
    category: "Mind",
    image: "/images/boss_solo_03.jpg",
    status: "available",
  },
  {
    id: "m2",
    title: "100 Push-ups",
    description: "Complete 100 push-ups across the day in proper form. Break into sets if needed.",
    rank: "C",
    xp: 88,
    category: "Body",
    image: "/images/anime_warrior_dark_01.jpg",
    status: "available",
  },
  {
    id: "m3",
    title: "Read 30 Pages",
    description: "Read 30 pages of a high-value book. No phone, no distractions, no skipping.",
    rank: "D",
    xp: 60,
    category: "Knowledge",
    image: "/images/anime_knight_dark_02.jpg",
    status: "submitted",
  },
];

export const DEMO_SIDE_QUESTS: QuestListItem[] = [
  {
    id: "s1",
    title: "50 PUSH-UPS",
    description: "Quick bodyweight finisher. Drop and give 50 before the day ends.",
    rank: "D",
    xp: 100,
    category: "Body",
    image: "/images/anime_trainee_warrior_1785176432904.jpg",
    status: "available",
  },
  {
    id: "s2",
    title: "Cold Shower 3 Min",
    description: "End your shower with 3 minutes of cold water. Discipline is forged in discomfort.",
    rank: "E",
    xp: 40,
    category: "Discipline",
    image: "/images/anime_shadow_knight_1785176768012.jpg",
    status: "available",
  },
  {
    id: "s3",
    title: "Meditate 10 Min",
    description: "Sit in silence for 10 minutes. Observe your breath, observe your mind.",
    rank: "E",
    xp: 35,
    category: "Mind",
    image: "/images/anime_hero_artwork_1785263718355.jpg",
    status: "completed",
  },
];

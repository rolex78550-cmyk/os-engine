/**
 * Solo Dominion — Quest / Rank / XP System
 *
 * Pure data + helpers used by SoloDominion.tsx. We keep this as a plain
 * TypeScript module so we don't introduce new Firestore collections —
 * existing data is reused and evolved (mission proofs live under
 * users/{uid}/mission_proofs/ which is already created).
 *
 * This module owns:
 *  - Quest rank system (E/D/C/B/A)
 *  - Default quest catalog (used when the user has no custom goals yet)
 *  - Boss battle catalog
 *  - Rank tier / character evolution ladder
 *  - XP thresholds and helpers
 */

export type QuestRank = "E" | "D" | "C" | "B" | "A";

export type QuestCategory =
  | "mind"
  | "body"
  | "wealth"
  | "career"
  | "goals"
  | "knowledge"
  | "life"
  | "social"
  | "discipline"
  | "manifestation";

export type QuestQuestType = "main" | "side" | "discipline" | "boss";

export interface QuestDef {
  id: string;
  title: string;
  category: QuestCategory;
  rank: QuestRank;
  xp: number;
  description: string;
  questType: QuestQuestType;
  bossImage?: string; // For boss battles only
}

export const RANK_XP: Record<QuestRank, { min: number; max: number }> = {
  E: { min: 10, max: 20 },
  D: { min: 30, max: 50 },
  C: { min: 75, max: 120 },
  B: { min: 150, max: 300 },
  A: { min: 300, max: 500 },
};

export const RANK_COLOR: Record<QuestRank, string> = {
  E: "#94a3b8",  // slate-400
  D: "#22c55e",  // green-500
  C: "#3b82f6",  // blue-500
  B: "#a855f7",  // purple-500
  A: "#f59e0b",  // amber-500
};

export const RANK_LABEL: Record<QuestRank, string> = {
  E: "E-RANK",
  D: "D-RANK",
  C: "C-RANK",
  B: "B-RANK",
  A: "A-RANK",
};

export const CATEGORY_ICON: Record<QuestCategory, string> = {
  mind: "🧠",
  body: "💪",
  wealth: "💰",
  career: "🚀",
  goals: "🎯",
  knowledge: "📚",
  life: "🧹",
  social: "🤝",
  discipline: "🔥",
  manifestation: "🌌",
};

export const CATEGORY_LABEL: Record<QuestCategory, string> = {
  mind: "MIND",
  body: "BODY",
  wealth: "WEALTH",
  career: "CAREER",
  goals: "GOALS",
  knowledge: "KNOWLEDGE",
  life: "LIFE",
  social: "SOCIAL",
  discipline: "DISCIPLINE",
  manifestation: "MANIFESTATION",
};

/**
 * Default daily quest board — used when the user has no custom goals.
 * Real actions. No button-mash XP.
 */
export const DEFAULT_QUESTS: QuestDef[] = [
  {
    id: "default-main-deep-work",
    title: "90 MIN DEEP WORK",
    category: "career",
    rank: "C",
    xp: 120,
    questType: "main",
    description: "Complete 90 minutes of uninterrupted, phone-silenced focused work on your highest-leverage project.",
  },
  {
    id: "default-side-workout",
    title: "30 MIN WORKOUT",
    category: "body",
    rank: "D",
    xp: 50,
    questType: "side",
    description: "Train your body for at least 30 minutes. Push-ups, gym, run, yoga — any deliberate movement counts.",
  },
  {
    id: "default-side-read",
    title: "READ 10 PAGES",
    category: "knowledge",
    rank: "E",
    xp: 20,
    questType: "side",
    description: "Read 10 pages of a useful book. No feeds, no skim — actually read.",
  },
  {
    id: "default-side-journal",
    title: "JOURNAL — 5 MIN",
    category: "mind",
    rank: "E",
    xp: 15,
    questType: "side",
    description: "Write your wins, lessons and intentions for tomorrow. Ink on paper or words on screen.",
  },
  {
    id: "default-disci-no-social",
    title: "NO SOCIAL MEDIA UNTIL 6 PM",
    category: "discipline",
    rank: "C",
    xp: 75,
    questType: "discipline",
    description: "Stay away from distracting social media until your chosen hour. Prove it with a screenshot if needed.",
  },
  {
    id: "default-disci-hydration",
    title: "DRINK 2L WATER",
    category: "body",
    rank: "E",
    xp: 10,
    questType: "side",
    description: "Hydrate. Two liters through the day. Your body is the first quest.",
  },
];

/**
 * Boss battles — optional high-XP challenges the user can choose to
 * confront. Each boss is a real obstacle, not a checkbox.
 */
export const BOSS_QUESTS: QuestDef[] = [
  {
    id: "boss-procrastination",
    title: "THE PROCRASTINATION DEMON",
    category: "discipline",
    rank: "B",
    xp: 250,
    questType: "boss",
    description: "Complete 3 hours of uninterrupted deep work. No phone. No excuses. Slay the demon.",
    bossImage: "/images/anime_red_warrior_1785177142520.jpg",
  },
  {
    id: "boss-comfort",
    title: "THE COMFORT DEMON",
    category: "discipline",
    rank: "B",
    xp: 200,
    questType: "boss",
    description: "Complete the task you have been actively avoiding for the past 7 days. Today you face it.",
    bossImage: "/images/anime_demon_slayer.jpg",
  },
  {
    id: "boss-distraction",
    title: "THE DISTRACTION DEMON",
    category: "discipline",
    rank: "B",
    xp: 200,
    questType: "boss",
    description: "Complete a 4-hour social media and news detox. Reclaim your attention.",
    bossImage: "/images/anime_shadow_knight_1785176768012.jpg",
  },
  {
    id: "boss-fear",
    title: "THE FEAR DEMON",
    category: "career",
    rank: "B",
    xp: 200,
    questType: "boss",
    description: "Take one concrete action that genuinely makes you uncomfortable — send the DM, make the call, publish the work.",
    bossImage: "/images/anime_shadow_knight_1785176768012.jpg",
  },
  {
    id: "boss-doubt",
    title: "THE DOUBT DEMON",
    category: "career",
    rank: "A",
    xp: 250,
    questType: "boss",
    description: "Publish or show your work publicly. A post, a repo, a video, a portfolio piece. Make it real.",
    bossImage: "/images/anime_shadow_monarch_1785176449409.jpg",
  },
  {
    id: "boss-chaos",
    title: "THE CHAOS DEMON",
    category: "life",
    rank: "B",
    xp: 150,
    questType: "boss",
    description: "Completely organize your workspace, files or one full life system. Order from chaos.",
    bossImage: "/images/anime_trainee_warrior_1785176432904.jpg",
  },
];

/**
 * Character evolution ladder. Driven by data, not hardcoded JSX.
 * Adding new ranks later is just appending here.
 */
export interface CharacterTier {
  id: string;
  level: number;
  name: string;
  title: string;
  image: string;
  accent: "purple" | "red" | "slate" | "amber";
  borderGlow: string;
  iconBg: string;
  ornamentColor: string;
  badge: string;
  description: string;
  quote: string;
  label: string;
  perks: string[];
}

export const CHARACTER_TIERS: CharacterTier[] = [
  {
    id: "seeker",
    level: 1,
    name: "SEEKER",
    title: "CIVILIAN SEEKER",
    image: "/images/anime_trainee_warrior_1785176432904.jpg",
    accent: "purple",
    borderGlow: "rgba(168, 85, 247, 0.6)",
    iconBg: "from-violet-500 via-purple-600 to-fuchsia-600",
    ornamentColor: "text-purple-300",
    badge: "👤 SEEKER TRAINEE",
    description: "The first step. You have entered the dominion of your own life.",
    quote: "A journey of a thousand leagues begins with a single deliberate habit.",
    label: "TIER I",
    perks: ["+0% XP Multiplier", "Daily Quest Access", "Welcome Card Unlocked"],
  },
  {
    id: "demon-slayer",
    level: 5,
    name: "DEMON SLAYER",
    title: "DEMON SLAYER",
    image: "/images/anime_demon_slayer.jpg",
    accent: "purple",
    borderGlow: "rgba(168, 85, 247, 0.7)",
    iconBg: "from-violet-500 via-purple-600 to-fuchsia-600",
    ornamentColor: "text-purple-300",
    badge: "⚔️ DEMON SLAYER",
    description: "You have tasted blood against your own excuses. The demons no longer scare you.",
    quote: "Cut through doubt.\nSlay your demons.\nBecome unstoppable.",
    label: "TIER I",
    perks: ["+10% XP Multiplier", "Custom Quest Creator", "Streak Freeze Shield"],
  },
  {
    id: "crimson-berserker",
    level: 12,
    name: "CRIMSON BERSERKER",
    title: "CRIMSON BERSERKER",
    image: "/images/anime_red_warrior_1785177142520.jpg",
    accent: "red",
    borderGlow: "rgba(239, 68, 68, 0.6)",
    iconBg: "from-rose-500 via-red-600 to-amber-600",
    ornamentColor: "text-red-300",
    badge: "⚔️ CRIMSON BERSERKER",
    description: "Forged in crimson fire. Physical and mental willpower rising infinitely.",
    quote: "Rage is temporary.\nDiscipline is eternal.\nChoose your legacy.",
    label: "TIER II",
    perks: ["+25% XP Multiplier", "Boss Battle Damage +25%", "Guild Vanguard Access"],
  },
  {
    id: "shadow-commander",
    level: 25,
    name: "SHADOW COMMANDER",
    title: "SHADOW COMMANDER",
    image: "/images/anime_shadow_knight_1785176768012.jpg",
    accent: "slate",
    borderGlow: "rgba(148, 163, 184, 0.6)",
    iconBg: "from-slate-500 via-zinc-600 to-neutral-700",
    ornamentColor: "text-slate-200",
    badge: "⚔️ SHADOW KNIGHT",
    description: "Master of focus. The world is ruled by those who operate in the shadows.",
    quote: "The world is ruled\nby those who operate\nin the shadows.",
    label: "TIER III",
    perks: ["+40% XP Multiplier", "+40% Boss Damage", "Shadow Aura Unlocked"],
  },
  {
    id: "cosmic-shadow-monarch",
    level: 50,
    name: "COSMIC SHADOW MONARCH",
    title: "COSMIC SHADOW MONARCH",
    image: "/images/anime_shadow_monarch_1785176449409.jpg",
    accent: "amber",
    borderGlow: "rgba(251, 191, 36, 0.7)",
    iconBg: "from-amber-400 via-yellow-500 to-orange-500",
    ornamentColor: "text-amber-300",
    badge: "👑 COSMIC MONARCH",
    description: "Peak reality creation. You do not chase the universe — you become something it cannot ignore.",
    quote: "You don't chase the universe.\nYou become something\nit bows to.",
    label: "TIER IV",
    perks: ["+50% XP Multiplier", "Instant Boss Obliteration", "Supreme Monarch Title"],
  },
];

/** Returns the highest tier the user has unlocked. */
export function getCurrentTier(level: number): CharacterTier {
  let current = CHARACTER_TIERS[0];
  for (const t of CHARACTER_TIERS) {
    if (level >= t.level) current = t;
    else break;
  }
  return current;
}

/** Returns the next tier the user is working toward, or null if apex. */
export function getNextTier(level: number): CharacterTier | null {
  for (const t of CHARACTER_TIERS) {
    if (level < t.level) return t;
  }
  return null;
}

/** XP needed to reach the next level from a given level. */
export function xpForNextLevel(level: number): number {
  return level * 500;
}

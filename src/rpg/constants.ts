// ============================================================
// RPG PROGRESSION SYSTEM — CONSTANTS (config, not state)
// Tunable numbers. Pure data. Imported by engine + UI.
// ============================================================

import type { RankTier } from "./types";

/**
 * 9 rank tiers. Derived from playerScore thresholds.
 * `coinBonus` is granted ONCE on first promotion to that tier.
 */
export const RANK_TIERS: RankTier[] = [
  { index: 0, name: "Iron",         minScore: 0,      color: "#9CA3AF", glow: "rgba(156,163,175,0.5)", cardStage: 1, titleUnlocked: "Initiate",   frameId: "default",   coinBonus: 0 },
  { index: 1, name: "Bronze",       minScore: 800,    color: "#CD7F32", glow: "rgba(205,127,50,0.55)", cardStage: 2, titleUnlocked: "Rising",     frameId: "bronze",    coinBonus: 100 },
  { index: 2, name: "Silver",       minScore: 2500,   color: "#D1D5DB", glow: "rgba(209,213,219,0.6)", cardStage: 3, titleUnlocked: "Striver",    frameId: "silver",    coinBonus: 200 },
  { index: 3, name: "Gold",         minScore: 6000,   color: "#FBBF24", glow: "rgba(251,191,36,0.6)",  cardStage: 4, titleUnlocked: "Adept",      frameId: "gold",      coinBonus: 400 },
  { index: 4, name: "Platinum",     minScore: 12000,  color: "#22D3EE", glow: "rgba(34,211,238,0.6)",  cardStage: 5, titleUnlocked: "Elite",      frameId: "platinum",  coinBonus: 750 },
  { index: 5, name: "Diamond",      minScore: 22000,  color: "#67E8F9", glow: "rgba(103,232,249,0.7)", cardStage: 6, titleUnlocked: "Mythic",     frameId: "diamond",   coinBonus: 1200 },
  { index: 6, name: "Master",       minScore: 38000,  color: "#A855F7", glow: "rgba(168,85,247,0.65)", cardStage: 7, titleUnlocked: "Ascendant",  frameId: "master",    coinBonus: 2000 },
  { index: 7, name: "Grandmaster",  minScore: 60000,  color: "#818CF8", glow: "rgba(129,140,248,0.7)", cardStage: 8, titleUnlocked: "Sovereign",  frameId: "grandmaster", coinBonus: 3000 },
  { index: 8, name: "Legend",       minScore: 100000, color: "#F59E0B", glow: "rgba(245,158,11,0.75)", cardStage: 9, titleUnlocked: "Legend",     frameId: "legend",    coinBonus: 5000 },
];

/**
 * RPG Level titles — COSMETIC overlay on the existing level number.
 * Does NOT replace the existing universeRank. Purely for the RPG page.
 */
export const RPG_LEVEL_TITLES: { minLevel: number; title: string; color: string }[] = [
  { minLevel: 1,   title: "Awakening",   color: "#94A3B8" },
  { minLevel: 5,   title: "Ascendant",   color: "#A78BFA" },
  { minLevel: 10,  title: "Adept",       color: "#22D3EE" },
  { minLevel: 20,  title: "Veteran",     color: "#34D399" },
  { minLevel: 30,  title: "Elite",       color: "#FBBF24" },
  { minLevel: 50,  title: "Mythic",      color: "#F472B6" },
  { minLevel: 75,  title: "Transcendent", color: "#818CF8" },
  { minLevel: 100, title: "Apex",        color: "#F59E0B" },
];

/**
 * Coin earning rules. Coins are earned alongside XP and on milestones.
 */
export const COIN_RULES = {
  /** Fraction of XP gained that also becomes coins. */
  xpToCoinRatio: 0.5,
  /** Coins granted on level up = newLevel × multiplier. */
  levelUpMultiplier: 10,
  /** Coins granted on rank up = targetTierIndex × multiplier. */
  rankUpMultiplier: 100,
  /** Coins granted on streak milestone = milestoneDays × multiplier. */
  milestoneMultiplier: 20,
  /** Flat coins for the first action of a calendar day. */
  dailyLogin: 5,
  /** Flat coins when a goal task is AI-verified. */
  goalVerified: 25,
  /** Cap on negative spend to prevent abuse (wallet can't go below this). */
  minBalance: 0,
} as const;

/** Streak milestones that grant coin bonuses (mirrors existing MILESTONES). */
export const COIN_MILESTONES = [7, 14, 30, 50, 100, 180, 365];

/**
 * Monthly season reward pool.
 * Position = rank in the monthly leaderboard at season close.
 */
export const SEASON_REWARDS: { maxPosition: number; coins: number; title: string; frame?: string; badge?: string }[] = [
  { maxPosition: 1,   coins: 5000, title: "Season Champion", frame: "champion" },
  { maxPosition: 3,   coins: 2500, title: "Podium",          frame: "podium" },
  { maxPosition: 10,  coins: 1000, title: "Top 10" },
  { maxPosition: 50,  coins: 500,  title: "Elite Contender", badge: "elite" },
  { maxPosition: 100, coins: 250,  title: "Ranked" },
];

/** Player score weights. Composite metric drives the leaderboard. */
export const SCORE_WEIGHTS = {
  totalXp: 1,
  level: 50,
  streak: 30,
  consistency: 10,
  rankTier: 250,
  verifiedGoals: 100,
} as const;

/** Current season id (YYYY-MM) in UTC. */
export function getCurrentSeasonId(now: Date = new Date()): string {
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

/** Previous season id. */
export function getPreviousSeasonId(now: Date = new Date()): string {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  return getCurrentSeasonId(d);
}

/** Firestore paths used by the RPG system (single source of truth). */
export const RPG_PATHS = {
  userDoc: (uid: string) => `users/${uid}` as const,
  coinTransactions: (uid: string) => `users/${uid}/coin_transactions` as const,
  rewardsClaimed: (uid: string) => `users/${uid}/rewards_claimed` as const,
  leaderboardEntry: (uid: string) => `leaderboard/${uid}` as const,
  seasonDoc: (seasonId: string) => `seasons/${seasonId}` as const,
} as const;

/** Score debounce — avoid writing leaderboard more often than this. */
export const SCORE_WRITE_DEBOUNCE_MS = 120_000; // 2 minutes

/** Default empty RPG state for a brand-new player. */
export function defaultRPGState(playerNumber: string): RPGPlayerStateLike {
  return {
    playerNumber,
    coins: 0,
    playerScore: 0,
    monthlyScore: 0,
    rank: "Iron",
    rankTierIndex: 0,
    highestRank: "Iron",
    highestRankIndex: 0,
    rankHistory: [],
    cardEvolutionStage: 1,
    cardFrame: "default",
    cardAccent: "amber",
    titles: ["Initiate"],
    equippedTitle: "Initiate",
    seasonId: getCurrentSeasonId(),
    seasonClaimed: {},
    joinDate: new Date().toISOString(),
    rpgInitialized: false,
  };
}

// Local helper type to avoid an import cycle in the default factory.
type RPGPlayerStateLike = {
  playerNumber: string;
  coins: number;
  playerScore: number;
  monthlyScore: number;
  rank: "Iron";
  rankTierIndex: number;
  highestRank: "Iron";
  highestRankIndex: number;
  rankHistory: never[];
  cardEvolutionStage: number;
  cardFrame: string;
  cardAccent: string;
  titles: string[];
  equippedTitle: string;
  seasonId: string;
  seasonClaimed: Record<string, never>;
  joinDate: string;
  rpgInitialized: boolean;
};

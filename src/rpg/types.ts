// ============================================================
// RPG PROGRESSION SYSTEM — TYPES
// Pure data shapes. No logic. Additive to the app's existing types.
// The Goal system types (Desire, GoalBlueprint, etc.) are UNTOUCHED.
// ============================================================

/** One of the 9 rank tiers. Index 0 (Iron) → 8 (Legend). */
export type RankName =
  | "Iron"
  | "Bronze"
  | "Silver"
  | "Gold"
  | "Platinum"
  | "Diamond"
  | "Master"
  | "Grandmaster"
  | "Legend";

/** Definition of a rank tier (config, not state). */
export interface RankTier {
  index: number;
  name: RankName;
  minScore: number;
  color: string;
  glow: string;
  cardStage: number;       // 1-9, drives character art tier
  titleUnlocked: string;   // title granted on first reaching this rank
  frameId: string;         // cosmetic frame unlocked
  coinBonus: number;       // coins granted on promotion to this tier
}

/** A single entry in the player's promotion history. */
export interface RankHistoryEntry {
  rank: RankName;
  tierIndex: number;
  achievedAt: string;      // ISO timestamp
  scoreAtPromotion: number;
}

/** Coin ledger entry — mirrors the existing xp_transactions pattern. */
export interface CoinTransaction {
  id: string;
  userId?: string;
  amount: number;           // positive = earn, negative = spend
  reason: string;
  type: "earn" | "spend" | "bonus";
  source:
    | "action"
    | "levelup"
    | "rankup"
    | "milestone"
    | "dailylogin"
    | "goalverified"
    | "shop"
    | "season"
    | "migration";
  createdAt: string;        // ISO timestamp
  localDate: string;        // YYYY-MM-DD
}

/** A claimed cosmetic reward. */
export interface RewardClaimed {
  id: string;
  type: "frame" | "title" | "theme" | "bonus";
  name: string;
  unlockedAt: string;
  source: "rank" | "season" | "shop" | "milestone";
}

/** Per-user leaderboard document (global + monthly). */
export interface LeaderboardEntry {
  uid: string;
  name: string;
  playerNumber: string;
  avatarEmoji?: string;
  level: number;
  rank: RankName;
  rankTierIndex: number;
  playerScore: number;       // all-time, global sort key
  monthlyScore: number;      // current season sort key
  seasonId: string;          // "YYYY-MM" the monthlyScore belongs to
  streak: number;
  consistency: number;
  updatedAt: string;
  me?: boolean;              // client-side flag
  position?: number;         // client-side rank position
}

/** Closed-season snapshot (top-N at month end). Written by cron. */
export interface SeasonSnapshot {
  seasonId: string;          // "YYYY-MM"
  closedAt: string;
  entries: { uid: string; name: string; playerNumber: string; rank: RankName; monthlyScore: number; position: number }[];
  rewardsDistributed: boolean;
}

/** RPG fields added to users/{uid}. All optional → backward compatible. */
export interface RPGPlayerState {
  playerNumber: string;             // unique, assigned once, forever
  coins: number;
  playerScore: number;
  monthlyScore: number;
  rank: RankName;
  rankTierIndex: number;
  highestRank: RankName;
  highestRankIndex: number;
  rankHistory: RankHistoryEntry[];
  cardEvolutionStage: number;       // 1-9
  cardFrame: string;                // equipped frame id
  cardAccent: string;               // equipped theme/accent
  titles: string[];
  equippedTitle: string | null;
  seasonId: string;                 // current season "YYYY-MM"
  seasonClaimed: Record<string, boolean>;
  joinDate: string;
  rpgInitialized: boolean;
}

/** Input needed to compute a player's score. */
export interface ScoreInput {
  totalXp: number;
  level: number;
  streak: number;
  consistency: number;       // 0-100
  rankTierIndex: number;
  verifiedGoals: number;
}

/** Input for monthly score (this-season deltas). */
export interface MonthlyScoreInput {
  monthlyXp: number;
  level: number;
  monthlyStreakDays: number;
  consistency: number;
  rankTierIndex: number;
  monthlyVerifiedGoals: number;
}

/** Result of deriving the full RPG state from a profile. */
export interface RPGDerivedState {
  playerScore: number;
  monthlyScore: number;
  rank: RankTier;
  nextRank: RankTier | null;
  rankProgress: number;            // 0-100, progress to next rank
  coinsForCurrentXp: number;       // coins retroactively earned
  isMaxRank: boolean;
  levelTitle: { title: string; color: string };
}

/** Result of the one-time RPG migration for an existing user. */
export interface RPGMigration {
  fields: Partial<RPGPlayerState>;
  rankPromotion: RankHistoryEntry;
}

// Future AI compatibility — reserved shapes, nullable for now.
export interface RPGAiProfile {
  playStyle?: string;
  strengths?: string[];
  weaknesses?: string[];
  coachingTone?: "calm" | "intense" | "strategic";
}

export interface RPGPrediction {
  nextRankEta?: string;
  burnoutRisk?: "Low" | "Medium" | "High";
  suggestedFocus?: string;
}

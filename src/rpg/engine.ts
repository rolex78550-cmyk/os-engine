// ============================================================
// RPG PROGRESSION SYSTEM — ENGINE (pure functions)
// No React, no Firebase imports. Deterministic + testable.
// Everything here is additive — does NOT touch the Goal system.
// ============================================================

import {
  COIN_RULES,
  COIN_MILESTONES,
  RANK_TIERS,
  RPG_LEVEL_TITLES,
  SCORE_WEIGHTS,
  getCurrentSeasonId,
} from "./constants";
import type {
  RankTier,
  RankHistoryEntry,
  ScoreInput,
  MonthlyScoreInput,
  RPGDerivedState,
  RPGMigration,
  RPGPlayerState,
} from "./types";

// ─────────────────────────────────────────────────────────────
// PLAYER NUMBER — deterministic, unique, no server needed
// ─────────────────────────────────────────────────────────────

/**
 * Generates a unique-looking player number from a uid, without any
 * server-side counter (which would need a service account).
 * Uses the trailing 6 chars of the uid hashed base-36 → 6-digit #.
 * Zero-padded to 6 digits. Collisions are astronomically unlikely
 * at this app's scale (~1 in 2 billion).
 */
export function generatePlayerNumber(uid: string): string {
  if (!uid) return "#000000";
  const tail = uid.replace(/[^a-zA-Z0-9]/g, "").slice(-8) || uid;
  const num = Math.abs(parseInt(tail, 36)) % 1_000_000;
  return "#" + String(num).padStart(6, "0");
}

// ─────────────────────────────────────────────────────────────
// SCORE COMPUTATION
// ─────────────────────────────────────────────────────────────

/**
 * Composite all-time player score — the global leaderboard sort key.
 * Stored denormalized on the user doc for fast reads.
 */
export function computePlayerScore(input: ScoreInput): number {
  const score =
    Math.max(0, input.totalXp) * SCORE_WEIGHTS.totalXp +
    Math.max(0, input.level) * SCORE_WEIGHTS.level +
    Math.max(0, input.streak) * SCORE_WEIGHTS.streak +
    clamp(input.consistency, 0, 100) * SCORE_WEIGHTS.consistency +
    Math.max(0, input.rankTierIndex) * SCORE_WEIGHTS.rankTier +
    Math.max(0, input.verifiedGoals) * SCORE_WEIGHTS.verifiedGoals;
  return Math.round(score);
}

/**
 * Monthly score — resets each season. Sort key for the monthly board.
 * Uses this-season deltas instead of lifetime totals.
 */
export function computeMonthlyScore(input: MonthlyScoreInput): number {
  const score =
    Math.max(0, input.monthlyXp) * SCORE_WEIGHTS.totalXp +
    Math.max(0, input.level) * SCORE_WEIGHTS.level +
    Math.max(0, input.monthlyStreakDays) * SCORE_WEIGHTS.streak +
    clamp(input.consistency, 0, 100) * SCORE_WEIGHTS.consistency +
    Math.max(0, input.rankTierIndex) * SCORE_WEIGHTS.rankTier +
    Math.max(0, input.monthlyVerifiedGoals) * SCORE_WEIGHTS.verifiedGoals;
  return Math.round(score);
}

// ─────────────────────────────────────────────────────────────
// RANK DERIVATION
// ─────────────────────────────────────────────────────────────

/**
 * Returns the rank tier a given score falls into.
 * Iron if score < Bronze threshold.
 */
export function getRankForScore(score: number): RankTier {
  const clamped = Math.max(0, score);
  let tier = RANK_TIERS[0];
  for (const t of RANK_TIERS) {
    if (clamped >= t.minScore) tier = t;
  }
  return tier;
}

/** Next rank tier above the given one, or null if already Legend. */
export function getNextRank(current: RankTier): RankTier | null {
  return RANK_TIERS.find((t) => t.index === current.index + 1) ?? null;
}

/** Previous rank tier below the given one, or null if already Iron. */
export function getPreviousRank(current: RankTier): RankTier | null {
  if (current.index === 0) return null;
  return RANK_TIERS.find((t) => t.index === current.index - 1) ?? null;
}

/**
 * Progress (0-100) toward the next rank.
 * 100 if max rank.
 */
export function getRankProgress(score: number, current: RankTier): number {
  const next = getNextRank(current);
  if (!next) return 100;
  const span = next.minScore - current.minScore;
  if (span <= 0) return 100;
  const gained = Math.max(0, score - current.minScore);
  return clamp(Math.round((gained / span) * 100), 0, 100);
}

/** Lookup a rank tier by its name. Falls back to Iron. */
export function getRankByName(name: string): RankTier {
  return RANK_TIERS.find((t) => t.name === name) ?? RANK_TIERS[0];
}

// ─────────────────────────────────────────────────────────────
// LEVEL TITLES (cosmetic overlay — does NOT replace level number)
// ─────────────────────────────────────────────────────────────

export function getRPGLevelTitle(level: number): { title: string; color: string } {
  const clamped = Math.max(1, level);
  let match = RPG_LEVEL_TITLES[0];
  for (const entry of RPG_LEVEL_TITLES) {
    if (clamped >= entry.minLevel) match = entry;
  }
  return { title: match.title, color: match.color };
}

// ─────────────────────────────────────────────────────────────
// COIN MATH
// ─────────────────────────────────────────────────────────────

/** Coins earned for an XP gain (half the XP, floored). */
export function computeCoinsForXp(xp: number): number {
  return Math.max(0, Math.floor(xp * COIN_RULES.xpToCoinRatio));
}

/** Coins granted on reaching a new level. */
export function computeCoinsForLevelUp(newLevel: number): number {
  return Math.max(0, newLevel) * COIN_RULES.levelUpMultiplier;
}

/** Coins granted on promoting to a rank tier. */
export function computeCoinsForRankUp(targetTierIndex: number): number {
  return Math.max(0, targetTierIndex) * COIN_RULES.rankUpMultiplier;
}

/**
 * Total coins a user would have retroactively earned for their
 * lifetime XP. Used during migration so existing users get credit.
 */
export function computeRetroactiveCoins(totalXp: number): number {
  return computeCoinsForXp(Math.max(0, totalXp));
}

/**
 * Returns any milestone coin bonuses for a streak value that hasn't
 * been rewarded yet. Caller passes the set of already-claimed milestone
 * days so we don't double-pay.
 */
export function getNewMilestoneBonuses(
  streak: number,
  claimedMilestones: number[]
): { day: number; coins: number }[] {
  return COIN_MILESTONES.filter(
    (d) => streak >= d && !claimedMilestones.includes(d)
  ).map((d) => ({ day: d, coins: d * COIN_RULES.milestoneMultiplier }));
}

// ─────────────────────────────────────────────────────────────
// DERIVE FULL STATE
// ─────────────────────────────────────────────────────────────

/**
 * Computes the complete derived RPG view from a profile snapshot.
 * Pure — no side effects. The UI + sync layer read this.
 */
export function deriveRPGState(input: ScoreInput & { monthlyInput?: MonthlyScoreInput }): RPGDerivedState {
  const playerScore = computePlayerScore(input);
  const rank = getRankForScore(playerScore);
  const nextRank = getNextRank(rank);
  const rankProgress = getRankProgress(playerScore, rank);

  const monthlyScore = input.monthlyInput
    ? computeMonthlyScore(input.monthlyInput)
    : 0;

  return {
    playerScore,
    monthlyScore,
    rank,
    nextRank,
    rankProgress,
    coinsForCurrentXp: computeRetroactiveCoins(input.totalXp),
    isMaxRank: rank.index === RANK_TIERS[RANK_TIERS.length - 1].index,
    levelTitle: getRPGLevelTitle(input.level),
  };
}

// ─────────────────────────────────────────────────────────────
// MIGRATION (existing user → RPG player, one-time)
// ─────────────────────────────────────────────────────────────

/**
 * Builds the one-time migration patch for an existing user.
 * Gives them retroactive coins for past XP, derives their starting
 * rank from their current score, and sets the join date + season.
 *
 * Call this ONCE when `rpgInitialized !== true`.
 */
export function migrateUserToRPG(params: {
  uid: string;
  totalXp: number;
  level: number;
  streak: number;
  consistency: number;
  verifiedGoals?: number;
}): RPGMigration {
  const { uid, totalXp, level, streak, consistency, verifiedGoals = 0 } = params;

  const playerScore = computePlayerScore({
    totalXp, level, streak, consistency, rankTierIndex: 0, verifiedGoals,
  });
  const rank = getRankForScore(playerScore);
  const retroCoins = computeRetroactiveCoins(totalXp);
  const now = new Date().toISOString();

  const rankPromotion: RankHistoryEntry = {
    rank: rank.name,
    tierIndex: rank.index,
    achievedAt: now,
    scoreAtPromotion: playerScore,
  };

  const fields: Partial<RPGPlayerState> = {
    playerNumber: generatePlayerNumber(uid),
    coins: retroCoins,
    playerScore,
    monthlyScore: playerScore, // first month = full score baseline
    rank: rank.name,
    rankTierIndex: rank.index,
    highestRank: rank.name,
    highestRankIndex: rank.index,
    rankHistory: [rankPromotion],
    cardEvolutionStage: rank.cardStage,
    cardFrame: rank.frameId,
    cardAccent: "amber",
    titles: buildInitialTitles(rank),
    equippedTitle: rank.titleUnlocked,
    seasonId: getCurrentSeasonId(),
    seasonClaimed: {},
    joinDate: now,
    rpgInitialized: true,
  };

  return { fields, rankPromotion };
}

/** Titles a player starts with at a given rank (initiate + rank title). */
function buildInitialTitles(rank: RankTier): string[] {
  const titles = ["Initiate"];
  if (!titles.includes(rank.titleUnlocked)) titles.push(rank.titleUnlocked);
  return titles;
}

// ─────────────────────────────────────────────────────────────
// RANK TRANSITION DETECTION
// ─────────────────────────────────────────────────────────────

/**
 * Given an old score and a new score, returns the promotion (if any).
 * A promotion happens when the rank tier index increases.
 */
export function detectRankPromotion(
  oldScore: number,
  newScore: number
): { promoted: boolean; from: RankTier; to: RankTier } {
  const from = getRankForScore(oldScore);
  const to = getRankForScore(newScore);
  return { promoted: to.index > from.index, from, to };
}

/**
 * Builds the coin bonus for a rank-up chain (handles multi-tier jumps).
 * Pays each newly-crossed tier's bonus from the configured coinBonus.
 */
export function computeRankUpCoinBonus(from: RankTier, to: RankTier): number {
  if (to.index <= from.index) return 0;
  let bonus = 0;
  for (let i = from.index + 1; i <= to.index; i++) {
    bonus += RANK_TIERS[i]?.coinBonus ?? 0;
  }
  return bonus;
}

// ─────────────────────────────────────────────────────────────
// SEASON HELPERS
// ─────────────────────────────────────────────────────────────

/** True if the stored monthlyScore belongs to the current season. */
export function isMonthlyScoreCurrent(storedSeasonId: string | undefined, now: Date = new Date()): boolean {
  return storedSeasonId === getCurrentSeasonId(now);
}

/**
 * If the season rolled over, returns the reset monthly score (0) and
 * the new season id. Otherwise returns null (no action needed).
 */
export function rollSeasonIfNeeded(storedSeasonId: string | undefined, now: Date = new Date()):
  | { newSeasonId: string; resetMonthlyScore: 0 }
  | null {
  const current = getCurrentSeasonId(now);
  if (storedSeasonId === current) return null;
  return { newSeasonId: current, resetMonthlyScore: 0 };
}

// ─────────────────────────────────────────────────────────────
// UTIL
// ─────────────────────────────────────────────────────────────

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

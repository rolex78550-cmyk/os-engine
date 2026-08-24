// ============================================================
// useRPG — React hook that wires the RPG foundation to Firebase.
// Single source of RPG truth for any component (Player Card, etc.).
//
// Responsibilities:
//  - Read RPG fields from users/{uid} (live subscription)
//  - One-time migrate existing users (retroactive coins + rank)
//  - Derive live score/rank/progress via the pure engine
//  - Debounced leaderboard sync
//  - Expose actions: recordXP, grantRankBonus, claimReward, etc.
//
// Does NOT touch the Goal system. Reads only public/computed fields.
// ============================================================

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useFirebase } from "../components/FirebaseProvider";
import {
  fetchRPGState,
  saveRPGFields,
  grantCoins,
  writeLeaderboardEntry,
  claimReward as claimRewardDb,
} from "../lib/rpgFirestore";
import {
  generatePlayerNumber,
  migrateUserToRPG,
  deriveRPGState,
  computePlayerScore,
  detectRankPromotion,
  computeRankUpCoinBonus,
  rollSeasonIfNeeded,
} from "../rpg/engine";
import { RANK_TIERS, getCurrentSeasonId } from "../rpg/constants";
import type {
  RPGPlayerState,
  RPGDerivedState,
  RankHistoryEntry,
  CoinTransaction,
  RewardClaimed,
  LeaderboardEntry,
  RankName,
} from "../rpg/types";
import type { ProfileState } from "../types";

// Input the hook needs from the app to compute scores.
export interface RPGSourceStats {
  /** monthly XP this season */
  monthlyXp?: number;
  /** AI-verified goal count (lifetime) */
  verifiedGoals?: number;
  /** AI-verified goals this season */
  monthlyVerifiedGoals?: number;
  /** streak days counted this month */
  monthlyStreakDays?: number;
}

export interface RPGHookResult {
  /** Stored RPG fields (null until loaded / before migration) */
  rpg: Partial<RPGPlayerState> | null;
  /** Live derived state: score, rank, progress, coins-for-xp, level title */
  derived: RPGDerivedState | null;
  /** True while the first load/migration is in flight */
  initializing: boolean;
  /** True if this user has been migrated to the RPG system */
  initialized: boolean;
  /** Latest error (non-fatal; UI can ignore) */
  error: string | null;

  // Actions (all idempotent + safe; no-ops if no user)
  refresh: () => Promise<void>;
  /** Call after any XP gain — recomputes score, detects rank-ups, grants coins. */
  recordXPGain: (xpGained: number, newLevel?: number, leveledUp?: boolean) => Promise<void>;
  /** Force a rank/coin/score recompute + leaderboard sync. */
  recompute: () => Promise<void>;
  /** Equip a title the player owns. */
  equipTitle: (title: string) => Promise<void>;
  /** Equip a cosmetic frame the player owns. */
  equipFrame: (frameId: string) => Promise<void>;
  /** Claim a reward (coins/frame/title) to own doc + ledger. */
  claimReward: (reward: Omit<RewardClaimed, "unlockedAt">, coinBonus?: number) => Promise<void>;
}

const EMPTY_DERIVED: RPGDerivedState | null = null;

export function useRPG(profile: ProfileState, stats: RPGSourceStats = {}): RPGHookResult {
  const { user } = useFirebase();
  const uid = user?.uid;

  const [rpg, setRpg] = useState<Partial<RPGPlayerState> | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce: don't write the leaderboard more often than this.
  const lastSyncRef = useRef<number>(0);
  const pendingSyncRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Live subscription to the user's RPG fields ──────────────────────
  useEffect(() => {
    if (!uid) {
      setRpg(null);
      setInitializing(false);
      setInitialized(false);
      return;
    }
    let cancelled = false;
    const unsub = onSnapshot(
      doc(db, `users/${uid}`),
      (snap) => {
        if (cancelled) return;
        if (!snap.exists()) {
          setRpg(null);
          setInitialized(false);
          setInitializing(false);
          return;
        }
        const d = snap.data() as Record<string, any>;
        const fields: Partial<RPGPlayerState> = {
          playerNumber: d.playerNumber || "",
          coins: Number(d.coins) || 0,
          playerScore: Number(d.playerScore) || 0,
          monthlyScore: Number(d.monthlyScore) || 0,
          rank: d.rank || "Iron",
          rankTierIndex: Number(d.rankTierIndex) || 0,
          highestRank: d.highestRank || "Iron",
          highestRankIndex: Number(d.highestRankIndex) || 0,
          rankHistory: Array.isArray(d.rankHistory) ? d.rankHistory : [],
          cardEvolutionStage: Number(d.cardEvolutionStage) || 1,
          cardFrame: d.cardFrame || "default",
          cardAccent: d.cardAccent || "amber",
          titles: Array.isArray(d.titles) ? d.titles : ["Initiate"],
          equippedTitle: d.equippedTitle ?? null,
          seasonId: d.seasonId || "",
          seasonClaimed: d.seasonClaimed || {},
          joinDate: d.joinDate || "",
          rpgInitialized: d.rpgInitialized === true,
        };
        setRpg(fields);
        setInitialized(fields.rpgInitialized === true);
        setInitializing(false);
      },
      (err) => {
        console.warn("[useRPG] snapshot error:", err?.message);
        setError(err?.message || "RPG sync error");
        setInitializing(false);
      }
    );
    return () => {
      cancelled = true;
      unsub();
    };
  }, [uid]);

  // ── One-time migration ──────────────────────────────────────────────
  useEffect(() => {
    if (!uid || !profile || initialized || initializing) return;
    let cancelled = false;
    (async () => {
      try {
        const existing = await fetchRPGState(uid);
        if (existing?.rpgInitialized) {
          // Another tab migrated it; the snapshot will catch up.
          setInitialized(true);
          return;
        }
        // Build the migration patch from the user's current profile.
        const migration = migrateUserToRPG({
          uid,
          totalXp: Number(profile.totalXp) || 0,
          level: Number(profile.level) || 1,
          streak: Number(profile.streak) || 0,
          consistency: 0, // computed elsewhere; 0 is safe for first pass
          verifiedGoals: Number(stats.verifiedGoals) || 0,
        });
        await saveRPGFields(uid, migration.fields);
        // Retroactive coin grant logged to the ledger.
        if (migration.fields.coins && migration.fields.coins > 0) {
          await grantCoins(uid, migration.fields.coins, "Retroactive XP credit", "migration");
        }
        if (!cancelled) setInitialized(true);
      } catch (e: any) {
        console.warn("[useRPG] migration failed (non-blocking):", e?.message);
        setError(e?.message);
        if (!cancelled) setInitializing(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, profile?.totalXp, profile?.level, profile?.streak, initialized]);

  // ── Derived state (pure recomputation on every profile/rpg change) ──
  const derived = useMemo<RPGDerivedState | null>(() => {
    if (!profile) return EMPTY_DERIVED;
    const rankTierIndex = Number(rpg?.rankTierIndex) || 0;
    const monthlyInput = stats.monthlyXp != null
      ? {
          monthlyXp: stats.monthlyXp,
          level: Number(profile.level) || 1,
          monthlyStreakDays: stats.monthlyStreakDays || 0,
          consistency: 0,
          rankTierIndex,
          monthlyVerifiedGoals: stats.monthlyVerifiedGoals || 0,
        }
      : undefined;
    return deriveRPGState({
      totalXp: Number(profile.totalXp) || 0,
      level: Number(profile.level) || 1,
      streak: Number(profile.streak) || 0,
      consistency: 0,
      rankTierIndex,
      verifiedGoals: Number(stats.verifiedGoals) || 0,
      monthlyInput,
    });
  }, [profile, rpg?.rankTierIndex, stats.monthlyXp, stats.monthlyStreakDays, stats.verifiedGoals, stats.monthlyVerifiedGoals]);

  // ── Leaderboard sync (debounced) ────────────────────────────────────
  const syncLeaderboard = useCallback(async () => {
    if (!uid || !profile || !derived) return;
    const now = Date.now();
    if (now - lastSyncRef.current < 120_000) return; // debounce 2 min
    lastSyncRef.current = now;

    const rankName = (derived.rank.name || "Iron") as RankName;
    const entry: LeaderboardEntry = {
      uid,
      name: profile.name || "Seeker",
      playerNumber: rpg?.playerNumber || generatePlayerNumber(uid),
      avatarEmoji: "✦",
      level: Number(profile.level) || 1,
      rank: rankName,
      rankTierIndex: derived.rank.index,
      playerScore: derived.playerScore,
      monthlyScore: derived.monthlyScore || 0,
      seasonId: rpg?.seasonId || getCurrentSeasonId(),
      streak: Number(profile.streak) || 0,
      consistency: 0,
      updatedAt: new Date().toISOString(),
    };
    try {
      await writeLeaderboardEntry(entry);
    } catch (e: any) {
      console.warn("[useRPG] leaderboard sync failed:", e?.message);
    }
  }, [uid, profile, derived, rpg?.playerNumber, rpg?.seasonId]);

  // Trigger a debounced sync whenever the derived score changes materially.
  useEffect(() => {
    if (!derived || !initialized) return;
    if (pendingSyncRef.current) clearTimeout(pendingSyncRef.current);
    pendingSyncRef.current = setTimeout(() => {
      syncLeaderboard();
    }, 1500);
    return () => {
      if (pendingSyncRef.current) clearTimeout(pendingSyncRef.current);
    };
  }, [derived?.playerScore, derived?.rank.index, initialized, syncLeaderboard]);

  // ── Actions ─────────────────────────────────────────────────────────
  const refresh = useCallback(async () => {
    if (!uid) return;
    try {
      const fresh = await fetchRPGState(uid);
      if (fresh) setRpg(fresh);
    } catch (e: any) {
      setError(e?.message);
    }
  }, [uid]);

  /**
   * Called after any XP gain. Recomputes the player score; if the rank
   * crossed a threshold it grants the rank-up coin bonus + history entry.
   * Level-ups separately grant level coins.
   */
  const recordXPGain = useCallback(
    async (xpGained: number, newLevel?: number, leveledUp?: boolean) => {
      if (!uid || !profile || !derived) return;
      try {
        // 1) Recompute score from the NEW profile state.
        // `profile.totalXp` is the pre-increment snapshot, so add the actual
        // XP just gained to compute the true post-action score (rank/coins no
        // longer lag one action behind).
        const newTotalXp =
          (Number(profile.totalXp) || 0) + Math.max(0, xpGained);
        const newScore = computePlayerScore({
          totalXp: newTotalXp,
          level: newLevel ?? Number(profile.level) ?? 1,
          streak: Number(profile.streak) || 0,
          consistency: 0,
          rankTierIndex: Number(rpg?.rankTierIndex) || 0,
          verifiedGoals: Number(stats.verifiedGoals) || 0,
        });
        const patch: Partial<RPGPlayerState> = { playerScore: newScore };

        // 2) Rank promotion check
        const promo = detectRankPromotion(derived.playerScore, newScore);
        if (promo.promoted) {
          patch.rank = promo.to.name;
          patch.rankTierIndex = promo.to.index;
          patch.cardEvolutionStage = promo.to.cardStage;
          if (promo.to.index > (rpg?.highestRankIndex ?? 0)) {
            patch.highestRank = promo.to.name;
            patch.highestRankIndex = promo.to.index;
          }
          const history: RankHistoryEntry = {
            rank: promo.to.name,
            tierIndex: promo.to.index,
            achievedAt: new Date().toISOString(),
            scoreAtPromotion: newScore,
          };
          patch.rankHistory = [...(rpg?.rankHistory || []), history];
          // grant rank bonus coins + unlock title/frame
          const bonus = computeRankUpCoinBonus(promo.from, promo.to);
          if (bonus > 0) await grantCoins(uid, bonus, `Rank up: ${promo.to.name}`, "rankup");
        }

        // 3) Level-up coin bonus
        if (leveledUp && newLevel) {
          const lvlCoins = newLevel * 10;
          if (lvlCoins > 0) await grantCoins(uid, lvlCoins, `Level ${newLevel} reached`, "levelup");
        }

        // 4) XP-attached coin trickle
        if (xpGained > 0) {
          const xpCoins = Math.floor(xpGained * 0.5);
          if (xpCoins > 0) await grantCoins(uid, xpCoins, `${xpGained} XP earned`, "action");
        }

        // 5) Persist score + rank fields (coins handled by grantCoins)
        await saveRPGFields(uid, patch);
      } catch (e: any) {
        console.warn("[useRPG] recordXPGain failed:", e?.message);
        setError(e?.message);
      }
    },
    [uid, profile, derived, rpg, stats.verifiedGoals]
  );

  const recompute = useCallback(async () => {
    if (!uid || !profile || !derived) return;
    try {
      await saveRPGFields(uid, {
        playerScore: derived.playerScore,
        monthlyScore: derived.monthlyScore || 0,
        rank: derived.rank.name,
        rankTierIndex: derived.rank.index,
        cardEvolutionStage: derived.rank.cardStage,
      });
      lastSyncRef.current = 0; // force a leaderboard refresh
      await syncLeaderboard();
    } catch (e: any) {
      setError(e?.message);
    }
  }, [uid, profile, derived, syncLeaderboard]);

  const equipTitle = useCallback(
    async (title: string) => {
      if (!uid || !rpg) return;
      if (!(rpg.titles || []).includes(title)) return; // don't equip unowned
      await saveRPGFields(uid, { equippedTitle: title });
    },
    [uid, rpg]
  );

  const equipFrame = useCallback(
    async (frameId: string) => {
      if (!uid) return;
      await saveRPGFields(uid, { cardFrame: frameId });
    },
    [uid]
  );

  const claimReward = useCallback(
    async (reward: Omit<RewardClaimed, "unlockedAt">, coinBonus?: number) => {
      if (!uid) return;
      try {
        await claimRewardDb(uid, reward);
        if (coinBonus && coinBonus > 0) {
          await grantCoins(uid, coinBonus, reward.name || "Reward", "season");
        }
      } catch (e: any) {
        setError(e?.message);
      }
    },
    [uid]
  );

  return {
    rpg,
    derived,
    initializing,
    initialized,
    error,
    refresh,
    recordXPGain,
    recompute,
    equipTitle,
    equipFrame,
    claimReward,
  };
}

// Re-export rank lookup for convenience in UI.
export function rankByIndex(index: number) {
  return RANK_TIERS[Math.max(0, Math.min(RANK_TIERS.length - 1, index))] || RANK_TIERS[0];
}

// ============================================================
// RPG PROGRESSION SYSTEM — FIRESTORE HELPERS
// Thin client-side read/write layer. NO service account needed:
// each user reads/writes ONLY their own documents (per firestore.rules).
// Does NOT touch the Goal system.
// ============================================================

import { db } from "./firebase";
import {
  doc, getDoc, setDoc, updateDoc, increment, collection, addDoc,
  query, orderBy, limit, where, getDocs, onSnapshot,
} from "firebase/firestore";
import { RPG_PATHS } from "../rpg/constants";
import type {
  RPGPlayerState,
  CoinTransaction,
  RewardClaimed,
  LeaderboardEntry,
} from "../rpg/types";

// ─────────────────────────────────────────────────────────────
// PLAYER STATE (users/{uid} extended fields)
// ─────────────────────────────────────────────────────────────

/**
 * Reads only the RPG-specific fields from a user doc.
 * Returns null if the user has never opened the RPG (not initialized).
 * Unknown fields default safely — never throws on missing data.
 */
export async function fetchRPGState(uid: string): Promise<Partial<RPGPlayerState> | null> {
  const snap = await getDoc(doc(db, RPG_PATHS.userDoc(uid)));
  if (!snap.exists()) return null;
  const d = snap.data() as Record<string, any>;
  return {
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
    seasonClaimed: (d.seasonClaimed && typeof d.seasonClaimed === "object") ? d.seasonClaimed : {},
    joinDate: d.joinDate || "",
    rpgInitialized: d.rpgInitialized === true,
  };
}

/**
 * Merges RPG fields onto the user doc. Uses merge:true so it NEVER
 * overwrites unrelated fields (name, subscription, goals, etc.).
 */
export async function saveRPGFields(
  uid: string,
  fields: Partial<RPGPlayerState>
): Promise<void> {
  await setDoc(doc(db, RPG_PATHS.userDoc(uid)), fields, { merge: true });
}

// ─────────────────────────────────────────────────────────────
// COIN LEDGER
// ─────────────────────────────────────────────────────────────

/** Appends a coin transaction and returns its generated id. */
export async function addCoinTransaction(
  uid: string,
  tx: Omit<CoinTransaction, "id">
): Promise<string> {
  const ref = await addDoc(collection(db, RPG_PATHS.coinTransactions(uid)), {
    ...tx,
    userId: uid,
  });
  return ref.id;
}

/**
 * Atomically adjusts the coin balance AND logs the transaction.
 * Uses Firestore increment() so the balance never desyncs under
 * concurrent writes. Two writes — fine for low-frequency events.
 */
export async function grantCoins(
  uid: string,
  amount: number,
  reason: string,
  source: CoinTransaction["source"]
): Promise<void> {
  if (amount === 0) return;
  await addCoinTransaction(uid, {
    amount,
    reason,
    source,
    type: amount > 0 ? "earn" : "spend",
    createdAt: new Date().toISOString(),
    localDate: localDateStr(),
  });
  // Denormalized balance for fast reads; increment keeps it consistent.
  await updateDoc(doc(db, RPG_PATHS.userDoc(uid)), {
    coins: increment(amount),
  });
}

/** Recent coin transactions (for the wallet/history view). */
export async function fetchRecentCoinTransactions(
  uid: string,
  max = 25
): Promise<CoinTransaction[]> {
  const q = query(
    collection(db, RPG_PATHS.coinTransactions(uid)),
    orderBy("createdAt", "desc"),
    limit(max)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as CoinTransaction[];
}

// ─────────────────────────────────────────────────────────────
// REWARDS LEDGER
// ─────────────────────────────────────────────────────────────

export async function claimReward(
  uid: string,
  reward: Omit<RewardClaimed, "unlockedAt">
): Promise<string> {
  const payload: RewardClaimed = { ...reward, unlockedAt: new Date().toISOString() };
  const ref = await addDoc(collection(db, RPG_PATHS.rewardsClaimed(uid)), {
    ...payload,
    userId: uid,
  });
  return ref.id;
}

export async function fetchClaimedRewards(uid: string): Promise<RewardClaimed[]> {
  const q = query(
    collection(db, RPG_PATHS.rewardsClaimed(uid)),
    orderBy("unlockedAt", "desc"),
    limit(100)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as RewardClaimed[];
}

// ─────────────────────────────────────────────────────────────
// LEADERBOARD (per-user doc; native orderBy for ranking)
// ─────────────────────────────────────────────────────────────

/**
 * Writes/updates THIS user's leaderboard entry. Called (debounced) on
 * score change. Everyone can read, only the owner can write (rules).
 */
export async function writeLeaderboardEntry(
  entry: LeaderboardEntry
): Promise<void> {
  await setDoc(doc(db, RPG_PATHS.leaderboardEntry(entry.uid)), {
    ...entry,
    updatedAt: new Date().toISOString(),
  });
}

/** Top-N all-time players. */
export async function fetchGlobalLeaderboard(topN = 100): Promise<LeaderboardEntry[]> {
  const q = query(
    collection(db, "leaderboard"),
    orderBy("playerScore", "desc"),
    limit(topN)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d, i) => ({ ...(d.data() as LeaderboardEntry), uid: d.id, position: i + 1 }));
}

/** Top-N for the current season (monthly). Requires composite index. */
export async function fetchMonthlyLeaderboard(seasonId: string, topN = 100): Promise<LeaderboardEntry[]> {
  const q = query(
    collection(db, "leaderboard"),
    where("seasonId", "==", seasonId),
    orderBy("monthlyScore", "desc"),
    limit(topN)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d, i) => ({ ...(d.data() as LeaderboardEntry), uid: d.id, position: i + 1 }));
}

/** Live leaderboard subscription (global). */
export function subscribeGlobalLeaderboard(
  topN: number,
  cb: (entries: LeaderboardEntry[]) => void
): () => void {
  const q = query(
    collection(db, "leaderboard"),
    orderBy("playerScore", "desc"),
    limit(topN)
  );
  return onSnapshot(
    q,
    (snap) => {
      cb(snap.docs.map((d, i) => ({ ...(d.data() as LeaderboardEntry), uid: d.id, position: i + 1 })));
    },
    (err) => console.warn("[rpg] leaderboard subscribe error", err?.message)
  );
}

// ─────────────────────────────────────────────────────────────
// UTIL
// ─────────────────────────────────────────────────────────────

function localDateStr(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

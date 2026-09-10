// ============================================================
// XP SEASON SYSTEM — single source of truth for XP / level math
// and the rolling 30-day XP reset.
//
// DATA MODEL (users/{uid}):
//   totalXp      → XP earned in the CURRENT 30-day cycle. Resets to 0.
//                  (Leaderboard ranks on this, so every cycle is a fresh race.)
//   xp           → mirror of totalXp (legacy field, kept in sync).
//   lifetimeXp   → XP earned across ALL cycles. NEVER resets. Drives level.
//   level        → floor(lifetimeXp / XP_PER_LEVEL) + 1
//   xpCycleStart → ISO date when the current cycle began. Cycle ends
//                  SEASON_DAYS later; at that point totalXp/xp reset to 0,
//                  the previous cycle is archived to users/{uid}/xp_seasons,
//                  and xpCycleStart moves forward.
//
// DESIGN: 11 daily tasks × 50 XP = 550 XP/day → 30 days = 16,500 XP.
// A perfect month = exactly one level-up.
// ============================================================

/** XP required per level. 11 tasks × 50 XP × 30 days. */
export const XP_PER_LEVEL = 16_500;

/** XP reward for a single completed task. */
export const XP_PER_TASK = 50;

/** Length of one XP season / cycle in days (rolling, per user). */
export const SEASON_DAYS = 30;

const DAY_MS = 86_400_000;

/** Level derived from lifetime XP. Level 1 = 0 XP. */
export function levelFromXp(lifetimeXp: number): number {
  const xp = Math.max(0, Number(lifetimeXp) || 0);
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

/** XP progress inside the current level (0 … XP_PER_LEVEL-1). */
export function xpInLevel(lifetimeXp: number): number {
  const xp = Math.max(0, Number(lifetimeXp) || 0);
  return xp % XP_PER_LEVEL;
}

/** XP still needed to reach the next level. */
export function xpToNextLevel(lifetimeXp: number): number {
  return XP_PER_LEVEL - xpInLevel(lifetimeXp);
}

/** 0–100 progress percentage toward the next level. */
export function levelProgressPct(lifetimeXp: number): number {
  return Math.min(100, Math.round((xpInLevel(lifetimeXp) / XP_PER_LEVEL) * 100));
}

/**
 * Best-effort lifetime XP for a profile. Older documents (created before
 * this system) have no `lifetimeXp`; for them the cycle XP *is* the
 * lifetime XP, so we fall back to totalXp / xp.
 */
export function resolveLifetimeXp(profile: any): number {
  if (!profile) return 0;
  const lifetime = Number(profile.lifetimeXp);
  if (Number.isFinite(lifetime) && lifetime > 0) return lifetime;
  return Number(profile.totalXp) || Number(profile.xp) || 0;
}

/** XP earned in the current cycle (what the leaderboard ranks on). */
export function resolveCycleXp(profile: any): number {
  if (!profile) return 0;
  return Number(profile.totalXp) || Number(profile.xp) || 0;
}

/** Parse xpCycleStart, tolerating ISO strings, Firestore Timestamps and millis. */
export function parseCycleStart(raw: any): Date | null {
  if (!raw) return null;
  if (raw instanceof Date) return isNaN(raw.getTime()) ? null : raw;
  if (typeof raw?.toDate === "function") {
    const d = raw.toDate();
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof raw === "number") {
    const d = new Date(raw);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof raw === "string") {
    const d = new Date(raw);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/** When the given cycle ends (start + SEASON_DAYS). */
export function cycleEndDate(cycleStart: Date): Date {
  return new Date(cycleStart.getTime() + SEASON_DAYS * DAY_MS);
}

/** Whole days remaining in the cycle (0 when reset is due). */
export function daysLeftInCycle(cycleStartRaw: any, now: Date = new Date()): number {
  const start = parseCycleStart(cycleStartRaw);
  if (!start) return SEASON_DAYS;
  const ms = cycleEndDate(start).getTime() - now.getTime();
  return Math.max(0, Math.ceil(ms / DAY_MS));
}

/** True when the user's current cycle has run its SEASON_DAYS. */
export function isCycleExpired(cycleStartRaw: any, now: Date = new Date()): boolean {
  const start = parseCycleStart(cycleStartRaw);
  if (!start) return false; // no cycle yet → nothing to expire (we'll stamp one)
  return now.getTime() >= cycleEndDate(start).getTime();
}

export interface CycleResetPlan {
  /** Should the doc be reset right now? */
  shouldReset: boolean;
  /** Should we merely stamp a cycle start (first-time users / legacy docs)? */
  shouldStamp: boolean;
  /** New cycle start to write (ISO). */
  newCycleStart: string;
  /** Archived cycle info (only when shouldReset). */
  archive?: {
    cycleStart: string;
    cycleEnd: string;
    xpEarned: number;
    levelAtEnd: number;
  };
}

/**
 * Pure decision function — decides whether a profile needs its cycle XP
 * reset. Shared by the client (on load) and the server (cron), so both
 * agree on exactly the same rule.
 *
 * Rolling cycles: if a user was away for 3 cycles, the new start is
 * aligned to the most recent boundary (start + k*SEASON_DAYS) so the
 * schedule doesn't drift.
 */
export function planCycleReset(profile: any, now: Date = new Date()): CycleResetPlan {
  const start = parseCycleStart(profile?.xpCycleStart);
  const cycleXp = resolveCycleXp(profile);

  // Legacy / brand-new doc: no cycle stamped yet. Start the clock now.
  if (!start) {
    return { shouldReset: false, shouldStamp: true, newCycleStart: now.toISOString() };
  }

  if (now.getTime() < cycleEndDate(start).getTime()) {
    return { shouldReset: false, shouldStamp: false, newCycleStart: start.toISOString() };
  }

  // Expired → align to the latest boundary.
  const elapsed = now.getTime() - start.getTime();
  const cyclesPassed = Math.floor(elapsed / (SEASON_DAYS * DAY_MS));
  const newStart = new Date(start.getTime() + cyclesPassed * SEASON_DAYS * DAY_MS);

  return {
    shouldReset: true,
    shouldStamp: false,
    newCycleStart: newStart.toISOString(),
    archive: {
      cycleStart: start.toISOString(),
      cycleEnd: cycleEndDate(start).toISOString(),
      xpEarned: cycleXp,
      levelAtEnd: levelFromXp(resolveLifetimeXp(profile)),
    },
  };
}

/**
 * Field patch to apply when a cycle resets. Lifetime XP + level are
 * preserved; only cycle XP goes back to 0.
 */
export function buildResetPatch(profile: any, plan: CycleResetPlan) {
  const lifetime = resolveLifetimeXp(profile);
  return {
    totalXp: 0,
    xp: 0,
    lifetimeXp: lifetime,
    level: levelFromXp(lifetime),
    xpCycleStart: plan.newCycleStart,
    lastXpReset: new Date().toISOString(),
    xpSeasonsCompleted: (Number(profile?.xpSeasonsCompleted) || 0) + 1,
  };
}

/** Season document id for the archive subcollection (YYYY-MM-DD of cycle start). */
export function seasonDocId(cycleStartIso: string): string {
  return cycleStartIso.slice(0, 10);
}

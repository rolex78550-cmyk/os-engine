import type {
  AchievementBadge,
  BadgeRarity,
  DailyTask,
  GoalCategory,
  LeaderboardEntry,
  MilestoneReward,
  ProfileState,
  StreakEvent,
  StreakEventType,
  XpTransaction,
} from "../types";

export const MILESTONES: MilestoneReward[] = [
  { days: 7, rarity: "Common", reward: "+1 Streak Freeze", title: "First Flame", icon: "🔥", freezesGranted: 1 },
  { days: 14, rarity: "Rare", reward: "Rare Aura Profile Frame", title: "Fortnight Focus", icon: "💎", freezesGranted: 1 },
  { days: 30, rarity: "Epic", reward: "Epic Share Poster Pack", title: "Moon Cycle Master", icon: "🌕", freezesGranted: 2 },
  { days: 50, rarity: "Epic", reward: "Golden Username Glow", title: "Golden Momentum", icon: "⚜️", freezesGranted: 2 },
  { days: 100, rarity: "Legendary", reward: "Leaderboard Crown Trail", title: "Century Alchemist", icon: "👑", freezesGranted: 3 },
  { days: 180, rarity: "Legendary", reward: "AI Reality Movie Poster", title: "Half-Year Reality Shift", icon: "🪐", freezesGranted: 3 },
  { days: 365, rarity: "Mythic", reward: "Legend Hall Immortalization", title: "Mythic Year of Becoming", icon: "🐉", freezesGranted: 5 },
];

export const DAILY_ACTIONS: DailyTask[] = [
  { id: "journal", type: "journal", label: "Journal", xp: 20, completed: false, icon: "📓", gradient: "from-amber-300 to-orange-500", action: "journal" },
  { id: "meditation", type: "meditation", label: "Meditation", xp: 25, completed: false, icon: "🧘", gradient: "from-indigo-300 to-purple-500", action: "proof", proofType: "both" },
  { id: "fitness", type: "fitness", label: "Workout / Fitness", xp: 35, completed: false, icon: "💪", gradient: "from-emerald-300 to-green-600", action: "proof", proofType: "photo" },
  { id: "writing", type: "writing", label: "Writing Task", xp: 30, completed: false, icon: "✍️", gradient: "from-blue-300 to-cyan-500", action: "proof", proofType: "text" },
  { id: "visualization", type: "visualization", label: "Visualization", xp: 15, completed: false, icon: "👁️", gradient: "from-amber-100 to-yellow-500", action: "rituals" },
  { id: "academy_module", type: "academy_module", label: "Academy", xp: 35, completed: false, icon: "🎓", gradient: "from-yellow-200 to-amber-600", action: "academy" },
];

export const LEVEL_LADDER = [
  { name: "Dreamer", minLevel: 1, emoji: "🌙", color: "text-amber-100" },
  { name: "Creator", minLevel: 5, emoji: "✨", color: "text-amber-200" },
  { name: "Builder", minLevel: 10, emoji: "🏗️", color: "text-amber-200" },
  { name: "Alchemist", minLevel: 15, emoji: "⚗️", color: "text-amber-200" },
  { name: "Reality Shifter", minLevel: 25, emoji: "🪄", color: "text-amber-100" },
  { name: "Legend", minLevel: 40, emoji: "👑", color: "text-yellow-200" },
];

export const BASE_BADGE_RULES: Omit<AchievementBadge, "earned" | "earnedAt">[] = [
  { id: "streak-7", title: "First Flame", description: "7-day manifestation streak", rarity: "Common", tier: "bronze", icon: "🔥", condition: { metric: "streak", threshold: 7 } },
  { id: "streak-14", title: "Fortnight Focus", description: "14-day manifestation streak", rarity: "Rare", tier: "silver", icon: "💎", condition: { metric: "streak", threshold: 14 } },
  { id: "streak-30", title: "Moon Cycle Master", description: "30-day manifestation streak", rarity: "Epic", tier: "gold", icon: "🌕", condition: { metric: "streak", threshold: 30 } },
  { id: "streak-50", title: "Golden Momentum", description: "50-day manifestation streak", rarity: "Epic", tier: "gold", icon: "⚜️", condition: { metric: "streak", threshold: 50 } },
  { id: "streak-100", title: "Century Alchemist", description: "100-day manifestation streak", rarity: "Legendary", tier: "platinum", icon: "👑", condition: { metric: "streak", threshold: 100 } },
  { id: "streak-365", title: "Mythic Year of Becoming", description: "365-day manifestation streak", rarity: "Mythic", tier: "platinum", icon: "🐉", condition: { metric: "streak", threshold: 365 } },
  { id: "xp-1000", title: "XP Collector", description: "Earn 1,000 lifetime XP", rarity: "Rare", tier: "silver", icon: "⚡", condition: { metric: "totalXp", threshold: 1000 } },
  { id: "xp-5000", title: "XP Architect", description: "Earn 5,000 lifetime XP", rarity: "Epic", tier: "gold", icon: "⚡", condition: { metric: "totalXp", threshold: 5000 } },
  { id: "consistency-90", title: "Consistency Oracle", description: "Reach 90% consistency", rarity: "Legendary", tier: "platinum", icon: "🔮", condition: { metric: "consistency", threshold: 90 } },
  { id: "academy-3", title: "Academy Crown", description: "Earn 3 academy badges", rarity: "Epic", tier: "gold", icon: "🎓", condition: { metric: "academyBadges", threshold: 3 } },
  { id: "community-10", title: "Viral Spark", description: "Share 10 community wins", rarity: "Mythic", tier: "platinum", icon: "🚀", condition: { metric: "communityPosts", threshold: 10 } },
  { id: "level-10", title: "Reality Builder", description: "Reach level 10", rarity: "Rare", tier: "silver", icon: "🏗️", condition: { metric: "level", threshold: 10 } },
  { id: "level-25", title: "Reality Shifter", description: "Reach level 25", rarity: "Legendary", tier: "platinum", icon: "🪄", condition: { metric: "level", threshold: 25 } },
];

// ---------------------------------------------------------------------------
// DATE / TIMEZONE UTILITIES
// ---------------------------------------------------------------------------

export function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
}

export function toLocalDateString(date: Date | string, timeZone = getUserTimezone()): string {
  const d = typeof date === "string" ? new Date(date) : date;
  try {
    const formatter = new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" });
    const parts = formatter.formatToParts(d);
    const y = parts.find(p => p.type === 'year')?.value;
    const m = parts.find(p => p.type === 'month')?.value;
    const dayPart = parts.find(p => p.type === 'day')?.value;
    if (y && m && dayPart) return `${y}-${m}-${dayPart}`;
  } catch (e) {}
  
  // Fallback to strict UTC standard if formatting fails
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dayPart = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dayPart}`;
}

export function getTodayStr(timeZone = getUserTimezone()): string {
  return toLocalDateString(new Date(), timeZone);
}

export function addDaysToDateStr(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  d.setDate(d.getDate() + days);
  
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dayPart = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dayPart}`;
}

export function daysBetween(dateStrA: string, dateStrB: string): number {
  // Ensure we safely parse YYYY-MM-DD
  const [yA, mA, dA] = dateStrA.split("-").map(Number);
  const [yB, mB, dB] = dateStrB.split("-").map(Number);
  const a = new Date(yA, mA - 1, dA);
  const b = new Date(yB, mB - 1, dB);
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

export function getLastNLocalDates(n: number, timeZone = getUserTimezone()): string[] {
  const today = new Date();
  const dates: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(toLocalDateString(d, timeZone));
  }
  return dates;
}

export function isWithinGracePeriod(localDateStr: string, hours: number, timeZone = getUserTimezone()): boolean {
  try {
    const now = new Date();
    // Create a date object for the START of today in the user's timezone
    const todayStr = toLocalDateString(now, timeZone);
    const todayStart = new Date(`${todayStr}T00:00:00`);
    
    // Calculate difference in hours
    const diffMs = now.getTime() - todayStart.getTime();
    const diffHours = diffMs / 3600000;
    
    return diffHours >= 0 && diffHours <= hours;
  } catch (e) {
    return false;
  }
}

// ---------------------------------------------------------------------------
// STREAK MATH
// ---------------------------------------------------------------------------

export interface StreakEvaluation {
  streak: number;
  lastStreakDate: string | null;
  freezesUsed: number;
  freezeBalance: number;
  longestStreak: number;
  activeDays: string[];
  dailyCompleted: boolean;
  streakExtended: boolean;
  reason: "new" | "extended" | "maintained" | "frozen" | "reset";
}

export function evaluateStreak(
  events: StreakEvent[],
  today: string,
  yesterday: string,
  freezeBalance: number,
  longestStreak: number,
  gracePeriodHours: number,
  timeZone: string
): StreakEvaluation {
  // 1. Normalize and Sort unique active days
  const activeDays = Array.from(new Set(events.map((e) => e.localDate))).sort();
  const dailyCompleted = activeDays.includes(today);

  if (activeDays.length === 0) {
    return {
      streak: 0, lastStreakDate: null, freezesUsed: 0, freezeBalance,
      longestStreak, activeDays: [], dailyCompleted: false, streakExtended: false, reason: "new",
    };
  }

  // 2. Determine the starting point for backward calculation
  // If user hasn't done anything today, we check if the streak is still alive from yesterday
  const lastActiveDate = activeDays[activeDays.length - 1];
  
  // Is the streak technically alive? (Active today OR active yesterday OR within grace period)
  const isAlive = lastActiveDate >= today || lastActiveDate === yesterday || 
                  (isWithinGracePeriod(today, gracePeriodHours, timeZone) && lastActiveDate === addDaysToDateStr(today, -1));

  if (isAlive) {
    const { streak, freezesUsed } = computeStreakFromActiveDays(activeDays, freezeBalance, gracePeriodHours, timeZone, today);
    return {
      streak,
      lastStreakDate: lastActiveDate,
      freezesUsed,
      freezeBalance: freezeBalance - freezesUsed,
      longestStreak: Math.max(longestStreak, streak),
      activeDays,
      dailyCompleted: lastActiveDate === today,
      streakExtended: lastActiveDate === today,
      reason: lastActiveDate === today ? "extended" : "maintained",
    };
  }

  // 3. If not alive, can we save it with freezes?
  const gapDays = daysBetween(lastActiveDate, today) - 1;
  if (gapDays > 0 && freezeBalance >= gapDays) {
    const { streak, freezesUsed } = computeStreakFromActiveDays(activeDays, freezeBalance, gracePeriodHours, timeZone, today);
    return {
      streak,
      lastStreakDate: today,
      freezesUsed,
      freezeBalance: freezeBalance - freezesUsed,
      longestStreak: Math.max(longestStreak, streak),
      activeDays,
      dailyCompleted: false,
      streakExtended: true,
      reason: "frozen",
    };
  }

  // 4. Reset
  const { streak: lastKnownStreak } = computeStreakFromActiveDays(activeDays, 0, gracePeriodHours, timeZone, lastActiveDate);
  return {
    streak: 0,
    lastStreakDate: lastActiveDate,
    freezesUsed: 0,
    freezeBalance,
    longestStreak: Math.max(longestStreak, lastKnownStreak),
    activeDays,
    dailyCompleted: false,
    streakExtended: false,
    reason: "reset",
  };
}

function computeStreakFromActiveDays(
  activeDays: string[],
  freezeBalance: number,
  gracePeriodHours: number,
  timeZone: string,
  today: string
): { streak: number; freezesUsed: number } {
  const dates = activeDays.slice().sort();
  let streak = 0;
  let totalFreezesUsed = 0;
  
  const lastActive = dates[dates.length - 1];
  let referenceDate = lastActive && lastActive > today ? lastActive : today;

  // Walk backwards from referenceDate, consuming active days and freezes.
  while (true) {
    if (dates.includes(referenceDate)) {
      streak += 1;
      referenceDate = addDaysToDateStr(referenceDate, -1);
      continue;
    }
    
    // Don't consume a freeze for "today" or future days - you still have time to complete them!
    if (referenceDate >= today) {
      referenceDate = addDaysToDateStr(referenceDate, -1);
      continue;
    }

    // Grace period check for yesterday
    const yesterday = addDaysToDateStr(today, -1);
    if (referenceDate === yesterday && isWithinGracePeriod(today, gracePeriodHours, timeZone)) {
      referenceDate = addDaysToDateStr(referenceDate, -1);
      continue;
    }

    // Try to use a freeze for a missed past day
    if (freezeBalance > 0) {
      freezeBalance -= 1;
      totalFreezesUsed += 1;
      streak += 1;
      referenceDate = addDaysToDateStr(referenceDate, -1);
      continue;
    }
    
    break;
  }

  return { streak, freezesUsed: totalFreezesUsed };
}

export function computeStreak(
  events: StreakEvent[],
  freezeBalance: number,
  longestStreak: number,
  gracePeriodHours: number,
  timeZone: string
): StreakEvaluation {
  const today = getTodayStr(timeZone);
  const yesterday = addDaysToDateStr(today, -1);
  return evaluateStreak(events, today, yesterday, freezeBalance, longestStreak, gracePeriodHours, timeZone);
}

// ---------------------------------------------------------------------------
// XP / LEVEL MATH
// ---------------------------------------------------------------------------

export function addXp(
  xp: number,
  totalXp: number,
  level: number,
  amount: number
): { xp: number; totalXp: number; level: number; leveledUp: boolean; rank: string } {
  // Unified level curve: level = floor(totalXp / 1000) + 1 (single source of truth).
  const newXp = xp + amount;
  const newTotalXp = totalXp + amount;
  const newLevel = Math.floor(newTotalXp / 1000) + 1;
  const leveledUp = newLevel > level;

  const rank = getLevelTitle(newLevel).name;
  return { xp: newXp, totalXp: newTotalXp, level: newLevel, leveledUp, rank };
}

export function getLevelTitle(level: number) {
  return [...LEVEL_LADDER].reverse().find((entry) => level >= entry.minLevel) || LEVEL_LADDER[0];
}

export function getStatusTitle(streak: number, consistency: number) {
  if (streak >= 365) return "Mythic Reality Legend";
  if (streak >= 180) return "Cosmic Streak Sovereign";
  if (streak >= 100) return "Golden Alchemist";
  if (streak >= 50) return "Momentum Monarch";
  if (streak >= 30) return "Moon Cycle Master";
  if (streak >= 14) return "Rare Flame Keeper";
  if (streak >= 7) return "First Flame Initiate";
  if (consistency >= 70) return "Rising Creator";
  return "New Moon Dreamer";
}

// ---------------------------------------------------------------------------
// BADGES & MILESTONES
// ---------------------------------------------------------------------------

export function computeBadges(
  baseRules: Omit<AchievementBadge, "earned" | "earnedAt">[],
  profile: Pick<ProfileState, "streak" | "totalXp" | "level">,
  consistency: number,
  academyBadgeCount: number,
  communityPostCount: number
): AchievementBadge[] {
  return baseRules.map((rule) => {
    const metricValue =
      rule.condition.metric === "streak"
        ? profile.streak
        : rule.condition.metric === "totalXp"
        ? profile.totalXp
        : rule.condition.metric === "consistency"
        ? consistency
        : rule.condition.metric === "academyBadges"
        ? academyBadgeCount
        : rule.condition.metric === "communityPosts"
        ? communityPostCount
        : rule.condition.metric === "level"
        ? profile.level
        : 0;
    const earned = metricValue >= rule.condition.threshold;
    return {
      ...rule,
      earned,
      earnedAt: earned ? new Date().toISOString() : undefined,
    };
  });
}

export function getMilestoneForStreak(streak: number): { next: MilestoneReward; previous: MilestoneReward; progress: number } {
  const next = MILESTONES.find((m) => streak < m.days) || MILESTONES[MILESTONES.length - 1];
  const previous = [...MILESTONES].reverse().find((m) => streak >= m.days) || MILESTONES[0];
  const progress = next.days === previous.days ? 100 : Math.min(100, Math.round((streak / next.days) * 100));
  return { next, previous, progress };
}

export function getMilestonesEarned(streak: number): MilestoneReward[] {
  return MILESTONES.filter((m) => streak >= m.days);
}

export function getTotalFreezesFromMilestones(streak: number): number {
  return getMilestonesEarned(streak).reduce((sum, m) => sum + (m.freezesGranted || 0), 0);
}

// ---------------------------------------------------------------------------
// CONSISTENCY & ANALYTICS
// ---------------------------------------------------------------------------

export function computeConsistency(activeDays: string[], last30: string[], events: StreakEvent[]): number {
  const activeLast30 = last30.filter((d) => activeDays.includes(d));
  const base = Math.round((activeLast30.length / 30) * 100);
  const intensity = Math.min(30, events.filter((e) => last30.includes(e.localDate)).length);
  const intensityBonus = Math.round((intensity / 30) * 10);
  return Math.min(100, base + intensityBonus);
}

export function computeTopAction(events: StreakEvent[], dailyActions: DailyTask[]): DailyTask & { count: number } {
  const counts: Record<string, number> = {};
  for (const e of events) {
    counts[e.type] = (counts[e.type] || 0) + 1;
  }
  let topType = dailyActions[0].type;
  let topCount = 0;
  for (const [type, count] of Object.entries(counts)) {
    if (count > topCount) {
      topType = type as StreakEventType;
      topCount = count;
    }
  }
  const action = dailyActions.find((a) => a.type === topType) || dailyActions[0];
  return { ...action, count: topCount };
}

export function computeMonthlyXp(events: StreakEvent[], last30: string[]): number {
  return events.filter((e) => last30.includes(e.localDate)).reduce((sum, e) => sum + e.xp, 0);
}

/**
 * Journey days = total days from the user's FIRST activity to today (inclusive).
 * Unlike a breakable streak, this ONLY goes UP — it never resets.
 * This is the "days since you started" counter the dashboard shows.
 */
export function computeJourneyDays(events: StreakEvent[], timeZone: string): number {
  if (!events || events.length === 0) return 0;
  const activeDates = events
    .map((e) => e.localDate)
    .filter(Boolean)
    .sort();
  const firstDate = activeDates[0];
  if (!firstDate) return 0;
  const today = getTodayStr(timeZone);
  const lastDate = activeDates[activeDates.length - 1];
  const endDate = lastDate && lastDate > today ? lastDate : today;
  const diff = daysBetween(firstDate, endDate);
  // +1 because both start and end days are inclusive
  return Math.max(1, diff + 1);
}

export function computeLeaderboard(
  users: { name?: string; streak?: number; totalXp?: number; level?: number; universeRank?: string }[],
  currentUser: { name: string; streak: number; totalXp: number; level: number; consistency: number; title: string },
  currentUserId?: string
): LeaderboardEntry[] {
  const demo = users.map((u, idx) => ({
    userId: `demo-${idx}`,
    name: u.name || "Manifestor",
    streak: u.streak || 0,
    xp: u.totalXp || 0,
    level: u.level || 1,
    consistency: 0,
    title: u.universeRank || getLevelTitle(u.level || 1).name,
    me: false,
    score: 0,
    rank: 0,
  }));

  const me: LeaderboardEntry = {
    userId: currentUserId || "me",
    name: currentUser.name,
    streak: currentUser.streak,
    xp: currentUser.totalXp,
    level: currentUser.level,
    consistency: currentUser.consistency,
    title: currentUser.title,
    me: true,
    score: 0,
    rank: 0,
  };

  const entries = [...demo, me]
    .map((entry) => ({
      ...entry,
      score: entry.streak * 90 + entry.xp + entry.consistency * 35 + entry.level * 50,
    }))
    .sort((a, b) => b.score - a.score)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));

  return entries;
}

export function computePercentile(rank: number, total: number): number {
  if (total <= 1) return 99;
  return Math.min(99, Math.max(1, Math.round(100 - ((rank - 1) / total) * 100)));
}

// ---------------------------------------------------------------------------
// SHARE CARD GENERATION
// ---------------------------------------------------------------------------

export type CardPlatform = "instagram" | "tiktok" | "whatsapp" | "x";
export type CardMode = "streak" | "wrapped" | "badge" | "poster";

export const PLATFORM_META: Record<CardPlatform, { label: string; size: string; ratioClass: string; hint: string }> = {
  instagram: { label: "Instagram", size: "1080×1350", ratioClass: "aspect-[4/5]", hint: "Feed / Story-ready luxury poster" },
  tiktok: { label: "TikTok", size: "1080×1920", ratioClass: "aspect-[9/16]", hint: "Vertical reveal for short-form video" },
  whatsapp: { label: "WhatsApp", size: "1080×1080", ratioClass: "aspect-square", hint: "Status and group sharing" },
  x: { label: "X", size: "1600×900", ratioClass: "aspect-video", hint: "Wide leaderboard flex card" },
};

export function escapeSvg(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function generateShareCardSvg(input: {
  platform: CardPlatform;
  mode: CardMode;
  name: string;
  streak: number;
  levelTitle: string;
  consistency: number;
  percentile: number;
  badgeTitle: string;
  totalXp: number;
  strongestGoal: string;
}): string {
  const dims: Record<CardPlatform, { w: number; h: number }> = {
    instagram: { w: 1080, h: 1350 },
    tiktok: { w: 1080, h: 1920 },
    whatsapp: { w: 1080, h: 1080 },
    x: { w: 1600, h: 900 },
  };
  const { w, h } = dims[input.platform];
  const title =
    input.mode === "wrapped"
      ? "MY MANIFESTATION WRAPPED"
      : input.mode === "badge"
      ? "ACHIEVEMENT UNLOCKED"
      : input.mode === "poster"
      ? "REALITY SHIFT POSTER"
      : "STREAK ON FIRE";
  const subtitle =
    input.mode === "wrapped"
      ? `${input.totalXp.toLocaleString()} XP • ${input.consistency}% consistency • Top ${input.percentile}%`
      : input.mode === "badge"
      ? input.badgeTitle
      : input.mode === "poster"
      ? `${input.name} is becoming ${input.strongestGoal}`
      : `${input.streak} days of aligned action`;
  const big = input.mode === "wrapped" ? `${input.consistency}%` : `${input.streak}`;
  const unit = input.mode === "wrapped" ? "CONSISTENCY" : "DAY STREAK";

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <radialGradient id="g1" cx="22%" cy="18%" r="78%">
      <stop offset="0" stop-color="#1c1204" stop-opacity="1"/>
      <stop offset="0.45" stop-color="#090604" stop-opacity="1"/>
      <stop offset="1" stop-color="#000000" stop-opacity="1"/>
    </radialGradient>
    <radialGradient id="g2" cx="78%" cy="28%" r="58%">
      <stop offset="0" stop-color="#fbbf24" stop-opacity="0.9"/>
      <stop offset="0.22" stop-color="#f59e0b" stop-opacity="0.18"/>
      <stop offset="1" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="gold" x1="0" x2="1">
      <stop offset="0" stop-color="#fef3c7"/>
      <stop offset="0.5" stop-color="#f59e0b"/>
      <stop offset="1" stop-color="#fde68a"/>
    </linearGradient>
    <filter id="glow"><feGaussianBlur stdDeviation="16" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#g1)"/>
  <rect width="${w}" height="${h}" fill="url(#g2)"/>
  ${Array.from({ length: 120 })
    .map((_, i) => {
      const x = (i * 97) % w;
      const y = (i * 193) % h;
      const r = (i % 4) + 1;
      const opacity = 0.18 + (i % 8) * 0.045;
      return `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff7ed" opacity="${opacity}"/>`;
    })
    .join("\n  ")}
  <rect x="${w * 0.07}" y="${h * 0.06}" width="${w * 0.86}" height="${h * 0.88}" rx="${Math.min(w, h) * 0.045}" fill="#ffffff" opacity="0.055" stroke="#fde68a" stroke-opacity="0.22" stroke-width="2"/>
  <circle cx="${w * 0.5}" cy="${h * 0.39}" r="${Math.min(w, h) * 0.24}" fill="none" stroke="url(#gold)" stroke-width="7" opacity="0.75" filter="url(#glow)"/>
  <text x="${w * 0.5}" y="${h * 0.14}" text-anchor="middle" fill="#fde68a" font-family="Inter, Arial" font-size="${Math.max(26, w * 0.028)}" font-weight="800" letter-spacing="8">MENIFEST OS</text>
  <text x="${w * 0.5}" y="${h * 0.22}" text-anchor="middle" fill="#ffffff" font-family="Inter, Arial" font-size="${Math.max(30, w * 0.035)}" font-weight="900" letter-spacing="4">${escapeSvg(title)}</text>
  <text x="${w * 0.5}" y="${h * 0.43}" text-anchor="middle" fill="url(#gold)" font-family="Inter, Arial" font-size="${Math.max(150, w * 0.19)}" font-weight="950">${escapeSvg(big)}</text>
  <text x="${w * 0.5}" y="${h * 0.50}" text-anchor="middle" fill="#fed7aa" font-family="Inter, Arial" font-size="${Math.max(24, w * 0.027)}" font-weight="800" letter-spacing="7">${escapeSvg(unit)}</text>
  <text x="${w * 0.5}" y="${h * 0.60}" text-anchor="middle" fill="#ffffff" opacity="0.92" font-family="Inter, Arial" font-size="${Math.max(28, w * 0.033)}" font-weight="800">${escapeSvg(input.name)} • ${escapeSvg(input.levelTitle)}</text>
  <text x="${w * 0.5}" y="${h * 0.66}" text-anchor="middle" fill="#fde68a" opacity="0.86" font-family="Inter, Arial" font-size="${Math.max(22, w * 0.025)}" font-weight="600">${escapeSvg(subtitle)}</text>
  <rect x="${w * 0.18}" y="${h * 0.75}" width="${w * 0.64}" height="${h * 0.085}" rx="${h * 0.042}" fill="#0f0719" stroke="#fbbf24" stroke-opacity="0.35"/>
  <text x="${w * 0.5}" y="${h * 0.803}" text-anchor="middle" fill="#fde68a" font-family="Inter, Arial" font-size="${Math.max(22, w * 0.024)}" font-weight="800">${escapeSvg(input.strongestGoal)} ENERGY • TOP ${input.percentile}%</text>
  <text x="${w * 0.5}" y="${h * 0.90}" text-anchor="middle" fill="#ffffff" opacity="0.55" font-family="Inter, Arial" font-size="${Math.max(18, w * 0.018)}" letter-spacing="5">SHARE YOUR REALITY SHIFT</text>
</svg>`;
}

export function svgToPngDataUrl(svgString: string, width: number, height: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        return reject(new Error("Canvas context not available"));
      }
      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/png");
      URL.revokeObjectURL(url);
      resolve(dataUrl);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export function buildShareCaption(streak: number, statusTitle: string, consistency: number, totalXp: number, percentile: number): string {
  return `I just hit a ${streak}-day Manifestation Streak on Menifest OS. ${statusTitle}. ${consistency}% consistency, ${totalXp.toLocaleString()} XP, Top ${percentile}%. #MenifestOS #StreakOnFire #RealityShifter`;
}

// ---------------------------------------------------------------------------
// GOAL TRACKING
// ---------------------------------------------------------------------------

export const GOAL_TRACKS = [
  { name: "Wealth", icon: "💰", tint: "from-amber-300 to-yellow-500" },
  { name: "Business", icon: "📈", tint: "from-amber-100 to-yellow-500" },
  { name: "Fitness", icon: "💪", tint: "from-emerald-300 to-lime-500" },
  { name: "Relationship", icon: "💜", tint: "from-amber-200 to-amber-600" },
  { name: "Career", icon: "🚀", tint: "from-yellow-200 to-amber-600" },
];

export function getGoalName(category?: string) {
  if (!category) return "Wealth";
  const map: Record<string, string> = {
    lifestyle: "Fitness",
    spiritual: "Relationship",
  };
  return map[category] || category.charAt(0).toUpperCase() + category.slice(1);
}

export function computeGoalStreaks(
  events: StreakEvent[],
  desires: { category?: string; consistencyScore?: number; progress?: number; title?: string }[],
  overallStreak: number
) {
  return GOAL_TRACKS.map((goal, index) => {
    const desireMatch = desires.find((d) => getGoalName(d.category) === goal.name);
    const eventDates = Array.from(
      new Set(events.filter((e) => getGoalName(e.goalCategory) === goal.name).map((e) => e.localDate))
    );
    const baseStreak = eventDates.length;
    const desireBoost = desireMatch ? Math.round((desireMatch.consistencyScore || 0) / 100 * overallStreak) : 0;
    const streak = Math.max(0, baseStreak + desireBoost);
    return {
      ...goal,
      streak,
      progress: Math.min(100, desireMatch?.progress || Math.max(10, 70 - index * 7)),
      title: desireMatch?.title || `${goal.name} Reality Track`,
    };
  });
}

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { collection, doc, onSnapshot, query, setDoc, orderBy, serverTimestamp, Timestamp, getDocs, limit, where, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useFirebase } from "../components/FirebaseProvider";
import type {
  AchievementBadge,
  CommunityPost,
  DailyTask,
  GoalCategory,
  JournalEntry,
  LeaderboardEntry,
  ProfileState,
  Quest,
  RitualItem,
  StreakEvent,
  StreakEventType,
  XpTransaction,
  ShareCardOptions,
  AcademyProgress,
  AcademyBadge,
} from "../types";
import {
  BASE_BADGE_RULES,
  DAILY_ACTIONS,
  MILESTONES,
  addDaysToDateStr,
  addXp,
  buildShareCaption,
  computeBadges,
  computeConsistency,
  computeGoalStreaks,
  computeJourneyDays,
  computeLeaderboard,
  computeMonthlyXp,
  computePercentile,
  computeStreak,
  computeTopAction,
  downloadDataUrl,
  generateShareCardSvg,
  getGoalName,
  getLastNLocalDates,
  getLevelTitle,
  getMilestoneForStreak,
  getStatusTitle,
  getTodayStr,
  getUserTimezone,
  isWithinGracePeriod,
  svgToPngDataUrl,
  toLocalDateString,
} from "../lib/gamification";

const GUEST_KEY = "mos_gamification_v2";
const LEADERBOARD_MIN_USERS = 20;

interface FirestoreDoc {
  id?: string;
  [key: string]: unknown;
}

function serializeEvents(events: StreakEvent[]): StreakEvent[] {
  return events.slice(-500).map((e) => ({
    ...e,
    createdAt: e.createdAt || new Date().toISOString(),
    localDate: e.localDate || toLocalDateString(new Date(e.createdAt)),
  }));
}

function fromFirestoreTimestamp(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null && "toDate" in value && typeof (value as { toDate: () => Date }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return null;
}

export function useGamification({
  profile,
  desires = [],
  rituals = [],
  quests = [],
  journalEntries = [],
  academyProgress = {},
  academyBadges = [],
  communityPosts = [],
  onProfileUpdate,
  onNotify
}: {
  profile: ProfileState,
  desires?: any[],
  rituals?: RitualItem[],
  quests?: Quest[],
  journalEntries?: JournalEntry[],
  academyProgress?: Record<string, AcademyProgress>,
  academyBadges?: AcademyBadge[],
  communityPosts?: CommunityPost[],
  onProfileUpdate?: (patch: Partial<ProfileState>) => void,
  onNotify?: (msg: string) => void
}) {
  const { user } = useFirebase();
  const timeZone = useMemo(() => getUserTimezone(), []);
  const today = useMemo(() => getTodayStr(timeZone), [timeZone]);
  const yesterday = useMemo(() => addDaysToDateStr(today, -1), [today]);

  const [events, setEvents] = useState<StreakEvent[]>([]);
  const [xpTransactions, setXpTransactions] = useState<XpTransaction[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [gracePeriodHours] = useState(4);
  const [copied, setCopied] = useState(false);

  const pendingRef = useRef<Promise<unknown> | null>(null);

  // ---------------------------------------------------------------------------
  // LOAD & SYNC
  // ---------------------------------------------------------------------------
  useEffect(() => {
    try {
      const saved = localStorage.getItem(GUEST_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.events)) setEvents(parsed.events);
      }
    } catch (e) {
      console.warn("Gamification load error", e);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setEventsLoading(false);
      return;
    }
    setEventsLoading(true);
    const eventsRef = collection(db, "users", user.uid, "streak_events");
    const q = query(eventsRef, orderBy("createdAt", "desc"), limit(100));
    const unsub = onSnapshot(q, (snapshot) => {
      if (snapshot.metadata.fromCache && snapshot.empty) return;
      const items: StreakEvent[] = snapshot.docs
        .map((d) => {
          const data = d.data() as FirestoreDoc;
          return {
            id: d.id,
            userId: data.userId as string | undefined,
            type: data.type as StreakEventType,
            label: (data.label as string) || "Action",
            xp: Number(data.xp) || 0,
            createdAt: fromFirestoreTimestamp(data.createdAt) || new Date().toISOString(),
            localDate: (data.localDate as string) || toLocalDateString(new Date()),
            goalCategory: data.goalCategory as GoalCategory | undefined,
            streakExtended: Boolean(data.streakExtended),
          };
        })
        .filter((e) => e.type);
      setEvents(items);
      setEventsLoading(false);
    }, (err) => {
      console.warn("streak_events listener error", err);
      setEventsLoading(false);
    });
    return () => unsub();
  }, [user]);

  // ---------------------------------------------------------------------------
  // DERIVED CALCULATIONS (STRICT ORDER)
  // ---------------------------------------------------------------------------
  const memo_streakEvaluation = useMemo(
    () => computeStreak(events, profile.streakFreezes || 0, profile.longestStreak || 0, gracePeriodHours, timeZone),
    [events, profile.streakFreezes, profile.longestStreak, gracePeriodHours, timeZone]
  );

  const memo_last30 = useMemo(() => getLastNLocalDates(30, timeZone), [timeZone]);
  const memo_last90 = useMemo(() => getLastNLocalDates(90, timeZone), [timeZone]);

  const memo_consistency = useMemo(() => computeConsistency(memo_streakEvaluation.activeDays, memo_last30, events), [memo_streakEvaluation.activeDays, memo_last30, events]);
  const memo_monthlyXp = useMemo(() => computeMonthlyXp(events, memo_last30), [events, memo_last30]);
  const memo_journeyDays = useMemo(() => computeJourneyDays(events, timeZone), [events, timeZone]);
  const memo_topAction = useMemo(() => computeTopAction(events, DAILY_ACTIONS), [events]);

  const memo_badges = useMemo<AchievementBadge[]>(
    () =>
      computeBadges(
        BASE_BADGE_RULES,
        { streak: memo_streakEvaluation.streak, totalXp: profile.totalXp || 0, level: profile.level || 1 },
        memo_consistency,
        academyBadges.length,
        communityPosts.length
      ),
    [memo_streakEvaluation.streak, profile.totalXp, profile.level, memo_consistency, academyBadges.length, communityPosts.length]
  );

  const memo_milestoneInfo = useMemo(() => getMilestoneForStreak(memo_streakEvaluation.streak), [memo_streakEvaluation.streak]);
  const memo_statusTitle = useMemo(() => getStatusTitle(memo_streakEvaluation.streak, memo_consistency), [memo_streakEvaluation.streak, memo_consistency]);
  const memo_levelTitle = useMemo(() => getLevelTitle(profile.level || 1), [profile.level]);

  const memo_strongestGoal = useMemo(() => {
    if (!desires || desires.length === 0) return "Wealth";
    const top = [...desires].sort((a, b) => (b.progress || 0) + (b.consistencyScore || 0) - ((a.progress || 0) + (a.consistencyScore || 0)))[0];
    return getGoalName(top?.category);
  }, [desires]);

  const memo_goalStreaks = useMemo(
    () => computeGoalStreaks(events, desires, memo_streakEvaluation.streak),
    [events, desires, memo_streakEvaluation.streak]
  );

  const memo_dailyTasks = useMemo<DailyTask[]>(() => {
    const completedSet = new Set<StreakEventType>();
    for (const e of events) {
      if (e.localDate === today) completedSet.add(e.type);
    }
    return DAILY_ACTIONS.map((action) => ({
      ...action,
      completed: completedSet.has(action.type),
    }));
  }, [events, today]);

  // Realistic percentile from consistency + streak + XP (no backend round-trip).
  const memo_percentile = useMemo(() => {
    const streakScore = Math.min(50, memo_streakEvaluation.streak * 1.5);
    const consistencyScore = Math.min(40, memo_consistency * 0.4);
    const xpScore = Math.min(10, (profile.totalXp || 0) / 1000);
    const totalScore = streakScore + consistencyScore + xpScore;
    return Math.max(1, Math.min(99, Math.round(100 - totalScore)));
  }, [memo_streakEvaluation.streak, memo_consistency, profile.totalXp]);

  // Streak at risk: user has a streak but hasn't completed today.
  const memo_isAtRisk = useMemo(() => {
    if (memo_streakEvaluation.streak < 1) return false;
    return !memo_streakEvaluation.dailyCompleted;
  }, [memo_streakEvaluation.streak, memo_streakEvaluation.dailyCompleted]);

  // ---------------------------------------------------------------------------
  // SYNC
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!onProfileUpdate || eventsLoading) return;
    const patch: Partial<ProfileState> = {};
    // Use a SINGLE consistent streak value (max of consecutive & journey days).
    // Writing both would cause them to oscillate -> infinite render loop.
    const effectiveStreak = Math.max(memo_streakEvaluation.streak, memo_journeyDays);
    if (effectiveStreak !== (profile.streak || 0)) patch.streak = effectiveStreak;
    if (memo_streakEvaluation.longestStreak !== (profile.longestStreak || 0)) patch.longestStreak = memo_streakEvaluation.longestStreak;
    if (memo_streakEvaluation.freezeBalance !== (profile.streakFreezes || 0)) patch.streakFreezes = memo_streakEvaluation.freezeBalance;
    if (memo_streakEvaluation.lastStreakDate !== (profile.lastStreakDate || null)) patch.lastStreakDate = memo_streakEvaluation.lastStreakDate || undefined;
    
    if (Object.keys(patch).length > 0) {
      onProfileUpdate(patch);
    }
  }, [memo_streakEvaluation, memo_journeyDays, profile.streak, profile.longestStreak, profile.streakFreezes, profile.lastStreakDate, onProfileUpdate, eventsLoading]);

  // ---------------------------------------------------------------------------
  // ACTIONS
  // ---------------------------------------------------------------------------
  const recordAction = useCallback(
    async (type: StreakEventType, label: string, xp: number, goalCategory?: GoalCategory): Promise<boolean> => {
      const now = new Date();
      const localDate = toLocalDateString(now, timeZone);
      const alreadyToday = events.some((e) => e.localDate === localDate && e.streakExtended);
      const streakWillExtend = !alreadyToday;

      const eventData: any = {
        userId: user?.uid, type, label, xp, createdAt: serverTimestamp(), localDate, streakExtended: streakWillExtend,
      };
      if (goalCategory) eventData.goalCategory = goalCategory;

      const txData: any = {
        userId: user?.uid, amount: xp, reason: label, type, createdAt: serverTimestamp(), localDate,
      };

      if (user) {
        const eventId = `se_${now.getTime()}_${Math.random().toString(36).slice(2, 9)}`;
        const txId = `tx_${now.getTime()}_${Math.random().toString(36).slice(2, 9)}`;
        Promise.all([
          setDoc(doc(collection(db, "users", user.uid, "streak_events"), eventId), eventData),
          setDoc(doc(collection(db, "users", user.uid, "xp_transactions"), txId), txData),
        ]).catch(e => console.warn(e));
      }

      if (onProfileUpdate) {
        const result = addXp(profile.xp || 0, profile.totalXp || 0, profile.level || 1, xp);
        onProfileUpdate({ xp: result.xp, totalXp: result.totalXp, level: result.level, universeRank: result.rank });
        if (result.leveledUp) onNotify?.(`Level ${result.level} achieved!`);
      }
      return streakWillExtend;
    },
    [events, onProfileUpdate, onNotify, profile, timeZone, user]
  );

  // ---------------------------------------------------------------------------
  // EXPOSED STATE
  // ---------------------------------------------------------------------------
  return {
    state: {
      streak: Math.max(memo_streakEvaluation.streak, memo_journeyDays),
      journeyDays: memo_journeyDays,
      longestStreak: memo_streakEvaluation.longestStreak,
      streakFreezes: memo_streakEvaluation.freezeBalance,
      lastStreakDate: memo_streakEvaluation.lastStreakDate,
      activeDays: memo_streakEvaluation.activeDays,
      dailyCompleted: memo_streakEvaluation.dailyCompleted,
      level: profile.level || 1,
      xp: profile.xp || 0,
      totalXp: profile.totalXp || 0,
      universeRank: profile.universeRank || "Dreamer",
      consistency: memo_consistency,
      percentile: memo_percentile,
      badges: memo_badges,
      milestones: MILESTONES,
      nextMilestone: memo_milestoneInfo.next,
      previousMilestone: memo_milestoneInfo.previous,
      milestoneProgress: memo_milestoneInfo.progress,
      events,
      leaderboard: [],
      myRank: memo_percentile,
      dailyTasks: memo_dailyTasks,
      goalStreaks: memo_goalStreaks,
      monthlyXp: memo_monthlyXp,
      topAction: memo_topAction,
      statusTitle: memo_statusTitle,
      levelTitle: memo_levelTitle,
      strongestGoal: memo_strongestGoal,
      timezone: timeZone,
      gracePeriodHours,
      leaderboardLoading: false,
      copied,
      last90: memo_last90,
    },
    actions: {
      recordAction,
      completeDailyQuest: (id: string, title: string, xp: number) => recordAction("goal_task", title, xp),
      claimStreakFreeze: () => {
        const next = Math.min((profile.streakFreezes || 0) + 1, 5);
        if (onProfileUpdate) onProfileUpdate({ streakFreezes: next });
        if (user) setDoc(doc(db, "users", user.uid), { streakFreezes: next }, { merge: true });
      },
      canExtendStreakToday: () => !events.some((e) => e.localDate === today && e.streakExtended),
      isStreakAtRisk: () => memo_isAtRisk,
      refreshLeaderboard: async () => {},
      downloadShareCard: async (opts: any) => {
        const svg = generateShareCardSvg({
          platform: opts.platform,
          mode: opts.mode,
          name: user?.displayName?.split(' ')[0] || profile.name || 'Manifestor',
          streak: memo_streakEvaluation.streak,
          levelTitle: memo_levelTitle.name,
          consistency: memo_consistency,
          percentile: memo_percentile,
          badgeTitle: 'Badge',
          totalXp: profile.totalXp || 0,
          strongestGoal: memo_strongestGoal,
        });
        const dims: Record<string, { w: number; h: number }> = {
          instagram: { w: 1080, h: 1350 },
          tiktok: { w: 1080, h: 1920 },
          whatsapp: { w: 1080, h: 1080 },
          x: { w: 1600, h: 900 },
        };
        const { w, h } = dims[opts.platform] || dims.instagram;
        const dataUrl = await svgToPngDataUrl(svg, w, h);
        downloadDataUrl(dataUrl, `manifest-${opts.mode}-${Date.now()}.png`);
      },
      copyShareCaption: async () => {
        const caption = buildShareCaption(
          memo_streakEvaluation.streak,
          memo_statusTitle,
          memo_consistency,
          profile.totalXp || 0,
          memo_percentile
        );
        try {
          await navigator.clipboard.writeText(caption);
          setCopied(true);
          setTimeout(() => setCopied(false), 2500);
        } catch {
          // fallback: select text
        }
        return caption;
      },
    },
  };
}

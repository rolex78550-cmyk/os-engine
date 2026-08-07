import { useState, useEffect, useMemo, useCallback, useRef, useTransition, FormEvent } from "react";
import { useFirebase } from "../components/FirebaseProvider";
import { startUserSession, logPageVisit } from "../lib/activity";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { useGamification } from "./useGamification";
import { getTodayStr } from "../lib/gamification";
import { useDynamicEnergyHistory } from "./useDynamicEnergyHistory";
import { doc, setDoc, updateDoc, onSnapshot, collection, addDoc, query, orderBy, limit, deleteDoc, increment, where, getDocs, getDoc, serverTimestamp } from "firebase/firestore";
import { 
  Desire, JournalEntry, ProfileState, Quest, CommunityPost, 
  AcademyProgress, AcademyBadge, ManifestActionEvent, 
  ManifestActionType, GoalCategory, NotificationPreferences, VisionItem, RitualItem,
  UserStats, DEFAULT_STATS, RANK_ORDER
} from "../types";
import { generateFable5Quests, applyQuestRewards, calculateRank, getDailyXpTarget } from "../lib/fable5QuestEngine";
import { UniversePortalEvent } from "../components/UniversePortalAnimation";

const DEFAULT_NOTIFICATION_PREFS: NotificationPreferences = {
  browserPushEnabled: false,
  emailRemindersEnabled: false,
  promotionalEnabled: true,
  ritualRemindersEnabled: true,
  achievementAlertsEnabled: true,
  emotionalTone: "luxury",
  quietHoursStart: "22:30",
  quietHoursEnd: "07:00",
  ritualTimes: { morning: "08:00", noon: "13:00", night: "21:00", any: "18:00" },
};

function mergeNotificationPrefs(saved?: Partial<NotificationPreferences>): NotificationPreferences {
  return {
    ...DEFAULT_NOTIFICATION_PREFS,
    ...(saved || {}),
    ritualTimes: { ...DEFAULT_NOTIFICATION_PREFS.ritualTimes, ...(saved?.ritualTimes || {}) },
  };
}

export function useAppLogic() {
  const { user, profile: fbProfile, loading: fbLoading, isPremium, isOnTrial, hasPaidAccess, subscription, signIn, signInDemo, authError, clearAuthError, signOut, refreshSubscription } = useFirebase();
  const [isPending, startTransition] = useTransition();

  // -------------------------------------------------------------
  // 1. STATE INITIALIZATION
  // -------------------------------------------------------------
  const [desires, setDesires] = useState<Desire[]>([]);
  const [rituals, setRituals] = useState<RitualItem[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [profile, setProfile] = useState<ProfileState>({
    name: "Seeker", alignment: 80, streak: 0, belief: 70, emotion: 70, action: 70,
    coherenceHistory: [70, 72, 75], level: 1, xp: 0, totalXp: 0, universeRank: "Dreamer",
    streakFreezes: 2, activeDays: []
  });
  const [quests, setQuests] = useState<Quest[]>([]);
  
  // === FABLE 5 RPG CORE SYSTEM (FAST) ===
  const [userStats, setUserStats] = useState<UserStats>(DEFAULT_STATS);
  const [coins, setCoins] = useState(0);
  const [currentRank, setCurrentRank] = useState("Civilian");
  const [achievements, setAchievements] = useState<string[]>([]);
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
  const [academyProgress, setAcademyProgress] = useState<Record<string, AcademyProgress>>({});
  const [academyBadges, setAcademyBadges] = useState<AcademyBadge[]>([]);
  const [visionItems, setVisionItems] = useState<VisionItem[]>([]);
  const [todayPlans, setTodayPlans] = useState<any[]>([]);

  // UI STATE
  const [activeTabState, setActiveTabState] = useState<string>("dashboard");
  
  const setActiveTab = useCallback((tab: any) => {
    // Legacy support: old "rituals" tab → goals
    // "streaks" is now Solo Dominion (the real Solo Leveling + Manifestation RPG)
    if (tab === "rituals") tab = "goals";
    setActiveTabState(tab);
  }, []);
  const activeTab = activeTabState;
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalCategory, setNewGoalCategory] = useState<GoalCategory>("wealth");
  const [newGoalIcon, setNewGoalIcon] = useState("✨");

  const [searchQuery, setSearchQuery] = useState("");
  const [alignmentResponseText, setAlignmentResponseText] = useState("");
  const [isSearchingQuantum, setIsSearchingQuantum] = useState(false);
  const [isVoiceSearching, setIsVoiceSearching] = useState(false);
  const [activeCalibrationId, setActiveCalibrationId] = useState<string | null>(null);
  const [activeRitualGuidanceId, setActiveRitualGuidanceId] = useState<string | null>(null);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);
  const [universePortalEvent, setUniversePortalEvent] = useState<UniversePortalEvent | null>(null);
  const [showCinematicIntro, setShowCinematicIntro] = useState(false);
  const [showManifestOnboarding, setShowManifestOnboarding] = useState(false);
  const onboardingTriggeredRef = useRef(false);
  const questsInitializedRef = useRef(false);

  // === BULLETPROOF PER-USER ONBOARDING (FIRST LOGIN ONLY) ===
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  // React to user & profile changes to trigger survey for new logins
  useEffect(() => {
    if (!user) {
      setHasCompletedOnboarding(false);
      setShowManifestOnboarding(false);
      return;
    }

    const userKey = `manifest_onboarded_${user.uid}`;
    const localDone = typeof window !== "undefined" && localStorage.getItem(userKey) === "true";
    const fbDone = (fbProfile as any)?.onboarded === true;
    const isDone = localDone || fbDone;

    if (isDone) {
      setHasCompletedOnboarding(true);
      setShowManifestOnboarding(false);
      onboardingTriggeredRef.current = true;
    } else {
      setHasCompletedOnboarding(false);
      setShowManifestOnboarding(true);
    }
  }, [user?.uid, (fbProfile as any)?.onboarded]);
  const [showPricingPage, setShowPricingPage] = useState(false);
  const [paywallMessage, setPaywallMessage] = useState<string | null>(null);
  const [isGeneratingQuests, setIsGeneratingQuests] = useState(false);
  const [isSubmittingJournal, setIsSubmittingJournal] = useState(false);
  const [isUploadingVision, setIsUploadingVision] = useState(false);
  const [isCreatingGoal, setIsCreatingGoal] = useState(false);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [showMobileProfileMenu, setShowMobileProfileMenu] = useState(false);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [aiInsight, setAiInsight] = useState({
    insight: "Your energetic alignment is crystallizing perfectly. Your scores reflect a highly coherent wave structure.",
    recommendation: "Allocate 3 minutes to sensory silence before scripting tonight."
  });

  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>(DEFAULT_NOTIFICATION_PREFS);
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>([]);
  const [pushPermission, setPushPermission] = useState<string>("default");

  // --- Notification Center Logic ---
  const dynamicNotifications = useMemo(() => {
    const items: any[] = [];
    const today = getTodayStr();

    // Incomplete daily quests
    quests.forEach(quest => {
      if (!quest.completed) {
        items.push({
          id: `quest-${quest.id}`, icon: "🎯", title: `Daily Quest: ${quest.title}`,
          body: quest.description, priority: "medium", action: quest.category, actionLabel: "Complete"
        });
      }
    });

    // Incomplete daily rituals
    rituals.forEach(ritual => {
      if (ritual.lastCompletedDate !== today && !(ritual.completedDates || []).includes(today)) {
        items.push({
          id: `ritual-${ritual.id}`, icon: "🔥", title: `Ritual Pending: ${ritual.label}`,
          body: `${ritual.timeOfDay} ritual needs attention today.`, priority: ritual.timeOfDay === "morning" ? "high" : "medium",
          action: "rituals", actionLabel: "Complete"
        });
      }
    });

    // Low streak freeze warning
    if (profile.streak > 0 && profile.streakFreezes === 0) {
      const hasIncompleteRituals = rituals.some(r => r.lastCompletedDate !== today && !(r.completedDates || []).includes(today));
      if (hasIncompleteRituals) {
        items.push({
          id: "streak-risk-alert", icon: "⚠️", title: "Streak at Risk",
          body: `Your ${profile.streak}-day streak will reset tomorrow if rituals aren't completed.`,
          priority: "high", action: "rituals", actionLabel: "Protect"
        });
      }
    }

    return items;
  }, [quests, rituals, profile.streak, profile.streakFreezes]);

  const unreadNotificationCount = useMemo(() => {
    return dynamicNotifications.filter(n => !readNotificationIds.includes(n.id)).length;
  }, [dynamicNotifications, readNotificationIds]);

  const openNotificationAction = useCallback((id: string, action: string) => {
    setReadNotificationIds(prev => Array.from(new Set([...prev, id])).slice(-200));
    setShowNotificationCenter(false);

    
    const tab = action === "rituals" ? "goals" : action;
    // Support old rituals + new Solo Dominion (streaks)
    const allowed = ["goals", "community", "academy", "journal", "profile", "streaks"];
    if (allowed.includes(tab)) {
      startTransition(() => setActiveTab(tab as any));
    }
  }, []);

  const requestPushPermission = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      const perm = await Notification.requestPermission();
      setPushPermission(perm);
    }
  };

  const sendTestPush = () => {
    onNotify("Testing system resonance... Signal clear.");
  };

  const sendTestEmail = async () => {
    onNotify("Test email sequence initiated. Check your subspace link.");
  };

  // Dynamic History Hook
  const dynamicEnergyHistory = useDynamicEnergyHistory(journalEntries, rituals, profile);

  // Profile Update Handler
  const updateUserProfile = async (updates: Partial<ProfileState>) => {
    setProfile((prev) => ({ ...prev, ...updates }));
    if (user) {
      try {
        await setDoc(doc(db, "users", user.uid), updates, { merge: true });
        onNotify("Profile successfully updated and synchronized!");
      } catch (err: any) {
        console.error("Failed to update user profile in Firestore:", err);
      }
    } else {
      onNotify("Profile updated locally.");
    }
  };

  // ---------------------------------------------------------------------------
  // GAMIFICATION ENGINE
  // ---------------------------------------------------------------------------
  const onProfileUpdate = useCallback((patch: Partial<ProfileState>) => {
    setProfile((prev) => ({ ...prev, ...patch }));
  }, []);

  const onNotify = useCallback((msg: string) => {
    if (typeof msg !== 'string') return;
    setNotificationMsg(msg);
    // Clear any existing timeout to prevent flickering
    if ((window as any).notificationTimeout) {
      clearTimeout((window as any).notificationTimeout);
    }
    (window as any).notificationTimeout = setTimeout(() => setNotificationMsg(null), 4000);
  }, []);

  const { state: gameState, actions: gameActions } = useGamification({
    profile, desires, rituals, quests, journalEntries, 
    academyProgress, academyBadges, communityPosts,
    onProfileUpdate, onNotify
  });

  // -------------------------------------------------------------
  // SYNC & FETCH LOGIC
  // -------------------------------------------------------------
  useEffect(() => {
    if (fbProfile) {
      const normalized: ProfileState = {
        ...fbProfile,
        alignment: Number((fbProfile as any).alignment) || 80,
        belief: Number((fbProfile as any).belief) || 70,
        emotion: Number((fbProfile as any).emotion) || 70,
        action: Number((fbProfile as any).action) || 70,
        level: Number((fbProfile as any).level) || 1,
        xp: Number((fbProfile as any).xp) || 0,
        totalXp: Number((fbProfile as any).totalXp) || 0,
        streak: Number((fbProfile as any).streak) || 0,
        longestStreak: Number((fbProfile as any).longestStreak) || 0,
        streakFreezes: Number((fbProfile as any).streakFreezes) || 2,
        activeDays: Array.isArray((fbProfile as any).activeDays) ? (fbProfile as any).activeDays : [],
        lastStreakDate: typeof fbProfile.lastStreakDate === 'string' ? fbProfile.lastStreakDate : (fbProfile.lastStreakDate as any)?.toDate?.()?.toISOString() || undefined,
      };

      // GUARD: Only update state if data has actually changed to prevent render loops
      setProfile(prev => {
        const isSame = prev.streak === normalized.streak && 
                       prev.level === normalized.level && 
                       prev.xp === normalized.xp && 
                       prev.alignment === normalized.alignment && 
                       prev.lastStreakDate === normalized.lastStreakDate && 
                       prev.activeDays.length === normalized.activeDays.length;
        return isSame ? prev : normalized;
      });

      if ((fbProfile as any).notificationPrefs) {
        setNotificationPrefs(mergeNotificationPrefs((fbProfile as any).notificationPrefs));
      }

      // === FABLE 5 RPG SYNC (FAST) ===
      const savedStats = (fbProfile as any).stats;
      if (savedStats) setUserStats({ ...DEFAULT_STATS, ...savedStats });
      if (typeof (fbProfile as any).coins === "number") setCoins((fbProfile as any).coins);
      if ((fbProfile as any).rank) setCurrentRank((fbProfile as any).rank);
      if (Array.isArray((fbProfile as any).achievements)) setAchievements((fbProfile as any).achievements);

      // Auto calculate rank on profile load
      const calcRank = calculateRank(normalized.xp || 0, savedStats || userStats);
      if (calcRank !== currentRank) setCurrentRank(calcRank);

      // === BULLETPROOF ONBOARDING SURVEY TRIGGER FOR UNBOARDED USERS ===
      const userKey = user ? `manifest_onboarded_${user.uid}` : "manifest_onboarded";
      const localStorageDone = typeof window !== "undefined" && localStorage.getItem(userKey) === "true";
      const trulyOnboarded = hasCompletedOnboarding || localStorageDone || (fbProfile as any)?.onboarded === true;

      if (
        user &&
        fbProfile &&
        !trulyOnboarded &&
        !showManifestOnboarding
      ) {
        setShowManifestOnboarding(true);
      }

      // === FABLE 5 RPG QUEST GENERATION (FAST - DAILY) ===
      const todayStr = new Date().toISOString().slice(0, 10);
      const lastGen = (fbProfile as any)?.lastQuestGenerationDate;
      
      if (
        hasCompletedOnboarding &&
        fbProfile &&
        (quests.length === 0 || lastGen !== todayStr)
      ) {
        const context = {
          primaryFocus: (fbProfile as any).primaryPriority || (fbProfile as any).primaryFocus || "wealth",
          primaryPriority: (fbProfile as any).primaryPriority || (fbProfile as any).primaryFocus,
          target90Days: (fbProfile as any).target90Days || (fbProfile as any).longTermGoal,
          longTermGoal: (fbProfile as any).longTermGoal || (fbProfile as any).target90Days,
          shortTermGoal: (fbProfile as any).shortTermGoal,
          currentFitness: (fbProfile as any).currentFitness,
          currentMindset: (fbProfile as any).currentMindset,
          obstacles: (fbProfile as any).obstacles,
          blockers: (fbProfile as any).blockersList || (fbProfile as any).blockers,
          fears: (fbProfile as any).fearsList || (fbProfile as any).fears,
          motivations: (fbProfile as any).motivationsList || (fbProfile as any).motivations,
          dreamLife: (fbProfile as any).dreamLifeList || (fbProfile as any).dreamLife,
          coachStyle: (fbProfile as any).coachStyle,
          commitment: (fbProfile as any).commitment,
          identityArchetype: (fbProfile as any).identityArchetype,
          level: normalized.level || 1,
          stats: userStats,
          energy: 70,
        };

        const fableQuests = generateFable5Quests(context);
        setQuests(fableQuests);
        questsInitializedRef.current = true;

        // Save generation date
        if (user && lastGen !== todayStr) {
          setDoc(doc(db, "users", user.uid), { lastQuestGenerationDate: todayStr }, { merge: true }).catch(() => {});
        }
      }
    }
  }, [user, fbProfile]);

  useEffect(() => {
    if (!user) return;

    // FABLE 5 MODEL: All listeners wrapped defensively
    // None of these should ever block the UI
    const unsubDesires = onSnapshot(
      collection(db, "users", user.uid, "desires"),
      (snap) => {
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as Desire));
        console.log(`[FABLE5 Goals Listener] Received ${items.length} desires from Firestore`);
        setDesires(items);
      },
      (err) => {
        console.warn("[FABLE5 Goals Listener] desires listener info:", err?.code, err?.message);
      }
    );

    const unsubRituals = onSnapshot(
      collection(db, "users", user.uid, "rituals"),
      (snap) => setRituals(snap.docs.map(d => ({ id: d.id, ...d.data() } as RitualItem))),
      (err) => console.warn("[useAppLogic] rituals listener error (non-blocking):", err?.message)
    );

    const unsubJournal = onSnapshot(
      query(collection(db, "users", user.uid, "journal"), orderBy("createdTime", "desc"), limit(20)),
      (snap) => setJournalEntries(snap.docs.map(d => ({ id: d.id, ...d.data() } as JournalEntry))),
      (err) => console.warn("[useAppLogic] journal listener error (non-blocking):", err?.message)
    );

    const unsubVision = onSnapshot(
      collection(db, "users", user.uid, "vision_board"),
      (snap) => {
        const items = snap.docs.map(d => {
          const data = d.data() as any;
          // FABLE 5: Defensive clean-up of vision items
          return {
            id: d.id,
            imageUrl: data.imageUrl || "",
            caption: data.caption || "",
            createdAt: data.createdAt || new Date().toISOString(),
            userId: data.userId
          } as VisionItem;
        });
        console.log(`[FABLE5 Vision Listener] Received ${items.length} vision items from Firestore`);
        setVisionItems(items);
      },
      (err) => {
        console.warn("[FABLE5 Vision Listener] vision_board listener info:", err?.code, err?.message);
      }
    );

    const unsubAcademy = onSnapshot(
      collection(db, "users", user.uid, "academy_progress"),
      (snap) => {
        const prog: Record<string, AcademyProgress> = {};
        snap.forEach(doc => prog[doc.id] = doc.data() as AcademyProgress);
        setAcademyProgress(prog);
      },
      (err) => console.warn("[useAppLogic] academy_progress listener error (non-blocking):", err?.message)
    );

    const unsubAcademyBadges = onSnapshot(
      collection(db, "users", user.uid, "academy_badges"),
      (snap) => {
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AcademyBadge));
        setAcademyBadges(list);
      },
      (err) => console.warn("[useAppLogic] academy_badges listener error:", err?.message)
    );

    const unsubCommunity = onSnapshot(
      query(collection(db, "community_posts"), orderBy("createdAt", "desc"), limit(50)),
      (snap) => setCommunityPosts(snap.docs.map(d => ({ id: d.id, ...d.data() } as CommunityPost))),
      (err) => console.warn("[useAppLogic] community_posts listener error (non-blocking):", err?.message)
    );

    const unsubActionPlans = onSnapshot(
      collection(db, "users", user.uid, "action_plans"),
      (snap) => {
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        if (items.length === 0) {
          const defaults = [
            { text: "Execute Morning Power Ritual", done: true, createdAt: new Date().toISOString() },
            { text: "Complete Daily Adrenaline Quest", done: false, createdAt: new Date().toISOString() },
            { text: "Log Journal Reflection & Coherence", done: false, createdAt: new Date().toISOString() },
            { text: "Review Vision Board & Mindset", done: true, createdAt: new Date().toISOString() },
          ];
          defaults.forEach(async (d, idx) => {
            const planId = `ap_${Date.now()}_${idx}`;
            await setDoc(doc(db, "users", user.uid, "action_plans", planId), {
              id: planId,
              ...d
            });
          });
        } else {
          items.sort((a: any, b: any) => {
            const dateA = a.createdAt || "";
            const dateB = b.createdAt || "";
            return dateA.localeCompare(dateB);
          });
          setTodayPlans(items);
        }
      },
      (err) => console.warn("[useAppLogic] action_plans listener error (non-blocking):", err?.message)
    );

    return () => {
      unsubDesires(); unsubRituals(); unsubJournal(); unsubVision(); unsubAcademy(); unsubAcademyBadges(); unsubCommunity(); unsubActionPlans();
    };
  }, [user]);

  // -------------------------------------------------------------
  // HANDLERS
  // -------------------------------------------------------------
  const handleToggleRitual = async (id: string) => {
    const ritual = rituals.find(r => r.id === id);
    if (!ritual || !user) return;
    const today = getTodayStr();
    const isDone = ritual.lastCompletedDate === today;
    const nextDate = isDone ? "" : today;
    
    await updateDoc(doc(db, "users", user.uid, "rituals", id), { 
      lastCompletedDate: nextDate,
      completedDates: isDone 
        ? ritual.completedDates?.filter(d => d !== today) || []
        : Array.from(new Set([...(ritual.completedDates || []), today]))
    });

    if (!isDone) {
      gameActions.recordAction("ritual", ritual.label, 10);
    }
  };

  const handleAddRitual = async (label: string, timeOfDay: any) => {
    if (!user) return;
    const id = `r_${Date.now()}`;
    await setDoc(doc(db, "users", user.uid, "rituals", id), {
      id, label, timeOfDay, lastCompletedDate: "", completedDates: [], userId: user.uid
    });
  };

  const handleDeleteRitual = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, "users", user.uid, "rituals", id));
  };

  const handleQuestComplete = async (id: string) => {
    const quest = quests.find(q => q.id === id);
    if (!quest || quest.completed || !user) return;

    // Optimistic UI
    setQuests(prev => prev.map(q => q.id === id ? { ...q, completed: true } : q));

    // === FABLE 5 FAST REWARDS ===
    const rewards = applyQuestRewards(quest, userStats, coins, profile.xp || 0);
    
    const newStats = rewards.stats;
    const newCoins = rewards.coins;
    const newXp = rewards.xp;

    // Update local state instantly (dopamine)
    setUserStats(newStats);
    setCoins(newCoins);
    setProfile(prev => ({ ...prev, xp: newXp, totalXp: (prev.totalXp || 0) + quest.xpValue }));

    // Calculate new rank
    const newRank = calculateRank(newXp, newStats);
    if (newRank !== currentRank) {
      setCurrentRank(newRank);
    }

    // Save to Firestore (fast merge)
    try {
      await setDoc(doc(db, "users", user.uid), {
        stats: newStats,
        coins: newCoins,
        xp: newXp,
        totalXp: (profile.totalXp || 0) + quest.xpValue,
        rank: newRank,
        level: Math.floor(newXp / 80) + 1,
      }, { merge: true });
    } catch (e) {
      console.warn("Quest reward save skipped (non-blocking)");
    }

    // Legacy gamification
    gameActions.recordAction("goal_task", quest.title, quest.xpValue);
    onNotify(`+${quest.xpValue} XP • +${quest.coinReward} coins • Stats boosted`);

    // Simple achievement unlock (fast)
    const newAchievements = [...achievements];
    if (!newAchievements.includes("First Blood") && quests.filter(q => q.completed).length === 1) {
      newAchievements.push("First Blood");
    }
    if (!newAchievements.includes("Iron Discipline") && quest.questType === "main") {
      newAchievements.push("Iron Discipline");
    }
    setAchievements(newAchievements);
  };

  // FABLE 5 Penalty (fast)
  const applyQuestPenalty = (questId: string) => {
    const quest = quests.find(q => q.id === questId);
    if (!quest) return;

    const penalized = { ...userStats };
    Object.keys(penalized).forEach(k => {
      const key = k as keyof UserStats;
      penalized[key] = Math.max(1, penalized[key] - 1);
    });
    setUserStats(penalized);
    if (user) setDoc(doc(db, "users", user.uid), { stats: penalized }, { merge: true }).catch(() => {});
  };

  const handleCreateGoal = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !newGoalTitle.trim() || isCreatingGoal) return;

    setIsCreatingGoal(true);

    const title = newGoalTitle.trim();
    const id = `d_${Date.now()}`;
    const newDesire: Desire = {
      id,
      title,
      category: newGoalCategory,
      icon: newGoalIcon,
      progress: 10,
      expectedReality: "Consolidating",
      creationDate: getTodayStr(),
      beliefLevel: 70,
      emotionalState: 70,
      consistencyScore: 50,
      userId: user.uid
    };

    // Optimistic update - goal shows immediately
    setDesires(prev => [newDesire, ...prev]);

    try {
      // REAL Firestore write
      await setDoc(doc(db, "users", user.uid, "desires", id), newDesire);
      
      console.log(`[handleCreateGoal] ✅ SUCCESS: Goal saved to Firestore users/${user.uid}/desires/${id}`);
      setNewGoalTitle("");
      onNotify(`✅ Goal "${title}" saved to database successfully!`);
    } catch (err: any) {
      // Rollback if write fails
      setDesires(prev => prev.filter(d => d.id !== id));
      console.error("[handleCreateGoal] Firestore setDoc FAILED:", err);
      onNotify("❌ Failed to save goal to database. Please try again.");
    } finally {
      setIsCreatingGoal(false);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    if (!user) return;

    // Optimistic remove for instant UI
    const goalToDelete = desires.find(d => d.id === id);
    setDesires(prev => prev.filter(d => d.id !== id));

    try {
      await deleteDoc(doc(db, "users", user.uid, "desires", id));
      console.log(`[handleDeleteGoal] ✅ SUCCESS: Deleted from Firestore users/${user.uid}/desires/${id}`);
      onNotify("Goal deleted from database.");
    } catch (err: any) {
      // Rollback on failure
      if (goalToDelete) {
        setDesires(prev => [...prev, goalToDelete]);
      }
      console.error("[handleDeleteGoal] Firestore delete FAILED:", err);
      onNotify("Failed to delete goal from database.");
    }
  };

  const handleUpdateGoal = async (id: string, updates: Partial<Desire>) => {
    // Optimistic update
    setDesires(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));

    if (!user) return;
    try {
      await setDoc(doc(db, "users", user.uid, "desires", id), updates, { merge: true });
      console.log(`[handleUpdateGoal] ✅ Updated Firestore users/${user.uid}/desires/${id}`);
    } catch (err: any) {
      console.warn("[handleUpdateGoal] Firestore update error:", err?.message);
    }
  };

  // RESTORED TO OLD WORKING VERSION (that was storing images successfully)
  const handleAddVision = async (imageUrl: string, caption: string) => {
    if (!user) return;
    setIsUploadingVision(true);
    
    const id = `v_${Date.now()}`;
    const newVision: VisionItem = {
      id,
      imageUrl,
      caption: caption || "",
      createdAt: new Date().toISOString(),
      userId: user.uid
    };

    // Optimistic UI (same as old working version)
    setVisionItems(prev => [newVision, ...prev]);

    try {
      await setDoc(doc(db, "users", user.uid, "vision_board", id), newVision);
      console.log("[Vision] Image saved to Firestore (old working flow):", id);
      onNotify("Vision added successfully!");
    } catch (err: any) {
      setVisionItems(prev => prev.filter(v => v.id !== id));
      console.error("[Vision] Firestore write failed:", err);
      onNotify("Failed to save vision. " + (err?.message || ""));
      throw err;
    } finally {
      setIsUploadingVision(false);
    }
  };

  const handleDeleteVision = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, "users", user.uid, "vision_board", id));
  };

  const handleLikeCommunityPost = async (id: string) => {
    if (!user) return;
    await updateDoc(doc(db, "community_posts", id), { likes: increment(1) });
  };

  const handleAddCommunityPost = async (post: Omit<CommunityPost, "id" | "createdAt" | "likes">) => {
    if (!user) return;
    const id = `c_${Date.now()}`;
    const fullPost: CommunityPost = {
      ...post,
      id,
      createdAt: new Date().toISOString(),
      likes: 0,
      userId: user.uid,
    };

    // Optimistic UI - show immediately (listener will reconcile)
    setCommunityPosts(prev => [fullPost, ...prev]);

    try {
      await setDoc(doc(db, "community_posts", id), fullPost);
      onNotify("Post published to Community Hall (live on Firestore)!");
    } catch (err: any) {
      // rollback
      setCommunityPosts(prev => prev.filter(p => p.id !== id));
      console.error("[handleAddCommunityPost] Firestore write failed:", err);
      onNotify("Failed to publish post: " + (err?.message || "permission or network issue"));
      throw err;
    }
  };

  const submitRichJournal = async (payload: any) => {
    if (!user) return;
    setIsSubmittingJournal(true);
    const id = `j_${Date.now()}`;
    try {
      const journalData = {
        ...payload,
        id,
        userId: user.uid,
        createdTime: new Date().toISOString()
      };
      await setDoc(doc(db, "users", user.uid, "journal", id), journalData);
      gameActions.recordAction("journal", `${payload.type} journal`, 20);
      onNotify("Journal entry saved to database!");
      console.log("[Journal] Successfully wrote to Firestore:", id);
    } catch (err: any) {
      console.error("[submitRichJournal] Firestore write FAILED:", err);
      onNotify("Failed to save journal: " + (err?.message || "Check console"));
      throw err; // Let UI know
    } finally {
      setIsSubmittingJournal(false);
    }
  };

  const handleDeleteJournal = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, "users", user.uid, "journal", id));
  };

  const handleTogglePlan = async (id: string, done: boolean) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, "users", user.uid, "action_plans", id), { done });
    } catch (err) {
      console.error("Failed to toggle plan done:", err);
    }
  };

  const handleAddPlan = async (text: string) => {
    if (!user || !text.trim()) return;
    const planId = `ap_${Date.now()}`;
    try {
      await setDoc(doc(db, "users", user.uid, "action_plans", planId), {
        id: planId,
        text: text.trim(),
        done: false,
        createdAt: new Date().toISOString()
      });
      onNotify("Action plan item added!");
    } catch (err) {
      console.error("Failed to add plan:", err);
    }
  };

  const handleDeletePlan = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, "users", user.uid, "action_plans", id));
      onNotify("Action plan item removed.");
    } catch (err) {
      console.error("Failed to delete plan:", err);
    }
  };

  const generateDailyQuests = async (force = false) => {
    if (isGeneratingQuests) return;
    setIsGeneratingQuests(true);

    // FABLE 5 FAST QUEST ENGINE
    const context = {
      primaryFocus: (profile as any).primaryFocus,
      longTermGoal: (profile as any).longTermGoal,
      shortTermGoal: (profile as any).shortTermGoal,
      currentFitness: (profile as any).currentFitness,
      currentMindset: (profile as any).currentMindset,
      obstacles: (profile as any).obstacles,
      level: profile.level || 1,
      stats: userStats,
    };

    const newQuests = generateFable5Quests(context);
    
    setQuests(newQuests);
    setIsGeneratingQuests(false);
    onNotify("FABLE 5 Quests regenerated. Rise, Hunter.");
  };

  const triggerPaywall = (msg: string) => {
    setPaywallMessage(msg);
    setShowPricingPage(true);
  };

  const handleUpgradeClick = useCallback(() => {
    setShowPricingPage(true);
    // Track pricing page view in Meta Pixel
    import('../lib/pixel').then(function(m) { m.trackPricingView(); });
  }, []);

  const fetchDailyInsight = async () => {
    setLoadingInsight(true);
    setTimeout(() => {
      setAiInsight({
        insight: "Your resonance is increasing. Keep focusing on your core desires.",
        recommendation: "Visualize your success for 5 minutes today."
      });
      setLoadingInsight(false);
    }, 1500);
  };

  // NEW: Cinematic Manifest + Solo Leveling Intro handler
  const handleCinematicIntroComplete = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("manifest_cinematic_done", "true");
    }
    // Safety: never chain if already completed onboarding
    const alreadyDone = (typeof window !== "undefined" && localStorage.getItem("manifest_onboarded") === "true") ||
                        hasCompletedOnboarding;
    setShowCinematicIntro(false);
    if (!alreadyDone) {
      setShowManifestOnboarding(true);
    }
  }, [hasCompletedOnboarding]);

  const handleManifestOnboardingComplete = async (data: any) => {
    // === IMMEDIATE PERMANENT LOCK: Save onboarding for current user ===
    setShowManifestOnboarding(false);
    setShowCinematicIntro(false);
    onboardingTriggeredRef.current = true;
    setHasCompletedOnboarding(true);
    
    if (typeof window !== "undefined") {
      if (user?.uid) {
        localStorage.setItem(`manifest_onboarded_${user.uid}`, "true");
      }
      localStorage.setItem("manifest_onboarded", "true");
    }

    // Immediately trigger pricing page if user does not have active paid access
    if (!hasPaidAccess && user?.email !== "asartist20@gmail.com") {
      setPaywallMessage("Your personalized AI Life System is ready! Subscribe to unlock full system access.");
      setShowPricingPage(true);
    }

    if (!user) return;

    try {
      const onboardingData = data.profile || {};
      const aiSystem = data.aiGeneratedSystem || {};

      const enrichedProfile = {
        ...onboardingData,
        ...aiSystem,
        onboarded: true,
        level: 1,
        xp: 0,
        universeRank: aiSystem.identityArchetype || "Aspiration Seeker",
        alignment: 65,
        belief: 70,
        emotion: 65,
        action: 60,
      };

      // Save to Firestore (onboarded: true)
      await setDoc(doc(db, "users", user.uid), enrichedProfile, { merge: true });

      // Update local profile state
      setProfile(prev => ({
        ...prev,
        ...enrichedProfile,
        name: enrichedProfile.name || prev.name,
      }));

      // Generate personalized quests from onboarding answers
      const initialQuests = generateFable5Quests({
        primaryFocus: onboardingData.primaryPriority || onboardingData.primaryFocus || "wealth",
        primaryPriority: onboardingData.primaryPriority || onboardingData.primaryFocus,
        target90Days: onboardingData.target90Days || onboardingData.longTermGoal || "Master 90-Day Vision",
        longTermGoal: onboardingData.target90Days || onboardingData.longTermGoal,
        shortTermGoal: aiSystem.firstDailyMission || "Morning Focus Ritual",
        blockers: onboardingData.blockers,
        fears: onboardingData.fears,
        motivations: onboardingData.motivations,
        dreamLife: onboardingData.dreamLife,
        coachStyle: onboardingData.coachStyle,
        commitment: onboardingData.commitment,
        identityArchetype: aiSystem.identityArchetype || onboardingData.identityArchetype,
        level: 1,
        stats: DEFAULT_STATS,
      });
      setQuests(initialQuests);
      questsInitializedRef.current = true;

      // Initialize FABLE 5 RPG stats on first onboarding
      const initialStats = { ...DEFAULT_STATS };
      await setDoc(doc(db, "users", user.uid), {
        stats: initialStats,
        coins: 50,
        rank: "Civilian",
        level: 1,
        xp: 0,
        totalXp: 0,
      }, { merge: true });

      setUserStats(initialStats);
      setCoins(50);
      setCurrentRank("Civilian");

      // Create long-term goal as first Desire
      if (onboardingData.longTermGoal) {
        const goalId = `d_${Date.now()}`;
        const firstDesire = {
          id: goalId,
          title: onboardingData.longTermGoal.substring(0, 85),
          category: (onboardingData.primaryFocus || "wealth") as any,
          progress: 8,
          expectedReality: "Formulating",
          icon: "✨",
          beliefLevel: 68,
          emotionalState: 65,
          consistencyScore: 55,
          creationDate: getTodayStr(),
          userId: user.uid
        };
        await setDoc(doc(db, "users", user.uid, "desires", goalId), firstDesire).catch(() => {});
        setDesires(prev => [firstDesire as any, ...prev]);
      }

      // Create a few personalized rituals based on focus
      const ritualsToCreate = [
        { label: "Morning Vision Alignment", timeOfDay: "morning" },
        { label: "Evening Reality Scripting", timeOfDay: "night" },
      ];
      if (onboardingData.primaryFocus === "fitness" || onboardingData.currentFitness === "neglected") {
        ritualsToCreate.push({ label: "Body Activation Movement", timeOfDay: "any" });
      }

      for (const r of ritualsToCreate) {
        const rid = `r_${Date.now()}_${Math.random()}`;
        await setDoc(doc(db, "users", user.uid, "rituals", rid), {
          id: rid,
          label: r.label,
          timeOfDay: r.timeOfDay,
          lastCompletedDate: "",
          completedDates: [],
          userId: user.uid
        }).catch(() => {});
      }

      onNotify("Welcome to Menifest OS, Hunter. Your path is now active.");

    } catch (e) {
      console.warn("Manifest onboarding save issue (non-blocking):", e);
    }
  };

  // OLD generatePersonalizedQuests replaced by FABLE 5 fast engine
  // (kept for backward compatibility in a few places)
  const generatePersonalizedQuests = (profileData: any) => {
    return generateFable5Quests({
      primaryFocus: profileData.primaryFocus,
      longTermGoal: profileData.longTermGoal,
      shortTermGoal: profileData.shortTermGoal,
      currentFitness: profileData.currentFitness,
      currentMindset: profileData.currentMindset,
      obstacles: profileData.obstacles,
      level: profileData.level || 1,
      stats: userStats,
    });
  };

  const handleAcademyLessonComplete = useCallback(async (moduleId: string, lessonId: string, xpGained: number) => {
    if (!user) return;
    
    // Fetch target module stats
    const totalLessonsMap: Record<string, number> = {
      "tesla-369": 5, "555-method": 5, "1111-guide": 4, "visualization": 5,
      "scripting": 4, "neville-goddard": 6, "affirmations": 4, "nlp-reprogramming": 6,
      "quantum-jump": 5, "buddha-wisdom": 5, "osho-techniques": 5, "the-secret": 6
    };
    const totalLessons = totalLessonsMap[moduleId] || 5;

    const progDocRef = doc(db, "users", user.uid, "academy_progress", moduleId);
    const existing = academyProgress[moduleId] || {
      userId: user.uid,
      moduleId,
      completedLessonIds: [],
      progressPercent: 0,
      startedAt: new Date().toISOString(),
      lastAccessedAt: new Date().toISOString(),
      currentStreak: 1,
      maxStreak: 1
    };

    if (existing.completedLessonIds.includes(lessonId)) return;

    const newCompletedIds = [...existing.completedLessonIds, lessonId];
    const newPercent = Math.round((newCompletedIds.length / totalLessons) * 100);

    const updatedProgress = {
      ...existing,
      completedLessonIds: newCompletedIds,
      progressPercent: newPercent,
      lastAccessedAt: new Date().toISOString(),
    };

    // Optimistic state update
    setAcademyProgress(prev => ({
      ...prev,
      [moduleId]: updatedProgress
    }));

    // Record game action + XP
    await gameActions.recordAction("academy_module", `Completed lesson in ${moduleId}`, xpGained);
    onNotify(`+${xpGained} XP • Lesson Complete!`);

    try {
      await setDoc(progDocRef, updatedProgress, { merge: true });
    } catch (err) {
      console.warn("Failed to save academy progress to Firestore:", err);
    }
  }, [user, academyProgress, gameActions, onNotify]);

  const handleAcademyModuleComplete = useCallback(async (moduleId: string, xpGained: number) => {
    if (!user) return;

    const moduleDataMap: Record<string, { badgeName: string; badgeIcon: string; title: string }> = {
      "tesla-369": { badgeName: "369 Initiate", badgeIcon: "zap", title: "Tesla 369 Method" },
      "555-method": { badgeName: "555 Alchemist", badgeIcon: "flame", title: "555 Method" },
      "1111-guide": { badgeName: "Portal Keeper", badgeIcon: "crown", title: "11:11 Guide" },
      "visualization": { badgeName: "Vision Architect", badgeIcon: "star", title: "Visualization Guide" },
      "scripting": { badgeName: "Script Weaver", badgeIcon: "book", title: "Scripting Guide" },
      "neville-goddard": { badgeName: "Assumption Architect", badgeIcon: "👁️", title: "Neville Goddard Techniques" },
      "affirmations": { badgeName: "Frequency Master", badgeIcon: "trending", title: "Affirmations Guide" },
      "nlp-reprogramming": { badgeName: "Neural Architect", badgeIcon: "award", title: "NLP Mind Reprogramming" },
      "quantum-jump": { badgeName: "Quantum Jumper", badgeIcon: "sparkles", title: "Quantum Jump Guide" },
      "buddha-wisdom": { badgeName: "Dharma Seeker", badgeIcon: "circle", title: "Gautam Buddha Wisdom" },
      "osho-techniques": { badgeName: "Zen Rebel", badgeIcon: "check", title: "Osho Manifestation Techniques" },
      "the-secret": { badgeName: "Secret Master", badgeIcon: "sparkles", title: "The Secret" }
    };
    const targetModule = moduleDataMap[moduleId] || { badgeName: "Academy Master", badgeIcon: "🎓", title: "Academy Module" };

    const progDocRef = doc(db, "users", user.uid, "academy_progress", moduleId);
    const existing = academyProgress[moduleId] || {
      userId: user.uid,
      moduleId,
      completedLessonIds: [],
      progressPercent: 0,
      startedAt: new Date().toISOString(),
      lastAccessedAt: new Date().toISOString(),
      currentStreak: 1,
      maxStreak: 1
    };

    const updatedProgress = {
      ...existing,
      progressPercent: 100,
      completedAt: new Date().toISOString(),
      lastAccessedAt: new Date().toISOString(),
    };

    // Optimistic state update
    setAcademyProgress(prev => ({
      ...prev,
      [moduleId]: updatedProgress
    }));

    // Record game action + XP
    await gameActions.recordAction("academy_module", `Mastered ${targetModule.title} Module`, xpGained);
    onNotify(`🏆 Mastered ${targetModule.title}! +${xpGained} XP`);

    // Add badge to Firestore
    const badgeId = `badge_${moduleId}`;
    const newBadge = {
      id: badgeId,
      name: targetModule.badgeName,
      icon: targetModule.badgeIcon,
      description: `For mastering the ${targetModule.title}`,
      earnedAt: new Date().toISOString(),
      moduleId,
      tier: 'gold' as const
    };

    try {
      await Promise.all([
        setDoc(progDocRef, updatedProgress, { merge: true }),
        setDoc(doc(db, "users", user.uid, "academy_badges", badgeId), newBadge)
      ]);
    } catch (err) {
      console.warn("Failed to complete module in Firestore:", err);
    }
  }, [user, academyProgress, gameActions, onNotify]);


  return {
    user, fbLoading, isPremium, isOnTrial, hasPaidAccess, subscription, profile, desires, rituals, journalEntries, quests,
    activeTab, setActiveTab, searchQuery, setSearchQuery, notificationMsg, universePortalEvent,
    hasCompletedOnboarding, setHasCompletedOnboarding,
    setUniversePortalEvent, showCinematicIntro, handleCinematicIntroComplete, showManifestOnboarding, setShowManifestOnboarding, handleManifestOnboardingComplete, showPricingPage, setShowPricingPage, paywallMessage,
    gameState, gameActions, isGeneratingQuests, generateDailyQuests, handleToggleRitual, 
    handleAddRitual, handleDeleteRitual, triggerPaywall, dynamicEnergyHistory, aiInsight, 
    loadingInsight, fetchDailyInsight, logPageVisit, signIn, signInDemo, authError, clearAuthError, signOut, visionItems,
    showNotificationCenter, setShowNotificationCenter, showMobileProfileMenu, setShowMobileProfileMenu,
    notificationPrefs, setNotificationPrefs, pushPermission, readNotificationIds, setReadNotificationIds,
    setDesires, isSubmittingJournal, newGoalTitle, setNewGoalTitle, newGoalCategory, setNewGoalCategory,
    newGoalIcon, setNewGoalIcon, handleAddVision, handleDeleteVision, handleLikeCommunityPost, handleAddCommunityPost,
    handleUpgradeClick, setActiveRitualGuidanceId, setNotificationMsg,
    academyProgress, academyBadges, communityPosts,
    dynamicNotifications, unreadNotificationCount, openNotificationAction, 
    requestPushPermission, sendTestPush, sendTestEmail,
    isUploadingVision, handleDeleteGoal, handleUpdateGoal, isCreatingGoal,
    handleQuestComplete, handleCreateGoal, submitRichJournal, handleDeleteJournal, updateUserProfile,
    todayPlans, handleTogglePlan, handleAddPlan, handleDeletePlan,
    handleAcademyLessonComplete, handleAcademyModuleComplete,

    // === FABLE 5 RPG SYSTEM (FAST) ===
    userStats,
    coins,
    currentRank,
    achievements,
    generateFable5Quests: () => generateFable5Quests({
      primaryFocus: (profile as any).primaryFocus,
      longTermGoal: (profile as any).longTermGoal,
      shortTermGoal: (profile as any).shortTermGoal,
      level: profile.level,
      stats: userStats,
    }),
    dailyXpTarget: getDailyXpTarget(profile.level || 1, userStats),
  };
}

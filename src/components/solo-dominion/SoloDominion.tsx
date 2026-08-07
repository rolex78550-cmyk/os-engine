import React, { useState, useEffect, useRef } from "react";
import { 
  Target, Zap, BookOpen, Edit3, Flame, CheckCircle, ArrowRight,
  Volume2, VolumeX, Plus, X, ChevronLeft, ChevronRight, Star,
  Trophy, Sparkles, Calendar, Edit2, Trash2, Award, Info, Gift, User, Check,
  CreditCard, Crown
} from "lucide-react";
import { useAppLogic } from "../../hooks/useAppLogic";
import { useRPG } from "../../hooks/useRPG";
import { subscribeGlobalLeaderboard } from "../../lib/rpgFirestore";
import { db } from "../../lib/firebase";
import { useFirebase } from "../FirebaseProvider";
import { doc, setDoc, onSnapshot } from "firebase/firestore";

interface Mission {
  id: string;
  title: string;
  desc: string;
  progress: string;
  currentVal?: number;
  targetVal?: number;
  unit?: string;
  xp: number;
  icon: string;
  color: string;
  completed: boolean;
}

interface StreakCard {
  id: string;
  cat: string;
  title: string;
  pct: number;
  next: string;
  date: string;
  xp: number;
  color: string;
  icon: string;
  bg: string;
  notes?: string[];
}

export const SoloDominion: React.FC<any> = (props) => {
  const hookLogic = useAppLogic();
  const logic = props?.profile ? props : hookLogic;
  const { profile, currentRank = "Recruit" } = logic;
  const { recordXPGain } = useRPG(profile, {});
  const { user } = useFirebase();

  // --- AUDIO & MUSIC ENGINE ---
  const [isMusicPlaying, setIsMusicPlaying] = useState<boolean>(true);
  const [isAudioBlocked, setIsAudioBlocked] = useState<boolean>(false);
  const [currentTrack, setCurrentTrack] = useState<string>("/music/epic-adventure.mp3");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize and handle background music playback
  useEffect(() => {
    const bgAudio = new Audio(currentTrack);
    bgAudio.loop = true;
    bgAudio.volume = 0.35;
    audioRef.current = bgAudio;

    const startMusic = async () => {
      try {
        await bgAudio.play();
        setIsAudioBlocked(false);
        setIsMusicPlaying(true);
      } catch (err) {
        console.log("[SoloDominion] Autoplay pending user gesture...");
        setIsAudioBlocked(true);
      }
    };

    if (isMusicPlaying) {
      startMusic();
    }

    const unlockAudioOnGesture = () => {
      if (audioRef.current && isMusicPlaying) {
        audioRef.current.play().then(() => {
          setIsAudioBlocked(false);
        }).catch(() => {});
      }
    };

    window.addEventListener("click", unlockAudioOnGesture, { passive: true });
    window.addEventListener("touchstart", unlockAudioOnGesture, { passive: true });
    window.addEventListener("keydown", unlockAudioOnGesture, { passive: true });

    return () => {
      window.removeEventListener("click", unlockAudioOnGesture);
      window.removeEventListener("touchstart", unlockAudioOnGesture);
      window.removeEventListener("keydown", unlockAudioOnGesture);
      bgAudio.pause();
      bgAudio.currentTime = 0;
    };
  }, [currentTrack]);

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (isMusicPlaying) {
      audioRef.current.pause();
      setIsMusicPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsAudioBlocked(false);
        setIsMusicPlaying(true);
      }).catch(() => {
        setIsAudioBlocked(true);
      });
    }
  };

  const handleUserInteraction = () => {
    if (audioRef.current && isMusicPlaying) {
      audioRef.current.play().then(() => {
        setIsAudioBlocked(false);
      }).catch(() => {});
    }
  };

  // --- REAL VOICEOVER AUDIO SYSTEM ---
  const playVoiceover = (type: "complete" | "start" | "levelup" | "claim" | "rank" | "streak" | "intro") => {
    // Force music autoplay unblock if needed
    handleUserInteraction();

    let soundPath = "";
    if (type === "complete") soundPath = "/assets/solo-dominion/sounds/quest-complete.mp3";
    else if (type === "start") soundPath = "/assets/solo-dominion/sounds/power-surge.mp3";
    else if (type === "levelup") soundPath = "/assets/solo-dominion/sounds/level-up.mp3";
    else if (type === "claim") soundPath = "/assets/solo-dominion/sounds/shadow-summon.mp3";
    else if (type === "rank") soundPath = "/assets/solo-dominion/sounds/rank-promotion.mp3";
    else if (type === "streak") soundPath = "/assets/solo-dominion/sounds/global-rank-climb.mp3";
    else if (type === "intro") soundPath = "/audio/onboarding-intro.mp3";

    if (soundPath) {
      try {
        const vo = new Audio(soundPath);
        vo.volume = 0.9;
        vo.play().catch((err) => {
          console.warn("[Voiceover] Playing fallback synth SFX for:", type, err);
          playSFX(type === "complete" ? "mission" : type === "levelup" ? "levelup" : "streak");
        });
      } catch (e) {
        playSFX("mission");
      }
    } else {
      playSFX("click");
    }
  };

  // Web Audio Synth for instant gaming SFX
  const playSFX = (type: "mission" | "levelup" | "streak" | "click" | "claim") => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === "mission") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.15); // G5
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === "levelup" || type === "claim") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.2);
        osc.frequency.exponentialRampToValueAtTime(1760, now + 0.4);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
      } else if (type === "streak") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(950, now + 0.15);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === "click") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(800, now);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      }
    } catch (e) {
      console.warn("Audio Context error:", e);
    }
  };

  // --- STATE MANAGEMENT ---
  const [missions, setMissions] = useState<Mission[]>([]);
  const [streaks, setStreaks] = useState<StreakCard[]>([]);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Sync Modal States
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [targetStreakDays, setTargetStreakDays] = useState(42);
  const [isSyncing, setIsSyncing] = useState(false);

  // Modals
  const [showMissionsModal, setShowMissionsModal] = useState(false);
  const [showAddMissionModal, setShowAddMissionModal] = useState(false);
  const [showAddStreakModal, setShowAddStreakModal] = useState(false);
  const [showRankModal, setShowRankModal] = useState(false);
  const [showStreaksGallery, setShowStreaksGallery] = useState(false);
  const [selectedStreak, setSelectedStreak] = useState<StreakCard | null>(null);
  const [inspectUser, setInspectUser] = useState<any | null>(null);

  const openRankModal = () => {
    playVoiceover("rank");
    setShowRankModal(true);
  };

  // Form states for custom creation
  const [newMissionTitle, setNewMissionTitle] = useState("");
  const [newMissionDesc, setNewMissionDesc] = useState("");
  const [newMissionXP, setNewMissionXP] = useState(75);
  const [newMissionIcon, setNewMissionIcon] = useState("⚡");

  const [newStreakTitle, setNewStreakTitle] = useState("");
  const [newStreakCat, setNewStreakCat] = useState("LIFESTYLE");
  const [newStreakNext, setNewStreakNext] = useState("First Milestone");
  const [newStreakDate, setNewStreakDate] = useState("31 Dec 2026");
  const [newStreakIcon, setNewStreakIcon] = useState("🚀");

  // Streak slider pagination index
  const [streakPageIndex, setStreakPageIndex] = useState(0);

  // Leaderboard filters & daily claim
  const [leaderboardTab, setLeaderboardTab] = useState<"all" | "weekly" | "guild">("all");
  const [dailyClaimed, setDailyClaimed] = useState(false);

  // Welcome Reward Card & Inspector Modal (ONE-TIME ONLY)
  const [showWelcomeCardModal, setShowWelcomeCardModal] = useState(() => {
    try {
      return localStorage.getItem("welcome_card_claimed_v1") !== "true";
    } catch {
      return false;
    }
  });
  const [selectedCard, setSelectedCard] = useState<any | null>(null);

  // User Stats & XP
  const level = profile?.level || 1;
  const currentXP = profile?.xp || 242;
  const xpNeeded = level * 500;
  const xpPercentage = Math.min(100, Math.round((currentXP % 500) / 500 * 100));

  // --- WARRIOR CHARACTER EVOLUTION STAGES ---
  const getWarriorStage = (lvl: number) => {
    if (lvl < 5) return {
      stage: "CIVILIAN TRAINEE",
      title: "Novice Seeker",
      badge: "🛡️ CIVILIAN STAGE",
      auraColor: "from-zinc-500 to-slate-700",
      textColor: "text-zinc-400",
      borderColor: "border-zinc-500/30",
      bgGlow: "bg-zinc-500/10",
      desc: "Awakening from normal life. Building foundational daily discipline.",
      avatarIcon: "👤",
      perks: ["Basic Daily Missions", "+0% XP Multiplier"]
    };
    if (lvl < 12) return {
      stage: "IRON WARRIOR",
      title: "Iron Vanguard",
      badge: "⚔️ STAGE 2 • IRON WARRIOR",
      auraColor: "from-amber-500 to-orange-600",
      textColor: "text-amber-400",
      borderColor: "border-amber-500/40",
      bgGlow: "bg-amber-500/15",
      desc: "Forged in consistency. Physical and mental attributes rising steadily.",
      avatarIcon: "🛡️",
      perks: ["Custom Mission Creation", "+10% XP Multiplier", "Streak Freeze Shield"]
    };
    if (lvl < 25) return {
      stage: "SHADOW COMMANDER",
      title: "Shadow Knight",
      badge: "⚡ STAGE 3 • SHADOW COMMANDER",
      auraColor: "from-purple-600 to-indigo-600",
      textColor: "text-purple-400",
      borderColor: "border-purple-500/50",
      bgGlow: "bg-purple-500/20",
      desc: "Master of focus. Unstoppable aura and deep mental clarity.",
      avatarIcon: "⚔️",
      perks: ["Daily Boss Dungeon Damage +25%", "+25% XP Multiplier", "Guild Vanguard Access"]
    };
    return {
      stage: "COSMIC LEGEND MONARCH",
      title: "Shadow Monarch",
      badge: "👑 STAGE 4 • LEGENDARY MONARCH",
      auraColor: "from-emerald-400 via-teal-500 to-purple-600",
      textColor: "text-emerald-300",
      borderColor: "border-emerald-400/60",
      bgGlow: "bg-emerald-500/25",
      desc: "Peak reality creation. Total mastery over physical and mental domain.",
      avatarIcon: "👑",
      perks: ["Supreme Monarch Title", "+50% XP Multiplier", "Instant Boss Obliteration"]
    };
  };

  const warrior = getWarriorStage(level);

  const today = new Date().toISOString().slice(0, 10);

  // --- CHARACTER STATS CALCULATION (STR, INT, WIL, AGI, CHA) ---
  const [allocatedStats, setAllocatedStats] = useState({
    str: 12,
    int: 14,
    wil: 18,
    agi: 10,
    cha: 15,
  });

  useEffect(() => {
    if (profile?.stats) {
      const s = profile.stats as any;
      setAllocatedStats({
        str: Number(s.str) || 12,
        int: Number(s.int) || 14,
        wil: Number(s.wil) || 18,
        agi: Number(s.agi) || 10,
        cha: Number(s.cha) || 15,
      });
    }
  }, [profile?.stats]);

  const availableStatPoints = Math.max(0, level * 2 - (allocatedStats.str + allocatedStats.int + allocatedStats.wil + allocatedStats.agi + allocatedStats.cha - 60));

  const allocatePoint = async (statKey: keyof typeof allocatedStats) => {
    if (availableStatPoints <= 0) return;
    playSFX("click");
    const updated = { ...allocatedStats, [statKey]: allocatedStats[statKey] + 1 };
    setAllocatedStats(updated);
    showToast(`✨ +1 Point Added to ${statKey.toUpperCase()}`);
    if (user) {
      try {
        await setDoc(doc(db, "users", user.uid), { stats: updated }, { merge: true });
      } catch (e) {
        console.warn("Failed to save stats to Firestore:", e);
      }
    }
  };

  // --- DAILY BOSS DUNGEON STATE ---
  const [bossHp, setBossHp] = useState(380);
  const maxBossHp = 500;
  const [bossDefeated, setBossDefeated] = useState(false);

  // Sync daily boss state with Firestore
  useEffect(() => {
    if (!user) return;
    const ref = doc(db, "users", user.uid, "solo_boss", today);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setBossHp(Number(data.hp) ?? 380);
        setBossDefeated(Boolean(data.defeated));
      } else {
        setBossHp(380);
        setBossDefeated(false);
        setDoc(ref, { hp: 380, defeated: false, date: today }, { merge: true }).catch(err => console.warn(err));
      }
    });
    return () => unsub();
  }, [user, today]);

  const attackBoss = async (damage: number) => {
    if (bossDefeated || !user) return;
    const newHp = Math.max(0, bossHp - damage);
    const isDefeated = newHp === 0;
    
    setBossHp(newHp);
    if (isDefeated) {
      setBossDefeated(true);
      playVoiceover("levelup");
      showToast("⚔️ PROCRASTINATION DEMON DEFEATED! +250 XP CLAIMED!");
      
      const xpGain = 250;
      await setDoc(doc(db, "users", user.uid), {
        xp: (profile?.xp || 0) + xpGain,
        totalXp: (profile?.totalXp || 0) + xpGain,
      }, { merge: true });
      if (recordXPGain) await recordXPGain(xpGain, profile?.level || 1, false);
    }

    try {
      const ref = doc(db, "users", user.uid, "solo_boss", today);
      await setDoc(ref, { hp: newHp, defeated: isDefeated, date: today }, { merge: true });
    } catch (e) {
      console.warn("Failed to update boss hp in Firestore:", e);
    }
  };

  // Default Missions
  const defaultMissions: Mission[] = [
    { id: "push", title: "100 Push-ups", desc: "Complete 100 push-ups today", progress: "0/100", currentVal: 0, targetVal: 100, unit: "push-ups", xp: 88, icon: "🎯", color: "#a855f7", completed: false },
    { id: "run", title: "20 Min Run / Cardio", desc: "Go for a run or intense cardio session", progress: "0/20 min", currentVal: 0, targetVal: 20, unit: "min", xp: 77, icon: "⚡", color: "#22c55e", completed: false },
    { id: "read", title: "30 Min Deep Reading", desc: "Read without phone or distractions", progress: "0/30 min", currentVal: 0, targetVal: 30, unit: "min", xp: 68, icon: "📖", color: "#3b82f6", completed: false },
    { id: "journal", title: "Journal 10 Min", desc: "Write your thoughts and daily intentions", progress: "0/10 min", currentVal: 0, targetVal: 10, unit: "min", xp: 42, icon: "✏️", color: "#a855f7", completed: false },
  ];

  // Default Streaks
  const defaultStreaks: StreakCard[] = [
    { id: "dream", cat: "LIFESTYLE", title: "Dream House", pct: 78, next: "Increase Savings", date: "31 Dec 2027", xp: 300, color: "#a855f7", icon: "🏠", bg: "/assets/streak-dream-house.jpg" },
    { id: "sixpack", cat: "HEALTH", title: "Build Six Pack", pct: 62, next: "Complete 20 Workouts", date: "30 Nov 2025", xp: 250, color: "#f43f5e", icon: "💪", bg: "/assets/streak-six-pack.jpg" },
    { id: "saas", cat: "CAREER", title: "Launch SaaS", pct: 45, next: "Build Landing Page", date: "15 Jan 2026", xp: 400, color: "#3b82f6", icon: "🚀", bg: "/assets/streak-saas.jpg" },
    { id: "freedom", cat: "WEALTH", title: "Financial Freedom", pct: 55, next: "Invest in Index Funds", date: "31 Dec 2026", xp: 350, color: "#f59e0b", icon: "💰", bg: "/assets/streak-wealth.jpg" },
    { id: "relationship", cat: "RELATIONSHIP", title: "Better Relationship", pct: 46, next: "Date Night + Connect", date: "20 Aug 2025", xp: 200, color: "#f43f5e", icon: "❤️", bg: "/assets/streak-relationship.jpg" },
    { id: "better", cat: "PERSONAL", title: "Be 1% Better", pct: 36, next: "Daily Micro Wins", date: "Ongoing", xp: 150, color: "#06b6d4", icon: "🧠", bg: "/assets/streak-better.jpg" },
  ];

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // --- FIRESTORE SUBSCRIPTIONS ---
  useEffect(() => {
    if (!user) return;
    const ref = doc(db, "users", user.uid, "solo_missions", today);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const saved = snap.data().missions || [];
        setMissions(saved);
      } else {
        setMissions(defaultMissions);
        setDoc(ref, { missions: defaultMissions, date: today }, { merge: true });
      }
    });
    return () => unsub();
  }, [user, today]);

  useEffect(() => {
    if (!user) return;
    const ref = doc(db, "users", user.uid, "solo_streaks", "main");
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as any;
        if (data.streaks?.length) {
          setStreaks(data.streaks);
          return;
        }
      }
      setStreaks(defaultStreaks);
      setDoc(ref, { streaks: defaultStreaks, lastUpdated: new Date().toISOString() }, { merge: true });
    });
    return () => unsub();
  }, [user]);

  // Check daily reward status
  useEffect(() => {
    if (!user) return;
    const ref = doc(db, "users", user.uid, "solo_claims", today);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setDailyClaimed(snap.data().claimed || false);
      } else {
        setDailyClaimed(false);
      }
    });
    return () => unsub();
  }, [user, today]);

  // Live leaderboard
  const [leaders, setLeaders] = useState<any[]>([]);
  useEffect(() => {
    const unsub = subscribeGlobalLeaderboard(5, (entries: any[]) => {
      if (entries?.length) {
        setLeaders(entries.map((e, i) => ({
          rank: i + 1,
          name: e.name || "Hunter",
          xp: e.playerScore || 0,
          level: `${e.level || 1} • Hunter`,
          isYou: user && e.uid === user.uid,
        })));
      }
    });
    return () => unsub?.();
  }, [user]);

  // --- HANDLERS ---
  const completeMission = async (id: string) => {
    if (!user || saving) return;
    const mission = missions.find(m => m.id === id);
    if (!mission || mission.completed) return;

    // Play Voiceover for Quest Complete!
    playVoiceover("complete");
    setSaving(true);
    const updated = missions.map(m => m.id === id ? { ...m, completed: true, currentVal: m.targetVal || 100, progress: `${m.targetVal || 100}/${m.targetVal || 100} ${m.unit || ''}` } : m);
    setMissions(updated);

    try {
      const xpGain = mission.xp;
      const ref = doc(db, "users", user.uid, "solo_missions", today);
      await setDoc(ref, { missions: updated, date: today }, { merge: true });

      const newXP = (profile.xp || 0) + xpGain;
      await setDoc(doc(db, "users", user.uid), {
        xp: newXP,
        totalXp: (profile.totalXp || 0) + xpGain,
      }, { merge: true });

      if (recordXPGain) await recordXPGain(xpGain, profile.level || 1, false);

      // Auto attack daily boss!
      attackBoss(100);

      showToast(`⚔️ Mission Accomplished! +${xpGain} XP & -100 Boss HP!`);

      // Advance linked streak
      let targetStreak = "";
      if (id === "push" || id === "run") targetStreak = "sixpack";
      else if (id === "read" || id === "journal") targetStreak = "better";

      if (targetStreak) {
        const idx = streaks.findIndex(s => s.id === targetStreak);
        if (idx !== -1) {
          const newStreaks = [...streaks];
          newStreaks[idx] = { ...newStreaks[idx], pct: Math.min(100, newStreaks[idx].pct + 8) };
          setStreaks(newStreaks);
          await setDoc(doc(db, "users", user.uid, "solo_streaks", "main"), { streaks: newStreaks }, { merge: true });
        }
      }
    } catch (e) {
      console.warn("Mission save error:", e);
    } finally {
      setSaving(false);
    }
  };

  const handleIncrementMissionProgress = async (id: string, delta: number) => {
    if (!user || saving) return;
    const mission = missions.find(m => m.id === id);
    if (!mission || mission.completed) return;

    setSaving(true);

    const current = mission.currentVal || 0;
    const target = mission.targetVal || 100;
    const newVal = Math.min(target, current + delta);
    const isNowComplete = newVal >= target;

    if (isNowComplete) {
      playVoiceover("complete");
    } else {
      playVoiceover("start");
    }

    const updated = missions.map(m => {
      if (m.id === id) {
        return {
          ...m,
          currentVal: newVal,
          progress: `${newVal}/${target} ${m.unit || ''}`,
          completed: isNowComplete
        };
      }
      return m;
    });

    setMissions(updated);

    try {
      const ref = doc(db, "users", user.uid, "solo_missions", today);
      await setDoc(ref, { missions: updated, date: today }, { merge: true });

      if (isNowComplete) {
        const xpGain = mission.xp;
        await setDoc(doc(db, "users", user.uid), {
          xp: (profile.xp || 0) + xpGain,
          totalXp: (profile.totalXp || 0) + xpGain,
        }, { merge: true });
        showToast(`🎉 Mission Completed! +${xpGain} XP`);
      } else {
        showToast(`⚡ Mission Progress Updated: ${newVal}/${target}`);
      }
    } catch (e) {
    } finally {
      setSaving(false);
    }
  };

  const handleAddCustomMission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMissionTitle.trim() || !user) return;

    // Play Mission Start / Power Surge Voiceover
    playVoiceover("start");
    const newM: Mission = {
      id: `custom_${Date.now()}`,
      title: newMissionTitle,
      desc: newMissionDesc || "Custom Daily Mission",
      progress: "0/1",
      currentVal: 0,
      targetVal: 1,
      unit: "times",
      xp: Number(newMissionXP) || 50,
      icon: newMissionIcon || "⚡",
      color: "#a855f7",
      completed: false
    };

    const updated = [...missions, newM];
    setMissions(updated);
    setShowAddMissionModal(false);
    setNewMissionTitle("");
    setNewMissionDesc("");

    try {
      const ref = doc(db, "users", user.uid, "solo_missions", today);
      await setDoc(ref, { missions: updated, date: today }, { merge: true });
      showToast(`✨ New Mission Activated: ${newM.title}`);
    } catch (e) {}
  };

  const advanceStreak = async (streakId: string, pctDelta: number = 10) => {
    if (!user || saving) return;
    playVoiceover("streak");
    setSaving(true);

    const idx = streaks.findIndex(s => s.id === streakId);
    if (idx === -1) return setSaving(false);

    const updated = [...streaks];
    const newPct = Math.min(100, updated[idx].pct + pctDelta);
    updated[idx] = { ...updated[idx], pct: newPct };
    setStreaks(updated);

    if (selectedStreak && selectedStreak.id === streakId) {
      setSelectedStreak({ ...selectedStreak, pct: newPct });
    }

    try {
      await setDoc(doc(db, "users", user.uid, "solo_streaks", "main"), { streaks: updated }, { merge: true });
      const bonus = Math.floor(updated[idx].xp * (pctDelta / 100));
      await setDoc(doc(db, "users", user.uid), {
        xp: (profile.xp || 0) + bonus,
        totalXp: (profile.totalXp || 0) + bonus,
      }, { merge: true });

      showToast(`🔥 Streak Advanced to ${newPct}%! (+${bonus} XP)`);
    } catch (e) {}
    finally { setSaving(false); }
  };

  const handleAddCustomStreak = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStreakTitle.trim() || !user) return;

    playVoiceover("start");
    const bgList = [
      "/assets/streak-dream-house.jpg",
      "/assets/streak-six-pack.jpg",
      "/assets/streak-saas.jpg",
      "/assets/streak-wealth.jpg",
      "/assets/streak-relationship.jpg",
      "/assets/streak-better.jpg",
    ];

    const newS: StreakCard = {
      id: `streak_${Date.now()}`,
      cat: newStreakCat.toUpperCase(),
      title: newStreakTitle,
      pct: 10,
      next: newStreakNext || "Milestone 1",
      date: newStreakDate || "31 Dec 2026",
      xp: 300,
      color: "#a855f7",
      icon: newStreakIcon || "🚀",
      bg: bgList[Math.floor(Math.random() * bgList.length)]
    };

    const updated = [...streaks, newS];
    setStreaks(updated);
    setShowAddStreakModal(false);
    setNewStreakTitle("");

    try {
      await setDoc(doc(db, "users", user.uid, "solo_streaks", "main"), { streaks: updated }, { merge: true });
      showToast(`🌟 New Streak Card Activated: ${newS.title}`);
    } catch (e) {}
  };

  const handleSyncStreak = async () => {
    if (!user || isSyncing) return;
    setIsSyncing(true);
    playVoiceover("start");
    showToast("🌀 Aligning quantum timelines... Seeding database streak...");

    try {
      const now = new Date();
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
      const getTodayStrLocal = (tz: string) => {
        const d = new Date();
        const format = new Intl.DateTimeFormat("en-CA", {
          timeZone: tz,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        });
        return format.format(d);
      };

      const toLocalDateStringLocal = (d: Date, tz: string) => {
        const format = new Intl.DateTimeFormat("en-CA", {
          timeZone: tz,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        });
        return format.format(d);
      };
      
      const batchPromises = [];
      const userRef = doc(db, "users", user.uid);
      const todayStr = getTodayStrLocal(timeZone);
      const newActiveDays: string[] = [];
      
      for (let i = 0; i < targetStreakDays; i++) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dateStr = toLocalDateStringLocal(d, timeZone);
        newActiveDays.push(dateStr);
        
        const eventId = `sync_se_${dateStr}_${user.uid}`;
        const eventData = {
          userId: user.uid,
          type: "habit_complete",
          label: "Quantum Reality Timeline Sync",
          xp: 10,
          createdAt: d.toISOString(),
          localDate: dateStr,
          streakExtended: true
        };
        
        const eventDocRef = doc(db, "users", user.uid, "streak_events", eventId);
        batchPromises.push(setDoc(eventDocRef, eventData, { merge: true }));
      }
      
      const newLevel = Math.max(profile?.level || 1, Math.min(25, Math.ceil(targetStreakDays / 2)));
      const totalXp = Math.max(profile?.totalXp || 0, targetStreakDays * 250);
      
      const updateData: any = {
        streak: targetStreakDays,
        longestStreak: Math.max(profile?.longestStreak || 0, targetStreakDays),
        activeDays: newActiveDays,
        streakFreezes: 3,
        xp: (profile?.xp || 100),
        totalXp: totalXp,
        level: newLevel,
      };
      
      batchPromises.push(setDoc(userRef, updateData, { merge: true }));
      await Promise.all(batchPromises);
      
      playVoiceover("levelup");
      showToast(`✨ TIMELINE SECURED: ${targetStreakDays} DAYS OF UNWAVERING DISCIPLINE WRITTEN TO CLOUD REALM!`);
      setShowSyncModal(false);
    } catch (err: any) {
      console.error("Streak sync error:", err);
      showToast("❌ Synchronization rift detected. Try again.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClaimDailyReward = async () => {
    if (!user || dailyClaimed) return;
    playVoiceover("claim");
    setDailyClaimed(true);

    try {
      const rewardXP = 100;
      await setDoc(doc(db, "users", user.uid, "solo_claims", today), { claimed: true, date: today }, { merge: true });
      await setDoc(doc(db, "users", user.uid), {
        xp: (profile.xp || 0) + rewardXP,
        totalXp: (profile.totalXp || 0) + rewardXP,
      }, { merge: true });

      showToast(`👑 Daily Conquest Reward Claimed! +100 XP`);
    } catch (e) {}
  };

  const leaderboardPreview = leaders.length > 0 ? leaders : [
    { rank: 1, name: "Zenith Monarch", level: "36 • Monarch", xp: 2125299, isYou: false },
    { rank: 2, name: `${user?.displayName || "as artist"} (YOU)`, level: `${level} • Hunter`, xp: profile?.xp || 1255518, isYou: true },
    { rank: 3, name: "Shadow Slayer", level: "22 • Hunter", xp: 985114, isYou: false },
    { rank: 4, name: "Valkyrie Prime", level: "19 • Knight", xp: 742100, isYou: false },
    { rank: 5, name: "Astra Master", level: "15 • Scout", xp: 512000, isYou: false },
  ];

  const visibleStreaks = streaks.slice(streakPageIndex * 6, (streakPageIndex + 1) * 6);
  const maxStreakPages = Math.ceil(streaks.length / 6);

  return (
    <div 
      className="text-white relative z-30 pb-12 select-none"
      onClick={handleUserInteraction}
    >
      {/* FLOATING TOAST NOTIFICATION */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-[300] bg-purple-950/90 border border-purple-400/50 text-white px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-3 animate-bounce">
          <Sparkles size={18} className="text-yellow-400 animate-spin" />
          <span className="text-xs font-bold tracking-wide">{toastMsg}</span>
        </div>
      )}

      {/* PAGE HEADER */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <div className="text-[10px] font-mono tracking-[4px] text-purple-400 uppercase font-bold">SOLO SYSTEM v2.0</div>
            <div className="h-px flex-1 bg-white/10" />
          </div>
          
          <h1 className="text-[40px] sm:text-[48px] font-extrabold tracking-[-2.5px] leading-[0.95] mb-1.5 text-white">
            Continue your conquest.
          </h1>
          <p className="text-[14px] sm:text-[15px] text-white/60 tracking-tight font-medium">
            Discipline today. Freedom forever.
          </p>
        </div>

        <div className="shrink-0">
          <button
            onClick={() => {
              playVoiceover("start");
              setShowSyncModal(true);
            }}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white font-mono text-xs font-black tracking-wider uppercase shadow-lg shadow-purple-900/40 border border-purple-400/30 flex items-center gap-2 transition hover:scale-[1.02] active:scale-[0.98]"
          >
            <Calendar size={14} className="text-amber-400 animate-pulse" />
            Quantum Timeline Sync
          </button>
        </div>
      </div>

      {/* MAIN 12-COLUMN GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-8">
        
        {/* HERO CARD — EXACT DESIGN MATCH */}
        <div 
          className="xl:col-span-7 relative min-h-[340px] rounded-[24px] border border-white/10 overflow-hidden flex flex-col justify-between p-7 md:p-8 bg-cover bg-center shadow-2xl group"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(10,10,18,0.85) 0%, rgba(10,10,18,0.5) 50%, rgba(10,10,18,0.1) 100%), linear-gradient(to top, rgba(10,10,18,0.95) 0%, transparent 60%), url('/assets/solo-dominion-hero.jpg')`
          }}
        >
          <div className="relative z-10">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-[10px] font-mono tracking-[2.5px] text-white/50 uppercase">CURRENT STAGE</span>
                <button
                  onClick={openRankModal}
                  className={`inline-flex items-center gap-1.5 px-3 py-0.5 border text-white text-[10px] font-bold rounded-full tracking-[1px] uppercase shadow-lg transition ${warrior.borderColor} ${warrior.bgGlow}`}
                >
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                  {warrior.badge}
                </button>
              </div>

              <button
                onClick={openRankModal}
                className="text-[10px] font-mono text-purple-300 hover:text-white flex items-center gap-1 underline underline-offset-2"
              >
                <Info size={12} /> Stage Roadmap
              </button>
            </div>

            <h2 
              onClick={openRankModal}
              className="text-[42px] sm:text-[58px] font-serif font-black tracking-[1.5px] leading-[0.88] text-white uppercase drop-shadow-md cursor-pointer hover:text-purple-200 transition"
            >
              {warrior.stage}
            </h2>
            <div className={`text-[18px] sm:text-[22px] font-bold tracking-[2px] uppercase -mt-0.5 mb-2 drop-shadow-sm ${warrior.textColor}`}>
              {warrior.title} • LEVEL {level}
            </div>
            
            <p className="text-[12.5px] text-white/70 max-w-[340px] font-medium leading-relaxed">
              {warrior.desc}
            </p>

            {/* Active Stage Perks Badges */}
            <div className="flex flex-wrap gap-2 pt-3">
              {warrior.perks.map((perk, i) => (
                <span key={i} className="text-[9.5px] font-mono px-2.5 py-1 rounded-full bg-black/60 border border-white/10 text-emerald-300 font-bold flex items-center gap-1">
                  <Sparkles size={10} className="text-amber-300" /> {perk}
                </span>
              ))}
            </div>
          </div>

          {/* Bottom controls inside Hero */}
          <div className="relative z-10 flex items-end justify-between pt-6">
            <div className="flex-1 max-w-[320px] pr-4">
              <div className="text-[9px] font-mono tracking-[2px] text-white/50 mb-1.5 uppercase font-semibold">
                NEXT STAGE EVOLUTION PROGRESS
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden border border-white/5">
                  <div className={`h-full bg-gradient-to-r ${warrior.auraColor} rounded-full transition-all duration-500`} style={{ width: `${xpPercentage}%` }} />
                </div>
                <span className="font-mono text-[11px] font-semibold text-white/80 tabular-nums">{xpPercentage}%</span>
              </div>
            </div>

            {/* LEVEL CIRCLE GAUGE */}
            <div 
              onClick={openRankModal}
              className="flex flex-col items-center shrink-0 cursor-pointer group-hover:scale-105 transition-transform"
            >
              <span className="text-[11px] font-mono text-white/80 mb-1 tabular-nums font-semibold">{currentXP} / {xpNeeded} XP</span>
              <div className="relative w-[72px] h-[72px] rounded-full p-[3px] bg-gradient-to-tr from-purple-600 via-purple-400 to-indigo-500 shadow-xl shadow-purple-900/40">
                <div className="w-full h-full rounded-full bg-[#0D0D18]/90 border border-white/10 flex flex-col items-center justify-center text-center p-1">
                  <span className="text-[14px] leading-none mb-0.5">{warrior.avatarIcon}</span>
                  <span className="text-[22px] font-black text-white leading-none tracking-tight">{level}</span>
                  <span className="text-[7px] font-mono tracking-[1px] text-purple-300 uppercase leading-none font-bold">LEVEL</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* TODAY'S REAL MISSIONS */}
        <div className="xl:col-span-5 bg-[#121124]/90 border border-white/10 rounded-[24px] p-5 md:p-6 flex flex-col justify-between shadow-2xl">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono tracking-[2.5px] text-white/70 uppercase font-bold">TODAY'S REAL MISSIONS</span>
                <button 
                  onClick={() => setShowAddMissionModal(true)}
                  className="p-1 rounded-lg bg-purple-600/50 hover:bg-purple-500 text-white transition"
                  title="Add Custom Mission"
                >
                  <Plus size={12} />
                </button>
              </div>
              <span className="text-[22px] font-black tracking-tight text-white tabular-nums">
                <span className="text-purple-400">{missions.filter(m => m.completed).length}</span>
                <span className="text-white/40">/{missions.length}</span>
              </span>
            </div>

            {/* List of Missions */}
            <div className="space-y-2.5">
              {missions.slice(0, 4).map((m) => (
                <div
                  key={m.id}
                  className={`group relative flex items-center gap-3.5 p-3 rounded-[16px] border transition-all
                    ${m.completed 
                      ? "bg-emerald-950/30 border-emerald-500/30" 
                      : "bg-[#1B1933]/70 border-white/5 hover:border-purple-500/30 hover:bg-[#221F40]"}`}
                >
                  {/* Icon */}
                  <div 
                    onClick={() => !m.completed && completeMission(m.id)}
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border cursor-pointer hover:scale-105 transition"
                    style={{ 
                      backgroundColor: m.id === 'run' ? 'rgba(6, 78, 59, 0.6)' : m.id === 'read' ? 'rgba(30, 58, 138, 0.6)' : 'rgba(88, 28, 135, 0.6)',
                      borderColor: m.id === 'run' ? 'rgba(34, 197, 94, 0.3)' : m.id === 'read' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(168, 85, 247, 0.3)',
                      color: m.color 
                    }}
                  >
                    <span className="text-base">{m.icon}</span>
                  </div>

                  {/* Text details */}
                  <div className="flex-1 min-w-0" onClick={() => !m.completed && completeMission(m.id)}>
                    <div className="font-bold text-[13.5px] text-white tracking-tight leading-snug cursor-pointer">
                      {m.title}
                    </div>
                    <div className="text-[11px] text-white/50 leading-tight truncate">
                      {m.desc}
                    </div>
                    <div className="text-[10px] font-mono text-white/40 mt-0.5">
                      {m.progress}
                    </div>
                  </div>

                  {/* Partial progress increment button */}
                  {!m.completed && (
                    <button
                      onClick={() => handleIncrementMissionProgress(m.id, m.targetVal ? Math.ceil(m.targetVal / 4) : 1)}
                      className="px-2 py-1 rounded bg-white/5 hover:bg-white/15 border border-white/10 text-[10px] font-mono font-bold text-purple-300"
                      title="Add Progress"
                    >
                      +
                    </button>
                  )}

                  {/* XP badge */}
                  <div className="shrink-0 text-right">
                    <div className="font-mono text-[12px] font-extrabold text-amber-400 tabular-nums">
                      +{m.xp} XP
                    </div>
                  </div>

                  {m.completed && (
                    <CheckCircle className="absolute right-3 top-3 text-emerald-400 w-4 h-4" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Bottom View All button */}
          <button 
            onClick={() => setShowMissionsModal(true)}
            className="mt-4 w-full py-3 rounded-xl bg-[#211A42] hover:bg-[#2B2256] border border-purple-500/20 text-purple-200 text-xs font-bold tracking-wide flex items-center justify-center gap-2 transition active:scale-[0.985]"
          >
            <span>View All Missions ({missions.length})</span>
            <ArrowRight size={14} className="opacity-80" />
          </button>
        </div>
      </div>

      {/* CHARACTER STATS TREE & DAILY DUNGEON BOSS BATTLE ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        
        {/* CHARACTER STATS ALLOCATION PANEL */}
        <div className="lg:col-span-7 bg-[#121124]/90 border border-purple-500/20 rounded-[24px] p-6 space-y-4 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Target size={18} className="text-purple-400" />
                <h3 className="font-bold text-sm tracking-wider text-white uppercase font-mono">
                  WARRIOR CHARACTER STATS TREE
                </h3>
              </div>
              <p className="text-[11px] text-white/50">Attributes level up as you execute real habits</p>
            </div>

            <div className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-mono font-bold">
              Points Available: {availableStatPoints}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {[
              { key: "str", name: "STR", full: "Strength", val: allocatedStats.str, desc: "Workouts & Fitness", icon: "💪", color: "text-red-400" },
              { key: "int", name: "INT", full: "Intelligence", val: allocatedStats.int, desc: "Reading & Learning", icon: "🧠", color: "text-blue-400" },
              { key: "wil", name: "WIL", full: "Willpower", val: allocatedStats.wil, desc: "Habit Streaks", icon: "🛡️", color: "text-emerald-400" },
              { key: "agi", name: "AGI", full: "Agility", val: allocatedStats.agi, desc: "Cardio & Speed", icon: "⚡", color: "text-amber-400" },
              { key: "cha", name: "CHA", full: "Charisma", val: allocatedStats.cha, desc: "Mindset & Vibe", icon: "✨", color: "text-purple-400" },
            ].map((stat) => (
              <div key={stat.key} className="bg-black/50 border border-white/10 rounded-2xl p-3 flex flex-col justify-between space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-base">{stat.icon}</span>
                  <span className={`text-xs font-mono font-bold ${stat.color}`}>{stat.name}</span>
                </div>

                <div>
                  <div className="text-2xl font-black text-white font-mono">{stat.val}</div>
                  <div className="text-[9px] text-white/50">{stat.desc}</div>
                </div>

                <button 
                  onClick={() => allocatePoint(stat.key as any)}
                  disabled={availableStatPoints <= 0}
                  className="w-full py-1 rounded-lg bg-purple-600/30 hover:bg-purple-600 disabled:opacity-30 text-white font-mono text-[10px] font-bold transition border border-purple-400/30"
                >
                  + Add Point
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* DAILY BOSS DUNGEON BATTLE */}
        <div className="lg:col-span-5 bg-gradient-to-b from-red-950/40 via-[#121124] to-black border border-red-500/30 rounded-[24px] p-6 flex flex-col justify-between shadow-2xl">
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Flame size={18} className="text-red-400 animate-bounce" />
                <div>
                  <h3 className="font-bold text-sm tracking-wider text-red-200 uppercase font-mono">
                    DAILY SHADOW BOSS DUNGEON
                  </h3>
                  <p className="text-[10px] font-mono text-red-400/80">Slay Procrastination Demon</p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded bg-red-500/20 text-red-300 font-mono text-[10px] font-bold border border-red-500/30">
                BOSS EVENT
              </span>
            </div>

            {/* Boss Image / Avatar */}
            <div className="relative rounded-2xl overflow-hidden border border-red-500/40 bg-black h-28 flex items-center justify-between p-4 mb-4 group">
              <img 
                src="/src/assets/images/anime_red_warrior_1785177142520.jpg" 
                alt="Crimson Demon Boss" 
                className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-105 transition duration-500" 
                referrerPolicy="no-referrer"
              />
              <div className="text-left space-y-0.5 z-10 relative">
                <div className="text-2xl font-black text-white font-serif tracking-wide drop-shadow-md">👹 DEMON OF LETHARGY</div>
                <div className="text-[10px] font-mono text-red-200">Complete real missions to strike with Shadow Crimson Blade!</div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent pointer-events-none" />
            </div>

            {/* Boss HP Bar */}
            <div className="space-y-1.5 mb-4">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-zinc-400 font-bold">BOSS HEALTH</span>
                <span className="text-red-400 font-black">{bossHp} / {maxBossHp} HP</span>
              </div>
              <div className="w-full bg-zinc-900 h-3 rounded-full overflow-hidden border border-red-500/30">
                <div 
                  className="bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${(bossHp / maxBossHp) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <button
            onClick={() => attackBoss(80)}
            disabled={bossDefeated}
            className={`w-full py-3 rounded-xl font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition ${
              bossDefeated
                ? "bg-emerald-500 text-black shadow-lg"
                : "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/40"
            }`}
          >
            {bossDefeated ? (
              <>🎉 DEMON SLAIN! REWARD CLAIMED</>
            ) : (
              <>⚔️ STRIKE BOSS WITH DISCIPLINE (-80 HP)</>
            )}
          </button>
        </div>

      </div>

      {/* PREMIUM ANIME WARRIOR BLACK METAL CARDS VAULT (MILESTONE REWARDS) */}
      <div className="mb-8 bg-[#121124]/90 border border-purple-500/25 rounded-[28px] p-6 shadow-2xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <CreditCard size={20} className="text-amber-400 animate-pulse" />
              <h3 className="font-bold text-base tracking-wider text-white uppercase font-mono">
                CHARACTER EVOLUTION • BLACK METAL ATM CARDS
              </h3>
            </div>
            <p className="text-xs text-purple-300 font-mono mt-0.5">
              Instant Level 1 Welcome Card on login! Level up to unlock stunning anime warrior cards!
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowWelcomeCardModal(true)}
              className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-black font-mono text-xs font-black shadow-lg shadow-amber-900/40 flex items-center gap-1.5 transition"
            >
              <Gift size={14} /> VIEW WELCOME CARD
            </button>
            <span className="px-3 py-1.5 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-xs font-mono font-bold">
              Level {level} Active
            </span>
          </div>
        </div>

        {/* ATM CARDS GRID (4 TIERS) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              id: "seeker-level-1",
              tier: "TIER 1",
              title: "CIVILIAN SEEKER BLACK CARD",
              subtitle: "LEVEL 1 • WELCOME REWARD",
              unlockedAtLevel: 1,
              cardNumber: "4532 •••• •••• 1024",
              exp: "12/28",
              image: "/src/assets/images/anime_trainee_warrior_1785176432904.jpg",
              quote: "“The journey of a thousand leagues begins with a single deliberate habit.”",
              perks: ["Initial Daily Habit Pass", "Base XP Tracker", "Sigma OS Access"],
              gradient: "from-zinc-900 via-zinc-950 to-emerald-950/70 border-emerald-500/50 shadow-emerald-950/60",
              textColor: "text-emerald-400",
              badge: "👤 SEEKER TRAINEE"
            },
            {
              id: "iron-level-5",
              tier: "TIER 2",
              title: "CRIMSON BERSERKER GOLD CARD",
              subtitle: "LEVEL 5 • EXECUTIVE MILESTONE",
              unlockedAtLevel: 5,
              cardNumber: "5219 •••• •••• 8830",
              exp: "12/29",
              image: "/src/assets/images/anime_red_warrior_1785177142520.jpg",
              quote: "“Forged in crimson fire. Physical & mental willpower rising infinitely.”",
              perks: ["+10% XP Multiplier", "Streak Freeze Shield", "Custom Mission Creator"],
              gradient: "from-zinc-900 via-red-950/60 to-rose-950 border-red-500/60 shadow-red-950/70",
              textColor: "text-red-400",
              badge: "⚔️ CRIMSON BERSERKER"
            },
            {
              id: "shadow-level-12",
              tier: "TIER 3",
              title: "SHADOW COMMANDER KNIGHT",
              subtitle: "LEVEL 12 • ELITE COMMANDER",
              unlockedAtLevel: 12,
              cardNumber: "7742 •••• •••• 3091",
              exp: "12/30",
              image: "/src/assets/images/anime_shadow_knight_1785176768012.jpg",
              quote: "“Master of focus and shadow power. Unstoppable aura and deep clarity.”",
              perks: ["+25% XP Multiplier", "+25% Daily Boss Damage", "Guild Vanguard Access"],
              gradient: "from-zinc-900 via-purple-950/60 to-indigo-950 border-purple-500/60 shadow-purple-950/70",
              textColor: "text-purple-400",
              badge: "⚔️ SHADOW KNIGHT"
            },
            {
              id: "monarch-level-25",
              tier: "TIER 4",
              title: "COSMIC SHADOW MONARCH",
              subtitle: "LEVEL 25 • LEGENDARY MONARCH",
              unlockedAtLevel: 25,
              cardNumber: "9999 •••• •••• 7777",
              exp: "VIP INFINITE",
              image: "/src/assets/images/anime_shadow_monarch_1785176449409.jpg",
              quote: "“Peak reality creation. Total mastery over physical and mental domain.”",
              perks: ["+50% XP Multiplier", "Instant Boss Obliteration", "Supreme Monarch Title"],
              gradient: "from-purple-950 via-zinc-950 to-teal-950 border-emerald-400/60 shadow-emerald-950/80",
              textColor: "text-emerald-300",
              badge: "👑 COSMIC MONARCH"
            }
          ].map((card) => {
            const isUnlocked = level >= card.unlockedAtLevel;
            return (
              <div 
                key={card.id}
                onClick={() => setSelectedCard(card)}
                className={`relative rounded-2xl overflow-hidden border p-5 flex flex-col justify-between min-h-[230px] transition-all duration-300 cursor-pointer hover:scale-[1.02] shadow-2xl group ${
                  isUnlocked ? card.gradient : "bg-zinc-950 border-white/10 opacity-60 grayscale"
                }`}
              >
                {card.id === "seeker-level-1" && (
                  <video 
                    ref={(el) => {
                      if (el) {
                        el.muted = true;
                        el.play().catch(() => {});
                      }
                    }}
                    autoPlay 
                    loop 
                    muted 
                    playsInline
                    preload="auto"
                    poster="/src/assets/images/anime_trainee_warrior_1785176432904.jpg"
                    className="absolute inset-0 w-full h-full object-cover opacity-25 mix-blend-luminosity pointer-events-none"
                  >
                    <source src="/videos/hero_anime_loop.mp4" type="video/mp4" />
                  </video>
                )}
                <div className="flex justify-between items-start z-10">
                  <div className="space-y-0.5">
                    <div className={`text-[9.5px] font-mono tracking-[2px] font-bold uppercase ${card.textColor}`}>
                      {card.tier}
                    </div>
                    <div className="text-xs font-black text-white font-mono uppercase leading-snug">
                      {card.title}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-7 h-5 rounded bg-gradient-to-r from-amber-300 via-amber-400 to-amber-200 border border-amber-500/40 shadow-md flex items-center justify-center text-[7px] font-black font-mono text-amber-950">
                      CHIP
                    </div>
                    {isUnlocked ? <Zap size={13} className={card.textColor} /> : <X size={13} className="text-zinc-500" />}
                  </div>
                </div>

                {/* Character Image & Overlay */}
                <div className="my-2.5 flex items-center gap-3 z-10">
                  <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/20 shrink-0 shadow-lg bg-black">
                    <img src={card.image} alt={card.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="space-y-0.5">
                    <div className={`text-[10px] font-mono font-bold ${isUnlocked ? "text-white" : "text-amber-400"}`}>
                      {isUnlocked ? "UNLOCKED" : `REACH LEVEL ${card.unlockedAtLevel}`}
                    </div>
                    <div className="text-[9.5px] text-zinc-300 font-mono line-clamp-1">{card.badge}</div>
                  </div>
                </div>

                {/* Card Number & Holder */}
                <div className="space-y-1 z-10 pt-2 border-t border-white/10">
                  <div className="text-xs font-mono tracking-[2px] font-bold text-zinc-300">
                    {card.cardNumber}
                  </div>
                  <div className="flex justify-between items-center text-[9px] font-mono text-zinc-400">
                    <span className="uppercase font-bold text-white truncate max-w-[110px]">{profile?.name || "WARRIOR"}</span>
                    <span className={`font-bold ${card.textColor}`}>{card.exp}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* YOUR ACTIVE STREAKS */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-[13px] tracking-[2px] text-white uppercase">YOUR ACTIVE STREAKS</h3>
            <button
              onClick={() => setShowAddStreakModal(true)}
              className="px-2 py-0.5 bg-purple-600/60 hover:bg-purple-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition"
            >
              <Plus size={10} /> Add
            </button>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-white/50 font-medium">
            <button 
              onClick={() => setShowStreaksGallery(true)} 
              className="hover:text-white transition"
            >
              View All ({streaks.length})
            </button>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setStreakPageIndex(prev => Math.max(0, prev - 1))}
                disabled={streakPageIndex === 0}
                className="w-6 h-6 rounded bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white disabled:opacity-30 transition"
              >
                ‹
              </button>
              <button 
                onClick={() => setStreakPageIndex(prev => Math.min(maxStreakPages - 1, prev + 1))}
                disabled={streakPageIndex >= maxStreakPages - 1}
                className="w-6 h-6 rounded bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white disabled:opacity-30 transition"
              >
                ›
              </button>
            </div>
          </div>
        </div>

        {/* 6-Card responsive grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {visibleStreaks.map((s) => (
            <div
              key={s.id}
              onClick={() => setSelectedStreak(s)}
              className="group relative rounded-[20px] overflow-hidden border border-white/10 h-[190px] flex flex-col justify-between p-4 text-white cursor-pointer transition-all duration-300 hover:border-purple-400/50 hover:-translate-y-1 shadow-lg"
              style={{
                backgroundImage: `linear-gradient(to bottom, rgba(12,12,22,0.3) 0%, rgba(12,12,22,0.92) 100%), url(${s.bg})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              {/* Top Header */}
              <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-[1.5px] text-white/90 uppercase">
                <span className="text-xs">{s.icon}</span> 
                <span>{s.cat}</span>
              </div>

              {/* Title */}
              <div className="font-bold text-[16px] leading-tight tracking-tight text-white group-hover:text-purple-200 transition">
                {s.title}
              </div>

              {/* Bottom Progress Bar */}
              <div>
                <div className="flex justify-between items-center text-[11px] font-medium mb-1.5">
                  <span className="text-white/60">Progress</span>
                  <span className="font-bold text-white">{s.pct}%</span>
                </div>
                <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500" 
                    style={{ width: `${s.pct}%`, backgroundColor: s.color }} 
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* GLOBAL DOMINION & DAILY CLAIM */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEADERBOARD CARD */}
        <div className="lg:col-span-8 rounded-[22px] border border-white/10 bg-[#121124]/90 p-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-2.5">
              <Flame className="w-5 h-5 text-amber-400" />
              <div>
                <div className="font-bold tracking-[1.5px] text-[14px] uppercase text-white">GLOBAL DOMINION LEADERBOARD</div>
                <p className="text-[11px] text-white/50">Top ranked Hunters across all realms</p>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
              <button
                onClick={() => setLeaderboardTab("all")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${leaderboardTab === "all" ? "bg-purple-600 text-white" : "text-white/50 hover:text-white"}`}
              >
                All Time
              </button>
              <button
                onClick={() => setLeaderboardTab("weekly")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${leaderboardTab === "weekly" ? "bg-purple-600 text-white" : "text-white/50 hover:text-white"}`}
              >
                Weekly Sprint
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {leaderboardPreview.map((l, i) => (
              <div 
                key={i} 
                onClick={() => setInspectUser(l)}
                className={`flex items-center justify-between p-3 rounded-xl border transition cursor-pointer ${
                  l.isYou 
                    ? "bg-purple-950/40 border-purple-500/40" 
                    : "bg-white/5 border-white/5 hover:bg-white/10"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`font-mono w-6 font-bold text-xs ${i === 0 ? "text-yellow-400" : i === 1 ? "text-slate-300" : i === 2 ? "text-amber-600" : "text-white/40"}`}>
                    #{l.rank}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-purple-900/60 border border-purple-400/30 flex items-center justify-center text-xs font-bold text-purple-200 shrink-0">
                    {l.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className={`text-xs font-bold truncate ${l.isYou ? "text-amber-300" : "text-white"}`}>
                      {l.name}
                    </div>
                    <div className="text-[10px] font-mono text-white/40">{l.level}</div>
                  </div>
                </div>

                <div className="font-mono text-amber-400 text-[12px] font-extrabold tabular-nums shrink-0">
                  {l.xp.toLocaleString()} XP
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* DAILY CONQUEST REWARD CLAIM */}
        <div className="lg:col-span-4 rounded-[22px] border border-white/10 bg-gradient-to-b from-purple-950/40 to-[#121124] p-6 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono tracking-[2px] text-yellow-400 uppercase font-bold">DAILY CONQUEST</span>
              <Trophy size={18} className="text-yellow-400" />
            </div>

            <h3 className="text-xl font-black text-white mb-1">Hunter Check-In</h3>
            <p className="text-xs text-white/60 mb-4">Claim your daily 100 XP login bonus to maintain your rank momentum.</p>

            <div className="p-4 rounded-2xl bg-black/50 border border-white/10 text-center space-y-1 mb-4">
              <span className="text-2xl font-black text-amber-400 font-mono">+100 XP</span>
              <p className="text-[11px] text-white/50">Resets daily at 00:00 UTC</p>
            </div>
          </div>

          <button
            onClick={handleClaimDailyReward}
            disabled={dailyClaimed}
            className={`w-full py-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg ${
              dailyClaimed 
                ? "bg-white/10 text-white/40 border border-white/5 cursor-not-allowed" 
                : "bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-black shadow-amber-500/20 active:scale-98"
            }`}
          >
            {dailyClaimed ? (
              <><Check size={16} /> Claimed for Today</>
            ) : (
              <><Gift size={16} /> Claim Daily 100 XP</>
            )}
          </button>
        </div>
      </div>

      {/* --- MODALS & DRAWERS --- */}

      {/* 1. VIEW ALL MISSIONS MODAL */}
      {showMissionsModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[250] flex items-center justify-center p-4">
          <div className="bg-[#121124] border border-white/15 rounded-3xl w-full max-w-lg p-6 space-y-5 max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Target size={18} className="text-purple-400" />
                <h3 className="text-lg font-bold text-white">Today's Daily Missions</h3>
              </div>
              <button onClick={() => setShowMissionsModal(false)} className="text-white/50 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              {missions.map((m) => (
                <div key={m.id} className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{m.icon}</span>
                    <div>
                      <div className="text-sm font-bold text-white">{m.title}</div>
                      <div className="text-xs text-white/50">{m.desc}</div>
                      <div className="text-[10px] font-mono text-purple-300 mt-0.5">{m.progress}</div>
                    </div>
                  </div>

                  {!m.completed ? (
                    <button
                      onClick={() => completeMission(m.id)}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition"
                    >
                      Complete (+{m.xp} XP)
                    </button>
                  ) : (
                    <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle size={14} /> Completed
                    </span>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                setShowMissionsModal(false);
                setShowAddMissionModal(true);
              }}
              className="w-full py-3 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-400/40 text-purple-200 text-xs font-bold flex items-center justify-center gap-2 transition"
            >
              <Plus size={14} /> Create Custom Mission
            </button>
          </div>
        </div>
      )}

      {/* 2. ADD CUSTOM MISSION MODAL */}
      {showAddMissionModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[250] flex items-center justify-center p-4">
          <form onSubmit={handleAddCustomMission} className="bg-[#121124] border border-white/15 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus size={16} className="text-purple-400" /> Add Custom Mission
              </h3>
              <button type="button" onClick={() => setShowAddMissionModal(false)} className="text-white/50 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <div>
              <label className="text-[11px] font-mono text-white/60 block mb-1">MISSION TITLE</label>
              <input
                value={newMissionTitle}
                onChange={e => setNewMissionTitle(e.target.value)}
                placeholder="e.g. 50 Squats or Read 1 Chapter"
                className="w-full bg-black/60 border border-white/15 rounded-xl p-3 text-xs text-white"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-mono text-white/60 block mb-1">DESCRIPTION</label>
              <input
                value={newMissionDesc}
                onChange={e => setNewMissionDesc(e.target.value)}
                placeholder="Brief description"
                className="w-full bg-black/60 border border-white/15 rounded-xl p-3 text-xs text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-mono text-white/60 block mb-1">XP REWARD</label>
                <input
                  type="number"
                  value={newMissionXP}
                  onChange={e => setNewMissionXP(Number(e.target.value))}
                  className="w-full bg-black/60 border border-white/15 rounded-xl p-3 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-white/60 block mb-1">ICON EMOJI</label>
                <input
                  value={newMissionIcon}
                  onChange={e => setNewMissionIcon(e.target.value)}
                  className="w-full bg-black/60 border border-white/15 rounded-xl p-3 text-xs text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition"
            >
              Add Mission
            </button>
          </form>
        </div>
      )}

      {/* 3. STREAK DETAIL & CONTROL DRAWER */}
      {selectedStreak && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[250] flex items-center justify-center p-4">
          <div className="bg-[#121124] border border-white/15 rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{selectedStreak.icon}</span>
                <div>
                  <h3 className="text-base font-bold text-white">{selectedStreak.title}</h3>
                  <span className="text-[10px] font-mono text-purple-300">{selectedStreak.cat}</span>
                </div>
              </div>
              <button onClick={() => setSelectedStreak(null)} className="text-white/50 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-white/60">Current Progress</span>
                <span className="font-bold text-white">{selectedStreak.pct}%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full bg-purple-500 transition-all duration-500" 
                  style={{ width: `${selectedStreak.pct}%` }} 
                />
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-mono text-white/50 block">ADVANCE STREAK:</span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => advanceStreak(selectedStreak.id, 5)}
                  className="py-2.5 bg-white/5 hover:bg-white/15 border border-white/10 rounded-xl text-xs font-bold text-white"
                >
                  +5% Boost
                </button>
                <button
                  onClick={() => advanceStreak(selectedStreak.id, 10)}
                  className="py-2.5 bg-purple-600/80 hover:bg-purple-500 rounded-xl text-xs font-bold text-white"
                >
                  +10% Boost
                </button>
                <button
                  onClick={() => advanceStreak(selectedStreak.id, 25)}
                  className="py-2.5 bg-amber-500 hover:bg-amber-400 text-black rounded-xl text-xs font-bold"
                >
                  +25% Sprint
                </button>
              </div>
            </div>

            <button
              onClick={() => setSelectedStreak(null)}
              className="w-full py-2.5 bg-white/10 text-white rounded-xl text-xs font-semibold"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* 4. ADD CUSTOM STREAK MODAL */}
      {showAddStreakModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[250] flex items-center justify-center p-4">
          <form onSubmit={handleAddCustomStreak} className="bg-[#121124] border border-white/15 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus size={16} className="text-purple-400" /> Activate New Streak
              </h3>
              <button type="button" onClick={() => setShowAddStreakModal(false)} className="text-white/50 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <div>
              <label className="text-[11px] font-mono text-white/60 block mb-1">STREAK TITLE</label>
              <input
                value={newStreakTitle}
                onChange={e => setNewStreakTitle(e.target.value)}
                placeholder="e.g. Master Japanese or Buy BMW M4"
                className="w-full bg-black/60 border border-white/15 rounded-xl p-3 text-xs text-white"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-mono text-white/60 block mb-1">CATEGORY</label>
              <select
                value={newStreakCat}
                onChange={e => setNewStreakCat(e.target.value)}
                className="w-full bg-black/60 border border-white/15 rounded-xl p-3 text-xs text-white"
              >
                <option value="LIFESTYLE">LIFESTYLE</option>
                <option value="HEALTH">HEALTH</option>
                <option value="CAREER">CAREER</option>
                <option value="WEALTH">WEALTH</option>
                <option value="RELATIONSHIP">RELATIONSHIP</option>
                <option value="PERSONAL">PERSONAL</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition"
            >
              Activate Streak Card
            </button>
          </form>
        </div>
      )}

      {/* 5. WARRIOR EVOLUTION ROADMAP MODAL */}
      {showRankModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[250] flex items-center justify-center p-4">
          <div className="bg-[#121124] border border-purple-500/30 rounded-3xl w-full max-w-xl p-6 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Award size={18} className="text-purple-400" />
                <div>
                  <h3 className="text-lg font-bold text-white">Warrior Journey Evolution Roadmap</h3>
                  <p className="text-[11px] font-mono text-purple-300">Civilian Trainee ➔ Cosmic Legend Monarch</p>
                </div>
              </div>
              <button onClick={() => setShowRankModal(false)} className="text-white/50 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              {[
                { 
                  stage: "STAGE 1: CIVILIAN TRAINEE", 
                  lvl: "Level 1 - 4", 
                  badge: "👤 Civilian",
                  color: "border-zinc-500/40 bg-zinc-900/40 text-zinc-300",
                  perk: "Basic daily habit tracking, standard XP gains, awakening mindset.",
                  req: "Start your journey. Complete basic workout, reading, and hydration missions." 
                },
                { 
                  stage: "STAGE 2: IRON WARRIOR", 
                  lvl: "Level 5 - 11", 
                  badge: "🛡️ Iron Vanguard",
                  color: "border-amber-500/40 bg-amber-950/30 text-amber-300",
                  perk: "Unlocks Custom Missions, +10% XP Multiplier, Daily Boss Dungeon strikes.",
                  req: "Reach Level 5 & maintain a 3-day active streak across fitness or career." 
                },
                { 
                  stage: "STAGE 3: SHADOW COMMANDER", 
                  lvl: "Level 12 - 24", 
                  badge: "⚔️ Shadow Knight",
                  color: "border-purple-500/50 bg-purple-950/40 text-purple-200",
                  perk: "Unlocks Guild Vanguard, +25% XP Multiplier, +25% Boss Damage Boost.",
                  req: "Reach Level 12 & complete 50 cumulative daily missions." 
                },
                { 
                  stage: "STAGE 4: COSMIC LEGEND MONARCH", 
                  lvl: "Level 25+", 
                  badge: "👑 Cosmic Monarch",
                  color: "border-emerald-400/60 bg-emerald-950/40 text-emerald-300",
                  perk: "Unlocks Supreme Monarch Badge, +50% XP Multiplier, Instant Boss Obliteration.",
                  req: "Reach Level 25. Master of reality and unstoppable discipline." 
                },
              ].map((r, i) => (
                <div key={i} className={`p-4 rounded-2xl border space-y-2 ${r.color}`}>
                  <div className="flex justify-between items-center text-xs font-bold font-mono">
                    <span className="flex items-center gap-1.5"><Sparkles size={12} /> {r.stage}</span>
                    <span className="px-2 py-0.5 rounded bg-black/50 border border-white/10">{r.lvl}</span>
                  </div>
                  <div className="text-sm font-bold text-white">{r.badge}</div>
                  <p className="text-[11.5px] text-white/70 leading-relaxed"><strong className="text-white">Unlocks:</strong> {r.perk}</p>
                  <div className="text-[10px] font-mono text-white/50 bg-black/40 p-2 rounded-xl border border-white/5">
                    <strong className="text-amber-300">Requirement:</strong> {r.req}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 6. INSPECT USER CARD MODAL */}
      {inspectUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[250] flex items-center justify-center p-4">
          <div className="bg-[#121124] border border-white/15 rounded-3xl w-full max-w-sm p-6 text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-purple-900/80 border-2 border-purple-400/50 flex items-center justify-center text-2xl font-black text-white mx-auto">
              {inspectUser.name.charAt(0)}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{inspectUser.name}</h3>
              <p className="text-xs font-mono text-purple-300">{inspectUser.level}</p>
            </div>

            <div className="p-3 rounded-2xl bg-black/50 border border-white/10 text-center">
              <span className="text-xl font-extrabold text-amber-400 font-mono">{inspectUser.xp.toLocaleString()} XP</span>
              <p className="text-[10px] text-white/50">Total Conquest Score</p>
            </div>

            <button onClick={() => setInspectUser(null)} className="w-full py-2.5 bg-white/10 text-white rounded-xl text-xs font-semibold">
              Close Profile
            </button>
          </div>
        </div>
      )}

      {/* 7. FIRST LOGIN WELCOME CARD REWARD CELEBRATION MODAL */}
      {showWelcomeCardModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[300] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#121124] border border-emerald-500/50 rounded-[32px] w-full max-w-lg p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden text-center">
            
            {/* Close Button */}
            <button
              onClick={() => {
                localStorage.setItem("welcome_card_claimed_v1", "true");
                setShowWelcomeCardModal(false);
              }}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition z-20"
              title="Close"
            >
              <X size={18} />
            </button>

            {/* Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="space-y-2 relative z-10">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-mono font-bold tracking-wider uppercase inline-flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-300 animate-spin" /> WELCOME REWARD UNLOCKED
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white uppercase font-serif tracking-wide">
                SEEKER TRAINEE BLACK METAL CARD
              </h2>
              <p className="text-xs text-emerald-200 font-mono">
                Issued upon logging into Sigma Menifest OS • Level 1 Milestone
              </p>
            </div>

            {/* 3D ATM Black Card Visual */}
            <div className="relative rounded-2xl border border-emerald-500/50 bg-gradient-to-br from-zinc-900 via-zinc-950 to-emerald-950 p-6 shadow-2xl text-left space-y-4 max-w-sm mx-auto transform hover:rotate-1 transition-transform overflow-hidden">
              <video 
                ref={(el) => {
                  if (el) {
                    el.muted = true;
                    el.play().catch(() => {});
                  }
                }}
                autoPlay 
                loop 
                muted 
                playsInline
                preload="auto"
                poster="/src/assets/images/anime_trainee_warrior_1785176432904.jpg"
                className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-luminosity pointer-events-none"
              >
                <source src="/videos/hero_anime_loop.mp4" type="video/mp4" />
              </video>
              <div className="absolute inset-0 bg-gradient-to-t from-black via-zinc-950/70 to-transparent pointer-events-none" />

              <div className="flex justify-between items-start relative z-10">
                <div>
                  <div className="text-[10px] font-mono tracking-[2px] text-emerald-400 font-bold uppercase">
                    SIGMA MENIFEST OS • TIER 1
                  </div>
                  <div className="text-sm font-black text-white font-mono uppercase">
                    SEEKER BLACK CARD
                  </div>
                </div>
                <div className="w-9 h-7 rounded bg-gradient-to-r from-amber-300 via-amber-400 to-amber-200 border border-amber-500/40 shadow-md flex items-center justify-center text-[9px] font-black font-mono text-amber-950">
                  CHIP
                </div>
              </div>

              <div className="flex items-center gap-4 py-2 relative z-10">
                <div className="w-16 h-16 rounded-xl overflow-hidden border border-emerald-400/50 shrink-0 shadow-lg bg-black relative">
                  <video 
                    ref={(el) => {
                      if (el) {
                        el.muted = true;
                        el.play().catch(() => {});
                      }
                    }}
                    autoPlay 
                    loop 
                    muted 
                    playsInline
                    preload="auto"
                    poster="/src/assets/images/anime_trainee_warrior_1785176432904.jpg"
                    className="w-full h-full object-cover"
                  >
                    <source src="/videos/hero_anime_loop.mp4" type="video/mp4" />
                  </video>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-mono font-bold text-emerald-300">ANIME CHARACTER STAGE 1</div>
                  <div className="text-[10px] text-zinc-300 font-mono">“Awakening focus & daily discipline.”</div>
                </div>
              </div>

              <div className="space-y-1 pt-2 border-t border-white/10 relative z-10">
                <div className="text-base font-mono tracking-[3px] font-bold text-zinc-200">
                  4532 •••• •••• 1024
                </div>
                <div className="flex justify-between items-center text-[10px] font-mono text-zinc-400">
                  <span className="uppercase font-bold text-white">{profile?.name || "WARRIOR TRAINEE"}</span>
                  <span className="text-emerald-400 font-bold">EXP 12/28</span>
                </div>
              </div>
            </div>

            {/* Claim Action */}
            <div className="space-y-3 relative z-10 pt-2">
              <p className="text-xs text-zinc-300 font-mono leading-relaxed">
                As you level up in real life, higher tier cards (Iron Vanguard, Shadow Knight, and Cosmic Monarch) will unlock automatically!
              </p>
              <button
                onClick={() => {
                  try {
                    localStorage.setItem("welcome_card_claimed_v1", "true");
                  } catch (e) {
                    console.warn("Could not save welcome_card_claimed_v1", e);
                  }
                  setShowWelcomeCardModal(false);
                  playSFX("levelup");
                  showToast("🎉 WELCOME SEEKER CARD CLAIMED TO YOUR VAULT!");
                }}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 text-black font-mono text-sm font-black uppercase tracking-wider shadow-lg shadow-emerald-950/80 hover:brightness-110 transition flex items-center justify-center gap-2"
              >
                <Award size={18} /> CLAIM WELCOME CARD & ENTER SYSTEM
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. SELECTED CARD INSPECTOR MODAL */}
      {selectedCard && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[300] flex items-center justify-center p-4">
          <div className="bg-[#121124] border border-purple-500/40 rounded-[32px] w-full max-w-md p-6 sm:p-8 space-y-6 shadow-2xl relative text-center">
            
            <button 
              onClick={() => setSelectedCard(null)} 
              className="absolute top-4 right-4 text-white/50 hover:text-white"
            >
              <X size={20} />
            </button>

            <div className="space-y-1">
              <span className={`text-xs font-mono font-bold tracking-wider ${selectedCard.textColor}`}>
                {selectedCard.tier} • {selectedCard.badge}
              </span>
              <h3 className="text-xl font-bold text-white font-mono uppercase">{selectedCard.title}</h3>
              <p className="text-[11px] font-mono text-zinc-400">{selectedCard.subtitle}</p>
            </div>

            {/* 3D ATM Metal Card Preview */}
            <div className={`rounded-2xl border p-5 text-left space-y-4 shadow-2xl ${selectedCard.gradient}`}>
              <div className="flex justify-between items-start">
                <div>
                  <div className={`text-[9px] font-mono font-bold uppercase ${selectedCard.textColor}`}>
                    SIGMA MENIFEST OS
                  </div>
                  <div className="text-sm font-black text-white font-mono uppercase">
                    {selectedCard.title}
                  </div>
                </div>
                <div className="w-8 h-6 rounded bg-gradient-to-r from-amber-300 via-amber-400 to-amber-200 border border-amber-500/40 shadow-md flex items-center justify-center text-[8px] font-black font-mono text-amber-950">
                  CHIP
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-xl overflow-hidden border border-white/20 shrink-0 bg-black shadow-lg">
                  <img src={selectedCard.image} alt={selectedCard.title} className="w-full h-full object-cover" />
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-mono font-bold text-white">CHARACTER PORTRAIT</div>
                  <div className="text-[10px] text-zinc-300 font-mono italic">{selectedCard.quote}</div>
                </div>
              </div>

              <div className="space-y-1 pt-2 border-t border-white/10">
                <div className="text-sm font-mono tracking-[2.5px] font-bold text-zinc-200">
                  {selectedCard.cardNumber}
                </div>
                <div className="flex justify-between items-center text-[9px] font-mono text-zinc-400">
                  <span className="uppercase font-bold text-white">{profile?.name || "WARRIOR"}</span>
                  <span className={`font-bold ${selectedCard.textColor}`}>{selectedCard.exp}</span>
                </div>
              </div>
            </div>

            {/* Unlocked Perks List */}
            <div className="space-y-2 text-left bg-black/40 p-4 rounded-2xl border border-white/10">
              <span className="text-xs font-mono font-bold text-amber-300 uppercase block">
                CARD PERKS & MULTIPLIERS:
              </span>
              <ul className="space-y-1.5 text-xs text-zinc-200 font-mono">
                {selectedCard.perks.map((p: string, i: number) => (
                  <li key={i} className="flex items-center gap-2">
                    <Sparkles size={12} className="text-emerald-400 shrink-0" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button 
              onClick={() => setSelectedCard(null)} 
              className="w-full py-3 bg-purple-600/80 hover:bg-purple-500 text-white font-mono text-xs font-bold uppercase rounded-xl transition"
            >
              CLOSE CARD INSPECTOR
            </button>
          </div>
        </div>
      )}

      {/* 9. QUANTUM TIMELINE SYNC MODAL */}
      {showSyncModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[300] flex items-center justify-center p-4">
          <div className="bg-[#121124] border border-purple-500/50 rounded-[32px] w-full max-w-md p-6 sm:p-8 space-y-6 shadow-2xl relative text-center">
            
            <button 
              onClick={() => setShowSyncModal(false)} 
              className="absolute top-4 right-4 text-white/50 hover:text-white"
            >
              <X size={20} />
            </button>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/40 text-purple-300 text-[10px] font-mono font-bold tracking-wider uppercase inline-flex items-center gap-1.5">
                <Calendar size={12} className="text-amber-400 animate-spin" /> QUANTUM TIMELINE SYNCHRONIZER
              </span>
              <h3 className="text-xl font-black text-white font-serif uppercase tracking-wide">Sync Commitment Streak</h3>
              <p className="text-[11px] text-white/50 leading-relaxed">
                Manually align your real commitment history with Sigma's cloud-database. The system will seed authentic historical daily events to dynamically compute your desired streak.
              </p>
            </div>

            {/* Slider / Counter */}
            <div className="bg-black/40 p-5 rounded-2xl border border-white/5 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-mono font-bold text-zinc-400">TARGET STREAK DAYS</span>
                <span className="text-3xl font-black text-emerald-400 font-mono tracking-tight tabular-nums">{targetStreakDays} Days</span>
              </div>
              
              <input 
                type="range" 
                min="1" 
                max="100" 
                value={targetStreakDays} 
                onChange={(e) => {
                  playSFX("click");
                  setTargetStreakDays(Number(e.target.value));
                }}
                className="w-full h-2 bg-purple-950 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />

              <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                <span>1 Day</span>
                <span>42 Days (Milestone)</span>
                <span>100 Days</span>
              </div>
            </div>

            {/* Dynamic Forecast Metrics */}
            <div className="grid grid-cols-2 gap-2 text-left bg-purple-950/20 border border-purple-500/20 p-3 rounded-xl text-xs font-mono">
              <div className="space-y-0.5">
                <span className="text-zinc-400 text-[10px]">PREDICTED LEVEL:</span>
                <div className="text-white font-bold">Level {Math.max(level, Math.min(25, Math.ceil(targetStreakDays / 2)))}</div>
              </div>
              <div className="space-y-0.5">
                <span className="text-zinc-400 text-[10px]">ESTIMATED MIN XP:</span>
                <div className="text-amber-400 font-bold">{(targetStreakDays * 250).toLocaleString()} XP</div>
              </div>
            </div>

            {/* Synchronize Action */}
            <div className="space-y-3 pt-2">
              <button 
                onClick={handleSyncStreak}
                disabled={isSyncing}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white font-mono text-xs font-black uppercase tracking-wider shadow-lg shadow-purple-950/80 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSyncing ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ALIGNING TIMELINE...
                  </>
                ) : (
                  <>
                    <Calendar size={14} className="text-amber-400 animate-pulse" />
                    WRITE TIMELINE TO DATABASE
                  </>
                )}
              </button>
              <span className="text-[9.5px] font-mono text-zinc-500 block">
                ⚠️ Writes to the official cloud database node. Action is irreversible.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SoloDominion;

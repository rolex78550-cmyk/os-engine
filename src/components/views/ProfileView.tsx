import React, { useState, useEffect } from "react";
import { 
  Crown, Flame, Target, Zap, Star, Trophy, Award, TrendingUp, 
  Calendar, User, Edit2, ArrowRight, X, Check, Sparkles, Bell, 
  ShieldAlert, ShieldCheck, Plus, ChevronRight, Info, BarChart2,
  RefreshCw, Lock, Camera, Upload, Image as ImageIcon, Link as LinkIcon
} from "lucide-react";
import { ProfileState, SubscriptionData, RitualItem, Desire, JournalEntry, VisionItem, CommunityPost } from "../../types";
import { resolveImageUrl, onImgError, FALLBACK_AVATAR } from "../../lib/imageHelper";
import { WallpaperEngine } from "../WallpaperEngine";

interface ProfileViewProps {
  user: any;
  profile: ProfileState;
  isPremium: boolean;
  isOnTrial: boolean;
  hasPaidAccess: boolean;
  subscription: SubscriptionData | null;
  notificationPrefs: any;
  setNotificationPrefs: (prefs: any) => void;
  pushPermission: string;
  requestPushPermission: () => Promise<void>;
  sendTestPush: () => void;
  sendTestEmail: () => Promise<void>;
  handleUpgradeClick: () => void;
  rituals: RitualItem[];
  desires: Desire[];
  journalEntries?: JournalEntry[];
  visionItems?: VisionItem[];
  communityPosts?: CommunityPost[];
  todayStr: string;
  setActiveTab: (tab: any) => void;
  logPageVisit: (page: string) => void;
  setNotificationMsg?: (msg: string | null) => void;
  updateUserProfile?: (updates: Partial<ProfileState>) => Promise<void>;
  setShowManifestOnboarding?: (val: boolean) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  profile,
  isPremium,
  isOnTrial,
  hasPaidAccess,
  subscription,
  desires = [],
  rituals = [],
  journalEntries = [],
  visionItems = [],
  communityPosts = [],
  todayStr,
  setActiveTab,
  handleUpgradeClick,
  setNotificationMsg,
  updateUserProfile,
  setShowManifestOnboarding,
  notificationPrefs,
  setNotificationPrefs,
  pushPermission,
  requestPushPermission,
  sendTestPush,
  sendTestEmail
}) => {
  // ─────────────────────────────────────────────────────────────────────
  // 1. DERIVED VALUES (must be declared BEFORE any useState that reads them)
  //    These are pure read-only computations from the `profile` prop.
  //    Hoisting them above the useState calls fixes the TDZ error
  //    `Cannot access 'Ke' before initialization`.
  // ─────────────────────────────────────────────────────────────────────
  const userName = profile.name || user?.displayName || "Seeker";
  const level = Number(profile.level) || 1;
  const currentXP = Number(profile.xp) || 0;
  const totalXpRaw = Number(profile.totalXp) || Number(profile.xp) || 0;
  const streak = Number(profile.streak) || 0;
  const alignment = Number(profile.alignment) || 0;
  const longestStreak = Math.max(streak, Number(profile.longestStreak) || 0);
  const totalQuestsCompleted = Number(profile.totalQuestsCompleted) || 0;
  const goalsCompletedCount = desires.filter(d => d.completed || (d.progress && d.progress >= 100)).length;
  const activeGoalsCount = desires.length;

  const getRankInfo = (lvl: number) => {
    if (lvl >= 50) return { name: "LEGENDARY MONARCH", subtitle: "GODLIKE ALIGNMENT", color: "from-amber-400 to-yellow-600" };
    if (lvl >= 35) return { name: "SHADOW MONARCH", subtitle: "ELITE COMMANDER", color: "from-purple-500 to-indigo-600" };
    if (lvl >= 20) return { name: "SHADOW MONARCH", subtitle: "ASCENDED HUNTER", color: "from-violet-500 to-purple-600" };
    return { name: "HUNTER", subtitle: "NOVICE SEEKER", color: "from-blue-500 to-cyan-600" };
  };
  const rankInfo = getRankInfo(level);

  // notify() helper used by handleSelectAvatarUrl (defined above useState
  // so it can be referenced by the avatar handlers that come next).
  const notify = (msg: string) => {
    if (setNotificationMsg) setNotificationMsg(msg);
  };

  // ─────────────────────────────────────────────────────────────────────
  // 2. STATE — useState calls AFTER derived values so no TDZ.
  // ─────────────────────────────────────────────────────────────────────
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRankModal, setShowRankModal] = useState(false);
  const [showXPModal, setShowXPModal] = useState(false);
  const [selectedStat, setSelectedStat] = useState<string | null>(null);
  const [selectedAchievement, setSelectedAchievement] = useState<any | null>(null);
  const [showAddHabitModal, setShowAddHabitModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarCategory, setAvatarCategory] = useState<string>("All");
  const [customUrlInput, setCustomUrlInput] = useState<string>("");

  // Edit profile form — defaults from real Firestore profile (not hardcoded)
  const [editName, setEditName] = useState(profile.name || user?.displayName || "Seeker");
  const [editTitle, setEditTitle] = useState(profile.universeRank || rankInfo.name);
  const [editFocus, setEditFocus] = useState((profile as any).primaryFocus || (profile as any).primaryPriority || "");
  const [editTimezone, setEditTimezone] = useState(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch {
      return "UTC";
    }
  });
  const [editTags, setEditTags] = useState<string[]>(
    Array.isArray((profile as any).tags) && (profile as any).tags.length > 0
      ? (profile as any).tags
      : []
  );
  const [newTagInput, setNewTagInput] = useState("");

  // Habit Streaks — derived from real rituals
  const [habitStreaks, setHabitStreaks] = useState<Array<{ id: string; label: string; days: number; icon: string; completedToday: boolean }>>(() => {
    if (rituals && rituals.length > 0) {
      return rituals.slice(0, 6).map((r, i) => {
        const icons = ["🔥", "🧘", "📖", "💪", "⚡", "🎯"];
        return {
          id: r.id || `ritual_${i}`,
          label: r.label || r.title || `Ritual ${i + 1}`,
          days: Math.max(r.streak || 0, 0),
          icon: icons[i % icons.length],
          completedToday: !!(r.completedDates || []).includes(todayStr),
        };
      });
    }
    return [];
  });

  const [newHabitLabel, setNewHabitLabel] = useState("");
  const [newHabitIcon, setNewHabitIcon] = useState("✨");

  // Core attributes leveling state
  const [attrBonus, setAttrBonus] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem("solo_attr_bonus");
      return saved ? JSON.parse(saved) : { Strength: 0, Mindset: 0, Discipline: 0, Health: 0, Intelligence: 0, Charisma: 0 };
    } catch {
      return { Strength: 0, Mindset: 0, Discipline: 0, Health: 0, Intelligence: 0, Charisma: 0 };
    }
  });

  // Sync edit-form defaults with the latest Firestore profile values
  useEffect(() => {
    setEditName(profile.name || user?.displayName || "Seeker");
    if (!editTitle || editTitle === "SHADOW MONARCH" || editTitle === "HUNTER") {
      setEditTitle(profile.universeRank || rankInfo.name);
    }
  }, [profile.name, profile.universeRank, user?.displayName, level]);

  // Preset Avatars dataset across requested universes
  const AVATAR_PRESETS = [
    {
      category: "Anime & Manga",
      badge: "🔥 POPULAR",
      avatars: [
        { id: "a1", name: "Sung Jin-Woo (Shadow Monarch)", universe: "Solo Leveling", url: "/images/shadow_monarch_avatar.jpg" },
        { id: "a2", name: "Gojo Satoru (Limitless)", universe: "Jujutsu Kaisen", url: "https://images.unsplash.com/photo-1563089145-599997674d42?w=400&auto=format&fit=crop&q=80" },
        { id: "a3", name: "Goku (Ultra Instinct)", universe: "Dragon Ball Super", url: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=400&auto=format&fit=crop&q=80" },
        { id: "a4", name: "Levi Ackerman (Strongest)", universe: "Attack on Titan", url: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&auto=format&fit=crop&q=80" },
        { id: "a5", name: "Naruto Uzumaki (Sage Mode)", universe: "Naruto Shippuden", url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80" },
        { id: "a6", name: "Roronoa Zoro (King of Hell)", universe: "One Piece", url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&auto=format&fit=crop&q=80" },
        { id: "a7", name: "Tanjiro Kamado (Sun Breathing)", universe: "Demon Slayer", url: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=400&auto=format&fit=crop&q=80" },
        { id: "a8", name: "Light Yagami / Kira", universe: "Death Note", url: "https://images.unsplash.com/photo-1514539079130-25950c84af65?w=400&auto=format&fit=crop&q=80" }
      ]
    },
    {
      category: "Game of Thrones",
      badge: "⚔️ KINGDOM",
      avatars: [
        { id: "got1", name: "Jon Snow (King in the North)", universe: "Game of Thrones", url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80" },
        { id: "got2", name: "Daenerys (Mother of Dragons)", universe: "Game of Thrones", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80" },
        { id: "got3", name: "Night King (Winter Monarch)", universe: "Game of Thrones", url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&auto=format&fit=crop&q=80" },
        { id: "got4", name: "Daemon Targaryen (Rogue Prince)", universe: "House of the Dragon", url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80" },
        { id: "got5", name: "Geralt of Rivia (White Wolf)", universe: "The Witcher", url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80" },
        { id: "got6", name: "Tyrion Lannister (Hand of King)", universe: "Game of Thrones", url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80" }
      ]
    },
    {
      category: "Marvel Universe",
      badge: "🛡️ AVENGERS",
      avatars: [
        { id: "m1", name: "Iron Man / Tony Stark", universe: "Marvel MCU", url: "https://images.unsplash.com/photo-1635863138275-d9b33299680b?w=400&auto=format&fit=crop&q=80" },
        { id: "m2", name: "Doctor Strange (Sorcerer)", universe: "Marvel MCU", url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&auto=format&fit=crop&q=80" },
        { id: "m3", name: "Thor Odinson (God of Thunder)", universe: "Marvel MCU", url: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400&auto=format&fit=crop&q=80" },
        { id: "m4", name: "Spider-Man / Miles Morales", universe: "Spider-Verse", url: "https://images.unsplash.com/photo-1604200213928-ba3cf4fc8436?w=400&auto=format&fit=crop&q=80" },
        { id: "m5", name: "Wolverine / Logan", universe: "X-Men Universe", url: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80" },
        { id: "m6", name: "Thanos (The Mad Titan)", universe: "Marvel MCU", url: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=400&auto=format&fit=crop&q=80" }
      ]
    },
    {
      category: "DC Universe",
      badge: "⚡ JUSTICE LEAGUE",
      avatars: [
        { id: "dc1", name: "Batman (The Dark Knight)", universe: "DC Comics", url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&auto=format&fit=crop&q=80" },
        { id: "dc2", name: "Superman (Man of Steel)", universe: "DC Comics", url: "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=400&auto=format&fit=crop&q=80" },
        { id: "dc3", name: "Joker (Clown Prince)", universe: "DC Comics", url: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=400&auto=format&fit=crop&q=80" },
        { id: "dc4", name: "The Flash (Speed Force)", universe: "DC Comics", url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80" },
        { id: "dc5", name: "Wonder Woman", universe: "DC Comics", url: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&auto=format&fit=crop&q=80" },
        { id: "dc6", name: "Nightwing (Dick Grayson)", universe: "DC Comics", url: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&auto=format&fit=crop&q=80" }
      ]
    }
  ];

  const handleSelectAvatarUrl = (url: string, charName?: string) => {
    if (updateUserProfile) {
      updateUserProfile({ avatarUrl: url });
    }
    notify(charName ? `✨ Avatar set to ${charName}!` : "✨ Avatar image updated!");
    setShowAvatarModal(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      notify("⚠️ Image size should be under 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        handleSelectAvatarUrl(reader.result as string, "Custom File Upload");
      }
    };
    reader.readAsDataURL(file);
  };

  // Derived metrics computed from the real values declared at the top
  const totalXPForLevel = currentXP + (1000 + level * 200);
  const xpInLevel = currentXP % (1000 + level * 200);
  const xpProgress = totalXPForLevel > 0 ? Math.min(Math.round((xpInLevel / (1000 + level * 200)) * 100), 100) : 0;

  // "This week" derived metric
  const goalsCompletedThisWeek = (() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return desires.filter((d: any) => {
      const completed = d.completed || (d.progress && d.progress >= 100);
      if (!completed) return false;
      const ts = new Date(d.completedAt || d.updatedAt || d.createdAt || 0).getTime();
      return ts >= weekAgo;
    }).length;
  })();

  const totalXP = totalXpRaw;
  // Dominion Power: derived from real total XP, level and streak
  const dominionPower = totalXP * 4 + (level * 1500) + (streak * 250);

  // Global rank derived from real total XP
  const globalRank = Math.max(1, 10000 - Math.floor(totalXP / 10) - (level * 30));
  // Rank change
  const prevTotalXp = Number((profile as any).previousTotalXp) || 0;
  const rankDelta = Math.floor((totalXP - prevTotalXp) / 10);
  const rankChange = rankDelta > 0 ? rankDelta : 0;
  const xpToRankUp = Math.max(0, 5000 - (currentXP % 5000));



  // Dynamic Core Attributes — derived from REAL profile data
  // For brand-new users (level=1, currentXP=0), stats start low and grow with usage.
  const attrMaxLevel = 99;
  const coreAttributes = [
    {
      id: "Strength",
      name: "Strength",
      level: Math.min(1 + Math.floor(level / 3) + (attrBonus.Strength || 0), attrMaxLevel),
      xp: `${Math.floor(currentXP * 0.28) + (attrBonus.Strength || 0) * 100} / ${(level + 1) * 2000}`,
      pct: Math.min(Math.floor(currentXP * 0.028) + (attrBonus.Strength || 0) * 2, 100),
      color: "#f59e0b",
      icon: "⚔️",
      desc: "Physical endurance, vital force, and raw output capacity."
    },
    {
      id: "Mindset",
      name: "Mindset",
      level: Math.min(1 + Math.floor(level / 4) + (attrBonus.Mindset || 0), attrMaxLevel),
      xp: `${Math.floor(currentXP * 0.42) + (attrBonus.Mindset || 0) * 100} / ${(level + 1) * 3000}`,
      pct: Math.min(Math.floor(currentXP * 0.042) + (attrBonus.Mindset || 0) * 2, 100),
      color: "#3b82f6",
      icon: "🧠",
      desc: "Subconscious alignment, mental clarity, and belief strength."
    },
    {
      id: "Discipline",
      name: "Discipline",
      level: Math.min(1 + Math.floor(level / 3) + (attrBonus.Discipline || 0), attrMaxLevel),
      xp: `${Math.floor(currentXP * 0.51) + (attrBonus.Discipline || 0) * 100} / ${(level + 1) * 3000}`,
      pct: Math.min(Math.floor(currentXP * 0.051) + (attrBonus.Discipline || 0) * 2, 100),
      color: "#8b5cf6",
      icon: "🛡️",
      desc: "Unwavering consistency, streak retention, and resistance immunity."
    },
    {
      id: "Health",
      name: "Health",
      level: Math.min(1 + Math.floor(level / 4) + (attrBonus.Health || 0), attrMaxLevel),
      xp: `${Math.floor(currentXP * 0.31) + (attrBonus.Health || 0) * 100} / ${(level + 1) * 2500}`,
      pct: Math.min(Math.floor(currentXP * 0.031) + (attrBonus.Health || 0) * 2, 100),
      color: "#ef4444",
      icon: "❤️",
      desc: "Cellular vitality, recovery speed, and physical stamina."
    },
    {
      id: "Intelligence",
      name: "Intelligence",
      level: Math.min(1 + Math.floor(level / 3) + (attrBonus.Intelligence || 0), attrMaxLevel),
      xp: `${Math.floor(currentXP * 0.38) + (attrBonus.Intelligence || 0) * 100} / ${(level + 1) * 3000}`,
      pct: Math.min(Math.floor(currentXP * 0.038) + (attrBonus.Intelligence || 0) * 2, 100),
      color: "#06b6d4",
      icon: "🔮",
      desc: "Strategic execution, wisdom synthesis, and pattern perception."
    },
    {
      id: "Charisma",
      name: "Charisma",
      level: Math.min(1 + Math.floor(level / 5) + (attrBonus.Charisma || 0), attrMaxLevel),
      xp: `${Math.floor(currentXP * 0.19) + (attrBonus.Charisma || 0) * 100} / ${(level + 1) * 1500}`,
      pct: Math.min(Math.floor(currentXP * 0.019) + (attrBonus.Charisma || 0) * 2, 100),
      color: "#a855f7",
      icon: "👑",
      desc: "Social magnetism, influence, and leadership energy."
    },
  ];

  // Train attribute action
  const handleTrainAttribute = (attrId: string) => {
    const nextBonus = { ...attrBonus, [attrId]: (attrBonus[attrId] || 0) + 1 };
    setAttrBonus(nextBonus);
    try {
      localStorage.setItem("solo_attr_bonus", JSON.stringify(nextBonus));
    } catch {}
    notify(`⚡ Trained ${attrId}! Level increased!`);
  };

  // Dynamic Achievements list
  const achievements = [
    { 
      id: "ach1", 
      title: "First Step", 
      desc: "Complete your first goal in the system", 
      req: "1 Goal Completed",
      progress: `${Math.min(goalsCompletedCount, 1)} / 1`,
      icon: "🟣", 
      unlocked: goalsCompletedCount >= 1, 
      reward: "+100 XP & 50 Coins",
      color: "from-purple-500/20 to-purple-600/10 border-purple-500/40" 
    },
    { 
      id: "ach2", 
      title: "Unstoppable", 
      desc: "Maintain a 7-day consistency streak", 
      req: "7 Day Streak",
      progress: `${Math.min(streak, 7)} / 7 Days`,
      icon: "🟡", 
      unlocked: streak >= 7, 
      reward: "+250 XP & Streak Shield",
      color: "from-amber-500/20 to-yellow-600/10 border-amber-500/40" 
    },
    { 
      id: "ach3", 
      title: "Rising Star", 
      desc: "Reach level 10 in the System", 
      req: "Reach Level 10",
      progress: `Level ${level} / 10`,
      icon: "🔵", 
      unlocked: level >= 10, 
      reward: "+500 XP & Special Badge",
      color: "from-blue-500/20 to-cyan-600/10 border-blue-500/40" 
    },
    { 
      id: "ach4", 
      title: "Goal Crusher", 
      desc: "Complete 5 or more core goals", 
      req: "5 Goals Completed",
      progress: `${goalsCompletedCount} / 5 Goals`,
      icon: "🔴", 
      unlocked: goalsCompletedCount >= 5, 
      reward: "+750 XP & Title: Crusher",
      color: "from-rose-500/20 to-red-600/10 border-rose-500/40" 
    },
    { 
      id: "ach5", 
      title: "Shadow Monarch", 
      desc: "Ascend to Level 20 Hunter status", 
      req: "Reach Level 20",
      progress: `Level ${level} / 20`,
      icon: "👑", 
      unlocked: level >= 20, 
      reward: "System Awakening Privileges",
      color: "from-violet-500/20 to-purple-600/10 border-violet-500/40" 
    },
    { 
      id: "ach6", 
      title: "Reality Architect", 
      desc: "Script 3+ Journal entries in the Quantum Vault", 
      req: "3 Journal Entries",
      progress: `${journalEntries.length} / 3 Entries`,
      icon: "✏️", 
      unlocked: journalEntries.length >= 3, 
      reward: "+300 XP & Oracle Insights",
      color: "from-emerald-500/20 to-teal-600/10 border-emerald-500/40" 
    },
    { 
      id: "ach7", 
      title: "Visionary", 
      desc: "Add 3+ items to your Vision Board", 
      req: "3 Vision Items",
      progress: `${visionItems.length} / 3 Vision Cards`,
      icon: "🖼️", 
      unlocked: visionItems.length >= 3, 
      reward: "+200 XP & High Coherence",
      color: "from-indigo-500/20 to-blue-600/10 border-indigo-500/40" 
    },
    { 
      id: "ach8", 
      title: "Community Pillar", 
      desc: "Engage or post in the Global Hunter Feed", 
      req: "1 Post or Like",
      progress: `${communityPosts.length > 0 ? 1 : 0} / 1 Action`,
      icon: "🌐", 
      unlocked: communityPosts.length > 0, 
      reward: "+150 XP & Global Rank Boost",
      color: "from-cyan-500/20 to-teal-600/10 border-cyan-500/40" 
    },
  ];

  // Dynamic Recent Activity — synthesized from REAL Firestore data
  // 1. Completed desires (real, recent first)
  // 2. Recent journal entries (real)
  // 3. Most recent rituals (real)
  // 4. Recent vision items (real)
  const recentActivity = (() => {
    const acts: Array<{ icon: string; text: string; xp: string; time: string; _ts: number }> = [];

    const toRel = (iso?: string) => {
      if (!iso) return "—";
      const t = new Date(iso).getTime();
      if (isNaN(t)) return "—";
      const diffMs = Date.now() - t;
      const m = Math.floor(diffMs / 60000);
      if (m < 1) return "just now";
      if (m < 60) return `${m}m ago`;
      const h = Math.floor(m / 60);
      if (h < 24) return `${h}h ago`;
      const d = Math.floor(h / 24);
      if (d < 30) return `${d}d ago`;
      const mo = Math.floor(d / 30);
      return `${mo}mo ago`;
    };

    // Completed goals
    desires
      .filter((d: any) => d.completed || (d.progress && d.progress >= 100))
      .slice(0, 3)
      .forEach((d: any) => {
        acts.push({
          icon: "🎯",
          text: `Completed goal: ${d.title || "Untitled Goal"}`,
          xp: `+${Number(d.xp) || 300} XP`,
          time: toRel(d.completedAt || d.updatedAt || d.createdAt),
          _ts: new Date(d.completedAt || d.updatedAt || d.createdAt || 0).getTime() || 0,
        });
      });

    // Recent journal entries
    journalEntries.slice(0, 3).forEach((j: any) => {
      acts.push({
        icon: "📓",
        text: `Journal entry: ${j.title || j.scriptType || "Scripted Reality"}`,
        xp: "+50 XP",
        time: toRel(j.createdAt || j.date),
        _ts: new Date(j.createdAt || j.date || 0).getTime() || 0,
      });
    });

    // Recent vision items
    visionItems.slice(0, 2).forEach((v: any) => {
      acts.push({
        icon: "🖼️",
        text: `Added vision: ${v.caption || v.title || "Manifest Image"}`,
        xp: "+20 XP",
        time: toRel(v.createdAt),
        _ts: new Date(v.createdAt || 0).getTime() || 0,
      });
    });

    // Streak milestone (if >= 1)
    if (streak > 0) {
      acts.push({
        icon: "🔥",
        text: `Active ${streak}-day continuous streak`,
        xp: `+${streak * 50} XP total`,
        time: streak === 1 ? "today" : `${streak}d running`,
        _ts: Date.now() - 1000,
      });
    }

    // Sort by timestamp desc and keep top 5
    return acts
      .sort((a, b) => b._ts - a._ts)
      .slice(0, 5)
      .map(({ _ts, ...rest }) => rest);
  })();

  // Active Streaks / Goals — derived ENTIRELY from real Firestore desires
  // No fake fallback objects: if no goals, show an empty-state hint.
  const categoryIcons: Record<string, string> = {
    wealth: "💰", lifestyle: "🏠", career: "🚀", spiritual: "🧘",
    health: "💪", relationship: "❤️", personal: "✨", general: "🎯",
  };
  const categoryColors: Record<string, string> = {
    wealth: "#f59e0b", lifestyle: "#a855f7", career: "#3b82f6", spiritual: "#10b981",
    health: "#ef4444", relationship: "#f43f5e", personal: "#06b6d4", general: "#8b5cf6",
  };
  const activeStreaks = desires.slice(0, 3).map((d: any, idx: number) => {
    const cat = (d.category || "general").toLowerCase();
    const pct = Math.max(0, Math.min(100, Number(d.progress) || 0));
    return {
      id: d.id,
      title: d.title || "Untitled Goal",
      cat: cat.charAt(0).toUpperCase() + cat.slice(1),
      pct,
      next: d.notes || (pct >= 100 ? "Completed!" : "Continue daily action"),
      xp: Number(d.xp) || Math.max(50, 300 - idx * 50),
      color: categoryColors[cat] || "#a855f7",
      icon: categoryIcons[cat] || "🎯",
    };
  });

  // Habit streak toggle
  const toggleHabitToday = (id: string) => {
    const updated = habitStreaks.map(h => {
      if (h.id === id) {
        const nextDone = !h.completedToday;
        const nextDays = nextDone ? h.days + 1 : Math.max(0, h.days - 1);
        notify(nextDone ? `🔥 ${h.label} logged! Streak is now ${nextDays} days!` : `Habit unlogged.`);
        return { ...h, completedToday: nextDone, days: nextDays };
      }
      return h;
    });
    setHabitStreaks(updated);
    try {
      localStorage.setItem("solo_habit_streaks", JSON.stringify(updated));
    } catch {}
  };

  // Add new habit streak
  const handleAddHabit = () => {
    if (!newHabitLabel.trim()) return;
    const newHabit = {
      id: `h_${Date.now()}`,
      label: newHabitLabel.trim(),
      days: 1,
      icon: newHabitIcon || "⚡",
      completedToday: true
    };
    const updated = [...habitStreaks, newHabit];
    setHabitStreaks(updated);
    try {
      localStorage.setItem("solo_habit_streaks", JSON.stringify(updated));
    } catch {}
    setNewHabitLabel("");
    setShowAddHabitModal(false);
    notify(`🌱 Added new habit tracker: "${newHabit.label}"!`);
  };

  // Save profile edit modal
  const handleSaveProfile = async () => {
    const updates: Partial<ProfileState> = {
      name: editName.trim() || userName,
      universeRank: editTitle.trim() || rankInfo.name,
      primaryFocus: editFocus.trim(),
      tags: editTags,
    };

    if (updateUserProfile) {
      await updateUserProfile(updates);
    } else {
      notify(`Profile updated to "${editName}"`);
    }

    setShowEditModal(false);
  };

  // Add tag
  const handleAddTag = () => {
    if (!newTagInput.trim()) return;
    if (editTags.includes(newTagInput.trim())) return;
    setEditTags(prev => [...prev, newTagInput.trim()]);
    setNewTagInput("");
  };

  // Remove tag
  const handleRemoveTag = (tagToRemove: string) => {
    setEditTags(prev => prev.filter(t => t !== tagToRemove));
  };

  const currentAvatarUrl = resolveImageUrl(profile.avatarUrl) || FALLBACK_AVATAR;

  return (
    <div className="text-white space-y-2.5 sm:space-y-3 pb-4">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/40 text-purple-300 text-[10px] font-mono uppercase font-bold tracking-widest">
              {rankInfo.subtitle}
            </span>
          </div>
          <p className="text-xs text-white/60 mt-0.5">Track your evolution. Analyze. Improve. Ascend.</p>
        </div>

        <div className="flex items-center gap-2">
          {setShowManifestOnboarding && (
            <button 
              onClick={() => setShowManifestOnboarding(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition-all active:scale-95"
            >
              <Sparkles size={14} className="text-amber-400 animate-pulse" /> 
              Retake AI Assessment
            </button>
          )}

          <button 
            onClick={() => setShowEditModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold transition-all active:scale-95"
          >
            <Edit2 size={14} className="text-purple-400" /> Edit Profile
          </button>
        </div>
      </div>

      {/* HERO BANNER CARD */}
      <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-white/10 min-h-[160px]">
        {/* Background Video (Muted Loop) */}
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
          className="absolute inset-0 w-full h-full object-cover opacity-55"
        >
          <source src="/videos/hero_anime_loop.mp4" type="video/mp4" />
        </video>

        <div className="absolute inset-0 bg-gradient-to-r from-purple-950/70 via-indigo-950/60 to-black/85" />
        
        {/* Ambient Glows */}
        <div className="absolute -top-12 -left-12 w-60 h-60 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-60 h-60 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative p-3.5 sm:p-4 h-full flex flex-col sm:flex-row items-start sm:items-center gap-3.5">
          {/* Avatar with Glow Ring */}
          <div 
            className="relative shrink-0 group cursor-pointer" 
            onClick={() => setShowAvatarModal(true)}
            title="Click to Choose Character Avatar (Anime, GoT, Marvel, DC)"
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-[3px] border-purple-500/80 p-0.5 bg-black/60 shadow-xl shadow-purple-900/50">
              <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center overflow-hidden relative">
                <img
                  src={currentAvatarUrl}
                  alt={userName}
                  onError={onImgError()}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover rounded-full group-hover:scale-110 transition-transform duration-300"
                />
                
                {/* Change Avatar Overlay on Hover */}
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-bold gap-0.5">
                  <Camera size={18} className="text-purple-300" />
                  <span>CHANGE</span>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-7 h-7 bg-purple-600 hover:bg-purple-500 text-white rounded-full border-[2.5px] border-black flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
              <Sparkles size={13} className="text-yellow-300" />
            </div>
          </div>

          {/* User Info Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">{userName}</h2>
              <div 
                onClick={() => setShowRankModal(true)}
                className="px-3 py-1 bg-purple-500/20 text-purple-300 text-xs font-bold tracking-widest rounded-full flex items-center gap-1.5 border border-purple-400/40 cursor-pointer hover:bg-purple-500/30 transition"
              >
                <Crown size={14} className="text-yellow-400" />
                <span>{editTitle}</span>
              </div>
            </div>

            <p className="text-xs text-white/70 mt-1 max-w-xl italic">
              "{editFocus}"
            </p>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-white/50 mt-2 font-mono">
              <div>UID: {user?.uid ? user.uid.slice(0, 10).toUpperCase() : "HUNTER-001"}</div>
              <div>Timezone: {editTimezone}</div>
              <div>Status: <span className="text-emerald-400 font-bold">ACTIVE SYSTEM</span></div>
            </div>

            {/* Custom Tags */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {editTags.map((tag, i) => (
                <div key={i} className="px-3 py-0.5 text-xs bg-white/5 border border-white/10 rounded-full text-white/80 font-medium">
                  #{tag}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ONBOARDING SYSTEM BLUEPRINT CARD */}
      <div className="bg-zinc-950 border border-amber-500/30 rounded-3xl p-4 sm:p-5 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center justify-between gap-4 mb-3 pb-2.5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="font-extrabold text-white text-base">Onboarding Identity & System Blueprint</h3>
          </div>
          {setShowManifestOnboarding && (
            <button
              onClick={() => setShowManifestOnboarding(true)}
              className="text-xs font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 rounded-xl border border-amber-500/30 transition"
            >
              🔄 Recalibrate Persona
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-zinc-900/80 border border-white/5 rounded-2xl p-3">
            <div className="text-[10px] font-mono text-amber-400 uppercase tracking-wider mb-1 font-bold">IDENTITY ARCHETYPE</div>
            <div className="text-sm font-extrabold text-white">{profile?.identityArchetype || profile?.universeRank || "Apex Sovereign"}</div>
            <div className="text-[11px] text-zinc-400 mt-0.5">Calibrated System Matrix</div>
          </div>

          <div className="bg-zinc-900/80 border border-white/5 rounded-2xl p-3">
            <div className="text-[10px] font-mono text-amber-400 uppercase tracking-wider mb-1 font-bold">PRIMARY FOCUS</div>
            <div className="text-sm font-extrabold text-white">{profile?.primaryPriority || profile?.primaryFocus || "Wealth & Business"}</div>
            <div className="text-[11px] text-zinc-400 mt-0.5">Main Priority Objective</div>
          </div>

          <div className="bg-zinc-900/80 border border-white/5 rounded-2xl p-3">
            <div className="text-[10px] font-mono text-amber-400 uppercase tracking-wider mb-1 font-bold">90-DAY TARGET</div>
            <div className="text-sm font-extrabold text-amber-300 line-clamp-1">{profile?.target90Days || profile?.longTermGoal || "Master 90-Day Vision"}</div>
            <div className="text-[11px] text-zinc-400 mt-0.5">Primary Target Reality</div>
          </div>

          <div className="bg-zinc-900/80 border border-white/5 rounded-2xl p-3">
            <div className="text-[10px] font-mono text-amber-400 uppercase tracking-wider mb-1 font-bold">COACH & COMMITMENT</div>
            <div className="text-sm font-extrabold text-white">{profile?.coachStyle || "Strict Coach"}</div>
            <div className="text-[11px] text-zinc-400 mt-0.5">{profile?.commitment || "2 Hours / Day"}</div>
          </div>
        </div>

        {/* Targeted Blockers Row */}
        {Array.isArray(profile?.blockers) && profile.blockers.length > 0 && (
          <div className="mt-3 pt-2.5 border-t border-white/5 flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono text-zinc-400">Blockers Being Destroyed:</span>
            {profile.blockers.map((blocker, idx) => (
              <span key={idx} className="bg-red-500/15 border border-red-500/30 text-red-300 text-xs px-2.5 py-0.5 rounded-lg font-mono">
                🛡️ {blocker}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* I AM WALLPAPER ENGINE — your wallpaper, rotating affirmations every 10 min */}
      <div className="mb-2.5 sm:mb-3">
        <WallpaperEngine
          notify={notify}
          refreshSignal={0}
        />
      </div>

      {/* RANK + LEVEL + GLOBAL RANK ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
        
        {/* Current Rank Card */}
        <div 
          onClick={() => setShowRankModal(true)}
          className="bg-zinc-950 border border-white/10 hover:border-purple-500/50 rounded-2xl p-3 sm:p-3.5 flex items-center gap-3 cursor-pointer transition group shadow-lg"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-xl border border-purple-500/30 group-hover:scale-110 transition-transform">
            👑
          </div>
          <div>
            <div className="text-[9px] font-mono text-white/50 uppercase tracking-widest">CURRENT RANK</div>
            <div className="font-extrabold text-base text-white group-hover:text-purple-300 transition">{rankInfo.name}</div>
            <div className="text-[11px] text-purple-400 font-semibold">{rankInfo.subtitle}</div>
          </div>
        </div>

        {/* Level & XP Gauge */}
        <div 
          onClick={() => setShowXPModal(true)}
          className="bg-zinc-950 border border-white/10 hover:border-purple-500/50 rounded-2xl p-3 sm:p-3.5 cursor-pointer transition group shadow-lg"
        >
          <div className="flex justify-between items-center mb-1">
            <div>
              <div className="text-[9px] font-mono text-white/50 uppercase tracking-widest">LEVEL GAUGE</div>
              <div className="text-xl font-black tabular-nums tracking-tight text-white group-hover:text-purple-300 transition">Level {level}</div>
            </div>
            <div className="text-right">
              <div className="text-[9px] text-white/50 font-mono">NEXT LEVEL {level + 1}</div>
              <div className="font-mono text-[11px] text-purple-300 font-bold">{currentXP.toLocaleString()} / {totalXPForLevel.toLocaleString()} XP</div>
            </div>
          </div>
          <div className="h-2 bg-white/10 rounded-full mt-1.5 overflow-hidden p-0.5 border border-white/5">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-400 rounded-full transition-all duration-500" 
              style={{ width: `${xpProgress}%` }} 
            />
          </div>
        </div>

        {/* Global Rank Card */}
        <div
          onClick={() => notify(`🌐 Global Hunter Rank: #${globalRank}`)}
          className="bg-zinc-950 border border-white/10 hover:border-purple-500/50 rounded-2xl p-3 sm:p-3.5 flex items-center justify-between cursor-pointer transition shadow-lg"
        >
          <div>
            <div className="text-[9px] font-mono text-white/50 uppercase tracking-widest">GLOBAL RANK</div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black tabular-nums text-white">#{globalRank}</span>
              {rankChange > 0 && (
                <span className="text-emerald-400 text-[11px] font-bold">↑{rankChange}</span>
              )}
            </div>
            <div className="text-[10px] text-white/50">
              {globalRank <= 100 ? "Top 100 Hunters" : globalRank <= 1000 ? "Top 1% of all Hunters" : "Keep grinding to climb"}
            </div>
          </div>
          <div className="text-right text-[11px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
            {xpToRankUp} XP<br />to Rank Up
          </div>
        </div>
      </div>

      {/* STATS OVERVIEW GRID — all numbers from real Firestore */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">

        <div
          onClick={() => setSelectedStat("total_xp")}
          className="bg-zinc-950 border border-white/10 hover:border-purple-500/50 rounded-2xl p-3 cursor-pointer transition shadow-md"
        >
          <div className="flex items-center gap-1.5 text-xs text-white/60 mb-1">
            <Star size={13} className="text-yellow-400" />
            <span className="font-medium">Total XP</span>
          </div>
          <div className="text-xl font-extrabold text-white tabular-nums">{totalXP.toLocaleString()}</div>
          <div className="text-emerald-400 text-[10px] font-mono mt-0.5">
            {rankDelta > 0 ? `↑${rankDelta} this session` : streak > 0 ? `${streak}-day streak` : "Start your journey"}
          </div>
        </div>

        <div
          onClick={() => setSelectedStat("goals")}
          className="bg-zinc-950 border border-white/10 hover:border-purple-500/50 rounded-2xl p-3 cursor-pointer transition shadow-md"
        >
          <div className="flex items-center gap-1.5 text-xs text-white/60 mb-1">
            <Target size={13} className="text-purple-400" />
            <span className="font-medium">Goals Done</span>
          </div>
          <div className="text-xl font-extrabold text-white tabular-nums">{goalsCompletedCount} <span className="text-xs text-white/40">/ {activeGoalsCount}</span></div>
          <div className="text-emerald-400 text-[10px] font-mono mt-0.5">
            {activeGoalsCount > 0
              ? `${Math.round((goalsCompletedCount / activeGoalsCount) * 100)}% completion • +${goalsCompletedThisWeek} this week`
              : "Create your first goal"}
          </div>
        </div>

        <div
          onClick={() => setSelectedStat("streak")}
          className="bg-zinc-950 border border-white/10 hover:border-purple-500/50 rounded-2xl p-3 cursor-pointer transition shadow-md"
        >
          <div className="flex items-center gap-1.5 text-xs text-white/60 mb-1">
            <Flame size={13} className="text-orange-400 animate-pulse" />
            <span className="font-medium">Streak Days</span>
          </div>
          <div className="text-xl font-extrabold text-white tabular-nums">{streak}</div>
          <div className="text-emerald-400 text-[10px] font-mono mt-0.5">
            Best: {Math.max(streak, Number(profile.longestStreak) || 0)}d
          </div>
        </div>

        <div
          onClick={() => setSelectedStat("alignment")}
          className="bg-zinc-950 border border-white/10 hover:border-purple-500/50 rounded-2xl p-3 cursor-pointer transition shadow-md"
        >
          <div className="flex items-center gap-1.5 text-xs text-white/60 mb-1">
            <Zap size={13} className="text-cyan-400" />
            <span className="font-medium">Alignment %</span>
          </div>
          <div className="text-xl font-extrabold text-white tabular-nums">{alignment}%</div>
          <div className="text-emerald-400 text-[10px] font-mono mt-0.5">
            Based on {goalsCompletedCount} goal{goalsCompletedCount === 1 ? "" : "s"} completed
          </div>
        </div>

        <div
          onClick={() => setSelectedStat("power")}
          className="bg-zinc-950 border border-white/10 hover:border-purple-500/50 rounded-2xl p-3 col-span-2 sm:col-span-1 lg:col-span-1 cursor-pointer transition shadow-md"
        >
          <div className="flex items-center gap-1.5 text-xs text-white/60 mb-1">
            <Trophy size={13} className="text-yellow-300" />
            <span className="font-medium">Dominion Power</span>
          </div>
          <div className="text-xl font-extrabold text-white tabular-nums">{dominionPower.toLocaleString()}</div>
          <div className="text-emerald-400 text-[10px] font-mono mt-0.5">
            Level {level} × {Math.max(1, totalQuestsCompleted)} quest{totalQuestsCompleted === 1 ? "" : "s"}
          </div>
        </div>
      </div>

      {/* CORE ATTRIBUTES + ACHIEVEMENTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 sm:gap-3">
        
        {/* Core Attributes */}
        <div className="lg:col-span-7 bg-zinc-950 border border-white/10 rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5 sm:mb-3">
            <div className="min-w-0">
              <h3 className="font-extrabold text-sm sm:text-base text-white truncate">Core Attributes</h3>
              <p className="text-[11px] sm:text-xs text-white/50 truncate">Train stats to boost your System awakening level</p>
            </div>
            <button 
              onClick={() => notify("💡 Train attributes by completing daily quests and clicking 'Train'")}
              className="text-xs text-purple-300 hover:text-white flex items-center gap-1 font-semibold shrink-0"
            >
              Stat Info
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
            {coreAttributes.map((attr) => (
              <div key={attr.id} className="bg-black/50 border border-white/10 hover:border-purple-500/40 rounded-xl sm:rounded-2xl p-2.5 sm:p-3 transition group min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-lg sm:text-xl group-hover:scale-110 transition-transform shrink-0">{attr.icon}</span>
                    <div className="min-w-0">
                      <div className="font-bold text-xs sm:text-sm text-white truncate">{attr.name}</div>
                      <div className="text-[10px] font-mono text-purple-300 truncate">Level {attr.level}</div>
                    </div>
                  </div>

                  {/* Train Action Button */}
                  <button
                    onClick={() => handleTrainAttribute(attr.id)}
                    className="shrink-0 px-2 sm:px-2.5 py-1 bg-purple-600/80 hover:bg-purple-500 text-white rounded-lg sm:rounded-xl text-[10px] font-bold font-mono transition border border-purple-400/30 flex items-center gap-1 active:scale-95"
                    title={`Train ${attr.name}`}
                  >
                    <span>TRAIN</span>
                    <Plus size={10} />
                  </button>
                </div>

                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-300" 
                    style={{ width: `${attr.pct}%`, backgroundColor: attr.color }} 
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] font-mono text-white/40 mt-1">
                  <span>Progress</span>
                  <span>{attr.pct}% Max</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Achievements */}
        <div className="lg:col-span-5 bg-zinc-950 border border-white/10 rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-extrabold text-base text-white">System Badges</h3>
              <p className="text-xs text-white/50">{achievements.filter(a => a.unlocked).length} / {achievements.length} Unlocked</p>
            </div>
            <span className="text-xs font-mono text-purple-300 font-bold bg-purple-500/20 px-2.5 py-0.5 rounded-full">
              REWARDS
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-2">
            {achievements.map((ach) => (
              <div 
                key={ach.id}
                onClick={() => setSelectedAchievement(ach)}
                className={`rounded-2xl border p-2.5 cursor-pointer transition-all flex items-center gap-2.5 ${
                  ach.unlocked 
                    ? `bg-gradient-to-r ${ach.color} text-white shadow-md hover:scale-[1.02]` 
                    : "bg-black/40 border-white/10 opacity-50 hover:opacity-80"
                }`}
              >
                <div className="text-2xl shrink-0">{ach.icon}</div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-xs truncate">{ach.title}</div>
                  <div className="text-[10px] text-white/60 truncate">{ach.req}</div>
                  <div className="text-[9px] font-mono text-yellow-300 mt-0.5">
                    {ach.unlocked ? "UNLOCKED" : ach.progress}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ACTIVE STREAKS + RECENT ACTIVITY + HABIT TRACKER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 sm:gap-3">
        
        {/* Active Goals / Streaks */}
        <div className="lg:col-span-5 bg-zinc-950 border border-white/10 rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 shadow-xl">
          <div className="flex justify-between items-center mb-2.5">
            <div>
              <h3 className="font-bold text-sm text-white">Active Goals</h3>
              <p className="text-xs text-white/50">Connected from your manifestation board</p>
            </div>
            <button onClick={() => setActiveTab("goals")} className="text-xs text-purple-300 hover:text-white font-semibold">
              View All Goals
            </button>
          </div>

          <div className="space-y-2.5">
            {activeStreaks.map((s) => (
              <div 
                key={s.id} 
                onClick={() => setActiveTab("goals")}
                className="bg-black/50 border border-white/10 hover:border-purple-500/40 rounded-2xl p-2.5 sm:p-3 flex items-center gap-3 transition cursor-pointer group"
              >
                <div className="text-2xl shrink-0 group-hover:scale-110 transition-transform">{s.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-xs text-white truncate">{s.title}</span>
                    <span className="text-[10px] font-mono text-purple-300 font-bold">{s.pct}%</span>
                  </div>
                  
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${s.pct}%`, backgroundColor: s.color }} />
                  </div>
                  <div className="flex justify-between text-[10px] mt-1 text-white/50 font-mono">
                    <span className="truncate">{s.next}</span>
                    <span className="text-amber-400 font-bold">+{s.xp} XP</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-4 bg-zinc-950 border border-white/10 rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 shadow-xl">
          <div className="flex justify-between items-center mb-2.5">
            <div>
              <h3 className="font-bold text-sm text-white">System Feed</h3>
              <p className="text-xs text-white/50">Recent logs and XP awards</p>
            </div>
          </div>
          
          <div className="space-y-2">
            {recentActivity.map((act, i) => (
              <div key={i} className="flex items-center gap-2.5 p-2 bg-black/40 rounded-2xl border border-white/5 text-xs">
                <div className="text-lg shrink-0">{act.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white/90 truncate">{act.text}</div>
                  <div className="text-[10px] text-white/40 font-mono flex justify-between">
                    <span className="text-emerald-400 font-bold">{act.xp}</span>
                    <span>{act.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Habit Streaks Tracker */}
        <div className="lg:col-span-3 bg-zinc-950 border border-white/10 rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-2.5">
              <div>
                <h3 className="font-bold text-sm text-white">Habit Streaks</h3>
                <p className="text-xs text-white/50">Tap to log completion</p>
              </div>
              <button 
                onClick={() => setShowAddHabitModal(true)}
                className="p-1 bg-purple-600/80 hover:bg-purple-500 rounded-lg text-white transition"
                title="Add New Habit"
              >
                <Plus size={14} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {habitStreaks.map((h) => (
                <button
                  key={h.id}
                  onClick={() => toggleHabitToday(h.id)}
                  className={`rounded-2xl p-2.5 border text-xs text-left transition-all active:scale-95 cursor-pointer ${
                    h.completedToday 
                      ? "bg-purple-600/30 border-purple-400/60 text-white shadow-md shadow-purple-900/30" 
                      : "bg-black/40 border-white/10 text-white/70 hover:bg-white/10"
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-base">{h.icon}</span>
                    <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full ${h.completedToday ? "bg-purple-400 text-black font-bold" : "bg-white/10 text-white/50"}`}>
                      {h.completedToday ? "DONE" : "LOG"}
                    </span>
                  </div>
                  <div className="font-bold text-xs truncate">{h.label}</div>
                  <div className="text-[10px] font-mono text-purple-300 mt-0.5">{h.days} Day Streak</div>
                </button>
              ))}
            </div>
          </div>

          <div className="text-[10px] text-center text-white/40 mt-3 italic font-mono border-t border-white/5 pt-2">
            "Discipline builds physical momentum."
          </div>
        </div>
      </div>

      {/* NOTIFICATIONS & PUSH PERMISSION BANNER */}
      <div className="bg-zinc-950 border border-white/10 rounded-3xl p-5 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-purple-500/20 text-purple-300">
            <Bell size={20} />
          </div>
          <div>
            <h4 className="font-bold text-sm text-white">System Signal Notifications</h4>
            <p className="text-xs text-white/50">Browser push status: <span className="font-mono text-yellow-400 uppercase font-bold">{pushPermission}</span></p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={requestPushPermission}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition shadow-lg"
          >
            Enable Push Signals
          </button>
          <button
            onClick={sendTestPush}
            className="px-3.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 text-xs font-bold rounded-xl transition"
          >
            Test Audio Push
          </button>
          <button
            onClick={sendTestEmail}
            className="px-3.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 text-xs font-bold rounded-xl transition"
          >
            Test Email
          </button>
        </div>
      </div>

      {/* EDIT PROFILE MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[300] flex items-center justify-center p-4" onClick={() => setShowEditModal(false)}>
          <div className="bg-zinc-950 border border-purple-500/40 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-2 border-b border-white/10">
              <div className="font-black text-lg text-white">Edit Profile Configuration</div>
              <button onClick={() => setShowEditModal(false)} className="text-white/50 hover:text-white"><X size={18} /></button>
            </div>

            <div>
              <label className="text-xs text-white/60 block mb-1 font-mono">Hunter Display Name</label>
              <input 
                value={editName} 
                onChange={(e) => setEditName(e.target.value)} 
                className="w-full bg-black border border-white/10 focus:border-purple-400 rounded-2xl px-4 py-2.5 text-sm text-white focus:outline-none" 
              />
            </div>

            <div>
              <label className="text-xs text-white/60 block mb-1 font-mono">Character Avatar</label>
              <button 
                type="button"
                onClick={() => {
                  setShowEditModal(false);
                  setShowAvatarModal(true);
                }}
                className="w-full flex items-center justify-between bg-black border border-white/10 hover:border-purple-400 rounded-2xl px-4 py-2.5 text-sm text-white transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-900/50 border border-purple-400/50 overflow-hidden flex items-center justify-center shrink-0">
                    <img src={currentAvatarUrl} onError={onImgError()} alt="Avatar" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-xs font-bold text-purple-300">Choose Anime, GoT, Marvel, DC or Upload</span>
                </div>
                <ChevronRight size={16} className="text-white/50" />
              </button>
            </div>

            <div>
              <label className="text-xs text-white/60 block mb-1 font-mono">Hunter Rank Title</label>
              <input 
                value={editTitle} 
                onChange={(e) => setEditTitle(e.target.value)} 
                className="w-full bg-black border border-white/10 focus:border-purple-400 rounded-2xl px-4 py-2.5 text-sm text-white focus:outline-none" 
              />
            </div>

            <div>
              <label className="text-xs text-white/60 block mb-1 font-mono">Primary Focus / Statement</label>
              <input 
                value={editFocus} 
                onChange={(e) => setEditFocus(e.target.value)} 
                className="w-full bg-black border border-white/10 focus:border-purple-400 rounded-2xl px-4 py-2.5 text-sm text-white focus:outline-none" 
              />
            </div>

            <div>
              <label className="text-xs text-white/60 block mb-1 font-mono">Profile Tags</label>
              <div className="flex gap-2 mb-2">
                <input 
                  value={newTagInput} 
                  onChange={(e) => setNewTagInput(e.target.value)} 
                  placeholder="New tag..." 
                  className="flex-1 bg-black border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none" 
                />
                <button onClick={handleAddTag} className="px-3 py-1.5 bg-purple-600 rounded-xl text-xs font-bold text-white">Add</button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {editTags.map((tag, i) => (
                  <span key={i} className="px-2.5 py-0.5 bg-purple-950 border border-purple-400/40 text-purple-200 text-xs rounded-full flex items-center gap-1">
                    #{tag}
                    <button onClick={() => handleRemoveTag(tag)} className="hover:text-red-400"><X size={10} /></button>
                  </span>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-3 border-t border-white/10">
              <button onClick={() => setShowEditModal(false)} className="flex-1 py-2.5 rounded-2xl border border-white/20 text-xs font-bold text-white">Cancel</button>
              <button 
                onClick={handleSaveProfile} 
                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-2xl text-xs shadow-lg shadow-purple-900/40"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HUNTER RANK PRIVILEGES MODAL */}
      {showRankModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[300] flex items-center justify-center p-4" onClick={() => setShowRankModal(false)}>
          <div className="bg-zinc-950 border border-purple-500/40 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-2 border-b border-white/10">
              <div>
                <h3 className="font-black text-lg text-white flex items-center gap-2">
                  <Crown size={18} className="text-yellow-400" />
                  Hunter System Rank Hierarchy
                </h3>
                <p className="text-xs text-white/50">Privileges unlocked based on Level & System XP</p>
              </div>
              <button onClick={() => setShowRankModal(false)} className="text-white/50 hover:text-white"><X size={18} /></button>
            </div>

            <div className="space-y-3">
              {[
                { lvl: "Lv. 1 - 19", name: "HUNTER", desc: "Access to daily quests, journal scripting, and basic habit streak tracking.", active: level < 20 },
                { lvl: "Lv. 20 - 34", name: "SHADOW MONARCH (ASCENDED)", desc: "Unlocks 3D Flip Book Journal, Custom Attributes, and Advanced Fable 5 RPG engine.", active: level >= 20 && level < 35 },
                { lvl: "Lv. 35 - 49", name: "SHADOW MONARCH (ELITE)", desc: "Unlocks Quantum Vision AI analysis, priority audio voiceover guidance.", active: level >= 35 && level < 50 },
                { lvl: "Lv. 50+", name: "LEGENDARY MONARCH", desc: "Godlike alignment. Global Hunter Feed badges and permanent 2x XP multiplier.", active: level >= 50 }
              ].map((r, i) => (
                <div key={i} className={`p-3.5 rounded-2xl border ${r.active ? "bg-purple-900/40 border-purple-400 text-white shadow-lg" : "bg-black/50 border-white/10 text-white/60"}`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-extrabold text-sm text-yellow-300">{r.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10">{r.lvl}</span>
                  </div>
                  <p className="text-xs">{r.desc}</p>
                </div>
              ))}
            </div>

            <button onClick={() => setShowRankModal(false)} className="w-full py-2.5 bg-purple-600 text-white font-bold rounded-2xl text-xs">Close</button>
          </div>
        </div>
      )}

      {/* STAT BREAKDOWN MODAL */}
      {selectedStat && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[300] flex items-center justify-center p-4" onClick={() => setSelectedStat(null)}>
          <div className="bg-zinc-950 border border-purple-500/40 rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-3" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-2 border-b border-white/10">
              <h3 className="font-bold text-base text-white capitalize">{selectedStat.replace("_", " ")} Breakdown</h3>
              <button onClick={() => setSelectedStat(null)} className="text-white/50 hover:text-white"><X size={16} /></button>
            </div>
            
            <p className="text-xs text-white/70 leading-relaxed">
              This metric reflects your continuous discipline, completed goals, and daily system interaction. High momentum increases your overall Dominion Power!
            </p>

            <div className="p-3 bg-black/60 rounded-2xl border border-white/10 font-mono text-xs space-y-1">
              <div className="flex justify-between"><span>Current Value:</span><span className="text-yellow-400 font-bold">Active</span></div>
              <div className="flex justify-between"><span>Weekly Velocity:</span><span className="text-emerald-400">+18%</span></div>
            </div>

            <button onClick={() => setSelectedStat(null)} className="w-full py-2 bg-purple-600 text-white font-bold rounded-xl text-xs">Got It</button>
          </div>
        </div>
      )}

      {/* ACHIEVEMENT INSPECT MODAL */}
      {selectedAchievement && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[300] flex items-center justify-center p-4" onClick={() => setSelectedAchievement(null)}>
          <div className="bg-zinc-950 border border-purple-500/40 rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-4" onClick={e => e.stopPropagation()}>
            <div className="text-center">
              <div className="text-5xl mb-2">{selectedAchievement.icon}</div>
              <h3 className="font-black text-lg text-white">{selectedAchievement.title}</h3>
              <p className="text-xs text-white/60 mt-1">{selectedAchievement.desc}</p>
            </div>

            <div className="p-3 bg-black/60 rounded-2xl border border-white/10 text-xs font-mono space-y-1">
              <div className="flex justify-between"><span>Requirement:</span><span className="text-purple-300 font-bold">{selectedAchievement.req}</span></div>
              <div className="flex justify-between"><span>Progress:</span><span className="text-white">{selectedAchievement.progress}</span></div>
              <div className="flex justify-between"><span>Reward:</span><span className="text-yellow-300 font-bold">{selectedAchievement.reward}</span></div>
            </div>

            <button 
              onClick={() => {
                if (selectedAchievement.unlocked) {
                  notify(`✨ Claimed reward for ${selectedAchievement.title}!`);
                }
                setSelectedAchievement(null);
              }}
              className={`w-full py-2.5 rounded-2xl font-bold text-xs uppercase tracking-wider ${
                selectedAchievement.unlocked 
                  ? "bg-purple-600 text-white hover:bg-purple-500" 
                  : "bg-white/10 text-white/50"
              }`}
            >
              {selectedAchievement.unlocked ? "Claim Reward" : "Locked"}
            </button>
          </div>
        </div>
      )}

      {/* ADD HABIT MODAL */}
      {showAddHabitModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[300] flex items-center justify-center p-4" onClick={() => setShowAddHabitModal(false)}>
          <div className="bg-zinc-950 border border-purple-500/40 rounded-3xl w-full max-w-xs p-5 shadow-2xl space-y-3" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-sm text-white">Add New Habit Tracker</h3>
            
            <input 
              type="text" 
              placeholder="Habit name (e.g., Ice Bath)..." 
              value={newHabitLabel} 
              onChange={(e) => setNewHabitLabel(e.target.value)} 
              className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-400" 
            />

            <div className="flex items-center gap-2">
              <span className="text-xs text-white/60 font-mono">Icon:</span>
              {["🔥", "🧘", "📖", "❄️", "💪", "⚡", "🎯"].map((ic) => (
                <button 
                  key={ic} 
                  onClick={() => setNewHabitIcon(ic)} 
                  className={`p-1.5 rounded-lg text-sm ${newHabitIcon === ic ? "bg-purple-600" : "bg-white/5"}`}
                >
                  {ic}
                </button>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowAddHabitModal(false)} className="flex-1 py-2 rounded-xl border border-white/10 text-xs font-bold text-white">Cancel</button>
              <button onClick={handleAddHabit} className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs">Add Habit</button>
            </div>
          </div>
        </div>
      )}

      {/* AVATAR SELECTION MODAL */}
      {showAvatarModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[300] flex items-center justify-center p-4" onClick={() => setShowAvatarModal(false)}>
          <div className="bg-zinc-950 border border-purple-500/40 rounded-3xl w-full max-w-3xl p-5 sm:p-7 shadow-2xl space-y-5 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="flex justify-between items-start pb-3 border-b border-white/10 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles size={20} className="text-yellow-400" />
                  <h3 className="font-extrabold text-xl text-white tracking-tight">Select Character Avatar</h3>
                </div>
                <p className="text-xs text-white/60 mt-0.5">
                  Choose your legendary avatar from Anime, Game of Thrones, Marvel, DC Universe or upload custom character art!
                </p>
              </div>
              <button onClick={() => setShowAvatarModal(false)} className="text-white/50 hover:text-white p-1 rounded-xl bg-white/5 hover:bg-white/10 transition">
                <X size={20} />
              </button>
            </div>

            {/* Custom File Upload & URL Row */}
            <div className="bg-black/60 border border-white/10 rounded-2xl p-4 space-y-3 shrink-0">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                {/* Upload File */}
                <label className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs cursor-pointer transition shadow-md active:scale-95 shrink-0">
                  <Upload size={15} />
                  <span>Upload Image File</span>
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>

                {/* Paste Image URL */}
                <div className="flex items-center gap-2 w-full sm:flex-1">
                  <div className="relative flex-1">
                    <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                    <input 
                      type="text" 
                      placeholder="Paste Image URL (https://...)" 
                      value={customUrlInput}
                      onChange={(e) => setCustomUrlInput(e.target.value)}
                      className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-purple-400"
                    />
                  </div>
                  <button 
                    onClick={() => {
                      if (customUrlInput.trim()) {
                        handleSelectAvatarUrl(customUrlInput.trim(), "Custom URL");
                        setCustomUrlInput("");
                      }
                    }}
                    className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs shrink-0 transition"
                  >
                    Apply URL
                  </button>
                </div>

                {/* Reset button if avatar set */}
                {profile.avatarUrl && (
                  <button 
                    onClick={() => {
                      handleSelectAvatarUrl("", "");
                    }}
                    className="px-3 py-2 rounded-xl bg-red-500/20 text-red-300 hover:bg-red-500/30 text-xs font-bold transition shrink-0"
                  >
                    Reset Avatar
                  </button>
                )}
              </div>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 shrink-0 scrollbar-none">
              {["All", "Anime & Manga", "Game of Thrones", "Marvel Universe", "DC Universe"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setAvatarCategory(cat)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    avatarCategory === cat
                      ? "bg-purple-600 text-white shadow-lg shadow-purple-900/50 scale-105"
                      : "bg-white/5 text-white/60 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Avatars Grid (Scrollable) */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-6 max-h-[50vh]">
              {AVATAR_PRESETS
                .filter(group => avatarCategory === "All" || group.category === avatarCategory)
                .map((group) => (
                  <div key={group.category} className="space-y-3">
                    <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                      <span className="font-extrabold text-xs uppercase tracking-wider text-purple-300 flex items-center gap-2">
                        {group.category}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30">
                        {group.badge}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {group.avatars.map((av) => {
                        const isSelected = profile.avatarUrl === av.url;
                        return (
                          <div
                            key={av.id}
                            onClick={() => handleSelectAvatarUrl(av.url, av.name)}
                            className={`group relative rounded-2xl p-2.5 bg-black/60 border cursor-pointer transition-all duration-200 flex flex-col items-center text-center space-y-2 hover:scale-[1.03] ${
                              isSelected 
                                ? "border-purple-400 bg-purple-950/40 shadow-xl shadow-purple-900/60 ring-2 ring-purple-400" 
                                : "border-white/10 hover:border-purple-500/50 hover:bg-zinc-900"
                            }`}
                          >
                            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-white/20 group-hover:border-purple-400 transition-colors shadow-md">
                              <img
                                src={resolveImageUrl(av.url)}
                                alt={av.name}
                                onError={onImgError()}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                loading="lazy"
                              />
                              {isSelected && (
                                <div className="absolute inset-0 bg-purple-900/60 backdrop-blur-[1px] flex items-center justify-center">
                                  <Check size={22} className="text-white font-bold" />
                                </div>
                              )}
                            </div>

                            <div className="w-full min-w-0">
                              <div className="text-[11px] font-bold text-white truncate group-hover:text-purple-300 transition-colors">
                                {av.name}
                              </div>
                              <div className="text-[9px] font-mono text-white/50 truncate">
                                {av.universe}
                              </div>
                            </div>

                            <button className={`w-full py-1 rounded-lg text-[10px] font-bold uppercase transition ${
                              isSelected ? "bg-purple-600 text-white" : "bg-white/10 text-white/70 group-hover:bg-purple-600 group-hover:text-white"
                            }`}>
                              {isSelected ? "Selected" : "Equip Avatar"}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end border-t border-white/10 pt-3 shrink-0">
              <button 
                onClick={() => setShowAvatarModal(false)}
                className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg transition"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default ProfileView;

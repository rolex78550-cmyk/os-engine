export type GoalCategory = "wealth" | "business" | "fitness" | "relationship" | "career" | "lifestyle" | "spiritual";

export interface VisionItem {
  id: string;
  userId?: string;
  imageUrl: string;
  caption?: string;
  createdAt: string;
}

export interface Desire {
  id: string;
  title: string;
  progress: number;
  expectedReality: string;
  category: GoalCategory;
  icon: string;
  beliefLevel: number;
  emotionalState: number;
  consistencyScore: number;
  creationDate: string;
  userId?: string;
  blueprint?: GoalBlueprint;
  completed?: boolean;
  notes?: string;
}

export interface GoalBlueprint {
  goal_name: string;
  difficulty: string;
  estimated_duration: string;
  success_probability: number;
  identity_shift: string;
  mindset: string[];
  milestones: BlueprintMilestone[];
  daily_tasks: BlueprintTask[];
  habits: BlueprintHabit[];
  skills: string[];
  affirmations: string[];
  visualization: string;
  obstacles: string[];
  solutions: string[];
  reward_points: number;
  graph_nodes: BlueprintNode[];
  aiGenerated: boolean;
  generatedAt: string;
  fallbackReason?: string;
  modelUsed?: string;
  /** Phase 2: adaptive progress (null until first recalculation) */
  progress?: GoalProgress | null;
}

export interface BlueprintMilestone {
  title: string;
  description: string;
  estimated_days: number;
  difficulty: string;
}

export interface BlueprintTask {
  title: string;
  description: string;
  xp: number;
  priority: string;
  estimated_minutes: number;
  /** Phase 2: proof verification + adaptive completion */
  completed?: boolean;
  completedAt?: string;
  proofText?: string;
  hasProofImage?: boolean;
  verified?: boolean;
  verificationScore?: number;
  verificationFeedback?: string;
  verifiedAt?: string;
}

export interface BlueprintHabit {
  label: string;
  time: string;
  why: string;
}

export interface BlueprintNode {
  id: string;
  title: string;
  type: "identity" | "mindset" | "action" | "habit" | "evidence" | "success";
  connected_to: string[];
  description: string;
  estimated_days: number;
  difficulty: string;
  xp: number;
  completed?: boolean;
}

// ── Phase 2: Adaptive Intelligence ──
// Recalculated by AI when tasks are completed/verified.
export interface GoalProgress {
  momentum: number;          // 0-100, how fast they're progressing
  discipline: number;        // 0-100, consistency of task completion
  execution: number;         // 0-100, proof-backed completion rate
  focus: number;             // 0-100, priority-task completion
  updatedSuccessProbability: number; // 0-100, revised from blueprint baseline
  projectedCompletionDate: string;   // ISO date estimate
  delayRisk: "Low" | "Medium" | "High";
  burnoutRisk: "Low" | "Medium" | "High";
  momentumTrend: "rising" | "stable" | "declining";
  aiInsight: string;         // one-line adaptive coaching line
  recalculatedAt: string;
  /** returned by the endpoint when AI refined the local baseline */
  aiGenerated?: boolean;
  modelUsed?: string;
}

export interface RitualItem {
  id: string;
  label: string;
  /** ISO date string YYYY-MM-DD when this ritual was last marked done */
  lastCompletedDate?: string;
  completedDates?: string[];
  timeOfDay: "morning" | "noon" | "night" | "any";
  icon?: string;
  category?: string;
}

export type Habit = RitualItem;

export function isRitualDoneToday(item: RitualItem, todayStr?: string): boolean {
  let today = todayStr;
  if (!today) {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    today = `${year}-${month}-${day}`;
  }
  return item.lastCompletedDate === today || (item.completedDates || []).includes(today);
}

export interface EnergyPoint {
  day: string;
  belief: number;
  emotion: number;
  action: number;
}

export interface JournalEntry {
  id: string;
  userId?: string;
  title?: string;
  text: string;
  content?: string;
  createdTime: string;
  type: "scripting" | "369" | "gratitude" | "general";
  analysis?: {
    coherenceScore: number;
    primaryFrequency: string;
    coherenceAnalysis: string;
    recalibrationText: string;
    insight?: string;
  };
  images?: string[];
  textColor?: string;
  fontFamily?: string;
  isBold?: boolean;
}

export interface Quest {
  id: string;
  title: string;
  xpValue: number;
  completed: boolean;
  category: "action" | "mindset" | "energy" | "fitness" | "wealth" | "learning" | "charisma";
  description: string;
  
  // FABLE 5 RPG Quest System (fast & powerful)
  questType: "main" | "side" | "boss" | "secret" | "weekly" | "event";
  statRewards: Partial<UserStats>;
  coinReward: number;
  estimatedMinutes: number;
  penaltyOnSkip?: Partial<UserStats>;
  isMandatory?: boolean;
}

export interface UserStats {
  strength: number;
  endurance: number;
  agility: number;
  intelligence: number;
  discipline: number;
  wealth: number;
  charisma: number;
  mindset: number;
}

export const DEFAULT_STATS: UserStats = {
  strength: 5, endurance: 5, agility: 5, intelligence: 5,
  discipline: 5, wealth: 5, charisma: 5, mindset: 5
};

export const RANK_ORDER = [
  "Civilian", "Recruit", "Hunter", "Elite Hunter", 
  "Shadow Soldier", "Shadow Knight", "Monarch Candidate", "Shadow Monarch"
];

export type ManifestActionType =
  | "journal"
  | "affirmation"
  | "visualization"
  | "goal_task"
  | "academy_module"
  | "community_challenge"
  | "ritual";

export interface ManifestActionEvent {
  id: string;
  type: ManifestActionType;
  label: string;
  xp: number;
  createdAt: string;
  date: string;
  goalCategory?: GoalCategory;
}

export interface NotificationPreferences {
  browserPushEnabled: boolean;
  emailRemindersEnabled: boolean;
  promotionalEnabled: boolean;
  ritualRemindersEnabled: boolean;
  achievementAlertsEnabled: boolean;
  emotionalTone: "soft" | "luxury" | "intense";
  quietHoursStart: string;
  quietHoursEnd: string;
  ritualTimes: {
    morning: string;
    noon: string;
    night: string;
    any: string;
  };
}

export interface ProfileState {
  userId?: string;
  email?: string;
  name: string;
  avatarUrl?: string;
  phone?: string;
  alignment: number;
  streak: number;
  belief: number;
  emotion: number;
  action: number;
  coherenceHistory: number[];
  level: number;
  xp: number;
  totalXp: number;
  universeRank: string;
  subscriptionStatus?: string;
  currentPlan?: string;
  createdAt?: string;
  lastLogin?: string;
  onboarded?: boolean;
  lastStreakDate?: string;
  longestStreak?: number;
  streakFreezes?: number;
  activeDays?: string[];
  streakShieldUsedDates?: string[];
  country?: string;

  // Onboarding data (saved from first-time ManifestOnboarding)
  currentCareer?: string;
  currentFitness?: string;
  currentMindset?: string;
  primaryFocus?: string;
  primaryPriority?: string;
  target90Days?: string;
  longTermGoal?: string;
  shortTermGoal?: string;
  obstacles?: string[];
  blockers?: string | string[];
  fears?: string[];
  motivations?: string[];
  dreamLife?: string[];
  coachStyle?: string;
  commitment?: string;
  identityArchetype?: string;
  systemName?: string;
  lifeAreas?: string[];
  actionPlanSteps?: { step: number; title: string; desc: string; timeline: string }[];

  // FABLE 5 RPG CORE SYSTEM
  stats?: UserStats;
  coins?: number;
  rank?: string;
  lastQuestGenerationDate?: string;
  achievements?: string[];
  tags?: string[];
}

// Subscription System Types
export type PlanType = 'monthly' | 'yearly' | 'lifetime';
export type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'cancelled' | 'lifetime' | 'free';

export interface SubscriptionData {
  currentPlan: PlanType | 'free';
  subscriptionStatus: SubscriptionStatus;
  trialStartDate?: string;
  trialEndDate?: string;
  purchaseDate?: string;
  expiryDate?: string;
  lifetimeAccess?: boolean;
  razorpayCustomerId?: string;
  founderSlotUsed?: boolean;
}

export interface PaymentRecord {
  id: string;
  userId: string;
  planType: PlanType;
  amount: number;
  currency: string;
  paymentStatus: 'success' | 'failed' | 'pending';
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  dodoPaymentId?: string;
  createdAt: string;
}

export type CommunityCategory = 'success' | 'journey' | 'gratitude' | 'tip' | 'question';

export interface AcademyLesson {
  id: string;
  moduleId: string;
  stepIndex: number;
  title: string;
  content: string;
  actionPrompt?: string;
  durationMinutes: number;
  icon?: string;
}

export interface AcademyModule {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  accentColor: string;
  estimatedMinutes: number;
  totalLessons: number;
  category: 'method' | 'mindset' | 'spiritual' | 'quantum';
  prerequisites?: string[];
  badgeName: string;
  badgeIcon: string;
}

export interface AcademyProgress {
  userId: string;
  moduleId: string;
  completedLessonIds: string[];
  progressPercent: number;
  startedAt: string;
  lastAccessedAt: string;
  completedAt?: string;
  currentStreak: number;
  maxStreak: number;
}

export interface AcademyBadge {
  id: string;
  name: string;
  icon: string;
  description: string;
  earnedAt: string;
  moduleId?: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
}

export interface CommunityPost {
  id: string;
  authorName: string;
  authorInitial: string;
  authorColor: string;
  title: string;
  content: string;
  category: CommunityCategory;
  tags: string[];
  likes: number;
  likedByMe?: boolean;
  createdAt: string;
  userId?: string;
}

// ---------------------------------------------------------------------------
// GAMIFICATION SYSTEM TYPES
// ---------------------------------------------------------------------------

export type StreakEventType =
  | "ritual"
  | "journal"
  | "quest"
  | "academy_module"
  | "community_challenge"
  | "affirmation"
  | "visualization"
  | "goal_task"
  | "fitness"
  | "meditation"
  | "writing";

export interface StreakEvent {
  id: string;
  userId?: string;
  type: StreakEventType;
  label: string;
  xp: number;
  /** UTC ISO timestamp */
  createdAt: string;
  /** Local calendar date (YYYY-MM-DD) in the user's timezone */
  localDate: string;
  goalCategory?: GoalCategory;
  /** Whether this event extended/maintained the streak */
  streakExtended?: boolean;
}

export interface XpTransaction {
  id: string;
  userId?: string;
  amount: number;
  reason: string;
  type: StreakEventType;
  createdAt: string;
  localDate: string;
}

export type BadgeRarity = "Common" | "Rare" | "Epic" | "Legendary" | "Mythic";
export type BadgeTier = "bronze" | "silver" | "gold" | "platinum";

export interface AchievementBadge {
  id: string;
  title: string;
  description: string;
  rarity: BadgeRarity;
  tier: BadgeTier;
  icon: string;
  earned: boolean;
  earnedAt?: string;
  condition: {
    metric: "streak" | "totalXp" | "consistency" | "academyBadges" | "communityPosts" | "level" | "ritualsCompleted";
    threshold: number;
  };
}

export interface MilestoneReward {
  days: number;
  rarity: BadgeRarity;
  reward: string;
  title: string;
  icon: string;
  freezesGranted?: number;
}

export interface LeaderboardEntry {
  userId?: string;
  name: string;
  streak: number;
  xp: number;
  level: number;
  consistency: number;
  title: string;
  me: boolean;
  rank: number;
  score: number;
}

export interface GamificationState {
  streak: number;
  journeyDays: number;
  longestStreak: number;
  streakFreezes: number;
  lastStreakDate: string | null;
  activeDays: string[];
  level: number;
  xp: number;
  totalXp: number;
  universeRank: string;
  consistency: number;
  percentile: number;
  badges: AchievementBadge[];
  milestones: MilestoneReward[];
  nextMilestone: MilestoneReward;
  previousMilestone: MilestoneReward;
  milestoneProgress: number;
  events: StreakEvent[];
  leaderboard: LeaderboardEntry[];
  myRank: number;
  dailyCompleted: boolean;
  gracePeriodHours: number;
  timezone: string;
  // derived UI helpers
  statusTitle: string;
  levelTitle: { name: string; emoji: string; color: string };
  strongestGoal: string;
  monthlyXp: number;
  topAction: DailyTask & { count: number };
  goalStreaks: { name: string; icon: string; tint: string; streak: number; progress: number; title: string }[];
  dailyTasks: DailyTask[];
  leaderboardLoading: boolean;
  copied: boolean;
  last90: string[];
}

export interface GamificationActions {
  recordAction: (type: StreakEventType, label: string, xp: number, goalCategory?: GoalCategory) => Promise<boolean>;
  completeDailyQuest: (questId: string, questTitle: string, xp: number) => Promise<boolean>;
  claimStreakFreeze: () => void;
  canExtendStreakToday: () => boolean;
  isStreakAtRisk: () => boolean;
  refreshLeaderboard: () => Promise<void>;
  downloadShareCard: (opts: ShareCardOptions) => Promise<void>;
  copyShareCaption: () => Promise<boolean>;
}

export interface ShareCardOptions {
  platform: "instagram" | "tiktok" | "whatsapp" | "x";
  mode: "streak" | "wrapped" | "badge" | "poster";
  badgeId?: string;
}

export interface DailyTask {
  id: string;
  type: StreakEventType;
  label: string;
  xp: number;
  completed: boolean;
  icon: string;
  gradient: string;
  action: "journal" | "rituals" | "goals" | "academy" | "community" | "proof";
  proofType?: "photo" | "text" | "both";
}

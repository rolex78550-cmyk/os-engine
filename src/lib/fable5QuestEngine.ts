// FABLE 5 MODEL — FAST & POWERFUL RPG QUEST ENGINE
// No overthinking. Direct. Production ready.

import { Quest, UserStats, DEFAULT_STATS, RANK_ORDER } from "../types";

export interface QuestGenerationContext {
  primaryFocus?: string;
  primaryPriority?: string;
  target90Days?: string;
  longTermGoal?: string;
  shortTermGoal?: string;
  currentFitness?: string;
  currentMindset?: string;
  obstacles?: string[];
  blockers?: string[] | string;
  fears?: string[];
  motivations?: string[];
  dreamLife?: string[];
  coachStyle?: string;
  commitment?: string;
  identityArchetype?: string;
  level?: number;
  stats?: Partial<UserStats>;
  energy?: number; // 0-100
  mood?: string;
}

const STAT_KEYS: (keyof UserStats)[] = [
  "strength", "endurance", "agility", "intelligence",
  "discipline", "wealth", "charisma", "mindset"
];

// Fast rank calculator
export function calculateRank(xp: number, stats: Partial<UserStats> = {}): string {
  const totalPower = Object.values(stats).reduce((a, b) => a + (b || 0), 0) + (xp / 40);
  
  if (totalPower < 35) return "Civilian";
  if (totalPower < 65) return "Recruit";
  if (totalPower < 110) return "Hunter";
  if (totalPower < 170) return "Elite Hunter";
  if (totalPower < 250) return "Shadow Soldier";
  if (totalPower < 350) return "Shadow Knight";
  if (totalPower < 500) return "Monarch Candidate";
  return "Shadow Monarch";
}

// Fast stat boost
function boostStat(stat: number, amount: number): number {
  return Math.min(100, Math.max(1, Math.round(stat + amount)));
}

// Generate FABLE 5 Quests — DYNAMICALLY TAILORED TO ONBOARDING RESPONSES
export function generateFable5Quests(ctx: QuestGenerationContext): Quest[] {
  const focus = ctx.primaryPriority || ctx.primaryFocus || "wealth";
  const level = ctx.level || 1;
  const stats = { ...DEFAULT_STATS, ...(ctx.stats || {}) };

  const targetGoal = ctx.target90Days || ctx.longTermGoal || "Master 90-Day Vision";
  const archetype = ctx.identityArchetype || "Apex Sovereign";
  
  // Normalize blockers array
  const rawBlockers = ctx.blockers;
  const blockerList: string[] = Array.isArray(rawBlockers) 
    ? rawBlockers 
    : (typeof rawBlockers === "string" && rawBlockers ? [rawBlockers] : ["Procrastination"]);

  const primaryBlocker = blockerList[0] || "Procrastination";

  const quests: Quest[] = [];
  const today = new Date().toISOString().slice(0, 10);

  // === 1. ONBOARDING TARGET QUEST (MANDATORY) ===
  quests.push({
    id: `onboarding-target-${today}`,
    title: `🎯 90-Day Target Sprint`,
    description: `Execute 1 high-impact move toward your onboarding target: "${targetGoal.slice(0, 65)}"`,
    xpValue: 45 + level * 3,
    completed: false,
    category: "action",
    questType: "main",
    statRewards: { discipline: 3, wealth: 2, intelligence: 2 },
    coinReward: 25,
    estimatedMinutes: 20,
    isMandatory: true,
  });

  // === 2. BLOCKER ANNIHILATION PROTOCOL (MANDATORY) ===
  let blockerTitle = `⚡ Defeat Blocker: ${primaryBlocker}`;
  let blockerDesc = `Destroy ${primaryBlocker} today by staying locked into deep work for 25 uninterrupted minutes.`;
  
  if (primaryBlocker.toLowerCase().includes("phone") || primaryBlocker.toLowerCase().includes("addiction")) {
    blockerTitle = `📵 Dopamine Detox Protocol`;
    blockerDesc = `Place phone in another room or focus mode during a 40-minute uninterrupted work sprint.`;
  } else if (primaryBlocker.toLowerCase().includes("procrastination")) {
    blockerTitle = `⚡ Procrastination Shredder`;
    blockerDesc = `Start and complete the #1 task you have been delaying for 15 minutes straight.`;
  } else if (primaryBlocker.toLowerCase().includes("plan") || primaryBlocker.toLowerCase().includes("discipline")) {
    blockerTitle = `📋 Tactical Daily Protocol`;
    blockerDesc = `Write out your 3 non-negotiable execution steps before starting your day.`;
  }

  quests.push({
    id: `onboarding-blocker-${today}`,
    title: blockerTitle,
    description: blockerDesc,
    xpValue: 40 + level * 2,
    completed: false,
    category: "action" as any,
    questType: "main",
    statRewards: { discipline: 4, mindset: 3 },
    coinReward: 20,
    estimatedMinutes: 25,
    isMandatory: true,
  });

  // === 3. ARCHETYPE ALIGNMENT QUEST (MANDATORY) ===
  quests.push({
    id: `onboarding-archetype-${today}`,
    title: `⚔️ ${archetype} Reality Lock`,
    description: `Embody your onboarding identity archetype: Visualize winning your 90-day goal and log 1 win in your Journal.`,
    xpValue: 35,
    completed: false,
    category: "mindset",
    questType: "main",
    statRewards: { mindset: 3, charisma: 2 },
    coinReward: 18,
    estimatedMinutes: 10,
    isMandatory: true,
  });

  // === 4. TAILORED SIDE QUESTS FROM ONBOARDING SELECTIONS ===
  const sidePool = [];

  // Goal / Priority specific side quest
  if (focus === "fitness" || focus.includes("fat") || focus.includes("muscle") || focus.includes("pack")) {
    sidePool.push({
      title: "💪 Physical Apex Protocol",
      desc: "Complete a 20-min bodyweight/cardio activation session & drink 1L water.",
      cat: "fitness",
      stats: { strength: 3, endurance: 2 },
      coins: 15, min: 20
    });
  } else if (focus === "business" || focus === "money" || focus.includes("earn") || focus.includes("job") || focus.includes("saas")) {
    sidePool.push({
      title: "💰 Cashflow & Wealth Strike",
      desc: `Spend 30 mins refining your core revenue offer or skill for: ${targetGoal.slice(0, 40)}`,
      cat: "wealth",
      stats: { wealth: 3, intelligence: 2 },
      coins: 20, min: 30
    });
  } else {
    sidePool.push({
      title: "🚀 Mastery Deep Work Sprint",
      desc: `Work on your primary focus area [${focus}] for 25 mins without distraction.`,
      cat: "learning",
      stats: { intelligence: 3, discipline: 2 },
      coins: 18, min: 25
    });
  }

  // Secondary blocker or fear mitigation side quest
  if (blockerList[1]) {
    sidePool.push({
      title: `🛡️ Shield Upgrade: Eliminate ${blockerList[1]}`,
      desc: `Take 1 active step to eliminate ${blockerList[1]} from your environment today.`,
      cat: "discipline",
      stats: { discipline: 3, mindset: 2 },
      coins: 15, min: 10
    });
  }

  // Always include core side quests
  sidePool.push(
    { title: "🧠 Mindset Refactoring", desc: "Read 10 pages of high-value wisdom or listen to a mentor.", cat: "mindset", stats: { mindset: 2, intelligence: 1 }, coins: 12, min: 15 },
    { title: "👑 Charisma & Presence Drill", desc: "Speak with absolute authority and clarity in all conversations today.", cat: "charisma", stats: { charisma: 3 }, coins: 12, min: 10 }
  );

  sidePool.forEach((t, i) => {
    quests.push({
      id: `side-onboard-${today}-${i}`,
      title: t.title,
      description: t.desc,
      xpValue: 20 + Math.floor(level / 2),
      completed: false,
      category: t.cat as any,
      questType: "side",
      statRewards: t.stats,
      coinReward: t.coins,
      estimatedMinutes: t.min,
      isMandatory: false,
    });
  });

  // === 5. BOSS BATTLE BASED ON ONBOARDING TARGET ===
  quests.push({
    id: `boss-onboarding-${today}`,
    title: `🏆 Boss Battle: Conquer "${targetGoal.slice(0, 45)}"`,
    description: `High-stakes daily boss challenge! Complete your top non-negotiable objective today to prove your commitment.`,
    xpValue: 80 + level * 5,
    completed: false,
    category: "action",
    questType: "boss",
    statRewards: { discipline: 5, mindset: 4, strength: 3 },
    coinReward: 60,
    estimatedMinutes: 35,
    isMandatory: false,
  });

  // === 6. SECRET QUEST ===
  quests.push({
    id: `secret-onboarding-${today}`,
    title: `✨ Echo of the Sovereign`,
    description: `Perform 1 invisible act of pure discipline without telling anyone. Build silent power.`,
    xpValue: 40,
    completed: false,
    category: "mindset",
    questType: "secret",
    statRewards: { mindset: 3, discipline: 2 },
    coinReward: 25,
    estimatedMinutes: 5,
    isMandatory: false,
  });

  return quests;
}

// Apply rewards FAST
export function applyQuestRewards(quest: Quest, currentStats: Partial<UserStats>, currentCoins: number, currentXp: number) {
  const newStats = { ...DEFAULT_STATS, ...currentStats };
  
  // Apply stat rewards
  Object.entries(quest.statRewards || {}).forEach(([key, val]) => {
    const statKey = key as keyof UserStats;
    if (newStats[statKey] !== undefined && typeof val === 'number') {
      newStats[statKey] = boostStat(newStats[statKey], val);
    }
  });

  const newCoins = currentCoins + (quest.coinReward || 0);
  const newXp = currentXp + quest.xpValue;

  return {
    stats: newStats,
    coins: newCoins,
    xp: newXp,
  };
}

// Apply penalty on skip/fail
export function applyQuestPenalty(quest: Quest, currentStats: Partial<UserStats>) {
  const newStats = { ...DEFAULT_STATS, ...currentStats };
  const penalty = quest.penaltyOnSkip || { discipline: -1, mindset: -1 };

  Object.entries(penalty).forEach(([key, val]) => {
    const statKey = key as keyof UserStats;
    if (newStats[statKey] !== undefined && typeof val === 'number') {
      newStats[statKey] = boostStat(newStats[statKey], val); // negative = reduction
    }
  });

  return newStats;
}

// Daily XP Target (simple & powerful)
export function getDailyXpTarget(level: number, stats: Partial<UserStats>): number {
  const base = 120 + level * 15;
  const avgStat = Object.values(stats).reduce((a, b) => a + (b || 0), 0) / 8;
  return Math.floor(base + avgStat * 1.2);
}

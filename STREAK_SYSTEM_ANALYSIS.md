# Manifest OS — Streak Page Gamification System: Analysis & Fix Plan

## 1. Current State Summary
The Streaks page (`src/components/ManifestationStreakSystem.tsx`) is visually rich but functionally **static / demo-grade**. It mixes real user props with fabricated data, fake leaderboards, invented analytics, and broken streak math. This document lists every problem found after code review + research, then describes the fixes applied.

---

## 2. Problems Identified

### A. Streak Logic Bugs (Critical)
| # | Problem | Impact |
|---|---|---|
| 1 | `recordManifestAction` in `App.tsx` can increment the streak multiple times per day because it reads `prev.lastStreakDate` inside a state updater but multiple rapid calls race against each other and the closure is stale. | Streak inflates artificially. |
| 2 | Freeze logic consumes `missedDays` equal to the gap, which is wrong: 1 freeze should protect 1 missed day, but the code subtracts `diffDays - 1` from the freeze count. | Users lose extra freezes or streak resets incorrectly. |
| 3 | `parseLocalDate` uses `new Date(year, month, day)` which treats the input as local midnight, but the input is already `YYYY-MM-DD` from `toLocaleDateString("en-CA")`. This is fine in practice, but mixing date strings and Date objects is fragile. | Hard-to-debug timezone/DST bugs. |
| 4 | Streak is incremented on *every* action, not on “completed at least one daily action”. The streak should be a daily boolean, not an action counter. | 10 rituals in one day = +10 streak days. |
| 5 | No central source of truth for streak state. It lives in `profile.streak`, `profile.lastStreakDate`, `profile.activeDays`, `manifestEvents`, and `rituals`. | Inconsistent, duplicate, and conflicting data. |
| 6 | Day-change detection in `App.tsx` only re-renders but does not re-evaluate streak status. | Streak may stay broken or unbroken after midnight incorrectly. |

### B. Fake / Hardcoded Data (High)
| # | Problem | Impact |
|---|---|---|
| 7 | `leaderboard` array contains hardcoded demo users (`Aarav`, `Mira`, `Zoya`…) mixed with the real user. | Not a real leaderboard; misleads users. |
| 8 | `analytics.consistency` is computed from an arbitrary formula (`activeLast30.length * 2.15 + ...`) rather than actual completion ratio. | Meaningless metric. |
| 9 | `goalStreaks` are fabricated from `eventDates.length` or fallback `profile.streak - index * 3`. | Goal streaks are not real. |
| 10 | Badges are derived from local computed values only; no persistence or event history. | Achievements vanish on refresh / re-login. |
| 11 | Milestone progress is based on current streak only, not on a durable achievement record. | No milestone claim/reward moment. |
| 12 | Wrapped report cards are generated from mocked stats, not actual monthly XP or activity. | Social share is fake. |

### C. Missing Gamification Backend (High)
| # | Problem | Impact |
|---|---|---|
| 13 | No backend collection for `streak_events`, `achievements`, `xp_transactions`, or `leaderboard`. | Cannot scale across users or devices. |
| 14 | No real-time leaderboard from Firestore. | Cannot show “Top X%” accurately. |
| 15 | No reward delivery mechanism for streak freezes or badges. | Milestones feel empty. |
| 16 | No per-user timezone storage; streaks use device local time without IANA timezone. | Travel/DST breaks streaks. |

### D. UX / Task System Gaps (Medium)
| # | Problem | Impact |
|---|---|---|
| 17 | “Daily Action Matrix” buttons only navigate; they do not mark tasks as done or award XP. | Page is not a task system. |
| 18 | No clear “daily quest” completion tied to streak. | Streak and quests are disconnected. |
| 19 | No visual feedback when a freeze is consumed or earned. | Users don’t understand why streak changed. |
| 20 | Share cards are SVG-only; no PNG/JPEG export, no Web Share API fallback, no native share. | Hard to post on Instagram/TikTok. |
| 21 | No streak recovery / grace period after midnight. | Rage-quit risk. |

### E. Code Quality Issues (Medium)
| # | Problem | Impact |
|---|---|---|
| 22 | `ManifestationStreakSystem.tsx` is ~900 lines, mixes UI, analytics, SVG generation, and business logic. | Hard to maintain/test. |
| 23 | `generateCardSvg` runs inline and produces a huge SVG string on every render. | Performance cost, poor caching. |
| 24 | TypeScript types are inconsistent (`academyProgress` typed as `Record<string, AcademyProgress>` in props but `moduleLessonCount` is hardcoded). | Type errors and runtime bugs. |
| 25 | `useMemo` dependencies are too broad and recompute on every action. | Wasted renders. |

---

## 3. Research-Driven Best Practices Applied

From industry analysis (Duolingo, Calm, TickTick, Strava, Trophy, Plotline):

1. **Event-based streaks** — store timestamped events, derive streak from event history, not a counter. This enables accurate historical queries, calendars, and recovery. [2][4]
2. **Per-user timezone** — store IANA timezone, convert UTC timestamps to local calendar dates at evaluation time. [2][3]
3. **Loss-aversion + grace** — streak freezes, grace periods around midnight, and milestone celebrations reduce churn. [2][5]
4. **Meaningful actions > volume** — weight project/quest completions more than trivial actions; the streak is a daily boolean, not an action counter. [1]
5. **Real-time leaderboards** — aggregate from actual user data, mix with percentile ranking for social motivation. [2]
6. **Multi-layer persistence** — localStorage for offline resilience + Firestore for cross-device sync. [1]

---

## 4. Fix Plan (Implemented)

### 4.1 Core Architecture
- Create `src/hooks/useGamification.ts` — single source of truth for:
  - streak evaluation,
  - XP/level progression,
  - badge/achievement unlocking,
  - freeze ledger,
  - action events,
  - daily task completion,
  - leaderboard percentile.
- Create `src/lib/gamification.ts` — pure helper functions for streak math, timezone handling, badge rules, and milestone rewards.
- Extend `src/types.ts` with `StreakEvent`, `XpTransaction`, `AchievementBadge`, `GamificationState`, `LeaderboardEntry`.

### 4.2 Streak Engine
- Store `streak_events` in Firestore (`users/{uid}/streak_events`) with UTC ISO timestamp and local date.
- Evaluate streak from events each day:
  - If an event exists for today → streak is already extended.
  - If last event was yesterday → extend today.
  - If gap > 1 day → check available freezes; consume 1 freeze per missed day, otherwise reset to 1.
- Add a configurable **grace period** (default 4 hours after local midnight) so late-night actions still count for the previous day.

### 4.3 Task System Integration
- A “daily action” counts as completed if the user finishes at least one ritual, one quest, one journal, or one academy module.
- The Streaks page shows a live task checklist with completion state and one-tap completion.
- Completing a task records a `streak_event` and awards XP.

### 4.4 Leaderboard & Social
- Leaderboard now reads from Firestore `users` collection, ordered by `streak`, `totalXp`, `level`.
- Percentile is computed from the real leaderboard (or a minimum sample + the user).
- Share cards can be exported as SVG or PNG (via canvas) and use Web Share API when available.

### 4.5 App Integration
- `App.tsx` uses `useGamification` instead of scattered `recordManifestAction`/`awardXP` logic.
- All handlers (`handleToggleRitual`, `handleQuestComplete`, `handleJournalSubmit`, etc.) route through the gamification hook.
- Removed duplicate state updates and stale-closure bugs.

### 4.6 UI Updates
- `ManifestationStreakSystem.tsx` consumes computed gamification state.
- Removed hardcoded demo users; leaderboard is dynamic.
- Added real freeze balance, claim/earn freeze UI, and milestone reward notifications.
- Added a “Today’s Quests” panel with progress and completion buttons.

---

## 5. Validation Steps
- `npm run lint` passes.
- Streak advances only once per day, no matter how many actions.
- Freeze consumes exactly 1 per missed day within grace period.
- Leaderboard and percentile update from Firestore.
- Share cards download in SVG and PNG formats.
- LocalStorage + Firestore sync works for logged-in and guest users.

---

*Document generated: 2026-06-16*

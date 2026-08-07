# 🎮 RPG PROGRESSION SYSTEM — DATABASE ARCHITECTURE (STEP 2)

> Constraints discovered in Step 1:
> - Firebase Admin has NO service account (only `projectId`) → server cannot write to other users' docs.
> - All writes happen **client-side via authenticated SDK**.
> - XP / Level / streak engine already exists and works. We **extend, never replace**.
> - Goal system is **off-limits** (untouched).

---

## 2.0 DESIGN PRINCIPLES

1. **Additive only** — extend `users/{uid}`, never rewrite existing fields. Old code keeps working.
2. **Player = User** — no separate `players` collection. Identity is the user doc.
3. **One card per user** — the Player Card is a *view* of the user's stats, not a separate document.
4. **Derived state stored** — Rank/Score/Coins are computed but denormalized onto the user doc for fast reads + native Firestore `orderBy` (leaderboard).
5. **Each user writes only their own docs** — works with the no-service-account constraint + Firestore security rules.
6. **Real leaderboard via Firestore native queries** — `orderBy(playerScore).limit(100)`. No admin SDK needed.
7. **Backward-compatible migration** — existing users auto-placed into a rank from their current XP.

---

## 2.1 PLAYER SYSTEM

A "Player" IS a user. We extend `users/{uid}` with player fields.

### New fields on `users/{uid}` (additive)

| Field | Type | Default | Purpose |
|---|---|---|---|
| `playerNumber` | int | null → assigned once | Unique sequential card # (e.g. #00042). Assigned on first RPG touch. Never changes. |
| `coins` | int | 0 | Spendable currency balance |
| `playerScore` | int | derived | Composite sortable metric → drives global leaderboard |
| `monthlyScore` | int | derived | Resets each season → drives monthly leaderboard |
| `rank` | string | "Iron" | Current rank tier |
| `rankTierIndex` | int | 0 | 0–8 numeric (Iron=0 … Legend=8) for sorting |
| `highestRank` | string | "Iron" | Best rank ever achieved |
| `highestRankIndex` | int | 0 | for "career best" display |
| `rankHistory` | array | [] | `[{rank, tierIndex, achievedAt}]` — promotion log |
| `cardEvolutionStage` | int | 1 | 1–9, maps to rank tier (character art tier) |
| `cardFrame` | string | "default" | Equipped cosmetic frame id |
| `cardAccent` | string | "amber" | Equipped theme/accent |
| `titles` | array | [] | Earned title ids (e.g. `["flame-keeper","century-alchemist"]`) |
| `equippedTitle` | string | null | Currently equipped title |
| `seasonId` | string | "YYYY-MM" | Current season the monthly score belongs to |
| `seasonClaimed` | object | {} | `{ "2026-06": true }` — reward claim log |
| `joinDate` | string | ISO date | Player journey start |
| `rpgInitialized` | bool | false | One-time init flag |
| **Future AI** | | | |
| `aiProfile` | object | null | reserved — AI coaching data |
| `aiInsights` | array | [] | reserved — recent AI insights |
| `predictions` | object | null | reserved — rank-up / completion predictions |

> Existing fields kept untouched: `xp`, `totalXp`, `level`, `streak`, `longestStreak`, `streakFreezes`, `activeDays`, `universeRank`, `name`, `email`, etc.

---

## 2.2 XP SYSTEM (REUSE — zero changes)

Already works. `recordAction(type, label, xp)` writes `streak_events` + `xp_transactions` and updates `xp`/`totalXp`/`level` via `addXp()`. The RPG **visualizes** this XP — it does not replace it.

Curve (unchanged): each level requires `level × 100` XP.

---

## 2.3 LEVEL SYSTEM (REUSE + extend ladder)

Level number stays as-is. We only add a richer cosmetic ladder for display. Existing users keep their level.

### RPG Level Titles (cosmetic overlay — does NOT replace `universeRank`)

| Level | Title |
|---|---|
| 1–4 | Awakening |
| 5–9 | Ascendant |
| 10–19 | Adept |
| 20–29 | Veteran |
| 30–49 | Elite |
| 50–74 | Mythic |
| 75–99 | Transcendent |
| 100+ | Apex |

Stored as constants in code (not DB). Pure function `getRPGLevelTitle(level)`.

---

## 2.4 COINS SYSTEM (NEW)

Cosmetic currency. Earned alongside XP, spent on frames/themes/card evolution.

### Earning rules
| Trigger | Coins |
|---|---|
| Any XP action | `floor(xp × 0.5)` (half of XP gained) |
| Level up | `level × 10` bonus |
| Rank up | `tierIndex × 100` bonus |
| Streak milestone (7/14/30…) | milestone `× 20` |
| Daily first-action (login) | 5 |
| Goal verified by AI | 25 |

### Ledger collection — `users/{uid}/coin_transactions/{txId}`
```
{
  id, userId, amount (int, +/-), reason (string),
  type: "earn" | "spend" | "bonus",
  source: "action" | "levelup" | "rankup" | "milestone" | "shop",
  createdAt, localDate
}
```
Balance = `sum(amount)`. Mirrors the existing `xp_transactions` pattern exactly → consistent + auditable.

### Spending (future shop — Phase: later)
Frames, themes, card accent colors, character art variants. Shop reads `coins`; purchase writes a negative `coin_transactions` + sets `cardFrame`. Balance can never go negative (enforced client-side + rule check).

---

## 2.5 PLAYER SCORE (NEW — derived, denormalized)

Composite sortable metric → the **only number the leaderboard sorts by**. Recomputed on key events (XP gain, rank change, goal completion) and written to the user's own doc + leaderboard entry.

### Formula
```
playerScore = totalXp
            + (level × 50)
            + (streak × 30)
            + (consistency × 10)
            + (rankTierIndex × 250)
            + (verifiedGoals × 100)
```
`monthlyScore` = same formula but using **this-season** deltas (monthlyXp, monthly streak days, etc.).

Computation is a pure function: `computePlayerScore(profile, stats)`. Stored only for read performance.

---

## 2.6 RANK SYSTEM (NEW — 9 tiers)

Ranks are **derived from `playerScore` thresholds** (recomputed, then stored for sort/filter).

| # | Rank | Tier Index | Min Score | Color | Card Stage | Unlock Reward |
|---|---|---|---|---|---|---|
| 1 | Iron | 0 | 0 | #8B8B8B | 1 | Starter card |
| 2 | Bronze | 1 | 800 | #CD7F32 | 2 | Bronze frame |
| 3 | Silver | 2 | 2,500 | #C0C0C0 | 3 | Silver frame + title "Rising" |
| 4 | Gold | 3 | 6,000 | #FFD700 | 4 | Gold frame + title "Adept" |
| 5 | Platinum | 4 | 12,000 | #E5E4E2 | 5 | Holographic card + title "Elite" |
| 6 | Diamond | 5 | 22,000 | #B9F2FF | 6 | Diamond shine + title "Mythic" |
| 7 | Master | 6 | 38,000 | #A855F7 | 7 | Master aura + title "Ascendant" |
| 8 | Grandmaster | 7 | 60,000 | #22D3EE | 8 | GM hologram + title "Sovereign" |
| 9 | Legend | 8 | 100,000 | #F59E0B | 9 | Legendary card + title "Legend" |

Thresholds are constants: `RANK_TIERS[]`. Pure function `getRankForScore(score)` returns the tier. On tier increase → **RankPromotionOverlay** fires + `rankHistory` appended + `coins` bonus granted + `cardEvolutionStage` updated.

### Rank History shape (on user doc)
```
rankHistory: [
  { rank: "Iron", tierIndex: 0, achievedAt: "2026-06-01T..." },
  { rank: "Bronze", tierIndex: 1, achievedAt: "2026-06-10T..." }
]
```

---

## 2.7 PREMIUM PLAYER CARD (ONE per user, evolves forever)

**Not a separate document.** The card is a *live view* of the user's stats. It renders from:
- `playerNumber` (unique, forever)
- `name`, `rank`, `rankTierIndex`, `level`, `xp`/`totalXp`
- `cardEvolutionStage` (1–9 → character art tier)
- `cardFrame`, `cardAccent`
- current goal + goal progress % (read live from `desires/`)
- `equippedTitle`

**Card evolution** = `cardEvolutionStage` increments on rank-up. Same physical card, new art/glow/frame. Never collectible, never replaced. This satisfies "one card, evolves forever."

`playerNumber` assignment (once): on first RPG open, if `playerNumber` is null, generate `#00001 + (count)` — but counting docs server-side needs admin. **Workaround without service account:** use a deterministic unique number = `parseInt(uid.slice(-6), 36) % 1000000`, zero-padded → `#004823`. Unique-enough, no server needed, no collisions in practice. (Optional: a Cloud Function later for true sequential.)

---

## 2.8 REWARDS SYSTEM

Three layers:

### A. Earnable rewards (config in code, state on user doc)
| Type | Examples | Stored where |
|---|---|---|
| XP | via existing engine | `xp_transactions` |
| Coins | via coin engine | `coin_transactions` |
| Titles | "Flame Keeper", "Century Alchemist", rank titles | `users/{uid}.titles[]` + `equippedTitle` |
| Badges | REUSE existing `AchievementBadge` system | computed from rules |
| Frames | unlock by rank | `cardFrame` + `rewards_claimed` |
| Themes | unlock by rank/coins | `cardAccent` + `rewards_claimed` |
| Card evolution | on rank-up | `cardEvolutionStage` |

### B. Claimed rewards ledger — `users/{uid}/rewards_claimed/{rewardId}`
```
{ id, type: "frame"|"title"|"theme"|"bonus", name, unlockedAt, source: "rank"|"season"|"shop" }
```

### C. Reward config (constants in code — not DB)
`RANK_REWARDS`, `MILESTONE_REWARDS`, `TITLE_RULES`. Keeps DB lean, easy to tune.

---

## 2.9 MONTHLY LEADERBOARD (the hard part — solved)

**Problem:** No service account → can't aggregate all users server-side.
**Solution:** Each user writes ONE leaderboard doc. Firestore native `orderBy + limit` does the ranking. Scales to 10k+ users cheaply.

### New collection — `leaderboard/{uid}` (one doc per user)
```
{
  uid, name, playerNumber, avatarEmoji,
  level, rank, rankTierIndex,
  playerScore,            // global, all-time
  monthlyScore,           // current season
  seasonId: "2026-06",    // which season monthlyScore belongs to
  streak, consistency,
  updatedAt
}
```
**Rules:** owner can write only their own doc; everyone can read.

### Queries (all native, indexed)
- **Global:** `leaderboard` `orderBy(playerScore, desc) limit(100)`
- **Monthly:** `leaderboard` `where(seasonId, ==, current) orderBy(monthlyScore, desc) limit(100)` (1 composite index)
- **Friends:** `leaderboard` `where(uid, in, friendUids) orderBy(playerScore, desc)`
- **"My rank":** client computes position via top-N scan or shows percentile (existing `computePercentile` reused).

### When is it written?
On every XP/score change, the same client write that updates `users/{uid}.playerScore` also writes `leaderboard/{uid}`. One extra cheap write per action. Debounced (max once per ~2 min or on level/rank change).

---

## 2.10 REWARD DISTRIBUTION (monthly)

**Problem:** Server can't write coins/frames to the top-N *other* users (no service account).
**Solution — Claim model (client-side, fair):**
1. At month rollover, a Vercel cron `/api/rpg/close-season` (CRON_SECRET protected) writes a `seasons/{YYYY-MM}` doc = top 100 snapshot (read-only, it CAN read + write its own doc).
2. When any user opens the leaderboard, if `seasonClaimed[prevSeason]` is false AND their `uid` is in that season's top-100, they see a **"Claim Season Reward"** banner.
3. Claim writes coins + frame + title to **their own** user doc + `rewards_claimed` + sets `seasonClaimed`. Fully client-side, no cross-user writes.

### Monthly reward pool
| Place | Reward |
|---|---|
| #1 | 5,000 coins + "Season Champion" title + exclusive frame |
| #2–3 | 2,500 coins + "Podium" title + frame |
| #4–10 | 1,000 coins + "Top 10" title |
| #11–50 | 500 coins + "Elite" badge |
| #51–100 | 250 coins |

Config: `SEASON_REWARDS[]` constant. Tunable.

---

## 2.11 FUTURE AI COMPATIBILITY

Reserved fields (all nullable, ignored by current code):
- `users/{uid}.aiProfile` — { playStyle, strengths, weaknesses, coachingTone }
- `users/{uid}.aiInsights[]` — last N generated insights
- `users/{uid}.predictions` — { nextRankEta, burnoutRisk, suggestedFocus }

A future `/api/rpg/ai-coach` endpoint reads `streak_events` + `coin_transactions` + player fields → generates insights (same pattern as existing Gemini endpoints). Structure is ready; AI plugs in later without schema changes.

---

## 2.12 FULL COLLECTIONS MAP

```
users/{uid}                       ← EXTENDED (player fields added)
  ├─ desires/              🔒 GOALS — UNTOUCHED
  ├─ rituals/              (existing)
  ├─ journal/              (existing)
  ├─ vision_board/         (existing)
  ├─ academy_progress/     (existing)
  ├─ streak_events/        ★ REUSED — XP history (RPG reads this)
  ├─ xp_transactions/      ★ REUSED — XP ledger
  ├─ coin_transactions/    🆕 NEW — coin ledger
  └─ rewards_claimed/      🆕 NEW — unlocked cosmetics log

leaderboard/{uid}                 🆕 NEW — per-user global+monthly entry

seasons/{YYYY-MM}                 🆕 NEW — closed-season snapshot (written by cron)
```

No existing collection is removed or restructured. Only **additive**.

---

## 2.13 RELATIONSHIPS

```
User ──1:1── Player          (same doc)
Player ──1:1── PlayerCard    (view, not a doc)
Player ──1:N── CoinTransaction
Player ──1:N── RewardClaimed
Player ──1:1── LeaderboardEntry
Player ──1:N── RankHistoryEntry  (array on doc)
Goal completion ──→ streak_event ──→ (XP + Coins + Score + maybe Rank-up)  [cascade]
Rank ──N:1── Player          (derived from score)
Season ──1:N── LeaderboardSnapshot
```

---

## 2.14 SECURITY RULES (additions)

Extend `firestore.rules` with:
```js
// Player fields — owner read/write own doc only (already covered by user rule)
// Leaderboard — owner writes own entry, all signed-in read
match /leaderboard/{uid} {
  allow read: if isSignedIn();
  allow write: if isOwner(uid) && incoming().uid == request.auth.uid;
}
// Coin + reward ledgers — owner only
match /users/{userId}/coin_transactions/{id} {
  allow read, write: if isOwner(userId) && incoming().userId == request.auth.uid;
}
match /users/{userId}/rewards_claimed/{id} {
  allow read, write: if isOwner(userId) && incoming().userId == request.auth.uid;
}
// Seasons — read for all signed-in; write only via admin/cron (no client write)
match /seasons/{seasonId} {
  allow read: if isSignedIn();
  allow write: if false; // cron writes via separate admin path
}
```

### Trust model (honest trade-off)
Without a service account, coins/score/rank are **client-derived and written by the owner**. A technically-savvy user *could* inflate them. This matches the **existing** pattern (streak/XP already work this way) and is acceptable for this app's scale & audience. Mitigations:
- Score is **derived from XP** (which is derived from `streak_events`) — faking score alone looks inconsistent.
- Anti-cheat Cloud Function can be added later to validate `coin_transactions` against events. Schema is ready.

---

## 2.15 SCALABILITY

- Leaderboard reads = `limit(100)` → cheap, indexed, fast at any scale.
- Score updates debounced (≤1 write / 2 min / user) → write-amplification controlled.
- Monthly season = separate `where` clause, not a new collection scan.
- Coin/XP ledgers capped (last 500 events kept, like existing pattern).
- Denormalized score avoids reading full event history for ranking.
- No cross-user writes → no contention, no admin dependency.

---

## 2.16 MIGRATION (existing users — automatic)

On first RPG page open, if `rpgInitialized !== true`:
1. Compute `playerNumber` (deterministic from uid).
2. Compute `playerScore` from existing XP/level/streak.
3. Derive `rank` + `rankTierIndex` from score.
4. Set `cardEvolutionStage` = tierIndex + 1.
5. Set `coins` = `floor(totalXp × 0.5)` (retroactive coin grant for past XP).
6. Set `joinDate`, `seasonId`, `rpgInitialized = true`.
7. Write `leaderboard/{uid}`.

**Result:** an existing user with 3,000 XP instantly becomes a Bronze/Silver player with coins — no data loss, full retroactive credit.

---

## 2.17 SUMMARY — Reuse vs New vs Untouched

| ✅ REUSE | 🆕 NEW | 🔒 UNTOUCHED |
|---|---|---|
| XP engine (`addXp`) | `coins`, `coin_transactions` | Goal system (`desires`) |
| Level system | `playerScore`, `monthlyScore` | GoalsView, blueprint, proof |
| `streak_events`, `xp_transactions` | Rank system (9 tiers) | Journal, Academy, Community |
| `recordAction()` | `leaderboard/{uid}` | Vision Board, Profile |
| Badge rules | `rewards_claimed` | Auth, payments, trial |
| `computePercentile` | `seasons/{YYYY-MM}` | Gamification data layer |
| Share-card SVG gen | Player Card fields | Dashboard (link only) |
| Consistency/streak math | AI-reserved fields | Firestore rules (extended, not broken) |

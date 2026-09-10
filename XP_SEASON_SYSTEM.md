# XP Season System — 16,500 XP / level + rolling 30-day reset

## The rule

| | |
|---|---|
| XP per task | **50** |
| Daily tasks | **11** → 550 XP / perfect day |
| XP per level | **16,500** (= 11 × 50 × 30) → one perfect month = exactly +1 level |
| Season length | **30 days, rolling per user** (starts the first time the user's profile loads) |
| What resets | `totalXp` / `xp` (season XP) → **0** |
| What is kept | `lifetimeXp`, `level`, rank, coins, streak |

## Firestore fields on `users/{uid}`

| Field | Meaning |
|---|---|
| `totalXp`, `xp` | XP earned in the **current** 30-day season. Resets to 0. Leaderboard "This Season" ranks on this. |
| `lifetimeXp` | XP across **all** seasons. Never resets. `level = floor(lifetimeXp / 16500) + 1`. |
| `xpCycleStart` | ISO date the current season began. Season ends 30 days later. |
| `lastXpReset` | ISO date of the last reset. |
| `xpSeasonsCompleted` | Count of finished seasons. |
| `users/{uid}/xp_seasons/{YYYY-MM-DD}` | Archive of each finished season: `cycleStart`, `cycleEnd`, `xpEarned`, `levelAtEnd`, `lifetimeXpAtEnd`. |

Legacy docs (no `lifetimeXp` / `xpCycleStart`) are migrated automatically on first load:
`lifetimeXp` is seeded from `totalXp`, level is re-derived on the new curve, and the 30-day clock starts.

## Where the logic lives

- `src/lib/xpSeason.ts` — **single source of truth**: constants, level math, `planCycleReset()`, `buildResetPatch()`. Pure functions, shared by client + server.
- `src/hooks/useXpSeasonReset.ts` — client-side: mounted in `App.tsx`; checks on load + every minute, resets inside a Firestore transaction (no double reset across tabs).
- `server.ts` → `GET|POST /api/xp/season-rollover` — server-side cron for users who don't open the app. Auth: `Authorization: Bearer <CRON_SECRET>` (or admin ID token). `?dryRun=1` to preview. Scheduled every 6h in `vercel.json`.
- `server.ts` → `GET /api/xp/config` — public JSON of the current rules.

## Every XP award now writes both counters

`totalXp`/`xp` (+season) **and** `lifetimeXp` (+lifetime), and `level` is recomputed from lifetime XP.
Touched award sites: `TaskListView` (AI proof), `SoloDominion` (task tracking, missions, boss, streak bonus, daily claim), `App.tsx` (affirmation bridge), `useAppLogic` (Fable5 quests), `useGamification` (`addXp`).

## Deploy checklist

1. Set `CRON_SECRET` in Vercel env (Vercel Cron sends it automatically as the Bearer token).
2. Deploy — `vercel.json` already contains the cron: `0 */6 * * *` → `/api/xp/season-rollover`.
3. Optional sanity check: `curl -H "Authorization: Bearer $CRON_SECRET" "https://<host>/api/xp/season-rollover?dryRun=1"`.

No composite Firestore indexes are needed (single-field `orderBy("lifetimeXp")` and `where("xpCycleStart","<=")` use automatic indexes).

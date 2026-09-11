# Daily Task Proof System (server-verified)

Every Solo Dominion daily task is worth a flat **50 XP**, awarded **only by the
server**, **once per task per day**. The client can no longer write XP.

## Proof modes

| Mode     | Tasks                                                                                   | How it is proven                                                                                  |
|----------|-----------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| `camera` | writing, gratitude, script369, pushup, plank, crunch, squat, sprint, dress               | Live in-app photo (no gallery upload) → Gemini vision audit on the server → score ≥ 60 required     |
| `flips`  | affirmation                                                                             | Existing 10-card-read bridge in `App.tsx`; when 10 reads are reached it calls the claim endpoint  |
| `honor`  | water                                                                                   | One tap = done (honor system), still once per day and still server-recorded                       |

Catalog (rules, audit prompts, thresholds): `src/lib/taskCatalog.ts`
(`PROOF_PASS_SCORE = 60`, `MAX_PROOF_ATTEMPTS_PER_DAY = 5`, `CLAIM_TIMEZONE = Asia/Kolkata`).

## API

### `POST /api/tasks/claim`
Headers: `Authorization: Bearer <Firebase ID token>`
Body: `{ taskId, imageBase64? }` (JPEG data-URL or raw base64 for camera tasks)

Server flow:
1. Verify the Firebase token → `uid` (401 `AUTH_REQUIRED` otherwise).
2. "Today" = server date in `Asia/Kolkata` — the device clock is irrelevant.
3. Claim doc `users/{uid}/task_claims/{YYYY-MM-DD}_{taskId}`
   - already verified → **409 `ALREADY_CLAIMED`** (no double XP)
   - camera attempts ≥ 5 → **429 `ATTEMPTS_EXHAUSTED`**
4. Proof
   - camera: image required (400 `IMAGE_REQUIRED` / `IMAGE_TOO_SMALL`), sha256 of the image is
     checked against all previous claims (422 `IMAGE_REUSED`), then Gemini audits it with the
     task-specific prompt. The pass threshold is enforced on the server; the model's own
     `verified` flag is advisory only.
   - **Fail-closed:** no Gemini key / quota exhausted / model error → **503 `AI_UNAVAILABLE`**,
     the attempt is *not* counted and *no* XP is awarded. Never auto-pass.
5. Verified → one Firestore transaction writes the claim **and** the XP
   (`totalXp`/`xp` season XP, `lifetimeXp`, `level = floor(lifetimeXp / 16500) + 1`).

Responses:
- `200 { verified: true, xpAwarded, score, feedback, flags, newLevel, leveledUp, seasonXp, lifetimeXp }`
- `200 { verified: false, score, feedback, flags, attemptsLeft }` (AI rejected the photo)
- `4xx/5xx { error: CODE, message }` as above

### `GET /api/tasks/today`
→ `{ date, claims: { [taskId]: { verified, attempts, score, feedback } }, maxAttempts, xpPerTask }`
Drives the task list (done / locked badges, attempts left, last AI feedback).

## Client

- `src/lib/taskClaimApi.ts` — `claimTask()`, `fetchTodayClaims()`, image compression.
- `TaskListView.tsx` — catalog-driven list; routes camera → `TaskProofCamera`, flips → affirmation
  hub, honor → direct claim. Refreshes on the `manifest_task_claimed` window event and every 60 s.
- `TaskProofCamera.tsx` — live camera only, submits to the server, shows the verdict, attempts left.
- `App.tsx` affirmation bridge — calls `claimTask("affirmation")` after 10 reads.

Removed: motion-sensor / timer / counter trackers (`WorkoutTracker`, `PushupMotionTracker`,
`TaskTrackingView`, `workoutSensor.ts`), gallery upload, client-side XP writes for tasks, the
"+50 / +200 XP" demo buttons in the profile.

## Firestore rules (`firestore.rules`)

- `users/{uid}`: a client may **never increase** `totalXp`, `xp`, `lifetimeXp` or `level`.
  Allowed client writes are: unchanged values, zeroing (season reset / profile reset), a one-time
  `lifetimeXp` seed on legacy docs (≤ existing XP), and `level` only when it matches
  `lifetimeXp` (16,500 per level). New docs must start at 0 XP / level 1.
- `users/{uid}/task_claims/*`: owner read-only, **no client writes**.
- `users/{uid}/xp_seasons/*`: owner read, append-only.
- Legacy client XP writers (SoloDominion legacy missions/boss/streak/daily-claim,
  `useAppLogic.handleQuestComplete`) are now rejected by rules and fail silently in their
  existing try/catch blocks — they are non-blocking and are candidates for removal/migration
  to server endpoints.

Test suite (Firestore emulator, 45 cases covering every real client write path):
```
npm i -D firebase-tools @firebase/rules-unit-testing firebase
npx firebase emulators:exec --only firestore --project demo-rules-test \
  "node scripts/firestore-rules.test.mjs"
```
**Deploy the rules** after merging: `npx firebase deploy --only firestore:rules`
(rules are not deployed by Vercel).

## Legacy endpoints
`/api/goals/verify-proof` and `/api/missions/verify-proof` are also fail-closed now
(503 `AI_UNAVAILABLE` instead of auto-pass) but they still award nothing themselves; the
Solo Dominion legacy missions UI that calls them can no longer persist XP because of the rules.

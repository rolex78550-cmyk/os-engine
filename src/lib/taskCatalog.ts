// ============================================================
// TASK CATALOG — single source of truth for the 11 daily tasks,
// how each one is PROVEN, and the AI audit prompt for camera tasks.
//
// Shared by the client (TaskListView / TaskProofCamera UI) and the
// server (/api/tasks/claim) so the rules can never drift apart.
//
// Proof modes:
//   "camera"  → live photo → Gemini vision audit → server awards XP
//   "flips"   → Affirmation Hub: read 10 cards (bridge in App.tsx)
//   "honor"   → one tap, no proof (used only for water)
// ============================================================

export type TaskId =
  | "affirmation"
  | "writing"
  | "gratitude"
  | "script369"
  | "pushup"
  | "plank"
  | "crunch"
  | "squat"
  | "sprint"
  | "water"
  | "dress";

export type ProofMode = "camera" | "flips" | "honor";

export interface TaskSpec {
  id: TaskId;
  title: string;
  jpLabel: string;
  icon: string;
  image: string;
  description: string;
  /** What ONE round of this task is. Every task = exactly 1 round, claimable once per day. */
  goal: string;
  rank: "E" | "D" | "C" | "B" | "A";
  proofMode: ProofMode;
  /** Shown as a checklist above the camera. */
  rules: string[];
  /** Which camera to open first. */
  camera: "environment" | "user";
  /** Task-specific audit instructions injected into the server prompt. */
  audit: string;
}

/** Minimum AI score to pass. Enforced on the SERVER, not just in the prompt. */
export const PROOF_PASS_SCORE = 60;

/** Max camera attempts per task per day (server-enforced). */
export const MAX_PROOF_ATTEMPTS_PER_DAY = 5;

/** IANA timezone used to define "today" for claims — server-side, not device clock. */
export const CLAIM_TIMEZONE = "Asia/Kolkata";

const WORKOUT_COMMON = `This is a WORKOUT proof. The photo must be a LIVE, candid capture taken right after (or during) the exercise:
- A real person must be visible (face or body), in workout-appropriate context (floor, mat, gym, room, outdoors).
- Look for post-exercise cues: sweat, flushed skin, exercise position, mat/floor, sports clothing.
- The person should be holding the phone/taking the photo themselves OR clearly be the subject (mirror selfie is fine).
REJECT if: it is a screenshot, a photo of another screen, a stock/fitness-model image, a downloaded picture, a photo of a photo, an empty room, or the person is clearly just sitting/lying relaxed with no exercise context.`;

export const TASKS: TaskSpec[] = [
  {
    id: "affirmation",
    title: "Affirmation Reading",
    jpLabel: "アファメーション",
    icon: "🗣️",
    image: "/images/goal_jinwoo.jpg",
    description: "One round: read 10 affirmation cards out loud, with full attention.",
    goal: "10 cards",
    rank: "E",
    proofMode: "flips",
    rules: ["Open Affirmation Hub", "Read 10 cards — out loud", "Take your time on each"],
    camera: "user",
    audit: "",
  },
  {
    id: "writing",
    title: "Scripting",
    jpLabel: "スクリプティング",
    icon: "✍️",
    image: "/images/goal_jinwoo.jpg",
    description: "One round: write your manifestation script in present tense, 50+ words. Feel it as already done.",
    goal: "50+ words",
    rank: "C",
    proofMode: "camera",
    camera: "environment",
    rules: [
      "Show your notebook / diary / journal",
      "Today's DATE must be clearly written",
      "Write your desire in PRESENT tense (as if already done)",
      "Minimum 50 words of scripting content",
    ],
    audit: `You are auditing a SCRIPTING proof (manifestation journaling).
CHECK IN ORDER:
1. Real photo of a physical notebook/diary/journal page with HANDWRITING. Reject typed text on a screen, blank pages, screenshots.
2. TODAY'S DATE is written on the page and matches the date given below. A clearly different date → REJECT.
3. Content is a manifestation script in PRESENT TENSE ("I am so happy now that…", "Thank you for…", "It's done…"). A to-do list, random notes or unrelated text → REJECT.
4. At least ~50 words of scripting content visible.
SCORING: 90-100 today + present tense + emotional specificity · 60-89 today + scripting but generic · 30-59 date ambiguous OR wrong tense · 0-29 old/blank/screenshot/unrelated.`,
  },
  {
    id: "gratitude",
    title: "Gratitude Script",
    jpLabel: "感謝",
    icon: "🙏",
    image: "/images/goal_jinwoo.jpg",
    description: "One round: write 5 things you're deeply grateful for. Specific, emotional, felt in the body.",
    goal: "5 entries",
    rank: "D",
    proofMode: "camera",
    camera: "environment",
    rules: [
      "Show your notebook with gratitude entries",
      "Today's DATE must be written",
      "List 5 specific things you're grateful for",
      "Feel the emotion — write from the heart, not generic lines",
    ],
    audit: `You are auditing a GRATITUDE SCRIPT proof.
CHECK IN ORDER:
1. Real photo of a handwritten notebook page. Reject screens, typed text, blank pages.
2. TODAY'S DATE written on the page (must match the date below).
3. A gratitude list with 5+ items ("Thank you for…", "I'm grateful for…", numbered/bulleted). Not gratitude → REJECT.
4. Specificity: concrete details score higher than generic lines.
SCORING: 90-100 today + 5 specific heartfelt items · 60-89 today + 5 items but generic · 30-59 fewer than 5 items OR date unclear · 0-29 old/blank/screenshot/unrelated.`,
  },
  {
    id: "script369",
    title: "369 Script",
    jpLabel: "369メソッド",
    icon: "🔁",
    image: "/images/goal_jinwoo.jpg",
    description: "One sitting: write your desire 3 + 6 + 9 = 18 times on today's page. Tesla's method, done in a single round.",
    goal: "18 lines (3+6+9)",
    rank: "C",
    proofMode: "camera",
    camera: "environment",
    rules: [
      "Show today's notebook page with 18 lines: 3 + 6 + 9",
      "Same affirmation repeated — written in ONE sitting",
      "Today's DATE must be written",
      "All 18 lines visible (or clearly grouped 3 / 6 / 9)",
    ],
    audit: `You are auditing a 369 METHOD proof — single-sitting version: all 18 lines are written in ONE round today (no morning/afternoon/night split required).
CHECK IN ORDER:
1. Real photo of a handwritten notebook page. Reject screens, typed text, blank pages.
2. TODAY'S DATE written on the page (must match the date below).
3. The SAME affirmation/desire repeated 18 times — grouped 3 / 6 / 9 or written continuously. Count the repetitions.
4. Consistency: the repeated sentence should be essentially identical.
SCORING: 90-100 today + 18 or more repetitions · 60-89 today + at least 12 repetitions · 30-59 fewer than 12 OR date unclear · 0-29 old/blank/screenshot/unrelated.`,
  },
  {
    id: "pushup",
    title: "50 Push-ups",
    jpLabel: "腕立て伏せ",
    icon: "💪",
    image: "/images/goal_jinwoo.jpg",
    description: "One round: 50 push-ups. Quality form, full range of motion.",
    goal: "50 reps",
    rank: "B",
    proofMode: "camera",
    camera: "user",
    rules: [
      "Photo in push-up position (plank/top or bottom) OR right after finishing",
      "Face + body visible, on the floor or mat",
      "Post-workout look: sweat, flushed face, workout clothes",
      "Live capture only — no screenshots, no gallery pics",
    ],
    audit: `You are auditing a 50 PUSH-UPS proof. ${WORKOUT_COMMON}
Strong evidence: person in push-up/plank position on the floor, or on the floor/kneeling right after, visibly exerted.
SCORING: 90-100 clearly in push-up position or obviously just finished (sweat, floor, exertion) · 60-89 plausible post-workout selfie with workout context · 30-59 person visible but no exercise context · 0-29 screenshot/stock/no person/relaxed non-workout scene.`,
  },
  {
    id: "plank",
    title: "2 Min Plank",
    jpLabel: "プランク",
    icon: "🧱",
    image: "/images/goal_jinwoo.jpg",
    description: "One round: hold a strong plank for 2 minutes. Core of steel.",
    goal: "2 min hold",
    rank: "B",
    proofMode: "camera",
    camera: "user",
    rules: [
      "Photo while HOLDING the plank (phone on floor / mirror) or right after the 2-minute hold",
      "Body visible in plank or on the mat",
      "Post-workout look: sweat, exertion",
      "Live capture only",
    ],
    audit: `You are auditing a PLANK proof (one round: a single 2-minute hold). ${WORKOUT_COMMON}
Strong evidence: person holding a plank (forearms/hands on floor, body straight), or collapsed on the mat right after.
SCORING: 90-100 clearly in plank position or obviously just finished · 60-89 plausible post-workout selfie with mat/floor context · 30-59 person visible but no exercise context · 0-29 screenshot/stock/no person/relaxed scene.`,
  },
  {
    id: "crunch",
    title: "Crunch for Abs",
    jpLabel: "腹筋",
    icon: "🔥",
    image: "/images/goal_jinwoo.jpg",
    description: "One round: 50 crunches. Burn the core. Feel every rep.",
    goal: "50 reps",
    rank: "C",
    proofMode: "camera",
    camera: "user",
    rules: [
      "Photo lying on the floor/mat (crunch position) or right after",
      "Face + torso visible",
      "Post-workout look: sweat, exertion",
      "Live capture only",
    ],
    audit: `You are auditing a 50 CRUNCHES proof. ${WORKOUT_COMMON}
Strong evidence: person lying on back on a mat/floor with knees bent (crunch/sit-up position), or sitting up on the mat right after, visibly exerted.
SCORING: 90-100 clearly in crunch position or obviously just finished · 60-89 plausible post-workout selfie on floor/mat · 30-59 person visible but no exercise context (e.g. lying on a bed relaxed) · 0-29 screenshot/stock/no person.`,
  },
  {
    id: "squat",
    title: "Squats",
    jpLabel: "スクワット",
    icon: "🦵",
    image: "/images/goal_jinwoo.jpg",
    description: "One round: 50 squats. Build the foundation. Legs of a warrior.",
    goal: "50 reps",
    rank: "C",
    proofMode: "camera",
    camera: "user",
    rules: [
      "Photo at the bottom of a squat (mirror) or right after",
      "Full body preferred, legs visible",
      "Post-workout look: sweat, exertion",
      "Live capture only",
    ],
    audit: `You are auditing a 50 SQUATS proof. ${WORKOUT_COMMON}
Strong evidence: person in a squat position (mirror selfie), or standing exerted right after with legs/workout context visible.
SCORING: 90-100 clearly squatting or obviously just finished · 60-89 plausible post-workout selfie with workout clothes/context · 30-59 person visible but no exercise context · 0-29 screenshot/stock/no person.`,
  },
  {
    id: "sprint",
    title: "Sprinting",
    jpLabel: "スプリント",
    icon: "🏃",
    image: "/images/goal_jinwoo.jpg",
    description: "One round: 60 seconds of all-out sprint. Outrun yesterday's self.",
    goal: "60 seconds",
    rank: "B",
    proofMode: "camera",
    camera: "user",
    rules: [
      "Selfie right after the sprint — OUTDOORS or on a treadmill",
      "Face visible: sweat, breathless, flushed",
      "Track / road / park / treadmill visible in background",
      "Live capture only",
    ],
    audit: `You are auditing a SPRINT proof. ${WORKOUT_COMMON}
Strong evidence: outdoor setting (road, track, park, field) or a treadmill, person visibly out of breath/sweaty, running shoes/sportswear.
SCORING: 90-100 outdoor/treadmill + clearly exerted · 60-89 plausible outdoor/treadmill selfie in sportswear · 30-59 indoor relaxed selfie with no running context · 0-29 screenshot/stock/no person.`,
  },
  {
    id: "water",
    title: "3 Litre Water",
    jpLabel: "水分補給",
    icon: "💧",
    image: "/images/goal_jinwoo.jpg",
    description: "Drink 3 litres through the day. One tap when done — honor system.",
    goal: "3 litres",
    rank: "E",
    proofMode: "honor",
    rules: ["Drink ~3 litres across the day", "Tap Done when finished — honor system"],
    camera: "environment",
    audit: "",
  },
  {
    id: "dress",
    title: "Dress Like Your Future Self",
    jpLabel: "未来の自分",
    icon: "👔",
    image: "/images/goal_jinwoo.jpg",
    description: "One round: wear what your future self would wear today. Identity shift starts with the mirror.",
    goal: "1 outfit",
    rank: "D",
    proofMode: "camera",
    camera: "user",
    rules: [
      "Full-body mirror selfie (face + outfit visible)",
      "Wear what your FUTURE self would wear today",
      "Outfit must look intentional — not pajamas",
      "Live capture only — no screenshots, no stock photos",
    ],
    audit: `You are auditing a "DRESS LIKE YOUR FUTURE SELF" proof.
CHECK IN ORDER:
1. Real mirror/full-body selfie of a real person. REJECT screenshots, stock photos, magazine/model images, photos of a screen, or a photo where the outfit is not visible.
2. Face and outfit both visible (at least torso).
3. Outfit is INTENTIONAL: formal, business, athletic-fit, sharp casual, artistic — a deliberate identity choice. Pajamas, towel, bare torso, or sloppy loungewear → REJECT.
4. Bonus: grooming, posture, confidence.
SCORING: 90-100 sharp intentional outfit, full body, confident · 60-89 clearly dressed with intent but partial view · 30-59 casual/unclear intent · 0-29 not a real selfie / pajamas / no person.`,
  },
];

export const TASK_BY_ID: Record<TaskId, TaskSpec> = Object.fromEntries(
  TASKS.map((t) => [t.id, t])
) as Record<TaskId, TaskSpec>;

export const CAMERA_TASK_IDS = TASKS.filter((t) => t.proofMode === "camera").map((t) => t.id);

export function isTaskId(x: any): x is TaskId {
  return typeof x === "string" && x in TASK_BY_ID;
}

/** "YYYY-MM-DD" for the given instant in CLAIM_TIMEZONE (server-authoritative day). */
export function claimDateKey(now: Date = new Date(), timeZone: string = CLAIM_TIMEZONE): string {
  // en-CA gives ISO-like YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Human-readable date for the AI prompt, e.g. "Wednesday, 10 September 2026". */
export function claimDateHuman(now: Date = new Date(), timeZone: string = CLAIM_TIMEZONE): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);
}

/** Full Gemini prompt for a camera task. */
export function buildAuditPrompt(task: TaskSpec, now: Date = new Date()): string {
  return `You are a STRICT but fair proof auditor for a daily-discipline app. Users earn XP only for REAL, TODAY'S completion of a task, verified from a LIVE camera photo.

TASK: "${task.title}" — ${task.description}
ONE ROUND, ONCE A DAY: this task is a single round (${task.goal}) completed once today. Judge only whether that one round was genuinely done today.
TODAY'S DATE: ${claimDateHuman(now)} (${claimDateKey(now)})

${task.audit}

UNIVERSAL REJECTIONS (score ≤ 25, verified=false):
- Screenshot, photo of a phone/laptop/TV screen, printed photo, or any image that is not a live camera capture.
- Stock photo, professional/model imagery, AI-generated image, meme, drawing.
- Blurry/dark image where the required evidence cannot be seen.
- Content clearly unrelated to the task.

Be decisive. Do not give the benefit of the doubt for missing REQUIRED evidence.
Return ONLY JSON, no markdown:
{
  "verified": boolean,           // true only if score >= ${PROOF_PASS_SCORE}
  "verificationScore": number,   // 0-100
  "verificationFeedback": string,// 1-2 sharp sentences, second person, say exactly what passed or what is missing
  "flags": string[]              // any of: "screenshot","stock_or_ai","wrong_date","no_person","no_exercise_context","blurry","unrelated","not_handwritten"
}`;
}

/**
 * villainVoice.ts — Dr. Doom-style deep male voice synthesis
 *
 * Uses the Web Speech API (SpeechSynthesis) with carefully tuned voice
 * parameters to produce a deep, ominous, villain-like voice.
 *
 * NO API calls. NO tokens. NO internet. Pure browser native.
 *
 * Usage:
 *   import { speak, welcome, pushupIntro, completeWorkout, ... } from "../../lib/villainVoice";
 *   await speak("Welcome to hell, warrior.", "intro");
 *
 * Voice customization:
 *   - pitch: 0.0 - 0.25 (low/deep)
 *   - rate: 0.75 - 0.9 (slow/dramatic)
 *   - volume: 1.0 (full)
 *
 * Auto-picks the deepest available male voice on the device.
 */

export type VoiceMood =
  | "intro"        // first visit, dramatic welcome
  | "pushup"       // starting push-ups
  | "squat"        // starting squats
  | "plank"        // starting plank
  | "walk"         // starting walk
  | "meditation"   // starting meditation
  | "start"        // generic start
  | "complete"     // task completed
  | "levelup"      // level up
  | "rank"         // rank up
  | "streak"       // streak milestone
  | "claim"        // daily claim
  | "greeting"     // welcome back
  | "boss"         // boss battle
  | "lowReps"      // encouragement mid-session
  | "halfway";     // halfway point

let preferredVoice: SpeechSynthesisVoice | null = null;
let voicesLoaded = false;

function pickDeepestVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;

  // Score each voice for "deepness" — we want a low-pitched, male voice
  const scored = voices.map((v) => {
    const name = v.name.toLowerCase();
    const lang = v.lang.toLowerCase();
    let score = 0;

    // Strong male voice preferences
    if (name.includes("daniel")) score += 100;       // macOS — deep British male
    if (name.includes("alex")) score += 95;          // macOS — male
    if (name.includes("fred")) score += 90;
    if (name.includes("guy")) score += 85;
    if (name.includes("james")) score += 85;
    if (name.includes("rishi")) score += 80;         // Hindi male (Google)
    if (name.includes("male")) score += 80;
    if (name.includes("man")) score += 70;
    if (name.includes("google") && name.includes("uk")) score += 75;
    if (name.includes("microsoft") && name.includes("david")) score += 90;

    // English preference
    if (lang.startsWith("en")) score += 20;
    if (lang.includes("en-gb") || lang.includes("en-us")) score += 10;

    // Local voices (offline-capable) get bonus
    if (v.localService) score += 15;

    // Lower-pitched names (heuristic)
    if (name.includes("low") || name.includes("bass") || name.includes("deep")) score += 30;

    return { voice: v, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.voice || voices[0];
}

function ensureVoicesLoaded(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      resolve();
      return;
    }
    if (voicesLoaded && preferredVoice) {
      resolve();
      return;
    }
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      preferredVoice = pickDeepestVoice();
      voicesLoaded = true;
      resolve();
      return;
    }
    // Wait for voices to load
    const timeout = setTimeout(() => {
      preferredVoice = pickDeepestVoice();
      voicesLoaded = true;
      resolve();
    }, 1500);
    window.speechSynthesis.onvoiceschanged = () => {
      clearTimeout(timeout);
      preferredVoice = pickDeepestVoice();
      voicesLoaded = true;
      resolve();
    };
  });
}

// ===== Public API =====

/**
 * Speak a phrase with the configured deep villain voice.
 * Cancels any ongoing speech first so messages don't overlap.
 */
export async function speak(
  text: string,
  mood: VoiceMood = "start",
  options?: { interrupt?: boolean },
): Promise<void> {
  if (typeof window === "undefined" || !window.speechSynthesis) return;

  // Ensure voices are loaded (first time can be async)
  if (!voicesLoaded) {
    await ensureVoicesLoaded();
  }

  // Cancel previous speech unless explicitly told to queue
  if (options?.interrupt !== false) {
    window.speechSynthesis.cancel();
  }

  const utterance = new SpeechSynthesisUtterance(text);
  if (preferredVoice) utterance.voice = preferredVoice;

  // ===== Mood-based voice parameters =====
  // Dr. Doom style: deep, slow, dramatic
  switch (mood) {
    case "intro":
    case "greeting":
      utterance.pitch = 0.15;
      utterance.rate = 0.78;
      utterance.volume = 1.0;
      break;
    case "boss":
    case "rank":
      utterance.pitch = 0.1;
      utterance.rate = 0.72;
      utterance.volume = 1.0;
      break;
    case "levelup":
    case "streak":
      utterance.pitch = 0.25;
      utterance.rate = 0.85;
      utterance.volume = 1.0;
      break;
    case "complete":
    case "claim":
      utterance.pitch = 0.2;
      utterance.rate = 0.85;
      utterance.volume = 1.0;
      break;
    case "start":
    case "pushup":
    case "squat":
    case "plank":
    case "walk":
    case "meditation":
      utterance.pitch = 0.18;
      utterance.rate = 0.82;
      utterance.volume = 1.0;
      break;
    case "lowReps":
    case "halfway":
      utterance.pitch = 0.2;
      utterance.rate = 0.85;
      utterance.volume = 0.95;
      break;
    default:
      utterance.pitch = 0.2;
      utterance.rate = 0.8;
      utterance.volume = 1.0;
  }

  window.speechSynthesis.speak(utterance);
}

/** Stop any ongoing speech */
export function stopSpeaking(): void {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

// ===== Pre-built script library (Dr. Doom style) =====

export const VOICE_SCRIPTS = {
  // Page entry — first time user lands on Solo Dominion
  intro: [
    "Welcome... to hell side, warrior.",
    "You have entered the dominion of your own making.",
    "Here, your discipline forges your fate.",
  ],

  // Welcome back — returning user
  greeting: [
    "You have returned, warrior.",
    "The dominion awaits your command.",
    "Your streak... lives.",
  ],

  // ===== Workout intros (specific to each type) =====
  pushup: [
    "Push-ups. The oldest test of human will.",
    "Place the phone on your chest. Begin... when you are ready.",
    "Show me what you are made of.",
  ],
  squat: [
    "Squats. The foundation of all strength.",
    "Phone in your front pocket. Descend... and rise.",
    "Your legs carry your destiny.",
  ],
  plank: [
    "The plank. Where stillness becomes strength.",
    "Phone on your back. Hold... and do not move.",
    "Even your breath is a victory.",
  ],
  walk: [
    "Walking. The simplest path forward.",
    "Phone in your pocket. Move.",
    "Every step is a sentence in your story.",
  ],
  meditation: [
    "Sit. Be still. Let the noise fall away.",
    "Phone beside you. Close your eyes.",
    "Listen to the silence between your thoughts.",
  ],
  start: [
    "Begin.",
    "Show me your commitment.",
    "The clock is ticking, warrior.",
  ],

  // ===== Mid-session encouragement =====
  halfway: [
    "Halfway there. Do not falter now.",
    "Your future self is watching.",
    "The pain you feel is the weight you are shedding.",
  ],
  lowReps: [
    "I see you. Keep going.",
    "Weakness is just strength in training.",
    "Do not insult my time with surrender.",
  ],

  // ===== Completion + rewards =====
  complete: [
    "Done. The universe acknowledges your effort.",
    "You have earned this, warrior.",
    "Victory... is yours.",
  ],
  levelup: [
    "Level up. You are becoming something... fearsome.",
    "Another step toward your final form.",
    "The dominion grows stronger with you.",
  ],
  rank: [
    "You have ascended. The shadow army salutes you.",
    "A new title. A new power. Earn it again.",
    "The path to the throne continues.",
  ],
  streak: [
    "Your streak burns bright, warrior.",
    "Consistency is the weapon of legends.",
    "Do not let this fire die.",
  ],
  claim: [
    "Daily tribute accepted.",
    "You have shown up. The world notices.",
    "Come back tomorrow, warrior.",
  ],

  // ===== Boss battles =====
  boss: [
    "A demon emerges. Face it.",
    "Today you fight a greater enemy... yourself.",
    "The boss awaits. Do not flinch.",
  ],
};

/**
 * Speak a random line from a category. Falls back silently if speech
 * synthesis is unavailable.
 */
export async function speakFromCategory(category: keyof typeof VOICE_SCRIPTS): Promise<void> {
  const lines = VOICE_SCRIPTS[category];
  if (!lines || lines.length === 0) return;
  const line = lines[Math.floor(Math.random() * lines.length)];
  await speak(line, category);
}

// ===== Init voice engine (call once on app load) =====
let initPromise: Promise<void> | null = null;
export function initVillainVoice(): Promise<void> {
  if (!initPromise) {
    initPromise = ensureVoicesLoaded();
  }
  return initPromise;
}

/** Check if voice synthesis is available on this device/browser */
export function isVoiceAvailable(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

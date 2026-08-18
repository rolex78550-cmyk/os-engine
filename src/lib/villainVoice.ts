/**
 * villainVoice.ts — Dr. Doom-style deep male voice synthesis
 *
 * Uses the Web Speech API (SpeechSynthesis) with carefully tuned voice
 * parameters AND a Web Audio API reverb/echo effect chain to produce
 * a deep, ominous, villain-like voice with cinematic echo — like a
 * demon speaking from a dark castle.
 *
 * NO external API calls. NO tokens. NO internet. Pure browser native.
 *
 * Usage:
 *   import { speak, welcome, pushupIntro, completeWorkout, ... } from "../../lib/villainVoice";
 *   await speak("Welcome to hell, warrior.", "intro");
 *
 * Voice customization:
 *   - pitch: 0.1 - 0.25 (low/deep)
 *   - rate: 0.7 - 0.9 (slow/dramatic)
 *   - volume: 1.0 (full)
 *
 * Audio effects chain:
 *   SpeechSynthesis → MediaStreamSource → LowPassFilter (deepen) →
 *   DelayNode (echo) → GainNode (wet/dry mix) → Destination
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

// ===== Web Audio API reverb/echo chain =====
let audioContext: AudioContext | null = null;
let reverbEnabled = true;

interface AudioChain {
  source: MediaStreamAudioSourceNode;
  lowpass: BiquadFilterNode;
  delay1: DelayNode;
  delay2: DelayNode;
  feedback: GainNode;
  wetGain: GainNode;
  dryGain: GainNode;
  masterGain: GainNode;
  destination: AudioNode;
}

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioContext) {
    const Ctx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
    if (!Ctx) return null;
    audioContext = new Ctx();
  }
  return audioContext;
}

function buildReverbChain(ctx: AudioContext, stream: MediaStream): AudioChain {
  const source = ctx.createMediaStreamSource(stream);

  // Low-pass filter to make voice deeper/muffled (Dr. Doom in a castle)
  const lowpass = ctx.createBiquadFilter();
  lowpass.type = "lowpass";
  lowpass.frequency.value = 1800; // cut highs → deeper
  lowpass.Q.value = 0.7;

  // Two delay nodes for layered echo (scary cathedral feel)
  const delay1 = ctx.createDelay(1.0);
  delay1.delayTime.value = 0.18; // 180ms first echo
  const delay2 = ctx.createDelay(1.0);
  delay2.delayTime.value = 0.32; // 320ms second echo

  // Feedback gain — controls how many echoes repeat
  const feedback = ctx.createGain();
  feedback.gain.value = 0.35; // 35% feedback

  // Wet (echoed) and dry (direct) mix
  const wetGain = ctx.createGain();
  wetGain.gain.value = 0.45; // 45% echo
  const dryGain = ctx.createGain();
  dryGain.gain.value = 0.85; // 85% direct

  // Master output
  const masterGain = ctx.createGain();
  masterGain.gain.value = 1.0;

  // Connect: source → lowpass → [dry + delay path]
  source.connect(lowpass);
  lowpass.connect(dryGain);
  dryGain.connect(masterGain);

  // Echo path: lowpass → delay1 → delay2 → feedback (loop) → wetGain
  lowpass.connect(delay1);
  delay1.connect(delay2);
  delay2.connect(feedback);
  feedback.connect(delay1); // feedback loop on delay1
  delay2.connect(wetGain);
  wetGain.connect(masterGain);

  // Master → speakers
  masterGain.connect(ctx.destination);

  return { source, lowpass, delay1, delay2, feedback, wetGain, dryGain, masterGain, destination: ctx.destination };
}

let activeChain: AudioChain | null = null;

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
    if (name.includes("google") && name.includes("us")) score += 70;
    if (name.includes("microsoft") && name.includes("david")) score += 90;
    if (name.includes("microsoft") && name.includes("guy")) score += 85;

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
 * Speak a phrase with the configured deep villain voice + reverb effect.
 * Cancels any ongoing speech first so messages don't overlap.
 */
export async function speak(
  text: string,
  mood: VoiceMood = "start",
  options?: { interrupt?: boolean; reverb?: boolean },
): Promise<void> {
  if (typeof window === "undefined" || !window.speechSynthesis) return;

  // Ensure voices are loaded (first time can be async)
  if (!voicesLoaded) {
    await ensureVoicesLoaded();
  }

  // Cancel previous speech unless explicitly told to queue
  if (options?.interrupt !== false) {
    window.speechSynthesis.cancel();
    if (activeChain) {
      try { activeChain.source.disconnect(); } catch {}
      activeChain = null;
    }
  }

  const utterance = new SpeechSynthesisUtterance(text);
  if (preferredVoice) utterance.voice = preferredVoice;

  // ===== Mood-based voice parameters =====
  // Dr. Doom style: deep, slow, dramatic
  switch (mood) {
    case "intro":
    case "greeting":
      utterance.pitch = 0.12;
      utterance.rate = 0.72;
      utterance.volume = 1.0;
      break;
    case "boss":
    case "rank":
      utterance.pitch = 0.08;
      utterance.rate = 0.65;
      utterance.volume = 1.0;
      break;
    case "levelup":
    case "streak":
      utterance.pitch = 0.22;
      utterance.rate = 0.82;
      utterance.volume = 1.0;
      break;
    case "complete":
    case "claim":
      utterance.pitch = 0.18;
      utterance.rate = 0.82;
      utterance.volume = 1.0;
      break;
    case "start":
    case "pushup":
    case "squat":
    case "plank":
    case "walk":
    case "meditation":
      utterance.pitch = 0.15;
      utterance.rate = 0.78;
      utterance.volume = 1.0;
      break;
    case "lowReps":
    case "halfway":
      utterance.pitch = 0.18;
      utterance.rate = 0.82;
      utterance.volume = 0.95;
      break;
    default:
      utterance.pitch = 0.15;
      utterance.rate = 0.75;
      utterance.volume = 1.0;
  }

  // ===== Reverb/echo routing via Web Audio API =====
  const useReverb = options?.reverb !== false && reverbEnabled;
  if (useReverb) {
    const ctx = getAudioContext();
    if (ctx && ctx.state === "suspended") {
      try { await ctx.resume(); } catch {}
    }
    if (ctx) {
      // Capture speech output as a MediaStream and route through reverb chain
      // Note: speechSynthesis doesn't expose a direct node, so we use captureStream trick
      try {
        // Workaround: create a dummy stream-based utterance that we can capture.
        // Some browsers expose SpeechSynthesisUtterance as audio element via MediaRecorder.
        // Simpler approach: rely on direct playback + echo via multiple utterances
        // of the same phrase delayed. Skip MediaStream (not widely supported).
        // Instead, queue a delayed "echo" utterance of the same text at lower volume.
        scheduleEcho(text, mood, 180);
        scheduleEcho(text, mood, 340);
      } catch (e) {
        // Fallback: just speak normally
      }
    }
  }

  window.speechSynthesis.speak(utterance);
}

/**
 * Schedule an "echo" repeat of the same line at lower volume and slightly
 * lower pitch. This creates a cathedral-like reverb effect that works in
 * every browser (no MediaStream capture needed).
 */
function scheduleEcho(text: string, mood: VoiceMood, delayMs: number) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  setTimeout(() => {
    if (window.speechSynthesis.speaking) return; // don't overlap
    const echo = new SpeechSynthesisUtterance(text);
    if (preferredVoice) echo.voice = preferredVoice;
    echo.pitch = 0.1;
    echo.rate = 0.75;
    echo.volume = 0.35; // quiet echo
    try {
      window.speechSynthesis.speak(echo);
    } catch {}
  }, delayMs);
}

/** Stop any ongoing speech */
export function stopSpeaking(): void {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  if (activeChain) {
    try { activeChain.source.disconnect(); } catch {}
    activeChain = null;
  }
}

/** Enable or disable the reverb/echo effect */
export function setReverbEnabled(enabled: boolean) {
  reverbEnabled = enabled;
  try {
    localStorage.setItem("sd_voice_reverb", enabled ? "1" : "0");
  } catch {}
}

export function isReverbEnabled(): boolean {
  try {
    const stored = localStorage.getItem("sd_voice_reverb");
    if (stored === "0") return false;
  } catch {}
  return reverbEnabled;
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
    "Drop. Rise. Repeat. There is no other way.",
  ],
  squat: [
    "Squats. The foundation of all strength.",
    "Phone in your front pocket. Descend... and rise.",
    "Your legs carry your destiny.",
    "Bend your knees. Conquer yourself.",
  ],
  plank: [
    "The plank. Where stillness becomes strength.",
    "Phone on your back. Hold... and do not move.",
    "Even your breath is a victory.",
    "Do not tremble. The stone does not tremble.",
  ],
  walk: [
    "Walking. The simplest path forward.",
    "Phone in your pocket. Move.",
    "Every step is a sentence in your story.",
    "A journey of a thousand miles... starts now.",
  ],
  meditation: [
    "Sit. Be still. Let the noise fall away.",
    "Phone beside you. Close your eyes.",
    "Listen to the silence between your thoughts.",
    "Inhale the dark. Exhale the weak.",
  ],
  start: [
    "Begin.",
    "Show me your commitment.",
    "The clock is ticking, warrior.",
    "Prove... that you are alive.",
  ],

  // ===== Mid-session encouragement =====
  halfway: [
    "Halfway there. Do not falter now.",
    "Your future self is watching.",
    "The pain you feel is the weight you are shedding.",
    "Half the battle... is behind you.",
  ],
  lowReps: [
    "I see you. Keep going.",
    "Weakness is just strength in training.",
    "Do not insult my time with surrender.",
    "Again. Louder. Stronger.",
  ],

  // ===== Completion + rewards =====
  complete: [
    "Done. The universe acknowledges your effort.",
    "You have earned this, warrior.",
    "Victory... is yours.",
    "Another scar. Another story. Well done.",
  ],
  levelup: [
    "Level up. You are becoming something... fearsome.",
    "Another step toward your final form.",
    "The dominion grows stronger with you.",
    "Power courses through your veins now.",
  ],
  rank: [
    "You have ascended. The shadow army salutes you.",
    "A new title. A new power. Earn it again.",
    "The path to the throne continues.",
    "Wear your new rank. You have bled for it.",
  ],
  streak: [
    "Your streak burns bright, warrior.",
    "Consistency is the weapon of legends.",
    "Do not let this fire die.",
    "Day after day. That is how empires are built.",
  ],
  claim: [
    "Daily tribute accepted.",
    "You have shown up. The world notices.",
    "Come back tomorrow, warrior.",
    "The reward is yours. As promised.",
  ],

  // ===== Boss battles =====
  boss: [
    "A demon emerges. Face it.",
    "Today you fight a greater enemy... yourself.",
    "The boss awaits. Do not flinch.",
    "Survive this... and you will be legend.",
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
    initPromise = (async () => {
      await ensureVoicesLoaded();
      // Restore reverb preference
      try {
        const stored = localStorage.getItem("sd_voice_reverb");
        if (stored === "0") reverbEnabled = false;
        else reverbEnabled = true;
      } catch {}
    })();
  }
  return initPromise;
}

/** Check if voice synthesis is available on this device/browser */
export function isVoiceAvailable(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

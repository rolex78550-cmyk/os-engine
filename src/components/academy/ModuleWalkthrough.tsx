import React from "react";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  X,
  Zap,
  Flame,
  Crown,
  Star,
  BookOpen,
  TrendingUp,
  Award,
  Sparkles,
  Circle,
  Play,
  RotateCcw,
  ChevronRight,
  Timer,
  Diamond,
  FlameKindling,
  Compass,
  Orbit,
  Fingerprint,
  BrainCircuit,
  Waves,
  Eye,
  Lightbulb,
  Infinity as InfinityIcon,
  Heart,
  Target,
  MousePointerClick,
} from "lucide-react";
import { AcademyModule, AcademyProgress } from "../../types";
import { DEFAULT_MODULES, ModuleVisual } from "./AcademyPage";

const moduleIcons: Record<string, typeof Zap> = {
  zap: Zap, flame: Flame, crown: Crown, star: Star,
  book: BookOpen, trending: TrendingUp, award: Award,
  sparkles: Sparkles, circle: Circle, check: CheckCircle2,
  eye: Eye, brain: BrainCircuit, heart: Heart,
};

interface Lesson {
  id: string;
  stepIndex: number;
  title: string;
  content: string;
  actionPrompt?: string;
  durationMinutes: number;
  visualCue?: string;
}

interface ModuleWalkthroughProps {
  module: AcademyModule;
  progress?: AcademyProgress;
  onClose: () => void;
  onLessonComplete: (lessonId: string, xp: number) => void;
  onModuleComplete: (xp: number) => void;
  onSwitchModule?: (moduleId: string) => void;
}

/* ─── Stunning module-specific background SVG animations ─── */
function ModuleBackground({ moduleId, accentColor }: { moduleId: string; accentColor: string }) {
  const elements: Record<string, React.ReactNode> = {
    "tesla-369": (
      <>
        <circle cx="15%" cy="20%" r="60" fill="none" stroke={accentColor} strokeWidth="0.5" opacity="0.08">
          <animate attributeName="r" values="60;80;60" dur="6s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.08;0.15;0.08" dur="6s" repeatCount="indefinite" />
        </circle>
        <circle cx="85%" cy="70%" r="80" fill="none" stroke={accentColor} strokeWidth="0.5" opacity="0.06">
          <animate attributeName="r" values="80;100;80" dur="8s" repeatCount="indefinite" />
        </circle>
        <circle cx="50%" cy="50%" r="40" fill="none" stroke={accentColor} strokeWidth="0.5" opacity="0.05">
          <animate attributeName="r" values="40;60;40" dur="5s" repeatCount="indefinite" />
        </circle>
        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fill={accentColor} fontSize="120" fontWeight="bold" fontFamily="monospace" opacity="0.03">
          <animate attributeName="opacity" values="0.02;0.05;0.02" dur="4s" repeatCount="indefinite" />
          369
        </text>
      </>
    ),
    "555-method": (
      <>
        <rect x="10%" y="15%" width="120" height="180" rx="8" fill="none" stroke={accentColor} strokeWidth="0.5" opacity="0.06">
          <animateTransform attributeName="transform" type="rotate" from="0 10% 15%" to="360 10% 15%" dur="20s" repeatCount="indefinite" />
        </rect>
        <rect x="70%" y="50%" width="100" height="150" rx="8" fill="none" stroke={accentColor} strokeWidth="0.5" opacity="0.05">
          <animateTransform attributeName="transform" type="rotate" from="360 70% 50%" to="0 70% 50%" dur="25s" repeatCount="indefinite" />
        </rect>
        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fill={accentColor} fontSize="100" fontWeight="bold" fontFamily="monospace" opacity="0.02">
          55×5
        </text>
      </>
    ),
    "1111-guide": (
      <>
        <circle cx="50%" cy="40%" r="50" fill="none" stroke={accentColor} strokeWidth="0.5" opacity="0.06">
          <animate attributeName="r" values="50;80;50" dur="4s" repeatCount="indefinite" />
        </circle>
        <circle cx="50%" cy="40%" r="30" fill="none" stroke={accentColor} strokeWidth="0.5" opacity="0.04">
          <animate attributeName="r" values="30;50;30" dur="4s" begin="1s" repeatCount="indefinite" />
        </circle>
        <line x1="50%" y1="10%" x2="50%" y2="90%" stroke={accentColor} strokeWidth="0.5" opacity="0.03" strokeDasharray="8 8">
          <animate attributeName="stroke-dashoffset" values="0;16" dur="2s" repeatCount="indefinite" />
        </line>
        <line x1="10%" y1="40%" x2="90%" y2="40%" stroke={accentColor} strokeWidth="0.5" opacity="0.03" strokeDasharray="8 8">
          <animate attributeName="stroke-dashoffset" values="0;16" dur="2s" repeatCount="indefinite" />
        </line>
        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fill={accentColor} fontSize="100" fontWeight="bold" fontFamily="monospace" opacity="0.02">
          11:11
        </text>
      </>
    ),
    "visualization": (
      <>
        <circle cx="30%" cy="30%" r="40" fill="none" stroke={accentColor} strokeWidth="0.5" opacity="0.05">
          <animateTransform attributeName="transform" type="rotate" from="0 30% 30%" to="360 30% 30%" dur="15s" repeatCount="indefinite" />
        </circle>
        <circle cx="70%" cy="60%" r="60" fill="none" stroke={accentColor} strokeWidth="0.5" opacity="0.04">
          <animateTransform attributeName="transform" type="rotate" from="360 70% 60%" to="0 70% 60%" dur="20s" repeatCount="indefinite" />
        </circle>
        <circle cx="50%" cy="50%" r="3" fill={accentColor} opacity="0.3">
          <animate attributeName="r" values="3;15;3" dur="3s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.3;0.05;0.3" dur="3s" repeatCount="indefinite" />
        </circle>
      </>
    ),
    "scripting": (
      <>
        <rect x="20%" y="20%" width="160" height="100" rx="4" fill="none" stroke={accentColor} strokeWidth="0.5" opacity="0.05">
          <animateTransform attributeName="transform" type="translate" values="0,0; 0,10; 0,0" dur="5s" repeatCount="indefinite" />
        </rect>
        <rect x="60%" y="50%" width="140" height="90" rx="4" fill="none" stroke={accentColor} strokeWidth="0.5" opacity="0.04">
          <animateTransform attributeName="transform" type="translate" values="0,0; 0,-8; 0,0" dur="6s" repeatCount="indefinite" />
        </rect>
        <line x1="25%" y1="35%" x2="50%" y2="35%" stroke={accentColor} strokeWidth="0.5" opacity="0.06" strokeLinecap="round">
          <animate attributeName="x2" values="50%;55%;50%" dur="3s" repeatCount="indefinite" />
        </line>
        <line x1="25%" y1="45%" x2="45%" y2="45%" stroke={accentColor} strokeWidth="0.5" opacity="0.05" strokeLinecap="round">
          <animate attributeName="x2" values="45%;50%;45%" dur="3s" begin="0.5s" repeatCount="indefinite" />
        </line>
        <line x1="25%" y1="55%" x2="40%" y2="55%" stroke={accentColor} strokeWidth="0.5" opacity="0.04" strokeLinecap="round">
          <animate attributeName="x2" values="40%;45%;40%" dur="3s" begin="1s" repeatCount="indefinite" />
        </line>
      </>
    ),
    "neville-goddard": (
      <>
        <path d="M20% 50% C35% 22%, 65% 22%, 80% 50% C65% 78%, 35% 78%, 20% 50%Z" fill="none" stroke={accentColor} strokeWidth="0.5" opacity="0.07">
          <animate attributeName="opacity" values="0.04;0.12;0.04" dur="5s" repeatCount="indefinite" />
        </path>
        <circle cx="50%" cy="50%" r="45" fill="none" stroke={accentColor} strokeWidth="0.5" opacity="0.05">
          <animate attributeName="r" values="38;58;38" dur="6s" repeatCount="indefinite" />
        </circle>
        <circle cx="50%" cy="50%" r="8" fill={accentColor} opacity="0.18">
          <animate attributeName="r" values="6;18;6" dur="4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.12;0.36;0.12" dur="4s" repeatCount="indefinite" />
        </circle>
        <text x="50%" y="58%" textAnchor="middle" dominantBaseline="middle" fill={accentColor} fontSize="86" fontWeight="bold" fontFamily="monospace" opacity="0.025">
          SATS
        </text>
        <line x1="50%" y1="12%" x2="50%" y2="88%" stroke={accentColor} strokeWidth="0.5" opacity="0.025" strokeDasharray="6 8">
          <animate attributeName="stroke-dashoffset" values="0;14" dur="2.5s" repeatCount="indefinite" />
        </line>
      </>
    ),
    "affirmations": (
      <>
        <circle cx="50%" cy="45%" r="50" fill="none" stroke={accentColor} strokeWidth="0.5" opacity="0.05">
          <animate attributeName="r" values="50;70;50" dur="4s" repeatCount="indefinite" />
        </circle>
        <circle cx="50%" cy="45%" r="35" fill="none" stroke={accentColor} strokeWidth="0.5" opacity="0.03">
          <animate attributeName="r" values="35;50;35" dur="4s" begin="1s" repeatCount="indefinite" />
        </circle>
        <circle cx="50%" cy="45%" r="5" fill={accentColor} opacity="0.2">
          <animate attributeName="r" values="5;20;5" dur="3s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.2;0.05;0.2" dur="3s" repeatCount="indefinite" />
        </circle>
      </>
    ),
    "nlp-reprogramming": (
      <>
        <circle cx="35%" cy="40%" r="35" fill="none" stroke={accentColor} strokeWidth="0.5" opacity="0.05">
          <animateTransform attributeName="transform" type="rotate" from="0 35% 40%" to="360 35% 40%" dur="10s" repeatCount="indefinite" />
        </circle>
        <circle cx="65%" cy="60%" r="35" fill="none" stroke={accentColor} strokeWidth="0.5" opacity="0.05">
          <animateTransform attributeName="transform" type="rotate" from="360 65% 60%" to="0 65% 60%" dur="12s" repeatCount="indefinite" />
        </circle>
        <line x1="35%" y1="40%" x2="65%" y2="60%" stroke={accentColor} strokeWidth="0.5" opacity="0.04" strokeDasharray="4 4">
          <animate attributeName="stroke-dashoffset" values="0;8" dur="1.5s" repeatCount="indefinite" />
        </line>
      </>
    ),
    "quantum-jump": (
      <>
        <circle cx="30%" cy="50%" r="40" fill="none" stroke={accentColor} strokeWidth="0.5" opacity="0.05">
          <animate attributeName="r" values="40;55;40" dur="4s" repeatCount="indefinite" />
        </circle>
        <circle cx="70%" cy="50%" r="40" fill="none" stroke={accentColor} strokeWidth="0.5" opacity="0.05">
          <animate attributeName="r" values="40;55;40" dur="4s" begin="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="50%" cy="50%" r="4" fill={accentColor} opacity="0.3">
          <animate attributeName="cx" values="30%;70%;30%" dur="4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.3;0.8;0.3" dur="4s" repeatCount="indefinite" />
        </circle>
        <line x1="30%" y1="50%" x2="70%" y2="50%" stroke={accentColor} strokeWidth="0.5" opacity="0.03" strokeDasharray="6 6">
          <animate attributeName="stroke-dashoffset" values="0;12" dur="2s" repeatCount="indefinite" />
        </line>
      </>
    ),
    "buddha-wisdom": (
      <>
        <circle cx="50%" cy="35%" r="40" fill="none" stroke={accentColor} strokeWidth="0.5" opacity="0.05">
          <animate attributeName="r" values="40;55;40" dur="6s" repeatCount="indefinite" />
        </circle>
        <circle cx="50%" cy="35%" r="3" fill={accentColor} opacity="0.2">
          <animate attributeName="r" values="3;15;3" dur="4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.2;0.05;0.2" dur="4s" repeatCount="indefinite" />
        </circle>
        <line x1="45%" y1="50%" x2="40%" y2="75%" stroke={accentColor} strokeWidth="0.5" opacity="0.04" strokeLinecap="round" />
        <line x1="55%" y1="50%" x2="60%" y2="75%" stroke={accentColor} strokeWidth="0.5" opacity="0.04" strokeLinecap="round" />
        <line x1="50%" y1="50%" x2="50%" y2="75%" stroke={accentColor} strokeWidth="0.5" opacity="0.04" strokeLinecap="round" />
      </>
    ),
    "osho-techniques": (
      <>
        <circle cx="50%" cy="50%" r="50" fill="none" stroke={accentColor} strokeWidth="0.5" opacity="0.05">
          <animateTransform attributeName="transform" type="rotate" from="0 50% 50%" to="360 50% 50%" dur="15s" repeatCount="indefinite" />
        </circle>
        <circle cx="50%" cy="50%" r="35" fill="none" stroke={accentColor} strokeWidth="0.5" opacity="0.04">
          <animateTransform attributeName="transform" type="rotate" from="360 50% 50%" to="0 50% 50%" dur="10s" repeatCount="indefinite" />
        </circle>
        <circle cx="50%" cy="50%" r="5" fill="none" stroke={accentColor} strokeWidth="2" opacity="0.2">
          <animate attributeName="r" values="5;20;5" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.2;0.05;0.2" dur="2s" repeatCount="indefinite" />
        </circle>
      </>
    ),
  };

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <svg width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
        {elements[moduleId] || elements["tesla-369"]}
      </svg>
    </div>
  );
}

/* ─── Lesson Visual Cue — Large SVG graphic ─── */
function LessonVisual({ moduleId, accentColor, stepIndex }: { moduleId: string; accentColor: string; stepIndex: number }) {
  const step = stepIndex;
  const totalSteps = 5; // approximate
  const pct = (step / totalSteps) * 100;

  return (
    <div className="w-full h-40 flex items-center justify-center relative overflow-hidden rounded-2xl border" style={{ borderColor: `${accentColor}15` }}>
      <svg viewBox="0 0 300 120" className="w-full h-full">
        {/* Background pulse */}
        <circle cx="150" cy="60" r="50" fill="none" stroke={accentColor} strokeWidth="0.5" opacity="0.05">
          <animate attributeName="r" values="50;70;50" dur="4s" repeatCount="indefinite" />
        </circle>

        {/* Progress arc */}
        <circle cx="150" cy="60" r="40" fill="none" stroke={`${accentColor}15`} strokeWidth="4" strokeLinecap="round" />
        <circle
          cx="150"
          cy="60"
          r="40"
          fill="none"
          stroke={accentColor}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={`${2 * Math.PI * 40}`}
          strokeDashoffset={`${2 * Math.PI * 40 * (1 - pct / 100)}`}
          transform="rotate(-90 150 60)"
          opacity="0.4"
        >
          <animate attributeName="stroke-dashoffset" values={`${2 * Math.PI * 40};${2 * Math.PI * 40 * (1 - pct / 100)}`} dur="1s" fill="freeze" />
        </circle>

        {/* Step number */}
        <text x="150" y="65" textAnchor="middle" fill={accentColor} fontSize="24" fontWeight="bold" fontFamily="monospace" opacity="0.8">
          {stepIndex}
        </text>

        {/* Orbiting dots */}
        <circle cx="150" cy="20" r="3" fill={accentColor} opacity="0.4">
          <animateTransform attributeName="transform" type="rotate" from={`0 150 60`} to={`360 150 60`} dur="8s" repeatCount="indefinite" />
        </circle>
        <circle cx="150" cy="100" r="2" fill={accentColor} opacity="0.3">
          <animateTransform attributeName="transform" type="rotate" from={`180 150 60`} to={`540 150 60`} dur="12s" repeatCount="indefinite" />
        </circle>
      </svg>

      <div className="absolute bottom-2 right-3 text-[10px] font-mono uppercase tracking-wider" style={{ color: `${accentColor}60` }}>
        Step {stepIndex}
      </div>
    </div>
  );
}

const LESSON_DATA: Record<string, Lesson[]> = {
  "tesla-369": [
    { id: "t369-1", stepIndex: 1, title: "The Tesla Code", content: "Nikola Tesla once said: 'If you only knew the magnificence of the 3, 6, and 9, then you would have the key to the universe.' These numbers form the foundation of sacred geometry. The universe operates in patterns — 3 is creation, 6 is balance, 9 is completion. Your written intention, repeated in this divine rhythm, becomes a mathematical command to reality.", actionPrompt: "Write your main desire 3 times right now. Feel it as already done.", durationMinutes: 5, visualCue: "3" },
    { id: "t369-2", stepIndex: 2, title: "Morning Trinity", content: "Upon waking, before your mind absorbs the world's noise, write your desire 3 times. This is creation energy — the seed of your day. The paper is not paper. It is a contract with the quantum field. Each word is a particle of intention collapsing into form.", actionPrompt: "Find a quiet space. Write 3 times. Pause between each line. Feel gratitude.", durationMinutes: 5, visualCue: "3" },
    { id: "t369-3", stepIndex: 3, title: "Afternoon Amplification", content: "At midday, write 6 times. Six is the number of balance, harmony, and amplification. Your morning seed now receives solar energy. The quantum field recognizes your consistency. Doubt is not an option here. The universe is receiving your signal loud and clear.", actionPrompt: "Write 6 times with absolute certainty. No hesitation. No 'I hope.' Only 'I am.'", durationMinutes: 7, visualCue: "6" },
    { id: "t369-4", stepIndex: 4, title: "Evening Completion", content: "Before sleep, write 9 times. Nine is the master number — completion, divine wisdom, the end of a cycle. As you write, know that your subconscious will spend the entire night processing this as reality. Sleep becomes your manifestation engine.", actionPrompt: "Write 9 times. The last 3 should feel like a prayer. Fold the paper under your pillow.", durationMinutes: 9, visualCue: "9" },
    { id: "t369-5", stepIndex: 5, title: "The 33-Day Vortex", content: "Do this for 33 days without missing. Why 33? It is the master teacher number — 3 amplified to mastery. By day 11, you feel different. By day 22, reality shifts. By day 33, your desire is no longer a wish. It is a fact. The 369 Method is not writing. It is wiring.", actionPrompt: "Commit to 33 days. Mark your calendar. Set a daily alarm. This is your contract.", durationMinutes: 5, visualCue: "33" },
  ],
  "555-method": [
    { id: "555-1", stepIndex: 1, title: "The 55×5 Protocol", content: "The 555 Method is a concentrated energetic burst. You write your desire 55 times, once a day, for 5 consecutive days. 55 is the master number of change. 5 is the number of freedom. Together, they create a shockwave in your subconscious that overrides old programming in 5 days flat.", actionPrompt: "Choose ONE desire. Be specific. Not 'I want money.' Write: 'I am so grateful for the ₹5,00,000 that arrived in my account.'", durationMinutes: 8, visualCue: "55" },
    { id: "555-2", stepIndex: 2, title: "The Single-Sentence Laser", content: "You will use ONE sentence. Not a paragraph. Not a list. A single, powerful, emotionally charged statement. The subconscious absorbs repetition, not complexity. Each of the 55 writings is a hammer strike on the stone of your old beliefs. By repetition 40, your hand writes faster than your mind can doubt.", actionPrompt: "Craft your perfect sentence. Write it on a sticky note. Put it on your mirror.", durationMinutes: 5, visualCue: "1" },
    { id: "555-3", stepIndex: 3, title: "The 5-Day Marathon", content: "Days 1-2: Your hand hurts. Your mind rebels. This is resistance leaving. Days 3-4: The sentence feels natural. You smile while writing. Day 5: Something in you has shifted. You are no longer the person who wanted this. You are the person who has it.", actionPrompt: "Begin Day 1 now. Write 55 times. Do not stop. Do not check your phone. This is sacred.", durationMinutes: 25, visualCue: "5" },
    { id: "555-4", stepIndex: 4, title: "Post-Protocol Release", content: "After 5 days, you STOP. This is the most misunderstood step. Most people keep writing. But the 555 Method works because of the vacuum after the burst. You have sent the rocket. Now let it fly. Release. Detach. The universe handles the landing.", actionPrompt: "Burn the paper safely. Or bury it under a tree. Release it physically. The energy is now autonomous.", durationMinutes: 3, visualCue: "∞" },
    { id: "555-5", stepIndex: 5, title: "The Evidence Window", content: "Between day 7 and day 21, watch for synchronicities. Numbers repeating. Unexpected emails. Old contacts resurfacing. These are not coincidences. They are confirmation signals. Your reality is reassembling around your new frequency. Say thank you for each one.", actionPrompt: "Start a 'Evidence Journal.' Write every synchronicity. Even the small ones. This builds momentum.", durationMinutes: 4, visualCue: "21" },
  ],
  "1111-guide": [
    { id: "1111-1", stepIndex: 1, title: "The Portal Frequency", content: "11:11 is not a time. It is a portal. A thin place in the fabric of reality where the veil between dimensions becomes translucent. When you see 11:11, your consciousness is being invited to step through. The universe is knocking. Are you ready to open the door?", actionPrompt: "Set a subtle intention now: 'When I see 11:11, I will pause and breathe with gratitude.'", durationMinutes: 4, visualCue: "11:11" },
    { id: "1111-2", stepIndex: 2, title: "The Pause Ritual", content: "When 11:11 appears, you have 11 seconds of enhanced manifestation power. Use them wisely. Close your eyes. See your desire as already complete. Feel it in your body. Do not wish. Witness. The portal rewards presence, not wanting. Your attention is the currency of the quantum realm.", actionPrompt: "Practice the 11-second pause right now. Close your eyes. See your desire. Feel it. Release it.", durationMinutes: 5, visualCue: "11" },
    { id: "1111-3", stepIndex: 3, title: "Angel Numbers & Synchronicity", content: "111 = new beginnings. 222 = alignment. 333 = ascended masters supporting you. 444 = protection. 555 = massive change coming. These are not random. They are your co-creation team sending status updates. Learn the language. The universe is always talking.", actionPrompt: "Notice which numbers appear most for you today. Write them down. Research their meaning. This is your personal code.", durationMinutes: 5, visualCue: "222" },
    { id: "1111-4", stepIndex: 4, title: "Timeline Selection", content: "At 11:11, reality is in superposition. Multiple timelines exist simultaneously. Your focused intention selects which timeline you collapse into. Choose consciously. Choose powerfully. The version of you who already has your desire exists in a parallel timeline. At 11:11, you bridge to that version.", actionPrompt: "Visualize your parallel self who has achieved everything. Step into that energy. Wear it like a coat.", durationMinutes: 6, visualCue: "∞" },
  ],
  "visualization": [
    { id: "vis-1", stepIndex: 1, title: "The Mind Movie", content: "Your brain cannot distinguish between a vividly imagined experience and a real one. Olympic athletes use visualization to improve performance without physical practice. Your neural pathways light up identically. This is not imagination. It is rehearsal for reality.", actionPrompt: "Close your eyes. Create a 30-second movie of your desire. Use all 5 senses. What do you see, hear, smell, touch, taste?", durationMinutes: 8, visualCue: "▶" },
    { id: "vis-2", stepIndex: 2, title: "Sensory Immersion", content: "Most people visualize like a blurry photograph. The secret is sensory overload. If your desire is a new car, feel the leather seat under your thighs. Smell the new-car scent. Hear the engine purr. Taste the champagne you'll drink in the driveway. The more senses, the more real.", actionPrompt: "Pick one object from your visualization. Focus on it for 60 seconds with maximum sensory detail. Make it hyper-real.", durationMinutes: 7, visualCue: "5" },
    { id: "vis-3", stepIndex: 3, title: "The Emotional Anchor", content: "Emotion is the glue that makes visualization stick. Without feeling, it is a daydream. With feeling, it is a command. The feeling of already having your desire — gratitude, relief, joy — must be stronger than your current reality's feeling. Emotion > Logic. Always.", actionPrompt: "Recall a moment of pure joy from your past. Now overlay that feeling onto your visualization. Anchor them together.", durationMinutes: 6, visualCue: "♥" },
    { id: "vis-4", stepIndex: 4, title: "First-Person Perspective", content: "Do not watch yourself from outside. Be inside the scene. Look through your own eyes. See your hands holding the keys. Feel the weight. This is the difference between watching a movie and living it. First-person visualization activates the motor cortex. Your body begins to prepare for the experience.", actionPrompt: "Redo your visualization from inside your body. Look down at your hands. See your own perspective. Feel the ground under your feet.", durationMinutes: 7, visualCue: "👁" },
    { id: "vis-5", stepIndex: 5, title: "The Loop Technique", content: "Create a 60-second visualization loop. Play it every morning and every night. Same scene. Same feelings. The repetition creates a neural groove like a river carving a canyon. After 21 days, the loop plays automatically in your subconscious. Your reality bends to match it.", actionPrompt: "Commit to 21 days of daily visualization. Set a timer. Same scene. No variation. Repetition is the mother of skill — and reality.", durationMinutes: 5, visualCue: "∞" },
  ],
  "scripting": [
    { id: "scr-1", stepIndex: 1, title: "Write in Past Tense", content: "The most powerful scripting technique is writing as if it already happened. Not 'I want' or 'I will.' But 'I am so grateful that...' The past tense bypasses the skeptical mind. It communicates directly with the subconscious, which operates in the eternal now. Your writing becomes a historical record of your future.", actionPrompt: "Open your journal. Write 3 sentences in past tense about your desire. 'I am so grateful that I received...' Feel it as memory.", durationMinutes: 6, visualCue: "✍" },
    { id: "scr-2", stepIndex: 2, title: "Gratitude as Fuel", content: "Every scripting session must begin with gratitude. Why? Because gratitude is the frequency of receiving. When you are grateful, the universe assumes you are already in the state of having. It sends more. Gratitude is not a feeling. It is a mathematical attractor. It pulls matching experiences into your orbit.", actionPrompt: "Write 5 things you are grateful for right now. Then write your desire as already done. Feel the bridge between them.", durationMinutes: 7, visualCue: "🙏" },
    { id: "scr-3", stepIndex: 3, title: "Specificity is Power", content: "Vague scripting creates vague results. 'I want a nice car' manifests as a toy car. The universe is literal. Write the exact model, color, interior, the feeling of the steering wheel, the sound of the exhaust, the reactions of your friends. Specificity is not greed. It is clarity. The universe rewards clarity.", actionPrompt: "Add 5 sensory details to your scripting. Exact amounts, colors, textures, temperatures, sounds. Make it undeniable.", durationMinutes: 6, visualCue: "🔍" },
    { id: "scr-4", stepIndex: 4, title: "The 17-Second Rule", content: "Abraham Hicks teaches that 17 seconds of pure thought activates the Law of Attraction. 68 seconds creates manifestation momentum. Scripting is extended 17-second focus. When you write, you are holding the thought for minutes. This is why scripting outperforms passive thinking by 100x.", actionPrompt: "Write for 68 seconds without stopping. One continuous flow of gratitude and completion. Do not pause. Do not think. Just flow.", durationMinutes: 5, visualCue: "68" },
  ],
  "neville-goddard": [
    { id: "nev-1", stepIndex: 1, title: "The Law of Assumption", content: "Neville Goddard taught that consciousness is the only reality. You do not attract what you want; you express what you assume yourself to be. If you assume lack, the world mirrors lack. If you assume fulfilment, the world rearranges to confirm fulfilment. The assumption must feel natural, not forced. Your inner state is the cause; the outer event is the effect.", actionPrompt: "Choose one desire. Write the identity assumption behind it: 'I am the person who naturally...' Make it feel calm, normal, and already true.", durationMinutes: 6, visualCue: "I AM" },
    { id: "nev-2", stepIndex: 2, title: "SATS: State Akin To Sleep", content: "SATS is Neville's signature technique. Enter the drowsy borderland before sleep where the conscious mind relaxes and the subconscious accepts impressions. In this state, play a short scene that implies your desire is already fulfilled. Not the process. Not the how. Only the fulfilled end. Repeat until it has the tones of reality.", actionPrompt: "Tonight, before sleep, relax deeply and loop a 10-second scene that could only happen after your wish is fulfilled.", durationMinutes: 8, visualCue: "SATS" },
    { id: "nev-3", stepIndex: 3, title: "Living in the End", content: "Living in the end does not mean pretending all day. It means returning to the inner certainty that the outcome is done. Ask: 'How would I think, breathe, walk, and decide if this were already mine?' Then embody that state in small ordinary moments. The end state is quiet confidence, not frantic excitement.", actionPrompt: "For the next 3 minutes, move as the fulfilled version of you. Adjust your posture, breath, and decision energy.", durationMinutes: 5, visualCue: "END" },
    { id: "nev-4", stepIndex: 4, title: "Revision Technique", content: "Neville taught that the past is not fixed in consciousness. At night, revise any unwanted event by replaying it as it should have happened. Revision changes your relationship to the memory, removes emotional charge, and plants a new causal seed. You are not denying reality; you are selecting the version of reality your consciousness will continue from.", actionPrompt: "Pick one moment from today that felt off. Close your eyes and replay it perfectly for 60 seconds. Feel the relief of the revised ending.", durationMinutes: 7, visualCue: "↺" },
    { id: "nev-5", stepIndex: 5, title: "Inner Conversations", content: "Your inner conversations are creative acts. If you mentally argue, explain, fear rejection, or rehearse failure, you are assuming that state. Neville advised hearing conversations that imply success: a friend congratulating you, a parent proud of you, a client saying yes. The words you hear inside become the facts you meet outside.", actionPrompt: "Create a 2-line inner conversation where someone congratulates you. Hear their exact voice. Reply with gratitude.", durationMinutes: 6, visualCue: "💬" },
    { id: "nev-6", stepIndex: 6, title: "The Congratulations Scene", content: "The most powerful Neville scene is often simple: someone you trust congratulates you. This implies the desire is complete, witnessed, and accepted by the world. Keep it short enough to loop. Add touch, sound, and emotion. A handshake. A hug. A phone call. The scene should feel like a memory from tomorrow.", actionPrompt: "Design your congratulations scene now: who is there, what do they say, what do you physically feel, and what emotion proves it is done?", durationMinutes: 8, visualCue: "🏆" },
  ],
  "affirmations": [
    { id: "aff-1", stepIndex: 1, title: "I AM Frequency", content: "The two most powerful words in any language are 'I AM.' Whatever follows them becomes your reality. I AM wealthy. I AM healthy. I AM loved. Your subconscious accepts I AM statements as commands without filtering. This is the master key. Use it with reverence. Use it with power.", actionPrompt: "Write 10 I AM statements. Each must feel 70% believable. If it feels impossible, soften it. 'I AM becoming financially free.' Build up.", durationMinutes: 6, visualCue: "I AM" },
    { id: "aff-2", stepIndex: 2, title: "The Mirror Technique", content: "Stand before a mirror. Look into your own eyes. Say your affirmations aloud. This is the most confronting and transformative practice. The mirror reflects your truth back to you. If you cannot say it while looking at yourself, you do not believe it. The mirror does not lie. It heals.", actionPrompt: "Go to a mirror right now. Look into your eyes. Say your top 3 affirmations. Notice where you feel resistance. That is your target.", durationMinutes: 7, visualCue: "🪞" },
    { id: "aff-3", stepIndex: 3, title: "The Audio Loop", content: "Record your affirmations in your own voice. Play them while sleeping. The subconscious is most receptive during the first 20 minutes of sleep and the last 20 minutes before waking. Your own voice is the most trusted frequency in the universe. It bypasses all defenses.", actionPrompt: "Record your top 10 affirmations. Play them tonight. Do this for 21 nights. Your dreams will begin to change first.", durationMinutes: 5, visualCue: "🔊" },
    { id: "aff-4", stepIndex: 4, title: "Emotional Anchoring", content: "Every affirmation must be paired with a physical gesture and a peak emotional state. When you say 'I AM abundant,' touch your heart and feel the memory of receiving unexpected money. The gesture becomes the trigger. In time, touching your heart alone activates the feeling of abundance.", actionPrompt: "Choose one gesture. Practice pairing it with your affirmation and peak emotion 10 times. Create a neural anchor.", durationMinutes: 7, visualCue: "⚓" },
  ],
  "nlp-reprogramming": [
    { id: "nlp-1", stepIndex: 1, title: "The Swish Pattern", content: "NLP's Swish Pattern replaces unwanted mental images with desired ones in milliseconds. You see the problem image. You see the desired image. You swish them — the problem shrinks to a dot and flies away, the desired image explodes into full color and sound. Repeat 5 times. The old pattern is overwritten.", actionPrompt: "Identify one limiting belief image. Create a powerful replacement image. Swish them mentally 5 times. Feel the shift.", durationMinutes: 8, visualCue: "⇄" },
    { id: "nlp-2", stepIndex: 2, title: "Submodalities Shift", content: "Every mental image has properties: size, color, brightness, distance, sound. A limiting belief is usually big, dark, close, and loud. A resourceful belief is bright, colorful, panoramic, and silent. Change the submodalities of your desire image. Make it huge, bright, 3D, and right in front of you.", actionPrompt: "Take your desire image. Make it 10x bigger. Add color. Bring it closer. Add a soundtrack. Feel the intensity multiply.", durationMinutes: 7, visualCue: "🔆" },
    { id: "nlp-3", stepIndex: 3, title: "Timeline Therapy", content: "Imagine your life as a timeline — a line of light stretching from your past to your future. Float above it. See your past self struggling. Send them love, wisdom, and strength. Then float to your future self who has already achieved everything. Ask them what they did. Merge with that future self. Bring that energy back.", actionPrompt: "Close your eyes. Float above your timeline. Visit your future self. Ask: 'What is the one thing you want me to know?' Listen.", durationMinutes: 10, visualCue: "⏳" },
    { id: "nlp-4", stepIndex: 4, title: "Anchoring Power States", content: "Recall a moment of absolute confidence. Relive it fully. At the peak intensity, squeeze your thumb and forefinger together. Hold for 5 seconds. Release. Repeat 3 times. You have now anchored that state to that gesture. Anytime you need confidence, squeeze. The state floods back instantly.", actionPrompt: "Recall your peak confidence moment. Anchor it to a finger squeeze. Test it 3 times. Notice the rush.", durationMinutes: 6, visualCue: "👌" },
    { id: "nlp-5", stepIndex: 5, title: "Parts Integration", content: "We often have conflicting parts — one part wants wealth, another part fears success. Both are trying to protect you. In NLP Parts Integration, you visualize both parts as energies. You bring them together. They merge into a single, unified force. The conflict dissolves. Forward movement becomes effortless.", actionPrompt: "Identify two conflicting parts of yourself. Visualize them. Dialogue with them. Ask what they need. Merge them into one light.", durationMinutes: 8, visualCue: "☯" },
    { id: "nlp-6", stepIndex: 6, title: "The Fast Phobia Cure", content: "Fear is the #1 blocker of manifestation. The Fast Phobia Cure runs the feared event backwards in black-and-white, then dissociates you from it, then runs it forward at double speed while you watch from a safe distance. The emotional charge is drained. What remains is a memory without a trigger.", actionPrompt: "Identify one fear that blocks your desire. Run it backwards in your mind. Then watch it from above. Speed it up. The fear loses power.", durationMinutes: 8, visualCue: "⏪" },
  ],
  "quantum-jump": [
    { id: "qj-1", stepIndex: 1, title: "Many-Worlds Theory", content: "Quantum physics says reality exists in superposition — all possibilities exist simultaneously until observed. The version of you who has your desire already exists in a parallel universe. Your job is not to create it. Your job is to tune your frequency to match that version. Then you collapse into that timeline.", actionPrompt: "Write down 3 traits of your parallel successful self. Not what they have. Who they ARE. This is your frequency map.", durationMinutes: 6, visualCue: "∞" },
    { id: "qj-2", stepIndex: 2, title: "The Two-Cup Method", content: "Take two cups. Label one with your current state. Label the other with your desired state. Fill the current-state cup with water. Hold it. Feel the old reality. Pour the water into the desired-state cup. Drink it. The water is now charged with your intention. This is a physical ritual that collapses quantum probability.", actionPrompt: "Do the Two-Cup Method right now. Use real cups. Real water. The physical act is the bridge between dimensions.", durationMinutes: 8, visualCue: "🥤" },
    { id: "qj-3", stepIndex: 3, title: "The Mirror Technique", content: "Stand in a dark room. Face a mirror. Dim the light until you can barely see. Stare into your own eyes. After 5 minutes, your face will begin to shift. You are seeing your parallel selves. Ask the mirror version: 'How did you do it?' Some practitioners report the mirror self actually answers. The quantum veil is thin here.", actionPrompt: "Try the mirror technique tonight. 5 minutes minimum. Journal everything you see, feel, or hear. Do not fear the shift.", durationMinutes: 7, visualCue: "🪞" },
    { id: "qj-4", stepIndex: 4, title: "Dimensional Jumping Signs", content: "After a successful quantum jump, you may notice small changes. The Mandela Effect. A different colored car. A moved object. A memory that feels slightly off. These are not glitches. They are confirmation. You are not in the same timeline. The old reality is fading. The new one is solidifying.", actionPrompt: "Notice 3 small differences in your environment today. Do not dismiss them. They are your quantum breadcrumbs.", durationMinutes: 5, visualCue: "🌀" },
    { id: "qj-5", stepIndex: 5, title: "The Eternal Now Jump", content: "The past and future are concepts. Only now exists. If you can fully embody the feeling of your desire NOW, the timeline collapses instantly. This is the fastest jump. No rituals. No waiting. Just pure, absolute, undiluted presence in the feeling of completion. The masters use this. It is the ultimate shortcut.", actionPrompt: "For 60 seconds, be the person who already has everything. No future. No past. Just NOW. Feel it until your body believes it.", durationMinutes: 7, visualCue: "NOW" },
  ],
  "buddha-wisdom": [
    { id: "bud-1", stepIndex: 1, title: "Right Intention", content: "Buddha taught the Noble Eightfold Path. Right Intention is the foundation of manifestation. Not greed. Not desperation. But intention rooted in compassion, harmlessness, and renunciation of attachment. When your desire serves the highest good of all, the universe conspires with unlimited force.", actionPrompt: "Examine your desire. Does it serve only you, or does it uplift others? Reframe it as a force for good. Write the expanded intention.", durationMinutes: 7, visualCue: "☸" },
    { id: "bud-2", stepIndex: 2, title: "The Paradox of Desire", content: "Buddha said desire is the root of suffering. But he also taught that the Middle Way — neither extreme asceticism nor indulgence — leads to liberation. The secret: Want without wanting. Hold the desire lightly. Do not clutch it. A closed fist cannot receive. An open hand attracts everything.", actionPrompt: "Visualize your desire as a bird on your open palm. If you grip, it flies away. If you hold gently, it stays. Practice this mental image.", durationMinutes: 7, visualCue: "🕊" },
    { id: "bud-3", stepIndex: 3, title: "Mindfulness as Manifestation", content: "Mindfulness is not just stress relief. It is reality creation. When you are fully present, you are not broadcasting doubt, fear, or lack. You are broadcasting pure signal. The universe responds to clarity. A mindful mind is a manifestation superconductor. No resistance. No static. Just flow.", actionPrompt: "Practice 10 minutes of breath mindfulness right now. Count 10 breaths. If you lose count, start over. This is concentration training for your manifestation power.", durationMinutes: 12, visualCue: "🧘" },
    { id: "bud-4", stepIndex: 4, title: "Karma & Co-Creation", content: "Karma means action. Every thought is an action. Every feeling is an action. Your present reality is the ripening of past karma. Your future reality is the planting of present karma. You are not waiting for the universe. You are the universe. Plant wisely. The harvest is mathematically guaranteed.", actionPrompt: "Write 3 positive actions you will take today. Not for the result. For the karma. The result is the side effect of right action.", durationMinutes: 6, visualCue: "⚙" },
    { id: "bud-5", stepIndex: 5, title: "The Diamond Sutra Secret", content: "The Diamond Sutra says: 'All conditioned phenomena are like dreams, illusions, bubbles, shadows.' Your current reality is a dream. Your desired reality is also a dream. But here's the secret: If you know it's a dream, you can lucid dream. You can change the dream. Awakening is the ultimate manifestation technique.", actionPrompt: "Practice lucid dreaming tonight. Before sleep, repeat: 'I am aware that I am dreaming.' When you realize it in the dream, change one thing. This is practice for waking reality.", durationMinutes: 5, visualCue: "💎" },
  ],
  "osho-techniques": [
    { id: "osh-1", stepIndex: 1, title: "Dynamic Meditation", content: "Osho rejected silent sitting. He said modern humans have too much repressed energy. Dynamic Meditation is 5 stages: 10 minutes of chaotic breathing, 10 minutes of catharsis (screaming, crying, laughing), 10 minutes of jumping and shouting 'Hoo!', 15 minutes of silence, and 15 minutes of celebration. This clears blocks that decades of therapy cannot touch.", actionPrompt: "Do a 5-minute mini version right now. Breathe chaotically for 1 minute. Scream or laugh for 1 minute. Jump and shout 'Hoo!' for 1 minute. Sit silently for 1 minute. Dance for 1 minute. Feel the shift.", durationMinutes: 7, visualCue: "🔥" },
    { id: "osh-2", stepIndex: 2, title: "Kundalini Shaking", content: "Lie down. Allow your body to shake. Do not force it. Do not control it. The shaking is the release of trauma stored in the muscles. Osho said the body holds every unexpressed emotion as tension. Shaking is the body's natural healing mechanism. Animals shake after trauma. Humans have forgotten how. Remember.", actionPrompt: "Lie down on the floor. Allow your body to shake for 5 minutes. No control. No choreography. Just permission. The body knows what to release.", durationMinutes: 8, visualCue: "〰" },
    { id: "osh-3", stepIndex: 3, title: "The Witness Consciousness", content: "Osho's core teaching: Be the witness. Do not identify with your thoughts. Do not identify with your emotions. Just watch them. Like clouds in the sky. When you are the witness, you are not the victim. You are the observer. And the observer is always free. From this freedom, manifestation is effortless.", actionPrompt: "Sit quietly for 5 minutes. Watch your thoughts without judgment. Label them: 'Thinking.' 'Feeling.' 'Sensing.' Do not engage. Just witness.", durationMinutes: 7, visualCue: "👁" },
    { id: "osh-4", stepIndex: 4, title: "Chaos to Creativity", content: "Osho taught that creativity is born from chaos, not order. When you allow chaos, you break the rigid structures of the mind. In that broken space, new possibilities emerge. Most manifestation blocks are rigid structures. You are trying to manifest within a box. Destroy the box. The universe is infinite.", actionPrompt: "Do something chaotic and creative. Write nonsense for 2 minutes. Dance badly. Sing off-key. Break your pattern. The universe rushes in where structure breaks.", durationMinutes: 6, visualCue: "🎨" },
    { id: "osh-5", stepIndex: 5, title: "Living in the Body", content: "Osho said the mind is a parasite. It lives in the past and future. The body lives only in the now. To manifest, you must descend from the mind into the body. Feel your feet on the ground. Feel your breath in your belly. Feel your heart beating. From the body, intention becomes instinct. And instinct is unstoppable.", actionPrompt: "Stand up. Feel your feet. Feel your legs. Feel your spine. Feel your chest. Feel your head. Scan your entire body for 3 minutes. Become embodied.", durationMinutes: 5, visualCue: "🧍" },
  ],
  "the-secret": [
    { id: "sec-1", stepIndex: 1, title: "The Law of Attraction", content: "Rhonda Byrne revealed the universe's greatest secret: the Law of Attraction. Like attracts like. Your thoughts are magnetic — they broadcast a frequency that draws matching experiences back to you. Think abundance, attract abundance. Think lack, attract lack. This law is impartial, constant, and as reliable as gravity. You are already using it every moment. The question is: are you using it deliberately?", actionPrompt: "Write down 3 dominant thoughts you had today. Are they serving or sabotaging you? This is your current frequency.", durationMinutes: 7, visualCue: "🧲" },
    { id: "sec-2", stepIndex: 2, title: "Ask, Believe, Receive", content: "The Secret's 3-step process is deceptively simple. Step 1: ASK — get crystal clear on what you want. The universe cannot deliver a vague order. Step 2: BELIEVE — feel the absolute certainty that it is already yours. Doubt cancels the order. Step 3: RECEIVE — shift into the emotional state of already having it. Gratitude, joy, excitement. The universe matches your feeling, not your words.", actionPrompt: "Write your desire as a clear, present-tense command. 'I am so happy and grateful now that...' Feel it NOW.", durationMinutes: 8, visualCue: "3" },
    { id: "sec-3", stepIndex: 3, title: "The Power of Gratitude", content: "Gratitude is the master key of The Secret. Why? Because you cannot feel grateful and lackful at the same time. Gratitude instantly shifts your frequency to receiving mode. Byrne says: when you wake up, list 5 things you're grateful for before your feet touch the floor. This programs your entire day. Gratitude is not just a nice feeling — it is a manifestation technology.", actionPrompt: "Write 10 things you are grateful for right now. Feel each one for 5 seconds. Notice your energy shift.", durationMinutes: 6, visualCue: "🙏" },
    { id: "sec-4", stepIndex: 4, title: "Visualization as Creation", content: "The Secret teaches that your brain cannot tell the difference between something real and something vividly imagined. When you visualize, you create. The book describes vision boards, mental movies, and 'the check' technique — writing yourself a check for the amount you want and carrying it. Your subconscious accepts the image as reality and begins organizing the outer world to match.", actionPrompt: "Create a 60-second mental movie of your desire fulfilled. Use all 5 senses. Play it 3 times. Lock it in.", durationMinutes: 8, visualCue: "🎬" },
    { id: "sec-5", stepIndex: 5, title: "The Secret Shifters", content: "Byrne shares 'Secret Shifters' — quick tools to change your frequency when you feel low. Listen to uplifting music. Think of a loved one. Recall a happy memory. Pet an animal. Walk in nature. The goal is to never stay in a low frequency for long. Your feelings are your manifestation compass. Good feelings = on track. Bad feelings = off track. Shift fast.", actionPrompt: "List 5 things that instantly make you feel good. Use them as emergency frequency shifters today.", durationMinutes: 5, visualCue: "⚡" },
    { id: "sec-6", stepIndex: 6, title: "Becoming a Deliberate Creator", content: "The ultimate lesson: you are the creator of your reality. Not a victim. Not a passenger. A creator. Most people manifest by default — reacting to circumstances, thinking random thoughts, attracting randomly. The Secret's graduation is deliberate creation: choosing your thoughts, guarding your frequency, feeling the end result before it appears, and trusting the universe to deliver. You are the architect. Now build.", actionPrompt: "Write your Declaration of Deliberate Creation: 'I am the deliberate creator of my reality. From today, I choose my frequency consciously.' Sign and date it.", durationMinutes: 6, visualCue: "👑" },
  ],
};

export default function ModuleWalkthrough({
  module,
  progress,
  onClose,
  onLessonComplete,
  onModuleComplete,
  onSwitchModule,
}: ModuleWalkthroughProps) {
  const lessons = LESSON_DATA[module.id] || [];

  // Defensive: if module has no lessons (e.g. legacy data), don't render
  // an empty walkthrough that just shows the intro screen forever.
  if (lessons.length === 0) {
    return (
      <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <div className="relative z-10 max-w-md w-full text-center space-y-5 my-auto">
          <div className="mx-auto w-20 h-20 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center">
            <BookOpen size={32} className="text-white/30" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Module Content Coming Soon</h2>
            <p className="text-sm text-white/40">
              The lessons for <span className="font-semibold text-white/70">{module.title}</span> are
              being prepared. Check back shortly to begin this journey.
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold uppercase tracking-wider transition"
          >
            Back to Academy
          </button>
        </div>
      </div>
    );
  }
  const relatedModules = DEFAULT_MODULES.filter((m) => m.category === module.category && m.id !== module.id);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(
    new Set(progress?.completedLessonIds || [])
  );
  const [actionDone, setActionDone] = useState(false);

  // Force reset state when MODULE CHANGES ONLY (not on every progress update,
  // otherwise the lesson sequence resets mid-walkthrough every time a
  // single lesson is marked done — this caused the "stuck on intro" bug).
  useEffect(() => {
    setCurrentStep(0);
    setCompletedLessons(new Set(progress?.completedLessonIds || []));
    setActionDone(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [module.id]);

  const Icon = moduleIcons[module.icon] || Zap;
  const totalSteps = lessons.length;
  // Step 0 = intro, steps 1..N = lessons, step N+1 = outro
  const isIntro = currentStep === 0;
  const isOutro = currentStep > totalSteps;
  const lessonIndex = isIntro || isOutro ? -1 : currentStep - 1;
  const currentLesson = lessonIndex >= 0 ? lessons[lessonIndex] : undefined;
  const isLastLesson = lessonIndex === totalSteps - 1;
  const allDone = completedLessons.size >= totalSteps && totalSteps > 0;

  const handleMarkDone = useCallback(() => {
    if (!currentLesson || completedLessons.has(currentLesson.id)) return;
    const newSet = new Set(completedLessons);
    newSet.add(currentLesson.id);
    setCompletedLessons(newSet);
    onLessonComplete(currentLesson.id, 15);
    setActionDone(false);
  }, [currentLesson, completedLessons, onLessonComplete]);

  const handleModuleComplete = useCallback(() => {
    if (!allDone) return;
    onModuleComplete(100);
  }, [allDone, onModuleComplete]);

  const nextStep = () => {
    if (isLastLesson && currentLesson && !completedLessons.has(currentLesson.id)) {
      setActionDone(true);
      return;
    }
    if (currentStep <= totalSteps) {
      setCurrentStep((s) => s + 1);
      setActionDone(false);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
      setActionDone(false);
    }
  };

  const goToStep = (stepNum: number) => {
    setCurrentStep(stepNum);
    setActionDone(false);
  };

  // ─── INTRO SCREEN ───
  if (isIntro) {
    return (
      <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <ModuleBackground moduleId={module.id} accentColor={module.accentColor} />

        <div className="relative z-10 max-w-2xl w-full text-center space-y-8 my-auto">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="mx-auto w-24 h-24 rounded-3xl flex items-center justify-center relative"
            style={{ backgroundColor: `${module.accentColor}12`, border: `1px solid ${module.accentColor}30` }}
          >
            <div className="absolute inset-0 rounded-3xl" style={{ boxShadow: `0 0 60px ${module.accentColor}15` }} />
            <Icon size={40} style={{ color: module.accentColor }} />
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-3"
          >
            <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
              {module.title}
            </h1>
            <p className="text-lg md:text-xl font-medium" style={{ color: module.accentColor }}>
              {module.subtitle}
            </p>
            <p className="text-sm text-white/30 max-w-lg mx-auto leading-relaxed">
              {module.description}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-center gap-6 text-[11px] font-mono text-white/20 uppercase tracking-wider"
          >
            <span className="flex items-center gap-1.5">
              <Timer size={12} />
              {module.estimatedMinutes} min
            </span>
            <span className="w-1 h-1 rounded-full bg-white/10" />
            <span className="flex items-center gap-1.5">
              <BookOpen size={12} />
              {module.totalLessons} lessons
            </span>
            <span className="w-1 h-1 rounded-full bg-white/10" />
            <span className="flex items-center gap-1.5">
              <Award size={12} />
              {module.badgeName}
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center gap-4"
          >
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-2xl border border-white/10 text-white/40 hover:text-white hover:border-white/20 text-[11px] font-mono uppercase tracking-wider font-bold transition-all cursor-pointer"
            >
              Back
            </button>
            <button
              onClick={nextStep}
              className="flex items-center gap-2 px-8 py-3.5 rounded-2xl text-black font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-lg"
              style={{ backgroundColor: module.accentColor }}
            >
              <Play size={14} fill="black" />
              Begin Journey
            </button>
          </motion.div>

          <div className="flex items-center justify-center gap-2 pt-4">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === 0 ? "bg-white w-6" : "bg-white/10"
                }`}
              />
            ))}
          </div>
          <p className="text-[10px] font-mono text-white/20 uppercase tracking-wider">
            {totalSteps} lessons
          </p>
        </div>
      </div>
    );
  }

  // ─── OUTRO / COMPLETION SCREEN ───
  if (isOutro) {
    return (
      <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <ModuleBackground moduleId={module.id} accentColor={module.accentColor} />

        <div className="relative z-10 max-w-lg w-full text-center space-y-8 my-auto">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, type: "spring" }}
            className="mx-auto w-28 h-28 rounded-full flex items-center justify-center relative"
            style={{ backgroundColor: `${module.accentColor}18`, border: `2px solid ${module.accentColor}50` }}
          >
            <div className="absolute inset-0 rounded-full animate-ping" style={{ backgroundColor: `${module.accentColor}10` }} />
            <Award size={44} style={{ color: module.accentColor }} />
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="space-y-2"
          >
            <h2 className="text-2xl md:text-4xl font-bold text-white tracking-tight">
              Module Complete
            </h2>
            <p className="text-sm text-white/40">
              You have mastered <span className="font-semibold" style={{ color: module.accentColor }}>{module.title}</span>
            </p>
          </motion.div>

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="rounded-2xl p-6 md:p-8 space-y-3"
            style={{ backgroundColor: `${module.accentColor}06`, border: `1px solid ${module.accentColor}15` }}
          >
            <div className="flex items-center justify-center gap-3">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${module.accentColor}15` }}
              >
                <span className="text-2xl">{module.badgeIcon}</span>
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-white">{module.badgeName} Badge Earned</p>
                <p className="text-[11px] text-white/30">Academy Achievement</p>
              </div>
            </div>
            <div className="h-px bg-white/5" />
            <div className="flex items-center justify-center gap-6 text-[11px] font-mono text-white/30 uppercase tracking-wider">
              <span className="flex items-center gap-1">
                <Zap size={10} style={{ color: module.accentColor }} />
                +100 XP
              </span>
              <span className="flex items-center gap-1">
                <BookOpen size={10} style={{ color: module.accentColor }} />
                +{module.totalLessons} Lessons
              </span>
              <span className="flex items-center gap-1">
                <Timer size={10} style={{ color: module.accentColor }} />
                {module.estimatedMinutes}m Total
              </span>
            </div>
          </motion.div>

          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => goToStep(0)}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-white/10 text-white/40 hover:text-white hover:border-white/20 text-[11px] font-mono uppercase tracking-wider font-bold transition-all cursor-pointer"
            >
              <RotateCcw size={12} />
              Review
            </button>
            <button
              onClick={handleModuleComplete}
              className="flex items-center gap-2 px-8 py-3.5 rounded-2xl text-black font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-lg"
              style={{ backgroundColor: module.accentColor }}
            >
              <CheckCircle2 size={14} />
              Collect & Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── LESSON SLIDE ───
  const stepPercent = ((currentStep) / totalSteps) * 100;
  const lessonDone = currentLesson ? completedLessons.has(currentLesson.id) : false;

  return (
    <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-xl flex flex-col overflow-y-auto">
      <ModuleBackground moduleId={module.id} accentColor={module.accentColor} />

      {/* Top Bar — sticky to top so it stays visible while content scrolls */}
      <div className="sticky top-0 z-20 shrink-0 flex items-center justify-between px-4 md:px-8 py-4 border-b border-white/[0.03] bg-black/80 backdrop-blur-xl">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-white/30 hover:text-white text-[11px] font-mono uppercase tracking-wider font-bold transition-all cursor-pointer"
        >
          <X size={14} />
          Exit
        </button>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-white/20 uppercase tracking-wider">
            Lesson {currentStep} of {totalSteps}
          </span>
          <div className="w-24 h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: module.accentColor }}
              initial={{ width: 0 }}
              animate={{ width: `${stepPercent}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>

      {/* Main Content — scrollable area between sticky top bar and sticky bottom nav */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-8 relative z-10">
        <div className="max-w-2xl mx-auto space-y-8">
          <AnimatePresence mode="wait">
            {currentLesson && (
              <motion.div
                key={currentLesson.id}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="space-y-6"
              >
                {/* Lesson Visual Header */}
                <LessonVisual
                  moduleId={module.id}
                  accentColor={module.accentColor}
                  stepIndex={currentLesson.stepIndex}
                />

                {/* Lesson Header */}
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-black"
                      style={{ backgroundColor: module.accentColor }}
                    >
                      {currentLesson.stepIndex}
                    </div>
                    <div>
                      <p className="text-[10px] font-mono uppercase tracking-wider text-white/20">
                        Step {currentLesson.stepIndex}
                      </p>
                      <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                        {currentLesson.title}
                      </h2>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="rounded-2xl bg-white/[0.015] border border-white/[0.04] p-6 md:p-8 space-y-4">
                  <p className="text-sm md:text-base text-white/50 leading-[1.8] font-sans">
                    {currentLesson.content}
                  </p>
                </div>

                {/* Action Prompt */}
                {currentLesson.actionPrompt && (
                  <div
                    className="rounded-2xl p-6 md:p-8 border space-y-4"
                    style={{ backgroundColor: `${module.accentColor}06`, borderColor: `${module.accentColor}15` }}
                  >
                    <div className="flex items-center gap-2">
                      <Zap size={14} style={{ color: module.accentColor }} />
                      <span className="text-[10px] font-mono uppercase tracking-wider font-bold" style={{ color: module.accentColor }}>
                        Your Action Now
                      </span>
                    </div>
                    <p className="text-sm text-white/60 leading-relaxed font-medium">
                      {currentLesson.actionPrompt}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-white/20 uppercase tracking-wider">
                      <Timer size={10} />
                      Estimated: {currentLesson.durationMinutes} minutes
                    </div>
                  </div>
                )}

                {/* Mark Done */}
                <div className="flex items-center justify-between">
                  {lessonDone ? (
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex items-center gap-2 text-emerald-400 text-sm font-medium"
                    >
                      <CheckCircle2 size={18} />
                      Completed — +15 XP
                    </motion.div>
                  ) : (
                    <button
                      onClick={() => setActionDone(true)}
                      className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        actionDone
                          ? "text-black"
                          : "bg-white/[0.02] border border-white/5 text-white/40 hover:text-white hover:border-white/10"
                      }`}
                      style={actionDone ? { backgroundColor: module.accentColor } : {}}
                    >
                      {actionDone ? (
                        <>
                          <CheckCircle2 size={14} />
                          Confirm Completion
                        </>
                      ) : (
                        <>
                          <Circle size={14} />
                          I Did This Action
                        </>
                      )}
                    </button>
                  )}

                  {actionDone && !lessonDone && (
                    <motion.button
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      onClick={handleMarkDone}
                      className="flex items-center gap-2 px-6 py-3 rounded-2xl text-black font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-lg"
                      style={{ backgroundColor: module.accentColor }}
                    >
                      <CheckCircle2 size={14} />
                      Mark Complete
                    </motion.button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom Navigation */}
      {/* Bottom Navigation — sticky to bottom */}
      <div className="sticky bottom-0 z-20 shrink-0 border-t border-white/[0.03] px-4 md:px-8 py-4 bg-black/80 backdrop-blur-xl">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep <= 1}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white/30 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed text-[11px] font-mono uppercase tracking-wider font-bold transition-all cursor-pointer"
          >
            <ArrowLeft size={14} />
            Previous
          </button>

          {/* Step Dots */}
          <div className="hidden md:flex items-center gap-1.5">
            {lessons.map((l, i) => {
              const idx = i + 1;
              const isCurrent = idx === currentStep;
              const isDone = completedLessons.has(l.id);
              return (
                <button
                  key={l.id}
                  onClick={() => goToStep(idx)}
                  className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                    isCurrent ? "w-6 bg-white" : isDone ? "bg-emerald-400" : "bg-white/10 hover:bg-white/20"
                  }`}
                />
              );
            })}
          </div>

          <button
            onClick={nextStep}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-black font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-lg"
            style={{ backgroundColor: module.accentColor }}
          >
            {isLastLesson ? "Finish" : "Next"}
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

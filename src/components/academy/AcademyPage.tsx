import React from "react";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  BookOpen,
  Lock,
  CheckCircle2,
  Circle,
  Flame,
  Zap,
  Crown,
  Star,
  TrendingUp,
  Play,
  Award,
  ArrowRight,
  Sparkles,
  X,
  Clock,
  BarChart3,
  Layers,
  Compass,
  Diamond,
  Infinity,
  Timer,
  Eye,
  Lightbulb,
  Orbit,
  Fingerprint,
  BrainCircuit,
  Waves,
  Hexagon,
  Triangle,
  Pentagon,
  Square,
  CircleDashed,
  Heart,
} from "lucide-react";
import { AcademyModule, AcademyProgress, AcademyBadge } from "../../types";
import ModuleWalkthrough from "./ModuleWalkthrough";
import AcademyCertificate from "./AcademyCertificate";

interface AcademyPageProps {
  modules: AcademyModule[];
  progress: Record<string, AcademyProgress>;
  badges: AcademyBadge[];
  overallStreak: number;
  isPremium: boolean;
  onModuleComplete: (moduleId: string, xpGained: number) => void;
  onLessonComplete: (moduleId: string, lessonId: string, xpGained: number) => void;
  onPaywall: (message: string) => void;
}

const moduleIcons: Record<string, typeof Zap> = {
  zap: Zap,
  flame: Flame,
  crown: Crown,
  star: Star,
  book: BookOpen,
  trending: TrendingUp,
  award: Award,
  sparkles: Sparkles,
  circle: Circle,
  check: CheckCircle2,
  eye: Eye,
  brain: BrainCircuit,
  heart: Heart,
};

export const DEFAULT_MODULES: AcademyModule[] = [
  {
    id: "tesla-369",
    title: "Tesla 369 Method",
    subtitle: "The Sacred Manifestation Code",
    description: "Nikola Tesla's divine numerical pattern: 3 writings in the morning, 6 in the afternoon, 9 at night. Harness the mathematical rhythm of the universe.",
    icon: "zap",
    accentColor: "#fbbf24",
    estimatedMinutes: 21,
    totalLessons: 5,
    category: "method",
    badgeName: "369 Initiate",
    badgeIcon: "zap",
  },
  {
    id: "555-method",
    title: "555 Method",
    subtitle: "The 5-Day Reality Shift",
    description: "Write your desire 55 times for 5 days. A concentrated burst of intention that rewires your subconscious faster than any other technique.",
    icon: "flame",
    accentColor: "#f97316",
    estimatedMinutes: 35,
    totalLessons: 5,
    category: "method",
    badgeName: "555 Alchemist",
    badgeIcon: "flame",
  },
  {
    id: "1111-guide",
    title: "11:11 Guide",
    subtitle: "Portal Alignment Mastery",
    description: "Master the synchronicity of 11:11. Learn to recognize cosmic signals, set portal intentions, and align with your higher timeline.",
    icon: "crown",
    accentColor: "#a78bfa",
    estimatedMinutes: 18,
    totalLessons: 4,
    category: "spiritual",
    badgeName: "Portal Keeper",
    badgeIcon: "crown",
  },
  {
    id: "visualization",
    title: "Visualization Guide",
    subtitle: "Cinematic Mind Movies",
    description: "Create vivid mental movies with sensory detail. Activate the same neural pathways as real experience and program your subconscious for success.",
    icon: "star",
    accentColor: "#38bdf8",
    estimatedMinutes: 28,
    totalLessons: 5,
    category: "mindset",
    badgeName: "Vision Architect",
    badgeIcon: "star",
  },
  {
    id: "scripting",
    title: "Scripting Guide",
    subtitle: "Write Your Reality Into Existence",
    description: "The art of writing in past tense as if your desire has already manifested. Combine gratitude with specificity for maximum resonance.",
    icon: "book",
    accentColor: "#34d399",
    estimatedMinutes: 22,
    totalLessons: 4,
    category: "method",
    badgeName: "Script Weaver",
    badgeIcon: "book",
  },
  {
    id: "neville-goddard",
    title: "Neville Goddard Techniques",
    subtitle: "Assumption, SATS & Living in the End",
    description: "Master Neville Goddard's premium consciousness methods: the Law of Assumption, SATS, revision, inner conversations, and the state of the wish fulfilled.",
    icon: "eye",
    accentColor: "#c084fc",
    estimatedMinutes: 34,
    totalLessons: 6,
    category: "mindset",
    badgeName: "Assumption Architect",
    badgeIcon: "👁️",
  },
  {
    id: "affirmations",
    title: "Affirmation Guide",
    subtitle: "Neural Rewiring Protocols",
    description: "Transform limiting beliefs into empowering truths. Learn the I AM frequency, emotional anchoring, and the mirror technique for unstoppable confidence.",
    icon: "trending",
    accentColor: "#f472b6",
    estimatedMinutes: 20,
    totalLessons: 4,
    category: "mindset",
    badgeName: "Frequency Master",
    badgeIcon: "trending",
  },
  {
    id: "nlp-reprogramming",
    title: "NLP Mind Reprogramming",
    subtitle: "Neuro-Linguistic Alchemy",
    description: "Advanced NLP techniques to dissolve deep subconscious blocks. Swish patterns, anchoring, and timeline therapy for rapid identity transformation.",
    icon: "award",
    accentColor: "#2dd4bf",
    estimatedMinutes: 40,
    totalLessons: 6,
    category: "quantum",
    badgeName: "Neural Architect",
    badgeIcon: "award",
  },
  {
    id: "quantum-jump",
    title: "Quantum Jump Guide",
    subtitle: "Parallel Reality Navigation",
    description: "The two-cup method, the mirror technique, and timeline jumping. Move between parallel realities where your desire is already accomplished.",
    icon: "sparkles",
    accentColor: "#60a5fa",
    estimatedMinutes: 32,
    totalLessons: 5,
    category: "quantum",
    badgeName: "Quantum Jumper",
    badgeIcon: "sparkles",
  },
  {
    id: "buddha-wisdom",
    title: "Gautam Buddha Wisdom",
    subtitle: "Ancient Enlightenment Codes",
    description: "Buddha's teachings on desire, detachment, and mindfulness. Learn to want without wanting — the paradox of manifestation that masters understand.",
    icon: "circle",
    accentColor: "#fbbf24",
    estimatedMinutes: 25,
    totalLessons: 5,
    category: "spiritual",
    badgeName: "Dharma Seeker",
    badgeIcon: "circle",
  },
  {
    id: "osho-techniques",
    title: "Osho Manifestation Techniques",
    subtitle: "Dynamic Meditation & Presence",
    description: "Osho's revolutionary active meditations. Kundalini shaking, dynamic breathing, and chaos release to clear energetic blocks instantly.",
    icon: "check",
    accentColor: "#ec4899",
    estimatedMinutes: 30,
    totalLessons: 5,
    category: "spiritual",
    badgeName: "Dynamic Mystic",
    badgeIcon: "check",
  },
  {
    id: "the-secret",
    title: "The Secret",
    subtitle: "The Law of Attraction Code",
    description: "Rhonda Byrne's legendary bestseller decoded. Master the universal Law of Attraction, the power of gratitude, visualization, and how to become a deliberate creator of your reality.",
    icon: "sparkles",
    accentColor: "#f59e0b",
    estimatedMinutes: 38,
    totalLessons: 6,
    category: "mindset",
    badgeName: "Secret Master",
    badgeIcon: "sparkles",
  },
];

/* ─── Stunning SVG Visuals per Module ─── */
export function ModuleVisual({ moduleId, accentColor, isHovered }: { moduleId: string; accentColor: string; isHovered: boolean }) {
  const stroke = accentColor;
  const opacity = isHovered ? 0.25 : 0.12;
  const strokeWidth = isHovered ? 1.5 : 1;

  const svgContent: Record<string, React.ReactNode> = {
    "tesla-369": (
      <svg viewBox="0 0 200 120" className="w-full h-full">
        <circle cx="40" cy="60" r="18" fill="none" stroke={stroke} strokeWidth={strokeWidth} opacity={opacity + 0.1}>
          <animate attributeName="r" values="18;22;18" dur="3s" repeatCount="indefinite" />
        </circle>
        <text x="40" y="65" textAnchor="middle" fill={stroke} fontSize="14" fontWeight="bold" fontFamily="monospace" opacity={isHovered ? 0.9 : 0.5}>3</text>
        <circle cx="100" cy="60" r="18" fill="none" stroke={stroke} strokeWidth={strokeWidth} opacity={opacity + 0.1}>
          <animate attributeName="r" values="18;22;18" dur="3s" begin="1s" repeatCount="indefinite" />
        </circle>
        <text x="100" y="65" textAnchor="middle" fill={stroke} fontSize="14" fontWeight="bold" fontFamily="monospace" opacity={isHovered ? 0.9 : 0.5}>6</text>
        <circle cx="160" cy="60" r="18" fill="none" stroke={stroke} strokeWidth={strokeWidth} opacity={opacity + 0.1}>
          <animate attributeName="r" values="18;22;18" dur="3s" begin="2s" repeatCount="indefinite" />
        </circle>
        <text x="160" y="65" textAnchor="middle" fill={stroke} fontSize="14" fontWeight="bold" fontFamily="monospace" opacity={isHovered ? 0.9 : 0.5}>9</text>
        <line x1="58" y1="60" x2="82" y2="60" stroke={stroke} strokeWidth={strokeWidth} opacity={opacity} />
        <line x1="118" y1="60" x2="142" y2="60" stroke={stroke} strokeWidth={strokeWidth} opacity={opacity} />
        <line x1="40" y1="42" x2="40" y2="20" stroke={stroke} strokeWidth={strokeWidth} opacity={opacity} strokeDasharray="4 2" />
        <line x1="100" y1="42" x2="100" y2="20" stroke={stroke} strokeWidth={strokeWidth} opacity={opacity} strokeDasharray="4 2" />
        <line x1="160" y1="42" x2="160" y2="20" stroke={stroke} strokeWidth={strokeWidth} opacity={opacity} strokeDasharray="4 2" />
        <line x1="40" y1="78" x2="40" y2="100" stroke={stroke} strokeWidth={strokeWidth} opacity={opacity} strokeDasharray="4 2" />
        <line x1="100" y1="78" x2="100" y2="100" stroke={stroke} strokeWidth={strokeWidth} opacity={opacity} strokeDasharray="4 2" />
        <line x1="160" y1="78" x2="160" y2="100" stroke={stroke} strokeWidth={strokeWidth} opacity={opacity} strokeDasharray="4 2" />
        {/* Top spinners */}
        <circle cx="40" cy="20" r="4" fill={stroke} opacity={isHovered ? 0.6 : 0.3}>
          <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="100" cy="20" r="4" fill={stroke} opacity={isHovered ? 0.6 : 0.3}>
          <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2s" begin="0.6s" repeatCount="indefinite" />
        </circle>
        <circle cx="160" cy="20" r="4" fill={stroke} opacity={isHovered ? 0.6 : 0.3}>
          <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2s" begin="1.2s" repeatCount="indefinite" />
        </circle>
      </svg>
    ),
    "555-method": (
      <svg viewBox="0 0 200 120" className="w-full h-full">
        <rect x="30" y="20" width="40" height="80" rx="4" fill="none" stroke={stroke} strokeWidth={strokeWidth} opacity={opacity} />
        <rect x="80" y="20" width="40" height="80" rx="4" fill="none" stroke={stroke} strokeWidth={strokeWidth} opacity={opacity} />
        <rect x="130" y="20" width="40" height="80" rx="4" fill="none" stroke={stroke} strokeWidth={strokeWidth} opacity={opacity} />
        <text x="50" y="45" textAnchor="middle" fill={stroke} fontSize="10" fontFamily="monospace" opacity={opacity + 0.15}>5</text>
        <text x="100" y="45" textAnchor="middle" fill={stroke} fontSize="10" fontFamily="monospace" opacity={opacity + 0.15}>5</text>
        <text x="150" y="45" textAnchor="middle" fill={stroke} fontSize="10" fontFamily="monospace" opacity={opacity + 0.15}>5</text>
        <line x1="50" y1="55" x2="50" y2="95" stroke={stroke} strokeWidth={1.5} opacity={isHovered ? 0.5 : 0.2} strokeLinecap="round">
          <animate attributeName="y1" values="55;95;55" dur="2.5s" repeatCount="indefinite" />
        </line>
        <line x1="100" y1="55" x2="100" y2="95" stroke={stroke} strokeWidth={1.5} opacity={isHovered ? 0.5 : 0.2} strokeLinecap="round">
          <animate attributeName="y1" values="55;95;55" dur="2.5s" begin="0.5s" repeatCount="indefinite" />
        </line>
        <line x1="150" y1="55" x2="150" y2="95" stroke={stroke} strokeWidth={1.5} opacity={isHovered ? 0.5 : 0.2} strokeLinecap="round">
          <animate attributeName="y1" values="55;95;55" dur="2.5s" begin="1s" repeatCount="indefinite" />
        </line>
        <circle cx="50" cy="65" r="3" fill={stroke} opacity={0.5}>
          <animate attributeName="cy" values="65;95;65" dur="2.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="100" cy="65" r="3" fill={stroke} opacity={0.5}>
          <animate attributeName="cy" values="65;95;65" dur="2.5s" begin="0.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="150" cy="65" r="3" fill={stroke} opacity={0.5}>
          <animate attributeName="cy" values="65;95;65" dur="2.5s" begin="1s" repeatCount="indefinite" />
        </circle>
      </svg>
    ),
    "1111-guide": (
      <svg viewBox="0 0 200 120" className="w-full h-full">
        <rect x="80" y="30" width="40" height="60" rx="20" fill="none" stroke={stroke} strokeWidth={strokeWidth} opacity={opacity} />
        <line x1="100" y1="30" x2="100" y2="10" stroke={stroke} strokeWidth={strokeWidth} opacity={opacity} strokeLinecap="round">
          <animate attributeName="y2" values="10;5;10" dur="2s" repeatCount="indefinite" />
        </line>
        <circle cx="100" cy="5" r="5" fill="none" stroke={stroke} strokeWidth={1.5} opacity={isHovered ? 0.6 : 0.25}>
          <animate attributeName="r" values="5;12;5" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.6;0.1;0.6" dur="2s" repeatCount="indefinite" />
        </circle>
        <text x="100" y="62" textAnchor="middle" fill={stroke} fontSize="18" fontWeight="bold" fontFamily="monospace" opacity={isHovered ? 0.9 : 0.4}>11:11</text>
        <line x1="65" y1="60" x2="40" y2="60" stroke={stroke} strokeWidth={1} opacity={opacity} strokeDasharray="2 2" />
        <line x1="135" y1="60" x2="160" y2="60" stroke={stroke} strokeWidth={1} opacity={opacity} strokeDasharray="2 2" />
        <circle cx="35" cy="60" r="3" fill={stroke} opacity={0.3}>
          <animate attributeName="r" values="3;6;3" dur="3s" repeatCount="indefinite" />
        </circle>
        <circle cx="165" cy="60" r="3" fill={stroke} opacity={0.3}>
          <animate attributeName="r" values="3;6;3" dur="3s" begin="1.5s" repeatCount="indefinite" />
        </circle>
      </svg>
    ),
    "visualization": (
      <svg viewBox="0 0 200 120" className="w-full h-full">
        <circle cx="100" cy="60" r="40" fill="none" stroke={stroke} strokeWidth={strokeWidth} opacity={opacity} />
        <circle cx="100" cy="60" r="30" fill="none" stroke={stroke} strokeWidth={1} opacity={opacity - 0.05}>
          <animateTransform attributeName="transform" type="rotate" from="0 100 60" to="360 100 60" dur="8s" repeatCount="indefinite" />
        </circle>
        <circle cx="100" cy="60" r="20" fill="none" stroke={stroke} strokeWidth={1} opacity={opacity - 0.05}>
          <animateTransform attributeName="transform" type="rotate" from="360 100 60" to="0 100 60" dur="6s" repeatCount="indefinite" />
        </circle>
        <circle cx="100" cy="60" r="3" fill={stroke} opacity={isHovered ? 0.8 : 0.4}>
          <animate attributeName="r" values="3;8;3" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.8;0.3;0.8" dur="2s" repeatCount="indefinite" />
        </circle>
        <line x1="100" y1="20" x2="100" y2="10" stroke={stroke} strokeWidth={1} opacity={opacity} strokeLinecap="round" />
        <line x1="100" y1="100" x2="100" y2="110" stroke={stroke} strokeWidth={1} opacity={opacity} strokeLinecap="round" />
        <line x1="60" y1="60" x2="50" y2="60" stroke={stroke} strokeWidth={1} opacity={opacity} strokeLinecap="round" />
        <line x1="140" y1="60" x2="150" y2="60" stroke={stroke} strokeWidth={1} opacity={opacity} strokeLinecap="round" />
      </svg>
    ),
    "scripting": (
      <svg viewBox="0 0 200 120" className="w-full h-full">
        <rect x="40" y="25" width="120" height="70" rx="4" fill="none" stroke={stroke} strokeWidth={strokeWidth} opacity={opacity} />
        <line x1="55" y1="45" x2="145" y2="45" stroke={stroke} strokeWidth={1} opacity={opacity} strokeLinecap="round">
          <animate attributeName="x2" values="55;145;55" dur="3s" repeatCount="indefinite" />
        </line>
        <line x1="55" y1="60" x2="130" y2="60" stroke={stroke} strokeWidth={1} opacity={opacity} strokeLinecap="round">
          <animate attributeName="x2" values="55;130;55" dur="3s" begin="0.5s" repeatCount="indefinite" />
        </line>
        <line x1="55" y1="75" x2="110" y2="75" stroke={stroke} strokeWidth={1} opacity={opacity} strokeLinecap="round">
          <animate attributeName="x2" values="55;110;55" dur="3s" begin="1s" repeatCount="indefinite" />
        </line>
        <circle cx="155" cy="85" r="4" fill="none" stroke={stroke} strokeWidth={1.5} opacity={isHovered ? 0.5 : 0.2}>
          <animate attributeName="opacity" values="0.2;0.7;0.2" dur="1.5s" repeatCount="indefinite" />
        </circle>
        <polygon points="153,83 153,87 157,85" fill={stroke} opacity={isHovered ? 0.6 : 0.3}>
          <animateTransform attributeName="transform" type="translate" values="0,0; 2,0; 0,0" dur="1s" repeatCount="indefinite" />
        </polygon>
      </svg>
    ),
    "neville-goddard": (
      <svg viewBox="0 0 200 120" className="w-full h-full">
        <circle cx="100" cy="60" r="34" fill="none" stroke={stroke} strokeWidth={strokeWidth} opacity={opacity + 0.08}>
          <animate attributeName="r" values="30;38;30" dur="4s" repeatCount="indefinite" />
        </circle>
        <path d="M36 60 C58 24, 142 24, 164 60 C142 96, 58 96, 36 60Z" fill="none" stroke={stroke} strokeWidth={strokeWidth} opacity={opacity + 0.12} />
        <circle cx="100" cy="60" r="12" fill={stroke} opacity={isHovered ? 0.34 : 0.18}>
          <animate attributeName="opacity" values="0.12;0.42;0.12" dur="3s" repeatCount="indefinite" />
        </circle>
        <text x="100" y="65" textAnchor="middle" fill={stroke} fontSize="11" fontWeight="bold" fontFamily="monospace" opacity={isHovered ? 0.9 : 0.5}>SATS</text>
        <line x1="100" y1="22" x2="100" y2="38" stroke={stroke} strokeWidth={strokeWidth} opacity={opacity} strokeDasharray="4 3" />
        <line x1="100" y1="82" x2="100" y2="98" stroke={stroke} strokeWidth={strokeWidth} opacity={opacity} strokeDasharray="4 3" />
        <line x1="58" y1="60" x2="72" y2="60" stroke={stroke} strokeWidth={strokeWidth} opacity={opacity} strokeDasharray="4 3" />
        <line x1="128" y1="60" x2="142" y2="60" stroke={stroke} strokeWidth={strokeWidth} opacity={opacity} strokeDasharray="4 3" />
        <circle cx="48" cy="28" r="3" fill={stroke} opacity={isHovered ? 0.65 : 0.32} />
        <circle cx="152" cy="92" r="3" fill={stroke} opacity={isHovered ? 0.65 : 0.32} />
      </svg>
    ),
    "affirmations": (
      <svg viewBox="0 0 200 120" className="w-full h-full">
        <circle cx="100" cy="50" r="25" fill="none" stroke={stroke} strokeWidth={strokeWidth} opacity={opacity} />
        <circle cx="100" cy="50" r="15" fill="none" stroke={stroke} strokeWidth={1} opacity={opacity}>
          <animateTransform attributeName="transform" type="scale" values="1;1.1;1" dur="2s" repeatCount="indefinite" additive="sum" />
        </circle>
        <text x="100" y="55" textAnchor="middle" fill={stroke} fontSize="10" fontWeight="bold" fontFamily="sans-serif" opacity={isHovered ? 0.8 : 0.4}>
          I AM
        </text>
        <line x1="100" y1="75" x2="100" y2="100" stroke={stroke} strokeWidth={1} opacity={opacity} strokeLinecap="round" />
        <circle cx="100" cy="105" r="4" fill={stroke} opacity={isHovered ? 0.5 : 0.2}>
          <animate attributeName="r" values="4;8;4" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.5;0.1;0.5" dur="2s" repeatCount="indefinite" />
        </circle>
      </svg>
    ),
    "nlp-reprogramming": (
      <svg viewBox="0 0 200 120" className="w-full h-full">
        <circle cx="70" cy="60" r="25" fill="none" stroke={stroke} strokeWidth={strokeWidth} opacity={opacity} />
        <circle cx="130" cy="60" r="25" fill="none" stroke={stroke} strokeWidth={strokeWidth} opacity={opacity} />
        <circle cx="70" cy="60" r="15" fill="none" stroke={stroke} strokeWidth={1} opacity={isHovered ? 0.3 : 0.15}>
          <animateTransform attributeName="transform" type="rotate" from="0 70 60" to="360 70 60" dur="4s" repeatCount="indefinite" />
        </circle>
        <circle cx="130" cy="60" r="15" fill="none" stroke={stroke} strokeWidth={1} opacity={isHovered ? 0.3 : 0.15}>
          <animateTransform attributeName="transform" type="rotate" from="360 130 60" to="0 130 60" dur="4s" repeatCount="indefinite" />
        </circle>
        <line x1="95" y1="60" x2="105" y2="60" stroke={stroke} strokeWidth={1.5} opacity={isHovered ? 0.5 : 0.2} strokeDasharray="2 2">
          <animate attributeName="opacity" values="0.2;0.6;0.2" dur="2s" repeatCount="indefinite" />
        </line>
        <circle cx="70" cy="60" r="4" fill={stroke} opacity={isHovered ? 0.6 : 0.3}>
          <animate attributeName="r" values="4;7;4" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="130" cy="60" r="4" fill={stroke} opacity={isHovered ? 0.6 : 0.3}>
          <animate attributeName="r" values="4;7;4" dur="2s" begin="1s" repeatCount="indefinite" />
        </circle>
      </svg>
    ),
    "quantum-jump": (
      <svg viewBox="0 0 200 120" className="w-full h-full">
        <circle cx="50" cy="60" r="25" fill="none" stroke={stroke} strokeWidth={strokeWidth} opacity={opacity} />
        <circle cx="150" cy="60" r="25" fill="none" stroke={stroke} strokeWidth={strokeWidth} opacity={opacity} />
        <circle cx="100" cy="60" r="5" fill={stroke} opacity={0.4}>
          <animate attributeName="cx" values="50;150;50" dur="3s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.4;0.8;0.4" dur="3s" repeatCount="indefinite" />
        </circle>
        <line x1="75" y1="60" x2="125" y2="60" stroke={stroke} strokeWidth={1} opacity={isHovered ? 0.4 : 0.15} strokeDasharray="4 4">
          <animate attributeName="stroke-dashoffset" values="0;8;0" dur="1s" repeatCount="indefinite" />
        </line>
        <circle cx="50" cy="60" r="3" fill={stroke} opacity={0.5}>
          <animate attributeName="r" values="3;6;3" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="150" cy="60" r="3" fill={stroke} opacity={0.5}>
          <animate attributeName="r" values="3;6;3" dur="2s" begin="1s" repeatCount="indefinite" />
        </circle>
      </svg>
    ),
    "buddha-wisdom": (
      <svg viewBox="0 0 200 120" className="w-full h-full">
        <circle cx="100" cy="40" r="20" fill="none" stroke={stroke} strokeWidth={strokeWidth} opacity={opacity} />
        <line x1="80" y1="55" x2="70" y2="100" stroke={stroke} strokeWidth={1} opacity={opacity} strokeLinecap="round" />
        <line x1="120" y1="55" x2="130" y2="100" stroke={stroke} strokeWidth={1} opacity={opacity} strokeLinecap="round" />
        <line x1="100" y1="60" x2="100" y2="100" stroke={stroke} strokeWidth={1} opacity={opacity} strokeLinecap="round" />
        <circle cx="100" cy="40" r="3" fill={stroke} opacity={0.5}>
          <animate attributeName="r" values="3;8;3" dur="3s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.5;0.1;0.5" dur="3s" repeatCount="indefinite" />
        </circle>
        <circle cx="70" cy="100" r="3" fill={stroke} opacity={0.3}>
          <animate attributeName="r" values="3;5;3" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="130" cy="100" r="3" fill={stroke} opacity={0.3}>
          <animate attributeName="r" values="3;5;3" dur="2s" begin="1s" repeatCount="indefinite" />
        </circle>
      </svg>
    ),
    "osho-techniques": (
      <svg viewBox="0 0 200 120" className="w-full h-full">
        <circle cx="100" cy="60" r="35" fill="none" stroke={stroke} strokeWidth={strokeWidth} opacity={opacity} />
        <circle cx="100" cy="60" r="25" fill="none" stroke={stroke} strokeWidth={1} opacity={opacity - 0.05}>
          <animateTransform attributeName="transform" type="rotate" from="0 100 60" to="360 100 60" dur="3s" repeatCount="indefinite" />
        </circle>
        <circle cx="100" cy="60" r="15" fill="none" stroke={stroke} strokeWidth={1} opacity={opacity - 0.05}>
          <animateTransform attributeName="transform" type="rotate" from="360 100 60" to="0 100 60" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="100" cy="60" r="5" fill="none" stroke={stroke} strokeWidth={2} opacity={isHovered ? 0.6 : 0.3}>
          <animate attributeName="r" values="5;12;5" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.6;0.15;0.6" dur="2s" repeatCount="indefinite" />
        </circle>
        <line x1="100" y1="20" x2="100" y2="30" stroke={stroke} strokeWidth={1} opacity={opacity} strokeLinecap="round" />
        <line x1="100" y1="90" x2="100" y2="100" stroke={stroke} strokeWidth={1} opacity={opacity} strokeLinecap="round" />
        <line x1="60" y1="60" x2="70" y2="60" stroke={stroke} strokeWidth={1} opacity={opacity} strokeLinecap="round" />
        <line x1="130" y1="60" x2="140" y2="60" stroke={stroke} strokeWidth={1} opacity={opacity} strokeLinecap="round" />
      </svg>
    ),
    "the-secret": (
      <svg viewBox="0 0 200 120" className="w-full h-full">
        <circle cx="100" cy="60" r="38" fill="none" stroke={stroke} strokeWidth={strokeWidth} opacity={opacity + 0.1}>
          <animate attributeName="r" values="34;42;34" dur="4s" repeatCount="indefinite" />
        </circle>
        <circle cx="100" cy="60" r="26" fill="none" stroke={stroke} strokeWidth={1} opacity={opacity}>
          <animateTransform attributeName="transform" type="rotate" from="0 100 60" to="360 100 60" dur="10s" repeatCount="indefinite" />
        </circle>
        <circle cx="100" cy="60" r="14" fill="none" stroke={stroke} strokeWidth={1} opacity={opacity - 0.04}>
          <animateTransform attributeName="transform" type="rotate" from="360 100 60" to="0 100 60" dur="7s" repeatCount="indefinite" />
        </circle>
        <text x="100" y="65" textAnchor="middle" fill={stroke} fontSize="9" fontWeight="bold" fontFamily="serif" opacity={isHovered ? 0.9 : 0.5}>S</text>
        <circle cx="138" cy="60" r="2.5" fill={stroke} opacity={isHovered ? 0.6 : 0.3}><animate attributeName="opacity" values="0.3;0.7;0.3" dur="3s" repeatCount="indefinite" /></circle>
        <circle cx="81" cy="78" r="2.5" fill={stroke} opacity={isHovered ? 0.6 : 0.3}><animate attributeName="opacity" values="0.3;0.7;0.3" dur="3s" begin="0.4s" repeatCount="indefinite" /></circle>
        <circle cx="81" cy="42" r="2.5" fill={stroke} opacity={isHovered ? 0.6 : 0.3}><animate attributeName="opacity" values="0.3;0.7;0.3" dur="3s" begin="0.8s" repeatCount="indefinite" /></circle>
      </svg>
    ),
  };

  return (
    <div className="absolute inset-0 pointer-events-none opacity-100 transition-opacity duration-500">
      {svgContent[moduleId] || svgContent["tesla-369"]}
    </div>
  );
}

/* ─── Category Colors & Icon ─── */
const categoryMeta: Record<string, { label: string; color: string; icon: typeof Layers }> = {
  method: { label: "Methods", color: "#f59e0b", icon: Layers },
  mindset: { label: "Mindset", color: "#38bdf8", icon: BrainCircuit },
  spiritual: { label: "Spiritual", color: "#a78bfa", icon: Compass },
  quantum: { label: "Quantum", color: "#2dd4bf", icon: Orbit },
};

export default function AcademyPage({
  modules,
  progress,
  badges,
  overallStreak,
  isPremium,
  onModuleComplete,
  onLessonComplete,
  onPaywall,
}: AcademyPageProps) {
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [showCertificate, setShowCertificate] = useState(false);
  const [filter, setFilter] = useState<"all" | "method" | "mindset" | "spiritual" | "quantum">("all");
  const [hoveredModule, setHoveredModule] = useState<string | null>(null);

  const activeModules = modules.length > 0 ? modules : DEFAULT_MODULES;

  const completedModules = useMemo(() => {
    return activeModules.filter((m) => (progress?.[m.id])?.progressPercent === 100).length;
  }, [activeModules, progress]);

  const totalProgress = useMemo(() => {
    if (activeModules.length === 0) return 0;
    const sum = activeModules.reduce((acc, m) => acc + ((progress || {})[m.id]?.progressPercent || 0), 0);
    return Math.round(sum / activeModules.length);
  }, [activeModules, progress]);

  const allComplete = completedModules === activeModules.length && activeModules.length > 0;

  const filteredModules = useMemo(() => {
    if (filter === "all") return activeModules;
    return activeModules.filter((m) => m.category === filter);
  }, [activeModules, filter]);

  const activeModule = activeModules.find((m) => m.id === activeModuleId);

  if (showCertificate && allComplete) {
    return (
      <AcademyCertificate
        badges={badges}
        completedModules={completedModules}
        overallStreak={overallStreak}
        onClose={() => setShowCertificate(false)}
      />
    );
  }

  if (activeModule) {
    return (
      <ModuleWalkthrough
        key={activeModule.id}
        module={activeModule}
        progress={progress?.[activeModule.id]}
        onClose={() => setActiveModuleId(null)}
        onLessonComplete={(lessonId, xp) => onLessonComplete(activeModule.id, lessonId, xp)}
        onModuleComplete={(xp) => {
          onModuleComplete(activeModule.id, xp);
          setActiveModuleId(null);
        }}
        onSwitchModule={setActiveModuleId}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative rounded-[28px] bg-black border border-amber-500/[0.08] p-6 md:p-8 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/[0.03] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-0 w-40 h-40 bg-amber-500/[0.02] rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Crown size={16} className="text-amber-400" />
              <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-amber-200/40 font-bold">Manifestation Academy</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-display font-bold text-white tracking-tight">
              The Academy
            </h2>
            <p className="text-sm text-white/30 max-w-md leading-relaxed">
              Master 11 sacred manifestation techniques through cinematic, step-by-step immersive training. Each module is a portal to your new reality.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-4 px-5 py-3 rounded-2xl bg-amber-500/[0.03] border border-amber-500/[0.06]">
              <div className="text-center">
                <p className="text-lg font-bold text-amber-100">{completedModules}/{activeModules.length}</p>
                <p className="text-[9px] font-mono text-amber-200/30 uppercase tracking-wider">Done</p>
              </div>
              <div className="w-px h-8 bg-amber-500/10" />
              <div className="text-center">
                <p className="text-lg font-bold text-amber-100">{totalProgress}%</p>
                <p className="text-[9px] font-mono text-amber-200/30 uppercase tracking-wider">Total</p>
              </div>
              <div className="w-px h-8 bg-amber-500/10" />
              <div className="text-center">
                <p className="text-lg font-bold text-amber-100">{overallStreak}</p>
                <p className="text-[9px] font-mono text-amber-200/30 uppercase tracking-wider">Streak</p>
              </div>
            </div>
            {allComplete && (
              <button
                onClick={() => setShowCertificate(true)}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-amber-400 text-black font-bold text-[11px] uppercase tracking-wider hover:bg-amber-300 transition-all cursor-pointer shadow-lg shadow-amber-400/10"
              >
                <Award size={14} strokeWidth={3} />
                View Certificate
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-200/30 font-bold">Academy Progress</span>
            <span className="text-[10px] font-mono text-amber-200/60">{totalProgress}%</span>
          </div>
          <div className="h-2 bg-amber-500/[0.06] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${totalProgress}%` }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { key: "all" as const, label: "All Modules" },
          { key: "method" as const, label: "Methods" },
          { key: "mindset" as const, label: "Mindset" },
          { key: "spiritual" as const, label: "Spiritual" },
          { key: "quantum" as const, label: "Quantum" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl border text-[11px] font-mono uppercase tracking-wider font-bold transition-all cursor-pointer ${
              filter === f.key
                ? "bg-amber-400 text-black border-amber-400"
                : "bg-transparent text-white/40 border-white/5 hover:border-amber-500/20 hover:text-white/70"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Modules Grid — Visual Overhaul */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredModules.map((module, index) => {
            const modProgress = progress?.[module.id];
            const percent = modProgress?.progressPercent || 0;
            const isComplete = percent === 100;
            const isStarted = percent > 0;
            const Icon = moduleIcons[module.icon] || Zap;
            const isLocked = !isPremium && module.id !== "tesla-369";
            const isHovered = hoveredModule === module.id;
            const catMeta = categoryMeta[module.category];

            return (
              <motion.article
                key={module.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                onMouseEnter={() => setHoveredModule(module.id)}
                onMouseLeave={() => setHoveredModule(null)}
                onClick={() => {
                  if (isLocked) {
                    onPaywall("This masterclass is a Premium module. Unlock your full potential to access all advanced reality-bending techniques and video frameworks.");
                    return;
                  }
                  setActiveModuleId(module.id);
                }}
                className={`group relative rounded-[24px] overflow-hidden cursor-pointer flex flex-col gap-4 transition-all duration-500 ${
                  isLocked
                    ? "bg-black border border-white/[0.08] hover:border-white/[0.15] hover:shadow-[0_0_30px_rgba(255,255,255,0.05)]"
                    : "bg-black border border-white/[0.04] hover:border-amber-500/20 hover:shadow-[0_0_40px_rgba(245,158,11,0.08)]"
                }`}
              >
                {/* Visual Area */}
                <div className="relative h-32 w-full overflow-hidden">
                  <ModuleVisual moduleId={module.id} accentColor={module.accentColor} isHovered={isHovered} />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black" />

                  {/* Top badges */}
                  <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
                    <span
                      className="px-2 py-0.5 rounded-md text-[9px] font-mono uppercase tracking-wider font-bold border"
                      style={{
                        color: catMeta.color,
                        borderColor: `${catMeta.color}25`,
                        backgroundColor: `${catMeta.color}10`,
                      }}
                    >
                      {catMeta.label}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
                    {isLocked && (
                      <span className="px-2 py-0.5 rounded-md bg-black/60 border border-white/20 text-[9px] font-mono text-amber-400 uppercase tracking-wider font-bold flex items-center gap-1 backdrop-blur-md">
                        <Lock size={8} /> Premium
                      </span>
                    )}
                    {isComplete && (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-mono text-emerald-400 uppercase tracking-wider font-bold flex items-center gap-1">
                        <CheckCircle2 size={8} /> Done
                      </span>
                    )}
                    {!isComplete && isStarted && !isLocked && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-[9px] font-mono text-amber-400 uppercase tracking-wider font-bold">
                        {percent}%
                      </span>
                    )}
                    {!isComplete && !isStarted && !isLocked && (
                      <span className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/10 text-[9px] font-mono text-white/40 uppercase tracking-wider font-bold flex items-center gap-1">
                        <Play size={8} /> Start
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="px-5 pb-5 pt-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                      style={{
                        backgroundColor: `${module.accentColor}15`,
                        border: `1px solid ${module.accentColor}30`,
                      }}
                    >
                      <Icon size={20} style={{ color: module.accentColor }} />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-white group-hover:text-amber-100 transition-colors leading-snug">
                        {module.title}
                      </h3>
                      <p className="text-[11px] text-white/25 font-medium leading-relaxed">
                        {module.subtitle}
                      </p>
                    </div>
                  </div>

                  <p className="text-[11px] text-white/20 leading-relaxed line-clamp-2">
                    {module.description}
                  </p>

                  {/* Bottom Meta */}
                  <div className="pt-3 border-t border-white/[0.03] flex items-center justify-between">
                    <div className="flex items-center gap-3 text-[10px] font-mono text-white/15 uppercase tracking-wider">
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        {module.estimatedMinutes}m
                      </span>
                      <span className="flex items-center gap-1">
                        <BarChart3 size={10} />
                        {module.totalLessons} lessons
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-amber-200/30 uppercase tracking-wider group-hover:text-amber-400 transition-colors">
                      {isComplete ? "Review" : isLocked ? "Locked" : "Start"}
                      <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {isStarted && (
                    <div className="h-1 bg-white/[0.03] rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: module.accentColor }}
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                    </div>
                  )}
                </div>
              </motion.article>
            );
          })}
        </AnimatePresence>
      </div>

      {filteredModules.length === 0 && (
        <div className="text-center py-16 rounded-[28px] bg-black border border-white/[0.04]">
          <Sparkles size={32} className="text-white/10 mx-auto mb-4" />
          <p className="text-sm text-white/30 font-medium">No modules in this category.</p>
        </div>
      )}

      {/* Badges Showcase — Visual Overhaul */}
      {badges.length > 0 && (
        <div className="rounded-[24px] bg-black border border-amber-500/[0.06] p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Award size={14} className="text-amber-400" />
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-amber-200/40 font-bold">Earned Badges</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {badges.map((badge) => (
              <div
                key={badge.id}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/5 hover:border-amber-500/20 transition-all cursor-default"
                title={badge.description}
              >
                <span className="text-sm">{badge.icon}</span>
                <span className="text-[11px] font-medium text-white/60">{badge.name}</span>
                <span className={`text-[9px] font-mono uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${
                  badge.tier === 'platinum' ? 'bg-violet-500/10 text-violet-400' :
                  badge.tier === 'gold' ? 'bg-amber-500/10 text-amber-400' :
                  badge.tier === 'silver' ? 'bg-slate-500/10 text-slate-300' : 'bg-orange-500/10 text-orange-400'
                }`}>
                  {badge.tier}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

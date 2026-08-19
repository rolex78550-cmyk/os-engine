import React, { useState, useRef, useEffect } from "react";
import { resolveImageUrl } from "../../lib/imageHelper";
import {
  ArrowLeft, Camera, Sparkles, Target, Brain, Flame, Calendar,
  CheckCircle2, Circle, RefreshCw, Zap, Heart, Eye, Image as ImageIcon,
  Crown, Sword, Shield
} from "lucide-react";

const TEXT_PRIMARY = "#ffffff";
const TEXT_SECONDARY = "rgba(235,235,245,0.62)";
const TEXT_TERTIARY = "rgba(235,235,245,0.32)";
const SURFACE = "#0a0a0a";
const SURFACE_RAISED = "#141414";
const HAIRLINE = "rgba(255,255,255,0.08)";
const HAIRLINE_STRONG = "rgba(255,255,255,0.18)";
const ORANGE = "#ff9f0a";
const ORANGE_DARK = "#ff7a00";
const IOS_GREEN = "#34c759";
const IOS_RED = "#ff453a";
const IOS_BLUE = "#0a84ff";
const IOS_PURPLE = "#5e5ce6";

// 6 cinematic background options for the goal page hero
const HERO_IMAGES = [
  { url: "/images/goal_minimal.jpg", label: "Minimal" },
  { url: "/images/goal_warrior_pose.jpg", label: "Warrior" },
  { url: "/images/goal_shadow_army.jpg", label: "Shadow Army" },
  { url: "/images/goal_igris.jpg", label: "Igris Knight" },
  { url: "/images/goal_house.jpg", label: "Dream House" },
  { url: "/images/goal_jinwoo.jpg", label: "Hunter" },
];

interface GoalDetailData {
  id: string;
  title: string;
  description?: string;
  category?: string;
  rank?: string;
  xp?: number;
  progress?: number;
  icon?: string;
  jpLabel?: string;
  deadline?: string;
  image?: string;
  milestones?: { text: string; done: boolean }[];
}

interface GoalDetailPageProps {
  goal: GoalDetailData;
  onBack: () => void;
  onProgress?: (delta: number) => void;
}

interface AITip {
  category: "identity" | "action" | "ritual" | "blocker";
  title: string;
  description: string;
  steps?: string[];
}

const DEFAULT_TIPS: AITip[] = [
  {
    category: "identity",
    title: "Become the person who already has this",
    description: "Your nervous system needs to feel safe with the goal before your mind will pursue it. Identity precedes action.",
    steps: [
      "Visualize the goal as already done for 2 minutes every morning",
      "Use 'I am' statements in first person, present tense",
      "Act on small decisions as if you are already that person",
    ],
  },
  {
    category: "action",
    title: "Reverse-engineer the outcome",
    description: "Break the goal into the smallest possible physical actions you can take this week.",
    steps: [
      "List 3 milestones that prove the goal is real",
      "Define the single daily non-negotiable action",
      "Block 30 minutes on your calendar every day",
    ],
  },
  {
    category: "ritual",
    title: "Install a daily ritual anchor",
    description: "Tie the goal to an existing habit so it runs on autopilot without relying on motivation.",
    steps: [
      "Pick a cue (after morning coffee, post-workout, etc.)",
      "Stack the new action on the existing habit",
      "Track completion in a visible place",
    ],
  },
  {
    category: "blocker",
    title: "Identify and dissolve the inner saboteur",
    description: "There is a part of you that benefits from staying the same. Befriend it and ask what it needs.",
    steps: [
      "Journal: 'What would I have to give up to achieve this?'",
      "Notice when you self-sabotage (procrastination, doubt)",
      "Re-negotiate with the resistance — not fight it",
    ],
  },
];

export const GoalDetailPage: React.FC<GoalDetailPageProps> = ({
  goal,
  onBack,
  onProgress,
}) => {
  // ============== STATE ==============
  const [heroImage, setHeroImage] = useState(
    goal.image || HERO_IMAGES[Math.abs(hashCode(goal.id)) % HERO_IMAGES.length].url
  );
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [tips, setTips] = useState<AITip[]>(DEFAULT_TIPS);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [milestones, setMilestones] = useState(
    goal.milestones || defaultMilestonesFor(goal)
  );
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Toast auto-dismiss
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 2400);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const showToast = (msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type });
    try {
      window.dispatchEvent(
        new CustomEvent(type === "ok" ? "manifest_sfx_success" : "manifest_sfx_error")
      );
    } catch {}
  };

  // ============== IMAGE UPLOAD ==============
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast("Image must be under 5MB", "err");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setHeroImage(dataUrl);
      setShowImagePicker(false);
      showToast("Background updated", "ok");
    };
    reader.readAsDataURL(file);
  };

  // ============== AI TIPS FETCH (via /api/manifestation/coach) ==============
  const fetchAITips = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch("/api/manifestation/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Generate 4 concise manifestation tips for this goal: "${goal.title}". Category: ${goal.category || "general"}. Rank: ${goal.rank || "C"}. Provide 1 identity tip, 1 action tip, 1 ritual tip, 1 blocker tip. Each tip needs a title, 1-sentence description, and 2-3 specific steps. Return as JSON array with {category, title, description, steps[]}.`,
        }),
      });
      if (!res.ok) throw new Error("AI request failed");
      const data = await res.json();
      if (Array.isArray(data?.tips) && data.tips.length > 0) {
        setTips(data.tips);
        showToast("AI tips loaded", "ok");
      } else if (typeof data?.text === "string") {
        // If response has plain text, wrap as one tip
        setTips([
          {
            category: "identity",
            title: "AI Insight",
            description: data.text,
          },
        ]);
        showToast("AI insight loaded", "ok");
      } else {
        throw new Error("No tips returned");
      }
    } catch (err: any) {
      setAiError(err?.message || "Could not fetch AI tips");
      showToast("AI fetch failed — showing default tips", "err");
    } finally {
      setAiLoading(false);
    }
  };

  // ============== MILESTONE TOGGLE ==============
  const toggleMilestone = (idx: number) => {
    setMilestones((prev) => {
      const next = prev.map((m, i) =>
        i === idx ? { ...m, done: !m.done } : m
      );
      // Compute new progress
      const done = next.filter((m) => m.done).length;
      const newPct = Math.round((done / next.length) * 100);
      if (onProgress) onProgress(newPct - (goal.progress || 0));
      showToast(
        next[idx].done ? "Milestone complete!" : "Milestone unchecked",
        "ok"
      );
      return next;
    });
  };

  const completedCount = milestones.filter((m) => m.done).length;
  const progressPct = Math.round((completedCount / milestones.length) * 100);

  // Group tips by category
  const identityTips = tips.filter((t) => t.category === "identity");
  const actionTips = tips.filter((t) => t.category === "action");
  const ritualTips = tips.filter((t) => t.category === "ritual");
  const blockerTips = tips.filter((t) => t.category === "blocker");

  return (
    <div
      className="relative w-full"
      style={{ backgroundColor: "#000", minHeight: "100vh" }}
    >
      {/* ===================== HERO SECTION ===================== */}
      <section className="relative w-full" style={{ minHeight: 360 }}>
        {/* Background image */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url(${heroImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center 30%",
            backgroundRepeat: "no-repeat",
            opacity: 0.5,
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.15) 25%, rgba(0,0,0,0.6) 65%, rgba(0,0,0,0.95) 100%)",
          }}
        />

        {/* Top bar */}
        <div
          className="relative z-10 flex items-center justify-between px-4 pt-5 pb-3"
          style={{
            backgroundColor: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(16px)",
            borderBottom: `1px solid ${HAIRLINE}`,
          }}
        >
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full active:scale-95"
            style={{
              backgroundColor: SURFACE,
              border: `1px solid ${HAIRLINE_STRONG}`,
              color: TEXT_PRIMARY,
            }}
          >
            <ArrowLeft size={14} />
            <span className="text-[12px] font-semibold">Back</span>
          </button>
          <div className="flex flex-col items-center">
            <div
              className="font-extrabold tracking-tight leading-none"
              style={{ color: TEXT_PRIMARY, fontSize: 14, letterSpacing: "-0.01em" }}
            >
              Goal Quest
            </div>
            <div
              className="text-[9px] mt-0.5 uppercase tracking-wider"
              style={{ color: TEXT_TERTIARY }}
            >
              {goal.jpLabel || "目標"}
            </div>
          </div>
          <button
            onClick={() => setShowImagePicker(true)}
            className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90"
            style={{
              backgroundColor: SURFACE,
              border: `1px solid ${HAIRLINE_STRONG}`,
              color: TEXT_SECONDARY,
            }}
            aria-label="Change background"
          >
            <ImageIcon size={14} />
          </button>
        </div>

        {/* Center content */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-8 pb-6">
          {/* Rank + Icon circle */}
          <div
            className="mb-4 flex items-center justify-center"
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              border: `2.5px solid ${ORANGE}`,
              backgroundColor: SURFACE,
              fontSize: 28,
              boxShadow: "0 8px 32px rgba(255,159,10,0.3)",
            }}
          >
            {goal.icon || "🎯"}
          </div>

          {/* JP label + title */}
          <div
            className="text-[10px] font-bold tracking-widest uppercase mb-1.5"
            style={{ color: ORANGE }}
          >
            {goal.jpLabel || "目標"} · {goal.rank || "C"}-RANK
          </div>

          <h1
            className="font-extrabold leading-[1.05] tracking-tight mb-3"
            style={{
              color: TEXT_PRIMARY,
              fontSize: "clamp(1.5rem, 5vw, 2.25rem)",
              letterSpacing: "-0.02em",
              maxWidth: 600,
            }}
          >
            {goal.title}
          </h1>

          {goal.description && (
            <p
              className="text-[13px] leading-relaxed mb-3"
              style={{ color: TEXT_SECONDARY, maxWidth: 420 }}
            >
              {goal.description}
            </p>
          )}

          {/* Meta row */}
          <div className="flex items-center gap-3 flex-wrap justify-center">
            {goal.category && <MetaPill label="Category" value={goal.category} />}
            {goal.xp && <MetaPill label="XP" value={goal.xp.toString()} color={ORANGE} />}
            {goal.deadline && <MetaPill label="Due" value={goal.deadline} />}
          </div>
        </div>
      </section>

      {/* ===================== PROGRESS CARD ===================== */}
      <section className="px-4 pt-4">
        <div
          className="rounded-2xl p-4"
          style={{ backgroundColor: SURFACE, border: `1px solid ${HAIRLINE}` }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target size={14} style={{ color: ORANGE }} />
              <span
                className="text-[10px] font-bold tracking-widest uppercase"
                style={{ color: TEXT_TERTIARY }}
              >
                Quest Progress
              </span>
            </div>
            <span
              className="text-[18px] font-extrabold tabular-nums"
              style={{ color: ORANGE }}
            >
              {progressPct}%
            </span>
          </div>
          <div
            className="h-1.5 rounded-full overflow-hidden mb-2"
            style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progressPct}%`,
                background: `linear-gradient(90deg, ${ORANGE_DARK}, ${ORANGE})`,
              }}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px]" style={{ color: TEXT_TERTIARY }}>
              {completedCount} of {milestones.length} milestones complete
            </span>
            <span
              className="text-[10px] font-bold uppercase tracking-wider"
              style={{ color: progressPct >= 100 ? IOS_GREEN : TEXT_TERTIARY }}
            >
              {progressPct >= 100 ? "✓ Complete" : "In progress"}
            </span>
          </div>
        </div>
      </section>

      {/* ===================== AI TIPS HEADER ===================== */}
      <section className="px-4 pt-6">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <Sparkles size={16} style={{ color: ORANGE }} />
            <h2
              className="text-[16px] font-extrabold tracking-tight"
              style={{ color: TEXT_PRIMARY, letterSpacing: "-0.01em" }}
            >
              AI Manifestation Guide
            </h2>
          </div>
          <button
            onClick={fetchAITips}
            disabled={aiLoading}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider active:scale-95 disabled:opacity-50"
            style={{
              backgroundColor: "rgba(255,159,10,0.12)",
              color: ORANGE,
              border: `1px solid rgba(255,159,10,0.3)`,
            }}
          >
            <RefreshCw size={11} className={aiLoading ? "animate-spin" : ""} />
            {aiLoading ? "Loading..." : "Regenerate"}
          </button>
        </div>
        {aiError && (
          <div
            className="text-[11px] mb-2 px-3 py-1.5 rounded-lg"
            style={{
              backgroundColor: "rgba(255,69,58,0.08)",
              color: IOS_RED,
              border: "1px solid rgba(255,69,58,0.2)",
            }}
          >
            {aiError}
          </div>
        )}
      </section>

      {/* ===================== TIPS SECTIONS ===================== */}
      <section className="px-4 pt-2 pb-4 space-y-4">
        <TipSection
          title="Identity Shifting"
          subtitle="Become the person who already has this"
          icon={<Crown size={14} />}
          color={ORANGE}
          tips={identityTips}
        />
        <TipSection
          title="Action Manifestation"
          subtitle="Reverse-engineer the outcome"
          icon={<Sword size={14} />}
          color={IOS_GREEN}
          tips={actionTips}
        />
        <TipSection
          title="Daily Rituals"
          subtitle="Install autopilot anchors"
          icon={<Shield size={14} />}
          color={IOS_BLUE}
          tips={ritualTips}
        />
        <TipSection
          title="Inner Saboteur"
          subtitle="Befriend the resistance"
          icon={<Heart size={14} />}
          color={IOS_PURPLE}
          tips={blockerTips}
        />
      </section>

      {/* ===================== MILESTONES ===================== */}
      <section className="px-4 pt-2 pb-4">
        <div className="flex items-center gap-2 mb-3 px-1">
          <CheckCircle2 size={14} style={{ color: IOS_GREEN }} />
          <h2
            className="text-[16px] font-extrabold tracking-tight"
            style={{ color: TEXT_PRIMARY, letterSpacing: "-0.01em" }}
          >
            Quest Milestones
          </h2>
        </div>
        <div
          className="rounded-2xl overflow-hidden"
          style={{ backgroundColor: SURFACE, border: `1px solid ${HAIRLINE}` }}
        >
          {milestones.map((m, i) => (
            <button
              key={i}
              onClick={() => toggleMilestone(i)}
              className="w-full flex items-center gap-3 px-3 py-3 text-left active:opacity-70 transition"
              style={{
                borderTop: i === 0 ? "none" : `1px solid ${HAIRLINE}`,
              }}
            >
              {m.done ? (
                <CheckCircle2 size={20} style={{ color: IOS_GREEN }} />
              ) : (
                <Circle size={20} style={{ color: TEXT_TERTIARY }} />
              )}
              <span
                className="flex-1 text-[13px] font-semibold"
                style={{
                  color: m.done ? TEXT_TERTIARY : TEXT_PRIMARY,
                  textDecoration: m.done ? "line-through" : "none",
                }}
              >
                {m.text}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* ===================== FOOTER CTA ===================== */}
      <section className="px-4 pt-3 pb-20">
        <div
          className="rounded-2xl p-4 text-center"
          style={{
            backgroundColor: SURFACE,
            border: `1px solid ${HAIRLINE}`,
          }}
        >
          <Flame size={28} style={{ color: ORANGE }} className="mx-auto mb-2" />
          <p
            className="text-[13px] font-semibold mb-3"
            style={{ color: TEXT_PRIMARY }}
          >
            "The goal is not the destination. The person you become is."
          </p>
          <button
            onClick={onBack}
            className="px-5 py-2.5 rounded-full font-extrabold text-[12px] active:scale-95"
            style={{ backgroundColor: ORANGE, color: "#000" }}
          >
            Return to Quest Board
          </button>
        </div>
      </section>

      {/* ===================== IMAGE PICKER MODAL ===================== */}
      {showImagePicker && (
        <div
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.85)" }}
          onClick={() => setShowImagePicker(false)}
        >
          <div
            className="w-full max-w-[420px] rounded-t-3xl sm:rounded-3xl p-5 max-h-[80vh] overflow-y-auto"
            style={{ backgroundColor: SURFACE, border: `1px solid ${HAIRLINE}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className="text-[10px] font-bold tracking-widest uppercase"
                style={{ color: TEXT_TERTIARY }}
              >
                Choose Background
              </div>
              <button
                onClick={() => setShowImagePicker(false)}
                className="p-1 rounded-lg"
                style={{ color: TEXT_TERTIARY }}
              >
                <X size={16} />
              </button>
            </div>
            <p
              className="text-[12px] mb-3"
              style={{ color: TEXT_SECONDARY }}
            >
              Pick a cinematic backdrop for this quest.
            </p>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {HERO_IMAGES.map((img) => {
                const selected = heroImage === img.url;
                return (
                  <button
                    key={img.url}
                    onClick={() => {
                      setHeroImage(img.url);
                      setShowImagePicker(false);
                      showToast("Background updated", "ok");
                    }}
                    className="relative aspect-[3/4] rounded-xl overflow-hidden active:scale-95"
                    style={{
                      border: `2px solid ${selected ? ORANGE : HAIRLINE}`,
                    }}
                  >
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundImage: `url(${img.url})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    />
                    <div
                      className="absolute bottom-1 left-1 right-1 text-[8px] font-bold uppercase text-center py-0.5 rounded"
                      style={{
                        backgroundColor: "rgba(0,0,0,0.6)",
                        color: selected ? ORANGE : "#fff",
                      }}
                    >
                      {img.label}
                    </div>
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 rounded-xl font-bold text-[13px] flex items-center justify-center gap-2 active:scale-95"
              style={{
                backgroundColor: SURFACE,
                color: TEXT_PRIMARY,
                border: `1px solid ${HAIRLINE}`,
              }}
            >
              <Camera size={14} /> Upload from device
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              style={{ display: "none" }}
            />
          </div>
        </div>
      )}

      {/* ===================== TOAST ===================== */}
      {toast && (
        <div
          className="fixed left-1/2 -translate-x-1/2 z-[300] px-4 py-2.5 rounded-2xl text-[12px] font-bold flex items-center gap-2"
          style={{
            top: "20px",
            backgroundColor:
              toast.type === "ok" ? "rgba(52,199,89,0.95)" : "rgba(255,69,58,0.95)",
            color: "#fff",
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            minWidth: 200,
          }}
        >
          {toast.type === "ok" ? <CheckCircle2 size={14} /> : <X size={14} />}
          {toast.msg}
        </div>
      )}
    </div>
  );
};

// ===================== TIP SECTION =====================
const TipSection: React.FC<{
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  tips: AITip[];
}> = ({ title, subtitle, icon, color, tips }) => {
  if (tips.length === 0) return null;
  return (
    <div
      className="rounded-2xl p-4"
      style={{
        backgroundColor: SURFACE,
        border: `1px solid ${HAIRLINE}`,
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{
            backgroundColor: `${color}22`,
            color: color,
            border: `1px solid ${color}44`,
          }}
        >
          {icon}
        </div>
        <div>
          <div
            className="text-[10px] font-bold tracking-widest uppercase"
            style={{ color: TEXT_TERTIARY }}
          >
            {title}
          </div>
          <div
            className="text-[13px] font-extrabold"
            style={{ color: TEXT_PRIMARY }}
          >
            {subtitle}
          </div>
        </div>
      </div>
      <div className="space-y-3">
        {tips.map((t, i) => (
          <div
            key={i}
            className="p-3 rounded-xl"
            style={{ backgroundColor: "rgba(255,255,255,0.02)" }}
          >
            <div
              className="text-[12.5px] font-bold mb-1"
              style={{ color: color }}
            >
              {t.title}
            </div>
            <p
              className="text-[12px] leading-relaxed mb-2"
              style={{ color: TEXT_SECONDARY }}
            >
              {t.description}
            </p>
            {t.steps && t.steps.length > 0 && (
              <ol className="space-y-1">
                {t.steps.map((s, j) => (
                  <li
                    key={j}
                    className="flex items-start gap-2 text-[11.5px]"
                    style={{ color: TEXT_PRIMARY }}
                  >
                    <span
                      className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold mt-0.5"
                      style={{
                        backgroundColor: `${color}22`,
                        color: color,
                      }}
                    >
                      {j + 1}
                    </span>
                    <span>{s}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ===================== META PILL =====================
const MetaPill: React.FC<{ label: string; value: string; color?: string }> = ({
  label,
  value,
  color = "#ffffff",
}) => (
  <div
    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
    style={{
      backgroundColor: "rgba(0,0,0,0.4)",
      backdropFilter: "blur(8px)",
      border: "1px solid rgba(255,255,255,0.12)",
    }}
  >
    <span
      className="text-[9px] font-bold uppercase tracking-wider"
      style={{ color: "rgba(255,255,255,0.5)" }}
    >
      {label}
    </span>
    <span className="text-[10.5px] font-bold" style={{ color }}>
      {value}
    </span>
  </div>
);

import { X } from "lucide-react";

// ===================== HELPERS =====================
function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return h;
}

function defaultMilestonesFor(goal: GoalDetailData): { text: string; done: boolean }[] {
  // 5 generic milestones based on goal title
  const base = [
    "Define the smallest first action",
    "Set up your daily reminder system",
    "Complete one full week of practice",
    "Hit the 50% milestone",
    "Celebrate the final achievement",
  ];
  return base.map((text) => ({ text, done: (goal.progress || 0) >= 20 * (base.indexOf(text) + 1) }));
}

export default GoalDetailPage;

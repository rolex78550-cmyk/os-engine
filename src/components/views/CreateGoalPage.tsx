import React, { useState } from "react";
import { resolveImageUrl } from "../../lib/imageHelper";
import {
  X, Check, Target, ChevronRight, Plus
} from "lucide-react";

// Design tokens (matches GoalsHub)
const TEXT_PRIMARY = "#ffffff";
const TEXT_SECONDARY = "rgba(235,235,245,0.62)";
const TEXT_TERTIARY = "rgba(235,235,245,0.32)";
const SURFACE = "#0a0a0a";
const HAIRLINE = "rgba(255,255,255,0.08)";
const HAIRLINE_STRONG = "rgba(255,255,255,0.18)";
const ORANGE = "#ff9f0a";
const ORANGE_DARK = "#ff7a00";
const IOS_GREEN = "#34c759";
const IOS_RED = "#ff453a";

export interface GoalFormData {
  title: string;
  description: string;
  rank: "E" | "D" | "C" | "B" | "A";
  xp: number;
  category: string;
  icon: string;
  deadline: string;
  progress: number;
}

const DEFAULT_FORM: GoalFormData = {
  title: "",
  description: "",
  rank: "C",
  xp: 200,
  category: "Lifestyle",
  icon: "🎯",
  deadline: "",
  progress: 0,
};

const CATEGORIES = [
  { value: "Lifestyle", jpLabel: "ライフスタイル", icon: "🏠" },
  { value: "Health", jpLabel: "健康", icon: "💪" },
  { value: "Career", jpLabel: "キャリア", icon: "🚀" },
  { value: "Wealth", jpLabel: "富", icon: "💰" },
  { value: "Knowledge", jpLabel: "知識", icon: "📚" },
  { value: "Relationships", jpLabel: "関係", icon: "🤝" },
];

const ICONS = ["🎯", "💪", "🏠", "💰", "📚", "🚀", "🗾", "✍️", "🔥", "🌟", "👑", "⚡"];

const HERO_IMAGES: Record<string, string> = {
  Lifestyle: "/images/goal_house.jpg",
  Health: "/images/goal_jinwoo.jpg",
  Career: "/images/goal_jinwoo.jpg",
  Wealth: "/images/goal_house.jpg",
  Knowledge: "/images/goal_jinwoo.jpg",
  Relationships: "/images/goal_house.jpg",
};

interface CreateGoalPageProps {
  isEdit?: boolean;
  initialData?: Partial<GoalFormData>;
  onBack: () => void;
  onSave: (data: GoalFormData) => void;
}

export const CreateGoalPage: React.FC<CreateGoalPageProps> = ({
  isEdit = false,
  initialData,
  onBack,
  onSave,
}) => {
  const [form, setForm] = useState<GoalFormData>({
    ...DEFAULT_FORM,
    ...initialData,
  });
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  // Auto-dismiss toast
  React.useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 2400);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const showToast = (msg: string, type: "ok" | "err" = "ok") =>
    setToast({ msg, type });

  // Auto-update icon when category changes
  const handleCategoryChange = (newCat: string) => {
    const def = CATEGORIES.find((c) => c.value === newCat);
    setForm((f) => ({
      ...f,
      category: newCat,
      icon: def?.icon || f.icon,
    }));
  };

  const handleSubmit = () => {
    if (!form.title.trim()) {
      showToast("Title is required", "err");
      return;
    }
    onSave(form);
  };

  const heroImage = resolveImageUrl(HERO_IMAGES[form.category] || "/images/goal_jinwoo.jpg");
  const currentCat = CATEGORIES.find((c) => c.value === form.category);

  return (
    <div
      className="relative w-full"
      style={{ backgroundColor: "#000", minHeight: "100vh" }}
    >
      {/* ===================== HERO SECTION (background image) ===================== */}
      <section className="relative w-full" style={{ minHeight: 240 }}>
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url(${heroImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center 25%",
            backgroundRepeat: "no-repeat",
            opacity: 0.35,
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 40%, rgba(0,0,0,0.92) 100%)",
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
            <span style={{ fontSize: 14 }}>←</span>
            <span className="text-[12px] font-semibold">Back</span>
          </button>
          <div className="flex flex-col items-center">
            <div
              className="font-extrabold tracking-tight leading-none"
              style={{ color: TEXT_PRIMARY, fontSize: 14, letterSpacing: "-0.01em" }}
            >
              {isEdit ? "Edit Goal" : "Create New Goal"}
            </div>
            <div
              className="text-[9px] mt-0.5 uppercase tracking-wider"
              style={{ color: TEXT_TERTIARY }}
            >
              {isEdit ? "Update your goal" : "Solo Dominion"}
            </div>
          </div>
          <button
            onClick={onBack}
            className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90"
            style={{
              backgroundColor: SURFACE,
              border: `1px solid ${HAIRLINE_STRONG}`,
              color: TEXT_TERTIARY,
            }}
            aria-label="Cancel"
          >
            <X size={14} />
          </button>
        </div>

        {/* Center content */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-8 pb-4">
          {/* Target icon */}
          <div
            className="mb-3 flex items-center justify-center"
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              border: `2.5px solid ${IOS_RED}`,
              backgroundColor: SURFACE,
            }}
          >
            <span style={{ fontSize: 28 }}>{form.icon}</span>
          </div>

          {/* Title + subtitle */}
          <h1
            className="font-extrabold leading-[1.1] tracking-tight"
            style={{
              color: TEXT_PRIMARY,
              fontSize: "clamp(1.4rem, 4.5vw, 1.85rem)",
              letterSpacing: "-0.02em",
            }}
          >
            {isEdit ? "Edit your" : "Forge a new"}{" "}
            <span style={{ color: ORANGE }}>{currentCat?.jpLabel || "目標"}</span>
          </h1>
          <p
            className="mt-2 text-[12.5px] leading-relaxed"
            style={{ color: TEXT_SECONDARY, maxWidth: 360 }}
          >
            {isEdit
              ? "Update your goal details and track new progress."
              : "Define your ambition. We'll forge a path to victory."}
          </p>
        </div>
      </section>

      {/* ===================== FORM SECTION ===================== */}
      <section className="px-4 pt-4 pb-32 relative z-10">
        {/* Title field */}
        <FormField label="Goal Title" required>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            maxLength={60}
            className="w-full px-3 py-2.5 rounded-xl text-[14px] outline-none"
            style={{
              backgroundColor: "#000",
              border: `1px solid ${HAIRLINE}`,
              color: TEXT_PRIMARY,
              fontFamily: "inherit",
            }}
            placeholder="e.g., Buy a house"
          />
        </FormField>

        {/* Description field */}
        <FormField label="Description">
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            maxLength={200}
            rows={3}
            className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none resize-none"
            style={{
              backgroundColor: "#000",
              border: `1px solid ${HAIRLINE}`,
              color: TEXT_PRIMARY,
              fontFamily: "inherit",
            }}
            placeholder="Why does this matter to you?"
          />
          <div
            className="text-[10px] text-right mt-1"
            style={{ color: TEXT_TERTIARY }}
          >
            {form.description.length}/200
          </div>
        </FormField>

        {/* Category + Rank row */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <FormField label="Category">
            <select
              value={form.category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none appearance-none"
              style={{
                backgroundColor: "#000",
                border: `1px solid ${HAIRLINE}`,
                color: TEXT_PRIMARY,
                fontFamily: "inherit",
              }}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.icon} {c.value}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Rank">
            <select
              value={form.rank}
              onChange={(e) =>
                setForm({ ...form, rank: e.target.value as any })
              }
              className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none appearance-none"
              style={{
                backgroundColor: "#000",
                border: `1px solid ${HAIRLINE}`,
                color: TEXT_PRIMARY,
                fontFamily: "inherit",
              }}
            >
              <option value="E">E — Easy</option>
              <option value="D">D — Normal</option>
              <option value="C">C — Hard</option>
              <option value="B">B — Epic</option>
              <option value="A">A — Legendary</option>
            </select>
          </FormField>
        </div>

        {/* Icon picker */}
        <FormField label="Icon">
          <div className="flex flex-wrap gap-2">
            {ICONS.map((ic) => {
              const selected = form.icon === ic;
              return (
                <button
                  key={ic}
                  onClick={() => setForm({ ...form, icon: ic })}
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-xl active:scale-90"
                  style={{
                    backgroundColor: selected
                      ? "rgba(255,69,58,0.15)"
                      : SURFACE,
                    border: `1.5px solid ${
                      selected ? "rgba(255,69,58,0.5)" : HAIRLINE
                    }`,
                  }}
                >
                  {ic}
                </button>
              );
            })}
          </div>
        </FormField>

        {/* XP + Deadline row */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <FormField label="XP Reward">
            <input
              type="number"
              value={form.xp}
              onChange={(e) =>
                setForm({
                  ...form,
                  xp: Math.max(50, Number(e.target.value) || 0),
                })
              }
              min={50}
              step={50}
              className="w-full px-3 py-2.5 rounded-xl text-[14px] outline-none"
              style={{
                backgroundColor: "#000",
                border: `1px solid ${HAIRLINE}`,
                color: TEXT_PRIMARY,
                fontFamily: "inherit",
              }}
            />
          </FormField>
          <FormField label="Deadline">
            <input
              type="text"
              value={form.deadline}
              onChange={(e) =>
                setForm({ ...form, deadline: e.target.value })
              }
              maxLength={20}
              className="w-full px-3 py-2.5 rounded-xl text-[14px] outline-none"
              style={{
                backgroundColor: "#000",
                border: `1px solid ${HAIRLINE}`,
                color: TEXT_PRIMARY,
                fontFamily: "inherit",
              }}
              placeholder="31 Dec 2026"
            />
          </FormField>
        </div>

        {/* Progress slider (edit mode only) */}
        {isEdit && (
          <FormField label="Progress">
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={100}
                value={form.progress}
                onChange={(e) =>
                  setForm({ ...form, progress: Number(e.target.value) })
                }
                className="flex-1"
                style={{ accentColor: ORANGE }}
              />
              <span
                className="text-[15px] font-extrabold tabular-nums min-w-[42px] text-right"
                style={{ color: ORANGE }}
              >
                {form.progress}%
              </span>
            </div>
          </FormField>
        )}

        {/* Quick stats preview */}
        <div
          className="rounded-2xl p-3 mt-2 mb-4"
          style={{
            backgroundColor: "rgba(255,255,255,0.02)",
            border: `1px solid ${HAIRLINE}`,
          }}
        >
          <div
            className="text-[9px] font-bold uppercase tracking-widest mb-2"
            style={{ color: TEXT_TERTIARY }}
          >
            Preview
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <PreviewStat label="Rank" value={form.rank} color={ORANGE} />
            <PreviewStat
              label="XP"
              value={form.xp.toString()}
              color={ORANGE}
            />
            <PreviewStat
              label="Icon"
              value={form.icon}
              color={TEXT_PRIMARY}
              isEmoji
            />
          </div>
        </div>
      </section>

      {/* ===================== STICKY BOTTOM CTA ===================== */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 px-5 pb-6 pt-4"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.85) 30%, rgba(0,0,0,1) 100%)",
        }}
      >
        <button
          onClick={handleSubmit}
          disabled={!form.title.trim()}
          className="w-full max-w-[420px] mx-auto flex items-center justify-center gap-2 font-extrabold text-[15px] py-3.5 rounded-2xl active:scale-[0.98] disabled:opacity-40"
          style={{
            backgroundColor: IOS_RED,
            color: "#fff",
            boxShadow: "0 8px 24px rgba(255,69,58,0.3)",
          }}
        >
          {isEdit ? <Check size={18} strokeWidth={2.5} /> : <Plus size={18} strokeWidth={2.5} />}
          <span>{isEdit ? "Save Changes" : "Create Goal"}</span>
        </button>
      </div>

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
          {toast.type === "ok" ? <Check size={14} /> : <X size={14} />}
          {toast.msg}
        </div>
      )}
    </div>
  );
};

// ===================== FORM FIELD =====================
const FormField: React.FC<{
  label: string;
  required?: boolean;
  children: React.ReactNode;
}> = ({ label, required, children }) => (
  <div className="mb-3">
    <label
      className="text-[10px] font-bold tracking-widest uppercase mb-1.5 block"
      style={{ color: TEXT_TERTIARY }}
    >
      {label}
      {required && <span style={{ color: IOS_RED }}> *</span>}
    </label>
    {children}
  </div>
);

// ===================== PREVIEW STAT =====================
const PreviewStat: React.FC<{
  label: string;
  value: string;
  color: string;
  isEmoji?: boolean;
}> = ({ label, value, color, isEmoji }) => (
  <div>
    <div
      className="text-[9px] font-bold uppercase tracking-widest"
      style={{ color: TEXT_TERTIARY }}
    >
      {label}
    </div>
    <div
      className="text-[16px] font-extrabold mt-0.5"
      style={{
        color,
        fontSize: isEmoji ? 20 : 16,
        letterSpacing: "-0.01em",
      }}
    >
      {value}
    </div>
  </div>
);

export default CreateGoalPage;

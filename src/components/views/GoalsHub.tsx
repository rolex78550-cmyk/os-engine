import React, { useState, useEffect } from "react";
import { resolveImageUrl } from "../../lib/imageHelper";
import {
  Plus, Target, Trophy, Flame, X, Check, Sparkles, Edit3, Trash2
} from "lucide-react";
import { CreateGoalPage, type GoalFormData } from "./CreateGoalPage";
import { GoalDetailPage } from "./GoalDetailPage";

// Design tokens (matches Solo Dominion style)
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

export interface GoalItem {
  id: string;
  title: string;
  description: string;
  rank: "E" | "D" | "C" | "B" | "A";
  progress: number;
  image: string;
  jpLabel: string;
  icon: string;
  category?: string;
  deadline?: string;
  totalMilestones?: number;
  completedMilestones?: number;
}

const FALLBACK_GOALS: GoalItem[] = [
  {
    id: "g1",
    title: "Dream House",
    description: "Save and build the home of your dreams. 3-year plan with monthly milestones.",
    rank: "B",
    progress: 60,
    image: "/images/goal_house.jpg",
    jpLabel: "理想の家",
    icon: "🏠",
    category: "Lifestyle",
    deadline: "31 Dec 2027",
    totalMilestones: 12,
    completedMilestones: 7,
  },
  {
    id: "g2",
    title: "6 Pack in 6 Months",
    description: "Build your dream body. Daily workouts + strict nutrition tracking.",
    rank: "C",
    progress: 45,
    image: "/images/goal_jinwoo.jpg",
    jpLabel: "肉体改造",
    icon: "💪",
    category: "Health",
    deadline: "30 Nov 2025",
    totalMilestones: 8,
    completedMilestones: 3,
  },
  {
    id: "g3",
    title: "Launch a SaaS",
    description: "Build and ship your software product. MVP, beta, public launch in 90 days.",
    rank: "A",
    progress: 25,
    image: "/images/goal_jinwoo.jpg",
    jpLabel: "起業",
    icon: "🚀",
    category: "Career",
    deadline: "15 Jan 2026",
    totalMilestones: 10,
    completedMilestones: 2,
  },
  {
    id: "g4",
    title: "Financial Freedom",
    description: "Build wealth through smart investments. Index funds + side income streams.",
    rank: "A",
    progress: 50,
    image: "/images/goal_house.jpg",
    jpLabel: "経済的自由",
    icon: "💰",
    category: "Wealth",
    deadline: "31 Dec 2026",
    totalMilestones: 15,
    completedMilestones: 7,
  },
  {
    id: "g5",
    title: "Read 50 Books",
    description: "Read 50 high-value books this year. One book every 7 days, no skipping.",
    rank: "C",
    progress: 70,
    image: "/images/goal_jinwoo.jpg",
    jpLabel: "読書",
    icon: "📚",
    category: "Knowledge",
    deadline: "31 Dec 2025",
    totalMilestones: 50,
    completedMilestones: 35,
  },
  {
    id: "g6",
    title: "Learn Japanese",
    description: "Master conversational Japanese. Daily Anki + weekly tutor sessions.",
    rank: "B",
    progress: 30,
    image: "/images/goal_house.jpg",
    jpLabel: "日本語",
    icon: "🗾",
    category: "Knowledge",
    deadline: "30 Jun 2026",
    totalMilestones: 20,
    completedMilestones: 6,
  },
];

interface GoalsHubProps {
  playerName?: string;
  goals?: GoalItem[];
  onCreateGoal?: () => void;
  onGoalClick?: (goal: GoalItem) => void;
  onBack?: () => void;
  onEditGoal?: (goal: GoalItem) => void;
  onDeleteGoal?: (goal: GoalItem) => void;
  handleCreateGoal?: (...args: any[]) => any;
  handleUpdateGoal?: (...args: any[]) => any;
  handleDeleteGoalExternal?: (...args: any[]) => any;
  isCreatingGoal?: boolean;
  newGoalTitle?: string;
  setNewGoalTitle?: (s: any) => void;
  newGoalCategory?: any;
  setNewGoalCategory?: (s: any) => void;
  newGoalIcon?: string;
  setNewGoalIcon?: (s: any) => void;
  [k: string]: any;
}

export const GoalsHub: React.FC<GoalsHubProps> = ({
  playerName = "Hunter",
  goals: externalGoals,
  onCreateGoal,
  onGoalClick,
  onEditGoal: externalEdit,
  onDeleteGoal: externalDelete,
  handleCreateGoal,
  handleUpdateGoal,
  handleDeleteGoalExternal,
  isCreatingGoal = false,
  newGoalTitle,
  setNewGoalTitle,
  newGoalCategory,
  setNewGoalCategory,
  newGoalIcon,
  setNewGoalIcon,
}) => {
  // Local state for in-component CRUD
  const [localGoals, setLocalGoals] = useState<GoalItem[]>(() => {
    // Priority: onboardingGoals first, then any provided external goals, then fallback
    const onboarding = (externalGoals as any)?.onboardingGoals as GoalItem[] | undefined;
    if (Array.isArray(onboarding) && onboarding.length > 0) return onboarding;
    if (Array.isArray(externalGoals) && externalGoals.length > 0) return externalGoals;
    return FALLBACK_GOALS;
  });
  const [selectedGoal, setSelectedGoal] = useState<GoalItem | null>(null);
  // Router state: "hub" = main page, "create" = create full page, "edit" = edit full page, "detail" = goal detail
  const [currentView, setCurrentView] = useState<"hub" | "create" | "edit" | "detail">("hub");
  const [detailGoal, setDetailGoal] = useState<GoalItem | null>(null);
  const [editingExisting, setEditingExisting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  // Form state for create/edit (initial values for the full page)
  const [formInitial, setFormInitial] = useState<Partial<GoalFormData>>({});

  // Form state for create/edit
  const [newGoal, setNewGoal] = useState<{
    title: string;
    description: string;
    rank: "E" | "D" | "C" | "B" | "A";
    category: string;
    icon: string;
    deadline: string;
    progress: number;
  }>({
    title: "",
    description: "",
    rank: "C",
    category: "Lifestyle",
    icon: "🎯",
    deadline: "",
    progress: 0,
  });

  // Sync external goals
  useEffect(() => {
    if (externalGoals) setLocalGoals(externalGoals);
  }, [externalGoals]);

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

  const openCreateModal = () => {
    setEditingExisting(false);
    setFormInitial({});
    setCurrentView("create");
    if (onCreateGoal) onCreateGoal();
  };

  const handleEditClick = (goal: GoalItem) => {
    setEditingExisting(true);
    setSelectedGoal(goal);
    setFormInitial({
      title: goal.title,
      description: goal.description,
      rank: goal.rank,
      progress: goal.progress,
      category: goal.category || "Lifestyle",
      icon: goal.icon,
      deadline: goal.deadline || "",
    });
    setCurrentView("edit");
    if (externalEdit) externalEdit(goal);
  };

  const handleSaveGoal = (formData: GoalFormData) => {
    if (!formData.title.trim()) {
      showToast("Title is required", "err");
      return;
    }

    const jpLabels: Record<string, string> = {
      Lifestyle: "ライフスタイル",
      Health: "健康",
      Career: "キャリア",
      Wealth: "富",
      Knowledge: "知識",
      Relationships: "関係",
    };

    const goalData: GoalItem = {
      id: editingExisting
        ? selectedGoal?.id || `g_${Date.now()}`
        : `g_${Date.now()}`,
      title: formData.title.trim(),
      description:
        formData.description.trim() ||
        `Achieve your ${formData.category.toLowerCase()} goal.`,
      rank: formData.rank,
      progress: formData.progress,
      image: FALLBACK_GOALS[Math.floor(Math.random() * FALLBACK_GOALS.length)]
        .image,
      jpLabel: jpLabels[formData.category] || "目標",
      icon: formData.icon,
      category: formData.category,
      deadline: formData.deadline,
      totalMilestones: 10,
      completedMilestones: Math.floor((formData.progress / 100) * 10),
    };

    if (editingExisting) {
      setLocalGoals((prev) =>
        prev.map((g) => (g.id === goalData.id ? goalData : g))
      );
      showToast("Goal updated", "ok");
      if (handleUpdateGoal) handleUpdateGoal(goalData);
    } else {
      setLocalGoals((prev) => [goalData, ...prev]);
      showToast("Goal created", "ok");
      if (handleCreateGoal) handleCreateGoal(goalData);
    }
    setCurrentView("hub");
    setSelectedGoal(null);
  };

  const handleDeleteGoal = (goal: GoalItem) => {
    setLocalGoals((prev) => prev.filter((g) => g.id !== goal.id));
    if (externalDelete) externalDelete(goal);
    if (handleDeleteGoalExternal) handleDeleteGoalExternal(goal);
    showToast("Goal deleted", "ok");
  };

  const handleGoalCardClick = (goal: GoalItem) => {
    setDetailGoal(goal);
    setCurrentView("detail");
    if (onGoalClick) onGoalClick(goal);
  };

  // Use local goals for rendering
  const goals = localGoals;

  // Stats
  const activeCount = goals.length;
  const avgProgress = goals.length > 0
    ? Math.round(goals.reduce((s, g) => s + g.progress, 0) / goals.length)
    : 0;

  // ===================== ROUTER: Full page views =====================
  if (currentView === "detail" && detailGoal) {
    return (
      <GoalDetailPage
        goal={detailGoal}
        onBack={() => {
          setCurrentView("hub");
          setDetailGoal(null);
        }}
        onProgress={(delta) => {
          if (Math.abs(delta) > 0.5) {
            setLocalGoals((prev) =>
              prev.map((g) =>
                g.id === detailGoal.id
                  ? { ...g, progress: Math.max(0, Math.min(100, (g.progress || 0) + delta)) }
                  : g
              )
            );
          }
        }}
      />
    );
  }

  if (currentView === "create") {
    return (
      <CreateGoalPage
        isEdit={false}
        initialData={formInitial}
        onBack={() => setCurrentView("hub")}
        onSave={handleSaveGoal}
      />
    );
  }

  if (currentView === "edit") {
    return (
      <CreateGoalPage
        isEdit={true}
        initialData={formInitial}
        onBack={() => setCurrentView("hub")}
        onSave={handleSaveGoal}
      />
    );
  }

  return (
    <div
      className="relative w-full"
      style={{ backgroundColor: "#000", minHeight: "100dvh" }}
    >
      {/* ===================== HERO SECTION ===================== */}
      <section
        className="relative w-full"
        style={{ minHeight: "min(320px, 42dvh)" }}
      >
        {/* Jinwoo background image */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "url(/images/goal_jinwoo.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center 20%",
            backgroundRepeat: "no-repeat",
            opacity: 0.4,
          }}
        />
        {/* Dark gradient overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.3) 35%, rgba(0,0,0,0.85) 100%)",
          }}
        />

        {/* Top status bar */}
        <div
          className="relative z-10 flex items-center justify-between px-5 pt-6 text-[11px] font-semibold tracking-wider"
          style={{ color: TEXT_TERTIARY }}
        >
          <span>HUNTER · GOALS</span>
          <span style={{ color: ORANGE }}>● {activeCount} ACTIVE</span>
        </div>

        {/* Center content */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-10 pb-6">
          {/* Target icon */}
          <div
            className="mb-5 flex items-center justify-center"
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              border: `1px solid ${HAIRLINE_STRONG}`,
              backgroundColor: SURFACE,
            }}
          >
            <Target size={24} strokeWidth={1.8} style={{ color: ORANGE }} />
          </div>

          {/* Main heading */}
          <h1
            className="font-extrabold leading-[1.05] tracking-tight"
            style={{
              color: TEXT_PRIMARY,
              fontSize: "clamp(1.75rem, 5vw, 2.75rem)",
              letterSpacing: "-0.02em",
              maxWidth: "640px",
            }}
          >
            Build your <span style={{ color: ORANGE }}>dream life</span>.
          </h1>

          {/* Subtitle */}
          <p
            className="mt-3 text-[14px] leading-relaxed"
            style={{ color: TEXT_SECONDARY, maxWidth: "400px" }}
          >
            Forge your <span style={{ color: TEXT_PRIMARY, fontWeight: 600 }}>future identity</span>.
            Set goals and complete milestones to turn desire into reality.
          </p>

          {/* Create New Goal button — RED, right under heading */}
          <button
            onClick={openCreateModal}
            className="mt-5 px-7 py-3 rounded-2xl font-extrabold text-[14px] flex items-center gap-2 transition active:scale-[0.97]"
            style={{
              backgroundColor: IOS_RED,
              color: "#fff",
              boxShadow: "0 8px 24px rgba(255,69,58,0.3)",
            }}
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Create New Goal</span>
          </button>
        </div>
      </section>

      {/* ===================== STATS STRIP ===================== */}
      <section className="px-5 pt-2 pb-4">
        <div
          className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl"
          style={{ backgroundColor: HAIRLINE, border: `1px solid ${HAIRLINE}` }}
        >
          {[
            { label: "Active", val: activeCount.toString(), icon: "◆", color: ORANGE },
            { label: "Progress", val: `${avgProgress}%`, icon: "▲", color: ORANGE },
          ].map((s) => (
            <div
              key={s.label}
              className="flex flex-col items-center py-3.5"
              style={{ backgroundColor: "#000" }}
            >
              <div className="flex items-center gap-1">
                <span style={{ color: s.color, fontSize: 9, fontWeight: 700 }}>
                  {s.icon}
                </span>
                <span
                  className="text-[17px] font-extrabold tabular-nums"
                  style={{ color: TEXT_PRIMARY, letterSpacing: "-0.02em" }}
                >
                  {s.val}
                </span>
              </div>
              <span
                className="text-[9px] uppercase tracking-wider mt-0.5"
                style={{ color: TEXT_TERTIARY }}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ===================== GOAL CARDS ===================== */}
      <section className="px-4 pt-3 pb-24">
        <div className="flex items-end justify-between mb-3 px-1">
          <h2
            className="text-[20px] font-extrabold tracking-tight"
            style={{ color: TEXT_PRIMARY, letterSpacing: "-0.01em" }}
          >
            Your Goals
          </h2>
          <span
            className="text-[11px] uppercase tracking-wider"
            style={{ color: TEXT_TERTIARY }}
          >
            Tap to enter →
          </span>
        </div>

        <div className="space-y-3">
          {goals.map((goal) => {
            const isHovered = hovered === goal.id;
            const filledBars = Math.round((goal.progress / 100) * 28);

            return (
              <div
                key={goal.id}
                onMouseEnter={() => setHovered(goal.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => handleGoalCardClick(goal)}
                className="relative flex items-stretch gap-3 rounded-2xl p-3 cursor-pointer transition active:scale-[0.99]"
                style={{
                  backgroundColor: SURFACE,
                  border: `1px solid ${isHovered ? HAIRLINE_STRONG : HAIRLINE}`,
                }}
              >
                {/* Left: Goal image + rank badge */}
                <div
                  className="relative shrink-0 rounded-xl overflow-hidden"
                  style={{ width: 84, height: 100 }}
                >
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage: `url(${resolveImageUrl(goal.image)})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(180deg, rgba(0,0,0,0.0) 40%, rgba(0,0,0,0.7) 100%)",
                    }}
                  />
                  {/* Rank badge bottom-left */}
                  <div
                    className="absolute bottom-1.5 left-1.5 flex items-center justify-center font-extrabold text-[12px]"
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      backgroundColor: ORANGE,
                      color: "#000",
                    }}
                  >
                    {goal.rank}
                  </div>
                </div>

                {/* Middle: JP label + title + desc + progress */}
                <div className="flex-1 min-w-0 py-1">
                  <div
                    className="text-[9px] font-semibold tracking-widest mb-1 uppercase"
                    style={{ color: TEXT_TERTIARY }}
                  >
                    {goal.jpLabel}
                  </div>
                  <h3
                    className="text-[15px] font-extrabold tracking-tight leading-tight"
                    style={{ color: TEXT_PRIMARY, letterSpacing: "-0.005em" }}
                  >
                    {goal.icon} {goal.title}
                  </h3>
                  <p
                    className="text-[11px] mt-1 leading-snug line-clamp-2"
                    style={{ color: TEXT_SECONDARY }}
                  >
                    {goal.description}
                  </p>

                  {/* Segmented progress bar */}
                  <div className="mt-2 flex items-center gap-0.5">
                    {Array.from({ length: 28 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-1 flex-1 rounded-[1px]"
                        style={{
                          backgroundColor:
                            i < filledBars ? ORANGE : "rgba(255,255,255,0.05)",
                        }}
                      />
                    ))}
                  </div>
                  <div
                    className="flex items-center justify-between mt-1.5"
                  >
                    <span
                      className="text-[10px] font-bold"
                      style={{ color: ORANGE }}
                    >
                      {goal.progress}%
                    </span>
                    {goal.completedMilestones !== undefined && goal.totalMilestones !== undefined && (
                      <span
                        className="text-[10px] font-medium"
                        style={{ color: TEXT_TERTIARY }}
                      >
                        {goal.completedMilestones}/{goal.totalMilestones} milestones
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: arrow */}
                <div className="flex flex-col items-end justify-center shrink-0 pl-1">
                  <span
                    className="mt-1.5 text-[14px]"
                    style={{ color: TEXT_TERTIARY }}
                  >
                    →
                  </span>
                </div>

                {/* Action buttons (edit/delete) — top right corner */}
                <div className="absolute top-2 right-2 flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditClick(goal);
                    }}
                    className="p-2.5 rounded active:scale-90"
                    style={{
                      backgroundColor: "rgba(0,0,0,0.5)",
                      color: TEXT_SECONDARY,
                    }}
                    aria-label="Edit goal"
                  >
                    <Edit3 size={15} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Delete "${goal.title}"?`)) {
                        handleDeleteGoal(goal);
                      }
                    }}
                    className="p-2.5 rounded active:scale-90"
                    style={{
                      backgroundColor: "rgba(0,0,0,0.5)",
                      color: IOS_RED,
                    }}
                    aria-label="Delete goal"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ===================== GOAL DETAIL MODAL ===================== */}
      {selectedGoal && (
        <div
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.75)" }}
          onClick={() => setSelectedGoal(null)}
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
                {selectedGoal.jpLabel}
              </div>
              <button
                onClick={() => setSelectedGoal(null)}
                className="p-1 rounded-lg active:scale-90"
                style={{ color: TEXT_TERTIARY }}
              >
                <X size={16} />
              </button>
            </div>

            <h2
              className="font-extrabold text-2xl mb-2"
              style={{ color: TEXT_PRIMARY, letterSpacing: "-0.02em" }}
            >
              {selectedGoal.icon} {selectedGoal.title}
            </h2>

            <div className="flex items-center gap-2 mb-3">
              <span
                className="px-2 py-0.5 rounded-md text-[10px] font-extrabold tracking-wider uppercase"
                style={{
                  border: `1px solid ${ORANGE}`,
                  color: ORANGE,
                  backgroundColor: "rgba(255,159,10,0.08)",
                }}
              >
                {selectedGoal.rank}-RANK
              </span>
              {selectedGoal.category && (
                <span
                  className="text-[10px] font-bold tracking-wider uppercase"
                  style={{ color: TEXT_TERTIARY }}
                >
                  {selectedGoal.category}
                </span>
              )}
              {selectedGoal.deadline && (
                <span
                  className="text-[10px] font-semibold"
                  style={{ color: TEXT_TERTIARY }}
                >
                  · Due {selectedGoal.deadline}
                </span>
              )}
            </div>

            <p
              className="text-[13px] leading-relaxed mb-4"
              style={{ color: TEXT_SECONDARY }}
            >
              {selectedGoal.description}
            </p>

            {/* Progress display */}
            <div
              className="rounded-2xl p-4 mb-3"
              style={{ backgroundColor: "rgba(255,255,255,0.02)", border: `1px solid ${HAIRLINE}` }}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className="text-[10px] font-bold tracking-widest uppercase"
                  style={{ color: TEXT_TERTIARY }}
                >
                  Progress
                </span>
                <span
                  className="text-[16px] font-extrabold tabular-nums"
                  style={{ color: ORANGE }}
                >
                  {selectedGoal.progress}%
                </span>
              </div>
              <div
                className="h-1.5 rounded-full overflow-hidden"
                style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${selectedGoal.progress}%`,
                    background: `linear-gradient(90deg, ${ORANGE_DARK}, ${ORANGE})`,
                  }}
                />
              </div>
              {selectedGoal.completedMilestones !== undefined &&
                selectedGoal.totalMilestones !== undefined && (
                  <div
                    className="text-[11px] mt-2"
                    style={{ color: TEXT_SECONDARY }}
                  >
                    <span style={{ color: ORANGE, fontWeight: 700 }}>
                      {selectedGoal.completedMilestones}
                    </span>{" "}
                    of {selectedGoal.totalMilestones} milestones complete
                  </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSelectedGoal(null);
                  setTimeout(() => handleEditClick(selectedGoal), 50);
                }}
                className="flex-1 py-3 rounded-xl font-bold text-[13px] active:scale-95"
                style={{
                  backgroundColor: SURFACE,
                  color: TEXT_PRIMARY,
                  border: `1px solid ${HAIRLINE}`,
                }}
              >
                Edit
              </button>
              <button
                onClick={() => {
                  handleDeleteGoal(selectedGoal);
                  setSelectedGoal(null);
                }}
                className="flex-1 py-3 rounded-xl font-extrabold text-[13px] active:scale-95"
                style={{ backgroundColor: IOS_RED, color: "#fff" }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
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

export default GoalsHub;

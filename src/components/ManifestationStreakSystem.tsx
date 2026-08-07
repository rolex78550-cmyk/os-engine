import React from "react";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Award, BarChart3, CalendarDays, Camera, CheckCircle2, ChevronRight,
  Flame, Gift, Medal, PartyPopper, Share2, Snowflake,
  Target, Zap, Download, Copy, Lock,
} from "lucide-react";
import type { DailyTask, GamificationState } from "../types";
import { CardMode, CardPlatform, PLATFORM_META } from "../lib/gamification";

type NavigateTab = "journal" | "goals" | "academy" | "community";

type Props = {
  state: GamificationState;
  name: string;
  onClaimFreeze: () => void;
  onNavigate: (tab: NavigateTab) => void;
  onDownloadShareCard: (opts: { platform: CardPlatform; mode: CardMode; badgeId?: string }) => Promise<void>;
  onCopyCaption: () => Promise<unknown>;
  onCompleteTask?: (task: DailyTask) => void;
};

const rarityStyles: Record<string, string> = {
  Common: "border-white/10 bg-white/[0.03]",
  Rare: "border-cyan-500/20 bg-cyan-500/[0.06]",
  Epic: "border-violet-500/25 bg-violet-500/[0.08]",
  Legendary: "border-amber-400/35 bg-amber-400/[0.10]",
  Mythic: "border-rose-400/40 bg-rose-400/[0.10]",
};

export default function ManifestationStreakSystem({
  state, name, onClaimFreeze, onNavigate, onDownloadShareCard, onCopyCaption, onCompleteTask,
}: Props) {
  const [platform, setPlatform] = useState<CardPlatform>("instagram");
  const [cardMode, setCardMode] = useState<CardMode>("streak");
  const [selectedBadgeId, setSelectedBadgeId] = useState<string | undefined>(undefined);
  const [celebrate, setCelebrate] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [proofTask, setProofTask] = useState<DailyTask | null>(null);
  const [proofText, setProofText] = useState("");
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const selectedBadge = state.badges.find((b) => b.id === selectedBadgeId) || state.badges[0];
  const earnedBadgeCount = state.badges.filter((b) => b.earned).length;
  const calendarCells = useMemo(() => [...state.activeDays].sort().slice(-30).reverse(), [state.activeDays]);
  const caption = state.streak + "-day streak! " + state.statusTitle;
  const dates = [...state.last90].reverse();

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await onDownloadShareCard({ platform, mode: cardMode, badgeId: selectedBadge?.id });
      setCelebrate(true);
      setTimeout(() => setCelebrate(false), 2400);
    } finally { setDownloading(false); }
  };

  const handleCopy = async () => {
    await onCopyCaption();
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleTaskClick = (task: DailyTask) => {
    if (task.completed) return;
    if (task.action === "proof") { setProofTask(task); setProofText(""); setProofImage(null); return; }
    onCompleteTask?.(task);
    onNavigate(task.action as NavigateTab);
  };

  const handleProofSubmit = () => {
    if (proofTask) { onCompleteTask?.(proofTask); setCelebrate(true); setTimeout(() => setCelebrate(false), 2400); }
    setProofTask(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { const r = new FileReader(); r.onloadend = () => setProofImage(r.result as string); r.readAsDataURL(file); }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Celebration */}
      <AnimatePresence>
        {celebrate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pointer-events-none fixed inset-0 z-[120] overflow-hidden">
            {Array.from({ length: 60 }).map((_, i) => (
              <motion.span key={i} initial={{ y: -40, x: (i * 37) % 100 + "vw", rotate: 0, opacity: 1 }} animate={{ y: "110vh", rotate: 540, opacity: 0.1 }} transition={{ duration: 1.7 + (i % 10) * 0.08 }} className="absolute top-0 h-2 w-2 rounded-sm bg-gradient-to-br from-amber-200 to-yellow-600" />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Proof Modal */}
      <AnimatePresence>
        {proofTask && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 shadow-2xl relative">
              <button onClick={() => setProofTask(null)} className="absolute top-4 right-4 text-white/40 hover:text-white">X</button>
              <div className="flex items-center gap-4 mb-6">
                <div className={"w-12 h-12 rounded-2xl bg-gradient-to-br " + (proofTask.gradient || "") + " flex items-center justify-center text-2xl"}>{proofTask.icon}</div>
                <div><h3 className="text-lg font-bold text-white">{proofTask.label}</h3><p className="text-sm text-white/50">Earn {proofTask.xp} XP</p></div>
              </div>
              {(proofTask.proofType === "both" || proofTask.proofType === "photo") && (
                <div className="mb-4">
                  <label className="block text-xs text-white/40 mb-2 uppercase tracking-wider">Photo</label>
                  {proofImage ? (
                    <div className="relative rounded-2xl overflow-hidden border border-white/10">
                      <img src={proofImage} alt="Proof" className="w-full h-48 object-cover" />
                      <button onClick={() => setProofImage(null)} className="absolute top-2 right-2 bg-black/50 px-2 py-1 rounded text-xs text-white">Remove</button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:bg-white/5 hover:border-amber-500/30 transition-all">
                      <Camera className="text-white/30 mb-2" size={24} />
                      <span className="text-sm text-white/50">Upload photo</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                  )}
                </div>
              )}
              {(proofTask.proofType === "both" || proofTask.proofType === "text") && (
                <div className="mb-6">
                  <label className="block text-xs text-white/40 mb-2 uppercase tracking-wider">Notes</label>
                  <textarea value={proofText} onChange={(e) => setProofText(e.target.value)} placeholder="Describe your session..." className="w-full h-24 bg-black/50 border border-white/10 rounded-2xl p-3 text-sm text-white focus:outline-none focus:border-amber-500/50 resize-none" />
                </div>
              )}
              <button disabled={!proofImage && !proofText.trim()} onClick={handleProofSubmit} className="w-full py-4 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 text-black font-bold text-sm tracking-widest uppercase disabled:opacity-50 hover:scale-[1.02] transition-all">Submit & Claim XP</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HERO */}
      <section className="relative overflow-hidden rounded-3xl border border-amber-500/10 bg-gradient-to-br from-[#0a0a0a] via-black to-[#0a0805] p-4 sm:p-6 lg:p-8 shadow-2xl">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-amber-500/5 blur-[100px]" />
        <div className="absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-orange-600/5 blur-[120px]" />
        <div className="relative z-10 grid grid-cols-1 gap-4 lg:gap-6 lg:grid-cols-[1fr_1fr] items-stretch">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-widest text-amber-200">
                <Flame size={11} className="fill-amber-400 text-amber-400" /> {state.levelTitle.emoji} {state.levelTitle.name}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-widest text-white/50">
                Top {state.percentile}%
              </span>
            </div>
            <div>
              <h2 className="text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
                {state.streak}<span className="premium-text-gradient"> day</span>
              </h2>
              <p className="mt-2 text-sm text-white/40">{state.statusTitle}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-4">
              {[
                { label: "Consistency", value: state.consistency + "%", icon: BarChart3 },
                { label: "Freezes", value: state.streakFreezes, icon: Snowflake },
                { label: "Badges", value: earnedBadgeCount + "/" + state.badges.length, icon: Award },
                { label: "Total XP", value: state.totalXp.toLocaleString(), icon: Zap },
              ].map(function(s) { var Icon = s.icon; return (
                <div key={s.label} className="rounded-2xl border border-white/5 bg-white/[0.02] p-3 hover:border-amber-500/20 transition-colors">
                  <Icon size={16} className="text-amber-300/70" />
                  <p className="mt-2 text-xl font-black text-white">{s.value}</p>
                  <p className="text-[9px] font-mono uppercase tracking-wider text-white/30">{s.label}</p>
                </div>
              ); })}
            </div>
            <div className="rounded-2xl border border-amber-500/10 bg-gradient-to-r from-amber-500/[0.04] to-transparent p-4">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-mono uppercase tracking-widest text-amber-300/50">Next Reward</p>
                  <h4 className="mt-0.5 text-sm font-bold text-white">{state.nextMilestone.days}d - {state.nextMilestone.title}</h4>
                </div>
                <Gift size={18} className="text-amber-300/70" />
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/5">
                <motion.div initial={{ width: 0 }} animate={{ width: state.milestoneProgress + "%" }} transition={{ duration: 1 }} className="h-full rounded-full bg-gradient-to-r from-amber-300 to-amber-500" />
              </div>
              <div className="mt-2 flex items-center justify-between text-[10px] text-white/40">
                <span>{state.streak}/{state.nextMilestone.days} days</span>
                <span className="text-amber-300/60">{state.nextMilestone.reward}</span>
              </div>
            </div>
          </div>

          {/* Daily Tasks */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.015] p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-white/30">Today Actions</p>
                <h3 className="mt-0.5 text-base font-bold text-white">Daily Tasks</h3>
              </div>
              <button onClick={onClaimFreeze} className="inline-flex items-center gap-1 rounded-lg border border-sky-500/20 bg-sky-500/10 px-2.5 py-1.5 text-[9px] font-mono font-bold uppercase tracking-wider text-sky-300 transition hover:bg-sky-500/20">
                <Snowflake size={11} /> Freeze
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 max-h-[300px] overflow-y-auto scrollbar-none pr-1">
              {state.dailyTasks.map(function(action) { return (
                <button key={action.id} onClick={function() { handleTaskClick(action); }} className={"group relative overflow-hidden rounded-xl border p-2.5 text-left transition-all duration-200 hover:scale-[1.02] " + (action.completed ? "border-emerald-500/25 bg-emerald-500/[0.06]" : "border-white/5 bg-black hover:border-white/15")}>
                  <div className={"absolute -right-8 -top-8 h-20 w-20 rounded-full bg-gradient-to-br " + action.gradient + " opacity-15 blur-xl"} />
                  <div className="relative flex items-center gap-2.5">
                    <div className={"w-9 h-9 shrink-0 rounded-lg bg-gradient-to-br " + action.gradient + " flex items-center justify-center text-sm shadow-md"}>{action.icon}</div>
                    <div className="min-w-0 flex-1">
                      <h4 className={"text-xs font-bold truncate " + (action.completed ? "text-emerald-200" : "text-white")}>{action.label}</h4>
                      <p className={"text-[9px] font-mono uppercase " + (action.completed ? "text-emerald-400/60" : "text-white/30")}>+{action.xp} XP</p>
                    </div>
                    {action.completed ? <CheckCircle2 size={16} className="shrink-0 text-emerald-400" /> : <ChevronRight size={14} className="shrink-0 text-white/20 group-hover:text-white/60 transition-colors" />}
                  </div>
                </button>
              ); })}
            </div>
          </div>
        </div>
      </section>

      {/* BOTTOM SECTION */}
      <div className="grid grid-cols-1 gap-4 lg:gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2 space-y-4 lg:space-y-6">
          {/* Heatmap */}
          <div className="rounded-3xl border border-white/5 bg-black p-4 sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-white/30">Activity</p>
                <h3 className="mt-0.5 text-lg font-black text-white">90-Day Heatmap</h3>
              </div>
              <div className="flex items-center gap-2 text-[9px] font-mono">
                <div className="flex items-center gap-1.5 rounded-lg border border-white/5 bg-white/[0.02] px-2.5 py-1.5">
                  <CalendarDays size={11} className="text-amber-300/60" />
                  <span className="font-bold text-white">{calendarCells.length}</span>
                  <span className="text-white/30">Days</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg border border-white/5 bg-white/[0.02] px-2.5 py-1.5">
                  <Zap size={11} className="text-amber-300/60" />
                  <span className="font-bold text-white">{state.monthlyXp}</span>
                  <span className="text-white/30">XP</span>
                </div>
              </div>
            </div>
            <div className="w-full overflow-x-auto scrollbar-none pb-2">
              <div className="grid grid-flow-col gap-[3px] sm:gap-[4px] w-max min-w-full" style={{ gridTemplateRows: "repeat(7, 1fr)" }}>
                {dates.map(function(date) {
                  var active = state.activeDays.includes(date);
                  var intensity = state.events.filter(function(e) { return e.localDate === date; }).length;
                  var cls = !active ? "bg-white/[0.02]" : intensity > 2 ? "bg-amber-400" : intensity > 1 ? "bg-amber-500/70" : "bg-amber-600/40";
                  return <div key={date} title={date + ": " + intensity} className={"w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-[3px] transition-all hover:scale-125 " + cls} />;
                })}
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-[9px] font-mono text-white/30">
              <span>Less</span>
              <div className="w-2.5 h-2.5 rounded-sm bg-white/[0.02]" />
              <div className="w-2.5 h-2.5 rounded-sm bg-amber-600/40" />
              <div className="w-2.5 h-2.5 rounded-sm bg-amber-500/70" />
              <div className="w-2.5 h-2.5 rounded-sm bg-amber-400" />
              <span>More</span>
            </div>
          </div>

          {/* Goal Streaks */}
          <div className="rounded-3xl border border-white/5 bg-black p-4 sm:p-6">
            <div className="mb-4 flex items-center gap-2"><Target size={16} className="text-amber-300/70" /><h3 className="text-lg font-black text-white">Reality Tracks</h3></div>
            <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {state.goalStreaks.map(function(goal) { return (
                <div key={goal.name} className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-3 hover:border-white/15 transition-colors">
                  <div className={"absolute -right-6 -top-6 h-16 w-16 rounded-full bg-gradient-to-br " + goal.tint + " opacity-10 blur-lg"} />
                  <span className="text-xl">{goal.icon}</span>
                  <h4 className="mt-1.5 text-xs font-bold text-white">{goal.name}</h4>
                  <p className="mt-1 text-lg font-black text-white">{goal.streak}<span className="text-[10px] text-white/30">d</span></p>
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/5">
                    <div className={"h-full rounded-full bg-gradient-to-r " + goal.tint} style={{ width: goal.progress + "%" }} />
                  </div>
                </div>
              ); })}
            </div>
          </div>

          {/* Milestones */}
          <div className="rounded-3xl border border-white/5 bg-black p-4 sm:p-6">
            <div className="mb-4 flex items-center gap-2"><PartyPopper size={16} className="text-amber-300/70" /><h3 className="text-lg font-black text-white">Milestones</h3></div>
            <div className="grid gap-2 sm:gap-3 sm:grid-cols-2">
              {state.milestones.map(function(m) {
                var earned = state.streak >= m.days;
                return (
                  <div key={m.days} className={"rounded-2xl border p-3 " + (earned ? (rarityStyles[m.rarity] || rarityStyles.Common) : "border-white/5 bg-white/[0.015]")}>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-black/40 text-lg">{m.icon}</div>
                      <div className="min-w-0 flex-1">
                        <h4 className={"text-xs font-bold truncate " + (earned ? "text-white" : "text-white/40")}>{m.days}d - {m.title}</h4>
                        <p className="text-[10px] text-white/30 truncate">{m.reward}</p>
                      </div>
                      {earned ? <CheckCircle2 size={14} className="shrink-0 text-emerald-400" /> : <Lock size={12} className="shrink-0 text-white/20" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* RIGHT: Badges + Share */}
        <aside className="space-y-4 lg:space-y-6">
          <div className="rounded-3xl border border-white/5 bg-black p-4 sm:p-6">
            <div className="mb-4 flex items-center gap-2"><Medal size={16} className="text-amber-300/70" /><h3 className="text-base font-black text-white">Badges <span className="text-white/30 font-normal">({earnedBadgeCount})</span></h3></div>
            <div className="grid grid-cols-2 gap-2">
              {state.badges.map(function(badge) { return (
                <button key={badge.id} onClick={function() { setSelectedBadgeId(badge.id); setCardMode("badge"); }} className={"rounded-xl border p-2.5 text-left transition hover:-translate-y-0.5 " + (badge.earned ? (rarityStyles[badge.rarity] || rarityStyles.Common) : "border-white/5 bg-white/[0.015] opacity-50") + " " + (selectedBadgeId === badge.id ? "ring-1 ring-amber-400/40" : "")}>
                  <span className="text-lg">{badge.earned ? badge.icon : "🔒"}</span>
                  <p className="mt-1.5 text-[10px] font-bold text-white truncate">{badge.title}</p>
                  <p className="text-[8px] font-mono uppercase tracking-wider opacity-50">{badge.rarity}</p>
                </button>
              ); })}
            </div>
          </div>

          <div className="rounded-3xl border border-white/5 bg-black p-4 sm:p-6 space-y-3">
            <div className="flex items-center gap-2"><Share2 size={16} className="text-amber-300/70" /><h3 className="text-base font-black text-white">Share Progress</h3></div>
            <p className="text-[11px] text-white/40 leading-relaxed">{caption}</p>
            <div className="flex gap-2">
              <button onClick={handleDownload} disabled={downloading} className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-600 text-black font-bold text-[11px] uppercase tracking-wider py-2.5 hover:scale-[1.02] transition-all disabled:opacity-50">
                <Download size={13} className={downloading ? "animate-bounce" : ""} /> Card
              </button>
              <button onClick={handleCopy} className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider text-white/60 hover:text-white transition-all">
                <Copy size={13} /> {copied ? "Done" : "Copy"}
              </button>
            </div>
            <div className="flex gap-1.5">
              {Object.entries(PLATFORM_META).map(function(entry) { var id = entry[0]; var meta = entry[1]; return (
                <button key={id} onClick={function() { setPlatform(id as CardPlatform); }} className={"flex-1 rounded-lg border px-2 py-1.5 text-[9px] font-mono uppercase tracking-wider transition " + (platform === id ? "border-amber-400/30 bg-amber-400/10 text-amber-200" : "border-white/5 text-white/30 hover:text-white/60")}>
                  {meta.label}
                </button>
              ); })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

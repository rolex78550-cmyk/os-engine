import React, { useState, useEffect, useRef } from "react";
import { 
  Edit3, Plus, Sparkles, Image as ImageIcon, Flame, Calendar, 
  BarChart3, Bell, Search, Filter, Trash2, X, Download, BookOpen, 
  ChevronLeft, ChevronRight, Eye, CheckCircle2, RefreshCw, Box, LayoutGrid, Check
} from "lucide-react";
import { JournalEntry } from "../../types";
import Journal3DView from "../journal/Journal3DView";

interface JournalViewProps {
  journalEntries: JournalEntry[];
  submitRichJournal: (payload: any) => Promise<void>;
  isSubmittingJournal: boolean;
  handleDeleteJournal: (id: string) => Promise<void>;
  hasPaidAccess: boolean;
  isOnTrial: boolean;
  setShowPricingPage: (val: boolean) => void;
  profile?: any;
  setNotificationMsg?: (msg: string | null) => void;
}

type JournalTab = "scripting" | "369" | "gratitude" | "all";
type Timeframe = "week" | "month" | "all";

const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 800;
        let width = img.width;
        let height = img.height;
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/webp", 0.7));
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
};

export const JournalView: React.FC<JournalViewProps> = ({
  journalEntries,
  submitRichJournal,
  isSubmittingJournal,
  handleDeleteJournal,
  hasPaidAccess,
  isOnTrial,
  setShowPricingPage,
  profile,
  setNotificationMsg
}) => {
  // Mode: 2D Dashboard vs 3D Interactive Flip Book
  const [viewMode, setViewMode] = useState<"dashboard" | "3d">("dashboard");

  // Tab & Editor States
  const [activeTab, setActiveTab] = useState<JournalTab>("scripting");
  const [journalType, setJournalType] = useState<"scripting" | "369" | "gratitude">("scripting");
  const [scriptText, setScriptText] = useState("");
  const [entryTitle, setEntryTitle] = useState("");
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 369 Method Specific State
  const [m369Morning, setM369Morning] = useState("");
  const [m369Afternoon, setM369Afternoon] = useState("");
  const [m369Evening, setM369Evening] = useState("");
  const [m369Counts, setM369Counts] = useState<{ morning: number; afternoon: number; evening: number }>({
    morning: 0,
    afternoon: 0,
    evening: 0
  });

  // Gratitude Specific State
  const [gratitude1, setGratitude1] = useState("");
  const [gratitude2, setGratitude2] = useState("");
  const [gratitude3, setGratitude3] = useState("");

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "scripting" | "369" | "gratitude">("all");
  const [timeframe, setTimeframe] = useState<Timeframe>("week");

  // Carousel inspection index (0 = New Entry editor, >0 = viewing past entry)
  const [editorCarouselIdx, setEditorCarouselIdx] = useState<number>(0);

  // Reader Modal State
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [aiInsightLoading, setAiInsightLoading] = useState<string | null>(null);
  const [showNewEntry, setShowNewEntry] = useState(false);

  // Reminders Config (persisted locally)
  const [reminders, setReminders] = useState<{ daily: boolean; gratitude: boolean; weekly: boolean }>(() => {
    try {
      const saved = localStorage.getItem("solo_journal_reminders");
      return saved ? JSON.parse(saved) : { daily: true, gratitude: false, weekly: true };
    } catch {
      return { daily: true, gratitude: false, weekly: true };
    }
  });

  const notify = (msg: string) => {
    if (setNotificationMsg) setNotificationMsg(msg);
  };

  const toggleReminder = (key: "daily" | "gratitude" | "weekly") => {
    const updated = { ...reminders, [key]: !reminders[key] };
    setReminders(updated);
    try {
      localStorage.setItem("solo_journal_reminders", JSON.stringify(updated));
    } catch {}
    notify(`🔔 ${key.toUpperCase()} reminder ${updated[key] ? "enabled" : "disabled"}`);
  };

  // Image Upload Handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (attachedImages.length + files.length > 4) {
      notify("⚠️ Maximum 4 visual attachments allowed per entry.");
      return;
    }

    try {
      const compressed = await Promise.all(files.map(compressImage));
      setAttachedImages(prev => [...prev, ...compressed]);
      notify("📷 Visual added to journal entry!");
    } catch (err) {
      notify("Failed to compress image.");
    }
  };

  const removeAttachedImage = (idx: number) => {
    setAttachedImages(prev => prev.filter((_, i) => i !== idx));
  };

  // Tab switcher
  const handleQuickTab = (tab: string) => {
    setActiveTab(tab as JournalTab);
    if (tab === "scripting") setJournalType("scripting");
    if (tab === "369") setJournalType("369");
    if (tab === "gratitude") setJournalType("gratitude");
  };

  // Build payload based on current active tab/type
  const getPreparedContent = (): { text: string; title: string; type: "scripting" | "369" | "gratitude" } => {
    if (journalType === "369") {
      const compiledText = [
        m369Morning ? `☀️ MORNING INTENTION (3x):\n${m369Morning.trim()}` : "",
        m369Afternoon ? `⚡ AFTERNOON AMPLIFICATION (6x):\n${m369Afternoon.trim()}` : "",
        m369Evening ? `🌙 EVENING LOCK-IN (9x):\n${m369Evening.trim()}` : "",
        scriptText.trim() ? `\n📝 NOTES & REFLECTIONS:\n${scriptText.trim()}` : ""
      ].filter(Boolean).join("\n\n");

      return {
        text: compiledText || scriptText.trim(),
        title: entryTitle.trim() || "369 Method Manifestation Code",
        type: "369"
      };
    }

    if (journalType === "gratitude") {
      const compiledGratitude = [
        gratitude1 ? `✨ Present Blessing: ${gratitude1.trim()}` : "",
        gratitude2 ? `🌱 Strength in Challenge: ${gratitude2.trim()}` : "",
        gratitude3 ? `🔥 Today's Win: ${gratitude3.trim()}` : "",
        scriptText.trim() ? `\n💭 Additional Reflections:\n${scriptText.trim()}` : ""
      ].filter(Boolean).join("\n\n");

      return {
        text: compiledGratitude || scriptText.trim(),
        title: entryTitle.trim() || "Daily Gratitude Alignment",
        type: "gratitude"
      };
    }

    return {
      text: scriptText.trim(),
      title: entryTitle.trim() || "Scripted Reality Manifestation",
      type: "scripting"
    };
  };

  // Materialize / Submit Entry
  const handleMaterialize = async () => {
    const { text: contentText, title, type } = getPreparedContent();

    if (!contentText && attachedImages.length === 0) {
      notify("⚠️ Please write a script or attach a visual first.");
      return;
    }

    const payload = {
      type,
      title,
      text: contentText,
      content: contentText,
      images: attachedImages,
      createdTime: new Date().toISOString(),
      analysis: {
        coherenceScore: Math.floor(Math.random() * 15) + 85,
        primaryFrequency: type === "369" ? "Vortex 369 Hz" : type === "gratitude" ? "Gratitude 528 Hz" : "Alpha 432 Hz",
        insight: "Your neural pathways are recalibrating to match your intention. Stay rooted in present awareness."
      }
    };

    try {
      await submitRichJournal(payload);
      // Reset Editor Fields
      setScriptText("");
      setEntryTitle("");
      setAttachedImages([]);
      setM369Morning("");
      setM369Afternoon("");
      setM369Evening("");
      setM369Counts({ morning: 0, afternoon: 0, evening: 0 });
      setGratitude1("");
      setGratitude2("");
      setGratitude3("");
      setEditorCarouselIdx(0);
      notify("✨ Entry materialized into database!");
    } catch (err) {
      // error handled in useAppLogic
    }
  };

  // Filtered entries
  const filteredEntries = journalEntries
    .filter(entry => {
      const contentStr = (entry.content || entry.text || "").toLowerCase();
      const titleStr = (entry.title || "").toLowerCase();
      const matchesSearch = !searchQuery || contentStr.includes(searchQuery.toLowerCase()) || titleStr.includes(searchQuery.toLowerCase());
      const matchesFilter = filterType === "all" || entry.type === filterType || (filterType === "scripting" && (!entry.type || entry.type === "general"));
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => new Date(b.createdTime || 0).getTime() - new Date(a.createdTime || 0).getTime());

  // Fallback demo entries if user has none yet
  const displayEntries: JournalEntry[] = filteredEntries.length > 0 ? filteredEntries : [
    {
      id: "demo1",
      title: "My Abundant Reality",
      text: "I wake up energized and grateful. I work on my highest vision with sharp focus. Opportunities and wealth naturally flow toward my frequency every single day.",
      content: "I wake up energized and grateful. I work on my highest vision with sharp focus. Opportunities and wealth naturally flow toward my frequency every single day.",
      createdTime: new Date().toISOString(),
      type: "scripting",
      analysis: {
        coherenceScore: 94,
        primaryFrequency: "Alpha 432 Hz",
        coherenceAnalysis: "High alignment",
        recalibrationText: "Maintain momentum",
        insight: "Your subconscious mind accepts present-tense statements as immediate truth."
      }
    },
    {
      id: "demo2",
      title: "369 Wealth Code",
      text: "☀️ MORNING INTENTION (3x):\nI am magnetic to boundless financial abundance.\n\n⚡ AFTERNOON AMPLIFICATION (6x):\nMoney flows to me effortlessly in unexpected ways.\n\n🌙 EVENING LOCK-IN (9x):\nI am grateful for my infinite prosperity.",
      content: "I am magnetic to boundless financial abundance.",
      createdTime: new Date(Date.now() - 86400000).toISOString(),
      type: "369"
    },
    {
      id: "demo3",
      title: "Daily Gratitude Reflection",
      text: "✨ Present Blessing: I am grateful for my body, mind, and the technology to build my dreams.\n🌱 Strength in Challenge: Every obstacle is fuel for my awakening.\n🔥 Today's Win: Completed my core daily discipline streak.",
      content: "I am truly thankful for my health and relentless determination.",
      createdTime: new Date(Date.now() - 172800000).toISOString(),
      type: "gratitude"
    }
  ];

  // Dynamic Statistics Computation
  const now = new Date();
  const timeframeFiltered = displayEntries.filter(e => {
    const entryDate = new Date(e.createdTime || Date.now());
    if (timeframe === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return entryDate >= weekAgo;
    }
    if (timeframe === "month") {
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      return entryDate >= monthAgo;
    }
    return true;
  });

  const totalEntriesCount = timeframeFiltered.length;
  const totalWordsWritten = timeframeFiltered.reduce((sum, e) => {
    const t = e.content || e.text || "";
    return sum + t.split(/\s+/).filter(Boolean).length;
  }, 0);
  const avgWordsPerEntry = totalEntriesCount > 0 ? Math.round(totalWordsWritten / totalEntriesCount) : 0;

  // Streak calculation
  const calculateStreak = () => {
    if (journalEntries.length === 0) return profile?.streak || 7;
    const dates = Array.from(new Set(
      journalEntries.map(e => new Date(e.createdTime || Date.now()).toDateString())
    )).map(d => new Date(d));

    dates.sort((a, b) => b.getTime() - a.getTime());

    let count = 0;
    let curr = new Date();
    curr.setHours(0,0,0,0);

    for (const d of dates) {
      d.setHours(0,0,0,0);
      const diffDays = Math.round((curr.getTime() - d.getTime()) / (1000 * 3600 * 24));
      if (diffDays <= 1) {
        count++;
        curr = d;
      } else {
        break;
      }
    }
    return Math.max(count, 1);
  };

  const streakDays = calculateStreak();

  // Weekday active state (Mon-Sun)
  const getWeekDaysActive = () => {
    const curr = new Date();
    const firstDay = new Date(curr.setDate(curr.getDate() - curr.getDay() + 1));
    const daysActive = [false, false, false, false, false, false, false];

    displayEntries.forEach(e => {
      const d = new Date(e.createdTime || Date.now());
      const dayIndex = (d.getDay() + 6) % 7; // 0 = Mon
      daysActive[dayIndex] = true;
    });

    return daysActive;
  };

  const weekDaysActive = getWeekDaysActive();

  // Export Journal
  const exportJournalEntries = () => {
    const exportData = journalEntries.length > 0 ? journalEntries : displayEntries;
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `journal-manifest-export-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    notify("📥 Journal database exported successfully!");
  };

  // AI Reflection Generator for individual entry
  const generateAIReflection = (entry: JournalEntry) => {
    setAiInsightLoading(entry.id);
    setTimeout(() => {
      const insights = [
        "Your focus on gratitude expands your magnetic aura. Expect synchronicity within 24 hours.",
        "Your scripting is aligned with alpha brainwave states. Repetition builds physical neural pathways.",
        "The subconscious mind operates on raw emotion. Feel the reality of your words as already manifest.",
        "Vortical 369 code activated. Your intention has registered in the quantum field."
      ];
      const selected = insights[Math.floor(Math.random() * insights.length)];
      if (selectedEntry && selectedEntry.id === entry.id) {
        setSelectedEntry({
          ...selectedEntry,
          analysis: {
            coherenceScore: 96,
            primaryFrequency: "Alpha 432 Hz",
            coherenceAnalysis: "Peak Reality Coherence",
            recalibrationText: "Sustain daily discipline",
            insight: selected
          }
        });
      }
      setAiInsightLoading(null);
      notify("✨ Oracle Insight Generated!");
    }, 1200);
  };

  return (
    <div className="text-white min-h-screen">
      
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/40 text-purple-300 text-[10px] font-mono uppercase font-bold tracking-widest">
              REPROGRAMMING
            </span>
          </div>
          <p className="text-sm text-white/60 mt-1">Write. Reflect. Reprogram. Become your highest self.</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* VIEW MODE TOGGLE (2D Dashboard vs 3D Flipbook) */}
          <div className="bg-black/60 p-1 rounded-2xl border border-white/10 flex items-center gap-1">
            <button
              onClick={() => setViewMode("dashboard")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                viewMode === "dashboard" ? "bg-purple-600 text-white shadow-lg" : "text-white/60 hover:text-white"
              }`}
            >
              <LayoutGrid size={14} />
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => setViewMode("3d")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                viewMode === "3d" ? "bg-purple-600 text-white shadow-lg" : "text-white/60 hover:text-white"
              }`}
            >
              <Box size={14} />
              <span>3D Journal Book</span>
            </button>
          </div>

          {/* Export Button */}
          <button
            onClick={exportJournalEntries}
            className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white/70 hover:text-white transition"
            title="Export Journal Entries"
          >
            <Download size={16} />
          </button>

          {/* New Entry Button */}
          <button 
            onClick={() => {
              setJournalType("scripting");
              setShowNewEntry(true);
            }}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 transition-all text-white px-4 py-2 rounded-2xl text-sm font-semibold shadow-lg shadow-purple-900/30"
          >
            <Plus size={16} />
            <span>New Entry</span>
          </button>
        </div>
      </div>

      {/* RENDER 3D FLIPBOOK VIEW IF SELECTED */}
      {viewMode === "3d" ? (
        <div className="bg-zinc-950 border border-white/10 rounded-3xl p-4 md:p-8 my-4">
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs font-mono text-purple-300 uppercase tracking-widest flex items-center gap-2">
              <Sparkles size={14} />
              <span>Interactive Quantum Flip Book View</span>
            </div>
            <button
              onClick={() => setViewMode("dashboard")}
              className="text-xs text-white/60 hover:text-white underline"
            >
              ← Back to Dashboard
            </button>
          </div>
          <Journal3DView 
            entries={journalEntries.length > 0 ? journalEntries : displayEntries}
            onSubmit={async (p) => {
              await submitRichJournal({
                type: p.type,
                text: p.text,
                content: p.text,
                images: p.images,
                textColor: p.textColor,
                fontFamily: p.fontFamily,
                isBold: p.isBold,
                createdTime: new Date().toISOString()
              });
            }}
            isAnalyzing={isSubmittingJournal}
            onDelete={async (id) => {
              await handleDeleteJournal(id);
              notify("🗑️ Entry deleted");
            }}
          />
        </div>
      ) : (
        /* 2D DASHBOARD VIEW */
        <>
          {/* TOP METHOD TABS */}
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            {[
              { id: "scripting", label: "SCRIPTING", desc: "Present-tense reality rewrite", color: "bg-purple-600" },
              { id: "369", label: "369 METHOD", desc: "Nikola Tesla quantum frequency code", color: "bg-blue-600" },
              { id: "gratitude", label: "GRATITUDE", desc: "High vibration alignment", color: "bg-emerald-600" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleQuickTab(tab.id)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold tracking-wider transition-all flex items-center gap-2.5 border ${
                  journalType === tab.id 
                    ? "bg-purple-600/90 border-purple-400 text-white shadow-lg shadow-purple-900/40" 
                    : "bg-zinc-950/80 border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span>{tab.label}</span>
                {journalType === tab.id && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-ping" />}
              </button>
            ))}
          </div>

          {/* MAIN CONTENT GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* LEFT / CENTER EDITOR AREA */}
            <div className="lg:col-span-7">
              <div className="bg-zinc-950 border border-purple-500/30 rounded-3xl p-5 md:p-6 shadow-2xl relative">
                
                {/* Editor Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300">
                      <Edit3 size={18} />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-white">
                        {journalType === "scripting" && "Script Your Reality"}
                        {journalType === "369" && "369 Tesla Manifestation Engine"}
                        {journalType === "gratitude" && "Gratitude Alignment System"}
                      </h3>
                      <p className="text-[11px] text-white/50">
                        {journalType === "scripting" && "Write in present tense as if your vision is already accomplished."}
                        {journalType === "369" && "3 Morning Focus • 6 Afternoon Focus • 9 Evening Lock-in."}
                        {journalType === "gratitude" && "3 Gratitude points to instantly raise your vibration frequency."}
                      </p>
                    </div>
                  </div>

                  {/* Entry title input toggle */}
                  <input
                    type="text"
                    value={entryTitle}
                    onChange={(e) => setEntryTitle(e.target.value)}
                    placeholder="Entry Title (Optional)..."
                    className="bg-black/50 border border-white/10 rounded-xl px-3 py-1 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-purple-400 max-w-[180px] hidden sm:block"
                  />
                </div>

                {/* DYNAMIC INPUT ACCORDING TO METHOD */}
                {journalType === "369" ? (
                  <div className="space-y-3 mb-4">
                    {/* Morning 3x */}
                    <div className="p-3 bg-black/60 rounded-2xl border border-blue-500/30">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-mono text-blue-400 font-bold uppercase tracking-wider">☀️ Morning Intention (Write 3 Times)</span>
                        <div className="flex gap-1">
                          {[1, 2, 3].map(i => (
                            <button
                              key={i}
                              onClick={() => setM369Counts(c => ({ ...c, morning: i }))}
                              className={`w-5 h-5 rounded-full text-[10px] font-bold ${m369Counts.morning >= i ? "bg-blue-500 text-white" : "bg-white/10 text-white/40"}`}
                            >
                              {i}
                            </button>
                          ))}
                        </div>
                      </div>
                      <input
                        type="text"
                        value={m369Morning}
                        onChange={(e) => setM369Morning(e.target.value)}
                        placeholder="I am magnetic to $10,000 monthly income..."
                        className="w-full bg-transparent text-xs text-white placeholder:text-white/30 outline-none"
                      />
                    </div>

                    {/* Afternoon 6x */}
                    <div className="p-3 bg-black/60 rounded-2xl border border-purple-500/30">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-mono text-purple-400 font-bold uppercase tracking-wider">⚡ Afternoon Amplification (Write 6 Times)</span>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5, 6].map(i => (
                            <button
                              key={i}
                              onClick={() => setM369Counts(c => ({ ...c, afternoon: i }))}
                              className={`w-5 h-5 rounded-full text-[10px] font-bold ${m369Counts.afternoon >= i ? "bg-purple-500 text-white" : "bg-white/10 text-white/40"}`}
                            >
                              {i}
                            </button>
                          ))}
                        </div>
                      </div>
                      <input
                        type="text"
                        value={m369Afternoon}
                        onChange={(e) => setM369Afternoon(e.target.value)}
                        placeholder="Money & opportunities flow to me effortlessly..."
                        className="w-full bg-transparent text-xs text-white placeholder:text-white/30 outline-none"
                      />
                    </div>

                    {/* Evening 9x */}
                    <div className="p-3 bg-black/60 rounded-2xl border border-indigo-500/30">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-mono text-indigo-400 font-bold uppercase tracking-wider">🌙 Evening Lock-in (Write 9 Times)</span>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
                            <button
                              key={i}
                              onClick={() => setM369Counts(c => ({ ...c, evening: i }))}
                              className={`w-5 h-5 rounded-full text-[10px] font-bold ${m369Counts.evening >= i ? "bg-indigo-500 text-white" : "bg-white/10 text-white/40"}`}
                            >
                              {i}
                            </button>
                          ))}
                        </div>
                      </div>
                      <input
                        type="text"
                        value={m369Evening}
                        onChange={(e) => setM369Evening(e.target.value)}
                        placeholder="I am deeply grateful for my absolute mastery and freedom..."
                        className="w-full bg-transparent text-xs text-white placeholder:text-white/30 outline-none"
                      />
                    </div>

                    <textarea
                      value={scriptText}
                      onChange={(e) => setScriptText(e.target.value)}
                      placeholder="Additional notes or physical feelings experienced..."
                      className="w-full h-20 bg-black/70 border border-white/10 focus:border-purple-500/50 rounded-2xl p-3 text-xs resize-none placeholder:text-white/30 focus:outline-none"
                    />
                  </div>
                ) : journalType === "gratitude" ? (
                  <div className="space-y-3 mb-4">
                    <div className="p-3 bg-black/60 rounded-2xl border border-emerald-500/30">
                      <span className="text-[11px] font-mono text-emerald-400 font-bold uppercase block mb-1">✨ 1. Present Blessing</span>
                      <input
                        type="text"
                        value={gratitude1}
                        onChange={(e) => setGratitude1(e.target.value)}
                        placeholder="I am truly grateful for my current health, energy, and clarity..."
                        className="w-full bg-transparent text-xs text-white placeholder:text-white/30 outline-none"
                      />
                    </div>

                    <div className="p-3 bg-black/60 rounded-2xl border border-teal-500/30">
                      <span className="text-[11px] font-mono text-teal-400 font-bold uppercase block mb-1">🌱 2. Strength in Challenge</span>
                      <input
                        type="text"
                        value={gratitude2}
                        onChange={(e) => setGratitude2(e.target.value)}
                        placeholder="I am thankful for the resistance that built my discipline today..."
                        className="w-full bg-transparent text-xs text-white placeholder:text-white/30 outline-none"
                      />
                    </div>

                    <div className="p-3 bg-black/60 rounded-2xl border border-cyan-500/30">
                      <span className="text-[11px] font-mono text-cyan-400 font-bold uppercase block mb-1">🔥 3. Today's Victory</span>
                      <input
                        type="text"
                        value={gratitude3}
                        onChange={(e) => setGratitude3(e.target.value)}
                        placeholder="I acknowledge myself for completing my core habits..."
                        className="w-full bg-transparent text-xs text-white placeholder:text-white/30 outline-none"
                      />
                    </div>

                    <textarea
                      value={scriptText}
                      onChange={(e) => setScriptText(e.target.value)}
                      placeholder="Deep gratitude reflections..."
                      className="w-full h-20 bg-black/70 border border-white/10 focus:border-emerald-500/50 rounded-2xl p-3 text-xs resize-none placeholder:text-white/30 focus:outline-none"
                    />
                  </div>
                ) : (
                  /* Standard Scripting Textarea */
                  <div className="mb-4">
                    <textarea
                      value={scriptText}
                      onChange={(e) => setScriptText(e.target.value)}
                      placeholder="I am living my dream life in total health, peace, and financial freedom. Every single day my reality moves closer to my vision..."
                      className="w-full h-48 bg-black/70 border border-white/10 focus:border-purple-500/50 rounded-2xl p-4 text-sm resize-y leading-relaxed placeholder:text-white/30 focus:outline-none"
                    />
                  </div>
                )}

                {/* VISUAL ATTACHMENTS PREVIEW GRID */}
                {attachedImages.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {attachedImages.map((src, idx) => (
                      <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden group border border-white/20">
                        <img src={src} alt="Attached Visual" className="w-full h-full object-cover" />
                        <button
                          onClick={() => removeAttachedImage(idx)}
                          className="absolute top-0.5 right-0.5 bg-black/80 hover:bg-red-600 text-white p-0.5 rounded-md text-[10px] opacity-0 group-hover:opacity-100 transition"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* EDITOR BOTTOM CONTROLS & CAROUSEL */}
                <div className="flex items-center justify-between flex-wrap gap-3 pt-3 border-t border-white/10">
                  
                  {/* File Upload Trigger */}
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      multiple
                      className="hidden"
                    />
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 text-xs px-3.5 py-2 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 text-white/80 hover:text-white transition"
                    >
                      <ImageIcon size={14} className="text-purple-400" />
                      <span>Add Visual</span>
                      {attachedImages.length > 0 && (
                        <span className="px-1.5 py-0.2 bg-purple-600 text-white rounded-full text-[10px] font-bold">
                          {attachedImages.length}
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Word Count Indicator */}
                  <div className="text-[11px] font-mono text-white/40">
                    {scriptText.split(/\s+/).filter(Boolean).length} words
                  </div>

                  {/* Materialize / Submit Button */}
                  <button 
                    onClick={handleMaterialize}
                    disabled={isSubmittingJournal}
                    className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-60 rounded-2xl text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2 shadow-lg shadow-purple-900/40 transition-all active:scale-95"
                  >
                    {isSubmittingJournal ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Materializing...</span>
                      </>
                    ) : (
                      <>
                        <span>Materialize Entry</span>
                        <Sparkles size={14} className="text-yellow-300" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT SIDEBAR: STREAK + INSIGHTS + REMINDERS */}
            <div className="lg:col-span-5 space-y-5">
              
              {/* JOURNAL STREAK CARD */}
              <div className="bg-zinc-950 border border-white/10 rounded-3xl p-5 relative overflow-hidden shadow-xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Flame className="text-orange-400 animate-bounce" size={20} />
                    <span className="font-bold text-sm text-white">Journal Consistency Streak</span>
                  </div>
                  <span className="text-[10px] font-mono text-orange-400 font-bold px-2 py-0.5 bg-orange-500/20 rounded-full">
                    ACTIVE
                  </span>
                </div>

                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-5xl font-black tabular-nums tracking-tight text-white">{streakDays}</span>
                  <span className="text-xs font-mono text-white/60 uppercase tracking-widest">Days Continuous</span>
                </div>

                {/* WEEKDAY HIGHLIGHTS */}
                <div className="mt-4 flex justify-between items-center gap-1">
                  {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
                    <div 
                      key={i} 
                      className="flex flex-col items-center gap-1"
                    >
                      <div 
                        className={`w-7 h-7 rounded-xl flex items-center justify-center text-[10px] font-bold transition-all ${
                          weekDaysActive[i] 
                            ? "bg-gradient-to-b from-purple-500 to-indigo-600 text-white shadow-md shadow-purple-900/40 border border-purple-300/40" 
                            : "bg-white/5 border border-white/10 text-white/30"
                        }`}
                      >
                        {weekDaysActive[i] ? <Check size={12} /> : day}
                      </div>
                      <span className="text-[9px] font-mono text-white/40">{day}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-white/50 mt-3 italic">"Consistency in writing physically thickens neural pathways."</p>
              </div>

              {/* DYNAMIC INSIGHTS ANALYTICS */}
              <div className="bg-zinc-950 border border-white/10 rounded-3xl p-5 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 size={18} className="text-purple-400" />
                    <span className="font-bold text-sm">Mind Metrics & Analytics</span>
                  </div>
                  <select 
                    value={timeframe}
                    onChange={(e) => setTimeframe(e.target.value as Timeframe)}
                    className="bg-black border border-white/10 text-xs text-white/80 px-2.5 py-1 rounded-xl focus:outline-none"
                  >
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="all">All Time</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-black/60 rounded-2xl border border-white/5">
                    <div className="text-white/50 mb-0.5">Entries Written</div>
                    <div className="font-bold text-xl text-white tabular-nums">{totalEntriesCount}</div>
                    <div className="text-emerald-400 text-[10px] font-mono mt-0.5">✨ +100% Coherence</div>
                  </div>

                  <div className="p-3 bg-black/60 rounded-2xl border border-white/5">
                    <div className="text-white/50 mb-0.5">Words Written</div>
                    <div className="font-bold text-xl text-white tabular-nums">{totalWordsWritten}</div>
                    <div className="text-purple-400 text-[10px] font-mono mt-0.5">⚡ Scripted Words</div>
                  </div>

                  <div className="p-3 bg-black/60 rounded-2xl border border-white/5">
                    <div className="text-white/50 mb-0.5">Avg Words / Entry</div>
                    <div className="font-bold text-xl text-white tabular-nums">{avgWordsPerEntry}</div>
                    <div className="text-blue-400 text-[10px] font-mono mt-0.5">Focus Depth</div>
                  </div>

                  <div className="p-3 bg-black/60 rounded-2xl border border-white/5">
                    <div className="text-white/50 mb-0.5">Streak Velocity</div>
                    <div className="font-bold text-xl text-white tabular-nums">{streakDays} Days</div>
                    <div className="text-orange-400 text-[10px] font-mono mt-0.5">🔥 High Vibration</div>
                  </div>
                </div>
              </div>

              {/* REMINDERS INTERACTIVE CONFIG */}
              <div className="bg-zinc-950 border border-white/10 rounded-3xl p-5 shadow-xl">
                <div className="flex items-center gap-2 mb-3">
                  <Bell size={18} className="text-yellow-400" />
                  <span className="font-bold text-sm">Journal Audio/Push Reminders</span>
                </div>
                <div className="space-y-3 text-xs">
                  {[
                    { key: "daily" as const, label: "Daily Scripting (8:00 AM)", state: reminders.daily },
                    { key: "gratitude" as const, label: "Evening Gratitude (9:00 PM)", state: reminders.gratitude },
                    { key: "weekly" as const, label: "Weekly Manifest Reflection", state: reminders.weekly },
                  ].map((item) => (
                    <div key={item.key} className="flex justify-between items-center p-2.5 bg-black/50 rounded-2xl border border-white/5">
                      <span className="text-white/80 font-medium">{item.label}</span>
                      <button
                        onClick={() => toggleReminder(item.key)}
                        className={`w-9 h-5 rounded-full relative transition-all cursor-pointer ${
                          item.state ? "bg-purple-600" : "bg-white/20"
                        }`}
                      >
                        <div 
                          className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${
                            item.state ? "right-0.5" : "left-0.5"
                          }`} 
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* JOURNAL ENTRIES ARCHIVE LIST */}
            <div className="lg:col-span-12 mt-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 px-1">
                <div>
                  <h3 className="font-extrabold text-lg text-white">Journal Entries Archive</h3>
                  <p className="text-xs text-white/50">Stored in your personal encrypted cloud vault</p>
                </div>
                
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Category Filter Tabs */}
                  <div className="flex bg-black/60 rounded-2xl p-1 border border-white/10 text-xs">
                    {[
                      { id: "all", label: "All" },
                      { id: "scripting", label: "Scripting" },
                      { id: "369", label: "369 Method" },
                      { id: "gratitude", label: "Gratitude" }
                    ].map(t => (
                      <button 
                        key={t.id} 
                        onClick={() => setFilterType(t.id as any)}
                        className={`px-3 py-1 rounded-xl font-medium capitalize transition ${
                          filterType === t.id ? "bg-purple-600 text-white font-bold" : "text-white/60 hover:text-white"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {/* Search Bar */}
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Search entries..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-black border border-white/10 pl-8 pr-3 py-1.5 text-xs text-white rounded-2xl w-48 focus:outline-none focus:border-purple-400" 
                    />
                    <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-white/40" />
                  </div>
                </div>
              </div>

              {/* Entries Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayEntries.map((entry: JournalEntry, index: number) => {
                  const entryDate = new Date(entry.createdTime || Date.now());
                  const dateStr = entryDate.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }).toUpperCase();
                  const timeStr = entryDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

                  const type = entry.type || "scripting";
                  const typeColor = type === "scripting" ? "bg-purple-600" : type === "369" ? "bg-blue-600" : "bg-emerald-600";
                  const typeLabel = type === "scripting" ? "SCRIPTING" : type === "369" ? "369 METHOD" : "GRATITUDE";

                  const contentText = entry.text || entry.content || "";

                  return (
                    <div 
                      key={entry.id || index} 
                      onClick={() => setSelectedEntry(entry)}
                      className="bg-zinc-950 border border-white/10 hover:border-purple-500/50 rounded-3xl p-5 transition-all cursor-pointer group flex flex-col justify-between shadow-lg relative overflow-hidden"
                    >
                      <div>
                        {/* Entry Header */}
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-mono text-white/50">{dateStr}</span>
                              <span className={`${typeColor} text-[9px] font-bold px-2 py-0.5 rounded-full text-white uppercase`}>
                                {typeLabel}
                              </span>
                            </div>
                            <h4 className="font-bold text-sm text-white leading-snug group-hover:text-purple-300 transition">
                              {entry.title || (type === "scripting" ? "Scripted Reality Code" : type === "369" ? "369 Manifestation" : "Gratitude Entry")}
                            </h4>
                          </div>

                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <button 
                              onClick={async () => {
                                await handleDeleteJournal(entry.id);
                                notify("🗑️ Entry deleted");
                              }}
                              className="opacity-0 group-hover:opacity-100 text-white/40 hover:text-red-400 p-1.5 transition"
                              title="Delete entry"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        {/* Visual Image Preview */}
                        {entry.images && entry.images.length > 0 && (
                          <div className="my-2.5 flex gap-1.5 overflow-hidden rounded-xl h-16">
                            {entry.images.slice(0, 3).map((img, i) => (
                              <img key={i} src={img} alt="Visual Attachment" className="h-full w-20 object-cover rounded-lg border border-white/10" />
                            ))}
                          </div>
                        )}

                        {/* Content Preview */}
                        <p className="text-xs text-white/70 line-clamp-3 leading-relaxed mt-1 whitespace-pre-wrap">
                          {contentText}
                        </p>
                      </div>

                      {/* Card Footer */}
                      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] text-white/40 font-mono">
                        <span>{timeStr}</span>
                        <span className="flex items-center gap-1 text-purple-400 font-bold group-hover:translate-x-0.5 transition-transform">
                          <span>Read Full</span>
                          <ChevronRight size={12} />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {displayEntries.length === 0 && (
                <div className="text-center py-12 bg-zinc-950 border border-white/10 rounded-3xl text-white/50">
                  <BookOpen size={28} className="mx-auto mb-2 text-white/30" />
                  <p className="text-sm font-semibold">No journal entries found matching your search.</p>
                  <p className="text-xs text-white/40 mt-1">Start a new entry above to script your reality.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* FULL ENTRY INSPECT / READER MODAL */}
      {selectedEntry && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4"
          onClick={() => setSelectedEntry(null)}
        >
          <div 
            className="bg-zinc-950 border border-purple-500/40 w-full max-w-2xl max-h-[85vh] rounded-3xl p-6 overflow-y-auto shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-start mb-4 pb-3 border-b border-white/10">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-purple-300">
                    {new Date(selectedEntry.createdTime || Date.now()).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "short", day: "numeric" })}
                  </span>
                  <span className="px-2 py-0.5 bg-purple-600 text-[10px] font-bold text-white rounded-full uppercase">
                    {selectedEntry.type || "scripting"}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white">
                  {selectedEntry.title || "Journal Entry"}
                </h3>
              </div>

              <button 
                onClick={() => setSelectedEntry(null)}
                className="p-1.5 text-white/50 hover:text-white bg-white/5 rounded-xl"
              >
                <X size={18} />
              </button>
            </div>

            {/* Images Gallery */}
            {selectedEntry.images && selectedEntry.images.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mb-4">
                {selectedEntry.images.map((img, i) => (
                  <img key={i} src={img} alt="Journal Visual" className="w-full h-40 object-cover rounded-2xl border border-white/10" />
                ))}
              </div>
            )}

            {/* Content Text */}
            <div className="text-sm text-white/90 leading-relaxed whitespace-pre-wrap font-sans bg-black/50 p-4 rounded-2xl border border-white/5 mb-4">
              {selectedEntry.text || selectedEntry.content}
            </div>

            {/* Oracle Insight Section */}
            {selectedEntry.analysis?.insight ? (
              <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/30 mb-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <Sparkles size={16} className="text-yellow-400" />
                  <span className="text-xs font-mono text-purple-300 font-bold uppercase tracking-wider">Oracle Reality Insight</span>
                </div>
                <p className="text-xs text-purple-100 leading-relaxed">
                  {selectedEntry.analysis.insight}
                </p>
              </div>
            ) : (
              <button
                onClick={() => generateAIReflection(selectedEntry)}
                disabled={aiInsightLoading === selectedEntry.id}
                className="w-full py-2.5 mb-4 bg-purple-600/30 hover:bg-purple-600/50 border border-purple-400/40 rounded-2xl text-xs font-bold text-purple-200 flex items-center justify-center gap-2 transition"
              >
                {aiInsightLoading === selectedEntry.id ? (
                  <RefreshCw size={14} className="animate-spin text-purple-300" />
                ) : (
                  <Sparkles size={14} className="text-yellow-400" />
                )}
                <span>Generate AI Quantum Insight for this Entry</span>
              </button>
            )}

            {/* Modal Actions */}
            <div className="flex justify-between items-center pt-3 border-t border-white/10">
              <button
                onClick={async () => {
                  await handleDeleteJournal(selectedEntry.id);
                  setSelectedEntry(null);
                  notify("🗑️ Entry deleted");
                }}
                className="px-3.5 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
              >
                <Trash2 size={14} /> Delete Entry
              </button>

              <button
                onClick={() => setSelectedEntry(null)}
                className="px-5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK NEW ENTRY MODAL */}
      {showNewEntry && (
        <div 
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-[200] flex items-center justify-center p-4"
          onClick={() => setShowNewEntry(false)}
        >
          <div 
            className="bg-zinc-950 border border-purple-500/40 w-full max-w-xl rounded-3xl p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-white">Create Quick Journal Entry</h3>
              <button onClick={() => setShowNewEntry(false)} className="text-white/50 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <textarea 
              value={scriptText}
              onChange={(e) => setScriptText(e.target.value)}
              placeholder="Script your present reality..."
              className="w-full h-36 bg-black border border-white/10 rounded-2xl p-4 text-xs text-white focus:outline-none focus:border-purple-500/50 resize-none mb-4"
            />

            <div className="flex gap-2 mb-4">
              {[
                { id: "scripting", label: "Scripting" },
                { id: "369", label: "369 Method" },
                { id: "gratitude", label: "Gratitude" }
              ].map(t => (
                <button 
                  key={t.id}
                  onClick={() => setJournalType(t.id as any)}
                  className={`flex-1 py-2 text-xs rounded-xl font-bold uppercase transition ${
                    journalType === t.id ? "bg-purple-600 text-white" : "bg-white/5 text-white/60 hover:text-white"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <button 
              onClick={() => {
                handleMaterialize();
                setShowNewEntry(false);
              }}
              disabled={!scriptText.trim()}
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 rounded-2xl text-xs font-bold text-white shadow-lg disabled:opacity-50"
            >
              Materialize Entry
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default JournalView;

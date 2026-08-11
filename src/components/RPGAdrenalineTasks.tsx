import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { resolveImageUrl, onImgError } from "../lib/imageHelper";
import { 
  Shield, Dumbbell, Target, Camera, Check, Flame, Zap, Loader2, X, AlertTriangle, Award 
} from "lucide-react";
import { useRPG } from "../hooks/useRPG";
import { useFirebase } from "./FirebaseProvider";
import { useAppLogic } from "../hooks/useAppLogic";

// 🔥 FREE FIRE + SOLO LEVELING ANIME / CYBERPUNK STYLE
// Dark black base, intense neon (cyan #22d3ee, purple #a855f7, red #ef4444, orange #f97316)
// Dramatic HUD typography, strong borders, glows, high-contrast game UI

interface AdrenalineTask {
  id: string;
  title: string;
  description: string;
  xp: number;
  coins: number;
  rankBoost: number;
  difficulty: "HARD" | "EXTREME";
  proofType: "photo" | "both";
  timeRequired: string;
  futureValue: string;
  icon: React.ReactNode;
  color: string;
}

const ADRENALINE_TASKS: AdrenalineTask[] = [
  {
    id: "self_defence",
    title: "SELF DEFENCE",
    description: "Learn boxing, karate or martial arts. Show actual training.",
    xp: 85, coins: 55, rankBoost: 8,
    difficulty: "HARD", proofType: "both", timeRequired: "60-90 MIN",
    futureValue: "Real protection skill + unbreakable confidence",
    icon: <Shield className="w-6 h-6" />, color: "#ef4444"
  },
  {
    id: "boxing_karate",
    title: "COMBAT TRAINING",
    description: "Boxing / Karate / Muay Thai intense session",
    xp: 70, coins: 45, rankBoost: 6,
    difficulty: "HARD", proofType: "both", timeRequired: "45+ MIN",
    futureValue: "Discipline + real fighting power",
    icon: <Target className="w-6 h-6" />, color: "#f97316"
  },
  {
    id: "gym_workout",
    title: "GYM CRUSH",
    description: "Heavy weight training with progressive overload",
    xp: 55, coins: 35, rankBoost: 4,
    difficulty: "HARD", proofType: "both", timeRequired: "60+ MIN",
    futureValue: "Physical dominance = mental dominance",
    icon: <Dumbbell className="w-6 h-6" />, color: "#22c55e"
  },
  {
    id: "skill_learning",
    title: "MONEY SKILL",
    description: "Learn a high-income skill (editing, coding, sales, trading)",
    xp: 95, coins: 65, rankBoost: 10,
    difficulty: "EXTREME", proofType: "both", timeRequired: "90+ MIN",
    futureValue: "Direct future income skill",
    icon: <Flame className="w-6 h-6" />, color: "#a855f7"
  },
  {
    id: "goal_2hours",
    title: "DEEP GOAL WORK",
    description: "2 hours focused work ONLY on your main goal",
    xp: 65, coins: 40, rankBoost: 5,
    difficulty: "HARD", proofType: "both", timeRequired: "2 HOURS",
    futureValue: "Direct progress on your actual dreams",
    icon: <Target className="w-6 h-6" />, color: "#3b82f6"
  },
  {
    id: "money_action",
    title: "MONEY ACTION",
    description: "Real money-making action (outreach, selling, content creation)",
    xp: 110, coins: 75, rankBoost: 12,
    difficulty: "EXTREME", proofType: "both", timeRequired: "60+ MIN",
    futureValue: "This builds real wealth",
    icon: <Zap className="w-6 h-6" />, color: "#eab308"
  }
];

// Strict task-specific verification rules for Gemini (injected into proofText)
const getStrictVerificationRules = (task: AdrenalineTask): string => {
  const base = `STRICT AI VERIFICATION PROTOCOL — MANDATORY IMAGE + TEXT ANALYSIS:
- You are a ruthless real-world proof auditor. Be EXTREMELY STRICT.
- The uploaded PHOTO MUST CLEARLY SHOW the user ACTIVELY PERFORMING the exact task.
- Cross-reference every detail in the PHOTO against the user's NOTE and the task definition.
- REJECT (verified=false) immediately if:
  • Image is unrelated (selfie, food, random room, memes, screenshots without task, animals, etc.)
  • No visible user performing the specific action
  • No clear evidence of the described activity (e.g. no gloves/punching for combat, no weights for gym, no laptop/coding for skill learning)
- Only return verified=true if you are 95%+ confident the photo shows genuine real-life execution of THIS task.
`;

  switch (task.id) {
    case "self_defence":
    case "boxing_karate":
      return base + `- SPECIFIC FOR "${task.title}": Photo must show user in martial arts training — punching bag, boxing gloves, kicking pads, karate stance, sparring, blocking, throwing punches/kicks in a gym/dojo/training space. User must be visibly training combat skills.`;
    case "gym_workout":
      return base + `- SPECIFIC FOR "${task.title}": Photo must show intense gym session — lifting heavy dumbbells/barbells, bench press, squats, treadmill running, sweat, gym equipment, progressive overload in action. User actively weight training or cardio.`;
    case "skill_learning":
      return base + `- SPECIFIC FOR "${task.title}": Photo must show high-value skill acquisition — laptop with code, Figma, Premiere Pro, trading platform/charts, sales script notes, video editing timeline, practicing a monetizable skill. Focused deliberate practice.`;
    case "goal_2hours":
      return base + `- SPECIFIC FOR "${task.title}": Photo must prove deep 2-hour focused work — computer screen with goal documents, writing in notebook, spreadsheets, planning boards, coding for goal, no distractions visible. Evidence of sustained concentration.`;
    case "money_action":
      return base + `- SPECIFIC FOR "${task.title}": Photo must show real revenue-generating action — cold outreach DMs/emails, sales calls, content filming (camera setup), posting sales content, selling products, client meetings, affiliate links, money transfer proof.`;
    default:
      return base + `- SPECIFIC FOR "${task.title}": Image must visibly prove the user completed the described real-life action with clear evidence.`;
  }
};

export default function RPGAdrenalineTasks() {
  const { user } = useFirebase();
  const logic = useAppLogic();
  const { recordXPGain, refresh } = useRPG(logic.profile, {});

  const [selectedTask, setSelectedTask] = useState<AdrenalineTask | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [completed, setCompleted] = useState<string[]>(() => {
    try {
      const key = getTodayKey();
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [reward, setReward] = useState<any>(null);
  const [verificationResult, setVerificationResult] = useState<any>(null);

  // Persist completed tasks for TODAY only (across refreshes)
  function getTodayKey() {
    const d = new Date();
    return `rpg_adrenaline_completed_${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }

  useEffect(() => {
    try {
      const key = getTodayKey();
      localStorage.setItem(key, JSON.stringify(completed));
    } catch (e) {}
  }, [completed]);

  const resetModal = () => {
    setSelectedTask(null);
    setPhoto(null);
    setNote("");
    setVerificationResult(null);
    setIsVerifying(false);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhoto(reader.result as string);
      setVerificationResult(null); // allow fresh verification
    };
    reader.readAsDataURL(file);
  };

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNote(e.target.value);
    setVerificationResult(null); // allow fresh verification
  };

  // Real Gemini AI Verification — STRICT image + text analysis
  const verifyWithAI = async () => {
    if (!selectedTask) return;

    if (!photo || !note.trim()) {
      alert("PHOTO PROOF + DETAILED NOTE REQUIRED.\n\nUpload a real photo of you doing the task + describe exactly what you did.");
      return;
    }

    setIsVerifying(true);
    setVerificationResult(null);

    const strictRules = getStrictVerificationRules(selectedTask);
    const strictProofText = `${note.trim()}\n\n${strictRules}\n\nUser note: "${note.trim()}"\nTask ID: ${selectedTask.id}`;

    try {
      const res = await fetch("/api/manifestation/quest-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questTitle: selectedTask.title,
          questCategory: selectedTask.id,
          proofText: strictProofText,
          imageBase64: photo,
        }),
      });

      const raw = await res.json();

      // Normalize response (server may return "feedback" or "verificationFeedback")
      const verified = raw.verified === true || raw.verified === "true";
      const feedback = raw.verificationFeedback || raw.feedback || raw.verificationScore || 
        (verified ? "Proof accepted by the Oracle." : "The proof does not match the task.");

      const normalized = {
        ...raw,
        verified,
        verificationFeedback: feedback,
      };

      setVerificationResult(normalized);

      if (verified) {
        // SUCCESS — ONLY award on real AI verification
        const totalXP = selectedTask.xp;

        const currentLevel = logic.profile?.level || 1;
        const currentTotalXp = logic.profile?.totalXp || 0;
        const newLevel = Math.max(currentLevel, Math.floor((currentTotalXp + totalXP) / 100) + 1);
        const leveledUp = newLevel > currentLevel;

        await recordXPGain(totalXP, newLevel, leveledUp);

        const newCompleted = [...completed, selectedTask.id];
        setCompleted(newCompleted);

        setReward({
          title: selectedTask.title,
          xp: selectedTask.xp,
          coins: selectedTask.coins,
          rank: selectedTask.rankBoost,
          feedback: feedback,
        });

        // Dramatic anime success close
        setTimeout(() => {
          setReward(null);
          resetModal();
          refresh();
        }, 3100);
      } else {
        // AI REJECTED — show in-modal feedback, do NOT award
        setIsVerifying(false);
      }
    } catch (err) {
      console.error("Verification error:", err);
      const errorResult = {
        verified: false,
        verificationFeedback: "SYSTEM ERROR: AI verification failed to connect. Check connection and try again with a clearer photo.",
      };
      setVerificationResult(errorResult);
      setIsVerifying(false);
    }
  };

  const handleRetry = () => {
    setVerificationResult(null);
    setPhoto(null);
    setNote("");
  };

  return (
    <div className="space-y-5">
      {ADRENALINE_TASKS.map((task) => {
        const isDone = completed.includes(task.id);
        return (
          <div
            key={task.id}
            onClick={() => !isDone && setSelectedTask(task)}
            className={`group relative overflow-hidden rounded-3xl border-2 p-5 transition-all active:scale-[0.985] cursor-pointer ${
              isDone 
                ? "border-emerald-500/70 bg-emerald-500/5 shadow-[0_0_30px_rgba(16,185,129,0.25)]" 
                : "border-white/10 bg-[#0a0a0f] hover:border-[#22d3ee] hover:shadow-[0_0_35px_rgba(34,211,238,0.25)]"
            }`}
          >
            {/* Neon accent bar (Free Fire HUD style) */}
            <div 
              className="absolute left-0 top-0 bottom-0 w-1.5" 
              style={{ backgroundColor: isDone ? "#10b981" : task.color }}
            />

            <div className="flex items-start gap-4 pl-2">
              {/* Small Anime Character Icon per Quest */}
              <div className="relative flex-shrink-0">
                <div 
                  className="w-11 h-11 rounded-xl overflow-hidden border-2 shadow-md"
                  style={{ borderColor: task.color + '70' }}
                >
                  <img
                    src={resolveImageUrl(
                      task.id.includes('defence') || task.id.includes('boxing') ? "/images/anime/avatar-warrior.png" :
                      task.id.includes('gym') ? "/images/anime/avatar-elite.png" :
                      task.id.includes('money') || task.id.includes('skill') ? "/images/anime/avatar-king.png" :
                      "/images/anime/avatar-seeker.png"
                    )}
                    alt="Quest Hunter"
                    onError={onImgError()}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 text-[8px] px-1 bg-black/90 rounded font-bold" style={{color: task.color}}>
                  {task.difficulty === "EXTREME" ? "S" : "A"}
                </div>
              </div>

              <div 
                className="text-4xl mt-1 flex-shrink-0 drop-shadow-[0_0_12px_currentColor]" 
                style={{ color: task.color }}
              >
                {task.icon}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="font-black text-2xl tracking-[-1.5px] text-white group-hover:text-[#22d3ee] transition-colors">
                    {task.title}
                  </div>
                  <div 
                    className={`text-[10px] px-3 py-0.5 rounded-full border font-black tracking-[1px] ${task.difficulty === "EXTREME" 
                      ? "border-red-500 text-red-400 bg-red-500/10" 
                      : "border-orange-500 text-orange-400 bg-orange-500/10"}`}
                  >
                    {task.difficulty}
                  </div>
                </div>
                
                <div className="text-sm text-white/75 leading-snug">{task.description}</div>

                <div className="flex flex-wrap gap-2 mt-4">
                  <div className="bg-black/80 text-[#22d3ee] px-3 py-1 rounded-xl text-xs font-bold border border-[#22d3ee]/30 flex items-center gap-1">
                    <Zap size={12} /> +{task.xp} XP
                  </div>
                  <div className="bg-black/80 text-yellow-400 px-3 py-1 rounded-xl text-xs font-bold border border-yellow-400/30">
                    +{task.coins} COINS
                  </div>
                  <div className="bg-black/80 text-violet-400 px-3 py-1 rounded-xl text-xs font-bold border border-violet-400/30">
                    +{task.rankBoost} RANK
                  </div>
                  <div className="ml-auto text-[10px] text-white/40 font-mono tracking-widest self-center">
                    {task.timeRequired}
                  </div>
                </div>
              </div>
            </div>

            {isDone && (
              <div className="mt-4 pl-2 flex items-center gap-2 text-emerald-400 text-sm font-black tracking-[1px]">
                <Check size={18} className="text-emerald-400" /> 
                <span>AI VERIFIED • PROOF ACCEPTED</span>
              </div>
            )}
          </div>
        );
      })}

      {/* === ANIME / FREE FIRE PROOF MODAL === */}
      <AnimatePresence>
        {selectedTask && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[300] flex items-end sm:items-center justify-center">
            <motion.div 
              initial={{ y: 120, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              transition={{ type: "spring", bounce: 0.1 }}
              className="w-full sm:max-w-[440px] bg-[#08080c] border-t-2 border-[#22d3ee]/30 sm:border-2 sm:rounded-3xl rounded-t-3xl p-6 shadow-[0_0_80px_rgba(0,0,0,0.9)]"
            >
              {/* Modal HUD Header */}
              <div className="flex justify-between items-start mb-5">
                <div>
                  <div 
                    className="font-black text-[28px] leading-none tracking-[-2.5px]" 
                    style={{ color: selectedTask.color }}
                  >
                    {selectedTask.title}
                  </div>
                  <div className="text-xs font-mono tracking-[3px] text-white/40 mt-1">{selectedTask.timeRequired} • PROOF MANDATORY</div>
                </div>
                <button 
                  onClick={resetModal} 
                  className="text-white/50 hover:text-white p-1 -mr-1 active:scale-95"
                >
                  <X size={22} />
                </button>
              </div>

              <p className="text-sm text-white/75 mb-4 leading-relaxed">{selectedTask.description}</p>

              {/* WHY IT MATTERS - dramatic */}
              <div className="mb-5 rounded-2xl border border-white/10 bg-black/60 p-4 text-xs">
                <div className="uppercase tracking-[2px] text-[10px] text-orange-400 font-bold mb-1">WHY THIS MATTERS</div>
                <div className="text-white/80">{selectedTask.futureValue}</div>
              </div>

              {/* PROOF UPLOAD — HUD style */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2 px-1">
                  <div className="text-xs tracking-[2px] text-white/50 font-bold">UPLOAD REAL PROOF PHOTO</div>
                  <div className="text-[10px] text-red-400 font-bold">REQUIRED</div>
                </div>

                {photo ? (
                  <div className="relative rounded-2xl overflow-hidden border-[3px] border-[#22d3ee] shadow-[0_0_30px_rgba(34,211,238,0.4)]">
                    <img src={photo} className="w-full h-52 object-cover" alt="Proof" />
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#22d3ee] to-transparent" />
                    <button 
                      onClick={() => { setPhoto(null); setVerificationResult(null); }} 
                      className="absolute top-3 right-3 bg-black/90 text-xs px-4 py-1 rounded-full border border-white/30 font-bold active:bg-red-950"
                    >
                      CHANGE PHOTO
                    </button>
                    <div className="absolute bottom-3 left-3 bg-black/80 px-2.5 py-0.5 text-[10px] rounded font-mono tracking-widest border border-[#22d3ee]/50">PHOTO LOCKED</div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-52 border-[3px] border-dashed border-white/20 hover:border-[#22d3ee]/60 rounded-3xl cursor-pointer active:bg-white/5 transition bg-[#0a0a0f]">
                    <div className="text-center">
                      <Camera className="text-[#22d3ee]/60 mx-auto mb-3" size={42} />
                      <div className="text-white font-bold text-base tracking-[-0.5px]">UPLOAD PROOF PHOTO</div>
                      <div className="text-white/50 text-xs mt-1">AI will analyze the image content</div>
                      <div className="text-[10px] text-red-400/70 mt-2 font-mono">IMAGE OF YOU DOING THE TASK</div>
                    </div>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handlePhotoUpload} 
                    />
                  </label>
                )}
              </div>

              {/* NOTE INPUT — dramatic */}
              <div className="mb-5">
                <div className="text-xs tracking-[1.5px] text-white/50 mb-1.5 pl-1 font-bold">DETAILED ACTION NOTE</div>
                <textarea
                  value={note}
                  onChange={handleNoteChange}
                  placeholder="Describe exactly what you did (time, reps, what you practiced, results...)"
                  className="w-full bg-black border-2 border-white/20 focus:border-[#22d3ee] rounded-2xl p-4 text-sm h-24 resize-none placeholder:text-white/30 focus:outline-none"
                />
              </div>

              {/* VERIFICATION STATUS PANEL (Anime HUD) */}
              {verificationResult && (
                <div className={`mb-5 rounded-2xl border-2 p-4 text-sm ${verificationResult.verified 
                  ? "border-emerald-500 bg-emerald-950/40 text-emerald-300" 
                  : "border-red-500 bg-red-950/40 text-red-300"}`}>
                  <div className="flex items-center gap-2 font-black tracking-wider text-xs mb-1.5">
                    {verificationResult.verified ? (
                      <><Award className="text-emerald-400" size={16} /> AI VERIFIED — REAL PROOF CONFIRMED</>
                    ) : (
                      <><AlertTriangle className="text-red-400" size={16} /> AI REJECTED — PROOF INVALID</>
                    )}
                  </div>
                  <div className="text-[13px] leading-snug font-medium">
                    {verificationResult.verificationFeedback}
                  </div>
                  {!verificationResult.verified && (
                    <div className="mt-3 text-xs text-red-400/70">Upload a clearer photo that actually shows you doing the task.</div>
                  )}
                </div>
              )}

              {/* ACTION BUTTONS — Free Fire dramatic */}
              {!verificationResult || verificationResult.verified ? (
                <button
                  onClick={verifyWithAI}
                  disabled={isVerifying || !photo || !note.trim()}
                  className={`w-full py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all active:scale-[0.985] disabled:opacity-70 disabled:cursor-not-allowed border-2
                    ${isVerifying 
                      ? "bg-[#22d3ee] text-black border-[#22d3ee]" 
                      : "bg-white text-black border-white hover:bg-[#22d3ee] hover:text-black hover:border-[#22d3ee]"}`}
                >
                  {isVerifying ? (
                    <> 
                      <Loader2 className="animate-spin" size={22} /> 
                      AI SCANNING IMAGE + TEXT... 
                    </>
                  ) : (
                    "SUBMIT FOR STRICT AI VERIFICATION"
                  )}
                </button>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={handleRetry}
                    className="flex-1 py-4 rounded-2xl font-black text-base bg-red-600 hover:bg-red-700 text-white border-2 border-red-500 active:scale-[0.985] flex items-center justify-center gap-2"
                  >
                    RETRY WITH BETTER PROOF
                  </button>
                  <button
                    onClick={resetModal}
                    className="flex-1 py-4 rounded-2xl font-bold text-base border-2 border-white/20 text-white/70 hover:bg-white/5 active:scale-[0.985]"
                  >
                    CANCEL
                  </button>
                </div>
              )}

              <div className="text-center text-[10px] text-white/30 mt-4 font-mono tracking-[1.5px]">
                GEMINI AI • IMAGE CONTENT ANALYSIS • NO FAKE PROOF
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Epic Reward Toast — Anime style */}
      <AnimatePresence>
        {reward && (
          <motion.div 
            initial={{ opacity: 0, y: 60, scale: 0.9 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: 30 }}
            className="fixed bottom-9 left-1/2 -translate-x-1/2 z-[400] bg-[#0a0a0f] border-2 border-[#22d3ee] px-9 py-6 rounded-3xl text-center shadow-[0_0_60px_rgba(34,211,238,0.5)] min-w-[300px]"
          >
            <div className="uppercase tracking-[4px] text-emerald-400 text-xs font-bold mb-1">AI ORACLE APPROVED</div>
            <div className="font-black text-2xl tracking-[-1px] text-white mb-1">{reward.title}</div>
            <div className="flex gap-5 justify-center text-sm font-bold mt-3">
              <div className="text-[#22d3ee]">+{reward.xp} XP</div>
              <div className="text-yellow-400">+{reward.coins} COINS</div>
              <div className="text-violet-400">+{reward.rank} RANK</div>
            </div>
            <div className="text-[11px] text-white/50 mt-2 max-w-[240px] mx-auto leading-tight">{reward.feedback}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

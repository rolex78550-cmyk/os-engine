import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Target, Zap, BookOpen, Edit3, Flame, CheckCircle, ArrowRight,
  Plus, X, ChevronLeft, ChevronRight, Star,
  Trophy, Sparkles, Calendar, Edit2, Trash2, Award, Info, Gift, User, Check,
  CreditCard, Crown
} from "lucide-react";
import { useAppLogic } from "../../hooks/useAppLogic";
import { useRPG } from "../../hooks/useRPG";
import { subscribeGlobalLeaderboard } from "../../lib/rpgFirestore";
import { db } from "../../lib/firebase";
import { useFirebase } from "../FirebaseProvider";
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import { resolveImageUrl, onImgError } from "../../lib/imageHelper";
import { WorkoutTracker } from "./WorkoutTracker";
import { detectWorkoutType, type RepState } from "../../lib/workoutSensor";
import {
  DEFAULT_QUESTS, BOSS_QUESTS, CHARACTER_TIERS,
  CATEGORY_ICON, CATEGORY_LABEL, RANK_COLOR, RANK_LABEL,
  getCurrentTier, getNextTier, xpForNextLevel,
  type QuestDef, type QuestRank, type QuestCategory, type QuestQuestType,
} from "../../lib/questSystem";

// Helper: convert a set of DEFAULT_QUESTS to Mission[] with proper
// sensor-tracker targets, deduplicated against an existing user list.
function DEFAULT_QUITS_TO_MISSION(
  defaults: QuestDef[],
  existing: Mission[],
  targets: Record<string, { target: number; unit: string }>,
): Mission[] {
  const seen = new Set(existing.map((m) => m.id));
  return defaults
    .filter((d) => !seen.has(d.id))
    .map((d) => {
      const legacyCat: Mission["category"] =
        d.category === "body" ? "fitness" :
        d.category === "knowledge" ? "learning" :
        d.category === "mind" ? "mindset" :
        "lifestyle";
      const t = targets[d.id];
      return {
        id: d.id,
        title: d.title,
        desc: d.description,
        description: d.description,
        progress: `0/${t?.target ?? 1} ${t?.unit ?? "times"}`.trim(),
        currentVal: 0,
        targetVal: t?.target ?? 1,
        unit: t?.unit ?? "times",
        xp: d.xp,
        icon: CATEGORY_ICON[d.category],
        color: "#a855f7",
        completed: false,
        category: legacyCat,
        questType: d.questType,
        rank: d.rank,
        bossImage: d.bossImage,
      } as Mission;
    });
}

interface Mission {
  id: string;
  title: string;
  desc: string;
  progress: string;
  currentVal?: number;
  targetVal?: number;
  unit?: string;
  xp: number;
  icon: string;
  color: string;
  completed: boolean;
  /** Proof requirements — AI picks based on mission description */
  proofRequired?: ProofType;
  /** Mission category for AI-driven proof selection (legacy values + new) */
  category?:
    | "fitness" | "learning" | "mindset" | "wealth" | "lifestyle"
    | "social" | "creative" | "general"
    | "mind" | "body" | "career" | "goals" | "knowledge"
    | "life" | "discipline" | "manifestation";
  /** Recorded proof data (after user submits) */
  proofData?: MissionProof;
  /** When the proof was last verified */
  verifiedAt?: string;
  /** Quest type for the RPG board (main / side / discipline / boss) */
  questType?: "main" | "side" | "discipline" | "boss";
  /** Difficulty rank (E / D / C / B / A) */
  rank?: "E" | "D" | "C" | "B" | "A";
  /** Boss quest artwork (only set for boss quests) */
  bossImage?: string;
  /** Long-form description for the quest board */
  description?: string;
}

type ProofType = "selfie" | "video_oath" | "text_oath" | "both";

interface MissionProof {
  selfieBase64?: string;
  selfieUrl?: string;
  videoUrl?: string;
  videoStoragePath?: string;
  textOath?: string;
  proofTypeUsed: ProofType;
  verified: boolean;
  verificationScore: number;
  verificationFeedback: string;
  submittedAt: string;
}

interface StreakCard {
  id: string;
  cat: string;
  title: string;
  pct: number;
  next: string;
  date: string;
  xp: number;
  color: string;
  icon: string;
  bg: string;
  notes?: string[];
}

export const SoloDominion: React.FC<any> = (props) => {
  const hookLogic = useAppLogic();
  const logic = props?.profile ? props : hookLogic;
  const { profile, currentRank = "Recruit" } = logic;
  const { recordXPGain } = useRPG(profile, {});
  const { user } = useFirebase();

  // --- AUDIO & MUSIC ENGINE ---
  const [isMusicPlaying, setIsMusicPlaying] = useState<boolean>(true);
  const [isAudioBlocked, setIsAudioBlocked] = useState<boolean>(false);
  const [currentTrack, setCurrentTrack] = useState<string>("/music/epic-adventure.mp3");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize and handle background music playback
  useEffect(() => {
    const bgAudio = new Audio(currentTrack);
    bgAudio.loop = true;
    bgAudio.volume = 0.35;
    audioRef.current = bgAudio;

    const startMusic = async () => {
      try {
        await bgAudio.play();
        setIsAudioBlocked(false);
        setIsMusicPlaying(true);
      } catch (err) {
        console.log("[SoloDominion] Autoplay pending user gesture...");
        setIsAudioBlocked(true);
      }
    };

    if (isMusicPlaying) {
      startMusic();
    }

    const unlockAudioOnGesture = () => {
      if (audioRef.current && isMusicPlaying) {
        audioRef.current.play().then(() => {
          setIsAudioBlocked(false);
        }).catch(() => {});
      }
    };

    window.addEventListener("click", unlockAudioOnGesture, { passive: true });
    window.addEventListener("touchstart", unlockAudioOnGesture, { passive: true });
    window.addEventListener("keydown", unlockAudioOnGesture, { passive: true });

    return () => {
      window.removeEventListener("click", unlockAudioOnGesture);
      window.removeEventListener("touchstart", unlockAudioOnGesture);
      window.removeEventListener("keydown", unlockAudioOnGesture);
      bgAudio.pause();
      bgAudio.currentTime = 0;
    };
  }, [currentTrack]);

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (isMusicPlaying) {
      audioRef.current.pause();
      setIsMusicPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsAudioBlocked(false);
        setIsMusicPlaying(true);
      }).catch(() => {
        setIsAudioBlocked(true);
      });
    }
  };

  const handleUserInteraction = () => {
    if (audioRef.current && isMusicPlaying) {
      audioRef.current.play().then(() => {
        setIsAudioBlocked(false);
      }).catch(() => {});
    }
  };

  // --- WEB AUDIO SYNTH FOR INSTANT GAMING SFX ---
  const playSFX = (type: "mission" | "levelup" | "streak" | "click" | "claim") => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === "mission") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.15); // G5
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === "levelup" || type === "claim") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.2);
        osc.frequency.exponentialRampToValueAtTime(1760, now + 0.4);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
      } else if (type === "streak") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(950, now + 0.15);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === "click") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(800, now);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      }
    } catch (e) {
      console.warn("Audio Context error:", e);
    }
  };

  // --- STATE MANAGEMENT ---
  const [missions, setMissions] = useState<Mission[]>([]);
  const [streaks, setStreaks] = useState<StreakCard[]>([]);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Sync Modal States
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [targetStreakDays, setTargetStreakDays] = useState(42);
  const [isSyncing, setIsSyncing] = useState(false);

  // Modals
  const [showMissionsModal, setShowMissionsModal] = useState(false);
  const [showAddMissionModal, setShowAddMissionModal] = useState(false);
  const [showAddStreakModal, setShowAddStreakModal] = useState(false);
  const [showRankModal, setShowRankModal] = useState(false);
  const [showStreaksGallery, setShowStreaksGallery] = useState(false);
  const [selectedStreak, setSelectedStreak] = useState<StreakCard | null>(null);
  const [inspectUser, setInspectUser] = useState<any | null>(null);

  const openRankModal = () => {
    setShowRankModal(true);
  };

  // Form states for custom creation
  const [newMissionTitle, setNewMissionTitle] = useState("");
  const [newMissionDesc, setNewMissionDesc] = useState("");
  const [newMissionXP, setNewMissionXP] = useState(75);
  const [newMissionIcon, setNewMissionIcon] = useState("⚡");

  const [newStreakTitle, setNewStreakTitle] = useState("");
  const [newStreakCat, setNewStreakCat] = useState("LIFESTYLE");
  const [newStreakNext, setNewStreakNext] = useState("First Milestone");
  const [newStreakDate, setNewStreakDate] = useState("31 Dec 2026");
  const [newStreakIcon, setNewStreakIcon] = useState("🚀");

  // Streak slider pagination index
  const [streakPageIndex, setStreakPageIndex] = useState(0);

  // Leaderboard filters & daily claim
  const [leaderboardTab, setLeaderboardTab] = useState<"all" | "weekly" | "guild">("all");
  const [dailyClaimed, setDailyClaimed] = useState(false);

  // Welcome Reward Card & Inspector Modal (ONE-TIME ONLY)
  const [showWelcomeCardModal, setShowWelcomeCardModal] = useState(() => {
    try {
      return localStorage.getItem("welcome_card_claimed_v1") !== "true";
    } catch {
      return false;
    }
  });
  const [selectedCard, setSelectedCard] = useState<any | null>(null);

  // (Voice system removed — see git history)

  // ============================================================
  // PROOF VERIFICATION SYSTEM (Solo Dominion)
  // User picks ANY ONE of 3 proof types: Selfie / Video Oath / Text Oath.
  // AI (Gemini multimodal) verifies if proof is real + matches the task.
  // ============================================================
  const [proofMission, setProofMission] = useState<Mission | null>(null);
  // Unified workout tracker state — handles push-ups, squats, plank, walking, meditation
  const [workoutMission, setWorkoutMission] = useState<Mission | null>(null);
  const [proofStep, setProofStep] = useState<"choose" | "selfie" | "video" | "text" | "verifying" | "result">("choose");
  const [proofSelfieBase64, setProofSelfieBase64] = useState<string | null>(null);
  const [proofVideoBlob, setProofVideoBlob] = useState<Blob | null>(null);
  const [proofVideoUrl, setProofVideoUrl] = useState<string | null>(null);
  const [proofTextOath, setProofTextOath] = useState<string>("");
  const [proofNotes, setProofNotes] = useState<string>("");
  const [proofVerifying, setProofVerifying] = useState(false);
  const [proofResult, setProofResult] = useState<{ verified: boolean; score: number; feedback: string } | null>(null);
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [videoRecorderSupported, setVideoRecorderSupported] = useState(true);
  const videoRecorderRef = useRef<MediaRecorder | null>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);

  // Pre-defined text oath templates — user can pick + customize
  const OATH_TEMPLATES = [
    "I swear on the universe and the cosmic law of attraction that I have completed [MISSION] today with absolute integrity, and I accept full responsibility for the reality I am creating.",
    "I solemnly swear by the infinite universe that I have genuinely performed [MISSION] on this very day, and I commit to honor my word as a true warrior of manifestation.",
    "By the stars above and the universe within, I declare on my honor that I have fully completed [MISSION] today, in thought, word, and deed.",
    "I call upon the universe as my witness — I have completed [MISSION] today with my full capacity, and I align myself with the consequences of truth.",
  ];

  // Open proof modal for a mission
  const openProofModal = (mission: Mission) => {
    if (mission.completed || !user) return;

    // WORKOUT mission (push-up, squat, plank, walking, meditation)
    // → use unified motion sensor tracker (no camera, no AI)
    const workoutType = detectWorkoutType(mission.title + " " + (mission.desc || "") + " " + (mission.id || ""));
    if (workoutType) {
      setWorkoutMission(mission);
      return;
    }

    // Other missions → use old selfie/video/text proof system
    setProofMission(mission);
    setProofStep("choose");
    setProofSelfieBase64(null);
    setProofVideoBlob(null);
    setProofVideoUrl(null);
    setProofTextOath("");
    setProofNotes("");
    setProofResult(null);
    setProofVerifying(false);
    setVideoRecorderSupported(typeof window !== "undefined" && typeof window.MediaRecorder !== "undefined");
  };

  // Stop any active video stream (cleanup)
  const stopVideoStream = () => {
    try {
      if (videoStreamRef.current) {
        videoStreamRef.current.getTracks().forEach((t) => t.stop());
        videoStreamRef.current = null;
      }
      if (videoRecorderRef.current && videoRecorderRef.current.state !== "inactive") {
        try { videoRecorderRef.current.stop(); } catch {}
      }
    } catch {}
    setIsRecordingVideo(false);
  };

  // Start video recording (camera + mic for oath)
  const startVideoRecording = async () => {
    if (!videoRecorderSupported) {
      alert("Your browser does not support video recording. Please use Chrome or Safari on a mobile device.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 1280 } },
        audio: true,
      });
      videoStreamRef.current = stream;
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
        videoPreviewRef.current.muted = true;
        await videoPreviewRef.current.play().catch(() => {});
      }
      const recorder = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp9,opus" });
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        setProofVideoBlob(blob);
        if (proofVideoUrl) URL.revokeObjectURL(proofVideoUrl);
        setProofVideoUrl(URL.createObjectURL(blob));
        stopVideoStream();
      };
      videoRecorderRef.current = recorder;
      recorder.start();
      setIsRecordingVideo(true);
    } catch (e: any) {
      console.warn("Camera access denied or failed:", e?.message);
      alert("Camera/mic permission required to record your universe oath. Please allow access in your browser settings.");
      stopVideoStream();
    }
  };

  // Stop video recording
  const stopVideoRecording = () => {
    if (videoRecorderRef.current && videoRecorderRef.current.state !== "inactive") {
      videoRecorderRef.current.stop();
    }
  };

  // Close proof modal
  const closeProofModal = () => {
    stopVideoStream();
    setProofMission(null);
    setProofStep("choose");
    if (proofVideoUrl) {
      URL.revokeObjectURL(proofVideoUrl);
    }
    setProofVideoUrl(null);
    setProofVideoBlob(null);
    setProofSelfieBase64(null);
    setProofTextOath("");
    setProofNotes("");
  };

  // Handle selfie file upload
  const handleSelfieFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      alert("Selfie must be under 8MB. Please use a smaller image.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setProofSelfieBase64(reader.result as string);
    reader.onerror = () => alert("Failed to read the image. Please try another file.");
    reader.readAsDataURL(file);
  };

  // Submit proof for AI verification (any ONE of 3 proof types)
  const submitProofForVerification = async () => {
    if (!proofMission || !user) return;

    // Determine which proof type the user chose
    const proofTypeUsed: ProofType = proofSelfieBase64
      ? "selfie"
      : proofVideoBlob
      ? "video_oath"
      : proofTextOath.trim()
      ? "text_oath"
      : ("" as any);

    if (!proofTypeUsed) {
      alert("Please provide at least one proof: selfie, video oath, or text oath.");
      return;
    }
    if (proofTypeUsed === "text_oath" && proofTextOath.trim().split(/\s+/).length < 10) {
      alert("Your text oath must be at least 10 words. Make it meaningful — the universe is watching.");
      return;
    }

    setProofStep("verifying");
    setProofVerifying(true);

    try {
      // 1) Upload selfie to Firestore (if used)
      let selfieUrl: string | undefined;
      if (proofSelfieBase64 && proofTypeUsed === "selfie") {
        const compressed = await compressImageForFirestore(proofSelfieBase64, 800, 0.7);
        const selfieId = `proof_selfie_${proofMission.id}_${user.uid}_${Date.now()}`;
        await setDoc(doc(db, "users", user.uid, "mission_proofs", selfieId), {
          type: "selfie",
          base64: compressed,
          missionId: proofMission.id,
          missionTitle: proofMission.title,
          createdAt: new Date().toISOString(),
        });
        selfieUrl = compressed;
      }

      // 2) Upload video to Firebase Storage (if used)
      let videoUrl: string | undefined;
      let videoBase64Inline: string | undefined;
      if (proofVideoBlob && proofTypeUsed === "video_oath") {
        try {
          const { ref: storageRef, uploadBytes, getDownloadURL } = await import("firebase/storage");
          const { storage } = await import("../../lib/firebase");
          if (storage) {
            const path = `mission_proofs/${user.uid}/${proofMission.id}_${Date.now()}.webm`;
            const fileRef = storageRef(storage, path);
            await uploadBytes(fileRef, proofVideoBlob, { contentType: "video/webm" });
            videoUrl = await getDownloadURL(fileRef);
            await setDoc(doc(db, "users", user.uid, "mission_proofs", `proof_video_${proofMission.id}_${Date.now()}`), {
              type: "video",
              url: videoUrl,
              storagePath: path,
              missionId: proofMission.id,
              createdAt: new Date().toISOString(),
            });
          } else {
            throw new Error("Storage not configured");
          }
        } catch (storageErr: any) {
          console.warn("Firebase Storage upload failed, using base64 fallback:", storageErr?.message);
          if (proofVideoBlob.size > 2 * 1024 * 1024) {
            throw new Error("Video too large for fallback storage. Please record a shorter oath (under 30 seconds).");
          }
          videoBase64Inline = await blobToBase64(proofVideoBlob);
          videoUrl = videoBase64Inline;
        }
      }

      // 3) Call AI verification endpoint
      const res = await fetch("/api/missions/verify-proof", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          missionId: proofMission.id,
          missionTitle: proofMission.title,
          missionDesc: proofMission.desc,
          missionCategory: proofMission.category || "general",
          proofType: proofTypeUsed,
          selfieBase64: proofTypeUsed === "selfie" ? proofSelfieBase64 : undefined,
          videoUrl: proofTypeUsed === "video_oath" ? videoUrl : undefined,
          videoBase64: proofTypeUsed === "video_oath" && videoBase64Inline ? videoBase64Inline : undefined,
          textOath: proofTypeUsed === "text_oath" ? proofTextOath : undefined,
          notes: proofNotes || undefined,
        }),
      });
      const result = await res.json().catch(() => ({}));
      const verified = !!result.verified;
      const score = Number(result.verificationScore) || 0;
      const feedback = result.verificationFeedback || (verified ? "Universe accepts your oath." : "Proof did not match the mission. Try again with clearer evidence.");

      setProofResult({ verified, score, feedback });
      setProofStep("result");

      if (verified) {
        // 4) Mark mission complete & save proof
        const proof: MissionProof = {
          selfieBase64: proofTypeUsed === "selfie" ? proofSelfieBase64 || undefined : undefined,
          selfieUrl: proofTypeUsed === "selfie" ? selfieUrl : undefined,
          videoUrl: proofTypeUsed === "video_oath" ? videoUrl : undefined,
          videoStoragePath: proofTypeUsed === "video_oath" && videoUrl && !videoUrl.startsWith("data:") ? videoUrl : undefined,
          textOath: proofTypeUsed === "text_oath" ? proofTextOath : undefined,
          proofTypeUsed,
          verified: true,
          verificationScore: score,
          verificationFeedback: feedback,
          submittedAt: new Date().toISOString(),
        };
        const updated = missions.map((m) =>
          m.id === proofMission.id
            ? {
                ...m,
                completed: true,
                currentVal: m.targetVal || 100,
                progress: `${m.targetVal || 100}/${m.targetVal || 100} ${m.unit || ""}`,
                proofData: proof,
                verifiedAt: new Date().toISOString(),
              }
            : m
        );
        setMissions(updated);
        const ref = doc(db, "users", user.uid, "solo_missions", today);
        await setDoc(ref, { missions: updated, date: today }, { merge: true });

        // Award XP and boss damage
        const xpGain = proofMission.xp;
        await setDoc(doc(db, "users", user.uid), {
          xp: (profile.xp || 0) + xpGain,
          totalXp: (profile.totalXp || 0) + xpGain,
        }, { merge: true });
        if (recordXPGain) await recordXPGain(xpGain, profile.level || 1, false);
        attackBoss(100);
        showToast(`⚔️ Mission Verified! +${xpGain} XP! Universe acknowledges your proof.`);
      }
    } catch (e: any) {
      console.error("Proof submission failed:", e);
      setProofResult({ verified: false, score: 0, feedback: e?.message || "Verification failed. Please try again." });
      setProofStep("result");
    } finally {
      setProofVerifying(false);
    }
  };

  // Helper: compress an image before sending to Firestore
  const compressImageForFirestore = (dataUrl: string, maxDim: number, quality: number): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const ratio = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.round(img.width * ratio);
        const h = Math.round(img.height * ratio);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) { resolve(dataUrl); return; }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  };

  // Helper: convert blob to base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Cleanup video stream on unmount
  useEffect(() => {
    return () => {
      stopVideoStream();
      if (proofVideoUrl) URL.revokeObjectURL(proofVideoUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // User Stats & XP
  const level = profile?.level || 1;
  const currentXP = profile?.xp || 242;
  const xpNeeded = level * 500;
  const xpPercentage = Math.min(100, Math.round((currentXP % 500) / 500 * 100));

  // --- WARRIOR CHARACTER EVOLUTION STAGES ---
  const getWarriorStage = (lvl: number) => {
    if (lvl < 5) return {
      stage: "CIVILIAN TRAINEE",
      title: "Novice Seeker",
      badge: "🛡️ CIVILIAN STAGE",
      auraColor: "from-zinc-500 to-slate-700",
      textColor: "text-zinc-400",
      borderColor: "border-zinc-500/30",
      bgGlow: "bg-zinc-500/10",
      desc: "Awakening from normal life. Building foundational daily discipline.",
      avatarIcon: "👤",
      perks: ["Basic Daily Missions", "+0% XP Multiplier"]
    };
    if (lvl < 12) return {
      stage: "IRON WARRIOR",
      title: "Iron Vanguard",
      badge: "⚔️ STAGE 2 • IRON WARRIOR",
      auraColor: "from-amber-500 to-orange-600",
      textColor: "text-amber-400",
      borderColor: "border-amber-500/40",
      bgGlow: "bg-amber-500/15",
      desc: "Forged in consistency. Physical and mental attributes rising steadily.",
      avatarIcon: "🛡️",
      perks: ["Custom Mission Creation", "+10% XP Multiplier", "Streak Freeze Shield"]
    };
    if (lvl < 25) return {
      stage: "SHADOW COMMANDER",
      title: "Shadow Knight",
      badge: "⚡ STAGE 3 • SHADOW COMMANDER",
      auraColor: "from-purple-600 to-indigo-600",
      textColor: "text-purple-400",
      borderColor: "border-purple-500/50",
      bgGlow: "bg-purple-500/20",
      desc: "Master of focus. Unstoppable aura and deep mental clarity.",
      avatarIcon: "⚔️",
      perks: ["Daily Boss Dungeon Damage +25%", "+25% XP Multiplier", "Guild Vanguard Access"]
    };
    return {
      stage: "COSMIC LEGEND MONARCH",
      title: "Shadow Monarch",
      badge: "👑 STAGE 4 • LEGENDARY MONARCH",
      auraColor: "from-emerald-400 via-teal-500 to-purple-600",
      textColor: "text-emerald-300",
      borderColor: "border-emerald-400/60",
      bgGlow: "bg-emerald-500/25",
      desc: "Peak reality creation. Total mastery over physical and mental domain.",
      avatarIcon: "👑",
      perks: ["Supreme Monarch Title", "+50% XP Multiplier", "Instant Boss Obliteration"]
    };
  };

  const warrior = getWarriorStage(level);

  const today = new Date().toISOString().slice(0, 10);

  // --- CHARACTER STATS CALCULATION (STR, INT, WIL, AGI, CHA) ---
  const [allocatedStats, setAllocatedStats] = useState({
    str: 12,
    int: 14,
    wil: 18,
    agi: 10,
    cha: 15,
  });

  useEffect(() => {
    if (profile?.stats) {
      const s = profile.stats as any;
      setAllocatedStats({
        str: Number(s.str) || 12,
        int: Number(s.int) || 14,
        wil: Number(s.wil) || 18,
        agi: Number(s.agi) || 10,
        cha: Number(s.cha) || 15,
      });
    }
  }, [profile?.stats]);

  const availableStatPoints = Math.max(0, level * 2 - (allocatedStats.str + allocatedStats.int + allocatedStats.wil + allocatedStats.agi + allocatedStats.cha - 60));

  const allocatePoint = async (statKey: keyof typeof allocatedStats) => {
    if (availableStatPoints <= 0) return;
    playSFX("click");
    const updated = { ...allocatedStats, [statKey]: allocatedStats[statKey] + 1 };
    setAllocatedStats(updated);
    showToast(`✨ +1 Point Added to ${statKey.toUpperCase()}`);
    if (user) {
      try {
        await setDoc(doc(db, "users", user.uid), { stats: updated }, { merge: true });
      } catch (e) {
        console.warn("Failed to save stats to Firestore:", e);
      }
    }
  };

  // --- DAILY BOSS DUNGEON STATE ---
  const [bossHp, setBossHp] = useState(380);
  const maxBossHp = 500;
  const [bossDefeated, setBossDefeated] = useState(false);

  // Sync daily boss state with Firestore
  useEffect(() => {
    if (!user) return;
    const ref = doc(db, "users", user.uid, "solo_boss", today);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setBossHp(Number(data.hp) ?? 380);
        setBossDefeated(Boolean(data.defeated));
      } else {
        setBossHp(380);
        setBossDefeated(false);
        setDoc(ref, { hp: 380, defeated: false, date: today }, { merge: true }).catch(err => console.warn(err));
      }
    });
    return () => unsub();
  }, [user, today]);

  const attackBoss = async (damage: number) => {
    if (bossDefeated || !user) return;
    const newHp = Math.max(0, bossHp - damage);
    const isDefeated = newHp === 0;
    
    setBossHp(newHp);
    if (isDefeated) {
      setBossDefeated(true);
      showToast("⚔️ PROCRASTINATION DEMON DEFEATED! +250 XP CLAIMED!");
      
      const xpGain = 250;
      await setDoc(doc(db, "users", user.uid), {
        xp: (profile?.xp || 0) + xpGain,
        totalXp: (profile?.totalXp || 0) + xpGain,
      }, { merge: true });
      if (recordXPGain) await recordXPGain(xpGain, profile?.level || 1, false);
    }

    try {
      const ref = doc(db, "users", user.uid, "solo_boss", today);
      await setDoc(ref, { hp: newHp, defeated: isDefeated, date: today }, { merge: true });
    } catch (e) {
      console.warn("Failed to update boss hp in Firestore:", e);
    }
  };

  // Default Missions
  const defaultMissions: Mission[] = [
    { id: "push", title: "100 Push-ups", desc: "Complete 100 push-ups today", progress: "0/100", currentVal: 0, targetVal: 100, unit: "push-ups", xp: 88, icon: "🎯", color: "#a855f7", completed: false, category: "fitness" },
    { id: "run", title: "20 Min Run / Cardio", desc: "Go for a run or intense cardio session", progress: "0/20 min", currentVal: 0, targetVal: 20, unit: "min", xp: 77, icon: "⚡", color: "#22c55e", completed: false, category: "fitness" },
    { id: "read", title: "30 Min Deep Reading", desc: "Read without phone or distractions", progress: "0/30 min", currentVal: 0, targetVal: 30, unit: "min", xp: 68, icon: "📖", color: "#3b82f6", completed: false, category: "learning" },
    { id: "journal", title: "Journal 10 Min", desc: "Write your thoughts and daily intentions", progress: "0/10 min", currentVal: 0, targetVal: 10, unit: "min", xp: 42, icon: "✏️", color: "#a855f7", completed: false, category: "mindset" },
  ];

  // Default Streaks
  const defaultStreaks: StreakCard[] = [
    { id: "dream", cat: "LIFESTYLE", title: "Dream House", pct: 78, next: "Increase Savings", date: "31 Dec 2027", xp: 300, color: "#a855f7", icon: "🏠", bg: "/assets/streak-dream-house.jpg" },
    { id: "sixpack", cat: "HEALTH", title: "Build Six Pack", pct: 62, next: "Complete 20 Workouts", date: "30 Nov 2025", xp: 250, color: "#f43f5e", icon: "💪", bg: "/assets/streak-six-pack.jpg" },
    { id: "saas", cat: "CAREER", title: "Launch SaaS", pct: 45, next: "Build Landing Page", date: "15 Jan 2026", xp: 400, color: "#3b82f6", icon: "🚀", bg: "/assets/streak-saas.jpg" },
    { id: "freedom", cat: "WEALTH", title: "Financial Freedom", pct: 55, next: "Invest in Index Funds", date: "31 Dec 2026", xp: 350, color: "#f59e0b", icon: "💰", bg: "/assets/streak-wealth.jpg" },
    { id: "relationship", cat: "RELATIONSHIP", title: "Better Relationship", pct: 46, next: "Date Night + Connect", date: "20 Aug 2025", xp: 200, color: "#f43f5e", icon: "❤️", bg: "/assets/streak-relationship.jpg" },
    { id: "better", cat: "PERSONAL", title: "Be 1% Better", pct: 36, next: "Daily Micro Wins", date: "Ongoing", xp: 150, color: "#06b6d4", icon: "🧠", bg: "/assets/streak-better.jpg" },
  ];

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // --- FIRESTORE SUBSCRIPTIONS ---
  useEffect(() => {
    if (!user) return;
    const ref = doc(db, "users", user.uid, "solo_missions", today);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const saved = snap.data().missions || [];
        setMissions(saved);

        // Migrate: if user has no sensor-tracked workout missions in their
        // saved list, persist the new defaults to Firestore. This is a
        // one-time migration per user so refreshes don't keep re-adding.
        const hasWorkout = saved.some((m: Mission) =>
          detectWorkoutType(m.title + " " + (m.desc || "") + " " + (m.id || ""))
        );
        if (!hasWorkout && DEFAULT_QUESTS.length > 0) {
          const DEFAULT_TARGETS_MIG: Record<string, { target: number; unit: string }> = {
            "default-pushup-50":     { target: 50,   unit: "reps"   },
            "default-squat-50":      { target: 50,   unit: "reps"   },
            "default-plank-2min":    { target: 120,  unit: "sec"    },
            "default-walk-5k":       { target: 5000, unit: "steps"  },
            "default-meditation-10min": { target: 600, unit: "sec"  },
          };
          const toAdd: Mission[] = DEFAULT_QUITS_TO_MISSION(
            DEFAULT_QUESTS,
            saved,
            DEFAULT_TARGETS_MIG,
          );
          if (toAdd.length > 0) {
            setDoc(ref, { missions: [...saved, ...toAdd], date: today }, { merge: true }).catch(() => {});
          }
        }
      } else {
        setMissions(defaultMissions);
        setDoc(ref, { missions: defaultMissions, date: today }, { merge: true });
      }
    });
    return () => unsub();
  }, [user, today]);

  useEffect(() => {
    if (!user) return;
    const ref = doc(db, "users", user.uid, "solo_streaks", "main");
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as any;
        if (data.streaks?.length) {
          setStreaks(data.streaks);
          return;
        }
      }
      setStreaks(defaultStreaks);
      setDoc(ref, { streaks: defaultStreaks, lastUpdated: new Date().toISOString() }, { merge: true });
    });
    return () => unsub();
  }, [user]);

  // Check daily reward status
  useEffect(() => {
    if (!user) return;
    const ref = doc(db, "users", user.uid, "solo_claims", today);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setDailyClaimed(snap.data().claimed || false);
      } else {
        setDailyClaimed(false);
      }
    });
    return () => unsub();
  }, [user, today]);

  // Live leaderboard
  const [leaders, setLeaders] = useState<any[]>([]);
  // Leaderboard UI state — filter tab + full open modal
  const [leaderboardFilter, setLeaderboardFilter] = useState<"all" | "weekly" | "guild">("all");
  const [showFullLeaderboard, setShowFullLeaderboard] = useState(false);
  useEffect(() => {
    const unsub = subscribeGlobalLeaderboard(5, (entries: any[]) => {
      if (entries?.length) {
        setLeaders(entries.map((e, i) => ({
          rank: i + 1,
          name: e.name || "Hunter",
          xp: e.playerScore || 0,
          level: `${e.level || 1} • Hunter`,
          isYou: user && e.uid === user.uid,
        })));
      }
    });
    return () => unsub?.();
  }, [user]);

  // --- HANDLERS ---
  // Handle workout completion (unified for push-ups, squats, plank, walking, meditation)
  const handleWorkoutComplete = async (state: RepState) => {
    if (!workoutMission || !user) return;

    const mission = workoutMission;
    setWorkoutMission(null);

    // Validation
    const isTimeBased = state.metadata?.isTimeBased;
    const minRequired = isTimeBased ? 10 : 5; // 10s for plank/meditation, 5 reps for others

    if (state.count < minRequired) {
      const unit = isTimeBased ? "seconds" : "reps";
      showToast(`❌ Only ${state.count} ${unit} detected. Need at least ${minRequired}.`);
      return;
    }

    // Mark mission complete with motion proof data
    const proof: MissionProof = {
      selfieBase64: undefined,
      selfieUrl: undefined,
      videoUrl: undefined,
      videoStoragePath: undefined,
      textOath: undefined,
      proofTypeUsed: "video_oath",
      verified: true,
      verificationScore: Math.min(100, Math.round((state.count / (mission.targetVal || 100)) * 100)),
      verificationFeedback: `${state.type} completed: ${state.count} ${isTimeBased ? "seconds" : "reps"}. Form verified via motion sensor.`,
      submittedAt: new Date().toISOString(),
    };

    const updated = missions.map((m) =>
      m.id === mission.id
        ? {
            ...m,
            completed: true,
            currentVal: state.count,
            progress: `${state.count}/${mission.targetVal || state.count} ${mission.unit || ""}`.trim(),
            proofData: proof,
            verifiedAt: new Date().toISOString(),
          }
        : m
    );
    setMissions(updated);
    const ref = doc(db, "users", user.uid, "solo_missions", today);
    await setDoc(ref, { missions: updated, date: today }, { merge: true });

    // Award XP
    const xpGain = mission.xp;
    await setDoc(doc(db, "users", user.uid), {
      xp: (profile.xp || 0) + xpGain,
      totalXp: (profile.totalXp || 0) + xpGain,
    }, { merge: true });
    if (recordXPGain) await recordXPGain(xpGain, profile.level || 1, false);
    attackBoss(100);
    if ("vibrate" in navigator) navigator.vibrate([100, 50, 200]);
    showToast(`⚔️ ${state.count} ${state.type} verified! +${xpGain} XP!`);
  };

  const completeMission = async (id: string) => {
    if (!user || saving) return;
    const mission = missions.find(m => m.id === id);
    if (!mission || mission.completed) return;

    // Open proof modal — AI will decide which proofs are required
    openProofModal(mission);
  };

  const handleIncrementMissionProgress = async (id: string, delta: number) => {
    if (!user || saving) return;
    const mission = missions.find(m => m.id === id);
    if (!mission || mission.completed) return;

    setSaving(true);

    const current = mission.currentVal || 0;
    const target = mission.targetVal || 100;
    const newVal = Math.min(target, current + delta);
    const isNowComplete = newVal >= target;

    if (isNowComplete) {
      // (voice removed)
    }

    const updated = missions.map(m => {
      if (m.id === id) {
        return {
          ...m,
          currentVal: newVal,
          progress: `${newVal}/${target} ${m.unit || ''}`,
          completed: isNowComplete
        };
      }
      return m;
    });

    setMissions(updated);

    try {
      const ref = doc(db, "users", user.uid, "solo_missions", today);
      await setDoc(ref, { missions: updated, date: today }, { merge: true });

      if (isNowComplete) {
        const xpGain = mission.xp;
        await setDoc(doc(db, "users", user.uid), {
          xp: (profile.xp || 0) + xpGain,
          totalXp: (profile.totalXp || 0) + xpGain,
        }, { merge: true });
        showToast(`🎉 Mission Completed! +${xpGain} XP`);
      } else {
        showToast(`⚡ Mission Progress Updated: ${newVal}/${target}`);
      }
    } catch (e) {
    } finally {
      setSaving(false);
    }
  };

  const handleAddCustomMission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMissionTitle.trim() || !user) return;

    const newM: Mission = {
      id: `custom_${Date.now()}`,
      title: newMissionTitle,
      desc: newMissionDesc || "Custom Daily Mission",
      progress: "0/1",
      currentVal: 0,
      targetVal: 1,
      unit: "times",
      xp: Number(newMissionXP) || 50,
      icon: newMissionIcon || "⚡",
      color: "#a855f7",
      completed: false
    };

    const updated = [...missions, newM];
    setMissions(updated);
    setShowAddMissionModal(false);
    setNewMissionTitle("");
    setNewMissionDesc("");

    try {
      const ref = doc(db, "users", user.uid, "solo_missions", today);
      await setDoc(ref, { missions: updated, date: today }, { merge: true });
      showToast(`✨ New Mission Activated: ${newM.title}`);
    } catch (e) {}
  };

  const advanceStreak = async (streakId: string, pctDelta: number = 10) => {
    if (!user || saving) return;
    setSaving(true);

    const idx = streaks.findIndex(s => s.id === streakId);
    if (idx === -1) return setSaving(false);

    const updated = [...streaks];
    const newPct = Math.min(100, updated[idx].pct + pctDelta);
    updated[idx] = { ...updated[idx], pct: newPct };
    setStreaks(updated);

    if (selectedStreak && selectedStreak.id === streakId) {
      setSelectedStreak({ ...selectedStreak, pct: newPct });
    }

    try {
      await setDoc(doc(db, "users", user.uid, "solo_streaks", "main"), { streaks: updated }, { merge: true });
      const bonus = Math.floor(updated[idx].xp * (pctDelta / 100));
      await setDoc(doc(db, "users", user.uid), {
        xp: (profile.xp || 0) + bonus,
        totalXp: (profile.totalXp || 0) + bonus,
      }, { merge: true });

      showToast(`🔥 Streak Advanced to ${newPct}%! (+${bonus} XP)`);
    } catch (e) {}
    finally { setSaving(false); }
  };

  const handleAddCustomStreak = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStreakTitle.trim() || !user) return;

    const bgList = [
      "/assets/streak-dream-house.jpg",
      "/assets/streak-six-pack.jpg",
      "/assets/streak-saas.jpg",
      "/assets/streak-wealth.jpg",
      "/assets/streak-relationship.jpg",
      "/assets/streak-better.jpg",
    ];

    const newS: StreakCard = {
      id: `streak_${Date.now()}`,
      cat: newStreakCat.toUpperCase(),
      title: newStreakTitle,
      pct: 10,
      next: newStreakNext || "Milestone 1",
      date: newStreakDate || "31 Dec 2026",
      xp: 300,
      color: "#a855f7",
      icon: newStreakIcon || "🚀",
      bg: bgList[Math.floor(Math.random() * bgList.length)]
    };

    const updated = [...streaks, newS];
    setStreaks(updated);
    setShowAddStreakModal(false);
    setNewStreakTitle("");

    try {
      await setDoc(doc(db, "users", user.uid, "solo_streaks", "main"), { streaks: updated }, { merge: true });
      showToast(`🌟 New Streak Card Activated: ${newS.title}`);
    } catch (e) {}
  };

  const handleSyncStreak = async () => {
    if (!user || isSyncing) return;
    setIsSyncing(true);
    showToast("🌀 Aligning quantum timelines... Seeding database streak...");

    try {
      const now = new Date();
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
      const getTodayStrLocal = (tz: string) => {
        const d = new Date();
        const format = new Intl.DateTimeFormat("en-CA", {
          timeZone: tz,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        });
        return format.format(d);
      };

      const toLocalDateStringLocal = (d: Date, tz: string) => {
        const format = new Intl.DateTimeFormat("en-CA", {
          timeZone: tz,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        });
        return format.format(d);
      };
      
      const batchPromises = [];
      const userRef = doc(db, "users", user.uid);
      const todayStr = getTodayStrLocal(timeZone);
      const newActiveDays: string[] = [];
      
      for (let i = 0; i < targetStreakDays; i++) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dateStr = toLocalDateStringLocal(d, timeZone);
        newActiveDays.push(dateStr);
        
        const eventId = `sync_se_${dateStr}_${user.uid}`;
        const eventData = {
          userId: user.uid,
          type: "habit_complete",
          label: "Quantum Reality Timeline Sync",
          xp: 10,
          createdAt: d.toISOString(),
          localDate: dateStr,
          streakExtended: true
        };
        
        const eventDocRef = doc(db, "users", user.uid, "streak_events", eventId);
        batchPromises.push(setDoc(eventDocRef, eventData, { merge: true }));
      }
      
      const newLevel = Math.max(profile?.level || 1, Math.min(25, Math.ceil(targetStreakDays / 2)));
      const totalXp = Math.max(profile?.totalXp || 0, targetStreakDays * 250);
      
      const updateData: any = {
        streak: targetStreakDays,
        longestStreak: Math.max(profile?.longestStreak || 0, targetStreakDays),
        activeDays: newActiveDays,
        streakFreezes: 3,
        xp: (profile?.xp || 100),
        totalXp: totalXp,
        level: newLevel,
      };
      
      batchPromises.push(setDoc(userRef, updateData, { merge: true }));
      await Promise.all(batchPromises);

      showToast(`✨ TIMELINE SECURED: ${targetStreakDays} DAYS OF UNWAVERING DISCIPLINE WRITTEN TO CLOUD REALM!`);
      setShowSyncModal(false);
    } catch (err: any) {
      console.error("Streak sync error:", err);
      showToast("❌ Synchronization rift detected. Try again.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClaimDailyReward = async () => {
    if (!user || dailyClaimed) return;
    setDailyClaimed(true);

    try {
      const rewardXP = 100;
      await setDoc(doc(db, "users", user.uid, "solo_claims", today), { claimed: true, date: today }, { merge: true });
      await setDoc(doc(db, "users", user.uid), {
        xp: (profile.xp || 0) + rewardXP,
        totalXp: (profile.totalXp || 0) + rewardXP,
      }, { merge: true });

      showToast(`👑 Daily Conquest Reward Claimed! +100 XP`);
    } catch (e) {}
  };

  const leaderboardPreview = leaders.length > 0 ? leaders : [
    { rank: 1, name: "Zenith Monarch", level: "36 • Monarch", xp: 2125299, isYou: false },
    { rank: 2, name: `${user?.displayName || "as artist"} (YOU)`, level: `${level} • Hunter`, xp: profile?.xp || 1255518, isYou: true },
    { rank: 3, name: "Shadow Slayer", level: "22 • Hunter", xp: 985114, isYou: false },
    { rank: 4, name: "Valkyrie Prime", level: "19 • Knight", xp: 742100, isYou: false },
    { rank: 5, name: "Astra Master", level: "15 • Scout", xp: 512000, isYou: false },
  ];

  // Filter leaderboard by tab — for full leaderboard modal
  const filteredLeaderboard = (() => {
    // In a real backend, this would query by date range / guild ID.
    // Here we just shuffle by filter so the UI is responsive.
    if (leaderboardFilter === "all") return leaderboardPreview;
    if (leaderboardFilter === "weekly") {
      // Sort by descending XP, take top 10 (mock "weekly" data)
      return [...leaderboardPreview].sort((a, b) => b.xp - a.xp).slice(0, 10);
    }
    // guild — show only top 3 + current user
    return leaderboardPreview.filter((l) => l.rank <= 3 || l.isYou).slice(0, 5);
  })();

  const visibleStreaks = streaks.slice(streakPageIndex * 6, (streakPageIndex + 1) * 6);
  const maxStreakPages = Math.ceil(streaks.length / 6);

  // (Voice page entry useEffect removed)

  // ============================================================
  // QUEST SYSTEM DERIVATIONS — RPG layer
  // ============================================================
  const currentTier = getCurrentTier(level);
  const nextTier = getNextTier(level);

  // Convert existing `missions` (legacy Mission[]) into a unified quest list
  // that the new QuestBoard expects, using the new rank + category metadata.
  // We re-derive ranks and categories from existing mission data so legacy
  // users keep their XP without losing progress.
  const deriveRankFromXp = (xp: number): QuestRank => {
    if (xp <= 25) return "E";
    if (xp <= 60) return "D";
    if (xp <= 130) return "C";
    if (xp <= 320) return "B";
    return "A";
  };
  const deriveCategoryFromMission = (m: Mission): QuestCategory => {
    if (m.category === "fitness") return "body";
    if (m.category === "learning") return "knowledge";
    if (m.category === "mindset") return "mind";
    if (m.category === "wealth") return "wealth";
    if (m.category === "lifestyle") return "life";
    if (m.category === "social") return "social";
    if (m.category === "creative") return "career";
    return "career";
  };
  const deriveQuestType = (m: Mission, idx: number): QuestQuestType => {
    if (m.proofData?.proofTypeUsed === "video_oath" || (m.xp || 0) >= 150) return "boss";
    if ((m.xp || 0) >= 100) return "main";
    if (idx === 0) return "main";
    if (m.category === "mindset" || m.category === "wealth") return "discipline";
    return "side";
  };

  // Build the quest list shown in the QuestBoard. We merge:
  //  1) The user's existing missions (from Firestore) — preserved for back-compat
  //  2) Default quests that don't exist in their list — gentle onboarding
  const legacyQuests: Mission[] = (missions || []).map((m, i) => ({
    ...m,
    questType: deriveQuestType(m, i),
    rank: (m.xp <= 25 ? "E" : m.xp <= 60 ? "D" : m.xp <= 130 ? "C" : m.xp <= 320 ? "B" : "A") as QuestRank,
    category: deriveCategoryFromMission(m),
  }));

  // Default onboarding quests — ALWAYS merge new sensor-tracked workout
  // defaults into the user's catalogue (deduplicated by ID). This ensures
  // every user gets the 5 workout missions (push-ups, squats, plank, walk,
  // meditation) regardless of whether they previously had custom missions.
  const seenIds = new Set(legacyQuests.map((q) => q.id));

  // Map of default-quest id → target value override (since DEFAULT_QUESTS
  // is in "Mission"-shaped form, we need reps / duration / step targets)
  const DEFAULT_TARGETS: Record<string, { target: number; unit: string }> = {
    "default-pushup-50":     { target: 50,   unit: "reps"   },
    "default-squat-50":      { target: 50,   unit: "reps"   },
    "default-plank-2min":    { target: 120,  unit: "sec"    },
    "default-walk-5k":       { target: 5000, unit: "steps"  },
    "default-meditation-10min": { target: 600, unit: "sec"  },
  };

  const onboardingQuests: Mission[] = DEFAULT_QUITS_TO_MISSION(
    DEFAULT_QUESTS,
    legacyQuests,
    DEFAULT_TARGETS,
  );

  const quests: Mission[] = [...onboardingQuests, ...legacyQuests];

  // Boss battles — always from the catalog, but mark completed if user already
  // completed an equivalent local mission.
  const completedBossIds = new Set(
    legacyQuests.filter((q) => q.questType === "boss" && q.completed).map((q) => q.id)
  );
  const bossQuests: Mission[] = BOSS_QUESTS.map((b) => ({
    id: b.id,
    title: b.title,
    desc: b.description,
    description: b.description,
    progress: "0/1",
    currentVal: 0,
    targetVal: 1,
    unit: "times",
    xp: b.xp,
    icon: CATEGORY_ICON[b.category],
    color: "#ef4444",
    completed: completedBossIds.has(b.id),
    category: "lifestyle" as const,
    questType: "boss" as const,
    rank: b.rank,
    bossImage: b.bossImage,
  }));

  // Daily XP + completion counters
  const DAILY_XP_CAP = 800;
  const todayXpKey = today;
  const dailyXpEarned = useMemo(() => {
    // Sum XP from today's completed quests. For legacy data without
    // submittedAt we just count it (best-effort).
    return legacyQuests
      .filter((q) => q.completed)
      .reduce((sum, q) => sum + (q.xp || 0), 0);
  }, [legacyQuests]);
  const todayCompletedCount = legacyQuests.filter((q) => q.completed).length;
  const isUnlockedFor = (lvl: number) => level >= lvl;

  // Open proof modal for a quest
  const openQuestProof = (q: Mission) => {
    // Map new quest metadata back onto a Mission object that the existing
    // proof pipeline understands. We re-use `openProofModal` from the legacy
    // flow which already handles selfie/video/text proof submissions.
    const synthetic: Mission = {
      id: q.id,
      title: q.title,
      desc: q.desc,
      progress: q.progress,
      currentVal: q.currentVal,
      targetVal: q.targetVal,
      unit: q.unit,
      xp: q.xp,
      icon: q.icon,
      color: q.color,
      completed: q.completed,
      category: q.category,
      questType: q.questType,
      rank: q.rank,
      bossImage: q.bossImage,
    };
    openProofModal(synthetic);
  };

  return (
    <div
      className="text-white relative z-30 pb-12 select-none sd-body-font"
      onClick={handleUserInteraction}
      style={{ backgroundColor: "#000", fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif" }}
    >
      {/* ============================================================ */}
      {/* GLOBAL FX — cinematic gradient + ambient particles          */}
      {/* ============================================================ */}
      <style>{`
        @keyframes xpGlow {
          0%, 100% { box-shadow: 0 0 14px rgba(168,85,247,0.45), inset 0 0 8px rgba(168,85,247,0.2); }
          50%      { box-shadow: 0 0 28px rgba(168,85,247,0.85), inset 0 0 14px rgba(168,85,247,0.4); }
        }
        @keyframes bossPulse {
          0%, 100% { box-shadow: 0 0 20px rgba(239,68,68,0.5), 0 0 40px rgba(239,68,68,0.25); }
          50%      { box-shadow: 0 0 36px rgba(239,68,68,0.95), 0 0 70px rgba(239,68,68,0.45); }
        }
        @keyframes floatParticle {
          0%   { transform: translateY(0) translateX(0); opacity: 0; }
          10%  { opacity: 0.6; }
          90%  { opacity: 0.6; }
          100% { transform: translateY(-120vh) translateX(20px); opacity: 0; }
        }
        @keyframes rewardGlow {
          0%, 100% { box-shadow: 0 0 30px var(--glow), inset 0 0 60px rgba(0,0,0,0.4); }
          50%      { box-shadow: 0 0 60px var(--glow), inset 0 0 80px rgba(0,0,0,0.3); }
        }
        @keyframes levelUpBurst {
          0%   { transform: scale(0.4) rotate(-12deg); opacity: 0; }
          40%  { transform: scale(1.15) rotate(2deg); opacity: 1; }
          100% { transform: scale(1) rotate(0); opacity: 1; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmerGold {
          0%, 100% { background-position: 0% 50%; }
          50%      { background-position: 100% 50%; }
        }
        @keyframes kenBurns {
          0%   { transform: scale(1) translateX(0); }
          50%  { transform: scale(1.06) translateX(-1%); }
          100% { transform: scale(1) translateX(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .sd-particle {
          position: absolute;
          width: 2px;
          height: 2px;
          background: rgba(212,175,55,0.5);
          border-radius: 50%;
          pointer-events: none;
          animation: floatParticle linear infinite;
        }
        .sd-rank-E { border-color: rgba(148,163,184,0.6) !important; }
        .sd-rank-D { border-color: rgba(34,197,94,0.6) !important; }
        .sd-rank-C { border-color: rgba(59,130,246,0.6) !important; }
        .sd-rank-B { border-color: rgba(168,85,247,0.6) !important; }
        .sd-rank-A { border-color: rgba(212,175,55,0.85) !important; }
        .sd-royal-font { font-family: 'Cinzel', 'Cormorant Garamond', serif; letter-spacing: 0.04em; }
        .sd-body-font { font-family: 'Inter', system-ui, sans-serif; }
        .sd-mono-font { font-family: 'JetBrains Mono', 'Courier New', monospace; }
        .sd-shimmer-text {
          background: linear-gradient(90deg, #b8941f 0%, #f5e7a3 25%, #d4af37 50%, #f5e7a3 75%, #b8941f 100%);
          background-size: 200% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmerGold 4s ease-in-out infinite;
        }
        .sd-anime-bg {
          background-color: #000000;
          background-image: none;
        }
        .sd-hero-banner {
          background-color: #000000;
          background-image: none;
        }
        .sd-hero-anime {
          background-image:
            linear-gradient(to right, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.65) 30%, rgba(0,0,0,0.45) 55%, rgba(0,0,0,0.85) 100%),
            url('/images/sd_jin_hero.jpg');
          background-size: cover;
          background-position: right center;
          background-repeat: no-repeat;
        }
        .sd-card-border {
          border: 1px solid rgba(255,255,255,0.08);
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .sd-card-border:hover {
          border-color: rgba(212,175,55,0.5);
          transform: translateY(-2px);
        }
        .sd-divider {
          background: linear-gradient(to right, transparent, rgba(212,175,55,0.4), transparent);
          height: 1px;
        }
        .sd-rank-badge {
          font-family: 'Cinzel', serif;
          letter-spacing: 0.15em;
          text-transform: uppercase;
        }
        /* Modal scrollbar — clean dark, no bright colors */
        .sd-modal-scroll::-webkit-scrollbar { width: 6px; }
        .sd-modal-scroll::-webkit-scrollbar-track { background: transparent; }
        .sd-modal-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 99px; }
        .sd-modal-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
        @keyframes sd-modal-in {
          from { opacity: 0; transform: translateY(8px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .sd-modal-card { animation: sd-modal-in 0.22s cubic-bezier(0.16, 1, 0.3, 1); }
        @media (max-width: 768px) {
          /* no-op now that bg is solid black */
        }
      `}</style>

      {/* Anime cinematic background (full page) — fixed, dark, no neon */}
      <div className="pointer-events-none fixed inset-0 -z-10 sd-anime-bg" />
      {/* Subtle film grain overlay */}
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml;utf8,<svg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' /></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.5'/></svg>")`,
          mixBlendMode: "overlay",
        }}
      />
      {/* Slow gold dust particles (no glow) */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="sd-particle"
            style={{
              left: `${(i * 11 + 7) % 100}%`,
              bottom: "-10vh",
              animationDuration: `${25 + (i % 5) * 3}s`,
              animationDelay: `${i * 0.8}s`,
              opacity: 0.3,
            }}
          />
        ))}
      </div>

      {/* ============================================================ */}
      {/* FLOATING TOAST                                              */}
      {/* ============================================================ */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-[400] bg-black/95 border border-amber-400/30 text-white px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-3 animate-bounce">
          <Sparkles size={18} className="text-yellow-400 animate-spin" />
          <span className="text-xs font-bold tracking-wide">{toastMsg}</span>
        </div>
      )}

      {/* ============================================================ */}
      {/* PAGE HEADER — anime hero + royal serif title                */}
      {/* ============================================================ */}
      <div className="mb-6 relative z-10">
        <div
          className="relative rounded-3xl overflow-hidden border border-amber-400/15"
          style={{ minHeight: "320px" }}
        >
          {/* Background anime image — Sung Jinwoo reference, right side */}
          <div className="absolute inset-0 sd-hero-anime" />
          {/* Bottom dark fade for legibility */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0) 35%, rgba(0,0,0,0) 65%, rgba(0,0,0,0.85) 100%)" }}
          />
          {/* Content overlay */}
          <div className="relative z-10 p-6 sm:p-8 lg:p-10 flex flex-col md:flex-row md:items-center gap-5 min-h-[320px]">
            <div className="flex-1 min-w-0 max-w-2xl">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="h-px w-8 bg-amber-400/60" />
                <span className="sd-rank-badge text-[10px] text-amber-300 font-bold">
                  Solo Dominion · Shadow Archive
                </span>
              </div>
              <h1 className="sd-royal-font text-[36px] sm:text-[48px] lg:text-[58px] font-bold leading-[0.95] mb-3 tracking-[0.02em]">
                <span className="text-white">Continue Your</span>
                <br />
                <span className="sd-shimmer-text">Conquest</span>
                <span className="text-amber-400/80">.</span>
              </h1>
              <p className="sd-body-font text-[14px] sm:text-[15px] text-white/65 max-w-xl leading-relaxed font-light">
                Your real life is the game. Your goals are quests.{" "}
                <span className="text-amber-200/90 font-medium">Your discipline becomes XP.</span>
              </p>
            </div>
            <div className="shrink-0 flex flex-col sm:flex-row md:flex-col gap-2 md:items-end">
              <button
                onClick={() => setShowSyncModal(true)}
                className="px-4 py-2.5 rounded-xl border border-amber-400/40 text-amber-100 hover:bg-amber-500/10 sd-mono-font text-[10px] font-bold tracking-[0.18em] uppercase flex items-center gap-2 transition active:scale-95 backdrop-blur-md"
                style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
              >
                <Calendar size={12} className="text-amber-300" />
                Sync
              </button>
            </div>
          </div>
          {/* Bottom hairline divider */}
          <div className="absolute bottom-0 left-0 right-0 h-px sd-divider" />
        </div>
      </div>

      {/* ============================================================ */}
      {/* TODAY'S DOMINION — XP bar + Level + Rank (premium dark)    */}
      {/* ============================================================ */}
      <div className="mb-6 relative z-10">
        <div
          className="rounded-3xl border border-white/10 bg-black/70 backdrop-blur-md p-5 sm:p-6 relative overflow-hidden"
          style={{ animation: "fadeInUp 0.5s ease-out" }}
        >
          {/* Top hairline accent */}
          <div className="absolute top-0 left-0 right-0 h-px sd-divider" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center gap-5">
            {/* Level + Rank block */}
            <div className="flex items-center gap-4 shrink-0">
              <div className="relative w-[92px] h-[92px] rounded-full p-[2px] flex items-center justify-center" style={{ background: "linear-gradient(135deg, #d4af37 0%, #8a6d2c 50%, #d4af37 100%)" }}>
                <div className="w-full h-full rounded-full bg-black border border-amber-500/30 flex flex-col items-center justify-center text-center">
                  <span className="sd-mono-font text-[9px] tracking-[0.18em] text-amber-300 uppercase font-bold">Level</span>
                  <span className="sd-royal-font text-[32px] font-bold text-white leading-none tracking-tight tabular-nums mt-0.5">{level}</span>
                </div>
              </div>
              <div>
                <div className="sd-rank-badge text-[9px] text-amber-300/90 mb-1">{currentTier.label}</div>
                <div className="sd-royal-font text-[22px] sm:text-[26px] font-bold text-white tracking-[0.04em]">
                  {currentTier.name}
                </div>
                <div className="sd-body-font text-[10.5px] text-white/55 mt-0.5 max-w-[230px] leading-snug font-light">
                  {currentTier.description}
                </div>
              </div>
            </div>

            {/* XP bar + counters */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-2.5">
                <div className="flex items-center gap-2">
                  <span className="sd-rank-badge text-[10px] text-white/55">XP Today</span>
                  <span className="px-2.5 py-0.5 border border-amber-400/30 text-amber-200 sd-mono-font text-[10px] font-bold tabular-nums">
                    {dailyXpEarned} / {DAILY_XP_CAP}
                  </span>
                </div>
                {nextTier ? (
                  <span className="sd-rank-badge text-[10px] text-amber-300/80">
                    Next · {nextTier.name} @ Lv.{nextTier.level}
                  </span>
                ) : (
                  <span className="sd-rank-badge text-[10px] text-amber-300">★ Apex Reached</span>
                )}
              </div>
              <div className="h-[6px] bg-white/[0.06] rounded-full overflow-hidden border border-white/[0.08] relative">
                <div
                  className="h-full transition-all duration-700"
                  style={{
                    width: `${Math.min(100, xpPercentage)}%`,
                    background: "linear-gradient(to right, #d4af37 0%, #f5e7a3 50%, #d4af37 100%)",
                  }}
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 mt-2.5 sd-mono-font text-[10px] text-white/45">
                <span className="tabular-nums">{currentXP} / {xpNeeded} XP Total</span>
                <span>Quests · <span className="text-emerald-300/90 font-bold tabular-nums">{todayCompletedCount}</span> / {quests.length}</span>
                <span>Daily · <span className="text-amber-200/90 font-bold tabular-nums">{dailyXpEarned}</span> XP</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* QUEST BOARD — main / side / discipline                     */}
      {/* ============================================================ */}
      <QuestBoard
        quests={quests}
        bossQuests={bossQuests}
        onOpenQuest={openProofModal}
        isUnlockedFor={isUnlockedFor}
        rankColor={RANK_COLOR}
        rankLabel={RANK_LABEL}
        categoryIcon={CATEGORY_ICON}
        categoryLabel={CATEGORY_LABEL}
      />

      {/* ============================================================ */}
      {/* GLOBAL LEADERBOARD — iOS app style (Strava / Apple Fitness) */}
      {/* Dynamic: real-time Firestore data, top 5 preview + full modal */}
      {/* ============================================================ */}
      <div className="mt-8 relative z-10">
        <div className="flex items-center justify-between mb-3 px-1">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Trophy size={15} className="text-amber-300" />
              <span className="sd-rank-badge text-[10px] text-white/80">Global Leaderboard</span>
            </div>
            <p className="text-[11px] text-white/45 tracking-tight">
              Live rankings · {leaderboardPreview.length} hunters competing
            </p>
          </div>
          <button
            onClick={() => setShowFullLeaderboard(true)}
            className="text-[11px] font-medium text-white/55 hover:text-white transition-colors flex items-center gap-1"
          >
            See all
            <ChevronRight size={12} />
          </button>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-full bg-white/[0.04] mb-3">
          {([
            { id: "all", label: "All Time" },
            { id: "weekly", label: "This Week" },
            { id: "guild", label: "Guild" },
          ] as const).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setLeaderboardFilter(tab.id)}
              className={`flex-1 text-[11px] font-semibold py-1.5 rounded-full transition-all ${
                leaderboardFilter === tab.id
                  ? "bg-white text-black"
                  : "text-white/60 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div
          className="rounded-2xl overflow-hidden border border-white/[0.06]"
          style={{ backgroundColor: "rgba(255,255,255,0.02)" }}
        >
          {leaderboardPreview.slice(0, 5).map((entry, idx) => {
            const isYou = entry.isYou;
            const rankColor =
              entry.rank === 1 ? "#d4af37" :
              entry.rank === 2 ? "#c0c0c0" :
              entry.rank === 3 ? "#cd7f32" :
              "rgba(255,255,255,0.3)";
            return (
              <div
                key={entry.rank}
                className={`flex items-center gap-3 px-3.5 py-3 ${idx !== 0 ? "border-t border-white/[0.04]" : ""} ${
                  isYou ? "bg-white/[0.04]" : ""
                }`}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold tabular-nums shrink-0"
                  style={{
                    backgroundColor: entry.rank <= 3 ? `${rankColor}15` : "rgba(255,255,255,0.05)",
                    color: entry.rank <= 3 ? rankColor : "rgba(255,255,255,0.45)",
                    border: entry.rank <= 3 ? `1px solid ${rankColor}40` : "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  {entry.rank}
                </div>

                <div className="flex-1 min-w-0">
                  <div className={`text-[13px] font-semibold truncate ${isYou ? "text-amber-300" : "text-white"}`}>
                    {isYou ? "You" : entry.name}
                  </div>
                  <div className="text-[10px] text-white/40 truncate mt-0.5">
                    {entry.level}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-[13px] font-bold tabular-nums text-white">
                    {entry.xp >= 1000 ? `${(entry.xp / 1000).toFixed(1)}K` : entry.xp}
                  </div>
                  <div className="text-[9px] text-white/40 uppercase tracking-tight">XP</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FULL LEADERBOARD MODAL — iOS sticky header */}
      {showFullLeaderboard && (
        <div
          className="fixed inset-0 z-[400] flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto"
          style={{ backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(20px)" }}
        >
          <div
            className="rounded-3xl w-full max-w-md shadow-2xl my-auto sd-modal-card flex flex-col"
            style={{ backgroundColor: "rgba(10,11,16,0.95)", maxHeight: "min(720px, calc(100vh - 32px))" }}
          >
            <div className="sticky top-0 z-10 rounded-t-3xl px-4 sm:px-5 py-3 flex items-center gap-3 shrink-0 border-b border-white/[0.06]" style={{ backgroundColor: "rgba(10,11,16,0.95)" }}>
              <div className="w-9 h-9 rounded-full bg-white/[0.06] flex items-center justify-center shrink-0">
                <Trophy size={16} className="text-amber-300" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[15px] font-bold text-white tracking-tight">Leaderboard</h3>
                <p className="text-[10px] text-white/45 tracking-tight">
                  {leaderboardPreview.length} hunters · live updates
                </p>
              </div>
              <button
                onClick={() => setShowFullLeaderboard(false)}
                className="p-1.5 text-white/55 hover:text-white rounded-full hover:bg-white/[0.06] transition-colors"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div className="px-4 sm:px-5 pt-3 pb-2 sticky top-[64px] z-[5]" style={{ backgroundColor: "rgba(10,11,16,0.95)" }}>
              <div className="flex items-center gap-1 p-1 rounded-full bg-white/[0.04]">
                {([
                  { id: "all", label: "All Time" },
                  { id: "weekly", label: "This Week" },
                  { id: "guild", label: "Guild" },
                ] as const).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setLeaderboardFilter(tab.id)}
                    className={`flex-1 text-[11px] font-semibold py-1.5 rounded-full transition-all ${
                      leaderboardFilter === tab.id
                        ? "bg-white text-black"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto sd-modal-scroll px-4 sm:px-5 pb-4">
              {filteredLeaderboard.length === 0 ? (
                <div className="text-center py-12 text-white/40 text-[13px]">
                  No hunters in this category yet
                </div>
              ) : (
                <div className="rounded-2xl overflow-hidden border border-white/[0.06]" style={{ backgroundColor: "rgba(255,255,255,0.02)" }}>
                  {filteredLeaderboard.map((entry, idx) => {
                    const isYou = entry.isYou;
                    const rankColor =
                      entry.rank === 1 ? "#d4af37" :
                      entry.rank === 2 ? "#c0c0c0" :
                      entry.rank === 3 ? "#cd7f32" :
                      "rgba(255,255,255,0.3)";
                    return (
                      <div
                        key={`${entry.rank}-${idx}`}
                        className={`flex items-center gap-3 px-3.5 py-3 ${idx !== 0 ? "border-t border-white/[0.04]" : ""} ${
                          isYou ? "bg-amber-500/[0.06]" : ""
                        }`}
                      >
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold tabular-nums shrink-0"
                          style={{
                            backgroundColor: entry.rank <= 3 ? `${rankColor}15` : "rgba(255,255,255,0.05)",
                            color: entry.rank <= 3 ? rankColor : "rgba(255,255,255,0.45)",
                            border: entry.rank <= 3 ? `1px solid ${rankColor}40` : "1px solid rgba(255,255,255,0.08)",
                          }}
                        >
                          {entry.rank}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`text-[13px] font-semibold truncate ${isYou ? "text-amber-300" : "text-white"}`}>
                            {isYou ? "You" : entry.name}
                          </div>
                          <div className="text-[10px] text-white/40 truncate mt-0.5">
                            {entry.level}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-[13px] font-bold tabular-nums text-white">
                            {entry.xp >= 1000 ? `${(entry.xp / 1000).toFixed(1)}K` : entry.xp}
                          </div>
                          <div className="text-[9px] text-white/40 uppercase tracking-tight">XP</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {(() => {
                const me = leaderboardPreview.find((l) => l.isYou);
                if (!me) return null;
                return (
                  <div className="mt-4 p-3 rounded-2xl border border-white/[0.06]" style={{ backgroundColor: "rgba(255,255,255,0.02)" }}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 text-[12px] font-bold tabular-nums shrink-0">
                        {me.rank}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-semibold text-amber-300 truncate">Your rank</div>
                        <div className="text-[10px] text-white/45 mt-0.5">
                          Top {Math.round((me.rank / leaderboardPreview.length) * 100)}% globally
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[14px] font-bold tabular-nums text-white">{me.xp >= 1000 ? `${(me.xp / 1000).toFixed(1)}K` : me.xp}</div>
                        <div className="text-[9px] text-white/40 uppercase tracking-tight">XP</div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SOLO DOMINION • REWARDS — character evolution cards        */}
      {/* ============================================================ */}
      <div className="mt-8 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5 px-1">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={16} className="text-purple-400" />
              <span className="text-[10px] font-mono tracking-[3px] text-purple-300 uppercase font-bold">SOLO DOMINION</span>
              <span className="text-purple-400">✦</span>
              <span className="text-[10px] font-mono tracking-[3px] text-amber-300 uppercase font-bold">REWARDS</span>
            </div>
            <p className="text-xs sm:text-sm text-white/60 tracking-tight font-medium">
              Your character is forged in real-world discipline. Hit the next level to unlock new evolution cards.
            </p>
          </div>
          <button
            onClick={() => setShowWelcomeCardModal(true)}
            className="px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-mono text-xs font-black tracking-wider uppercase flex items-center gap-2 transition shadow-lg shadow-amber-900/40 shrink-0"
          >
            <Gift size={14} /> VIEW WELCOME REWARD
          </button>
        </div>

        {/* Character ladder visualization */}
        <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-black/60 via-purple-950/20 to-black/60 p-4 mb-5">
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
            {CHARACTER_TIERS.map((tier, idx) => {
              const unlocked = level >= tier.level;
              return (
                <React.Fragment key={tier.id || tier.name}>
                  <div
                    className={`shrink-0 flex flex-col items-center gap-1.5 transition ${unlocked ? "opacity-100" : "opacity-40"}`}
                    title={unlocked ? `Unlocked: ${tier.name}` : `Locked: Reach Level ${tier.level}`}
                  >
                    <div
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 overflow-hidden"
                      style={{
                        borderColor: unlocked ? tier.borderGlow : "rgba(255,255,255,0.15)",
                        boxShadow: unlocked ? `0 0 18px ${tier.borderGlow}` : "none",
                      }}
                    >
                      <img src={resolveImageUrl(tier.image)} alt={tier.name} onError={onImgError()} className="w-full h-full object-cover" />
                    </div>
                    <div className="text-[8px] font-mono tracking-wider uppercase font-bold text-center" style={{ color: unlocked ? "#fff" : "#888" }}>
                      Lv.{tier.level}
                    </div>
                    <div className="text-[9px] font-mono tracking-wider uppercase font-bold text-center" style={{ color: unlocked ? "#fbbf24" : "#666" }}>
                      {tier.name.split(" ")[0]}
                    </div>
                  </div>
                  {idx < CHARACTER_TIERS.length - 1 && (
                    <div className="flex-1 h-px min-w-[12px]" style={{
                      background: unlocked ? "linear-gradient(to right, rgba(168,85,247,0.5), rgba(99,102,241,0.5))" : "rgba(255,255,255,0.1)",
                    }} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* 4 Reward cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {CHARACTER_TIERS.slice(1).map((card) => {
            const isUnlocked = level >= card.level;
            return (
              <div
                key={card.name}
                onClick={() => setSelectedCard({ ...card, isUnlocked })}
                className={`relative cursor-pointer group transition-all duration-500 ${isUnlocked ? "hover:-translate-y-2" : ""}`}
                style={{ animation: "fadeInUp 0.6s ease-out" }}
              >
                <div
                  className={`relative aspect-[3/5] rounded-2xl overflow-hidden border-2 ${isUnlocked ? "" : "opacity-50 grayscale"}`}
                  style={{
                    borderColor: isUnlocked ? card.borderGlow : "rgba(255,255,255,0.1)",
                    boxShadow: isUnlocked
                      ? `0 0 30px ${card.borderGlow}, inset 0 0 60px rgba(0,0,0,0.4)`
                      : "none",
                  }}
                >
                  <img
                    src={resolveImageUrl(card.image)}
                    alt={card.title}
                    onError={onImgError()}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 25%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.85) 100%)",
                    }}
                  />
                  {/* Corner ornaments */}
                  <div className={`absolute top-0 left-0 w-12 h-12 ${card.ornamentColor} opacity-80`}>
                    <svg viewBox="0 0 50 50" fill="currentColor" className="w-full h-full">
                      <path d="M0 0 L18 0 L18 4 L4 4 L4 18 L0 18 Z M6 6 L14 6 L14 8 L8 8 L8 14 L6 14 Z" />
                      <circle cx="3" cy="3" r="1.5" />
                    </svg>
                  </div>
                  <div className={`absolute top-0 right-0 w-12 h-12 ${card.ornamentColor} opacity-80`}>
                    <svg viewBox="0 0 50 50" fill="currentColor" className="w-full h-full">
                      <path d="M50 0 L32 0 L32 4 L46 4 L46 18 L50 18 Z M36 6 L44 6 L44 8 L38 8 L38 14 L36 14 Z" />
                      <circle cx="47" cy="3" r="1.5" />
                    </svg>
                  </div>
                  <div className={`absolute bottom-0 left-0 w-12 h-12 ${card.ornamentColor} opacity-80`}>
                    <svg viewBox="0 0 50 50" fill="currentColor" className="w-full h-full">
                      <path d="M0 50 L18 50 L18 46 L4 46 L4 32 L0 32 Z M6 44 L14 44 L14 42 L8 42 L8 36 L6 36 Z" />
                      <circle cx="3" cy="47" r="1.5" />
                    </svg>
                  </div>
                  <div className={`absolute bottom-0 right-0 w-12 h-12 ${card.ornamentColor} opacity-80`}>
                    <svg viewBox="0 0 50 50" fill="currentColor" className="w-full h-full">
                      <path d="M50 50 L32 50 L32 46 L46 46 L46 32 L50 32 Z M36 44 L44 44 L44 42 L38 42 L38 36 L36 36 Z" />
                      <circle cx="47" cy="47" r="1.5" />
                    </svg>
                  </div>

                  <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10">
                    <div className={`px-3 py-0.5 rounded-full bg-black/60 backdrop-blur-sm border ${card.ornamentColor} text-[9px] font-mono font-bold tracking-[2px] uppercase`}>
                      {card.label}
                    </div>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 z-10">
                    <div className="text-center space-y-2">
                      <h3 className="font-serif font-black uppercase tracking-[1.5px] leading-[0.95] text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] text-lg sm:text-xl">
                        {card.name}
                      </h3>
                      <p className="text-[9.5px] font-mono tracking-[1.5px] uppercase text-white/70 font-bold drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
                        Unlocked at Level {card.level}
                      </p>
                      <p className="text-[10.5px] font-serif italic text-white/90 leading-snug whitespace-pre-line pt-2 drop-shadow-[0_1px_6px_rgba(0,0,0,0.95)]">
                        {card.quote}
                      </p>
                    </div>
                  </div>

                  {!isUnlocked && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20">
                      <div className="text-center space-y-1.5">
                        <div className="text-3xl">🔒</div>
                        <p className="text-[10px] font-mono font-bold text-white uppercase tracking-wider">
                          Reach Level {card.level}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                {isUnlocked && (
                  <div className="text-center mt-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[9px] font-mono font-bold uppercase tracking-wider">
                      <Zap size={9} /> Unlocked
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ============================================================ */}
      {/* UNIFIED WORKOUT TRACKER MODAL — Push-ups, Squats, Plank, Walk, Meditation */}
      {/* ============================================================ */}
      {workoutMission && detectWorkoutType(workoutMission.title + " " + (workoutMission.desc || "") + " " + (workoutMission.id || "")) && (
        <WorkoutTracker
          workoutType={detectWorkoutType(workoutMission.title + " " + (workoutMission.desc || "") + " " + (workoutMission.id || ""))!}
          missionTitle={workoutMission.title}
          targetValue={workoutMission.targetVal || 100}
          onComplete={(state) => {
            handleWorkoutComplete({
              ...state,
              metadata: {
                ...state.metadata,
                isTimeBased: ["plank", "meditation"].includes(state.type),
              },
            });
          }}
          onCancel={() => setWorkoutMission(null)}
        />
      )}

      {/* ============================================================ */}
      {/* EXISTING PROOF MODAL — kept fully functional                */}
      {/* ============================================================ */}
      {proofMission && (
        <div
          className="fixed inset-0 z-[300] flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto"
          style={{ backgroundColor: "rgba(0,0,0,0.92)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}
        >
          <div
            className="bg-white text-black w-full sm:max-w-lg sm:rounded-3xl shadow-2xl flex flex-col my-auto sd-modal-card"
            style={{ border: "1px solid #000", maxHeight: "min(720px, calc(100vh - 32px))" }}
          >
            <div
              className="px-5 sm:px-7 pt-5 sm:pt-6 pb-4 border-b flex items-start gap-3 shrink-0"
              style={{ borderColor: "#000", backgroundColor: "#fff", position: "sticky", top: 0, zIndex: 10 }}
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0" style={{ backgroundColor: "#000", color: "#fff" }}>
                {proofMission.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[9px] font-mono tracking-[2.5px] uppercase font-bold" style={{ color: "#666" }}>
                  PROOF REQUIRED
                </div>
                <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-black leading-tight truncate">
                  {proofMission.title}
                </h3>
              </div>
              <button
                onClick={closeProofModal}
                className="p-2 text-black/60 hover:text-black hover:bg-black/5 rounded-full transition shrink-0"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto sd-modal-scroll" style={{ WebkitOverflowScrolling: "touch", minHeight: 0 }}>

            {proofStep === "choose" && (
              <div className="px-5 sm:px-6 py-4 space-y-3">
                <div className="p-2.5 rounded-xl border" style={{ borderColor: "#000", backgroundColor: "#fafafa" }}>
                  <p className="text-[11px] font-mono leading-relaxed" style={{ color: "#333" }}>
                    🤖 <strong className="text-black">AI Oracle says:</strong> Submit{" "}
                    <strong className="text-black">ANY ONE</strong> of the three proofs below to complete "<span className="text-black">{proofMission.title}</span>". AI will verify if your proof is real and matches the task.
                  </p>
                </div>
                <div className="space-y-2">
                  {[
                    { id: "selfie", emoji: "📸", title: "Option 1 — Selfie Photo", desc: "Upload a clear selfie of you actively performing the task" },
                    { id: "video", emoji: "🎥", title: "Option 2 — Video Oath", desc: "Record a 30-sec video swearing on the universe you did the task" },
                    { id: "text", emoji: "✍️", title: "Option 3 — Text Universe Oath", desc: "Write a powerful 10+ word oath affirming you completed the task" },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setProofStep(opt.id as any)}
                      className="w-full p-3 rounded-2xl border-2 text-left transition group hover:shadow-lg active:scale-[0.99]"
                      style={{ borderColor: "#000", backgroundColor: "#fff" }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0" style={{ backgroundColor: "#000", color: "#fff" }}>{opt.emoji}</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-black uppercase text-black truncate">{opt.title}</div>
                          <div className="text-[10px] font-mono mt-0.5" style={{ color: "#555" }}>{opt.desc}</div>
                        </div>
                        <span className="text-base" style={{ color: "#000" }}>→</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {proofStep === "selfie" && (
              <div className="px-5 sm:px-6 py-4 space-y-3">
                <div className="p-2.5 rounded-xl border" style={{ borderColor: "#000", backgroundColor: "#fafafa" }}>
                  <p className="text-[11px] font-mono leading-relaxed text-black">📸 Upload a <strong>clear selfie</strong> showing you in the act of completing "<strong>{proofMission.title}</strong>".</p>
                </div>
                {proofSelfieBase64 ? (
                  <div className="space-y-2">
                    <div className="relative rounded-2xl overflow-hidden border-2 aspect-[3/4] max-h-64 mx-auto" style={{ borderColor: "#000" }}>
                      <img src={proofSelfieBase64} alt="Selfie proof" className="w-full h-full object-cover" />
                      <button onClick={() => setProofSelfieBase64(null)} className="absolute top-2 right-2 p-1.5 rounded-full text-white" style={{ backgroundColor: "rgba(0,0,0,0.7)" }} aria-label="Remove selfie">
                        <X size={14} />
                      </button>
                    </div>
                    <p className="text-[10px] font-mono text-center font-bold text-black">✓ SELFIE CAPTURED</p>
                  </div>
                ) : (
                  <label className="block">
                    <div className="rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition" style={{ borderColor: "#000", backgroundColor: "#fff" }}>
                      <div className="text-4xl mb-1.5">📷</div>
                      <p className="text-xs font-bold text-black">Tap to take or upload selfie</p>
                      <p className="text-[10px] font-mono mt-0.5" style={{ color: "#555" }}>JPG/PNG • max 8MB</p>
                      <input type="file" accept="image/*" capture="user" className="hidden" onChange={handleSelfieFile} />
                    </div>
                  </label>
                )}
                <div className="flex gap-2 pt-1">
                  <button onClick={() => setProofStep("choose")} className="flex-1 py-2 rounded-xl text-xs font-bold border-2 text-black" style={{ borderColor: "#000", backgroundColor: "#fff" }}>← Back</button>
                  <button onClick={submitProofForVerification} disabled={!proofSelfieBase64 || proofVerifying} className="flex-1 py-2 rounded-xl text-xs font-black uppercase text-white disabled:opacity-30" style={{ backgroundColor: "#000" }}>
                    {proofVerifying ? "Verifying..." : "Submit →"}
                  </button>
                </div>
              </div>
            )}

            {proofStep === "video" && (
              <div className="px-5 sm:px-6 py-4 space-y-3">
                <div className="p-2.5 rounded-xl border" style={{ borderColor: "#000", backgroundColor: "#fafafa" }}>
                  <p className="text-[11px] font-mono leading-relaxed text-black">🎥 Record a <strong>30-second oath video</strong> swearing you completed "<strong>{proofMission.title}</strong>".</p>
                </div>
                <div className="relative rounded-2xl overflow-hidden border-2 aspect-[3/4] max-h-64 mx-auto" style={{ borderColor: "#000", backgroundColor: "#000" }}>
                  {proofVideoUrl ? (
                    <>
                      <video src={proofVideoUrl} controls className="w-full h-full object-cover" />
                      <button onClick={() => { if (proofVideoUrl) URL.revokeObjectURL(proofVideoUrl); setProofVideoUrl(null); setProofVideoBlob(null); }} className="absolute top-2 right-2 p-1.5 rounded-full text-white" style={{ backgroundColor: "rgba(0,0,0,0.7)" }} aria-label="Remove video">
                        <X size={14} />
                      </button>
                    </>
                  ) : (
                    <>
                      <video ref={videoPreviewRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                      {!isRecordingVideo && (
                        <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.7)" }}>
                          <div className="text-center space-y-1.5">
                            <div className="text-4xl">🎥</div>
                            <p className="text-[10px] font-mono text-white">Camera preview will appear here</p>
                          </div>
                        </div>
                      )}
                      {isRecordingVideo && (
                        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-full animate-pulse">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#000" }} />
                          <span className="text-[10px] font-mono text-black font-bold">RECORDING</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
                <div className="flex gap-2">
                  {!isRecordingVideo && !proofVideoUrl && (
                    <button onClick={startVideoRecording} disabled={!videoRecorderSupported} className="flex-1 py-2.5 rounded-xl text-xs font-black uppercase text-white flex items-center justify-center gap-2 disabled:opacity-30" style={{ backgroundColor: "#000" }}>
                      <div className="w-2.5 h-2.5 rounded-full bg-white" /> Start Recording
                    </button>
                  )}
                  {isRecordingVideo && (
                    <button onClick={stopVideoRecording} className="flex-1 py-2.5 rounded-xl text-xs font-black uppercase text-white flex items-center justify-center gap-2" style={{ backgroundColor: "#000" }}>
                      <div className="w-2.5 h-2.5 rounded-sm bg-white" /> Stop Recording
                    </button>
                  )}
                  {proofVideoUrl && (
                    <button onClick={submitProofForVerification} disabled={proofVerifying} className="flex-1 py-2.5 rounded-xl text-xs font-black uppercase text-white" style={{ backgroundColor: "#000" }}>
                      {proofVerifying ? "Verifying..." : "Submit →"}
                    </button>
                  )}
                </div>
                <button onClick={() => setProofStep("choose")} className="w-full py-1.5 rounded-xl text-xs font-bold border-2 text-black" style={{ borderColor: "#000", backgroundColor: "#fff" }}>← Back</button>
              </div>
            )}

            {proofStep === "text" && (
              <div className="px-5 sm:px-6 py-4 space-y-3">
                <div className="p-2.5 rounded-xl border" style={{ borderColor: "#000", backgroundColor: "#fafafa" }}>
                  <p className="text-[11px] font-mono leading-relaxed text-black">✍️ Pick a template and customize your <strong>universe oath</strong>. Min <strong>10 words</strong>.</p>
                </div>
                <div>
                  <label className="text-[10px] font-mono block mb-1.5 font-bold uppercase text-black tracking-wider">📜 Pick Template</label>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                    {OATH_TEMPLATES.map((tpl, i) => {
                      const tplWithMission = tpl.replace("[MISSION]", `"${proofMission.title}"`);
                      const isSelected = proofTextOath === tplWithMission;
                      return (
                        <button key={i} onClick={() => { setProofTextOath(tplWithMission); playSFX("click"); }} className="w-full text-left p-2.5 rounded-xl text-[10.5px] font-mono leading-relaxed border-2 transition" style={{ borderColor: "#000", backgroundColor: isSelected ? "#000" : "#fff", color: isSelected ? "#fff" : "#333" }}>
                          <span className="font-bold">TEMPLATE {i + 1}:</span> {tplWithMission}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-mono block mb-1.5 font-bold uppercase text-black tracking-wider">✏️ Your Oath (customize as you wish)</label>
                  <textarea value={proofTextOath} onChange={(e) => setProofTextOath(e.target.value)} rows={3} className="w-full rounded-xl p-3 text-[11.5px] font-mono leading-relaxed border-2 text-black" style={{ borderColor: "#000", backgroundColor: "#fff" }} placeholder="Type your universe oath here..." />
                  <p className="text-[10px] font-mono mt-1" style={{ color: "#666" }}>
                    Word count: {proofTextOath.trim() ? proofTextOath.trim().split(/\\s+/).length : 0} (min 10)
                  </p>
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={() => setProofStep("choose")} className="flex-1 py-2.5 rounded-xl text-xs font-bold border-2 text-black" style={{ borderColor: "#000", backgroundColor: "#fff" }}>← Back</button>
                  <button onClick={submitProofForVerification} disabled={proofVerifying || proofTextOath.trim().split(/\\s+/).length < 10} className="flex-1 py-2.5 rounded-xl text-xs font-black uppercase text-white disabled:opacity-30" style={{ backgroundColor: "#000" }}>
                    {proofVerifying ? "Verifying..." : "Submit →"}
                  </button>
                </div>
              </div>
            )}

            {proofStep === "verifying" && (
              <div className="px-5 sm:px-6 py-8 text-center">
                <div className="relative w-20 h-20 mx-auto mb-5">
                  <div className="absolute inset-0 rounded-full border-4" style={{ borderColor: "#e5e5e5" }} />
                  <div className="absolute inset-0 rounded-full border-4 border-transparent animate-spin" style={{ borderTopColor: "#000" }} />
                  <div className="absolute inset-3 rounded-full flex items-center justify-center text-3xl" style={{ backgroundColor: "#000", color: "#fff" }}>🤖</div>
                </div>
                <h3 className="text-base font-black uppercase tracking-tight text-black">AI Oracle Verifying</h3>
                <p className="text-[11px] mt-2 font-mono" style={{ color: "#555" }}>Analyzing your proof for authenticity...</p>
                <p className="text-[10px] mt-1 font-mono" style={{ color: "#888" }}>The universe is watching. Truth prevails.</p>
              </div>
            )}

            {proofStep === "result" && proofResult && (
              <div className="px-5 sm:px-6 py-4 space-y-3">
                <div className="p-4 rounded-2xl border-2 text-center" style={{ borderColor: "#000", backgroundColor: proofResult.verified ? "#000" : "#fff", color: proofResult.verified ? "#fff" : "#000" }}>
                  <div className="text-5xl mb-2">{proofResult.verified ? "✓" : "✕"}</div>
                  <h3 className="text-base font-black uppercase tracking-tight">{proofResult.verified ? "Universe Accepted" : "Proof Rejected"}</h3>
                  <p className="text-[11px] mt-2 font-mono leading-relaxed opacity-90">{proofResult.feedback}</p>
                  <div className="mt-3 inline-flex items-center gap-2 text-[10px] font-mono px-3 py-1.5 rounded-full" style={{ backgroundColor: proofResult.verified ? "rgba(255,255,255,0.15)" : "#f5f5f5", color: proofResult.verified ? "#fff" : "#000" }}>
                    <span className="opacity-70">SCORE:</span>
                    <span className="font-black text-base">{proofResult.score}/100</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {!proofResult.verified && (
                    <button onClick={() => setProofStep("choose")} className="flex-1 py-3 rounded-xl text-xs font-bold border-2 text-black" style={{ borderColor: "#000", backgroundColor: "#fff" }}>Try Again</button>
                  )}
                  <button onClick={closeProofModal} className="flex-1 py-3 rounded-xl text-xs font-black uppercase text-white" style={{ backgroundColor: "#000" }}>
                    {proofResult.verified ? "Continue →" : "Close"}
                  </button>
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* LEGACY MODALS (Welcome, Streaks, etc.) — still functional  */}
      {/* ============================================================ */}
      {showMissionsModal && (
        <div className="fixed inset-0 z-[500] flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto" style={{ backgroundColor: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
          <div className="bg-[#121124] border border-white/15 rounded-3xl w-full max-w-lg p-4 sm:p-5 space-y-3 shadow-2xl my-auto sd-modal-card" style={{ maxHeight: "min(640px, calc(100vh - 32px))", overflowY: "auto" }}>
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Target size={18} className="text-purple-400" />
                <h3 className="text-lg font-bold text-white">Today's Quests</h3>
              </div>
              <button onClick={() => setShowMissionsModal(false)} className="text-white/50 hover:text-white"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              {quests.map((q) => (
                <div key={q.id} className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{CATEGORY_ICON[q.category]}</span>
                    <div>
                      <div className="text-sm font-bold text-white">{q.title}</div>
                      <div className="text-xs text-white/50">{q.description}</div>
                    </div>
                  </div>
                  {!q.completed ? (
                    <button onClick={() => openProofModal(q)} className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition">
                      Complete (+{q.xp} XP)
                    </button>
                  ) : (
                    <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle size={14} /> Done
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Stubs for legacy modals that we keep reachable but hide by default
          (welcome card, sync, etc. — full logic lives below as standalone
          functions so the existing data flow keeps working). */}
      {showWelcomeCardModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[300] flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-[#121124] border border-emerald-500/50 rounded-[28px] w-full max-w-lg shadow-2xl relative my-auto sd-modal-card flex flex-col" style={{ maxHeight: "min(640px, calc(100vh - 32px))" }}>
            {/* STICKY HEADER */}
            <div className="sticky top-0 z-10 bg-[#121124] rounded-t-[28px] border-b border-emerald-500/30 px-4 sm:px-5 py-3 flex items-start gap-3 shrink-0">
              <div className="flex-1 min-w-0">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-mono font-bold tracking-wider uppercase inline-flex items-center gap-1.5">
                  <Sparkles size={11} className="text-amber-300 animate-spin" /> WELCOME REWARD UNLOCKED
                </span>
                <h2 className="text-lg sm:text-xl font-black text-white uppercase font-serif tracking-wide leading-tight mt-1">SEEKER TRAINEE CARD</h2>
                <p className="text-[10px] text-emerald-200/80 font-mono">Issued upon logging into Sigma Menifest OS • Level 1 Milestone</p>
              </div>
              <button
                onClick={() => { try { localStorage.setItem("welcome_card_claimed_v1", "true"); } catch (e) {} setShowWelcomeCardModal(false); }}
                className="p-1.5 text-zinc-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition shrink-0"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* SCROLLABLE CONTENT */}
            <div className="flex-1 overflow-y-auto sd-modal-scroll px-4 sm:px-5 py-4 space-y-3">
              <div className="relative rounded-2xl border border-emerald-500/50 bg-gradient-to-br from-zinc-900 via-zinc-950 to-emerald-950 p-4 shadow-2xl text-left max-w-sm mx-auto overflow-hidden">
                <img src={resolveImageUrl(CHARACTER_TIERS[0].image)} alt="Seeker" onError={onImgError()} className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-luminosity pointer-events-none" />
                <div className="relative z-10 space-y-2">
                  <div className="text-[9px] font-mono tracking-[2px] text-emerald-400 font-bold uppercase">SIGMA MENIFEST OS • TIER I</div>
                  <div className="text-xs font-black text-white font-mono uppercase">SEEKER BLACK CARD</div>
                  <div className="text-[10px] text-zinc-300 font-mono italic leading-snug">"{CHARACTER_TIERS[0].quote}"</div>
                  <div className="pt-2 border-t border-white/10 text-[9px] font-mono text-zinc-400 flex justify-between">
                    <span className="uppercase font-bold text-white">{profile?.name || "WARRIOR TRAINEE"}</span>
                    <span className="text-emerald-400 font-bold">UNLOCKED</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => { try { localStorage.setItem("welcome_card_claimed_v1", "true"); } catch (e) {} setShowWelcomeCardModal(false); playSFX("levelup"); showToast("🎉 WELCOME SEEKER CARD CLAIMED!"); }}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 text-black font-mono text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-950/80 hover:brightness-110 transition flex items-center justify-center gap-2"
              >
                <Award size={16} /> CLAIM WELCOME CARD & ENTER
              </button>
            </div>
          </div>
        </div>
      )}

      {showSyncModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[300] flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-[#121124] border border-purple-500/50 rounded-[28px] w-full max-w-md shadow-2xl relative my-auto sd-modal-card flex flex-col" style={{ maxHeight: "min(640px, calc(100vh - 32px))" }}>
            {/* STICKY HEADER */}
            <div className="sticky top-0 z-10 bg-[#121124] rounded-t-[28px] border-b border-purple-500/30 px-4 sm:px-5 py-3 flex items-start gap-3 shrink-0">
              <div className="flex-1 min-w-0">
                <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/40 text-purple-300 text-[10px] font-mono font-bold tracking-wider uppercase inline-flex items-center gap-1.5">
                  <Calendar size={11} className="text-amber-400 animate-spin" /> QUANTUM TIMELINE SYNCHRONIZER
                </span>
                <h3 className="text-base sm:text-lg font-black text-white font-serif uppercase tracking-wide leading-tight mt-1">Sync Commitment Streak</h3>
                <p className="text-[10px] text-white/50 leading-relaxed mt-0.5">Manually align your real commitment history with the cloud database. The system seeds authentic historical daily events.</p>
              </div>
              <button onClick={() => setShowSyncModal(false)} className="p-1.5 text-white/50 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition shrink-0" aria-label="Close">
                <X size={16} />
              </button>
            </div>

            {/* SCROLLABLE CONTENT */}
            <div className="flex-1 overflow-y-auto sd-modal-scroll px-4 sm:px-5 py-4 space-y-3">
              <div className="bg-black/40 p-3.5 rounded-2xl border border-white/5 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono font-bold text-zinc-400">TARGET STREAK DAYS</span>
                  <span className="text-2xl font-black text-emerald-400 font-mono tracking-tight tabular-nums">{targetStreakDays} Days</span>
                </div>
                <input type="range" min="1" max="100" value={targetStreakDays} onChange={(e) => { playSFX("click"); setTargetStreakDays(Number(e.target.value)); }} className="w-full h-1.5 bg-purple-950 rounded-lg appearance-none cursor-pointer accent-purple-500" />
                <div className="flex justify-between text-[9px] font-mono text-zinc-500">
                  <span>1 Day</span>
                  <span>42 Days (Milestone)</span>
                  <span>100 Days</span>
                </div>
              </div>
              <button onClick={handleSyncStreak} disabled={isSyncing} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white font-mono text-[11px] font-black uppercase tracking-wider shadow-lg shadow-purple-950/80 transition flex items-center justify-center gap-2 disabled:opacity-50">
                {isSyncing ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />ALIGNING...</> : <><Calendar size={12} className="text-amber-400 animate-pulse" />WRITE TIMELINE TO DATABASE</>}
              </button>
              <span className="text-[9px] font-mono text-zinc-500 block text-center">⚠️ Writes to the official cloud database node. Action is irreversible.</span>
            </div>
          </div>
        </div>
      )}

      {selectedStreak && (
        <div className="fixed inset-0 z-[500] flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto" style={{ backgroundColor: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
          <div className="bg-[#121124] border border-white/15 rounded-3xl w-full max-w-md p-4 sm:p-5 space-y-3 shadow-2xl my-auto sd-modal-card" style={{ maxHeight: "min(520px, calc(100vh - 32px))", overflowY: "auto" }}>
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{selectedStreak.icon}</span>
                <div>
                  <h3 className="text-base font-bold text-white">{selectedStreak.title}</h3>
                  <span className="text-[10px] font-mono text-purple-300">{selectedStreak.cat}</span>
                </div>
              </div>
              <button onClick={() => setSelectedStreak(null)} className="text-white/50 hover:text-white"><X size={18} /></button>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-white/60">Current Progress</span>
                <span className="font-bold text-white">{selectedStreak.pct}%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-purple-500 transition-all duration-500" style={{ width: `${selectedStreak.pct}%` }} />
              </div>
            </div>
            <div className="space-y-2">
              <span className="text-[11px] font-mono text-white/50 block">ADVANCE STREAK:</span>
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => advanceStreak(selectedStreak.id, 5)} className="py-2.5 bg-white/5 hover:bg-white/15 border border-white/10 rounded-xl text-xs font-bold text-white">+5% Boost</button>
                <button onClick={() => advanceStreak(selectedStreak.id, 10)} className="py-2.5 bg-purple-600/80 hover:bg-purple-500 rounded-xl text-xs font-bold text-white">+10% Boost</button>
                <button onClick={() => advanceStreak(selectedStreak.id, 25)} className="py-2.5 bg-amber-500 hover:bg-amber-400 text-black rounded-xl text-xs font-bold">+25% Sprint</button>
              </div>
            </div>
            <button onClick={() => setSelectedStreak(null)} className="w-full py-2.5 bg-white/10 text-white rounded-xl text-xs font-semibold">Done</button>
          </div>
        </div>
      )}

      {selectedCard && (
        <div className="fixed inset-0 z-[300] flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto" style={{ backgroundColor: "rgba(0,0,0,0.92)", backdropFilter: "blur(12px)" }}>
          <div
            className="bg-[#0A0612] border-2 rounded-3xl w-full max-w-md shadow-2xl relative my-auto sd-modal-card flex flex-col"
            style={{ borderColor: selectedCard.borderGlow, boxShadow: `0 0 40px ${selectedCard.borderGlow}`, maxHeight: "min(640px, calc(100vh - 32px))" }}
          >
            {/* STICKY HEADER */}
            <div className="sticky top-0 z-10 bg-[#0A0612] rounded-t-3xl border-b px-4 sm:px-5 py-3 flex items-start gap-3 shrink-0" style={{ borderColor: selectedCard.borderGlow }}>
              <div className="flex-1 min-w-0 text-center">
                <span className={`text-[10px] font-mono font-bold tracking-[3px] uppercase ${selectedCard.ornamentColor}`}>{selectedCard.label}</span>
                <h3 className="text-lg sm:text-xl font-serif font-black uppercase tracking-wide text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] mt-0.5">{selectedCard.name}</h3>
                <p className="text-[10px] font-mono text-white/50">UNLOCKED AT LEVEL {selectedCard.level}</p>
              </div>
              <button onClick={() => setSelectedCard(null)} className="p-1.5 text-white/50 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition shrink-0" aria-label="Close">
                <X size={16} />
              </button>
            </div>

            {/* SCROLLABLE CONTENT */}
            <div className="flex-1 overflow-y-auto sd-modal-scroll px-4 sm:px-5 py-4 space-y-3">
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border-2" style={{ borderColor: selectedCard.borderGlow }}>
                <img src={resolveImageUrl(selectedCard.image)} alt={selectedCard.name} onError={onImgError()} className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.85) 100%)" }} />
                <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
                  <p className="text-[11px] font-serif italic text-white text-center leading-snug whitespace-pre-line drop-shadow-[0_1px_6px_rgba(0,0,0,0.95)]">{selectedCard.quote}</p>
                </div>
              </div>
              <div className="space-y-2 bg-black/40 p-3 rounded-2xl border border-white/10">
                <span className="text-[10px] font-mono font-bold text-amber-300 uppercase tracking-wider block">PERKS & MULTIPLIERS</span>
                <ul className="space-y-1.5 text-[11px] text-zinc-200 font-mono">
                  {(selectedCard.perks || []).map((p: string, i: number) => (
                    <li key={i} className="flex items-center gap-2">
                      <Sparkles size={12} className="text-emerald-400 shrink-0" />{p}
                    </li>
                  ))}
                </ul>
              </div>
              <button onClick={() => setSelectedCard(null)} className="w-full py-3 rounded-xl text-xs font-black uppercase text-white" style={{ backgroundColor: selectedCard.borderGlow, color: "#000" }}>
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// QuestBoard — full-bleed quest card grid with main/side/discipline
// and boss battles. Rendered inline by SoloDominion.
const QuestBoard: React.FC<{
  quests: Mission[];
  bossQuests: Mission[];
  onOpenQuest: (q: Mission) => void;
  isUnlockedFor: (level: number) => boolean;
  rankColor: typeof RANK_COLOR;
  rankLabel: typeof RANK_LABEL;
  categoryIcon: typeof CATEGORY_ICON;
  categoryLabel: typeof CATEGORY_LABEL;
}> = ({ quests, bossQuests, onOpenQuest, rankColor, rankLabel, categoryIcon, categoryLabel }) => {
  const mainQuests = quests.filter((q) => q.questType === "main");
  const sideQuests = quests.filter((q) => q.questType === "side");
  const disciplineQuests = quests.filter((q) => q.questType === "discipline");

  const renderQuest = (q: Mission) => {
    const r = (q.rank || "E") as QuestRank;
    // Anime character per rank
    const RANK_ART: Record<QuestRank, string> = {
      E: "/images/sd_jin_hero.jpg",
      D: "/images/sd_jin_hero.jpg",
      C: "/images/sd_igris_red.jpg",
      B: "/images/sd_jin_minimal.jpg",
      A: "/images/sd_jin_shadow.jpg",
    };
    const art = RANK_ART[r] || RANK_ART.E;
    return (
      <button
        key={q.id}
        onClick={() => !q.completed && onOpenQuest(q)}
        disabled={q.completed}
        className={`sd-card-border group relative text-left w-full rounded-2xl overflow-hidden bg-black/65 backdrop-blur-sm ${q.completed ? "opacity-70" : ""}`}
      >
        {/* Anime portrait strip on the left */}
        <div className="flex items-stretch">
          <div className="relative w-[68px] sm:w-[78px] shrink-0 overflow-hidden">
            <img
              src={resolveImageUrl(art)}
              alt={r}
              onError={onImgError()}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ objectPosition: "center 20%" }}
            />
            {/* Cinematic gradient over the image */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: "linear-gradient(to right, rgba(0,0,0,0.0) 60%, rgba(0,0,0,0.85) 100%), linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 50%)" }}
            />
            {/* Rank letter embossed */}
            <div className="absolute bottom-1.5 left-1.5 sd-royal-font text-[20px] font-bold leading-none" style={{ color: rankColor[r], textShadow: "0 1px 4px rgba(0,0,0,0.9)" }}>
              {r}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 p-3.5 sm:p-4">
            <div className="flex items-start gap-2.5">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                  <span
                    className="sd-rank-badge text-[9px] px-1.5 py-0.5"
                    style={{ color: rankColor[r], border: `1px solid ${rankColor[r]}50`, backgroundColor: `${rankColor[r]}10` }}
                  >
                    {rankLabel[r]}
                  </span>
                  <span className="sd-mono-font text-[9px] text-white/40 uppercase tracking-wider">{categoryLabel[q.category]}</span>
                </div>
                <div className={`sd-royal-font text-[15px] sm:text-[16px] font-semibold leading-tight ${q.completed ? "text-emerald-300/80 line-through" : "text-white"}`}>
                  {q.title}
                </div>
                <p className="sd-body-font text-[11px] text-white/55 mt-1 leading-snug line-clamp-2 font-light">
                  {q.description}
                </p>
              </div>
              <div className="text-right shrink-0">
                <div className="sd-royal-font text-[18px] font-bold text-amber-300/90 tabular-nums leading-none">+{q.xp}</div>
                <div className="sd-rank-badge text-[8.5px] text-white/40 mt-0.5">XP</div>
              </div>
            </div>
            {q.completed ? (
              <div className="mt-2.5 flex items-center gap-1.5 sd-mono-font text-[10px] font-bold text-emerald-300/80 uppercase tracking-wider">
                <CheckCircle size={12} /> Quest Complete
              </div>
            ) : (
              <div className="mt-2.5 flex items-center justify-between">
                <span className="sd-rank-badge text-[9.5px] text-amber-200/70">Submit proof to claim</span>
                <span className="text-white/30 text-sm">→</span>
              </div>
            )}
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 relative z-10">
      {/* Main + Side Quests */}
      <div className="lg:col-span-2 space-y-5">
        {mainQuests.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-3">
              <Flame size={14} className="text-amber-300" />
              <span className="sd-rank-badge text-[10px] text-amber-200/90">Main Quests</span>
              <div className="flex-1 h-px sd-divider" />
              <span className="sd-mono-font text-[10px] text-white/40 tabular-nums">{mainQuests.length}</span>
            </div>
            <div className="space-y-2.5">{mainQuests.map(renderQuest)}</div>
          </div>
        )}
        {sideQuests.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-3">
              <Target size={14} className="text-zinc-300" />
              <span className="sd-rank-badge text-[10px] text-zinc-200/80">Side Quests</span>
              <div className="flex-1 h-px sd-divider" />
              <span className="sd-mono-font text-[10px] text-white/40 tabular-nums">{sideQuests.length}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">{sideQuests.map(renderQuest)}</div>
          </div>
        )}
        {disciplineQuests.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-3">
              <Zap size={14} className="text-amber-300" />
              <span className="sd-rank-badge text-[10px] text-amber-200/90">Discipline Quests</span>
              <div className="flex-1 h-px sd-divider" />
              <span className="sd-mono-font text-[10px] text-white/40 tabular-nums">{disciplineQuests.length}</span>
            </div>
            <div className="space-y-2.5">{disciplineQuests.map(renderQuest)}</div>
          </div>
        )}
      </div>

      {/* Boss Battle panel */}
      <div className="lg:col-span-1">
        <div
          className="rounded-2xl border border-red-900/40 p-4 sticky top-4 bg-black/70 backdrop-blur-md relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(239,68,68,0.5), transparent)" }} />
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg overflow-hidden border border-red-900/60 shrink-0">
                <img src={resolveImageUrl("/images/sd_jin_shadow.jpg")} alt="Boss" onError={onImgError()} className="w-full h-full object-cover" />
              </div>
              <div>
                <div className="sd-rank-badge text-[10px] text-red-200/80">Boss Battles</div>
                <div className="sd-body-font text-[10px] text-white/40 mt-0.5">High-stakes challenges</div>
              </div>
            </div>
            <span className="px-2 py-0.5 border border-red-500/40 text-red-200/80 sd-mono-font text-[9px] font-bold uppercase tracking-wider">XP+</span>
          </div>
          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
            {bossQuests.map((b) => (
              <button
                key={b.id}
                onClick={() => !b.completed && onOpenQuest(b)}
                disabled={b.completed}
                className={`sd-card-border w-full text-left rounded-xl overflow-hidden bg-black/50 group ${
                  b.completed ? "border-emerald-700/40 opacity-70" : ""
                }`}
              >
                <div className="flex items-stretch">
                  <div className="relative w-14 shrink-0 overflow-hidden">
                    <img
                      src={resolveImageUrl(b.bossImage || "/images/sd_jin_minimal.jpg")}
                      alt={b.title}
                      onError={onImgError()}
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{ objectPosition: "center 25%" }}
                    />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to right, transparent 50%, rgba(0,0,0,0.85) 100%)" }} />
                  </div>
                  <div className="flex-1 min-w-0 p-2.5">
                    <div className="sd-royal-font text-[11.5px] font-semibold text-white leading-tight line-clamp-1">{b.title}</div>
                    <p className="sd-body-font text-[9.5px] text-white/50 mt-0.5 leading-snug line-clamp-2 font-light">{b.description}</p>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <span
                        className="sd-rank-badge text-[8.5px] px-1.5 py-0.5"
                        style={{ color: rankColor[b.rank || "B"], border: `1px solid ${rankColor[b.rank || "B"]}50`, backgroundColor: `${rankColor[b.rank || "B"]}10` }}
                      >
                        {rankLabel[b.rank || "B"]}
                      </span>
                      <span className="sd-royal-font text-[11px] text-amber-300/90 font-bold tabular-nums">+{b.xp} XP</span>
                    </div>
                  </div>
                </div>
                {b.completed && (
                  <div className="px-2.5 pb-2 flex items-center gap-1 sd-mono-font text-[9.5px] font-bold text-emerald-300/80 uppercase tracking-wider">
                    <CheckCircle size={11} /> Slain
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};


export default SoloDominion;

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X, Camera, RotateCw, CheckCircle2, XCircle, Loader2, Sparkles,
  Image as ImageIcon, AlertTriangle, Eye
} from "lucide-react";
import { TASK_BY_ID, type TaskId, PROOF_PASS_SCORE, MAX_PROOF_ATTEMPTS_PER_DAY } from "../../lib/taskCatalog";
import { claimTask, type ClaimResult } from "../../lib/taskClaimApi";

// iOS 17 + Solo Leveling ARISE design tokens
const TEXT_PRIMARY = "#ffffff";
const TEXT_SECONDARY = "rgba(235,235,245,0.62)";
const TEXT_TERTIARY = "rgba(235,235,245,0.32)";
const SURFACE = "#0a0a0a";
const HAIRLINE = "rgba(255,255,255,0.08)";
const HAIRLINE_STRONG = "rgba(255,255,255,0.18)";
const ORANGE = "#ff9f0a";
const ORANGE_DARK = "#ff7a00";
const IOS_RED = "#ff453a";
const IOS_GREEN = "#34c759";

/** Any task whose proofMode is "camera" (see src/lib/taskCatalog.ts). */
export type ProofTaskId = TaskId;

interface TaskProofCameraProps {
  taskId: ProofTaskId;
  taskTitle: string;
  taskDescription: string;
  /** Attempts already used today (from /api/tasks/today), for the counter. */
  attemptsUsed?: number;
  /**
   * Called ONLY after the server verified the proof AND awarded XP.
   * The client never writes XP itself.
   */
  onVerified: (result: {
    verified: true;
    score: number;
    feedback: string;
    xpAwarded: number;
    newLevel?: number;
    leveledUp?: boolean;
  }) => void;
  onClose: () => void;
}

export const TaskProofCamera: React.FC<TaskProofCameraProps> = ({
  taskId,
  taskTitle,
  taskDescription,
  attemptsUsed = 0,
  onVerified,
  onClose,
}) => {
  const spec = TASK_BY_ID[taskId];
  const guidance = { label: spec.title, rules: spec.rules };

  // ----- STATE -----
  const [mode, setMode] = useState<"capture" | "preview" | "verifying" | "result">("capture");
  const [streamReady, setStreamReady] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<ClaimResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">(spec.camera);
  const [attempts, setAttempts] = useState<number>(attemptsUsed);
  const attemptsLeft = Math.max(0, MAX_PROOF_ATTEMPTS_PER_DAY - attempts);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // ----- LIVE CAMERA -----
  const startCamera = useCallback(async () => {
    setStreamError(null);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStreamReady(true);
    } catch (e: any) {
      console.warn("[camera] error:", e);
      setStreamError(
        e?.name === "NotAllowedError"
          ? "Camera permission denied. Please allow camera access."
          : e?.name === "NotFoundError"
          ? "No camera found on this device. A live camera is required for proof."
          : "Camera not available. Please allow camera access — live photo is required."
      );
      setStreamReady(false);
    }
  }, [facingMode]);

  // Start camera on mount
  useEffect(() => {
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [startCamera]);

  // ----- CAPTURE -----
  const capture = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Downscale to a proof-friendly size (max 900px long edge) + compress.
    // Full camera resolution base64 easily exceeds the API body limit
    // (HTTP 413) and slows Gemini. 900px is more than enough for AI review.
    const MAX_DIM = 900;
    const scale = Math.min(1, MAX_DIM / Math.max(video.videoWidth, video.videoHeight));
    const w = Math.round(video.videoWidth * scale);
    const h = Math.round(video.videoHeight * scale);
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.62);
    setCapturedImage(dataUrl);
    setMode("preview");
  }, []);

  // ----- SUBMIT → SERVER CLAIM (auth + AI audit + duplicate check + XP award all server-side) -----
  const submit = async () => {
    if (!capturedImage) {
      setError("Capture a photo first.");
      return;
    }
    setError(null);
    setMode("verifying");
    try {
      const r = await claimTask(taskId, capturedImage);

      // Refusals that are NOT a verdict on the photo
      if (r.error === "ALREADY_CLAIMED") {
        setError("✅ You already completed this task today. Come back tomorrow.");
        setMode("preview");
        return;
      }
      if (r.error === "ATTEMPTS_EXHAUSTED") {
        setAttempts(MAX_PROOF_ATTEMPTS_PER_DAY);
        setError(`❌ ${r.message || "No attempts left for today."}`);
        setMode("preview");
        return;
      }
      if (r.error === "AI_UNAVAILABLE") {
        setError("⏳ Verification is temporarily unavailable — this attempt was NOT counted. Try again in a few minutes.");
        setMode("preview");
        return;
      }
      if (r.error === "AUTH_REQUIRED") {
        setError("Please sign in again to submit proof.");
        setMode("preview");
        return;
      }
      if (r.error && r.error !== "IMAGE_REUSED" && !r.verified) {
        setError(r.message || "Verification failed. Try again.");
        setMode("preview");
        return;
      }

      // A real verdict (verified or rejected) — counts as an attempt
      setAttempts((a) => (typeof r.attemptsLeft === "number" ? MAX_PROOF_ATTEMPTS_PER_DAY - r.attemptsLeft : a + 1));
      if (r.error === "IMAGE_REUSED") {
        r.feedback = r.message || "This exact photo was already used. Take a fresh one.";
        r.score = 0;
      }
      setVerdict(r);
      setMode("result");
      window.dispatchEvent(new CustomEvent(r.verified ? "manifest_sfx_success" : "manifest_sfx_error"));
    } catch (e: any) {
      setError(e?.message || "Verification failed. Try again.");
      setMode("preview");
    }
  };

  // ----- CONFIRM / CLOSE (XP is already awarded by the server at this point) -----
  const confirm = () => {
    if (!verdict?.verified) return;
    onVerified({
      verified: true,
      score: verdict.score ?? 0,
      feedback: verdict.feedback ?? "",
      xpAwarded: verdict.xpAwarded ?? 0,
      newLevel: verdict.newLevel,
      leveledUp: verdict.leveledUp,
    });
  };

  const retake = () => {
    setCapturedImage(null);
    setVerdict(null);
    setError(null);
    setMode("capture");
  };

  const toggleCamera = () => {
    setFacingMode((f) => (f === "user" ? "environment" : "user"));
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ ease: [0.22, 1, 0.36, 1], duration: 0.3 }}
        className="w-full min-h-dvh flex flex-col"
        style={{ backgroundColor: SURFACE }}
      >
          {/* ============== HEADER ============== */}
          <div
            className="sticky top-0 z-10 flex items-center justify-between px-5 py-4"
            style={{
              backgroundColor: SURFACE,
              borderBottom: `1px solid ${HAIRLINE}`,
            }}
          >
            <div>
              <div
                className="text-[10px] font-extrabold tracking-[0.25em] uppercase"
                style={{ color: ORANGE }}
              >
                AI Proof · Live Camera
              </div>
              <h2
                className="font-extrabold text-lg tracking-tight leading-tight mt-0.5"
                style={{ color: TEXT_PRIMARY }}
              >
                {guidance.label}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full flex items-center justify-center active:scale-90"
              style={{
                backgroundColor: "rgba(255,255,255,0.08)",
                border: `1px solid ${HAIRLINE}`,
                color: TEXT_PRIMARY,
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* ============== CAPTURE MODE ============== */}
          {mode === "capture" && (
            <div className="p-5 space-y-4 max-w-3xl w-full mx-auto">
              {/* Camera viewport */}
              <div
                className="relative w-full rounded-2xl overflow-hidden"
                style={{
                  aspectRatio: "4 / 3",
                  backgroundColor: "#000",
                  border: `1px solid ${HAIRLINE_STRONG}`,
                }}
              >
                <video
                  ref={videoRef}
                  playsInline
                  autoPlay
                  muted
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ display: streamReady ? "block" : "none" }}
                />
                {!streamReady && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                    {streamError ? (
                      <>
                        <AlertTriangle size={32} style={{ color: ORANGE }} />
                        <p
                          className="text-[12px] mt-3 font-semibold"
                          style={{ color: TEXT_PRIMARY }}
                        >
                          {streamError}
                        </p>
                        <button
                          onClick={startCamera}
                          className="mt-3 px-3 py-1.5 rounded-lg text-[11px] font-bold"
                          style={{
                            backgroundColor: "rgba(255,255,255,0.1)",
                            color: TEXT_PRIMARY,
                          }}
                        >
                          Retry camera
                        </button>
                      </>
                    ) : (
                      <>
                        <Loader2 size={28} className="animate-spin" style={{ color: ORANGE }} />
                        <p className="text-[11px] mt-2" style={{ color: TEXT_SECONDARY }}>
                          Starting camera...
                        </p>
                      </>
                    )}
                  </div>
                )}

                {/* Corner brackets for framing */}
                {streamReady && (
                  <>
                    <div className="absolute top-3 left-3 w-6 h-6 border-l-2 border-t-2 rounded-tl-md" style={{ borderColor: ORANGE }} />
                    <div className="absolute top-3 right-3 w-6 h-6 border-r-2 border-t-2 rounded-tr-md" style={{ borderColor: ORANGE }} />
                    <div className="absolute bottom-3 left-3 w-6 h-6 border-l-2 border-b-2 rounded-bl-md" style={{ borderColor: ORANGE }} />
                    <div className="absolute bottom-3 right-3 w-6 h-6 border-r-2 border-b-2 rounded-br-md" style={{ borderColor: ORANGE }} />
                  </>
                )}

                {/* Camera flip button */}
                {streamReady && (
                  <button
                    onClick={toggleCamera}
                    className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center"
                    style={{
                      backgroundColor: "rgba(0,0,0,0.6)",
                      backdropFilter: "blur(10px)",
                      border: `1px solid rgba(255,255,255,0.2)`,
                      color: "#fff",
                    }}
                  >
                    <RotateCw size={14} />
                  </button>
                )}
              </div>

              {/* Hidden canvas for capture */}
              <canvas ref={canvasRef} className="hidden" />

              {/* Rules */}
              <div
                className="rounded-2xl p-3.5"
                style={{ backgroundColor: "rgba(255,255,255,0.04)", border: `1px solid ${HAIRLINE}` }}
              >
                <div
                  className="text-[10px] font-extrabold tracking-widest uppercase mb-2 flex items-center gap-1.5"
                  style={{ color: ORANGE }}
                >
                  <Sparkles size={11} /> Today's proof must include
                </div>
                <ul className="space-y-1.5">
                  {guidance.rules.map((r, i) => (
                    <li
                      key={i}
                      className="text-[12px] flex items-start gap-2"
                      style={{ color: TEXT_SECONDARY }}
                    >
                      <span
                        className="w-1 h-1 rounded-full mt-1.5 shrink-0"
                        style={{ backgroundColor: ORANGE }}
                      />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Capture button */}
              <button
                onClick={capture}
                disabled={!streamReady}
                className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 transition"
                style={{
                  backgroundColor: ORANGE,
                  color: "#000",
                  fontWeight: 800,
                  fontSize: 14,
                  letterSpacing: "0.02em",
                  boxShadow: streamReady ? "0 8px 24px rgba(255,159,10,0.3)" : "none",
                }}
              >
                <Camera size={18} strokeWidth={2.5} />
                Capture proof photo
              </button>

              {/* Live-camera only — no gallery uploads (anti-cheat) */}
              <div
                className="flex items-center justify-between rounded-xl px-3 py-2"
                style={{ backgroundColor: "rgba(255,255,255,0.03)", border: `1px solid ${HAIRLINE}` }}
              >
                <span className="text-[11px] font-semibold" style={{ color: TEXT_SECONDARY }}>
                  📷 Live camera only · gallery uploads are disabled
                </span>
                <span
                  className="text-[10px] font-extrabold tabular-nums px-2 py-0.5 rounded-full"
                  style={{
                    color: attemptsLeft <= 1 ? IOS_RED : ORANGE,
                    border: `1px solid ${attemptsLeft <= 1 ? IOS_RED : ORANGE}`,
                  }}
                >
                  {attemptsLeft}/{MAX_PROOF_ATTEMPTS_PER_DAY} tries left
                </span>
              </div>
            </div>
          )}

          {/* ============== PREVIEW MODE ============== */}
          {mode === "preview" && capturedImage && (
            <div className="p-5 space-y-4 max-w-3xl w-full mx-auto">
              <div
                className="w-full rounded-2xl overflow-hidden"
                style={{
                  border: `1px solid ${HAIRLINE_STRONG}`,
                  backgroundColor: "#000",
                }}
              >
                <img
                  src={capturedImage}
                  alt="Proof"
                  className="w-full h-auto"
                  style={{ maxHeight: 360, objectFit: "contain" }}
                />
              </div>

              {error && (
                <div
                  className="rounded-xl p-3 flex items-start gap-2"
                  style={{
                    backgroundColor: "rgba(255,69,58,0.1)",
                    border: "1px solid rgba(255,69,58,0.3)",
                  }}
                >
                  <AlertTriangle size={14} style={{ color: IOS_RED, marginTop: 1 }} />
                  <p className="text-[11px] font-semibold" style={{ color: IOS_RED }}>
                    {error}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={retake}
                  className="py-3 rounded-xl flex items-center justify-center gap-1.5 active:scale-95"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.05)",
                    border: `1px solid ${HAIRLINE}`,
                    color: TEXT_PRIMARY,
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  <Camera size={14} />
                  Retake
                </button>
                <button
                  onClick={submit}
                  className="py-3 rounded-xl flex items-center justify-center gap-1.5 active:scale-95"
                  style={{
                    backgroundColor: ORANGE,
                    color: "#000",
                    fontSize: 13,
                    fontWeight: 800,
                  }}
                >
                  <Sparkles size={14} />
                  Verify with AI
                </button>
              </div>
            </div>
          )}

          {/* ============== VERIFYING MODE ============== */}
          {mode === "verifying" && (
            <div className="relative min-h-[60dvh] flex flex-col items-center justify-center text-center overflow-hidden">
              {/* Anime shadow-monarch background */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: "url(/images/anime_shadow_monarch_dark.jpg)",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  opacity: 0.35,
                }}
              />
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.9) 100%)",
                }}
              />
              {/* Scanning line animation */}
              <div
                className="absolute left-0 right-0 h-px pointer-events-none"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, rgba(255,159,10,0.9), transparent)",
                  animation: "sdScan 1.6s ease-in-out infinite",
                }}
              />
              <style>{`
                @keyframes sdScan {
                  0% { top: 10%; opacity: 0; }
                  50% { opacity: 1; }
                  100% { top: 90%; opacity: 0; }
                }
              `}</style>

              <div className="relative z-10 flex flex-col items-center px-6">
                {/* Pulsing AI eye */}
                <div
                  className="relative w-20 h-20 rounded-full flex items-center justify-center"
                  style={{
                    border: `1px solid rgba(255,159,10,0.4)`,
                    backgroundColor: "rgba(0,0,0,0.6)",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      border: `2px solid rgba(255,159,10,0.5)`,
                      animation: "sdPulse 1.4s ease-out infinite",
                    }}
                  />
                  <Eye size={30} style={{ color: ORANGE }} />
                </div>
                <style>{`
                  @keyframes sdPulse {
                    0% { transform: scale(0.8); opacity: 1; }
                    100% { transform: scale(1.6); opacity: 0; }
                  }
                `}</style>

                <p
                  className="mt-5 text-[16px] font-extrabold tracking-tight"
                  style={{ color: TEXT_PRIMARY }}
                >
                  The Oracle is judging your proof
                </p>
                <p
                  className="mt-1.5 text-[12px] leading-relaxed max-w-[260px]"
                  style={{ color: TEXT_SECONDARY }}
                >
                  Scanning date, content &amp; freshness of your submission…
                </p>

                {/* Progress ticks */}
                <div className="mt-5 flex items-center gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="inline-block rounded-full"
                      style={{
                        width: 6,
                        height: 6,
                        backgroundColor: ORANGE,
                        animation: `sdTick 1s ease-in-out ${i * 0.2}s infinite`,
                      }}
                    />
                  ))}
                </div>
                <style>{`
                  @keyframes sdTick {
                    0%, 100% { opacity: 0.25; transform: scale(0.8); }
                    50% { opacity: 1; transform: scale(1.2); }
                  }
                `}</style>
              </div>
            </div>
          )}

          {/* ============== RESULT MODE ============== */}
          {mode === "result" && verdict && (
            <div className="p-5 space-y-4 max-w-3xl w-full mx-auto">
              <div
                className="relative rounded-2xl p-5 text-center overflow-hidden"
                style={{
                  backgroundColor: verdict.verified
                    ? "rgba(52,199,89,0.08)"
                    : "rgba(255,69,58,0.08)",
                  border: `1px solid ${
                    verdict.verified ? "rgba(52,199,89,0.3)" : "rgba(255,69,58,0.3)"
                  }`,
                }}
              >
                {/* Anime backdrop behind verdict */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    backgroundImage: verdict.verified
                      ? "url(/images/anime_dark_hero_purple.jpg)"
                      : "url(/images/anime_red_warrior_1785177142520.jpg)",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    opacity: 0.18,
                  }}
                />
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.35) 50%, rgba(0,0,0,0.7) 100%)",
                  }}
                />
                <div className="relative z-10">
                  <div
                    className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-3"
                    style={{
                      backgroundColor: verdict.verified
                        ? "rgba(52,199,89,0.15)"
                        : "rgba(255,69,58,0.15)",
                      boxShadow: verdict.verified
                        ? "0 0 30px rgba(52,199,89,0.4)"
                        : "0 0 30px rgba(255,69,58,0.4)",
                    }}
                  >
                    {verdict.verified ? (
                      <CheckCircle2 size={32} style={{ color: IOS_GREEN }} />
                    ) : (
                      <XCircle size={32} style={{ color: IOS_RED }} />
                    )}
                  </div>
                <p
                  className="text-xl font-extrabold tracking-tight"
                  style={{ color: TEXT_PRIMARY }}
                >
                  {verdict.verified ? "Verified!" : "Not verified"}
                </p>
                <p
                  className="text-3xl font-extrabold tabular-nums mt-2"
                  style={{
                    color: verdict.verified ? IOS_GREEN : IOS_RED,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {verdict.score ?? 0}
                  <span className="text-[14px] ml-1" style={{ color: TEXT_TERTIARY }}>
                    /100 · pass ≥ {PROOF_PASS_SCORE}
                  </span>
                </p>
                <p
                  className="text-[12px] mt-3 leading-relaxed px-2"
                  style={{ color: TEXT_SECONDARY }}
                >
                  {verdict.feedback}
                </p>
                {!!verdict.flags?.length && !verdict.verified && (
                  <div className="flex flex-wrap justify-center gap-1.5 mt-3">
                    {verdict.flags.map((f) => (
                      <span
                        key={f}
                        className="px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase"
                        style={{ color: IOS_RED, border: "1px solid rgba(255,69,58,0.4)" }}
                      >
                        {f.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                )}
                <p
                  className="text-[9px] mt-3 tracking-widest uppercase"
                  style={{ color: TEXT_TERTIARY }}
                >
                  {verdict.verified
                    ? `AI verified · +${verdict.xpAwarded ?? 0} XP added`
                    : `AI reviewed · ${attemptsLeft} ${attemptsLeft === 1 ? "try" : "tries"} left today`}
                </p>
                </div>
              </div>

              {verdict.verified ? (
                <button
                  onClick={confirm}
                  className="w-full py-3.5 rounded-xl flex items-center justify-center gap-2 active:scale-95"
                  style={{
                    backgroundColor: ORANGE,
                    color: "#000",
                    fontSize: 14,
                    fontWeight: 800,
                    boxShadow: "0 6px 18px rgba(255,159,10,0.3)",
                  }}
                >
                  <CheckCircle2 size={16} />
                  +{verdict.xpAwarded ?? 0} XP earned · Continue
                </button>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={retake}
                    disabled={attemptsLeft <= 0}
                    className="w-full py-3 rounded-xl flex items-center justify-center gap-2 active:scale-95 disabled:opacity-40"
                    style={{
                      backgroundColor: ORANGE,
                      color: "#000",
                      fontSize: 13,
                      fontWeight: 800,
                    }}
                  >
                    <Camera size={14} />
                    {attemptsLeft > 0 ? "Try again with new photo" : "No attempts left today"}
                  </button>
                  <button
                    onClick={onClose}
                    className="w-full py-2.5 rounded-xl text-[12px] font-semibold"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.04)",
                      color: TEXT_TERTIARY,
                    }}
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          )}
      </motion.div>
    </AnimatePresence>
  );
};

export default TaskProofCamera;

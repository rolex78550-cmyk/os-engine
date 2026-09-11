import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  X, Camera, RotateCw, CheckCircle2, XCircle, Loader2, Sparkles,
  AlertTriangle, Eye, ShieldCheck,
} from "lucide-react";
import { TASK_BY_ID, type TaskId, PROOF_PASS_SCORE, MAX_PROOF_ATTEMPTS_PER_DAY } from "../../lib/taskCatalog";
import { claimTask, type ClaimResult } from "../../lib/taskClaimApi";

// Light theme tokens (iOS 17 style, white background)
const BG = "#ffffff";
const SURFACE = "#f5f5f7";
const TEXT_PRIMARY = "#111114";
const TEXT_SECONDARY = "rgba(60,60,67,0.72)";
const TEXT_TERTIARY = "rgba(60,60,67,0.45)";
const HAIRLINE = "rgba(0,0,0,0.08)";
const HAIRLINE_STRONG = "rgba(0,0,0,0.16)";
const ORANGE = "#ff7a00";
const ORANGE_SOFT = "rgba(255,122,0,0.10)";
const IOS_RED = "#e5372d";
const IOS_GREEN = "#1f9d4d";

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

  // Full-screen overlay: lock page scroll behind it while open.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

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
    const MAX_DIM = 1080;
    const scale = Math.min(1, MAX_DIM / Math.max(video.videoWidth, video.videoHeight));
    const w = Math.round(video.videoWidth * scale);
    const h = Math.round(video.videoHeight * scale);
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.66);
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
      if (r.error === "SERVER_MISCONFIGURED") {
        setError("⚠️ Server can't save your proof right now (database credentials missing on the server). This attempt was NOT counted — please try again later.");
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

  const stepLabel =
    mode === "capture" ? "Step 1 of 3 · Capture"
    : mode === "preview" ? "Step 2 of 3 · Review"
    : mode === "verifying" ? "Step 3 of 3 · AI check"
    : "Result";

  if (typeof document === "undefined") return null;

  // Portal to <body>: the Dominion tab is wrapped in a motion.div with a
  // transform / will-change, which would make `position: fixed` resolve
  // against that element instead of the viewport (header-only strip, black
  // camera area). Rendering at the body level keeps this truly full-screen.
  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ ease: [0.22, 1, 0.36, 1], duration: 0.3 }}
        className="fixed inset-0 z-[500] flex flex-col"
        style={{ backgroundColor: BG, color: TEXT_PRIMARY, height: "100dvh", width: "100vw" }}
      >
        <style>{`
          @keyframes sdScan { 0% { top: 8%; opacity: 0; } 50% { opacity: 1; } 100% { top: 92%; opacity: 0; } }
          @keyframes sdPulse { 0% { transform: scale(0.85); opacity: 0.9; } 100% { transform: scale(1.7); opacity: 0; } }
          @keyframes sdTick { 0%, 100% { opacity: 0.25; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.2); } }
        `}</style>

        {/* ============== HEADER ============== */}
        <div
          className="shrink-0 flex items-center justify-between px-4 sm:px-6 pb-3"
          style={{
            paddingTop: "max(14px, env(safe-area-inset-top))",
            backgroundColor: BG,
            borderBottom: `1px solid ${HAIRLINE}`,
          }}
        >
          <div className="min-w-0">
            <div className="text-[10px] font-extrabold tracking-[0.22em] uppercase" style={{ color: ORANGE }}>
              AI Proof · {stepLabel}
            </div>
            <h2 className="font-extrabold text-[19px] sm:text-[22px] tracking-tight leading-tight mt-0.5 truncate" style={{ color: TEXT_PRIMARY }}>
              {spec.icon} {guidance.label}
            </h2>
            <div className="text-[11px] mt-0.5 truncate" style={{ color: TEXT_TERTIARY }}>
              One round · {spec.goal} · once per day
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-10 h-10 rounded-full flex items-center justify-center active:scale-90 shrink-0 ml-3"
            style={{ backgroundColor: SURFACE, border: `1px solid ${HAIRLINE}`, color: TEXT_PRIMARY }}
          >
            <X size={18} />
          </button>
        </div>

        {/* ============== BODY (scrolls if needed) ============== */}
        <div
          className="flex-1 min-h-0 overflow-y-auto"
          style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}
        >
          {/* ============== CAPTURE MODE ============== */}
          {mode === "capture" && (
            <div className="px-4 sm:px-6 pt-4 pb-6 space-y-3.5 max-w-2xl w-full mx-auto">
              {/* Camera viewport — big, portrait, fills most of the screen */}
              <div
                className="relative w-full rounded-[22px] overflow-hidden"
                style={{
                  aspectRatio: "3 / 4",
                  maxHeight: "calc(100dvh - 300px)",
                  minHeight: 320,
                  margin: "0 auto",
                  backgroundColor: "#0b0b0d",
                  border: `1px solid ${HAIRLINE_STRONG}`,
                  boxShadow: "0 12px 34px rgba(0,0,0,0.14)",
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
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                    {streamError ? (
                      <>
                        <AlertTriangle size={34} style={{ color: ORANGE }} />
                        <p className="text-[13px] mt-3 font-semibold" style={{ color: "#fff" }}>
                          {streamError}
                        </p>
                        <button
                          onClick={startCamera}
                          className="mt-4 px-4 py-2 rounded-xl text-[12px] font-bold"
                          style={{ backgroundColor: "#fff", color: TEXT_PRIMARY }}
                        >
                          Retry camera
                        </button>
                      </>
                    ) : (
                      <>
                        <Loader2 size={30} className="animate-spin" style={{ color: ORANGE }} />
                        <p className="text-[12px] mt-3 font-medium" style={{ color: "rgba(255,255,255,0.75)" }}>
                          Starting camera…
                        </p>
                      </>
                    )}
                  </div>
                )}

                {streamReady && (
                  <>
                    {/* Corner brackets */}
                    <div className="absolute top-4 left-4 w-8 h-8 border-l-[3px] border-t-[3px] rounded-tl-lg" style={{ borderColor: "#fff" }} />
                    <div className="absolute top-4 right-4 w-8 h-8 border-r-[3px] border-t-[3px] rounded-tr-lg" style={{ borderColor: "#fff" }} />
                    <div className="absolute bottom-4 left-4 w-8 h-8 border-l-[3px] border-b-[3px] rounded-bl-lg" style={{ borderColor: "#fff" }} />
                    <div className="absolute bottom-4 right-4 w-8 h-8 border-r-[3px] border-b-[3px] rounded-br-lg" style={{ borderColor: "#fff" }} />

                    {/* LIVE pill */}
                    <div
                      className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-widest uppercase"
                      style={{ backgroundColor: "rgba(0,0,0,0.55)", color: "#fff", backdropFilter: "blur(8px)" }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: IOS_RED, boxShadow: `0 0 8px ${IOS_RED}` }} />
                      Live
                    </div>

                    {/* Flip camera */}
                    <button
                      onClick={toggleCamera}
                      aria-label="Flip camera"
                      className="absolute bottom-4 right-4 w-11 h-11 rounded-full flex items-center justify-center active:scale-90"
                      style={{ backgroundColor: "rgba(255,255,255,0.92)", color: TEXT_PRIMARY, boxShadow: "0 4px 14px rgba(0,0,0,0.25)" }}
                    >
                      <RotateCw size={16} />
                    </button>

                    {/* Shutter (inside the viewport, iOS-style) */}
                    <button
                      onClick={capture}
                      aria-label="Capture proof photo"
                      className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[72px] h-[72px] rounded-full flex items-center justify-center active:scale-95"
                      style={{ backgroundColor: "rgba(255,255,255,0.28)", backdropFilter: "blur(6px)" }}
                    >
                      <span className="block w-[58px] h-[58px] rounded-full" style={{ backgroundColor: "#fff", boxShadow: "inset 0 0 0 3px rgba(0,0,0,0.08)" }} />
                    </button>
                  </>
                )}
              </div>

              {/* Hidden canvas for capture */}
              <canvas ref={canvasRef} className="hidden" />

              {/* Rules checklist */}
              <div className="rounded-2xl p-4" style={{ backgroundColor: SURFACE, border: `1px solid ${HAIRLINE}` }}>
                <div className="text-[10px] font-extrabold tracking-widest uppercase mb-2 flex items-center gap-1.5" style={{ color: ORANGE }}>
                  <Sparkles size={11} /> Your photo must show
                </div>
                <ul className="space-y-1.5">
                  {guidance.rules.map((r, i) => (
                    <li key={i} className="text-[12.5px] leading-snug flex items-start gap-2" style={{ color: TEXT_SECONDARY }}>
                      <CheckCircle2 size={13} className="shrink-0 mt-[2px]" style={{ color: ORANGE }} />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Primary capture button (for users who miss the shutter) */}
              <button
                onClick={capture}
                disabled={!streamReady}
                className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-40 transition"
                style={{
                  backgroundColor: ORANGE,
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: 15,
                  boxShadow: streamReady ? "0 10px 26px rgba(255,122,0,0.28)" : "none",
                }}
              >
                <Camera size={18} strokeWidth={2.5} />
                Capture proof photo
              </button>

              <div className="flex items-center justify-between gap-3 px-1">
                <span className="text-[11px] font-semibold flex items-center gap-1.5" style={{ color: TEXT_TERTIARY }}>
                  <ShieldCheck size={12} style={{ color: ORANGE }} />
                  Live camera only · no gallery uploads
                </span>
                <span
                  className="text-[10px] font-extrabold tabular-nums px-2 py-0.5 rounded-full shrink-0"
                  style={{
                    color: attemptsLeft <= 1 ? IOS_RED : ORANGE,
                    backgroundColor: attemptsLeft <= 1 ? "rgba(229,55,45,0.08)" : ORANGE_SOFT,
                  }}
                >
                  {attemptsLeft}/{MAX_PROOF_ATTEMPTS_PER_DAY} tries left
                </span>
              </div>
            </div>
          )}

          {/* ============== PREVIEW MODE ============== */}
          {mode === "preview" && capturedImage && (
            <div className="px-4 sm:px-6 pt-4 pb-6 space-y-3.5 max-w-2xl w-full mx-auto">
              <div
                className="relative w-full rounded-[22px] overflow-hidden"
                style={{
                  aspectRatio: "3 / 4",
                  maxHeight: "calc(100dvh - 260px)",
                  minHeight: 320,
                  margin: "0 auto",
                  backgroundColor: "#0b0b0d",
                  border: `1px solid ${HAIRLINE_STRONG}`,
                  boxShadow: "0 12px 34px rgba(0,0,0,0.14)",
                }}
              >
                <img src={capturedImage} alt="Proof" className="absolute inset-0 w-full h-full object-contain" />
                <div
                  className="absolute top-4 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-widest uppercase"
                  style={{ backgroundColor: "rgba(0,0,0,0.55)", color: "#fff", backdropFilter: "blur(8px)" }}
                >
                  Review your proof
                </div>
              </div>

              {error && (
                <div className="rounded-2xl p-3.5 flex items-start gap-2" style={{ backgroundColor: "rgba(229,55,45,0.07)", border: "1px solid rgba(229,55,45,0.25)" }}>
                  <AlertTriangle size={15} style={{ color: IOS_RED, marginTop: 1 }} />
                  <p className="text-[12px] font-semibold leading-snug" style={{ color: IOS_RED }}>
                    {error}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={retake}
                  className="py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-95"
                  style={{ backgroundColor: SURFACE, border: `1px solid ${HAIRLINE}`, color: TEXT_PRIMARY, fontSize: 14, fontWeight: 700 }}
                >
                  <Camera size={15} />
                  Retake
                </button>
                <button
                  onClick={submit}
                  className="py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-95"
                  style={{ backgroundColor: ORANGE, color: "#fff", fontSize: 14, fontWeight: 800, boxShadow: "0 10px 26px rgba(255,122,0,0.28)" }}
                >
                  <Sparkles size={15} />
                  Verify with AI
                </button>
              </div>
              <p className="text-center text-[11px]" style={{ color: TEXT_TERTIARY }}>
                Passing score {PROOF_PASS_SCORE}/100 · +XP is added by the server instantly
              </p>
            </div>
          )}

          {/* ============== VERIFYING MODE ============== */}
          {mode === "verifying" && (
            <div className="px-4 sm:px-6 pt-4 pb-6 max-w-2xl w-full mx-auto">
              <div
                className="relative w-full rounded-[22px] overflow-hidden flex flex-col items-center justify-center text-center"
                style={{
                  aspectRatio: "3 / 4",
                  maxHeight: "calc(100dvh - 200px)",
                  minHeight: 360,
                  margin: "0 auto",
                  backgroundColor: "#0b0b0d",
                  border: `1px solid ${HAIRLINE_STRONG}`,
                }}
              >
                {capturedImage && (
                  <img src={capturedImage} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ opacity: 0.35, filter: "blur(2px)" }} />
                )}
                <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 50%, rgba(0,0,0,0.65) 100%)" }} />
                <div
                  className="absolute left-0 right-0 h-[2px] pointer-events-none"
                  style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.95), transparent)", animation: "sdScan 1.6s ease-in-out infinite" }}
                />
                <div className="relative z-10 flex flex-col items-center px-6">
                  <div className="relative w-20 h-20 rounded-full flex items-center justify-center" style={{ border: "1px solid rgba(255,255,255,0.5)", backgroundColor: "rgba(0,0,0,0.35)", backdropFilter: "blur(8px)" }}>
                    <div className="absolute inset-0 rounded-full" style={{ border: "2px solid rgba(255,255,255,0.6)", animation: "sdPulse 1.4s ease-out infinite" }} />
                    <Eye size={30} style={{ color: "#fff" }} />
                  </div>
                  <p className="mt-5 text-[17px] font-extrabold tracking-tight" style={{ color: "#fff" }}>
                    AI is checking your proof
                  </p>
                  <p className="mt-1.5 text-[12px] leading-relaxed max-w-[260px]" style={{ color: "rgba(255,255,255,0.75)" }}>
                    Checking date, content &amp; freshness of your photo…
                  </p>
                  <div className="mt-5 flex items-center gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <span key={i} className="inline-block rounded-full" style={{ width: 6, height: 6, backgroundColor: "#fff", animation: `sdTick 1s ease-in-out ${i * 0.2}s infinite` }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============== RESULT MODE ============== */}
          {mode === "result" && verdict && (
            <div className="px-4 sm:px-6 pt-4 pb-6 space-y-3.5 max-w-2xl w-full mx-auto">
              <div
                className="relative rounded-[22px] p-6 text-center overflow-hidden"
                style={{
                  backgroundColor: verdict.verified ? "rgba(31,157,77,0.07)" : "rgba(229,55,45,0.06)",
                  border: `1px solid ${verdict.verified ? "rgba(31,157,77,0.3)" : "rgba(229,55,45,0.28)"}`,
                }}
              >
                {capturedImage && (
                  <img
                    src={capturedImage}
                    alt=""
                    className="w-24 h-32 object-cover rounded-xl mx-auto mb-4"
                    style={{ border: `1px solid ${HAIRLINE_STRONG}` }}
                  />
                )}
                <div
                  className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-3"
                  style={{
                    backgroundColor: verdict.verified ? "rgba(31,157,77,0.12)" : "rgba(229,55,45,0.10)",
                    boxShadow: verdict.verified ? "0 0 0 8px rgba(31,157,77,0.06)" : "0 0 0 8px rgba(229,55,45,0.05)",
                  }}
                >
                  {verdict.verified ? <CheckCircle2 size={34} style={{ color: IOS_GREEN }} /> : <XCircle size={34} style={{ color: IOS_RED }} />}
                </div>
                <p className="text-[22px] font-extrabold tracking-tight" style={{ color: TEXT_PRIMARY }}>
                  {verdict.verified ? "Verified!" : "Not verified"}
                </p>
                <p className="text-[36px] font-extrabold tabular-nums mt-1 leading-none" style={{ color: verdict.verified ? IOS_GREEN : IOS_RED, letterSpacing: "-0.02em" }}>
                  {verdict.score ?? 0}
                  <span className="text-[13px] ml-1 font-bold" style={{ color: TEXT_TERTIARY }}>
                    /100 · pass ≥ {PROOF_PASS_SCORE}
                  </span>
                </p>
                <p className="text-[13px] mt-3 leading-relaxed px-1" style={{ color: TEXT_SECONDARY }}>
                  {verdict.feedback}
                </p>
                {!!verdict.flags?.length && !verdict.verified && (
                  <div className="flex flex-wrap justify-center gap-1.5 mt-3">
                    {verdict.flags.map((f) => (
                      <span key={f} className="px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase" style={{ color: IOS_RED, backgroundColor: "rgba(229,55,45,0.08)", border: "1px solid rgba(229,55,45,0.25)" }}>
                        {f.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-[10px] mt-4 tracking-widest uppercase font-bold" style={{ color: TEXT_TERTIARY }}>
                  {verdict.verified
                    ? `AI verified · +${verdict.xpAwarded ?? 0} XP added · done for today`
                    : `AI reviewed · ${attemptsLeft} ${attemptsLeft === 1 ? "try" : "tries"} left today`}
                </p>
              </div>

              {verdict.verified ? (
                <button
                  onClick={confirm}
                  className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-95"
                  style={{ backgroundColor: ORANGE, color: "#fff", fontSize: 15, fontWeight: 800, boxShadow: "0 10px 26px rgba(255,122,0,0.28)" }}
                >
                  <CheckCircle2 size={17} />
                  +{verdict.xpAwarded ?? 0} XP earned · Continue
                </button>
              ) : (
                <div className="space-y-2.5">
                  <button
                    onClick={retake}
                    disabled={attemptsLeft <= 0}
                    className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-95 disabled:opacity-40"
                    style={{ backgroundColor: ORANGE, color: "#fff", fontSize: 14, fontWeight: 800 }}
                  >
                    <Camera size={15} />
                    {attemptsLeft > 0 ? "Try again with a new photo" : "No attempts left today"}
                  </button>
                  <button
                    onClick={onClose}
                    className="w-full py-3 rounded-2xl text-[13px] font-semibold"
                    style={{ backgroundColor: SURFACE, border: `1px solid ${HAIRLINE}`, color: TEXT_SECONDARY }}
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

export default TaskProofCamera;

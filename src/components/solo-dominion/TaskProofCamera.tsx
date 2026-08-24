import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X, Camera, RotateCw, CheckCircle2, XCircle, Loader2, Sparkles,
  Image as ImageIcon, AlertTriangle, Upload
} from "lucide-react";
import { verifyGoalProof, type ProofVerdict } from "../../lib/goalApi";

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

export type ProofTaskId = "writing" | "gratitude" | "script369" | "dress";

interface TaskProofCameraProps {
  taskId: ProofTaskId;
  taskTitle: string;
  taskDescription: string;
  /** Called when proof verified (true) or rejected (false) */
  onVerified: (result: {
    verified: boolean;
    score: number;
    feedback: string;
    imageBase64?: string;
    imageHash?: string;
  }) => void;
  onClose: () => void;
}

const TASK_GUIDANCE: Record<ProofTaskId, { label: string; rules: string[]; prompt: string }> = {
  writing: {
    label: "Scripting",
    rules: [
      "Show your notebook / diary / journal",
      "Today's DATE must be clearly written",
      "Write your desire in PRESENT tense (as if already done)",
      "Minimum 50 words of scripting content",
    ],
    prompt: `You are a STRICT Manifestation Coach auditing a Scripting proof.
The user claims to have completed their daily SCRIPTING practice.
The task is: "Scripting — Write your manifestation script in present tense. Feel it as already done."

WHAT TO CHECK (in this order):
1. IMAGE QUALITY: Is this a real photo of a notebook/diary/journal? (Reject blank paper, screenshots, old photos)
2. DATE: Does the image show TODAY'S DATE? (Look for any date — header, top, side, or in the text itself). If the date is clearly from a PREVIOUS DAY, REJECT.
3. CONTENT: Is the content a manifestation script? — written in PRESENT TENSE, describing the desire as if it's already happened ("I am so happy now that...", "Thank you for...", "It's done, I have my..."). Reject if it's just a to-do list, random notes, or unrelated writing.
4. FRESHNESS: Reject if the handwriting/photo looks like it's from a previous day being reused.

SCORING:
- 90-100: Today + present-tense scripting + clear intent
- 60-89: Today + some scripting but lacking emotion/specificity
- 30-59: Date ambiguous OR content not in present tense
- 0-29: Old photo, blank page, screenshot, or unrelated content

Return ONLY JSON:
{
  "verified": boolean (true if score >= 60),
  "verificationScore": number (0-100),
  "verificationFeedback": "1-2 sharp sentences explaining the verdict"
}`,
  },
  gratitude: {
    label: "Gratitude Script",
    rules: [
      "Show your notebook with gratitude entries",
      "Today's DATE must be written",
      "List 5 specific things you're grateful for",
      "Feel the emotion — write from the heart, not generic lines",
    ],
    prompt: `You are a STRICT Manifestation Coach auditing a Gratitude Script proof.
The user claims to have completed their daily GRATITUDE practice.
The task is: "Gratitude Script — Write 5 things you're deeply grateful for. Specific, emotional, felt in the body."

WHAT TO CHECK:
1. IMAGE QUALITY: Real photo of notebook/diary? (Reject blank pages, screenshots, reused photos)
2. DATE: TODAY'S DATE clearly visible? Reject if clearly from a previous day.
3. CONTENT: Is there a gratitude list? Look for 5+ items starting with "Thank you", "I'm grateful for", "Grateful", or numbered/bulleted items. Reject if not gratitude content.
4. SPECIFICITY: Are items specific (not generic like "I'm grateful for my family" without details)? Reward specificity.
5. FRESHNESS: Reject if photo looks reused from a previous day.

SCORING:
- 90-100: Today + 5+ specific gratitude items with emotion
- 60-89: Today + gratitude content but less specific
- 30-59: Date ambiguous or content too generic
- 0-29: Old photo, blank page, or not gratitude content

Return ONLY JSON:
{
  "verified": boolean (true if score >= 60),
  "verificationScore": number (0-100),
  "verificationFeedback": "1-2 sharp sentences"
}`,
  },
  script369: {
    label: "369 Script",
    rules: [
      "Show your notebook with 3/6/9 pattern",
      "3 times in morning, 6 times in afternoon, 9 times at night",
      "Today's DATE must be written",
      "Same desire written the required number of times",
    ],
    prompt: `You are a STRICT Manifestation Coach auditing a 369 Script proof.
The user claims to have completed their 369 METHOD practice.
The task is: "369 Script — Write your desire 3x in morning, 6x in afternoon, 9x at night. Tesla's manifestation method."

WHAT TO CHECK:
1. IMAGE QUALITY: Real photo of notebook? (Reject blank, screenshots, reused)
2. DATE: TODAY'S DATE visible? Reject if clearly a previous day.
3. 3-6-9 PATTERN: Look for evidence of 3 sections, OR clear repetition pattern of the same desire written multiple times. Look for numbers like "3x", "6x", "9x" or groupings.
4. FRESHNESS: Reject if reused.

SCORING:
- 90-100: Today + clear 3/6/9 pattern with same desire repeated
- 60-89: Today + repetition pattern but less clear structure
- 30-59: Date ambiguous or pattern not clear
- 0-29: Old photo, blank, or no 369 evidence

Return ONLY JSON:
{
  "verified": boolean (true if score >= 60),
  "verificationScore": number (0-100),
  "verificationFeedback": "1-2 sharp sentences"
}`,
  },
  dress: {
    label: "Dress Like Your Future Self",
    rules: [
      "Wear what your FUTURE self would wear today",
      "Full body mirror selfie (face + outfit visible)",
      "Today's DATE in the photo (mirror, phone screen, or background)",
      "Outfit must be intentional — not a screenshot, not a stock photo",
    ],
    prompt: `You are a STRICT Identity Coach auditing a "Dress Like Your Future Self" proof.
The user claims to have dressed like their ideal future self today.
The task is: "Dress Like Your Future Self — wear what your future self would wear, post a photo proof."

WHAT TO CHECK (in this order):
1. IMAGE TYPE: Real mirror selfie or full-body photo? (Reject if it's a stock photo, a saved picture from internet, a screenshot of an outfit, an old photo, or just a face closeup without outfit visible)
2. DATE: TODAY'S DATE must be visible somewhere — phone screen lock, mirror date stamp, in background, or in app screenshot. REJECT if clearly a previous day.
3. OUTFIT VISIBILITY: Can you see the full outfit / clothing? (Reject if only face visible)
4. INTENT: Does the outfit look like a deliberate choice (formal, athletic, business, artistic)? Or is it just random casual wear with no intention?
5. FRESHNESS: The photo must appear to be taken TODAY (recent image, today's light, current background). Reject if reused or from a previous day.

SCORING:
- 90-100: Today + clear outfit + intentional styling + date visible
- 60-89: Today + outfit visible but lacks intentional styling
- 30-59: Date ambiguous OR outfit not clearly visible
- 0-29: Old photo, stock image, screenshot, or face-only

Return ONLY JSON:
{
  "verified": boolean (true if score >= 60),
  "verificationScore": number (0-100),
  "verificationFeedback": "1-2 sharp sentences"
}`,
  },
};

// Simple hash of base64 to detect reused images
const hashBase64 = (b64: string): string => {
  let hash = 0;
  const sample = b64.slice(0, 2000) + b64.slice(-2000);
  for (let i = 0; i < sample.length; i++) {
    hash = ((hash << 5) - hash) + sample.charCodeAt(i);
    hash |= 0;
  }
  return String(hash);
};

export const TaskProofCamera: React.FC<TaskProofCameraProps> = ({
  taskId,
  taskTitle,
  taskDescription,
  onVerified,
  onClose,
}) => {
  const guidance = TASK_GUIDANCE[taskId];

  // ----- STATE -----
  const [mode, setMode] = useState<"capture" | "preview" | "verifying" | "result">("capture");
  const [streamReady, setStreamReady] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [verdict, setVerdict] = useState<ProofVerdict | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [proofText, setProofText] = useState("");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const todayStr = new Date().toLocaleDateString("en-CA");

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
          ? "No camera found. Use Upload instead."
          : "Camera not available. Use Upload instead."
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
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setCapturedImage(dataUrl);
    // Convert dataURL to File
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `proof-${Date.now()}.jpg`, { type: "image/jpeg" });
        setCapturedFile(file);
        setMode("preview");
      }
    }, "image/jpeg", 0.85);
  }, []);

  // ----- FILE UPLOAD FALLBACK -----
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 6 * 1024 * 1024) {
      setError("Image too large (max 6MB).");
      return;
    }
    setCapturedFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setCapturedImage(reader.result as string);
      setMode("preview");
    };
    reader.readAsDataURL(file);
  };

  // ----- REUSE DETECTION -----
  const checkReuse = (b64: string): { isReuse: boolean; previousDate?: string } => {
    try {
      const h = hashBase64(b64);
      const key = `manifest_proof_hashes_${taskId}`;
      const raw = window.localStorage.getItem(key);
      const map = raw ? JSON.parse(raw) : {};
      const todayRecord = map[todayStr];
      if (todayRecord === h) {
        return { isReuse: true };
      }
      // Check if this hash was used in a previous day
      for (const [date, hash] of Object.entries(map)) {
        if (hash === h && date !== todayStr) {
          return { isReuse: true, previousDate: date };
        }
      }
      return { isReuse: false };
    } catch {
      return { isReuse: false };
    }
  };

  const saveHash = (b64: string) => {
    try {
      const h = hashBase64(b64);
      const key = `manifest_proof_hashes_${taskId}`;
      const raw = window.localStorage.getItem(key);
      const map = raw ? JSON.parse(raw) : {};
      map[todayStr] = h;
      // Keep only last 14 days
      const dates = Object.keys(map).sort();
      while (dates.length > 14) {
        delete map[dates.shift()!];
      }
      window.localStorage.setItem(key, JSON.stringify(map));
    } catch {}
  };

  // ----- SUBMIT FOR AI VERIFICATION -----
  const submit = async () => {
    if (!capturedFile && !capturedImage) {
      setError("Capture or upload an image first.");
      return;
    }
    setError(null);
    setMode("verifying");

    // CLIENT-SIDE REUSE CHECK
    if (capturedImage) {
      const reuse = checkReuse(capturedImage);
      if (reuse.isReuse) {
        const msg = reuse.previousDate
          ? `❌ REJECTED: This image was used on ${reuse.previousDate}. Take a fresh photo of today's practice.`
          : `❌ REJECTED: You've already submitted this exact image today. Take a fresh photo.`;
        setError(msg);
        setMode("preview");
        window.dispatchEvent(new CustomEvent("manifest_sfx_error"));
        return;
      }
    }

    try {
      const v = await verifyGoalProof({
        taskTitle,
        taskDescription: `${taskDescription}\n\nSTRICT VERIFICATION CRITERIA:\n${guidance.prompt}`,
        proofText: proofText.trim() || `Submitted photo of ${guidance.label.toLowerCase()} practice for today (${todayStr}).`,
        imageFile: capturedFile,
      });
      setVerdict(v);
      setMode("result");
      // Save hash on success
      if (v.verified && capturedImage) {
        saveHash(capturedImage);
        window.dispatchEvent(new CustomEvent("manifest_sfx_success"));
      } else {
        window.dispatchEvent(new CustomEvent("manifest_sfx_error"));
      }
    } catch (e: any) {
      setError(e?.message || "Verification failed. Try again.");
      setMode("preview");
    }
  };

  // ----- CONFIRM / CLOSE -----
  const confirm = () => {
    if (!verdict) return;
    onVerified({
      verified: verdict.verified,
      score: verdict.verificationScore,
      feedback: verdict.verificationFeedback,
      imageBase64: capturedImage || undefined,
      imageHash: capturedImage ? hashBase64(capturedImage) : undefined,
    });
  };

  const retake = () => {
    setCapturedImage(null);
    setCapturedFile(null);
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

              {/* Upload fallback */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 rounded-xl flex items-center justify-center gap-2 active:scale-[0.99] transition"
                style={{
                  backgroundColor: "rgba(255,255,255,0.04)",
                  border: `1px solid ${HAIRLINE}`,
                  color: TEXT_SECONDARY,
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                <Upload size={14} />
                Or upload from device
              </button>
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

              {/* Optional proof text */}
              <div>
                <label
                  className="text-[10px] font-extrabold tracking-widest uppercase block mb-1.5"
                  style={{ color: TEXT_TERTIARY }}
                >
                  Add note (optional)
                </label>
                <textarea
                  value={proofText}
                  onChange={(e) => setProofText(e.target.value)}
                  rows={2}
                  placeholder="e.g., morning session 3x, evening 6x, night 9x"
                  className="w-full rounded-xl p-3 text-[12px] outline-none resize-none"
                  style={{
                    backgroundColor: "#000",
                    border: `1px solid ${HAIRLINE}`,
                    color: TEXT_PRIMARY,
                    fontFamily: "inherit",
                  }}
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
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <Loader2 size={36} className="animate-spin" style={{ color: ORANGE }} />
              <p
                className="mt-4 text-[14px] font-bold"
                style={{ color: TEXT_PRIMARY }}
              >
                AI is reviewing your proof...
              </p>
              <p className="mt-1 text-[11px]" style={{ color: TEXT_TERTIARY }}>
                Checking date, content & freshness
              </p>
            </div>
          )}

          {/* ============== RESULT MODE ============== */}
          {mode === "result" && verdict && (
            <div className="p-5 space-y-4 max-w-3xl w-full mx-auto">
              <div
                className="rounded-2xl p-5 text-center"
                style={{
                  backgroundColor: verdict.verified
                    ? "rgba(52,199,89,0.08)"
                    : "rgba(255,69,58,0.08)",
                  border: `1px solid ${
                    verdict.verified ? "rgba(52,199,89,0.3)" : "rgba(255,69,58,0.3)"
                  }`,
                }}
              >
                <div
                  className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-3"
                  style={{
                    backgroundColor: verdict.verified
                      ? "rgba(52,199,89,0.15)"
                      : "rgba(255,69,58,0.15)",
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
                  {verdict.verificationScore}
                  <span className="text-[14px] ml-1" style={{ color: TEXT_TERTIARY }}>
                    /100
                  </span>
                </p>
                <p
                  className="text-[12px] mt-3 leading-relaxed px-2"
                  style={{ color: TEXT_SECONDARY }}
                >
                  {verdict.verificationFeedback}
                </p>
                {verdict.aiGenerated && (
                  <p
                    className="text-[9px] mt-3 tracking-widest uppercase"
                    style={{ color: TEXT_TERTIARY }}
                  >
                    AI reviewed · {verdict.modelUsed || "Gemini"}
                  </p>
                )}
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
                  Claim +50 XP
                </button>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={retake}
                    className="w-full py-3 rounded-xl flex items-center justify-center gap-2 active:scale-95"
                    style={{
                      backgroundColor: ORANGE,
                      color: "#000",
                      fontSize: 13,
                      fontWeight: 800,
                    }}
                  >
                    <Camera size={14} />
                    Try again with new photo
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

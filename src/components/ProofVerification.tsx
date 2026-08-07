import React from "react";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Camera, Loader2, CheckCircle2, XCircle, Sparkles } from "lucide-react";
import type { BlueprintTask } from "../types";
import { verifyGoalProof, type ProofVerdict } from "../lib/goalApi";

interface ProofVerificationProps {
  task: BlueprintTask;
  taskIndex: number;
  onClose: () => void;
  onVerified: (result: { verified: boolean; score: number; feedback: string; imageAttached: boolean; proofText: string }) => void;
}

export default function ProofVerification({ task, taskIndex, onClose, onVerified }: ProofVerificationProps) {
  const [proofText, setProofText] = useState(task.proofText || "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(task.hasProofImage ? "✓" : null);
  const [loading, setLoading] = useState(false);
  const [verdict, setVerdict] = useState<ProofVerdict | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const pickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      setError("Image too large (max 4MB).");
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
    setError(null);
  };

  const submit = async () => {
    if (!proofText.trim() && !imageFile) {
      setError("Add a written proof or a photo to verify.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const v = await verifyGoalProof({
        taskTitle: task.title,
        taskDescription: task.description,
        proofText: proofText.trim(),
        imageFile,
      });
      setVerdict(v);
      if (v.verified) {
        onVerified({
          verified: true,
          score: v.verificationScore,
          feedback: v.verificationFeedback,
          imageAttached: !!imageFile,
          proofText: proofText.trim(),
        });
      }
    } catch (e: any) {
      setError(e?.message || "Verification failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const close = () => {
    if (verdict?.verified) onClose();
    else onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[160] flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4"
        onClick={close}
      >
        <motion.div
          initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
          transition={{ ease: [0.22, 1, 0.36, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="dossier atelier-grain w-full sm:max-w-md rounded-t-[24px] sm:rounded-[24px] p-6 relative max-h-[90vh] overflow-y-auto scrollbar-none"
        >
          <button onClick={close} className="absolute top-4 right-4" style={{ color: "var(--atelier-muted)" }}><X size={18} /></button>

          {/* Header */}
          <div className="mb-5 pr-8">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="chapter-num">{String(taskIndex + 1).padStart(2, "0")}</span>
              <span className="eyebrow" style={{ fontSize: 9 }}>verify directive</span>
            </div>
            <h3 className="serif text-lg leading-tight" style={{ color: "var(--atelier-ink)", fontWeight: 700 }}>{task.title}</h3>
            <p className="text-[11px] mt-1 leading-relaxed" style={{ color: "var(--atelier-muted)" }}>{task.description}</p>
          </div>

          {verdict ? (
            /* ── Result view ── */
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
              <div
                className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4"
                style={{
                  background: verdict.verified ? "rgba(143,169,142,0.12)" : "rgba(201,139,107,0.12)",
                  border: `1px solid ${verdict.verified ? "rgba(143,169,142,0.4)" : "rgba(201,139,107,0.4)"}`,
                }}
              >
                {verdict.verified
                  ? <CheckCircle2 size={30} style={{ color: "var(--atelier-sage)" }} />
                  : <XCircle size={30} style={{ color: "#C98B6B" }} />}
              </div>
              <p className="serif text-xl mb-1" style={{ color: "var(--atelier-ink)" }}>
                {verdict.verified ? "Verified" : "Needs more proof"}
              </p>
              <p className="figure mb-3" style={{ fontSize: 32, color: "var(--atelier-brass)" }}>
                {verdict.verificationScore}<span className="text-[14px]" style={{ color: "var(--atelier-muted)" }}>/100</span>
              </p>
              <p className="text-[12px] leading-relaxed px-2 mb-4" style={{ color: "var(--atelier-ink)" }}>
                {verdict.verificationFeedback}
              </p>
              {verdict.aiGenerated && (
                <p className="eyebrow mb-4" style={{ fontSize: 8, color: "var(--atelier-sage)" }}>◆ AI-reviewed by {verdict.modelUsed}</p>
              )}
              <button
                onClick={close}
                className="w-full py-3 rounded-xl transition-all"
                style={{ background: "var(--atelier-brass)", color: "#0A0908", fontWeight: 700 }}
              >
                {verdict.verified ? "Done" : "Close"}
              </button>
            </motion.div>
          ) : (
            /* ── Submission view ── */
            <div className="space-y-4">
              {/* Image upload */}
              <div>
                <label className="eyebrow block mb-2" style={{ fontSize: 9 }}>evidence photo <span style={{ color: "var(--atelier-muted)" }}>(optional)</span></label>
                <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={pickImage} className="hidden" />
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full py-4 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all"
                  style={{ border: "1px dashed var(--atelier-faint)", background: "var(--atelier-surface)" }}
                >
                  {imagePreview && imagePreview !== "✓" ? (
                    <img src={imagePreview} alt="proof" className="max-h-24 rounded-lg object-cover" />
                  ) : (
                    <>
                      <Camera size={20} style={{ color: "var(--atelier-brass)" }} />
                      <span className="eyebrow" style={{ fontSize: 9, color: "var(--atelier-muted)" }}>{imageFile ? "Change photo" : "Add photo"}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Text proof */}
              <div>
                <label className="eyebrow block mb-2" style={{ fontSize: 9 }}>written proof</label>
                <textarea
                  value={proofText}
                  onChange={(e) => setProofText(e.target.value)}
                  placeholder={`Describe what you did for "${task.title}"…`}
                  rows={3}
                  className="w-full rounded-xl p-3 text-[13px] outline-none transition-all resize-none"
                  style={{ background: "var(--atelier-surface)", border: "1px solid var(--atelier-faint)", color: "var(--atelier-ink)" }}
                />
              </div>

              {error && <p className="text-[11px]" style={{ color: "#C98B6B" }}>{error}</p>}

              <button
                onClick={submit}
                disabled={loading}
                className="w-full py-3 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                style={{ background: "var(--atelier-brass)", color: "#0A0908", fontWeight: 700 }}
              >
                {loading ? (
                  <><Loader2 size={15} className="animate-spin" /> Verifying…</>
                ) : (
                  <><Sparkles size={15} /> Submit for AI review</>
                )}
              </button>
              <p className="text-center eyebrow" style={{ fontSize: 8, color: "var(--atelier-muted)" }}>
                AI audits your proof against the directive
              </p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

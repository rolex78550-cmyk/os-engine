import type { GoalBlueprint, GoalProgress } from '../types';

/** Verdict shape returned by /api/goals/verify-proof */
export interface ProofVerdict {
  verified: boolean;
  verificationScore: number;
  verificationFeedback: string;
  verifiedAt: string;
  aiGenerated: boolean;
  modelUsed?: string;
  error?: string;
}

/**
 * Calls the AI Goal Blueprint API.
 * Generates a complete structured blueprint from Gemini.
 * Falls back gracefully if AI fails.
 */
export async function generateGoalBlueprint(
  goalTitle: string,
  category: string
): Promise<GoalBlueprint> {
  try {
    const res = await fetch('/api/goals/generate-blueprint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goalTitle, category }),
    });

    if (!res.ok) throw new Error('Blueprint API failed: HTTP ' + res.status);

    const data = await res.json();
    return data as GoalBlueprint;
  } catch (err) {
    console.error('[goalApi] Blueprint generation failed:', err);
    throw err;
  }
}

/**
 * Phase 2 — Submits a task-completion proof (text + optional image) for
 * AI verification. Image is read as base64 and sent inline (no Storage).
 */
export async function verifyGoalProof(input: {
  taskTitle: string;
  taskDescription?: string;
  proofText?: string;
  imageFile?: File | null;
}): Promise<ProofVerdict> {
  const { taskTitle, taskDescription, proofText, imageFile } = input;

  let imageBase64: string | undefined;
  if (imageFile) {
    // Compress/resize before base64 so the payload stays well under the
    // API body limit (prevents HTTP 413 on large photos).
    imageBase64 = await fileToCompressedBase64(imageFile, 900, 0.6);
  }

  const res = await fetch('/api/goals/verify-proof', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      taskTitle,
      taskDescription: taskDescription || '',
      proofText: proofText || '',
      imageBase64,
    }),
  });

  if (!res.ok) throw new Error('Verify API failed: HTTP ' + res.status);
  return (await res.json()) as ProofVerdict;
}

/**
 * Phase 2 — Recalculates adaptive intelligence metrics for a goal based on
 * current task completion state. Returns momentum/discipline/execution/focus
 * scores, updated success probability, projected date, and an AI insight.
 */
export async function recalculateGoal(input: {
  blueprint: GoalBlueprint;
}): Promise<GoalProgress> {
  const { blueprint } = input;
  const res = await fetch('/api/goals/recalculate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      goalName: blueprint.goal_name,
      difficulty: blueprint.difficulty,
      estimatedDuration: blueprint.estimated_duration,
      successProbability: blueprint.success_probability,
      tasks: blueprint.daily_tasks.map((t) => ({
        title: t.title,
        completed: !!t.completed,
        verified: !!t.verified,
      })),
    }),
  });

  if (!res.ok) throw new Error('Recalculate API failed: HTTP ' + res.status);
  return (await res.json()) as GoalProgress;
}

/**
 * Reads a File, downscales it to `maxDim` (long edge) and re-encodes as a
 * JPEG data URL at `quality`. Dramatically shrinks camera photos before they
 * are sent to the AI proof API (avoids HTTP 413 + reduces latency/cost).
 */
function fileToCompressedBase64(
  file: File,
  maxDim: number,
  quality: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        try {
          const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
          const w = Math.max(1, Math.round(img.width * scale));
          const h = Math.max(1, Math.round(img.height * scale));
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(reader.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL("image/jpeg", quality));
        } catch {
          resolve(reader.result as string);
        }
      };
      img.onerror = () => resolve(reader.result as string);
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read image"));
    reader.readAsDataURL(file);
  });
}

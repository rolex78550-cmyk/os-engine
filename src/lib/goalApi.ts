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
    imageBase64 = await fileToBase64(imageFile);
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

/** Reads a File into a base64 data URL. */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read image'));
    reader.readAsDataURL(file);
  });
}

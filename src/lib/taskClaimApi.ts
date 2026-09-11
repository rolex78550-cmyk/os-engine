// Client wrapper for the server-authoritative task claim API.
// The server verifies the Firebase token, runs the AI audit, blocks
// duplicates and awards XP. The client only displays the result.

import { auth } from "./firebase";
import type { TaskId } from "./taskCatalog";

export interface ClaimResult {
  verified: boolean;
  xpAwarded?: number;
  score?: number;
  feedback?: string;
  flags?: string[];
  attemptsLeft?: number;
  newLevel?: number;
  leveledUp?: boolean;
  seasonXp?: number;
  lifetimeXp?: number;
  /** Set when the request was refused (not a verdict): ALREADY_CLAIMED, ATTEMPTS_EXHAUSTED, AI_UNAVAILABLE, IMAGE_REUSED, AUTH_REQUIRED… */
  error?: string;
  message?: string;
  httpStatus: number;
}

export interface TodayClaims {
  date: string;
  claims: Record<string, { verified: boolean; attempts: number; score: number | null; feedback: string | null }>;
  maxAttempts: number;
  xpPerTask: number;
}

async function authHeader(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) throw new Error("Sign in required.");
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

/** Compress an image File to a JPEG data URL (max edge px, quality). */
export async function fileToCompressedDataUrl(file: File, maxEdge = 1024, quality = 0.7): Promise<string> {
  const dataUrl: string = await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("Could not read image"));
    r.readAsDataURL(file);
  });
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const c = document.createElement("canvas");
      c.width = w; c.height = h;
      const ctx = c.getContext("2d");
      if (!ctx) return resolve(dataUrl);
      ctx.drawImage(img, 0, 0, w, h);
      resolve(c.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export async function claimTask(taskId: TaskId, imageDataUrl?: string): Promise<ClaimResult> {
  const headers = { "Content-Type": "application/json", ...(await authHeader()) };
  const res = await fetch("/api/tasks/claim", {
    method: "POST",
    headers,
    body: JSON.stringify({ taskId, imageBase64: imageDataUrl }),
  });
  let body: any = {};
  try { body = await res.json(); } catch {}
  return { ...body, verified: !!body.verified, httpStatus: res.status };
}

export async function fetchTodayClaims(): Promise<TodayClaims | null> {
  try {
    const res = await fetch("/api/tasks/today", { headers: await authHeader() });
    if (!res.ok) return null;
    return (await res.json()) as TodayClaims;
  } catch {
    return null;
  }
}

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import Razorpay from "razorpay";
import crypto from "crypto";
import admin from "firebase-admin";
import dotenv from "dotenv";

import fs from "fs";

dotenv.config();

const app = express();

// Body parsing middleware
// We need the RAW body for webhook HMAC signature verification.
// express.json() normally discards the raw buffer, so we use the
// `verify` hook to stash it on `req.rawBody` before parsing.
app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf && buf.length ? buf.toString("utf8") : "";
    },
  })
);

// ----- CORS & JSON headers for all API routes -----
app.use('/api', (req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// ============================================================
// LAZY INITIALIZATION - nothing touches Firebase/Razorpay/Gemini
// at module scope. Everything is inside getter functions so the
// Express app ALWAYS starts, even if a service is down.
// ============================================================

// Firebase Admin - fully lazy
let _db: any = null;
let _firebaseInitError: string | null = null;

function getFirebaseConfig() {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  try {
    return JSON.parse(fs.readFileSync(configPath, "utf-8"));
  } catch {
    return {
      projectId: process.env.FIREBASE_PROJECT_ID || "gen-lang-client-0876553272",
      firestoreDatabaseId: process.env.FIREBASE_DATABASE_ID || "(default)",
    };
  }
}

function getDb() {
  if (_db) return _db;
  if (_firebaseInitError) throw new Error(_firebaseInitError);

  try {
    const config = getFirebaseConfig();
    console.log("[firebase] Initializing with project:", config.projectId);

    if (!admin.apps.length) {
      admin.initializeApp({ projectId: config.projectId });
    }
    const fbApp = admin.apps[0];

    _db = fbApp.firestore();

    console.log("[firebase] Initialized successfully");
    return _db;
  } catch (err: any) {
    _firebaseInitError = err.message || String(err);
    console.error("[firebase] Init failed:", _firebaseInitError);
    throw err;
  }
}

// Supported env var names for the Gemini API key, in priority order.
// This makes the key work regardless of how it was named on Vercel / AI Studio,
// eliminating the most common "AI silently falls back" failure.
const GEMINI_KEY_ENV_VARS = [
  "gemini_key",
  "GEMINI_API_KEY",
  "GEMINI_KEY",
  "GOOGLE_API_KEY",
  "GOOGLE_GENAI_API_KEY",
] as const;

// Tracks which env var actually provided the key (for diagnostics).
let _resolvedGeminiKeyName: string | null = null;
function resolveGeminiKey(): string | null {
  for (const name of GEMINI_KEY_ENV_VARS) {
    const val = (process.env as Record<string, string | undefined>)[name];
    if (val && val.trim().length > 0) {
      _resolvedGeminiKeyName = name;
      return val.trim();
    }
  }
  return null;
}

// Safe lazy-initialization of Gemini SDK
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = resolveGeminiKey();
    if (!apiKey) {
      console.warn(
        "[Gemini] No API key found. Checked env vars:",
        GEMINI_KEY_ENV_VARS.join(", ")
      );
      return null;
    }
    try {
      aiClient = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      console.log("[Gemini] Client ready. Key source:", _resolvedGeminiKeyName);
    } catch (e) {
      console.error("[Gemini] Failed to initialize:", e);
      return null;
    }
  }
  return aiClient;
}

// ============================================================
// MODEL FALLBACK CHAIN — stretches free-tier quota 3x.
// Each model has its OWN daily quota bucket, so if the primary
// (gemini-3.5-flash) hits 429 quota, we automatically retry with
// the next model until one succeeds.
// ============================================================
const GEMINI_MODELS = [
  "gemini-3.5-flash",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
];

function safeStringify(obj: any): string {
  if (!obj) return "";
  if (typeof obj === "string") return obj;
  if (typeof obj !== "object") return String(obj);
  try {
    const seen = new WeakSet();
    return JSON.stringify(obj, (key, value) => {
      if (typeof value === "object" && value !== null) {
        if (seen.has(value)) {
          return "[Circular]";
        }
        seen.add(value);
      }
      return value;
    });
  } catch {
    return String(obj?.message || obj || "");
  }
}

function isQuotaError(err: any): boolean {
  const status = err?.status || err?.code;
  const msg = (err?.message || safeStringify(err) || "").toLowerCase();
  return status === 429 || status === "RESOURCE_EXHAUSTED" || msg.includes("quota") || msg.includes("resource_exhausted") || msg.includes("rate limit");
}

/**
 * Calls Gemini with automatic model fallback.
 * Tries each model in GEMINI_MODELS until one succeeds.
 * Quota (429) errors -> try next model; other errors -> throw immediately.
 */
async function generateWithFallback(params: {
  prompt?: string;
  contents?: any;
  config?: any;
}): Promise<{ text: string; modelUsed: string }> {
  const client = getGeminiClient();
  if (!client) throw new Error("NO_API_KEY");

  const { prompt, contents, config } = params;
  const finalContents: any = contents ?? prompt;
  let lastErr: any = null;

  for (const model of GEMINI_MODELS) {
    try {
      const response = await client.models.generateContent({
        model,
        contents: finalContents,
        config,
      });
      const text = response.text || "";
      if (text.trim().length === 0) throw new Error("Empty response from " + model);
      return { text, modelUsed: model };
    } catch (err: any) {
      lastErr = err;
      if (isQuotaError(err)) {
        console.warn(`[Gemini] ${model} quota exhausted (429). Trying next model...`);
        continue;
      }
      throw err;
    }
  }
  const e: any = new Error("ALL_MODELS_QUOTA_EXHAUSTED");
  e.lastError = lastErr?.message || String(lastErr);
  e.status = 429;
  throw e;
}
// Does NOT expose the key. Performs a tiny real round-trip call to Gemini.
app.get("/api/ai/status", async (req, res) => {
  const envVarsChecked = GEMINI_KEY_ENV_VARS.reduce((acc, name) => {
    acc[name] = !!((process.env as Record<string, string | undefined>)[name]);
    return acc;
  }, {} as Record<string, boolean>);

  const rawKey = resolveGeminiKey();
  const client = getGeminiClient();

  if (!client || !rawKey) {
    return res.json({
      status: "OFFLINE",
      ai_live: false,
      model: "gemini-3.5-flash",
      reason: "No Gemini API key found in any supported env var.",
      env_vars_checked: envVarsChecked,
      endpoints_using_ai: [
        "/api/goals/generate-blueprint",
        "/api/goals/verify-proof",
        "/api/goals/recalculate",
        "/api/manifestation/coach",
        "/api/manifestation/insight",
        "/api/manifestation/journal-analyze",
        "/api/manifestation/quest-verify",
        "/api/manifestation/generate-quests",
        "/api/manifestation/onboarding",
      ],
      impact: "All AI features are currently returning HARDCODED FALLBACK responses.",
      action:
        "Set gemini_key (or GEMINI_API_KEY) in Vercel → Project → Settings → Environment Variables, then redeploy.",
      timestamp: new Date().toISOString(),
    });
  }

  // Real round-trip test — proves the key is valid AND a model responds.
  // Uses the fallback chain so status reflects whether ANY model works.
  try {
    const result = await generateWithFallback({
      prompt: "Reply with exactly these words: AI OK",
      config: { temperature: 0 },
    });
    const sample = (result.text || "").trim().slice(0, 60);
    return res.json({
      status: "LIVE",
      ai_live: true,
      model: result.modelUsed,
      models_tried: GEMINI_MODELS,
      env_var_found: _resolvedGeminiKeyName,
      key_preview: rawKey.slice(0, 6) + "..." + rawKey.slice(-3),
      test_response_sample: sample,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    const msg = error?.message || String(error);
    const status = error?.status || error?.code;
    const isQuota = status === 429 || msg.includes("quota") || msg.includes("RESOURCE_EXHAUSTED");
    const isAuth = status === 401 || status === 403 || msg.includes("API key");
    const isModel = status === 404 || msg.includes("not found") || msg.includes("model");
    return res.json({
      status: "ERROR",
      ai_live: false,
      model: "gemini-3.5-flash",
      reason: "Gemini key found, but the live test call failed.",
      env_var_found: _resolvedGeminiKeyName,
      key_preview: rawKey.slice(0, 6) + "..." + rawKey.slice(-3),
      http_status: status,
      error: msg,
      hint: isQuota
        ? "Quota/rate limit exhausted for this key. AI falls back until quota resets."
        : isAuth
        ? "Key looks invalid/revoked. Generate a fresh key in Google AI Studio."
        : isModel
        ? "Model name rejected by Google. Verify gemini-3.5-flash is still current."
        : "Network/region or transient issue. Retry shortly.",
      timestamp: new Date().toISOString(),
    });
  }
});

// Razorpay client initialization
let razorpay: Razorpay | null = null;
function getRazorpay(): Razorpay {
  if (!razorpay) {
    const keyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || process.env.razorpay_key_id;
    const keySecret = process.env.RAZORPAY_KEY_SECRET || process.env.rz_secrete_key || process.env.rz_secret_key;

    if (!keyId || !keySecret) {
      console.error("CRITICAL: Razorpay credentials missing. ID present:", !!keyId, "Secret present:", !!keySecret);
      throw new Error("Razorpay credentials are not set correctly in environment variables.");
    }

    console.log(`Initializing Razorpay with Key ID: ${keyId.substring(0, 8)}...`);
    // @ts-ignore - Razorpay types can be finicky in ESM
    razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }
  return razorpay;
}

// API Route: Health check (useful for Vercel cold start verification)
app.get("/api/health", (req, res) => {
  const config = getFirebaseConfig();
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.VERCEL ? "vercel" : (process.env.NODE_ENV || "development"),
    razorpay_configured: !!(process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID),
    firebase_configured: !!config.projectId,
    firebase_lazy_ready: !_firebaseInitError
  });
});

// API Route: Onboarding personalization based on user questions
app.post("/api/manifestation/onboarding", async (req, res) => {
  try {
    const { name, focusText, category, belief } = req.body;
    const client = getGeminiClient();

    const prompt = `You are the "Quantum Coherence Scribe" for Manifestation OS.
The user has initialized their manifestation cosmic stream with the following answers:
- Name: "${name || "Seeker"}"
- Primary manifestation desire / focus: "${focusText || "Abundance and clarity"}"
- Focus category: "${category || "wealth"}" (Must be spiritual, lifestyle, wealth, or career)
- Initial self-reported belief level in this reality: ${belief || 75}%

Generate a tailored quantum alignment blueprint for this user.
You must return a JSON object with:
1. "profile": An updated profile object containing:
   - "name": The user's name or a refined cosmological version if requested (use "${name || "Seeker"}")
   - "alignment": Initial compliance level (between 70 and 85)
   - "belief": Initial active energy level (use ${belief || 75})
   - "emotion": Initial frequency level (between 65 and 80)
   - "action": Initial movement level (between 60 and 80)
   - "universeRank": A customized manifestation ranking title (e.g., "Abundance Sovereign", "Timeline Alchemist", "Spiritual Architect", "Quantum Pioneer").
2. "desires": A list of exactly 2 core desires (goals) related to their focus.
   Each desire must match the following format:
   - "title": Clean title starting with an elegant emoji (e.g. "💰 Manifest ₹5,000,000 Startup Capital", "🏡 Ground My Serene Mountain Sanctuary")
   - "progress": Initial value (typically 10-25)
   - "expectedReality": A conceptual state string (e.g. "Formulating Coherence", "Subtle Materializing", "Quantum Sowing")
   - "category": Must be one of: "wealth", "lifestyle", "career", "spiritual"
   - "icon": An emoji
   - "beliefLevel": Number (use ${belief || 75})
   - "emotionalState": Number (initial value 60-80)
   - "consistencyScore": Number (initial value 40-60)
3. "rituals": A list of exactly 4 personalized daily rituals (habits) matching:
   - "id": A lower-case kebab-case unique string (e.g., "sovereign-meditation")
   - "label": An evocative and inspiring manifestation practice title (e.g. "Vortex Gratitude Anchor", "Reverse scripting high-noon loop", "Abundance frequency tuning")
   - "lastCompletedDate": undefined (rituals start fresh, not done yet)
   - "timeOfDay": One of "morning", "noon", "night", "any"
4. "quests": A list of exactly 3 tactical, exciting daily quests for their first day matching:
   - "id": Unique string (e.g. "q-anchor-1")
   - "title": Captivating quest name matching the style (e.g. "Temporal Scripting", "The Leap of Faith")
   - "xpValue": A number between 15 and 45
   - "completed": false
   - "category": One of "action", "mindset", "energy"
   - "description": A high-resonance, motivating 1-2 sentence instruction.

Response format: Must return an object with keys "profile", "desires", "rituals", and "quests".
Response Mime Type: application/json.`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.85,
      },
    });

    const resultText = response.text || "{}";
    const data = JSON.parse(resultText);
    res.json(data);
  } catch (error: any) {
    console.error("Onboarding Generation Error:", error);
    const name = req.body.name || "Seeker";
    const belief = req.body.belief || 75;

    // Resilient fallback blueprint
    res.json({
      profile: {
        name: name,
        alignment: 80,
        belief: belief,
        emotion: 70,
        action: 70,
        universeRank: "Abundance Pioneer"
      },
      desires: [
        {
          id: "d-fallback-1",
          title: "💰 Attract Divine Wealth & Financial Freedom",
          progress: 20,
          expectedReality: "Formulating Coherence",
          category: "wealth",
          icon: "💰",
          beliefLevel: belief,
          emotionalState: 70,
          consistencyScore: 50,
          creationDate: new Date().toISOString().split('T')[0]
        },
        {
          id: "d-fallback-2",
          title: "⚡ Live My Optimal Purpose & Sovereign Lifestyle",
          progress: 15,
          expectedReality: "Subtle Materializing",
          category: "lifestyle",
          icon: "⚡",
          beliefLevel: belief,
          emotionalState: 75,
          consistencyScore: 45,
          creationDate: new Date().toISOString().split('T')[0]
        }
      ],
      rituals: [
        { id: "morning-gratitude", label: "Vortex Gratitude Anchor", timeOfDay: "morning" },
        { id: "noon-alignment", label: "Core Frequency Tuning", timeOfDay: "noon" },
        { id: "night-scripting", label: "Reverse Scripting Timeline Log", timeOfDay: "night" },
        { id: "any-mindfulness", label: "Quantum Breath Breathwork", timeOfDay: "any" }
      ],
      quests: [
        { id: "q-fallback-1", title: "The Quantum Leap", xpValue: 30, completed: false, category: "action", description: "Do one action that aligns directly with your target state today." },
        { id: "q-fallback-2", title: "Mirror Resonance", xpValue: 25, completed: false, category: "mindset", description: "Self-affirm your success in front of a mirror with pure emotion." },
        { id: "q-fallback-3", title: "Gratitude Sweep", xpValue: 20, completed: false, category: "energy", description: "Mention three things that already exist that you're immensely grateful for." }
      ]
    });
  }
});

// API Route: Generate personalized daily quests
app.post("/api/manifestation/generate-quests", async (req, res) => {
  try {
    const { desires, profileState } = req.body;
    const client = getGeminiClient();

    const desireContext = desires && desires.length > 0
      ? desires.map((d: any) => d.title).join(", ")
      : "General manifestation and clarity";

    const prompt = `You are the "Quantum Architect" for Manifestation OS.
Generate 3 highly specific, creative, and "addictive" daily quests for a user aiming to manifest: ${desireContext}.
The user is currently Level ${profileState?.level || 1} with a rank of "${profileState?.universeRank || "Aspiration Seeker"}".

Each quest must have:
1. "title": A short, intriguing name (e.g., "The Void Call", "Frequency Anchor").
2. "description": A 1-2 sentence instruction that is actionable and mystical.
3. "xpValue": Between 10 and 50 points.
4. "category": One of: "action", "mindset", "energy".
5. "id": A unique string.

Response format: JSON array of 3 quest objects.
Response Mime Type: application/json.`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.9,
      },
    });

    const resultText = response.text || "[]";
    const quests = JSON.parse(resultText);
    res.json(quests);
  } catch (error: any) {
    const isQuota = error?.message?.includes("quota") || error?.status === "RESOURCE_EXHAUSTED" || safeStringify(error).includes("429");
    if (isQuota) {
      console.warn("Notice: Quest Generation Quota Limit encountered. Seamless fallback engaged.");
    } else {
      console.error("Quest Generation Error:", error);
    }

    // Fallback quests
    res.json([
      { id: "fq1", title: "Quantum Breath", xpValue: 15, category: "energy", description: "Take 10 deep breaths while visualizing your primary desire already achieved." },
      { id: "fq2", title: "Mirror Alignment", xpValue: 20, category: "mindset", description: "Look into your own eyes for 2 minutes and repeat: 'I am the architect of this reality.'" },
      { id: "fq3", title: "The Small Leap", xpValue: 30, category: "action", description: "Perform one physical action that your future self (who already has your desire) would do today." }
    ].map(q => ({ ...q, isSimulation: true })));
  }
});

// API Route: AI Law of Attraction Coach
app.post("/api/manifestation/coach", async (req, res) => {
  try {
    const { message, history, profileContext, desiresContext } = req.body;
    const client = getGeminiClient();
    const model = "gemini-3.5-flash";

    const desireSummary = desiresContext?.length > 0
      ? desiresContext.map((d: any) => `\n- Title: ${d.title}\n  Reality: ${d.expectedReality}\n  Belief: ${d.beliefLevel}%\n  Target Date: ${d.targetDate}`).join("")
      : "No specific desires captured yet.";

    const prompt = `You are a highly advanced, empathetic Quantum Manifestation Coach (Law of Attraction Advisor). 
You help users align their frequency, reframe blockages, and offer actionable manifestation techniques.
Maintain a mystical yet grounded and encouraging tone. Keep responses helpful, concise, and focused on the law of attraction and quantum shifting.

User Profile:
- Level: ${profileContext?.level || 1}
- Coherence Score: ${profileContext?.alignment || 50}%
- Master Rank: ${profileContext?.universeRank || "Aspiration Seeker"}

Active Desires: ${desireSummary}

Chat History:
${history.map((h: any) => `${h.role}: ${h.content}`).join("\\n")}
user: ${message}
assistant:`;

    const response = await client.models.generateContent({
      model,
      contents: prompt,
      config: {
        temperature: 0.8,
      },
    });

    res.json({ reply: response.text });
  } catch (error: any) {
    const isQuota = error?.status === "RESOURCE_EXHAUSTED" || safeStringify(error).includes("429") || error?.message?.includes("quota") || error?.status === "UNAVAILABLE" || error?.message?.includes("high demand") || error?.code === 503;
    if (isQuota) {
      console.warn("Notice: Coach chat quota/demand exceeded. Engaging graceful fallback.");
    } else {
      console.error("Coach API error:", error);
    }
    res.json({ reply: "I sense some resistance in the quantum field. Let's take a deep breath and try aligning our frequency again shortly. (The universal energy pool is currently experiencing high demand)" });
  }
});

// API Route: Upgrade user to premium
app.post("/api/user/upgrade", async (req, res) => {
  try {
    const { uid } = req.body;
    if (!uid) return res.status(400).json({ error: "UID required" });

    await getDb().collection("users").doc(uid).set({
      subscriptionStatus: "premium"
    }, { merge: true });

    // Seed simulated transaction
    const txId = `tx_rzp_${Date.now()}`;
    await getDb().collection("simulated_payments").doc(txId).set({
      id: txId,
      userId: uid,
      amount: 10,
      currency: "INR",
      status: "success",
      description: "Monthly Premium Subscription (Razorpay)",
      timestamp: new Date().toISOString()
    });

    res.json({ status: "ok" });
  } catch (error: any) {
    console.error("User Upgrade Error:", error);
    res.status(500).json({ error: "Failed to upgrade user" });
  }
});

// Security Hardened Admin Verification Middleware
const verifyAdmin = async (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Access denied. Auth token required." });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Strict Admin whitelist: only asartist20@gmail.com is authorized
    if (decodedToken.email !== "asartist20@gmail.com") {
      return res.status(403).json({ error: "Forbidden. Admin privileges required." });
    }

    req.adminUser = decodedToken;
    next();
  } catch (error) {
    console.error("Admin verification error:", error);
    res.status(401).json({ error: "Access token is invalid or expired." });
  }
};

// Secure Admin API: List all users
app.get("/api/admin/users", verifyAdmin, async (req, res) => {
  try {
    const usersSnapshot = await getDb().collection("users").get();
    const users: any[] = [];
    usersSnapshot.forEach((docSnap) => {
      users.push({ id: docSnap.id, ...docSnap.data() });
    });
    res.json({ status: "ok", users });
  } catch (error: any) {
    console.error("Fetch admin users error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Secure Admin API: Toggle User Subscription Status
app.post("/api/admin/user/toggle-subscription", verifyAdmin, async (req, res) => {
  try {
    const { uid, status } = req.body;
    if (!uid || !status || !["free", "premium"].includes(status)) {
      return res.status(400).json({ error: "Invalid parameters. uid and status required." });
    }

    await getDb().collection("users").doc(uid).set({
      subscriptionStatus: status
    }, { merge: true });

    // Record transational ledger audit log
    const txId = `tx_adm_${Date.now()}`;
    const paymentLog = {
      id: txId,
      userId: uid,
      amount: status === "premium" ? 10 : 0,
      currency: "INR",
      status: "success",
      description: status === "premium" ? "Admin Granted Premium status manually" : "Admin Revoked Subscription",
      timestamp: new Date().toISOString()
    };
    await getDb().collection("simulated_payments").doc(txId).set(paymentLog);

    res.json({ status: "ok", subscriptionStatus: status });
  } catch (error: any) {
    console.error("Admin toggle subscription error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Secure Admin API: List all payments
app.get("/api/admin/payments", verifyAdmin, async (req, res) => {
  try {
    const paymentsSnapshot = await getDb().collection("simulated_payments").get();
    const payments: any[] = [];
    paymentsSnapshot.forEach((docSnap) => {
      payments.push({ id: docSnap.id, ...docSnap.data() });
    });

    // Sort in-memory so database indexes aren't required
    payments.sort((a, b) => {
      const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return timeB - timeA;
    });

    res.json({ status: "ok", payments });
  } catch (error: any) {
    console.error("Fetch admin payments error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Secure Admin API: Register manual payment
app.post("/api/admin/payments/add", verifyAdmin, async (req, res) => {
  try {
    const { uid, amount, description } = req.body;
    if (!uid || !amount) {
      return res.status(400).json({ error: "Missing parameters: uid and amount are required." });
    }

    const txId = `tx_adm_${Date.now()}`;
    const paymentLog = {
      id: txId,
      userId: uid,
      amount: Number(amount),
      currency: "INR",
      status: "success",
      description: description || "Manual Admin Ledger Upgrade",
      timestamp: new Date().toISOString()
    };
    await getDb().collection("simulated_payments").doc(txId).set(paymentLog);
    res.json({ status: "ok", payment: paymentLog });
  } catch (error: any) {
    console.error("Add manual payment error:", error);
    res.status(500).json({ error: error.message });
  }
});

// API Route: Generate quantum daily manifestation insight
app.post("/api/manifestation/insight", async (req, res) => {
  try {
    const { desires, profileState } = req.body;
    const client = getGeminiClient();

    if (!client) {
      // Fallback response
      return res.json({
        insight: "Your energetic alignment is crystallizing. The transition from thought-form to physical matter requires absolute stillness. Your consistency scores show a distinct stabilization in emotional holding capacity this week, allowing the quantum field to organize around your specific frequency.",
        recommendation: "Spend 3 minutes in sensory silence before scripting tonight. Let the luxury of having already received wash over you.",
        isSimulation: true
      });
    }

    const desireString = desires && desires.length > 0
      ? desires.map((d: any) => `- ${d.title} (Alignment: ${d.progress}%)`).join("\n")
      : "None declared yet";

    const prompt = `You are the master resonance engine for "Manifestation OS".
Profile state: Mindset ${profileState?.alignment || 87}%, Streak ${profileState?.streak || 0}.
Current Desires: ${desireString}
Generate a concise manifestation insight and one tactical action recommendation in JSON format.`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.7,
      },
    });

    const resultText = response.text || "{}";
    const cleanedJson = JSON.parse(resultText);
    res.json({ ...cleanedJson, isSimulation: false });
  } catch (error: any) {
    console.warn("[Insight] Using fallback response:", error?.message || error);
    res.json({
      insight: "Your energetic alignment is crystallizing. The transition from thought-form to physical matter requires absolute stillness. Your consistency scores show a distinct stabilization in emotional holding capacity this week, allowing the quantum field to organize around your specific frequency.",
      recommendation: "Spend 3 minutes in sensory silence before scripting tonight. Let the luxury of having already received wash over you.",
      isSimulation: true
    });
  }
});

// API Route: Analyze scripted journal entry for quantum coherence
app.post("/api/manifestation/journal-analyze", async (req, res) => {
  try {
    const { journalText, scriptType } = req.body;

    if (!journalText || journalText.trim().length === 0) {
      return res.status(400).json({ error: "Empty entry" });
    }

    const client = getGeminiClient();

    const prompt = `You are the spiritual resonance engine for "Manifestation OS".
The user has submitted a modern ${scriptType || 'scripting'} journal entry:
"${journalText}"

Analyze this mental and emotional projection for its energetic match and coherence.
Return a structured JSON with:
1. "coherenceScore" (a number between 40 and 100 based on detail, gratitude, absence of anxiety, and vividness of vocabulary).
2. "primaryFrequency" (a beautiful high-vibe state label, e.g., "Abundance Metamorphic", "Gratitude Resonance", "Sovereign Gratitude", "Quantum Anchored", "Restive Surrender").
3. "coherenceAnalysis" (a single, luxury paragraph summarizing their spiritual-psychological state, pointing out hidden points of resistance or beautiful alignments).
4. "recalibrationText" (a 1-sentence tailored mantra based on their words to repeat 3 times).

Response Mime Type: application/json.`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.7,
      },
    });

    const resultText = response.text || "{}";
    const cleanedJson = JSON.parse(resultText);
    res.json({ ...cleanedJson, isSimulation: false });
  } catch (error: any) {
    const isQuota = error?.message?.includes("quota") || error?.status === "RESOURCE_EXHAUSTED" || safeStringify(error).includes("429");
    if (isQuota) {
      console.warn("Notice: Gemini Journal Analyze API Quota Limit encountered. Transitioned seamlessly to offline Quantum Simulation mode.");
    } else {
      console.warn("Notice: Gemini journal analyze client query is using local Quantum Simulation fallback.", error?.message || error);
    }

    // Premium luxurious mock response if error/no key
    res.json({
      coherenceScore: 84,
      primaryFrequency: "Sovereign Coherence",
      coherenceAnalysis: "Your words carry a refined weight of quiet certainty. By writing in the present state, you've successfully bypassed logical resistance. There is an exquisite resonance between your security indicators and your future-self state, although a small residue of timing anxiety is still lingering in the margins of your script.",
      recalibrationText: "I release the timeline. The physical world is adjusting to my present energetic state with effortless, silent acceleration.",
      isSimulation: true
    });
  }
});

// API Route: Verify a daily quest completion via AI analysis (Multi-modal)
// STRICT IMAGE + TEXT VERIFICATION — used by RPG Adrenaline Quests
app.post("/api/manifestation/quest-verify", async (req, res) => {
  try {
    const { questTitle, proofText, questCategory, imageBase64 } = req.body;

    const client = getGeminiClient();
    if (!client) {
      return res.json({
        verified: false,
        verificationFeedback: "AI service offline. Please upload clear real proof later.",
        verificationScore: 0,
        isSimulation: true
      });
    }

    const model = "gemini-3.5-flash";

    // EXTREMELY STRICT PROMPT — MUST ANALYZE IMAGE CONTENT
    const prompt = `You are a RUTHLESS REAL-WORLD PROOF AUDITOR for Manifestation OS.

Quest to verify: "${questTitle}" (Category: ${questCategory}).

User's submitted text note:
"""
${proofText || "(no text)"}
"""

CRITICAL RULES — FOLLOW EXACTLY:
1. The attached PHOTO (if provided) MUST VISIBLY SHOW the user ACTIVELY PERFORMING the EXACT real-life task described.
2. You MUST analyze the IMAGE PIXELS for evidence. Cross-reference image content with the user's text note and the task name.
3. REJECT IMMEDIATELY (verified = false) for ANY of these:
   - No image uploaded
   - Image is unrelated (selfie without activity, food, memes, random room, screenshot, pet, car, landscape, generic photo)
   - Image does not show the user performing the task (no boxing gloves/punching, no gym weights, no laptop with skill practice, no 2hr focused work, no outreach/selling action)
   - The photo looks staged, old, fake, or does not match the described task
   - Text note is vague, copy-pasted, or does not match the photo
4. Only return verified = true if you are >95% confident that BOTH the image AND text prove the user genuinely did the SPECIFIC task TODAY.
5. Return ONLY clean JSON. Be direct and brutal in feedback.

Return EXACTLY this JSON structure:
{
  "verified": boolean,
  "verificationFeedback": "1-2 sentences. Sharp, honest, no fluff. Explain exactly why accepted or rejected.",
  "verificationScore": number (0-100)
}`;

    let contents: any[] = [{ role: "user", parts: [{ text: prompt }] }];

    if (imageBase64) {
      // Add image to contents for multimodal analysis
      const base64Data = imageBase64.split(",")[1] || imageBase64;
      contents[0].parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Data
        }
      });
    }

    const response = await client.models.generateContent({
      model,
      contents,
      config: {
        responseMimeType: "application/json",
        temperature: 0.2,   // very low for strictness
        topP: 0.9,
      },
    });

    const resultText = response.text || "{}";
    let cleanedJson;
    try {
      cleanedJson = JSON.parse(resultText);
    } catch {
      cleanedJson = {};
    }

    // Normalize to consistent keys used by frontend
    const verified = cleanedJson.verified === true;
    const feedback = cleanedJson.verificationFeedback || cleanedJson.feedback || 
      (verified ? "Proof accepted by the Oracle." : "Image does not show the required real task.");

    res.json({
      verified,
      verificationFeedback: feedback,
      verificationScore: cleanedJson.verificationScore || (verified ? 92 : 28),
      isSimulation: false
    });
  } catch (error: any) {
    const isQuota = error?.message?.includes("quota") || error?.status === "RESOURCE_EXHAUSTED" || safeStringify(error).includes("429");
    if (isQuota) {
      console.warn("Notice: Quest Verification Quota Limit encountered. Engaging simulation protocol.");
    } else {
      console.error("Quest verification error:", error);
    }

    // Safe strict fallback: REJECT when error
    res.json({
      verified: false,
      verificationFeedback: "Verification system error. Please re-upload a clear photo showing you actually doing the task.",
      verificationScore: 0,
      isSimulation: true
    });
  }
});

function buildNotificationEmail(input: any) {
  const name = input.name || "Seeker";
  const ritualLabel = input.ritualLabel || "your manifestation ritual";
  const streak = Number(input.streak || 0);
  const tone = input.tone || "luxury";
  const subject = input.type === "test"
    ? "Menifest OS test reminder is live ✨"
    : `Your ${streak}-day streak is waiting for you 🔥`;
  const body = tone === "soft"
    ? `Hi ${name}, this is a gentle reminder to complete ${ritualLabel}. One small action today keeps your promise to yourself alive.`
    : tone === "intense"
      ? `Hi ${name}, your ${streak}-day identity is on the line. Complete ${ritualLabel} now and protect the reality you are building.`
      : `Hi ${name}, your luxury alignment window is open. Complete ${ritualLabel} and keep your ${streak}-day reality streak glowing.`;

  return {
    subject,
    text: `${body}\n\nOpen Menifest OS and lock in today's action.\n\n— Menifest OS`,
    html: `
      <div style="font-family:Inter,Arial,sans-serif;background:#05030b;color:#fff;padding:32px;border-radius:24px;max-width:620px;margin:auto;border:1px solid rgba(251,191,36,.22)">
        <div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#fbbf24;font-weight:800">Menifest OS</div>
        <h1 style="font-size:28px;line-height:1.1;margin:14px 0;color:#fff">Your reality streak is calling</h1>
        <p style="font-size:16px;line-height:1.7;color:rgba(255,255,255,.72)">${body}</p>
        <div style="margin:24px 0;padding:18px;border-radius:18px;background:rgba(251,191,36,.10);border:1px solid rgba(251,191,36,.20)">
          <strong style="color:#fde68a">Today's action:</strong> ${ritualLabel}<br />
          <strong style="color:#fde68a">Current streak:</strong> ${streak} days
        </div>
        <p style="font-size:13px;color:rgba(255,255,255,.45)">Open Menifest OS and lock in today's action before the window closes.</p>
      </div>
    `,
  };
}

// API Route: Send ritual/promotional notification email
app.post("/api/notifications/send-email", async (req, res) => {
  try {
    const { to } = req.body || {};
    if (!to || typeof to !== "string") {
      return res.status(400).json({ error: "Missing recipient email" });
    }

    const email = buildNotificationEmail(req.body);
    const resendKey = process.env.RESEND_API_KEY;
    const from = process.env.NOTIFICATION_FROM_EMAIL || "Menifest OS <onboarding@resend.dev>";

    if (!resendKey) {
      return res.json({
        sent: false,
        simulated: true,
        provider: "resend",
        message: "RESEND_API_KEY not configured. Email template generated but not delivered.",
        preview: { to, ...email },
      });
    }

    const providerResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject: email.subject,
        html: email.html,
        text: email.text,
      }),
    });

    const data = await providerResponse.json().catch(() => ({}));
    if (!providerResponse.ok) {
      return res.status(502).json({ sent: false, provider: "resend", error: data });
    }

    res.json({ sent: true, provider: "resend", id: data.id });
  } catch (error: any) {
    console.error("Notification email error:", error);
    res.status(500).json({ sent: false, error: error.message || "Email failed" });
  }
});

// API Route: Create Razorpay Order
app.post("/api/razorpay/order", async (req, res) => {
  const { amount = 99, currency = "INR", planType, uid } = req.body;
  const keyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || process.env.razorpay_key_id;
  const keySecret = process.env.RAZORPAY_KEY_SECRET || process.env.rz_secrete_key || process.env.rz_secret_key;

  if (!keyId || !keySecret || keyId.includes("demo") || keyId.includes("placeholder")) {
    return res.json({
      id: `order_demo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      amount: Math.round(Number(amount) * 100),
      currency,
      key_id: keyId || "rzp_test_demo_key",
      is_demo: true,
    });
  }

  try {
    const rzp = getRazorpay();
    const options = {
      amount: Math.round(Number(amount) * 100), // amount in paise (₹99 -> 9900 paise)
      currency,
      receipt: `receipt_${Date.now()}`,
      notes: { planType: planType || "monthly", uid: uid || "" }
    };

    const order = await rzp.orders.create(options);
    return res.json({
      ...order,
      key_id: keyId,
      is_demo: false,
    });
  } catch (_error: any) {
    // Seamless sandbox fallback when test API keys require local authorization
    return res.json({
      id: `order_demo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      amount: Math.round(Number(amount) * 100),
      currency,
      key_id: keyId || "rzp_test_demo_key",
      is_demo: true,
    });
  }
});

// API Route: Subscription Activate (Razorpay INR — used as fallback for India users
// when the Razorpay webhook has not yet fired)
app.post("/api/subscription/activate", async (req, res) => {
  try {
    const { uid, planType, razorpayOrderId, razorpayPaymentId, amount } = req.body;
    if (!uid || !planType) {
      return res.status(400).json({ success: false, error: "uid and planType are required" });
    }

    const db = getDb();
    const userRef = db.collection("users").doc(uid);
    const userDoc = await userRef.get();
    if (!userDoc.exists) return res.status(404).json({ success: false, error: "User not found" });

    const FOUNDER_LIFETIME_LIMIT = 100;
    if (planType === "lifetime") {
      const lifetimePayments = await db.collection("payments").where("planType", "==", "lifetime").where("paymentStatus", "==", "success").get();
      if (lifetimePayments.size >= FOUNDER_LIFETIME_LIMIT) {
        return res.status(403).json({ success: false, error: "Founder Lifetime plan is sold out" });
      }
    }

    const now = new Date();
    let expiryDate = null;
    let status = "active";
    let lifetimeAccess = false;

    if (planType === "lifetime") { lifetimeAccess = true; status = "lifetime"; }
    else if (planType === "monthly") { expiryDate = new Date(now); expiryDate.setDate(expiryDate.getDate() + 30); }
    else if (planType === "yearly") { expiryDate = new Date(now); expiryDate.setDate(expiryDate.getDate() + 365); }

    await userRef.set({
      currentPlan: planType,
      subscriptionStatus: status,
      purchaseDate: now.toISOString(),
      expiryDate: expiryDate ? expiryDate.toISOString() : null,
      lifetimeAccess,
      updatedAt: now.toISOString()
    }, { merge: true });

    // Deterministic payment doc id so re-activations are idempotent.
    const payDocId = razorpayPaymentId || razorpayOrderId || `rzp_act_${uid}_${now.getTime()}`;
    await db.collection("payments").doc(payDocId).set({
      userId: uid, planType, amount: Number(amount) || 0, currency: "INR",
      paymentStatus: "success", razorpayOrderId, razorpayPaymentId, createdAt: now.toISOString()
    }, { merge: true });

    res.json({ success: true, message: "Subscription activated successfully" });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API Route: Dodo Payments Checkout
app.post("/api/dodo/checkout", async (req, res) => {
  try {
    const { amount = 4.99, currency = "USD", planType = "monthly", uid, email, name } = req.body;

    // ── ENV VALIDATION: fail fast with a clear, actionable error ──
    const apiKey = process.env.DODO_PAYMENTS_API_KEY;
    if (!apiKey || apiKey.trim() === "" || apiKey.includes("placeholder")) {
      console.error("[DodoCheckout] ❌ DODO_PAYMENTS_API_KEY is not set.");
      return res.status(500).json({
        error: "Dodo Payments is not configured on the server. Set DODO_PAYMENTS_API_KEY in your environment variables.",
        missing_env: ["DODO_PAYMENTS_API_KEY"],
        fix: "Add DODO_PAYMENTS_API_KEY to Vercel → Project → Settings → Environment Variables, then redeploy."
      });
    }

    const envProductIdKey = `DODO_PRODUCT_ID_${String(planType).toUpperCase()}`;
    const productId = process.env[envProductIdKey] || process.env.DODO_PRODUCT_ID;
    if (!productId || productId.startsWith("prod_")) {
      // prod_monthly / prod_yearly / prod_lifetime are placeholders, not real Dodo product IDs.
      console.error(`[DodoCheckout] ❌ ${envProductIdKey} is not set or is a placeholder (${productId}).`);
      return res.status(500).json({
        error: `Dodo product ID for plan "${planType}" is not configured.`,
        missing_env: [envProductIdKey],
        fix: `Add ${envProductIdKey} (a real Dodo product ID like pdt_xxxxx) in your environment variables, then redeploy.`
      });
    }

    const origin = req.headers.origin || "https://localhost:3000";
    const returnUrl = `${origin}/?payment=success&provider=dodo&plan=${planType}&uid=${uid || ''}`;

    // Determine mode from the actual API key prefix, NOT from a Vite env var
    // (VITE_* vars are only available in the frontend bundle, never on the server).
    const isTest = apiKey.startsWith("test_") || process.env.DODO_PAYMENTS_MODE === "test";
    const host = isTest ? "test.dodopayments.com" : "live.dodopayments.com";
    console.log(`[DodoCheckout] Mode: ${isTest ? "test" : "live"} → ${host}`);

    // Payload strictly conforming to Dodo Payments API documentation
    const payload = {
      product_cart: [
        {
          product_id: productId,
          quantity: 1,
          ...(amount ? { amount: Math.round(Number(amount) * 100) } : {})
        }
      ],
      customer: {
        email: email || "customer@example.com",
        name: name || "Customer",
      },
      return_url: returnUrl,
      metadata: {
        uid: uid || "",
        planType: planType || "monthly",
      },
    };

    let response = await fetch(`https://${host}/checkouts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      response = await fetch(`https://${host}/v1/checkouts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });
    }

    const data = await response.json().catch(() => ({}));

    if (response.ok && (data.checkout_url || data.url || data.payment_link || data.checkout_id || data.id)) {
      return res.json({
        checkout_id: data.checkout_id || data.id,
        checkout_url: data.checkout_url || data.url || data.payment_link,
        payment_id: data.payment_id || `dodo_pay_${Date.now()}`,
      });
    }

    console.warn("[DodoCheckout] API session response issue:", response.status, data);
    return res.status(502).json({
      error: "Dodo Payments API returned an unexpected response. Check server logs.",
      dodo_status: response.status,
      dodo_response: data
    });
  } catch (err: any) {
    console.error("[DodoCheckout] Error:", err?.message || err);
    return res.status(500).json({
      error: "Failed to create Dodo Payments checkout session: " + (err?.message || "Server error")
    });
  }
});

// API Route: Dodo Subscription Activate
// This is the FALLBACK activation path used when the webhook hasn't fired yet
// (e.g. user lands on the return URL before the webhook arrives, or webhook
// is not configured in the Dodo dashboard).
//
// It is also a DEFENSE-IN-DEPTH: even if the webhook fails, this endpoint
// still grants the user access, so the customer never pays without getting
// their subscription.
app.post("/api/dodo/activate", async (req, res) => {
  try {
    const { uid, planType, dodoPaymentId, amount, currency = "USD" } = req.body;
    if (!uid || !planType) {
      return res.status(400).json({ success: false, error: "uid and planType are required" });
    }

    const db = getDb();
    const userRef = db.collection("users").doc(uid);
    const userDoc = await userRef.get();

    // Founder lifetime cap
    if (planType === "lifetime") {
      const lifetimePayments = await db.collection("payments").where("planType", "==", "lifetime").where("paymentStatus", "==", "success").get();
      if (lifetimePayments.size >= 100) {
        return res.status(403).json({ success: false, error: "Founder Lifetime plan is sold out" });
      }
    }

    const now = new Date();
    let expiryDate: Date | null = null;
    let status = "active";
    let lifetimeAccess = false;

    if (planType === "lifetime") {
      lifetimeAccess = true;
      status = "lifetime";
    } else if (planType === "monthly") {
      expiryDate = new Date(now);
      expiryDate.setDate(expiryDate.getDate() + 30);
    } else if (yearlyHelper(planType)) {
      expiryDate = new Date(now);
      expiryDate.setDate(expiryDate.getDate() + 365);
    } else {
      return res.status(400).json({ success: false, error: `Invalid planType: ${planType}` });
    }

    // ── STEP 1: write user doc (source of truth for the app) ──
    await userRef.set({
      currentPlan: planType,
      subscriptionStatus: status,
      purchaseDate: now.toISOString(),
      expiryDate: expiryDate ? expiryDate.toISOString() : null,
      lifetimeAccess,
      updatedAt: now.toISOString(),
    }, { merge: true });

    // ── STEP 2: record the payment (used by deriveAccessFromPayments) ──
    // Use a stable ID so duplicate activations don't create duplicate rows.
    const stablePayId = dodoPaymentId || `dodo_act_${uid}_${now.getTime()}`;
    await db.collection("payments").doc(stablePayId).set({
      userId: uid,
      planType,
      amount: Number(amount) || 0,
      currency,
      paymentStatus: "success",
      dodoPaymentId: stablePayId,
      source: "return_url_activate",
      createdAt: now.toISOString(),
    }, { merge: true });

    console.log(`[DodoActivate] ✅ Activated ${planType} for UID: ${uid} (expiry: ${expiryDate?.toISOString() || "lifetime"})`);
    return res.json({
      success: true,
      message: "Dodo Subscription activated successfully",
      planType,
      expiryDate: expiryDate ? expiryDate.toISOString() : null,
      lifetimeAccess,
    });
  } catch (error: any) {
    console.error("[DodoActivate] Error:", error?.message || error);
    res.status(500).json({ success: false, error: error?.message });
  }
});

function yearlyHelper(plan: string): boolean {
  return plan === "yearly";
}

// In-memory set for fast webhook deduplication
const processedDodoWebhookEvents = new Set<string>();

/**
 * Verify a Dodo Payments webhook signature using HMAC-SHA256.
 * The signature is sent in the `x-dodo-signature` header as either:
 *   - a raw hex digest, OR
 *   - a Svix-style "v1,<hex>" string (Svix is the underlying transport).
 * Returns true if the signature is valid OR if no secret is configured
 * (in which case we log a loud warning and accept the request —
 *  this lets local dev work but MUST be set in production).
 */
function verifyDodoWebhookSignature(rawBody: string, signatureHeader: string | undefined, secret: string | undefined): boolean {
  if (!secret || secret.trim() === "") {
    console.warn("[DodoWebhook] ⚠️ DODO_PAYMENTS_WEBHOOK_SECRET is not set. Webhook is UNAUTHENTICATED — anyone can forge events. Set this env var in production.");
    return true; // fail-open for dev; production must set the secret
  }
  if (!signatureHeader) {
    console.error("[DodoWebhook] ❌ Missing signature header.");
    return false;
  }

  // Extract the raw hex digest (strip "v1," prefix if Svix-style)
  const sig = signatureHeader.startsWith("v1,") ? signatureHeader.slice(3) : signatureHeader;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("hex");

  // timing-safe comparison
  const expectedBuf = Buffer.from(expected, "hex");
  let sigBuf: Buffer;
  try {
    sigBuf = Buffer.from(sig, "hex");
  } catch {
    return false;
  }
  if (expectedBuf.length !== sigBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, sigBuf);
}

// API Route: Dodo Webhook
app.post("/api/dodo/webhook", async (req, res) => {
  try {
    // IMPORTANT: we need the raw body for HMAC verification.
    // express.json() has already parsed req.body, so we reconstruct
    // the raw body from the original stream buffer if available,
    // otherwise we re-serialize (acceptable as long as the signing
    // side and our verification side agree on canonicalization).
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);
    const event = req.body;
    const eventId = event?.id || event?.event_id || event?.data?.payment_id || event?.data?.id;
    const eventType = event?.type || event?.event || "unknown";

    console.log(`[DodoWebhook] Received event (${eventType}) with ID:`, eventId);

    // ── SIGNATURE VERIFICATION (HMAC-SHA256) ──
    const webhookSecret = process.env.DODO_PAYMENTS_WEBHOOK_SECRET;
    const incomingSignature =
      (req.headers["x-dodo-signature"] as string | undefined) ||
      (req.headers["webhook-signature"] as string | undefined) ||
      (req.headers["svix-signature"] as string | undefined);

    const signatureValid = verifyDodoWebhookSignature(rawBody, incomingSignature, webhookSecret);
    if (!signatureValid) {
      console.error("[DodoWebhook] ❌ Signature verification FAILED. Rejecting event.");
      return res.status(401).json({ error: "Invalid signature" });
    }
    console.log("[DodoWebhook] ✅ Signature verified.");

    // Deduplication check
    if (eventId) {
      if (processedDodoWebhookEvents.has(eventId)) {
        console.log(`[DodoWebhook] Event ID ${eventId} already processed (memory). Skipping.`);
        return res.status(200).json({ received: true, deduplicated: true });
      }

      try {
        const db = getDb();
        const eventDoc = await db.collection("dodo_processed_webhooks").doc(eventId).get();
        if (eventDoc.exists) {
          processedDodoWebhookEvents.add(eventId);
          console.log(`[DodoWebhook] Event ID ${eventId} already processed (Firestore). Skipping.`);
          return res.status(200).json({ received: true, deduplicated: true });
        }
      } catch (e) {
        console.warn("[DodoWebhook] Could not query Firestore deduplication doc:", e);
      }
    }

    const metadata = event?.data?.metadata || event?.metadata || {};
    const uid = metadata.uid || event?.data?.customer?.customer_id;
    const planType = metadata.planType || "monthly";
    const amount = event?.data?.amount ? event.data.amount / 100 : 4.99;
    const paymentId = event?.data?.payment_id || event?.data?.id || eventId || `dodo_wh_${Date.now()}`;
    const db = getDb();
    const now = new Date();

    if (
      eventType === "subscription.active" ||
      eventType === "subscription.renewed" ||
      eventType === "payment.succeeded" ||
      eventType === "payment.success" ||
      eventType === "checkout.completed" ||
      eventType === "subscription.created"
    ) {
      if (uid) {
        let expiryDate = null;
        let status = "active";
        let lifetimeAccess = false;

        if (planType === "lifetime") {
          lifetimeAccess = true;
          status = "lifetime";
        } else if (planType === "monthly") {
          expiryDate = new Date(now);
          expiryDate.setDate(expiryDate.getDate() + 30);
        } else if (planType === "yearly") {
          expiryDate = new Date(now);
          expiryDate.setDate(expiryDate.getDate() + 365);
        }

        await db.collection("users").doc(uid).set({
          currentPlan: planType,
          subscriptionStatus: status,
          purchaseDate: now.toISOString(),
          expiryDate: expiryDate ? expiryDate.toISOString() : null,
          lifetimeAccess,
          updatedAt: now.toISOString()
        }, { merge: true });

        // Use a deterministic doc id so duplicate webhooks don't create duplicates.
        const payDocId = paymentId || `dodo_wh_${uid}_${now.getTime()}`;
        await db.collection("payments").doc(payDocId).set({
          userId: uid,
          planType,
          amount,
          currency: "USD",
          paymentStatus: "success",
          dodoPaymentId: payDocId,
          createdAt: now.toISOString(),
          source: "webhook",
          eventType
        }, { merge: true });

        console.log(`[DodoWebhook] ✅ Subscription active/renewed for UID: ${uid}, Plan: ${planType}, Event: ${eventType}, Expiry: ${expiryDate?.toISOString() || "lifetime"}`);
      } else {
        console.warn(`[DodoWebhook] ⚠️ Event ${eventType} received but no uid in metadata. Cannot grant access.`);
      }
    } else if (eventType === "subscription.on_hold") {
      if (uid) {
        await db.collection("users").doc(uid).set({
          subscriptionStatus: "on_hold",
          updatedAt: now.toISOString()
        }, { merge: true });

        await db.collection("payments").add({
          userId: uid,
          planType,
          amount,
          currency: "USD",
          paymentStatus: "on_hold",
          dodoPaymentId: paymentId,
          createdAt: now.toISOString(),
          source: "webhook",
          eventType
        });
        console.log(`[DodoWebhook] ⚠️ Subscription put on hold for UID: ${uid}`);
      }
    } else if (eventType === "subscription.failed" || eventType === "payment.failed") {
      if (uid) {
        await db.collection("users").doc(uid).set({
          subscriptionStatus: "failed",
          updatedAt: now.toISOString()
        }, { merge: true });

        await db.collection("payments").add({
          userId: uid,
          planType,
          amount,
          currency: "USD",
          paymentStatus: "failed",
          dodoPaymentId: paymentId,
          createdAt: now.toISOString(),
          source: "webhook",
          eventType
        });
        console.log(`[DodoWebhook] ❌ Subscription/Payment failed recorded for UID: ${uid}`);
      }
    } else if (eventType === "subscription.cancelled" || eventType === "subscription.canceled") {
      if (uid) {
        await db.collection("users").doc(uid).set({
          subscriptionStatus: "cancelled",
          cancelledAt: now.toISOString(),
          updatedAt: now.toISOString()
        }, { merge: true });
        console.log(`[DodoWebhook] 🚫 Subscription cancelled for UID: ${uid}`);
      }
    } else if (eventType === "subscription.updated") {
      if (uid) {
        await db.collection("users").doc(uid).set({
          currentPlan: planType,
          updatedAt: now.toISOString()
        }, { merge: true });
        console.log(`[DodoWebhook] 🔄 Subscription updated for UID: ${uid}`);
      }
    }

    // Record processed event ID
    if (eventId) {
      processedDodoWebhookEvents.add(eventId);
      try {
        await db.collection("dodo_processed_webhooks").doc(eventId).set({
          type: eventType,
          processedAt: now.toISOString(),
          uid: uid || null
        });
      } catch (e) {
        console.warn("[DodoWebhook] Failed to store deduplication doc:", e);
      }
    }

    return res.status(200).json({ received: true });
  } catch (err: any) {
    console.error("[DodoWebhook] Error processing event:", err?.message || err);
    return res.status(200).json({ received: true });
  }
});

// API Route: Subscription Cancel
app.post("/api/subscription/cancel", async (req, res) => {
  try {
    const { uid, reason } = req.body;
    if (!uid) return res.status(400).json({ error: "uid is required" });
    const db = getDb();
    const userRef = db.collection("users").doc(uid);
    const userDoc = await userRef.get();
    if (!userDoc.exists) return res.status(404).json({ error: "User not found" });
    const userData = userDoc.data();
    if (userData.lifetimeAccess || userData.subscriptionStatus === "lifetime") {
      return res.status(400).json({ error: "Lifetime plans cannot be cancelled" });
    }
    await userRef.update({
      subscriptionStatus: "cancelled", currentPlan: "free",
      cancelledAt: new Date().toISOString(), cancelReason: reason || "User requested cancellation",
      updatedAt: new Date().toISOString()
    });
    res.json({ success: true, message: "Subscription cancelled successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API Route: Expiry Check
app.get("/api/subscription/expire-check", async (req, res) => {
  try {
    const db = getDb();
    const now = new Date().toISOString();
    const batch = db.batch();

    const trialQuery = db.collection("users").where("subscriptionStatus", "==", "trial").where("trialEndDate", "<", now);
    const trialSnapshot = await trialQuery.get();
    trialSnapshot.forEach((doc: any) => batch.update(doc.ref, { subscriptionStatus: "expired", currentPlan: "free", updatedAt: now }));

    const activeQuery = db.collection("users").where("subscriptionStatus", "==", "active").where("expiryDate", "<", now);
    const activeSnapshot = await activeQuery.get();
    activeSnapshot.forEach((doc: any) => batch.update(doc.ref, { subscriptionStatus: "expired", currentPlan: "free", updatedAt: now }));

    await batch.commit();
    res.json({ success: true, expired: trialSnapshot.size + activeSnapshot.size });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API Route: Verify Razorpay Payment
app.post("/api/razorpay/verify", async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const keySecret = process.env.RAZORPAY_KEY_SECRET || process.env.rz_secrete_key || process.env.rz_secret_key;

    if (!keySecret) {
      console.error("Razorpay verification failed: RAZORPAY_KEY_SECRET is missing");
      throw new Error("Razorpay key secret is not set");
    }

    const generated_signature = crypto
      .createHmac("sha256", keySecret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated_signature === razorpay_signature) {
      console.log(`Payment verified successfully for Order: ${razorpay_order_id}`);
      res.json({ status: "ok", message: "Payment verified successfully" });
    } else {
      console.error(`Invalid signature for Order: ${razorpay_order_id}. Generated: ${generated_signature.substring(0, 5)}... Received: ${razorpay_signature.substring(0, 5)}...`);
      res.status(400).json({ status: "error", message: "Invalid signature" });
    }
  } catch (error: any) {
    console.error("Razorpay Verification Error:", error);
    res.status(500).json({ error: error.message || "Verification failed" });
  }
});

// API Route: Quick Fix for User Subscription
app.post("/api/admin/fix-user", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: "Missing query" });
    
    const db = getDb();
    const usersSnap = await db.collection("users").get();
    
    let targetDoc = null;
    usersSnap.forEach((doc: any) => {
       const data = doc.data();
       const nameMatch = data.name && data.name.toLowerCase().includes(query.toLowerCase());
       const emailMatch = data.email && data.email.toLowerCase().includes(query.toLowerCase());
       if (nameMatch || emailMatch) {
         targetDoc = doc;
       }
    });

    if (!targetDoc) return res.status(404).json({ error: "User not found matching query: " + query });

    const data = (targetDoc as any).data();
    const now = new Date();
    let expiryDate = new Date(now);
    expiryDate.setDate(expiryDate.getDate() + 30); // 1 month

    await (targetDoc as any).ref.update({
      currentPlan: "monthly",
      subscriptionStatus: "active",
      purchaseDate: now.toISOString(),
      expiryDate: expiryDate.toISOString(),
      lifetimeAccess: false,
      updatedAt: now.toISOString()
    });

    res.json({ success: true, message: `Fixed user ${data.name} (${data.email})` });
  } catch(e: any) {
    res.status(500).json({ error: e.message });
  }
});

// API Route: Reconcile real payments from Razorpay (admin only)
// Pulls every paid order directly from Razorpay (source of truth) and maps
// each to {uid, planType, amount, date} using the order's notes.
app.post("/api/admin/reconcile-razorpay", verifyAdmin, async (req, res) => {
  try {
    const rzp = getRazorpay();
    const mapped: any[] = [];
    let skip = 0;
    const count = 100;
    let hasMore = true;

    // Page through all orders
    while (hasMore) {
      const page: any = await rzp.orders.all({ count, skip });
      const items = page?.items || [];
      for (const o of items) {
        const isPaid = o.status === "paid" || Number(o.amount_paid || 0) > 0;
        if (!isPaid) continue;
        const uid = o.notes?.userId;
        const planType = o.notes?.planType;
        if (!uid || !planType) continue; // older orders without notes can't be mapped
        mapped.push({
          uid,
          planType,
          amount: Number(o.amount || 0) / 100,
          orderId: o.id,
          date: o.created_at ? new Date(o.created_at * 1000).toISOString() : new Date().toISOString(),
          source: "razorpay",
        });
      }
      hasMore = items.length === count;
      skip += count;
      if (skip > 2000) break; // safety cap
    }

    res.json({ status: "ok", count: mapped.length, payments: mapped });
  } catch (error: any) {
    console.error("[reconcile-razorpay] Error:", error?.message || error);
    res.status(500).json({ status: "error", error: error?.message || "Razorpay fetch failed" });
  }
});

// ============================================================
// UNIFIED NOTIFICATION SYSTEM (user + admin emails via Resend)
// ============================================================

const RESEND_KEY = () => process.env.RESEND_API_KEY || process.env.resend_key;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'asartist20@gmail.com';
const FROM_EMAIL = process.env.NOTIFICATION_FROM_EMAIL || 'Menifest OS <onboarding@resend.dev>';

async function sendResendEmail(to: string, subject: string, html: string, text: string) {
  const key = RESEND_KEY();
  if (!key) return { sent: false, reason: 'RESEND_API_KEY not configured' };
  try {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM_EMAIL, to, subject, html, text }),
    });
    const data = await resp.json().catch(() => ({}));
    return { sent: resp.ok, data, status: resp.status };
  } catch (e: any) {
    return { sent: false, error: e?.message };
  }
}

async function verifyUser(req: any): Promise<boolean> {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return false;
  try {
    if (!admin.apps.length) admin.initializeApp({ projectId: getFirebaseConfig().projectId });
    await admin.app().auth().verifyIdToken(token);
    return true;
  } catch { return false; }
}

async function verifyAdminToken(req: any): Promise<boolean> {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return false;
  try {
    if (!admin.apps.length) admin.initializeApp({ projectId: getFirebaseConfig().projectId });
    const decoded = await admin.app().auth().verifyIdToken(token);
    return decoded.email === ADMIN_EMAIL;
  } catch { return false; }
}

// ── Legacy compat ──
app.post('/api/notifications/admin-notify', async (req: any, res: any) => {
  return res.json({ sent: false, redirect: 'use /api/notifications/notify' });
});
app.post('/api/notifications/daily-reminder', async (req: any, res: any) => {
  req.body.event = 'daily-reminder';
  const db = getDb();
  const key = RESEND_KEY();
  if (!key) return res.json({ sent: 0, reason: 'RESEND_API_KEY not configured' });
  const snap = await db.collection('users').get();
  const recipients: any[] = [];
  snap.docs.forEach(doc => {
    const data = doc.data();
    if (!data.email || data.notificationPrefs?.ritualRemindersEnabled === false) return;
    recipients.push(data);
  });
  let sent = 0, failed = 0;
  const batchSize = 5;
  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);
    const results = await Promise.allSettled(batch.map(data => {
      const streak = data.streak || 0;
      return sendResendEmail(
        data.email,
        streak > 0 ? streak + '-day streak waiting!' : 'Your journey awaits',
        '<div style="font-family:Inter;padding:32px;background:#0a0a0a;color:#fff;border-radius:24px"><h1>Streak calling</h1><p>Hi ' + (data.name || 'Seeker') + ', complete today\'s ritual.</p></div>',
        'Complete today\'s ritual.'
      );
    }));
    results.forEach(r => { if (r.status === 'fulfilled' && r.value.sent) sent++; else failed++; });
  }
  return res.json({ success: true, sent, failed, total: recipients.length });
});

// ── UNIFIED NOTIFY ENDPOINT (all events) ──
app.post('/api/notifications/notify', async (req: any, res: any) => {
  const body = req.body || {};
  const event = body.event;
  const key = RESEND_KEY();
  if (!key) return res.json({ sent: false, reason: 'RESEND_API_KEY not configured' });

  try {
    // USER WELCOME
    if (event === 'user-welcome') {
      const ok = await verifyUser(req);
      if (!ok) return res.status(401).json({ error: 'Auth required' });
      const { to, userName } = body;
      if (!to) return res.json({ sent: false, error: 'No recipient email' });
      const result = await sendResendEmail(to, 'Welcome to Menifest OS!',
        '<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:auto;background:#0a0a0a;color:#fff;border-radius:24px;overflow:hidden;border:1px solid rgba(251,191,36,.3)"><div style="background:linear-gradient(135deg,#fbbf24,#f59e0b);padding:24px;text-align:center"><h1 style="margin:0;color:#000;font-size:22px">Welcome, ' + (userName || 'Seeker') + '!</h1></div><div style="padding:32px"><p style="font-size:16px;line-height:1.7;color:rgba(255,255,255,.8)">Your manifestation journey starts NOW. You have <strong style="color:#fbbf24">1 day of FREE Premium access</strong>.</p><p style="font-size:13px;color:rgba(255,255,255,.6)">Set goals, write journals, build streaks, learn from The Secret and Neville Goddard. Your reality is yours to create.</p></div></div>',
        'Welcome ' + (userName || 'Seeker') + '! Your journey starts now.');
      return res.json(result);
    }

    // ADMIN SIGNUP
    if (event === 'admin-signup') {
      const ok = await verifyUser(req);
      if (!ok) return res.status(401).json({ error: 'Auth required' });
      const result = await sendResendEmail(ADMIN_EMAIL, 'New User: ' + (body.userName || 'Unknown'),
        '<div style="font-family:Inter;padding:32px;background:#0a0a0a;color:#fff;border-radius:24px"><h1>New Signup</h1><p><b>Name:</b> ' + body.userName + '</p><p><b>Email:</b> ' + body.userEmail + '</p><p><b>Phone:</b> ' + (body.phone || 'N/A') + '</p><p><b>Time:</b> ' + new Date().toLocaleString('en-IN') + '</p></div>',
        'New user: ' + body.userName + ' (' + body.userEmail + ')');
      return res.json(result);
    }

    // USER SUBSCRIPTION
    if (event === 'user-subscription') {
      const ok = await verifyUser(req);
      if (!ok) return res.status(401).json({ error: 'Auth required' });
      const { to, userName, planType, amount } = body;
      if (!to) return res.json({ sent: false, error: 'No recipient email' });
      const result = await sendResendEmail(to, 'Premium Activated - ' + (planType || 'monthly').toUpperCase() + '!',
        '<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:auto;background:#0a0a0a;color:#fff;border-radius:24px;overflow:hidden;border:1px solid rgba(16,185,129,.3)"><div style="background:linear-gradient(135deg,#10b981,#059669);padding:24px;text-align:center"><h1 style="margin:0;color:#fff;font-size:22px">You are Premium Now!</h1></div><div style="padding:32px"><p style="font-size:16px;color:rgba(255,255,255,.8)">Hi ' + (userName || 'Seeker') + ', your payment of <strong style="color:#10b981">Rs.' + amount + '</strong> for <strong style="color:#fbbf24">' + (planType || '').toUpperCase() + '</strong> is confirmed.</p><p style="font-size:14px;color:rgba(255,255,255,.6)">Unlimited access to goals, journals, AI insights, Academy, streaks, and share cards.</p></div></div>',
        'Your ' + planType + ' plan is active.');
      return res.json(result);
    }

    // ADMIN SUBSCRIPTION
    if (event === 'admin-subscription') {
      const ok = await verifyUser(req);
      if (!ok) return res.status(401).json({ error: 'Auth required' });
      const result = await sendResendEmail(ADMIN_EMAIL, 'New Sale: ' + body.userName + ' - ' + body.planType,
        '<div style="font-family:Inter;padding:32px;background:#0a0a0a;color:#fff;border-radius:24px;border:1px solid rgba(251,191,36,.4)"><h1>Revenue!</h1><p><b>User:</b> ' + body.userName + '</p><p><b>Email:</b> ' + body.userEmail + '</p><p><b>Plan:</b> ' + (body.planType || '').toUpperCase() + '</p><p><b>Amount:</b> Rs.' + body.amount + '</p><p><b>Time:</b> ' + new Date().toLocaleString('en-IN') + '</p></div>',
        'Sale: ' + body.userName + ' ' + body.planType + ' Rs.' + body.amount);
      return res.json(result);
    }

    // EXPIRY CHECK
    if (event === 'expiry-check') {
      const isAuth = await verifyAdminToken(req) || (process.env.CRON_SECRET && req.headers.authorization === 'Bearer ' + process.env.CRON_SECRET);
      if (!isAuth) return res.status(401).json({ error: 'Admin/cron required' });
      const db = getDb();
      const snap = await db.collection('users').where('subscriptionStatus', '==', 'active').get();
      let sent = 0;
      const now = Date.now();
      for (const doc of snap.docs) {
        const data = doc.data();
        if (!data.expiryDate || !data.email) continue;
        const daysLeft = Math.ceil((new Date(data.expiryDate).getTime() - now) / 86400000);
        if (daysLeft > 0 && daysLeft <= 3) {
          const r = await sendResendEmail(data.email, 'Premium expires in ' + daysLeft + ' day(s)!',
            '<div style="font-family:Inter;max-width:560px;margin:auto;background:#0a0a0a;color:#fff;border-radius:24px;border:1px solid rgba(245,158,11,.4)"><div style="background:linear-gradient(135deg,#f59e0b,#d97706);padding:24px;text-align:center"><h1 style="margin:0;color:#000">Premium Expires Soon!</h1></div><div style="padding:32px"><p style="font-size:16px;color:rgba(255,255,255,.8)">Hi ' + (data.name || 'Seeker') + ', your <strong style="color:#fbbf24">' + (data.currentPlan || 'monthly').toUpperCase() + '</strong> expires in <strong style="color:#ef4444">' + daysLeft + ' day(s)</strong>.</p><p style="font-size:14px;color:rgba(255,255,255,.6)">Dont lose your streak and premium features. Renew now!</p></div></div>',
            'Expires in ' + daysLeft + ' days.');
          if (r.sent) sent++;
        }
      }
      return res.json({ success: true, sent });
    }

    // PROMO BROADCAST — parallel batch sending for speed
    if (event === 'promo-broadcast') {
      const isAdmin = await verifyAdminToken(req);
      if (!isAdmin) return res.status(403).json({ error: 'Admin access required' });
      const { subject, message } = body;
      if (!subject || !message) return res.status(400).json({ error: 'Subject and message required' });
      const db = getDb();
      const snap = await db.collection('users').get();
      const recipients: any[] = [];
      snap.docs.forEach(doc => {
        const data = doc.data();
        if (!data.email || data.notificationPrefs?.promotionalEnabled === false) return;
        recipients.push(data);
      });
      // Send in parallel batches of 5 (much faster than sequential)
      let sent = 0, failed = 0;
      const batchSize = 5;
      for (let i = 0; i < recipients.length; i += batchSize) {
        const batch = recipients.slice(i, i + batchSize);
        const results = await Promise.allSettled(batch.map(data =>
          sendResendEmail(
            data.email, subject,
            '<div style="font-family:Inter;max-width:560px;margin:auto;background:#0a0a0a;color:#fff;border-radius:24px;border:1px solid rgba(251,191,36,.2)"><div style="background:linear-gradient(135deg,#fbbf24,#f59e0b);padding:20px;text-align:center"><h2 style="margin:0;color:#000">' + subject + '</h2></div><div style="padding:32px"><p style="font-size:15px;color:rgba(255,255,255,.8)">Hi ' + (data.name || 'Seeker') + ',</p><p style="font-size:15px;color:rgba(255,255,255,.7)">' + message + '</p></div></div>',
            'Hi ' + (data.name || 'Seeker') + ', ' + message
          )
        ));
        results.forEach(r => { if (r.status === 'fulfilled' && r.value.sent) sent++; else failed++; });
      }
      return res.json({ success: true, sent, failed, total: recipients.length });
    }

    // DAILY REMINDER — parallel batch sending
    if (event === 'daily-reminder') {
      const db = getDb();
      const snap = await db.collection('users').get();
      const recipients: any[] = [];
      snap.docs.forEach(doc => {
        const data = doc.data();
        if (!data.email || data.notificationPrefs?.ritualRemindersEnabled === false) return;
        recipients.push(data);
      });
      let sent = 0, failed = 0;
      const batchSize = 5;
      for (let i = 0; i < recipients.length; i += batchSize) {
        const batch = recipients.slice(i, i + batchSize);
        const results = await Promise.allSettled(batch.map(data => {
          const streak = data.streak || 0;
          return sendResendEmail(
            data.email,
            streak > 0 ? streak + '-day streak waiting!' : 'Your journey awaits',
            '<div style="font-family:Inter;padding:32px;background:#0a0a0a;color:#fff;border-radius:24px"><h1>Streak calling</h1><p>Hi ' + (data.name || 'Seeker') + ', complete today\'s ritual.</p></div>',
            'Complete today\'s ritual.'
          );
        }));
        results.forEach(r => { if (r.status === 'fulfilled' && r.value.sent) sent++; else failed++; });
      }
      return res.json({ success: true, sent, failed, total: recipients.length });
    }

    return res.json({ sent: false, error: 'Unknown event: ' + event });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message });
  }
});

// Test endpoint (no auth)
app.get('/api/notifications/test', async (req, res) => {
  const key = RESEND_KEY();
  if (!key) return res.status(500).json({ error: 'RESEND_API_KEY not set', fix: 'Add to Vercel env vars' });
  
  const result = await sendResendEmail(
    ADMIN_EMAIL,
    '🧪 Menifest OS Test Email',
    `<div style="font-family:Inter;padding:32px;background:#0a0a0a;color:#fff;border-radius:24px"><h1>🧪 Test Successful!</h1><p>Notifications are working.</p><p>Time: ${new Date().toLocaleString('en-IN')}</p></div>`,
    'Test email successful'
  );
  res.json({ ...result, to: ADMIN_EMAIL, message: result.sent ? '✅ Email sent!' : '❌ Check response' });
});

// User Payments Check (checks Razorpay for user's real payments)
app.post('/api/user-payments-check', async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing auth token' });
  
  try {
    if (!admin.apps.length) admin.initializeApp({ projectId: getFirebaseConfig().projectId });
    const decoded = await admin.app().auth().verifyIdToken(token);
    const callerUid = decoded.uid;
    
    const rzp = getRazorpay();
    const found: any[] = [];
    let skip = 0;
    const count = 100;
    let hasMore = true;
    
    while (hasMore) {
      const page: any = await rzp.orders.all({ count, skip });
      const items = page?.items || [];
      for (const o of items) {
        const isPaid = o.status === 'paid' || Number(o.amount_paid || 0) > 0;
        if (!isPaid) continue;
        const notes = o.notes || {};
        const orderUid = notes.userId || notes.uid;
        if (orderUid !== callerUid) continue;
        found.push({
          planType: notes.planType || notes.plan || 'monthly',
          amount: Number(o.amount || 0) / 100,
          orderId: o.id,
          date: o.created_at ? new Date(o.created_at * 1000).toISOString() : new Date().toISOString(),
        });
      }
      hasMore = items.length === count;
      skip += count;
      if (skip > 3000) break;
    }
    
    res.json({ count: found.length, payments: found });
  } catch (error: any) {
    res.status(502).json({ error: error?.message });
  }
});

// Razorpay Webhook
app.post('/api/razorpay/webhook', async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const body = JSON.stringify(req.body);
    const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;
    
    if (WEBHOOK_SECRET) {
      const expected = crypto.createHmac('sha256', WEBHOOK_SECRET).update(body).digest('hex');
      if (expected !== signature) return res.status(400).json({ error: 'Invalid signature' });
    }
    
    const event = req.body.event;
    const payload = req.body.payload;
    const db = getDb();
    
    if (event === 'order.paid') {
      const order = payload.order.entity;
      const { userId, planType } = order.notes || {};
      if (!userId || !planType) return res.status(200).json({ status: 'ok' });
      
      const now = new Date();
      let expiryDate = null;
      let status = 'active';
      let lifetimeAccess = false;
      
      if (planType === 'lifetime') { lifetimeAccess = true; status = 'lifetime'; }
      else if (planType === 'monthly') { expiryDate = new Date(now); expiryDate.setDate(expiryDate.getDate() + 30); }
      else if (planType === 'yearly') { expiryDate = new Date(now); expiryDate.setDate(expiryDate.getDate() + 365); }
      
      const updatePayload: any = {
        expiryDate: expiryDate ? expiryDate.toISOString() : null, lifetimeAccess, updatedAt: now.toISOString(),
      };
      if (planType === 'lifetime') updatePayload.founderSlotUsed = true;
      
      await db.collection('users').doc(userId).set(updatePayload, { merge: true });
      const paymentRef = db.collection('payments').doc(order.id);
      const paymentDoc = await paymentRef.get();
      if (!paymentDoc.exists) {
        await paymentRef.set({
          userId, planType, amount: order.amount / 100, currency: 'INR',
          paymentStatus: 'success', razorpayOrderId: order.id, createdAt: now.toISOString(), source: 'webhook',
        });
      }
    }
    
    if (event === 'payment.refunded') {
      const payment = payload.payment.entity;
      const orderId = payment.order_id;
      const paymentsRef = db.collection('payments');
      const q = await paymentsRef.where('razorpayOrderId', '==', orderId).limit(1).get();
      if (!q.empty) {
        const doc = q.docs[0];
        const userId = doc.data().userId;
        await doc.ref.update({ paymentStatus: 'refunded', refundedAt: new Date().toISOString() });
        await db.collection('users').doc(userId).update({
          subscriptionStatus: 'cancelled', currentPlan: 'free', lifetimeAccess: false, updatedAt: new Date().toISOString(),
        });
      }
    }
    
    res.status(200).json({ status: 'ok' });
  } catch (error: any) {
    res.status(500).json({ error: error?.message });
  }
});

// ============================================================
// AI GOAL BLUEPRINT GENERATION
// ============================================================

app.post("/api/goals/generate-blueprint", async (req, res) => {
  try {
    const { goalTitle, category } = req.body;
    if (!goalTitle) return res.status(400).json({ error: "Goal title required" });

    const client = getGeminiClient();
    if (!client) {
      // Fallback blueprint without AI
      const fallback = generateFallbackBlueprint(goalTitle, category);
      return res.json(fallback);
    }

    const prompt = `You are an elite AI Goal Architect and Manifestation Strategist.
The user wants to achieve this goal: "${goalTitle}"
Category: ${category || "general"}

Generate a COMPLETE structured action blueprint. Return ONLY valid JSON (no markdown, no backticks, no explanation).

JSON structure:
{
  "goal_name": "Refined goal name",
  "difficulty": "Beginner|Intermediate|Advanced|Elite",
  "estimated_duration": "e.g. 90 days",
  "success_probability": number 1-100,
  "identity_shift": "Who they must become",
  "mindset": ["3-5 core mindset shifts"],
  "milestones": [{"title":"","description":"","estimated_days":number,"difficulty":"Easy|Medium|Hard"}],
  "daily_tasks": [{"title":"","description":"","xp":number,"priority":"High|Medium|Low","estimated_minutes":number}],
  "habits": [{"label":"","time":"morning|noon|night|any","why":""}],
  "skills": ["skills needed"],
  "affirmations": ["3-5 powerful I AM statements"],
  "visualization": "Detailed visualization scene",
  "obstacles": ["likely obstacles"],
  "solutions": ["solutions to obstacles"],
  "reward_points": number,
  "graph_nodes": [{"id":"","title":"","type":"identity|mindset|action|habit|evidence|success","connected_to":["nodeId"],"description":"","estimated_days":number,"difficulty":"Easy|Medium|Hard","xp":number}]
}

Generate 5-8 graph_nodes. First node type must be "identity". Last node type must be "success". Connect them in sequence using connected_to. Add some branches for richness.

Response Mime Type: application/json.`;

    const response = await generateWithFallback({
      prompt,
      config: { responseMimeType: "application/json", temperature: 0.85 },
    });

    const resultText = response.text || "{}";
    const blueprint = JSON.parse(resultText);
    blueprint.aiGenerated = true;
    blueprint.modelUsed = response.modelUsed;
    blueprint.generatedAt = new Date().toISOString();
    res.json(blueprint);
  } catch (error: any) {
    console.error("[Goal Blueprint] Error:", error?.message);
    const fallback: any = generateFallbackBlueprint(req.body.goalTitle || 'Goal', req.body.category || 'general');
    fallback.aiGenerated = false;
    fallback.error = error?.message;
    res.json(fallback);
  }
});

// ============================================================
// SOLO DOMINION — MISSION PROOF VERIFICATION (multimodal AI)
// Accepts ANY ONE of 3 proof types: Selfie / Video Oath / Text Oath.
// AI verifies: (a) proof is real, (b) matches the actual task.
// ============================================================
app.post("/api/missions/verify-proof", async (req, res) => {
  try {
    const {
      missionId,
      missionTitle,
      missionDesc,
      missionCategory,
      proofType,
      selfieBase64,
      videoUrl,
      videoBase64,
      textOath,
      notes,
    } = req.body || {};

    if (!missionTitle) {
      return res.status(400).json({
        verified: false,
        verificationScore: 0,
        verificationFeedback: "Mission title missing.",
      });
    }
    if (!proofType || !["selfie", "video_oath", "text_oath"].includes(proofType)) {
      return res.status(400).json({
        verified: false,
        verificationScore: 0,
        verificationFeedback: "Proof type missing. Submit selfie, video, or text oath.",
      });
    }

    // For text oath, enforce minimum word count
    let oathText = "";
    if (proofType === "text_oath") {
      oathText = (textOath || "").trim();
      if (oathText.split(/\s+/).length < 10) {
        return res.status(400).json({
          verified: false,
          verificationScore: 0,
          verificationFeedback: "Your text oath must be at least 10 words. The universe is listening — make it meaningful.",
        });
      }
    } else if (proofType === "video_oath") {
      // Video must have a written transcript to extract oath text from
      oathText = notes || "User recorded a video oath swearing to complete the mission.";
    } else if (proofType === "selfie") {
      oathText = notes || "User submitted a selfie as proof of task completion.";
    }

    const client = getGeminiClient();
    if (!client) {
      // Graceful fallback — accept proof on trust if Gemini offline
      return res.json({
        verified: true,
        verificationScore: 72,
        verificationFeedback: "AI Oracle offline — proof accepted on your honor. AI verification will resume shortly.",
        modelUsed: "fallback",
        verifiedAt: new Date().toISOString(),
        aiGenerated: false,
      });
    }

    // Build context for AI based on proof type
    const proofDescription =
      proofType === "selfie"
        ? "The user submitted a SELFIE photo as proof they completed the task."
        : proofType === "video_oath"
        ? "The user submitted a VIDEO OATH recording themselves swearing to the universe they completed the task."
        : "The user submitted a TEXT OATH (a written declaration to the universe) affirming they completed the task.";

    const promptText = `You are the INTELLIGENT UNIVERSE ORACLE for Menifest OS's Solo Dominion system.

A user claims to have completed this REAL-WORLD mission:
- Mission: "${missionTitle}"
- Description: "${missionDesc || "—"}"
- Category: ${missionCategory || "general"}

PROOF SUBMITTED: ${proofDescription}

${proofType === "text_oath" ? `User's TEXT OATH:
"""
${oathText}
"""` : `User's oath/notes:
"""
${oathText}
"""`}

${selfieBase64 ? "[A selfie image is attached for visual analysis]" : ""}
${videoUrl || videoBase64 ? "[A video file is referenced for analysis]" : ""}

YOUR INTELLIGENT VERIFICATION JOB:

1. **Is the proof REAL and RELEVANT?**
   - For SELFIE: Does the image show the user ACTIVELY performing the EXACT task "${missionTitle}" described? Reject generic selfies, old photos, unrelated images, memes, screenshots, food, or stock images.
   - For VIDEO OATH: Does the video show the user SPEAKING a real oath, with face visible and audio present? Reject silent, dark, or face-less videos.
   - For TEXT OATH: Is it a coherent, genuine affirmation of task completion? Does it reference the universe/manifestation theme? Reject empty, nonsensical, or obviously fake text.

2. **Does the proof MATCH the mission?**
   - If user says "100 push-ups" but submits a photo of a book → REJECT
   - If user claims "30 min reading" but oath text mentions working out → REJECT
   - If proof is consistent with the mission title/description → ACCEPT

3. **INTELLIGENT LENIENCY:**
   - The AI is INTELLIGENT, not bureaucratic. If a proof is clearly the user's genuine attempt to fulfill the task (even if imperfect), give a passing score (60-80).
   - If the proof is clearly fabricated, unrelated, or lazy, reject with score 0-50.
   - Quality matters: clarity, relevance, effort.

Return ONLY clean JSON:
{
  "verified": boolean,
  "verificationScore": number (0-100, where 100 = flawless proof),
  "verificationFeedback": "1-2 sharp sentences. Be direct and honest. If verified, mention what the AI saw. If rejected, explain what was missing or wrong."
}`;

    const parts: any[] = [{ text: promptText }];
    if (selfieBase64 && proofType === "selfie") {
      const base64Data = selfieBase64.split(",")[1] || selfieBase64;
      parts.push({
        inlineData: { mimeType: "image/jpeg", data: base64Data },
      });
    }
    if (videoBase64 && proofType === "video_oath") {
      try {
        const base64Data = videoBase64.split(",")[1] || videoBase64;
        if (base64Data.length < 2_500_000) {
          parts.push({
            inlineData: { mimeType: "video/webm", data: base64Data },
          });
        }
      } catch {}
    }

    try {
      const result = await generateWithFallback({
        contents: [{ role: "user", parts }],
        config: { responseMimeType: "application/json", temperature: 0.25 },
      });

      const parsed = JSON.parse(result.text || "{}");
      const verified = parsed.verified === true;
      const score = Math.max(0, Math.min(100, Number(parsed.verificationScore) || 0));
      const feedback = parsed.verificationFeedback || (verified ? "Universe accepts your oath." : "Proof insufficient.");

      // Enforce minimum score threshold for acceptance
      const finalVerified = verified && score >= 60;

      return res.json({
        verified: finalVerified,
        verificationScore: score,
        verificationFeedback: finalVerified
          ? feedback
          : score > 0
          ? `${feedback} (Score ${score}/100 — need 60+ to mark complete.)`
          : feedback,
        modelUsed: result.modelUsed,
        verifiedAt: new Date().toISOString(),
        aiGenerated: true,
        proofType,
      });
    } catch (aiErr: any) {
      const isQuota = aiErr?.message?.includes("quota") || aiErr?.status === "RESOURCE_EXHAUSTED";
      if (isQuota) {
        return res.json({
          verified: true,
          verificationScore: 68,
          verificationFeedback: "AI quota reached — proof accepted on your honor. Universe trusts your oath for now.",
          modelUsed: "quota-fallback",
          verifiedAt: new Date().toISOString(),
          aiGenerated: false,
          proofType,
        });
      }
      throw aiErr;
    }
  } catch (error: any) {
    console.error("[Mission Proof Verify] Error:", error?.message || error);
    res.status(500).json({
      verified: false,
      verificationScore: 0,
      verificationFeedback: error?.message || "Verification service error. Please try again.",
      aiGenerated: false,
    });
  }
});


// Verifies a task completion proof (text + optional image) via Gemini.
// Image is passed inline as base64 (no Storage needed — Gemini sees it,
// verifies, returns a score + feedback). Nothing is persisted server-side.
// ============================================================
app.post("/api/goals/verify-proof", async (req, res) => {
  try {
    const { taskTitle, taskDescription, proofText, imageBase64 } = req.body;
    if (!taskTitle || (!proofText && !imageBase64)) {
      return res.status(400).json({ error: "taskTitle and proofText or imageBase64 required" });
    }

    const client = getGeminiClient();
    if (!client) {
      return res.json({
        verified: true,
        verificationScore: 70,
        verificationFeedback: "Verified via offline mode. Add a Gemini key for AI-checked proofs.",
        verifiedAt: new Date().toISOString(),
        aiGenerated: false,
      });
    }

    const promptText = `You are a meticulous Achievement Auditor for a goal-tracking app.
A user claims to have completed this task:
- Task: "${taskTitle}"
- Task objective: "${taskDescription || "—"}"
- Their submitted proof (text): "${proofText || "(no text provided)"}"

${imageBase64 ? "An image was also attached. Cross-reference it with the task and the text." : "No image was attached — judge based on the text only, slightly stricter."}

Decide whether this proof reflects genuine, intentional completion.
Be fair but rigorous — reward specificity and real detail, reject vague or empty claims.
Return ONLY JSON:
{
  "verified": boolean,
  "verificationScore": number (0-100),
  "verificationFeedback": "1-2 sharp, encouraging sentences"
}`;

    const parts: any[] = [{ text: promptText }];
    if (imageBase64) {
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: imageBase64.split(",")[1] || imageBase64,
        },
      });
    }

    const result = await generateWithFallback({
      contents: [{ role: "user", parts }],
      config: { responseMimeType: "application/json", temperature: 0.3 },
    });

    const parsed = JSON.parse(result.text || "{}");
    res.json({
      verified: !!parsed.verified,
      verificationScore: Math.max(0, Math.min(100, Number(parsed.verificationScore) || 0)),
      verificationFeedback: parsed.verificationFeedback || "Proof reviewed.",
      modelUsed: result.modelUsed,
      verifiedAt: new Date().toISOString(),
      aiGenerated: true,
    });
  } catch (error: any) {
    console.error("[Verify Proof] Error:", error?.message);
    res.json({
      verified: true,
      verificationScore: 65,
      verificationFeedback: "Verification service busy — marked complete. AI review will resume shortly.",
      verifiedAt: new Date().toISOString(),
      aiGenerated: false,
      error: error?.message,
    });
  }
});

// ============================================================
// PHASE 2 — ADAPTIVE INTELLIGENCE (recalculation)
// Given a goal blueprint + completion state, computes momentum /
// discipline / execution / focus scores, an updated success
// probability, projected completion date, and risk flags.
// Local baseline is always computed; AI refines insight + trend.
// ============================================================
app.post("/api/goals/recalculate", async (req, res) => {
  try {
    const { goalName, difficulty, estimatedDuration, successProbability, tasks } = req.body;
    if (!goalName) return res.status(400).json({ error: "goalName required" });

    const totalTasks = Array.isArray(tasks) ? tasks.length : 0;
    const completedTasks = Array.isArray(tasks) ? tasks.filter((t: any) => t.completed).length : 0;
    const verifiedTasks = Array.isArray(tasks) ? tasks.filter((t: any) => t.verified).length : 0;
    const completionRate = totalTasks > 0 ? completedTasks / totalTasks : 0;

    // Local deterministic baseline
    const momentum = Math.round(Math.min(100, 30 + completionRate * 70 + Math.min(verifiedTasks, 5) * 2));
    const discipline = Math.round(Math.min(100, 35 + completionRate * 65));
    const execution = Math.round(Math.min(100, 25 + (verifiedTasks / Math.max(totalTasks, 1)) * 75));
    const focus = Math.round(Math.min(100, 40 + completionRate * 60));
    const localInsight = completionRate === 0
      ? "Your map is ready. Complete your first directive to activate momentum."
      : completionRate < 0.5
      ? "Solid start — keep the daily cadence to accelerate."
      : completionRate < 1
      ? "Strong execution. You're in the compounding zone."
      : "All directives cleared. Time to set the next milestone.";

    const durMatch = String(estimatedDuration || "90 days").match(/(\d+)/);
    const totalDays = durMatch ? parseInt(durMatch[1], 10) : 90;
    const remaining = Math.max(0, totalDays - Math.round(totalDays * completionRate));
    const projected = new Date();
    projected.setDate(projected.getDate() + remaining);

    const localProgress = {
      momentum, discipline, execution, focus,
      updatedSuccessProbability: Math.min(99, Math.round((Number(successProbability) || 70) + completionRate * 12)),
      projectedCompletionDate: projected.toISOString().split("T")[0],
      delayRisk: completionRate > 0.4 ? "Low" : completionRate > 0.15 ? "Medium" : "High",
      burnoutRisk: "Low",
      momentumTrend: "stable" as const,
      aiInsight: localInsight,
      recalculatedAt: new Date().toISOString(),
    };

    const client = getGeminiClient();
    if (!client) return res.json({ ...localProgress, aiGenerated: false });

    const taskSummary = Array.isArray(tasks)
      ? tasks.map((t: any, i: number) => `${i + 1}. ${t.title} [${t.completed ? "done" : "open"}${t.verified ? "/verified" : ""}]`).join("\n")
      : "No tasks.";

    const prompt = `You are the adaptive intelligence engine for a goal-tracking app.
Goal: "${goalName}" (difficulty: ${difficulty || "Intermediate"}, est ${estimatedDuration || "90 days"}, base success ${successProbability || 70}%)
Completion: ${completedTasks}/${totalTasks} tasks done, ${verifiedTasks} AI-verified.

Tasks:
${taskSummary}

Local metrics: momentum ${momentum}, discipline ${discipline}, execution ${execution}, focus ${focus}, projected ${localProgress.projectedCompletionDate}.

Provide a SINGLE coaching insight (1 sentence, specific to their completion state and goal) and refine the trend/risk if the local estimate is off.
Return ONLY JSON:
{
  "aiInsight": "one sharp sentence",
  "momentumTrend": "rising" | "stable" | "declining",
  "burnoutRisk": "Low" | "Medium" | "High",
  "updatedSuccessProbability": number (0-99)
}`;

    try {
      const result = await generateWithFallback({
        prompt,
        config: { responseMimeType: "application/json", temperature: 0.6 },
      });
      const ai = JSON.parse(result.text || "{}");
      return res.json({
        ...localProgress,
        aiInsight: ai.aiInsight || localInsight,
        momentumTrend: ["rising", "stable", "declining"].includes(ai.momentumTrend) ? ai.momentumTrend : "stable",
        burnoutRisk: ["Low", "Medium", "High"].includes(ai.burnoutRisk) ? ai.burnoutRisk : "Low",
        updatedSuccessProbability: Math.max(1, Math.min(99, Math.round(Number(ai.updatedSuccessProbability) || localProgress.updatedSuccessProbability))),
        modelUsed: result.modelUsed,
        aiGenerated: true,
      });
    } catch (aiErr: any) {
      return res.json({ ...localProgress, aiGenerated: false, aiNote: aiErr?.message });
    }
  } catch (error: any) {
    console.error("[Recalculate] Error:", error?.message);
    res.status(500).json({ error: error?.message });
  }
});

function generateFallbackBlueprint(goalTitle: string, category: string) {
  const title = (goalTitle || "Your Goal").trim();
  const cat = (category || "general").toLowerCase();

  // Category-aware content pools so fallback is NEVER identical across goals.
  const POOLS: Record<string, {
    difficulty: string; duration: string; tasks: { title: string; description: string; priority: string; minutes: number }[];
    habits: { label: string; time: string; why: string }[]; skills: string[];
    mindset: string[]; obstacles: string[]; solutions: string[];
  }> = {
    wealth: {
      difficulty: "Advanced", duration: "120 days",
      tasks: [
        { title: "Net Worth Audit", description: "Review current assets, debts, and cash flow to establish your baseline.", priority: "High", minutes: 30 },
        { title: "Income Stream Mapping", description: "Identify 3 potential income sources aligned with your wealth goal.", priority: "High", minutes: 25 },
        { title: "Daily Money Habit", description: "Track every expense today — awareness precedes growth.", priority: "Medium", minutes: 10 },
      ],
      habits: [
        { label: "Morning Money Visualization", time: "morning", why: "Programs an abundance mindset before the day starts" },
        { label: "Evening Finance Log", time: "night", why: "Builds compounding awareness of cash flow" },
      ],
      skills: ["Financial Literacy", "Discipline", "Value Creation"],
      mindset: ["Wealth is built through consistent value, not luck", "Money flows to those who manage it well", "Abundance is your natural state"],
      obstacles: ["Impulsive spending", "Income ceiling mindset", "Analysis paralysis"],
      solutions: ["Automate savings first", "Focus on increasing value given", "Start small and iterate"],
    },
    business: {
      difficulty: "Advanced", duration: "150 days",
      tasks: [
        { title: "Customer Avatar", description: "Define your ideal customer in precise detail — pain points and desires.", priority: "High", minutes: 30 },
        { title: "MVP Definition", description: "List the minimum features needed to deliver core value.", priority: "High", minutes: 40 },
        { title: "Daily Outreach", description: "Contact 5 potential customers or partners today.", priority: "Medium", minutes: 45 },
      ],
      habits: [
        { label: "Morning Strategy Block", time: "morning", why: "Deep work on the highest-leverage task first" },
        { label: "Night Metrics Review", time: "night", why: "What gets measured gets improved" },
      ],
      skills: ["Sales", "Marketing", "Execution Speed"],
      mindset: ["Solve a real problem and revenue follows", "Ship before it's perfect", "Feedback is the compass"],
      obstacles: ["Perfectionism", "Building without customers", "Burnout"],
      solutions: ["Talk to users before coding", "Launch MVP fast", "Protect recovery time"],
    },
    career: {
      difficulty: "Intermediate", duration: "90 days",
      tasks: [
        { title: "Skills Gap Analysis", description: "Identify the 3 skills between you and your target role.", priority: "High", minutes: 25 },
        { title: "Network Touchpoint", description: "Reach out to one person in your target field today.", priority: "Medium", minutes: 15 },
        { title: "Visible Wins Log", description: "Document today's measurable accomplishment.", priority: "Medium", minutes: 10 },
      ],
      habits: [
        { label: "Morning Skill Sprint", time: "morning", why: "30 min daily learning compounds fast" },
        { label: "Night Wins Journal", time: "night", why: "Builds a track record to showcase" },
      ],
      skills: ["Communication", "Strategic Thinking", "Leadership"],
      mindset: ["Your career is built one relationship at a time", "Become unmistakably good at one thing", "Visibility multiplies competence"],
      obstacles: ["Staying invisible", "Comfort zone", "Skill stagnation"],
      solutions: ["Share work publicly", "Volunteer for stretch projects", "Learn in public"],
    },
    fitness: {
      difficulty: "Intermediate", duration: "120 days",
      tasks: [
        { title: "Training Session", description: "Complete today's workout with full focus and intensity.", priority: "High", minutes: 45 },
        { title: "Nutrition Tracking", description: "Log your meals and protein intake for the day.", priority: "Medium", minutes: 10 },
        { title: "Mobility & Recovery", description: "10 minutes of stretching and breathwork.", priority: "Low", minutes: 10 },
      ],
      habits: [
        { label: "Hydration Anchor", time: "morning", why: "Starts metabolism and energy" },
        { label: "Sleep Wind-Down", time: "night", why: "Recovery is where growth happens" },
      ],
      skills: ["Consistency", "Nutrition Awareness", "Recovery Discipline"],
      mindset: ["Discipline beats motivation every time", "Small daily reps create transformation", "Your body reflects your habits"],
      obstacles: ["Inconsistency", "Poor recovery", "Injury"],
      solutions: ["Schedule workouts like meetings", "Prioritize sleep", "Progress gradually"],
    },
    lifestyle: {
      difficulty: "Beginner", duration: "60 days",
      tasks: [
        { title: "Environment Reset", description: "Declutter one space that affects your mood daily.", priority: "Medium", minutes: 20 },
        { title: "Joy Audit", description: "List 5 things that genuinely energize you this week.", priority: "Low", minutes: 15 },
        { title: "Mindful Moment", description: "10 minutes of presence — no screens, full attention.", priority: "Medium", minutes: 10 },
      ],
      habits: [
        { label: "Gratitude Anchor", time: "morning", why: "Sets a positive baseline for the day" },
        { label: "Screen Sunset", time: "night", why: "Protects sleep and presence" },
      ],
      skills: ["Mindfulness", "Boundary Setting", "Self-Awareness"],
      mindset: ["Joy is chosen, not chased", "Your environment shapes your state", "Less but better"],
      obstacles: ["Overwhelm", "Comparison", "Distraction"],
      solutions: ["Single-task", "Curate inputs", "Protect quiet time"],
    },
    relationship: {
      difficulty: "Intermediate", duration: "75 days",
      tasks: [
        { title: "Connection Reach", description: "Send a genuine message to someone you care about today.", priority: "High", minutes: 10 },
        { title: "Active Listening", description: "In your next conversation, listen to understand, not reply.", priority: "Medium", minutes: 20 },
        { title: "Boundary Practice", description: "Identify one thing to say a clean yes or no to.", priority: "Low", minutes: 10 },
      ],
      habits: [
        { label: "Presence Check-in", time: "any", why: "Being fully present is the greatest gift" },
        { label: "Night Reflection", time: "night", why: "Processes the day's emotional data" },
      ],
      skills: ["Empathy", "Communication", "Emotional Regulation"],
      mindset: ["Connection is built in small consistent moments", "You teach people how to treat you", "Listening is loving"],
      obstacles: ["Assumptions", "Avoidance", "Defensiveness"],
      solutions: ["Ask before assuming", "Address issues early", "Validate first"],
    },
    spiritual: {
      difficulty: "Beginner", duration: "90 days",
      tasks: [
        { title: "Meditation Practice", description: "Sit in stillness for 15 minutes with no agenda.", priority: "High", minutes: 15 },
        { title: "Scripting Session", description: "Write your day as if your desire has already manifested.", priority: "Medium", minutes: 15 },
        { title: "Gratitude Sweep", description: "Feel genuine gratitude for 5 things already present.", priority: "Medium", minutes: 10 },
      ],
      habits: [
        { label: "Morning Alignment", time: "morning", why: "Sets your frequency before the world sets it" },
        { label: "Night Release", time: "night", why: "Surrender the outcome to rest deeply" },
      ],
      skills: ["Presence", "Faith", "Inner Stillness"],
      mindset: ["The outer reflects the inner", "What you focus on grows", "Surrender is not giving up"],
      obstacles: ["Doubt", "Impatience", "Outer noise"],
      solutions: ["Return to the breath", "Trust the process", "Curate your environment"],
    },
    general: {
      difficulty: "Intermediate", duration: "90 days",
      tasks: [
        { title: "Goal Decomposition", description: "Break your goal into 3 concrete sub-targets with deadlines.", priority: "High", minutes: 25 },
        { title: "Daily Core Action", description: "Take one tangible step that moves you closer today.", priority: "High", minutes: 30 },
        { title: "Progress Review", description: "Write 3 things you did toward your goal today.", priority: "Medium", minutes: 10 },
      ],
      habits: [
        { label: "Morning Intention Setting", time: "morning", why: "Aligns actions with the goal daily" },
        { label: "Night Progress Journal", time: "night", why: "Reveals patterns and builds momentum" },
      ],
      skills: ["Consistency", "Focus", "Adaptability"],
      mindset: ["Discipline over motivation", "Progress over perfection", "Consistency creates reality"],
      obstacles: ["Loss of motivation", "Time management", "Distractions"],
      solutions: ["Set reminders", "Break into smaller steps", "Use accountability"],
    },
  };

  const pool = POOLS[cat] || POOLS.general;
  const xpFor = (i: number) => [15, 30, 10][i % 3];

  // Goal-aware identity shift (uses the actual title)
  const identityShift = `Become the person for whom "${title.slice(0, 60)}" is already a lived reality.`;

  return {
    goal_name: title,
    difficulty: pool.difficulty,
    estimated_duration: pool.duration,
    success_probability: 72,
    identity_shift: identityShift,
    mindset: pool.mindset,
    milestones: [
      { title: "Foundation", description: `Establish the systems and mindset for "${title.slice(0, 40)}".`, estimated_days: 7, difficulty: "Easy" },
      { title: "Momentum", description: "Build daily consistency and visible early wins.", estimated_days: 30, difficulty: "Medium" },
      { title: "Acceleration", description: "Scale effort and optimize what's working.", estimated_days: 60, difficulty: "Hard" },
      { title: "Completion", description: "Achieve the outcome and sustain it.", estimated_days: 90, difficulty: "Medium" },
    ],
    daily_tasks: pool.tasks.map((t, i) => ({ title: t.title, description: t.description, xp: xpFor(i), priority: t.priority, estimated_minutes: t.minutes })),
    habits: pool.habits,
    skills: pool.skills,
    affirmations: [
      `I am fully committed to ${title.slice(0, 40)}.`,
      "Every aligned action brings my reality closer.",
      "I am the architect of my life.",
    ],
    visualization: `Picture yourself having already achieved "${title.slice(0, 50)}". Feel the emotions, see the evidence around you, and hear the recognition from others. Hold that state.`,
    obstacles: pool.obstacles,
    solutions: pool.solutions,
    reward_points: 500,
    graph_nodes: [
      { id: "n1", title: "Identity Shift", type: "identity", connected_to: ["n2"], description: identityShift, estimated_days: 3, difficulty: "Easy", xp: 50 },
      { id: "n2", title: "Core Mindset", type: "mindset", connected_to: ["n3"], description: pool.mindset[0], estimated_days: 7, difficulty: "Easy", xp: 75 },
      { id: "n3", title: "Daily Action", type: "action", connected_to: ["n4", "n5"], description: pool.tasks[0].title, estimated_days: 30, difficulty: "Medium", xp: 150 },
      { id: "n4", title: "Habit Lock-In", type: "habit", connected_to: ["n6"], description: pool.habits[0].label, estimated_days: 45, difficulty: "Hard", xp: 200 },
      { id: "n5", title: "Evidence Tracking", type: "evidence", connected_to: ["n6"], description: "Track proof of progress weekly", estimated_days: 60, difficulty: "Medium", xp: 150 },
      { id: "n6", title: "Goal Achieved", type: "success", connected_to: [], description: title.slice(0, 50), estimated_days: 90, difficulty: "Medium", xp: 500 },
    ],
    aiGenerated: false,
    fallbackReason: "AI unavailable — showing a tailored draft based on your goal and category.",
    generatedAt: new Date().toISOString(),
  };
}

// --- SERVER INITIALIZATION ---

async function startServer() {
  const PORT = 3000;
  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true, allowedHosts: true, host: "0.0.0.0" },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Only start the listener if not running in a serverless environment like Vercel
  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Manifestation OS server running on http://localhost:${PORT}`);
    });
  }
}

// Only run startServer() when NOT on Vercel.
// On Vercel, the Express app is exported as a serverless function via /api/index.ts;
// startServer() would add Vite middleware / static file serving which is not needed
// and would interfere with Vercel's own static asset serving.
if (!process.env.VERCEL) {
  startServer();
}

export default app;

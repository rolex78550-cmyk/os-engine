// Wallpaper Engine — I AM Affirmation + Motivation Quote Overlay
// User uploads their own wallpaper image, we overlay a rotating affirmation.
// Time-based rotation: every 10 minutes a new affirmation appears on the
// generated wallpaper. All client-side, no API calls, no AI costs.

export type AffirmationStyle = "minimal" | "bold" | "elegant" | "premium";

export interface AffirmationItem {
  /** "I AM" + word (e.g. "powerful" → "I AM powerful") */
  iAm: string;
  /** A short motivation quote shown below the I AM line */
  quote: string;
  /** Time bucket when this affirmation is most appropriate */
  timeBucket: "morning" | "midday" | "evening" | "night" | "any";
}

// 60+ curated I AM affirmations across 4 time buckets
// Hand-written, no AI, premium quality, mix of stoic / manifestation / discipline
export const AFFIRMATIONS: AffirmationItem[] = [
  // ───── MORNING (energy, focus, discipline) ─────
  { iAm: "disciplined", quote: "The morning is a battlefield. Win it first.", timeBucket: "morning" },
  { iAm: "unstoppable", quote: "Your only competition is the person you were yesterday.", timeBucket: "morning" },
  { iAm: "the architect of my reality", quote: "Every action today is a brick in the life I am building.", timeBucket: "morning" },
  { iAm: "sharp", quote: "A focused hour beats a distracted day.", timeBucket: "morning" },
  { iAm: "dangerous", quote: "Quiet persistence is the most dangerous force in the world.", timeBucket: "morning" },
  { iAm: "ready", quote: "Today I take what yesterday only dreamed of.", timeBucket: "morning" },
  { iAm: "a man of action", quote: "Plans mean nothing. Execution is everything.", timeBucket: "morning" },
  { iAm: "rising", quote: "The sun does not ask permission to rise. Neither do I.", timeBucket: "morning" },
  { iAm: "hungry", quote: "Comfort is the enemy of becoming.", timeBucket: "morning" },
  { iAm: "early", quote: "5 AM is where empires are built.", timeBucket: "morning" },
  { iAm: "the main character", quote: "Stop watching other people's stories. Write your own.", timeBucket: "morning" },
  { iAm: "consistent", quote: "Discipline is choosing what you want most over what you want now.", timeBucket: "morning" },
  { iAm: "focused", quote: "Where focus goes, energy flows.", timeBucket: "morning" },
  { iAm: "relentless", quote: "I do not stop when I am tired. I stop when I am done.", timeBucket: "morning" },
  { iAm: "free", quote: "Freedom is paid for in daily discipline.", timeBucket: "morning" },

  // ───── MIDDAY (productivity, momentum) ─────
  { iAm: "in flow", quote: "The zone is not found. It is built, one rep at a time.", timeBucket: "midday" },
  { iAm: "productive", quote: "Done is better than perfect. Always.", timeBucket: "midday" },
  { iAm: "a closer", quote: "Most people quit at the finish line. I am the finish line.", timeBucket: "midday" },
  { iAm: "sharp as a blade", quote: "Precision beats power. Today I am precise.", timeBucket: "midday" },
  { iAm: "abundant", quote: "There is more than enough. Always.", timeBucket: "midday" },
  { iAm: "a problem solver", quote: "Obstacles are not in my way. They ARE my way.", timeBucket: "midday" },
  { iAm: "ahead of schedule", quote: "Tomorrow's victory is today's work.", timeBucket: "midday" },
  { iAm: "at my peak", quote: "I do not wait for the moment. I create it.", timeBucket: "midday" },
  { iAm: "magnetic", quote: "What I seek is also seeking me.", timeBucket: "midday" },
  { iAm: "a finisher", quote: "Most people start. Few finish. I am the few.", timeBucket: "midday" },
  { iAm: "efficient", quote: "Time is the only currency I cannot earn back.", timeBucket: "midday" },
  { iAm: "unshakable", quote: "The world can shake. I remain.", timeBucket: "midday" },

  // ───── EVENING (reflection, gratitude, growth) ─────
  { iAm: "grateful", quote: "What I focus on grows. Today I focus on what I have.", timeBucket: "evening" },
  { iAm: "becoming", quote: "I am not who I was. I am who I am becoming.", timeBucket: "evening" },
  { iAm: "the proof of my effort", quote: "Every rep, every page, every early morning — it all counts.", timeBucket: "evening" },
  { iAm: "still moving forward", quote: "Slow is smooth. Smooth is fast. I am still moving.", timeBucket: "evening" },
  { iAm: "in alignment", quote: "My actions match my words. My words match my values.", timeBucket: "evening" },
  { iAm: "capable", quote: "I have done hard things before. I will do them again.", timeBucket: "evening" },
  { iAm: "a student of life", quote: "Every setback is a lesson in disguise.", timeBucket: "evening" },
  { iAm: "rich in experience", quote: "Money buys things. Experience builds character.", timeBucket: "evening" },
  { iAm: "patient", quote: "Compound interest works on effort too.", timeBucket: "evening" },
  { iAm: "winning quietly", quote: "I do not need to prove anything to anyone but myself.", timeBucket: "evening" },
  { iAm: "proud of who I am", quote: "Self-respect is the foundation of all success.", timeBucket: "evening" },
  { iAm: "renewed", quote: "Every evening is a chance to reset, realign, and rise again.", timeBucket: "evening" },

  // ───── NIGHT (peace, rest, recovery) ─────
  { iAm: "at peace", quote: "Today I did my best. Tomorrow I will do better.", timeBucket: "night" },
  { iAm: "enough", quote: "I do not need to be more. I need to be present.", timeBucket: "night" },
  { iAm: "resting to rebuild", quote: "Even iron cools between strikes. Tonight, I cool.", timeBucket: "night" },
  { iAm: "still worthy", quote: "My worth is not measured by today's output.", timeBucket: "night" },
  { iAm: "letting go", quote: "What I cannot control, I release. What I can, I will master tomorrow.", timeBucket: "night" },
  { iAm: "trusting the process", quote: "The seeds I planted today bloom on their own time.", timeBucket: "night" },
  { iAm: "recharged", quote: "Sleep is not weakness. It is strategy.", timeBucket: "night" },
  { iAm: "held by the universe", quote: "I am exactly where I need to be.", timeBucket: "night" },
  { iAm: "silently powerful", quote: "The loudest victories often happen in silence.", timeBucket: "night" },
  { iAm: "the calm before the storm", quote: "Tomorrow I move. Tonight I rest.", timeBucket: "night" },

  // ───── ANY TIME (timeless, universal) ─────
  { iAm: "the master of my fate", quote: "I am the captain. The winds obey me.", timeBucket: "any" },
  { iAm: "built different", quote: "I was not born to fit in. I was born to stand out.", timeBucket: "any" },
  { iAm: "a warrior", quote: "The world breaks everyone. Some grow strong at the broken places.", timeBucket: "any" },
  { iAm: "limitless", quote: "The only ceiling I have is the one I have not demolished yet.", timeBucket: "any" },
  { iAm: "the storm", quote: "I am not afraid of the chaos. I am the chaos.", timeBucket: "any" },
  { iAm: "creating my future", quote: "The present is mine. The future is what I make of it.", timeBucket: "any" },
  { iAm: "unbreakable", quote: "Pressure creates diamonds. I am pressure-proof.", timeBucket: "any" },
  { iAm: "the lion", quote: "I do not react. I respond. I do not chase. I attract.", timeBucket: "any" },
  { iAm: "a force of nature", quote: "Quitting is not in my vocabulary.", timeBucket: "any" },
  { iAm: "indestructible", quote: "I have survived 100% of my hardest days.", timeBucket: "any" },
  { iAm: "the one percent", quote: "While they sleep, I work. While they quit, I grind.", timeBucket: "any" },
  { iAm: "my own hero", quote: "I am the only one who has to live with my decisions. So I make them count.", timeBucket: "any" },
];

/**
 * Pick a deterministic affirmation for a given time + index.
 * If `index` is provided, the same index is used (good for the "current
 * display" snapshot). If not provided, it rotates every `windowMs` (default
 * 10 minutes) so each glance at the lock screen feels fresh.
 */
export function pickAffirmation(
  windowMs: number = 10 * 60 * 1000,
  now: Date = new Date(),
  forcedIndex?: number,
): AffirmationItem {
  const hour = now.getHours();
  let bucket: AffirmationItem["timeBucket"];
  if (hour >= 5 && hour < 11) bucket = "morning";
  else if (hour >= 11 && hour < 17) bucket = "midday";
  else if (hour >= 17 && hour < 21) bucket = "evening";
  else bucket = "night";

  // Pool: bucket items + "any" (always allowed)
  const pool = AFFIRMATIONS.filter((a) => a.timeBucket === bucket || a.timeBucket === "any");
  if (pool.length === 0) return AFFIRMATIONS[0];

  // Deterministic index from time window — same window = same affirmation
  const idx = forcedIndex ?? Math.floor(now.getTime() / windowMs) % pool.length;
  return pool[idx];
}

/** Time-bucket label for UI */
export function getCurrentBucket(now: Date = new Date()): AffirmationItem["timeBucket"] {
  const hour = now.getHours();
  if (hour >= 5 && hour < 11) return "morning";
  if (hour >= 11 && hour < 17) return "midday";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

// ─────────────────────────────────────────────────────────────────────
// CANVAS RENDERING — overlay text on top of user's wallpaper image
// ─────────────────────────────────────────────────────────────────────

export interface RenderOptions {
  image: HTMLImageElement;
  affirmation: AffirmationItem;
  /** Output width (px). Height is computed from image aspect ratio. */
  width?: number;
  /** Text vertical position (% of height, 0-1) */
  textY?: number;
  /** Gold theme — matches brand */
  textColor?: string;
  /** Quote color (slightly muted) */
  quoteColor?: string;
  /** Top dark gradient opacity 0-1 */
  topGradient?: number;
  /** Bottom dark gradient opacity 0-1 */
  bottomGradient?: number;
  /** Show the "I AM" prefix in larger size */
  showPrefix?: boolean;
  /** Style preset */
  style?: AffirmationStyle;
  /** Optional small brand mark in corner */
  brandMark?: string;
}

/**
 * Render a wallpaper with the affirmation overlay onto a canvas.
 * Returns the canvas (caller is responsible for toDataURL/toBlob/download).
 */
export function renderAffirmationWallpaper(opts: RenderOptions): HTMLCanvasElement {
  const {
    image,
    affirmation,
    width = 1080,
    textY = 0.78,
    textColor = "#d4af37",
    quoteColor = "rgba(255,255,255,0.92)",
    topGradient = 0.35,
    bottomGradient = 0.7,
    showPrefix = true,
    style = "premium",
    brandMark = "MENIFEST OS",
  } = opts;

  // Compute height from image aspect ratio
  const aspect = image.naturalHeight / image.naturalWidth;
  const height = Math.round(width * aspect);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  // 1) Draw user image — cover fit (fills canvas, may crop)
  const srcRatio = image.naturalWidth / image.naturalHeight;
  const dstRatio = width / height;
  let sx = 0, sy = 0, sw = image.naturalWidth, sh = image.naturalHeight;
  if (srcRatio > dstRatio) {
    // image wider than canvas — crop sides
    sw = image.naturalHeight * dstRatio;
    sx = (image.naturalWidth - sw) / 2;
  } else {
    // image taller than canvas — crop top/bottom
    sh = image.naturalWidth / dstRatio;
    sy = (image.naturalHeight - sh) / 2;
  }
  ctx.drawImage(image, sx, sy, sw, sh, 0, 0, width, height);

  // 2) Top + bottom dark gradient overlay for text legibility
  const top = ctx.createLinearGradient(0, 0, 0, height * 0.5);
  top.addColorStop(0, `rgba(0,0,0,${topGradient})`);
  top.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = top;
  ctx.fillRect(0, 0, width, height * 0.5);

  const bot = ctx.createLinearGradient(0, height * 0.5, 0, height);
  bot.addColorStop(0, "rgba(0,0,0,0)");
  bot.addColorStop(1, `rgba(0,0,0,${bottomGradient})`);
  ctx.fillStyle = bot;
  ctx.fillRect(0, height * 0.5, width, height);

  // 3) Center vignette for extra text contrast
  const center = ctx.createRadialGradient(
    width / 2, height / 2, Math.min(width, height) * 0.3,
    width / 2, height / 2, Math.max(width, height) * 0.75,
  );
  center.addColorStop(0, "rgba(0,0,0,0)");
  center.addColorStop(1, "rgba(0,0,0,0.35)");
  ctx.fillStyle = center;
  ctx.fillRect(0, 0, width, height);

  // 4) Affirmation text
  const y = height * textY;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0,0,0,0.85)";
  ctx.shadowBlur = Math.max(20, width * 0.03);
  ctx.shadowOffsetY = 4;

  if (style === "minimal") {
    // Single line, no prefix, light weight
    ctx.font = `300 ${Math.round(width * 0.075)}px 'Inter', system-ui, sans-serif`;
    ctx.fillStyle = textColor;
    const mainText = showPrefix ? `I AM ${affirmation.iAm}` : affirmation.iAm;
    ctx.fillText(mainText, width / 2, y);
  } else if (style === "bold") {
    // Big "I AM" prefix, bold affirmation underneath
    const prefixSize = Math.round(width * 0.045);
    const mainSize = Math.round(width * 0.095);
    ctx.font = `600 ${prefixSize}px 'Inter', system-ui, sans-serif`;
    ctx.fillStyle = "rgba(212,175,55,0.7)";
    ctx.fillText("I AM", width / 2, y - mainSize * 0.55);
    ctx.font = `800 ${mainSize}px 'Inter', system-ui, sans-serif`;
    ctx.fillStyle = textColor;
    wrapText(ctx, affirmation.iAm.toUpperCase(), width / 2, y + mainSize * 0.15, width * 0.85, mainSize * 1.05);
  } else if (style === "elegant") {
    // Serif, italic quote feel
    const mainSize = Math.round(width * 0.07);
    ctx.font = `italic 400 ${mainSize}px 'Cinzel', 'Cormorant Garamond', serif`;
    ctx.fillStyle = textColor;
    const mainText = showPrefix ? `I AM ${affirmation.iAm}` : affirmation.iAm;
    ctx.fillText(mainText, width / 2, y);
  } else {
    // premium — gold "I AM" prefix, large affirmation, quote below
    const prefixSize = Math.round(width * 0.04);
    const mainSize = Math.round(width * 0.082);
    const quoteSize = Math.round(width * 0.028);

    // Decorative top hairline
    const lineY = y - mainSize * 0.95;
    const lineW = width * 0.18;
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.strokeStyle = "rgba(212,175,55,0.55)";
    ctx.lineWidth = Math.max(1, width * 0.0015);
    ctx.beginPath();
    ctx.moveTo(width / 2 - lineW, lineY);
    ctx.lineTo(width / 2 + lineW, lineY);
    ctx.stroke();

    // "I AM" prefix
    ctx.shadowColor = "rgba(0,0,0,0.9)";
    ctx.shadowBlur = Math.max(20, width * 0.03);
    ctx.shadowOffsetY = 3;
    ctx.font = `600 ${prefixSize}px 'Inter', system-ui, sans-serif`;
    ctx.fillStyle = "rgba(245,231,163,0.85)";
    ctx.fillText("I  A M", width / 2, y - mainSize * 0.5);

    // Main affirmation
    ctx.font = `800 ${mainSize}px 'Inter', system-ui, sans-serif`;
    ctx.fillStyle = textColor;
    wrapText(ctx, affirmation.iAm.toUpperCase(), width / 2, y + mainSize * 0.15, width * 0.88, mainSize * 1.05);

    // Decorative bottom hairline
    const lineY2 = y + mainSize * 0.95;
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.beginPath();
    ctx.moveTo(width / 2 - lineW * 0.6, lineY2);
    ctx.lineTo(width / 2 + lineW * 0.6, lineY2);
    ctx.stroke();
  }

  // 5) Quote (smaller, below affirmation)
  if (style !== "minimal") {
    const quoteSize = style === "elegant" ? Math.round(width * 0.025) : Math.round(width * 0.026);
    ctx.font = `italic 400 ${quoteSize}px 'Inter', system-ui, sans-serif`;
    ctx.fillStyle = quoteColor;
    ctx.shadowColor = "rgba(0,0,0,0.9)";
    ctx.shadowBlur = Math.max(12, width * 0.018);
    ctx.shadowOffsetY = 2;
    wrapText(
      ctx,
      `"${affirmation.quote}"`,
      width / 2,
      y + (style === "premium" ? width * 0.115 : width * 0.09),
      width * 0.82,
      quoteSize * 1.4,
    );
  }

  // 6) Brand mark in bottom-left corner
  if (brandMark) {
    const markSize = Math.round(width * 0.022);
    ctx.shadowColor = "rgba(0,0,0,0.8)";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 1;
    ctx.font = `600 ${markSize}px 'Inter', system-ui, sans-serif`;
    ctx.fillStyle = "rgba(212,175,55,0.6)";
    ctx.textAlign = "left";
    ctx.fillText(`◆ ${brandMark}`, width * 0.04, height - width * 0.045);
  }

  return canvas;
}

/** Word-wrap helper for canvas (English only, whitespace split). */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  const totalH = lines.length * lineHeight;
  const startY = y - totalH / 2 + lineHeight / 2;
  lines.forEach((line, i) => {
    ctx.fillText(line, x, startY + i * lineHeight);
  });
}

// ─────────────────────────────────────────────────────────────────────
// DOWNLOAD HELPERS
// ─────────────────────────────────────────────────────────────────────

/** Download a canvas as a PNG file. */
export function downloadCanvasAsPng(canvas: HTMLCanvasElement, filename: string) {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, "image/png", 0.95);
}

/** Convert canvas to a data URL (for in-app preview). */
export function canvasToDataUrl(canvas: HTMLCanvasElement, quality: number = 0.92): string {
  return canvas.toDataURL("image/jpeg", quality);
}

/** Load a File into an HTMLImageElement. */
export function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─────────────────────────────────────────────────────────────────────
// PERSISTENCE — localStorage for user prefs + last-rendered image
// ─────────────────────────────────────────────────────────────────────

export interface UserWallpaperPrefs {
  /** Last uploaded image as base64 data URL (capped at ~2MB for storage safety) */
  uploadedImageDataUrl?: string;
  /** User-chosen style */
  style: AffirmationStyle;
  /** Custom override text (if user wants their own affirmation) */
  customAffirmation?: string;
  /** Whether 10-min rotation is enabled */
  rotationEnabled: boolean;
  /** Last-affirmation index used (so the same one shows on app open) */
  lastAffirmationIndex: number;
  /** Saved timestamp of last generation */
  lastGeneratedAt: string;
}

const STORAGE_KEY = "menifest_wallpaper_engine_v1";

export function loadUserWallpaperPrefs(): UserWallpaperPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        style: parsed.style || "premium",
        rotationEnabled: parsed.rotationEnabled !== false,
        lastAffirmationIndex: Number(parsed.lastAffirmationIndex) || 0,
        lastGeneratedAt: parsed.lastGeneratedAt || new Date().toISOString(),
        uploadedImageDataUrl: parsed.uploadedImageDataUrl,
        customAffirmation: parsed.customAffirmation,
      };
    }
  } catch (e) {
    console.warn("[wallpaperEngine] Failed to load prefs:", e);
  }
  return {
    style: "premium",
    rotationEnabled: true,
    lastAffirmationIndex: 0,
    lastGeneratedAt: new Date().toISOString(),
  };
}

export function saveUserWallpaperPrefs(prefs: Partial<UserWallpaperPrefs>) {
  try {
    const current = loadUserWallpaperPrefs();
    const merged = { ...current, ...prefs, lastGeneratedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch (e) {
    console.warn("[wallpaperEngine] Failed to save prefs:", e);
  }
}

/** Compress an image to fit in localStorage (~2MB max). */
export async function compressImageForStorage(file: File, maxDim: number = 1600, quality: number = 0.75): Promise<string> {
  const img = await loadImageFromFile(file);
  const ratio = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.round(img.naturalWidth * ratio);
  const h = Math.round(img.naturalHeight * ratio);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", quality);
}

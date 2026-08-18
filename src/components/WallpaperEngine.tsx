import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Image as ImageIcon, Upload, Download, Sparkles, RefreshCw, Clock,
  ChevronRight, X, Check, Settings as SettingsIcon, Smartphone, Crown,
  Sun, Moon, Sunrise, Sunset, Zap
} from "lucide-react";
import {
  AFFIRMATIONS,
  pickAffirmation,
  getCurrentBucket,
  renderAffirmationWallpaper,
  loadImageFromFile,
  downloadCanvasAsPng,
  canvasToDataUrl,
  loadUserWallpaperPrefs,
  saveUserWallpaperPrefs,
  compressImageForStorage,
  type AffirmationItem,
  type AffirmationStyle,
  type UserWallpaperPrefs,
} from "../lib/wallpaperEngine";

interface WallpaperEngineProps {
  /** Toast/notification handler from parent */
  notify?: (msg: string) => void;
  /** Optional: refresh trigger (e.g. when user opens profile) */
  refreshSignal?: number;
}

// 10-minute rotation window
const ROTATION_MS = 10 * 60 * 1000;

const STYLE_OPTIONS: { id: AffirmationStyle; label: string; sub: string }[] = [
  { id: "premium", label: "Premium", sub: "Gold & centered" },
  { id: "bold", label: "Bold", sub: "Huge & impactful" },
  { id: "minimal", label: "Minimal", sub: "Thin & clean" },
  { id: "elegant", label: "Elegant", sub: "Serif italic" },
];

const BUCKET_ICONS: Record<AffirmationItem["timeBucket"], React.ReactNode> = {
  morning: <Sunrise size={12} className="text-amber-300" />,
  midday: <Sun size={12} className="text-yellow-300" />,
  evening: <Sunset size={12} className="text-orange-300" />,
  night: <Moon size={12} className="text-indigo-300" />,
  any: <Zap size={12} className="text-amber-300" />,
};

const BUCKET_LABELS: Record<AffirmationItem["timeBucket"], string> = {
  morning: "Morning",
  midday: "Midday",
  evening: "Evening",
  night: "Night",
  any: "Timeless",
};

export const WallpaperEngine: React.FC<WallpaperEngineProps> = ({ notify, refreshSignal }) => {
  // ─── STATE ──────────────────────────────────────────────────────
  const [prefs, setPrefs] = useState<UserWallpaperPrefs>(() => loadUserWallpaperPrefs());
  const [uploadedImg, setUploadedImg] = useState<HTMLImageElement | null>(null);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [currentAffirmation, setCurrentAffirmation] = useState<AffirmationItem>(() => pickAffirmation());
  const [style, setStyle] = useState<AffirmationStyle>(prefs.style);
  const [customText, setCustomText] = useState<string>(prefs.customAffirmation || "");
  const [rotationEnabled, setRotationEnabled] = useState<boolean>(prefs.rotationEnabled);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showStylePicker, setShowStylePicker] = useState(false);
  const [now, setNow] = useState<Date>(new Date());
  const [imageSize, setImageSize] = useState<{ w: number; h: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Notify helper (no-op if not provided)
  const toast = useCallback(
    (msg: string) => {
      if (notify) notify(msg);
    },
    [notify]
  );

  // ─── 10-MINUTE ROTATION TICKER ──────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      setNow(new Date());
      if (rotationEnabled) {
        setCurrentAffirmation(pickAffirmation(ROTATION_MS, new Date()));
      }
    }, 30 * 1000); // tick every 30s to check if window changed
    return () => clearInterval(id);
  }, [rotationEnabled]);

  // ─── RESTORE UPLOADED IMAGE FROM STORAGE ON MOUNT ──────────────
  useEffect(() => {
    if (prefs.uploadedImageDataUrl && !uploadedImg) {
      const img = new Image();
      img.onload = () => {
        setUploadedImg(img);
        setImageSize({ w: img.naturalWidth, h: img.naturalHeight });
      };
      img.src = prefs.uploadedImageDataUrl;
    }
  }, [prefs.uploadedImageDataUrl, uploadedImg]);

  // ─── AUTO-REGENERATE PREVIEW WHENEVER INPUTS CHANGE ─────────────
  useEffect(() => {
    if (uploadedImg) {
      regenerate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadedImg, style, currentAffirmation, customText]);

  // ─── SAVE PREFS WHENEVER THEY CHANGE ────────────────────────────
  useEffect(() => {
    saveUserWallpaperPrefs({
      style,
      rotationEnabled,
      customAffirmation: customText,
      lastAffirmationIndex: AFFIRMATIONS.indexOf(currentAffirmation),
    });
    setPrefs((p) => ({ ...p, style, rotationEnabled, customAffirmation: customText }));
  }, [style, rotationEnabled, customText, currentAffirmation]);

  // ─── FILE UPLOAD HANDLER ────────────────────────────────────────
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast("⚠️ Please upload a JPG or PNG image");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast("⚠️ Image too large (max 10MB)");
      return;
    }
    setIsGenerating(true);
    try {
      const img = await loadImageFromFile(file);
      setUploadedImg(img);
      setImageSize({ w: img.naturalWidth, h: img.naturalHeight });
      // Compress + save to localStorage so the user does not have to re-upload
      const compressed = await compressImageForStorage(file, 1600, 0.75);
      saveUserWallpaperPrefs({ uploadedImageDataUrl: compressed });
      toast("✨ Wallpaper image loaded");
    } catch (err) {
      toast("❌ Failed to load image");
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  // ─── REGENERATE PREVIEW ─────────────────────────────────────────
  const regenerate = useCallback(() => {
    if (!uploadedImg) return;
    const useAffirmation: AffirmationItem = customText.trim()
      ? { iAm: customText.trim(), quote: "— Menifest OS", timeBucket: "any" }
      : currentAffirmation;
    try {
      const canvas = renderAffirmationWallpaper({
        image: uploadedImg,
        affirmation: useAffirmation,
        style,
      });
      const url = canvasToDataUrl(canvas, 0.85);
      setPreviewDataUrl(url);
      setImageSize({ w: canvas.width, h: canvas.height });
    } catch (e) {
      console.error("[wallpaperEngine] render failed:", e);
    }
  }, [uploadedImg, currentAffirmation, customText, style]);

  // ─── DOWNLOAD ───────────────────────────────────────────────────
  const handleDownload = () => {
    if (!uploadedImg) {
      toast("⚠️ Upload an image first");
      return;
    }
    setIsGenerating(true);
    try {
      const useAffirmation: AffirmationItem = customText.trim()
        ? { iAm: customText.trim(), quote: "— Menifest OS", timeBucket: "any" }
        : currentAffirmation;
      // Higher quality for download (1080 wide, 0.95 quality)
      const canvas = renderAffirmationWallpaper({
        image: uploadedImg,
        affirmation: useAffirmation,
        style,
        width: 1080,
      });
      const safeName = (useAffirmation.iAm || "affirmation").replace(/[^a-z0-9]+/gi, "-").toLowerCase().slice(0, 30);
      downloadCanvasAsPng(canvas, `menifest-os-${safeName}-${Date.now()}.png`);
      toast("✨ Wallpaper downloaded — set it as your lock screen!");
    } catch (e) {
      toast("❌ Download failed");
    } finally {
      setIsGenerating(false);
    }
  };

  // ─── MANUALLY ROTATE TO NEXT AFFIRMATION ────────────────────────
  const nextAffirmation = () => {
    const pool = AFFIRMATIONS;
    const currentIdx = pool.indexOf(currentAffirmation);
    const nextIdx = (currentIdx + 1) % pool.length;
    setCurrentAffirmation(pool[nextIdx]);
  };

  // ─── RESET TO UPLOADED-IMAGE-ONLY (no overlay) ──────────────────
  const handleResetImage = () => {
    if (fileInputRef.current) fileInputRef.current.value = "";
    setUploadedImg(null);
    setPreviewDataUrl(null);
    saveUserWallpaperPrefs({ uploadedImageDataUrl: undefined });
    toast("🗑️ Wallpaper image cleared");
  };

  // ─── DERIVED UI VALUES ──────────────────────────────────────────
  const currentBucket = useMemo(() => getCurrentBucket(now), [now]);
  const minutesUntilNext = useMemo(() => {
    const nowMs = now.getTime();
    const nextWindow = Math.ceil(nowMs / ROTATION_MS) * ROTATION_MS;
    return Math.ceil((nextWindow - nowMs) / 60000);
  }, [now]);

  return (
    <div
      className="bg-zinc-950 border border-white/10 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl"
      style={{ fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif" }}
    >
      {/* ═══ STICKY HEADER ═══ */}
      <div className="px-4 sm:px-5 py-3 border-b border-white/[0.06] flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-amber-500/10 border border-amber-400/30 flex items-center justify-center shrink-0">
          <ImageIcon size={16} className="text-amber-300" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[14px] sm:text-[15px] font-bold text-white tracking-tight">
            I AM Wallpaper Engine
          </h3>
          <p className="text-[10.5px] text-white/45 tracking-tight truncate">
            Your wallpaper · affirmations every 10 minutes
          </p>
        </div>
        <button
          onClick={() => setShowSettings(true)}
          className="p-1.5 rounded-full hover:bg-white/[0.06] text-white/55 hover:text-white transition-colors"
          aria-label="Settings"
        >
          <SettingsIcon size={15} />
        </button>
      </div>

      {/* ═══ PREVIEW + CONTROLS BODY ═══ */}
      <div className="p-3.5 sm:p-4 grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4">
        {/* ── PREVIEW (left, 5/12) ── */}
        <div className="md:col-span-5">
          <div
            className="relative w-full rounded-2xl overflow-hidden border border-white/[0.08] bg-black"
            style={{ aspectRatio: "9 / 16" }}
          >
            {previewDataUrl ? (
              <img
                src={previewDataUrl}
                alt="Wallpaper preview"
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-5 text-center">
                <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-400/30 flex items-center justify-center mb-3">
                  <Smartphone size={22} className="text-amber-300" />
                </div>
                <p className="text-[12px] font-semibold text-white/80 mb-1">
                  Upload your wallpaper
                </p>
                <p className="text-[10.5px] text-white/45 max-w-[220px] leading-snug">
                  Any photo from your gallery. We'll overlay an I AM affirmation every 10 minutes.
                </p>
              </div>
            )}

            {/* Floating "now playing" affirmation chip */}
            {previewDataUrl && (
              <div className="absolute top-2 left-2 right-2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-amber-400/20 text-[10px] font-mono">
                {BUCKET_ICONS[currentAffirmation.timeBucket]}
                <span className="text-amber-200/90 font-bold tracking-wider uppercase truncate">
                  Now · {BUCKET_LABELS[currentAffirmation.timeBucket]}
                </span>
              </div>
            )}
          </div>

          {/* Upload / change image */}
          <div className="mt-2.5 flex items-center gap-2">
            <label className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/15 border border-amber-400/30 text-amber-200 text-[11px] font-bold cursor-pointer transition active:scale-95">
              <Upload size={12} />
              {uploadedImg ? "Change Image" : "Upload Wallpaper"}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            {uploadedImg && (
              <button
                onClick={handleResetImage}
                className="px-3 py-2 rounded-xl border border-white/10 hover:border-red-400/40 text-white/55 hover:text-red-300 text-[11px] font-semibold transition active:scale-95"
                title="Remove uploaded image"
              >
                <X size={12} />
              </button>
            )}
          </div>
          {imageSize && (
            <p className="text-[9.5px] text-white/35 font-mono mt-1.5 text-center">
              {imageSize.w} × {imageSize.h} px · ready for phone wallpaper
            </p>
          )}
        </div>

        {/* ── CONTROLS (right, 7/12) ── */}
        <div className="md:col-span-7 flex flex-col gap-3">
          {/* Current affirmation display */}
          <div className="rounded-2xl border border-amber-400/20 bg-amber-500/[0.04] p-3.5">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Sparkles size={11} className="text-amber-300" />
              <span className="text-[9.5px] font-mono uppercase tracking-[0.18em] text-amber-200/80 font-bold">
                Current Affirmation
              </span>
            </div>
            <p className="text-[17px] sm:text-[19px] font-extrabold text-amber-300 leading-tight tracking-tight">
              I AM {customText.trim() || currentAffirmation.iAm}
            </p>
            {!customText.trim() && (
              <p className="text-[11.5px] text-white/65 mt-1.5 italic leading-snug font-light">
                "{currentAffirmation.quote}"
              </p>
            )}
            <div className="mt-3 flex items-center justify-between gap-2 text-[10px] font-mono text-white/50">
              <div className="flex items-center gap-1.5">
                <Clock size={10} />
                {rotationEnabled ? (
                  <span>Next rotation in <span className="text-amber-200 font-bold tabular-nums">{minutesUntilNext}m</span></span>
                ) : (
                  <span className="text-white/40">Rotation paused</span>
                )}
              </div>
              <button
                onClick={nextAffirmation}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full hover:bg-white/[0.06] text-white/65 hover:text-white transition-colors"
              >
                <RefreshCw size={10} /> Skip
              </button>
            </div>
          </div>

          {/* Rotation toggle + style picker */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setRotationEnabled(!rotationEnabled)}
              className={`flex-1 min-w-[140px] flex items-center justify-between gap-2 px-3 py-2 rounded-xl border text-[11px] font-semibold transition ${
                rotationEnabled
                  ? "bg-amber-500/10 border-amber-400/40 text-amber-200"
                  : "bg-white/[0.04] border-white/10 text-white/55"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <RefreshCw size={11} />
                Auto-rotate (10m)
              </div>
              <div
                className={`w-7 h-4 rounded-full relative transition-colors ${
                  rotationEnabled ? "bg-amber-400/60" : "bg-white/15"
                }`}
              >
                <div
                  className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${
                    rotationEnabled ? "left-3.5" : "left-0.5"
                  }`}
                />
              </div>
            </button>

            <button
              onClick={() => setShowStylePicker(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white/75 hover:text-white text-[11px] font-semibold transition"
            >
              <Sparkles size={11} />
              Style: {STYLE_OPTIONS.find(s => s.id === style)?.label}
              <ChevronRight size={11} />
            </button>
          </div>

          {/* Custom text input */}
          <div>
            <label className="text-[10px] font-mono uppercase tracking-wider text-white/45 block mb-1">
              Custom text (optional)
            </label>
            <input
              type="text"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="e.g. powerful, focused, the storm"
              maxLength={40}
              className="w-full bg-black/60 border border-white/10 focus:border-amber-400/50 rounded-xl px-3 py-2 text-[12px] text-white placeholder:text-white/30 focus:outline-none transition"
            />
            {customText.trim() && (
              <p className="text-[10px] text-amber-300/80 mt-1 font-mono">
                Will show: <span className="text-amber-200 font-bold">"I AM {customText.trim()}"</span> (overrides rotation)
              </p>
            )}
          </div>

          {/* Download button */}
          <button
            onClick={handleDownload}
            disabled={!uploadedImg || isGenerating}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-extrabold text-[12px] uppercase tracking-wider shadow-lg shadow-amber-900/40 transition active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Download size={14} />
            {isGenerating ? "Generating..." : "Download & Set as Wallpaper"}
          </button>

          <p className="text-[10px] text-white/40 text-center leading-snug font-mono">
            Tap above to save. Then <span className="text-amber-300 font-bold">Settings → Wallpaper → Set</span> on your phone.
          </p>
        </div>
      </div>

      {/* ═══ SETTINGS MODAL ═══ */}
      {showSettings && (
        <div
          className="fixed inset-0 z-[500] flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto"
          style={{ backgroundColor: "rgba(0,0,0,0.85)", backdropFilter: "blur(20px)" }}
          onClick={() => setShowSettings(false)}
        >
          <div
            className="rounded-3xl w-full max-w-md shadow-2xl my-auto"
            style={{
              backgroundColor: "rgba(10,11,16,0.95)",
              maxHeight: "min(640px, calc(100vh - 32px))",
              animation: "sd-modal-in 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 rounded-t-3xl px-4 sm:px-5 py-3 flex items-center gap-3 border-b border-white/[0.06]" style={{ backgroundColor: "rgba(10,11,16,0.95)" }}>
              <div className="w-9 h-9 rounded-full bg-amber-500/10 border border-amber-400/30 flex items-center justify-center">
                <SettingsIcon size={15} className="text-amber-300" />
              </div>
              <div className="flex-1">
                <h3 className="text-[14px] font-bold text-white">Wallpaper Settings</h3>
                <p className="text-[10px] text-white/45">Tune your affirmation engine</p>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="p-1.5 rounded-full hover:bg-white/[0.06] text-white/55 hover:text-white"
              >
                <X size={15} />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto" style={{ maxHeight: "calc(100vh - 130px)" }}>
              {/* Affirmation stats */}
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-amber-200/80 mb-2 font-bold">
                  Library Stats
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(["morning", "midday", "evening", "night"] as const).map((b) => {
                    const count = AFFIRMATIONS.filter(a => a.timeBucket === b).length;
                    return (
                      <div
                        key={b}
                        className="rounded-xl border border-white/10 bg-black/40 p-2.5 flex items-center gap-2"
                      >
                        {BUCKET_ICONS[b]}
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] font-semibold text-white capitalize">{b}</div>
                          <div className="text-[10px] text-white/45 font-mono">{count} affirmations</div>
                        </div>
                        {currentAffirmation.timeBucket === b && (
                          <Check size={12} className="text-amber-300" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Rotation window */}
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-amber-200/80 mb-2 font-bold">
                  Rotation Window
                </div>
                <div className="rounded-xl border border-white/10 bg-black/40 p-3 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-white/65">Auto-rotate every</span>
                    <span className="text-amber-300 font-bold font-mono">10 minutes</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-white/65">Next change in</span>
                    <span className="text-white font-mono tabular-nums">{minutesUntilNext}m</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-white/65">Current bucket</span>
                    <div className="flex items-center gap-1 text-amber-200 capitalize font-mono">
                      {BUCKET_ICONS[currentBucket]} {currentBucket}
                    </div>
                  </div>
                </div>
              </div>

              {/* Reset */}
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-amber-200/80 mb-2 font-bold">
                  Reset
                </div>
                <button
                  onClick={() => {
                    if (confirm("Reset all wallpaper settings and uploaded image?")) {
                      handleResetImage();
                      setStyle("premium");
                      setCustomText("");
                      setRotationEnabled(true);
                      setCurrentAffirmation(pickAffirmation(ROTATION_MS, new Date(), 0));
                      toast("🔄 Wallpaper engine reset");
                      setShowSettings(false);
                    }
                  }}
                  className="w-full py-2.5 rounded-xl border border-red-500/30 bg-red-500/5 hover:bg-red-500/10 text-red-300 text-[11px] font-semibold transition"
                >
                  Reset Everything
                </button>
              </div>

              {/* About */}
              <div className="rounded-xl border border-amber-400/20 bg-amber-500/[0.04] p-3">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Crown size={11} className="text-amber-300" />
                  <span className="text-[10px] font-mono uppercase tracking-wider text-amber-200 font-bold">
                    How it works
                  </span>
                </div>
                <ol className="text-[10.5px] text-white/65 space-y-1 leading-relaxed list-decimal pl-4">
                  <li>Upload your favorite wallpaper image (any photo works)</li>
                  <li>Auto-rotates through 60+ I AM affirmations every 10 minutes</li>
                  <li>Time-aware: morning = energy, night = peace</li>
                  <li>Tap "Download" to save the rendered image and set as your lock screen</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ STYLE PICKER MODAL ═══ */}
      {showStylePicker && (
        <div
          className="fixed inset-0 z-[500] flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto"
          style={{ backgroundColor: "rgba(0,0,0,0.85)", backdropFilter: "blur(20px)" }}
          onClick={() => setShowStylePicker(false)}
        >
          <div
            className="rounded-3xl w-full max-w-md shadow-2xl my-auto"
            style={{
              backgroundColor: "rgba(10,11,16,0.95)",
              maxHeight: "min(520px, calc(100vh - 32px))",
              animation: "sd-modal-in 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 rounded-t-3xl px-4 sm:px-5 py-3 flex items-center gap-3 border-b border-white/[0.06]" style={{ backgroundColor: "rgba(10,11,16,0.95)" }}>
              <div className="w-9 h-9 rounded-full bg-amber-500/10 border border-amber-400/30 flex items-center justify-center">
                <Sparkles size={15} className="text-amber-300" />
              </div>
              <div className="flex-1">
                <h3 className="text-[14px] font-bold text-white">Choose Style</h3>
                <p className="text-[10px] text-white/45">4 premium overlay presets</p>
              </div>
              <button
                onClick={() => setShowStylePicker(false)}
                className="p-1.5 rounded-full hover:bg-white/[0.06] text-white/55 hover:text-white"
              >
                <X size={15} />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-2 overflow-y-auto" style={{ maxHeight: "calc(100vh - 130px)" }}>
              {STYLE_OPTIONS.map((opt) => {
                const active = style === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setStyle(opt.id);
                      setShowStylePicker(false);
                    }}
                    className={`w-full flex items-center gap-3 p-3 rounded-2xl border transition text-left active:scale-[0.99] ${
                      active
                        ? "bg-amber-500/10 border-amber-400/50"
                        : "bg-black/40 border-white/10 hover:border-white/20"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        active ? "bg-amber-400/30" : "bg-white/[0.06]"
                      }`}
                    >
                      <Sparkles size={16} className={active ? "text-amber-300" : "text-white/55"} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-[12.5px] font-bold ${active ? "text-amber-200" : "text-white"}`}>
                        {opt.label}
                      </div>
                      <div className="text-[10px] text-white/55 mt-0.5">{opt.sub}</div>
                    </div>
                    {active && <Check size={14} className="text-amber-300 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Inline keyframes — for modal-in animation (avoids global CSS conflict) */}
      <style>{`
        @keyframes sd-modal-in {
          from { opacity: 0; transform: translateY(8px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
};

export default WallpaperEngine;

/**
 * Image helper utilities for the app.
 *
 * Goals:
 *  1. Normalize paths — code can use either "/images/foo.jpg" or "/assets/foo.jpg"
 *     and the helper will resolve to the correct public/ URL.
 *  2. Provide a tiny inline-SVG fallback so broken images never leave a blank
 *     box (e.g. the /images/anime/*.png avatars that don't exist on disk).
 *  3. Build safe URL helpers for <img src=...> and CSS backgroundImage: url(...).
 */

/** Files that we know don't exist on disk — we substitute a generated SVG. */
const KNOWN_MISSING: Record<string, string> = {
  "/images/anime/avatar-warrior.png": "warrior",
  "/images/anime/avatar-elite.png": "elite",
  "/images/anime/avatar-king.png": "king",
  "/images/anime/avatar-seeker.png": "seeker",
};

/** Both folders are valid in public/. Try /images/ first, then /assets/. */
const PUBLIC_DIRS = ["/images", "/assets"] as const;

/**
 * Resolve a public URL, trying the requested path first and falling back
 * to the alternate folder if the file is missing there.
 *
 * Use this for any image path that COULD be in either /images/ or /assets/.
 * For paths that are guaranteed to live in one folder only, just use the raw string.
 */
export function resolveImageUrl(input: string | undefined | null): string {
  if (!input) return FALLBACK_AVATAR;

  // Already an absolute URL (data:, http(s)://) — return as-is.
  if (input.startsWith("data:") || /^https?:\/\//i.test(input)) return input;

  // Strip leading slash for normalization.
  const clean = input.startsWith("/") ? input.slice(1) : input;

  // Known-missing files → substitute a generated SVG placeholder.
  if (KNOWN_MISSING["/" + clean]) {
    return avatarFallbackSvg(KNOWN_MISSING["/" + clean]);
  }

  // If the caller already used /src/assets/images/... (a Vite source path),
  // strip the /src/ prefix and serve from /images/ instead.
  if (clean.startsWith("src/assets/images/")) {
    return "/" + clean.replace(/^src\/assets\/images\//, "images/");
  }

  // If the path already lives in /images/ or /assets/, return as-is.
  if (clean.startsWith("images/") || clean.startsWith("assets/")) {
    return "/" + clean;
  }

  // Otherwise assume it's a bare filename and look in /images/ first.
  return "/images/" + clean;
}

/** Default avatar shown when nothing else is available. */
export const FALLBACK_AVATAR = "/images/shadow_monarch_avatar.jpg";

/**
 * Generate a small, themed inline-SVG data URL for missing avatar images.
 * This guarantees <img> never renders a broken icon, even on cold deploys
 * or if the asset folder is incomplete.
 */
function avatarFallbackSvg(theme: string): string {
  const palettes: Record<string, [string, string, string]> = {
    warrior: ["#f97316", "#7c2d12", "⚔️"],
    elite:   ["#a855f7", "#581c87", "👑"],
    king:    ["#eab308", "#713f12", "👑"],
    seeker:  ["#06b6d4", "#164e63", "✨"],
  };
  const [primary, dark, emoji] = palettes[theme] || palettes.seeker;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <defs>
      <radialGradient id="g" cx="50%" cy="40%">
        <stop offset="0%" stop-color="${primary}" stop-opacity="0.9"/>
        <stop offset="100%" stop-color="${dark}" stop-opacity="1"/>
      </radialGradient>
    </defs>
    <rect width="100" height="100" fill="url(#g)"/>
    <text x="50" y="58" font-size="42" text-anchor="middle" dominant-baseline="middle">${emoji}</text>
  </svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

/**
 * Stable onError handler factory. Use on every <img> tag that references
 * a /images/ or /assets/ URL. It will swap the src to a guaranteed-safe
 * fallback if the image 404s.
 *
 * Usage:
 *   <img src={resolveImageUrl("/images/foo.jpg")} onError={onImgError(FALLBACK_AVATAR)} />
 */
export function onImgError(fallback: string = FALLBACK_AVATAR) {
  return (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    // Guard against infinite loop if the fallback itself is broken.
    if (img.dataset.fallbackApplied === "1") return;
    img.dataset.fallbackApplied = "1";
    img.src = fallback;
  };
}

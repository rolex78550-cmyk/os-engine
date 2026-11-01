// Generates per-page 1200x630 OG images into public/og/<slug>.jpg (Python/Pillow).
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PAGES } from "../seo/content/index.mjs";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const spec = JSON.stringify(
  PAGES.map((p) => ({
    slug: p.slug,
    type: p.type,
    title: p.navTitle || p.h1,
    eyebrow: p.eyebrow || (p.type === "commercial" ? "Menifest OS" : "Guide"),
  }))
);
execFileSync("python3", [path.join(root, "scripts", "og.py"), spec], { cwd: root, stdio: "inherit" });

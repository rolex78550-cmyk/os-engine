// Generates static, crawlable SEO pages into dist/<slug>/index.html after
// `vite build`. Zero React involvement: plain HTML + inline CSS, so it can
// never break the app. Content lives in seo/content/*.mjs.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SITE, PAGES, HUB } from "../seo/content/index.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");
const TODAY = "2026-09-15";

const esc = (s = "") =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// tiny inline markup: **bold**, [text](/href)
const inline = (s = "") =>
  esc(s)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, h) => `<a href="${h}">${t}</a>`);

const slugify = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60);

const words = (page) => {
  let n = 0;
  const count = (t) => (n += String(t || "").split(/\s+/).filter(Boolean).length);
  page.intro.forEach(count);
  page.sections.forEach((s) => {
    count(s.h2);
    (s.p || []).forEach(count);
    (s.ul || []).forEach(count);
    (s.ol || []).forEach(count);
    (s.blocks || []).forEach((b) => {
      count(b.h3);
      count(b.quote);
      (b.p || []).forEach(count);
      (b.ul || []).forEach(count);
      (b.ol || []).forEach(count);
      (b.table || []).forEach((row) => row.forEach(count));
    });
  });
  (page.faqs || []).forEach((f) => (count(f.q), count(f.a)));
  return n;
};

const CSS = `
:root{--bg:#050403;--surface:#12100d;--line:rgba(255,164,74,.18);--text:#ebe4da;--muted:#a89f94;--orange:#ff7a00;--gold:#ffb457}
*{box-sizing:border-box}html{scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--text);font:16px/1.7 Inter,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;-webkit-font-smoothing:antialiased}
a{color:var(--gold);text-decoration:none}a:hover{text-decoration:underline}
h1,h2,h3{font-family:Cinzel,Georgia,serif;line-height:1.15;letter-spacing:.01em;margin:0 0 .5em}
h1{font-size:clamp(28px,6vw,44px);color:#fff}h2{font-size:clamp(21px,4.4vw,28px);color:#fff;margin-top:1.9em}h3{font-size:18px;color:var(--gold);margin-top:1.4em}
p,li{color:var(--text)}ul,ol{padding-left:1.25em}li{margin:.35em 0}
.wrap{max-width:760px;margin:0 auto;padding:0 20px}
header{position:sticky;top:0;z-index:10;background:rgba(5,4,3,.85);backdrop-filter:blur(10px);border-bottom:1px solid rgba(255,255,255,.06)}
header .wrap{display:flex;align-items:center;justify-content:space-between;height:60px;max-width:1080px;gap:12px}
.brand{display:flex;align-items:center;gap:10px;color:#fff;font-weight:700;white-space:nowrap;text-decoration:none!important}
.brand img{width:34px;height:34px;border-radius:10px}
nav{display:flex;align-items:center;gap:14px;white-space:nowrap}
nav a{color:var(--muted);font-size:14px}nav a.btn{background:var(--orange);color:#1a0d00;padding:8px 14px;border-radius:999px;font-weight:700}
@media (max-width:420px){.brand span{display:none}nav{gap:10px}nav a{font-size:13px}nav a.btn{padding:7px 12px}}
.crumbs{font-size:13px;color:var(--muted);margin:22px 0 10px}.crumbs a{color:var(--muted)}
.eyebrow{color:var(--orange);font-size:12px;letter-spacing:.28em;text-transform:uppercase;font-weight:800;margin-bottom:12px}
.meta{color:var(--muted);font-size:13px;margin:6px 0 24px}
.lead{font-size:18px;color:#f3ede6}
.toc{background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:16px 20px;margin:26px 0}
.toc b{display:block;font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:var(--gold);margin-bottom:8px}
.toc ol{margin:0;padding-left:1.2em}.toc li{margin:.2em 0;font-size:15px}
.card{background:linear-gradient(180deg,rgba(255,122,0,.12),rgba(255,122,0,.03));border:1px solid var(--line);border-radius:20px;padding:26px 24px;margin:40px 0}
.card h2{margin-top:0;font-size:24px}.card p{color:#f3ede6}
.btn-lg{display:inline-block;background:var(--orange);color:#1a0d00!important;font-weight:800;padding:14px 22px;border-radius:999px;margin-top:8px;text-decoration:none!important}
.small{font-size:13px;color:var(--muted)}
details{border-top:1px solid rgba(255,255,255,.08);padding:14px 0}details:last-of-type{border-bottom:1px solid rgba(255,255,255,.08)}
summary{cursor:pointer;font-weight:700;color:#fff;list-style:none;display:flex;justify-content:space-between;gap:12px}
summary::after{content:"+";color:var(--gold);font-size:20px;line-height:1}details[open] summary::after{content:"–"}
details p{margin:10px 0 0;color:var(--text)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;margin-top:14px}
.tile{display:block;background:var(--surface);border:1px solid rgba(255,255,255,.07);border-radius:14px;padding:14px 16px;color:#fff;text-decoration:none!important}
.tile:hover{border-color:var(--line)}.tile b{display:block;font-size:15px;margin-bottom:4px}.tile span{font-size:13px;color:var(--muted)}
.price{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px;margin:20px 0}
.plan{background:var(--surface);border:1px solid rgba(255,255,255,.08);border-radius:18px;padding:20px}
.plan.hi{border-color:var(--orange);box-shadow:0 0 40px rgba(255,122,0,.15)}
.plan b{font-family:Cinzel,Georgia,serif;font-size:13px;letter-spacing:.2em;color:var(--gold)}
.plan .amt{font-size:34px;font-weight:800;color:#fff;margin:6px 0 2px}.plan .amt s{font-size:16px;color:var(--muted);margin-left:6px}
.plan .sub{font-size:13px;color:var(--muted)}.plan ul{padding-left:1.1em;font-size:14px;margin:12px 0 0}
footer{border-top:1px solid rgba(255,255,255,.06);margin-top:60px;padding:34px 0 48px;color:var(--muted);font-size:14px}
footer .wrap{max-width:1080px}footer .cols{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:22px}
footer b{display:block;color:#fff;font-size:12px;letter-spacing:.2em;text-transform:uppercase;margin-bottom:10px}
footer a{color:var(--muted);display:block;margin:5px 0}
blockquote{margin:1.2em 0;padding:14px 18px;border-left:3px solid var(--orange);background:var(--surface);border-radius:0 12px 12px 0;color:#f3ede6}
table{width:100%;border-collapse:collapse;font-size:15px;margin:14px 0}td,th{border-bottom:1px solid rgba(255,255,255,.08);padding:10px 8px;text-align:left;vertical-align:top}th{color:var(--gold);font-weight:700}
`;

function headerHtml() {
  return `<header><div class="wrap">
  <a class="brand" href="/"><img src="/icons/icon-192.png" alt="Menifest OS" width="34" height="34"><span>Menifest OS</span></a>
  <nav><a href="/learn">Guides</a><a href="/pricing">Pricing</a><a class="btn" href="/?utm_source=seo&utm_medium=guide">Open app</a></nav>
</div></header>`;
}

function footerHtml(current) {
  const guides = PAGES.filter((p) => p.type === "guide")
    .map((p) => `<a href="/${p.slug}"${p.slug === current ? ' aria-current="page"' : ""}>${esc(p.navTitle || p.h1)}</a>`)
    .join("");
  return `<footer><div class="wrap"><div class="cols">
  <div><b>Menifest OS</b><p style="margin:0;color:var(--muted)">Manifestation RPG with AI-verified daily quests. Shift your identity. Level up your real life.</p><a href="/">Home</a><a href="/learn">All guides</a><a href="/pricing">Pricing</a></div>
  <div><b>Guides</b>${guides}</div>
  <div><b>Company</b><a href="/">Open the app</a><a href="mailto:support@menifestos.com">support@menifestos.com</a><p class="small" style="margin-top:14px">© ${new Date().getFullYear()} Menifest OS. Manifestation practices support motivation and consistency; results depend on your actions. Not medical or financial advice.</p></div>
</div></div></footer>`;
}

function baseHead({ title, description, url, image, jsonld, keywords }) {
  return `<!doctype html><html lang="en-IN"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
${keywords ? `<meta name="keywords" content="${esc(keywords.join(", "))}">` : ""}
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
<link rel="canonical" href="${url}">
<link rel="alternate" hreflang="en-IN" href="${url}"><link rel="alternate" hreflang="x-default" href="${url}">
<meta name="theme-color" content="#050403">
<link rel="icon" href="/favicon.ico"><link rel="apple-touch-icon" href="/icons/apple-touch-icon.png"><link rel="manifest" href="/manifest.json">
<meta property="og:type" content="article"><meta property="og:site_name" content="Menifest OS"><meta property="og:locale" content="en_IN">
<meta property="og:url" content="${url}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="${image}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(description)}"><meta name="twitter:image" content="${image}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800&family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet" media="print" onload="this.media='all'">
<style>${CSS}</style>
<script type="application/ld+json">${JSON.stringify(jsonld)}</script>
</head><body>`;
}

function renderSection(s) {
  const id = slugify(s.h2);
  let html = `<section id="${id}"><h2>${inline(s.h2)}</h2>`;
  for (const block of s.blocks || []) {
    if (block.h3) html += `<h3>${inline(block.h3)}</h3>`;
    if (block.p) html += block.p.map((t) => `<p>${inline(t)}</p>`).join("");
    if (block.ul) html += `<ul>${block.ul.map((t) => `<li>${inline(t)}</li>`).join("")}</ul>`;
    if (block.ol) html += `<ol>${block.ol.map((t) => `<li>${inline(t)}</li>`).join("")}</ol>`;
    if (block.quote) html += `<blockquote>${inline(block.quote)}</blockquote>`;
    if (block.table) {
      const [head, ...rows] = block.table;
      html += `<table><thead><tr>${head.map((h) => `<th>${inline(h)}</th>`).join("")}</tr></thead><tbody>${rows
        .map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`)
        .join("")}</tbody></table>`;
    }
  }
  // legacy flat fields
  if (s.p) html += s.p.map((t) => `<p>${inline(t)}</p>`).join("");
  if (s.ul) html += `<ul>${s.ul.map((t) => `<li>${inline(t)}</li>`).join("")}</ul>`;
  if (s.ol) html += `<ol>${s.ol.map((t) => `<li>${inline(t)}</li>`).join("")}</ol>`;
  return html + `</section>`;
}

function ctaHtml(page) {
  const c = page.cta || {};
  return `<aside class="card"><div class="eyebrow">Put it into practice</div>
<h2>${esc(c.heading || "Do it daily inside Menifest OS")}</h2>
<p>${inline(c.text || "Menifest OS turns this practice into a daily quest: you do the work, take a photo proof, Gemini AI verifies it, and you earn XP toward your next level. 11 quests a day, 30-day seasons, a leaderboard — and no fake completions.")}</p>
<a class="btn-lg" href="/?utm_source=seo&utm_campaign=${page.slug}">Start — first month ₹99</a>
<p class="small">Then ₹415/month · Yearly ₹1,999 · Cancel anytime · Finish 70% of your 66-day plan or get your money back.</p></aside>`;
}

function relatedHtml(page) {
  const rel = (page.related || []).map((slug) => PAGES.find((p) => p.slug === slug)).filter(Boolean);
  if (!rel.length) return "";
  return `<section><h2>Keep reading</h2><div class="grid">${rel
    .map((p) => `<a class="tile" href="/${p.slug}"><b>${esc(p.navTitle || p.h1)}</b><span>${esc(p.blurb || p.description)}</span></a>`)
    .join("")}</div></section>`;
}

function faqHtml(page) {
  if (!page.faqs?.length) return "";
  return `<section id="faq"><h2>Frequently asked questions</h2>${page.faqs
    .map((f) => `<details><summary>${esc(f.q)}</summary><p>${inline(f.a)}</p></details>`)
    .join("")}</section>`;
}

function guideJsonLd(page, url, image, wc) {
  const g = [
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE.url + "/" },
        { "@type": "ListItem", position: 2, name: "Guides", item: SITE.url + "/learn" },
        { "@type": "ListItem", position: 3, name: page.h1, item: url },
      ],
    },
    {
      "@type": "Article",
      "@id": url + "#article",
      headline: page.h1,
      description: page.description,
      image: [image],
      wordCount: wc,
      datePublished: page.published || TODAY,
      dateModified: TODAY,
      inLanguage: "en-IN",
      mainEntityOfPage: url,
      author: { "@type": "Organization", name: "Menifest OS", url: SITE.url + "/" },
      publisher: { "@id": SITE.url + "/#organization" },
      about: page.keywords?.slice(0, 5).map((k) => ({ "@type": "Thing", name: k })),
    },
  ];
  if (page.faqs?.length) {
    g.push({
      "@type": "FAQPage",
      "@id": url + "#faq",
      mainEntity: page.faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a.replace(/\*\*|\[|\]\([^)]*\)/g, "") },
      })),
    });
  }
  if (page.howto?.length) {
    g.push({
      "@type": "HowTo",
      name: page.howto_name || page.h1,
      step: page.howto.map((s, i) => ({ "@type": "HowToStep", position: i + 1, name: s.name, text: s.text })),
    });
  }
  return { "@context": "https://schema.org", "@graph": [{ "@type": "Organization", "@id": SITE.url + "/#organization", name: "Menifest OS", url: SITE.url + "/", logo: SITE.url + "/icons/icon-512.png" }, ...g] };
}

function renderGuide(page) {
  const url = `${SITE.url}/${page.slug}`;
  const image = `${SITE.url}/og/${page.slug}.jpg`;
  const wc = words(page);
  const mins = Math.max(3, Math.round(wc / 220));
  const toc = page.sections.map((s) => `<li><a href="#${slugify(s.h2)}">${inline(s.h2)}</a></li>`).join("");
  return (
    baseHead({ title: page.title, description: page.description, url, image, keywords: page.keywords, jsonld: guideJsonLd(page, url, image, wc) }) +
    headerHtml() +
    `<main class="wrap"><nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> › <a href="/learn">Guides</a> › ${esc(page.navTitle || page.h1)}</nav>
<article><div class="eyebrow">${esc(page.eyebrow || "Guide")}</div><h1>${inline(page.h1)}</h1>
<div class="meta">${mins} min read · Updated ${TODAY} · By the Menifest OS team</div>
${page.intro.map((t, i) => `<p class="${i === 0 ? "lead" : ""}">${inline(t)}</p>`).join("")}
<div class="toc"><b>In this guide</b><ol>${toc}${page.faqs?.length ? '<li><a href="#faq">FAQ</a></li>' : ""}</ol></div>
${page.sections.map(renderSection).join("")}
${ctaHtml(page)}
${faqHtml(page)}
${relatedHtml(page)}
</article></main>` +
    footerHtml(page.slug) +
    `</body></html>`
  );
}

function renderHub() {
  const url = `${SITE.url}/learn`;
  const image = `${SITE.url}/og-image.png`;
  const guides = PAGES.filter((p) => p.type === "guide");
  const jsonld = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: SITE.url + "/" }, { "@type": "ListItem", position: 2, name: "Guides", item: url }] },
      { "@type": "CollectionPage", "@id": url, name: HUB.title, description: HUB.description, url, inLanguage: "en-IN", hasPart: guides.map((p) => ({ "@type": "Article", headline: p.h1, url: `${SITE.url}/${p.slug}` })) },
    ],
  };
  return (
    baseHead({ title: HUB.title, description: HUB.description, url, image, jsonld, keywords: HUB.keywords }) +
    headerHtml() +
    `<main class="wrap"><nav class="crumbs"><a href="/">Home</a> › Guides</nav>
<div class="eyebrow">Learn</div><h1>${esc(HUB.h1)}</h1>
${HUB.intro.map((t, i) => `<p class="${i === 0 ? "lead" : ""}">${inline(t)}</p>`).join("")}
<div class="grid" style="grid-template-columns:1fr">${guides
      .map((p) => `<a class="tile" href="/${p.slug}"><b>${esc(p.h1)}</b><span>${esc(p.blurb || p.description)}</span></a>`)
      .join("")}</div>
${ctaHtml({ slug: "learn", cta: { heading: "Stop reading about it. Start doing it daily.", text: "Every guide above maps to a quest inside Menifest OS. Do the work, take a photo proof, get it verified by AI, earn XP." } })}
</main>` +
    footerHtml("learn") +
    `</body></html>`
  );
}

function renderPricing(page) {
  const url = `${SITE.url}/pricing`;
  const image = `${SITE.url}/og/pricing.jpg`;
  const jsonld = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: SITE.url + "/" }, { "@type": "ListItem", position: 2, name: "Pricing", item: url }] },
      {
        "@type": "Product",
        "@id": url + "#product",
        name: "Menifest OS subscription",
        description: page.description,
        image: [image],
        brand: { "@type": "Brand", name: "Menifest OS" },
        offers: [
          { "@type": "Offer", name: "Monthly — first month intro (India)", price: "99", priceCurrency: "INR", url, availability: "https://schema.org/InStock", description: "₹99 for the first month on a first-ever purchase, then ₹415/month." },
          { "@type": "Offer", name: "Monthly (India)", price: "415", priceCurrency: "INR", url, availability: "https://schema.org/InStock" },
          { "@type": "Offer", name: "Yearly (India)", price: "1999", priceCurrency: "INR", url, availability: "https://schema.org/InStock" },
          { "@type": "Offer", name: "Monthly (International)", price: "4.99", priceCurrency: "USD", url, availability: "https://schema.org/InStock" },
          { "@type": "Offer", name: "Yearly (International)", price: "49", priceCurrency: "USD", url, availability: "https://schema.org/InStock" },
        ],
      },
      { "@type": "FAQPage", mainEntity: page.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
    ],
  };
  return (
    baseHead({ title: page.title, description: page.description, url, image, jsonld, keywords: page.keywords }) +
    headerHtml() +
    `<main class="wrap"><nav class="crumbs"><a href="/">Home</a> › Pricing</nav>
<div class="eyebrow">Pricing</div><h1>${esc(page.h1)}</h1>
${page.intro.map((t, i) => `<p class="${i === 0 ? "lead" : ""}">${inline(t)}</p>`).join("")}
<div class="price">
  <div class="plan hi"><b>Monthly</b><div class="amt">₹99 <s>₹415</s></div><div class="sub">first month · then ₹415/month</div><ul><li>All 11 daily quests + AI verification</li><li>XP, levels, ranks, 30-day seasons</li><li>AI 90-day blueprint, journal, vision board</li><li>Cancel anytime</li></ul><a class="btn-lg" href="/?utm_source=seo&utm_campaign=pricing">Start for ₹99</a></div>
  <div class="plan"><b>Yearly</b><div class="amt">₹1,999</div><div class="sub">≈ ₹167/month · billed annually · save 18%+</div><ul><li>Everything in Monthly</li><li>Best value for a full transformation year</li><li>Outside India: $49/year</li></ul><a class="btn-lg" href="/?utm_source=seo&utm_campaign=pricing" style="background:#fff">Start yearly</a></div>
</div>
${page.sections.map(renderSection).join("")}
${faqHtml(page)}
${relatedHtml(page)}
</main>` +
    footerHtml("pricing") +
    `</body></html>`
  );
}

// ---------------- write ----------------
if (!fs.existsSync(dist)) {
  console.error("[seo] dist/ not found — run `vite build` first");
  process.exit(1);
}
const write = (rel, html) => {
  const file = path.join(dist, rel, "index.html");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
};
let n = 0;
for (const page of PAGES) {
  page.h1 = page.h1 || page.navTitle || page.title;
  if (page.type === "guide") write(page.slug, renderGuide(page));
  else if (page.type === "pricing") write(page.slug, renderPricing(page));
  n++;
}
write("learn", renderHub());
n++;

// sitemap (dist + public so the repo copy stays in sync)
const urls = [
  { loc: `${SITE.url}/`, pri: "1.0", img: `${SITE.url}/og-image.png` },
  { loc: `${SITE.url}/learn`, pri: "0.8" },
  ...PAGES.map((p) => ({ loc: `${SITE.url}/${p.slug}`, pri: p.type === "pricing" ? "0.9" : "0.8", img: `${SITE.url}/og/${p.slug}.jpg` })),
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls
  .map(
    (u) => `  <url><loc>${u.loc}</loc><lastmod>${TODAY}</lastmod><changefreq>weekly</changefreq><priority>${u.pri}</priority>${
      u.img ? `<image:image><image:loc>${u.img}</image:loc></image:image>` : ""
    }</url>`
  )
  .join("\n")}
</urlset>
`;
fs.writeFileSync(path.join(dist, "sitemap.xml"), sitemap);
fs.writeFileSync(path.join(root, "public", "sitemap.xml"), sitemap);

// sanity: every slug must be routed in vercel.json (static files win over the SPA rewrite, but be explicit)
try {
  const vercel = JSON.parse(fs.readFileSync(path.join(root, "vercel.json"), "utf8"));
  const src = JSON.stringify(vercel.rewrites || []);
  const missing = ["learn", ...PAGES.map((p) => p.slug)].filter((s) => !src.includes(s));
  if (missing.length) console.warn("[seo] WARNING: vercel.json rewrites missing:", missing.join(", "));
} catch {}

console.log(`[seo] wrote ${n} static pages + sitemap (${urls.length} urls)`);

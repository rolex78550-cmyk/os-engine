// Generates static, crawlable global SEO pages into dist/<slug>/index.html after
// `vite build`. Zero React involvement: plain HTML + inline CSS + progressive
// enhancement for passive currency toggle & organic click attribution.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SITE, PAGES, HUB } from "../seo/content/index.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");
const TODAY = "2026-10-30";
const GLOBAL_REGIONS = ["US", "GB", "CA", "AU", "DE", "NL", "ZA"];
const ALL_AREA_SERVED = ["US", "IN", "GB", "CA", "AU", "DE", "NL", "ZA"];

const esc = (s = "") =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// tiny inline markup: **bold**, *italic*, [text](/href)
const inline = (s = "") =>
  esc(s)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, h) => `<a href="${h}">${t}</a>`);

const slugify = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60);

const words = (page) => {
  let n = 0;
  const count = (t) => (n += String(t || "").split(/\s+/).filter(Boolean).length);
  (page.intro || []).forEach(count);
  (page.sections || []).forEach((s) => {
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
.wrap{max-width:780px;margin:0 auto;padding:0 20px}
header{position:sticky;top:0;z-index:10;background:rgba(5,4,3,.85);backdrop-filter:blur(10px);border-bottom:1px solid rgba(255,255,255,.06)}
header .wrap{display:flex;align-items:center;justify-content:space-between;height:60px;max-width:1080px;gap:12px}
.brand{display:flex;align-items:center;gap:10px;color:#fff;font-weight:700;white-space:nowrap;text-decoration:none!important}
.brand img{width:34px;height:34px;border-radius:10px}
nav{display:flex;align-items:center;gap:14px;white-space:nowrap}
nav a{color:var(--muted);font-size:14px}nav a.btn{background:var(--orange);color:#1a0d00;padding:8px 14px;border-radius:999px;font-weight:700;text-decoration:none!important}
@media (max-width:560px){.hide-xs{display:none}}
@media (max-width:420px){.brand span{display:none}nav{gap:10px}nav a{font-size:13px}nav a.btn{padding:7px 12px}}
.crumbs{font-size:13px;color:var(--muted);margin:22px 0 10px}.crumbs a{color:var(--muted)}
.eyebrow{color:var(--orange);font-size:12px;letter-spacing:.28em;text-transform:uppercase;font-weight:800;margin-bottom:12px}
.meta{color:var(--muted);font-size:13px;margin:6px 0 24px}
.lead{font-size:18px;color:#f3ede6}
.badges{display:flex;flex-wrap:wrap;gap:8px;margin:16px 0 24px}
.badge{background:var(--surface);border:1px solid var(--line);border-radius:999px;padding:6px 12px;font-size:12px;font-weight:600;color:var(--gold)}
.hero-cta{display:flex;flex-wrap:wrap;align-items:center;gap:14px;margin:22px 0 28px}
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
.curr-toggle{display:inline-flex;gap:6px;background:var(--surface);border:1px solid rgba(255,255,255,.1);border-radius:999px;padding:4px;margin:14px 0 4px}
.curr-btn{background:transparent;border:0;color:var(--muted);font:700 12px/1 Inter,system-ui,sans-serif;padding:8px 14px;border-radius:999px;cursor:pointer;letter-spacing:.04em}
.curr-btn[aria-pressed="true"]{background:var(--orange);color:#1a0d00}
.price{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;margin:16px 0 24px}
.plan{background:var(--surface);border:1px solid rgba(255,255,255,.08);border-radius:18px;padding:20px}
.plan.hi{border-color:var(--orange);box-shadow:0 0 40px rgba(255,122,0,.15)}
.plan b{font-family:Cinzel,Georgia,serif;font-size:13px;letter-spacing:.2em;color:var(--gold);text-transform:uppercase}
.plan .amt{font-size:34px;font-weight:800;color:#fff;margin:6px 0 2px}.plan .amt s{font-size:16px;color:var(--muted);margin-left:6px}
.plan .sub{font-size:13px;color:var(--muted)}.plan ul{padding-left:1.1em;font-size:14px;margin:12px 0 0}
[data-curr-panel="inr"]{display:none}
body.is-in [data-curr-panel="usd"]{display:none}
body.is-in [data-curr-panel="inr"]{display:grid}
body.is-in [data-cta-usd]{display:none}
body:not(.is-in) [data-cta-inr]{display:none}
footer{border-top:1px solid rgba(255,255,255,.06);margin-top:60px;padding:34px 0 48px;color:var(--muted);font-size:14px}
footer .wrap{max-width:1080px}footer .cols{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:22px}
footer b{display:block;color:#fff;font-size:12px;letter-spacing:.2em;text-transform:uppercase;margin-bottom:10px}
footer a{color:var(--muted);display:block;margin:5px 0}
blockquote{margin:1.2em 0;padding:14px 18px;border-left:3px solid var(--orange);background:var(--surface);border-radius:0 12px 12px 0;color:#f3ede6}
.table-wrap{overflow-x:auto;margin:14px 0}
table{width:100%;border-collapse:collapse;font-size:14.5px;min-width:480px}td,th{border-bottom:1px solid rgba(255,255,255,.08);padding:10px 8px;text-align:left;vertical-align:top}th{color:var(--gold);font-weight:700}
`;

// Progressive enhancement:
// 1. Passively switches currency display to INR only when visitor is in India (timezone/locale or user toggle) — ZERO URL redirects.
// 2. Records first-touch organic search click + passive country to localStorage & /api/analytics/seo-event so country-wise organic clicks -> signups -> paid conversions connect seamlessly.
const INLINE_SEO_SCRIPT = `<script>
(function(){
  try {
    var OVERRIDE_KEY = 'mos_selected_country_v1';
    var ATTR_KEY = 'mos_seo_attribution_v1';
    var VISIT_KEY = 'mos_seo_visit_logged_v1';
    var tz = '';
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch(e){}
    var saved = localStorage.getItem(OVERRIDE_KEY) || '';
    var isIndia = saved ? /^(india|in|bharat)$/i.test(saved.trim()) : (tz === 'Asia/Kolkata' || tz === 'Asia/Calcutta');
    function applyCurr(ind){
      document.body.classList.toggle('is-in', !!ind);
      var btns = document.querySelectorAll('[data-set-curr]');
      for (var i = 0; i < btns.length; i++) {
        var b = btns[i];
        b.setAttribute('aria-pressed', (b.getAttribute('data-set-curr') === (ind ? 'inr' : 'usd')) ? 'true' : 'false');
      }
    }
    applyCurr(isIndia);
    document.addEventListener('click', function(ev){
      var t = ev.target && ev.target.closest ? ev.target.closest('[data-set-curr]') : null;
      if (!t) return;
      var ind = t.getAttribute('data-set-curr') === 'inr';
      try { localStorage.setItem(OVERRIDE_KEY, ind ? 'India' : 'United States'); } catch(e){}
      applyCurr(ind);
    });

    function inferGeo(){
      if (tz === 'Asia/Kolkata' || tz === 'Asia/Calcutta') return ['IN','India'];
      if (tz === 'Europe/London' || tz === 'Europe/Belfast') return ['GB','United Kingdom'];
      if (/^America\\/(Toronto|Vancouver|Edmonton|Winnipeg|Halifax|Montreal|St_Johns)$/.test(tz)) return ['CA','Canada'];
      if (tz.indexOf('Australia/') === 0) return ['AU','Australia'];
      if (tz === 'Europe/Berlin' || tz === 'Europe/Busingen') return ['DE','Germany'];
      if (tz === 'Europe/Amsterdam') return ['NL','Netherlands'];
      if (tz === 'Africa/Johannesburg') return ['ZA','South Africa'];
      if (tz === 'Asia/Manila') return ['PH','Philippines'];
      if (tz === 'Asia/Dhaka') return ['BD','Bangladesh'];
      if (tz === 'Asia/Ho_Chi_Minh' || tz === 'Asia/Saigon') return ['VN','Vietnam'];
      if (tz.indexOf('America/Sao_Paulo') === 0) return ['BR','Brazil'];
      if (tz.indexOf('America/') === 0) return ['US','United States'];
      return ['US','United States'];
    }
    var g = inferGeo();
    var ref = document.referrer || '';
    var engine = null;
    if (/google\\./i.test(ref)) engine = 'google';
    else if (/bing\\.com/i.test(ref)) engine = 'bing';
    else if (/duckduckgo\\.com/i.test(ref)) engine = 'duckduckgo';
    else if (/yahoo\\./i.test(ref)) engine = 'yahoo';
    else if (/ecosia\\.org/i.test(ref)) engine = 'ecosia';
    else if (/search\\.brave\\.com/i.test(ref)) engine = 'brave';

    var q = new URLSearchParams(location.search);
    var paid = !!(q.get('gclid') || q.get('fbclid') || q.get('msclkid'));
    var channel = paid ? 'paid' : (engine ? 'organic_search' : (ref && ref.indexOf(location.hostname) === -1 ? 'referral' : 'direct'));
    var attrRaw = localStorage.getItem(ATTR_KEY);
    var attr = attrRaw ? JSON.parse(attrRaw) : null;
    if (!attr || !attr.sessionId) {
      attr = {
        sessionId: 'seo_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9),
        channel: channel,
        isOrganic: channel === 'organic_search',
        landingPage: location.pathname || '/',
        referrer: ref.slice(0, 300),
        searchEngine: engine,
        utmSource: q.get('utm_source'),
        utmMedium: q.get('utm_medium'),
        utmCampaign: q.get('utm_campaign'),
        utmTerm: q.get('utm_term'),
        countryCode: g[0],
        countryName: g[1],
        firstSeenAt: new Date().toISOString()
      };
      localStorage.setItem(ATTR_KEY, JSON.stringify(attr));
    }
    if (!sessionStorage.getItem(VISIT_KEY)) {
      sessionStorage.setItem(VISIT_KEY, '1');
      fetch('/api/analytics/seo-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: attr.isOrganic ? 'organic_click' : 'page_visit',
          sessionId: attr.sessionId,
          countryCode: attr.countryCode,
          countryName: attr.countryName,
          channel: attr.channel,
          isOrganic: attr.isOrganic,
          landingPage: attr.landingPage,
          referrer: attr.referrer,
          searchEngine: attr.searchEngine
        }),
        keepalive: true
      }).catch(function(){});
    }
  } catch(e){}
})();
</script>`;

function orgJsonLd() {
  return {
    "@type": "Organization",
    "@id": SITE.url + "/#organization",
    name: "Menifest OS",
    url: SITE.url + "/",
    logo: SITE.url + "/icons/icon-512.png",
    areaServed: ALL_AREA_SERVED,
  };
}

function multiCurrencyOffers(url) {
  return [
    {
      "@type": "Offer",
      name: "Monthly (Global)",
      price: "4.99",
      priceCurrency: "USD",
      eligibleRegion: GLOBAL_REGIONS,
      url,
      availability: "https://schema.org/InStock",
      description: "$4.99 per month worldwide with 66-day money-back completion challenge.",
    },
    {
      "@type": "Offer",
      name: "Yearly (Global)",
      price: "49.00",
      priceCurrency: "USD",
      eligibleRegion: GLOBAL_REGIONS,
      url,
      availability: "https://schema.org/InStock",
      description: "$49 per year ($4.08/month) worldwide — save 18%.",
    },
    {
      "@type": "Offer",
      name: "Monthly — first month intro (India)",
      price: "99",
      priceCurrency: "INR",
      eligibleRegion: "IN",
      url,
      availability: "https://schema.org/InStock",
      description: "₹99 for the first month on a first-ever purchase in India, then ₹415/month.",
    },
    {
      "@type": "Offer",
      name: "Monthly (India)",
      price: "415",
      priceCurrency: "INR",
      eligibleRegion: "IN",
      url,
      availability: "https://schema.org/InStock",
    },
    {
      "@type": "Offer",
      name: "Yearly (India)",
      price: "1999",
      priceCurrency: "INR",
      eligibleRegion: "IN",
      url,
      availability: "https://schema.org/InStock",
    },
  ];
}

function headerHtml() {
  return `<header><div class="wrap">
  <a class="brand" href="/"><img src="/icons/icon-192.png" alt="Menifest OS" width="34" height="34"><span>Menifest OS</span></a>
  <nav><a class="hide-xs" href="/manifestation-app">App</a><a href="/learn">Guides</a><a href="/pricing">Pricing</a><a class="btn" href="/?utm_source=seo&utm_medium=nav">Open app</a></nav>
</div></header>`;
}

function footerHtml(current) {
  const commercials = PAGES.filter((p) => p.type === "commercial")
    .map((p) => `<a href="/${p.slug}"${p.slug === current ? ' aria-current="page"' : ""}>${esc(p.navTitle || p.h1)}</a>`)
    .join("");
  const guides = PAGES.filter((p) => p.type === "guide")
    .map((p) => `<a href="/${p.slug}"${p.slug === current ? ' aria-current="page"' : ""}>${esc(p.navTitle || p.h1)}</a>`)
    .join("");
  return `<footer><div class="wrap"><div class="cols">
  <div><b>Menifest OS</b><p style="margin:0 0 10px;color:var(--muted)">AI Manifestation App &amp; Gamified Habit Tracker RPG. Shift your identity. Level up your real life.</p><a href="/">Home</a><a href="/pricing">Global &amp; India Pricing</a><a href="/learn">All Guides</a></div>
  <div><b>Platform</b>${commercials}<a href="/pricing">Pricing ($4.99 / ₹99)</a></div>
  <div><b>Free Guides</b>${guides}</div>
  <div><b>Company</b><a href="/">Open Web App</a><a href="mailto:support@menifestos.com">support@menifestos.com</a><p class="small" style="margin-top:14px">© ${new Date().getFullYear()} Menifest OS. Available worldwide. Manifestation practices support focus, habit consistency, and goal execution; results depend on your daily actions.</p></div>
</div></div></footer>${INLINE_SEO_SCRIPT}`;
}

function baseHead({ title, description, url, image, jsonld, keywords, ogType = "article" }) {
  return `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
${keywords ? `<meta name="keywords" content="${esc(keywords.join(", "))}">` : ""}
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
<link rel="canonical" href="${url}">
<link rel="alternate" hreflang="en" href="${url}"><link rel="alternate" hreflang="x-default" href="${url}">
<meta name="theme-color" content="#050403">
<link rel="icon" href="/favicon.ico"><link rel="apple-touch-icon" href="/icons/apple-touch-icon.png"><link rel="manifest" href="/manifest.json">
<meta property="og:type" content="${ogType}"><meta property="og:site_name" content="Menifest OS">
<meta property="og:locale" content="en_US"><meta property="og:locale:alternate" content="en_GB"><meta property="og:locale:alternate" content="en_IN"><meta property="og:locale:alternate" content="en_CA"><meta property="og:locale:alternate" content="en_AU">
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
      html += `<div class="table-wrap"><table><thead><tr>${head.map((h) => `<th>${inline(h)}</th>`).join("")}</tr></thead><tbody>${rows
        .map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`)
        .join("")}</tbody></table></div>`;
    }
  }
  if (s.p) html += s.p.map((t) => `<p>${inline(t)}</p>`).join("");
  if (s.ul) html += `<ul>${s.ul.map((t) => `<li>${inline(t)}</li>`).join("")}</ul>`;
  if (s.ol) html += `<ol>${s.ol.map((t) => `<li>${inline(t)}</li>`).join("")}</ol>`;
  return html + `</section>`;
}

function pricingCardsHtml(campaignSlug) {
  const href = `/?utm_source=seo&utm_medium=${campaignSlug === "pricing" ? "pricing" : "commercial"}&utm_campaign=${campaignSlug}`;
  return `<div>
  <div class="curr-toggle" role="group" aria-label="Select pricing currency">
    <button type="button" class="curr-btn" data-set-curr="usd" aria-pressed="true">🌐 Global (USD $)</button>
    <button type="button" class="curr-btn" data-set-curr="inr" aria-pressed="false">🇮🇳 India (INR ₹)</button>
  </div>
  <div class="price" data-curr-panel="usd">
    <div class="plan hi"><b>Monthly (Global)</b><div class="amt">$4.99</div><div class="sub">per month · billed monthly · cancel anytime</div><ul><li>All 11 daily quests + Gemini AI photo proof</li><li>AI 90-day goal blueprint &amp; journal analysis</li><li>XP, permanent levels &amp; 30-day leaderboard seasons</li><li>66-day win-your-money-back guarantee</li></ul><a class="btn-lg" href="${href}">Start Monthly — $4.99</a></div>
    <div class="plan"><b>Yearly (Save 18%)</b><div class="amt">$49 <s>$59.88</s></div><div class="sub">$4.08/month · billed annually · best value</div><ul><li>Everything in Monthly included</li><li>Full 4-season transformation year</li><li>Permanent character level &amp; Sovereign rank path</li><li>66-day win-your-money-back guarantee</li></ul><a class="btn-lg" href="${href}" style="background:#fff">Start Yearly — $49/yr</a></div>
  </div>
  <div class="price" data-curr-panel="inr">
    <div class="plan hi"><b>Monthly (India)</b><div class="amt">₹99 <s>₹415</s></div><div class="sub">first month · then ₹415/month via UPI or card</div><ul><li>All 11 daily quests + Gemini AI photo proof</li><li>AI 90-day goal blueprint &amp; journal analysis</li><li>XP, permanent levels &amp; 30-day seasons</li><li>Cancel anytime · 66-day money-back challenge</li></ul><a class="btn-lg" href="${href}">Start for ₹99</a></div>
    <div class="plan"><b>Yearly (India)</b><div class="amt">₹1,999</div><div class="sub">≈ ₹167/month · billed annually · best value</div><ul><li>Everything in Monthly included</li><li>UPI, debit/credit cards &amp; net banking</li><li>66-day win-your-money-back guarantee</li></ul><a class="btn-lg" href="${href}" style="background:#fff">Start Yearly — ₹1,999</a></div>
  </div>
</div>`;
}

function ctaHtml(page) {
  const c = page.cta || {};
  const medium = page.type === "commercial" ? "commercial" : "guide";
  const href = `/?utm_source=seo&utm_medium=${medium}&utm_campaign=${page.slug}`;
  return `<aside class="card"><div class="eyebrow">Put it into practice</div>
<h2>${esc(c.heading || "Do it daily inside Menifest OS")}</h2>
<p>${inline(c.text || "Menifest OS turns this practice into a daily quest: you do the work, capture photo proof, Gemini AI verifies it, and you earn XP toward your next level. 11 quests a day, 30-day seasons, a global leaderboard — and zero fake completions.")}</p>
<div data-cta-usd><a class="btn-lg" href="${href}">Start Menifest OS — $4.99/mo</a>
<p class="small">$4.99/month or $49/year worldwide (India: ₹99 first month) · Cancel anytime ${c.transparent ? " · Review plan and payment terms before subscribing. Results depend on your actions." : " · Finish 70% of your 66-day plan or get 100% of your money back."}</p></div>
<div data-cta-inr><a class="btn-lg" href="${href}">Start — first month ₹99</a>
<p class="small">Then ₹415/month · Yearly ₹1,999 (Outside India: $4.99/mo) · Cancel anytime ${c.transparent ? " · Review plan and payment terms before subscribing. Results depend on your actions." : " · Finish 70% of your 66-day plan or get 100% of your money back."}</p></div>
</aside>`;
}

function relatedHtml(page) {
  const rel = (page.related || []).map((slug) => PAGES.find((p) => p.slug === slug)).filter(Boolean);
  if (!rel.length) return "";
  return `<section><h2>Explore next</h2><div class="grid">${rel
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
        { "@type": "ListItem", position: 3, name: page.navTitle || page.h1, item: url },
      ],
    },
    {
      "@type": "Article",
      "@id": url + "#article",
      headline: page.h1,
      description: page.description,
      image: [image],
      wordCount: wc,
      datePublished: page.published || "2026-09-15",
      dateModified: TODAY,
      inLanguage: "en",
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
  return { "@context": "https://schema.org", "@graph": [orgJsonLd(), ...g] };
}

function commercialJsonLd(page, url, image) {
  const g = [
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE.url + "/" },
        { "@type": "ListItem", position: 2, name: page.navTitle || page.h1, item: url },
      ],
    },
    {
      "@type": ["SoftwareApplication", "WebApplication"],
      "@id": url + "#software",
      name: `Menifest OS — ${page.navTitle || page.h1}`,
      url,
      image,
      description: page.description,
      applicationCategory: "LifestyleApplication",
      applicationSubCategory: page.navTitle || "Gamified Habit Tracker & Manifestation App",
      operatingSystem: "Web, Android, iOS (PWA)",
      inLanguage: "en",
      author: { "@id": SITE.url + "/#organization" },
      offers: multiCurrencyOffers(SITE.url + "/pricing"),
      featureList: page.heroBadges || [
        "369 manifestation method tracker",
        "AI 90-day goal blueprint",
        "Gemini AI photo proof verification",
        "XP, permanent levels & 30-day leaderboard seasons",
      ],
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
  return { "@context": "https://schema.org", "@graph": [orgJsonLd(), ...g] };
}

function reelHtml(page) {
  const id = page.instagramReel;
  if (!id || !/^[A-Za-z0-9_-]+$/.test(id)) return "";
  const url = `https://www.instagram.com/reel/${id}/`;
  return `<section class="card" aria-labelledby="reel-heading">
<h2 id="reel-heading">Watch the Menifest OS promotional video</h2>
<p>A short promotional Reel shared by the Menifest OS team. Explore the app, then review the features and plan details before subscribing.</p>
<div data-reel-container style="max-width:420px;margin:20px auto;border:1px solid #333;border-radius:16px;overflow:hidden;background:#111">
<div data-reel-placeholder style="padding:36px 24px;text-align:center">
<p style="font-size:36px;margin:0" aria-hidden="true">▶</p>
<button type="button" class="btn-lg" data-load-reel>Load Instagram video</button>
<p class="small">Loads content from Instagram only after you click. Instagram may receive your IP address and use cookies. Playback may require login or may be unavailable in your region.</p>
</div></div>
<p class="small"><a href="${url}" target="_blank" rel="noopener noreferrer">Watch directly on Instagram ↗</a> · <a href="/pricing">Compare subscription plans</a></p>
<script>
(function(){
 var script=document.currentScript,section=script.closest('section');
 var button=section.querySelector('[data-load-reel]');
 button.addEventListener('click',function(){
  var frame=document.createElement('iframe');
  frame.title='Menifest OS promotional Reel on Instagram';
  frame.src='${url}embed/';
  frame.width='420';frame.height='720';
  frame.style.cssText='display:block;width:100%;height:720px;border:0;background:#fff';
  frame.allow='encrypted-media; picture-in-picture; fullscreen';
  frame.setAttribute('allowfullscreen','');
  frame.referrerPolicy='strict-origin-when-cross-origin';
  section.querySelector('[data-reel-container]').replaceChildren(frame);
 });
})();
</script>
</section>`;
}

function renderGuide(page) {
  const url = `${SITE.url}/${page.slug}`;
  const image = `${SITE.url}/og/${page.slug}.jpg`;
  const wc = words(page);
  const mins = Math.max(3, Math.round(wc / 220));
  const toc = page.sections.map((s) => `<li><a href="#${slugify(s.h2)}">${inline(s.h2)}</a></li>`).join("");
  return (
    baseHead({ title: page.title, description: page.description, url, image, keywords: page.keywords, jsonld: guideJsonLd(page, url, image, wc), ogType: "article" }) +
    headerHtml() +
    `<main class="wrap"><nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> › <a href="/learn">Guides</a> › ${esc(page.navTitle || page.h1)}</nav>
<article><div class="eyebrow">${esc(page.eyebrow || "Guide")}</div><h1>${inline(page.h1)}</h1>
<div class="meta">${mins} min read · Updated ${page.updated || TODAY} · By the Menifest OS team</div>
${page.intro.map((t, i) => `<p class="${i === 0 ? "lead" : ""}">${inline(t)}</p>`).join("")}
<div class="toc"><b>In this guide</b><ol>${toc}${page.faqs?.length ? '<li><a href="#faq">FAQ</a></li>' : ""}</ol></div>
${page.sections.map((section, index) => renderSection(section) + (page.slug === "identity-shifting" && index === 3 ? reelHtml(page) + ctaHtml(page) : "")).join("")}
${ctaHtml(page)}
${faqHtml(page)}
${relatedHtml(page)}
</article></main>` +
    footerHtml(page.slug) +
    `</body></html>`
  );
}

function renderCommercial(page) {
  const url = `${SITE.url}/${page.slug}`;
  const image = `${SITE.url}/og/${page.slug}.jpg`;
  const href = `/?utm_source=seo&utm_medium=commercial&utm_campaign=${page.slug}`;
  const badges = (page.heroBadges || []).map((b) => `<span class="badge">✦ ${esc(b)}</span>`).join("");
  return (
    baseHead({ title: page.title, description: page.description, url, image, keywords: page.keywords, jsonld: commercialJsonLd(page, url, image), ogType: "website" }) +
    headerHtml() +
    `<main class="wrap"><nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> › ${esc(page.navTitle || page.h1)}</nav>
<article><div class="eyebrow">${esc(page.eyebrow || "Menifest OS")}</div><h1>${inline(page.h1)}</h1>
${badges ? `<div class="badges">${badges}</div>` : ""}
${page.intro.map((t, i) => `<p class="${i === 0 ? "lead" : ""}">${inline(t)}</p>`).join("")}
<div class="hero-cta">
  <span data-cta-usd><a class="btn-lg" href="${href}" style="margin-top:0">Start Now — $4.99/mo</a></span>
  <span data-cta-inr><a class="btn-lg" href="${href}" style="margin-top:0">Start Now — ₹99 First Month</a></span>
  <span class="small">Web, iOS &amp; Android (PWA) · 66-day money-back guarantee</span>
</div>
${reelHtml(page)}
${page.sections.map(renderSection).join("")}
<section id="plans"><h2>Simple global &amp; regional plans</h2>
<p>One membership unlocks all 11 AI-verified daily quests, the 90-day AI blueprint, vision board, alignment journal, and 30-day leaderboard seasons.</p>
${pricingCardsHtml(page.slug)}
</section>
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
  const commercials = PAGES.filter((p) => p.type === "commercial");
  const guides = PAGES.filter((p) => p.type === "guide");
  const jsonld = {
    "@context": "https://schema.org",
    "@graph": [
      orgJsonLd(),
      { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: SITE.url + "/" }, { "@type": "ListItem", position: 2, name: "Guides", item: url }] },
      { "@type": "CollectionPage", "@id": url, name: HUB.title, description: HUB.description, url, inLanguage: "en", hasPart: guides.map((p) => ({ "@type": "Article", headline: p.h1, url: `${SITE.url}/${p.slug}` })) },
    ],
  };
  return (
    baseHead({ title: HUB.title, description: HUB.description, url, image, jsonld, keywords: HUB.keywords, ogType: "website" }) +
    headerHtml() +
    `<main class="wrap"><nav class="crumbs"><a href="/">Home</a> › Guides</nav>
<div class="eyebrow">Learn &amp; Apply</div><h1>${esc(HUB.h1)}</h1>
${HUB.intro.map((t, i) => `<p class="${i === 0 ? "lead" : ""}">${inline(t)}</p>`).join("")}
<h2>Free science-backed guides</h2>
<div class="grid" style="grid-template-columns:1fr">${guides
      .map((p) => `<a class="tile" href="/${p.slug}"><b>${esc(p.h1)}</b><span>${esc(p.blurb || p.description)}</span></a>`)
      .join("")}</div>
<h2>Explore the Menifest OS platform</h2>
<div class="grid">${commercials
      .map((p) => `<a class="tile" href="/${p.slug}"><b>${esc(p.navTitle || p.h1)}</b><span>${esc(p.blurb || p.description)}</span></a>`)
      .join("")}</div>
${ctaHtml({ slug: "learn", type: "guide", cta: { heading: "Stop reading about it. Start doing it daily.", text: "Every guide above maps directly to a daily quest inside Menifest OS. Do the work, capture photo proof, get verified by Gemini AI, and earn real XP." } })}
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
      orgJsonLd(),
      { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: SITE.url + "/" }, { "@type": "ListItem", position: 2, name: "Pricing", item: url }] },
      {
        "@type": "Product",
        "@id": url + "#product",
        name: "Menifest OS Membership",
        description: page.description,
        image: [image],
        brand: { "@type": "Brand", name: "Menifest OS" },
        offers: multiCurrencyOffers(url),
      },
      { "@type": "FAQPage", mainEntity: page.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
    ],
  };
  return (
    baseHead({ title: page.title, description: page.description, url, image, jsonld, keywords: page.keywords, ogType: "website" }) +
    headerHtml() +
    `<main class="wrap"><nav class="crumbs"><a href="/">Home</a> › Pricing</nav>
<div class="eyebrow">Global &amp; India Pricing</div><h1>${esc(page.h1)}</h1>
${page.intro.map((t, i) => `<p class="${i === 0 ? "lead" : ""}">${inline(t)}</p>`).join("")}
${pricingCardsHtml("pricing")}
${page.sections.map((section, index) => renderSection(section) + (page.slug === "identity-shifting" && index === 3 ? ctaHtml(page) : "")).join("")}
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
  else if (page.type === "commercial") write(page.slug, renderCommercial(page));
  else if (page.type === "pricing") write(page.slug, renderPricing(page));
  n++;
}
write("learn", renderHub());
n++;

// sitemap (dist + public so the repo copy stays in sync)
const urls = [
  { loc: `${SITE.url}/`, pri: "1.0", img: `${SITE.url}/og-image.png` },
  ...PAGES.filter((p) => p.type === "commercial").map((p) => ({
    loc: `${SITE.url}/${p.slug}`,
    pri: "0.95",
    img: `${SITE.url}/og/${p.slug}.jpg`,
  })),
  { loc: `${SITE.url}/pricing`, pri: "0.9", img: `${SITE.url}/og/pricing.jpg` },
  { loc: `${SITE.url}/learn`, pri: "0.85" },
  ...PAGES.filter((p) => p.type === "guide").map((p) => ({
    loc: `${SITE.url}/${p.slug}`,
    pri: "0.8",
    img: `${SITE.url}/og/${p.slug}.jpg`,
  })),
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

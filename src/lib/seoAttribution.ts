/**
 * International SEO Attribution & Passive Country Detection (Zero Redirects).
 *
 * Responsibilities:
 * 1. Passively detect visitor country/currency (India INR vs Global USD) using
 *    saved preference -> server edge header (/api/geo) -> browser timezone & locale.
 *    NEVER redirects URLs or changes routing.
 * 2. Capture first-touch organic search / SEO landing page attribution across
 *    static guides (/how-to-manifest, /manifestation-app, etc.) -> SPA (/) ->
 *    Google Sign-In -> Paid Checkout (Razorpay INR / Dodo USD).
 * 3. Emit country-wise funnel events (organic_click, signup, purchase) to
 *    /api/analytics/seo-event and optional GA4 (VITE_GA_MEASUREMENT_ID).
 */

export interface GeoInfo {
  countryCode: string;
  countryName: string;
  source: 'user_override' | 'profile' | 'edge_header' | 'referrer_cctld' | 'timezone' | 'locale' | 'default';
}

export interface SeoAttribution {
  sessionId: string;
  channel: 'organic_search' | 'paid' | 'social' | 'referral' | 'direct';
  isOrganic: boolean;
  landingPage: string;
  referrer: string;
  searchEngine: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmTerm: string | null;
  countryCode: string;
  countryName: string;
  firstSeenAt: string;
}

const ATTR_STORAGE_KEY = 'mos_seo_attribution_v1';
const VISIT_SENT_SESSION_KEY = 'mos_seo_visit_logged_v1';
const SIGNUP_SENT_PREFIX = 'mos_seo_signup_logged_';
const COUNTRY_OVERRIDE_KEY = 'mos_selected_country_v1';
const GEO_CACHE_KEY = 'mos_detected_geo_v1';

export const COUNTRY_CODE_TO_NAME: Record<string, string> = {
  US: 'United States',
  IN: 'India',
  GB: 'United Kingdom',
  UK: 'United Kingdom',
  CA: 'Canada',
  AU: 'Australia',
  DE: 'Germany',
  NL: 'Netherlands',
  ZA: 'South Africa',
  PH: 'Philippines',
  BR: 'Brazil',
  BD: 'Bangladesh',
  VN: 'Vietnam',
  AE: 'United Arab Emirates',
  SG: 'Singapore',
  NZ: 'New Zealand',
  IE: 'Ireland',
  FR: 'France',
  ES: 'Spain',
  IT: 'Italy',
  SE: 'Sweden',
  NO: 'Norway',
  DK: 'Denmark',
  CH: 'Switzerland',
  AT: 'Austria',
  BE: 'Belgium',
  PL: 'Poland',
  JP: 'Japan',
  MX: 'Mexico',
  ID: 'Indonesia',
  SA: 'Saudi Arabia',
  NG: 'Nigeria',
  NP: 'Nepal',
  PK: 'Pakistan',
};

const NAME_TO_CODE: Record<string, string> = Object.entries(COUNTRY_CODE_TO_NAME).reduce(
  (acc, [code, name]) => {
    if (code !== 'UK') acc[name.toLowerCase()] = code;
    return acc;
  },
  { bharat: 'IN', 'global / other': 'US', global: 'US' } as Record<string, string>
);

export function countryNameToCode(nameOrCode?: string | null): string {
  if (!nameOrCode) return 'US';
  const raw = nameOrCode.trim();
  const upper = raw.toUpperCase();
  if (COUNTRY_CODE_TO_NAME[upper]) return upper === 'UK' ? 'GB' : upper;
  return NAME_TO_CODE[raw.toLowerCase()] || 'US';
}

export function countryCodeToName(code?: string | null): string {
  if (!code) return 'United States';
  const upper = code.trim().toUpperCase();
  return COUNTRY_CODE_TO_NAME[upper] || 'Global / Other';
}

/** Infer country from browser timezone + navigator.language (instant, client-only, zero redirect). */
export function inferBrowserGeo(): GeoInfo {
  if (typeof window === 'undefined') {
    return { countryCode: 'US', countryName: 'United States', source: 'default' };
  }

  // 1. Explicit user selection persisted in localStorage
  try {
    const saved = window.localStorage.getItem(COUNTRY_OVERRIDE_KEY);
    if (saved) {
      const code = countryNameToCode(saved);
      return {
        countryCode: code,
        countryName: COUNTRY_CODE_TO_NAME[code] || saved,
        source: 'user_override',
      };
    }
    const cachedGeo = window.localStorage.getItem(GEO_CACHE_KEY);
    if (cachedGeo) {
      const parsed = JSON.parse(cachedGeo);
      if (parsed?.countryCode && parsed?.countryName) {
        return {
          countryCode: parsed.countryCode,
          countryName: parsed.countryName,
          source: parsed.source || 'edge_header',
        };
      }
    }
  } catch {}

  // 2. Timezone mapping (highly reliable for India vs US/CA/UK/AU/EU)
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (tz === 'Asia/Kolkata' || tz === 'Asia/Calcutta') {
      return { countryCode: 'IN', countryName: 'India', source: 'timezone' };
    }
    if (tz === 'Europe/London' || tz === 'Europe/Belfast') {
      return { countryCode: 'GB', countryName: 'United Kingdom', source: 'timezone' };
    }
    if (
      tz === 'America/Toronto' || tz === 'America/Vancouver' || tz === 'America/Edmonton' ||
      tz === 'America/Winnipeg' || tz === 'America/Halifax' || tz === 'America/Montreal' ||
      tz === 'America/St_Johns'
    ) {
      return { countryCode: 'CA', countryName: 'Canada', source: 'timezone' };
    }
    if (tz.startsWith('Australia/')) {
      return { countryCode: 'AU', countryName: 'Australia', source: 'timezone' };
    }
    if (tz === 'Europe/Berlin' || tz === 'Europe/Busingen') {
      return { countryCode: 'DE', countryName: 'Germany', source: 'timezone' };
    }
    if (tz === 'Europe/Amsterdam') {
      return { countryCode: 'NL', countryName: 'Netherlands', source: 'timezone' };
    }
    if (tz === 'Africa/Johannesburg') {
      return { countryCode: 'ZA', countryName: 'South Africa', source: 'timezone' };
    }
    if (tz === 'Asia/Manila') {
      return { countryCode: 'PH', countryName: 'Philippines', source: 'timezone' };
    }
    if (tz === 'Asia/Dhaka') {
      return { countryCode: 'BD', countryName: 'Bangladesh', source: 'timezone' };
    }
    if (tz === 'Asia/Ho_Chi_Minh' || tz === 'Asia/Saigon') {
      return { countryCode: 'VN', countryName: 'Vietnam', source: 'timezone' };
    }
    if (tz === 'America/Sao_Paulo' || tz === 'America/Fortaleza' || tz === 'America/Manaus') {
      return { countryCode: 'BR', countryName: 'Brazil', source: 'timezone' };
    }
    if (tz === 'Asia/Dubai') {
      return { countryCode: 'AE', countryName: 'United Arab Emirates', source: 'timezone' };
    }
    if (tz === 'Asia/Singapore') {
      return { countryCode: 'SG', countryName: 'Singapore', source: 'timezone' };
    }
    if (tz.startsWith('America/')) {
      return { countryCode: 'US', countryName: 'United States', source: 'timezone' };
    }
  } catch {}

  // 3. Browser locale subtag fallback (e.g. en-IN, en-GB, en-CA, en-AU, de-DE, nl-NL)
  try {
    const langs = navigator.languages?.length ? navigator.languages : [navigator.language || ''];
    for (const lang of langs) {
      const parts = lang.split(/[-_]/);
      if (parts.length >= 2) {
        const region = parts[1].toUpperCase();
        if (COUNTRY_CODE_TO_NAME[region]) {
          const norm = region === 'UK' ? 'GB' : region;
          return { countryCode: norm, countryName: COUNTRY_CODE_TO_NAME[norm], source: 'locale' };
        }
      }
    }
  } catch {}

  return { countryCode: 'US', countryName: 'United States', source: 'default' };
}

/** Get best initial country name for Pricing / Onboarding forms (profile wins, then passive detection). */
export function getInitialCountryName(profileCountry?: string | null): string {
  if (profileCountry && profileCountry.trim()) return profileCountry.trim();
  return inferBrowserGeo().countryName;
}

/** Save explicit country choice when user toggles India vs Global currency selector. */
export function saveCountryPreference(countryName: string) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(COUNTRY_OVERRIDE_KEY, countryName);
  } catch {}
}

/** Passively refine geo via /api/geo (reads Vercel/Cloudflare country header, never redirects). */
export async function resolvePassiveGeo(): Promise<GeoInfo> {
  const local = inferBrowserGeo();
  if (local.source === 'user_override') return local;
  if (typeof window === 'undefined') return local;

  try {
    const res = await fetch('/api/geo', { method: 'GET', credentials: 'same-origin' });
    if (res.ok) {
      const data = await res.json();
      if (data?.countryCode && data.countryCode !== 'UNKNOWN') {
        const code = String(data.countryCode).toUpperCase();
        const name = COUNTRY_CODE_TO_NAME[code] || data.countryName || local.countryName;
        const resolved: GeoInfo = { countryCode: code, countryName: name, source: 'edge_header' };
        try {
          window.localStorage.setItem(GEO_CACHE_KEY, JSON.stringify(resolved));
        } catch {}
        return resolved;
      }
    }
  } catch {
    // Non-critical — fall back to timezone/locale inference
  }
  return local;
}

function detectSearchEngine(referrer: string): { engine: string | null; cctldCountry: string | null } {
  if (!referrer) return { engine: null, cctldCountry: null };
  try {
    const host = new URL(referrer).hostname.toLowerCase();
    if (host.includes('google.')) {
      let cctld: string | null = null;
      if (host.endsWith('.co.in') || host.endsWith('.in')) cctld = 'IN';
      else if (host.endsWith('.co.uk')) cctld = 'GB';
      else if (host.endsWith('.ca')) cctld = 'CA';
      else if (host.endsWith('.com.au')) cctld = 'AU';
      else if (host.endsWith('.de')) cctld = 'DE';
      else if (host.endsWith('.nl')) cctld = 'NL';
      else if (host.endsWith('.co.za')) cctld = 'ZA';
      else if (host.endsWith('.com.ph')) cctld = 'PH';
      else if (host.endsWith('.com.br')) cctld = 'BR';
      else if (host.endsWith('.com.bd')) cctld = 'BD';
      else if (host.endsWith('.com.vn')) cctld = 'VN';
      return { engine: 'google', cctldCountry: cctld };
    }
    if (host.includes('bing.com')) return { engine: 'bing', cctldCountry: null };
    if (host.includes('duckduckgo.com')) return { engine: 'duckduckgo', cctldCountry: null };
    if (host.includes('yahoo.')) return { engine: 'yahoo', cctldCountry: null };
    if (host.includes('ecosia.org')) return { engine: 'ecosia', cctldCountry: null };
    if (host.includes('search.brave.com')) return { engine: 'brave', cctldCountry: null };
    if (host.includes('yandex.')) return { engine: 'yandex', cctldCountry: null };
  } catch {}
  return { engine: null, cctldCountry: null };
}

/** Read or initialize first-touch SEO attribution in localStorage. */
export function getOrCreateAttribution(geoOverride?: GeoInfo): SeoAttribution {
  const geo = geoOverride || inferBrowserGeo();
  if (typeof window === 'undefined') {
    return {
      sessionId: 'ssr',
      channel: 'direct',
      isOrganic: false,
      landingPage: '/',
      referrer: '',
      searchEngine: null,
      utmSource: null,
      utmMedium: null,
      utmCampaign: null,
      utmTerm: null,
      countryCode: geo.countryCode,
      countryName: geo.countryName,
      firstSeenAt: new Date().toISOString(),
    };
  }

  try {
    const existingRaw = window.localStorage.getItem(ATTR_STORAGE_KEY);
    if (existingRaw) {
      const existing = JSON.parse(existingRaw) as SeoAttribution;
      if (existing && existing.sessionId) {
        // Keep country updated if edge header resolved more accurately
        if (geoOverride?.source === 'edge_header' && existing.countryCode !== geoOverride.countryCode) {
          existing.countryCode = geoOverride.countryCode;
          existing.countryName = geoOverride.countryName;
          window.localStorage.setItem(ATTR_STORAGE_KEY, JSON.stringify(existing));
        }
        return existing;
      }
    }
  } catch {}

  const params = new URLSearchParams(window.location.search);
  const utmSource = params.get('utm_source');
  const utmMedium = params.get('utm_medium');
  const utmCampaign = params.get('utm_campaign');
  const utmTerm = params.get('utm_term');
  const hasPaidClickId = Boolean(params.get('gclid') || params.get('fbclid') || params.get('msclkid'));
  const referrer = document.referrer || '';
  const { engine, cctldCountry } = detectSearchEngine(referrer);

  let isSameHostRef = false;
  try {
    if (referrer) {
      isSameHostRef = new URL(referrer).hostname === window.location.hostname;
    }
  } catch {}

  let channel: SeoAttribution['channel'] = 'direct';
  if (hasPaidClickId || (utmMedium && /^(cpc|ppc|paid|ads|paid_social)$/i.test(utmMedium))) {
    channel = 'paid';
  } else if (engine || utmSource === 'seo' || utmMedium === 'organic') {
    channel = 'organic_search';
  } else if (
    (utmSource && /^(instagram|facebook|whatsapp|twitter|x|tiktok|youtube|reddit|linkedin)$/i.test(utmSource)) ||
    /\b(instagram\.com|facebook\.com|t\.co|x\.com|tiktok\.com|youtube\.com|reddit\.com|linkedin\.com|lnkd\.in)\b/i.test(referrer)
  ) {
    channel = 'social';
  } else if (referrer && !isSameHostRef) {
    channel = 'referral';
  }

  const finalCountryCode =
    geo.source === 'default' && cctldCountry ? cctldCountry : geo.countryCode;
  const finalCountryName = countryCodeToName(finalCountryCode);

  let landingPage = window.location.pathname || '/';
  // If user entered SPA from an internal static SEO page CTA (/?utm_source=seo&utm_campaign=identity-shifting),
  // preserve that SEO slug as the organic landing page when no prior storage existed.
  if (landingPage === '/' && utmSource === 'seo' && utmCampaign) {
    landingPage = `/${utmCampaign.replace(/^\/+/, '')}`;
  }

  const attr: SeoAttribution = {
    sessionId: `seo_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    channel,
    isOrganic: channel === 'organic_search',
    landingPage,
    referrer: referrer.slice(0, 300),
    searchEngine: engine || (utmSource === 'seo' ? 'seo_landing' : null),
    utmSource,
    utmMedium,
    utmCampaign,
    utmTerm,
    countryCode: finalCountryCode,
    countryName: finalCountryName,
    firstSeenAt: new Date().toISOString(),
  };

  try {
    window.localStorage.setItem(ATTR_STORAGE_KEY, JSON.stringify(attr));
  } catch {}

  return attr;
}

/** Optional Google Analytics 4 helper (active automatically if VITE_GA_MEASUREMENT_ID is set). */
function sendGa4Event(eventName: string, params: Record<string, any>) {
  if (typeof window === 'undefined') return;
  try {
    const w = window as any;
    const gaId = (import.meta as any).env?.VITE_GA_MEASUREMENT_ID;
    if (gaId && !w.__mosGaLoaded) {
      w.__mosGaLoaded = true;
      w.dataLayer = w.dataLayer || [];
      w.gtag = w.gtag || function () { w.dataLayer.push(arguments); };
      const s = document.createElement('script');
      s.async = true;
      s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`;
      document.head.appendChild(s);
      w.gtag('js', new Date());
      w.gtag('config', gaId, { send_page_view: true });
    }
    if (typeof w.gtag === 'function') {
      w.gtag('event', eventName, params);
    }
  } catch {}
}

async function postSeoEvent(payload: Record<string, any>) {
  try {
    await fetch('/api/analytics/seo-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {}
}

/** Initialize passive country detection + log organic click/visit once per browser session. */
export async function initSeoAttribution(): Promise<SeoAttribution> {
  const geo = await resolvePassiveGeo();
  const attr = getOrCreateAttribution(geo);

  if (typeof window !== 'undefined') {
    try {
      const alreadySent = window.sessionStorage.getItem(VISIT_SENT_SESSION_KEY);
      if (!alreadySent) {
        window.sessionStorage.setItem(VISIT_SENT_SESSION_KEY, '1');
        const eventType = attr.isOrganic ? 'organic_click' : 'page_visit';
        sendGa4Event(eventType, {
          country_code: attr.countryCode,
          country_name: attr.countryName,
          acquisition_channel: attr.channel,
          landing_page: attr.landingPage,
          search_engine: attr.searchEngine || 'none',
        });
        await postSeoEvent({
          eventType,
          sessionId: attr.sessionId,
          countryCode: attr.countryCode,
          countryName: attr.countryName,
          channel: attr.channel,
          isOrganic: attr.isOrganic,
          landingPage: attr.landingPage,
          referrer: attr.referrer,
          searchEngine: attr.searchEngine,
          utmSource: attr.utmSource,
          utmMedium: attr.utmMedium,
          utmCampaign: attr.utmCampaign,
        });
      }
    } catch {}
  }

  return attr;
}

/** Build user-document attribution fields to merge on first signup. */
export function getUserAttributionPatch(): Record<string, any> {
  const attr = getOrCreateAttribution();
  return {
    country: attr.countryName,
    countryCode: attr.countryCode,
    acquisitionChannel: attr.channel,
    isOrganicAcquisition: attr.isOrganic,
    firstLandingPage: attr.landingPage,
    firstReferrer: attr.referrer || null,
    searchEngine: attr.searchEngine || null,
    utmSource: attr.utmSource || null,
    utmMedium: attr.utmMedium || null,
    utmCampaign: attr.utmCampaign || null,
  };
}

/** Record country-wise signup (idempotent per uid on client + server). */
export async function trackCountrySignup(userId: string, email?: string | null) {
  if (!userId || typeof window === 'undefined') return;
  try {
    const key = `${SIGNUP_SENT_PREFIX}${userId}`;
    if (window.localStorage.getItem(key)) return;
    window.localStorage.setItem(key, '1');
  } catch {}

  const attr = getOrCreateAttribution();
  sendGa4Event('sign_up', {
    method: 'Google',
    country_code: attr.countryCode,
    country_name: attr.countryName,
    acquisition_channel: attr.channel,
    landing_page: attr.landingPage,
  });

  await postSeoEvent({
    eventType: 'signup',
    userId,
    email: email || undefined,
    sessionId: attr.sessionId,
    countryCode: attr.countryCode,
    countryName: attr.countryName,
    channel: attr.channel,
    isOrganic: attr.isOrganic,
    landingPage: attr.landingPage,
    searchEngine: attr.searchEngine,
    utmSource: attr.utmSource,
    utmMedium: attr.utmMedium,
    utmCampaign: attr.utmCampaign,
  });
}

/** Record country-wise paid subscription conversion. */
export async function trackCountryPurchase(opts: {
  userId: string;
  planType: string;
  amount: number;
  currency: 'USD' | 'INR' | string;
  paymentId?: string;
  countryOverride?: string | null;
}) {
  const attr = getOrCreateAttribution();
  const countryCode = opts.countryOverride
    ? countryNameToCode(opts.countryOverride)
    : opts.currency === 'INR' && attr.countryCode === 'US'
      ? 'IN'
      : attr.countryCode;
  const countryName = countryCodeToName(countryCode);

  sendGa4Event('purchase', {
    transaction_id: opts.paymentId || `tx_${opts.userId}_${Date.now()}`,
    value: opts.amount,
    currency: opts.currency,
    item_name: opts.planType,
    country_code: countryCode,
    country_name: countryName,
    acquisition_channel: attr.channel,
    landing_page: attr.landingPage,
  });

  await postSeoEvent({
    eventType: 'purchase',
    userId: opts.userId,
    paymentId: opts.paymentId,
    planType: opts.planType,
    amount: opts.amount,
    currency: opts.currency,
    sessionId: attr.sessionId,
    countryCode,
    countryName,
    channel: attr.channel,
    isOrganic: attr.isOrganic,
    landingPage: attr.landingPage,
    searchEngine: attr.searchEngine,
    utmSource: attr.utmSource,
    utmMedium: attr.utmMedium,
    utmCampaign: attr.utmCampaign,
  });
}

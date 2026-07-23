import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';

const root = new URL('..', import.meta.url).pathname;
const configPath = join(root, 'client.config.js');
const config = readFileSync(configPath, 'utf8');
const unresolved = [...config.matchAll(/\{\{([A-Z0-9_|.-]+)\}\}/g)].map(m => m[1]);
if (unresolved.length) console.warn('client.config.js still contains build tokens:', [...new Set(unresolved)].join(', '));

function loadClientConfig(source) {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: 'client.config.js' });
  return sandbox.window.CLIENT_CONFIG || {};
}

/* A value is usable when the config explicitly provides it — INCLUDING an
   explicit empty string (empty logo/map/offer values must hydrate to "",
   which the CSS/JS neutralize, instead of leaking raw {{TOKENS}} into
   shipped pages). Missing keys stay unhydrated so they fail loudly. */
function usable(value) {
  return value !== undefined && value !== null && String(value).indexOf('{{') === -1;
}

function tokenMapFromConfig(cfg) {
  const map = {
    CLIENT_NAME: cfg.client?.name,
    CLIENT_LEGAL_NAME: cfg.client?.legalName,
    CLIENT_MARKET: cfg.client?.market,
    CLIENT_TAGLINE: cfg.client?.tagline,
    CLIENT_PHONE: cfg.client?.primaryPhone,
    CLIENT_PHONE_E164: String(cfg.client?.primaryPhoneHref || '').replace(/^tel:/, ''),
    CLIENT_ADDRESS: cfg.client?.address,
    CLIENT_MAP_URL: cfg.client?.mapUrl,
    CLIENT_HOURS: cfg.client?.hours,
    CLIENT_WEBSITE_URL: cfg.client?.websiteUrl,
    CLIENT_STORAGE_PREFIX: cfg.client?.storagePrefix,
    BRAND_BLUE: cfg.brand?.primary,
    BRAND_BLUE_DEEP: cfg.brand?.deep,
    BRAND_BLUE_NIGHT: cfg.brand?.night,
    BRAND_GOLD: cfg.brand?.accent,
    BRAND_RED: cfg.brand?.urgent,
    META_PIXEL_ID: cfg.tracking?.metaPixelId,
    GA4_ID: cfg.tracking?.ga4Id,
    CLARITY_ID: cfg.tracking?.clarityId,
    TURNSTILE_SITE_KEY: cfg.tracking?.turnstileSiteKey,
    LEAD_VALUE: cfg.tracking?.leadValue,
    LEAD_CURRENCY: cfg.tracking?.leadCurrency,
    PRIMARY_OFFER: cfg.offers?.primary,
    FINANCING_PROMISE: cfg.offers?.financing,
    DELIVERY_PROMISE: cfg.offers?.delivery,
    OFFER_NAME: cfg.offers?.name,
    OFFER_HEADLINE: cfg.offers?.headline,
    OFFER_SHORT: cfg.offers?.short,
    OFFER_ENDS_LABEL: cfg.offers?.endsLabel,
    OFFER_ENDS_AT: cfg.offers?.endsAt,
    CLIENT_EMAIL: cfg.client?.email,
    CLIENT_LOGO_URL: cfg.client?.logoUrl,
    CLIENT_LOGO_FOOTER_URL: cfg.client?.logoFooterUrl,
    CLIENT_MAP_EMBED_URL: cfg.client?.mapEmbedUrl,
    CLIENT_FACEBOOK_URL: cfg.client?.facebookUrl,
    CLIENT_ADDRESS_HTML: cfg.client?.addressHtml,
    CLIENT_HOURS_HTML: cfg.client?.hoursHtml,
    CLIENT_LEAD_DISCLAIMER: cfg.client?.leadDisclaimer,
    HOME_HERO_IMAGE: cfg.home?.heroImage,
    HOME_HERO_IMAGE_ALT: cfg.home?.heroImageAlt,
    HOME_EYEBROW: cfg.home?.eyebrow,
    HOME_HERO_HEADLINE: cfg.home?.headline,
    HOME_HERO_HEADLINE_ACCENT: cfg.home?.headlineAccent,
    HOME_HERO_SUBHEAD: cfg.home?.subhead,
    HOME_CAMPAIGN: cfg.home?.campaign,
    LEAD_ENDPOINT: cfg.endpoints?.lead || '/api/lead',
    /* GSC verification is optional: missing/empty hydrates to "" and the
       build strips the empty meta tag entirely (decision-table: launch may
       proceed without it, flagged as an open wiring item). */
    GSC_VERIFICATION: usable(cfg.tracking?.gscVerification) ? cfg.tracking.gscVerification : '',
    /* GHL External Tracking is optional the same way: missing/empty hydrates
       to "" and tracking.js injects nothing (attribution loss, not lead loss). */
    GHL_EXTERNAL_TRACKING: usable(cfg.tracking?.ghlExternalTracking) ? cfg.tracking.ghlExternalTracking : '',
    /* Booking calendar is optional: empty = /book/ runs in request-mode
       (preferred-day capture, no live slots) — leads still captured. */
    GHL_BOOKING_CALENDAR_ID: usable(cfg.tracking?.ghlBookingCalendarId) ? cfg.tracking.ghlBookingCalendarId : ''
  };
  for (const [key, value] of Object.entries(process.env)) {
    if (/^[A-Z0-9_]+$/.test(key) && value) map[key] = value;
  }
  return Object.fromEntries(Object.entries(map).filter(([, value]) => usable(value)).map(([key, value]) => [key, String(value)]));
}

const tokenMap = tokenMapFromConfig(loadClientConfig(config));

function replaceTokens(text) {
  return text.replace(/\{\{([A-Z0-9_.-]+)(?:\|([^}]+))?\}\}/g, (match, token, fallback) => {
    if (token in tokenMap) return tokenMap[token];
    if (fallback !== undefined) return fallback;
    return match;
  });
}

function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.wrangler' || name === '.git') continue;
    const file = join(dir, name);
    if (statSync(file).isDirectory()) walk(file);
    else if (/\.(html|css|js|toml)$/i.test(name)) {
      let text = readFileSync(file, 'utf8');
      text = replaceTokens(text);
      /* Empty GSC token → omit the verification meta entirely (same
         empty-hydration philosophy as empty logo/map values). */
      if (/\.html$/i.test(name)) text = text.replace(/[ \t]*<meta name="google-site-verification" content="">\r?\n?/g, '');
      writeFileSync(file, text);
    }
  }
}
walk(root);

/* ---- SEO artifacts: robots.txt + sitemap.xml, generated into the build root.
   Skipped (with a loud warning) when no usable domain exists — e.g. when this
   script is run against the raw template instead of a hydrated dist/. ---- */
function generateSeoArtifacts() {
  let domain = tokenMap.DOMAIN || '';
  if (!domain && /^https?:\/\//.test(tokenMap.CLIENT_WEBSITE_URL || '')) {
    try { domain = new URL(tokenMap.CLIENT_WEBSITE_URL).host; } catch { /* fall through */ }
  }
  if (!domain || domain.includes('{{')) {
    console.warn('SEO artifacts skipped: no usable DOMAIN or CLIENT_WEBSITE_URL — robots.txt/sitemap.xml not generated.');
    return;
  }
  const staging = /noindex/i.test(tokenMap.ROBOTS_DIRECTIVE || '');
  /* Staging: disallow everything, matching the noindex robots meta. Production:
     allow all except admin/ (back office; also excluded from the sitemap). */
  const robots = staging
    ? 'User-agent: *\nDisallow: /\n'
    : `User-agent: *\nAllow: /\nDisallow: /admin/\n\nSitemap: https://${domain}/sitemap.xml\n`;
  writeFileSync(join(root, 'robots.txt'), robots);

  const htmlPages = [];
  (function collect(dir, rel) {
    for (const name of readdirSync(dir)) {
      if (['node_modules', '.wrangler', '.git', 'scripts', 'functions', 'clients', 'skills', 'docs'].includes(name)) continue;
      const file = join(dir, name);
      const relPath = rel ? `${rel}/${name}` : name;
      if (statSync(file).isDirectory()) collect(file, relPath);
      else if (/\.html$/i.test(name)) htmlPages.push(relPath);
    }
  })(root, '');
  /* Excluded from the sitemap: 404, thank-you (terminal page), admin (back
     office), and the SLUG product template (real product URLs are dynamic). */
  const EXCLUDED = /^(404\.html|thank-you\.html|admin\/|active-inventory\/SLUG\/)/;
  const lastmod = new Date().toISOString().slice(0, 10);
  const urls = htmlPages
    .filter(p => !EXCLUDED.test(p))
    .map(p => (p === 'index.html' ? '' : p.replace(/index\.html$/, '')))
    .sort()
    .map(p => `  <url><loc>https://${domain}/${p}</loc><lastmod>${lastmod}</lastmod></url>`);
  writeFileSync(join(root, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);
  console.log(`SEO artifacts: robots.txt (${staging ? 'staging — Disallow: /' : 'production — allow + sitemap'}), sitemap.xml (${urls.length} URLs).`);
}
generateSeoArtifacts();

console.log('Build config pass complete.');

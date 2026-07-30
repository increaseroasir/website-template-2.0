import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';

const root = new URL('..', import.meta.url).pathname;
const COMPONENTS = join(root, 'components');

/* Shared partials (TVD-053): pages pull markup via
     <!-- @include site-nav.html active="hot-tubs" -->
   Inside a component:
     {{@param}}        → the param's value ('' if not passed)
     {{@active:slug}}  → ' class="nav-active"' when active === slug, else ''
   Port of the senior-template include resolver; runs before token replace. */
const INCLUDE_RE = /<!--\s*@include\s+(\S+?)(?:\s+([^>]*?))?\s*-->/g;
function resolveIncludes(content, depth = 0) {
  if (depth > 5) {
    console.error('ERROR: include depth > 5 (circular include?)');
    process.exit(1);
  }
  return content.replace(INCLUDE_RE, (_, name, paramStr) => {
    const compPath = join(COMPONENTS, name);
    if (!existsSync(compPath)) {
      console.error(`ERROR: unknown component "${name}"`);
      process.exit(1);
    }
    let comp = readFileSync(compPath, 'utf8').trimEnd();
    const params = {};
    if (paramStr) {
      for (const m of paramStr.matchAll(/([a-zA-Z_][\w-]*)="([^"]*)"/g)) params[m[1]] = m[2];
    }
    comp = comp.replace(/ ?\{\{@active:([\w-]+)\}\}/g, (__, slug) =>
      slug === params.active ? ' class="nav-active"' : '');
    comp = comp.replace(/\{\{@([a-zA-Z_][\w-]*)\}\}/g, (__, key) => params[key] ?? '');
    return resolveIncludes(comp, depth + 1);
  });
}
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

/* Optional sections (TVD-030): an <!-- IF:TOKEN -->…<!-- /IF:TOKEN --> block
   ships only when TOKEN has a usable value; otherwise the whole block is
   removed so neither placeholders nor an empty shell reach the dist. Member
   tokens of a hidden group that live outside the block (e.g. the body's
   data-offer-ends attribute) are blanked afterwards. A member token left
   unfilled while its control IS set still fails scan-placeholders — partial
   sections are not allowed. */
const optionalSections = {
  OFFER_NAME: /\{\{OFFER_[A-Z0-9_]+(?:\|[^}]*)?\}\}/g,
  GUIDE_HEADLINE: /\{\{GUIDE_[A-Z0-9_]+(?:\|[^}]*)?\}\}/g,
  FLOOR_COUNT_LABEL: /\{\{FLOOR_COUNT(?:_LABEL)?(?:\|[^}]*)?\}\}/g,
  MASSAGE_CATEGORY_SUMMARY: /\{\{MASSAGE_CATEGORY_SUMMARY(?:\|[^}]*)?\}\}/g,
  REVIEW_1_TEXT: /\{\{(?:REVIEW_[0-9]_[A-Z0-9_]+|REVIEWS_TOTAL_LINE)(?:\|[^}]*)?\}\}/g
};
function applyOptionalSections(text) {
  text = text.replace(/[ \t]*<!-- IF:([A-Z0-9_]+) -->([\s\S]*?)<!-- \/IF:\1 -->[ \t]*\r?\n?/g,
    (match, token, body) => (token in tokenMap ? body : ''));
  for (const [control, members] of Object.entries(optionalSections)) {
    if (!(control in tokenMap)) text = text.replace(members, '');
  }
  return text;
}

function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.wrangler' || name === '.git' || name === 'components' || name === 'clients') continue;
    const file = join(dir, name);
    if (statSync(file).isDirectory()) walk(file);
    else if (/\.(html|css|js|toml)$/i.test(name)) {
      let text = readFileSync(file, 'utf8');
      if (/\.html$/i.test(name)) {
        text = resolveIncludes(text);
        text = applyOptionalSections(text);
      }
      text = replaceTokens(text);
      /* Empty GSC token → omit the verification meta entirely (same
         empty-hydration philosophy as empty logo/map values). */
      if (/\.html$/i.test(name)) text = text.replace(/[ \t]*<meta name="google-site-verification" content="">\r?\n?/g, '');
      writeFileSync(file, text);
    }
  }
}
walk(root);

/* ---- Meta pixel hardcoded into every HTML page at build time.
   The runtime path (tracking.js reading CLIENT_CONFIG) silently died whenever
   client.config.js was missing or cached stale — no pixel, no error. The pixel
   snippet is now written directly into the HTML before the client.config.js
   script tag, unconditional and independent of CLIENT_CONFIG at runtime.
   data-cfasync="false" stops Cloudflare Rocket Loader from deferring it.
   tracking.js keeps its config-driven pixel as a fallback but skips itself
   when fbq already exists, so PageView never double-fires. ---- */
function injectMetaPixel() {
  const pixelId = tokenMap.META_PIXEL_ID || '';
  if (!usable(pixelId) || !pixelId) {
    console.warn('Meta pixel injection skipped: no usable META_PIXEL_ID.');
    return;
  }
  const snippet = [
    '<script data-cfasync="false">',
    "!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');",
    `fbq('init', '${pixelId}');`,
    "fbq('track', 'PageView');",
    '</script>',
    /* alt="" + aria-hidden: Meta's stock snippet ships no alt, which fails the
       launch gate's image-accessibility check on every page. The beacon is a
       1x1 tracking pixel with no informational content, so an empty alt is the
       correct treatment (screen readers skip it) and Meta ignores both attrs. */
    `<noscript><img height="1" width="1" alt="" aria-hidden="true" style="display:none" src="https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1"></noscript>`,
    ''
  ].join('\n');
  const configTag = /<script src="[^"]*client\.config\.js"><\/script>/;
  let injected = 0;
  (function inject(dir) {
    for (const name of readdirSync(dir)) {
      if (name === 'node_modules' || name === '.wrangler' || name === '.git') continue;
      const file = join(dir, name);
      if (statSync(file).isDirectory()) { inject(file); continue; }
      if (!/\.html$/i.test(name)) continue;
      const text = readFileSync(file, 'utf8');
      if (text.includes('fbevents.js') || !configTag.test(text)) continue;
      writeFileSync(file, text.replace(configTag, (tag) => snippet + tag));
      injected++;
    }
  })(root);
  console.log(`Meta pixel hardcoded into ${injected} HTML file(s).`);
}
injectMetaPixel();

/* ---- client.config.js + tracking.js inlined into the head (WTV-040).
   Both shipped as plain <script src> in the head with no defer, so each one
   cost a full serialized round trip before the browser could paint anything.
   Lighthouse measured 565ms of render blocking apiece on a 3G-class RTT —
   together the single largest render-blocking cost on the page, larger than
   home.css.

   They are inlined rather than deferred because ORDER IS LOAD-BEARING: every
   end-of-body script reads window.CLIENT_CONFIG, and defer would move these
   two head scripts to AFTER those body scripts, leaving CLIENT_CONFIG
   undefined. Inlining keeps the exact execution order the page has today and
   simply removes the two network fetches, so tracking initializes EARLIER
   than before — which is the direction TVD-037 requires.

   Both files stay on disk: gate check 1 asserts client.config.js exists at the
   dist root, and other pages/tools may still request them. ---- */
function inlineBlockingHeadScripts() {
  const targets = [
    { name: 'client.config.js', path: join(root, 'client.config.js'), tag: /<script src="[^"]*client\.config\.js"><\/script>/ },
    { name: 'tracking.js', path: join(root, 'assets', 'tracking.js'), tag: /<script src="[^"]*assets\/tracking\.js"><\/script>/ }
  ];
  for (const t of targets) {
    let body;
    try {
      body = readFileSync(t.path, 'utf8');
    } catch {
      console.warn(`Inline skipped: ${t.name} not found — leaving the blocking <script src> in place.`);
      continue;
    }
    /* A literal </script> inside the body would close the wrapper early. Neither
       file contains one today; this keeps that from becoming a silent XSS-shaped
       bug if either ever gains a string like "</script>". */
    const safe = body.replace(/<\/script/gi, '<\\/script');
    const snippet = `<script data-inlined="${t.name}">\n${safe}\n</script>`;
    let count = 0;
    (function inject(dir) {
      for (const name of readdirSync(dir)) {
        if (name === 'node_modules' || name === '.wrangler' || name === '.git') continue;
        const file = join(dir, name);
        if (statSync(file).isDirectory()) { inject(file); continue; }
        if (!/\.html$/i.test(name)) continue;
        const text = readFileSync(file, 'utf8');
        if (!t.tag.test(text)) continue;
        writeFileSync(file, text.replace(t.tag, () => snippet));
        count++;
      }
    })(root);
    console.log(`Inlined ${t.name} into ${count} HTML file(s) (was render-blocking).`);
  }
}
inlineBlockingHeadScripts();

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

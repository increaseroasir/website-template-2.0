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

function usable(value) {
  return value !== undefined && value !== null && String(value).indexOf('{{') === -1 ? String(value) : '';
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
    LEAD_ENDPOINT: cfg.endpoints?.lead || '/api/lead'
  };
  for (const [key, value] of Object.entries(process.env)) {
    if (/^[A-Z0-9_]+$/.test(key) && value) map[key] = value;
  }
  return Object.fromEntries(Object.entries(map).map(([key, value]) => [key, usable(value)]).filter(([, value]) => value));
}

const tokenMap = tokenMapFromConfig(loadClientConfig(config));

function replaceTokens(text) {
  return text.replace(/\{\{([A-Z0-9_.-]+)(?:\|([^}]+))?\}\}/g, (match, token, fallback) => {
    if (tokenMap[token]) return tokenMap[token];
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
      writeFileSync(file, text);
    }
  }
}
walk(root);
console.log('Build config pass complete.');

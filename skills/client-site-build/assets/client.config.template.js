/* client.config.js — <CLIENT NAME> — generated from intake.json.
 * Fill every value from the intake brief. Leave a value '' ONLY if the
 * decision-table ruling for a missing value applies (and flag it).
 * NEVER copy values from another client or from the Paradise build.
 * Validate with: node skills/client-site-build/scripts/new-client.mjs --validate <name>
 */
window.CLIENT_CONFIG = {
  client: {
    name: '',                       // short trading name, ≤40 chars (header/drawer/footer)
    legalName: '',                  // full legal name (JSON-LD, TCPA)
    market: '',                     // e.g. "Greater Knoxville"
    tagline: '',
    primaryPhone: '',               // display format, e.g. "865-555-0142"
    primaryPhoneHref: 'tel:',       // tel:+1XXXXXXXXXX (E164)
    smsHref: 'sms:',                // sms:+1XXXXXXXXXX (E164)
    address: '',
    mapUrl: '',                     // GMB share link
    hours: '',
    websiteUrl: '',                 // https://production-domain.com
    storagePrefix: '',              // kebab-case asset prefix, e.g. "smoky-mountain"
    email: '',
    logoUrl: '',
    logoFooterUrl: '',              // light/knockout version for dark footer
    mapEmbedUrl: '',
    facebookUrl: '',
    addressHtml: '',
    hoursHtml: '',
    leadDisclaimer: ''              // TCPA: names THIS business + THIS phone
  },
  brand: {
    /* Law 3: palette is the product. These stay on template values.
       A palette change is a template-repo re-theming project, not a config edit. */
    primary: '#16469B',
    deep: '#0B2559',
    night: '#06183D',
    accent: '#FFB81C',
    urgent: '#D7261E'
  },
  tracking: {
    metaPixelId: '',                // client's pixel — verify in Test Events
    ga4Id: '',                      // G-XXXXXXXXXX — verify in Realtime
    clarityId: '',
    turnstileSiteKey: '',           // EMPTY = SILENT LEAD LOSS. Block launch if missing.
    gscVerification: '',            // Search Console meta token. Empty = meta omitted (launch may proceed; verify within 48h).
    ghlExternalTracking: '',        // GHL External Tracking script src URL (per-location snippet). Empty = not injected — attribution loss, not lead loss; add within 48h. NEVER a real ID on staging.
    leadValue: '950',
    leadCurrency: 'USD'
  },
  endpoints: {
    lead: '/api/lead',
    inventory: '/api/inventory',
    admin: '/api/admin'
  },
  offers: {
    primary: '',
    financing: '',
    delivery: '',
    name: '',
    headline: '',
    short: '',
    endsLabel: '',
    endsAt: ''                      // ISO WITH timezone (2026-09-01T23:59:59-04:00) or '' = evergreen
  },
  home: {
    heroImage: '',
    heroImageAlt: '',
    eyebrow: '',
    headline: '',                   // headline + accent ≤48 chars combined
    headlineAccent: '',
    subhead: '',
    campaign: 'homepage'
  }
};

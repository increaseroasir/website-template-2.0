/* client.config.js — sun-pool-spa — generated from intake.json.
 * Fill every value from the intake brief. Leave a value '' ONLY if the
 * decision-table ruling for a missing value applies (and flag it).
 * NEVER copy values from another client or from the Paradise build.
 * Validate with: node skills/client-site-build/scripts/new-client.mjs --validate <name>
 */
window.CLIENT_CONFIG = {
  client: {
    name: 'Sun Pool & Spa Supply',                       // short trading name, ≤40 chars (header/drawer/footer)
    legalName: '',                  // full legal name (JSON-LD, TCPA)
    market: 'East County San Diego',                     // e.g. "Greater Knoxville"
    tagline: 'The Best Hot Tub & Swim Spa Store in San Diego County',
    primaryPhone: '(619) 561-8587',               // display format, e.g. "865-555-0142"
    primaryPhoneHref: 'tel:+16195618587',       // tel:+1XXXXXXXXXX (E164)
    smsHref: 'sms:+16195618587',                // sms:+1XXXXXXXXXX (E164)
    address: '12473 Woodside Ave, Suite C, Lakeside, CA 92040',
    mapUrl: 'https://www.google.com/maps/place/Sun+Pool+%26+Spa+Supply/@32.8550,-116.9220,15z',                     // GMB share link
    hours: 'Mon-Fri: 9:30 a.m. – 5 p.m., Sat: 9 a.m. – 5 p.m., Sun: 10 a.m. – 2 p.m.',
    websiteUrl: 'https://sunpoolandspasupply.com',                 // https://production-domain.com
    storagePrefix: 'sun-pool-spa',              // kebab-case asset prefix, e.g. "smoky-mountain"
    email: 'info@sunpoolandspasupply.com',
    logoUrl: '',
    logoFooterUrl: '',              // light/knockout version for dark footer
    mapEmbedUrl: '',
    facebookUrl: 'https://www.facebook.com/sunpoolsupply/',
    addressHtml: '12473 Woodside Ave, Suite C<br>Lakeside, CA 92040',
    hoursHtml: 'Mon-Fri: 9:30 a.m. – 5 p.m.<br>Sat: 9 a.m. – 5 p.m.<br>Sun: 10 a.m. – 2 p.m.',
    leadDisclaimer: 'By clicking submit, I consent to receive texts and calls from Sun Pool & Spa Supply at (619) 561-8587 regarding my inquiry. Message and data rates may apply.'              // TCPA: names THIS business + THIS phone
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
    metaPixelId: '4074640486011315', // client's pixel — verify in Test Events
    ga4Id: 'G-KSJ8N5G2ZJ',      // G-XXXXXXXXXX — verify in Realtime
    clarityId: '',
    turnstileSiteKey: '0x4AAAAAAD9eD20M7uqPSNXi', // Public site key; secret remains Cloudflare-only.
    gscVerification: '',            // Search Console meta token. Empty = meta omitted (launch may proceed; verify within 48h).
    ghlExternalTracking: '',        // GHL External Tracking script src URL (per-location snippet). Empty = not injected — attribution loss, not lead loss; add within 48h. NEVER a real ID on staging.
    ghlBookingCalendarId: '',       // GHL calendar ID for /book/. Empty = request-mode (no live slots; leads still captured + confirmed by text).
    leadValue: '0',
    leadCurrency: 'USD'
  },
  endpoints: {
    lead: '/api/lead',
    inventory: '/api/inventory',
    admin: '/api/admin'
  },
  offers: {
    primary: 'Evergreen Catalog',
    financing: 'Flexible financing available for all credit types',
    delivery: 'Professional local delivery and installation',
    name: 'Evergreen Catalog',
    headline: 'There has never been a better time to buy a Hot Tub',
    short: 'Shop Hot Tubs',
    endsLabel: '',
    endsAt: ''                      // ISO WITH timezone (2026-09-01T23:59:59-04:00) or '' = evergreen
  },
  home: {
    heroImage: 'assets/HERO_sun-pool-spa-hydropool-blue-led-hot-tub.webp',
    heroImageAlt: 'Hydropool hot tub running with blue LED lights on the Sun Pool & Spa showroom floor',
    eyebrow: 'San Diego County',
    headline: 'The Best Hot Tub & Swim Spa Store',                   // headline + accent ≤48 chars combined
    headlineAccent: 'in San Diego County',
    subhead: 'Serving East County since 1979.',
    campaign: 'homepage'
  }
};

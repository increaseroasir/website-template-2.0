/* hostile.config.js — the stress-test client (FINAL_DIAL_IN gate, Part A3).
 * Every value here is deliberately adversarial. Use it to dress-rehearse a
 * build: copy over clients/<name>/client.config.js, pair with a filler
 * tokens.env (see evals/evals.json case 1), build to dist/, run gate.mjs.
 * What each trap tests is noted inline. THIS CLIENT IS FAKE.
 */
window.CLIENT_CONFIG = {
  client: {
    /* 68-char name: tests header/footer/drawer/JSON-LD overflow. The correct
       build response is short-name/legal-name split per decision-table —
       keeping it long HERE verifies nothing breaks catastrophically. */
    name: 'Smoky Mountain Hot Tub & Swim Spa Superstore of Greater Knoxville',
    legalName: "Smoky Mountain Hot Tub & Swim Spa Superstore of Greater Knoxville, LLC",
    market: 'Greater Knoxville',
    /* Apostrophe: tests attribute escaping end-to-end. */
    tagline: "East Tennessee's backyard, done right",
    primaryPhone: '865-555-0142',
    primaryPhoneHref: 'tel:+18655550142',
    smsHref: 'sms:+18655550142',
    /* TN address: tests that nothing assumes the origin dealer's ND market. Zips here are 37xxx —
       the zip rule must accept them (it's generic 5-digit, config-agnostic). */
    address: '4217 Chapman Hwy, Knoxville, TN 37920',
    mapUrl: 'https://maps.google.com/?q=example-smoky-mountain-hot-tub',
    hours: 'Mon–Sat 9–6, Sun closed',
    websiteUrl: 'https://example-smoky-mountain-spas.com',
    storagePrefix: 'smoky-mountain-hostile',
    email: 'howdy@example-smoky-mountain-spas.com',
    /* One image empty (gradient well must render), one 404 (onerror must
       keep the card clean). */
    logoUrl: '',
    logoFooterUrl: 'https://example-smoky-mountain-spas.com/does-not-exist-404.webp',
    mapEmbedUrl: '',
    facebookUrl: 'https://facebook.com/example-smoky-mountain-spas',
    addressHtml: '4217 Chapman Hwy<br>Knoxville, TN 37920',
    hoursHtml: 'Mon–Sat 9–6<br>Sun closed',
    /* TCPA names THIS fake business + phone (honesty rule shape-check). */
    leadDisclaimer: "By submitting, you agree Smoky Mountain Hot Tub & Swim Spa Superstore of Greater Knoxville may call or text you at 865-555-0142 about your request. Msg/data rates may apply. Reply STOP to opt out."
  },
  brand: {
    /* Law 3: palette untouched even in the hostile build. */
    primary: '#16469B', deep: '#0B2559', night: '#06183D',
    accent: '#FFB81C', urgent: '#D7261E'
  },
  tracking: {
    /* Syntactically valid, obviously fake IDs — must NOT match any
       fingerprint, and must not be left empty (empty Turnstile = blocked). */
    metaPixelId: '999000999000999',
    ga4Id: 'G-FAKE0HOSTL',
    clarityId: 'zzfake0000',
    turnstileSiteKey: '0x4AAAAAAAFakeHostileKey000',
    gscVerification: '',            // deliberately empty — asserts the GSC meta is stripped, not shipped blank

    leadValue: '950',
    leadCurrency: 'USD'
  },
  endpoints: { lead: '/api/lead', inventory: '/api/inventory', admin: '/api/admin' },
  offers: {
    /* NO ACTIVE OFFER: endsAt empty → evergreen mode. The build must show
       no 00:00:00 tiles, no NaN, no dead marquee clock (body.offer-static). */
    primary: 'Financing from $89/mo on in-stock spas',
    financing: '0% for 12 months on approved credit',
    delivery: 'White-glove delivery across East Tennessee',
    name: 'Evergreen Value Event',
    headline: 'In-stock spas priced to move — no gimmicks, no deadline',
    short: 'In-stock spas priced to move',
    endsLabel: '',
    endsAt: ''
  },
  home: {
    heroImage: 'https://example-smoky-mountain-spas.com/hero-smoky-mountains.webp',
    heroImageAlt: "Couple relaxing in a hot tub with the Smokies at dusk",
    eyebrow: 'KNOXVILLE HOT TUB SUPERSTORE',
    headline: 'Your backyard,',
    headlineAccent: 'upgraded',
    subhead: "Real inventory, real prices, and East Tennessee's friendliest spa team.",
    campaign: 'homepage-hostile-rehearsal'
  }
};
/* Reputation reality for tokens.env (STAT_* / REVIEW_*): 3 Google reviews,
 * rating 4.2. Per content-rules honesty: stats band must NOT claim review
 * volume; JSON-LD aggregateRating must be DROPPED (<10 reviews rule).
 * A hostile tokens.env value to include somewhere visible:
 *   FAQ_A_1="We're open Mon–Sat 9–6. Y'all come see the valley's best selection."
 * (apostrophes in text context) — and confirm no tokens.env value ever
 * contains "|" (pipe corrupts the default parser).
 */

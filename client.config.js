window.CLIENT_CONFIG = {
  client: {
    name: '{{CLIENT_NAME}}',
    legalName: '{{CLIENT_LEGAL_NAME}}',
    market: '{{CLIENT_MARKET}}',
    tagline: '{{CLIENT_TAGLINE}}',
    primaryPhone: '{{CLIENT_PHONE}}',
    primaryPhoneHref: 'tel:{{CLIENT_PHONE_E164}}',
    smsHref: 'sms:{{CLIENT_PHONE_E164}}',
    address: '{{CLIENT_ADDRESS}}',
    mapUrl: '{{CLIENT_MAP_URL}}',
    hours: '{{CLIENT_HOURS}}',
    websiteUrl: '{{CLIENT_WEBSITE_URL}}',
    storagePrefix: '{{CLIENT_STORAGE_PREFIX}}',
    email: '{{CLIENT_EMAIL}}',
    logoUrl: '{{CLIENT_LOGO_URL}}',
    logoFooterUrl: '{{CLIENT_LOGO_FOOTER_URL}}',
    mapEmbedUrl: '{{CLIENT_MAP_EMBED_URL}}',
    facebookUrl: '{{CLIENT_FACEBOOK_URL}}',
    addressHtml: '{{CLIENT_ADDRESS_HTML}}',
    hoursHtml: '{{CLIENT_HOURS_HTML}}',
    leadDisclaimer: '{{CLIENT_LEAD_DISCLAIMER}}'
  },
  brand: {
    primary: '{{BRAND_BLUE}}',
    deep: '{{BRAND_BLUE_DEEP}}',
    night: '{{BRAND_BLUE_NIGHT}}',
    accent: '{{BRAND_GOLD}}',
    urgent: '{{BRAND_RED}}'
  },
  tracking: {
    metaPixelId: '{{META_PIXEL_ID}}',
    ga4Id: '{{GA4_ID}}',
    clarityId: '{{CLARITY_ID}}',
    ghlExternalTracking: '{{GHL_EXTERNAL_TRACKING}}',
    ghlBookingCalendarId: '{{GHL_BOOKING_CALENDAR_ID}}',
    leadValue: '{{LEAD_VALUE|0}}',
    leadCurrency: 'USD'
  },
  endpoints: {
    lead: '/api/lead',
    inventory: '/api/inventory',
    admin: '/api/admin'
  },
  offers: {
    primary: '{{PRIMARY_OFFER}}',
    financing: '{{FINANCING_PROMISE}}',
    delivery: '{{DELIVERY_PROMISE}}',
    name: '{{OFFER_NAME}}',
    headline: '{{OFFER_HEADLINE}}',
    short: '{{OFFER_SHORT}}',
    endsLabel: '{{OFFER_ENDS_LABEL}}',
    endsAt: '{{OFFER_ENDS_AT}}'
  },
  home: {
    heroImage: '{{HOME_HERO_IMAGE}}',
    heroImageAlt: '{{HOME_HERO_IMAGE_ALT}}',
    eyebrow: '{{HOME_EYEBROW}}',
    headline: '{{HOME_HERO_HEADLINE}}',
    headlineAccent: '{{HOME_HERO_HEADLINE_ACCENT}}',
    subhead: '{{HOME_HERO_SUBHEAD}}',
    campaign: '{{HOME_CAMPAIGN|homepage}}'
  }
};

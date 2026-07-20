window.CLIENT_CONFIG = {
  client: {
    name: '{{CLIENT_NAME}}',
    legalName: '{{CLIENT_LEGAL_NAME}}',
    market: '{{CLIENT_MARKET}}',
    tagline: '{{CLIENT_TAGLINE}}',
    primaryPhone: '{{CLIENT_PHONE}}',
    primaryPhoneHref: 'tel:{{CLIENT_PHONE_E164}}',
    address: '{{CLIENT_ADDRESS}}',
    mapUrl: '{{CLIENT_MAP_URL}}',
    hours: '{{CLIENT_HOURS}}',
    websiteUrl: '{{CLIENT_WEBSITE_URL}}',
    storagePrefix: '{{CLIENT_STORAGE_PREFIX}}'
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
    turnstileSiteKey: '{{TURNSTILE_SITE_KEY}}',
    leadValue: '{{LEAD_VALUE|950}}',
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
    delivery: '{{DELIVERY_PROMISE}}'
  }
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_DIGITS_MIN = 10;

export function splitName(fullName) {
  const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { firstName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

export function normalizePhone(phone) {
  let digits = String(phone || '').replace(/\D/g, '');
  if (digits.length === 11 && digits.charAt(0) === '1') digits = digits.slice(1);
  return digits;
}

export function validateLeadPayload(body, opts) {
  const options = opts || {}; // { emailOptional: true } for phone-first flows (booking page)
  if (!body || typeof body !== 'object') return { ok: false, error: 'Invalid request body.' };
  if (body.website_url) return { ok: false, error: 'Spam detected.' };

  const clientSubmissionId = String(body.submission_id || body.submissionId || body.meta_event_id || body.metaEventId || '').trim();
  const submissionId = /^[0-9a-f-]{36}$/i.test(clientSubmissionId) ? clientSubmissionId : crypto.randomUUID();
  const fullName = String(body.full_name || body.fullName || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const phone = normalizePhone(body.phone);
  const source = String(body.source || 'website-form').trim();
  const financingInterest = String(body.financing_interest || body.financingInterest || '').trim();
  const productName = String(body.product_name || body.productName || body.product_interest || '').trim();
  const productSlug = String(body.product_slug || body.productSlug || '').trim();
  const inventoryStatus = String(body.inventory_status || body.inventoryStatus || '').trim();
  const availableQuantityRaw = String(body.available_quantity || body.availableQuantity || '').trim();
  const trafficChannelRaw = String(body.traffic_channel || body.trafficChannel || '').trim().toLowerCase();
  const allowedChannels = { organic: true, paid: true, direct: true, referral: true, internal: true };
  const names = splitName(fullName);

  if (!fullName || fullName.length < 2) return { ok: false, error: 'Please enter your full name.' };
  if (fullName.length > 120) return { ok: false, error: 'Please enter a valid name.' }; // oversized input is never a name — GHL would reject it downstream anyway
  if (!EMAIL_RE.test(email) && !(options.emailOptional && !email)) return { ok: false, error: 'Please enter a valid email.' };
  if (phone.length < PHONE_DIGITS_MIN) return { ok: false, error: 'Please enter a valid phone number.' };

  let availableQuantity = parseInt(availableQuantityRaw, 10);
  if (!Number.isFinite(availableQuantity)) availableQuantity = 0;
  const modelInterestTag = String(body.model_interest_tag || body.modelInterestTag || (productName ? 'Model Interest - ' + productName : '')).trim();

  return { ok: true, data: {
    submissionId,
    fullName,
    firstName: names.firstName,
    lastName: names.lastName,
    email,
    phone,
    source,
    financingInterest,
    message: String(body.message || '').trim().slice(0, 2000),
    productName,
    productSlug,
    productId: String(body.product_id || body.productId || '').trim(),
    productCategory: String(body.product_category || body.productCategory || '').trim(),
    productPageUrl: String(body.product_page_url || body.productPageUrl || '').trim(),
    productImageUrl: String(body.product_image_url || body.productImageUrl || '').trim(),
    inventoryStatus,
    availableQuantity,
    inventoryStatusTag: String(body.inventory_status_tag || body.inventoryStatusTag || '').trim(),
    leadSource: String(body.lead_source || body.leadSource || '').trim(),
    campaign: String(body.campaign || '').trim(),
    modelInterestTag,
    formIntent: String(body.form_intent || body.formIntent || '').trim(),
    timestamp: String(body.timestamp || '').trim(),
    estimatedRetailPrice: String(body.estimated_retail_price || body.estimatedRetailPrice || '').trim(),
    ourPrice: String(body.our_price || body.ourPrice || '').trim(),
    monthlyPayment: String(body.monthly_payment || body.monthlyPayment || '').trim(),
    pageUrl: String(body.page_url || body.pageUrl || '').trim(),
    landingPageUrl: String(body.landing_page_url || body.landingPageUrl || '').trim(),
    referrerUrl: String(body.referrer_url || body.referrerUrl || '').trim(),
    trafficChannel: allowedChannels[trafficChannelRaw] ? trafficChannelRaw : '',
    utmSource: String(body.utm_source || body.utmSource || '').trim(),
    utmMedium: String(body.utm_medium || body.utmMedium || '').trim(),
    utmCampaign: String(body.utm_campaign || body.utmCampaign || '').trim(),
    utmContent: String(body.utm_content || body.utmContent || '').trim(),
    utmTerm: String(body.utm_term || body.utmTerm || '').trim(),
    fbclid: String(body.fbclid || '').trim(),
    gclid: String(body.gclid || '').trim(),
    msclkid: String(body.msclkid || '').trim(),
    fbp: String(body.fbp || '').trim(),
    fbc: String(body.fbc || '').trim(),
    metaEventId: String(body.meta_event_id || body.metaEventId || submissionId).trim(),
    externalId: String(body.external_id || body.externalId || email || phone || '').trim().toLowerCase(),
    consent: body.consent !== false && body.consent !== 'false'
  }};
}

/* TVD-025: captcha verification removed entirely. A security checker must never
   be able to block a customer lead. Spam control = honeypot + 24h dedupe. */

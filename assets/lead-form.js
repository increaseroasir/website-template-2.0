(function () {
  var body = document.body;
  var cfg = window.CLIENT_CONFIG || {};
  var defaultApiPath = body.getAttribute('data-lead-api') || (cfg.endpoints && cfg.endpoints.lead) || '/api/lead';
  var pixelId = (cfg.tracking && cfg.tracking.metaPixelId) || '';
  var leadCurrency = (cfg.tracking && cfg.tracking.leadCurrency) || 'USD';
  function getCookie(name) { var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)')); return match ? decodeURIComponent(match[2]) : ''; }
  function getAttribution() { return window.DealerTraffic && window.DealerTraffic.getAttribution ? window.DealerTraffic.getAttribution() : {}; }
  function createEventId() { return window.crypto && crypto.randomUUID ? crypto.randomUUID() : 'lead-' + Date.now() + '-' + Math.random().toString(36).slice(2); }
  function getFbc() { var existing = getCookie('_fbc'); if (existing) return existing; var fbclid = new URLSearchParams(location.search).get('fbclid'); return fbclid ? 'fb.1.' + Date.now() + '.' + fbclid : ''; }
  function digitsPhone(phone) { var d = String(phone || '').replace(/\D/g, ''); if (d.length === 10) d = '1' + d; return d; }
  function externalId(email, phone) { return String(email || '').trim().toLowerCase() || digitsPhone(phone) || ''; }
  /* Advanced Matching: Meta accepts PLAIN email/phone here and hashes client-side.
     Do NOT put template placeholders in fbq('init') — call with real values at submit. */
  function applyAdvancedMatching(email, phone) {
    if (typeof fbq !== 'function' || !pixelId || String(pixelId).indexOf('{{') !== -1) return;
    var payload = {};
    if (email) payload.em = String(email).trim().toLowerCase();
    if (phone) payload.ph = digitsPhone(phone);
    if (!payload.em && !payload.ph) return;
    try { fbq('init', pixelId, payload); } catch (err) { /* non-fatal */ }
  }
  /* Lead Pixel: value 0 — value optimization uses offline Purchase/Showed via CAPI. */
  function trackLead(source, eventId, campaign, email, phone) {
    var contentName = campaign || source;
    if (typeof gtag === 'function') gtag('event', 'generate_lead', { event_category: 'engagement', event_label: contentName, page_path: location.pathname || '/' });
    if (typeof fbq === 'function') {
      applyAdvancedMatching(email, phone);
      fbq('track', 'Lead', { value: 0, currency: leadCurrency, content_name: contentName, content_category: campaign || 'website-form' }, { eventID: eventId });
    }
  }
  function bindForm(form) {
    if (form.dataset.leadBound === '1') return;
    form.dataset.leadBound = '1';
    var submit = form.querySelector('[type="submit"]');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var eventId = createEventId();
      var attr = getAttribution();
      var source = form.getAttribute('data-lead-source') || body.getAttribute('data-lead-source') || 'website-form';
      var campaign = (form.querySelector('[name="campaign"]') || {}).value || body.getAttribute('data-lead-campaign') || '';
      var fullName = (form.querySelector('[name="full_name"]') || {}).value || '';
      var email = (form.querySelector('[name="email"]') || {}).value || '';
      var phone = (form.querySelector('[name="phone"]') || {}).value || '';
      var payload = {
        source: source,
        submission_id: eventId,
        full_name: fullName,
        email: email,
        phone: phone,
        message: (form.querySelector('[name="message"]') || {}).value || '',
        financing_interest: (form.querySelector('[name="financing_interest"]') || {}).value || '',
        product_name: (form.querySelector('[name="product_name"]') || form.querySelector('[name="product_interest"]') || {}).value || '',
        product_slug: (form.querySelector('[name="product_slug"]') || {}).value || '',
        product_id: (form.querySelector('[name="product_id"]') || {}).value || '',
        product_category: (form.querySelector('[name="product_category"]') || {}).value || '',
        product_page_url: (form.querySelector('[name="product_page_url"]') || {}).value || location.href,
        inventory_status: (form.querySelector('[name="inventory_status"]') || {}).value || '',
        available_quantity: (form.querySelector('[name="available_quantity"]') || {}).value || '',
        lead_source: (form.querySelector('[name="lead_source"]') || {}).value || '',
        campaign: campaign,
        model_interest_tag: (form.querySelector('[name="model_interest_tag"]') || {}).value || '',
        form_intent: (form.querySelector('[name="form_intent"]') || {}).value || '',
        timestamp: new Date().toISOString(),
        page_url: location.href,
        landing_page_url: attr.landing_page_url || location.href,
        referrer_url: attr.referrer_url || document.referrer || '',
        traffic_channel: attr.traffic_channel || '',
        utm_source: attr.utm_source || '', utm_medium: attr.utm_medium || '', utm_campaign: attr.utm_campaign || '',
        utm_content: attr.utm_content || '', utm_term: attr.utm_term || '',
        fbclid: attr.fbclid || '', gclid: attr.gclid || '', msclkid: attr.msclkid || '',
        consent: true,
        website_url: (form.querySelector('[name="website_url"]') || {}).value || '',
        meta_event_id: eventId,
        external_id: externalId(email, phone),
        fbp: getCookie('_fbp'),
        fbc: getFbc()
      };
      if (submit) { submit.disabled = true; submit.setAttribute('aria-busy', 'true'); }
      fetch(form.getAttribute('data-lead-api') || defaultApiPath, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        .then(function (res) { return res.json().then(function (data) { return { res: res, data: data }; }); })
        .then(function (result) {
          if (!result.data.ok) throw new Error(result.data.error || 'Something went wrong.');
          if (result.data.fire_meta !== false && result.data.ghl_ok && !result.data.duplicate) {
            trackLead(source, result.data.meta_event_id || eventId, campaign, email, phone);
          }
          var success = form.getAttribute('data-lead-success') || 'thank-you';
          if (success === 'inline') {
            var out = form.querySelector('[data-template-result]');
            if (out) { out.hidden = false; out.textContent = result.data.message || 'Thank you. Your request has been received.'; }
            /* Optional follow-up card (e.g. booking invite) revealed under the confirmation */
            var reveal = (form.closest('section') || form.parentElement || document).querySelector('[data-lead-reveal]');
            if (reveal && reveal.hidden) {
              reveal.hidden = false;
              if (reveal.scrollIntoView) reveal.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
          } else if (success === 'unlock') {
            if (window.DealerInventoryGate && typeof window.DealerInventoryGate.unlock === 'function') window.DealerInventoryGate.unlock();
            else location.href = (body.getAttribute('data-gate-return-path') || '/inventory.html') + '?inventory_unlocked=1';
          } else {
            location.href = body.getAttribute('data-thank-you-url') || '/thank-you.html';
          }
        })
        .catch(function (err) {
          var out = form.querySelector('[data-template-result]') || document.querySelector('#inventory-gate-error');
          if (out) { out.hidden = false; out.textContent = err.message || 'Something went wrong.'; }
        })
        .finally(function () {
          if (submit) { submit.disabled = false; submit.removeAttribute('aria-busy'); }
        });
    });
  }
  function bindAll() { document.querySelectorAll('[data-lead-form], [data-template-form]').forEach(bindForm); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindAll); else bindAll();
  window.DealerLeadForm = { bindAll: bindAll };
})();

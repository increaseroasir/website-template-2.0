/* booking.js — /book/ page. Three taps: day → time → details → booked.
   GET /api/booking returns real GHL free slots; when the calendar isn't
   configured (bookable:false) the page switches to request-mode (preferred
   day + same form) so it still converts. POST always captures the contact;
   "booked" vs "confirm by text" only changes the success copy. */
(function () {
  var card = document.querySelector('[data-book-card]');
  if (!card) return;
  var form = card.querySelector('[data-book-form]');
  var daysWrap = card.querySelector('[data-book-days]');
  var timesWrap = card.querySelector('[data-book-times]');
  var fallbackWrap = card.querySelector('[data-book-fallback]');
  var stepTime = card.querySelector('[data-book-step="time"]');
  var stepDetails = card.querySelector('[data-book-step="details"]');
  var picked = card.querySelector('[data-book-picked]');
  var errorOut = card.querySelector('[data-book-error]');
  var successWrap = card.querySelector('[data-book-success]');
  var successCopy = card.querySelector('[data-book-success-copy]');
  var submitBtn = card.querySelector('[data-book-submit]');
  var slotField = form.querySelector('[name="slot"]');
  var days = [];

  var cfg = window.CLIENT_CONFIG || {};
  var siteKey = document.body.getAttribute('data-turnstile-site-key') || (cfg.tracking && cfg.tracking.turnstileSiteKey) || '';
  function turnstileToken() {
    if (!siteKey || !window.turnstile) return '';
    var widget = form.querySelector('.cf-turnstile');
    if (!widget) return '';
    try { return window.turnstile.getResponse(widget) || ''; } catch (err) { return ''; }
  }

  function dayLabel(iso) {
    var d = new Date(iso + 'T12:00:00');
    return { top: d.toLocaleDateString('en-US', { weekday: 'short' }), big: String(d.getDate()), sub: d.toLocaleDateString('en-US', { month: 'short' }) };
  }
  function timeLabel(iso) {
    return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
  function fullLabel(iso) {
    var d = new Date(iso);
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) + ' at ' + timeLabel(iso);
  }
  function chip(html, cls) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'book-chip' + (cls ? ' ' + cls : '');
    b.innerHTML = html;
    return b;
  }
  function select(wrap, el) {
    wrap.querySelectorAll('.book-chip.sel').forEach(function (c) { c.classList.remove('sel'); });
    el.classList.add('sel');
  }

  function showDetails() {
    stepDetails.hidden = false;
    stepDetails.classList.add('on');
  }

  function renderDays() {
    days.slice(0, 7).forEach(function (day, i) {
      var l = dayLabel(day.date);
      var c = chip('<span>' + l.top + '</span><b>' + l.big + '</b><span>' + l.sub + '</span>', 'book-chip-day');
      c.addEventListener('click', function () {
        select(daysWrap, c);
        renderTimes(day);
        stepTime.hidden = false;
        stepTime.classList.add('on');
      });
      daysWrap.appendChild(c);
      if (i === 0) c.click(); // preselect the soonest day — one less decision
    });
  }
  function renderTimes(day) {
    timesWrap.innerHTML = '';
    slotField.value = '';
    picked.hidden = true;
    day.slots.forEach(function (slot) {
      var c = chip(timeLabel(slot));
      c.addEventListener('click', function () {
        select(timesWrap, c);
        slotField.value = slot;
        picked.textContent = fullLabel(slot);
        picked.hidden = false;
        showDetails();
      });
      timesWrap.appendChild(c);
    });
  }
  function requestMode() {
    daysWrap.hidden = true;
    fallbackWrap.hidden = false;
    var label = card.querySelector('[data-book-step="day"] .book-label');
    if (label) label.textContent = '1 · When works for you?';
    var detailsLabel = card.querySelector('[data-book-details-label]');
    if (detailsLabel) detailsLabel.textContent = '2 · Your details';
    showDetails();
  }

  fetch('/api/booking', { headers: { Accept: 'application/json' } })
    .then(function (res) { return res.json(); })
    .then(function (data) {
      if (data && data.ok && data.bookable && Array.isArray(data.days) && data.days.length) {
        days = data.days;
        renderDays();
      } else { requestMode(); }
    })
    .catch(requestMode);

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    errorOut.hidden = true;
    if (submitBtn) { submitBtn.disabled = true; submitBtn.setAttribute('aria-busy', 'true'); }
    var attr = (window.DealerTraffic && window.DealerTraffic.getAttribution()) || {};
    var payload = {
      source: 'booking-page',
      slot: slotField.value || '',
      preferred_day: (form.querySelector('[name="preferred_day"]') || {}).value || '',
      full_name: (form.querySelector('[name="full_name"]') || {}).value || '',
      phone: (form.querySelector('[name="phone"]') || {}).value || '',
      email: (form.querySelector('[name="email"]') || {}).value || '',
      campaign: (form.querySelector('[name="campaign"]') || {}).value || 'booking',
      lead_source: 'booking-page',
      form_intent: 'Showroom Visit',
      timestamp: new Date().toISOString(),
      page_url: location.href,
      landing_page_url: attr.landing_page_url || location.href,
      referrer_url: attr.referrer_url || document.referrer || '',
      traffic_channel: attr.traffic_channel || '',
      utm_source: attr.utm_source || '', utm_medium: attr.utm_medium || '', utm_campaign: attr.utm_campaign || '',
      utm_content: attr.utm_content || '', utm_term: attr.utm_term || '',
      fbclid: attr.fbclid || '', gclid: attr.gclid || '', msclkid: attr.msclkid || '',
      consent: true,
      turnstile_token: turnstileToken()
    };
    fetch('/api/booking', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (!data.ok) throw new Error(data.error || 'Something went wrong.');
        if (typeof gtag === 'function') gtag('event', 'generate_lead', { event_category: 'engagement', event_label: 'booking', page_path: location.pathname });
        if (typeof fbq === 'function') fbq('track', 'Schedule', { content_name: 'showroom-visit' });
        form.hidden = true;
        if (data.booked && slotField.value) {
          successCopy.textContent = 'You\u2019re booked for ' + fullLabel(slotField.value) + '. We\u2019ll text you a confirmation.';
        } else if (data.message) {
          successCopy.textContent = data.message;
        }
        successWrap.hidden = false;
        successWrap.classList.add('on');
      })
      .catch(function (err) {
        errorOut.textContent = err.message || 'Something went wrong. Please call or text the store.';
        errorOut.hidden = false;
      })
      .finally(function () {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.removeAttribute('aria-busy'); }
      });
  });
})();

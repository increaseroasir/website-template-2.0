/* Homepage UI: drawer, countdown, rails, FAQ, multi-step lead UX.
   Lead submit + Meta/GA4/Clarity fire through lead-form.js + tracking.js. */
(function () {
  if (!document.body.classList.contains('home-page')) return;

  var cfg = window.CLIENT_CONFIG || {};
  var offers = cfg.offers || {};
  var client = cfg.client || {};

  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  /* ---------- Drawer ---------- */
  var burger = qs('#burger');
  var drawer = qs('#drawer');
  /* The closed drawer is only moved off-screen (translateX(102%)), so without
     `inert` its links stay keyboard-focusable and remain in the accessibility
     tree — a screen-reader user tabs into an invisible menu (WTV-036).
     `inert` removes focus AND a11y-tree membership in one attribute; the
     aria-hidden mirror is kept for older engines. */
  function setDrawer(open) {
    if (!drawer || !burger) return;
    drawer.classList.toggle('open', open);
    drawer.setAttribute('aria-hidden', String(!open));
    drawer.toggleAttribute('inert', !open);
    burger.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  }
  if (burger && drawer) {
    setDrawer(false); /* initialize closed: markup ships without `inert` */
    burger.addEventListener('click', function () { setDrawer(!drawer.classList.contains('open')); });
    var closeBtn = qs('#drawerClose');
    if (closeBtn) closeBtn.addEventListener('click', function () { setDrawer(false); });
    qsa('a', drawer).forEach(function (a) { a.addEventListener('click', function () { setDrawer(false); }); });
    /* Escape closes and returns focus to the trigger. */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawer.classList.contains('open')) { setDrawer(false); burger.focus(); }
    });
  }

  /* ---------- Countdown ---------- */
  var endRaw = offers.endsAt || document.body.getAttribute('data-offer-ends') || '';
  var end = endRaw ? new Date(endRaw).getTime() : NaN;
  function tick() {
    if (!end || isNaN(end)) return;
    var t = Math.max(0, end - Date.now());
    var d = Math.floor(t / 864e5);
    var h = Math.floor(t % 864e5 / 36e5);
    var m = Math.floor(t % 36e5 / 6e4);
    var s = Math.floor(t % 6e4 / 1e3);
    function set(id, v) {
      var el = document.getElementById(id);
      if (el) el.textContent = String(v).padStart(2, '0');
    }
    ['mD', 'fD', 'cD'].forEach(function (id) { set(id, d); });
    ['mH', 'fH', 'cH'].forEach(function (id) { set(id, h); });
    ['mM', 'fM', 'cM'].forEach(function (id) { set(id, m); });
    set('cS', s);
  }
  if (end && !isNaN(end)) {
    tick();
    setInterval(tick, 1000);
  } else {
    /* Evergreen mode: no active offer deadline — hide countdown UI so no
       dead tiles / urgency theater render (styling handled in home.css). */
    document.body.classList.add('offer-static');
  }

  /* ---------- Sticky bar hide over lead ---------- */
  var mbar = qs('#mbar');
  var lead = qs('#lead');
  if (mbar && lead && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      mbar.classList.toggle('hide', entries[0] && entries[0].isIntersecting);
    }, { threshold: 0.15 }).observe(lead);
  }

  /* ---------- Rail dots ---------- */
  qsa('.rail-dots').forEach(function (nav) {
    var rail = document.getElementById(nav.getAttribute('data-for') || '');
    if (!rail) return;
    function rebuild() {
      nav.innerHTML = Array.prototype.map.call(rail.children, function (_, i) {
        return '<i class="' + (i === 0 ? 'on' : '') + '"></i>';
      }).join('');
    }
    rebuild();
    rail.addEventListener('scroll', function () {
      var first = rail.firstElementChild;
      if (!first) return;
      var w = first.getBoundingClientRect().width + 14;
      var dots = qsa('i', nav);
      var i = Math.min(dots.length - 1, Math.round(rail.scrollLeft / w));
      dots.forEach(function (d, x) { d.classList.toggle('on', x === i); });
    }, { passive: true });
    var mo = new MutationObserver(rebuild);
    mo.observe(rail, { childList: true });
  });

  /* ---------- FAQ ---------- */
  qsa('.faq button').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = btn.parentElement;
      var open = item.classList.contains('open');
      qsa('.faq').forEach(function (x) {
        x.classList.remove('open');
        var b = x.querySelector('button');
        if (b) b.setAttribute('aria-expanded', 'false');
      });
      if (!open) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* ---------- Scroll reveal ---------- */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    qsa('.reveal').forEach(function (el) { io.observe(el); });
  } else {
    qsa('.reveal').forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- Stat count-up (1400ms cubic ease-out, once at 40% visible) ---------- */
  (function () {
    var wrap = qs('.stats-grid');
    if (!wrap) return;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function run() {
      qsa('.stat b', wrap).forEach(function (el) {
        var text = el.textContent.trim();
        if (text.indexOf('{{') !== -1) return; /* un-replaced token — leave as-is */
        var m = text.match(/^([^0-9]*)([\d,]*\.?\d+)(.*)$/);
        if (!m) return; /* no digits — leave as-is */
        var prefix = m[1], suffix = m[3];
        var hasComma = m[2].indexOf(',') !== -1;
        var dec = (m[2].split('.')[1] || '').length;
        var target = parseFloat(m[2].replace(/,/g, ''));
        function fmt(v) {
          var out = dec ? v.toFixed(dec) : Math.round(v).toString();
          if (hasComma) out = Number(out).toLocaleString('en-US');
          el.textContent = prefix + out + suffix;
        }
        if (reduce || !('requestAnimationFrame' in window)) { fmt(target); return; }
        var dur = 1400, t0 = performance.now();
        function step(now) {
          var p = Math.min(1, (now - t0) / dur);
          var e = 1 - Math.pow(1 - p, 3);
          fmt(target * e);
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    }
    if ('IntersectionObserver' in window) {
      var io2 = new IntersectionObserver(function (entries) {
        if (entries[0] && entries[0].isIntersecting) { run(); io2.disconnect(); }
      }, { threshold: 0.4 });
      io2.observe(wrap);
    } else { run(); }
  })();

  /* ---------- Multi-step lead (submits via data-lead-form) ---------- */
  var form = qs('#leadForm');
  var state = { zip: '', product: '', when: '', visitType: '' };

  function showStep(n) {
    qsa('.fstep').forEach(function (s) {
      s.classList.toggle('on', s.getAttribute('data-step') === String(n));
    });
    for (var i = 1; i <= 3; i++) {
      var dot = document.getElementById('d' + i);
      if (dot) dot.classList.toggle('on', i <= n);
    }
  }

  function syncHidden() {
    if (!form) return;
    var product = state.product || 'Inventory Match';
    var message = [
      'Homepage lead',
      'Zip: ' + (state.zip || 'n/a'),
      'Product: ' + product,
      'Timeline: ' + (state.when || 'n/a'),
      'Visit preference: ' + (state.visitType || 'n/a')
    ].join(' | ');
    function set(name, value) {
      var field = form.querySelector('[name="' + name + '"]');
      if (field) field.value = value || '';
    }
    set('product_name', product);
    set('product_interest', product);
    set('message', message);
    set('form_intent', state.visitType === 'showroom' ? 'Schedule a visit' : 'Send price and availability');
    set('campaign', document.body.getAttribute('data-lead-campaign') || 'homepage');
    set('lead_source', document.body.getAttribute('data-lead-source') || 'homepage');
  }

  window.homeStepNext = function (from) {
    if (from === 1) {
      var zipEl = qs('#zip');
      var zip = zipEl ? zipEl.value.trim() : '';
      var ok = /^\d{5}$/.test(zip);
      var err = qs('#zipErr');
      if (err) err.classList.toggle('on', !ok);
      if (!ok) return;
      state.zip = zip;
      showStep(2);
      return;
    }
    if (from === 2) {
      var prodErr = qs('#prodErr');
      if (!state.product) {
        if (prodErr) prodErr.classList.add('on');
        return;
      }
      if (prodErr) prodErr.classList.remove('on');
      var when = qs('#when');
      state.when = when ? when.value : '';
      syncHidden();
      showStep(3);
    }
  };

  window.homeStepBack = function (n) { showStep(n); };

  var chips = qs('#prodChips');
  if (chips) {
    chips.addEventListener('click', function (e) {
      var btn = e.target.closest('.chip');
      if (!btn) return;
      qsa('.chip', chips).forEach(function (c) { c.classList.remove('sel'); });
      btn.classList.add('sel');
      state.product = btn.getAttribute('data-v') || '';
      var prodErr = qs('#prodErr');
      if (prodErr) prodErr.classList.remove('on');
      syncHidden();
    });
  }

  var visitType = qs('#visitType');
  if (visitType) {
    visitType.addEventListener('change', function (e) {
      state.visitType = e.target.value;
      var wrap = qs('#dateWrap');
      if (wrap) wrap.style.display = e.target.value === 'text' ? 'none' : 'block';
      syncHidden();
    });
  }

  window.homePrefill = function (product) {
    state.product = product || state.product;
    if (chips) {
      qsa('.chip', chips).forEach(function (c) {
        var sel = c.getAttribute('data-v') === state.product;
        c.classList.toggle('sel', sel);
      });
    }
    syncHidden();
    if (lead) lead.scrollIntoView({ behavior: 'smooth' });
    var zip = qs('#zip');
    if (zip) zip.focus({ preventScroll: true });
    if (typeof window.DealerTrackPricing === 'function') {
      window.DealerTrackPricing('home_product_cta', { productName: state.product });
    }
  };

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-home-prefill]');
    if (!btn) return;
    e.preventDefault();
    homePrefill(btn.getAttribute('data-home-prefill') || btn.getAttribute('data-product') || '');
  });

  if (form) {
    form.addEventListener('submit', function (e) {
      var nm = qs('#nm');
      var ph = qs('#ph');
      var em = qs('#em');
      var consent = qs('#tcpa');
      var name = nm ? nm.value.trim() : '';
      var phone = ph ? ph.value.trim() : '';
      var email = em ? em.value.trim() : '';
      var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      var ok = name && phone.replace(/\D/g, '').length >= 10 && emailOk && consent && consent.checked;
      var cErr = qs('#cErr');
      if (cErr) {
        cErr.textContent = !emailOk && email ? 'Add a valid email so we can follow up.' : 'Add your name, mobile number, email, and consent to continue.';
        cErr.classList.toggle('on', !ok);
      }
      if (!ok) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return;
      }
      var fullName = form.querySelector('[name="full_name"]');
      var phoneField = form.querySelector('[name="phone"]');
      var emailField = form.querySelector('[name="email"]');
      if (fullName) fullName.value = name;
      if (phoneField) phoneField.value = phone;
      if (emailField) emailField.value = email;
      state.visitType = visitType ? visitType.value : '';
      syncHidden();
    }, true);

    var result = form.querySelector('[data-template-result]');
    if (result && 'MutationObserver' in window) {
      new MutationObserver(function () {
        var text = (result.textContent || '').trim();
        if (!text) return;
        if (/thank you|received|already have/i.test(text)) {
          form.style.display = 'none';
          var dots = qs('.lead-card .fdots');
          var head = qs('.lead-head');
          var sub = qs('.lead-sub');
          if (dots) dots.style.display = 'none';
          if (head) head.style.display = 'none';
          if (sub) sub.style.display = 'none';
          var done = qs('#leadDone');
          if (done) done.classList.add('on');
        }
      }).observe(result, { childList: true, characterData: true, subtree: true });
    }
  }

  /* ---------- SMS click tracking (calls use call-tracking.js) ---------- */
  document.addEventListener('click', function (event) {
    var link = event.target.closest('a[href^="sms:"]');
    if (!link) return;
    var page = window.location.pathname || '/';
    if (typeof clarity === 'function') {
      clarity('event', 'sms_click');
      clarity('set', 'sms_click_page', page);
    }
    if (typeof gtag === 'function') {
      gtag('event', 'click_sms', { event_category: 'engagement', event_label: 'home_sms', page_path: page });
    }
    if (typeof fbq === 'function') fbq('track', 'Contact');
  }, true);

  /* ---------- Hydrate phone/config text nodes ---------- */
  qsa('[data-config]').forEach(function (el) {
    var path = el.getAttribute('data-config');
    var value = path.split('.').reduce(function (o, k) { return o && o[k]; }, cfg);
    if (value && String(value).indexOf('{{') === -1) el.textContent = value;
  });
  qsa('[data-config-href]').forEach(function (el) {
    var path = el.getAttribute('data-config-href');
    var value = path.split('.').reduce(function (o, k) { return o && o[k]; }, cfg);
    if (value && String(value).indexOf('{{') === -1) el.setAttribute('href', value);
  });

  syncHidden();
  showStep(1);
  if (window.DealerLeadForm && typeof window.DealerLeadForm.bindAll === 'function') {
    window.DealerLeadForm.bindAll();
  }
})();

/* Category page UI: nav, reveal, inventory count, sticky bar + Call→Directions swap. */
(function () {
  if (!document.body.classList.contains('category-page')) return;

  var cfg = window.CLIENT_CONFIG || {};
  var client = cfg.client || {};

  function initNav() {
    var hamburger = document.getElementById('navHamburger');
    var menu = document.getElementById('navMobileMenu');
    if (!hamburger || !menu) return;
    menu.toggleAttribute('inert', !menu.classList.contains('open'));
    hamburger.addEventListener('click', function () {
      var open = !menu.classList.contains('open');
      menu.classList.toggle('open', open);
      menu.toggleAttribute('inert', !open);
      hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    menu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        menu.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  function initActiveNav() {
    var path = (window.location.pathname || '').replace(/\/+$/, '') || '/';
    document.querySelectorAll('.nav-links a, .nav-mobile-menu > a').forEach(function (link) {
      var href = (link.getAttribute('href') || '').replace(/\/+$/, '');
      if (href && path.indexOf(href) === 0) {
        link.classList.add('nav-active');
      }
    });
  }

  function initReveal() {
    var nodes = document.querySelectorAll('.cat-reveal');
    if (!nodes.length) return;
    /* Hidden reveal state only applies once JS marks the body (no-JS shows everything) */
    document.body.classList.add('cat-js');
    if (!('IntersectionObserver' in window)) {
      nodes.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    nodes.forEach(function (el) { io.observe(el); });
  }

  function initInventoryCount() {
    var countEl = document.getElementById('catResultCount');
    var labelEl = document.getElementById('catResultLabel');
    if (!countEl) return;

    function update(count) {
      countEl.textContent = String(count);
      if (labelEl) {
        var singular = labelEl.getAttribute('data-singular') || 'model';
        var plural = labelEl.getAttribute('data-plural') || 'models';
        labelEl.textContent = count === 1 ? singular : plural;
      }
    }

    document.addEventListener('dealer:inventory-hydrated', function (event) {
      var detail = event.detail || {};
      if (typeof detail.count === 'number') update(detail.count);
    });
  }

  function initYear() {
    document.querySelectorAll('[data-current-year]').forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });
  }

  /* Sticky bottom bar + nav Call Us → Get Directions after hero CTAs leave view */
  function initStickyChrome() {
    var mbar = document.getElementById('catMbar');
    var heroCtas = document.getElementById('catHeroCtas');
    var navCta = document.getElementById('navStickyCta');
    var label = navCta ? navCta.querySelector('[data-nav-sticky-label]') : null;
    var callHref = (navCta && navCta.getAttribute('data-call-href')) || client.primaryPhoneHref || 'tel:';
    var mapHref = (navCta && navCta.getAttribute('data-map-href')) || client.mapUrl || '#';
    var callLabel = (navCta && navCta.getAttribute('data-call-label')) || 'Call Us 24/7';
    var mapLabel = (navCta && navCta.getAttribute('data-map-label')) || 'Get Directions';
    var pastHero = false;

    function resolveHref(raw, fallback) {
      if (!raw || /\{\{/.test(raw)) return fallback || raw || '#';
      return raw;
    }

    function setNavMode(directions) {
      if (!navCta) return;
      if (directions) {
        navCta.href = resolveHref(mapHref, client.mapUrl || '#');
        navCta.classList.add('is-directions');
        navCta.classList.remove('phone-link');
        navCta.removeAttribute('data-call-source');
        navCta.setAttribute('data-config-href', 'client.mapUrl');
        navCta.setAttribute('target', '_blank');
        navCta.setAttribute('rel', 'noopener');
        navCta.setAttribute('aria-label', mapLabel);
        if (label) label.textContent = mapLabel;
      } else {
        navCta.href = resolveHref(callHref, client.primaryPhoneHref || 'tel:');
        navCta.classList.remove('is-directions');
        navCta.classList.add('phone-link');
        navCta.setAttribute('data-call-source', 'header_call');
        navCta.setAttribute('data-config-href', 'client.primaryPhoneHref');
        navCta.removeAttribute('target');
        navCta.removeAttribute('rel');
        navCta.setAttribute('aria-label', callLabel);
        if (label) label.textContent = callLabel;
      }
    }

    function setPastHero(next) {
      if (pastHero === next) return;
      pastHero = next;
      if (mbar) {
        mbar.classList.toggle('is-visible', next);
        mbar.setAttribute('aria-hidden', next ? 'false' : 'true');
      }
      document.body.classList.toggle('cat-mbar-on', next);
      setNavMode(next);
    }

    setNavMode(false);

    if (!heroCtas || !('IntersectionObserver' in window)) {
      // Fallback: show after modest scroll so primary hero CTA stays alone above the fold
      var onScroll = function () {
        setPastHero(window.scrollY > Math.max(220, window.innerHeight * 0.45));
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      var entry = entries[0];
      if (!entry) return;
      // When hero CTA group is still on screen, keep bottom bar hidden and nav as Call
      setPastHero(!entry.isIntersecting);
    }, { threshold: 0, rootMargin: '0px 0px -8% 0px' });
    io.observe(heroCtas);
  }

  initNav();
  initActiveNav();
  initReveal();
  initInventoryCount();
  initYear();
  initStickyChrome();
})();

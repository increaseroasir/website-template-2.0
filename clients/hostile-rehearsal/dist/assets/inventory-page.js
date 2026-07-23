(function () {
  function collectCards() {
    return Array.from(document.querySelectorAll('#htGrid .ht-card, #invGrid .inv-card, #invGrid .ht-card'));
  }

  function getChecked(inputs) {
    return Array.from(inputs).filter(function (input) { return input.checked; }).map(function (input) { return input.value; });
  }

  function initNav() {
    var hamburger = document.getElementById('navHamburger');
    var menu = document.getElementById('navMobileMenu');
    if (hamburger && menu) {
      hamburger.addEventListener('click', function () {
        menu.classList.toggle('open');
      });
    }
  }

  function initFilters() {
    var filterToggle = document.getElementById('filterToggle');
    var advancedFilters = document.getElementById('advancedFilters');
    if (filterToggle && advancedFilters) {
      filterToggle.addEventListener('click', function () {
        advancedFilters.classList.toggle('open');
        filterToggle.setAttribute('aria-expanded', advancedFilters.classList.contains('open') ? 'true' : 'false');
      });
    }

    var categoryChecks = document.querySelectorAll('input[name="category"]');
    var seatChecks = document.querySelectorAll('input[name="seats"]');
    var priceSlider = document.getElementById('priceSlider');
    var priceDisplay = document.getElementById('priceDisplay');
    var resultCount = document.getElementById('resultCount');
    var resultCountDesktop = document.getElementById('resultCountDesktop');
    var noResults = document.getElementById('noResults');
    var inventorySearch = document.getElementById('inventorySearch');
    var inventorySort = document.getElementById('inventorySort');
    var htCount = document.getElementById('htResultCount');
    var htNoResults = document.getElementById('htNoResults');
    var htGrid = document.getElementById('htGrid');
    var invGrid = document.getElementById('invGrid');

    var categorySlugs = {
      'hot-tubs': 'hot-tub',
      'swim-spas': 'swim-spa',
      saunas: 'sauna'
    };
    var navCategorySlugs = {
      'HOT TUBS': 'hot-tubs',
      'SWIM SPAS': 'swim-spas',
      SAUNAS: 'saunas'
    };
    var urlCategoryFilter = null;

    function setNavActiveFromCategory(slug) {
      document.querySelectorAll('.nav-links a').forEach(function (link) {
        link.classList.remove('nav-active');
        if (slug && navCategorySlugs[link.textContent.trim()] === slug) {
          link.classList.add('nav-active');
        }
      });
    }

    function clearCategoryUrl() {
      urlCategoryFilter = null;
      if (window.history.replaceState) window.history.replaceState({}, '', '/inventory.html');
      setNavActiveFromCategory(null);
    }

    function applyCategoryFromUrl() {
      var params = new URLSearchParams(window.location.search);
      var slug = (params.get('category') || '').toLowerCase();
      urlCategoryFilter = categorySlugs[slug] || null;
      categoryChecks.forEach(function (checkbox) {
        checkbox.checked = urlCategoryFilter ? checkbox.value === urlCategoryFilter : false;
      });
      setNavActiveFromCategory(urlCategoryFilter ? slug : null);
    }

    function applyFilters() {
      var cards = collectCards();
      var cats = urlCategoryFilter ? [urlCategoryFilter] : getChecked(categoryChecks);
      var seats = getChecked(seatChecks);
      var maxMonthly = priceSlider ? parseInt(priceSlider.value, 10) : 500;
      var query = inventorySearch ? inventorySearch.value.trim().toLowerCase() : '';

      if (priceDisplay) {
        priceDisplay.textContent = maxMonthly >= 500 ? 'Any monthly payment' : 'Up to $' + maxMonthly + '/mo';
      }

      var visible = 0;
      var htVisible = 0;
      cards.forEach(function (card) {
        var isHotTub = card.classList.contains('ht-card') || card.getAttribute('data-category') === 'hot-tub';
        var catMatch = cats.length === 0 || cats.indexOf(card.getAttribute('data-category') || '') !== -1;
        var searchText = card.textContent.toLowerCase();
        var searchMatch = !query || searchText.indexOf(query) !== -1;
        var seatValue = card.getAttribute('data-seats') || 'any';
        var seatMatch = seats.length === 0 || seatValue === 'any' || seats.indexOf(seatValue) !== -1;
        var monthly = parseInt(card.getAttribute('data-monthly') || '9999', 10);
        var priceMatch = monthly <= maxMonthly;
        if (catMatch && seatMatch && priceMatch && searchMatch) {
          card.style.display = '';
          visible += 1;
          if (isHotTub) htVisible += 1;
        } else {
          card.style.display = 'none';
        }
      });

      if (resultCount) resultCount.textContent = String(visible);
      if (resultCountDesktop) resultCountDesktop.textContent = String(visible);
      if (noResults) noResults.classList.toggle('visible', visible === 0);
      if (htCount) htCount.textContent = String(htVisible);
      if (htNoResults) htNoResults.hidden = htVisible > 0;
    }

    function applySort() {
      if (!inventorySort) return;
      var cards = collectCards();
      var sortedHt = cards.filter(function (card) { return card.classList.contains('ht-card') || card.getAttribute('data-category') === 'hot-tub'; });
      var sortedOther = cards.filter(function (card) { return !(card.classList.contains('ht-card') || card.getAttribute('data-category') === 'hot-tub'); });
      var sortValue = inventorySort.value;

      function sortList(list) {
        list.sort(function (a, b) {
          if (sortValue === 'price-low') return parseInt(a.getAttribute('data-monthly') || '0', 10) - parseInt(b.getAttribute('data-monthly') || '0', 10);
          if (sortValue === 'price-high') return parseInt(b.getAttribute('data-monthly') || '0', 10) - parseInt(a.getAttribute('data-monthly') || '0', 10);
          if (sortValue === 'newest') return parseInt(b.getAttribute('data-original-order') || '0', 10) - parseInt(a.getAttribute('data-original-order') || '0', 10);
          return parseInt(a.getAttribute('data-original-order') || '0', 10) - parseInt(b.getAttribute('data-original-order') || '0', 10);
        });
        return list;
      }

      sortedHt = sortList(sortedHt);
      sortedOther = sortList(sortedOther);
      if (htGrid) sortedHt.forEach(function (card) { htGrid.appendChild(card); });
      if (invGrid) sortedOther.forEach(function (card) { invGrid.appendChild(card); });
    }

    function refreshInventory() {
      var cards = collectCards();
      cards.forEach(function (card, index) {
        if (!card.getAttribute('data-original-order')) card.setAttribute('data-original-order', String(index));
      });
      applySort();
      applyFilters();
    }

    window.refreshInventory = refreshInventory;

    categoryChecks.forEach(function (checkbox) {
      checkbox.addEventListener('change', function () {
        clearCategoryUrl();
        refreshInventory();
      });
    });
    seatChecks.forEach(function (checkbox) { checkbox.addEventListener('change', refreshInventory); });
    if (priceSlider) priceSlider.addEventListener('input', refreshInventory);
    if (inventorySearch) inventorySearch.addEventListener('input', refreshInventory);
    if (inventorySort) inventorySort.addEventListener('change', refreshInventory);

    function resetAll() {
      categoryChecks.forEach(function (checkbox) { checkbox.checked = false; });
      seatChecks.forEach(function (checkbox) { checkbox.checked = false; });
      if (priceSlider) priceSlider.value = 500;
      if (inventorySearch) inventorySearch.value = '';
      if (inventorySort) inventorySort.value = 'featured';
      clearCategoryUrl();
      refreshInventory();
    }

    var resetFilters = document.getElementById('resetFilters');
    var resetFilters2 = document.getElementById('resetFilters2');
    if (resetFilters) resetFilters.addEventListener('click', resetAll);
    if (resetFilters2) resetFilters2.addEventListener('click', resetAll);

    applyCategoryFromUrl();
    document.addEventListener('dealer:inventory-hydrated', function () {
      setTimeout(refreshInventory, 0);
    });
    setTimeout(refreshInventory, 50);
  }

  function initReveal() {
    if (!('IntersectionObserver' in window)) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var els = document.querySelectorAll('.ht-inventory-section, .ht-help-section');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
    els.forEach(function (el) {
      el.classList.add('reveal');
      io.observe(el);
    });
  }

  function initHelpCta() {
    var help = document.getElementById('htHelpCta');
    if (!help) return;
    help.addEventListener('click', function () {
      if (window.DealerGhlModal) window.DealerGhlModal.open(help.getAttribute('data-product') || 'Help Me Pick');
    });
  }

  function initLogoFallback() {
    document.querySelectorAll('.nav-logo img, .inventory-gate-logo, .footer-logo').forEach(function (img) {
      var src = (img.getAttribute('src') || '').trim();
      if (!src || src.indexOf('{{') !== -1) {
        img.style.display = 'none';
        var text = img.nextElementSibling;
        if (text && text.classList.contains('nav-logo-text')) text.hidden = false;
      }
      img.addEventListener('error', function () {
        img.style.display = 'none';
        var text = img.nextElementSibling;
        if (text && text.classList.contains('nav-logo-text')) text.hidden = false;
      });
    });
  }

  function boot() {
    initNav();
    initFilters();
    initReveal();
    initHelpCta();
    initLogoFallback();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();

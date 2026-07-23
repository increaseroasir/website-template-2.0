/* Template runtime: hydrate client config, D1 inventory, and lead-panel UI. */
(function(){
  const cfg = window.CLIENT_CONFIG || {};
  const get = path => path.split('.').reduce((o,k)=>o && o[k], cfg) || '';
  const money = value => Number(value || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  const clean = value => String(value || '').replace(/\{\{[^}]+\}\}/g, '').trim();
  const productUrl = product => '/active-inventory/' + encodeURIComponent(product.slug || '') + '/';
  const fallbackImage = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="960" height="640" viewBox="0 0 960 640"%3E%3Crect width="960" height="640" fill="%23071a40"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23d7b56d" font-family="Arial" font-size="42" font-weight="700"%3EInventory Photo%3C/text%3E%3C/svg%3E';
  const escapeHtml = value => clean(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);
  const escapeAttr = escapeHtml;
  const safeImageUrl = value => {
    const url = clean(value);
    if (!url) return fallbackImage;
    if (url.startsWith('/') || url.startsWith('data:image/')) return url;
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'https:' ? parsed.toString() : fallbackImage;
    } catch (err) {
      return fallbackImage;
    }
  };

  function applyBrandVar(key, cssVar) {
    const value = get(key);
    if (value && value.indexOf('{{') === -1) document.documentElement.style.setProperty(cssVar, value);
  }

  function hydrateConfig() {
    applyBrandVar('brand.primary', '--brand-blue');
    applyBrandVar('brand.deep', '--brand-blue-deep');
    applyBrandVar('brand.night', '--brand-blue-night');
    applyBrandVar('brand.accent', '--brand-gold');
    applyBrandVar('brand.urgent', '--brand-red');
    document.querySelectorAll('[data-config]').forEach(el => {
      const value = get(el.getAttribute('data-config'));
      if (value && value.indexOf('{{') === -1) el.textContent = value;
    });
    document.querySelectorAll('[data-config-href]').forEach(el => {
      const value = get(el.getAttribute('data-config-href'));
      if (value && value.indexOf('{{') === -1) el.setAttribute('href', value);
    });
    document.querySelectorAll('[data-config-src]').forEach(el => {
      const value = get(el.getAttribute('data-config-src'));
      if (value && value.indexOf('{{') === -1) el.setAttribute('src', value);
    });
    document.querySelectorAll('[data-current-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
  }

  function setHidden(form, name, value) {
    let field = form.querySelector('[name="' + name + '"]');
    if (!field) {
      field = document.createElement('input');
      field.type = 'hidden';
      field.name = name;
      form.appendChild(field);
    }
    field.value = value || '';
  }

  function fillLeadPanel(product) {
    const panel = document.querySelector('[data-lead-panel]');
    if (!panel) return;
    const forms = panel.querySelectorAll('form');
    forms.forEach(form => {
      setHidden(form, 'product_name', product.inventory_name || '');
      setHidden(form, 'product_slug', product.slug || '');
      setHidden(form, 'product_id', String(product.id || product.slug || ''));
      setHidden(form, 'product_category', product.category || '');
      setHidden(form, 'product_page_url', location.origin + productUrl(product));
      setHidden(form, 'product_image_url', product.primary_image || '');
      setHidden(form, 'inventory_status', product.status || '');
      setHidden(form, 'available_quantity', String(product.quantity || ''));
      setHidden(form, 'inventory_status_tag', (product.ghl_tags || []).find(tag => /^Inventory Status -/.test(tag)) || '');
      setHidden(form, 'lead_source', product.lead_source || document.body.getAttribute('data-lead-source') || '');
      setHidden(form, 'campaign', product.campaign || document.body.getAttribute('data-lead-campaign') || '');
      setHidden(form, 'model_interest_tag', 'Model Interest - ' + (product.inventory_name || 'Inventory'));
      setHidden(form, 'form_intent', 'Send price and availability');
    });
    if (window.DealerLeadForm && typeof window.DealerLeadForm.bindAll === 'function') window.DealerLeadForm.bindAll();
  }

  function bindLeadButtons(root = document) {
    root.querySelectorAll('[data-open-lead]').forEach(btn => {
      if (btn.dataset.openLeadBound === '1') return;
      btn.dataset.openLeadBound = '1';
      btn.addEventListener('click', () => {
        const panel = document.querySelector('[data-lead-panel]');
        if (!panel) return;
        const productJson = btn.getAttribute('data-product-json');
        let productName = btn.getAttribute('data-product') || 'Inventory Match';
        if (productJson) {
          try {
            const product = JSON.parse(productJson);
            fillLeadPanel(product);
            productName = product.inventory_name || productName;
          } catch (err) {}
        } else {
          const interest = panel.querySelector('[name="product_interest"], [name="product_name"]');
          if (interest) interest.value = productName;
        }
        if (window.DealerGhlModal && typeof window.DealerGhlModal.open === 'function') {
          window.DealerGhlModal.open(productName);
        } else {
          panel.hidden = false;
          panel.querySelector('input,select,textarea,button')?.focus();
        }
      });
    });
    root.querySelectorAll('[data-close-lead]').forEach(btn => {
      if (btn.dataset.closeLeadBound === '1') return;
      btn.dataset.closeLeadBound = '1';
      btn.addEventListener('click', () => {
        const panel = document.querySelector('[data-lead-panel]');
        if (panel) panel.hidden = true;
      });
    });
  }

  function renderCard(product) {
    const facts = Array.isArray(product.quick_facts) ? product.quick_facts : [];
    const article = document.createElement('article');
    article.className = 'product-card';
    article.setAttribute('data-product-card', '');
    article.innerHTML = [
      '<div class="availability-bar">' + escapeHtml(product.status || 'available').toUpperCase() + '</div>',
      '<div class="product-image"><img src="' + escapeAttr(safeImageUrl(product.primary_image)) + '" alt="' + escapeAttr(product.inventory_name || 'Inventory product') + '" loading="lazy"><span class="sale-badge">' + escapeHtml(product.promo_label || 'Available') + '</span></div>',
      '<div class="product-body">',
      '<h3>' + escapeHtml(product.inventory_name || 'Inventory Product') + '</h3>',
      '<div class="facts">' + facts.slice(0, 3).map(fact => '<span>' + escapeHtml(fact) + '</span>').join('') + '</div>',
      '<p>' + escapeHtml(product.delivery_promise || 'Ask for current local availability and delivery timing.') + '</p>',
      '<div class="price"><span>From</span><b>' + money(product.price) + '</b><span>' + (product.monthly_payment ? money(product.monthly_payment) + '/mo with approved credit' : 'Ask for payment options') + '</span></div>',
      '<div class="product-actions"><button class="btn btn-red" data-open-lead data-product="' + escapeAttr(product.inventory_name) + '">Get Today&apos;s Price</button><a class="btn btn-outline" href="' + escapeAttr(productUrl(product)) + '">View Details</a></div>',
      '</div>'
    ].join('');
    const leadButton = article.querySelector('[data-open-lead]');
    if (leadButton) leadButton.setAttribute('data-product-json', JSON.stringify(product));
    return article;
  }

  function renderHomeCard(product) {
    const facts = Array.isArray(product.quick_facts) ? product.quick_facts : [];
    const name = product.inventory_name || 'Inventory Product';
    const qty = Number(product.quantity || 0);
    const badge = product.promo_label || (qty > 0 ? qty + ' available' : (product.status || 'Available'));
    const article = document.createElement('article');
    article.className = 'pcard';
    article.setAttribute('data-product-card', '');
    article.innerHTML = [
      '<div class="pimg"><span class="badge">' + escapeHtml(badge) + '</span>',
      '<img src="' + escapeAttr(safeImageUrl(product.primary_image)) + '" alt="' + escapeAttr(name) + '" loading="lazy" decoding="async"></div>',
      '<div class="pbody">',
      '<h3>' + escapeHtml(name) + '</h3>',
      '<p class="spec">' + escapeHtml(facts.slice(0, 3).join(' · ') || 'Ask for specs') + '</p>',
      '<p class="why">' + escapeHtml(product.delivery_promise || product.card_summary || 'In stock — ask for today\'s local price.') + '</p>',
      '<div class="price-block"><span class="from">From</span><span class="num">' + money(product.price) + '</span>',
      (product.monthly_payment ? '<div class="mo">or as low as ' + money(product.monthly_payment) + '/mo*</div>' : ''),
      '</div>',
      '<button class="btn btn-gold" type="button" data-home-prefill="' + escapeAttr(name) + '" data-product="' + escapeAttr(name) + '" data-pricing-source="home_inventory_card">Get today\'s local price</button>',
      '</div>'
    ].join('');
    return article;
  }

  function categoryLabel(category) {
    const map = { 'hot-tub': 'Hot Tubs', 'swim-spa': 'Swim Spas', sauna: 'Saunas' };
    return map[category] || (category || 'Inventory');
  }

  function seatBucket(product) {
    const facts = Array.isArray(product.quick_facts) ? product.quick_facts.join(' ') : '';
    const hay = (product.inventory_name || '') + ' ' + facts;
    const match = hay.match(/(\d+)\s*[-–]?\s*(\d+)?\s*-?\s*person/i) || hay.match(/\b(\d+)\s*person/i);
    if (!match) return 'any';
    const n = Number(match[2] || match[1] || 0);
    if (n <= 3) return '2-3';
    if (n <= 5) return '4-5';
    if (n <= 7) return '6-7';
    return '8+';
  }

  function pillSvg(kind) {
    if (kind === 'people') return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>';
    if (kind === 'spark') return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M12 2v20M2 12h20"/></svg>';
    return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 9h18M9 21V9"/></svg>';
  }

  function renderInvCard(product) {
    const facts = Array.isArray(product.quick_facts) ? product.quick_facts : [];
    const name = product.inventory_name || 'Inventory Product';
    const badge = product.promo_label || categoryLabel(product.category);
    const monthly = Number(product.monthly_payment || 0);
    const price = Number(product.price || 0);
    const seats = seatBucket(product);
    const card = document.createElement('div');
    const isHotTub = product.category === 'hot-tub';
    card.className = isHotTub ? 'ht-card' : 'inv-card';
    card.setAttribute('data-product-card', '');
    card.setAttribute('data-category', product.category || '');
    card.setAttribute('data-seats', seats);
    card.setAttribute('data-monthly', String(monthly || 9999));
    card.setAttribute('data-price', String(price || 0));
    const pills = (facts.slice(0, 3).length ? facts.slice(0, 3) : [categoryLabel(product.category), 'In stock', 'Local delivery']).map((fact, index) => {
      const kind = index === 0 ? 'people' : (index === 1 ? 'spark' : 'brand');
      return '<div class="inv-pill">' + pillSvg(kind) + '<span>' + escapeHtml(fact) + '</span></div>';
    }).join('');
    const priceBox = price > 0
      ? '<div class="inv-price-box"><div class="inv-price-left"><p class="inv-card-price">' + money(price) + '</p>' + (monthly ? '<p class="inv-financing-label">Financing as low as</p>' : '') + '</div>' + (monthly ? '<p class="inv-card-monthly">' + money(monthly) + '/mo</p>' : '') + '</div>'
      : '<div class="inv-price-box inv-price-box--financing-only"><div class="inv-price-left"><p class="inv-financing-label">Financing As Low As</p></div>' + (monthly ? '<p class="inv-card-monthly">' + money(monthly) + '/mo</p>' : '<p class="inv-card-monthly">Ask</p>') + '</div>';
    card.innerHTML = [
      '<div class="inv-card-img"><span class="product-tag">' + escapeHtml(badge) + '</span>',
      '<img src="' + escapeAttr(safeImageUrl(product.primary_image)) + '" alt="' + escapeAttr(name) + '" loading="lazy" decoding="async"></div>',
      '<div class="inv-card-body"><div class="inv-card-top">',
      '<h2 class="inv-card-name">' + escapeHtml(name) + '</h2>',
      '<hr class="inv-card-divider">',
      '<div class="inv-card-pills">' + pills + '</div>',
      priceBox,
      '</div>',
      '<button type="button" class="inv-card-cta" data-open-lead data-product="' + escapeAttr(name) + '" data-pricing-source="inventory_card">See Local Price &amp; Availability <span class="inv-card-cta-arrow" aria-hidden="true">→</span></button>',
      '</div>'
    ].join('');
    const leadButton = card.querySelector('[data-open-lead]');
    if (leadButton) leadButton.setAttribute('data-product-json', JSON.stringify(product));
    return card;
  }

  async function hydrateInventoryGrids() {
    const grids = document.querySelectorAll('[data-inventory-source]');
    await Promise.all(Array.from(grids).map(async grid => {
      const source = grid.getAttribute('data-inventory-source');
      if (!source) return;
      const style = grid.getAttribute('data-card-style') || 'default';
      const filterMode = grid.getAttribute('data-inventory-filter') || '';
      const emptyCopy = grid.getAttribute('data-inventory-empty') || 'No public inventory yet.';
      try {
        const res = await fetch(source, { headers: { Accept: 'application/json' } });
        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.error || 'Inventory request failed');
        grid.innerHTML = '';
        let products = data.products || [];
        if (filterMode === 'exclude-hot-tub') {
          products = products.filter(product => product.category !== 'hot-tub');
        }
        if (!products.length) {
          if (style === 'home') {
            grid.innerHTML = '<div class="pcard"><div class="pbody"><h3>No public inventory yet</h3><p class="why">Add products in /admin to publish inventory on this page.</p></div></div>';
          } else if (style === 'inventory') {
            grid.innerHTML = '<p class="inv-no-results visible">' + escapeHtml(emptyCopy) + '</p>';
          } else {
            grid.innerHTML = '<div class="panel"><h3>No public inventory yet</h3><p>Add products in /admin to publish inventory on this page.</p></div>';
          }
          return;
        }
        const renderer = style === 'home' ? renderHomeCard : (style === 'inventory' ? renderInvCard : renderCard);
        products.forEach(product => grid.appendChild(renderer(product)));
        if (style !== 'home') bindLeadButtons(grid);
        document.querySelectorAll('[data-floor-count]').forEach(el => {
          el.textContent = String(products.length);
        });
        document.dispatchEvent(new CustomEvent('dealer:inventory-hydrated', { detail: { grid: grid, count: products.length, style: style } }));
      } catch (error) {
        if (style === 'home') {
          grid.innerHTML = '<div class="pcard"><div class="pbody"><h3>Inventory unavailable</h3><p class="why">Please call or text the store for current availability.</p></div></div>';
        } else if (style === 'inventory') {
          grid.innerHTML = '<p class="inv-no-results visible">Inventory unavailable. Please call or text the store.</p>';
        } else {
          grid.innerHTML = '<div class="panel"><h3>Inventory unavailable</h3><p>Please call or text the store for current availability.</p></div>';
        }
        console.error('Inventory render failed:', error);
      }
    }));
  }

  /* Scroll reveal for static below-the-fold section wraps on utility pages
     (SITE_MASTER_SPEC Law 5). Classes are added by JS so no-JS users see
     everything. Excluded: admin (recipe F), pages with their own reveal
     systems (home/category/inventory), JS-injected grids, and wraps holding
     position:sticky panels (transforms break sticky). */
  function initSectionReveals() {
    if (document.querySelector('.admin-shell')) return;
    if (document.body.classList.contains('home-page')) return;
    if (document.querySelector('.cat-reveal, .ht-inventory-section')) return;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    var wraps = Array.prototype.filter.call(
      document.querySelectorAll('main .section .wrap.grid'),
      function (el) {
        return !el.hasAttribute('data-inventory-source') &&
          !el.classList.contains('product-grid') &&
          !el.querySelector('.price-panel');
      }
    );
    if (!wraps.length) return;
    document.documentElement.classList.add('js');
    if (!('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    wraps.forEach(function (el) { el.classList.add('reveal'); io.observe(el); });
  }

  hydrateConfig();
  bindLeadButtons();
  hydrateInventoryGrids();
  initSectionReveals();
})();

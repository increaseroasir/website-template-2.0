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
        if (productJson) {
          try { fillLeadPanel(JSON.parse(productJson)); } catch (err) {}
        } else {
          const interest = panel.querySelector('[name="product_interest"], [name="product_name"]');
          if (interest) interest.value = btn.getAttribute('data-product') || 'Inventory Match';
        }
        panel.hidden = false;
        panel.querySelector('input,select,textarea,button')?.focus();
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

  async function hydrateInventoryGrids() {
    const grids = document.querySelectorAll('[data-inventory-source]');
    await Promise.all(Array.from(grids).map(async grid => {
      const source = grid.getAttribute('data-inventory-source');
      if (!source) return;
      try {
        const res = await fetch(source, { headers: { Accept: 'application/json' } });
        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.error || 'Inventory request failed');
        grid.innerHTML = '';
        const products = data.products || [];
        if (!products.length) {
          grid.innerHTML = '<div class="panel"><h3>No public inventory yet</h3><p>Add products in /admin to publish inventory on this page.</p></div>';
          return;
        }
        products.forEach(product => grid.appendChild(renderCard(product)));
        bindLeadButtons(grid);
      } catch (error) {
        grid.innerHTML = '<div class="panel"><h3>Inventory unavailable</h3><p>Please call or text the store for current availability.</p></div>';
        console.error('Inventory render failed:', error);
      }
    }));
  }

  hydrateConfig();
  bindLeadButtons();
  hydrateInventoryGrids();
})();

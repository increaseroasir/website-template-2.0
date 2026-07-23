(function () {
  function clean(value) {
    return String(value || '').replace(/\{\{[^}]+\}\}/g, '').trim();
  }

  function slugForPage() {
    var fromBody = clean(document.body.getAttribute('data-product-slug'));
    if (fromBody) return fromBody;
    var match = location.pathname.match(/\/active-inventory\/([^/]+)/);
    return match ? decodeURIComponent(match[1]) : '';
  }

  function money(value) {
    return Number(value || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  }

  function safeImageUrl(value) {
    var url = clean(value);
    if (!url) return '';
    if (url.charAt(0) === '/') return url;
    try {
      var parsed = new URL(url);
      return parsed.protocol === 'https:' ? parsed.toString() : '';
    } catch (err) {
      return '';
    }
  }

  function statusConfig(product) {
    var map = window.ActiveInventoryAvailabilityStatus || {};
    return map[(product && (product.inventoryStatus || product.status)) || 'available'] || map.available || {};
  }

  function setHidden(form, name, value) {
    var field = form.querySelector('[name="' + name + '"]');
    if (!field) { field = document.createElement('input'); field.type = 'hidden'; field.name = name; form.appendChild(field); }
    field.value = value || '';
  }

  function setText(selector, value) {
    var element = document.querySelector(selector);
    if (element && value) element.textContent = value;
  }

  function hydrateProductContent(product) {
    if (!product) return;
    var facts = Array.isArray(product.quick_facts) ? product.quick_facts : [];
    var image = document.querySelector('.hero-card img');
    document.title = product.inventory_name + ' | Inventory';
    setText('.hero h1', product.inventory_name);
    setText('.hero p', product.delivery_promise || 'Ask for current local pricing, availability, and delivery timing.');
    setText('.hero [data-open-lead].btn-gold', 'Get Today\'s Price');
    setText('.hero [data-open-lead].btn-outline', product.monthly_payment ? 'Ask About ' + money(product.monthly_payment) + '/mo' : 'Ask About Payments');
    setText('.section .grid.grid-2 h2', product.promo_label || 'Available Inventory');
    setText('.section .grid.grid-2 .lead', product.delivery_promise || 'This product is part of current public inventory.');
    setText('.section .panel h3', 'Current Price');
    var price = document.querySelector('.section .panel p:nth-of-type(1)');
    if (price) price.textContent = money(product.price);
    var payment = document.querySelector('.section .panel p:nth-of-type(2)');
    if (payment) payment.textContent = product.monthly_payment ? money(product.monthly_payment) + '/mo with approved credit' : 'Ask for payment options';
    document.querySelectorAll('.section.alt .panel').forEach(function (panel, index) {
      var fact = facts[index] || '';
      var title = panel.querySelector('h3');
      var copy = panel.querySelector('p');
      if (title) title.textContent = fact || ['Details', 'Delivery', 'Availability'][index] || 'Details';
      if (copy) copy.textContent = index === 0 ? (product.category || 'Inventory') : (index === 1 ? (product.delivery_promise || 'Ask for timing') : ('Status: ' + (product.status || 'available')));
    });
    setText('main > .section:last-of-type h2', product.inventory_name + ' Details');
    setText('main > .section:last-of-type .lead', product.delivery_promise || 'Contact the store for current details.');
    if (image && product.primary_image) {
      image.src = safeImageUrl(product.primary_image) || image.src;
      image.alt = product.inventory_name;
    }
    document.querySelectorAll('[data-open-lead]').forEach(function (button) {
      button.setAttribute('data-product', product.inventory_name || '');
      button.setAttribute('data-product-json', JSON.stringify(product));
    });
  }

  function hydrateProductForms(product) {
    var availability = statusConfig(product);
    document.querySelectorAll('[data-active-inventory-product-form], .ai-lead-form, [data-template-form]').forEach(function (form) {
      var pageUrl = location.href.split('#')[0];
      form.setAttribute('data-lead-success', 'inline');
      setHidden(form, 'product_name', product.inventory_name || '');
      setHidden(form, 'product_slug', product.slug || slugForPage());
      setHidden(form, 'product_id', String(product.id || product.slug || ''));
      setHidden(form, 'product_category', product.category || '');
      setHidden(form, 'product_page_url', pageUrl);
      setHidden(form, 'product_image_url', product.primary_image || '');
      setHidden(form, 'lead_source', product.lead_source || document.body.getAttribute('data-lead-source') || '');
      setHidden(form, 'campaign', product.campaign || document.body.getAttribute('data-lead-campaign') || '');
      setHidden(form, 'model_interest_tag', 'Model Interest - ' + (product.inventory_name || 'Inventory'));
      setHidden(form, 'inventory_status', product.status || '');
      setHidden(form, 'available_quantity', String(product.quantity || ''));
      setHidden(form, 'inventory_status_tag', availability.inventoryStatusTag || (product.ghl_tags || []).find(function (tag) { return /^Inventory Status -/.test(tag); }) || '');
      setHidden(form, 'form_intent', availability.formIntent || 'Send price and availability');
      setHidden(form, 'timestamp', new Date().toISOString());
      var submit = form.querySelector('[type="submit"]');
      if (submit && availability.formButton) submit.textContent = availability.formButton;
    });
    if (window.DealerLeadForm && typeof window.DealerLeadForm.bindAll === 'function') window.DealerLeadForm.bindAll();
  }

  /* Product JSON-LD — built from the exact data this page renders. Emits
     nothing when the fetch fails or the name is missing (never fabricate). */
  function emitProductSchema(product) {
    if (!product || !product.inventory_name) return;
    var data = { '@context': 'https://schema.org', '@type': 'Product', name: product.inventory_name };
    var image = safeImageUrl(product.primary_image);
    if (image) { try { data.image = [new URL(image, location.origin).toString()]; } catch (err) { /* skip bad URL */ } }
    if (product.category) data.category = product.category;
    var price = Number(product.price);
    if (price > 0) {
      var availability = {
        available: 'https://schema.org/InStock',
        pending: 'https://schema.org/LimitedAvailability',
        sold: 'https://schema.org/SoldOut'
      }[product.inventoryStatus || product.status] || 'https://schema.org/InStock';
      data.offers = { '@type': 'Offer', price: String(price), priceCurrency: 'USD', availability: availability, url: location.href.split('#')[0] };
    }
    var script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
  }

  async function loadProduct() {
    var slug = slugForPage();
    if (!slug || slug.toUpperCase() === 'SLUG') return;
    try {
      var res = await fetch('/api/inventory?slug=' + encodeURIComponent(slug), { headers: { Accept: 'application/json' } });
      var data = await res.json();
      var product = data && data.products && data.products[0];
      if (!res.ok || !product) throw new Error((data && data.error) || 'Product not found');
      hydrateProductContent(product);
      hydrateProductForms(product);
      emitProductSchema(product);
    } catch (error) {
      console.error('Product hydration failed:', error);
      document.querySelector('main')?.insertAdjacentHTML('afterbegin', '<section class="section"><div class="wrap panel"><h1>Product unavailable</h1><p>Please call or text the store for current inventory.</p></div></section>');
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loadProduct); else loadProduct();
})();

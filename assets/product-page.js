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
    /* Assigning a value with no matching <option> blanks a select (e.g. the
       availability-driven "Price Request" intent) — add it as a real option
       so the dropdown shows it and the form still posts the right intent. */
    if (field.tagName === 'SELECT' && value && field.value !== value) {
      field.appendChild(new Option(value, value, true, true));
      field.value = value;
    }
  }

  function setText(selector, value) {
    var element = document.querySelector(selector);
    if (element && value) element.textContent = value;
  }

  function categoryLabel(category) {
    var map = { 'hot-tub': 'Hot Tub', 'swim-spa': 'Swim Spa', sauna: 'Sauna' };
    return map[category] || 'Inventory';
  }

  /* Populates the Paradise-style sales layout (TVD-027). Every rich-content
     section stays hidden unless its product field has data — a sparse record
     still produces a complete, honest page. */
  function hydrateProductContent(product) {
    if (!product) return;
    var name = product.inventory_name || 'Inventory Product';
    var facts = Array.isArray(product.quick_facts) ? product.quick_facts.filter(Boolean) : [];
    document.title = (product.headline || name) + ' | In-Stock Inventory';
    /* Positioning label ("VALUE / FAMILY COMFORT") is the who-is-this-for hook;
       promo label and category are fallbacks so the kicker never sits empty. */
    setText('[data-pdp-kicker]', product.positioning_label || product.promo_label || (categoryLabel(product.category) + ' \u2014 In Stock'));
    setText('[data-pdp-headline]', product.headline || name);
    var model = document.querySelector('[data-pdp-model]');
    if (model && product.headline && product.headline !== name) {
      model.textContent = name;
      model.hidden = false;
    }
    setText('[data-pdp-herodesc]', product.hero_description || product.delivery_promise || 'Ask for current local pricing, availability, and delivery timing on this exact unit.');
    var image = document.querySelector('[data-pdp-image]');
    if (image && product.primary_image) {
      image.src = safeImageUrl(product.primary_image) || image.src;
      image.alt = name;
    }

    var factsGrid = document.querySelector('[data-pdp-facts-grid]');
    if (factsGrid && facts.length) {
      factsGrid.innerHTML = '';
      facts.slice(0, 8).forEach(function (fact) {
        var cell = document.createElement('div');
        cell.className = 'pdp-fact';
        var label = document.createElement('span');
        label.className = 'pdp-fact-label';
        label.textContent = fact;
        cell.appendChild(label);
        factsGrid.appendChild(cell);
      });
    }

    var whySection = document.querySelector('[data-pdp-why]');
    var whyList = document.querySelector('[data-pdp-why-list]');
    var bullets = Array.isArray(product.why_bullets) ? product.why_bullets.filter(Boolean) : [];
    if (whySection && whyList && bullets.length) {
      whyList.innerHTML = '';
      bullets.slice(0, 6).forEach(function (bullet) {
        var item = document.createElement('li');
        item.textContent = bullet;
        whyList.appendChild(item);
      });
      whySection.hidden = false;
    }

    var aboutSection = document.querySelector('[data-pdp-about]');
    if (aboutSection && product.long_description) {
      setText('[data-pdp-about-title]', 'About the ' + name);
      setText('[data-pdp-about-copy]', product.long_description);
      aboutSection.hidden = false;
    }

    var bestForSection = document.querySelector('[data-pdp-bestfor]');
    if (bestForSection && product.best_for) {
      setText('[data-pdp-bestfor-copy]', product.best_for);
      bestForSection.hidden = false;
    }

    var hasPrice = Number(product.price || 0) > 0;
    setText('[data-pdp-price-label]', hasPrice ? 'Current Price' : 'Today\u2019s Local Price');
    var priceEl = document.querySelector('[data-pdp-price]');
    if (priceEl) {
      /* No price on record → never print "$0"; drive the price request instead */
      priceEl.textContent = hasPrice ? money(product.price) : 'Ask \u2014 we\u2019ll text it back';
      priceEl.classList.toggle('pdp-price--ask', !hasPrice);
    }
    var monthlyEl = document.querySelector('[data-pdp-monthly]');
    if (monthlyEl && product.monthly_payment) {
      monthlyEl.textContent = 'or as low as ' + money(product.monthly_payment) + '/mo with approved credit';
      monthlyEl.hidden = false;
    }
    var status = product.inventoryStatus || product.status || 'available';
    var availabilityEl = document.querySelector('[data-pdp-availability]');
    if (availabilityEl) {
      if (status === 'available') {
        /* Live scarcity line: pulsing dot + real stock count (never invented) */
        var qty = parseInt(product.quantity, 10);
        var qtyLabel;
        if (qty === 1) qtyLabel = 'Only <b>1</b> left in stock';
        else if (qty >= 2 && qty <= 3) qtyLabel = 'Only <b>' + qty + '</b> in stock';
        else if (qty >= 4) qtyLabel = '<b>' + qty + '</b> in stock';
        else qtyLabel = 'In stock now';
        availabilityEl.classList.add('pdp-availability--live');
        availabilityEl.innerHTML = '<span class="pdp-live" aria-hidden="true"></span><span>' + qtyLabel + ' \u2014 availability can change without notice</span>';
      } else {
        var availabilityCopy = {
          pending: 'This unit is pending sale \u2014 ask about it or similar in-stock models.',
          sold: 'This unit has sold \u2014 ask about similar in-stock models.'
        };
        availabilityEl.textContent = availabilityCopy[status] || '';
      }
    }
    /* Paradise-style status callout: pending/sold units get a prominent box in
       the price card so the visitor knows exactly what happens next. */
    var statusNote = document.querySelector('[data-pdp-status]');
    if (statusNote) {
      var statusCallouts = {
        pending: { title: 'This unit is pending pickup', copy: 'Availability may reopen. Submit a backup inquiry and we\u2019ll contact you first if it frees up.' },
        sold: { title: 'This exact unit recently sold', copy: 'Join the restock list \u2014 we\u2019ll text you when the next one lands and shortlist similar in-stock models.' }
      };
      var callout = statusCallouts[status];
      if (callout) {
        setText('[data-pdp-status-title]', callout.title);
        setText('[data-pdp-status-copy]', callout.copy);
        statusNote.hidden = false;
      }
    }
    /* Status-driven CTA labels (product-data.js): available units push the
       out-the-door price; pending/sold swap to backup/restock intent. */
    var availability = statusConfig(product);
    if (availability.formButton) {
      document.querySelectorAll('[data-pdp-cta]').forEach(function (cta) { cta.textContent = availability.formButton; });
    }
    setText('[data-pdp-selected]', name);
    document.querySelectorAll('[data-open-lead]').forEach(function (button) {
      button.setAttribute('data-product', name);
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
    var description = product.hero_description || product.long_description;
    if (description) data.description = description;
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

  /* Sticky mobile CTA bar: appears once the hero (with its own CTA) scrolls
     away, hides while the lead form is on screen so it never covers it. */
  function initStickyBar() {
    var bar = document.querySelector('[data-pdp-mbar]');
    var hero = document.querySelector('.pdp-hero');
    var formSection = document.querySelector('#get-price');
    if (!bar || !hero || !('IntersectionObserver' in window)) return;
    bar.hidden = false;
    var heroGone = false;
    var formVisible = false;
    function update() { bar.classList.toggle('show', heroGone && !formVisible); }
    new IntersectionObserver(function (entries) {
      heroGone = !entries[0].isIntersecting;
      update();
    }).observe(hero);
    if (formSection) {
      new IntersectionObserver(function (entries) {
        formVisible = entries[0].isIntersecting;
        update();
      }, { threshold: 0.2 }).observe(formSection);
    }
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
      initStickyBar();
    } catch (error) {
      console.error('Product hydration failed:', error);
      document.querySelector('main')?.insertAdjacentHTML('afterbegin', '<section class="section"><div class="wrap panel"><h1>Product unavailable</h1><p>Please call or text the store for current inventory.</p></div></section>');
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loadProduct); else loadProduct();
})();

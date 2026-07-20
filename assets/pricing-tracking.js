(function () {
  function getPricingSource(element) {
    if (!element) return 'lead_form';
    if (element.getAttribute('data-pricing-source')) return element.getAttribute('data-pricing-source');
    if (element.classList.contains('btn-red')) return 'primary_price_cta';
    if (element.classList.contains('product-card')) return 'inventory_card';
    if (element.getAttribute('data-product')) return 'product_cta';
    return (element.textContent || '').trim().slice(0, 40) || 'pricing_button';
  }
  function trackPricingClick(source, extra) {
    var page = window.location.pathname || '/';
    extra = extra || {};
    if (typeof clarity === 'function') {
      clarity('event', 'pricing_click');
      clarity('set', 'pricing_click_source', source);
      clarity('set', 'pricing_click_page', page);
    }
    if (typeof gtag === 'function') {
      gtag('event', 'pricing_click', { click_source: source, page_path: page, product_name: extra.productName || undefined });
    }
  }
  window.DealerTrackPricing = trackPricingClick;
  document.addEventListener('click', function (event) {
    var target = event.target.closest('[data-open-lead], [data-product], a[href*="open=price"]');
    if (!target) return;
    trackPricingClick(getPricingSource(target), { productName: target.getAttribute('data-product') || target.getAttribute('data-product-name') || '' });
  }, true);
})();

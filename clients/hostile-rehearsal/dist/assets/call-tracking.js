(function () {
  function getClickSource(link) {
    if (link.getAttribute('data-call-source')) return link.getAttribute('data-call-source');
    if (link.classList.contains('phone-link')) return 'header_phone';
    if (link.classList.contains('footer-phone-badge')) return 'footer_phone';
    if (link.classList.contains('contact-phone-link')) return 'contact_page_phone';
    if (link.classList.contains('product-phone-link')) return 'product_detail_phone';
    return link.getAttribute('aria-label') || 'phone_link';
  }
  function trackCallClick(link) {
    var source = getClickSource(link);
    var page = window.location.pathname || '/';
    if (typeof clarity === 'function') {
      clarity('event', 'call_click');
      clarity('set', 'call_click_source', source);
      clarity('set', 'call_click_page', page);
    }
    if (typeof gtag === 'function') {
      gtag('event', 'click_call', { event_category: 'engagement', event_label: source, page_path: page });
    }
    if (typeof fbq === 'function') fbq('track', 'Contact');
  }
  document.addEventListener('click', function (event) {
    var link = event.target.closest('a[href^="tel:"]');
    if (link) trackCallClick(link);
  }, true);
})();

/* seo-schema.js — emits JSON-LD built ONLY from content the page actually
   renders. Never fabricates data: blocks with missing/unhydrated ({{token}})
   text are skipped, and pages without the relevant blocks emit nothing.
   Product schema for detail pages lives in product-page.js (it owns the
   inventory data). */
(function () {
  function clean(value) { return String(value || '').replace(/\s+/g, ' ').trim(); }
  function usable(value) { return !!value && value.indexOf('{{') === -1; }
  function emit(data) {
    var script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
  }

  function run() {
    /* FAQPage — any page carrying the .faq accordion blocks */
    var faqs = [];
    document.querySelectorAll('.faq').forEach(function (el) {
      var q = clean(el.querySelector('button') && el.querySelector('button').textContent);
      var a = clean(el.querySelector('.ans') && el.querySelector('.ans').textContent);
      if (usable(q) && usable(a)) faqs.push({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } });
    });
    if (faqs.length) emit({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs });

    /* BreadcrumbList — category pages and product detail pages only */
    var path = location.pathname;
    var origin = location.origin;
    var h1 = clean(document.querySelector('h1') && document.querySelector('h1').textContent);
    if (!usable(h1)) return;
    var category = path.match(/^\/(hot-tubs|swim-spas|saunas)\/(index\.html)?$/);
    if (category) {
      emit({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: origin + '/' },
        { '@type': 'ListItem', position: 2, name: h1, item: origin + '/' + category[1] + '/' }
      ] });
    } else if (/^\/active-inventory\/[^/]+\/(index\.html)?$/.test(path)) {
      emit({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: origin + '/' },
        { '@type': 'ListItem', position: 2, name: 'Inventory', item: origin + '/active-inventory/' },
        { '@type': 'ListItem', position: 3, name: h1, item: origin + path }
      ] });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
})();

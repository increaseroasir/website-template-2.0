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

    /* LocalBusiness — homepage only, and only from values the page already
       shows. Opening hours and aggregateRating are deliberately omitted: the
       hours token is free-form prose that cannot be parsed into
       openingHoursSpecification reliably across clients, and there is no
       structured review count on the page. Guessing either would be the kind
       of fabrication this file exists to avoid. */
    if (/^\/(index\.html)?$/.test(location.pathname)) {
      var text = function (sel) {
        var el = document.querySelector(sel);
        return clean(el && el.textContent);
      };
      var bizName = text('[data-config="client.name"]');
      if (usable(bizName)) {
        var biz = { '@context': 'https://schema.org', '@type': 'LocalBusiness', name: bizName };

        var canonical = document.querySelector('link[rel="canonical"]');
        if (canonical && usable(canonical.getAttribute('href'))) biz.url = canonical.href;

        var ogImage = document.querySelector('meta[property="og:image"]');
        if (ogImage && usable(ogImage.getAttribute('content'))) biz.image = ogImage.getAttribute('content');

        var tel = document.querySelector('a[href^="tel:"]');
        if (tel) {
          var phone = clean(tel.getAttribute('href').replace(/^tel:/, ''));
          if (usable(phone)) biz.telephone = phone;
        }

        var addr = text('[data-config="client.address"]');
        if (usable(addr)) {
          /* "12473 Woodside Ave, Suite C, Lakeside, CA 92040" splits cleanly on
             a trailing "<locality>, <ST> <ZIP>". Anything that does not match
             is passed through whole rather than mis-split. */
          var parts = addr.match(/^(.*),\s*([^,]+),\s*([A-Za-z]{2})\s+(\d{5})(?:-\d{4})?$/);
          biz.address = parts
            ? { '@type': 'PostalAddress', streetAddress: clean(parts[1]), addressLocality: clean(parts[2]), addressRegion: parts[3].toUpperCase(), postalCode: parts[4] }
            : { '@type': 'PostalAddress', streetAddress: addr };
        }

        var social = document.querySelector('a[href*="facebook.com"], a[href*="instagram.com"]');
        if (social) biz.sameAs = [social.href];

        emit(biz);
      }
    }

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

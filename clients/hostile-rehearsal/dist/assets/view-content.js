(function () {
  if (typeof fbq !== 'function') return;
  function normalize(path) { path = (path || '/').replace(/\/index\.html$/i, ''); return path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path || '/'; }
  function titleFallback() { return (document.title || '').replace(/\s*\|.*$/, '').replace(/\s*—.*$/, '').trim(); }
  function run() { var body = document.body; if (!body) return; var name = body.getAttribute('data-meta-view-content') || titleFallback() || normalize(location.pathname); var category = body.getAttribute('data-meta-view-category') || (normalize(location.pathname).includes('inventory') ? 'catalog' : 'website'); fbq('track', 'ViewContent', { content_name: name, content_category: category }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
})();

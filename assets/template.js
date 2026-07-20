/* Template runtime: hydrate config placeholders and template UI. Production should replace template inventory with /api/inventory from D1. */
(function(){
  const cfg = window.CLIENT_CONFIG || {};
  const get = path => path.split('.').reduce((o,k)=>o && o[k], cfg) || '';
  const applyBrandVar = (key, cssVar) => {
    const value = get(key);
    if (value && value.indexOf('{{') === -1) document.documentElement.style.setProperty(cssVar, value);
  };
  applyBrandVar('brand.primary', '--brand-blue');
  applyBrandVar('brand.deep', '--brand-blue-deep');
  applyBrandVar('brand.night', '--brand-blue-night');
  applyBrandVar('brand.accent', '--brand-gold');
  applyBrandVar('brand.urgent', '--brand-red');
  document.querySelectorAll('[data-config]').forEach(el => {
    const value = get(el.getAttribute('data-config'));
    if (value) el.textContent = value;
  });
  document.querySelectorAll('[data-config-href]').forEach(el => {
    const value = get(el.getAttribute('data-config-href'));
    if (value) el.setAttribute('href', value);
  });
  document.querySelectorAll('[data-current-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
  document.querySelectorAll('[data-open-lead]').forEach(btn => btn.addEventListener('click', () => {
    const product = btn.getAttribute('data-product') || 'Inventory Match';
    const panel = document.querySelector('[data-lead-panel]');
    if (!panel) return;
    const interest = panel.querySelector('[name="product_interest"]');
    if (interest) interest.value = product;
    panel.hidden = false;
    panel.querySelector('input,select,textarea,button')?.focus();
  }));
  document.querySelectorAll('[data-close-lead]').forEach(btn => btn.addEventListener('click', () => {
    const panel = document.querySelector('[data-lead-panel]');
    if (panel) panel.hidden = true;
  }));
})();

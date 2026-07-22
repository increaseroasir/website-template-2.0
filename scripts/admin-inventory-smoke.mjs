const publicStatuses = new Set(['available', 'pending', 'sold']);
const adminStatuses = new Set(['draft', 'available', 'pending', 'sold', 'hidden', 'deleted']);
const categories = new Set(['hot-tub', 'swim-spa', 'sauna']);
const failures = [];
const warnings = [];

function arg(name) {
  const prefix = '--' + name + '=';
  const found = process.argv.find(item => item.startsWith(prefix));
  return found ? found.slice(prefix.length) : '';
}

function fail(message) {
  failures.push(message);
}

function warn(message) {
  warnings.push(message);
}

function baseUrl() {
  const value = arg('url') || process.env.LAUNCH_CHECK_URL || process.env.ADMIN_SMOKE_URL;
  if (!value) throw new Error('Set --url=https://preview.example.com or LAUNCH_CHECK_URL.');
  return value.replace(/\/$/, '');
}

async function jsonFetch(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.body && !(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {})
    }
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok || data.ok === false) {
    throw new Error(url + ' returned ' + res.status + ': ' + (data.error || data.message || text));
  }
  return data;
}

function validateProduct(product, source) {
  if (!product.slug) fail(source + ' product missing slug.');
  if (!product.inventory_name) fail(source + ' product missing inventory_name.');
  if (!categories.has(product.category)) fail(source + ' product has invalid category: ' + product.category);
  if (!adminStatuses.has(product.status)) fail(source + ' product has invalid status: ' + product.status);
  if (publicStatuses.has(product.status)) {
    if (!product.primary_image) fail(source + ' public product missing primary_image: ' + product.slug);
    if (!Array.isArray(product.quick_facts) || product.quick_facts.length === 0) warn(source + ' public product has no quick_facts: ' + product.slug);
    if (!Array.isArray(product.ghl_tags) || product.ghl_tags.length === 0) warn(source + ' public product has no product-specific ghl_tags: ' + product.slug);
  }
}

async function login(base) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    warn('ADMIN_PASSWORD not available locally, so /admin authenticated checks were skipped.');
    return '';
  }
  const data = await jsonFetch(base + '/api/admin?action=login', {
    method: 'POST',
    body: JSON.stringify({ password })
  });
  if (!data.token) throw new Error('/api/admin login did not return a token.');
  return data.token;
}

async function checkProductPage(base, product) {
  const res = await fetch(base + '/active-inventory/' + encodeURIComponent(product.slug) + '/', {
    headers: { 'User-Agent': 'IncreaseROASAdminSmoke/1.0' }
  });
  if (!res.ok) {
    fail('Product detail page failed for ' + product.slug + ': HTTP ' + res.status);
    return;
  }
  const text = await res.text();
  if (/\{\{[^}]+\}\}/.test(text)) fail('Product detail page has unresolved placeholders for ' + product.slug);
}

async function mutateSmokeProduct(base, token) {
  if (!token || (process.env.ADMIN_SMOKE_MUTATE !== '1' && !process.argv.includes('--mutate'))) return;
  const slug = 'smoke-test-' + Date.now();
  await jsonFetch(base + '/api/admin', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token },
    body: JSON.stringify({
      inventory_name: 'Smoke Test Hidden Product',
      slug,
      category: 'hot-tub',
      status: 'hidden',
      price: 1,
      monthly_payment: 1,
      quantity: 1,
      primary_image: 'https://example.com/smoke-test-product.webp',
      quick_facts: ['Smoke test'],
      ghl_tags: ['Smoke Test'],
      promo_label: 'Hidden',
      delivery_promise: 'Hidden smoke test product',
      sort_order: 9999,
      featured: false
    })
  });
  await jsonFetch(base + '/api/admin', {
    method: 'PATCH',
    headers: { Authorization: 'Bearer ' + token },
    body: JSON.stringify({ slug, status: 'hidden' })
  });
  await jsonFetch(base + '/api/admin?slug=' + encodeURIComponent(slug), {
    method: 'DELETE',
    headers: { Authorization: 'Bearer ' + token }
  });
}

const base = baseUrl();
const publicInventory = await jsonFetch(base + '/api/inventory');
if (!Array.isArray(publicInventory.products)) fail('/api/inventory did not return products array.');
if (!publicInventory.products?.length) warn('/api/inventory returned zero public products. This may be OK before inventory entry, but it should block final launch for inventory-driven campaigns.');
for (const product of publicInventory.products || []) validateProduct(product, 'public inventory');
if (publicInventory.products?.[0]) await checkProductPage(base, publicInventory.products[0]);

const token = await login(base);
if (token) {
  const adminInventory = await jsonFetch(base + '/api/admin', { headers: { Authorization: 'Bearer ' + token } });
  if (!Array.isArray(adminInventory.products)) fail('/api/admin did not return products array.');
  for (const product of adminInventory.products || []) validateProduct(product, 'admin inventory');
  await mutateSmokeProduct(base, token);
}

if (warnings.length) {
  console.warn('Warnings:');
  for (const warning of warnings) console.warn('- ' + warning);
}

if (failures.length) {
  console.error('Admin/inventory smoke failed:');
  for (const failure of failures) console.error('- ' + failure);
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  url: base,
  publicProductsChecked: publicInventory.products?.length || 0,
  adminChecked: Boolean(token),
  mutationChecked: Boolean(token && (process.env.ADMIN_SMOKE_MUTATE === '1' || process.argv.includes('--mutate')))
}, null, 2));

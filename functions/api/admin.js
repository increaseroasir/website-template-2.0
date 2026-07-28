import { corsHeaders, jsonResponse } from '../lib/cors.js';
const CATEGORIES = new Set(['hot-tub', 'swim-spa', 'sauna']);
const STATUSES = new Set(['draft', 'available', 'pending', 'sold', 'hidden']);
const PATCH_STATUSES = new Set(['draft', 'available', 'pending', 'sold', 'hidden', 'deleted']);
const IMAGE_TYPES = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
  ['image/gif', '.gif']
]);
const MAX_IMAGE_BYTES = 6 * 1024 * 1024;
async function sha256(value) { const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)); return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join(''); }
function slugify(value) { return String(value || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 90); }
function parseJson(value, fallback) { try { return value ? JSON.parse(value) : fallback; } catch (err) { return fallback; } }
function cleanText(value, max = 180) { return String(value || '').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, max); }
function cleanArray(value, maxItems = 12, itemMax = 120) {
  return (Array.isArray(value) ? value : [])
    .map(item => cleanText(item, itemMax))
    .filter(Boolean)
    .slice(0, maxItems);
}
function numberInRange(value, min, max) {
  const number = Number(value || 0);
  if (!Number.isFinite(number)) return min;
  return Math.max(min, Math.min(max, Math.round(number)));
}
function cleanImageUrl(value) {
  const url = cleanText(value, 600);
  if (!url) return '';
  if (url.startsWith('/')) return url;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' ? parsed.toString() : '';
  } catch (err) {
    return '';
  }
}
function publicUrl(env, key) {
  const base = env.R2_PUBLIC_BASE_URL || (env.R2_PUBLIC_BUCKET_ID ? 'https://pub-' + env.R2_PUBLIC_BUCKET_ID + '.r2.dev' : '');
  return base ? base.replace(/\/$/, '') + '/' + key : key;
}
function normalizeProduct(row) {
  return Object.assign({}, row, {
    gallery_images: parseJson(row.gallery_images, []),
    quick_facts: parseJson(row.quick_facts, []),
    ghl_tags: parseJson(row.ghl_tags, []),
    why_bullets: parseJson(row.why_bullets, [])
  });
}
function validateProduct(body) {
  const slug = slugify(body.slug || body.inventory_name);
  const inventoryName = cleanText(body.inventory_name, 140);
  const category = cleanText(body.category, 40);
  const status = cleanText(body.status || 'draft', 40);
  if (!slug || !inventoryName) return { ok: false, error: 'Product name and a valid slug are required.' };
  if (!CATEGORIES.has(category)) return { ok: false, error: 'Invalid category. Use hot-tub, swim-spa, or sauna.' };
  if (!STATUSES.has(status)) return { ok: false, error: 'Invalid status. Use draft, available, pending, sold, or hidden.' };
  return {
    ok: true,
    product: {
      slug,
      inventory_name: inventoryName,
      category,
      price: numberInRange(body.price, 0, 999999),
      monthly_payment: numberInRange(body.monthly_payment, 0, 99999),
      status,
      quantity: numberInRange(body.quantity, 0, 999),
      primary_image: cleanImageUrl(body.primary_image),
      gallery_images: cleanArray(body.gallery_images, 20, 600).map(cleanImageUrl).filter(Boolean),
      quick_facts: cleanArray(body.quick_facts, 8, 90),
      ghl_tags: cleanArray(body.ghl_tags, 30, 100),
      promo_label: cleanText(body.promo_label, 80),
      delivery_promise: cleanText(body.delivery_promise, 220),
      /* Product-detail content (TVD-027): fuels the Paradise-style sales page.
         All optional — the page hides sections whose field is empty. */
      headline: cleanText(body.headline, 140),
      hero_description: cleanText(body.hero_description, 320),
      why_bullets: cleanArray(body.why_bullets, 6, 220),
      long_description: cleanText(body.long_description, 1400),
      best_for: cleanText(body.best_for, 220),
      sort_order: numberInRange(body.sort_order, -9999, 9999),
      featured: body.featured ? 1 : 0
    }
  };
}
async function requireSession(env, request) {
  if (!env.ADMIN_SESSION_SECRET) return null;
  const auth = request.headers.get('Authorization') || '';
  const token = auth.replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const tokenHash = await sha256(token + (env.ADMIN_SESSION_SECRET || ''));
  const row = await env.DB.prepare('SELECT * FROM admin_sessions WHERE token_hash = ? AND expires_at > ?').bind(tokenHash, Date.now()).first();
  return row;
}
export async function onRequestOptions(context) { return new Response(null, { status: 204, headers: corsHeaders(context.env, context.request) }); }
export async function onRequestPost(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  if (url.searchParams.get('action') === 'login') {
    const body = await request.json().catch(() => ({}));
    if (!env.ADMIN_PASSWORD || !env.ADMIN_SESSION_SECRET) return jsonResponse({ ok: false, error: 'Admin is not configured.' }, 503, env, request);
    if (body.password !== env.ADMIN_PASSWORD) return jsonResponse({ ok: false, error: 'Invalid password.' }, 401, env, request);
    const token = crypto.randomUUID() + crypto.randomUUID();
    const tokenHash = await sha256(token + (env.ADMIN_SESSION_SECRET || ''));
    await env.DB.prepare('DELETE FROM admin_sessions WHERE expires_at <= ?').bind(Date.now()).run();
    await env.DB.prepare('INSERT INTO admin_sessions (token_hash, created_at, expires_at) VALUES (?, ?, ?)').bind(tokenHash, Date.now(), Date.now() + 7 * 24 * 60 * 60 * 1000).run();
    return jsonResponse({ ok: true, token }, 200, env, request);
  }
  const session = await requireSession(env, request);
  if (!session) return jsonResponse({ ok: false, error: 'Unauthorized.' }, 401, env, request);

  if (url.searchParams.get('action') === 'upload') {
    if (!env.PRODUCT_IMAGES) return jsonResponse({ ok: false, error: 'PRODUCT_IMAGES bucket is not bound.' }, 503, env, request);
    const form = await request.formData();
    const file = form.get('image');
    if (!file || typeof file.arrayBuffer !== 'function') return jsonResponse({ ok: false, error: 'Image file is required.' }, 400, env, request);
    const contentType = file.type || 'application/octet-stream';
    const extension = IMAGE_TYPES.get(contentType);
    if (!extension) return jsonResponse({ ok: false, error: 'Only JPG, PNG, WEBP, and GIF images are allowed.' }, 400, env, request);
    if (file.size && file.size > Number(env.MAX_PRODUCT_IMAGE_BYTES || MAX_IMAGE_BYTES)) return jsonResponse({ ok: false, error: 'Image is too large.' }, 400, env, request);
    const originalName = file.name || 'product-image';
    const key = 'products/' + Date.now() + '-' + (slugify(originalName.replace(/\.[^.]+$/, '')) || 'image') + extension;
    await env.PRODUCT_IMAGES.put(key, await file.arrayBuffer(), {
      httpMetadata: { contentType, cacheControl: 'public, max-age=31536000, immutable' }
    });
    return jsonResponse({ ok: true, key, url: publicUrl(env, key) }, 200, env, request);
  }

  const body = await request.json().catch(() => ({}));
  const validated = validateProduct(body);
  if (!validated.ok) return jsonResponse({ ok: false, error: validated.error }, 400, env, request);
  const product = validated.product;
  await env.DB.prepare(`INSERT INTO products (slug, inventory_name, category, price, monthly_payment, status, quantity, primary_image, gallery_images, quick_facts, ghl_tags, promo_label, delivery_promise, headline, hero_description, why_bullets, long_description, best_for, sort_order, featured, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(slug) DO UPDATE SET inventory_name=excluded.inventory_name, category=excluded.category, price=excluded.price, monthly_payment=excluded.monthly_payment, status=excluded.status, quantity=excluded.quantity, primary_image=excluded.primary_image, gallery_images=excluded.gallery_images, quick_facts=excluded.quick_facts, ghl_tags=excluded.ghl_tags, promo_label=excluded.promo_label, delivery_promise=excluded.delivery_promise, headline=excluded.headline, hero_description=excluded.hero_description, why_bullets=excluded.why_bullets, long_description=excluded.long_description, best_for=excluded.best_for, sort_order=excluded.sort_order, featured=excluded.featured, updated_at=excluded.updated_at`).bind(product.slug, product.inventory_name, product.category, product.price, product.monthly_payment, product.status, product.quantity, product.primary_image, JSON.stringify(product.gallery_images), JSON.stringify(product.quick_facts), JSON.stringify(product.ghl_tags), product.promo_label, product.delivery_promise, product.headline, product.hero_description, JSON.stringify(product.why_bullets), product.long_description, product.best_for, product.sort_order, product.featured, Date.now()).run();
  return jsonResponse({ ok: true, product }, 200, env, request);
}

export async function onRequestPatch(context) {
  const { request, env } = context;
  const session = await requireSession(env, request);
  if (!session) return jsonResponse({ ok: false, error: 'Unauthorized.' }, 401, env, request);
  const body = await request.json().catch(() => ({}));
  const slug = slugify(body.slug);
  const status = cleanText(body.status, 40);
  if (!slug || !PATCH_STATUSES.has(status)) return jsonResponse({ ok: false, error: 'valid slug and status are required.' }, 400, env, request);
  const result = await env.DB.prepare('UPDATE products SET status = ?, updated_at = ? WHERE slug = ?').bind(status, Date.now(), slug).run();
  if (!result.meta || result.meta.changes === 0) return jsonResponse({ ok: false, error: 'Product not found.' }, 404, env, request);
  return jsonResponse({ ok: true }, 200, env, request);
}

export async function onRequestDelete(context) {
  const { request, env } = context;
  const session = await requireSession(env, request);
  if (!session) return jsonResponse({ ok: false, error: 'Unauthorized.' }, 401, env, request);
  const url = new URL(request.url);
  const slug = slugify(url.searchParams.get('slug') || (await request.json().catch(() => ({}))).slug);
  if (!slug) return jsonResponse({ ok: false, error: 'slug is required.' }, 400, env, request);
  const result = await env.DB.prepare('UPDATE products SET status = ?, updated_at = ? WHERE slug = ?').bind('deleted', Date.now(), slug).run();
  if (!result.meta || result.meta.changes === 0) return jsonResponse({ ok: false, error: 'Product not found.' }, 404, env, request);
  return jsonResponse({ ok: true }, 200, env, request);
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const session = await requireSession(env, request);
  if (!session) return jsonResponse({ ok: false, error: 'Unauthorized.' }, 401, env, request);
  const products = await env.DB.prepare('SELECT * FROM products WHERE status != ? ORDER BY sort_order ASC').bind('deleted').all();
  return jsonResponse({ ok: true, products: (products.results || []).map(normalizeProduct) }, 200, env, request);
}

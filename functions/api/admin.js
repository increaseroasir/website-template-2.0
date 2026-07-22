import { corsHeaders, jsonResponse } from '../lib/cors.js';
async function sha256(value) { const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)); return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join(''); }
function slugify(value) { return String(value || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 90); }
function parseJson(value, fallback) { try { return value ? JSON.parse(value) : fallback; } catch (err) { return fallback; } }
function publicUrl(env, key) {
  const base = env.R2_PUBLIC_BASE_URL || (env.R2_PUBLIC_BUCKET_ID ? 'https://pub-' + env.R2_PUBLIC_BUCKET_ID + '.r2.dev' : '');
  return base ? base.replace(/\/$/, '') + '/' + key : key;
}
function normalizeProduct(row) {
  return Object.assign({}, row, {
    gallery_images: parseJson(row.gallery_images, []),
    quick_facts: parseJson(row.quick_facts, []),
    ghl_tags: parseJson(row.ghl_tags, [])
  });
}
async function requireSession(env, request) {
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
    if (!env.ADMIN_PASSWORD || body.password !== env.ADMIN_PASSWORD) return jsonResponse({ ok: false, error: 'Invalid password.' }, 401, env, request);
    const token = crypto.randomUUID() + crypto.randomUUID();
    const tokenHash = await sha256(token + (env.ADMIN_SESSION_SECRET || ''));
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
    const originalName = file.name || 'product-image';
    const key = 'products/' + Date.now() + '-' + (slugify(originalName.replace(/\.[^.]+$/, '')) || 'image') + (originalName.includes('.') ? originalName.slice(originalName.lastIndexOf('.')).toLowerCase() : '');
    await env.PRODUCT_IMAGES.put(key, await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type || 'application/octet-stream' }
    });
    return jsonResponse({ ok: true, key, url: publicUrl(env, key) }, 200, env, request);
  }

  const body = await request.json().catch(() => ({}));
  if (!body.slug && body.inventory_name) body.slug = slugify(body.inventory_name);
  if (!body.slug || !body.inventory_name || !body.category) return jsonResponse({ ok: false, error: 'slug, inventory_name, and category are required.' }, 400, env, request);
  await env.DB.prepare(`INSERT INTO products (slug, inventory_name, category, price, monthly_payment, status, quantity, primary_image, gallery_images, quick_facts, ghl_tags, promo_label, delivery_promise, sort_order, featured, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(slug) DO UPDATE SET inventory_name=excluded.inventory_name, category=excluded.category, price=excluded.price, monthly_payment=excluded.monthly_payment, status=excluded.status, quantity=excluded.quantity, primary_image=excluded.primary_image, gallery_images=excluded.gallery_images, quick_facts=excluded.quick_facts, ghl_tags=excluded.ghl_tags, promo_label=excluded.promo_label, delivery_promise=excluded.delivery_promise, sort_order=excluded.sort_order, featured=excluded.featured, updated_at=excluded.updated_at`).bind(body.slug, body.inventory_name, body.category, body.price || 0, body.monthly_payment || 0, body.status || 'draft', body.quantity || 0, body.primary_image || '', JSON.stringify(body.gallery_images || []), JSON.stringify(body.quick_facts || []), JSON.stringify(body.ghl_tags || []), body.promo_label || '', body.delivery_promise || '', body.sort_order || 0, body.featured ? 1 : 0, Date.now()).run();
  return jsonResponse({ ok: true }, 200, env, request);
}

export async function onRequestPatch(context) {
  const { request, env } = context;
  const session = await requireSession(env, request);
  if (!session) return jsonResponse({ ok: false, error: 'Unauthorized.' }, 401, env, request);
  const body = await request.json().catch(() => ({}));
  if (!body.slug || !body.status) return jsonResponse({ ok: false, error: 'slug and status are required.' }, 400, env, request);
  await env.DB.prepare('UPDATE products SET status = ?, updated_at = ? WHERE slug = ?').bind(body.status, Date.now(), body.slug).run();
  return jsonResponse({ ok: true }, 200, env, request);
}

export async function onRequestDelete(context) {
  const { request, env } = context;
  const session = await requireSession(env, request);
  if (!session) return jsonResponse({ ok: false, error: 'Unauthorized.' }, 401, env, request);
  const url = new URL(request.url);
  const slug = url.searchParams.get('slug') || (await request.json().catch(() => ({}))).slug;
  if (!slug) return jsonResponse({ ok: false, error: 'slug is required.' }, 400, env, request);
  await env.DB.prepare('UPDATE products SET status = ?, updated_at = ? WHERE slug = ?').bind('deleted', Date.now(), slug).run();
  return jsonResponse({ ok: true }, 200, env, request);
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const session = await requireSession(env, request);
  if (!session) return jsonResponse({ ok: false, error: 'Unauthorized.' }, 401, env, request);
  const products = await env.DB.prepare('SELECT * FROM products WHERE status != ? ORDER BY sort_order ASC').bind('deleted').all();
  return jsonResponse({ ok: true, products: (products.results || []).map(normalizeProduct) }, 200, env, request);
}

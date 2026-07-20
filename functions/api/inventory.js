import { corsHeaders, jsonResponse } from '../lib/cors.js';
function parseJson(value, fallback) { try { return value ? JSON.parse(value) : fallback; } catch (err) { return fallback; } }
function publicProduct(row) { return Object.assign({}, row, { gallery_images: parseJson(row.gallery_images, []), quick_facts: parseJson(row.quick_facts, []), ghl_tags: parseJson(row.ghl_tags, []) }); }
export async function onRequestOptions(context) { return new Response(null, { status: 204, headers: corsHeaders(context.env, context.request) }); }
export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const category = url.searchParams.get('category');
  const slug = url.searchParams.get('slug');
  const featured = url.searchParams.get('featured') === '1';
  const allowed = ['available', 'pending', 'sold'];
  let query = 'SELECT * FROM products WHERE status IN (?,?,?)';
  const params = allowed.slice();
  if (slug) { query += ' AND slug = ?'; params.push(slug); }
  if (category) { query += ' AND category = ?'; params.push(category); }
  if (featured) query += ' AND featured = 1';
  query += ' ORDER BY sort_order ASC, inventory_name ASC';
  const result = await env.DB.prepare(query).bind(...params).all();
  return jsonResponse({ ok: true, products: (result.results || []).map(publicProduct) }, 200, env, request);
}

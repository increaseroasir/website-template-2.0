export function corsHeaders(env, request) {
  const configured = String(env.ALLOWED_ORIGIN || '').trim();
  const siteUrl = String(env.CLIENT_WEBSITE_URL || '').trim();
  const allowed = configured || siteUrl || '*';
  const origin = request.headers.get('Origin') || '';
  const normalizedAllowed = allowed.replace(/^https:\/\/www\./, 'https://');
  const normalizedOrigin = origin.replace(/^https:\/\/www\./, 'https://');
  const allowOrigin = allowed === '*' || !origin
    ? allowed
    : (normalizedOrigin === normalizedAllowed ? origin : allowed);
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400'
  };
}

export function jsonResponse(data, status, env, request) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: Object.assign({ 'Content-Type': 'application/json' }, corsHeaders(env, request))
  });
}

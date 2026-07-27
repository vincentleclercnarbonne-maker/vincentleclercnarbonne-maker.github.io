const crypto = require('crypto');

const JSON_HEADERS = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

function json(res, status, body) {
  res.statusCode = status;
  Object.entries(JSON_HEADERS).forEach(([key, value]) => res.setHeader(key, value));
  res.end(JSON.stringify(body));
}

function parseCookies(req) {
  return Object.fromEntries((req.headers.cookie || '').split(';').filter(Boolean).map(part => {
    const index = part.indexOf('=');
    return [part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1))];
  }));
}

function cookie(name, value, options = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`, 'Path=/', 'HttpOnly', 'Secure', 'SameSite=Lax'];
  if (options.maxAge !== undefined) parts.push(`Max-Age=${options.maxAge}`);
  return parts.join('; ');
}

function setCookies(res, values) {
  res.setHeader('Set-Cookie', values);
}

function appOrigin(req) {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, '');
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${proto}://${host}`;
}

function secretKey() {
  const secret = process.env.APP_ENCRYPTION_KEY;
  if (!secret) throw new Error('APP_ENCRYPTION_KEY manquante');
  return crypto.createHash('sha256').update(secret).digest();
}

function encrypt(payload) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', secretKey(), iv);
  const encoded = Buffer.concat([cipher.update(JSON.stringify(payload), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encoded]).toString('base64url');
}

function decrypt(value) {
  if (!value) return null;
  try {
    const raw = Buffer.from(value, 'base64url');
    const iv = raw.subarray(0, 12);
    const tag = raw.subarray(12, 28);
    const data = raw.subarray(28);
    const decipher = crypto.createDecipheriv('aes-256-gcm', secretKey(), iv);
    decipher.setAuthTag(tag);
    return JSON.parse(Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8'));
  } catch {
    return null;
  }
}

async function body(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  let raw = '';
  for await (const chunk of req) raw += chunk;
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}

function routeName(req) {
  const url = new URL(req.url, appOrigin(req));
  return String(req.query?.route || url.searchParams.get('route') || '').replace(/^\/+|\/+$/g, '');
}

function requireEnv(names) {
  const missing = names.filter(name => !process.env[name]);
  if (missing.length) throw new Error(`Variables manquantes : ${missing.join(', ')}`);
}

async function linkedinConnect(req, res) {
  requireEnv(['LINKEDIN_CLIENT_ID', 'LINKEDIN_CLIENT_SECRET', 'APP_ENCRYPTION_KEY']);
  const state = crypto.randomBytes(32).toString('base64url');
  const redirectUri = `${appOrigin(req)}/api/callback/linkedin`;
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.LINKEDIN_CLIENT_ID,
    redirect_uri: redirectUri,
    state,
    scope: 'openid profile email w_member_social'
  });
  setCookies(res, [cookie('vl_linkedin_state', state, { maxAge: 600 })]);
  res.statusCode = 302;
  res.setHeader('Location', `https://www.linkedin.com/oauth/v2/authorization?${params}`);
  res.end();
}

async function linkedinCallback(req, res) {
  requireEnv(['LINKEDIN_CLIENT_ID', 'LINKEDIN_CLIENT_SECRET', 'APP_ENCRYPTION_KEY']);
  const url = new URL(req.url, appOrigin(req));
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const cookies = parseCookies(req);
  if (!code || !state || state !== cookies.vl_linkedin_state) throw new Error('Réponse LinkedIn invalide');
  const redirectUri = `${appOrigin(req)}/api/callback/linkedin`;
  const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code', code, redirect_uri: redirectUri,
      client_id: process.env.LINKEDIN_CLIENT_ID,
      client_secret: process.env.LINKEDIN_CLIENT_SECRET
    })
  });
  const token = await tokenResponse.json();
  if (!tokenResponse.ok) throw new Error(token.error_description || token.message || 'Échec du jeton LinkedIn');
  const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', { headers: { Authorization: `Bearer ${token.access_token}` } });
  const profile = await profileResponse.json();
  if (!profileResponse.ok) throw new Error('Profil LinkedIn inaccessible');
  const session = encrypt({
    accessToken: token.access_token,
    expiresAt: Date.now() + Number(token.expires_in || 5184000) * 1000,
    profile: { id: profile.sub, name: profile.name, email: profile.email, picture: profile.picture }
  });
  setCookies(res, [cookie('vl_linkedin', session, { maxAge: COOKIE_MAX_AGE }), cookie('vl_linkedin_state', '', { maxAge: 0 })]);
  res.statusCode = 302;
  res.setHeader('Location', `${appOrigin(req)}/?connected=linkedin`);
  res.end();
}

async function linkedinPublish(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Méthode non autorisée' });
  const session = decrypt(parseCookies(req).vl_linkedin);
  if (!session?.accessToken || !session?.profile?.id) return json(res, 401, { error: 'LinkedIn non connecté' });
  const payload = await body(req);
  const text = String(payload.text || '').trim();
  if (!text) return json(res, 400, { error: 'Texte manquant' });
  if (text.length > 3000) return json(res, 400, { error: 'Le texte dépasse 3 000 caractères' });
  const linkedInVersion = process.env.LINKEDIN_VERSION || '202605';
  const response = await fetch('https://api.linkedin.com/rest/posts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
      'Linkedin-Version': linkedInVersion
    },
    body: JSON.stringify({
      author: `urn:li:person:${session.profile.id}`,
      commentary: text,
      visibility: 'PUBLIC',
      distribution: { feedDistribution: 'MAIN_FEED', targetEntities: [], thirdPartyDistributionChannels: [] },
      lifecycleState: 'PUBLISHED',
      isReshareDisabledByAuthor: false
    })
  });
  const responseText = await response.text();
  if (!response.ok) return json(res, response.status, { error: 'Publication refusée par LinkedIn', details: responseText.slice(0, 800) });
  return json(res, 201, { ok: true, postId: response.headers.get('x-restli-id') || null });
}

async function canvaConnect(req, res) {
  requireEnv(['CANVA_CLIENT_ID', 'CANVA_CLIENT_SECRET', 'APP_ENCRYPTION_KEY']);
  const state = crypto.randomBytes(32).toString('base64url');
  const verifier = crypto.randomBytes(64).toString('base64url');
  const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
  const redirectUri = `${appOrigin(req)}/api/callback/canva`;
  const scopes = process.env.CANVA_SCOPES || 'openid profile design:meta:read design:content:write asset:read asset:write';
  const params = new URLSearchParams({
    code_challenge: challenge,
    code_challenge_method: 'S256',
    scope: scopes,
    response_type: 'code',
    client_id: process.env.CANVA_CLIENT_ID,
    state,
    redirect_uri: redirectUri
  });
  setCookies(res, [cookie('vl_canva_oauth', encrypt({ state, verifier }), { maxAge: 600 })]);
  res.statusCode = 302;
  res.setHeader('Location', `https://www.canva.com/api/oauth/authorize?${params}`);
  res.end();
}

async function canvaCallback(req, res) {
  requireEnv(['CANVA_CLIENT_ID', 'CANVA_CLIENT_SECRET', 'APP_ENCRYPTION_KEY']);
  const url = new URL(req.url, appOrigin(req));
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const oauth = decrypt(parseCookies(req).vl_canva_oauth);
  if (!code || !state || !oauth || state !== oauth.state) throw new Error('Réponse Canva invalide');
  const basic = Buffer.from(`${process.env.CANVA_CLIENT_ID}:${process.env.CANVA_CLIENT_SECRET}`).toString('base64');
  const tokenResponse = await fetch('https://api.canva.com/rest/v1/oauth/token', {
    method: 'POST',
    headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'authorization_code', code, code_verifier: oauth.verifier })
  });
  const token = await tokenResponse.json();
  if (!tokenResponse.ok || !token.refresh_token) throw new Error(token.error_description || 'Échec du jeton Canva');
  const session = encrypt({ refreshToken: token.refresh_token, scope: token.scope || '' });
  setCookies(res, [cookie('vl_canva', session, { maxAge: COOKIE_MAX_AGE }), cookie('vl_canva_oauth', '', { maxAge: 0 })]);
  res.statusCode = 302;
  res.setHeader('Location', `${appOrigin(req)}/?connected=canva`);
  res.end();
}

async function refreshCanva(req, res) {
  requireEnv(['CANVA_CLIENT_ID', 'CANVA_CLIENT_SECRET', 'APP_ENCRYPTION_KEY']);
  const session = decrypt(parseCookies(req).vl_canva);
  if (!session?.refreshToken) return null;
  const basic = Buffer.from(`${process.env.CANVA_CLIENT_ID}:${process.env.CANVA_CLIENT_SECRET}`).toString('base64');
  const response = await fetch('https://api.canva.com/rest/v1/oauth/token', {
    method: 'POST',
    headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: session.refreshToken })
  });
  const token = await response.json();
  if (!response.ok) return null;
  if (token.refresh_token) setCookies(res, [cookie('vl_canva', encrypt({ refreshToken: token.refresh_token, scope: token.scope || session.scope }), { maxAge: COOKIE_MAX_AGE })]);
  return token.access_token;
}

async function canvaDesigns(req, res) {
  const accessToken = await refreshCanva(req, res);
  if (!accessToken) return json(res, 401, { error: 'Canva non connecté' });
  const response = await fetch('https://api.canva.com/rest/v1/designs?ownership=owned&sort_by=modified_descending', { headers: { Authorization: `Bearer ${accessToken}` } });
  const data = await response.json();
  if (!response.ok) return json(res, response.status, { error: 'Canva indisponible', details: data });
  return json(res, 200, data);
}

async function prestashopProducts(req, res) {
  requireEnv(['PRESTASHOP_BASE_URL', 'PRESTASHOP_API_KEY']);
  const base = process.env.PRESTASHOP_BASE_URL.replace(/\/$/, '');
  const endpoint = `${base}/api/products?output_format=JSON&display=[id,reference,name,active]&filter[active]=[1]&limit=25`;
  const auth = Buffer.from(`${process.env.PRESTASHOP_API_KEY}:`).toString('base64');
  const response = await fetch(endpoint, { headers: { Authorization: `Basic ${auth}`, Accept: 'application/json' } });
  const text = await response.text();
  if (!response.ok) return json(res, response.status, { error: 'Catalogue PrestaShop inaccessible', details: text.slice(0, 800) });
  try { return json(res, 200, JSON.parse(text)); } catch { return json(res, 502, { error: 'Réponse PrestaShop non JSON' }); }
}

async function connections(req, res) {
  const cookies = parseCookies(req);
  const linkedin = decrypt(cookies.vl_linkedin);
  const canva = decrypt(cookies.vl_canva);
  return json(res, 200, {
    backend: true,
    linkedin: { configured: Boolean(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET), connected: Boolean(linkedin?.accessToken), profile: linkedin?.profile || null },
    canva: { configured: Boolean(process.env.CANVA_CLIENT_ID && process.env.CANVA_CLIENT_SECRET), connected: Boolean(canva?.refreshToken) },
    prestashop: { configured: Boolean(process.env.PRESTASHOP_BASE_URL && process.env.PRESTASHOP_API_KEY) },
    crm: { configured: false, message: 'Documentation API ITECK requise' }
  });
}

async function disconnect(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Méthode non autorisée' });
  const payload = await body(req);
  const service = String(payload.service || 'all');
  const expired = [];
  if (service === 'linkedin' || service === 'all') expired.push(cookie('vl_linkedin', '', { maxAge: 0 }));
  if (service === 'canva' || service === 'all') expired.push(cookie('vl_canva', '', { maxAge: 0 }));
  setCookies(res, expired);
  return json(res, 200, { ok: true });
}

module.exports = async function handler(req, res) {
  try {
    const route = routeName(req);
    if (route === 'health') return json(res, 200, { ok: true, service: 'Vincent LinkedIn API' });
    if (route === 'connections') return connections(req, res);
    if (route === 'connect/linkedin') return linkedinConnect(req, res);
    if (route === 'callback/linkedin') return linkedinCallback(req, res);
    if (route === 'linkedin/publish') return linkedinPublish(req, res);
    if (route === 'connect/canva') return canvaConnect(req, res);
    if (route === 'callback/canva') return canvaCallback(req, res);
    if (route === 'canva/designs') return canvaDesigns(req, res);
    if (route === 'prestashop/products') return prestashopProducts(req, res);
    if (route === 'disconnect') return disconnect(req, res);
    return json(res, 404, { error: 'Route inconnue', route });
  } catch (error) {
    console.error(error);
    return json(res, 500, { error: error.message || 'Erreur serveur' });
  }
};

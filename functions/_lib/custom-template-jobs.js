import { getStoredStripeAccessBySessionId, jsonResponse } from './stripe-access.js';

const GENERATOR_API_VERSION = 'v1';
const MANIFEST_VERSION = 1;
const TEXTURE_URL_PREFIX = 'https://cdn.jsdelivr.net/gh/josanager/Textures-Papelcool@';
const COLOR_KEYS = ['headColor', 'torsoColor', 'armLeftColor', 'armRightColor', 'legLeftColor', 'legRightColor'];
const TEXTURE_KEYS = [
  'eyes', 'eyebrows', 'nose', 'torso-front', 'torso-back', 'instrument',
  'hair-front', 'hair-back', 'hair-back-2', 'hair-left', 'hair-right', 'hair-up',
  'beard-front', 'beard-left', 'beard-right', 'arm-left-front', 'arm-left-back',
  'arm-right-front', 'arm-right-back', 'leg-left-front', 'leg-left-back',
  'leg-right-front', 'leg-right-back', 'ear-left', 'ear-right'
];

export async function createCustomTemplateJob(request, env) {
  if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed.' }, 405, { Allow: 'POST' });

  const configurationError = validateConfiguration(env);
  if (configurationError) return configurationError;

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'A JSON body is required.' }, 400);
  }

  const sessionId = normalizeSessionId(body?.sessionId);
  const access = await requirePaidCustomAccess(env, sessionId);
  if (access instanceof Response) return access;

  let manifest;
  try {
    manifest = normalizeManifest(body?.manifest);
  } catch (error) {
    return jsonResponse({ error: error.message }, 400);
  }

  const manifestHash = await sha256Hex(JSON.stringify(manifest));
  const idempotencyKey = `${sessionId}:${manifestHash}`;
  const payload = {
    version: MANIFEST_VERSION,
    source: 'papel.cool',
    payment: {
      checkoutSessionId: sessionId,
      orderId: access.orderId || null,
      amount: access.amount,
      currency: access.currency
    },
    manifest
  };

  const response = await generatorRequest(env, `/${GENERATOR_API_VERSION}/jobs`, {
    method: 'POST',
    body: JSON.stringify(payload),
    idempotencyKey
  });
  if (!response.ok) return generatorUnavailable(response.status);

  const result = await readJson(response);
  const jobId = normalizeJobId(result?.jobId);
  if (!jobId) return jsonResponse({ error: 'The template generator returned an invalid job.' }, 502);

  await storeJob(env, jobId, { sessionId, manifestHash, createdAt: new Date().toISOString() });
  return jsonResponse({ jobId, status: normalizeStatus(result?.status) || 'queued' }, 202);
}

export async function getCustomTemplateJob(request, env) {
  if (request.method !== 'GET') return jsonResponse({ error: 'Method not allowed.' }, 405, { Allow: 'GET' });
  const configurationError = validateConfiguration(env);
  if (configurationError) return configurationError;

  const url = new URL(request.url);
  const jobId = normalizeJobId(url.searchParams.get('job_id'));
  const sessionId = normalizeSessionId(url.searchParams.get('session_id'));
  const ownership = await requireJobOwnership(env, jobId, sessionId);
  if (ownership instanceof Response) return ownership;

  const response = await generatorRequest(env, `/${GENERATOR_API_VERSION}/jobs/${encodeURIComponent(jobId)}`, { method: 'GET' });
  if (!response.ok) return generatorUnavailable(response.status);
  const result = await readJson(response);
  const status = normalizeStatus(result?.status);
  if (!status) return jsonResponse({ error: 'The template generator returned an invalid status.' }, 502);

  return jsonResponse({
    jobId,
    status,
    progress: normalizeProgress(result?.progress),
    error: status === 'failed' ? String(result?.error || 'Template generation failed.').slice(0, 300) : null
  });
}

export async function downloadCustomTemplateJob(request, env) {
  if (request.method !== 'GET') return jsonResponse({ error: 'Method not allowed.' }, 405, { Allow: 'GET' });
  const configurationError = validateConfiguration(env);
  if (configurationError) return configurationError;

  const url = new URL(request.url);
  const jobId = normalizeJobId(url.searchParams.get('job_id'));
  const sessionId = normalizeSessionId(url.searchParams.get('session_id'));
  const ownership = await requireJobOwnership(env, jobId, sessionId);
  if (ownership instanceof Response) return ownership;

  const response = await generatorRequest(env, `/${GENERATOR_API_VERSION}/jobs/${encodeURIComponent(jobId)}/artifact`, { method: 'GET' });
  if (response.status === 409 || response.status === 425) return jsonResponse({ error: 'Template is not ready yet.' }, 409);
  if (!response.ok) return generatorUnavailable(response.status);

  const contentType = response.headers.get('Content-Type') || '';
  if (!contentType.toLowerCase().startsWith('application/pdf')) {
    return jsonResponse({ error: 'The generator returned an invalid artifact.' }, 502);
  }
  return new Response(response.body, {
    status: 200,
    headers: {
      'Cache-Control': 'private, no-store',
      'Content-Disposition': 'attachment; filename="Papelcool-Custom.pdf"',
      'Content-Type': 'application/pdf',
      'X-Content-Type-Options': 'nosniff'
    }
  });
}

function normalizeManifest(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('A customization manifest is required.');
  const colors = {};
  for (const key of COLOR_KEYS) {
    const color = String(value.colors?.[key] || '').toUpperCase();
    if (!/^#[0-9A-F]{6}$/.test(color)) throw new Error(`Invalid color: ${key}.`);
    colors[key] = color;
  }
  const textureUrls = {};
  for (const key of TEXTURE_KEYS) {
    const raw = value.textureUrls?.[key];
    if (raw === null || raw === undefined || raw === '') {
      textureUrls[key] = null;
      continue;
    }
    const textureUrl = String(raw);
    if (!textureUrl.startsWith(TEXTURE_URL_PREFIX) || !/\.(svg|png|webp)(?:[?#].*)?$/i.test(textureUrl)) {
      throw new Error(`Invalid texture URL: ${key}.`);
    }
    textureUrls[key] = textureUrl;
  }
  return { colors, textureUrls };
}

async function requirePaidCustomAccess(env, sessionId) {
  if (!sessionId) return jsonResponse({ error: 'A valid Stripe session is required.' }, 400);
  const access = await getStoredStripeAccessBySessionId(env, sessionId);
  const expectedAmount = Number(env.STRIPE_AMOUNT || 500);
  const expectedCurrency = String(env.STRIPE_CURRENCY || 'usd').toLowerCase();
  const valid = access?.active === true
    && access.product === 'papelcool_custom_pdf'
    && String(access.status).toLowerCase() === 'paid'
    && Number(access.amount) === expectedAmount
    && String(access.currency).toLowerCase() === expectedCurrency;
  return valid ? access : jsonResponse({ error: 'This payment does not unlock a custom template.' }, 403);
}

async function requireJobOwnership(env, jobId, sessionId) {
  if (!jobId || !sessionId) return jsonResponse({ error: 'A valid job and Stripe session are required.' }, 400);
  const access = await requirePaidCustomAccess(env, sessionId);
  if (access instanceof Response) return access;
  const raw = await env.PAPELCOOL_STRIPE_ACCESS_KV.get(`custom_template_job:${jobId}`);
  if (!raw) return jsonResponse({ error: 'Template job not found.' }, 404);
  try {
    return JSON.parse(raw).sessionId === sessionId ? true : jsonResponse({ error: 'Template job not found.' }, 404);
  } catch {
    return jsonResponse({ error: 'Template job not found.' }, 404);
  }
}

async function storeJob(env, jobId, value) {
  await env.PAPELCOOL_STRIPE_ACCESS_KV.put(`custom_template_job:${jobId}`, JSON.stringify(value), { expirationTtl: 60 * 60 * 24 });
}

async function generatorRequest(env, path, options) {
  const timestamp = String(Math.floor(Date.now() / 1000));
  const body = options.body || '';
  const signature = await hmacSha256Hex(env.TEMPLATE_GENERATOR_SECRET, `${timestamp}.${body}`);
  return fetch(`${env.TEMPLATE_GENERATOR_URL.replace(/\/$/, '')}${path}`, {
    method: options.method,
    body: options.body,
    headers: {
      Accept: options.method === 'GET' && path.endsWith('/artifact') ? 'application/pdf' : 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      'X-Papelcool-Timestamp': timestamp,
      'X-Papelcool-Signature': `sha256=${signature}`,
      ...(options.idempotencyKey ? { 'Idempotency-Key': options.idempotencyKey } : {})
    }
  });
}

function validateConfiguration(env) {
  if (!env.TEMPLATE_GENERATOR_URL || !env.TEMPLATE_GENERATOR_SECRET || !env.PAPELCOOL_STRIPE_ACCESS_KV) {
    return jsonResponse({ error: 'External template generation is not configured.' }, 503);
  }
  return null;
}

function normalizeSessionId(value) { const id = String(value || '').trim(); return /^cs_[A-Za-z0-9_]+$/.test(id) ? id : ''; }
function normalizeJobId(value) { const id = String(value || '').trim(); return /^[A-Za-z0-9_-]{8,100}$/.test(id) ? id : ''; }
function normalizeStatus(value) { return ['queued', 'processing', 'completed', 'failed'].includes(value) ? value : ''; }
function normalizeProgress(value) { const number = Number(value); return Number.isFinite(number) ? Math.max(0, Math.min(100, Math.round(number))) : 0; }
function generatorUnavailable(status) { return jsonResponse({ error: 'Template generator is temporarily unavailable.' }, status === 429 ? 429 : 502); }
async function readJson(response) { try { return await response.json(); } catch { return null; } }
async function sha256Hex(value) { const data = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)); return toHex(data); }
async function hmacSha256Hex(secret, value) { const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']); return toHex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value))); }
function toHex(buffer) { return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, '0')).join(''); }

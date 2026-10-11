const DEFAULT_PRICE_ID = 'price_1Tex7DBVQGUgz1N1Xg9eEcyc';
const DEFAULT_AMOUNT = 500;
const DEFAULT_CURRENCY = 'usd';
const PRESET_PRODUCT = 'papelcool_preset_template';
const CUSTOM_PRODUCT = 'papelcool_custom_pdf';
const ALLOWED_PRESET_SLUGS = new Set([
  'Villamil-faltastu', 'Villamil-faltastu-guitarra',
  'Simon-faltastu', 'Simon-faltastu-bajo',
  'Martin-faltastu', 'Martin-faltastu-bateria',
  'Isaza-faltastu', 'Isaza-faltastu-guitarra',
  'Mira', 'Rumi', 'Zoey', 'Jinu', 'Abby', 'Romance', 'Mystery', 'Baby'
]);

export async function handleCreateStripeCheckoutSession(request, env) {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405, { Allow: 'POST' });
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const secretKey = env.STRIPE_SECRET_KEY;
  const priceId = env.STRIPE_PRICE_ID || DEFAULT_PRICE_ID;
  const requestedProduct = typeof body.productType === 'string' ? body.productType.trim() : '';
  const isPresetPurchase = requestedProduct === PRESET_PRODUCT;
  const requiresPriceId = !isPresetPurchase;
  if (!secretKey || (requiresPriceId && !priceId)) {
    return jsonResponse({
      error: 'Stripe checkout is not configured.',
      missing: {
        STRIPE_SECRET_KEY: !secretKey,
        STRIPE_PRICE_ID: requiresPriceId && !priceId
      }
    }, 503);
  }

  const requestUrl = new URL(request.url);
  const origin = requestUrl.origin;
  const successUrl = sanitizeReturnUrl(
    body.successUrl,
    origin,
    `${origin}/index.html?view=custom&payment=stripe_success&session_id={CHECKOUT_SESSION_ID}`
  );
  const cancelUrl = sanitizeReturnUrl(
    body.cancelUrl,
    origin,
    `${origin}/index.html?view=custom&payment=stripe_cancelled`
  );
  const customerEmail = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const userId = typeof body.userId === 'string' ? body.userId.trim() : '';
  const requestedSlug = typeof body.productSlug === 'string' ? body.productSlug.trim() : '';
  if (isPresetPurchase && !ALLOWED_PRESET_SLUGS.has(requestedSlug)) {
    return jsonResponse({ error: 'Unknown premium preset.' }, 400);
  }

  const productType = isPresetPurchase ? PRESET_PRODUCT : CUSTOM_PRODUCT;
  const productName = isPresetPurchase
    ? `Plantilla Papelcool - ${requestedSlug}`
    : 'Papelcool Custom PDF';
  const productSlug = isPresetPurchase ? requestedSlug : '';
  // Price and currency are server-owned. Never trust checkout totals supplied by the browser.
  const unitAmount = Number(env.STRIPE_AMOUNT || DEFAULT_AMOUNT);
  const currency = String(env.STRIPE_CURRENCY || DEFAULT_CURRENCY).toLowerCase();
  if (!Number.isInteger(unitAmount) || unitAmount < 50 || !/^[a-z]{3}$/.test(currency)) {
    return jsonResponse({ error: 'Stripe price configuration is invalid.' }, 503);
  }
  const orderId = typeof body.orderId === 'string' && body.orderId.trim()
    ? body.orderId.trim().slice(0, 120)
    : `papelcool_custom_${Date.now()}`;

  const form = new URLSearchParams();
  form.set('mode', 'payment');
  if (priceId && !isPresetPurchase) {
    form.set('line_items[0][price]', priceId);
  } else {
    form.set('line_items[0][price_data][currency]', currency);
    form.set('line_items[0][price_data][unit_amount]', String(unitAmount));
    form.set('line_items[0][price_data][product_data][name]', productName);
  }
  form.set('line_items[0][quantity]', '1');
  form.set('success_url', successUrl);
  form.set('cancel_url', cancelUrl);
  form.set('client_reference_id', userId || orderId);
  form.set('metadata[product]', productType);
  form.set('metadata[product_name]', productName);
  if (productSlug) form.set('metadata[product_slug]', productSlug);
  form.set('metadata[order_id]', orderId);
  form.set('metadata[price_id]', priceId);
  form.set('metadata[amount]', String(unitAmount));
  form.set('metadata[currency]', currency);
  if (userId) form.set('metadata[papelcool_user_id]', userId);
  if (customerEmail) form.set('customer_email', customerEmail);

  const stripeResponse = await stripeRequest(env, '/v1/checkout/sessions', {
    method: 'POST',
    body: form
  });

  if (!stripeResponse.ok) {
    return jsonResponse({
      error: 'Unable to create Stripe checkout session.',
      status: stripeResponse.status,
      details: stripeResponse.payload
    }, stripeResponse.status);
  }

  return jsonResponse({
    id: stripeResponse.payload.id,
    url: stripeResponse.payload.url
  });
}

export async function handleVerifyStripeCheckoutSession(request, env) {
  if (!['GET', 'POST'].includes(request.method)) {
    return jsonResponse({ error: 'Method not allowed.' }, 405, { Allow: 'GET, POST' });
  }

  const requestUrl = new URL(request.url);
  let body = {};
  if (request.method === 'POST') {
    try {
      body = await request.json();
    } catch {
      body = {};
    }
  }

  const sessionId = String(body.sessionId || requestUrl.searchParams.get('session_id') || '').trim();
  if (!sessionId.startsWith('cs_')) {
    return jsonResponse({ error: 'A valid Stripe Checkout Session ID is required.' }, 400);
  }

  const stored = await getStoredStripeAccess(env, sessionId);
  if (stored?.active) {
    return jsonResponse({ active: true, source: 'stored', access: sanitizeAccess(stored) });
  }

  const stripeResponse = await stripeRequest(env, `/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
    method: 'GET'
  });

  if (!stripeResponse.ok) {
    return jsonResponse({
      error: 'Unable to verify Stripe checkout session.',
      status: stripeResponse.status,
      details: stripeResponse.payload
    }, stripeResponse.status);
  }

  const session = stripeResponse.payload;
  if (!isExpectedStripeSession(session, env)) {
    return jsonResponse({
      active: false,
      message: 'Stripe session is not paid or does not match the expected product.'
    });
  }

  const access = buildAccessFromStripeSession(session, 'verify');
  const storedIn = await storeStripeAccess(env, access);
  return jsonResponse({
    active: true,
    stored: storedIn,
    source: 'verify',
    access: sanitizeAccess(access)
  });
}

export async function handleStripeWebhook(request, env, context = {}) {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405, { Allow: 'POST' });
  }

  const bodyText = await request.text();
  let event;
  try {
    event = await verifyStripeWebhookEvent(bodyText, request.headers.get('Stripe-Signature'), env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    return jsonResponse({ error: 'Invalid Stripe webhook signature.' }, 401);
  }

  const work = processStripeEvent(event, env);
  if (context.waitUntil) context.waitUntil(work);
  else await work;

  return jsonResponse({ received: true });
}

async function processStripeEvent(event, env) {
  if (event.type === 'checkout.session.completed') {
    const session = event.data?.object;
    if (isExpectedStripeSession(session, env)) {
      await storeStripeAccess(env, buildAccessFromStripeSession(session, 'webhook'));
    }
    return;
  }

  if (event.type === 'payment_intent.payment_failed') {
    const intent = event.data?.object;
    const storage = getStripeAccessKv(env);
    if (storage && intent?.id) {
      await storage.put(`stripe_payment_failed:${intent.id}`, JSON.stringify({
        paymentIntentId: intent.id,
        status: intent.status || 'failed',
        amount: intent.amount,
        currency: intent.currency,
        createdAt: new Date().toISOString()
      }), { expirationTtl: 60 * 60 * 24 * 30 });
    }
  }
}

function isExpectedStripeSession(session, env) {
  if (!session) return false;
  const expectedAmount = Number(env.STRIPE_AMOUNT || DEFAULT_AMOUNT);
  const expectedCurrency = String(env.STRIPE_CURRENCY || DEFAULT_CURRENCY).toLowerCase();
  const paid = session.payment_status === 'paid' && session.status === 'complete';
  const amountMatches = Number(session.amount_total) === expectedAmount;
  const currencyMatches = String(session.currency || '').toLowerCase() === expectedCurrency;
  return paid && amountMatches && currencyMatches;
}

function buildAccessFromStripeSession(session, source) {
  return {
    active: true,
    source,
    checkoutSessionId: session.id,
    paymentIntentId: session.payment_intent || null,
    customerEmail: session.customer_details?.email || session.customer_email || null,
    userId: session.metadata?.papelcool_user_id || null,
    orderId: session.metadata?.order_id || null,
    product: session.metadata?.product || null,
    productName: session.metadata?.product_name || null,
    productSlug: session.metadata?.product_slug || null,
    priceId: session.metadata?.price_id || null,
    amount: session.amount_total,
    currency: session.currency,
    status: session.payment_status,
    createdAt: new Date().toISOString()
  };
}

async function storeStripeAccess(env, access) {
  const storage = getStripeAccessKv(env);
  if (!storage) return 'none';

  const value = JSON.stringify(access);
  await storage.put(stripeSessionKey(access.checkoutSessionId), value);
  if (access.paymentIntentId) await storage.put(`stripe_access:payment_intent:${access.paymentIntentId}`, value);
  if (access.userId) await storage.put(`stripe_access:user:${access.userId}`, value);
  if (access.customerEmail) await storage.put(`stripe_access:email:${access.customerEmail.toLowerCase()}`, value);
  return 'kv';
}

async function getStoredStripeAccess(env, sessionId) {
  const storage = getStripeAccessKv(env);
  if (!storage) return null;
  const raw = await storage.get(stripeSessionKey(sessionId));
  return raw ? JSON.parse(raw) : null;
}

function getStripeAccessKv(env) {
  return env.PAPELCOOL_STRIPE_ACCESS_KV || null;
}

function stripeSessionKey(sessionId) {
  return `stripe_access:checkout_session:${sessionId}`;
}

async function stripeRequest(env, path, options) {
  const response = await fetch(`https://api.stripe.com${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      ...(options.headers || {})
    }
  });
  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
  }
  return { ok: response.ok, status: response.status, payload };
}

async function verifyStripeWebhookEvent(bodyText, signatureHeader, webhookSecret) {
  if (!signatureHeader || !webhookSecret) {
    throw new Error('Missing Stripe webhook signature or secret.');
  }

  const parts = Object.fromEntries(
    signatureHeader.split(',').map((part) => {
      const [key, value] = part.split('=');
      return [key, value];
    })
  );
  const timestamp = parts.t;
  const signatures = signatureHeader
    .split(',')
    .filter((part) => part.startsWith('v1='))
    .map((part) => part.slice(3));

  if (!timestamp || !signatures.length) {
    throw new Error('Invalid Stripe signature header.');
  }

  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > 60 * 5) {
    throw new Error('Stripe webhook timestamp outside tolerance.');
  }

  const payload = `${timestamp}.${bodyText}`;
  const expected = await hmacSha256Hex(webhookSecret, payload);
  const verified = signatures.some((signature) => timingSafeEqual(signature, expected));
  if (!verified) {
    throw new Error('Stripe webhook signature mismatch.');
  }

  return JSON.parse(bodyText);
}

async function hmacSha256Hex(secret, payload) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function timingSafeEqual(a, b) {
  const left = new TextEncoder().encode(a);
  const right = new TextEncoder().encode(b);
  if (left.length !== right.length) return false;
  let result = 0;
  for (let index = 0; index < left.length; index += 1) {
    result |= left[index] ^ right[index];
  }
  return result === 0;
}

function sanitizeReturnUrl(value, origin, fallback) {
  if (typeof value !== 'string') return fallback;
  try {
    const url = new URL(value);
    if (url.origin !== origin && url.origin !== 'https://papel.cool') return fallback;
    return url.toString().replace('%7BCHECKOUT_SESSION_ID%7D', '{CHECKOUT_SESSION_ID}');
  } catch {
    return fallback;
  }
}

function sanitizeAccess(access) {
  if (!access) return null;
  return {
    active: access.active,
    checkoutSessionId: access.checkoutSessionId,
    paymentIntentId: access.paymentIntentId,
    orderId: access.orderId,
    product: access.product,
    productName: access.productName,
    productSlug: access.productSlug,
    amount: access.amount,
    currency: access.currency,
    status: access.status,
    source: access.source,
    createdAt: access.createdAt
  };
}

export async function getStoredStripeAccessBySessionId(env, sessionId) {
  if (typeof sessionId !== 'string' || !sessionId.startsWith('cs_')) return null;
  return getStoredStripeAccess(env, sessionId);
}

export function isPresetTemplateAccessValidForCharacter(access, characterName, expectedAmount = DEFAULT_AMOUNT, expectedCurrency = DEFAULT_CURRENCY) {
  if (!access || !characterName) return false;
  const normalizedCharacter = String(characterName).trim();
  if (!normalizedCharacter) return false;

  const amountMatches = Number(access.amount) === Number(expectedAmount);
  const currencyMatches = String(access.currency || '').toLowerCase() === String(expectedCurrency || DEFAULT_CURRENCY).toLowerCase();
  const statusMatches = String(access.status || '').toLowerCase() === 'paid';
  const productMatches = access.product === 'papelcool_preset_template';
  const slugMatches = access.productSlug === normalizedCharacter;

  return Boolean(access.active) && amountMatches && currencyMatches && statusMatches && productMatches && slugMatches;
}

export function jsonResponse(payload, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'application/json; charset=utf-8',
      ...extraHeaders
    }
  });
}

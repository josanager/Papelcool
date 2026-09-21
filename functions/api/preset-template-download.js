import { getStoredStripeAccessBySessionId, isPresetTemplateAccessValidForCharacter } from '../_lib/stripe-access.js';

const DEFAULT_R2_PREFIX = 'presets-pdfs/';
const PREMIUM_PRESET_PRICE_CENTS = 500;
const PREMIUM_PRESET_CURRENCY = 'usd';
const premiumPresetCharacters = new Set([
  'Villamil-faltastu',
  'Villamil-faltastu-guitarra',
  'Simon-faltastu',
  'Simon-faltastu-bajo',
  'Martin-faltastu',
  'Martin-faltastu-bateria',
  'Isaza-faltastu',
  'Isaza-faltastu-guitarra',
  'Mira',
  'Rumi',
  'Zoey',
  'Jinu',
  'Abby',
  'Romance',
  'Mystery',
  'Baby'
]);

const availablePresetPdfs = Object.freeze({
  Abby: 'Abby.pdf',
  Alex: 'Alex.pdf',
  Baby: 'Baby.pdf',
  Creeper: 'Creeper.pdf',
  Enderman: 'Enderman.pdf',
  'Isaza-faltastu-guitarra': 'Isaza-faltastu-guitarra.pdf',
  'Isaza-faltastu': 'Isaza-faltastu.pdf',
  'Isaza-masdeloqueaposte': 'Isaza-masdeloqueaposte.pdf',
  Jinu: 'Jinu.pdf',
  'Martin-faltastu-bateria': 'Martin-faltastu-bateria.pdf',
  'Martin-faltastu': 'Martin-faltastu.pdf',
  'Martin-masdeloqueaposte': 'Martin-masdeloqueaposte.pdf',
  Mira: 'Mira.pdf',
  Mystery: 'Mystery.pdf',
  Romance: 'Romance.pdf',
  Rumi: 'Rumi.pdf',
  'Simon-faltastu-bajo': 'Simon-faltastu-bajo.pdf',
  'Simon-faltastu': 'Simon-faltastu.pdf',
  'Simon-masdeloqueaposte': 'Simon-masdeloqueaposte.pdf',
  Skeleton: 'Skeleton.pdf',
  Steve: 'Steve.pdf',
  'Villamil-faltastu-guitarra': 'Villamil-faltastu-guitarra.pdf',
  'Villamil-faltastu': 'Villamil-faltastu.pdf',
  'Villamil-masdeloqueaposte': 'Villamil-masdeloqueaposte.pdf',
  Zoey: 'Zoey.pdf',
  Zombie: 'Zombie.pdf'
});

export async function onRequestGet(context) {
  return handleRequest(context.request, context.env);
}

export async function onRequestHead(context) {
  return handleRequest(context.request, context.env);
}

async function handleRequest(request, env) {
  const url = new URL(request.url);
  const character = url.searchParams.get('character');
  const sessionId = url.searchParams.get('session_id');

  if (!character || !availablePresetPdfs[character]) {
    return jsonResponse(
      { error: 'Template not found for this character.' },
      404
    );
  }

  if (premiumPresetCharacters.has(character)) {
    if (!sessionId) {
      return jsonResponse(
        { error: 'Stripe payment is required before downloading this template.' },
        402
      );
    }

    const access = await getStoredStripeAccessBySessionId(env, sessionId);
    const isValid = isPresetTemplateAccessValidForCharacter(
      access,
      character,
      PREMIUM_PRESET_PRICE_CENTS,
      PREMIUM_PRESET_CURRENCY
    );

    if (!isValid) {
      return jsonResponse(
        { error: 'This Stripe session does not unlock the requested premium template.' },
        403
      );
    }
  }

  const bucket = env.PRESET_PDFS_BUCKET;
  if (!bucket || typeof bucket.get !== 'function' || typeof bucket.head !== 'function') {
    return jsonResponse(
      { error: 'Private template storage is not configured.' },
      503
    );
  }

  const fileName = availablePresetPdfs[character];
  const prefix = normalizeR2Prefix(env.PRESET_PDFS_PREFIX);
  const objectKey = `${prefix}${fileName}`;
  const object = request.method === 'HEAD'
    ? await bucket.head(objectKey)
    : await bucket.get(objectKey);

  if (!object) {
    return jsonResponse({ error: 'Template not found in private storage.' }, 404);
  }

  const headers = new Headers();
  headers.set('Content-Type', object.httpMetadata?.contentType || 'application/pdf');
  headers.set('Content-Disposition', `attachment; filename="${fileName}"`);
  headers.set('Cache-Control', premiumPresetCharacters.has(character)
    ? 'private, no-store'
    : 'private, max-age=300');
  headers.set('X-Content-Type-Options', 'nosniff');

  if (Number.isFinite(object.size)) {
    headers.set('Content-Length', String(object.size));
  }

  if (object.httpEtag || object.etag) {
    headers.set('ETag', object.httpEtag || `"${object.etag}"`);
  }

  if (object.uploaded instanceof Date) {
    headers.set('Last-Modified', object.uploaded.toUTCString());
  }

  return new Response(request.method === 'HEAD' ? null : object.body, {
    status: 200,
    headers
  });
}

function normalizeR2Prefix(value) {
  if (typeof value !== 'string') return DEFAULT_R2_PREFIX;
  const trimmed = value.trim().replace(/^\/+|\/+$/g, '');
  return trimmed ? `${trimmed}/` : '';
}

function jsonResponse(payload, status) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}

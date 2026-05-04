const R2_PDF_BASE_URL = 'https://pub-9432515251e743b7979ceb8e264f80ec.r2.dev/presets-pdfs/';

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
  return handleRequest(context.request);
}

export async function onRequestHead(context) {
  return handleRequest(context.request);
}

async function handleRequest(request) {
  const url = new URL(request.url);
  const character = url.searchParams.get('character');

  if (!character || !availablePresetPdfs[character]) {
    return jsonResponse(
      { error: 'Template not found for this character.' },
      404
    );
  }

  const fileName = availablePresetPdfs[character];
  const upstreamUrl = `${R2_PDF_BASE_URL}${fileName}`;
  const upstreamResponse = await fetch(upstreamUrl, {
    method: request.method === 'HEAD' ? 'HEAD' : 'GET',
    headers: {
      Accept: 'application/pdf'
    }
  });

  if (!upstreamResponse.ok) {
    return jsonResponse(
      { error: 'Unable to fetch template from storage.' },
      upstreamResponse.status === 404 ? 404 : 502
    );
  }

  const headers = new Headers();
  headers.set('Content-Type', upstreamResponse.headers.get('Content-Type') || 'application/pdf');
  headers.set('Content-Disposition', `attachment; filename="${fileName}"`);
  headers.set('Cache-Control', 'public, max-age=300');

  const contentLength = upstreamResponse.headers.get('Content-Length');
  if (contentLength) {
    headers.set('Content-Length', contentLength);
  }

  const etag = upstreamResponse.headers.get('ETag');
  if (etag) {
    headers.set('ETag', etag);
  }

  const lastModified = upstreamResponse.headers.get('Last-Modified');
  if (lastModified) {
    headers.set('Last-Modified', lastModified);
  }

  return new Response(request.method === 'HEAD' ? null : upstreamResponse.body, {
    status: 200,
    headers
  });
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

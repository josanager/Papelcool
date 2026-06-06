import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {
  handleCreateStripeCheckoutSession,
  handleStripeWebhook,
  handleVerifyStripeCheckoutSession
} from './functions/_lib/stripe-access.js';

const root = process.cwd();

// Load environment variables from .env file if it exists
try {
  const envPath = path.join(root, '.env');
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split(/\r?\n/).forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const index = trimmed.indexOf('=');
      if (index === -1) return;
      const key = trimmed.slice(0, index).trim();
      let value = trimmed.slice(index + 1).trim();
      // Remove surrounding quotes if any
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (key && process.env[key] === undefined) {
        process.env[key] = value;
      }
    });
    console.log('Successfully loaded environment variables from .env');
  }
} catch (e) {
  console.warn('Could not load .env file:', e);
}

const port = Number(process.env.PORT || 8001);
const r2Base = 'https://pub-9432515251e743b7979ceb8e264f80ec.r2.dev/presets-pdfs/';
const localStripeAccessStore = new Map();
const localStripeAccessKv = {
  async get(key) {
    return localStripeAccessStore.get(key) || null;
  },
  async put(key, value) {
    localStripeAccessStore.set(key, value);
  }
};
const presetFiles = Object.freeze({
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

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.glb': 'model/gltf-binary',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml'
};

http.createServer(async (req, res) => {
  try {
    const requestUrl = new URL(req.url || '/', `http://localhost:${port}`);

    if (requestUrl.pathname === '/api/stripe/create-checkout-session') {
      const webRequest = await toWebRequest(req, requestUrl);
      const response = await handleCreateStripeCheckoutSession(webRequest, getLocalFunctionEnv());
      await sendWebResponse(res, response);
      return;
    }

    if (requestUrl.pathname === '/api/stripe/verify-session') {
      const webRequest = await toWebRequest(req, requestUrl);
      const response = await handleVerifyStripeCheckoutSession(webRequest, getLocalFunctionEnv());
      await sendWebResponse(res, response);
      return;
    }

    if (requestUrl.pathname === '/api/stripe/webhook') {
      const webRequest = await toWebRequest(req, requestUrl);
      const response = await handleStripeWebhook(webRequest, getLocalFunctionEnv());
      await sendWebResponse(res, response);
      return;
    }

    if (requestUrl.pathname === '/api/preset-template-download') {
      const character = requestUrl.searchParams.get('character');
      const fileName = presetFiles[character];

      if (!fileName) {
        sendJson(res, 404, { error: 'Template not found for this character.' });
        return;
      }

      const upstream = await fetch(`${r2Base}${fileName}`, {
        method: req.method === 'HEAD' ? 'HEAD' : 'GET',
        headers: {
          Accept: 'application/pdf'
        }
      });

      if (!upstream.ok) {
        sendJson(res, upstream.status === 404 ? 404 : 502, {
          error: 'Unable to fetch template from storage.'
        });
        return;
      }

      const headers = {
        'Cache-Control': 'public, max-age=300',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Type': upstream.headers.get('content-type') || 'application/pdf'
      };

      const contentLength = upstream.headers.get('content-length');
      if (contentLength) headers['Content-Length'] = contentLength;

      const etag = upstream.headers.get('etag');
      if (etag) headers.ETag = etag;

      const lastModified = upstream.headers.get('last-modified');
      if (lastModified) headers['Last-Modified'] = lastModified;

      res.writeHead(200, headers);

      if (req.method === 'HEAD') {
        res.end();
        return;
      }

      const arrayBuffer = await upstream.arrayBuffer();
      res.end(Buffer.from(arrayBuffer));
      return;
    }

    const pathname = requestUrl.pathname === '/' ? '/index.html' : requestUrl.pathname;
    const filePath = path.join(root, decodeURIComponent(pathname));

    if (!filePath.startsWith(root)) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Forbidden');
      return;
    }

    const finalPath = fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()
      ? path.join(filePath, 'index.html')
      : filePath;

    fs.readFile(finalPath, (error, data) => {
      if (error) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not found');
        return;
      }

      const ext = path.extname(finalPath).toLowerCase();
      res.writeHead(200, {
        'Content-Type': mimeTypes[ext] || 'application/octet-stream'
      });
      res.end(data);
    });
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(String(error.stack || error));
  }
}).listen(port, () => {
  console.log(`Papelcool dev server running at http://localhost:${port}`);
});

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      if (!chunks.length) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      resolve(chunks.length ? Buffer.concat(chunks) : undefined);
    });
    req.on('error', reject);
  });
}

async function toWebRequest(req, requestUrl) {
  const headers = new Headers();
  Object.entries(req.headers).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((entry) => headers.append(key, entry));
    } else if (value !== undefined) {
      headers.set(key, String(value));
    }
  });

  const body = ['GET', 'HEAD'].includes(req.method || 'GET')
    ? undefined
    : await readRawBody(req);

  return new Request(requestUrl.toString(), {
    method: req.method,
    headers,
    body
  });
}

function getLocalFunctionEnv() {
  return {
    ...process.env,
    PAPELCOOL_STRIPE_ACCESS_KV: localStripeAccessKv
  };
}

async function sendWebResponse(res, response) {
  const headers = {};
  response.headers.forEach((value, key) => {
    headers[key] = value;
  });
  res.writeHead(response.status, headers);
  const arrayBuffer = await response.arrayBuffer();
  res.end(Buffer.from(arrayBuffer));
}

function sendJson(res, status, payload, extraHeaders = {}) {
  res.writeHead(status, {
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json; charset=utf-8',
    ...extraHeaders
  });
  res.end(JSON.stringify(payload));
}

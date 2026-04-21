import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const port = Number(process.env.PORT || 8001);
const r2Base = 'https://pub-9432515251e743b7979ceb8e264f80ec.r2.dev/presets-pdfs/';
const presetFiles = Object.freeze({
  Abby: 'Abby.pdf',
  Baby: 'Baby.pdf',
  Jinu: 'Jinu.pdf',
  Mira: 'Mira.pdf',
  Rumi: 'Rumi.pdf',
  Zoey: 'Zoey.pdf'
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

function sendJson(res, status, payload) {
  res.writeHead(status, {
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json; charset=utf-8'
  });
  res.end(JSON.stringify(payload));
}

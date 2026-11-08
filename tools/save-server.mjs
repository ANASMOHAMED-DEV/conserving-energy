// Dev-only tool: receives rendered JPEG dataURLs from tools/render-art.html
// and writes them to assets/backgrounds/. Not part of the shipped game.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'assets', 'backgrounds');
const allowed = new Set(['living-room', 'kitchen', 'bedroom', 'bathroom', 'laundry', 'house-map', 'title',
  'preview-living', 'preview-kitchen', 'preview-bedroom', 'preview-bathroom', 'preview-laundry',
  'preview-map', 'preview-title', 'preview-report']);

http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'content-type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
  if (req.method !== 'POST' || !req.url.startsWith('/save')) {
    res.writeHead(404); res.end('dev save server: POST /save?name=<key>'); return;
  }
  const name = new URL(req.url, 'http://localhost').searchParams.get('name');
  if (!allowed.has(name)) { res.writeHead(400); res.end('unknown name'); return; }
  let body = '';
  req.on('data', c => { body += c; if (body.length > 4_000_000) req.destroy(); });
  req.on('end', () => {
    try {
      const b64 = body.replace(/^data:image\/jpeg;base64,/, '');
      const buf = Buffer.from(b64, 'base64');
      const file = path.join(outDir, name + '.jpg');
      fs.writeFileSync(file, buf);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, file: name + '.jpg', bytes: buf.length }));
      console.log(`saved ${name}.jpg (${buf.length} bytes)`);
    } catch (e) {
      res.writeHead(500); res.end(String(e));
    }
  });
}).listen(8081, () => console.log('art save server on http://localhost:8081'));
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist');
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.glb':'model/gltf-binary','.json':'application/json'};
http.createServer((req,res) => {
  let file;
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    file = path.resolve(root, '.' + pathname);
    if (file !== root && !file.startsWith(root + path.sep)) throw new Error('Invalid path');
    if (fs.statSync(file).isDirectory()) file = path.join(file,'index.html');
    if (!fs.statSync(file).isFile()) throw new Error('Missing file');
  } catch {
    res.writeHead(404,{'Content-Type':'text/plain'});res.end('Not found');return;
  }
  res.writeHead(200,{'Content-Type':types[path.extname(file)] || 'application/octet-stream','Cache-Control':'no-cache'});
  if (req.method === 'HEAD') {res.end();return;}
  fs.createReadStream(file).pipe(res);
}).listen(5173,'127.0.0.1',() => console.log('Portfolio: http://localhost:5173 — Ctrl+C to stop'));

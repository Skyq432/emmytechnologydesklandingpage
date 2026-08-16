const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT || 5173);
const ROOT = __dirname;
const mime = {
  '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'application/javascript; charset=utf-8',
  '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.webp':'image/webp', '.mp4':'video/mp4', '.svg':'image/svg+xml', '.ico':'image/x-icon', '.json':'application/json; charset=utf-8'
};

const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent((req.url || '/').split('?')[0]);
  const rel = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const file = path.resolve(ROOT, rel);
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.stat(file, (err, stat) => {
    let target = file;
    if (!err && stat.isDirectory()) target = path.join(file, 'index.html');
    fs.readFile(target, (readErr, data) => {
      if (readErr) { res.writeHead(404, {'Content-Type':'text/plain; charset=utf-8'}); return res.end('Not found'); }
      res.writeHead(200, {'Content-Type': mime[path.extname(target).toLowerCase()] || 'application/octet-stream', 'Cache-Control':'no-cache'});
      res.end(data);
    });
  });
});
server.listen(PORT, '127.0.0.1', () => {
  console.log(`EmmyTech Desk landing page running at http://localhost:${PORT}`);
  console.log('Press Ctrl+C to stop.');
});

// Tiny static server for the REVIEW page (video seeking needs HTTP Range): node serve-review.js <folder> [port]
// Open http://localhost:<port>/ to list the review pages in that folder. Local only (binds 127.0.0.1).
const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.resolve(process.argv[2] || '.'), port = +(process.argv[3] || 4747);
const types = { '.html': 'text/html; charset=utf-8', '.mp4': 'video/mp4', '.srt': 'text/plain; charset=utf-8', '.png': 'image/png', '.json': 'application/json' };
http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(root)) { res.writeHead(403); return res.end(); }
  if (p === root || p === root + path.sep) {
    const pages = fs.readdirSync(root).filter((f) => / - REVIEW\.html$/.test(f));
    res.writeHead(200, { 'content-type': types['.html'] });
    return res.end(`<!doctype html><meta charset="utf-8"><title>Reviews</title><body style="font:15px system-ui;background:#0e0f12;color:#e8e9ec;padding:24px">
      <h1 style="font-size:18px">Review pages</h1>${pages.map((f) => `<p><a style="color:#ff9a3c" href="${encodeURIComponent(f)}">${f}</a></p>`).join('') || '<p>None yet.</p>'}`);
  }
  fs.stat(p, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404); return res.end('not found'); }
    const type = types[path.extname(p).toLowerCase()] || 'application/octet-stream';
    const m = /bytes=(\d*)-(\d*)/.exec(req.headers.range || '');
    if (m) {
      const a = m[1] ? +m[1] : st.size - +m[2], z = m[1] && m[2] ? +m[2] : st.size - 1;
      res.writeHead(206, { 'content-type': type, 'accept-ranges': 'bytes', 'content-range': `bytes ${a}-${z}/${st.size}`, 'content-length': z - a + 1 });
      return fs.createReadStream(p, { start: a, end: z }).pipe(res);
    }
    res.writeHead(200, { 'content-type': type, 'accept-ranges': 'bytes', 'content-length': st.size });
    fs.createReadStream(p).pipe(res);
  });
}).listen(port, '127.0.0.1', () => console.log(`review server: http://localhost:${port}/  (${root})`));

// Local timeline editor for a talking-head-studio project (Final Cut-style UI, live caption preview, save + render).
//   node <skill>/scripts/editor-server.js "<project _edit folder>" [port]   ->  http://localhost:4747/
// Binds 127.0.0.1 only. Routes:
//   GET  /                 editor UI (scripts/editor/editor.html)
//   GET  /api/state        timeline, SFX events, versions, media URLs
//   PUT  /api/timeline     save timeline.json (previous copy kept in _review/history/)
//   POST /api/render       run render-all.js in the project; GET /api/render -> {running, log, exitCode, exported}
//   GET  /api/wave         audio peaks of the source (cached in _review/wave.json)
//   GET  /api/strip        filmstrip of the source, one frame per second (cached in _review/strip.jpg)
//   GET  /proj/<path>      project files (engine, fonts, assets) for the live preview
//   GET  /media/<path>     files next to the source video (source, exports) with HTTP Range
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn, execFileSync } = require('child_process');

const proj = path.resolve(process.argv[2] || '.'), port = +(process.argv[3] || 4747);
const SKILL = path.resolve(__dirname, '..');
const tlPath = path.join(proj, 'timeline.json');
const readTl = () => JSON.parse(fs.readFileSync(tlPath, 'utf8'));
const srcDir = () => path.resolve(path.dirname(readTl().source));
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.mp4': 'video/mp4',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.otf': 'font/otf', '.ttf': 'font/ttf', '.srt': 'text/plain; charset=utf-8', '.wav': 'audio/wav', '.svg': 'image/svg+xml' };

function sendFile(req, res, p) {
  fs.stat(p, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404); return res.end('not found'); }
    const type = types[path.extname(p).toLowerCase()] || 'application/octet-stream';
    const m = /bytes=(\d*)-(\d*)/.exec(req.headers.range || '');
    const head = { 'content-type': type, 'accept-ranges': 'bytes', 'cache-control': 'no-cache' };
    if (m) {
      const a = m[1] ? +m[1] : st.size - +m[2], z = m[1] && m[2] ? Math.min(+m[2], st.size - 1) : st.size - 1;
      res.writeHead(206, { ...head, 'content-range': `bytes ${a}-${z}/${st.size}`, 'content-length': z - a + 1 });
      return fs.createReadStream(p, { start: a, end: z }).pipe(res);
    }
    res.writeHead(200, { ...head, 'content-length': st.size }); fs.createReadStream(p).pipe(res);
  });
}
const json = (res, code, obj) => { res.writeHead(code, { 'content-type': types['.json'], 'cache-control': 'no-cache' }); res.end(JSON.stringify(obj)); };
const inside = (root, p) => { const r = path.resolve(p); return r === root || r.startsWith(root + path.sep) ? r : null; };
const body = (req) => new Promise((ok, bad) => { let s = ''; req.on('data', (d) => { s += d; if (s.length > 8e6) bad(new Error('too big')); }); req.on('end', () => ok(s)); });

function versions() {
  const tl = readTl(), dir = path.dirname(tl.source), name = path.basename(tl.source, path.extname(tl.source));
  const exp = fs.readdirSync(dir).filter((f) => f.startsWith(name + ' - ') && /\.mp4$/i.test(f)).map((f) => ({ p: path.join(dir, f), url: '/media/' + encodeURIComponent(f) }));
  const oldDir = path.join(proj, 'out', 'old');
  const olds = fs.existsSync(oldDir) ? fs.readdirSync(oldDir).filter((f) => /\.mp4$/i.test(f)).map((f) => ({ p: path.join(oldDir, f), url: '/proj/out/old/' + encodeURIComponent(f) })) : [];
  return [...exp, ...olds].map((v) => ({ ...v, t: fs.statSync(v.p).mtimeMs })).sort((a, b) => b.t - a.t)
    .map((v) => ({ label: path.basename(v.p, '.mp4').replace(name + ' - ', ''), url: v.url, mtime: v.t }));
}

function wave() {
  const cache = path.join(proj, '_review', 'wave.json'), tl = readTl();
  if (fs.existsSync(cache) && fs.statSync(cache).mtimeMs > fs.statSync(tl.source).mtimeMs) return JSON.parse(fs.readFileSync(cache, 'utf8'));
  const sr = 8000, raw = execFileSync('ffmpeg', ['-v', 'error', '-i', tl.source, '-vn', '-ac', '1', '-ar', String(sr), '-f', 'f32le', '-'], { maxBuffer: 1 << 28 });
  const x = new Float32Array(raw.buffer, raw.byteOffset, raw.length / 4); const per = sr / 100, peaks = [];
  for (let i = 0; i < x.length; i += per) { let m = 0; for (let j = i; j < i + per && j < x.length; j++) m = Math.max(m, Math.abs(x[j])); peaks.push(+m.toFixed(3)); }
  const out = { rate: 100, peaks }; fs.mkdirSync(path.dirname(cache), { recursive: true }); fs.writeFileSync(cache, JSON.stringify(out)); return out;
}
function strip() {
  const out = path.join(proj, '_review', 'strip.jpg'), tl = readTl();
  if (fs.existsSync(out) && fs.statSync(out).mtimeMs > fs.statSync(tl.source).mtimeMs) return out;
  const n = Math.ceil(tl.output.duration);
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', tl.source, '-vf', `fps=1,scale=-2:160,tile=${n}x1`, '-frames:v', '1', '-q:v', '4', out]);
  return out;
}

let job = null;
function startRender() {
  if (job && job.running) return job;
  job = { running: true, log: [], exitCode: null, exported: null, started: Date.now() };
  const p = spawn('node', [path.join(SKILL, 'scripts', 'render-all.js')], { cwd: proj });
  const take = (d) => String(d).split(/\r?\n/).filter(Boolean).forEach((l) => { job.log.push(l); if (job.log.length > 400) job.log.shift(); const m = /"exported":\s*"(.+)"/.exec(l); if (m) job.exported = m[1].replace(/\\\\/g, '\\'); });
  p.stdout.on('data', take); p.stderr.on('data', take);
  p.on('close', (code) => { job.running = false; job.exitCode = code; });
  return job;
}

http.createServer(async (req, res) => {
  try {
    const u = new URL(req.url, 'http://x'); const pn = decodeURIComponent(u.pathname);
    if (pn === '/' || pn === '/index.html') return sendFile(req, res, path.join(SKILL, 'scripts', 'editor', 'editor.html'));
    if (pn === '/api/state') {
      const tl = readTl(); const sf = ['sfx-clean.json', 'sfx-events.json'].map((f) => path.join(proj, f)).find((f) => fs.existsSync(f));
      return json(res, 200, { project: path.basename(proj), name: path.basename(tl.source, path.extname(tl.source)), timeline: tl,
        sfx: sf ? JSON.parse(fs.readFileSync(sf, 'utf8')) : [], versions: versions(), sourceUrl: '/media/' + encodeURIComponent(path.basename(tl.source)), render: job });
    }
    if (pn === '/api/timeline' && req.method === 'PUT') {
      const next = JSON.parse(await body(req)); const cur = readTl();
      if (next.source !== cur.source || !Array.isArray(next.segments) || !Array.isArray(next.cards)) return json(res, 400, { error: 'not this project timeline' });
      const hist = path.join(proj, '_review', 'history'); fs.mkdirSync(hist, { recursive: true });
      fs.copyFileSync(tlPath, path.join(hist, `timeline-${new Date().toISOString().replace(/[:.]/g, '-')}.json`));
      fs.writeFileSync(tlPath, JSON.stringify(next, null, 1));
      return json(res, 200, { ok: true, saved: Date.now() });
    }
    if (pn === '/api/render') return json(res, 200, req.method === 'POST' ? startRender() : (job || { running: false, log: [] }));
    if (pn === '/api/wave') return json(res, 200, wave());
    if (pn === '/api/strip') return sendFile(req, res, strip());
    if (pn.startsWith('/proj/')) { const p = inside(proj, path.join(proj, pn.slice(6))); return p ? sendFile(req, res, p) : json(res, 403, {}); }
    if (pn.startsWith('/media/')) { const root = srcDir(); const p = inside(root, path.join(root, pn.slice(7))); return p ? sendFile(req, res, p) : json(res, 403, {}); }
    json(res, 404, { error: 'not found' });
  } catch (e) { json(res, 500, { error: e.message }); }
}).listen(port, '127.0.0.1', () => console.log(`editor: http://localhost:${port}/  (${proj})`));

// Finds where each behind-the-speaker 3D icon is actually visible. Run inside the project after the masks exist:
//   node <skill>/scripts/place-icons.js [--apply]
// For every icon popup with a mask (assets/mask/<id>_rb.mp4): build the person silhouette over the popup window (the
// union of all frames, with the same punch-in zoom the composite applies), then score candidate boxes:
//   + visible fraction (the part NOT hidden by the person) — the icon must read clearly
//   + a little overlap with the silhouette edge (it should still emerge from behind a shoulder or the head side)
//   - any part inside the TikTok/IG UI zones, over the caption band, or off-frame
//   + closeness to the head (the viewer's eye is on the face)
// Writes qc/icon-placement.png (silhouette, zones, chosen box) and, with --apply, the new x/y/size into timeline.json.
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const apply = process.argv.includes('--apply');
const tl = JSON.parse(fs.readFileSync('timeline.json', 'utf8'));
const W = 270, H = 480, K = 1080 / W; // analysis grid (quarter resolution)
const segs = Object.fromEntries(tl.segments.map((s) => [s.id, s]));
const zoomAt = (t) => { let z = 1; tl.cards.forEach((c) => { if (c.zoom && !c.hide) { const g = segs[c.seg]; if (g && t >= g.start && t < g.end + 0.1) z = c.zoom; } }); return z; };

function silhouette(m, q) {
  const raw = execFileSync('ffmpeg', ['-v', 'error', '-i', m.file, '-vf', `scale=${W}:${H},format=gray`, '-f', 'rawvideo', '-'], { maxBuffer: 1 << 28 });
  const n = raw.length / (W * H), sil = new Uint8Array(W * H);
  for (let f = 0; f < n; f++) {
    const t = m.start + f / tl.output.fps; if (t < q.start || t > q.end) continue;
    // skip broken matte frames (a cut inside the clip makes remove_background return a near-full frame)
    let cov = 0; for (let i = 0; i < W * H; i += 7) if (raw[f * W * H + i] > 21) cov++; if (cov / (W * H / 7) > 0.55) continue;
    const z = zoomAt(t);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      // composite zooms the mask around the centre: sample the source pixel that lands here
      const sx = Math.round((x - W / 2) / z + W / 2), sy = Math.round((y - H / 2) / z + H / 2);
      if (sx < 0 || sy < 0 || sx >= W || sy >= H) continue;
      if (raw[f * W * H + sy * W + sx] > 21) sil[y * W + x] = 1;
    }
  }
  return sil;
}
// head = top-most silhouette rows: centre x and top y
function head(sil) {
  for (let y = 0; y < H; y++) { const xs = []; for (let x = 0; x < W; x++) if (sil[y * W + x]) xs.push(x); if (xs.length > 6) return { x: (xs[0] + xs[xs.length - 1]) / 2, y }; }
  return { x: W / 2, y: H * 0.2 };
}
// zones in full-res px
const UI = [[0, 0, 1080, 250], [0, 1290, 1080, 1920], [930, 840, 1080, 1290]]; // top bar, bottom UI, right action column
const CAP = [110, 940, 970, 1180]; // caption band (R3 cards centre y≈1066)
const MARGIN = [[0, 0, 60, 1920], [1020, 0, 1080, 1920]]; // keep icons off the very frame edge
const inside = (x, y, r) => x >= r[0] && x < r[2] && y >= r[1] && y < r[3];

function best(sil, aspect) {
  const h0 = head(sil); let top = null;
  for (const size of [520, 480, 440, 400, 360, 320]) {
    const bw = size / K, bh = size * aspect / K;
    for (let y = 0; y + bh <= H; y += 4) for (let x = -bw * 0.15; x + bw * 0.85 <= W; x += 4) {
      let vis = 0, occ = 0, bad = 0, tot = 0;
      for (let yy = Math.max(0, Math.floor(y)); yy < Math.min(H, y + bh); yy += 2) for (let xx = Math.floor(x); xx < x + bw; xx += 2) {
        tot++; if (xx < 0 || xx >= W) { bad++; continue; }
        const X = xx * K, Y = yy * K;
        if (UI.some((r) => inside(X, Y, r)) || inside(X, Y, CAP) || MARGIN.some((r) => inside(X, Y, r))) bad++;
        if (sil[yy * W + xx]) occ++; else vis++;
      }
      if (!tot) continue;
      const fv = vis / tot, fo = occ / tot, fb = bad / tot;
      const cx = x + bw / 2, cy = y + bh / 2, dist = Math.hypot(cx - h0.x, (cy - h0.y) * 0.8) / W;
      // want ~88% visible with ~8-15% tucked behind the body; no zones; near the head; bigger is better
      const score = fv * 2 - Math.abs(fo - 0.12) * 2.5 - fb * 4 - dist * 1.2 + size / 600;
      if (!top || score > top.score) top = { score, x: Math.round(x * K), y: Math.round(y * K), size, fv, fo, fb, head: { x: Math.round(h0.x * K), y: Math.round(h0.y * K) } };
    }
  }
  return top;
}

const out = [];
const pops = (tl.popups || []).filter((q) => q.kind === 'icon' && q.behind);
for (const q of pops) {
  const m = (tl.masks || []).find((mm) => mm.popup === q.id && fs.existsSync(mm.file)); if (!m) { console.warn('! no mask for', q.id); continue; }
  const sil = silhouette(m, q);
  const dim = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', q.src]).toString().trim().split(',').map(Number);
  const b = best(sil, dim[1] / dim[0]);
  out.push({ id: q.id, ...b, sil });
  if (apply) Object.assign(q, { x: b.x, y: b.y, size: b.size });
}
// review sheet: silhouettes (grey), zones (red), caption band (yellow), chosen box (green)
fs.mkdirSync('qc', { recursive: true });
const sheetW = W * out.length, img = Buffer.alloc(sheetW * H * 3, 20);
out.forEach((o, k) => {
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * sheetW + k * W + x) * 3, X = x * K, Y = y * K; let c = o.sil[y * W + x] ? [150, 150, 150] : [25, 25, 25];
    if (UI.some((r) => inside(X, Y, r))) c = [c[0] + 90, c[1] * 0.4, c[2] * 0.4];
    if (inside(X, Y, CAP)) c = [c[0] + 60, c[1] + 60, c[2] * 0.3];
    const bx = (X >= o.x && X < o.x + o.size), by = (Y >= o.y && Y < o.y + o.size * 1), edge = bx && by && (X - o.x < 12 || o.x + o.size - X < 12 || Y - o.y < 12 || o.y + o.size - Y < 12);
    if (edge) c = [40, 230, 90];
    img[i] = Math.min(255, c[0]); img[i + 1] = Math.min(255, c[1]); img[i + 2] = Math.min(255, c[2]);
  }
});
execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', `${sheetW}x${H}`, '-i', '-', 'qc/icon-placement.png'], { input: img });
if (apply) fs.writeFileSync('timeline.json', JSON.stringify(tl, null, 1));
console.log(JSON.stringify(out.map(({ sil, ...o }) => ({ ...o, score: +o.score.toFixed(3), fv: +o.fv.toFixed(2), fo: +o.fo.toFixed(2), fb: +o.fb.toFixed(2) })), null, 1));

// Trims transparent padding around 3D icon PNGs: node trim-icons.js assets/icon_a.png ...  -> *_t.png
const { execFileSync } = require('child_process');
for (const f of process.argv.slice(2)) {
  const [W, H] = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', f]).toString().trim().split(',').map(Number);
  const a = execFileSync('ffmpeg', ['-v', 'error', '-i', f, '-vf', 'alphaextract', '-f', 'rawvideo', '-pix_fmt', 'gray', '-'], { maxBuffer: 1 << 26 });
  let x0 = W, y0 = H, x1 = 0, y1 = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (a[y * W + x] > 20) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  const p = 16; x0 = Math.max(0, x0 - p); y0 = Math.max(0, y0 - p); x1 = Math.min(W - 1, x1 + p); y1 = Math.min(H - 1, y1 + p);
  const out = f.replace(/\.png$/, '_t.png'); const crop = `crop=${x1 - x0 + 1}:${y1 - y0 + 1}:${x0}:${y0}`;
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', f, '-vf', crop, out]);
  console.log(f, `${W}x${H}`, '->', crop, out);
}

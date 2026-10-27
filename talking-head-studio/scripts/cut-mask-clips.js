// Cuts short, frame-aligned clips of the source for every popup with `behind: true`,
// so they can go through Higgsfield remove_background (video). Run inside the project:
//   node <skill>/scripts/cut-mask-clips.js
// Writes assets/mask/<id>.mp4 and adds tl.masks entries pointing at assets/mask/<id>_rb.mp4
// (save the remove_background result under that name; composite.js skips masks that are missing).
const { execFileSync } = require('child_process');
const fs = require('fs');

const tl = JSON.parse(fs.readFileSync('timeline.json', 'utf8'));
const fps = tl.output.fps; const F = (x) => Math.round(x * fps);
fs.mkdirSync('assets/mask', { recursive: true });
const masks = [];
(tl.popups || []).filter((p) => p.behind).forEach((p) => {
  const a = Math.max(0, F(p.start - 0.15)), z = Math.min(F(tl.output.duration), F(p.end + 0.2));
  const clip = `assets/mask/${p.id}.mp4`;
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-ss', (a / fps).toFixed(4), '-i', tl.source, '-frames:v', String(z - a), '-an',
    '-c:v', 'libx264', '-crf', '16', '-pix_fmt', 'yuv420p', clip]);
  masks.push({ file: `assets/mask/${p.id}_rb.mp4`, start: +(a / fps).toFixed(4), clip, popup: p.id });
});
tl.masks = masks.map(({ file, start, popup }) => ({ file, start, popup }));
fs.writeFileSync('timeline.json', JSON.stringify(tl, null, 2));
console.log(JSON.stringify({ upload_for_remove_background: masks.map((m) => ({ clip: m.clip, save_result_as: m.file })) }, null, 2));

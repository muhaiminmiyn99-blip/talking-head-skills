// Composites source + B-roll + caption frames: node composite.js <framesDir> <out.mp4> [startSec] [endSec]
// Three simple passes (a single big filter graph stalled/truncated on this FFmpeg build):
//   1. each A-roll piece and each video B-roll part -> its own exact-frame-count clip
//   2. concat demuxer (stream copy) -> base track
//   3. base + caption PNG layer + source audio -> final
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const tl = JSON.parse(fs.readFileSync('timeline.json', 'utf8'));
const [framesDir = 'frames', out = 'render.mp4', s = '0', e = String(tl.output.duration)] = process.argv.slice(2);
const t0 = parseFloat(s), t1 = parseFloat(e), fps = tl.output.fps;
const segs = Object.fromEntries(tl.segments.map((x) => [x.id, x]));
const ff = (args) => execFileSync('ffmpeg', ['-v', 'error', '-y', ...args], { stdio: 'inherit' });
const tmp = 'pieces'; fs.rmSync(tmp, { recursive: true, force: true }); fs.mkdirSync(tmp);
const enc = ['-c:v', 'libx264', '-preset', 'medium', '-crf', '14', '-pix_fmt', 'yuv420p', '-r', String(fps), '-an'];

// Punch-in zoom: instant cut-in at the segment start, held until the segment ends (+0.1 s). Source time = it + piece start.
const zoomAt = (start) => '1+' + (tl.cards.filter((c) => c.zoom && !c.hide).map((c) => {
  const g = segs[c.seg]; return `${(c.zoom - 1).toFixed(3)}*between(it+${start.toFixed(4)},${g.start},${g.end + 0.1})`;
}).join('+') || '0');

// Frame-aligned piece list: A-roll gaps between video B-roll parts (html parts are drawn in the caption layer).
const F = (x) => Math.round(x * fps);
const vids = tl.broll.filter((b) => b.file && b.end > t0 && b.start < t1).sort((a, b) => a.start - b.start);
const pieces = []; let cur = F(t0);
vids.forEach((b) => { const a = F(Math.max(b.start, t0)), z = F(Math.min(b.end, t1)); if (a > cur) pieces.push({ a: cur, z: a }); pieces.push({ a, z, b }); cur = z; });
if (cur < F(t1)) pieces.push({ a: cur, z: F(t1) });

const list = pieces.map((p, i) => {
  const file = path.join(tmp, `p${String(i).padStart(2, '0')}.mp4`); const n = p.z - p.a; const a = p.a / fps;
  if (!p.b) {
    ff(['-ss', a.toFixed(4), '-i', tl.source, '-vf',
      `zoompan=z='${zoomAt(a)}':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=${fps}`,
      '-frames:v', String(n), ...enc, file]);
  } else {
    const b = p.b;
    // Fill 9:16; optional reframe (zoom around cx/cy, shiftY px down on black); 1.08 -> 1.0 settle over 0.35 s; hold last frame if short.
    const z = b.zoom || 1, cx = b.cx ?? 0.5, cy = b.cy ?? 0.5, sy = b.shiftY || 0;
    const reframe = (z > 1 ? `scale=${Math.round(1080 * z / 2) * 2}:${Math.round(1920 * z / 2) * 2},` +
      `crop=1080:1920:'min(max(iw*${cx}-540,0),iw-1080)':'min(max(ih*${cy}-960,0),ih-1920)',` : '') +
      (sy ? `crop=1080:${1920 - sy}:0:0,pad=1080:1920:0:${sy}:black,` : '');
    ff(['-i', b.file, '-vf',
      `fps=${fps},scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,${reframe}` +
      `zoompan=z='1+0.08*max(0,1-it/0.35)':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=${fps},tpad=stop_mode=clone:stop_duration=2`,
      '-frames:v', String(n), ...enc, file]);
  }
  return `file '${path.basename(file)}'`;
});
fs.writeFileSync(path.join(tmp, 'list.txt'), list.join('\n'));
const base = path.join(tmp, 'base.mp4');
ff(['-f', 'concat', '-safe', '0', '-i', path.join(tmp, 'list.txt'), '-c', 'copy', base]);

// Person matte for "behind the speaker" popups: removed-background clips (subject on pure black)
// thresholded into a mask, given the same punch-in zoom as the A-roll, laid on a black track.
const masks = (tl.masks || []).filter((m) => fs.existsSync(m.file));
const behindDir = framesDir + '_behind';
const useBehind = masks.length && fs.existsSync(behindDir);
let maskTrack = null;
if (useBehind) {
  const mlist = []; let mc = F(t0), k = 0;
  const black = (n) => { const f = path.join(tmp, `m${k++}.mp4`); ff(['-f', 'lavfi', '-i', `color=c=black:s=1080x1920:r=${fps}`, '-frames:v', String(n), ...enc, f]); mlist.push(`file '${path.basename(f)}'`); };
  masks.sort((a, b) => a.start - b.start).forEach((m) => {
    const a = F(m.start); const n = Number(execFileSync('ffprobe', ['-v', 'error', '-count_frames', '-select_streams', 'v', '-show_entries', 'stream=nb_read_frames', '-of', 'csv=p=0', m.file]).toString().trim());
    if (a > mc) black(a - mc);
    const f = path.join(tmp, `m${k++}.mp4`);
    ff(['-i', m.file, '-vf', `scale=1080:1920,format=gray,lutyuv=y='if(gt(val,21),255,0)',dilation,erosion,gblur=sigma=2,format=yuv420p,` +
      `zoompan=z='${zoomAt(m.start)}':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=${fps}`, '-frames:v', String(n), ...enc, f]);
    mlist.push(`file '${path.basename(f)}'`); mc = a + n;
  });
  if (mc < F(t1)) black(F(t1) - mc);
  fs.writeFileSync(path.join(tmp, 'mlist.txt'), mlist.join('\n'));
  maskTrack = path.join(tmp, 'mask.mp4');
  ff(['-f', 'concat', '-safe', '0', '-i', path.join(tmp, 'mlist.txt'), '-c', 'copy', maskTrack]);
}

const sfxTrack = fs.existsSync('sfx-track.wav') ? 'sfx-track.wav' : null;
const ins = ['-i', base, '-framerate', String(fps), '-i', `${framesDir}/%05d.png`, '-ss', String(t0), '-t', String(t1 - t0), '-i', tl.source];
let graph;
if (useBehind) {
  ins.push('-framerate', String(fps), '-i', `${behindDir}/%05d.png`, '-i', maskTrack);
  graph = '[0:v]split[b1][b2];[b1][3:v]overlay=eof_action=pass[x];[4:v]format=gray[m];[b2][m]alphamerge[p];[x][p]overlay[y];[y][1:v]overlay=eof_action=pass,format=yuv420p[v]';
} else graph = '[0:v][1:v]overlay=eof_action=pass,format=yuv420p[v]';
const aIdx = ins.filter((x) => x === '-i').length;
if (sfxTrack) { ins.push('-i', sfxTrack); graph += `;[2:a]aresample=48000[va];[va][${aIdx}:a]amix=inputs=2:normalize=0:duration=first,alimiter=limit=0.89:attack=2:release=60:level=false[a]`; }
ff([...ins, '-filter_complex', graph, '-map', '[v]', '-map', sfxTrack ? '[a]' : '2:a',
  '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-r', String(fps), '-c:a', 'aac', '-b:a', '192k',
  '-movflags', '+faststart', '-t', String(t1 - t0), out]);
if (!process.env.KEEP) fs.rmSync(tmp, { recursive: true, force: true });
console.log('wrote', out, '(', pieces.length, 'pieces )');

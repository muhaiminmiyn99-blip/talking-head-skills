// Full render + QC for a project made by init-project.js. Run inside the project folder:
//   node <skill>/scripts/render-all.js            -> final export
//   node <skill>/scripts/render-all.js --keep     -> keep frame folders for debugging
// Steps: caption/B-roll front layer, behind layer (if any behind popups), SFX mix,
// composite, SRT, QC (duration/frames, decode, loudness + true peak, safe-area sheet,
// sample sheet), then copy "<source> - EDIT[ vN].mp4" next to the source video.
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const keep = process.argv.includes('--keep');
const tl = JSON.parse(fs.readFileSync('timeline.json', 'utf8'));
const dur = tl.output.duration;
const sh = (cmd, a) => execFileSync(cmd, a, { stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 1 << 28 }).toString();
const step = (msg) => console.log('-', msg);

step('front layer'); sh('node', ['render-captions.js', '0', String(dur), 'frames', 'front']);
const behind = (tl.popups || []).some((p) => p.behind);
fs.rmSync('frames_behind', { recursive: true, force: true });
if (behind) {
  const missing = (tl.masks || []).filter((m) => !fs.existsSync(m.file)).map((m) => m.file);
  if (!tl.masks?.length || missing.length) console.warn('! behind popups without masks:', missing.join(', ') || 'none cut yet', '- icons will render without person occlusion');
  step('behind layer'); sh('node', ['render-captions.js', '0', String(dur), 'frames_behind', 'behind']);
}
const haveSfx = fs.existsSync(path.join(tl.sfx?.dir || 'sfx/pro', 'whoosh.wav'));
fs.rmSync('sfx-track.wav', { force: true });
if (haveSfx) { step('sfx mix'); console.log('  ', sh('node', ['mix-sfx.js']).trim()); } else console.warn('! SFX library missing - exporting without SFX');

fs.mkdirSync('out', { recursive: true }); fs.mkdirSync('qc', { recursive: true });
const out = path.join('out', 'final.mp4');
step('composite'); sh('node', ['composite.js', 'frames', out]);

// SRT from segments
const ts = (s) => { const ms = Math.round(s * 1000); const p = (n, l = 2) => String(n).padStart(l, '0');
  return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`; };
fs.writeFileSync(path.join('out', 'final.srt'), tl.segments.map((s, i) => `${i + 1}\n${ts(s.start)} --> ${ts(s.end)}\n${s.text}\n`).join('\n'));

// QC
step('qc');
const probe = JSON.parse(sh('ffprobe', ['-v', 'error', '-count_frames', '-print_format', 'json', '-show_entries', 'stream=codec_type,width,height,nb_read_frames:format=duration', out]));
let decodeOk = true; try { sh('ffmpeg', ['-v', 'error', '-i', out, '-f', 'null', '-']); } catch { decodeOk = false; }
// ebur128 prints its summary to stderr
const ebur = require('child_process').spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', out, '-vn', '-af', 'ebur128=peak=true', '-f', 'null', '-'], { encoding: 'utf8', maxBuffer: 1 << 26 }).stderr || '';
const last = (re) => { const m = ebur.match(re); return m ? +m[m.length - 1].match(/-?[\d.]+/)[0] : null; };
const I = last(/I:\s+-?[\d.]+ LUFS/g), TP = last(/Peak:\s+-?[\d.]+ dBFS/g);
const segs = Object.fromEntries(tl.segments.map((s) => [s.id, s]));
const sampleT = [...tl.cards.filter((c) => !c.hide).map((c) => (segs[c.seg].start + segs[c.seg].end) / 2), ...tl.broll.map((b) => (b.start + b.end) / 2),
  ...(tl.popups || []).map((p) => p.end - 0.4)].filter((t) => t < dur).sort((a, b) => a - b).slice(0, 21);
const OV = 'drawbox=x=0:y=0:w=1080:h=270:color=red@0.35:t=fill,drawbox=x=0:y=1260:w=1080:h=660:color=red@0.35:t=fill,drawbox=x=0:y=270:w=120:h=990:color=red@0.35:t=fill,drawbox=x=900:y=840:w=180:h=420:color=red@0.35:t=fill,drawbox=x=960:y=270:w=120:h=570:color=red@0.35:t=fill';
const sel = sampleT.map((t) => `eq(n\\,${Math.round(t * tl.output.fps)})`).join('+');
const cols = 7, rows = Math.ceil(sampleT.length / cols);
sh('ffmpeg', ['-v', 'error', '-y', '-i', out, '-vf', `select='${sel}',${OV},scale=200:-2,tile=${cols}x${rows}`, '-fps_mode', 'passthrough', '-frames:v', '1', '-update', '1', path.join('qc', 'safe-area.png')]);
sh('ffmpeg', ['-v', 'error', '-y', '-i', out, '-vf', `fps=2,scale=150:-2,tile=12x${Math.ceil(dur * 2 / 12)}`, '-frames:v', '1', '-update', '1', path.join('qc', 'sheet-2fps.png')]);
const v = probe.streams.find((s) => s.codec_type === 'video');
const report = {
  output: out, duration: +(+probe.format.duration).toFixed(3), frames: +v.nb_read_frames, expected_frames: Math.round(dur * tl.output.fps),
  size: `${v.width}x${v.height}`, decode_ok: decodeOk, loudness_lufs: I, true_peak_dbfs: TP, sfx: haveSfx, behind_layer: behind,
  checks: { frames_ok: +v.nb_read_frames === Math.round(dur * tl.output.fps), peak_ok: TP <= -0.5, loudness_ok: I > -18 && I < -11 },
  review: ['qc/safe-area.png (red = TikTok/IG UI zones; text must stay clear)', 'qc/sheet-2fps.png'],
};
fs.writeFileSync(path.join('qc', 'report.json'), JSON.stringify(report, null, 2));

// export next to the source, never overwriting
const srcDir = path.dirname(tl.source), name = path.basename(tl.source, path.extname(tl.source));
let dst = path.join(srcDir, `${name} - EDIT.mp4`); let k = 2;
while (fs.existsSync(dst)) dst = path.join(srcDir, `${name} - EDIT v${k++}.mp4`);
fs.copyFileSync(out, dst); fs.copyFileSync(path.join('out', 'final.srt'), dst.replace(/\.mp4$/, '.srt'));
// OneDrive can briefly lock fresh frame folders (EPERM); retry, then leave them rather than crash after export
if (!keep) for (const d of ['frames', 'frames_behind', 'pieces']) { try { fs.rmSync(d, { recursive: true, force: true, maxRetries: 5, retryDelay: 400 }); } catch (e) { console.warn(`! could not remove ${d}: ${e.code}`); } }
console.log(JSON.stringify({ ...report, exported: dst }, null, 2));
// clickable review page (video + edit timeline) next to the export
try { console.log(sh('node', [path.join(__dirname, 'make-review.js'), dst]).trim()); } catch (e) { console.warn('! review page failed:', e.message); }

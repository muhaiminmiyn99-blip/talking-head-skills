// Creates an edit project for a talking-head video and drafts timeline.json.
//   node init-project.js "<video.mp4>" [--project <dir>] [--lang ms|en|auto]
// Steps: copy engine + fonts + node_modules, copy SFX/icon library, probe the video,
// transcribe with whisper.cpp (FFmpeg whisper filter), drop known hallucinations, draft
// 1-2 line A1 caption cards, write _review/overview.png for a quick visual check.
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SKILL = path.resolve(__dirname, '..');
const LIB = process.env.THS_LIBRARY || 'C:/Users/muhai/Documents/talking-head-studio-library';
const MODEL = process.env.THS_WHISPER_MODEL || 'C:/Users/muhai/.cache/whisper/ggml-large-v3-turbo.bin';

const args = process.argv.slice(2);
const video = path.resolve(args[0] || '');
if (!args[0] || !fs.existsSync(video)) { console.error('usage: node init-project.js "<video.mp4>" [--project dir] [--lang ms]'); process.exit(1); }
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const base = path.basename(video, path.extname(video));
const proj = path.resolve(opt('--project', path.join(path.dirname(video), base + '_edit')));
const lang = opt('--lang', 'auto');
const run = (cmd, a, o = {}) => execFileSync(cmd, a, { maxBuffer: 1 << 28, ...o });

// 1. project folder with engine
fs.mkdirSync(proj, { recursive: true });
for (const f of fs.readdirSync(path.join(SKILL, 'engine'))) {
  const src = path.join(SKILL, 'engine', f), dst = path.join(proj, f);
  if (f === 'node_modules' && fs.existsSync(dst)) continue;
  fs.cpSync(src, dst, { recursive: true });
}
for (const d of ['assets/icons', 'assets/mask', 'sfx/pro', '_review', 'out', 'qc']) fs.mkdirSync(path.join(proj, d), { recursive: true });
if (fs.existsSync(path.join(LIB, 'sfx'))) fs.cpSync(path.join(LIB, 'sfx'), path.join(proj, 'sfx/pro'), { recursive: true });
else console.warn('! SFX library missing:', LIB + '/sfx (SFX will be skipped until it exists)');
if (fs.existsSync(path.join(LIB, 'icons'))) fs.cpSync(path.join(LIB, 'icons'), path.join(proj, 'assets/icons'), { recursive: true });
if (fs.existsSync(path.join(LIB, 'objects'))) fs.cpSync(path.join(LIB, 'objects'), path.join(proj, 'assets/objects'), { recursive: true }); // photo cut-outs for collage B-roll
// HyperFrames B-roll project (default look): starter + template generator + the fx stills (leather, figure, phone, desk, candles)
const hf = path.join(proj, 'hf');
if (!fs.existsSync(path.join(hf, 'build-hf.cjs'))) fs.cpSync(path.join(SKILL, 'hf-starter'), hf, { recursive: true });
for (const d of ['assets/img', 'assets/clips', 'compositions', 'renders']) fs.mkdirSync(path.join(hf, d), { recursive: true });
if (fs.existsSync(path.join(LIB, 'fx'))) fs.cpSync(path.join(LIB, 'fx'), path.join(hf, 'assets/img'), { recursive: true });
if (fs.existsSync(path.join(LIB, 'brand'))) { fs.cpSync(path.join(LIB, 'brand'), path.join(proj, 'assets/brand'), { recursive: true }); fs.cpSync(path.join(LIB, 'brand'), path.join(hf, 'assets/img'), { recursive: true }); } // client marks (Fira)

// 2. probe
const pj = JSON.parse(run('ffprobe', ['-v', 'error', '-print_format', 'json', '-show_streams', '-show_format', video]).toString());
const vs = pj.streams.find((s) => s.codec_type === 'video'); const as = pj.streams.find((s) => s.codec_type === 'audio');
const [fn, fd] = (vs.avg_frame_rate || vs.r_frame_rate).split('/').map(Number);
const srcFps = fd ? fn / fd : 30; const dur = +(+pj.format.duration).toFixed(3);
const rot = Number((vs.side_data_list || []).find((x) => x.rotation !== undefined)?.rotation || vs.tags?.rotate || 0);
const W = Math.abs(rot) === 90 ? vs.height : vs.width, H = Math.abs(rot) === 90 ? vs.width : vs.height;
const warnings = [];
if (!as) warnings.push('no audio stream');
if (Math.abs(W / H - 9 / 16) > 0.01) warnings.push(`source is ${W}x${H}, not 9:16 - the engine fills 1080x1920; reframe/crop decisions needed`);

// 3. transcription (whisper.cpp through FFmpeg). Run from the model's drive so a drive-less path parses in the filter.
const wjson = path.join(proj, '_review', 'whisper.json');
let segments = [];
if (as && fs.existsSync(MODEL)) {
  const modelArg = MODEL.replace(/^[A-Za-z]:/, '').replace(/\\/g, '/');
  const out = wjson.replace(/^[A-Za-z]:/, '').replace(/\\/g, '/');
  if (fs.existsSync(wjson)) fs.rmSync(wjson);
  run('ffmpeg', ['-v', 'error', '-y', '-i', video, '-vn', '-af',
    `aresample=16000,whisper=model=${modelArg}:language=${lang}:queue=30:destination=${out}:format=json`, '-f', 'null', '-'],
    { cwd: MODEL.slice(0, 3) });
  const HALL = /terima kasih kerana menonton|thank(s| you) for watching|please subscribe|subtitles by|amara\.org/i;
  segments = fs.readFileSync(wjson, 'utf8').split(/\r?\n/).filter(Boolean).map((l) => JSON.parse(l))
    .map((s) => ({ start: +(s.start / 1000).toFixed(2), end: +(s.end / 1000).toFixed(2), text: s.text.trim() }))
    .filter((s) => s.text && !HALL.test(s.text))
    .map((s, i) => ({ id: 'S' + (i + 1), ...s }));
} else warnings.push(as ? 'whisper model missing: ' + MODEL : 'no audio: transcript skipped');

// 4. draft caption cards (locked look R3): small white lead + big lime key word; pick better key words when designing
const cap = (w) => w.replace(/^([a-z])/, (m) => m.toUpperCase());
const cards = segments.map((s) => {
  const w = s.text.split(/\s+/); const k = w.length > 3 ? 2 : 1;
  const lead = w.slice(0, w.length - k).join(' '), key = w.slice(w.length - k).map(cap).join(' ');
  return { seg: s.id, r3: true, ...(lead ? { lead } : {}), key };
});

const tl = {
  source: video.replace(/\\/g, '/'),
  output: { width: 1080, height: 1920, fps: 30, duration: dur },
  source_info: { width: W, height: H, fps: +srcFps.toFixed(3), rotation: rot, audio: !!as },
  notes: 'Draft from init-project.js. Segment times come from whisper; word times are estimated by character share. Review flagged words, then design cards/broll/popups.',
  accent: '#FF9A3C',
  broll_layer: 'broll-iman.js',
  broll_style: 'HyperFrames R4 (hf/)',
  caption_style: 'R3 lime bold',
  safe_area: { platforms: 'TikTok + Instagram Reels', x: [120, 900], y: [270, 1260] },
  segments, cards, broll: [], popups: [], masks: [], endcard: null,
  sfx: { dir: 'sfx/pro', bus_gain: 0.42, mode: 'clean', drone: true, r3keys: true, peak_align: ['whoosh', 'rise', 'swipe', 'magic', 'slide', 'riser', 'boom', 'hit'], gains: { impact: 0.8, magic: 0.8 } },
};
const tlPath = path.join(proj, 'timeline.json');
if (fs.existsSync(tlPath)) { fs.copyFileSync(tlPath, tlPath.replace(/\.json$/, `.bak-${Date.now()}.json`)); }
fs.writeFileSync(tlPath, JSON.stringify(tl, null, 2));

// 5. review sheets: 1 fps overview + audio level timeline
const cols = 8, n = Math.ceil(dur);
run('ffmpeg', ['-v', 'error', '-y', '-i', video, '-vf', `fps=1,scale=180:-2,tile=${cols}x${Math.ceil(n / cols)}`, '-frames:v', '1', path.join(proj, '_review', 'overview.png')]);

console.log(JSON.stringify({ project: proj, source: tl.source, source_info: tl.source_info, duration: dur, segments: segments.length, warnings,
  transcript: segments.map((s) => `${s.id} ${s.start}-${s.end} ${s.text}`) }, null, 2));

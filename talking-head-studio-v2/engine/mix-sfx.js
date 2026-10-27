// Mixes sfx-events.json (written by render-captions.js) into one stereo SFX track: node mix-sfx.js [out.wav]
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const tl = JSON.parse(fs.readFileSync('timeline.json', 'utf8'));
let events = JSON.parse(fs.readFileSync('sfx-events.json', 'utf8'));
const FR = 1 / tl.output.fps;

// Voice onsets (syllable/word attacks) of the source: the "beat" of a talking-head edit. Clean mode snaps hits onto them.
function voiceOnsets() {
  const sr = 22050, hop = 512, fr = sr / hop;
  const raw = execFileSync('ffmpeg', ['-v', 'error', '-i', tl.source, '-vn', '-ac', '1', '-ar', String(sr), '-af', 'highpass=f=120', '-f', 'f32le', '-'], { maxBuffer: 1 << 28 });
  const x = new Float32Array(raw.buffer, raw.byteOffset, raw.length / 4); const E = [];
  for (let i = 0; i + hop <= x.length; i += hop) { let s = 0; for (let j = 0; j < hop; j++) s += x[i + j] * x[i + j]; E.push(Math.log(1e-9 + s)); }
  const O = E.map((e, i) => Math.max(0, e - (E[i - 1] ?? e))); const m = O.reduce((a, b) => a + b, 0) / O.length;
  const sd = Math.sqrt(O.reduce((a, b) => a + (b - m) ** 2, 0) / O.length), thr = m + 1.6 * sd; const on = [];
  O.forEach((o, i) => { if (o > thr && o >= (O[i - 1] || 0) && o >= (O[i + 1] || 0)) on.push(i / fr); });
  return on;
}

if (tl.sfx?.mode === 'clean') {
  // Clean mode: one sound in and one out per B-roll part, at most two accents inside it (headline accent + main object),
  // one pop per popup, a bass hit on punch-ins; accents snap to the nearest voice onset; nothing closer than 0.22 s.
  const on = voiceOnsets(); const snap = (t, w = 0.09) => { let b = t, d = w; on.forEach((o) => { if (Math.abs(o - t) < d) { d = Math.abs(o - t); b = o; } }); return b; };
  const segs = Object.fromEntries(tl.segments.map((s) => [s.id, s])); const engine = events; const ev = [];
  const inPart = (t) => tl.broll.find((b) => t >= b.start && t < b.end);
  tl.broll.forEach((b) => {
    if (b.cues) { b.cues.forEach((c) => ev.push({ t: b.start + c.t, type: c.type, gain: c.gain, pr: c.pr ?? 1, free: c.type.startsWith('key') }));
      if (!b.cues.some((c) => c.type === 'whoosh')) { if (b.sfxIn != null) ev.push({ t: b.start + b.sfxIn, type: 'whoosh', gain: 0.5, pr: 3 }); if (b.sfxOut != null) ev.push({ t: b.end - b.sfxOut, type: 'whoosh', gain: 0.5, pr: 3 }); }
      if (tl.sfx.drone) ev.push({ t: b.start, type: 'drone', gain: 0.6, dur: b.end - b.start, pr: 9, free: true }); return; }
    if (b.sfxIn != null) ev.push({ t: b.start + b.sfxIn, type: 'whoosh', gain: 0.55, pr: 3 });
    else if (b.tin === 'iris') ev.push({ t: b.start + 4 * FR, type: 'whoosh', gain: 0.55, pr: 3 });
    else if (b.tin === 'dip' || b.tin === 'pop') ev.push({ t: b.start, type: 'swipe', gain: 0.5, pr: 3 });
    else ev.push({ t: b.start, type: 'whoosh', gain: 0.5, pr: 3 });
    (b.accents || []).forEach((a) => ev.push({ t: snap(b.start + a.t), type: a.type || 'select', gain: 0.6, pr: 1 }));
    if (b.sfxOut != null) ev.push({ t: b.end - b.sfxOut, type: 'swipe', gain: 0.45, pr: 3 });
    else if (b.tout && b.tout !== 'iris') ev.push({ t: b.end - (b.tout === 'flicker' ? 3 * FR : 0), type: b.tout === 'spin' ? 'whoosh' : 'swipe', gain: 0.4, pr: 3 });
    ['select', 'iconpop'].forEach((ty) => { const e = engine.find((x) => x.type === ty && x.t >= b.start + 0.4 && x.t < b.end - 0.3); if (e) ev.push({ t: snap(e.t), type: ty, gain: 0.6, pr: 1 }); });
  });
  (tl.popups || []).forEach((q) => { const ty = q.kind === 'icon' ? 'iconpop' : 'select'; const e = engine.find((x) => x.type === ty && x.t >= q.start - 0.5 && x.t < q.end && !inPart(x.t)); if (e) ev.push({ t: snap(e.t), type: ty, gain: 0.6, pr: 1 }); });
  tl.cards.filter((c) => c.zoom && !c.hide).forEach((c) => ev.push({ t: snap(segs[c.seg].start, 0.12), type: 'bass', gain: 0.5, pr: 2 }));
  // R3: a short click when each lime key word pops (same word clock as captions.html)
  if (tl.sfx.r3keys) tl.cards.filter((c) => c.r3 && !c.hide).forEach((c) => { const g = segs[c.seg]; const ws = [c.lead, c.key, c.sub].filter(Boolean).join(' ').split(' '); const tot = ws.reduce((a, w) => a + w.length + 1, 0);
    const lead = c.lead ? c.lead.split(' ') : []; const acc = lead.reduce((a, w) => a + w.length + 1, 0); ev.push({ t: g.start + (g.end - g.start) * 0.8 * acc / tot, type: 'click', gain: 0.4, pr: 1 }); });
  (tl.duck || []).forEach((d) => ev.push({ t: d.t + d.d + 0.02, type: 'deep', gain: 0.6, pr: 3 }));
  ev.push({ t: 0.02, type: 'glass', gain: 0.3, pr: 2 });
  if (tl.endcard) ev.push({ t: tl.endcard.start, type: 'boom', gain: 0.45, pr: 3 }, { t: tl.endcard.start + 0.02, type: 'glass', gain: 0.25, pr: 3 });
  const kept = []; ev.sort((a, b) => b.pr - a.pr || a.t - b.t).forEach((e) => { if (e.free || e.pr >= 3 || !kept.some((k) => !k.free && Math.abs(k.t - e.t) < 0.22)) kept.push(e); });
  events = kept.sort((a, b) => a.t - b.t);
  fs.writeFileSync('sfx-clean.json', JSON.stringify(events, null, 1));
} else if (tl.sfx?.cinematic !== false) {
  // Cinematic layer (Iman style), derived from the timeline: riser into each B-roll cut + boom on the cut,
  // reverb tail back to A-roll, bass hit on punch-in zooms, glass hit on the hook, boom + glass on the end card.
  const segs = Object.fromEntries(tl.segments.map((s) => [s.id, s]));
  tl.broll.forEach((b) => {
    events.push({ t: b.start, type: 'riser', gain: 0.45 }, { t: b.start, type: 'boom', gain: 0.55 }, { t: b.end - 0.05, type: 'tail', gain: 0.4 });
    if (b.scene === 'ai-icon') events.push({ t: b.start + 0.05, type: 'aihit', gain: 0.5 });
  });
  tl.cards.filter((c) => c.zoom && !c.hide).forEach((c) => events.push({ t: segs[c.seg].start, type: 'bass', gain: 0.6 }));
  events.push({ t: 0.02, type: 'glass', gain: 0.35 });
  if (tl.endcard) events.push({ t: tl.endcard.start, type: 'boom', gain: 0.5 }, { t: tl.endcard.start, type: 'glass', gain: 0.3 });
}
const out = process.argv[2] || 'sfx-track.wav';
const SR = 48000, CH = 2, dur = tl.output.duration, bus = tl.sfx?.bus_gain ?? 0.35;
const dir = tl.sfx?.dir || 'sfx';

const cache = {};
const load = (type) => cache[type] ??= (() => {
  const raw = execFileSync('ffmpeg', ['-v', 'error', '-i', path.join(dir, type + '.wav'), '-f', 'f32le', '-ac', String(CH), '-ar', String(SR), '-'], { maxBuffer: 1 << 28 });
  return new Float32Array(raw.buffer, raw.byteOffset, raw.length / 4);
})();

const peaks = {};
const peakAt = (type) => peaks[type] ??= (() => { const s = load(type); let pi = 0, pv = 0; for (let i = 0; i < s.length; i++) if (Math.abs(s[i]) > pv) { pv = Math.abs(s[i]); pi = i; } return pi / CH / SR; })();

const mix = new Float32Array(Math.ceil(dur * SR) * CH);
for (const e of events) {
  if (e.t < 0 || e.t >= dur) continue;
  // Transient SFX start on the event; swells (whoosh, rise, ...) are placed so their loudest moment lands on it.
  const s = load(e.type); const shift = (tl.sfx?.peak_align || []).includes(e.type) ? peakAt(e.type) : 0;
  const o = Math.max(0, Math.round((e.t - shift) * SR)) * CH; const g = bus * (e.gain ?? 1) * (tl.sfx?.gains?.[e.type] ?? 1);
  // optional duration (beds): cut at dur with a 0.3 s fade
  const n = e.dur ? Math.min(s.length, Math.round(e.dur * SR) * CH) : s.length, fo = Math.round(0.3 * SR) * CH;
  for (let i = 0; i < n && o + i < mix.length; i++) mix[o + i] += s[i] * g * (e.dur ? Math.min(1, (n - i) / fo) : 1);
}
let peak = 0; for (const v of mix) peak = Math.max(peak, Math.abs(v));
if (peak > 0.95) for (let i = 0; i < mix.length; i++) mix[i] *= 0.95 / peak;
const tmp = out + '.f32';
fs.writeFileSync(tmp, Buffer.from(mix.buffer));
execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'f32le', '-ar', String(SR), '-ac', String(CH), '-i', tmp, out]);
fs.rmSync(tmp);
console.log('sfx events', events.length, 'peak', peak.toFixed(3), '->', out);

// Mixes sfx-events.json (written by render-captions.js) into one stereo SFX track: node mix-sfx.js [out.wav]
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const tl = JSON.parse(fs.readFileSync('timeline.json', 'utf8'));
const events = JSON.parse(fs.readFileSync('sfx-events.json', 'utf8'));
// Cinematic layer (Iman style), derived from the timeline: riser into each B-roll cut + boom on the cut,
// reverb tail back to A-roll, bass hit on punch-in zooms, glass hit on the hook, boom + glass on the end card.
if (tl.sfx?.cinematic !== false) {
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
  for (let i = 0; i < s.length && o + i < mix.length; i++) mix[o + i] += s[i] * g;
}
let peak = 0; for (const v of mix) peak = Math.max(peak, Math.abs(v));
if (peak > 0.95) for (let i = 0; i < mix.length; i++) mix[i] *= 0.95 / peak;
const tmp = out + '.f32';
fs.writeFileSync(tmp, Buffer.from(mix.buffer));
execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'f32le', '-ar', String(SR), '-ac', String(CH), '-i', tmp, out]);
fs.rmSync(tmp);
console.log('sfx events', events.length, 'peak', peak.toFixed(3), '->', out);

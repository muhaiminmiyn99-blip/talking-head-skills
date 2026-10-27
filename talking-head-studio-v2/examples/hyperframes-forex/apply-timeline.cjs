// Points timeline.json at the HyperFrames B-roll renders and switches the captions to the R3 look.
//   node hf/apply-timeline.cjs   (run after build-hf.cjs + rendering hf/renders/*.mp4)
const fs = require('fs');
const path = require('path');
const PROJ = path.dirname(__dirname);
const tlp = path.join(PROJ, 'timeline.json');
const tl = JSON.parse(fs.readFileSync(tlp, 'utf8'));
const man = JSON.parse(fs.readFileSync(path.join(__dirname, 'manifest.json'), 'utf8'));
const seg = (id) => tl.segments.find((s) => s.id === id);
// transition labels (in/out), SFX moments (seconds from part start / before part end) and accents (seconds from part start)
const T = {
  i1: { tin: 'fog', tout: 'fog', sfxIn: 0.3, sfxOut: 0.02, acc: [['S3', 'nampak', 'iconpop'], ['S3', 'share', 'select']] },
  i2: { tin: 'fog', tout: 'sweep', sfxIn: 1.9, sfxOut: 0.3, acc: [['S4', 'confirmation', 'select'], ['S5', 'setup', 'iconpop']] },
  i3: { tin: 'phone', tout: 'zoom-through', sfxIn: 0.5, sfxOut: 0.5, acc: [['S7', 'smart', 'iconpop']] },
  i4: { tin: 'sweep', tout: 'fog', sfxIn: 0.25, sfxOut: 0.25, acc: [['S13', 'zone', 'select'], ['S14', 'tunggu', 'iconpop']] },
  i5: { tin: 'sweep', tout: 'sweep', sfxIn: 0.25, sfxOut: 0.3, acc: [['S16', 'proses', 'select']] },
};
function wordT(id, prefix) { const s = seg(id); const ws = s.text.split(' '); const tot = ws.reduce((a, w) => a + w.length + 1, 0); let acc = 0;
  for (const w of ws) { const t = s.start + (s.end - s.start) * 0.85 * acc / tot; acc += w.length + 1; if (w.toLowerCase().replace(/[^a-z0-9-]/g, '').startsWith(prefix)) return t; } return s.start; }
tl.broll = man.map((m) => { const x = T[m.id];
  return { id: m.id.toUpperCase(), type: 'video', raw: true, file: `hf/renders/${m.id}.mp4`, scene: 'hyperframes', start: m.start, end: m.end, tin: x.tin, tout: x.tout,
    ...(x.sfxIn != null ? { sfxIn: x.sfxIn } : {}), sfxOut: x.sfxOut, accents: x.acc.map(([s, w, ty]) => ({ t: +(wordT(s, w) - m.start).toFixed(3), type: ty })), purpose: m.purpose,
    hf: `hf/compositions/${m.id}.html`, ...(m.cues ? { cues: m.cues } : {}) }; });
// R3 captions (lime key + white lead/sub); hide segments the HyperFrames scenes carry themselves
const R = {
  S1: { lead: 'Selalu tengok Fira dekat', key: 'Phone', sub: 'je kan?', strike: true },
  S2: { lead: 'Tak nak tengok', key: 'Depan-Depan?' },
  S6: { lead: 'Yang ni, Fira nak you all', key: 'Tengok Sendiri.' },
  S8: { lead: 'sampailah Fira chart', key: 'Zone', sub: 'dekat chart' },
  S9: { lead: 'and then macam mana Fira', key: 'Tunggu', sub: 'confirmation' },
  S10: { lead: 'before Fira consider untuk', key: 'Entry.' },
  S11: { lead: 'Kali ni, you duduk', key: 'Sama-Sama', sub: 'dengan Fira' },
  S12: { lead: 'kita tengok', key: 'Chart', sub: 'sekali.' },
  S15: { lead: 'you all boleh terus', key: 'Tanya Direct.' },
  S18: { lead: 'Nak duduk', key: 'Trade Sekali', sub: 'dengan Fira?' },
  S19: { lead: 'Click link atas tu and join', key: 'Channel Fira.', icon: 'send' },
  S20: { lead: 'Stand by for', key: 'Next Event.' },
  S21: { lead: 'And lepas ni, tengok', key: 'Depan Mata', sub: 'pula.' },
};
const covered = (s) => tl.broll.some((b) => s.start >= b.start - 0.05 && s.end <= b.end + 0.05);
tl.cards = tl.cards.map((c) => { const s = seg(c.seg); const keep = c.zoom ? { zoom: c.zoom } : {};
  if (R[c.seg] && !covered(s)) return { seg: c.seg, r3: true, ...R[c.seg], ...keep, ...(c.seg === 'S19' ? { size: { key: 108 } } : {}) };
  return { ...c, hide: true }; });
// popups: the R3 face ring on "depan-depan"; the old 3D glass icons and the pills popup are retired for this look
const G = 'rgba(255,30,30,.75)', ic = (id, src, a, z, cue, x, y, tilt, extra = {}) => ({ id, kind: 'icon', behind: true, src: 'assets/icons/' + src, start: a, end: z, cue, lead: 0.3, x, y, size: 560, rise: 760, tilt, glow: G, ...extra });
tl.popups = [
  ic('PA', 'r4-people_t.png', 21.04, 22.9, 'sama-sama', 300, 150, 9, { purpose: 'sama-sama dengan Fira: dark-glass people icon rises high behind her head' }),
  ic('PE', 'r4-chat_t.png', 29.4, 31.45, 'tanya', 290, 140, -8, { purpose: 'tanya direct: dark-glass chat bubble rises behind her head' }),
  ic('PC', 'r4-link_t.png', 37.15, 38.6, 'atas', 300, 230, -9, { lead: 0, mouse: 'link', purpose: 'click link atas tu: dark-glass link + cursor behind her head' }),
  ic('PD', 'r4-calendar_t.png', 38.82, 40.15, 'next', 300, 200, 8, { purpose: 'next event: dark-glass calendar behind her head' }),
  { id: 'RING', kind: 'ring', behind: false, start: seg('S2').start, end: seg('S2').end + 0.35, cue: 'depan', lead: 0.05, x: 540, y: 520, r: 250, purpose: 'R3 circle around her face on depan-depan' }];

delete tl.overlay;
tl.sfx = { ...tl.sfx, mode: 'clean', drone: true, r3keys: true };
// R3 silence drop: room tone ducks in the pause just before a punch line, then a deep hit lands on it
tl.duck = ['S2', 'S15', 'S21'].map((id) => ({ seg: id, t: +(seg(id).start - 0.24).toFixed(3), d: 0.22 }));
tl.caption_style = 'R3 lime bold (reference R3)';
tl.broll_style = 'HyperFrames R4: dark leather, red glow type, outline glyphs, eye/beam, orbs, grey spotlight; fog / red sweep / phone match-cut';
fs.writeFileSync(tlp, JSON.stringify(tl, null, 1));
console.log(tl.broll.map((b) => `${b.id} ${b.start}-${b.end} ${b.tin}/${b.tout}`).join('\n'));
console.log('cards visible:', tl.cards.filter((c) => !c.hide).map((c) => c.seg).join(' '));

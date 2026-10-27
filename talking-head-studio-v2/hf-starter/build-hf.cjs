// TEMPLATE (from CONTENT 9 - CTA 2). Copy of the R4 generator: keep HEAD/LIB/helpers, rewrite the C.push(...) scene blocks
// for the new script (segment ids, cue words, props). Run: node hf/build-hf.cjs, then render each composition, then node hf/apply-timeline.cjs
// R4 look (dark leather, glowing red type, outline glyphs, eye + beam, orbiting orbs, grey spotlight scene) for the forex
// B-roll of CONTENT 9 - CTA 2. Transitions are built into each composition: white fog, red-edged polygon sweep,
// phone match-cut. Word times come from timeline.json.   node hf/build-hf2.cjs  ->  hf/compositions/*.html + clips
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const HF = __dirname, PROJ = path.dirname(HF);
const tl = JSON.parse(fs.readFileSync(path.join(PROJ, 'timeline.json'), 'utf8'));
const seg = (id) => tl.segments.find((s) => s.id === id);
function wordT(id, prefix) {
  const s = seg(id); const ws = s.text.split(' '); const tot = ws.reduce((a, w) => a + w.length + 1, 0); let acc = 0;
  for (const w of ws) { const t = s.start + (s.end - s.start) * 0.85 * acc / tot; acc += w.length + 1; if (w.toLowerCase().replace(/[^a-z0-9-]/g, '').startsWith(prefix)) return t; }
  return s.start;
}
const r3 = (x) => +x.toFixed(3);
const RED = '#FF2B2B';

const HEAD = (title) => `<!doctype html><html lang="ms"><head><meta charset="UTF-8"><meta name="viewport" content="width=1080, height=1920">
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
<title>${title}</title><style>
@font-face{font-family:'Inter';src:url('../assets/fonts/Inter-Var.ttf');font-weight:100 900}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1080px;height:1920px;overflow:hidden;background:#050505}
#root{position:relative;width:1080px;height:1920px;overflow:hidden;font-family:'Inter',sans-serif}
.abs{position:absolute}.full{position:absolute;left:0;top:0;width:1080px;height:1920px}
video.full,img.full{object-fit:cover}
.leather{position:absolute;inset:0;background:#070707}
.leather img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.9}
.leather::after{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 50% 16%,rgba(255,255,255,.12),rgba(0,0,0,0) 42%),radial-gradient(ellipse at 50% 50%,rgba(0,0,0,0) 35%,rgba(0,0,0,.88) 100%)}
.spot{position:absolute;inset:0;background:radial-gradient(ellipse 62% 40% at 50% 46%,#ffffff 0%,#e9e9e9 35%,#9a9a9a 70%,#3c3c3c 100%)}
.line{position:absolute;left:120px;width:780px;text-align:center;white-space:nowrap}
.ch{display:inline-block;white-space:pre}
.lead{font-weight:500;font-size:46px;color:#f2f2f2;letter-spacing:-.01em;text-shadow:0 0 14px rgba(255,255,255,.35)}
.lead.dark{color:#1d1d1d;text-shadow:none}
.red{font-weight:800;font-size:150px;letter-spacing:-.045em;color:${RED};text-shadow:0 0 16px rgba(255,30,30,.9),0 0 48px rgba(255,0,0,.5)}
.red.flat{text-shadow:none;color:#E3171E}
.ol{position:absolute;font-weight:800;color:transparent;-webkit-text-stroke:3px rgba(255,255,255,.16);line-height:1}
.ol.dk{-webkit-text-stroke:3px rgba(0,0,0,.22)}
.fog{position:absolute;inset:-200px;background:radial-gradient(ellipse at 50% 50%,#ffffff 0%,#f4f4f4 30%,rgba(235,235,235,.85) 55%,rgba(220,220,220,0) 80%);filter:blur(30px);opacity:0;z-index:80}
.band{position:absolute;inset:0;background:${RED};z-index:70}
</style></head><body>`;
// letters as spans so they can type / slide in
const chars = (txt, cls) => [...txt].map((c) => `<span class="ch ${cls}">${c === ' ' ? ' ' : c}</span>`).join('');
const vid = (id, a, d, style = '') => `<video class="clip full" id="${id}" style="${style}" data-start="${r3(a)}" data-duration="${r3(Math.max(0.05, d))}" data-media-start="${r3(a)}" src="../assets/clips/CLIP.mp4" muted playsinline></video>`;
const leather = '<div class="leather"><img src="../assets/img/leather.png"></div>';

const LIB = `
const E = (x) => x;
// typewriter: letters appear one by one with a short blur
function typeIn(sel, t0, per = 0.028) { document.querySelectorAll(sel).forEach((e, i) => tl.fromTo(e, { opacity: 0, filter: 'blur(6px)' }, { opacity: 1, filter: 'blur(0px)', duration: 0.12, ease: 'power1.out' }, t0 + i * per)); }
// R4 letter slide: each glyph slides in from the right with a heavy blur
function slideIn(sel, t0, per = 0.03) { document.querySelectorAll(sel).forEach((e, i) => tl.fromTo(e, { opacity: 0, x: 70, filter: 'blur(14px)' }, { opacity: 1, x: 0, filter: 'blur(0px)', duration: 0.32, ease: 'power3.out' }, t0 + i * per)); }
function out(sel, t0, d = 0.2) { tl.to(sel, { opacity: 0, filter: 'blur(10px)', y: -12, duration: d, ease: 'power2.in' }, t0); }
// white fog flash: peaks at t (cut point)
function fog(sel, t, d = 0.5) { tl.fromTo(sel, { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1.1, duration: d / 2, ease: 'power2.in' }, t - d / 2); tl.to(sel, { opacity: 0, scale: 1.25, duration: d / 2, ease: 'power2.out' }, t); }
// polygon sweep: a slanted edge travels right->left; the red band leads by 70px; 'reveal' is the element being uncovered
function sweep(reveal, band, t0, d) { const p = { k: 0 };
  const poly = (L) => 'polygon(' + L + 'px 0px, 2400px 0px, 2400px 1920px, ' + (L - 620) + 'px 1920px)';
  const up = () => { const L = 1080 + 720 - p.k * 1900; document.querySelector(reveal).style.clipPath = poly(L + 70); document.querySelector(band).style.clipPath = 'polygon(' + L + 'px 0px, ' + (L + 110) + 'px 0px, ' + (L + 110 - 620) + 'px 1920px, ' + (L - 620) + 'px 1920px)'; };
  tl.set(reveal, { opacity: 1 }, t0); tl.set(band, { opacity: 1 }, t0);
  tl.fromTo(p, { k: 0 }, { k: 1, duration: d, ease: 'expo.inOut', onUpdate: up }, t0);
  tl.set(band, { opacity: 0 }, t0 + d); }
// slow drift + rotation for outline glyphs
function drift(sel, D) { document.querySelectorAll(sel).forEach((e, i) => tl.fromTo(e, { y: 30, rotation: -6 + i * 4 }, { y: -50, rotation: 6 - i * 3, duration: D, ease: 'none' }, 0)); }`;

const comp = (id, D, inner, script) => `<div id="root" data-composition-id="${id}" data-start="0" data-duration="${r3(D)}" data-width="1080" data-height="1920">
${inner}
</div>
<script>
const tl = gsap.timeline({ paused: true });
${LIB}
${script}
window.__timelines = window.__timelines || {}; window.__timelines["${id}"] = tl; tl.seek(0);
</script></body></html>`;

const C = [];
// ===== I1 "Dalam channel, you nampak setup yang Fira share tu." — fog in, typed lead, eye opens on nampak, red beam on setup, phone slides into the beam on share; fog out
{
  const t0 = r3(seg('S3').start - 0.3), t1 = seg('S4').start, D = r3(t1 - t0), rel = (t) => r3(t - t0);
  const tNampak = rel(wordT('S3', 'nampak')), tSetup = rel(wordT('S3', 'setup')), tShare = rel(wordT('S3', 'share'));
  const inner = `${leather}
<div class="abs" id="aroll" style="inset:0;z-index:60">${vid('a1', 0, 0.42)}</div>
<div class="line" id="L1" style="top:1180px">${chars('Dalam channel, you nampak', 'lead l1')}</div>
<div class="abs" id="eye" style="left:340px;top:520px;width:400px;height:200px;transform-origin:50% 50%">
  <svg viewBox="0 0 400 200" width="400" height="200" style="overflow:visible"><path d="M10 100 Q200 -30 390 100 Q200 230 10 100 Z" fill="#f4f4f4" style="filter:drop-shadow(0 0 30px rgba(255,255,255,.45))"/>
  <circle cx="200" cy="100" r="62" fill="${RED}" style="filter:drop-shadow(0 0 22px rgba(255,30,30,.9))"/><circle cx="200" cy="100" r="30" fill="#2a0000"/></svg></div>
<div class="abs" id="beam" style="left:390px;top:640px;width:300px;height:900px;transform-origin:50% 0;background:linear-gradient(180deg,rgba(255,30,30,.95),rgba(255,20,20,.6) 60%,rgba(255,20,20,0));clip-path:polygon(42% 0,58% 0,100% 100%,0 100%);filter:blur(1px);box-shadow:0 0 60px rgba(255,0,0,.6)"></div>
<div class="line" id="L2" style="top:735px;font-size:0"><span style="display:inline-block;font-size:0">${chars('setup', 'red s1').replace(/class="ch red s1"/g, 'class="ch red s1" style="font-size:112px"')}</span></div>
<div class="abs" id="card" style="left:300px;top:900px;width:480px;height:250px;border-radius:26px;background:linear-gradient(160deg,#1a1a1c,#0b0b0c);border:2px solid rgba(255,255,255,.18);box-shadow:0 30px 60px rgba(0,0,0,.7),0 0 50px rgba(255,30,30,.45)">
  <div class="abs" style="left:28px;top:26px;width:86px;height:86px;border-radius:43px;background:#000;display:flex;align-items:center;justify-content:center;border:2px solid rgba(255,43,43,.7)"><img src="../assets/img/fira-mark.png" style="width:66px"></div>
  <div class="abs" style="left:134px;top:30px;font-weight:800;font-size:40px;color:#fff;letter-spacing:-.02em">Fira Worldwide</div>
  <div class="abs" style="left:136px;top:82px;font-weight:600;font-size:24px;color:#8c8c8c;letter-spacing:.14em">CHANNEL</div>
  <div class="abs" style="left:28px;top:140px;right:28px;height:84px;border-radius:18px;background:rgba(255,43,43,.12);border:1.5px solid rgba(255,43,43,.6);display:flex;align-items:center;padding:0 22px;gap:16px">
    <span style="width:16px;height:16px;border-radius:8px;background:${RED};box-shadow:0 0 12px ${RED}"></span><span style="font-weight:700;font-size:36px;color:#fff">New setup shared</span></div></div>
<div class="fog" id="fog1"></div>`;
  const script = `
fog('#fog1', 0.3, 0.5); tl.set('#aroll', { opacity: 0 }, 0.3);
typeIn('.l1', 0.36);
tl.fromTo('#eye', { scaleY: 0.02, scaleX: 0.6, opacity: 0 }, { scaleY: 1, scaleX: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.8)' }, ${tNampak});
tl.to('#eye', { scaleY: 0.08, duration: 0.07, yoyo: true, repeat: 1 }, ${r3(tNampak + 0.45)});
tl.to('#eye', { y: -150, scale: 0.62, duration: 0.35, ease: 'power3.inOut' }, ${r3(tSetup - 0.05)});
tl.fromTo('#beam', { scaleY: 0, opacity: 0 }, { scaleY: 1, opacity: 1, duration: 0.35, ease: 'expo.out' }, ${r3(tSetup + 0.15)});
tl.set('#beam', { y: -150 }, 0);
slideIn('.s1', ${tSetup});
tl.fromTo('#card', { x: 900, opacity: 0, filter: 'blur(18px)' }, { x: 0, opacity: 1, filter: 'blur(0px)', duration: 0.38, ease: 'expo.out' }, ${r3(tShare - 0.08)});
tl.to('#card', { y: -12, duration: 1.2, ease: 'sine.inOut', yoyo: true, repeat: 1 }, ${r3(tShare + 0.3)});
fog('#fog1', ${r3(D)}, 0.5);`;
  C.push({ id: 'i1', t0, t1, D, inner, script, purpose: 'Nampak setup yang Fira share: fog in; eye opens on nampak; red beam + sliding SETUP on setup; channel card slides into the beam on share; fog into the next scene' });
}
// ===== I2 "Tapi macam mana Fira cari confirmation / before Fira bagi setup tu?" — outline question marks, red confirmation; fog cut to the masked figure with orbiting red orbs on setup; red sweep back to face
{
  const t0 = seg('S4').start, t1 = r3(seg('S6').start + 0.1), D = r3(t1 - t0), rel = (t) => r3(t - t0);
  const tConf = rel(wordT('S4', 'confirmation')), tS5 = rel(seg('S5').start), tSetup = rel(wordT('S5', 'setup')), tCut = rel(seg('S6').start - 0.02);
  const orbs = [...Array(7)].map((_, i) => { const a = -Math.PI / 2 + (i - 3) * 0.55; return [r3(540 + Math.cos(a) * 320 - 30), r3(600 + Math.sin(a) * 300 - 30)]; });
  const inner = `${leather}
<div class="abs" id="sceneA" style="inset:0">
  <div class="ol" style="left:70px;top:260px;font-size:300px">?</div><div class="ol" style="left:820px;top:520px;font-size:220px">?</div>
  <div class="ol" style="left:110px;top:1300px;font-size:380px">?</div><div class="ol" style="left:760px;top:1450px;font-size:260px">?</div>
  <div class="line" id="L1" style="top:780px">${chars('Tapi macam mana Fira cari', 'lead l1')}</div>
  <div class="line" id="L2" style="top:850px">${chars('confirmation', 'red c1')}</div>
</div>
<div class="abs" id="sceneB" style="inset:0;opacity:0">
  <img class="full" src="../assets/img/figure.png" id="fig">
  ${orbs.map(([x, y], i) => `<div class="abs orb" style="left:${x}px;top:${y}px;width:60px;height:60px;border-radius:30px;background:radial-gradient(circle at 40% 35%,#ff9a9a,${RED} 45%,#8a0000);box-shadow:0 0 30px ${RED},0 0 70px rgba(255,0,0,.55);opacity:0"></div>`).join('')}
  <div class="line" id="L3" style="top:1040px">${chars('before Fira bagi', 'lead l3')}</div>
  <div class="line" id="L4" style="top:1100px">${chars('setup?', 'red s2')}</div>
</div>
<div class="band" id="band" style="opacity:0"></div>
<div class="abs" id="aroll" style="inset:0;z-index:75;opacity:0">${vid('a2', tCut - 0.45, D - tCut + 0.45)}</div>
<div class="fog" id="fog1"></div>`;
  const script = `
fog('#fog1', 0, 0.5);
drift('#sceneA .ol', ${tS5});
typeIn('.l1', 0.2); slideIn('.c1', ${tConf}, 0.025);
fog('#fog1', ${tS5}, 0.45); tl.set('#sceneA', { opacity: 0 }, ${tS5}); tl.set('#sceneB', { opacity: 1 }, ${tS5});
tl.fromTo('#fig', { scale: 1.12 }, { scale: 1.0, duration: ${r3(D - tS5)}, ease: 'none' }, ${tS5});
typeIn('.l3', ${r3(tS5 + 0.1)}); slideIn('.s2', ${tSetup});
document.querySelectorAll('.orb').forEach((e, i) => { tl.fromTo(e, { opacity: 0, scale: 0.2 }, { opacity: 1, scale: 1, duration: 0.22, ease: 'back.out(2.5)' }, ${tSetup} - 0.15 + i * 0.07);
  tl.to(e, { y: -14, duration: 0.6, yoyo: true, repeat: 3, ease: 'sine.inOut' }, ${tSetup} + 0.4 + i * 0.05); });
sweep('#aroll', '#band', ${r3(tCut - 0.42)}, 0.42);`;
  C.push({ id: 'i2', t0, t1, D, inner, script, purpose: 'Macam mana cari confirmation: outline question marks + sliding red confirmation; fog cut to masked figure, red orbs circle it on setup; red polygon sweep back to the face' });
}
// ===== I3 "Daripada macam mana Fira open Fira Smart Desk," — A-roll maps into a phone screen on dark leather; app tile; zoom through into the real phone footage
{
  const t0 = r3(seg('S7').start - 0.35), cut = 14.4, t1 = r3(cut + 0.35), D = r3(t1 - t0), rel = (t) => r3(t - t0);
  const tOpen = rel(wordT('S7', 'open')), tSmart = rel(wordT('S7', 'smart')), tCut = rel(cut);
  const PW = 520, k = PW / 441, PH = r3(920 * k), PX = r3(540 - PW / 2), PY = 640;
  const Q = [[66, 36], [341, 57], [397, 874], [99, 888]].map(([x, y]) => [r3(PX + x * k), r3(PY + y * k)]);
  const inner = `${leather}
<div class="abs" style="left:240px;top:1500px;width:600px;height:160px;border-radius:50%;background:radial-gradient(ellipse,rgba(255,30,30,.55),rgba(255,0,0,0) 70%);filter:blur(20px)"></div>
<div class="line" id="L1" style="top:300px">${chars('Daripada macam mana Fira open', 'lead l1')}</div>
<div class="line" id="L2" style="top:370px">${chars('Smart Desk', 'red s1')}</div>
<div class="abs" id="dev" style="left:0;top:0;width:1080px;height:1920px;transform-origin:0 0">
  <img class="abs" id="phone" src="../assets/img/phone.png" style="left:${PX}px;top:${PY}px;width:${PW}px">
  <div class="abs" id="screen" style="left:0;top:0;width:1080px;height:1920px;transform-origin:0 0;overflow:hidden;border-radius:110px;background:#050505">
    ${vid('scrv', 0, Math.max(0.85, tOpen - 0.15) + 0.3)}
    <div class="full" id="ui" style="background:radial-gradient(ellipse at 50% 32%,#2a0606,#050505 65%);opacity:0">
      <div class="abs" id="tile" style="left:340px;top:440px;width:400px;height:400px;border-radius:100px;background:#0b0b0b;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 3px rgba(255,43,43,.6),0 0 90px rgba(255,30,30,.55)"><img src="../assets/img/fira-mark.png" style="width:300px"></div>
      <div class="abs" style="left:0;width:1080px;top:920px;text-align:center;font-weight:800;font-size:110px;color:#fff;letter-spacing:-.04em">Smart Desk</div>
      <div class="abs" id="tgl" style="left:240px;top:1160px;width:600px;height:230px;border-radius:115px;background:#232323"><div class="abs" id="knob" style="left:16px;top:16px;width:198px;height:198px;border-radius:99px;background:#fff"></div></div>
    </div>
  </div>
</div>
<div class="abs" style="inset:0;z-index:50">${vid('p1', 0, 0.3)}</div>
<div class="abs" id="plainw" style="inset:0;z-index:51;overflow:hidden">${vid('p2', tCut, D - tCut)}</div>`;
  const script = `
function H(q){const [x0,y0]=q[0],[x1,y1]=q[1],[x2,y2]=q[2],[x3,y3]=q[3];const w=1080,h=1920;
  const dx1=x1-x2,dx2=x3-x2,dx3=x0-x1+x2-x3,dy1=y1-y2,dy2=y3-y2,dy3=y0-y1+y2-y3;const det=dx1*dy2-dx2*dy1;
  const g=(dx3*dy2-dx2*dy3)/det,h2=(dx1*dy3-dx3*dy1)/det;const a=x1-x0+g*x1,b=x3-x0+h2*x3,c=x0,d=y1-y0+g*y1,e=y3-y0+h2*y3,f=y0;
  return 'matrix3d('+[a/w,d/w,0,g/w,b/h,e/h,0,h2/h,0,0,1,0,c,f,0,1].join(',')+')';}
const Q=${JSON.stringify(Q)};const full=[[0,0],[1080,0],[1080,1920],[0,1920]];
const lerpQ=(a,b,k)=>a.map((p,i)=>[p[0]+(b[i][0]-p[0])*k,p[1]+(b[i][1]-p[1])*k]);
const scr=document.getElementById('screen');const st={k:0,z:0};
const apply=()=>{scr.style.transform=H(lerpQ(full,Q,st.k));scr.style.borderRadius=(st.k*110)+'px';
  const cx=(Q[0][0]+Q[2][0])/2,cy=(Q[0][1]+Q[2][1])/2,s=1+st.z*2.6;
  document.getElementById('dev').style.transform='translate('+((540-cx)*st.z)+'px,'+((960-cy)*st.z)+'px) translate('+cx+'px,'+cy+'px) scale('+s+') translate('+(-cx)+'px,'+(-cy)+'px)';};
tl.fromTo(st, { k: 0 }, { k: 1, duration: 0.62, ease: 'expo.inOut', onUpdate: apply }, 0.12);
tl.fromTo('#phone', { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0.3);
tl.to('#ui', { opacity: 1, duration: 0.2 }, ${r3(Math.max(0.85, tOpen - 0.15))});
tl.fromTo('#tile', { scale: 0.5, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.8)' }, ${r3(Math.max(0.9, tOpen - 0.1))});
typeIn('.l1', 0.7); slideIn('.s1', ${tSmart}, 0.03);
tl.to('#knob', { x: 370, duration: 0.3, ease: 'power3.inOut' }, ${tSmart});
tl.to('#tgl', { backgroundColor: '${RED}', boxShadow: '0 0 60px rgba(255,30,30,.8)', duration: 0.3 }, ${tSmart});
tl.to(st, { z: 1, duration: 0.42, ease: 'expo.in', onUpdate: apply }, ${r3(tCut - 0.42)});
out('#L1, #L2', ${r3(tCut - 0.42)});
tl.fromTo('#plainw', { scale: 1.18, filter: 'blur(6px)' }, { scale: 1, filter: 'blur(0px)', duration: 0.35, ease: 'power3.out' }, ${tCut});`;
  C.push({ id: 'i3', t0, t1, D, inner, script, purpose: 'Open Fira Smart Desk: A-roll mapped into a phone on dark leather, red-glow app tile and toggle; zoom-through into the real phone footage' });
}
// ===== I4 "kenapa Fira pilih zone tu / ataupun kenapa Fira tunggu dekat zone tu" — red sweep into the grey spotlight scene; outline asterisks; ZONE pushes huge; tunggu + hourglass; fog back to face
{
  const t0 = r3(seg('S13').start - 0.3), t1 = r3(seg('S15').start + 0.2), D = r3(t1 - t0), rel = (t) => r3(t - t0);
  const tKenapa = rel(wordT('S13', 'kenapa')), tZone = rel(wordT('S13', 'zone')), tS14 = rel(seg('S14').start), tTunggu = rel(wordT('S14', 'tunggu')), tEnd = rel(seg('S15').start - 0.05);
  const ast = (x, y, s) => `<svg class="abs ast" style="left:${x}px;top:${y}px" width="${s}" height="${s}" viewBox="0 0 100 100"><path d="M44 0h12v36l25-25 8 8-25 25h36v12H64l25 25-8 8-25-25v36H44V64L19 89l-8-8 25-25H0V44h36L11 19l8-8 25 25z" fill="none" stroke="rgba(0,0,0,.25)" stroke-width="2"/></svg>`;
  const inner = `
<div class="abs" style="inset:0">${vid('a0', 0, 0.5)}</div>
<div class="band" id="band" style="opacity:0"></div>
<div class="abs" id="scene" style="inset:0;opacity:0">
  <div class="spot"></div>
  ${ast(760, -60, 300)}${ast(-80, 1500, 320)}${ast(820, 1560, 220)}
  <div class="line" id="L1" style="top:820px">${chars('kenapa Fira pilih', 'lead dark l1')}</div>
  <div class="line" id="L2" style="top:880px">${chars('zone tu', 'red flat z1')}</div>
  <div class="line" id="L3" style="top:820px">${chars('ataupun kenapa Fira', 'lead dark l3')}</div>
  <div class="line" id="L4" style="top:880px">${chars('tunggu', 'red flat t1')}</div>
  <img class="abs" id="hg" src="../assets/img/hourglass.png" style="left:470px;top:1110px;width:140px;opacity:0;filter:drop-shadow(0 20px 30px rgba(0,0,0,.35))">
</div>
<div class="abs" id="aroll" style="inset:0;z-index:60;opacity:0">${vid('a1', tEnd - 0.1, D - tEnd + 0.1)}</div>
<div class="fog" id="fog1"></div>`;
  const script = `
sweep('#scene', '#band', 0.05, 0.42);
document.querySelectorAll('.ast').forEach((e, i) => tl.fromTo(e, { rotation: 0 }, { rotation: (i % 2 ? -1 : 1) * 70, duration: ${D}, ease: 'none' }, 0));
typeIn('.l1', ${r3(Math.max(0.35, tKenapa))});
tl.fromTo('#L2', { scale: 2.2 }, { scale: 1, duration: 0.5, ease: 'expo.out' }, ${tZone}); slideIn('.z1', ${tZone}, 0.03);
out('#L1, #L2', ${r3(tS14 - 0.12)});
tl.set('.l3, .t1', { opacity: 0 }, 0);
typeIn('.l3', ${tS14});
tl.fromTo('#L4', { scale: 2.2 }, { scale: 1, duration: 0.5, ease: 'expo.out' }, ${tTunggu}); slideIn('.t1', ${tTunggu}, 0.03);
tl.fromTo('#hg', { opacity: 0, y: -60, rotation: -20 }, { opacity: 1, y: 0, rotation: 0, duration: 0.4, ease: 'back.out(1.6)' }, ${r3(tTunggu + 0.15)});
tl.to('#hg', { rotation: 180, duration: 0.55, ease: 'power2.inOut' }, ${r3(tTunggu + 0.85)});
fog('#fog1', ${tEnd}, 0.5); tl.set('#aroll', { opacity: 1 }, ${tEnd});`;
  C.push({ id: 'i4', t0, t1, D, inner, script, purpose: 'Kenapa pilih zone / tunggu: red polygon sweep into the grey spotlight scene, rotating outline asterisks, ZONE TU and TUNGGU push in huge, hourglass flips; fog back to the face' });
}
// ===== I5 "barulah you nampak macam mana proses / sebelum Fira bagi setup dalam channel tu." — red sweep into dark leather; red PROSES; 4 glowing orb steps; red sweep back
{
  const t0 = r3(seg('S16').start - 0.34), t1 = r3(seg('S18').start + 0.3), D = r3(t1 - t0), rel = (t) => r3(t - t0);
  const tProses = rel(wordT('S16', 'proses')), tSetup = rel(wordT('S17', 'setup')), tEnd = rel(seg('S18').start - 0.03);
  const steps = [['Open Smart Desk', tProses + 0.05], ['Chart zone', tProses + 0.3], ['Tunggu confirmation', tProses + 0.55], ['Setup dalam channel', tSetup]];
  const inner = `
<div class="abs" style="inset:0">${vid('a0', 0, 0.5)}</div>
<div class="band" id="band" style="opacity:0"></div>
<div class="abs" id="scene" style="inset:0;opacity:0">${leather}
  <div class="ol" style="left:780px;top:220px;font-size:280px">*</div><div class="ol" style="left:60px;top:1500px;font-size:320px">*</div>
  <div class="line" id="L1" style="top:420px">${chars('barulah you nampak macam mana', 'lead l1')}</div>
  <div class="line" id="L2" style="top:490px">${chars('proses', 'red p1')}</div>
  <div class="abs" id="rail" style="left:262px;top:812px;width:4px;height:450px;background:linear-gradient(${RED},rgba(255,43,43,.2));box-shadow:0 0 14px ${RED};transform-origin:top;transform:scaleY(0)"></div>
  ${steps.map(([t], i) => `<div class="abs st" style="left:235px;top:${790 + i * 150}px;display:flex;align-items:center;gap:36px;opacity:0"><div style="width:58px;height:58px;border-radius:29px;background:radial-gradient(circle at 40% 35%,#ff9a9a,${RED} 45%,#8a0000);box-shadow:0 0 26px ${RED}"></div><div style="font-weight:600;font-size:52px;color:#f2f2f2;letter-spacing:-.02em;white-space:nowrap">${t}</div></div>`).join('')}
</div>
<div class="band" id="band2" style="opacity:0;z-index:72"></div>
<div class="abs" id="aroll" style="inset:0;z-index:75;opacity:0">${vid('a1', tEnd - 0.45, D - tEnd + 0.45)}</div>`;
  const script = `
sweep('#scene', '#band', 0.05, 0.42);
typeIn('.l1', 0.45, 0.022); slideIn('.p1', ${tProses});
const T = ${JSON.stringify(steps.map((s) => r3(s[1])))};
document.querySelectorAll('.st').forEach((e, i) => { tl.fromTo(e, { opacity: 0, x: 60, filter: 'blur(12px)' }, { opacity: 1, x: 0, filter: 'blur(0px)', duration: 0.3, ease: 'power3.out' }, T[i]);
  tl.to('#rail', { scaleY: i / 3, duration: 0.25, ease: 'power2.out' }, T[i]); });
sweep('#aroll', '#band2', ${r3(tEnd - 0.42)}, 0.42);`;
  C.push({ id: 'i5', t0, t1, D, inner, script, purpose: 'Proses sebelum setup: red sweep into dark leather, red PROSES, four glowing orb steps on a red rail; red sweep back to the face' });
}

fs.mkdirSync(path.join(HF, 'compositions'), { recursive: true });
const manifest = C.map((c) => {
  const out = path.join(HF, 'assets', 'clips', `${c.id}.mp4`);
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-ss', String(c.t0), '-i', tl.source, '-t', String(c.D), '-an', '-vf', 'fps=30,scale=1080:1920', '-c:v', 'libx264', '-crf', '14', '-g', '30', '-keyint_min', '30', '-movflags', '+faststart', '-pix_fmt', 'yuv420p', out]);
  fs.writeFileSync(path.join(HF, 'compositions', `${c.id}.html`), (HEAD(c.id) + comp(c.id, c.D, c.inner, c.script)).replace(/CLIP/g, c.id));
  // sound cues read straight from the animation calls, so picture and sound share one clock
  const cues = []; let m;
  const count = (cls) => (c.inner.match(new RegExp('class="ch [^"]*\\b' + cls + '\\b', 'g')) || []).length;
  const reT = /typeIn\('\.([\w-]+)', ([\d.]+)(?:, ([\d.]+))?\)/g;
  while ((m = reT.exec(c.script))) { const n = count(m[1]), t = +m[2], per = m[3] ? +m[3] : 0.028; for (let i = 0; i < n; i += 2) cues.push({ t: r3(t + i * per), type: 'key' + (1 + (i / 2) % 3), gain: 0.32 + 0.08 * ((i / 2) % 2) }); }
  const reS = /slideIn\('\.[\w-]+', ([\d.]+)/g; while ((m = reS.exec(c.script))) cues.push({ t: +m[1], type: 'deep', gain: 0.55, pr: 2 });
  const reF = /fog\('#\w+', ([\d.]+)(?:, ([\d.]+))?\)/g; while ((m = reF.exec(c.script))) { const t = +m[1]; cues.push({ t, type: 'whoosh', gain: 0.5, pr: 3 }); if (t > 0.05 && t < c.D - 0.05) cues.push({ t, type: 'sub', gain: 0.4, pr: 3 }); }
  const reW = /sweep\('#\w+', '#\w+', ([\d.]+), ([\d.]+)\)/g; while ((m = reW.exec(c.script))) cues.push({ t: r3(+m[1] + +m[2] * 0.5), type: 'whoosh', gain: 0.5, pr: 3 });
  return { id: c.id, start: c.t0, end: r3(c.t0 + c.D), duration: c.D, purpose: c.purpose, cues: cues.filter((q) => q.t >= 0 && q.t <= c.D).sort((a, b) => a.t - b.t) };
});
fs.writeFileSync(path.join(HF, 'manifest.json'), JSON.stringify(manifest, null, 1));
console.log(manifest.map((m) => `${m.id} ${m.start}-${m.end}`).join('\n'));

// Builds the B-roll compositions (HyperFrames) for CONTENT 9 - CTA 2 from timeline.json word timings.
// Style: R1 clean white UI scenes + R4 dark cinematic scenes, forex. Each composition contains the real A-roll
// around its edges so the transitions are seamless (morph into a shape, green wash, white bloom, phone match-cut).
//   node hf/build-hf.js            -> hf/compositions/*.html + hf/assets/clips/*.mp4 (source excerpts)
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const HF = __dirname, PROJ = path.dirname(HF);
const tl = JSON.parse(fs.readFileSync(path.join(PROJ, 'timeline.json'), 'utf8'));
const seg = (id) => tl.segments.find((s) => s.id === id);
// same word-time estimate as the caption engine: share of characters across 85 % of the segment
function wordT(id, prefix, nth = 0) {
  const s = seg(id); const ws = s.text.split(' '); const tot = ws.reduce((a, w) => a + w.length + 1, 0); let acc = 0, hit = -1;
  for (const w of ws) { const t = s.start + (s.end - s.start) * 0.85 * acc / tot; acc += w.length + 1;
    if (w.toLowerCase().replace(/[^a-z0-9-]/g, '').startsWith(prefix)) { hit++; if (hit === nth) return t; } }
  return s.start;
}
const r3 = (x) => +x.toFixed(3);

// ---------- shared head ----------
const HEAD = (title, bg) => `<!doctype html><html lang="ms"><head><meta charset="UTF-8"><meta name="viewport" content="width=1080, height=1920">
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
<title>${title}</title><style>
@font-face{font-family:'Inter';src:url('../assets/fonts/Inter-Var.ttf');font-weight:100 900}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1080px;height:1920px;overflow:hidden;background:${bg}}
#root{position:relative;width:1080px;height:1920px;overflow:hidden;font-family:'Inter',sans-serif}
.abs{position:absolute}
.full{position:absolute;left:0;top:0;width:1080px;height:1920px}
video.full,img.full{object-fit:cover}
.lead{font-weight:600;letter-spacing:-.02em}
.acc{font-weight:800;letter-spacing:-.045em;line-height:.95}
.w{display:inline-block;margin:0 .1em;will-change:transform,opacity,filter}
.hd{position:absolute;left:120px;width:780px;text-align:center}
.hd .ln{display:block;white-space:nowrap}
</style></head><body>`;
const words = (txt, cls) => txt.split(' ').map((w) => `<span class="w ${cls}">${w}</span>`).join('');
const comp = (id, D, inner, script) => `<div id="root" data-composition-id="${id}" data-start="0" data-duration="${r3(D)}" data-width="1080" data-height="1920">
${inner}
</div>
<script>
const tl = gsap.timeline({ paused: true });
const W = (sel, t, step = 0.07) => document.querySelectorAll(sel).forEach((e, i) => tl.fromTo(e, { opacity: 0, y: 26, scale: 1.18, filter: 'blur(10px)' }, { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: 0.22, ease: 'power3.out' }, t + i * step));
${script}
window.__timelines = window.__timelines || {}; window.__timelines["${id}"] = tl; tl.seek(0);
</script></body></html>`;
const clipTag = (D) => `<video class="clip full" id="src" data-start="0" data-duration="${r3(D)}" src="../assets/clips/CLIP.mp4" muted playsinline></video>`;

// morph helpers (GSAP on a wrapper div holding the A-roll video): full frame <-> rounded shape
const MORPH_IN = `
// The wrapper keeps the full 1080x1920 frame (no squash). k=0 shows the whole frame; k=1 shows a region around
// the face (fx,fy), sized box*m, clipped to a rounded rect and scaled/moved onto the target box on screen.
function morphAt(el, k, box, m, fx, fy) {
  const L = (a, b) => a + (b - a) * k;
  const rw = box.w * m, rh = box.h * m; const rx = Math.min(Math.max(fx - rw / 2, 0), 1080 - rw), ry = Math.min(Math.max(fy - rh / 2, 0), 1920 - rh);
  const R = { x: L(0, rx), y: L(0, ry), w: L(1080, rw), h: L(1920, rh) };           // visible region, element coords
  const S = { x: L(0, box.x), y: L(0, box.y), w: L(1080, box.w), h: L(1920, box.h) }; // where it lands on screen
  const s = Math.sqrt((S.w / R.w) * (S.h / R.h));
  const tx = S.x + S.w / 2 - (R.x + R.w / 2) * s, ty = S.y + S.h / 2 - (R.y + R.h / 2) * s;
  el.style.transformOrigin = '0 0'; el.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + s + ')';
  el.style.clipPath = 'inset(' + R.y + 'px ' + (1080 - R.x - R.w) + 'px ' + (1920 - R.y - R.h) + 'px ' + R.x + 'px round ' + (L(0, box.r) / s) + 'px)';
}
// A-roll shrinks into a rounded shape that becomes the scene's first element (R1 morph-cut)
function morphIn(wrap, t0, dur, box, tint, m = 1, fx = 540, fy = 600) {
  const p = { k: 0 }; morphAt(wrap, 0, box, m, fx, fy);
  tl.fromTo(p, { k: 0 }, { k: 1, duration: dur, ease: 'expo.inOut', onUpdate: () => morphAt(wrap, p.k, box, m, fx, fy) }, t0);
  tl.fromTo(wrap.querySelector('.tint'), { opacity: 0 }, { opacity: tint, duration: dur * 0.8, ease: 'power2.in' }, t0 + dur * 0.2);
}
// a shape expands back into the full-frame A-roll (reverse morph)
function morphOut(wrap, t0, dur, box, tint, m = 1, fx = 540, fy = 600) {
  const p = { k: 1 };
  tl.fromTo(p, { k: 1 }, { k: 0, duration: dur, ease: 'expo.inOut', immediateRender: false, onUpdate: () => morphAt(wrap, p.k, box, m, fx, fy) }, t0);
  tl.fromTo(wrap.querySelector('.tint'), { opacity: tint }, { opacity: 0, duration: dur * 0.9, ease: 'power2.out', immediateRender: false }, t0 + dur * 0.1);
}`;
const vid = (id, a, d, style = '') => `<video class="clip full" id="${id}" style="${style}" data-start="${r3(a)}" data-duration="${r3(d)}" data-media-start="${r3(a)}" src="../assets/clips/CLIP.mp4" muted playsinline></video>`;
const wrapTag = (id, color, a = 0, d = 1) => `<div class="abs" id="${id}" style="left:0;top:0;width:1080px;height:1920px;overflow:hidden;z-index:30">
  ${vid(id + 'v', a, d)}
  <div class="tint full" style="background:${color};mix-blend-mode:multiply;opacity:0"></div></div>`;

const C = [];
// ===== I1: "Dalam channel, you nampak setup yang Fira share tu." — white R1 channel card, morph from A-roll into the avatar
{
  const s3 = seg('S3'), t0 = r3(s3.start - 0.34), t1 = r3(seg('S4').start + 0.02), D = r3(t1 - t0), rel = (t) => r3(t - t0);
  const tSetup = rel(wordT('S3', 'setup')), tShare = rel(wordT('S3', 'share')), tNampak = rel(wordT('S3', 'nampak'));
  const AV = { x: 190 + 44, y: 700 + 40, w: 140, h: 140, r: 70 };
  const inner = `
<div class="full" style="background:radial-gradient(ellipse at 50% 40%,#ffffff,#f1f1ee 70%)"></div>
<div class="hd" id="h1" style="top:330px"><span class="ln lead" style="font-size:50px;color:#8b8b8b">${words('Dalam channel, you nampak', 'l')}</span>
  <span class="ln acc" style="font-size:150px;color:#18c25a;text-shadow:0 0 30px rgba(24,194,90,.45)">${words('setup', 'a')}</span></div>
<div class="abs" id="card" style="left:190px;top:700px;width:700px;height:470px;border-radius:40px;background:#fff;box-shadow:0 30px 80px rgba(0,0,0,.12),0 2px 8px rgba(0,0,0,.06);opacity:0">
  <div class="abs" style="left:44px;top:40px;width:140px;height:140px;border-radius:70px;background:#0b0b0d;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 6px #e9fbef">
    <img src="../assets/img/fira-mark.png" style="width:100px"></div>
  <div class="abs" style="left:210px;top:56px;font-weight:800;font-size:54px;letter-spacing:-.03em;color:#111">Fira Worldwide</div>
  <div class="abs" style="left:212px;top:124px;font-weight:600;font-size:32px;color:#9a9a9a;letter-spacing:.04em">CHANNEL · LIVE</div>
  <div class="abs row" id="row1" style="left:40px;top:225px;width:620px;height:100px;border-radius:24px;background:#f5f6f4;display:flex;align-items:center;gap:22px;padding:0 24px;opacity:0">
    <div style="width:56px;height:56px;border-radius:28px;background:#18c25a;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:30px;box-shadow:0 0 18px rgba(24,194,90,.5)">✦</div>
    <div style="font-weight:700;font-size:44px;color:#111">Setup</div><div style="margin-left:auto;padding:8px 20px;border-radius:999px;background:#e5f9ec;color:#11a64c;font-weight:700;font-size:28px">new</div></div>
  <div class="abs row" id="row2" style="left:40px;top:340px;width:620px;height:100px;border-radius:24px;background:#f5f6f4;display:flex;align-items:center;gap:22px;padding:0 24px;opacity:0">
    <div style="width:56px;height:56px;border-radius:28px;background:#111;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:28px">↗</div>
    <div style="font-weight:700;font-size:44px;color:#111">Fira share</div><div style="margin-left:auto;padding:8px 20px;border-radius:999px;background:#e5f9ec;color:#11a64c;font-weight:700;font-size:28px">shared</div></div>
</div>
<div class="abs" id="orbit" style="left:${AV.x + 70 - 130}px;top:${AV.y + 70 - 130}px;width:260px;height:260px;border-radius:50%;border:2px solid rgba(24,194,90,.35);opacity:0">
  <i class="abs" style="left:-11px;top:119px;width:22px;height:22px;border-radius:11px;background:#18c25a;box-shadow:0 0 14px #18c25a"></i>
  <i class="abs" style="left:200px;top:20px;width:18px;height:18px;border-radius:9px;background:#18c25a;box-shadow:0 0 14px #18c25a"></i>
  <i class="abs" style="left:190px;top:228px;width:14px;height:14px;border-radius:7px;background:#18c25a;box-shadow:0 0 14px #18c25a"></i></div>
${wrapTag('wrap', '#3cff7c', 0, 0.95)}
<div class="full" id="wash" style="background:radial-gradient(circle at 50% 50%,#eaffef 0%,#5cff8f 35%,#19c95b 75%);opacity:0;z-index:40"></div>`;
  const script = `${MORPH_IN}
const wrap = document.getElementById('wrap');
morphIn(wrap, 0.18, 0.5, { x: ${AV.x}, y: ${AV.y}, w: ${AV.w}, h: ${AV.h}, r: ${AV.r} }, 0.55, 3, 540, 520);
tl.to(wrap, { opacity: 0, duration: 0.2 }, 0.78);
tl.fromTo('#card', { opacity: 0, scale: 0.9, y: 30 }, { opacity: 1, scale: 1, y: 0, duration: 0.45, ease: 'back.out(1.6)' }, 0.5);
tl.fromTo('#orbit', { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.4, ease: 'power3.out' }, 0.62);
tl.to('#orbit', { rotation: 200, duration: ${D}, ease: 'none' }, 0);
W('#h1 .l', 0.35, 0.05); W('#h1 .a', ${tSetup});
tl.fromTo('#row1', { opacity: 0, x: -40 }, { opacity: 1, x: 0, duration: 0.3, ease: 'power3.out' }, ${tSetup});
tl.fromTo('#row2', { opacity: 0, x: -40 }, { opacity: 1, x: 0, duration: 0.3, ease: 'power3.out' }, ${tShare});
// green wash out (R1) into the dark desk scene
tl.fromTo('#wash', { opacity: 0, scale: 1 }, { opacity: 1, scale: 1.15, duration: 0.32, ease: 'power2.in' }, ${r3(D - 0.32)});
void ${tNampak};`;
  C.push({ id: 'i1', t0, t1, D, inner, script, bg: '#f1f1ee', purpose: 'Dalam channel, nampak setup yang Fira share: R1 white channel card; A-roll morphs into the avatar; rows on setup/share; green wash out' });
}
// ===== I2: "Tapi macam mana Fira cari confirmation / before Fira bagi setup tu?" — R4 dark desk, white bloom out
{
  const t0 = seg('S4').start + 0.02, t1 = r3(seg('S6').start + 0.3), D = r3(t1 - t0), rel = (t) => r3(t - t0);
  const tMacam = rel(wordT('S4', 'macam')), tConf = rel(wordT('S4', 'confirmation')), tBefore = rel(seg('S5').start), tSetup = rel(wordT('S5', 'setup'));
  const tEnd = rel(seg('S6').start - 0.05);
  const q = (x, y, s, r) => `<div class="abs qm" style="left:${x}px;top:${y}px;font-weight:200;font-size:${s}px;color:transparent;-webkit-text-stroke:3px rgba(255,255,255,.55);transform:rotate(${r}deg);opacity:0">?</div>`;
  const inner = `
<div class="full" id="img" style="overflow:hidden"><img class="full" src="../assets/img/desk.png">
  <div class="abs" id="ring" style="left:760px;top:770px;width:170px;height:170px;border-radius:50%;border:5px solid #34ff7a;box-shadow:0 0 30px #34ff7a,inset 0 0 30px rgba(52,255,122,.5);opacity:0"></div></div>
<div class="full" style="background:linear-gradient(180deg,rgba(0,0,0,.55),rgba(0,0,0,0) 30%,rgba(0,0,0,0) 55%,rgba(0,0,0,.75))"></div>
${q(110, 330, 260, -14)}${q(800, 420, 200, 12)}${q(160, 1330, 180, 8)}
<div class="hd" id="h1" style="top:1010px"><span class="ln lead" style="font-size:48px;color:#e8e8e8">${words('Tapi macam mana Fira cari', 'l')}</span>
  <span class="ln acc" style="font-size:118px;color:#3dff86;text-shadow:0 0 22px rgba(61,255,134,.85),0 0 60px rgba(61,255,134,.45)">${words('confirmation', 'a')}</span></div>
<div class="hd" id="h2" style="top:1010px"><span class="ln lead" style="font-size:48px;color:#e8e8e8">${words('before Fira bagi', 'l2')}</span>
  <span class="ln acc" style="font-size:150px;color:#3dff86;text-shadow:0 0 22px rgba(61,255,134,.85),0 0 60px rgba(61,255,134,.45)">${words('setup', 'a2')}</span></div>
<div class="full" id="greenin" style="background:radial-gradient(circle at 50% 50%,#eaffef 0%,#5cff8f 35%,#19c95b 75%);z-index:40"></div>
<div class="full" id="arollw" style="z-index:45;overflow:hidden">${vid('aroll', tEnd, D - tEnd)}</div>
<div class="full" id="bloom" style="background:radial-gradient(circle at 50% 45%,#ffffff 0%,#f4f4f4 45%,#d9d9d9 100%);opacity:0;z-index:50"></div>`;
  const script = `
tl.fromTo('#greenin', { opacity: 1 }, { opacity: 0, duration: 0.42, ease: 'power2.out' }, 0);
tl.fromTo('#img', { scale: 1.16 }, { scale: 1.02, duration: ${D}, ease: 'none' }, 0);
document.querySelectorAll('.qm').forEach((e, i) => { tl.to(e, { opacity: 1, duration: 0.3 }, ${tMacam} + i * 0.08); tl.fromTo(e, { y: 20 }, { y: -40, duration: 2.4, ease: 'sine.inOut' }, ${tMacam}); tl.to(e, { opacity: 0, duration: 0.3 }, ${tBefore} - 0.1); });
W('#h1 .l', 0.2, 0.06); W('#h1 .a', ${tConf});
tl.fromTo('#ring', { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(2)' }, ${tConf});
tl.to('#ring', { scale: 1.15, repeat: 5, yoyo: true, duration: 0.3, ease: 'sine.inOut' }, ${r3(tConf + 0.35)});
tl.to('#h1', { opacity: 0, y: -20, filter: 'blur(8px)', duration: 0.2 }, ${r3(tBefore - 0.1)});
W('#h2 .l2', ${tBefore}, 0.06); W('#h2 .a2', ${tSetup});
// R4 white bloom out to the speaker
tl.fromTo('#bloom', { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power2.in' }, ${r3(tEnd - 0.3)});
tl.fromTo('#arollw', { scale: 1.08 }, { scale: 1, duration: 0.35, ease: 'power2.out' }, ${tEnd});
tl.to('#bloom', { opacity: 0, duration: 0.33, ease: 'power2.out' }, ${tEnd});`;
  C.push({ id: 'i2', t0: r3(t0), t1, D, inner, script, bg: '#000', purpose: 'Macam mana Fira cari confirmation before bagi setup: R4 dark trader desk, outline question marks, green confirmation ring; white bloom back to face' });
}
// ===== I3: "Daripada macam mana Fira open Fira Smart Desk," — A-roll shrinks into a 3D phone screen; zoom through into the real phone shot
{
  const t0 = r3(seg('S7').start - 0.35), cut = 14.4, t1 = r3(cut + 0.35), D = r3(t1 - t0), rel = (t) => r3(t - t0);
  const tOpen = rel(wordT('S7', 'open')), tSmart = rel(wordT('S7', 'smart')), tCut = rel(cut);
  // phone image 441x920; screen corners measured in image px
  const PW = 520, k = PW / 441, PH = r3(920 * k), PX = r3(540 - PW / 2), PY = 640;
  const Q = [[66, 36], [341, 57], [397, 874], [99, 888]].map(([x, y]) => [r3(PX + x * k), r3(PY + y * k)]);
  const inner = `
<div class="full" style="background:radial-gradient(ellipse at 50% 45%,#ffffff,#efefec 70%)"></div>
<div class="hd" id="h1" style="top:300px"><span class="ln lead" style="font-size:48px;color:#8b8b8b">${words('Daripada macam mana Fira', 'l')}</span>
  <span class="ln acc" style="font-size:132px;color:#18c25a;text-shadow:0 0 30px rgba(24,194,90,.4)">${words('Smart Desk', 'a')}</span></div>
<div class="abs" id="dev" style="left:0;top:0;width:1080px;height:1920px;transform-origin:0 0">
  <div class="abs" id="shadow" style="left:${PX + 40}px;top:${PY + PH - 60}px;width:${PW - 60}px;height:80px;border-radius:50%;background:rgba(0,0,0,.25);filter:blur(30px)"></div>
  <img class="abs" id="phone" src="../assets/img/phone.png" style="left:${PX}px;top:${PY}px;width:${PW}px;pointer-events:none">
  <div class="abs" id="screen" style="left:0;top:0;width:1080px;height:1920px;transform-origin:0 0;overflow:hidden;border-radius:110px;background:#050507">
    ${vid('scrv', 0, Math.max(0.85, tOpen - 0.15) + 0.3)}
    <div class="full" id="ui" style="background:radial-gradient(ellipse at 50% 30%,#14241a,#050507 65%);opacity:0">
      <div class="abs" id="tile" style="left:340px;top:420px;width:400px;height:400px;border-radius:100px;background:#0b0b0d;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 3px rgba(61,255,134,.5),0 0 80px rgba(61,255,134,.45)"><img src="../assets/img/fira-mark.png" style="width:300px"></div>
      <div class="abs" style="left:0;width:1080px;top:900px;text-align:center;font-weight:800;font-size:110px;color:#fff;letter-spacing:-.04em">Smart Desk</div>
      <div class="abs" id="tgl" style="left:240px;top:1140px;width:600px;height:230px;border-radius:115px;background:#2a2a2e;box-shadow:inset 0 2px 8px rgba(0,0,0,.6)">
        <div class="abs" id="knob" style="left:16px;top:16px;width:198px;height:198px;border-radius:99px;background:#fff;box-shadow:0 8px 20px rgba(0,0,0,.5)"></div></div>
      <div class="abs" id="lbl" style="left:0;width:1080px;top:1420px;text-align:center;font-weight:700;font-size:64px;letter-spacing:.2em;color:#7d7d84">OPEN</div>
    </div>
  </div>
</div>
<div class="full" style="z-index:50">${vid('plain1', 0, 0.3)}</div><div class="full" id="plainw" style="z-index:51;overflow:hidden">${vid('plain2', tCut, D - tCut)}</div>`;
  const script = `
// homography: map the 1080x1920 screen element onto the measured screen quad
function H(q){const [x0,y0]=q[0],[x1,y1]=q[1],[x2,y2]=q[2],[x3,y3]=q[3];const w=1080,h=1920;
  const dx1=x1-x2,dx2=x3-x2,dx3=x0-x1+x2-x3,dy1=y1-y2,dy2=y3-y2,dy3=y0-y1+y2-y3;const det=dx1*dy2-dx2*dy1;
  const g=(dx3*dy2-dx2*dy3)/det,h2=(dx1*dy3-dx3*dy1)/det;const a=x1-x0+g*x1,b=x3-x0+h2*x3,c=x0,d=y1-y0+g*y1,e=y3-y0+h2*y3,f=y0;
  return 'matrix3d('+[a/w,d/w,0,g/w,b/h,e/h,0,h2/h,0,0,1,0,c,f,0,1].join(',')+')';}
const Q=${JSON.stringify(Q)};
const full=[[0,0],[1080,0],[1080,1920],[0,1920]];
const lerpQ=(a,b,k)=>a.map((p,i)=>[p[0]+(b[i][0]-p[0])*k,p[1]+(b[i][1]-p[1])*k]);
const scr=document.getElementById('screen');const st={k:0,z:0};
const apply=()=>{scr.style.transform=H(lerpQ(full,Q,st.k));scr.style.borderRadius=(st.k*110)+'px';
  // device zoom-through: scale the whole device around the screen centre
  const cx=(Q[0][0]+Q[2][0])/2,cy=(Q[0][1]+Q[2][1])/2,s=1+st.z*2.6;document.getElementById('dev').style.transform='translate('+(540-cx*s)*st.z/st.z+'px,0)';
  document.getElementById('dev').style.transform='translate('+((540-cx)*st.z)+'px,'+((960-cy)*st.z)+'px) translate('+cx+'px,'+cy+'px) scale('+s+') translate('+(-cx)+'px,'+(-cy)+'px)';};
tl.fromTo(st, { k: 0 }, { k: 1, duration: 0.62, ease: 'expo.inOut', onUpdate: apply }, 0.12);
tl.fromTo('#phone', { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0.3);
tl.fromTo('#shadow', { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0.5);
tl.to('#ui', { opacity: 1, duration: 0.25 }, ${r3(Math.max(0.85, tOpen - 0.15))});
tl.fromTo('#tile', { scale: 0.5, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.8)' }, ${r3(Math.max(0.9, tOpen - 0.1))});
W('#h1 .l', 0.75, 0.05); W('#h1 .a', ${tSmart});
tl.to('#knob', { x: 370, duration: 0.3, ease: 'power3.inOut' }, ${tSmart});
tl.to('#tgl', { backgroundColor: '#1fd760', boxShadow: '0 0 60px rgba(31,215,96,.8)', duration: 0.3 }, ${tSmart});
tl.to('#lbl', { color: '#3dff86', duration: 0.3 }, ${tSmart});
// zoom through the phone screen into the real phone footage at the source cut
tl.to(st, { z: 1, duration: 0.42, ease: 'expo.in', onUpdate: apply }, ${r3(tCut - 0.42)});
tl.to('#h1', { opacity: 0, duration: 0.2 }, ${r3(tCut - 0.42)});
tl.fromTo('#plainw', { scale: 1.18, filter: 'blur(6px)' }, { scale: 1, filter: 'blur(0px)', duration: 0.35, ease: 'power3.out' }, ${tCut});`;
  C.push({ id: 'i3', t0, t1, D, inner, script, bg: '#efefec', purpose: 'Open Fira Smart Desk: A-roll shrinks into a 3D phone screen, app tile + toggle switches ON on smart; zoom-through into the real phone footage' });
}
// ===== I4: "So kalau you all nak tahu kenapa Fira pilih zone tu / ataupun kenapa Fira tunggu dekat zone tu" — R4 glass candles, red zone beam, hourglass
{
  const t0 = r3(seg('S13').start - 0.3), t1 = r3(seg('S15').start + 0.2), D = r3(t1 - t0), rel = (t) => r3(t - t0);
  const tKenapa = rel(wordT('S13', 'kenapa')), tZone = rel(wordT('S13', 'zone')), tS14 = rel(seg('S14').start), tTunggu = rel(wordT('S14', 'tunggu'));
  const tEnd = rel(seg('S15').start - 0.05);
  const inner = `
<div class="full" style="z-index:5">${vid('ain', 0, 0.32)}</div>
<div class="full" id="scene" style="overflow:hidden;z-index:10;opacity:0">
  <div class="full" id="img"><img class="full" src="../assets/img/candles.png">
    <div class="abs" id="beam" style="left:-40px;top:860px;width:1160px;height:230px;background:linear-gradient(180deg,rgba(255,40,60,0),rgba(255,40,60,.38) 30%,rgba(255,40,60,.38) 70%,rgba(255,40,60,0));box-shadow:0 0 80px rgba(255,40,60,.5);transform-origin:0 50%">
      <div class="abs" style="left:0;right:0;top:44px;height:3px;background:#ff3347;box-shadow:0 0 14px #ff3347"></div><div class="abs" style="left:0;right:0;bottom:44px;height:3px;background:#ff3347;box-shadow:0 0 14px #ff3347"></div>
      <div class="abs" style="left:70px;top:-58px;font-weight:800;font-size:44px;letter-spacing:.24em;color:#ff4a5a;text-shadow:0 0 16px rgba(255,40,60,.9)">ZONE</div></div></div>
  <div class="full" style="background:linear-gradient(180deg,rgba(0,0,0,.7),rgba(0,0,0,0) 32%,rgba(0,0,0,0) 70%,rgba(0,0,0,.6))"></div>
  <img class="abs" id="hg" src="../assets/img/hourglass.png" style="left:770px;top:1180px;width:190px;filter:drop-shadow(0 0 40px rgba(255,40,60,.6));opacity:0">
  <div class="hd" id="h1" style="top:300px"><span class="ln lead" style="font-size:48px;color:#e8e8e8">${words('kenapa Fira pilih', 'l')}</span>
    <span class="ln acc" style="font-size:160px;color:#ff3347;text-shadow:0 0 24px rgba(255,51,71,.9),0 0 70px rgba(255,51,71,.5)">${words('zone tu', 'a')}</span></div>
  <div class="hd" id="h2" style="top:300px"><span class="ln lead" style="font-size:48px;color:#e8e8e8">${words('ataupun kenapa Fira', 'l2')}</span>
    <span class="ln acc" style="font-size:160px;color:#ff3347;text-shadow:0 0 24px rgba(255,51,71,.9),0 0 70px rgba(255,51,71,.5)">${words('tunggu', 'a2')}</span></div>
</div>
<div class="full" id="leak" style="z-index:20;background:radial-gradient(circle at 70% 30%,#fff6f0 0%,#ff8a6a 30%,rgba(255,40,60,.5) 60%,rgba(0,0,0,0) 85%);opacity:0;mix-blend-mode:screen"></div>
${wrapTag('wrap', '#ff3347', tEnd, D - tEnd)}`;
  const CAP = { x: 340, y: 900, w: 400, h: 140, r: 70 };
  const script = `${MORPH_IN}
// light-leak bloom from the speaker into the dark scene (R4)
tl.fromTo('#leak', { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1.4, duration: 0.3, ease: 'power2.in' }, 0.02);
tl.set('#scene', { opacity: 1 }, 0.3);
tl.to('#leak', { opacity: 0, duration: 0.45, ease: 'power2.out' }, 0.3);
tl.fromTo('#img', { scale: 1.02, rotation: -1 }, { scale: 1.14, rotation: 1, duration: ${D}, ease: 'none' }, 0);
W('#h1 .l', ${tKenapa}, 0.06); W('#h1 .a', ${tZone});
tl.fromTo('#beam', { scaleX: 0, opacity: 0 }, { scaleX: 1, opacity: 1, duration: 0.5, ease: 'expo.out' }, ${tZone});
tl.to('#h1', { opacity: 0, y: -20, filter: 'blur(8px)', duration: 0.2 }, ${r3(tS14 - 0.05)});
W('#h2 .l2', ${tS14}, 0.06); W('#h2 .a2', ${tTunggu});
tl.fromTo('#hg', { opacity: 0, y: 120, rotation: -12 }, { opacity: 1, y: 0, rotation: 6, duration: 0.5, ease: 'back.out(1.5)' }, ${tTunggu});
tl.to('#hg', { rotation: 186, duration: 0.6, ease: 'power2.inOut' }, ${r3(tTunggu + 0.7)});
// scene collapses into a red capsule which expands back into the speaker (reverse morph)
{ const sc = document.getElementById('scene'), p = { k: 0 }; tl.fromTo(p, { k: 0 }, { k: 1, duration: 0.32, ease: 'expo.in', onUpdate: () => morphAt(sc, p.k, ${JSON.stringify(CAP)}, 1, 540, 970) }, ${r3(tEnd - 0.32)}); }
tl.set('#wrap', { opacity: 1 }, ${tEnd}); tl.set('#scene', { opacity: 0 }, ${tEnd});
morphOut(document.getElementById('wrap'), ${tEnd}, 0.3, ${JSON.stringify(CAP)}, 0.65, 1.6, 540, 600);

tl.set('#wrap', { opacity: 0 }, 0);`;
  C.push({ id: 'i4', t0, t1, D, inner, script, bg: '#000', purpose: 'Kenapa pilih zone / tunggu: light-leak in, R4 glass candles, red ZONE beam, hourglass flips on tunggu; collapses into a red capsule that opens onto the face' });
}
// ===== I5: "And then barulah you nampak macam mana proses / sebelum Fira bagi setup dalam channel tu." — R1 sticky note checklist
{
  const t0 = r3(seg('S16').start - 0.34), t1 = r3(seg('S18').start + 0.3), D = r3(t1 - t0), rel = (t) => r3(t - t0);
  const tProses = rel(wordT('S16', 'proses')), tS17 = rel(seg('S17').start), tSetup = rel(wordT('S17', 'setup')), tEnd = rel(seg('S18').start - 0.03);
  const NOTE = { x: 230, y: 700, w: 620, h: 640, r: 22 };
  const items = [['Open Smart Desk', tProses], ['Chart zone', r3(tProses + 0.25)], ['Tunggu confirmation', r3(tProses + 0.5)], ['Setup dalam channel', tSetup]];
  const inner = `
<div class="full" style="background:radial-gradient(ellipse at 50% 40%,#ffffff,#efefec 70%)"></div>
<div class="hd" id="h1" style="top:330px"><span class="ln lead" style="font-size:50px;color:#8b8b8b">${words('barulah you nampak macam mana', 'l')}</span>
  <span class="ln acc" style="font-size:160px;color:#18c25a;text-shadow:0 0 30px rgba(24,194,90,.4)">${words('proses', 'a')}</span></div>
<div class="abs" id="note" style="left:${NOTE.x}px;top:${NOTE.y}px;width:${NOTE.w}px;height:${NOTE.h}px;border-radius:${NOTE.r}px;background:linear-gradient(170deg,#fff2b8,#ffe68a);box-shadow:0 40px 70px rgba(80,60,0,.25),0 4px 10px rgba(0,0,0,.08);transform:rotate(-3deg);opacity:0;padding:46px 50px">
  <div style="font-weight:600;font-size:34px;letter-spacing:.14em;color:#a3893a">NOTES · PROSES FIRA</div>
  ${items.map(([t], i) => `<div class="it" style="display:flex;align-items:center;gap:24px;margin-top:${i ? 34 : 40}px;opacity:0"><div class="ck" style="flex:none;width:66px;height:66px;border-radius:33px;border:4px solid #c9b25c;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:38px;color:#fff">✓</div><div style="font-weight:700;font-size:46px;color:#2b2510;letter-spacing:-.02em">${t}</div></div>`).join('')}
</div>
${wrapTag('wrap', '#3cff7c', 0, 0.85)}
${wrapTag('wrap2', '#3cff7c', tEnd - 0.05, D - tEnd + 0.05)}`;
  const script = `${MORPH_IN}
const wrap = document.getElementById('wrap'), wrap2 = document.getElementById('wrap2');
tl.set(wrap2, { opacity: 0 }, 0);
morphIn(wrap, 0.16, 0.52, ${JSON.stringify(NOTE)}, 0.35, 1, 540, 640);
tl.to(wrap, { opacity: 0, duration: 0.22 }, 0.62);
tl.fromTo('#note', { opacity: 0 }, { opacity: 1, duration: 0.22 }, 0.58);
W('#h1 .l', 0.55, 0.05); W('#h1 .a', ${tProses});
const its = document.querySelectorAll('#note .it'), cks = document.querySelectorAll('#note .ck'); const T = ${JSON.stringify(items.map((x) => x[1]))};
its.forEach((e, i) => { tl.fromTo(e, { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.25, ease: 'power3.out' }, T[i]);
  tl.to(cks[i], { backgroundColor: '#18c25a', borderColor: '#18c25a', boxShadow: '0 0 18px rgba(24,194,90,.7)', duration: 0.2 }, T[i] + 0.12); });
// note folds back into a capsule that opens onto the speaker
tl.to('#note', { opacity: 0, duration: 0.15 }, ${r3(tEnd - 0.05)});
tl.set(wrap2, { opacity: 1 }, ${r3(tEnd - 0.05)});
morphOut(wrap2, ${r3(tEnd - 0.05)}, 0.33, { x: ${NOTE.x}, y: ${NOTE.y}, w: ${NOTE.w}, h: ${NOTE.h}, r: 60 }, 0.45, 1, 540, 640);`;
  C.push({ id: 'i5', t0, t1, D, inner, script, bg: '#efefec', purpose: 'Proses sebelum setup: R1 sticky note; A-roll morphs into the note, 4 steps tick green; note opens back onto the face' });
}

fs.mkdirSync(path.join(HF, 'compositions'), { recursive: true }); fs.mkdirSync(path.join(HF, 'assets', 'clips'), { recursive: true });
const manifest = C.map((c) => {
  const clip = `${c.id}.mp4`; const out = path.join(HF, 'assets', 'clips', clip);
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-ss', String(c.t0), '-i', tl.source, '-t', String(c.D), '-an', '-vf', 'fps=30,scale=1080:1920', '-c:v', 'libx264', '-crf', '14', '-g', '30', '-keyint_min', '30', '-movflags', '+faststart', '-pix_fmt', 'yuv420p', out]);
  fs.writeFileSync(path.join(HF, 'compositions', `${c.id}.html`), (HEAD(c.id, c.bg) + comp(c.id, c.D, c.inner, c.script)).replace(/CLIP/g, c.id));
  return { id: c.id, start: c.t0, end: r3(c.t0 + c.D), duration: c.D, purpose: c.purpose };
});
fs.writeFileSync(path.join(HF, 'manifest.json'), JSON.stringify(manifest, null, 1));
console.log(JSON.stringify(manifest, null, 1));

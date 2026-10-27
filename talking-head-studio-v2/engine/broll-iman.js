// Iman Gadzhi "Dark Luxury UI" layer (same API as broll-layer.js: setupBroll / renderBroll).
// - B-roll parts (tl.broll): opaque near-black scenes that show literally what is being said.
// - Popups (tl.popups): graphics over the talking A-roll; `behind: true` items render in the
//   separate "behind" layer, which the composite slots between the footage and a person cutout.
// - window.SFX collects sound events (t, type, gain) for the SFX mix.
// Elements: frosted glass pills with a sparkle, glowing gradient app icon, blur-in word lists,
// wide-tracked light caps, amber underglow, line chart with entry/setup marks, slot grid, 3D icons.
(function () {
  const ACC = '#FF9A3C'; // warm amber pulled from the footage (wood / lamp tones)
  const css = `
@font-face{font-family:'IM-Light';src:url('fonts/Montserrat-Light.otf')}
@font-face{font-family:'IM-Bold';src:url('fonts/Montserrat-Bold.otf')}
@font-face{font-family:'IM-Inter';src:url('fonts/Inter_18pt-Medium.ttf')}
#behind{position:absolute;inset:0}
.ipart{position:absolute;inset:0;display:none;overflow:hidden}
.ipart.html{background:#060607}
.uglow{position:absolute;left:-20%;right:-20%;bottom:-38%;height:70%;border-radius:50%;
  background:radial-gradient(ellipse at 50% 50%,rgba(255,154,60,.55),rgba(255,120,40,.18) 45%,rgba(0,0,0,0) 70%);filter:blur(30px)}
.vign{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 45%,rgba(0,0,0,0) 40%,rgba(0,0,0,.65) 100%)}
.tcaps{position:absolute;left:120px;right:180px;text-align:center;white-space:nowrap;font-family:'IM-Light';font-size:42px;letter-spacing:.36em;color:#EDEDED;
  text-shadow:0 0 18px rgba(255,255,255,.25),0 2px 10px rgba(0,0,0,.8)}
.tcaps .spk{color:#fff;margin-right:.3em;text-shadow:0 0 14px rgba(160,200,255,.9),0 0 30px rgba(120,170,255,.6)}
.gpill{position:absolute;left:510px;display:flex;align-items:center;gap:20px;padding:26px 62px 28px 50px;border-radius:999px;white-space:nowrap;
  font-family:'IM-Inter';font-size:72px;color:#F5F5F5;letter-spacing:.01em;
  background:linear-gradient(180deg,rgba(255,255,255,.16),rgba(255,255,255,.06));border:2px solid rgba(255,255,255,.4);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.45),inset 0 -12px 24px rgba(0,0,0,.25),0 18px 50px rgba(0,0,0,.55),0 0 40px rgba(255,154,60,.10);
  backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}
.gpill.sm{font-size:58px;padding:20px 50px 22px 40px}
.gpill .s{font-size:46px;color:#fff;text-shadow:0 0 12px rgba(255,255,255,.9),0 0 24px rgba(255,190,120,.7)}
.gpill .strike{position:absolute;left:30px;right:30px;top:50%;height:4px;margin-top:-2px;border-radius:2px;background:var(--acc);
  box-shadow:0 0 12px var(--acc),0 0 26px rgba(255,154,60,.6);transform-origin:left center}
.aicon{position:absolute;left:510px;width:300px;height:300px;margin-left:-150px;border-radius:72px;background:#0b0b0d;display:flex;align-items:center;justify-content:center;
  font-family:'IM-Bold';font-size:118px;color:#fff;letter-spacing:.02em}
.aicon::before{content:'';position:absolute;inset:-5px;border-radius:76px;padding:5px;background:conic-gradient(from var(--rot,0deg),#ff3db4,#ff9a3c,#3d8bff,#9b5cff,#ff3db4);
  -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude}
.aicon::after{content:'';position:absolute;inset:-40px;border-radius:110px;z-index:-1;background:conic-gradient(from var(--rot,0deg),#ff3db4,#ff9a3c,#3d8bff,#9b5cff,#ff3db4);filter:blur(46px);opacity:var(--glow,.35)}
.wlist{position:absolute;left:120px;right:180px;text-align:center}
.wlist div{font-family:'IM-Inter';font-size:62px;line-height:1.2;color:#F2F2F2}
.gcard{position:absolute;left:140px;right:200px;border-radius:44px;background:linear-gradient(180deg,rgba(255,255,255,.08),rgba(255,255,255,.03));
  border:2px solid rgba(255,255,255,.22);box-shadow:inset 0 1px 0 rgba(255,255,255,.3),0 30px 80px rgba(0,0,0,.6)}
.gcard svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.slotgrid{position:absolute;left:510px;display:grid;grid-template-columns:repeat(4,140px);gap:30px;transform:translateX(-50%)}
.slotgrid i{display:block;width:140px;height:140px;border-radius:38px;border:2px solid rgba(255,255,255,.28);background:rgba(255,255,255,.04)}
.slotgrid i.taken{background:#26262a;border-color:#3a3a40}
.slotgrid i.free{border-color:var(--acc);background:rgba(255,154,60,.18);box-shadow:0 0 30px rgba(255,154,60,.55),inset 0 0 18px rgba(255,154,60,.4)}
.spark{position:absolute;width:26px;height:26px;color:#fff;font-size:26px;line-height:26px;text-align:center;text-shadow:0 0 10px #fff,0 0 22px rgba(255,200,140,.8)}
.nline{position:absolute;left:120px;right:180px;top:1130px;text-align:center;font-size:50px;line-height:1.3;color:#fff;text-shadow:0 2px 14px rgba(0,0,0,.85)}
.nline span{display:inline-block;margin:0 .14em;font-family:'IM-Light'}
.nline span.on{font-family:'IM-Bold'}
.pop{position:absolute;display:none}
.bigword{position:absolute;left:120px;right:180px;text-align:center;white-space:nowrap;font-family:'IM-Bold';font-size:150px;color:#fff;letter-spacing:-.01em;text-shadow:0 0 40px rgba(255,255,255,.25)}
.icon3d{position:absolute;transform-origin:50% 80%;will-change:transform,filter}
.aicon img{width:84%;height:auto;filter:drop-shadow(0 0 18px rgba(255,61,180,.45))}
.ctag{font-family:'IM-Bold';font-size:30px;letter-spacing:.14em}
.chan{position:absolute;left:140px;right:200px;top:390px;height:650px;border-radius:44px;background:linear-gradient(180deg,rgba(255,255,255,.08),rgba(255,255,255,.03));
  border:2px solid rgba(255,255,255,.22);box-shadow:inset 0 1px 0 rgba(255,255,255,.3),0 30px 80px rgba(0,0,0,.6);overflow:hidden}
.chan .hd{position:absolute;left:36px;right:36px;top:30px;height:110px;display:flex;align-items:center;gap:26px;border-bottom:2px solid rgba(255,255,255,.1)}
.chan .av{width:92px;height:92px;border-radius:50%;background:#0b0b0d;border:2px solid rgba(255,255,255,.3);display:flex;align-items:center;justify-content:center;overflow:hidden}
.chan .av img{width:84%}
.chan .nm{font-family:'IM-Bold';font-size:44px;color:#fff;line-height:1.1}
.chan .sb{font-family:'IM-Light';font-size:30px;color:rgba(255,255,255,.6);letter-spacing:.12em}
.chan .bub{position:absolute;left:36px;right:110px;top:170px;height:360px;border-radius:34px 34px 34px 10px;background:rgba(255,255,255,.07);border:2px solid rgba(255,255,255,.18)}
.chan .bub svg{position:absolute;left:18px;right:18px;top:18px;width:calc(100% - 36px);height:250px}
.chan .tg{position:absolute;left:30px;bottom:24px;padding:10px 30px;border-radius:999px;border:2px solid var(--acc);color:var(--acc);font-family:'IM-Bold';font-size:40px;
  box-shadow:0 0 22px rgba(255,154,60,.45);background:rgba(255,154,60,.1)}
.chan .sh{position:absolute;left:36px;top:560px;font-family:'IM-Inter';font-size:38px;color:rgba(255,255,255,.85)}
.chan .sh b{color:var(--acc);font-family:'IM-Bold';font-weight:normal}
.steps{position:absolute;left:180px;right:180px}
.steps .ln{position:absolute;left:35px;top:35px;width:4px;background:linear-gradient(180deg,var(--acc),rgba(255,154,60,.15));border-radius:2px;transform-origin:top}
.steps .row{position:absolute;left:0;display:flex;align-items:center;gap:34px;white-space:nowrap}
.steps .n{width:70px;height:70px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'IM-Bold';font-size:36px;color:#888;
  border:2px solid rgba(255,255,255,.25);background:#111114}
.steps .row.on .n{color:#140a02;background:var(--acc);border-color:var(--acc);box-shadow:0 0 26px rgba(255,154,60,.7)}
.steps .tx{font-family:'IM-Inter';font-size:54px;color:#F2F2F2}
/* "collage" scenes (editorial paper/ink reference, 2026-10-22): cream paper with a faint grid or pure black,
   bold black + red accent headline, grey pinned note card, photo cut-out objects, grey swoosh band, red circle */
@font-face{font-family:'IM-XB';src:url('fonts/Montserrat-ExtraBold.otf')}
.ipart.paper{background-color:#F2EDE4;background-image:linear-gradient(rgba(0,0,0,.045) 2px,transparent 2px),linear-gradient(90deg,rgba(0,0,0,.045) 2px,transparent 2px);background-size:72px 72px}
.ipart.ink{background:#050505}
.ipart.paper .uglow,.ipart.ink .uglow{display:none}
.ipart.paper .vign{background:radial-gradient(ellipse at 50% 45%,rgba(0,0,0,0) 55%,rgba(70,50,30,.16) 100%)}
.ipart.paper .nline{color:#141414;text-shadow:none}
.chead{position:absolute;left:120px;right:180px;text-align:center}
.chead .ln{display:block;white-space:nowrap}
.chead .w{display:inline-block;margin:0 .09em}
.chead .ld{font-family:'IM-Bold';font-size:62px;letter-spacing:-.03em;line-height:1.05;color:#141414}
.chead .ac{font-family:'IM-XB';font-size:var(--acs,124px);letter-spacing:-.045em;line-height:.95;color:#E3171E}
.ink .chead .ld{color:#fff;text-shadow:0 0 18px rgba(255,255,255,.35)}
.ink .chead .ac{text-shadow:0 0 12px rgba(255,30,40,.9),0 0 40px rgba(255,30,40,.55)}
.cswoosh{position:absolute;left:0;top:0;width:1080px;height:1920px}
.pcd{position:absolute;min-width:520px;padding:34px 44px 38px;border-radius:30px;color:#fff;overflow:visible;
  background:linear-gradient(160deg,rgba(34,34,40,.78),rgba(10,10,13,.86));backdrop-filter:blur(20px) saturate(150%);-webkit-backdrop-filter:blur(20px) saturate(150%);
  border:1.5px solid rgba(255,255,255,.16);box-shadow:inset 0 1px 0 rgba(255,255,255,.28),inset 0 -18px 40px rgba(0,0,0,.35),0 40px 80px rgba(20,10,0,.35),0 0 70px rgba(255,154,60,.22);
  box-shadow:0 34px 50px rgba(0,0,0,.28),0 6px 12px rgba(0,0,0,.16);transform-origin:50% 0}
.pcd::before{content:'';position:absolute;inset:-1.5px;border-radius:30px;padding:1.5px;background:linear-gradient(135deg,rgba(255,214,150,.9),rgba(255,154,60,.25) 35%,rgba(255,255,255,.08) 60%,rgba(255,154,60,.6));
  -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;pointer-events:none}
.pcd::after{content:'';position:absolute;left:8%;right:8%;top:0;height:46%;border-radius:30px 30px 60% 60%;background:linear-gradient(180deg,rgba(255,255,255,.10),rgba(255,255,255,0));pointer-events:none}
.pcd .ttl{position:relative;display:flex;align-items:center;gap:18px;font-family:'IM-Bold';font-size:56px;letter-spacing:-.02em;padding-bottom:16px;margin-bottom:10px;white-space:nowrap;text-shadow:0 0 18px rgba(255,255,255,.25)}
.pcd .ttl::after{content:'';position:absolute;left:0;right:0;bottom:0;height:3px;border-radius:2px;background:linear-gradient(90deg,#FFB65C,rgba(255,154,60,.35) 60%,rgba(255,154,60,0));box-shadow:0 0 12px rgba(255,154,60,.7)}
.pcd .ttl img{width:78px;height:78px;border-radius:50%;background:#0b0b0d;object-fit:contain;padding:9px;box-sizing:border-box;border:1.5px solid rgba(255,190,120,.6);box-shadow:0 0 18px rgba(255,154,60,.45)}
.pcd .it{position:relative;display:flex;align-items:center;gap:22px;font-family:'IM-Inter';font-size:40px;margin:18px 0 0;white-space:nowrap;color:#EDEDED}
.pcd .rail{position:absolute;left:65px;width:3px;border-radius:2px;background:linear-gradient(180deg,#FFB65C,rgba(255,154,60,.2));box-shadow:0 0 10px rgba(255,154,60,.8);transform-origin:top}
.pcd .it i{position:relative;z-index:1;font-style:normal;flex:none;width:46px;height:46px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:24px;font-family:'IM-Bold';color:#2a1602;
  background:radial-gradient(circle at 35% 30%,#fff3d6,#FFC46B 40%,#E08A1E 80%);box-shadow:0 0 0 4px rgba(255,154,60,.18),0 0 18px rgba(255,154,60,.85)}
.pcd .pin{position:absolute;left:50%;top:-24px;width:46px;height:46px;margin-left:-23px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#ff9a9a,#e3171e 45%,#7a0508);box-shadow:0 8px 10px rgba(0,0,0,.35)}
.cobj{position:absolute;will-change:transform}
.paper .cobj{filter:drop-shadow(0 28px 26px rgba(0,0,0,.26))}
.ink .cobj{filter:drop-shadow(0 0 26px rgba(255,255,255,.14))}
.cchart{position:absolute;left:70px;right:130px}
.cchart.glass{left:90px;right:150px;border-radius:34px;padding:26px;box-sizing:border-box;--acc:#FFB04A;
  background:linear-gradient(160deg,rgba(34,34,40,.74),rgba(8,8,10,.88));backdrop-filter:blur(20px) saturate(150%);-webkit-backdrop-filter:blur(20px) saturate(150%);
  border:1.5px solid rgba(255,255,255,.14);box-shadow:inset 0 1px 0 rgba(255,255,255,.25),0 40px 80px rgba(20,10,0,.35),0 0 80px rgba(255,154,60,.2)}
.cchart svg{width:100%;height:100%;overflow:visible}
.paper .cchart:not(.glass) text[fill="#fff"],.paper .cchart:not(.glass) path[fill="#fff"]{fill:#141414}
.paper .cchart:not(.glass) line[stroke="#fff"],.paper .cchart:not(.glass) circle[stroke="#fff"]{stroke:#141414}
.paper .cchart:not(.glass) line[stroke^="rgba(255,255,255"]{stroke:rgba(0,0,0,.08)}
.cchart.glass svg{filter:drop-shadow(0 0 6px rgba(255,170,70,.35))}
.ftile{position:absolute;width:340px;height:340px;border-radius:84px;display:flex;align-items:center;justify-content:center;
  background:linear-gradient(160deg,rgba(40,40,46,.8),rgba(8,8,10,.92));backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);border:1.5px solid rgba(255,255,255,.16);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.3),0 40px 70px rgba(20,10,0,.35),0 0 90px rgba(255,154,60,var(--tg,.25))}
.ftile::before{content:'';position:absolute;inset:-2px;border-radius:86px;padding:2px;background:conic-gradient(from var(--rot,0deg),#fff3c4,#e8a93a,#7a4a10,#ffd77a,#fff3c4);
  -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude}
.ftile img{width:78%}
.ccirc{position:absolute;left:0;top:0;width:1080px;height:1920px;overflow:visible}
.ccirc circle{filter:drop-shadow(0 0 10px rgba(255,154,60,.9)) drop-shadow(0 0 26px rgba(255,154,60,.5))}
`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  const clamp = (x) => Math.min(Math.max(x, 0), 1), ease = (x) => 1 - Math.pow(1 - clamp(x), 3);
  const back = (x) => { x = clamp(x); const c = 1.6; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); }; // overshoot settle
  const FR = 1 / 30;
  let parts = [], pops = [];
  window.SFX = [];
  const sfx = (t, type, gain = 1) => window.SFX.push({ t: +t.toFixed(3), type, gain });

  function wordTimes(seg) {
    const ws = seg.text.split(' '); const total = ws.reduce((a, w) => a + w.length + 1, 0); let acc = 0;
    return ws.map((w) => { const t = seg.start + (seg.end - seg.start) * 0.85 * acc / total; acc += w.length + 1; return { w, t, seg }; });
  }
  const norm = (w) => w.toLowerCase().replace(/[^a-z0-9-]/g, '');
  const findT = (words, prefix, fallback) => { const q = words.find((x) => norm(x.w).startsWith(prefix)); return q ? q.t : fallback; };
  const blurIn = (el, t, t0, dur = 6) => { const k = ease((t - t0) / (dur * FR)); el.style.opacity = k; el.style.filter = k < 1 ? `blur(${(1 - k) * 8}px)` : 'none'; return k; };
  const mk = (host, html, cls, styles) => { const d = document.createElement('div'); d.className = cls; if (html !== null) d.innerHTML = html; Object.assign(d.style, styles || {}); host.appendChild(d); return d; };
  const pill = (host, text, y, cls = '') => mk(host, `<span class="s">✦</span><span>${text}</span>`, 'gpill ' + cls, { top: y + 'px' });
  const pillIn = (t, d, t0) => { const k = ease((t - t0) / (8 * FR)); d.style.opacity = k; d.style.filter = k < 1 ? `blur(${(1 - k) * 10}px)` : 'none';
    d.style.transform = `translateX(-50%) scale(${0.85 + 0.15 * k})`; return k; };

  // Candlestick path (svg y, smaller = higher; no prices): drop into a zone, wait inside it,
  // one strong confirmation candle, then follow-through. Index 7-10 sit in the zone, 11 confirms.
  const CANDLES = [[200, 240], [240, 225], [225, 280], [280, 300], [300, 350], [350, 335], [335, 400],
    [400, 440], [440, 420], [420, 455], [455, 430], [430, 330], [330, 300], [300, 250]];
  const candleSvg = (W, H, opt = {}) => {
    const cx = (i) => 70 + i * 55;
    const grid = [1, 2, 3, 4].map((i) => `<line x1="40" x2="${W - 40}" y1="${i * 128}" y2="${i * 128}" stroke="rgba(255,255,255,.07)" stroke-width="2"/>`).join('');
    const cs = CANDLES.map(([o, c], i) => { const up = c < o, top = Math.min(o, c), h = Math.max(Math.abs(o - c), 6);
      const col = up ? 'var(--acc)' : '#6b6b72';
      return `<g class="cd" data-i="${i}"><line x1="${cx(i) + 15}" x2="${cx(i) + 15}" y1="${top - 16}" y2="${top + h + 16}" stroke="${col}" stroke-width="3"/>
        <rect x="${cx(i)}" y="${top}" width="30" height="${h}" rx="4" fill="${up ? col : 'rgba(107,107,114,.35)'}" stroke="${col}" stroke-width="3"
        ${up ? 'style="filter:drop-shadow(0 0 8px rgba(255,154,60,.7))"' : ''}/></g>`; }).join('');
    const zl = opt.zoneLabel ?? 'ZONE';
    return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">${grid}
      <g id="zone"><rect x="380" y="385" width="480" height="90" rx="14" fill="rgba(255,154,60,.13)" stroke="var(--acc)" stroke-width="3" stroke-dasharray="12 9"/>
        ${zl ? `<text class="ctag" x="396" y="372" fill="var(--acc)">${zl}</text>` : ''}</g>${cs}
      <g id="conf"><circle cx="${cx(11) + 15}" cy="380" r="70" fill="none" stroke="#fff" stroke-width="4"/>
        <text class="ctag" x="${cx(11) + 15}" y="545" text-anchor="middle" fill="#fff">${opt.confLabel ?? ''}</text></g>
      <g id="entry"><line x1="${cx(11) + 15}" x2="${W - 30}" y1="330" y2="330" stroke="#fff" stroke-width="3" stroke-dasharray="10 8"/>
        <path d="M${W - 30},330 l-20,-12 v24 z" fill="#fff"/><text class="ctag" x="650" y="322" text-anchor="end" fill="#fff">${opt.entryLabel ?? ''}</text></g>
      <g id="wait"><text class="ctag" x="550" y="545" text-anchor="middle" fill="var(--acc)">⧗ ${opt.waitLabel ?? ''}</text></g></svg>`;
  };

  window.setupBroll = (tl) => {
    document.documentElement.style.setProperty('--acc', tl.accent || ACC);
    const host = document.getElementById('broll');
    const behindHost = document.createElement('div'); behindHost.id = 'behind'; document.body.insertBefore(behindHost, document.body.firstChild);
    const wordsIn = (a, b) => { const out = []; tl.segments.filter((s) => s.end > a && s.start < b).forEach((s) => out.push(...wordTimes(s))); return out; };

    tl.broll.forEach((b) => {
      const el = document.createElement('div'); el.className = 'ipart' + (b.type === 'html' ? ' html' : ''); host.appendChild(el);
      const p = { b, el, words: wordsIn(b.start, b.end), x: {} };
      const at = (pre, fb) => findT(p.words, pre, fb);
      if (b.raw) { p.raw = true; parts.push(p); return; } // finished motion-graphics clip (HyperFrames): no overlays, no narration line
      if (b.type === 'html') mk(el, '', 'uglow');
      mk(el, '', 'vign');
      sfx(b.start, 'whoosh', 0.75); // riser / boom / tail come from the cinematic layer in mix-sfx.js
      const sc = b.scene === 'ai-icon' ? 'app-icon' : b.scene; const prm = b.p || {};
      const cueT = (c, fb) => (c ? at(String(c).toLowerCase(), fb) : fb);
      if (prm.title) { p.x.title = mk(el, `<span class="spk">✦</span>${prm.title}`, 'tcaps', { top: (prm.titleY ?? 300) + 'px' }); p.x.tTitle = cueT(prm.titleCue, b.start + 0.05); if (prm.titleCue) sfx(p.x.tTitle, 'click', 0.7); }
      if (sc === 'pills') {
        // Stacked glass pills, one per spoken item; optional amber strike-through on a later cue.
        const items = prm.items || []; const y0 = prm.y0 ?? 560, gap = prm.gap ?? 190;
        p.x.items = items.map((it, i) => { const d = pill(el, it.text, y0 + i * gap); const t = cueT(it.cue, b.start + 0.3 + i * 0.5) - 0.1; sfx(t, 'select'); return { d, t }; });
        if (prm.strike) { p.x.tX = cueT(prm.strike.cue, b.end - 0.5); p.x.items.forEach(({ d }) => { d._strike = mk(d, '', 'strike'); }); sfx(p.x.tX, 'swipe', 0.8); }
      } else if (sc === 'chart') {
        // Glass card with a rising line drawing on (metaphorical, no values), a dashed zone and a pulsing ring.
        p.x.card = mk(el, '', 'gcard', { top: '410px', height: '490px' });
        const W = 900, H = 640, pts = [[60, 500], [160, 430], [250, 470], [330, 380], [420, 420], [500, 330], [560, 360], [640, 250], [740, 200], [840, 120]];
        const grid = [1, 2, 3, 4].map((i) => `<line x1="40" x2="${W - 40}" y1="${i * 128}" y2="${i * 128}" stroke="rgba(255,255,255,.07)" stroke-width="2"/>`).join('');
        const d = 'M' + pts.map((q) => q.join(',')).join(' L');
        p.x.card.innerHTML = `<svg viewBox="0 0 ${W} ${H}">${grid}
          <rect id="zone" x="455" y="290" width="150" height="110" rx="18" fill="rgba(255,154,60,.16)" stroke="var(--acc)" stroke-width="3" stroke-dasharray="10 8"/>
          <path id="ln" d="${d}" fill="none" stroke="var(--acc)" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" style="filter:drop-shadow(0 0 10px rgba(255,154,60,.8))"/>
          <circle id="ring" cx="560" cy="360" r="26" fill="none" stroke="#fff" stroke-width="5"/><circle id="dot" cx="560" cy="360" r="11" fill="#fff"/></svg>`;
        p.x.ln = p.x.card.querySelector('#ln'); p.x.len = 1300; p.x.ln.style.strokeDasharray = p.x.len;
        p.x.zone = p.x.card.querySelector('#zone'); p.x.ring = p.x.card.querySelector('#ring'); p.x.dot = p.x.card.querySelector('#dot');
        const marks = prm.marks || [];
        p.x.marks = marks.slice(0, 2).map((m, i) => { const d = pill(el, m.text, 950, 'sm'); if (marks.length > 1) d.style.left = (i ? 685 : 335) + 'px'; const t = cueT(m.cue, b.start + 1 + i) - 0.08; sfx(t, 'select'); return { d, t }; });
        p.x.tRing = p.x.marks[0] ? p.x.marks[0].t : b.start + 1; p.x.tZone = p.x.marks[1] ? p.x.marks[1].t : p.x.tRing;
        sfx(b.start + 0.1, 'slide', 0.6); sfx(p.x.tRing + 0.05, 'shimmer', 0.35);
      } else if (sc === 'app-icon') {
        // Rounded app icon with a rotating gradient border; glow grows on a cue; blur-in word list below.
        p.x.icon = mk(el, prm.img ? `<img src="${prm.img}">` : (prm.label || 'AI'), 'aicon', { top: '360px' });
        p.x.list = mk(el, '', 'wlist', { top: '720px' });
        p.x.items = (prm.items || []).map((it, i) => { const d = document.createElement('div'); d.textContent = it.text; if (it.accent) d.style.color = 'var(--acc)'; p.x.list.appendChild(d); const t = cueT(it.cue, b.start + 0.2 + i * 0.6); sfx(t, 'click', 0.8); return { d, t }; });
        p.x.tAI = cueT(prm.glowCue, b.end - 0.8); sfx(b.start + 0.05, 'select', 0.9); sfx(p.x.tAI, 'magic', 0.55);
      } else if (sc === 'slots') {
        // Slot grid that fills up, leaving a few glowing free slots (scarcity without inventing numbers).
        p.x.grid = mk(el, '', 'slotgrid', { top: '410px' });
        p.x.cells = [...Array(prm.total || 12)].map(() => { const c = document.createElement('i'); p.x.grid.appendChild(c); return c; });
        p.x.free = prm.free || [5, 10]; p.x.tFill = b.start + 0.15;
        if (prm.pill) { p.x.slot = pill(el, prm.pill.text, 940, 'sm'); p.x.tSlot = cueT(prm.pill.cue, b.start + 0.6) - 0.1; sfx(p.x.tSlot, 'select'); }
        p.x.cells.forEach((c, i) => { if (!p.x.free.includes(i) && i % 3 === 0) sfx(p.x.tFill + i * 0.045, 'click', 0.45); });
        sfx(p.x.tFill + 0.6, 'shimmer', 0.4);
      } else if (sc === 'statement') {
        // One big spoken word/phrase (e.g. a date or keyword the speaker says) + an optional sub pill.
        const by = prm.bigY ?? 600;
        p.x.big = mk(el, prm.big ? prm.big.text : '', 'bigword', { top: by + 'px' }); p.x.tBig = cueT(prm.big && prm.big.cue, b.start + 0.2) - 0.06; sfx(p.x.tBig, 'select');
        if (prm.sub) { p.x.sub = pill(el, prm.sub.text, by + 230, 'sm'); p.x.tSub = cueT(prm.sub.cue, p.x.tBig + 0.5) - 0.08; sfx(p.x.tSub, 'select', 0.8); }
      } else if (sc === 'candles') {
        // Candlestick chart: zone box, candles waiting inside it, confirmation candle, entry/setup line. Labels are spoken words only.
        p.x.card = mk(el, '', 'gcard', { top: '410px', height: '560px' });
        p.x.card.innerHTML = candleSvg(900, 640, { zoneLabel: prm.zone?.text, confLabel: prm.confirm?.text, entryLabel: prm.entry?.text, waitLabel: prm.wait?.text });
        const q = (s) => p.x.card.querySelector(s);
        p.x.cd = [...p.x.card.querySelectorAll('.cd')]; p.x.zone = q('#zone'); p.x.conf = q('#conf'); p.x.entry = q('#entry'); p.x.wait = q('#wait');
        p.x.tZone = cueT(prm.zone?.cue, b.start + 0.5) - 0.08;
        p.x.tConf = prm.confirm ? cueT(prm.confirm.cue, b.end - 1) - 0.08 : Infinity;
        p.x.tEntry = prm.entry ? cueT(prm.entry.cue, p.x.tConf + 0.6) - 0.08 : Infinity;
        p.x.tWait = prm.wait ? cueT(prm.wait.cue, b.end - 1) - 0.08 : Infinity;
        // candles 0-6 print on entry, 7-10 print into the zone once it is named, 11-13 only after confirmation
        p.x.tC = CANDLES.map((_, i) => (i < 7 ? b.start + 0.1 + i * 0.07 : i < 11 ? Math.min(p.x.tZone, p.x.tConf - 0.6) + (i - 7) * 0.16 : i === 11 ? p.x.tConf : p.x.tConf + 0.25 + (i - 12) * 0.2));
        sfx(b.start + 0.1, 'slide', 0.6); sfx(p.x.tZone, 'select', 0.9);
        if (prm.confirm) { sfx(p.x.tConf, 'select'); sfx(p.x.tConf + 0.05, 'shimmer', 0.4); }
        if (prm.entry) sfx(p.x.tEntry, 'swipe', 0.7);
        if (prm.wait) sfx(p.x.tWait, 'click', 0.8);
      } else if (sc === 'channel') {
        // A channel feed card: avatar + channel name, a posted setup (mini chart + tag), then a "shared" line.
        p.x.card = mk(el, `<div class="hd"><div class="av">${prm.avatar ? `<img src="${prm.avatar}">` : ''}</div>
          <div><div class="nm">${prm.name || ''}</div><div class="sb">${prm.sub || 'CHANNEL'}</div></div></div>
          <div class="bub">${candleSvg(900, 640, { zoneLabel: '' })}<div class="tg">✦ ${prm.post?.text || 'Setup'}</div></div>
          ${prm.shared ? `<div class="sh">${prm.shared.text}</div>` : ''}`, 'chan');
        p.x.bub = p.x.card.querySelector('.bub'); p.x.tag = p.x.card.querySelector('.tg'); p.x.sh = p.x.card.querySelector('.sh');
        ['#conf', '#entry', '#wait'].forEach((s) => { p.x.bub.querySelector(s).style.display = 'none'; });
        p.x.tPost = cueT(prm.post?.cue, b.start + 0.5) - 0.25; p.x.tShare = prm.shared ? cueT(prm.shared.cue, b.end - 0.6) - 0.08 : Infinity;
        sfx(b.start + 0.05, 'slide', 0.6); sfx(p.x.tPost, 'iconpop', 0.7); sfx(p.x.tPost + 0.25, 'select', 0.8); if (prm.shared) sfx(p.x.tShare, 'click', 0.8);
      } else if (sc === 'collage') {
        // Editorial collage: optional swoosh, headline (lead + red accent), pinned note card, candle chart, cut-out objects, app tile, red circle.
        el.classList.add(prm.bg === 'ink' ? 'ink' : 'paper'); el.style.setProperty('--acc', '#E3171E');
        if (prm.swoosh) {
          // living swoosh: draws on, then breathes (control points drift on slow sines) while a soft light runs along it
          p.x.swPts = prm.swoosh === true ? [[-160, 160], [520, 260], [980, 560], [760, 1020], [180, 1560], [960, 2120]] : null;
          const sid = 'sg' + b.id;
          const sv = mk(el, `<svg class="cswoosh" viewBox="0 0 1080 1920"><defs><linearGradient id="${sid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#C9C5BE"/><stop offset=".5" stop-color="#B3AEA6"/><stop offset="1" stop-color="#C2BDB5"/></linearGradient>
            <filter id="${sid}b" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="14"/></filter></defs>
            <path class="sw0" fill="none" stroke="url(#${sid})" stroke-width="150" stroke-linecap="round"/>
            <path class="sw1" fill="none" stroke="rgba(255,255,255,.85)" stroke-width="60" stroke-linecap="round" filter="url(#${sid}b)"/>
            <path class="sw2" fill="none" stroke="rgba(255,190,120,.9)" stroke-width="10" stroke-linecap="round" filter="url(#${sid}b)"/></svg>`, '');
          p.x.sw = sv.querySelector('.sw0'); p.x.swL = sv.querySelector('.sw1'); p.x.swG = sv.querySelector('.sw2'); p.x.swLen = 3600; p.x.swRaw = prm.swoosh === true ? null : prm.swoosh;
          [p.x.sw, p.x.swL, p.x.swG].forEach((q) => q.setAttribute('d', p.x.swRaw || ''));
          p.x.sw.style.strokeDasharray = p.x.swLen; p.x.swL.style.strokeDasharray = '420 3600'; p.x.swG.style.strokeDasharray = '260 3600'; }
        if (prm.chart) { const c = prm.chart; p.x.ch = mk(el, candleSvg(900, 640, { vgrid: false, zoneLabel: c.zone?.text, confLabel: c.confirm?.text, entryLabel: c.entry?.text, waitLabel: c.wait?.text }), 'cchart' + (prm.glass === false ? '' : ' glass'), { top: (c.y ?? 560) + 'px', height: (c.h ?? 520) + 'px' });
          const q = (z) => p.x.ch.querySelector(z); p.x.cd = [...p.x.ch.querySelectorAll('.cd')]; p.x.zone = q('#zone'); p.x.conf = q('#conf'); p.x.entry = q('#entry'); p.x.wait = q('#wait');
          p.x.tZone = cueT(c.zone?.cue, b.start + 0.4) - 0.08; p.x.tConf = c.confirm ? cueT(c.confirm.cue, b.end - 1) - 0.08 : Infinity;
          p.x.tEntry = c.entry ? cueT(c.entry.cue, p.x.tConf + 0.6) - 0.08 : Infinity; p.x.tWait = c.wait ? cueT(c.wait.cue, b.end - 1) - 0.08 : Infinity;
          p.x.tC = CANDLES.map((_, i) => (i < 7 ? b.start + 0.12 + i * 0.06 : i < 11 ? Math.min(p.x.tZone, p.x.tConf - 0.6) + (i - 7) * 0.14 : i === 11 ? p.x.tConf : p.x.tConf + 0.25 + (i - 12) * 0.2));
          sfx(p.x.tZone, 'select', 0.8); if (c.confirm) sfx(p.x.tConf, 'select'); if (c.entry) sfx(p.x.tEntry, 'swipe', 0.6); if (c.wait) sfx(p.x.tWait, 'click', 0.8); }
        if (prm.card) { const c = prm.card;
          p.x.card = mk(el, `<div class="pin"></div><div class="ttl">${c.logo ? `<img src="${c.logo}">` : ''}<span>${c.title}</span></div>` + (c.items || []).map((it) => `<div class="it"><i>${it.icon || '✓'}</i><span>${it.text}</span></div>`).join(''), 'pcd', { left: (c.x ?? 300) + 'px', top: (c.y ?? 560) + 'px' });
          p.x.tCard = cueT(c.cue, b.start + 0.1) - 0.05; p.x.cardRot = c.rot ?? -2; sfx(p.x.tCard, 'slide', 0.7);
          if ((c.items || []).length > 1) p.x.rail = mk(p.x.card, '', 'rail');
          p.x.cits = [...p.x.card.querySelectorAll('.it')].map((d, i) => { const it = c.items[i]; const tt = cueT(it.cue, p.x.tCard + 0.3 + i * 0.35) + (it.dt || 0) - 0.08; sfx(tt, 'click', 0.8); return { d, t: tt }; }); }
        if (prm.tile) { const c = prm.tile; p.x.tile = mk(el, `<img src="${c.src}">`, 'ftile', { left: (c.x ?? 370) + 'px', top: (c.y ?? 600) + 'px' }); p.x.tTile = cueT(c.cue, b.start + 0.15) - 0.06; sfx(p.x.tTile, 'iconpop', 0.85); }
        if (prm.circle) { const c = prm.circle; const sv = mk(el, `<svg class="ccirc" viewBox="0 0 1080 1920"><circle cx="${c.x}" cy="${c.y}" r="${c.r}" fill="rgba(255,154,60,.10)" stroke="#FFB04A" stroke-width="8" transform="rotate(-80 ${c.x} ${c.y})"/></svg>`, '');
          p.x.circ = sv.querySelector('circle'); p.x.circLen = 2 * Math.PI * c.r; p.x.circ.style.strokeDasharray = p.x.circLen; p.x.tCirc = cueT(c.cue, b.end - 1) - 0.06; sfx(p.x.tCirc, 'slide', 0.8); }
        p.x.objs = (prm.objs || []).map((o) => { const im = document.createElement('img'); im.src = o.src; im.className = 'cobj'; Object.assign(im.style, { left: o.x + 'px', top: o.y + 'px', width: o.w + 'px' }); el.appendChild(im);
          const t0 = cueT(o.cue, b.start + 0.2) - 0.1; sfx(t0, o.anim === 'pop' || !o.anim ? 'iconpop' : 'whoosh', 0.8);
          const tTo = o.to ? cueT(o.to.cue, t0 + 1) - 0.1 : Infinity; if (o.to) sfx(tTo, 'slide', 0.6); return { o, im, t0, tTo }; });
        if (prm.head) { const m = String(prm.head).match(/^(.*?)\*(.+?)\*(.*)$/); const lead = m ? m[1].trim() : prm.head, acc = m ? (m[2] + m[3]).trim() : '';
          p.x.head = mk(el, '', 'chead', { top: (prm.headY ?? 290) + 'px' }); if (prm.accSize) p.x.head.style.setProperty('--acs', prm.accSize + 'px'); const tH = cueT(prm.headCue, b.start + 0.05) - 0.06, tA = prm.accCue ? cueT(prm.accCue, tH + 0.3) - 0.06 : tH + 0.25;
          const line = (txt, cls, t0) => { const l = mk(p.x.head, '', 'ln ' + cls); return txt.split(' ').filter(Boolean).map((w, i) => ({ d: mk(l, w, 'w'), t: t0 + i * 0.07 })); };
          p.x.hw = [...(lead ? line(lead, 'ld', tH) : []), ...(acc ? line(acc, 'ac', tA) : [])]; if (acc) { p.x.hAcc = p.x.hw.slice(-acc.split(' ').length); sfx(tA, 'select', 0.85); } }
      } else if (sc === 'steps') {
        // Numbered process rows on an amber rail; each lights up on its spoken cue (dt shifts it after the cue).
        const items = (prm.items || []).slice(0, 4), y0 = prm.y0 ?? 440, gap = prm.gap ?? 150;
        p.x.box = mk(el, '', 'steps', { top: y0 + 'px' });
        p.x.ln = mk(p.x.box, '', 'ln', { height: (items.length - 1) * gap + 'px' });
        p.x.items = items.map((it, i) => { const d = mk(p.x.box, `<div class="n">${i + 1}</div><div class="tx">${it.text}</div>`, 'row', { top: i * gap + 'px' });
          const t = cueT(it.cue, b.start + 0.3 + i * 0.4) + (it.dt || 0) - 0.08; sfx(t, 'select', 0.85); return { d, t }; });
      }
      p.x.sparks = (b.sparks || []).map(([sx, sy, dd]) => ({ el: mk(el, '✦', 'spark', { left: sx + 'px', top: sy + 'px' }), d: dd }));
      p.nl = mk(el, '', 'nline'); p.nlSeg = null;
      if (b.tin === 'iris') sfx(b.start, 'swipe', 0.8);
      if (b.tout === 'spin') sfx(b.end - 8 * FR, 'whoosh', 0.85);
      parts.push(p);
    });
    // a part followed directly by an iris keeps drawing underneath until the circle has covered the frame
    parts.forEach((p) => { const nx = parts.find((q) => q.b.tin === 'iris' && Math.abs(q.b.start - p.b.end) < 0.05); p.hold = nx ? 11 * FR : 0; });

    (tl.popups || []).forEach((q) => {
      const words = wordsIn(q.start, q.end);
      const t0 = findT(words, q.cue, q.start + 0.1) - (q.lead ?? 0.12);
      const el = mk(q.behind ? behindHost : host, '', 'pop', { left: 0, top: 0, width: '100%', height: '100%' });
      const it = { q, el, t0 };
      if (q.kind === 'icon') {
        it.img = document.createElement('img'); it.img.src = q.src; it.img.className = 'icon3d';
        Object.assign(it.img.style, { left: q.x + 'px', top: q.y + 'px', width: q.size + 'px' }); el.appendChild(it.img);
        sfx(it.t0 + 0.18, 'rise', 0.8); sfx(it.t0 + 0.22, 'iconpop', 0.85); sfx(it.t0 + 0.3, 'shimmer', 0.3);
        if (q.mouse) sfx(findT(words, q.mouse, it.t0), 'mouse', 0.8);
      } else if (q.kind === 'ring') {
        // R3: thin glowing circle drawn around the speaker's face
        it.svg = mk(el, `<svg width="1080" height="1920" style="position:absolute;left:0;top:0;overflow:visible"><circle cx="${q.x}" cy="${q.y}" r="${q.r}" fill="none" stroke="#fff" stroke-width="5" style="filter:drop-shadow(0 0 10px rgba(255,255,255,.8))" transform="rotate(-90 ${q.x} ${q.y})"/></svg>`, '', { position: 'absolute', left: 0, top: 0, width: '1080px', height: '1920px' });
        it.circ = it.svg.querySelector('circle'); it.len = 2 * Math.PI * q.r; it.circ.style.strokeDasharray = it.len; sfx(it.t0, 'swipe', 0.5);
      } else if (q.kind === 'pills') {
        if (q.title) it.title = mk(el, `<span class="spk">✦</span>${q.title}`, 'tcaps', { top: q.titleY + 'px' });
        it.pills = q.pills.map((pp) => { const d = pill(el, pp.text, pp.y, 'sm'); const t = findT(words, pp.cue, q.start + 0.3) - 0.1; sfx(t, 'select'); return { d, t }; });
      }
      pops.push(it);
    });
  };

  window.renderBroll = (t) => {
    const layer = window.LAYER || 'front';
    parts.forEach((p) => {
      const b = p.b; const on = layer === 'front' && t >= b.start && t < b.end + (p.hold || 0); p.el.style.display = on ? 'block' : 'none'; if (!on) return;
      if (p.raw) return;
      const x = p.x; const sc = b.scene === 'ai-icon' ? 'app-icon' : b.scene;
      if (x.title) blurIn(x.title, t, x.tTitle ?? b.start + 0.05, 8);
      if (sc === 'pills') {
        x.items.forEach(({ d, t: ti }) => pillIn(t, d, ti));
        if (x.tX !== undefined) x.items.forEach(({ d }, i) => { const k = ease((t - x.tX - i * 0.1) / (6 * FR)); d._strike.style.transform = `scaleX(${k})`; if (k > 0) d.style.opacity = String(1 - 0.45 * k); });
      } else if (sc === 'chart') {
        const k = ease((t - b.start - 0.1) / (40 * FR)); x.card.style.opacity = ease((t - b.start) / (8 * FR)); x.card.style.transform = `scale(${0.96 + 0.04 * ease((t - b.start) / (10 * FR))})`;
        x.ln.style.strokeDashoffset = x.len * (1 - k);
        x.zone.style.opacity = ease((t - x.tZone) / (8 * FR));
        const r = ease((t - x.tRing) / (6 * FR)); const pulse = 1 + 0.35 * Math.max(0, Math.sin((t - x.tRing) * 6)); x.ring.style.opacity = r; x.dot.style.opacity = r;
        x.ring.setAttribute('r', String(26 * pulse * r || 0.01));
        x.marks.forEach(({ d, t: tm }) => pillIn(t, d, tm));
      } else if (sc === 'app-icon') {
        const k = ease((t - b.start - 0.05) / (10 * FR)); x.icon.style.opacity = k; x.icon.style.filter = k < 1 ? `blur(${(1 - k) * 12}px)` : 'none';
        x.icon.style.transform = `scale(${0.8 + 0.2 * k})`; x.icon.style.setProperty('--rot', ((t - b.start) * 60) + 'deg');
        x.icon.style.setProperty('--glow', String(0.3 + 0.55 * ease((t - x.tAI) / (8 * FR))));
        x.items.forEach(({ d, t: ti }) => { const kk = ease((t - ti) / (6 * FR)); d.style.opacity = kk; d.style.filter = kk < 1 ? `blur(${(1 - kk) * 8}px)` : 'none'; d.style.transform = `translateY(${(1 - kk) * 16}px)`; });
      } else if (sc === 'slots') {
        x.grid.style.opacity = ease((t - b.start) / (6 * FR));
        x.cells.forEach((c, i) => { const free = x.free.includes(i); const on2 = t >= x.tFill + i * 0.045;
          c.className = on2 ? (free ? 'free' : 'taken') : ''; c.style.transform = `scale(${on2 ? 0.92 + 0.08 * ease((t - x.tFill - i * 0.045) / (4 * FR)) : 0.92})`; });
        if (x.slot) pillIn(t, x.slot, x.tSlot);
      } else if (sc === 'statement') {
        const k = ease((t - x.tBig) / (8 * FR)); x.big.style.opacity = k; x.big.style.filter = k < 1 ? `blur(${(1 - k) * 12}px)` : 'none'; x.big.style.transform = `scale(${1.12 - 0.12 * k})`;
        if (x.sub) pillIn(t, x.sub, x.tSub);
      } else if (sc === 'candles') {
        x.card.style.opacity = ease((t - b.start) / (8 * FR)); x.card.style.transform = `scale(${0.96 + 0.04 * ease((t - b.start) / (10 * FR))})`;
        x.cd.forEach((g, i) => { const k = ease((t - x.tC[i]) / (4 * FR)); g.style.opacity = k; g.style.transform = `translateY(${(1 - k) * 14}px)`; });
        x.zone.style.opacity = ease((t - x.tZone) / (8 * FR));
        const c = ease((t - x.tConf) / (6 * FR)); x.conf.style.opacity = c;
        x.conf.querySelector('circle').setAttribute('r', String(70 * (1 + 0.12 * Math.max(0, Math.sin((t - x.tConf) * 6))) * c || 0.01));
        x.entry.style.opacity = ease((t - x.tEntry) / (6 * FR));
        x.wait.style.opacity = t < x.tWait ? 0 : 0.55 + 0.45 * Math.abs(Math.sin((t - x.tWait) * 3));
      } else if (sc === 'channel') {
        x.card.style.opacity = ease((t - b.start) / (8 * FR)); x.card.style.transform = `translateY(${(1 - ease((t - b.start) / (10 * FR))) * 40}px)`;
        const k = back((t - x.tPost) / (10 * FR)); x.bub.style.opacity = clamp((t - x.tPost) / (4 * FR)); x.bub.style.transform = `translateY(${(1 - k) * 60}px) scale(${0.92 + 0.08 * k})`;
        pillIn(t, x.tag, x.tPost + 0.25); x.tag.style.transform = `scale(${0.85 + 0.15 * ease((t - x.tPost - 0.25) / (8 * FR))})`;
        if (x.sh) blurIn(x.sh, t, x.tShare, 6);
      } else if (sc === 'collage') {
        if (x.sw) { const u = t - b.start, k = ease(u / (14 * FR));
          if (x.swPts) { const P = x.swPts.map(([px, py], i) => [px + Math.sin(u * 1.1 + i * 1.7) * 26, py + Math.cos(u * 0.9 + i * 1.3) * 34]);
            const d = `M ${P[0][0]} ${P[0][1]} C ${P[1][0]} ${P[1][1]}, ${P[2][0]} ${P[2][1]}, ${P[3][0]} ${P[3][1]} S ${P[4][0]} ${P[4][1]}, ${P[5][0]} ${P[5][1]}`;
            [x.sw, x.swL, x.swG].forEach((q) => q.setAttribute('d', d)); }
          x.sw.style.strokeDashoffset = x.swLen * (1 - k);
          const run = (u * 780) % 4200; x.swL.style.strokeDashoffset = -run + 420; x.swG.style.strokeDashoffset = -run + 300;
          const lo = clamp((u - 0.3) / 0.3) * 0.9; x.swL.style.opacity = lo * 0.85; x.swG.style.opacity = lo; }
        if (x.ch) { x.ch.style.opacity = ease((t - b.start) / (6 * FR));
          x.cd.forEach((g, i) => { const k = ease((t - x.tC[i]) / (4 * FR)); g.style.opacity = k; g.style.transform = `translateY(${(1 - k) * 14}px)`; });
          x.zone.style.opacity = ease((t - x.tZone) / (8 * FR)); const c = ease((t - x.tConf) / (6 * FR)); x.conf.style.opacity = c;
          x.conf.querySelector('circle').setAttribute('r', String(70 * (1 + 0.12 * Math.max(0, Math.sin((t - x.tConf) * 6))) * c || 0.01));
          x.entry.style.opacity = ease((t - x.tEntry) / (6 * FR)); x.wait.style.opacity = t < x.tWait ? 0 : 0.55 + 0.45 * Math.abs(Math.sin((t - x.tWait) * 3)); }
        if (x.card) { const k = back((t - x.tCard) / (7 * FR)); x.card.style.opacity = clamp((t - x.tCard) / (3 * FR)); x.card.style.transform = `translateY(${(1 - k) * -90}px) rotate(${x.cardRot + (1 - k) * 8}deg)`;
          x.cits.forEach(({ d, t: ti }) => { blurIn(d, t, ti, 4); d.style.transform = `translateX(${(1 - ease((t - ti) / (5 * FR))) * 24}px)`; });
          if (x.rail) { const first = x.cits[0].d, last = x.cits[x.cits.length - 1].d; const lit = x.cits.filter(({ t: ti }) => t >= ti); const tgt = lit.length ? lit[lit.length - 1].d : first;
            x.rail.style.top = (first.offsetTop + 23) + 'px'; x.rail.style.height = Math.max(0, last.offsetTop - first.offsetTop) + 'px';
            const span = last.offsetTop - first.offsetTop || 1, pos = (q) => (q.offsetTop - first.offsetTop) / span; const j = lit.length - 1; let rk = 0; void tgt;
            if (j >= 1) { const a0 = pos(x.cits[j - 1].d), a1 = pos(x.cits[j].d); rk = a0 + (a1 - a0) * ease((t - x.cits[j].t) / (6 * FR)); }
            x.rail.style.transform = `scaleY(${rk})`; } }
        if (x.tile) { x.tile.style.setProperty('--rot', ((t - b.start) * 50) + 'deg'); x.tile.style.setProperty('--tg', String(0.22 + 0.2 * Math.max(0, Math.sin((t - b.start) * 3)))); const k = back((t - x.tTile) / (7 * FR)); x.tile.style.opacity = clamp((t - x.tTile) / (3 * FR)); x.tile.style.transform = `scale(${0.3 + 0.7 * k}) rotate(${(1 - k) * -14}deg)`; }
        if (x.circ) { x.circ.style.strokeDashoffset = x.circLen * (1 - ease((t - x.tCirc) / (9 * FR))); x.circ.style.opacity = clamp((t - x.tCirc) / (3 * FR)); }
        x.objs.forEach(({ o, im, t0, tTo }) => { const u = t - t0; const k = back(u / (7 * FR)), a = clamp(u / (2 * FR)); const fl = Math.sin(u * 2.1) * 8 * clamp(u / 0.6);
          let dx = 0, dy = 0, sc2 = 1, rot = o.rot || 0;
          if (o.anim === 'left') dx = (1 - ease(u / (8 * FR))) * -700; else if (o.anim === 'right') dx = (1 - ease(u / (8 * FR))) * 700;
          else if (o.anim === 'drop') dy = (1 - k) * -500; else sc2 = 0.2 + 0.8 * k;
          if (o.to) { const m = ease((t - tTo) / (12 * FR)); dx += (o.to.x - o.x) * m; dy += (o.to.y - o.y) * m; }
          if (o.anim === 'left' || o.anim === 'right') rot += (1 - ease(u / (8 * FR))) * (o.anim === 'left' ? -25 : 25);
          im.style.opacity = a; im.style.transform = `translate(${dx}px,${dy + fl}px) scale(${sc2}) rotate(${rot + (1 - k) * -10}deg)`; });
        if (x.hw) x.hw.forEach(({ d, t: tw }) => { const k = ease((t - tw) / (4 * FR)); d.style.opacity = k; d.style.filter = k < 1 ? `blur(${(1 - k) * 10}px)` : 'none'; d.style.transform = `translateY(${(1 - k) * 18}px) scale(${1.12 - 0.12 * k})`; });
      } else if (sc === 'steps') {
        x.box.style.opacity = ease((t - b.start) / (6 * FR));
        const lit = x.items.filter(({ t: ti }) => t >= ti).length; x.ln.style.transform = `scaleY(${x.items.length > 1 ? clamp((lit - 1) / (x.items.length - 1)) : 0})`;
        x.items.forEach(({ d, t: ti }) => { const kk = ease((t - ti) / (6 * FR)); d.classList.toggle('on', t >= ti); d.style.opacity = String(0.22 + 0.78 * kk);
          d.style.filter = kk > 0 && kk < 1 ? `blur(${(1 - kk) * 6}px)` : 'none'; d.style.transform = `translateX(${(1 - kk) * 24}px)`; });
      }
      x.sparks.forEach(({ el, d }) => { const ph = (t - b.start) * 2.2 + d; el.style.opacity = String(0.25 + 0.75 * Math.pow(Math.max(0, Math.sin(ph)), 3)); el.style.transform = `scale(${0.7 + 0.5 * Math.max(0, Math.sin(ph))})`; });
      let cur = null; p.words.forEach((q) => { if (q.seg.start <= t) cur = q.seg; });
      if (cur && t <= cur.end + 0.4) {
        if (p.nlSeg !== cur) { p.nlSeg = cur; p.nl.innerHTML = ''; p.nlWords = p.words.filter((q) => q.seg === cur).map((q) => { const s = document.createElement('span'); s.textContent = q.w; p.nl.appendChild(s); return { s, t: q.t }; }); }
        p.nl.style.opacity = 1; p.nlWords.forEach(({ s, t: tw }) => s.classList.toggle('on', t >= tw));
      } else p.nl.style.opacity = 0;
      // transitions: in = iris (growing circle from irisAt) | pop | dip (black frames drawn by captions.html); out = spin | dip | blur (default)
      let cp = 'none', tf = '', fl = 'none', op = 1;
      let mk2 = 'none';
      if (b.tin === 'iris') { const f = (t - b.start) / FR; const [ix, iy] = b.irisAt || [540, 960];
        if (f < 7) { const r = f < 2 ? 46 + f * 18 : 82 + Math.pow((f - 2) / 5, 2.2) * 2300; mk2 = `radial-gradient(circle at ${ix}px ${iy}px,#000 ${r.toFixed(1)}px,rgba(0,0,0,0) ${(r + 26).toFixed(1)}px)`; }
        const k = ease((t - b.start) / (9 * FR)); tf += ` scale(${1.1 - 0.1 * k})`; p.el.style.transformOrigin = `${ix}px ${iy}px`; }
      if (b.tin === 'pop') { const k = ease((t - b.start) / (4 * FR)); tf += ` scale(${1.12 - 0.12 * k})`; }
      if (b.tout === 'flicker') { const f = Math.floor((b.end - t) / FR + 1e-6); const bri = { 4: 0.55, 3: 0, 2: 1, 1: 0.6 }[f]; if (bri !== undefined) fl = `brightness(${bri})`; }
      else if (b.tout === 'spin') { const u = clamp((t - (b.end - 6 * FR)) / (6 * FR)), e = u * u; tf += ` translate(${-260 * e}px,${140 * e}px) rotate(${-26 * e}deg) scale(${1 + 0.28 * e})`; op = 1 - e; if (e > 0) fl = `blur(${6 * e}px)`; }
      else if (!b.tout) { const out = clamp((t - (b.end - 4 * FR)) / (4 * FR)); if (out > 0) fl = `blur(${out * 10}px)`; }
      p.el.style.clipPath = cp; p.el.style.webkitMaskImage = mk2; p.el.style.maskImage = mk2; p.el.style.transform = tf; p.el.style.opacity = op; p.el.style.filter = fl;
    });

    pops.forEach((it) => {
      const q = it.q; const mine = (layer === 'behind') === !!q.behind;
      const on = mine && t >= it.t0 && t < q.end; it.el.style.display = on ? 'block' : 'none'; if (!on) return;
      const out = clamp((t - (q.end - (q.kind === 'icon' ? 9 : 5) * FR)) / ((q.kind === 'icon' ? 9 : 5) * FR));
      if (q.kind === 'icon') {
        // Smooth rise from behind the shoulder: critically-damped spring (no jerk), scale and
        // de-blur in together, slow float + sway once settled, then shrink + blur out.
        const u = t - it.t0; const sp = 1 - Math.exp(-7 * u) * (1 + 7 * u - 2.2 * u * Math.sin(5.5 * u));
        const k = Math.min(Math.max(sp, 0), 1.04); const settle = clamp(u / 0.9);
        const fl = Math.sin(u * 1.9) * 7 * settle, sw = Math.sin(u * 1.3 + 0.6) * 2.2 * settle;
        const sc = (0.55 + 0.45 * ease(u / (16 * FR))) * (1 - 0.18 * ease(out));
        it.img.style.transform = `translateY(${(1 - k) * q.rise + fl - 30 * ease(out)}px) rotate(${(1 - k) * q.tilt + sw}deg) scale(${sc})`;
        it.img.style.opacity = String(clamp(u / (5 * FR)) * (1 - out));
        const bl = Math.max((1 - clamp(u / (8 * FR))) * 10, out * 12); it.img.style.filter = `drop-shadow(0 24px 44px rgba(0,0,0,.45)) drop-shadow(0 0 ${q.glow ? 60 : 34}px ${q.glow || "rgba(255,154,60,.38)"})${bl > 0.2 ? ` blur(${bl.toFixed(1)}px)` : ''}`;
      } else if (q.kind === 'ring') {
        const k = ease((t - it.t0) / (10 * FR)); it.circ.style.strokeDashoffset = it.len * (1 - k); it.el.style.opacity = String(1 - out);
        it.el.style.transformOrigin = `${q.x}px ${q.y}px`; it.el.style.transform = `scale(${1 + 0.02 * Math.sin((t - it.t0) * 4)})`;
      } else if (q.kind === 'pills') {
        if (it.title) blurIn(it.title, t, it.t0, 8);
        it.pills.forEach(({ d, t: tp }) => pillIn(t, d, tp));
        it.el.style.opacity = String(1 - out); it.el.style.filter = out > 0 ? `blur(${out * 10}px)` : 'none';
      }
    });
  };
})();

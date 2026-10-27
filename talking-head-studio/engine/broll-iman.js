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

  window.setupBroll = (tl) => {
    document.documentElement.style.setProperty('--acc', tl.accent || ACC);
    const host = document.getElementById('broll');
    const behindHost = document.createElement('div'); behindHost.id = 'behind'; document.body.insertBefore(behindHost, document.body.firstChild);
    const wordsIn = (a, b) => { const out = []; tl.segments.filter((s) => s.end > a && s.start < b).forEach((s) => out.push(...wordTimes(s))); return out; };

    tl.broll.forEach((b) => {
      const el = document.createElement('div'); el.className = 'ipart' + (b.type === 'html' ? ' html' : ''); host.appendChild(el);
      const p = { b, el, words: wordsIn(b.start, b.end), x: {} };
      const at = (pre, fb) => findT(p.words, pre, fb);
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
        p.x.icon = mk(el, prm.label || 'AI', 'aicon', { top: '360px' });
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
      }
      p.x.sparks = (b.sparks || []).map(([sx, sy, dd]) => ({ el: mk(el, '✦', 'spark', { left: sx + 'px', top: sy + 'px' }), d: dd }));
      p.nl = mk(el, '', 'nline'); p.nlSeg = null;
      parts.push(p);
    });

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
      const b = p.b; const on = layer === 'front' && t >= b.start && t < b.end; p.el.style.display = on ? 'block' : 'none'; if (!on) return;
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
      }
      x.sparks.forEach(({ el, d }) => { const ph = (t - b.start) * 2.2 + d; el.style.opacity = String(0.25 + 0.75 * Math.pow(Math.max(0, Math.sin(ph)), 3)); el.style.transform = `scale(${0.7 + 0.5 * Math.max(0, Math.sin(ph))})`; });
      let cur = null; p.words.forEach((q) => { if (q.seg.start <= t) cur = q.seg; });
      if (cur && t <= cur.end + 0.4) {
        if (p.nlSeg !== cur) { p.nlSeg = cur; p.nl.innerHTML = ''; p.nlWords = p.words.filter((q) => q.seg === cur).map((q) => { const s = document.createElement('span'); s.textContent = q.w; p.nl.appendChild(s); return { s, t: q.t }; }); }
        p.nl.style.opacity = 1; p.nlWords.forEach(({ s, t: tw }) => s.classList.toggle('on', t >= tw));
      } else p.nl.style.opacity = 0;
      const out = clamp((t - (b.end - 4 * FR)) / (4 * FR)); p.el.style.filter = out > 0 ? `blur(${out * 10}px)` : 'none';
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
        const bl = Math.max((1 - clamp(u / (8 * FR))) * 10, out * 12); it.img.style.filter = `drop-shadow(0 24px 44px rgba(0,0,0,.45)) drop-shadow(0 0 34px rgba(255,154,60,.38))${bl > 0.2 ? ` blur(${bl.toFixed(1)}px)` : ''}`;
      } else if (q.kind === 'pills') {
        if (it.title) blurIn(it.title, t, it.t0, 8);
        it.pills.forEach(({ d, t: tp }) => pillIn(t, d, tp));
        it.el.style.opacity = String(1 - out); it.el.style.filter = out > 0 ? `blur(${out * 10}px)` : 'none';
      }
    });
  };
})();

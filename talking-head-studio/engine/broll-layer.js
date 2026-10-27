// B1 B-roll typography and deterministic scenes.
// - Top word: the single word being spoken, white Inter Regular near the top (B1 grammar).
// - Scene phrase: white sans line + DM Serif Display Italic accent (gold, or red for negatives).
// - "html" parts draw their whole scene here (opaque); "video" parts are composited by FFmpeg underneath.
(function () {
  const css = `
@font-face{font-family:'B1Sans';src:url('fonts/Inter_18pt-Regular.ttf')}
@font-face{font-family:'B1Serif';src:url('fonts/DMSerifDisplay-Italic.ttf')}
.bpart{position:absolute;inset:0;display:none}
.bpart.html{background:radial-gradient(ellipse 70% 35% at 50% 0%,rgba(212,160,40,.45),rgba(0,0,0,0) 70%),#000}
.topw{position:absolute;left:0;right:0;top:330px;text-align:center;font-family:'B1Sans';font-size:68px;color:#fff;letter-spacing:.005em;text-shadow:0 2px 12px rgba(0,0,0,.7)}
.phrase{position:absolute;left:90px;right:90px;text-align:var(--align,left)}
.phrase .l1{font-family:'B1Sans';font-size:86px;color:#fff;line-height:1.05;text-shadow:0 2px 14px rgba(0,0,0,.8)}
.phrase .l2{font-family:'B1Serif';font-size:var(--l2size,128px);line-height:.95;color:var(--acc);padding-left:var(--indent,140px);text-shadow:0 0 24px var(--accglow),0 3px 14px rgba(0,0,0,.6)}
.phrase .w{margin:0 .24em 0 0}
.btn{position:absolute;left:50%;width:520px;height:170px;margin-left:-260px;border-radius:999px;display:flex;align-items:center;justify-content:center;
  font-family:'Key';font-size:92px;color:#1b1405;background:linear-gradient(180deg,#fff1b8 0%,#f2c24a 38%,#b8861d 78%,#7a5410 100%);
  box-shadow:0 0 0 3px rgba(255,236,170,.65) inset,0 18px 40px rgba(0,0,0,.6),0 0 60px rgba(242,194,74,.35)}
.btn::after{content:'';position:absolute;left:8%;right:8%;top:8%;height:32%;border-radius:999px;background:linear-gradient(180deg,rgba(255,255,255,.75),rgba(255,255,255,0))}
.xmark{position:absolute;left:50%;top:1150px;width:760px;height:760px;margin:-380px 0 0 -380px}
.xmark i{position:absolute;left:50%;top:50%;width:900px;height:120px;margin:-60px 0 0 -450px;border-radius:20px;
  background:linear-gradient(90deg,rgba(150,0,10,.55),rgba(225,20,30,.92),rgba(150,0,10,.55));box-shadow:0 0 50px rgba(220,0,20,.55);filter:blur(1.5px)}
`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  const clamp = (x) => Math.min(Math.max(x, 0), 1), ease = (x) => 1 - Math.pow(1 - clamp(x), 3);
  const FR = 1 / 30;
  let parts = [];

  // Word times inside a segment: same char-share rule as the A-roll captions.
  function wordTimes(seg) {
    const ws = seg.text.split(' '); const total = ws.reduce((a, w) => a + w.length + 1, 0); let acc = 0;
    return ws.map((w) => { const t = seg.start + (seg.end - seg.start) * 0.85 * acc / total; acc += w.length + 1; return { w, t }; });
  }

  window.setupBroll = (tl) => {
    const host = document.getElementById('broll');
    tl.broll.forEach((b) => {
      const el = document.createElement('div'); el.className = 'bpart' + (b.type === 'html' ? ' html' : ''); host.appendChild(el);
      const p = { b, el, words: [], phrase: [], extra: {} };
      tl.segments.filter((s) => s.end > b.start && s.start < b.end).forEach((s) => p.words.push(...wordTimes(s)));
      p.words = p.words.filter((x) => x.t >= b.start - 0.05 && x.t < b.end);
      const top = document.createElement('div'); top.className = 'topw'; el.appendChild(top); p.top = top;
      if (b.phrase) {
        const ph = document.createElement('div'); ph.className = 'phrase'; ph.style.top = b.phrase.y * 1920 + 'px';
        ph.style.setProperty('--acc', b.phrase.red ? '#E3141E' : '#F6C445');
        ph.style.setProperty('--accglow', b.phrase.red ? 'rgba(227,20,30,.45)' : 'rgba(246,196,69,.45)');
        if (b.phrase.size) ph.style.setProperty('--l2size', b.phrase.size + 'px');
        if (b.phrase.align) ph.style.setProperty('--align', b.phrase.align);
        if (b.phrase.indent !== undefined) ph.style.setProperty('--indent', b.phrase.indent + 'px');
        [['l1', b.phrase.l1], ['l2', b.phrase.l2]].forEach(([cls, txt], li) => {
          const d = document.createElement('div'); d.className = cls; ph.appendChild(d);
          txt.split(' ').forEach((w, i) => { const s = document.createElement('span'); s.className = 'w'; s.style.display = 'inline-block'; s.textContent = w; d.appendChild(s);
            p.phrase.push({ el: s, t: b.start + 0.25 + li * 0.35 + i * 0.12, serif: li === 1 }); });
        });
        el.appendChild(ph);
      }
      if (b.scene === 'buysell') {
        const mk = (txt, y) => { const d = document.createElement('div'); d.className = 'btn'; d.textContent = txt; d.style.top = y + 'px'; el.appendChild(d); return d; };
        p.extra.buy = mk('Buy', 980); p.extra.sell = mk('Sell', 1210);
        const x = document.createElement('div'); x.className = 'xmark'; x.innerHTML = '<i></i><i></i>'; el.appendChild(x); p.extra.x = x;
        const find = (w) => (p.words.find((q) => q.w.toLowerCase().startsWith(w)) || {}).t;
        p.extra.tBuy = find('buy') ?? b.start + 0.4; p.extra.tSell = find('sell') ?? b.start + 1.0; p.extra.tX = find('je') ?? b.end - 0.6;
      }
      parts.push(p);
    });
  };

  window.renderBroll = (t) => {
    parts.forEach((p) => {
      const on = t >= p.b.start && t < p.b.end; p.el.style.display = on ? 'block' : 'none'; if (!on) return;
      // top word: one at a time, quick 3-frame fade
      let cur = null; p.words.forEach((q) => { if (q.t <= t) cur = q; });
      p.top.textContent = cur ? cur.w.replace(/[.,]$/, '') : '';
      p.top.style.opacity = cur ? ease((t - cur.t) / (3 * FR)) : 0;
      p.phrase.forEach((q) => { const k = ease((t - q.t) / (6 * FR)); q.el.style.opacity = k;
        q.el.style.transform = q.serif ? `translateY(${(1 - k) * 30}px) scale(${1.08 - 0.08 * k})` : `translateY(${(1 - k) * 18}px)`;
        q.el.style.filter = k < 1 ? `blur(${(1 - k) * 6}px)` : 'none'; });
      if (p.b.scene === 'buysell') {
        const e = p.extra; const s0 = ease((t - p.b.start) / (8 * FR));
        [['buy', e.tBuy], ['sell', e.tSell]].forEach(([k, tk], i) => {
          const a = ease((t - (p.b.start + 0.05 + i * 0.12)) / (8 * FR)); const pulse = Math.max(0, 1 - Math.abs(t - tk) / 0.18);
          e[k].style.opacity = a; e[k].style.transform = `translateX(${(1 - a) * (i ? 300 : -300)}px) scale(${(0.9 + 0.1 * s0) * (1 + 0.06 * pulse)})`;
        });
        const xi = ease((t - e.tX) / (6 * FR)); e.x.style.opacity = xi;
        const bars = e.x.querySelectorAll('i');
        bars[0].style.transform = `rotate(45deg) scaleX(${xi})`; bars[1].style.transform = `rotate(-45deg) scaleX(${clamp((t - e.tX - 0.08) / (6 * FR))})`;
      }
    });
  };
})();

// Writes "<source name> - REVIEW.html" next to the source video: the edit with a clickable timeline
// (captions, B-roll + transitions, popups, punch-ins, SFX, transcript). Run inside the project folder:
//   node <skill>/scripts/make-review.js [video.mp4]
// Opens straight from disk (file://); data is embedded, the videos are referenced by relative path.
const fs = require('fs');
const path = require('path');

const tl = JSON.parse(fs.readFileSync('timeline.json', 'utf8'));
const srcDir = path.dirname(tl.source), name = path.basename(tl.source, path.extname(tl.source));
const rel = (p) => path.relative(srcDir, p).split(path.sep).map(encodeURIComponent).join('/');
// versions: exports next to the source (newest first), then older ones kept in out/old
const exp = fs.readdirSync(srcDir).filter((f) => f.startsWith(name + ' - ') && /\.mp4$/i.test(f) && !/REVIEW/.test(f))
  .map((f) => path.join(srcDir, f)).sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
const oldDir = path.resolve('out', 'old');
const olds = fs.existsSync(oldDir) ? fs.readdirSync(oldDir).filter((f) => /\.mp4$/i.test(f)).map((f) => path.join(oldDir, f)).sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs) : [];
const pick = process.argv[2] ? [path.resolve(process.argv[2])] : [];
const versions = [...new Set([...pick, ...exp, ...olds])].map((p) => ({ label: path.basename(p, '.mp4').replace(name + ' - ', ''), src: rel(p) }));
const sfx = fs.existsSync('sfx-clean.json') ? JSON.parse(fs.readFileSync('sfx-clean.json', 'utf8')) : fs.existsSync('sfx-events.json') ? JSON.parse(fs.readFileSync('sfx-events.json', 'utf8')) : [];
const segs = Object.fromEntries(tl.segments.map((s) => [s.id, s]));
const cardText = (c) => c.neon ? [c.lead, c.main, c.sub].filter(Boolean).join(' / ') : (c.rows || []).map((r) => r[1]).filter(Boolean).join(' / ').replace(/\*/g, '');
const data = {
  name, duration: tl.output.duration, fps: tl.output.fps, versions,
  segments: tl.segments,
  cards: tl.cards.filter((c) => !c.hide && segs[c.seg]).map((c) => ({ start: segs[c.seg].start, end: segs[c.seg].end, label: c.neon || 'A1', text: cardText(c), zoom: c.zoom || null, seg: c.seg })),
  broll: tl.broll.map((b) => ({ id: b.id, start: b.start, end: b.end, label: `${b.id} · ${b.scene}${b.p?.bg ? ' ' + b.p.bg : ''}`, tin: b.tin || 'cut', tout: b.tout || 'cut', purpose: b.purpose || '' })),
  popups: (tl.popups || []).map((q) => ({ id: q.id, start: q.start, end: q.end, label: q.kind === 'icon' ? path.basename(q.src || '', '.png') : (q.title || 'pills'), purpose: q.purpose || '' })),
  zooms: tl.cards.filter((c) => c.zoom && !c.hide && segs[c.seg]).map((c) => ({ start: segs[c.seg].start, end: segs[c.seg].end + 0.1, label: '×' + c.zoom })),
  sfx: sfx.map((e) => ({ t: e.t, type: e.type })),
  endcard: tl.endcard ? tl.endcard.start : null,
};

const html = `<!doctype html><html lang="ms"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${name} · Review</title>
<style>
:root{--bg:#0e0f12;--panel:#16181d;--line:#262a31;--ink:#e8e9ec;--mut:#8b9099;--acc:#ff9a3c;--cap:#3cc6ff;--brl:#e3171e;--pop:#b07cff;--zm:#38d39f;--sfx:#f5c542}
*{box-sizing:border-box}html,body{margin:0;background:var(--bg);color:var(--ink);font:14px/1.4 system-ui,Segoe UI,Roboto,sans-serif}
header{display:flex;flex-wrap:wrap;gap:10px;align-items:center;padding:10px 16px;border-bottom:1px solid var(--line)}
header h1{font-size:15px;margin:0 12px 0 0;font-weight:600}
select,button{background:var(--panel);color:var(--ink);border:1px solid var(--line);border-radius:6px;padding:5px 9px;font:inherit;cursor:pointer}
button.on{border-color:var(--acc);color:var(--acc)}
.tc{font-variant-numeric:tabular-nums;color:var(--mut)}
main{display:grid;grid-template-columns:minmax(260px,auto) 1fr;gap:14px;padding:14px 16px}
.vid{background:#000;border-radius:10px;overflow:hidden;height:min(64vh,760px);aspect-ratio:9/16}
video{width:100%;height:100%;display:block;background:#000}
aside{display:flex;flex-direction:column;gap:12px;min-width:0}
.box{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:10px 12px}
.box h2{font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--mut);margin:0 0 6px}
#detail{min-height:64px;white-space:pre-wrap}
#tx{overflow:auto;max-height:calc(min(64vh,760px) - 150px)}
#tx div{padding:4px 6px;border-radius:6px;cursor:pointer;display:flex;gap:10px}
#tx div:hover{background:#1e2128}#tx div.cur{background:#2a2016;color:#ffd7ad}
#tx span{flex:none;width:52px}
.tlwrap{margin:0 16px 18px;background:var(--panel);border:1px solid var(--line);border-radius:10px;overflow-x:auto;position:relative}
.tl{position:relative;min-width:100%}
.ruler{height:24px;position:relative;border-bottom:1px solid var(--line);cursor:pointer}
.ruler i{position:absolute;top:0;height:100%;border-left:1px solid var(--line);font-style:normal;font-size:11px;color:var(--mut);padding-left:3px}
.trk{height:34px;position:relative;border-bottom:1px solid var(--line);cursor:pointer}
.trk .nm{position:sticky;left:0;z-index:3;display:inline-block;height:100%;line-height:34px;padding:0 8px;background:var(--panel);color:var(--mut);font-size:11px;width:82px;border-right:1px solid var(--line)}
.it{position:absolute;top:5px;height:24px;border-radius:5px;padding:0 6px;font-size:11px;line-height:24px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#fff;cursor:pointer;border:1px solid rgba(255,255,255,.18)}
.it:hover{filter:brightness(1.25)}.it.sel{outline:2px solid #fff}
.cap{background:#123a52}.brl{background:#5a1416}.pop{background:#3b2763}.zm{background:#114a3a}.seg{background:#2a2d34;color:#cfd2d8}
.tag{display:inline-block;font-size:10px;padding:0 4px;border-radius:3px;background:rgba(0,0,0,.35);margin-right:4px}
.sfx{position:absolute;top:7px;width:3px;height:20px;border-radius:2px;background:var(--sfx);cursor:pointer}
.sfx:hover::after{content:attr(data-n);position:absolute;top:-18px;left:4px;font-size:10px;color:var(--sfx);white-space:nowrap}
.end{position:absolute;top:24px;bottom:0;background:repeating-linear-gradient(45deg,rgba(255,255,255,.04) 0 6px,transparent 6px 12px);pointer-events:none}
#ph{position:absolute;top:0;bottom:0;width:2px;background:var(--acc);pointer-events:none;z-index:5;box-shadow:0 0 8px var(--acc)}
.keys{color:var(--mut);font-size:12px}
@media (max-width:820px){main{grid-template-columns:1fr}.vid{height:auto;width:100%;max-width:420px;margin:auto}#tx{max-height:240px}}
</style></head><body>
<header><h1>${name} · Review</h1>
<select id="ver"></select>
<button id="play">▶ Play</button><span class="tc" id="tc">0:00.00 / 0:00.00</span>
<span>Speed</span><button data-r="0.25">¼</button><button data-r="0.5">½</button><button data-r="1" class="on">1×</button>
<span>Zoom</span><input id="zoom" type="range" min="12" max="160" value="40">
<span class="keys">Space play · ←/→ 1 frame · Shift 1 s · [ ] previous/next cut</span></header>
<main><div class="vid"><video id="v" preload="auto" playsinline></video></div>
<aside><div class="box"><h2>Selected</h2><div id="detail">Click anything on the timeline.</div></div>
<div class="box"><h2>Transcript</h2><div id="tx"></div></div></aside></main>
<div class="tlwrap" id="wrap"><div class="tl" id="tl"><div id="ph"></div></div></div>
<script>
const D=${JSON.stringify(data)};
const $=(s)=>document.querySelector(s),v=$('#v'),tl=$('#tl');let pps=40;
const fmt=(t)=>{t=Math.max(0,t);const m=Math.floor(t/60),s=(t%60).toFixed(2).padStart(5,'0');return m+':'+s;};
D.versions.forEach((x,i)=>{const o=document.createElement('option');o.value=x.src;o.textContent=x.label;$('#ver').appendChild(o);});
const load=(src)=>{const t=v.currentTime||0;v.src=src;v.addEventListener('loadedmetadata',()=>{v.currentTime=Math.min(t,v.duration-0.05);},{once:true});};
if(D.versions[0])load(D.versions[0].src);$('#ver').onchange=(e)=>load(e.target.value);
const seek=(t)=>{v.currentTime=Math.max(0,Math.min(t,D.duration-1/D.fps));};
function show(o){$('#detail').textContent=o;}
function build(){
  tl.innerHTML='<div id="ph"></div>';const W=D.duration*pps+90;tl.style.width=W+'px';
  const ruler=document.createElement('div');ruler.className='ruler';tl.appendChild(ruler);
  const step=pps>=80?0.5:pps>=30?1:2;for(let s=0;s<=D.duration;s+=step){const i=document.createElement('i');i.style.left=(90+s*pps)+'px';i.textContent=Number.isInteger(s)?s+'s':'';ruler.appendChild(i);}
  ruler.onclick=(e)=>seek((e.offsetX+(e.target===ruler?0:e.target.offsetLeft)-90)/pps);
  const track=(nm,items,cls,info)=>{const r=document.createElement('div');r.className='trk';r.innerHTML='<span class="nm">'+nm+'</span>';tl.appendChild(r);
    r.onclick=(e)=>{if(e.target===r)seek((e.offsetX-90)/pps);};
    items.forEach((x)=>{const d=document.createElement('div');d.className='it '+cls;d.style.left=(90+x.start*pps)+'px';d.style.width=Math.max(4,(x.end-x.start)*pps)+'px';d.innerHTML=x.html||x.label;d.title=x.label;
      d.onclick=(e)=>{e.stopPropagation();document.querySelectorAll('.it.sel').forEach(n=>n.classList.remove('sel'));d.classList.add('sel');seek(x.start+1.5/D.fps);show(info(x));};r.appendChild(d);});return r;};
  track('Speech',D.segments.map(s=>({...s,label:s.text})),'seg',s=>s.id+'  '+fmt(s.start)+' → '+fmt(s.end)+'\\n'+s.text);
  track('Captions',D.cards.map(c=>({...c,html:'<span class="tag">'+c.label+'</span>'+c.text})),'cap',c=>'Caption ('+c.label+')  '+c.seg+'  '+fmt(c.start)+'\\n'+c.text+(c.zoom?'\\nPunch-in ×'+c.zoom:''));
  track('B-roll',D.broll.map(b=>({...b,html:'<span class="tag">'+b.tin+'</span>'+b.label+'<span class="tag" style="float:right">'+b.tout+'</span>'})),'brl',b=>b.label+'  '+fmt(b.start)+' → '+fmt(b.end)+'\\nIn: '+b.tin+' · Out: '+b.tout+'\\n'+b.purpose);
  track('Popups',D.popups,'pop',p=>p.id+' · '+p.label+'  '+fmt(p.start)+'\\n'+p.purpose);
  track('Zoom',D.zooms,'zm',z=>'Punch-in '+z.label+'  '+fmt(z.start));
  const sr=track('SFX',[], '',()=>'');D.sfx.forEach(e=>{const d=document.createElement('div');d.className='sfx';d.style.left=(90+e.t*pps)+'px';d.dataset.n=e.type;d.title=e.type+' @ '+fmt(e.t);
    d.onclick=(ev)=>{ev.stopPropagation();seek(Math.max(0,e.t-0.6));show('SFX: '+e.type+' @ '+fmt(e.t)+'\\n(playhead set 0.6 s before so you hear it land)');};sr.appendChild(d);});
  if(D.endcard!=null){const e=document.createElement('div');e.className='end';e.style.left=(90+D.endcard*pps)+'px';e.style.width=((D.duration-D.endcard)*pps)+'px';tl.appendChild(e);}
  tick();
}
const tx=$('#tx');D.segments.forEach(s=>{const d=document.createElement('div');d.innerHTML='<span class="tc">'+fmt(s.start)+'</span>'+s.text;d.onclick=()=>seek(s.start);s.el=d;tx.appendChild(d);});
let lastCur=null;
function tick(){const t=v.currentTime||0;$('#ph').style.left=(90+t*pps)+'px';$('#tc').textContent=fmt(t)+' / '+fmt(D.duration);
  const cur=D.segments.find(s=>t>=s.start&&t<s.end+0.25);if(cur!==lastCur){if(lastCur)lastCur.el.classList.remove('cur');if(cur){cur.el.classList.add('cur');cur.el.scrollIntoView({block:'nearest'});}lastCur=cur;}
  const w=$('#wrap'),x=90+t*pps;if(!v.paused&&(x<w.scrollLeft+90||x>w.scrollLeft+w.clientWidth-40))w.scrollLeft=x-160;}
v.addEventListener('timeupdate',tick);(function raf(){if(!v.paused)tick();requestAnimationFrame(raf);})();
v.onplay=()=>$('#play').textContent='❚❚ Pause';v.onpause=()=>$('#play').textContent='▶ Play';
$('#play').onclick=()=>v.paused?v.play():v.pause();
document.querySelectorAll('[data-r]').forEach(b=>b.onclick=()=>{v.playbackRate=+b.dataset.r;document.querySelectorAll('[data-r]').forEach(n=>n.classList.toggle('on',n===b));});
$('#zoom').oninput=(e)=>{pps=+e.target.value;build();};
const cuts=[...new Set([0,...D.broll.flatMap(b=>[b.start,b.end]),...D.popups.map(p=>p.start),...(D.endcard!=null?[D.endcard]:[])])].sort((a,b)=>a-b);
document.addEventListener('keydown',(e)=>{if(e.target.tagName==='SELECT'||e.target.tagName==='INPUT')return;const f=1/D.fps,t=v.currentTime;
  if(e.code==='Space'){e.preventDefault();v.paused?v.play():v.pause();}
  else if(e.key==='ArrowRight'){e.preventDefault();v.pause();seek(t+(e.shiftKey?1:f));}
  else if(e.key==='ArrowLeft'){e.preventDefault();v.pause();seek(t-(e.shiftKey?1:f));}
  else if(e.key===']'){const n=cuts.find(c=>c>t+0.02);if(n!=null)seek(n);}
  else if(e.key==='['){const p=[...cuts].reverse().find(c=>c<t-0.02);if(p!=null)seek(p);}});
build();
</script></body></html>`;
const out = path.join(srcDir, `${name} - REVIEW.html`);
fs.writeFileSync(out, html);
console.log('review ->', out, `(${versions.length} versions)`);

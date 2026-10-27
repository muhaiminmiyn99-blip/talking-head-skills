// Renders the caption layer to transparent PNG frames: node render-captions.js [startSec] [endSec]
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const tl = JSON.parse(fs.readFileSync('timeline.json', 'utf8'));
const fps = tl.output.fps;
const t0 = parseFloat(process.argv[2] ?? 0);
const t1 = parseFloat(process.argv[3] ?? tl.output.duration);
const outDir = process.argv[4] ?? 'frames';
const layer = process.argv[5] ?? 'front'; // front: captions + B-roll + front popups; behind: popups that sit behind the person

(async () => {
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
    args: ['--allow-file-access-from-files'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: tl.output.width, height: tl.output.height });
  await page.goto('file:///' + path.resolve('captions.html').split(path.sep).join('/'));
  // B-roll look is pluggable: broll-iman.js (Iman Dark Luxury UI) or broll-layer.js (B1).
  await page.addScriptTag({ path: tl.broll_layer || 'broll-layer.js' });
  await page.evaluate((t) => window.setup(t), tl);
  await page.evaluate((l) => { window.LAYER = l; if (l === 'behind') ['stage', 'flash', 'dip', 'broll'].forEach((id) => { const e = document.getElementById(id); if (e) e.style.display = 'none'; }); }, layer);
  if (layer === 'front') fs.writeFileSync('sfx-events.json', JSON.stringify(await page.evaluate(() => window.SFX || []), null, 1));
  await page.evaluate(() => Promise.allSettled([...document.fonts].map((f) => f.load())));
  await page.evaluate(() => window.fitRows && window.fitRows());
  const failed = await page.evaluate(() => [...document.fonts].filter((f) => f.status !== 'loaded').map((f) => f.family));
  if (failed.length) throw new Error('Fonts not loaded: ' + failed.join(', '));

  const n0 = Math.round(t0 * fps), n1 = Math.round(t1 * fps);
  for (let n = n0; n < n1; n++) {
    await page.evaluate((t) => window.renderAt(t), n / fps);
    await page.screenshot({ path: path.join(outDir, String(n - n0).padStart(5, '0') + '.png'), omitBackground: true });
    if (n % 60 === 0) process.stdout.write(`${(n / fps).toFixed(1)}s `);
  }
  await browser.close();
  console.log('\ndone', n1 - n0, 'frames');
})();

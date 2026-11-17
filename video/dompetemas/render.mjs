// node render.mjs preview  -> lembar contoh adegan
// node render.mjs full     -> semua frame (30 fps) ke frames/
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const { chromium } = createRequire('/home/user/bbgoldpwa/')('playwright');
const mode = process.argv[2] || 'preview';
const FPS = 30, DUR = 46.93;
const html = readFileSync('stage.html', 'utf8').replace('__FOKUS__', readFileSync('cap/fokus.json', 'utf8'));
writeFileSync('_stage.html', html);
const b = await chromium.launch();
async function halaman() {
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.goto('file://' + process.cwd() + '/_stage.html');
  await p.evaluate(() => window.siap);
  await p.evaluate(() => Promise.all([...document.images].map((i) => i.decode().catch(() => {}))));
  return p;
}
if (mode === 'preview') {
  const T = [1.0, 3.2, 4.8, 6.6, 8.2, 9.8, 10.8, 12.0, 13.9, 16.0, 18.4, 21.0, 24.4, 28.0, 31.0, 36.5, 39.8, 43.5, 46.5];
  const p = await halaman();
  mkdirSync('preview', { recursive: true });
  for (const t of T) {
    await p.evaluate((t) => { window.render(t); }, t);
    await p.evaluate(() => Promise.all([...document.images].map((i) => i.decode().catch(() => {}))));
    await p.screenshot({ path: `preview/t${String(t).padStart(5, '0')}.png` });
  }
} else {
  mkdirSync('frames', { recursive: true });
  const N = Math.round(DUR * FPS), PAR = 4;
  await Promise.all(Array.from({ length: PAR }, async (_, w) => {
    const p = await halaman();
    for (let i = w; i < N; i += PAR) {
      await p.evaluate((t) => window.render(t), i / FPS);
      await p.evaluate(() => Promise.all([...document.images].map((im) => im.decode().catch(() => {}))));
      await p.screenshot({ path: `frames/f${String(i).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 92 });
    }
  }));
}
await b.close();

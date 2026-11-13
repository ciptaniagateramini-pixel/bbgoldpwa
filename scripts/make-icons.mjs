// Membuat ikon PNG dari web/public/icons/icon.svg (sekali jalan, hasil disimpan di repositori).
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import { readFileSync } from 'node:fs';
const svg = readFileSync(new URL('../web/public/icons/icon.svg', import.meta.url), 'utf8');
const out = new URL('../web/public/icons/', import.meta.url).pathname;
const b = await chromium.launch();
const p = await b.newPage();
for (const [name, size, pad] of [['icon-192.png', 192, 0], ['icon-512.png', 512, 0], ['icon-maskable-512.png', 512, 0.12]]) {
  await p.setViewportSize({ width: size, height: size });
  const inner = Math.round(size * (1 - pad * 2));
  await p.setContent(`<html><body style="margin:0;background:#082A59;display:flex;align-items:center;justify-content:center;width:${size}px;height:${size}px">${svg.replace('<svg ', `<svg width="${inner}" height="${inner}" `).replace(pad ? 'rx="22"' : '@@', 'rx="0"')}</body></html>`);
  await p.screenshot({ path: out + name, omitBackground: false });
}
await b.close();
console.log('ikon dibuat');

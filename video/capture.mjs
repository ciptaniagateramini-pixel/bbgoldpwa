// Ambil tangkapan layar situs asli untuk video. /api/lead.php dicegat (tidak ada lead masuk ke Sheet).
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
const { chromium } = createRequire(import.meta.url)('playwright');
const B = 'https://tokobbgold.dwabussines.com';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
await ctx.route('**/api/lead.php', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }));
const p = await ctx.newPage();
const fokus = {};
async function kotak(nama, sel) { const bb = await p.locator(sel).first().boundingBox(); fokus[nama] = bb; }
async function shot(nama) { await p.waitForTimeout(400); await p.screenshot({ path: `cap/${nama}.png` }); }
async function sembunyiWa() { await p.addStyleTag({ content: 'a[aria-label="Chat WhatsApp toko"]{display:none!important}' }); }

await p.goto(B + '/'); await p.waitForSelector('.kartu-emas'); await sembunyiWa(); await p.waitForTimeout(1200);
await kotak('beranda_kartu', '.geser'); await kotak('beranda_bibi', '.gelembung'); await kotak('beranda_catatan', '[role=note]');
await shot('beranda');
await p.evaluate(() => window.scrollTo(0, document.querySelector('a[href="/kalkulator"].tombol-biru').getBoundingClientRect().top + window.scrollY - 560));
await kotak('cta_tombol', 'a[href="/kalkulator"].tombol-biru'); await kotak('cta_kartu', 'section.relative.grid');
await shot('beranda_cta');

await p.goto(B + '/kalkulator'); await p.waitForSelector('.chip-kuis'); await sembunyiWa();
await p.getByRole('button', { name: 'KODE 700' }).hover();
await p.evaluate(() => [...document.querySelectorAll('.chip-kuis')].find((b) => b.textContent === 'KODE 700').setAttribute('aria-pressed', 'true'));
await kotak('kode_chip', '.chip-kuis >> text=KODE 700'); await kotak('kode_grid', '[role=group]'); await kotak('kode_bibi', '.gelembung');
await shot('kode');
await p.getByRole('button', { name: 'KODE 700' }).click(); await p.waitForSelector('text=Ada cap pabrik?');
await p.evaluate(() => [...document.querySelectorAll('.chip-kuis')].find((b) => b.textContent === 'Tidak ada cap').setAttribute('aria-pressed', 'true'));
await kotak('cap_pilihan', '.chip-kuis >> text=Tidak ada cap'); await kotak('cap_bibi', '.gelembung');
await shot('cap');
await p.getByRole('button', { name: 'Tidak ada cap' }).click(); await p.waitForSelector('#berat');
await p.fill('#berat', '2,5'); await p.check('text=Perhiasan ini ada permata/batu/aksesoris'); await p.locator('#berat').blur();
await kotak('berat_isian', '#berat'); await kotak('berat_ket', '[data-testid=ket-berat]'); await kotak('berat_centang', 'text=Perhiasan ini ada permata/batu/aksesoris');
await shot('berat');
await p.getByRole('button', { name: 'Lihat estimasi' }).click(); await p.waitForSelector('[data-testid=form-kontak]');
await p.fill('#nama', 'Contoh Pembeli'); await p.fill('#wa', '0812-0000-1234'); await p.check('text=Saya setuju');
await kotak('kontak_form', '[data-testid=form-kontak]'); await kotak('kontak_tombol', 'button[type=submit]');
await shot('kontak');
await p.getByRole('button', { name: /Kirim dan lihat estimasi/ }).click(); await p.waitForSelector('[data-testid=hasil]'); await p.waitForTimeout(800);
await kotak('hasil_kartu', '[data-testid=kartu-hasil]'); await kotak('hasil_angka', '[data-testid=angka-estimasi]');
await shot('hasil');
await p.evaluate(() => window.scrollTo(0, document.querySelector('[data-testid=keterangan-estimasi]').getBoundingClientRect().top + window.scrollY - 380));
await kotak('hasil_catatan', '[data-testid=hasil] [role=note]'); await kotak('hasil_ket', '[data-testid=keterangan-estimasi]');
await shot('hasil2');
console.log(await p.innerText('[data-testid=angka-estimasi]'));
writeFileSync('cap/fokus.json', JSON.stringify(fokus, null, 1));
await b.close();

// Rekam layar situs Dompet Emas (salinan lokal, akun contoh) untuk video iklan.
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const { chromium } = createRequire('/home/user/bbgoldpwa/')('playwright');
const BASE = 'http://127.0.0.1:8484';
const LOG = '/home/user/bbgoldpwa/dompetemas/.local/private/cache/surel.log';
mkdirSync('cap', { recursive: true });
const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
const p = await ctx.newPage();
const fokus = {};
const kotak = async (n, sel) => { fokus[n] = await p.locator(sel).first().boundingBox(); };
const shot = async (n) => { await p.waitForTimeout(500); await p.screenshot({ path: `cap/${n}.png` }); };

await p.goto(BASE + '/');
await p.fill('#email', 'contoh@email.com');
await kotak('login_email', '#email'); await kotak('login_tombol', 'button:has-text("Kirim kode masuk")');
await shot('login');
await p.click('text=Kirim kode masuk'); await p.waitForSelector('#kode');
const kode = JSON.parse(readFileSync(LOG, 'utf8').trim().split('\n').pop()).teks.match(/(\d{6})/)[1];
await p.fill('#kode', kode);
await kotak('kode_isian', '#kode');
await shot('kode');
await p.click('button:has-text("Masuk")'); await p.waitForSelector('text=Dompetmu masih kosong');
await kotak('kosong_tambah', '.tab .plus');
await shot('kosong');

await p.evaluate(async () => {
  const kirim = (a) => fetch('/api/aset.php', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-DE': '1' }, body: JSON.stringify({ aksi: 'tambah', ...a }) });
  await kirim({ jenis: 'perhiasan', nama: 'Kalung', bentuk: 'Kalung', kadar: '750', sub: 'Kuning', berat: 5, tahun: 2025, harga_beli: 9500000 });
  await kirim({ jenis: 'perhiasan', nama: 'Cincin nikah', bentuk: 'Cincin', kadar: '700', sub: 'Lokal', berat: 3.2, tahun: 2021, harga_beli: 2400000 });
  await kirim({ jenis: 'batangan', nama: 'Tabungan Antam', merek: 'Antam', pecahan: '5 g', keping: 1, tahun: 2022, harga_beli: 4700000 });
});

// form logam mulia -> untung
await p.click('.tab .plus'); await p.waitForSelector('.lembar'); await p.waitForTimeout(1500);
await kotak('form_seg', '.lembar .seg'); await kotak('form_pratinjau', '.lembar .pratinjau');
await shot('tambah');
await p.locator('.lembar').getByRole('button', { name: '5 g', exact: true }).click();
await p.selectOption('#iTahun', '2022'); await p.fill('#iBeli', '4.700.000');
await p.locator('#iBeli').evaluate((e) => e.scrollIntoView({ block: 'center' })); await p.waitForTimeout(1200);
await kotak('form_isian', '.lembar .grid2');
await shot('form_isi');
await p.click('text=Hitung untung/rugi'); await p.waitForSelector('[data-testid=hasil]');
await p.locator('[data-testid=hasil]').evaluate((e) => e.scrollIntoView({ block: 'start' })); await p.waitForTimeout(600);
await kotak('untung_angka', '[data-testid=hasil-selisih]'); await kotak('untung_persen', '[data-testid=hasil-persen]'); await kotak('untung_rinci', 'dl.rinci');
await shot('hasil_untung');
await p.click('.lembar button:has-text("Batal")'); await p.waitForTimeout(400);

// form perhiasan -> rugi
await p.click('.tab .plus'); await p.waitForSelector('.lembar');
await p.click('.lembar button:has-text("Perhiasan")');
await p.click('.lembar button:has-text("Kalung")');
await p.click('.lembar button:has-text("KODE 750")');
await p.click('.lembar button:has-text("Kuning")');
await p.fill('#iBerat', '5'); await p.selectOption('#iTahun', '2025'); await p.fill('#iBeli', '9.500.000');
await p.click('text=Hitung untung/rugi'); await p.waitForSelector('[data-testid=hasil]');
await p.locator('[data-testid=hasil]').evaluate((e) => e.scrollIntoView({ block: 'start' })); await p.waitForTimeout(600);
await kotak('rugi_angka', '[data-testid=hasil-selisih]'); await kotak('rugi_info', '.lembar .info');
await shot('hasil_rugi');
await p.click('.lembar button:has-text("Batal")'); await p.waitForTimeout(400);

// dompet berisi
await p.reload(); await p.waitForSelector('[data-testid=kartu-aset]'); await p.waitForTimeout(3500);
await kotak('dompet_total', '.total'); await kotak('dompet_sumber', '.sumber');
await shot('dompet');
await p.evaluate(() => window.scrollTo(0, document.querySelector('[data-testid=daftar]').getBoundingClientRect().top + scrollY - 90)); await p.waitForTimeout(2500);
await kotak('kartu1', '[data-testid=kartu-aset] >> nth=0'); await kotak('kartu2', '[data-testid=kartu-aset] >> nth=1');
await shot('dompet_kartu');

// model 3D besar (latar transparan)
async function model3d(nth, nama) {
  await p.click(`[data-testid=kartu-aset] >> nth=${nth}`); await p.waitForSelector('canvas.besar'); await p.waitForTimeout(2600);
  await p.addStyleTag({ content: 'html,body{background:transparent!important} body *{visibility:hidden!important} canvas.besar{visibility:visible!important}' });
  await p.locator('canvas.besar').screenshot({ path: `cap/${nama}.png`, omitBackground: true });
  await p.reload(); await p.waitForSelector('[data-testid=kartu-aset]'); await p.waitForTimeout(1500);
}
await model3d(0, 'bar3d');
await model3d(1, 'ring3d');
await model3d(2, 'kalung3d');
writeFileSync('cap/fokus.json', JSON.stringify(fokus, null, 1));
await b.close();
console.log('selesai', Object.keys(fokus).length, 'fokus');

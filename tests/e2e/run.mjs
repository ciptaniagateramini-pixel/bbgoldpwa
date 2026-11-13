// Uji end-to-end lokal: node tests/e2e/run.mjs  (perlu `npm run build` dulu)
// Menjalankan situs lokal (dist + api PHP + tiruan Apps Script), lalu menguji di Chromium.
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { writeFileSync, readFileSync, rmSync, existsSync, readdirSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const { chromium, devices } = createRequire(import.meta.url)('playwright');
const ROOT = new URL('../../', import.meta.url).pathname;
const LOCAL = join(ROOT, '.local');
const PORT = 8181;
const BASE = `http://127.0.0.1:${PORT}`;
const SHOT = process.env.SHOT_DIR;

let lulus = 0, gagal = 0;
function cek(nama, ok, info = '') {
  if (ok) lulus++; else { gagal++; console.log(`GAGAL: ${nama} ${info}`); }
}
function mode(m) {
  mkdirSync(LOCAL, { recursive: true });
  writeFileSync(join(LOCAL, 'mock-mode'), m);
  const c = join(LOCAL, 'private/cache');
  if (existsSync(c)) for (const f of readdirSync(c)) if (f.startsWith('harga') || f.startsWith('referensi')) rmSync(join(c, f));
}
const leads = () => (existsSync(join(LOCAL, 'leads.jsonl')) ? readFileSync(join(LOCAL, 'leads.jsonl'), 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse) : []);

// Nilai rahasia dari tiruan: Harga Hitung (D), % kadar (C), margin (F). Tidak boleh muncul di mana pun.
const persen = [0.27, 0.30, 0.36, 0.41, 0.56, 0.69, 0.66, 0.73, 0.71, 0.80, 0.79, 0.85, 0.89, 0.905, 0.94, 0.98];
const hargaHitung = persen.map((p) => Math.round(2250000 * p));
const fmt = (n) => n.toLocaleString('id-ID').replace(/,/g, '.');
const RAHASIA_JSON = ['hargaHitung', 'margin', 'persenKadar', 'cukim', 'potongan', '"15000"', ':15000', '2250000', ...hargaHitung.map(String), ...persen.map((p) => `:${p}`)];
const RAHASIA_TEKS = [/harga hitung/i, /\bmargin\b/i, /% kadar/i, /potongan toko/i, /keuntungan toko/i, ...hargaHitung.map((n) => new RegExp('(?<![\\d.])' + fmt(n).replace(/\./g, '\\.') + '(?![\\d.])')), /(?<![\d.])2\.250\.000/, /(?<![\d.])15\.000(?![\d.])/];

rmSync(join(LOCAL, 'leads.jsonl'), { force: true });
rmSync(join(LOCAL, 'private/cache'), { recursive: true, force: true });
mode('fresh');
const srv = spawn('bash', ['scripts/serve-local.sh'], { cwd: ROOT, env: { ...process.env, PORT: String(PORT), MOCK_PORT: '8191', CACHE_TTL: '0' }, stdio: 'ignore', detached: true });
const stop = () => { try { process.kill(-srv.pid); } catch {} };
process.on('exit', stop);
for (let i = 0; i < 50; i++) { try { await fetch(BASE + '/'); break; } catch { await new Promise((r) => setTimeout(r, 200)); } }

const browser = await chromium.launch();
try {
  // ---------- 1. Kebocoran: API ----------
  const hj = await (await fetch(BASE + '/api/harga.php')).text();
  for (const x of RAHASIA_JSON) cek(`API harga tidak memuat ${x}`, !hj.includes(x));
  const hd = JSON.parse(hj);
  cek('API harga hanya 16 baris valid', hd.items.length === 16, hd.items.length);
  cek('API harga kunci baris allowlist', hd.items.every((i) => Object.keys(i).join() === 'kadar,jenis,hargaPerGram'));
  const rj = await (await fetch(BASE + '/api/harga.php?data=referensi')).text();
  for (const x of ['potongan', '7777', '2400000', 'buybackBBGold', '2420000']) cek(`API referensi tidak memuat ${x}`, !rj.includes(x));
  cek('Redmark basi', JSON.parse(rj).redmark.basi === true);
  cek('api/lib ditolak', (await fetch(BASE + '/api/lib/dto.php')).status === 403);

  // ---------- 2. Kebocoran: berkas statis hasil build ----------
  const statis = [];
  (function walk(d) { for (const f of readdirSync(d, { withFileTypes: true })) f.isDirectory() ? walk(join(d, f.name)) : /\.(html|js|json|webmanifest)$/.test(f.name) && statis.push(join(d, f.name)); })(join(ROOT, 'dist'));
  for (const f of statis) {
    const t = readFileSync(f, 'utf8');
    cek(`statis ${f.split('/dist/')[1]} tanpa Harga Hitung/margin toko`, !/harga ?hitung|hargaHitung|margin toko|persenKadar/i.test(t));
  }

  // ---------- 3. Beranda segar ----------
  const ctx = await browser.newContext({ ...devices['Pixel 7'] });
  const page = await ctx.newPage();
  await page.goto(BASE + '/?s=instagram');
  await page.waitForSelector('[data-testid=tabel-harga]', { state: 'attached' });
  cek('tabel berlaku', (await page.getAttribute('[data-testid=tabel-harga]', 'data-berlaku')) === 'ya');
  cek('tanpa banner basi', (await page.locator('[data-testid=banner-basi]').count()) === 0);
  cek('catatan wajib di beranda', (await page.locator('[data-testid=catatan-wajib]').first().innerText()).trim() === 'PERHIASAN RUSAK, PATAH, SURAT HILANG TIDAK ADA POTONGAN.');
  cek('judul grafik', await page.getByText('Harga emas dunia (XAU/USD, dolar per troy ounce)').isVisible());
  cek('keterangan grafik', await page.getByText('Informasi pasar dunia. Bukan harga BB GOLD. Harga buyback BB GOLD ditetapkan setiap hari di toko.').isVisible());
  cek('tidak menyebut real time', !/real ?time/i.test(await page.innerText('body')));
  await page.waitForSelector('[data-testid=ref-antam]');
  cek('urutan: harga < grafik < referensi', await page.evaluate(() => {
    const y = (s) => document.querySelector(s).getBoundingClientRect().top;
    return y('#judul-harga') < y('#judul-grafik') && y('#judul-grafik') < y('#judul-ref');
  }));
  cek('redmark disembunyikan angkanya', (await page.locator('[data-testid=ref-redmark] li').count()) === 0);
  cek('redmark ditandai', (await page.locator('[data-testid=ref-redmark]').innerText()).includes('belum diperbarui'));
  if (SHOT) await page.screenshot({ path: join(SHOT, 'beranda.png'), fullPage: true });
  const teksBeranda = await page.content();
  for (const r of RAHASIA_TEKS) cek(`HTML beranda tanpa ${r}`, !r.test(teksBeranda));

  // ---------- 4. Kalkulator: kode 700, tanpa cap ----------
  await page.goto(BASE + '/kalkulator');
  await page.getByRole('button', { name: 'KODE 700' }).click();
  cek('langkah cap muncul', await page.getByRole('heading', { name: 'Ada cap pabrik?' }).isVisible());
  cek('penjelasan cap', await page.getByText(/Cap pabrik adalah tanda merek pabrik yang tercetak di perhiasan, misalnya UBS, Diamond, Lotus, HTM, dan lainnya\./).isVisible());
  await page.getByRole('button', { name: 'Tidak ada cap' }).click();
  await page.fill('#berat', '2,37');
  await page.check('text=Perhiasan ini ada permata/batu/aksesoris');
  cek('keterangan berat tampil', (await page.innerText('[data-testid=ket-berat]')).startsWith('Berat permata dan aksesoris tidak masuk dalam berat timbangan emas.'));
  await page.getByRole('button', { name: 'Lihat estimasi' }).click();
  await page.waitForSelector('[data-testid=form-kontak]');
  cek('hasil BELUM tampil sebelum formulir', (await page.locator('[data-testid=hasil]').count()) === 0);
  cek('angka estimasi tidak ada di DOM sebelum formulir', !(await page.content()).includes('± Rp'));
  await page.fill('#nama', 'Siti Uji');
  await page.fill('#wa', '021-555');
  await page.getByRole('button', { name: /Kirim dan lihat estimasi/ }).click();
  cek('WA tidak valid ditolak', await page.getByText('Nomor WhatsApp tidak valid').first().isVisible());
  cek('persetujuan wajib', await page.getByText('Centang persetujuan untuk melanjutkan.').isVisible());
  cek('hasil tetap tersembunyi', (await page.locator('[data-testid=hasil]').count()) === 0);
  await page.fill('#wa', '0812-3456-7890');
  await page.check('text=Saya setuju');
  await page.getByRole('button', { name: /Kirim dan lihat estimasi/ }).click();
  await page.waitForSelector('[data-testid=hasil]');
  const h = await page.innerText('[data-testid=hasil]');
  const harga700L = Math.round(2250000 * 0.66) - 15000;
  const est = Math.floor((2.37 * harga700L) / 1000) * 1000;
  cek('judul hasil', h.includes('Estimasi nilai perhiasan kamu'));
  cek('angka ± dibulatkan ke bawah', (await page.innerText('[data-testid=angka-estimasi]')).trim() === `± Rp ${fmt(est)}`, await page.innerText('[data-testid=angka-estimasi]'));
  cek('catatan wajib di hasil', (await page.locator('[data-testid=hasil] [data-testid=catatan-wajib]').innerText()).trim() === 'PERHIASAN RUSAK, PATAH, SURAT HILANG TIDAK ADA POTONGAN.');
  cek('catatan wajib terlihat (tidak disembunyikan)', await page.locator('[data-testid=hasil] [data-testid=catatan-wajib]').isVisible());
  cek('keterangan estimasi persis', (await page.innerText('[data-testid=keterangan-estimasi]')).trim() === 'Ini hanya estimasi. Hasil sebenarnya bisa berbeda setelah perhiasan diverifikasi dan dicek langsung di toko. Yang bisa membuat hasil berbeda: (1) kesesuaian berat emas, (2) berat aksesoris dan permata, (3) kadar emas.');
  cek('tanpa kata terlarang', !/harga final|\btotal\b|\bpasti\b|kondisi|kerusakan/i.test(h));
  cek('watermark ESTIMASI', (await page.locator('[data-testid=kartu-hasil] .watermark').innerText()).includes('ESTIMASI'));
  cek('cap waktu harga', (await page.innerText('[data-testid=cap-waktu-hasil]')).startsWith('Berdasarkan harga yang ditetapkan'));
  cek('ajakan jam buka', h.includes('Bawa perhiasanmu ke toko untuk dicek langsung, buka setiap hari 09.00 - 17.00 WIB.'));
  const wa = decodeURIComponent((await page.getAttribute('[data-testid=tombol-wa-hasil]', 'href')).split('text=')[1]);
  cek('WA ke nomor toko', (await page.getAttribute('[data-testid=tombol-wa-hasil]', 'href')).startsWith('https://wa.me/62882000119208?text='));
  cek('pesan WA lengkap', ['KODE 700', 'Tidak ada cap (Lokal)', '2,37 gram', 'permata/aksesoris: Ya', `± Rp ${fmt(est)}`, 'PERHIASAN RUSAK, PATAH, SURAT HILANG TIDAK ADA POTONGAN.', 'estimasi dari kalkulator, mohon dicek'].every((x) => wa.includes(x)), wa);
  if (SHOT) await page.screenshot({ path: join(SHOT, 'hasil.png'), fullPage: true });
  for (const r of RAHASIA_TEKS) cek(`HTML hasil tanpa ${r}`, !r.test(await page.content()));

  let L = leads();
  cek('lead tersimpan 1', L.length === 1, L.length);
  const l = L[0] ?? {};
  cek('lead WA +62', l.wa === '+6281234567890');
  cek('lead sumber instagram', l.sumber === 'instagram');
  cek('lead estimasi dihitung server', l.estimasi === `± Rp ${fmt(est)}`, l.estimasi);
  cek('lead permata Ya, uji Tidak', l.permata === 'Ya' && l.perluUji === 'Tidak');
  cek('lead kode', l.kode === 'KODE 700' && l.jenis === 'Lokal');

  // ---------- 5. Hitung ulang dalam sesi: tanpa formulir ----------
  await page.getByRole('button', { name: 'Hitung perhiasan lain' }).click();
  await page.getByRole('button', { name: 'KODE 750' }).click();
  cek('750 tanya warna', await page.getByRole('heading', { name: 'Warna emasnya apa?' }).isVisible());
  await page.getByRole('button', { name: 'Emas putih' }).click();
  await page.fill('#berat', '1');
  await page.getByRole('button', { name: 'Lihat estimasi' }).click();
  await page.waitForSelector('[data-testid=hasil]');
  cek('sesi: formulir tidak diminta lagi', (await page.locator('[data-testid=form-kontak]').count()) === 0);

  // ---------- 6. Kadar satu jenis: langkah 2 dilewati ----------
  await page.getByRole('button', { name: 'Hitung perhiasan lain' }).click();
  cek('chip karat/persen apa adanya', await page.getByRole('button', { name: '14K', exact: true }).isVisible() && await page.getByRole('button', { name: '80%', exact: true }).isVisible());
  await page.getByRole('button', { name: 'KODE 375' }).click();
  cek('375 lewati langkah 2', (await page.getByRole('heading', { name: 'Ada cap pabrik?' }).count()) === 0 && await page.locator('#berat').isVisible());
  await ctx.close();

  // ---------- 7. Polos: rentang Lokal + perlu uji kadar ----------
  const ctx2 = await browser.newContext({ ...devices['iPhone 14'] });
  const p2 = await ctx2.newPage();
  await p2.goto(BASE + '/kalkulator');
  await p2.getByRole('button', { name: 'Tidak ada kode (polos)' }).click();
  await p2.fill('#berat', '2');
  await p2.getByRole('button', { name: 'Lihat estimasi' }).click();
  await p2.fill('#nama', 'Budi');
  await p2.fill('#wa', '+62 857 1111 2222');
  await p2.check('text=Saya setuju');
  await p2.getByRole('button', { name: /Kirim dan lihat estimasi/ }).click();
  await p2.waitForSelector('[data-testid=hasil]');
  const lok = [Math.round(2250000 * 0.27) - 15000, Math.round(2250000 * 0.66) - 15000];
  const rentang = `± Rp ${fmt(Math.floor(2 * lok[0] / 1000) * 1000)} sampai Rp ${fmt(Math.floor(2 * lok[1] / 1000) * 1000)}`;
  cek('polos rentang', (await p2.innerText('[data-testid=angka-estimasi]')).trim() === rentang, await p2.innerText('[data-testid=angka-estimasi]'));
  cek('polos keterangan uji kadar', await p2.getByText('Perhiasan polos perlu diuji kadarnya di toko. Ini hanya perkiraan golongan Lokal.').first().isVisible());
  L = leads();
  cek('lead polos perlu uji Ya', L.at(-1)?.perluUji === 'Ya' && L.at(-1)?.sumber === 'langsung', JSON.stringify(L.at(-1)));
  await ctx2.close();

  // ---------- 8. Kolom jebakan ----------
  const n0 = leads().length;
  const r = await fetch(BASE + '/api/lead.php', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: BASE }, body: JSON.stringify({ nama: 'Bot', wa: '081234567890', setuju: true, website: 'http://spam', kadar: '700', jenis: 'Lokal', berat: 1 }) });
  cek('jebakan dibalas ok', (await r.json()).ok === true);
  cek('jebakan tidak disimpan', leads().length === n0);
  const r2 = await fetch(BASE + '/api/lead.php', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://jahat.example' }, body: '{}' });
  cek('origin asing ditolak', r2.status === 403);

  // ---------- 9. Penyimpanan lead gagal: hasil tetap tampil ----------
  mode('leadfail');
  const ctx3 = await browser.newContext();
  const p3 = await ctx3.newPage();
  await p3.goto(BASE + '/kalkulator');
  await p3.getByRole('button', { name: 'KODE 420' }).click();
  await p3.fill('#berat', '1,5');
  await p3.getByRole('button', { name: 'Lihat estimasi' }).click();
  await p3.fill('#nama', 'Rina');
  await p3.fill('#wa', '081299998888');
  await p3.check('text=Saya setuju');
  await p3.getByRole('button', { name: /Kirim dan lihat estimasi/ }).click();
  await p3.waitForSelector('[data-testid=hasil]');
  cek('gagal simpan: hasil tetap tampil', true);
  cek('gagal simpan: masuk antrean', (await p3.evaluate(() => JSON.parse(localStorage.getItem('bb_antrean_lead') || '[]').length)) === 1);
  mode('fresh');
  await p3.evaluate(() => window.dispatchEvent(new Event('online')));
  await p3.waitForFunction(() => JSON.parse(localStorage.getItem('bb_antrean_lead') || '[]').length === 0, null, { timeout: 15000 }).catch(() => {});
  cek('antrean terkirim ulang', leads().some((x) => x.nama === 'Rina'));
  await ctx3.close();

  // ---------- 10. Harga basi ----------
  mode('stale');
  const ctx4 = await browser.newContext();
  const p4 = await ctx4.newPage();
  await p4.goto(BASE + '/');
  await p4.waitForSelector('[data-testid=banner-basi]');
  cek('basi: banner', (await p4.innerText('[data-testid=banner-basi]')).includes('Harga hari ini belum ditetapkan'));
  cek('basi: tabel redup', (await p4.getAttribute('[data-testid=tabel-harga]', 'data-berlaku')) === 'tidak');
  if (SHOT) await p4.screenshot({ path: join(SHOT, 'basi.png') });
  await p4.goto(BASE + '/kalkulator');
  await p4.waitForSelector('[data-testid=kalkulator-nonaktif]');
  cek('basi: kalkulator nonaktif', (await p4.getByRole('button', { name: 'Lihat estimasi' }).count()) === 0);
  mode('kosong');
  await p4.goto(BASE + '/');
  await p4.waitForSelector('[data-testid=banner-basi]');
  cek('B3 kosong: banner', true);
  await ctx4.close();

  // ---------- 11. Skrip gagal: cache lama dipakai ----------
  mode('fresh');
  await fetch(BASE + '/api/harga.php');
  writeFileSync(join(LOCAL, 'mock-mode'), 'fail');
  const fj = await (await fetch(BASE + '/api/harga.php')).json();
  cek('skrip gagal: cache lama dipakai', fj.ok === true && fj.dariCacheLama === true);
  mode('fresh');

  // ---------- 13. Halaman Toko ----------
  const ctx6 = await browser.newContext();
  const p6 = await ctx6.newPage();
  await p6.goto(BASE + '/toko');
  const t = await p6.innerText('main');
  cek('toko: jam', t.includes('Buka setiap hari, 09.00 - 17.00 WIB'));
  cek('footer PT', (await p6.innerText('[data-testid=footer-pt]')).includes('PT DRAJAT WIGUNA ADIDAYA'));
  cek('toko: catatan DWA', t.includes('profil Google Maps tercatat atas nama PT Drajat Wiguna Adidaya / DWA'));
  cek('toko: WA tampil', t.includes('0882-0001-19208'));
  cek('toko: email', t.includes('customerservice@dwabussines.com'));
  cek('toko: status', /Buka sekarang|Tutup sekarang|Tutup hari ini/.test(t));
  cek('toko: tombol rute', (await p6.getAttribute('a:has-text("Buka rute di Google Maps")', 'href')) === 'https://share.google/R8FAONEEQlCiFZA75' && (await p6.getAttribute('a:has-text("Buka rute di Google Maps")', 'rel')) === 'noopener');
  await p6.goto(BASE + '/edukasi/kode-dan-cap-pabrik');
  cek('edukasi kode & cap', await p6.getByRole('heading', { name: 'Apa itu kode dan cap pabrik?' }).isVisible());
  await p6.goto(BASE + '/privasi');
  cek('privasi', await p6.getByRole('heading', { name: 'Kebijakan privasi' }).isVisible());
  await ctx6.close();
  // ---------- 12. Offline (service worker) ----------
  const ctx5 = await browser.newContext({ ...devices['Pixel 7'] });
  const p5 = await ctx5.newPage();
  await p5.goto(BASE + '/');
  await p5.waitForSelector('[data-testid=tabel-harga]', { state: 'attached' });
  await p5.evaluate(() => navigator.serviceWorker.ready);
  await p5.reload();
  await p5.waitForSelector('[data-testid=tabel-harga]', { state: 'attached' });
  await ctx5.setOffline(true);
  stop(); // matikan server juga: setOffline tidak selalu berlaku untuk service worker
  await new Promise((r) => setTimeout(r, 500));
  await p5.reload();
  await p5.waitForSelector('[data-testid=tabel-harga]', { state: 'attached', timeout: 10000 });
  cek('offline: harga tersimpan tampil', (await p5.locator('[data-testid=tabel-harga] tbody tr').count()) === 16);
  const dbg = await p5.evaluate(async () => { try { const r = await fetch('/api/harga.php'); return r.status + ' ' + r.headers.get('X-BB-Offline'); } catch (e) { return 'err ' + e; } });
  cek('offline: banner mode offline', await p5.getByText('Mode offline').isVisible(), dbg);
  cek('offline: cap waktu tampil', await p5.locator('[data-testid=cap-waktu]').isVisible());
  await p5.locator('#judul-grafik').scrollIntoViewIfNeeded();
  await p5.waitForSelector('[data-testid=grafik-cadangan]', { timeout: 5000 }).catch(() => {});
  cek('offline: kartu grafik cadangan', await p5.getByText('Grafik tidak tersedia saat offline').isVisible());
  if (SHOT) await p5.screenshot({ path: join(SHOT, 'offline.png'), fullPage: true });
  await p5.goto(BASE + '/toko').catch(() => {});
  await p5.waitForSelector('[data-testid=status-toko]', { timeout: 10000 }).catch(() => {});
  cek('offline: halaman toko tetap terbuka', await p5.getByText('Jl. Raya Sukatani').first().isVisible());
  await ctx5.close();

} finally {
  await browser.close();
  stop();
}
console.log(`E2E: ${lulus} lulus, ${gagal} gagal`);
process.exit(gagal ? 1 : 0);

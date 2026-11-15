// Uji ujung-ke-ujung Dompet Emas (butuh MariaDB lokal berjalan & `node scripts/build.mjs`).
import { createRequire } from 'node:module';
import { spawn, execSync } from 'node:child_process';
import { readFileSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const { chromium, devices } = createRequire('/home/user/bbgoldpwa/')('playwright');
const ROOT = new URL('../../', import.meta.url).pathname;
const PORT = 8383, BASE = `http://127.0.0.1:${PORT}`;
const SHOT = process.env.SHOT_DIR;
let lulus = 0, gagal = 0;
const cek = (n, ok, info = '') => { if (ok) lulus++; else { gagal++; console.log('GAGAL:', n, info); } };

execSync(`mysql -uroot -e "DROP DATABASE IF EXISTS dompetemas_uji; CREATE DATABASE dompetemas_uji CHARACTER SET utf8mb4; GRANT ALL ON dompetemas_uji.* TO 'de'@'127.0.0.1';"`);
rmSync(join(ROOT, '.local/private/cache'), { recursive: true, force: true });
const srv = spawn('bash', ['scripts/serve-local.sh'], { cwd: ROOT, env: { ...process.env, PORT: String(PORT), MOCK_PORT: '8393', DB_NAME: 'dompetemas_uji' }, stdio: 'ignore', detached: true });
const stop = () => { try { process.kill(-srv.pid); } catch {} };
process.on('exit', stop);
for (let i = 0; i < 50; i++) { try { await fetch(BASE + '/'); break; } catch { await new Promise((r) => setTimeout(r, 200)); } }

const LOG = join(ROOT, '.local/private/cache/surel.log');
const kodeTerakhir = (email) => {
  const b = existsSync(LOG) ? readFileSync(LOG, 'utf8').trim().split('\n').map(JSON.parse).filter((x) => x.ke === email) : [];
  return b.length ? b[b.length - 1].teks.match(/(\d{6})/)[1] : null;
};

// klien API sederhana dengan cookie
function klien() {
  let cookie = '';
  return async (path, body, header = { 'X-DE': '1' }) => {
    const r = await fetch(BASE + path, body === undefined ? { headers: { cookie } } : { method: 'POST', headers: { 'Content-Type': 'application/json', cookie, ...header }, body: JSON.stringify(body) });
    const sc = r.headers.get('set-cookie'); if (sc) cookie = sc.split(';')[0];
    let j = {}; try { j = await r.json(); } catch {}
    return { s: r.status, j };
  };
}
async function masukApi(c, email) {
  await c('/api/auth.php', { aksi: 'kirim_kode', email });
  return c('/api/auth.php', { aksi: 'masuk', email, kode: kodeTerakhir(email) });
}

try {
  // ---------- API ----------
  const h = await (await fetch(BASE + '/api/harga.php')).text();
  cek('harga ok', JSON.parse(h).ok === true);
  for (const x of ['margin', 'hargaHitung', 'redmark', '999']) cek(`harga tidak bocor ${x}`, !h.includes(x));
  const A = klien(), B = klien();
  cek('belum masuk -> 401', (await A('/api/aset.php')).s === 401);
  cek('tanpa header X-DE ditolak', (await A('/api/auth.php', { aksi: 'kirim_kode', email: 'a@contoh.id' }, {})).s === 403);
  cek('email salah ditolak', (await A('/api/auth.php', { aksi: 'kirim_kode', email: 'bukan-email' })).s === 400);
  cek('kode salah ditolak', (await (async () => { await A('/api/auth.php', { aksi: 'kirim_kode', email: 'a@contoh.id' }); return A('/api/auth.php', { aksi: 'masuk', email: 'a@contoh.id', kode: '000000' }); })()).s === 400);
  cek('masuk A', (await A('/api/auth.php', { aksi: 'masuk', email: 'a@contoh.id', kode: kodeTerakhir('a@contoh.id') })).j.ok === true);
  cek('kode sekali pakai', (await B('/api/auth.php', { aksi: 'masuk', email: 'a@contoh.id', kode: kodeTerakhir('a@contoh.id') })).s === 400);
  cek('masuk B', (await masukApi(B, 'b@contoh.id')).j.ok === true);
  const t = await A('/api/aset.php', { aksi: 'tambah', jenis: 'batangan', merek: 'Antam', pecahan: '5 g', keping: 1, tahun: 2022, harga_beli: 4700000, nama: 'Tabungan' });
  cek('A tambah aset', t.j.ok === true && t.j.aset.id > 0);
  const idA = t.j.aset.id;
  cek('validasi server', (await A('/api/aset.php', { aksi: 'tambah', jenis: 'perhiasan', kadar: '700', tahun: 2022, harga_beli: 10 })).s === 400);
  cek('B tidak melihat aset A', (await B('/api/aset.php')).j.aset.length === 0);
  cek('B tidak bisa hapus aset A', (await B('/api/aset.php', { aksi: 'hapus', id: idA })).j.ok === false);
  cek('B tidak bisa ubah aset A', (await B('/api/aset.php', { aksi: 'ubah', id: idA, jenis: 'batangan', merek: 'UBS', pecahan: '1 g', keping: 1, tahun: 2020, harga_beli: 1000000 })).s === 404);
  cek('aset A utuh', (await A('/api/aset.php')).j.aset[0].merek === 'Antam');
  cek('bukan admin ditolak', (await A('/api/admin.php')).s === 403);
  const Adm = klien(); await masukApi(Adm, 'admin@contoh.id');
  const lap = await Adm('/api/admin.php');
  cek('admin melihat ringkasan', lap.j.ok === true && lap.j.pengguna === 3 && lap.j.aset === 1);
  cek('ringkasan tanpa email', !JSON.stringify(lap.j).includes('@'));
  await B('/api/akun.php', { aksi: 'atur', boleh_dihubungi: true });
  const csv = await (await fetch(BASE + '/api/admin.php?csv=kontak', { headers: { cookie: '' } })).status;
  cek('CSV kontak butuh login', csv === 401);
  cek('hapus akun butuh konfirmasi', (await B('/api/akun.php', { aksi: 'hapus_akun' })).s === 400);
  cek('hapus akun B', (await B('/api/akun.php', { aksi: 'hapus_akun', konfirmasi: 'HAPUS' })).j.ok === true);
  cek('sesi B berakhir', (await B('/api/aset.php')).s === 401);
  cek('api/lib ditolak', (await fetch(BASE + '/api/lib/bootstrap.php')).status === 403);
  // batas kiriman kode per email (3 / 15 menit)
  const C = klien(); for (let i = 0; i < 3; i++) await C('/api/auth.php', { aksi: 'kirim_kode', email: 'c@contoh.id' });
  cek('batas kirim kode', (await C('/api/auth.php', { aksi: 'kirim_kode', email: 'c@contoh.id' })).s === 429);

  // ---------- Browser ----------
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ ...devices['iPhone 14'] });
  const p = await ctx.newPage();
  const galat = []; p.on('pageerror', (e) => galat.push(e.message));
  await p.goto(BASE + '/');
  await p.fill('#email', 'siti@contoh.id');
  await p.click('text=Kirim kode masuk');
  await p.waitForSelector('#kode');
  await p.fill('#kode', '111111'); await p.click('button:has-text("Masuk")');
  cek('UI kode salah', await p.getByText('Kode salah').waitFor({ timeout: 5000 }).then(() => true, () => false));
  await p.fill('#kode', kodeTerakhir('siti@contoh.id')); await p.click('button:has-text("Masuk")');
  await p.waitForSelector('text=Dompetmu masih kosong');
  cek('dompet kosong tampil', true);
  // tambah perhiasan: rugi
  await p.click('.tab .plus');
  await p.click('.lembar button:has-text("Perhiasan")');
  await p.click('.lembar button:has-text("Kalung")');
  await p.click('.lembar button:has-text("KODE 750")');
  await p.click('.lembar button:has-text("Kuning")');
  await p.fill('#iBerat', '5'); await p.selectOption('#iTahun', '2025'); await p.fill('#iBeli', '9500000');
  await p.click('text=Hitung untung/rugi');
  cek('hasil rugi', (await p.innerText('[data-testid=hasil-selisih]')).trim() === '−Rp 1.546.000', await p.innerText('[data-testid=hasil-selisih]'));
  cek('persen rugi', (await p.innerText('[data-testid=hasil-persen]')).includes('−16,3%'));
  cek('penjelasan ongkos bikin', await p.getByText('Wajar kalau perhiasan terlihat rugi').isVisible());
  cek('sumber harga disebut', await p.getByText(/harga referensi BB GOLD Purwakarta per 13 Nov 2026/).isVisible());
  if (SHOT) await p.screenshot({ path: SHOT + '/de-form.png', fullPage: true });
  await p.click('text=Simpan ke dompet');
  await p.waitForSelector('[data-testid=kartu-aset]');
  // tambah Antam: untung
  await p.click('.tab .plus');
  await p.locator('.lembar').getByRole('button', { name: '5 g', exact: true }).click();
  await p.selectOption('#iTahun', '2022'); await p.fill('#iBeli', '4.700.000');
  await p.click('text=Hitung untung/rugi');
  cek('hasil untung Antam', (await p.innerText('[data-testid=hasil-selisih]')).trim() === '+Rp 6.765.000');
  await p.click('text=Simpan ke dompet');
  await p.waitForFunction(() => document.querySelectorAll('[data-testid=kartu-aset]').length === 2);
  cek('total nilai', (await p.innerText('[data-testid=total-nilai]')).trim() === '± Rp 19.419.000', await p.innerText('[data-testid=total-nilai]'));
  cek('total untung', (await p.innerText('[data-testid=total-untung]')).includes('+Rp 5.219.000'));
  await p.waitForTimeout(2500);
  const pikselEmas = await p.evaluate(() => { const c = document.querySelector('.kartu canvas'); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 0 && d[i] > 150 && d[i + 1] > 110) n++; return n; });
  cek('model 3D tergambar', pikselEmas > 500, pikselEmas);
  if (SHOT) await p.screenshot({ path: SHOT + '/de-dompet.png', fullPage: true });
  // muat ulang: data tetap (tersimpan di server)
  await p.reload(); await p.waitForSelector('[data-testid=kartu-aset]');
  cek('data tetap setelah muat ulang', (await p.locator('[data-testid=kartu-aset]').count()) === 2);
  // ubah & hapus
  await p.click('[data-testid=kartu-aset] >> nth=0');
  await p.click('.lembar button:has-text("Ubah")');
  await p.fill('#iBeli', '4.000.000'); await p.click('text=Hitung untung/rugi'); await p.click('text=Simpan perubahan');
  await p.waitForSelector('.lembar', { state: 'detached' });
  cek('ubah tersimpan', (await p.innerText('[data-testid=daftar]')).includes('+Rp 7.465.000'));
  await p.click('[data-testid=kartu-aset] >> nth=1');
  await p.click('.lembar button:has-text("Hapus")'); await p.click('text=Ya, hapus');
  await p.waitForFunction(() => document.querySelectorAll('[data-testid=kartu-aset]').length === 1);
  cek('hapus aset', true);
  // akun
  await p.click('.tab >> text=Akun');
  cek('halaman akun', await p.getByText('siti@contoh.id').isVisible());
  await p.click('text=Hapus akun dan semua data'); await p.fill('#konf', 'HAPUS'); await p.click('text=Hapus permanen');
  await p.waitForSelector('#email');
  cek('hapus akun kembali ke masuk', true);
  cek('tanpa error halaman', galat.length === 0, galat.join(' | '));
  cek('tidak bisa digeser ke samping', (await p.evaluate(() => document.documentElement.scrollWidth)) <= 390);
  await b.close();
} finally { stop(); }
console.log(`E2E Dompet Emas: ${lulus} lulus, ${gagal} gagal`);
process.exit(gagal ? 1 : 0);

# PWA BB GOLD (v1)

Web PWA publik untuk pelanggan BB GOLD Purwakarta: harga buyback perhiasan hari ini, grafik emas dunia, referensi buyback resmi, kalkulator estimasi + leads, edukasi, dan halaman toko.

Tujuan: `tokobbgold.dwabussines.com` (Hostinger, hosting bersama, tanpa Node.js di server).

## Isi repositori

| Folder | Isi |
|---|---|
| `web/` | Front-end Vite + React + TypeScript + Tailwind, hasil build statis ke `dist/` |
| `web/public/config/toko.json` | Jam buka dan daftar **tanggal tutup khusus** (pemilik boleh mengedit langsung di server) |
| `web/public/config/cap-pabrik.json` | Daftar contoh merek cap pabrik di kalkulator |
| `api/harga.php` | Memanggil Skrip 1, menyaring ke DTO allowlist, cache berkas 5 menit |
| `api/lead.php` | Validasi formulir, kolom jebakan, batas kiriman, meneruskan ke Skrip 2 dengan token |
| `apps-script/harga.gs` | Skrip 1, menempel di Sheet harga (hanya membaca kolom A, B, E dan B3) |
| `apps-script/leads.gs` | Skrip 2, menempel di Sheet Leads (hanya menambah baris) |
| `private-example/config.example.php` | Contoh konfigurasi rahasia (diletakkan di luar `public_html`) |
| `dev/` | Tiruan Apps Script dan router untuk uji lokal (tidak diunggah) |
| `tests/` | Tes unit (Vitest), tes PHP, tes end-to-end (Playwright) |

## Menjalankan dan menguji secara lokal

```bash
npm install
npm run build
npm test                 # Vitest + tes PHP
node tests/e2e/run.mjs   # tes browser: kebocoran margin, alur kalkulator, basi, offline
npm run serve:local      # buka http://127.0.0.1:8080 (memakai data tiruan)
```

Mode data tiruan diatur di `.local/mock-mode`: `fresh`, `stale`, `kosong`, `fail`, `leadfail`.

## Lapisan anti-bocor margin

1. **Skrip 1** hanya membaca kolom A (Kadar), B (Jenis), E (Harga Toko) dan B3. Kolom C, D, F, B1, B2 tidak pernah dibaca.
2. **`api/harga.php`** membangun ulang keluaran dari nol (`kadar`, `jenis`, `hargaPerGram`, `ditetapkanPada`); field lain dibuang, baris tidak valid dilewati dan dicatat ke log.
3. **Tes otomatis** memakai tiruan yang *sengaja* mengirim `hargaHitung`, `margin`, `persenKadar`, cukim, dan potongan, lalu memastikan semua itu tidak ada di respons API, HTML halaman, dan berkas statis.

Referensi: Hartadinata (kolom C + B2), Antam dan UBS (tab Cek Resmi), Redmark (kolom Buyback Asli, angka hanya dikirim bila tanggalnya hari ini). Baris potongan dan kolom "Buyback BB GOLD" tidak dibaca.

## Langkah pemilik di Google (tanpa Google Cloud Console)

### Skrip 1: harga
1. Buka Sheet **BB GOLD - Tabel Harga Kadar (Cukim)**, menu **Ekstensi > Apps Script**.
2. Hapus isi `Code.gs`, tempel seluruh isi `apps-script/harga.gs`, simpan.
3. (Opsional) Pilih fungsi `cobaKeluaran` > **Jalankan** untuk melihat keluaran di log. Pastikan tidak ada Harga Hitung atau margin.
4. **Terapkan > Penerapan baru** > jenis **Aplikasi web**. *Jalankan sebagai*: **Saya**. *Yang memiliki akses*: **Siapa saja**. Klik **Terapkan**, izinkan akses.
5. Salin URL yang berakhiran `/exec`.

### Skrip 2: leads
1. Buka Sheet **BB GOLD - Leads**, **Ekstensi > Apps Script**, tempel isi `apps-script/leads.gs`, simpan.
2. Jalankan fungsi `buatToken` sekali. Lalu buka **Setelan project (ikon roda gigi) > Properti skrip**, salin nilai `TOKEN`.
3. (Opsional) Jalankan `siapkanSheetLeads` sekali: header (bila A1 kosong), kolom C teks, H/J Ya/Tidak, L daftar status. Tidak mengubah data yang ada.
4. Terapkan sebagai **Aplikasi web** (Saya / Siapa saja), salin URL `/exec`.

### Menyimpan URL dan token (bukan lewat chat)
Di hPanel > File Manager, buat folder **di luar** `public_html`, sejajar dengannya:

```
domains/tokobbgold.dwabussines.com/
├── bbgold-private/      <- buat folder ini
│   ├── config.php       <- salinan private-example/config.example.php, isi URL & token
│   └── .htaccess        <- salinan private-example/.htaccess
└── public_html/
```

Isi `harga_exec_url`, `leads_exec_url`, `leads_token`, dan `salt` (teks acak panjang). Folder `cache/` dibuat otomatis di dalam `bbgold-private/`.

Bila kode skrip diubah: **Terapkan > Kelola penerapan > Edit > Versi baru**, supaya URL `/exec` tetap sama.

## Deploy (hanya setelah cadangan situs lama dikonfirmasi)

```bash
bash scripts/deploy.sh --domain tokobbgold.dwabussines.com --confirm-backup
```

Skrip menolak berjalan tanpa `--confirm-backup` atau dengan domain lain. Hasilnya `release/public_html.zip` (isi `dist/` + `api/`), diunggah ke `public_html` subdomain itu lewat hPanel. Dengan `--upload` (bila Hostinger CLI terpasang) skrip menampilkan rencana dulu dan meminta konfirmasi `GANTI`.

## Hal yang masih menunggu pemilik
- Logo resmi: `web/src/components/Logo.tsx` dan `web/public/icons/icon.svg` masih berupa versi sederhana; ganti dengan SVG dari Panduan-Merek-BB-GOLD.zip.
- Artikel edukasi (`web/src/content/artikel.ts`) adalah draf karena `bank-ide-edukasi.md` belum tersedia.
- Redaksi kebijakan privasi (lama simpan default 12 bulan) perlu dicek pemilik/penasihat hukum.
- Daftar hari libur di `config/toko.json` masih kosong.

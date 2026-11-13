/**
 * BB GOLD – Skrip 2 (menempel di Sheet "BB GOLD - Leads")
 *
 * Hanya menerima POST JSON dari api/lead.php yang membawa token rahasia.
 * Token disimpan di Project Settings > Script properties dengan nama TOKEN.
 * Skrip ini tidak membaca Sheet harga dan tidak pernah mengembalikan isi Sheet.
 *
 * Kolom tab "Leads" (baris 1 header, urutan tetap):
 * A Waktu (WIB) | B Nama | C WhatsApp (+62) | D Email | E Kode | F Cap/Jenis | G Berat (gram)
 * H Ada permata/aksesoris (Ya/Tidak) | I Estimasi (Rp) | J Perlu uji kadar (Ya/Tidak)
 * K Sumber | L Status tindak lanjut | M Catatan
 */

var TAB_LEADS = 'Leads';
var HEADER = ['Waktu (WIB)', 'Nama', 'WhatsApp (+62)', 'Email', 'Kode', 'Cap/Jenis', 'Berat (gram)',
  'Ada permata/aksesoris', 'Estimasi (Rp)', 'Perlu uji kadar', 'Sumber', 'Status tindak lanjut', 'Catatan'];
var STATUS = ['Baru', 'Dihubungi', 'Datang ke toko', 'Transaksi', 'Tidak lanjut'];

function doPost(e) {
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    var token = PropertiesService.getScriptProperties().getProperty('TOKEN');
    if (!token || token.length < 32 || !samaAman_(String(body.token || ''), token)) {
      return json_({ ok: false, error: 'tidak_diizinkan' });
    }
    var d = validasi_(body);
    if (!d) return json_({ ok: false, error: 'data_tidak_valid' });

    var lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TAB_LEADS);
      if (!sh) return json_({ ok: false, error: 'tab_tidak_ada' });
      var row = sh.getLastRow() + 1;
      sh.getRange(row, 3).setNumberFormat('@'); // C teks: tanda + dan angka 0 tidak hilang
      sh.getRange(row, 1, 1, 13).setValues([[
        Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss'),
        d.nama, d.wa, d.email, d.kode, d.jenis, d.berat,
        d.permata, d.estimasi, d.perluUji, d.sumber, 'Baru', d.catatan,
      ]]);
    } finally {
      lock.releaseLock();
    }
    return json_({ ok: true });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: 'gagal_menyimpan' });
  }
}

function doGet() {
  return json_({ ok: false, error: 'gunakan_post' });
}

function validasi_(b) {
  var nama = teks_(b.nama, 80);
  var wa = String(b.wa || '');
  if (nama.length < 2 || !/^\+628[0-9]{7,12}$/.test(wa)) return null;
  var email = teks_(b.email, 120);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) email = '';
  var berat = Number(b.berat);
  if (!(berat > 0 && berat <= 1000)) berat = '';
  var estimasi = teks_(b.estimasi, 40);
  return {
    nama: nama,
    wa: wa,
    email: email,
    kode: teks_(b.kode, 40),
    jenis: teks_(b.jenis, 40),
    berat: berat,
    permata: b.permata === 'Ya' ? 'Ya' : 'Tidak',
    estimasi: estimasi,
    perluUji: b.perluUji === 'Ya' ? 'Ya' : 'Tidak',
    sumber: (String(b.sumber || '').match(/^[a-z0-9_-]{1,30}$/i) ? String(b.sumber) : 'langsung'),
    catatan: teks_(b.catatan, 200),
  };
}

/** Bersihkan teks dan cegah formula injection (=, +, -, @ di awal). */
function teks_(v, max) {
  var s = String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function samaAman_(a, b) {
  if (a.length !== b.length) return false;
  var x = 0;
  for (var i = 0; i < a.length; i++) x |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return x === 0;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Jalankan SEKALI secara manual dari editor (opsional). Aman diulang:
 * - menulis header hanya bila A1 kosong,
 * - kolom C berformat teks, H dan J hanya Ya/Tidak, L daftar status.
 * Tidak menghapus atau mengubah baris data.
 */
function siapkanSheetLeads() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(TAB_LEADS) || ss.insertSheet(TAB_LEADS);
  if (!String(sh.getRange('A1').getValue()).trim()) {
    sh.getRange(1, 1, 1, HEADER.length).setValues([HEADER]).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  var max = sh.getMaxRows() - 1;
  sh.getRange(2, 3, max, 1).setNumberFormat('@');
  var yaTidak = SpreadsheetApp.newDataValidation().requireValueInList(['Ya', 'Tidak'], true).setAllowInvalid(false).build();
  sh.getRange(2, 8, max, 1).setDataValidation(yaTidak);
  sh.getRange(2, 10, max, 1).setDataValidation(yaTidak);
  var status = SpreadsheetApp.newDataValidation().requireValueInList(STATUS, true).setAllowInvalid(false).build();
  sh.getRange(2, 12, max, 1).setDataValidation(status);
}

/** Jalankan SEKALI untuk membuat token acak (lalu salin ke config.php di Hostinger). */
function buatToken() {
  var t = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
  PropertiesService.getScriptProperties().setProperty('TOKEN', t);
  console.log('TOKEN disimpan di Script properties. Salin nilainya dari Project Settings > Script properties.');
}

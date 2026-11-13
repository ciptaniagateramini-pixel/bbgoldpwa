/**
 * BB GOLD – Skrip 1 (menempel di Sheet "BB GOLD - Tabel Harga Kadar (Cukim)")
 *
 * HANYA MEMBACA. Skrip ini tidak pernah menulis ke Sheet.
 *
 *   GET <URL /exec>                  -> harga perhiasan
 *   GET <URL /exec>?data=referensi   -> referensi buyback resmi
 *
 * ATURAN KEBOCORAN:
 * - Dari tab "Untitled" hanya kolom A (Kadar), B (Jenis), E (Harga Toko) baris 5 dst,
 *   dan sel B3 (waktu cukim ditetapkan) yang dibaca. Kolom C (% Kadar), D (Harga Hitung),
 *   F (Margin), B1 (cukim) dan B2 (potongan) TIDAK PERNAH dibaca.
 * - Tab Hartadinata: B2 (tanggal) dan kolom A + C (Buyback Resmi). Baris 3 (potongan) tidak dibaca.
 * - Tab Cek Resmi: blok ANTAM dan UBS, kolom A (pecahan), B (buyback), C (update situs).
 * - Tab Redmark 2026: B2 (tanggal) dan kolom A + C (Buyback Asli). Baris 3 (potongan)
 *   dan kolom "Buyback BB GOLD" tidak dibaca.
 */

var TZ = 'Asia/Jakarta';
var TAB_HARGA = 'Untitled';          // jangan diganti: dipakai scheduled task harian
var BARIS_PERTAMA_TABEL = 5;
var KOLOM_KADAR = 1;                 // A
var KOLOM_JENIS = 2;                 // B
var KOLOM_HARGA_TOKO = 5;            // E

function doGet(e) {
  var data = (e && e.parameter && e.parameter.data) || '';
  try {
    var hasil = data === 'referensi' ? bacaReferensi_() : bacaHarga_();
    hasil.ok = true;
    return json_(hasil);
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: 'gagal_membaca' });
  }
}

function bacaHarga_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(TAB_HARGA);
  if (!sh) throw new Error('Tab ' + TAB_HARGA + ' tidak ditemukan');

  var b3 = sh.getRange('B3').getValue();
  var ditetapkanPada = keIsoWib_(b3);

  var last = sh.getLastRow();
  var items = [];
  if (last >= BARIS_PERTAMA_TABEL) {
    var n = last - BARIS_PERTAMA_TABEL + 1;
    var ab = sh.getRange(BARIS_PERTAMA_TABEL, KOLOM_KADAR, n, 2).getDisplayValues(); // A:B
    var e = sh.getRange(BARIS_PERTAMA_TABEL, KOLOM_HARGA_TOKO, n, 1).getValues();     // E saja
    for (var i = 0; i < n; i++) {
      var kadar = String(ab[i][0]).trim();
      if (!kadar) break; // akhir tabel
      var jenis = String(ab[i][1]).trim() || '-';
      var harga = keAngka_(e[i][0]);
      if (!(harga > 0)) continue; // baris tidak valid dilewati
      items.push({ kadar: kadar, jenis: jenis, hargaPerGram: Math.round(harga) });
    }
  }
  return { ditetapkanPada: ditetapkanPada, items: items };
}

function bacaReferensi_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return {
    hartadinata: bacaTabelKeping_(ss.getSheetByName('Hartadinata'), 3),
    redmark: bacaTabelKeping_(ss.getSheetByName('Redmark 2026'), 3),
    antam: bacaBlokCekResmi_(ss.getSheetByName('Cek Resmi'), 'ANTAM'),
    ubs: bacaBlokCekResmi_(ss.getSheetByName('Cek Resmi'), 'UBS'),
  };
}

/** Tab berbentuk: B2 = tanggal, baris 6 dst: A = kepingan, kolomHarga = buyback resmi/asli. */
function bacaTabelKeping_(sh, kolomHarga) {
  if (!sh) return null;
  var tanggal = String(sh.getRange('B2').getDisplayValue()).trim();
  var last = sh.getLastRow();
  var items = [];
  if (last >= 6) {
    var n = last - 5;
    var a = sh.getRange(6, 1, n, 1).getDisplayValues();
    var c = sh.getRange(6, kolomHarga, n, 1).getValues();
    for (var i = 0; i < n; i++) {
      var label = String(a[i][0]).trim();
      if (!label) break;
      var harga = keAngka_(c[i][0]);
      if (harga > 0) items.push({ label: label, harga: Math.round(harga) });
    }
  }
  return { keterangan: tanggal, items: items };
}

/** Cari blok di tab Cek Resmi yang judulnya (kolom A) diawali awalan; baca A, B, C sampai baris kosong. */
function bacaBlokCekResmi_(sh, awalan) {
  if (!sh) return null;
  var last = sh.getLastRow();
  if (last < 1) return null;
  var a = sh.getRange(1, 1, last, 3).getDisplayValues(); // A:C (pecahan, buyback, update)
  var b = sh.getRange(1, 2, last, 1).getValues();
  for (var r = 0; r < last; r++) {
    if (String(a[r][0]).toUpperCase().indexOf(awalan) === 0) {
      var judul = String(a[r][0]).trim();
      var keterangan = '';
      var items = [];
      for (var i = r + 1; i < last; i++) {
        var label = String(a[i][0]).trim();
        if (!label) break;
        if (!keterangan && String(a[i][2]).trim()) keterangan = String(a[i][2]).trim();
        var harga = keAngka_(b[i][0]);
        if (harga > 0) items.push({ label: label, harga: Math.round(harga) });
      }
      return { judul: judul, keterangan: keterangan, items: items };
    }
  }
  return null;
}

function keAngka_(v) {
  if (typeof v === 'number') return v;
  var s = String(v).replace(/[^0-9,]/g, '').replace(',', '.');
  var n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

/** B3 bisa berupa Date atau teks seperti "13 Nov 2026 09.15" / "2026-11-13 09:15". */
function keIsoWib_(v) {
  if (v instanceof Date && !isNaN(v.getTime())) {
    return Utilities.formatDate(v, TZ, "yyyy-MM-dd'T'HH:mm:ss") + '+07:00';
  }
  var s = String(v || '').trim();
  if (!s) return null;
  var bulan = { jan: 1, feb: 2, mar: 3, apr: 4, mei: 5, may: 5, jun: 6, jul: 7, agu: 8, agt: 8, aug: 8, sep: 9, okt: 10, oct: 10, nov: 11, des: 12, dec: 12 };
  var m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})[ T](\d{1,2})[:.](\d{2})/);
  if (m) return iso_(+m[1], +m[2], +m[3], +m[4], +m[5]);
  m = s.match(/^(\d{1,2})[ \/-]([A-Za-z]{3,})[a-z]*[ \/-](\d{4})[ ,]+(?:pukul\s+)?(\d{1,2})[:.](\d{2})/i);
  if (m && bulan[m[2].slice(0, 3).toLowerCase()]) return iso_(+m[3], bulan[m[2].slice(0, 3).toLowerCase()], +m[1], +m[4], +m[5]);
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})[ ,]+(\d{1,2})[:.](\d{2})/);
  if (m) return iso_(+m[3], +m[2], +m[1], +m[4], +m[5]);
  return null; // tidak dikenali: dianggap belum ditetapkan, jangan menebak
}

function iso_(y, mo, d, h, mi) {
  function p(x) { return (x < 10 ? '0' : '') + x; }
  return y + '-' + p(mo) + '-' + p(d) + 'T' + p(h) + ':' + p(mi) + ':00+07:00';
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/** Jalankan manual dari editor untuk melihat keluaran sebelum menayangkan. */
function cobaKeluaran() {
  console.log(JSON.stringify(bacaHarga_(), null, 2));
  console.log(JSON.stringify(bacaReferensi_(), null, 2));
}

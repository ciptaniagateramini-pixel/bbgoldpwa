<?php
// Tes unit lapisan PHP. Jalankan: php tests/php/run.php
declare(strict_types=1);
require __DIR__ . '/../../api/lib/dto.php';
ini_set('error_log', '/dev/null');

$gagal = 0; $lulus = 0;
function cek(string $nama, bool $ok): void { global $gagal, $lulus; if ($ok) { $lulus++; } else { $gagal++; echo "GAGAL: $nama\n"; } }

// --- DTO harga: field rahasia dibuang, baris rusak dilewati -------------
$raw = ['ok' => true, 'ditetapkanPada' => '2026-11-13T09:15:00+07:00', 'cukim' => 2250000, 'potonganDefault' => 15000,
  'items' => [
    ['kadar' => '700', 'jenis' => 'Lokal', 'hargaPerGram' => 1470000, 'hargaHitung' => 1485000, 'margin' => 15000, 'persenKadar' => 0.66],
    ['kadar' => '14K', 'jenis' => '-', 'hargaPerGram' => 1245000.4],
    ['kadar' => '999', 'jenis' => 'Lokal', 'hargaPerGram' => -5],
    ['kadar' => '<script>', 'jenis' => 'x', 'hargaPerGram' => 100000],
    ['kadar' => '300', 'jenis' => 'Lokal', 'hargaPerGram' => '592500'],
    ['kadar' => '300', 'jenis' => 'Cap Pabrik', 'hargaPerGram' => 99999999],
    'bukan objek',
  ]];
$d = bb_dto_harga($raw);
$j = json_encode($d);
cek('dto harga tidak null', $d !== null);
cek('hanya kunci allowlist di akar', array_keys($d) === ['ditetapkanPada', 'items']);
foreach ($d['items'] as $it) cek('hanya kunci allowlist di baris', array_keys($it) === ['kadar', 'jenis', 'hargaPerGram']);
cek('jumlah baris valid = 2', count($d['items']) === 2);
cek('harga dibulatkan int', $d['items'][1]['hargaPerGram'] === 1245000);
foreach (['hargaHitung', 'margin', 'persenKadar', 'cukim', 'potongan', '1485000', '2250000', '15000', '0.66'] as $x) {
  cek("tidak bocor: $x", stripos($j, $x) === false);
}
cek('iso valid', $d['ditetapkanPada'] === '2026-11-13T09:15:00+07:00');
cek('iso salah -> null', bb_dto_harga(['ok' => true, 'ditetapkanPada' => 'kemarin', 'items' => $raw['items']])['ditetapkanPada'] === null);
cek('iso zona lain -> null', bb_iso_valid('2026-11-13T09:15:00Z') === null);
cek('ok false -> null', bb_dto_harga(['ok' => false, 'items' => []]) === null);
cek('tanpa baris valid -> null', bb_dto_harga(['ok' => true, 'items' => [['kadar' => 'x']]]) === null);

// --- Referensi -------------------------------------------------------------
$ref = bb_dto_referensi(['ok' => true,
  'hartadinata' => ['keterangan' => '13 November 2026 (resmi hrtagold.id, 08.29 WIB)', 'potongan' => 7777, 'items' => [['label' => '1 g', 'harga' => 2252000, 'potongan' => 5]]],
  'antam' => ['keterangan' => '13 Nov 2026 08.39 WIB', 'items' => [['label' => '1 gram', 'harga' => 2285000]]],
  'ubs' => ['keterangan' => 'Potongan toko 20.000, 13 Nov 2026', 'items' => [['label' => '0,5 g', 'harga' => 1145000]]],
  'redmark' => ['keterangan' => '4 November 2026', 'buybackBBGold' => 2400000, 'items' => [['label' => '1 g', 'harga' => 2420000]]],
], '2026-11-13');
$rj = json_encode($ref);
cek('hartadinata hari ini', $ref['hartadinata']['basi'] === false && $ref['hartadinata']['tanggal'] === '2026-11-13');
cek('antam hari ini', $ref['antam']['basi'] === false);
cek('redmark basi & angka disembunyikan', $ref['redmark']['basi'] === true && $ref['redmark']['items'] === []);
cek('keterangan berisi potongan disaring', $ref['ubs']['keterangan'] === '2026-11-13');
foreach (['potongan', '7777', '2400000', 'buybackBBGold', '2420000'] as $x) cek("ref tidak bocor: $x", stripos($rj, $x) === false);
cek('label aneh dibuang', bb_dto_sumber(['keterangan' => '', 'items' => [['label' => '<b>', 'harga' => 1000000]]], '2026-11-13')['items'] === []);

// --- Tanggal Indonesia --------------------------------------------------------
cek('tgl panjang', bb_tanggal_id('13 November 2026 (resmi)') === '2026-11-13');
cek('tgl pendek', bb_tanggal_id('4 Nov 2026 08.39 WIB') === '2026-11-04');
cek('tgl Agustus', bb_tanggal_id('1 Agustus 2026') === '2026-08-01');
cek('tgl Mei', bb_tanggal_id('31 Mei 2026') === '2026-05-31');
cek('tgl salah', bb_tanggal_id('31 Februari 2026') === null);

// --- WA ---------------------------------------------------------------------
cek('wa 08', bb_normalisasi_wa('0812-3456-7890') === '+6281234567890');
cek('wa +62', bb_normalisasi_wa('+62 812 3456 7890') === '+6281234567890');
cek('wa 62', bb_normalisasi_wa('6281234567890') === '+6281234567890');
cek('wa tanpa 0', bb_normalisasi_wa('81234567890') === '+6281234567890');
cek('wa toko', bb_normalisasi_wa('0882000119208') === '+62882000119208');
cek('wa rumah ditolak', bb_normalisasi_wa('021-555-1234') === null);
cek('wa pendek ditolak', bb_normalisasi_wa('0812') === null);
cek('wa huruf ditolak', bb_normalisasi_wa('08123abc456') === null);

// --- pembulatan --------------------------------------------------------------
cek('bulat bawah', bb_bulat_bawah(3483899.0) === 3483000);
cek('rupiah', bb_rupiah(1234000) === 'Rp 1.234.000');

echo "PHP: $lulus lulus, $gagal gagal\n";
exit($gagal ? 1 : 0);

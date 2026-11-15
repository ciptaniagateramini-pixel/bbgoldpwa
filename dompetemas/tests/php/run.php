<?php
declare(strict_types=1);
require __DIR__ . '/../../api/lib/validasi.php';
$g = 0; $l = 0;
function cek(string $n, bool $ok): void { global $g, $l; if ($ok) $l++; else { $g++; echo "GAGAL: $n\n"; } }

[$d, $e] = de_validasi_aset(['jenis' => 'perhiasan', 'bentuk' => 'Cincin', 'kadar' => '700', 'sub' => 'Lokal', 'berat' => '3.2', 'tahun' => 2021, 'harga_beli' => 2400000, 'nama' => '  Cincin <b>nikah</b> ', 'merek' => 'Antam'], 2026);
cek('perhiasan valid', $d !== null && !$e);
cek('nama dibersihkan dari < >', $d['nama'] === 'Cincin bnikah/b');
cek('field batangan dikosongkan', $d['merek'] === null && $d['pecahan'] === null);
[$d, $e] = de_validasi_aset(['jenis' => 'batangan', 'merek' => 'Antam', 'pecahan' => '5 g', 'keping' => 2, 'tahun' => 2022, 'harga_beli' => 4700000], 2026);
cek('batangan valid', $d !== null && $d['keping'] === 2 && $d['berat'] === null);
[$d, $e] = de_validasi_aset(['jenis' => 'batangan', 'merek' => 'Lotus', 'pecahan' => '5g', 'keping' => 0, 'tahun' => 2030, 'harga_beli' => 5], 2026);
cek('batangan tidak valid: semua kolom salah', $d === null && isset($e['merek'], $e['pecahan'], $e['keping'], $e['tahun'], $e['harga_beli']));
[$d, $e] = de_validasi_aset(['jenis' => 'perhiasan', 'bentuk' => 'Topi', 'kadar' => '<x>', 'sub' => '', 'berat' => -1, 'tahun' => 1900, 'harga_beli' => 'abc'], 2026);
cek('perhiasan tidak valid', $d === null && isset($e['bentuk'], $e['kadar'], $e['sub'], $e['berat'], $e['tahun'], $e['harga_beli']));
[$d, $e] = de_validasi_aset(['jenis' => 'emas'], 2026);
cek('jenis salah', $d === null && isset($e['jenis']));
cek('email', de_email_valid(' Budi@Contoh.ID ') === 'budi@contoh.id' && de_email_valid('budi@') === null);

$h = de_saring_harga(['ok' => true, 'ditetapkanPada' => '2026-11-13T12:26:00+07:00', 'hargaHitung' => 5, 'items' => [['kadar' => '700', 'jenis' => 'Lokal', 'hargaPerGram' => 1422150, 'margin' => 15000], ['kadar' => '<b>', 'jenis' => 'x', 'hargaPerGram' => 1]]],
  ['ok' => true, 'antam' => ['tanggal' => '2026-11-13', 'basi' => false, 'potongan' => 9, 'items' => [['label' => '1 gram', 'harga' => 2293000], ['label' => 'x', 'harga' => 1]]], 'ubs' => null]);
$j = json_encode($h);
cek('harga tersaring', $h !== null && count($h['perhiasan']['items']) === 1 && count($h['batangan']['antam']['items']) === 1);
foreach (['margin', 'hargaHitung', 'potongan', '15000'] as $x) cek("tidak bocor $x", strpos($j, $x) === false);
cek('harga kosong -> null', de_saring_harga(['ok' => false], null) === null);
echo "PHP: $l lulus, $g gagal\n";
exit($g ? 1 : 0);

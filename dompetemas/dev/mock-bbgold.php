<?php
// Tiruan API BB GOLD untuk uji lokal (data tetap).
header('Content-Type: application/json');
if (($_GET['data'] ?? '') === 'referensi') {
  echo json_encode(['ok' => true,
    'antam' => ['tanggal' => '2026-11-13', 'keterangan' => '13 Nov 2026', 'basi' => false, 'items' => [['label' => '1 gram', 'harga' => 2293000]]],
    'ubs' => ['tanggal' => '2026-11-13', 'keterangan' => '13 Nov 2026', 'basi' => false, 'items' => [['label' => '1 g', 'harga' => 2256000], ['label' => '2 g', 'harga' => 4512000], ['label' => '5 g', 'harga' => 11281000]]],
    'hartadinata' => ['tanggal' => '2026-11-13', 'keterangan' => '13 Nov 2026', 'basi' => false, 'items' => [['label' => '1 g', 'harga' => 2251000]]],
    'redmark' => null, 'margin' => 999]);
  exit;
}
echo json_encode(['ok' => true, 'ditetapkanPada' => '2026-11-13T12:26:00+07:00', 'hargaHitung' => 1, 'items' => [
  ['kadar' => '375', 'jenis' => 'Pabrik', 'hargaPerGram' => 748850],
  ['kadar' => '700', 'jenis' => 'Lokal', 'hargaPerGram' => 1422150],
  ['kadar' => '700', 'jenis' => 'Cap Pabrik', 'hargaPerGram' => 1467425],
  ['kadar' => '750', 'jenis' => 'Kuning', 'hargaPerGram' => 1590975],
  ['kadar' => '750', 'jenis' => 'Putih', 'hargaPerGram' => 1578920],
  ['kadar' => '24K', 'jenis' => '-', 'hargaPerGram' => 2106505],
]]);

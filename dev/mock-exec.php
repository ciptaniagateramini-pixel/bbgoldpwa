<?php
/**
 * TIRUAN Apps Script untuk uji lokal (TIDAK diunggah ke Hostinger).
 * Sengaja menyertakan field rahasia (hargaHitung, margin, persenKadar) agar tes
 * membuktikan api/harga.php menyaringnya.
 * Mode diatur lewat berkas .local/mock-mode (fresh | stale | kosong | fail | leadfail).
 */
date_default_timezone_set('Asia/Jakarta');
$dir = dirname(__DIR__) . '/.local';
@mkdir($dir, 0700, true);
$mode = trim((string) @file_get_contents("$dir/mock-mode")) ?: 'fresh';
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
header('Content-Type: application/json');

if ($path === '/leads/exec') {
    $b = json_decode(file_get_contents('php://input'), true) ?: [];
    if ($mode === 'leadfail') { echo json_encode(['ok' => false, 'error' => 'gagal_menyimpan']); exit; }
    if (($b['token'] ?? '') !== str_repeat('t', 40)) { echo json_encode(['ok' => false, 'error' => 'tidak_diizinkan']); exit; }
    file_put_contents("$dir/leads.jsonl", json_encode($b) . "\n", FILE_APPEND);
    echo json_encode(['ok' => true]); exit;
}

if ($mode === 'fail') { http_response_code(500); echo 'error'; exit; }

$cukim = 2250000; $potongan = 15000;
$rows = [ // kadar, jenis, persen (rahasia, tiruan)
    ['300', 'Lokal', 0.27], ['300', 'Cap Pabrik', 0.30], ['375', 'Pabrik', 0.36], ['420', '-', 0.41],
    ['14K', '-', 0.56], ['700', 'Cap Pabrik', 0.69], ['700', 'Lokal', 0.66], ['750', 'Kuning', 0.73],
    ['750', 'Putih', 0.71], ['20K', '-', 0.80], ['80%', '-', 0.79], ['21K', '-', 0.85], ['22K', '-', 0.89],
    ['916', '-', 0.905], ['23K', '-', 0.94], ['24K', '-', 0.98],
];

if (($_GET['data'] ?? '') === 'referensi') {
    $hari = date('j') . ' November 2026';
    $tgl = date('j M Y');
    echo json_encode(['ok' => true,
        'hartadinata' => ['keterangan' => "$hari (resmi hrtagold.id, 08.29 WIB)", 'potongan' => 7777, 'items' => [['label' => '1 g', 'harga' => 2252000], ['label' => '5 g', 'harga' => 11260000]]],
        'antam' => ['judul' => 'ANTAM', 'keterangan' => "$tgl 08.39 WIB", 'items' => [['label' => '1 gram', 'harga' => 2285000]]],
        'ubs' => ['judul' => 'UBS', 'keterangan' => "$tgl 09.08 WIB", 'items' => [['label' => '0,5 g', 'harga' => 1145000], ['label' => '1 g', 'harga' => 2290000]]],
        'redmark' => ['keterangan' => '4 November 2026', 'buybackBBGold' => 2400000, 'items' => [['label' => '1 g', 'harga' => 2420000]]],
    ]);
    exit;
}

$items = [];
foreach ($rows as [$k, $j, $p]) {
    $hitung = (int) round($cukim * $p);
    $items[] = ['kadar' => $k, 'jenis' => $j, 'hargaPerGram' => $hitung - $potongan,
        'persenKadar' => $p, 'hargaHitung' => $hitung, 'margin' => $potongan];
}
// baris rusak: harus dilewati
$items[] = ['kadar' => '999', 'jenis' => 'Lokal', 'hargaPerGram' => -5];
$items[] = ['kadar' => '<script>', 'jenis' => 'x', 'hargaPerGram' => 100000];

$ditetapkan = match ($mode) {
    'stale' => date('Y-m-d', strtotime('-1 day')) . 'T09:15:00+07:00',
    'kosong' => null,
    default => date('Y-m-d') . 'T09:15:00+07:00',
};
echo json_encode(['ok' => true, 'ditetapkanPada' => $ditetapkan, 'cukim' => $cukim, 'potonganDefault' => $potongan, 'items' => $items]);

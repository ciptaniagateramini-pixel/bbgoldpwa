<?php
/**
 * POST /api/lead.php  (JSON)
 * Validasi: nama, WA (+62), persetujuan, kolom jebakan, batas kiriman per perangkat & per IP.
 * IP tidak disimpan mentah: hanya hash ber-garam harian, dan dibuang setelah 1 jam.
 * Estimasi dihitung ulang di server dari harga tersimpan (tidak memercayai angka dari browser).
 */
declare(strict_types=1);
require __DIR__ . '/lib/bootstrap.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') bb_json(['ok' => false, 'error' => 'metode'], 405);
$cfg = bb_config();

// Asal permintaan: hanya dari domain sendiri (bila browser mengirim Origin).
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$izin = (array) ($cfg['allowed_origins'] ?? []);
if ($origin !== '' && $izin && !in_array($origin, $izin, true)) bb_json(['ok' => false, 'error' => 'asal'], 403);

$raw = file_get_contents('php://input', false, null, 0, 8192);
$in = json_decode((string) $raw, true);
if (!is_array($in)) bb_json(['ok' => false, 'error' => 'format'], 400);

$id = is_string($in['id'] ?? null) && preg_match('/^[a-z0-9-]{8,64}$/i', $in['id']) ? $in['id'] : '';
$device = is_string($in['perangkat'] ?? null) && preg_match('/^[a-z0-9-]{8,64}$/i', $in['perangkat']) ? $in['perangkat'] : 'tanpa';

// Kolom jebakan: bot mengisinya. Balas "ok" tanpa menyimpan.
if (trim((string) ($in['website'] ?? '')) !== '') bb_json(['ok' => true]);

// --- Batas kiriman -------------------------------------------------------
$lockF = fopen($cfg['cache_dir'] . '/ratelimit.lock', 'c');
flock($lockF, LOCK_EX);
$rl = bb_cache_baca('ratelimit') ?? [];
$now = time();
foreach ($rl as $k => $ts) {
    $rl[$k] = array_values(array_filter((array) $ts, fn($t) => is_int($t) && $now - $t < 3600));
    if (!$rl[$k]) unset($rl[$k]);
}
$sudah = bb_cache_baca('terkirim') ?? [];
$sudah = array_filter($sudah, fn($t) => is_int($t) && $now - $t < 86400);
if ($id !== '' && isset($sudah[$id])) { flock($lockF, LOCK_UN); bb_json(['ok' => true, 'ulang' => true]); }

$ip = (string) ($_SERVER['REMOTE_ADDR'] ?? '');
$kIp = 'ip:' . hash_hmac('sha256', $ip . '|' . date('Y-m-d'), (string) ($cfg['salt'] ?? 'ganti'));
$kDev = 'dev:' . hash('sha256', $device);
$hitung = fn($k, $detik) => count(array_filter($rl[$k] ?? [], fn($t) => $now - $t < $detik));
$batasIp = (int) ($cfg['batas_ip_per_jam'] ?? 10);
$batasDev = (int) ($cfg['batas_perangkat_per_jam'] ?? 5);
if ($hitung($kIp, 3600) >= $batasIp || $hitung($kDev, 3600) >= $batasDev) {
    flock($lockF, LOCK_UN);
    bb_json(['ok' => false, 'error' => 'terlalu_sering'], 429);
}

// --- Validasi ------------------------------------------------------------
$err = [];
$nama = trim(preg_replace('/\s+/u', ' ', (string) ($in['nama'] ?? '')) ?? '');
if (mb_strlen($nama) < 2 || mb_strlen($nama) > 80 || !preg_match("/^[\p{L}\p{M} .,'\-]+$/u", $nama)) $err['nama'] = 'Isi nama kamu (2 sampai 80 huruf).';
$wa = bb_normalisasi_wa((string) ($in['wa'] ?? ''));
if ($wa === null) $err['wa'] = 'Nomor WhatsApp tidak valid. Contoh: 0812-3456-7890.';
$email = trim((string) ($in['email'] ?? ''));
if ($email !== '' && (mb_strlen($email) > 120 || !filter_var($email, FILTER_VALIDATE_EMAIL))) $err['email'] = 'Format email tidak valid (boleh dikosongkan).';
if (($in['setuju'] ?? false) !== true) $err['setuju'] = 'Centang persetujuan untuk melanjutkan.';
$kadar = (string) ($in['kadar'] ?? '');
$jenis = (string) ($in['jenis'] ?? '');
$polos = ($in['polos'] ?? false) === true;
$berat = is_numeric($in['berat'] ?? null) ? (float) $in['berat'] : 0.0;
if (!($berat > 0 && $berat <= 1000)) $err['berat'] = 'Berat tidak valid.';
if (!$polos && (!bb_kadar_valid($kadar) || !bb_jenis_valid($jenis))) $err['kode'] = 'Kode tidak valid.';
if ($err) { flock($lockF, LOCK_UN); bb_json(['ok' => false, 'error' => 'validasi', 'kolom' => $err], 400); }

// Catat hitungan batas kiriman sebelum meneruskan.
$rl[$kIp][] = $now;
$rl[$kDev][] = $now;
bb_cache_tulis('ratelimit', $rl);
flock($lockF, LOCK_UN);

// --- Estimasi dihitung ulang dari harga tersimpan ------------------------
$estimasi = '';
$harga = bb_cache_baca('harga')['data']['items'] ?? [];
if ($polos) {
    $lokal = array_column(array_filter($harga, fn($r) => ($r['jenis'] ?? '') === 'Lokal'), 'hargaPerGram');
    if ($lokal) {
        $a = bb_bulat_bawah($berat * min($lokal));
        $b = bb_bulat_bawah($berat * max($lokal));
        $estimasi = $a === $b ? '± ' . bb_rupiah($a) : '± ' . bb_rupiah($a) . ' - ' . bb_rupiah($b);
    }
} else {
    foreach ($harga as $r) {
        if (($r['kadar'] ?? '') === $kadar && ($r['jenis'] ?? '') === $jenis) {
            $estimasi = '± ' . bb_rupiah(bb_bulat_bawah($berat * (int) $r['hargaPerGram']));
        }
    }
}

$sumber = is_string($in['sumber'] ?? null) && preg_match('/^[a-z0-9_-]{1,30}$/i', $in['sumber']) ? strtolower($in['sumber']) : 'langsung';
$kirim = [
    'token' => (string) ($cfg['leads_token'] ?? ''),
    'nama' => $nama,
    'wa' => $wa,
    'email' => $email,
    'kode' => $polos ? 'Tidak ada kode (polos)' : (ctype_digit($kadar) ? 'KODE ' . $kadar : $kadar),
    'jenis' => $polos ? 'Tidak ada cap' : $jenis,
    'berat' => round($berat, 2),
    'permata' => ($in['permata'] ?? false) === true ? 'Ya' : 'Tidak',
    'estimasi' => $estimasi,
    'perluUji' => $polos ? 'Ya' : 'Tidak',
    'sumber' => $sumber,
    'catatan' => $estimasi === '' ? 'estimasi tidak dihitung (harga belum tersedia di server)' : '',
];

$url = (string) ($cfg['leads_exec_url'] ?? '');
$hasil = $url !== '' ? bb_http($url, json_encode($kirim, JSON_UNESCAPED_UNICODE)) : null;
if (($hasil['ok'] ?? false) !== true) {
    bb_log('lead gagal diteruskan: ' . (is_string($hasil['error'] ?? null) ? $hasil['error'] : 'jaringan'));
    bb_json(['ok' => false, 'error' => 'penyimpanan'], 502);
}

if ($id !== '') {
    $sudah[$id] = $now;
    bb_cache_tulis('terkirim', $sudah);
}
bb_json(['ok' => true]);

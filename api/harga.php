<?php
/**
 * GET /api/harga.php              -> harga buyback perhiasan BB GOLD (allowlist)
 * GET /api/harga.php?data=referensi -> referensi buyback resmi (allowlist)
 * Cache berkas 5 menit. Bila Apps Script gagal, pakai cache terakhir (ditandai).
 */
declare(strict_types=1);
require __DIR__ . '/lib/bootstrap.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') bb_json(['ok' => false, 'error' => 'metode'], 405);

$cfg = bb_config();
$referensi = ($_GET['data'] ?? '') === 'referensi';
$kunci = $referensi ? 'referensi' : 'harga';
$ttl = (int) ($cfg['cache_ttl'] ?? 300);
$now = bb_sekarang();
$hariIni = $now->format('Y-m-d');

// Hash IP untuk batas kiriman dibuang bila tidak ada kiriman lagi selama 1 jam.
$rlF = $cfg['cache_dir'] . '/ratelimit.json';
if (is_file($rlF) && time() - (int) filemtime($rlF) > 3600) @unlink($rlF);

$cache = bb_cache_baca($kunci);
$segar = $cache && (time() - (int) ($cache['_t'] ?? 0)) < $ttl && ($cache['_hari'] ?? '') === $hariIni;

if (!$segar) {
    $url = (string) ($cfg['harga_exec_url'] ?? '');
    $raw = $url !== '' ? bb_http($referensi ? $url . (strpos($url, '?') !== false ? '&' : '?') . 'data=referensi' : $url) : null;
    $dto = $raw === null ? null : ($referensi ? bb_dto_referensi($raw, $hariIni) : bb_dto_harga($raw));
    if ($dto !== null) {
        $cache = ['_t' => time(), '_hari' => $hariIni, 'data' => $dto];
        bb_cache_tulis($kunci, $cache);
    } elseif ($raw !== null) {
        bb_log("$kunci: respons skrip tidak lolos validasi");
    }
}

if (!$cache || !isset($cache['data'])) bb_json(['ok' => false, 'error' => 'tidak_tersedia', 'waktuServer' => $now->format(DATE_ATOM)], 503);

$data = $cache['data'];
// Lapisan aman tambahan: cache lama hasil referensi dihitung ulang status basinya terhadap hari ini.
if ($referensi && ($cache['_hari'] ?? '') !== $hariIni) {
    foreach ($data as $k => $s) {
        if (!is_array($s)) continue;
        $data[$k]['basi'] = ($s['tanggal'] ?? null) !== $hariIni;
        if ($k === 'redmark' && $data[$k]['basi']) $data[$k]['items'] = [];
    }
}

bb_json(['ok' => true] + $data + [
    'waktuServer' => $now->format(DATE_ATOM),
    'diambilPada' => date(DATE_ATOM, (int) $cache['_t']),
    'dariCacheLama' => !$segar && (time() - (int) $cache['_t']) >= $ttl,
], 200, 'no-cache');

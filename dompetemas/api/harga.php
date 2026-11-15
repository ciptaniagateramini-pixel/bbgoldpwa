<?php
/** GET /api/harga.php – harga referensi dari BB GOLD (perhiasan + buyback resmi batangan). Cache 5 menit. */
declare(strict_types=1);
require __DIR__ . '/lib/bootstrap.php';
require __DIR__ . '/lib/validasi.php';

$c = de_config();
$f = $c['cache_dir'] . '/harga.json';
$cache = is_file($f) ? json_decode((string) file_get_contents($f), true) : null;
$segar = is_array($cache) && time() - (int) ($cache['_t'] ?? 0) < (int) ($c['cache_ttl'] ?? 300);

function de_ambil(string $url): ?array
{
    $ch = curl_init($url);
    curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_FOLLOWLOCATION => true, CURLOPT_CONNECTTIMEOUT => 5, CURLOPT_TIMEOUT => 12, CURLOPT_HTTPHEADER => ['Accept: application/json']]);
    $b = curl_exec($ch); $kode = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE); curl_close($ch);
    if (!is_string($b) || $kode !== 200) return null;
    $d = json_decode($b, true);
    return is_array($d) ? $d : null;
}

if (!$segar) {
    $base = (string) ($c['harga_url'] ?? 'https://tokobbgold.dwabussines.com/api/harga.php');
    $data = de_saring_harga(de_ambil($base), de_ambil($base . '?data=referensi'));
    if ($data) { $cache = ['_t' => time(), 'data' => $data]; file_put_contents($f . '.tmp', json_encode($cache)); rename($f . '.tmp', $f); }
    else de_log('harga BB GOLD tidak bisa diambil');
}
if (!is_array($cache) || !isset($cache['data'])) de_json(['ok' => false, 'error' => 'harga_tidak_tersedia'], 503);
de_json(['ok' => true] + $cache['data'] + ['diambilPada' => date(DATE_ATOM, (int) $cache['_t']), 'waktuServer' => date(DATE_ATOM)]);

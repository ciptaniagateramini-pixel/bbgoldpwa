<?php
declare(strict_types=1);

require_once __DIR__ . '/dto.php';

date_default_timezone_set('Asia/Jakarta');
ini_set('display_errors', '0');

/** Konfigurasi rahasia di LUAR public_html (satu tingkat di atas). */
function bb_config(): array
{
    static $cfg = null;
    if ($cfg !== null) return $cfg;
    $path = getenv('BBGOLD_CONFIG') ?: dirname(__DIR__, 3) . '/bbgold-private/config.php';
    if (!is_file($path)) {
        bb_log('config tidak ditemukan');
        bb_json(['ok' => false, 'error' => 'belum_dikonfigurasi'], 503);
    }
    $cfg = require $path;
    $cfg['cache_dir'] = $cfg['cache_dir'] ?? dirname($path) . '/cache';
    if (!is_dir($cfg['cache_dir'])) @mkdir($cfg['cache_dir'], 0700, true);
    return $cfg;
}

function bb_headers(): void
{
    header('Content-Type: application/json; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    header("Content-Security-Policy: default-src 'none'; frame-ancestors 'none'");
    header('X-Robots-Tag: noindex');
}

function bb_json(array $data, int $status = 200, string $cache = 'no-store'): void
{
    http_response_code($status);
    bb_headers();
    header('Cache-Control: ' . $cache);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/** Panggil Apps Script /exec. POST otomatis jadi GET saat redirect 302 (perilaku yang benar untuk Apps Script). */
function bb_http(string $url, ?string $postBody = null): ?array
{
    $ch = curl_init($url);
    $opt = [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_MAXREDIRS => 5,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT => 12,
        CURLOPT_PROTOCOLS => CURLPROTO_HTTPS | CURLPROTO_HTTP,
        CURLOPT_HTTPHEADER => ['Accept: application/json'],
    ];
    if ($postBody !== null) {
        $opt[CURLOPT_POST] = true;
        $opt[CURLOPT_POSTFIELDS] = $postBody;
        $opt[CURLOPT_HTTPHEADER][] = 'Content-Type: application/json';
    }
    curl_setopt_array($ch, $opt);
    $body = curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);
    if (!is_string($body) || $code !== 200) {
        bb_log("http gagal kode=$code");
        return null;
    }
    $data = json_decode($body, true);
    return is_array($data) ? $data : null;
}

function bb_cache_baca(string $nama): ?array
{
    $f = bb_config()['cache_dir'] . '/' . $nama . '.json';
    if (!is_file($f)) return null;
    $d = json_decode((string) file_get_contents($f), true);
    return is_array($d) ? $d : null;
}

function bb_cache_tulis(string $nama, array $data): void
{
    $f = bb_config()['cache_dir'] . '/' . $nama . '.json';
    file_put_contents($f . '.tmp', json_encode($data, JSON_UNESCAPED_UNICODE), LOCK_EX);
    rename($f . '.tmp', $f);
}

function bb_sekarang(): DateTimeImmutable
{
    return new DateTimeImmutable('now', new DateTimeZone('Asia/Jakarta'));
}

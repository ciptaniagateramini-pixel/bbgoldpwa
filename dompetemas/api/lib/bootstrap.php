<?php
/**
 * Dompet Emas – inti API. Konfigurasi rahasia di LUAR public_html:
 *   domains/dompetemas.dwabussines.com/dompetemas-private/config.php
 */
declare(strict_types=1);

date_default_timezone_set('Asia/Jakarta');
ini_set('display_errors', '0');

function de_log(string $p): void { error_log('[dompetemas] ' . $p); }

function de_config(): array
{
    static $c = null;
    if ($c !== null) return $c;
    $path = getenv('DE_CONFIG') ?: dirname(__DIR__, 3) . '/dompetemas-private/config.php';
    if (!is_file($path)) { de_log('config tidak ada'); de_json(['ok' => false, 'error' => 'belum_dikonfigurasi'], 503); }
    $c = require $path;
    $c['cache_dir'] = $c['cache_dir'] ?? dirname($path) . '/cache';
    if (!is_dir($c['cache_dir'])) @mkdir($c['cache_dir'], 0700, true);
    return $c;
}

function de_json(array $data, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    header("Content-Security-Policy: default-src 'none'; frame-ancestors 'none'");
    header('X-Robots-Tag: noindex');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function de_db(): PDO
{
    static $pdo = null;
    if ($pdo) return $pdo;
    $c = de_config();
    try {
        $pdo = new PDO($c['db_dsn'], $c['db_user'], $c['db_pass'], [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
    } catch (Throwable $e) {
        de_log('db gagal: ' . $e->getMessage());
        de_json(['ok' => false, 'error' => 'database'], 503);
    }
    de_skema($pdo);
    return $pdo;
}

/** Tabel dibuat otomatis bila belum ada (aman diulang). */
function de_skema(PDO $pdo): void
{
    $versi = 1;
    $f = de_config()['cache_dir'] . '/skema_v' . $versi;
    if (is_file($f)) return;
    $pdo->exec("CREATE TABLE IF NOT EXISTS pengguna (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(190) NOT NULL UNIQUE,
        boleh_dihubungi TINYINT(1) NOT NULL DEFAULT 0,
        dibuat DATETIME NOT NULL,
        terakhir_masuk DATETIME NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    $pdo->exec("CREATE TABLE IF NOT EXISTS kode_masuk (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(190) NOT NULL,
        kode_hash CHAR(64) NOT NULL,
        kedaluwarsa DATETIME NOT NULL,
        percobaan TINYINT UNSIGNED NOT NULL DEFAULT 0,
        dipakai TINYINT(1) NOT NULL DEFAULT 0,
        dibuat DATETIME NOT NULL,
        INDEX (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    $pdo->exec("CREATE TABLE IF NOT EXISTS sesi (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        pengguna_id INT UNSIGNED NOT NULL,
        token_hash CHAR(64) NOT NULL UNIQUE,
        dibuat DATETIME NOT NULL,
        kedaluwarsa DATETIME NOT NULL,
        INDEX (pengguna_id),
        FOREIGN KEY (pengguna_id) REFERENCES pengguna(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    $pdo->exec("CREATE TABLE IF NOT EXISTS aset (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        pengguna_id INT UNSIGNED NOT NULL,
        jenis VARCHAR(10) NOT NULL,
        nama VARCHAR(60) NOT NULL DEFAULT '',
        bentuk VARCHAR(10) NULL,
        kadar VARCHAR(5) NULL,
        sub VARCHAR(30) NULL,
        berat DECIMAL(10,3) NULL,
        merek VARCHAR(20) NULL,
        pecahan VARCHAR(10) NULL,
        keping SMALLINT UNSIGNED NULL,
        tahun SMALLINT UNSIGNED NOT NULL,
        harga_beli BIGINT UNSIGNED NOT NULL,
        dibuat DATETIME NOT NULL,
        diubah DATETIME NOT NULL,
        INDEX (pengguna_id),
        FOREIGN KEY (pengguna_id) REFERENCES pengguna(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    $pdo->exec("CREATE TABLE IF NOT EXISTS batas (
        kunci CHAR(64) NOT NULL,
        waktu INT UNSIGNED NOT NULL,
        INDEX (kunci, waktu)
    ) ENGINE=InnoDB");
    @file_put_contents($f, date(DATE_ATOM));
}

function de_sekarang(): string { return date('Y-m-d H:i:s'); }

/** Batas kiriman: true bila masih boleh. IP tidak disimpan mentah (hash ber-garam). */
function de_batas(string $jenis, string $nilai, int $maks, int $detik): bool
{
    $db = de_db();
    $kunci = hash_hmac('sha256', $jenis . '|' . $nilai, (string) de_config()['salt']);
    $now = time();
    $db->prepare('DELETE FROM batas WHERE waktu < ?')->execute([$now - 86400]);
    $q = $db->prepare('SELECT COUNT(*) FROM batas WHERE kunci = ? AND waktu > ?');
    $q->execute([$kunci, $now - $detik]);
    if ((int) $q->fetchColumn() >= $maks) return false;
    $db->prepare('INSERT INTO batas (kunci, waktu) VALUES (?, ?)')->execute([$kunci, $now]);
    return true;
}

function de_ip(): string { return (string) ($_SERVER['REMOTE_ADDR'] ?? ''); }

/** Baca body JSON. POST wajib berheader X-DE (perlindungan CSRF bersama cookie SameSite). */
function de_input(): array
{
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') de_json(['ok' => false, 'error' => 'metode'], 405);
    if (($_SERVER['HTTP_X_DE'] ?? '') !== '1') de_json(['ok' => false, 'error' => 'permintaan_tidak_sah'], 403);
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $izin = (array) (de_config()['allowed_origins'] ?? []);
    if ($origin !== '' && $izin && !in_array($origin, $izin, true)) de_json(['ok' => false, 'error' => 'asal'], 403);
    $raw = file_get_contents('php://input', false, null, 0, 16384);
    $in = json_decode((string) $raw, true);
    if (!is_array($in)) de_json(['ok' => false, 'error' => 'format'], 400);
    return $in;
}

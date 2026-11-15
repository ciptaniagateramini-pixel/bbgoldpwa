<?php
/**
 * POST /api/auth.php  {aksi:'kirim_kode', email} | {aksi:'masuk', email, kode} | {aksi:'keluar'}
 * GET  /api/auth.php  -> pengguna saat ini
 */
declare(strict_types=1);
require __DIR__ . '/lib/bootstrap.php';
require __DIR__ . '/lib/sesi.php';
require __DIR__ . '/lib/surel.php';
require __DIR__ . '/lib/validasi.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET') {
    $p = de_pengguna();
    de_json(['ok' => true, 'pengguna' => $p ? ['email' => $p['email'], 'boleh_dihubungi' => (bool) $p['boleh_dihubungi'], 'admin' => de_admin($p)] : null]);
}

$in = de_input();
$aksi = $in['aksi'] ?? '';
$db = de_db();
$salt = (string) de_config()['salt'];

if ($aksi === 'kirim_kode') {
    $email = de_email_valid((string) ($in['email'] ?? ''));
    if (!$email) de_json(['ok' => false, 'error' => 'email_tidak_valid'], 400);
    if (!de_batas('ip_kode', de_ip(), 10, 3600) || !de_batas('email_kode', $email, 3, 900)) de_json(['ok' => false, 'error' => 'terlalu_sering'], 429);
    $kode = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    $db->prepare('UPDATE kode_masuk SET dipakai = 1 WHERE email = ? AND dipakai = 0')->execute([$email]);
    $db->prepare('INSERT INTO kode_masuk (email, kode_hash, kedaluwarsa, dibuat) VALUES (?, ?, ?, ?)')
        ->execute([$email, hash_hmac('sha256', $email . '|' . $kode, $salt), date('Y-m-d H:i:s', time() + 600), de_sekarang()]);
    $teks = "Kode masuk Dompet Emas kamu: $kode\n\nBerlaku 10 menit. Jangan berikan kode ini kepada siapa pun.\nKalau kamu tidak meminta kode ini, abaikan email ini.";
    $html = '<div style="font-family:Arial,sans-serif;max-width:420px;margin:auto;padding:24px;color:#13261F">'
        . '<p style="font-size:15px">Kode masuk <b>Dompet Emas</b> kamu:</p>'
        . '<p style="font-size:34px;font-weight:700;letter-spacing:8px;background:#F5F1E6;padding:16px;text-align:center;border-radius:12px">' . $kode . '</p>'
        . '<p style="font-size:13px;color:#5E6B64">Berlaku 10 menit. Jangan berikan kode ini kepada siapa pun. Kalau kamu tidak meminta kode ini, abaikan email ini.</p></div>';
    if (!de_kirim_email($email, "Kode masuk Dompet Emas: $kode", $teks, $html)) de_json(['ok' => false, 'error' => 'email_gagal'], 502);
    de_json(['ok' => true]);
}

if ($aksi === 'masuk') {
    $email = de_email_valid((string) ($in['email'] ?? ''));
    $kode = (string) ($in['kode'] ?? '');
    if (!$email || !preg_match('/^\d{6}$/', $kode)) de_json(['ok' => false, 'error' => 'kode_salah'], 400);
    if (!de_batas('ip_masuk', de_ip(), 30, 3600)) de_json(['ok' => false, 'error' => 'terlalu_sering'], 429);
    $q = $db->prepare('SELECT id, kode_hash, percobaan FROM kode_masuk WHERE email = ? AND dipakai = 0 AND kedaluwarsa > ? ORDER BY id DESC LIMIT 1');
    $q->execute([$email, de_sekarang()]);
    $r = $q->fetch();
    if (!$r) de_json(['ok' => false, 'error' => 'kode_kedaluwarsa'], 400);
    if ((int) $r['percobaan'] >= 5) { $db->prepare('UPDATE kode_masuk SET dipakai = 1 WHERE id = ?')->execute([$r['id']]); de_json(['ok' => false, 'error' => 'kode_kedaluwarsa'], 400); }
    if (!hash_equals($r['kode_hash'], hash_hmac('sha256', $email . '|' . $kode, $salt))) {
        $db->prepare('UPDATE kode_masuk SET percobaan = percobaan + 1 WHERE id = ?')->execute([$r['id']]);
        de_json(['ok' => false, 'error' => 'kode_salah'], 400);
    }
    $db->prepare('UPDATE kode_masuk SET dipakai = 1 WHERE id = ?')->execute([$r['id']]);
    $q = $db->prepare('SELECT id FROM pengguna WHERE email = ?'); $q->execute([$email]);
    $id = $q->fetchColumn();
    if (!$id) { $db->prepare('INSERT INTO pengguna (email, dibuat) VALUES (?, ?)')->execute([$email, de_sekarang()]); $id = $db->lastInsertId(); }
    $db->prepare('UPDATE pengguna SET terakhir_masuk = ? WHERE id = ?')->execute([de_sekarang(), $id]);
    $db->prepare('DELETE FROM sesi WHERE kedaluwarsa < ?')->execute([de_sekarang()]);
    de_buat_sesi((int) $id);
    de_json(['ok' => true]);
}

if ($aksi === 'keluar') { de_hapus_sesi_ini(); de_json(['ok' => true]); }
de_json(['ok' => false, 'error' => 'aksi'], 400);

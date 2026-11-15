<?php
declare(strict_types=1);

const DE_COOKIE = 'de_sesi';
const DE_SESI_HARI = 60;

function de_set_cookie(string $nilai, int $kedaluwarsa): void
{
    setcookie(DE_COOKIE, $nilai, [
        'expires' => $kedaluwarsa,
        'path' => '/',
        'secure' => (bool) (de_config()['cookie_secure'] ?? true),
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
}

function de_buat_sesi(int $penggunaId): void
{
    $token = rtrim(strtr(base64_encode(random_bytes(32)), '+/', '-_'), '=');
    $exp = time() + DE_SESI_HARI * 86400;
    de_db()->prepare('INSERT INTO sesi (pengguna_id, token_hash, dibuat, kedaluwarsa) VALUES (?, ?, ?, ?)')
        ->execute([$penggunaId, hash('sha256', $token), de_sekarang(), date('Y-m-d H:i:s', $exp)]);
    de_set_cookie($token, $exp);
}

/** @return array{id:int,email:string,boleh_dihubungi:int}|null */
function de_pengguna(): ?array
{
    $t = $_COOKIE[DE_COOKIE] ?? '';
    if (!is_string($t) || !preg_match('/^[A-Za-z0-9_-]{40,50}$/', $t)) return null;
    $q = de_db()->prepare('SELECT p.id, p.email, p.boleh_dihubungi FROM sesi s JOIN pengguna p ON p.id = s.pengguna_id WHERE s.token_hash = ? AND s.kedaluwarsa > ?');
    $q->execute([hash('sha256', $t), de_sekarang()]);
    $r = $q->fetch();
    if (!$r) return null;
    $r['id'] = (int) $r['id'];
    $r['boleh_dihubungi'] = (int) $r['boleh_dihubungi'];
    return $r;
}

function de_wajib_masuk(): array
{
    $p = de_pengguna();
    if (!$p) de_json(['ok' => false, 'error' => 'belum_masuk'], 401);
    return $p;
}

function de_hapus_sesi_ini(): void
{
    $t = $_COOKIE[DE_COOKIE] ?? '';
    if (is_string($t) && $t !== '') de_db()->prepare('DELETE FROM sesi WHERE token_hash = ?')->execute([hash('sha256', $t)]);
    de_set_cookie('', time() - 3600);
}

function de_admin(array $p): bool
{
    return in_array(strtolower($p['email']), array_map('strtolower', (array) (de_config()['admin_emails'] ?? [])), true);
}

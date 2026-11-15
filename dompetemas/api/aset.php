<?php
/**
 * GET  /api/aset.php -> daftar aset milik pengguna
 * POST /api/aset.php {aksi:'tambah', ...} | {aksi:'ubah', id, ...} | {aksi:'hapus', id}
 * Semua kueri dibatasi pengguna_id dari sesi (tidak bisa membaca/mengubah aset orang lain).
 */
declare(strict_types=1);
require __DIR__ . '/lib/bootstrap.php';
require __DIR__ . '/lib/sesi.php';
require __DIR__ . '/lib/validasi.php';

$p = de_wajib_masuk();
$db = de_db();
$kolom = 'id, jenis, nama, bentuk, kadar, sub, berat, merek, pecahan, keping, tahun, harga_beli';

function de_baris(array $r): array
{
    foreach (['id', 'keping', 'tahun', 'harga_beli'] as $k) if ($r[$k] !== null) $r[$k] = (int) $r[$k];
    if ($r['berat'] !== null) $r['berat'] = (float) $r['berat'];
    return $r;
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET') {
    $q = $db->prepare("SELECT $kolom FROM aset WHERE pengguna_id = ? ORDER BY id DESC");
    $q->execute([$p['id']]);
    de_json(['ok' => true, 'aset' => array_map('de_baris', $q->fetchAll())]);
}

$in = de_input();
$aksi = $in['aksi'] ?? '';
if (!de_batas('tulis', (string) $p['id'], 120, 3600)) de_json(['ok' => false, 'error' => 'terlalu_sering'], 429);

if ($aksi === 'hapus') {
    $q = $db->prepare('DELETE FROM aset WHERE id = ? AND pengguna_id = ?');
    $q->execute([(int) ($in['id'] ?? 0), $p['id']]);
    de_json(['ok' => $q->rowCount() === 1]);
}

if ($aksi === 'tambah' || $aksi === 'ubah') {
    [$d, $err] = de_validasi_aset($in, (int) date('Y'));
    if (!$d) de_json(['ok' => false, 'error' => 'validasi', 'kolom' => $err], 400);
    $vals = [$d['jenis'], $d['nama'], $d['bentuk'], $d['kadar'], $d['sub'], $d['berat'], $d['merek'], $d['pecahan'], $d['keping'], $d['tahun'], $d['harga_beli'], de_sekarang()];
    if ($aksi === 'tambah') {
        $n = $db->prepare('SELECT COUNT(*) FROM aset WHERE pengguna_id = ?'); $n->execute([$p['id']]);
        if ((int) $n->fetchColumn() >= 200) de_json(['ok' => false, 'error' => 'batas_aset'], 400);
        $db->prepare('INSERT INTO aset (jenis, nama, bentuk, kadar, sub, berat, merek, pecahan, keping, tahun, harga_beli, diubah, pengguna_id, dibuat) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
            ->execute(array_merge($vals, [$p['id'], de_sekarang()]));
        $id = (int) $db->lastInsertId();
    } else {
        $id = (int) ($in['id'] ?? 0);
        $q = $db->prepare('UPDATE aset SET jenis=?, nama=?, bentuk=?, kadar=?, sub=?, berat=?, merek=?, pecahan=?, keping=?, tahun=?, harga_beli=?, diubah=? WHERE id = ? AND pengguna_id = ?');
        $q->execute(array_merge($vals, [$id, $p['id']]));
        $c = $db->prepare('SELECT COUNT(*) FROM aset WHERE id = ? AND pengguna_id = ?'); $c->execute([$id, $p['id']]);
        if (!(int) $c->fetchColumn()) de_json(['ok' => false, 'error' => 'tidak_ditemukan'], 404);
    }
    $q = $db->prepare("SELECT $kolom FROM aset WHERE id = ? AND pengguna_id = ?"); $q->execute([$id, $p['id']]);
    de_json(['ok' => true, 'aset' => de_baris($q->fetch())]);
}
de_json(['ok' => false, 'error' => 'aksi'], 400);

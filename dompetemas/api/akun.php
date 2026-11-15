<?php
/** POST /api/akun.php {aksi:'atur', boleh_dihubungi} | {aksi:'hapus_akun', konfirmasi:'HAPUS'} */
declare(strict_types=1);
require __DIR__ . '/lib/bootstrap.php';
require __DIR__ . '/lib/sesi.php';

$p = de_wajib_masuk();
$in = de_input();
$db = de_db();
$aksi = $in['aksi'] ?? '';
if ($aksi === 'atur') {
    $db->prepare('UPDATE pengguna SET boleh_dihubungi = ? WHERE id = ?')->execute([($in['boleh_dihubungi'] ?? false) === true ? 1 : 0, $p['id']]);
    de_json(['ok' => true]);
}
if ($aksi === 'hapus_akun') {
    if (($in['konfirmasi'] ?? '') !== 'HAPUS') de_json(['ok' => false, 'error' => 'konfirmasi'], 400);
    $db->beginTransaction();
    $db->prepare('DELETE FROM aset WHERE pengguna_id = ?')->execute([$p['id']]);
    $db->prepare('DELETE FROM sesi WHERE pengguna_id = ?')->execute([$p['id']]);
    $db->prepare('DELETE FROM kode_masuk WHERE email = ?')->execute([$p['email']]);
    $db->prepare('DELETE FROM pengguna WHERE id = ?')->execute([$p['id']]);
    $db->commit();
    de_set_cookie('', time() - 3600);
    de_json(['ok' => true]);
}
de_json(['ok' => false, 'error' => 'aksi'], 400);

<?php
/**
 * GET /api/admin.php            -> ringkasan tanpa data pribadi (hanya email admin)
 * GET /api/admin.php?csv=harian -> CSV pengguna & aset baru per hari (untuk Google Sheets)
 * GET /api/admin.php?csv=kontak -> CSV email pengguna yang MENCENTANG "boleh dihubungi"
 */
declare(strict_types=1);
require __DIR__ . '/lib/bootstrap.php';
require __DIR__ . '/lib/sesi.php';

$p = de_wajib_masuk();
if (!de_admin($p)) de_json(['ok' => false, 'error' => 'bukan_admin'], 403);
$db = de_db();
$csv = $_GET['csv'] ?? '';

function de_csv(string $nama, array $kepala, array $baris): void
{
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $nama . '"');
    header('Cache-Control: no-store');
    $o = fopen('php://output', 'w');
    fputcsv($o, $kepala);
    foreach ($baris as $b) fputcsv($o, array_map(fn($v) => is_string($v) && preg_match('/^[=+\-@]/', $v) ? "'" . $v : $v, array_values($b)));
    exit;
}

if ($csv === 'harian') {
    $r = $db->query("SELECT t.hari, COALESCE(u.n,0) pengguna_baru, COALESCE(a.n,0) aset_baru FROM
        (SELECT DATE(dibuat) hari FROM pengguna UNION SELECT DATE(dibuat) FROM aset) t
        LEFT JOIN (SELECT DATE(dibuat) h, COUNT(*) n FROM pengguna GROUP BY h) u ON u.h = t.hari
        LEFT JOIN (SELECT DATE(dibuat) h, COUNT(*) n FROM aset GROUP BY h) a ON a.h = t.hari
        ORDER BY t.hari")->fetchAll();
    de_csv('dompetemas-harian.csv', ['Tanggal', 'Pengguna baru', 'Aset baru'], $r);
}
if ($csv === 'kontak') {
    $r = $db->query('SELECT email, DATE(dibuat) FROM pengguna WHERE boleh_dihubungi = 1 ORDER BY id')->fetchAll();
    de_csv('dompetemas-kontak-setuju.csv', ['Email', 'Tanggal daftar'], $r);
}

$satu = fn(string $sql) => $db->query($sql)->fetchColumn();
de_json(['ok' => true,
    'pengguna' => (int) $satu('SELECT COUNT(*) FROM pengguna'),
    'pengguna_7hari' => (int) $satu("SELECT COUNT(*) FROM pengguna WHERE dibuat > NOW() - INTERVAL 7 DAY"),
    'aktif_7hari' => (int) $satu("SELECT COUNT(*) FROM pengguna WHERE terakhir_masuk > NOW() - INTERVAL 7 DAY"),
    'boleh_dihubungi' => (int) $satu('SELECT COUNT(*) FROM pengguna WHERE boleh_dihubungi = 1'),
    'aset' => (int) $satu('SELECT COUNT(*) FROM aset'),
    'gram_perhiasan' => (float) $satu("SELECT COALESCE(SUM(berat),0) FROM aset WHERE jenis='perhiasan'"),
    'per_kadar' => $db->query("SELECT kadar, COUNT(*) jumlah, ROUND(SUM(berat),2) gram FROM aset WHERE jenis='perhiasan' GROUP BY kadar ORDER BY jumlah DESC")->fetchAll(),
    'per_merek' => $db->query("SELECT merek, COUNT(*) jumlah, SUM(keping) keping FROM aset WHERE jenis='batangan' GROUP BY merek ORDER BY jumlah DESC")->fetchAll(),
]);

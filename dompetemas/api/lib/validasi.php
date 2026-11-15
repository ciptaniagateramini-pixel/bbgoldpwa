<?php
/** Validasi input aset (murni, bisa diuji tanpa database). */
declare(strict_types=1);

const DE_BENTUK = ['Cincin', 'Kalung', 'Gelang', 'Anting', 'Liontin', 'Lainnya'];
const DE_MEREK = ['Antam', 'UBS', 'Hartadinata'];

function de_email_valid(string $e): ?string
{
    $e = strtolower(trim($e));
    if (strlen($e) > 190 || !filter_var($e, FILTER_VALIDATE_EMAIL)) return null;
    return $e;
}

/**
 * @return array{0: ?array, 1: array<string,string>} [data bersih, kesalahan]
 */
function de_validasi_aset(array $in, int $tahunIni): array
{
    $err = [];
    $jenis = $in['jenis'] ?? '';
    if (!in_array($jenis, ['perhiasan', 'batangan'], true)) return [null, ['jenis' => 'Jenis emas tidak valid.']];
    $nama = trim(preg_replace('/\s+/u', ' ', (string) ($in['nama'] ?? '')) ?? '');
    $nama = preg_replace('/[\x00-\x1F\x7F<>]/u', '', $nama) ?? '';
    if (mb_strlen($nama) > 60) $err['nama'] = 'Nama maksimal 60 huruf.';
    $tahun = filter_var($in['tahun'] ?? null, FILTER_VALIDATE_INT);
    if ($tahun === false || $tahun < 1970 || $tahun > $tahunIni) $err['tahun'] = 'Tahun beli tidak valid.';
    $beli = filter_var($in['harga_beli'] ?? null, FILTER_VALIDATE_INT);
    if ($beli === false || $beli < 1000 || $beli > 100000000000) $err['harga_beli'] = 'Harga beli tidak valid.';
    $d = ['jenis' => $jenis, 'nama' => $nama, 'tahun' => (int) $tahun, 'harga_beli' => (int) $beli,
        'bentuk' => null, 'kadar' => null, 'sub' => null, 'berat' => null, 'merek' => null, 'pecahan' => null, 'keping' => null];
    if ($jenis === 'perhiasan') {
        $bentuk = (string) ($in['bentuk'] ?? '');
        if (!in_array($bentuk, DE_BENTUK, true)) $err['bentuk'] = 'Pilih bentuk perhiasan.';
        $kadar = (string) ($in['kadar'] ?? '');
        if (!preg_match('/^[0-9]{1,3}(K|%)?$/', $kadar)) $err['kadar'] = 'Pilih kadar.';
        $sub = (string) ($in['sub'] ?? '');
        if (!preg_match('/^[A-Za-z][A-Za-z \-]{0,29}$|^-$/', $sub)) $err['sub'] = 'Pilih jenis.';
        $berat = is_numeric($in['berat'] ?? null) ? round((float) $in['berat'], 3) : 0.0;
        if (!($berat > 0 && $berat <= 10000)) $err['berat'] = 'Berat tidak valid.';
        $d = array_merge($d, ['bentuk' => $bentuk, 'kadar' => $kadar, 'sub' => $sub, 'berat' => $berat]);
    } else {
        $merek = (string) ($in['merek'] ?? '');
        if (!in_array($merek, DE_MEREK, true)) $err['merek'] = 'Pilih merek.';
        $pecahan = (string) ($in['pecahan'] ?? '');
        if (!preg_match('/^[0-9]{1,3}(,[0-9]{1,2})? g$/', $pecahan)) $err['pecahan'] = 'Pilih pecahan.';
        $keping = filter_var($in['keping'] ?? null, FILTER_VALIDATE_INT);
        if ($keping === false || $keping < 1 || $keping > 1000) $err['keping'] = 'Jumlah keping tidak valid.';
        $d = array_merge($d, ['merek' => $merek, 'pecahan' => $pecahan, 'keping' => (int) $keping]);
    }
    return [$err ? null : $d, $err];
}

/** Saring respons API harga BB GOLD ke field publik saja. */
function de_saring_harga($h, $r): ?array
{
    if (!is_array($h) || ($h['ok'] ?? null) !== true || !is_array($h['items'] ?? null)) return null;
    $items = [];
    foreach ($h['items'] as $it) {
        if (!is_array($it)) continue;
        $k = (string) ($it['kadar'] ?? ''); $j = (string) ($it['jenis'] ?? ''); $p = $it['hargaPerGram'] ?? null;
        if (!preg_match('/^[0-9]{1,3}(K|%)?$/', $k) || !preg_match('/^[A-Za-z][A-Za-z \-]{0,29}$|^-$/', $j) || !is_int($p) || $p < 1000 || $p > 5000000) continue;
        $items[] = ['kadar' => $k, 'jenis' => $j, 'hargaPerGram' => $p];
    }
    if (!$items) return null;
    $ref = [];
    foreach (['antam', 'ubs', 'hartadinata'] as $m) {
        $s = is_array($r) ? ($r[$m] ?? null) : null;
        if (!is_array($s)) { $ref[$m] = null; continue; }
        $li = [];
        foreach (($s['items'] ?? []) as $it) {
            if (!is_array($it)) continue;
            $l = (string) ($it['label'] ?? ''); $v = $it['harga'] ?? null;
            if (preg_match('/^[0-9]{1,3}(,[0-9]{1,2})?\s?(g|gr|gram)$/i', $l) && is_int($v) && $v >= 1000 && $v <= 1000000000) $li[] = ['label' => $l, 'harga' => $v];
        }
        $ref[$m] = ['tanggal' => is_string($s['tanggal'] ?? null) ? $s['tanggal'] : null, 'basi' => (bool) ($s['basi'] ?? true), 'items' => $li];
    }
    $iso = is_string($h['ditetapkanPada'] ?? null) && preg_match('/^\d{4}-\d{2}-\d{2}T/', $h['ditetapkanPada']) ? $h['ditetapkanPada'] : null;
    return ['perhiasan' => ['ditetapkanPada' => $iso, 'items' => $items], 'batangan' => $ref];
}

<?php
/**
 * DTO allowlist (lapisan kedua). Semua keluaran dibangun ulang dari nol:
 * field yang tidak dikenal TIDAK PERNAH diteruskan ke browser.
 */
declare(strict_types=1);

const BB_HARGA_MIN = 1000;        // Rp/gram, batas bawah masuk akal
const BB_HARGA_MAX = 5000000;     // Rp/gram, batas atas masuk akal (di atas harga emas murni)
const BB_KEPING_MAX = 1000000000; // Rp per keping (100 g) batas atas

function bb_log(string $pesan): void
{
    error_log('[bbgold] ' . $pesan);
}

/** Validasi kadar: "300", "14K", "80%" dsb. */
function bb_kadar_valid(string $k): bool
{
    return (bool) preg_match('/^[0-9]{1,3}(K|%)?$/', $k);
}

function bb_jenis_valid(string $j): bool
{
    return (bool) preg_match('/^[A-Za-z][A-Za-z \-]{0,29}$|^-$/', $j);
}

/** ISO 8601 dengan zona +07:00 atau null. */
function bb_iso_valid($v): ?string
{
    if (!is_string($v)) return null;
    if (!preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?\+07:00$/', $v)) return null;
    $d = DateTimeImmutable::createFromFormat(DATE_ATOM, strlen($v) === 22 ? substr($v, 0, 16) . ':00+07:00' : $v);
    return $d ? $d->format('Y-m-d\TH:i:sP') : null;
}

/**
 * @param mixed $raw hasil json_decode dari skrip 1
 * @return array{ditetapkanPada: ?string, items: list<array{kadar:string,jenis:string,hargaPerGram:int}>}|null
 */
function bb_dto_harga($raw): ?array
{
    if (!is_array($raw) || ($raw['ok'] ?? null) !== true || !isset($raw['items']) || !is_array($raw['items'])) {
        return null;
    }
    $items = [];
    foreach ($raw['items'] as $i => $row) {
        if (!is_array($row)) { bb_log("baris $i bukan objek"); continue; }
        $kadar = is_scalar($row['kadar'] ?? null) ? trim((string) $row['kadar']) : '';
        $jenis = is_scalar($row['jenis'] ?? null) ? trim((string) $row['jenis']) : '';
        $harga = $row['hargaPerGram'] ?? null;
        if ($jenis === '') $jenis = '-';
        if (!bb_kadar_valid($kadar) || !bb_jenis_valid($jenis)) { bb_log("baris $i kadar/jenis tidak valid"); continue; }
        if (!is_int($harga) && !(is_float($harga) && is_finite($harga))) { bb_log("baris $i harga bukan angka"); continue; }
        $harga = (int) round($harga);
        if ($harga < BB_HARGA_MIN || $harga > BB_HARGA_MAX) { bb_log("baris $i harga di luar batas"); continue; }
        $items[] = ['kadar' => $kadar, 'jenis' => $jenis, 'hargaPerGram' => $harga];
    }
    if (!$items) return null;
    return ['ditetapkanPada' => bb_iso_valid($raw['ditetapkanPada'] ?? null), 'items' => $items];
}

const BB_BULAN = ['jan' => 1, 'feb' => 2, 'mar' => 3, 'apr' => 4, 'mei' => 5, 'may' => 5, 'jun' => 6, 'jul' => 7,
    'agu' => 8, 'agt' => 8, 'aug' => 8, 'sep' => 9, 'okt' => 10, 'oct' => 10, 'nov' => 11, 'des' => 12, 'dec' => 12];

/** "13 November 2026 (...)" / "13 Nov 2026 08.39 WIB" -> "2026-11-13" atau null */
function bb_tanggal_id(string $s): ?string
{
    if (!preg_match('/(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})/', $s, $m)) return null;
    $b = BB_BULAN[strtolower(substr($m[2], 0, 3))] ?? null;
    if (!$b || !checkdate($b, (int) $m[1], (int) $m[3])) return null;
    return sprintf('%04d-%02d-%02d', (int) $m[3], $b, (int) $m[1]);
}

/** Keterangan aman: pendek, tanpa kata potongan/margin. */
function bb_keterangan(string $s): string
{
    $s = trim(preg_replace('/\s+/', ' ', $s) ?? '');
    if ($s === '' || preg_match('/potongan|margin|hitung|bb gold/i', $s)) {
        $t = bb_tanggal_id($s);
        return $t ?? '';
    }
    return mb_substr($s, 0, 120);
}

function bb_dto_sumber($raw, string $hariIni, bool $hanyaHariIni = false): ?array
{
    if (!is_array($raw)) return null;
    $ket = is_string($raw['keterangan'] ?? null) ? bb_keterangan($raw['keterangan']) : '';
    $tanggal = bb_tanggal_id($ket);
    $items = [];
    foreach (($raw['items'] ?? []) as $row) {
        if (!is_array($row)) continue;
        $label = is_string($row['label'] ?? null) ? trim($row['label']) : '';
        $harga = $row['harga'] ?? null;
        if (!preg_match('/^[0-9]{1,3}(,[0-9]{1,2})?\s?(g|gr|gram)$/i', $label)) continue;
        if (!is_int($harga) && !is_float($harga)) continue;
        $harga = (int) round($harga);
        if ($harga < BB_HARGA_MIN || $harga > BB_KEPING_MAX) continue;
        $items[] = ['label' => $label, 'harga' => $harga];
    }
    $basi = $tanggal !== $hariIni;
    if ($hanyaHariIni && $basi) $items = []; // Redmark: angka basi tidak dikirim
    return ['tanggal' => $tanggal, 'keterangan' => $ket, 'basi' => $basi, 'items' => $items];
}

function bb_dto_referensi($raw, string $hariIni): ?array
{
    if (!is_array($raw) || ($raw['ok'] ?? null) !== true) return null;
    return [
        'hartadinata' => bb_dto_sumber($raw['hartadinata'] ?? null, $hariIni),
        'antam' => bb_dto_sumber($raw['antam'] ?? null, $hariIni),
        'ubs' => bb_dto_sumber($raw['ubs'] ?? null, $hariIni),
        'redmark' => bb_dto_sumber($raw['redmark'] ?? null, $hariIni, true),
    ];
}

/** Normalisasi nomor WA Indonesia ke +628xxxxxxxx; null bila tidak valid. */
function bb_normalisasi_wa(string $in): ?string
{
    $d = preg_replace('/[\s\-().]/', '', $in) ?? '';
    if (str_starts_with($d, '+')) $d = substr($d, 1);
    if (!ctype_digit($d)) return null;
    if (str_starts_with($d, '62')) $d = substr($d, 2);
    elseif (str_starts_with($d, '0')) $d = substr($d, 1);
    if (!preg_match('/^8[0-9]{7,12}$/', $d)) return null;
    return '+62' . $d;
}

/** Bulatkan ke bawah ke Rp1.000 terdekat. */
function bb_bulat_bawah(float $x): int
{
    return (int) (floor($x / 1000) * 1000);
}

function bb_rupiah(int $n): string
{
    return 'Rp ' . number_format($n, 0, ',', '.');
}

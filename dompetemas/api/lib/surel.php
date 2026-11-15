<?php
/** Kirim email lewat SMTP (SSL 465) akun email Hostinger. Mode 'file' untuk uji lokal. */
declare(strict_types=1);

function de_kirim_email(string $ke, string $judul, string $teks, string $html): bool
{
    $m = (array) (de_config()['mail'] ?? []);
    $mode = $m['mode'] ?? 'smtp';
    if ($mode === 'file') {
        file_put_contents(de_config()['cache_dir'] . '/surel.log', json_encode(['ke' => $ke, 'judul' => $judul, 'teks' => $teks]) . "\n", FILE_APPEND | LOCK_EX);
        return true;
    }
    $dari = (string) ($m['from'] ?? '');
    $nama = (string) ($m['from_name'] ?? 'Dompet Emas');
    $batas = 'b' . bin2hex(random_bytes(8));
    if ($mode === 'mailapi') {
        // Hostinger Mail API: kirim dari kotak email (token khusus satu kotak, tanpa password).
        $url = 'https://api.mail.hostinger.com/api/v1/mailboxes/' . rawurlencode((string) $m['mailbox_id']) . '/send';
        $ch = curl_init($url);
        curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_POST => true, CURLOPT_CONNECTTIMEOUT => 8, CURLOPT_TIMEOUT => 20,
            CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . $m['api_token'], 'Content-Type: application/json', 'Accept: application/json'],
            CURLOPT_POSTFIELDS => json_encode(['to' => [$ke], 'displayName' => $nama, 'subject' => $judul, 'text' => $teks, 'html' => $html])]);
        $b = curl_exec($ch); $kode = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE); curl_close($ch);
        if ($kode >= 200 && $kode < 300) return true;
        de_log('mail api gagal ' . $kode . ' ' . substr((string) $b, 0, 200));
        return false;
    }
    if ($mode === 'phpmail') {
        // Cadangan: fungsi mail() server hosting (tanpa kotak email).
        $kepala = 'From: ' . de_hdr($nama) . " <$dari>\r\n" . "Reply-To: $dari\r\n" . "MIME-Version: 1.0\r\n"
            . "Content-Type: multipart/alternative; boundary=\"$batas\"";
        $isi = "--$batas\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n" . chunk_split(base64_encode($teks))
            . "--$batas\r\nContent-Type: text/html; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n" . chunk_split(base64_encode($html)) . "--$batas--\r\n";
        $ok = @mail($ke, de_hdr($judul), $isi, $kepala, '-f' . $dari);
        if (!$ok) de_log('mail() gagal');
        return $ok;
    }
    $pesan = 'From: ' . de_hdr($nama) . " <$dari>\r\n"
        . "To: <$ke>\r\n"
        . 'Subject: ' . de_hdr($judul) . "\r\n"
        . 'Date: ' . date(DATE_RFC2822) . "\r\n"
        . 'Message-ID: <' . bin2hex(random_bytes(12)) . '@' . substr(strrchr($dari, '@') ?: '@localhost', 1) . ">\r\n"
        . "MIME-Version: 1.0\r\n"
        . "Content-Type: multipart/alternative; boundary=\"$batas\"\r\n\r\n"
        . "--$batas\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n" . chunk_split(base64_encode($teks))
        . "--$batas\r\nContent-Type: text/html; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n" . chunk_split(base64_encode($html))
        . "--$batas--\r\n";
    try {
        $s = @stream_socket_client('ssl://' . $m['host'] . ':' . (int) ($m['port'] ?? 465), $no, $err, 15);
        if (!$s) throw new RuntimeException("sambung: $err");
        stream_set_timeout($s, 15);
        de_smtp($s, null, 220);
        de_smtp($s, 'EHLO ' . (gethostname() ?: 'localhost'), 250);
        de_smtp($s, 'AUTH LOGIN', 334);
        de_smtp($s, base64_encode((string) $m['user']), 334);
        de_smtp($s, base64_encode((string) $m['pass']), 235);
        de_smtp($s, "MAIL FROM:<$dari>", 250);
        de_smtp($s, "RCPT TO:<$ke>", 250);
        de_smtp($s, 'DATA', 354);
        $isi = preg_replace('/^\./m', '..', $pesan);
        de_smtp($s, $isi . "\r\n.", 250);
        de_smtp($s, 'QUIT', 221);
        fclose($s);
        return true;
    } catch (Throwable $e) {
        de_log('email gagal: ' . $e->getMessage());
        return false;
    }
}

function de_hdr(string $s): string { return '=?UTF-8?B?' . base64_encode($s) . '?='; }

function de_smtp($s, ?string $perintah, int $harap): void
{
    if ($perintah !== null) fwrite($s, $perintah . "\r\n");
    $balas = '';
    while (($baris = fgets($s, 1024)) !== false) {
        $balas .= $baris;
        if (strlen($baris) < 4 || $baris[3] === ' ') break;
    }
    if ((int) substr($balas, 0, 3) !== $harap) throw new RuntimeException('smtp: ' . trim(substr($balas, 0, 120)));
}

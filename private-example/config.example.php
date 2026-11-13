<?php
/**
 * SALIN berkas ini ke Hostinger, DI LUAR public_html:
 *   domains/tokobbgold.dwabussines.com/bbgold-private/config.php
 * Jangan pernah dimasukkan ke repositori, JavaScript, atau chat.
 */
return [
    // URL /exec Skrip 1 (Sheet harga)
    'harga_exec_url' => 'https://script.google.com/macros/s/GANTI_DENGAN_ID_SKRIP_1/exec',
    // URL /exec Skrip 2 (Sheet Leads)
    'leads_exec_url' => 'https://script.google.com/macros/s/GANTI_DENGAN_ID_SKRIP_2/exec',
    // Sama persis dengan Script properties TOKEN di Skrip 2 (minimal 32 karakter)
    'leads_token' => 'GANTI_DENGAN_TOKEN',
    // Garam untuk hash IP (isi teks acak panjang, cukup sekali)
    'salt' => 'GANTI_DENGAN_TEKS_ACAK_PANJANG',
    'allowed_origins' => ['https://tokobbgold.dwabussines.com'],
    'cache_ttl' => 300,
    'batas_ip_per_jam' => 10,
    'batas_perangkat_per_jam' => 5,
];

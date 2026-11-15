<?php
/** Salin ke domains/dompetemas.dwabussines.com/dompetemas-private/config.php (DI LUAR public_html). */
return [
    'db_dsn' => 'mysql:host=127.0.0.1;port=3306;dbname=GANTI;charset=utf8mb4',
    'db_user' => 'GANTI',
    'db_pass' => 'GANTI',
    'salt' => 'GANTI_DENGAN_TEKS_ACAK_PANJANG',
    // mode: 'mailapi' (Hostinger Mail API, token khusus satu kotak email), 'smtp', atau 'phpmail' (cadangan)
    'mail' => ['mode' => 'mailapi', 'mailbox_id' => 'GANTI', 'api_token' => 'GANTI', 'from' => 'customerservice@dwabussines.com', 'from_name' => 'Dompet Emas'],
    'allowed_origins' => ['https://dompetemas.dwabussines.com'],
    'admin_emails' => [],
    'cookie_secure' => true,
    'harga_url' => 'https://tokobbgold.dwabussines.com/api/harga.php',
    'cache_ttl' => 300,
];

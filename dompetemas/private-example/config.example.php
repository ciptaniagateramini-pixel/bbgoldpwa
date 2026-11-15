<?php
/** Salin ke domains/dompetemas.dwabussines.com/dompetemas-private/config.php (DI LUAR public_html). */
return [
    'db_dsn' => 'mysql:host=127.0.0.1;port=3306;dbname=GANTI;charset=utf8mb4',
    'db_user' => 'GANTI',
    'db_pass' => 'GANTI',
    'salt' => 'GANTI_DENGAN_TEKS_ACAK_PANJANG',
    'mail' => ['mode' => 'smtp', 'host' => 'smtp.hostinger.com', 'port' => 465, 'user' => 'noreply@dwabussines.com', 'pass' => 'GANTI', 'from' => 'noreply@dwabussines.com', 'from_name' => 'Dompet Emas'],
    'allowed_origins' => ['https://dompetemas.dwabussines.com'],
    'admin_emails' => ['customerservice@dwabussines.com'],
    'cookie_secure' => true,
    'harga_url' => 'https://tokobbgold.dwabussines.com/api/harga.php',
    'cache_ttl' => 300,
];

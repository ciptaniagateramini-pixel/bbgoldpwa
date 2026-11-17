#!/usr/bin/env bash
# Situs lokal Dompet Emas: dist/ + api/ + tiruan BB GOLD + MariaDB lokal (db dompetemas).
set -euo pipefail
cd "$(dirname "$0")/.."
PORT="${PORT:-8282}"; MOCK="${MOCK_PORT:-8292}"
mkdir -p .local/private
cat > .local/private/config.php <<PHP
<?php return [
  'db_dsn' => 'mysql:host=127.0.0.1;port=3306;dbname=${DB_NAME:-dompetemas};charset=utf8mb4', 'db_user' => 'de', 'db_pass' => 'lokalsaja',
  'salt' => 'lokal-uji', 'mail' => ['mode' => 'file'],
  'allowed_origins' => ['http://127.0.0.1:${PORT}'], 'admin_emails' => ['admin@contoh.id'],
  'cookie_secure' => false, 'harga_url' => 'http://127.0.0.1:${MOCK}/harga.php', 'cache_ttl' => 0,
];
PHP
php -S 127.0.0.1:${MOCK} dev/${MOCK_FILE:-mock-bbgold.php} >/dev/null 2>&1 & M=$!
trap 'kill $M 2>/dev/null' EXIT
echo "Dompet Emas lokal: http://127.0.0.1:${PORT}"
DE_CONFIG="$PWD/.local/private/config.php" php -S 127.0.0.1:${PORT} -t dist dev/router.php

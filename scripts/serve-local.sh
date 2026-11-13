#!/usr/bin/env bash
# Menjalankan situs secara lokal: dist/ + api/ (PHP) + tiruan Apps Script.
# Tidak menyentuh Hostinger.
set -euo pipefail
cd "$(dirname "$0")/.."
PORT="${PORT:-8080}"
MOCK_PORT="${MOCK_PORT:-8090}"
mkdir -p .local/site .local/private/cache
# susun seperti public_html
rm -rf .local/site/*
cp -r dist/. .local/site/
cp -r api .local/site/api
cat > .local/private/config.php <<PHP
<?php return [
  'harga_exec_url' => 'http://127.0.0.1:${MOCK_PORT}/harga/exec',
  'leads_exec_url' => 'http://127.0.0.1:${MOCK_PORT}/leads/exec',
  'leads_token' => '$(printf 't%.0s' {1..40})',
  'salt' => 'lokal',
  'allowed_origins' => ['http://127.0.0.1:${PORT}', 'http://localhost:${PORT}'],
  'cache_ttl' => \${CACHE_TTL:-300},
  'batas_ip_per_jam' => 1000,
  'batas_perangkat_per_jam' => 1000,
];
PHP
sed -i "s/\${CACHE_TTL:-300}/${CACHE_TTL:-300}/" .local/private/config.php
php -S 127.0.0.1:${MOCK_PORT} dev/mock-exec.php >/dev/null 2>&1 &
MOCK_PID=$!
trap 'kill $MOCK_PID 2>/dev/null' EXIT
echo "Situs lokal: http://127.0.0.1:${PORT}"
BBGOLD_CONFIG="$PWD/.local/private/config.php" php -S 127.0.0.1:${PORT} -t .local/site dev/router.php

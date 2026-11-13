#!/usr/bin/env bash
# Menyiapkan (dan opsional mengunggah) isi public_html untuk tokobbgold.dwabussines.com.
#
# Pemakaian:
#   bash scripts/deploy.sh --domain tokobbgold.dwabussines.com --confirm-backup            # hanya membuat paket
#   bash scripts/deploy.sh --domain tokobbgold.dwabussines.com --confirm-backup --upload   # + unggah via Hostinger CLI
#
# Pengaman:
# - Menolak berjalan tanpa --confirm-backup (pemilik sudah menyatakan cadangan situs lama diambil).
# - Menolak domain selain persis tokobbgold.dwabussines.com.
# - Hanya isi public_html subdomain itu yang diganti. Domain, DNS, SSL, dan situs lain tidak disentuh.
# - Tidak pernah membaca credentials.php atau berkas situs lama.
set -euo pipefail
cd "$(dirname "$0")/.."

TARGET="tokobbgold.dwabussines.com"
DOMAIN=""; CONFIRM=0; UPLOAD=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --domain) DOMAIN="${2:-}"; shift 2 ;;
    --confirm-backup) CONFIRM=1; shift ;;
    --upload) UPLOAD=1; shift ;;
    *) echo "Argumen tidak dikenal: $1" >&2; exit 2 ;;
  esac
done

if [[ "$CONFIRM" != 1 ]]; then
  echo "DITOLAK: jalankan dengan --confirm-backup setelah pemilik menyatakan cadangan situs lama sudah diambil." >&2; exit 1
fi
if [[ "$DOMAIN" != "$TARGET" ]]; then
  echo "DITOLAK: domain tujuan harus persis $TARGET (diberikan: '${DOMAIN}')." >&2; exit 1
fi

echo "> Build dan tes"
npm run build
npm test
node tests/e2e/run.mjs

echo "> Menyusun paket"
OUT="release/public_html"
rm -rf release && mkdir -p "$OUT"
cp -r dist/. "$OUT/"
mkdir -p "$OUT/api"
cp api/harga.php api/lead.php api/.htaccess "$OUT/api/"
cp -r api/lib "$OUT/api/lib"
# pastikan tidak ada rahasia/berkas pengembangan ikut
if grep -rlE "leads_token'\s*=>\s*'[^G]|config\.php" "$OUT" --include=*.js --include=*.html >/dev/null 2>&1; then
  echo "DITOLAK: paket memuat sesuatu yang mirip rahasia." >&2; exit 1
fi
(cd release && zip -qr public_html.zip public_html)
echo "Paket: release/public_html.zip ($(du -h release/public_html.zip | cut -f1))"

if [[ "$UPLOAD" == 1 ]]; then
  command -v hostinger >/dev/null || { echo "Hostinger CLI tidak terpasang; unggah release/public_html.zip lewat hPanel File Manager." >&2; exit 1; }
  hostinger up "$OUT" --domain "$TARGET" --dry-run --format json
  read -r -p "Ketik GANTI untuk mengganti isi public_html $TARGET: " jawab
  [[ "$jawab" == "GANTI" ]] || { echo "Dibatalkan."; exit 1; }
  hostinger up "$OUT" --domain "$TARGET" --yes --format json
fi

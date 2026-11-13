<?php
// Router php -S yang meniru .htaccess produksi: SPA fallback + header keamanan + blokir api/lib.
$root = $_SERVER['DOCUMENT_ROOT'];
$path = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));
if (str_starts_with($path, '/api/lib')) { http_response_code(403); exit; }
if (str_starts_with($path, '/api/')) {
    $f = $root . $path;
    if (is_file($f) && str_ends_with($f, '.php')) { chdir(dirname($f)); require $f; return true; }
    http_response_code(404); exit;
}
$csp = file_get_contents(__DIR__ . '/../scripts/csp.txt');
header('Content-Security-Policy: ' . trim($csp));
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');
if ($path !== '/' && is_file($root . $path)) return false;
if (preg_match('/\.[a-z0-9]+$/i', $path)) { http_response_code(404); exit; }
header('Content-Type: text/html; charset=utf-8');
readfile($root . '/index.html');
return true;

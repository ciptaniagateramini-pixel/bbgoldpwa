<?php
$root = $_SERVER['DOCUMENT_ROOT'];
$path = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));
if (strncmp($path, '/api/lib', 8) === 0) { http_response_code(403); exit; }
if (strncmp($path, '/api/', 5) === 0) {
    $f = dirname(__DIR__) . $path;
    if (is_file($f) && substr($f, -4) === '.php') { chdir(dirname($f)); require $f; return true; }
    http_response_code(404); exit;
}
header('Content-Security-Policy: ' . trim((string) @file_get_contents(dirname(__DIR__) . '/scripts/csp.txt')));
if ($path !== '/' && is_file($root . $path)) return false;
if (preg_match('/\.[a-z0-9]+$/i', $path)) { http_response_code(404); exit; }
header('Content-Type: text/html; charset=utf-8');
readfile($root . '/index.html');
return true;

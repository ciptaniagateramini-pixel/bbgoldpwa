<?php
// Tiruan BB GOLD dari salinan respons asli (.local/*_live.json) untuk rekaman video.
header('Content-Type: application/json');
$d = dirname(__DIR__) . '/.local/';
readfile($d . ((($_GET['data'] ?? '') === 'referensi') ? 'ref_live.json' : 'harga_live.json'));

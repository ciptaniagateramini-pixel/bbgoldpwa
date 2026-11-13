// Membuat dist/sw.js (daftar precache) dan dist/.htaccess (header keamanan + SPA fallback).
import { readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createHash } from 'node:crypto';

const dist = new URL('../dist/', import.meta.url).pathname;
const files = [];
(function walk(d) {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) walk(p);
    else files.push('/' + relative(dist, p));
  }
})(dist);

const precache = files.filter((f) => !f.endsWith('.htaccess') && f !== '/sw.js' && !f.startsWith('/api/') && !/\.(woff|ttf|eot)$/.test(f) && !/latin-ext|cyrillic|greek|vietnamese|devanagari/.test(f));
const hash = createHash('sha256');
for (const f of precache) hash.update(f + readFileSync(join(dist, f)).length);
const versi = hash.digest('hex').slice(0, 12);

const tpl = readFileSync(new URL('./sw.template.js', import.meta.url), 'utf8');
writeFileSync(join(dist, 'sw.js'), tpl.replace('__VERSI__', versi).replace('__DAFTAR__', JSON.stringify(precache.map((f) => (f === '/index.html' ? '/index.html' : f)))));

const csp = readFileSync(new URL('./csp.txt', import.meta.url), 'utf8').trim();
writeFileSync(join(dist, '.htaccess'), `# Dibuat otomatis oleh scripts/build-sw.mjs
Options -Indexes
DirectoryIndex index.html

<IfModule mod_rewrite.c>
  RewriteEngine On
  # HTTPS wajib
  RewriteCond %{HTTPS} !=on
  RewriteCond %{HTTP:X-Forwarded-Proto} !https
  RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
  # berkas tersembunyi & folder rahasia
  RewriteRule (^|/)\\. - [F,L]
  RewriteRule ^(bbgold-private|cache|private)(/|$) - [F,L]
  RewriteRule ^api/lib(/|$) - [F,L]
  # SPA fallback
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_URI} !^/api/
  RewriteRule ^ /index.html [L]
</IfModule>

<IfModule mod_headers.c>
  Header always set Content-Security-Policy "${csp}"
  Header always set X-Content-Type-Options "nosniff"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
  Header always set Strict-Transport-Security "max-age=31536000"
  Header always set Permissions-Policy "camera=(), microphone=(), geolocation=()"
  <FilesMatch "^(sw\\.js|index\\.html)$">
    Header set Cache-Control "no-cache"
  </FilesMatch>
  <FilesMatch "\\.(js|css|woff2|png|svg)$">
    Header set Cache-Control "public, max-age=31536000, immutable"
  </FilesMatch>
  <FilesMatch "^(sw\\.js|toko\\.json|cap-pabrik\\.json|manifest\\.webmanifest)$">
    Header set Cache-Control "no-cache"
  </FilesMatch>
</IfModule>

AddType application/manifest+json .webmanifest
`);
console.log(`sw.js versi ${versi}, precache ${precache.length} berkas; .htaccess dibuat`);

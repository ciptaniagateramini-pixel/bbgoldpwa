// Build Dompet Emas: vite + .htaccess (keamanan & SPA fallback).
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
const root = new URL('..', import.meta.url).pathname;
execSync('npx tsc -p web/tsconfig.json --noEmit && npx vite build --config web/vite.config.ts', { cwd: root, stdio: 'inherit' });
const csp = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; worker-src 'self'; manifest-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'";
writeFileSync(root + 'dist/.htaccess', `Options -Indexes
DirectoryIndex index.html
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteCond %{HTTPS} !=on
  RewriteCond %{HTTP:X-Forwarded-Proto} !https
  RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
  RewriteRule (^|/)\\. - [F,L]
  RewriteRule ^api/lib(/|$) - [F,L]
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
  Header always set X-Frame-Options "DENY"
  Header always set Permissions-Policy "camera=(), microphone=(), geolocation=()"
  <FilesMatch "^index\\.html$">
    Header set Cache-Control "no-cache"
  </FilesMatch>
  <FilesMatch "\\.(js|css|woff2|png|svg)$">
    Header set Cache-Control "public, max-age=31536000, immutable"
  </FilesMatch>
</IfModule>
AddType application/manifest+json .webmanifest
`);
writeFileSync(root + 'scripts/csp.txt', csp);
console.log('build + .htaccess selesai');

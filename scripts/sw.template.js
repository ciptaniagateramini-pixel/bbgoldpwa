/* BB GOLD service worker (dibuat otomatis oleh scripts/build-sw.mjs) */
const VERSI = '__VERSI__';
const PRECACHE = __DAFTAR__;
const C_STATIS = 'bb-statis-' + VERSI;
const C_API = 'bb-api-harga'; // hanya untuk mode offline

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(C_STATIS).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k.startsWith('bb-statis-') && k !== C_STATIS).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

function tandaiOffline(res) {
  const h = new Headers(res.headers);
  h.set('X-BB-Offline', '1');
  return res.blob().then((b) => new Response(b, { status: 200, headers: h }));
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return; // POST /api/lead.php tidak pernah disentuh
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname === '/api/lead.php') return; // jangan pernah di-cache

  if (url.pathname === '/api/harga.php') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) { const c = res.clone(); caches.open(C_API).then((x) => x.put(req, c)); }
          return res;
        })
        .catch(() => caches.open(C_API).then((x) => x.match(req)).then((r) => (r ? tandaiOffline(r) : Response.error()))),
    );
    return;
  }
  if (url.pathname.startsWith('/api/')) return;

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).catch(() => caches.match('/index.html').then((r) => r || caches.match('/offline.html'))),
    );
    return;
  }

  if (url.pathname.startsWith('/config/') || url.pathname === '/manifest.webmanifest') {
    e.respondWith(
      fetch(req)
        .then((res) => { const c = res.clone(); caches.open(C_STATIS).then((x) => x.put(req, c)); return res; })
        .catch(() => caches.match(req)),
    );
    return;
  }

  e.respondWith(
    caches.match(req).then((r) => r || fetch(req).then((res) => {
      if (res.ok && url.pathname.startsWith('/assets/')) { const c = res.clone(); caches.open(C_STATIS).then((x) => x.put(req, c)); }
      return res;
    })),
  );
});

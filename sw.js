const CACHE_NAME = 'hydration-tracker-v2';

// helper: build URLs relative to the SW scope (works on GitHub Pages /subpath/)
function withBase(pathname) {
  const basePath = new URL(self.registration.scope).pathname; // e.g. "/" or "/REPO/"
  const base = basePath.endsWith('/') ? basePath : basePath + '/';
  return base + pathname.replace(/^\//, '');
}

const urlsToCache = [
  withBase(''),
  withBase('index.html'),
  withBase('add-drink.html'),
  withBase('statistics.html'),
  withBase('settings.html'),
  withBase('offline.html'),
  withBase('css/styles.css'),
  withBase('js/app.js'),
  withBase('js/db.js'),
  withBase('js/navbar.js'),
  withBase('js/sw-register.js'),
  withBase('js/settings.js'),
  withBase('manifest.json'),
  withBase('icons/icon-192.png'),
  withBase('icons/icon-512.png'),
  withBase('favicon.ico')
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // ping.txt MUST be network-only (never from cache) — and must work under /REPO/ping.txt too
  if (url.origin === self.location.origin && url.pathname.endsWith('/ping.txt')) {
    event.respondWith(
      fetch(new Request(event.request, { cache: 'no-store' }))
        .then((res) => res)
        .catch(() => new Response('', { status: 503 }))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request).catch(() => {
        // navigation fallback
        if (event.request.mode === 'navigate') {
          return caches.match(withBase('offline.html'));
        }
        throw new Error('Network request failed');
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.map((name) => (name !== CACHE_NAME ? caches.delete(name) : null))))
      .then(() => self.clients.claim())
  );
});

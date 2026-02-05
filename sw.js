const CACHE_NAME = 'hydration-tracker-v4';
const CORE_ASSETS = [
  '/',                 // main entry (Netlify may map it)
  '/index.html',
  '/add-drink.html',
  '/statistics.html',
  '/settings.html',
  '/offline.html',
  '/css/styles.css',
  '/js/app.js',
  '/js/constants.js',
  '/js/utils.js',
  '/js/db.js',
  '/js/navbar.js',
  '/js/sw-register.js',
  '/js/settings.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/favicon.ico',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => (k !== CACHE_NAME ? caches.delete(k) : null))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // ping.txt — network only
  if (url.origin === self.location.origin && url.pathname.endsWith('/ping.txt')) {
    event.respondWith(fetch(event.request));
    return;
  }

 // Navigation requests: try network, fallback to cached page, then index.html, then offline.html
if (event.request.mode === 'navigate') {
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        return res;
      })
      .catch(async () => {
        // 1) пробуємо саме ту сторінку з кешу
        const cachedPage = await caches.match(event.request);
        if (cachedPage) return cachedPage;

        // 2) якщо нема — віддай index.html з кешу (app shell)
        const cachedIndex = await caches.match('/index.html');
        if (cachedIndex) return cachedIndex;

        // 3) останній варіант — offline.html
        return caches.match('/offline.html');
      })
  );
  return;
}

  // Static assets: cache-first
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
          }
          return res;
        })
        .catch(() => new Response('', { status: 504 })); // ALWAYS return a Response
    })
  );
});

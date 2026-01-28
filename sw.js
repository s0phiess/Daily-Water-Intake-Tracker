const CACHE_NAME = 'hydration-tracker-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/add-drink.html',
  '/statistics.html',
  '/settings.html',
  '/offline.html',
  '/css/styles.css',
  '/js/app.js',
  '/js/db.js',
  '/js/navbar.js',
  '/js/sw-register.js',
  '/js/settings.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/favicon.ico'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request).catch(() => {
          // For navigation requests, return offline.html
          if (event.request.mode === 'navigate') {
            return caches.match('/offline.html');
          }
          throw Error('Network request failed');
        });
      })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});
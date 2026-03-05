const CACHE_NAME = 'sw-kickoff-2026-wf-v7';
const RUNTIME_IMAGE_CACHE = 'sw-kickoff-2026-wf-images-v1';

// Minimal app-shell cache for true PWA behavior (offline + fast reload)
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './app.html',
  './styles.css?v=6',
  './app.js?v=6',
  './manifest.webmanifest',
  './icons/icon-192.svg',
  './icons/icon-512.svg',
  './assets/backgrounds/background-overlay.jpg',
  './assets/logos/logo-wf2026.png',
  './assets/logos/WF26.png',
  './assets/logos/SW.svg',
  './assets/data/agenda.js',
  './assets/data/participantes.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting()) // Força o novo SW a entrar em 'installed' e 'waiting' se tiver controle
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== RUNTIME_IMAGE_CACHE)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Listener para a mensagem de skipWaiting vinda do app.js
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;

  // Navigation requests (page loads) -> network first, fallback to cached shell
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(async () => {
          // Offline navigation fallback order
          return (
            (await caches.match(request, { ignoreSearch: true })) ||
            (await caches.match('./app.html')) ||
            (await caches.match('./index.html'))
          );
        })
    );
    return;
  }

  // Same-origin static assets -> stale-while-revalidate
  if (isSameOrigin) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(request);

        const networkPromise = fetch(request)
          .then((response) => {
            if (response && response.ok && response.type === 'basic') {
              cache.put(request, response.clone()).catch(() => { });
            }
            return response;
          })
          .catch(() => null);

        if (cachedResponse) {
          event.waitUntil(networkPromise);
          return cachedResponse;
        }

        const networkResponse = await networkPromise;
        return networkResponse || (await cache.match(request));
      })()
    );
    return;
  }

  // Cross-origin -> network only
  event.respondWith(fetch(request));
});

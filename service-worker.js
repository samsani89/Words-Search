const CACHE_NAME = 'perodua-engine-word-search-v5';
const APP_SHELL = './index.html';
const ASSETS = [APP_SHELL, './manifest.json', './cert.jpg'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;

      return fetch(request).then(response => {
        if (response.ok) {
          const copy = response.clone();
          event.waitUntil(
            caches.open(CACHE_NAME)
              .then(cache => cache.put(request, copy))
              .catch(error => console.error('Could not cache offline resource:', error))
          );
        }
        return response;
      }).catch(error => {
        if (request.mode === 'navigate') {
          return caches.match(APP_SHELL).then(shell => {
            if (shell) return shell;
            throw error;
          });
        }
        throw error;
      });
    })
  );
});

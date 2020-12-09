const PRECACHE = 'precache-v1';
const RUNTIME = 'runtime';
const DATA_CACHE_NAME = 'data-cache-v1'

const FILES_TO_CACHE = [
  '/',
  '/db.js',
  '/index.js',
  '/styles.css',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',


];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(PRECACHE)
      .then((cache) => cache.addAll(FILES_TO_CACHE))
      .then(self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  const currentCaches = [PRECACHE, RUNTIME];
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return cacheNames.filter((cacheName) => !currentCaches.includes(cacheName));
      })
      .then((cachesToDelete) => {
        return Promise.all(
          cachesToDelete.map((cacheToDelete) => {
            return caches.delete(cacheToDelete);
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.url.includes("/api/")) {
    event.respondWith(
      caches.open(DATA_CACHE_NAME).then((cache) => {
        return fetch(event.request).then(response => {
          if (response.status === 200) {
            cache.put(event.request.url, response.clone())
          }
          return response
        }).catch(err => {
          return cache.match(event.request)
        });
      }).catch(err => console.log(err))
    );
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request).then(response => {
        if (response) {
          return response
        }
        else if (event.request.headers.get("accept").includes("text/html")) {
          return caches.match("/")
        }
      });
    })
  )
})

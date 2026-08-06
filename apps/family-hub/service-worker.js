// Family Hub — basic service worker for offline shell caching
const CACHE_NAME = 'family-hub-v2';
const ASSETS = [
  '/apps/family-hub/',
  '/apps/family-hub/index.html',
  '/apps/family-hub/app.css',
  '/apps/family-hub/app.js',
  '/apps/family-hub/family.config.js',
  '/apps/family-hub/family.config.local.js',
  '/apps/family-hub/core/audio-fx.js',
  '/apps/family-hub/core/audit-log.js',
  '/apps/family-hub/core/auth.js',
  '/apps/family-hub/core/db.js',
  '/apps/family-hub/core/pin-security.js',
  '/apps/family-hub/core/store.js',
  '/shared/theme.css',
  'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;700&display=swap'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;

  // Never cache Firebase API calls
  if (request.url.includes('firebasedatabase.app') ||
      request.url.includes('googleapis.com') ||
      request.url.includes('googleusercontent.com')) {
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      return cached || fetch(request).then(response => {
        // Cache same-origin static assets on first fetch
        if (request.url.startsWith(self.location.origin)) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        }
        return response;
      }).catch(() => {
        // Offline fallback for navigation requests
        if (request.mode === 'navigate') {
          return caches.match('/apps/family-hub/index.html');
        }
        return new Response('Offline', { status: 503, statusText: 'Offline' });
      });
    })
  );
});

/**
 * Invoice App — Service Worker
 * Strategy: Stale-While-Revalidate for the app shell.
 *
 * On first load every asset (HTML, JS, CSS, fonts) is cached.
 * Subsequent navigations are served from cache instantly; the cache
 * is refreshed from the network in the background.
 * All data (invoices, profiles) lives in IndexedDB — fully offline by design.
 *
 * Cache versioning: bump CACHE_VERSION when deploying breaking changes.
 * The `activate` handler deletes all old caches automatically.
 */

const CACHE_VERSION = 'v2';
const CACHE_NAME    = `invoice-app-${CACHE_VERSION}`;

/** Resources to pre-cache on install (the minimal app shell). */
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/favicon.svg',
];

// ── Install ────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),   // activate immediately without waiting
  );
});

// ── Activate ───────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),  // take control of open tabs immediately
  );
});

// ── Fetch ──────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only intercept GET requests for same-origin resources.
  // Let cross-origin requests (fonts, CDN) pass through unmodified.
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // For HTML navigation requests (page loads / refreshes):
  // Try network first so the user always gets the freshest shell,
  // fall back to the cached shell when offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((c) => c.put(request, clone));
          return response;
        })
        .catch(() => caches.match('/index.html')),
    );
    return;
  }

  // For all other assets (JS, CSS, images, fonts):
  // Stale-while-revalidate — serve from cache immediately,
  // update the cache entry in the background.
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(request).then((cached) => {
        const networkFetch = fetch(request).then((response) => {
          // Only cache successful, non-opaque responses
          if (response.ok) {
            cache.put(request, response.clone());
          }
          return response;
        });
        // Return cached version instantly; network fetch updates in background
        return cached ?? networkFetch;
      }),
    ),
  );
});

/* DAWAYA | دوايا — Ultra-Fast Network-First Shell & Full Offline Service Worker (v5).
   - App Shell & Navigations (index.html): Network-First when online so every deployment
     appears IMMEDIATELY on first open, with instant 0ms fallback to SHELL_CACHE when offline.
   - Hashed Build Assets (/assets/*): Cache-First Immutable (0ms disk load).
   - Medicine Database Chunks & Search Index (/data/*): Stale-While-Revalidate for offline lookup.
   - Google Fonts & Static Media (icons, brand SVGs, images, audio): Cache-First with background refresh. */

const CACHE_PREFIX = 'dawaya-speed-cache-';
const STATIC_CACHE = CACHE_PREFIX + 'static-v8';
const SHELL_CACHE = CACHE_PREFIX + 'shell-v8';
const MEDIA_FONT_CACHE = CACHE_PREFIX + 'media-fonts-v8';
const ACTIVE_CACHES = [STATIC_CACHE, SHELL_CACHE, MEDIA_FONT_CACHE];

const OFFLINE_URL = './offline.html';
const PRECACHE_SHELL_URLS = [
  './',
  './index.html',
  './offline.html',
  './manifest.webmanifest',
  './favicon.svg',
  './favicon-192.png',
  './favicon-48.png',
  './apple-touch-icon.png',
  './brand/dawaya-icon.svg',
  './brand/dawaya-logo-horizontal.svg',
  './brand/dawaya-logo-dark.svg',
  './brand/dawaya-logo-light.svg',
  './data/dawaya_import_report.json',
];

async function warmupFromPrecacheManifest() {
  /* On-demand caching only: prevents saturating mobile 4G bandwidth on initial page load */
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) =>
        Promise.allSettled(
          PRECACHE_SHELL_URLS.map((u) => cache.add(new Request(u, { cache: 'reload' })))
        )
      )
      .then(() => warmupFromPrecacheManifest())
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (k) =>
                (k.startsWith(CACHE_PREFIX) || k.startsWith('aa-speed-cache-') || k.startsWith('aa-static-')) &&
                !ACTIVE_CACHES.includes(k)
            )
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
      .then(() => warmupFromPrecacheManifest())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'WARMUP_OFFLINE_CACHE') {
    event.waitUntil(warmupFromPrecacheManifest());
  }
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  if (url.hostname === 'fonts.gstatic.com' || url.hostname === 'fonts.googleapis.com') {
    event.respondWith(
      caches.open(MEDIA_FONT_CACHE).then((cache) =>
        cache.match(req).then((cached) => {
          const networkFetch = fetch(req)
            .then((res) => {
              if (res && res.status === 200) {
                cache.put(req, res.clone());
              }
              return res;
            })
            .catch(() => cached);
          return cached || networkFetch;
        })
      )
    );
    return;
  }

  if (url.origin !== self.location.origin) return;
  if (url.pathname.endsWith('app-version.json') || url.pathname.endsWith('precache-manifest.json')) return;

  if (req.mode === 'navigate') {
    event.respondWith(
      caches.open(SHELL_CACHE).then(async (cache) => {
        const cachedShell =
          (await cache.match('./index.html')) ||
          (await cache.match('./')) ||
          (await caches.match('./index.html'));

        const networkRefresh = fetch(req, { cache: 'no-cache' })
          .then((freshRes) => {
            if (freshRes && freshRes.status === 200 && freshRes.type === 'basic') {
              cache.put('./index.html', freshRes.clone());
            }
            return freshRes;
          })
          .catch(() => null);

        const timeoutFallback = new Promise((resolve) =>
          setTimeout(() => resolve(cachedShell), 1200)
        );
        const winner = await Promise.race([networkRefresh, timeoutFallback]);
        return winner || cachedShell || (await cache.match(OFFLINE_URL));
      })
    );
    return;
  }

  if (url.pathname.includes('/assets/') || /\.(js|css)$/i.test(url.pathname)) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const hit =
          (await cache.match(req)) || (await cache.match(req, { ignoreSearch: true }));
        if (hit) return hit;

        try {
          const res = await fetch(req);
          if (res && res.status === 200 && res.type === 'basic') {
            cache.put(req, res.clone());
          }
          return res;
        } catch (err) {
          const fallbackHit = await caches.match(req, { ignoreSearch: true });
          if (fallbackHit) return fallbackHit;
          throw err;
        }
      })
    );
    return;
  }

  if (/\.(png|svg|ico|jpg|jpeg|webp|wav|mp3|webmanifest|json)$/i.test(url.pathname)) {
    event.respondWith(
      caches.open(MEDIA_FONT_CACHE).then(async (cache) => {
        const cached = await cache.match(req);
        const fetchPromise = fetch(req)
          .then((res) => {
            if (res && res.status === 200 && res.type === 'basic') {
              cache.put(req, res.clone());
            }
            return res;
          })
          .catch(() => cached);
        return cached || fetchPromise;
      })
    );
  }
});

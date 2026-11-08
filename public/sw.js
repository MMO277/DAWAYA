/* DAWAYA | دوايا — Ultra-Fast Network-First Shell & Full Offline Service Worker (v5).
   - App Shell & Navigations (index.html): Network-First when online so every deployment
     appears IMMEDIATELY on first open, with instant 0ms fallback to SHELL_CACHE when offline.
   - Hashed Build Assets (/assets/*): Cache-First Immutable (0ms disk load).
   - Medicine Database Chunks & Search Index (/data/*): Stale-While-Revalidate for offline lookup.
   - Google Fonts & Static Media (icons, brand SVGs, images, audio): Cache-First with background refresh. */

const CACHE_PREFIX = 'dawaya-speed-cache-';
const STATIC_CACHE = CACHE_PREFIX + 'static-v5';
const SHELL_CACHE = CACHE_PREFIX + 'shell-v5';
const MEDIA_FONT_CACHE = CACHE_PREFIX + 'media-fonts-v5';
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
  try {
    const res = await fetch('./precache-manifest.json', { cache: 'no-store' });
    if (!res || !res.ok) return;
    const manifest = await res.json();
    const staticCache = await caches.open(STATIC_CACHE);

    const coreAssets = Array.isArray(manifest.coreAssets) ? manifest.coreAssets : [];
    await Promise.allSettled(
      coreAssets.map(async (assetUrl) => {
        const existing = await staticCache.match(assetUrl);
        if (!existing) {
          const assetRes = await fetch(assetUrl, { cache: 'force-cache' });
          if (assetRes && assetRes.ok) {
            await staticCache.put(assetUrl, assetRes);
          }
        }
      })
    );

    const deferred3D = Array.isArray(manifest.deferred3DAssets) ? manifest.deferred3DAssets : [];
    for (const assetUrl of deferred3D) {
      try {
        const existing = await staticCache.match(assetUrl);
        if (!existing) {
          const assetRes = await fetch(assetUrl, { cache: 'force-cache' });
          if (assetRes && assetRes.ok) {
            await staticCache.put(assetUrl, assetRes);
          }
        }
      } catch {
        /* ignore offline during background warmup */
      }
    }
  } catch {
    /* ignore if offline during install */
  }
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
        try {
          const freshRes = await fetch(req, { cache: 'no-cache' });
          if (freshRes && freshRes.status === 200 && freshRes.type === 'basic') {
            cache.put('./index.html', freshRes.clone());
            return freshRes;
          }
        } catch {
          /* Offline — serve cached shell immediately below */
        }
        return (
          (await cache.match('./index.html')) ||
          (await cache.match('./')) ||
          (await caches.match('./index.html')) ||
          (await cache.match(OFFLINE_URL))
        );
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

// ══════════════════════════════════════
// ETIJAH ALHUDA — Service Worker
// ══════════════════════════════════════
const CACHE_NAME = "etijah-v1";
const STATIC_FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./settings.js",
  "./radio.js",
  "./prayer-times.js",
  "./quran.js",
  "./adhkar-tasbih.js",
  "./calendar.js",
  "./data.js",
  "./quran-cache.js",
  "./manifest.json",
];

// ── Install: cache static files ──
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_FILES))
  );
  self.skipWaiting();
});

// ── Activate: clean old caches ──
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch: serve from cache first, fallback to network ──
self.addEventListener("fetch", e => {
  const url = e.request.url;

  // القرآن: شبكة أولاً ثم كاش (مع تخزين الرد)
  if (url.includes("api.alquran.cloud")) {
    e.respondWith(
      caches.open(CACHE_NAME).then(cache =>
        cache.match(e.request).then(cached => {
          if (cached) return cached;
          return fetch(e.request).then(res => {
            if (res && res.status === 200) {
              cache.put(e.request, res.clone());
            }
            return res;
          });
        })
      )
    );
    return;
  }

  // مواقيت الصلاة: شبكة أولاً، كاش احتياطي
  if (url.includes("aladhan.com")) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }

  // الملفات الثابتة: كاش أولاً
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});

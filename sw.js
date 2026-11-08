/* Service worker: offline cache + background daily reminder. Bump VERSION on every release. */
importScripts('js/shared.js');

const VERSION = 'v1.1.0';
const CORE = `hafez-core-${VERSION}`;
const RUNTIME = 'hafez-runtime';           // fonts from CDNs
const S = self.HafezShared;

const PRECACHE = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/style.css',
  'js/app.js',
  'js/store.js',
  'js/notify.js',
  'js/share.js',
  'js/ornament.js',
  'js/shared.js',
  'data/faals.json',
  'icons/icon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CORE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('hafez-core-') && k !== CORE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com', 'cdn.jsdelivr.net'];

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const network = fetch(request).then((res) => {
    if (res && (res.ok || res.type === 'opaque')) cache.put(request, res.clone());
    return res;
  }).catch(() => null);
  return cached || (await network) || Response.error();
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (FONT_HOSTS.includes(url.hostname)) {
    event.respondWith(staleWhileRevalidate(request, RUNTIME));
    return;
  }
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('index.html', { ignoreSearch: true }).then((r) => r || caches.match('./')))
    );
    return;
  }
  event.respondWith(staleWhileRevalidate(request, CORE));
});

/* ---------- daily reminder while the app is closed (Periodic Background Sync) ---------- */
async function checkReminder() {
  const reminder = await S.kvGet('reminder').catch(() => null);
  const last = await S.kvGet('lastNotified').catch(() => null);
  if (!S.isDue(new Date(), reminder, last)) return;

  const res = await caches.match('data/faals.json');
  if (!res) return;
  const poems = await res.json();
  await S.kvSet('lastNotified', S.dayKey());
  const n = S.notice(poems[S.dailyIndex(S.dayKey(), poems.length)]);
  await self.registration.showNotification(n.title, n.options);
}

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'daily-fal') event.waitUntil(checkReminder());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL((event.notification.data && event.notification.data.url) || '#/daily', self.registration.scope).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
      for (const w of wins) {
        if (w.url.startsWith(self.registration.scope) && 'focus' in w) {
          if ('navigate' in w) w.navigate(target).catch(() => {});
          return w.focus();
        }
      }
      return self.clients.openWindow(target);
    })
  );
});

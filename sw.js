// The Favourite Child service worker: always fetch the newest game when online, fall back to the saved copy offline.
const C = 'favourite-child-v3';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];
self.addEventListener('install', (e) => { self.skipWaiting(); e.waitUntil(caches.open(C).then((c) => c.addAll(FILES)).catch(() => {})); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((k) => Promise.all(k.filter((x) => x !== C).map((x) => caches.delete(x)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const r = e.request; if (r.method !== 'GET') return;
  if (r.mode === 'navigate') { // network first for the game itself
    e.respondWith(fetch(r).then((res) => { const cp = res.clone(); caches.open(C).then((c) => c.put('index.html', cp)); return res; })
      .catch(() => caches.match('index.html')));
    return;
  }
  // Styles, fonts, icons and confetti: use the saved copy, refresh it in the background
  e.respondWith(caches.match(r).then((m) => {
    const f = fetch(r).then((res) => { if (res && (res.ok || res.type === 'opaque')) { const cp = res.clone(); caches.open(C).then((c) => c.put(r, cp)); } return res; }).catch(() => m);
    return m || f;
  }));
});

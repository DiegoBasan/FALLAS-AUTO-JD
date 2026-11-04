/* Service worker: la app funciona sin red (red primero, caché de respaldo). */
const CACHE = 'linea-v9';
const CORE = ['./', 'index.html', 'app.js', 'manifest.webmanifest', 'data/lineas.js', 'icons/icon-180.png', 'icons/icon-192.png', '../shared/theme.js', '../shared/ui.css', '../shared/procs.js', '../shared/cuenta.js', '../shared/txt.js', '../shared/flow.js', '../buscador-kasalis/data/procedimientos.js'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then(r => {
    if ((r.ok && !r.redirected) || r.type === 'opaque') { const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); }
    return r;
  }).catch(() => caches.match(e.request, {ignoreSearch: true})));
});

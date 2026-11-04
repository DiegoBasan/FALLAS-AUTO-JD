/* Service worker: la app funciona sin red (red primero, caché de respaldo). */
const CACHE = 'kasalis-v18';
const CORE = ['./', 'index.html', 'app.js', 'manifest.webmanifest', 'data/fallas.js', 'data/procedimientos.js', 'data/debug.js', 'data/imagenes.js', '../shared/procs.js', '../shared/txt.js', '../shared/cuenta.js', '../shared/explica.js', '../shared/flow.js', 'data/notas.js', 'data/docs.js',
  'icons/icon-180.png', 'icons/icon-192.png', '../shared/theme.js', '../shared/ui.css', '../shared/kasalis.js', '../shared/kasalis-codes.js'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then(r => {
    if ((r.ok && !r.redirected) || r.type === 'opaque') { const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); }
    return r;
  }).catch(() => caches.match(e.request, {ignoreSearch: true})));
});

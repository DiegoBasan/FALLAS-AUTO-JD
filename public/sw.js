/* Service worker de la app JD Fallas (toda la app, scope /).
   Red primero y copia de respaldo para usarla sin señal en piso. La API nunca se guarda. */
const CACHE = 'jdf-v4';
const CORE = ['/', '/buscador-kasalis/', '/fallas-linea/', '/docs/', '/cuenta/', '/shared/ui.css', '/shared/theme.js', '/shared/app.js',
  '/shared/cuenta.js', '/shared/txt.js', '/shared/flow.js', '/shared/procs.js', '/shared/kasalis.js', '/shared/kasalis-codes.js', '/shared/explica.js',
  '/buscador-kasalis/app.js', '/buscador-kasalis/data/fallas.js', '/buscador-kasalis/data/procedimientos.js', '/buscador-kasalis/data/imagenes.js',
  '/buscador-kasalis/data/debug.js', '/buscador-kasalis/data/notas.js', '/buscador-kasalis/data/docs.js',
  '/fallas-linea/app.js', '/fallas-linea/data/lineas.js', '/icons/icon-192.png', '/manifest.webmanifest'];
const guardable = r => r && r.ok && !r.redirected && r.type === 'basic';
self.addEventListener('install', e => {
  // uno por uno: si la sesión no está, el servidor manda al login y eso no se guarda
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(CORE.map(u => fetch(u, {credentials: 'same-origin'}).then(r => guardable(r) && c.put(u, r)).catch(() => {}))))
    .then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/login') || url.pathname.startsWith('/admin') || url.pathname.startsWith('/.netlify/')) return;
  e.respondWith(fetch(req).then(r => {
    if (guardable(r)) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); }
    return r;
  }).catch(async () => (await caches.match(req, {ignoreSearch: true})) || (req.mode === 'navigate' ? caches.match('/') : Response.error())));
});

/* Service worker de la app JD Fallas (toda la app, scope /).
   Objetivo: que una falla se pueda consultar aunque no haya señal en piso.
   - Al instalar se guarda TODO lo de texto (páginas, código, fallas, guías, códigos, manual para búsqueda).
     Las imágenes y PDFs NO se descargan por adelantado: se guardan cuando las abres.
   - Archivos (js, css, datos, imágenes): sale lo guardado al instante y se actualiza por detrás (stale-while-revalidate).
   - Páginas: red primero, pero si tarda más de 2.5 s o no hay red, sale lo guardado.
   - Al volver la señal, la app avisa ('refrescar') y se vuelve a bajar lo que haya cambiado o falte.
   - La API (/api), el login y el panel admin nunca se guardan, salvo las fotos (/api/foto) y las instrucciones que ya viste. */
const CACHE = 'jdf-v8';
const FOTOS = 'jdf-fotos';   // fotos de instrucciones/aportaciones (/api/foto/<id>): no cambian, se guardan al verlas
const FONTS = 'jdf-fonts';
const CORE = ['/', '/buscador-kasalis/', '/fallas-linea/', '/docs/', '/cuenta/', '/instrucciones/', '/instrucciones/app.js', '/shared/instr.js',
  '/shared/ui.css', '/shared/theme.js', '/shared/app.js', '/shared/cuenta.js', '/shared/txt.js', '/shared/flow.js', '/shared/procs.js',
  '/shared/kasalis.js', '/shared/kasalis-codes.js', '/shared/explica.js',
  '/buscador-kasalis/app.js', '/buscador-kasalis/data/fallas.js', '/buscador-kasalis/data/procedimientos.js', '/buscador-kasalis/data/imagenes.js',
  '/buscador-kasalis/data/debug.js', '/buscador-kasalis/data/notas.js', '/buscador-kasalis/data/docs.js',
  '/fallas-linea/app.js', '/fallas-linea/data/lineas.js',
  '/manifest.webmanifest', '/icons/icon-192.png', '/apple-touch-icon.png'];
const guardable = r => r && r.ok && !r.redirected && r.type === 'basic';

// baja todo CORE de nuevo; si el servidor manda al login (sin sesión) no se guarda nada de eso
function bajarCore(){
  return caches.open(CACHE).then(c => Promise.all(CORE.map(u =>
    fetch(u, {credentials: 'same-origin', cache: 'no-cache'}).then(r => guardable(r) ? c.put(u, r) : null).catch(() => null))));
}
self.addEventListener('install', e => { e.waitUntil(bajarCore().then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k !== FONTS && k !== FOTOS).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('message', e => { if (e.data === 'refrescar') e.waitUntil(bajarCore()); });

function deRed(req, cache){
  return fetch(req).then(r => { if (guardable(r)) cache.put(req, r.clone()); return r; });
}
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET') return;

  // letra Inter de Google: se guarda la primera vez para que se vea igual sin red
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open(FONTS).then(c => c.match(req).then(hit => hit || fetch(req).then(r => { if (r.ok || r.type === 'opaque') c.put(req, r.clone()); return r; }))));
    return;
  }
  if (url.origin !== location.origin) return;
  if (url.pathname.startsWith('/api/foto/')) {
    e.respondWith(caches.open(FOTOS).then(c => c.match(req).then(hit => hit || fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; }))));
    return;
  }
  // lista e instrucciones: de la red, y si no hay señal lo último que se vio
  if (url.pathname.startsWith('/api/instrucciones')) {
    e.respondWith(caches.open(CACHE).then(c => fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; }).catch(() => c.match(req).then(hit => hit || Response.error()))));
    return;
  }
  if (/^\/(api|login|admin|\.netlify)(\/|$)/.test(url.pathname)) return;

  if (req.mode === 'navigate') {
    e.respondWith(caches.open(CACHE).then(async c => {
      const red = deRed(req, c);
      const guardado = await c.match(req, {ignoreSearch: true});
      if (!guardado) return red.catch(() => c.match('/'));
      const lento = new Promise(res => setTimeout(() => res(guardado), 2500));
      e.waitUntil(red.catch(() => null));
      return Promise.race([red.catch(() => guardado), lento]);
    }));
    return;
  }
  e.respondWith(caches.open(CACHE).then(async c => {
    const guardado = await c.match(req, {ignoreSearch: true});
    const red = deRed(req, c);
    if (guardado) { e.waitUntil(red.catch(() => null)); return guardado; }
    return red.catch(() => Response.error());
  }));
});

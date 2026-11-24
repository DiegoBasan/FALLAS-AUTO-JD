/* Escanear un código (barras o QR) con la cámara del celular.
   escanear({titulo}) → Promise<string|null>  (pantalla completa; null si se cancela)
   escanerEnLinea(host, onCodigo) → {parar}   (recuadro chico dentro de la página, cámara en vivo, sigue leyendo)
   esCelular() → true si conviene la cámara (pantalla táctil); en compu se usa el escáner USB (escribe y da Enter).
   Usa el lector nativo del navegador si existe (Chrome / Android); si no (iPhone), ZXing (/vendor, licencia MIT). */
const CSS = `
.esc{position:fixed;inset:0;z-index:95;background:#000;display:flex;flex-direction:column;color:#fff;font-family:Inter,system-ui,sans-serif}
.esc video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.esc .marco{position:absolute;left:50%;top:44%;width:min(78vw,340px);height:min(42vw,190px);transform:translate(-50%,-50%);border-radius:18px;box-shadow:0 0 0 100vmax rgba(0,0,0,.5);border:3px solid rgba(255,255,255,.9)}
.esc .linea{position:absolute;left:8%;right:8%;top:50%;height:2px;background:#FF5A4F;box-shadow:0 0 12px #FF5A4F;animation:escl 1.6s ease-in-out infinite alternate}
@keyframes escl{from{transform:translateY(-60px)}to{transform:translateY(60px)}}
.esc .top{position:relative;z-index:2;padding:calc(env(safe-area-inset-top) + 14px) 16px 0;text-align:center}
.esc .top b{display:block;font-size:18px}.esc .top span{font-size:13.5px;opacity:.8}
.esc .bot{position:relative;z-index:2;margin-top:auto;padding:0 16px calc(env(safe-area-inset-bottom) + 18px);display:grid;gap:10px}
.esc .man{display:flex;gap:8px}
.esc input{flex:1;min-width:0;height:50px;border-radius:14px;border:0;padding:0 14px;font:inherit;font-size:16px;background:rgba(255,255,255,.92);color:#111}
.esc button{height:50px;border-radius:99px;border:0;font:inherit;font-weight:800;font-size:15.5px;cursor:pointer;padding:0 18px}
.esc .ok{background:#fff;color:#111}.esc .no{background:rgba(255,255,255,.18);color:#fff;-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}
.esc .err{background:rgba(229,72,77,.9);border-radius:12px;padding:10px 12px;font-size:14px}`;
let puesto = false, zx = null;
const cargarZX = () => zx || (zx = new Promise((ok, no) => {
  if (window.ZXing) return ok(window.ZXing);
  const s = document.createElement('script'); s.src = '/vendor/zxing-0.21.3.min.js'; s.onload = () => ok(window.ZXing); s.onerror = () => no(new Error('No se pudo cargar el lector'));
  document.head.appendChild(s);
}));

export const esCelular = () => matchMedia('(pointer: coarse)').matches;

/* lector para un <video> ya corriendo: devuelve async () => texto|null */
async function crearLector(video){
  if ('BarcodeDetector' in window) {
    try { const det = new BarcodeDetector(); await det.detect(document.createElement('canvas')); return async () => (await det.detect(video))[0]?.rawValue || null; } catch (e) {}
  }
  const Z = await cargarZX();
  const hints = new Map(); hints.set(Z.DecodeHintType.TRY_HARDER, true);
  const lector = new Z.MultiFormatReader(); lector.setHints(hints);
  const c = document.createElement('canvas'), ctx = c.getContext('2d', { willReadFrequently: true });
  return async () => {
    const w = video.videoWidth, h = video.videoHeight; if (!w) return null;
    const cw = Math.round(w * .85), ch = Math.round(h * .5);
    c.width = cw; c.height = ch; ctx.drawImage(video, (w - cw) / 2, (h - ch) / 2, cw, ch, 0, 0, cw, ch);
    try { return lector.decode(new Z.BinaryBitmap(new Z.HybridBinarizer(new Z.HTMLCanvasElementLuminanceSource(c)))).getText(); }
    catch (e) { return null; } finally { lector.reset(); }
  };
}
const CSS2 = `
.escl{position:relative;border-radius:16px;overflow:hidden;background:#000;height:150px;margin:8px 0}
.escl video{width:100%;height:100%;object-fit:cover;display:block}
.escl .mk{position:absolute;left:10%;right:10%;top:22%;bottom:22%;border:2px solid rgba(255,255,255,.85);border-radius:10px;box-shadow:0 0 0 100vmax rgba(0,0,0,.35)}
.escl .mk::after{content:"";position:absolute;left:6%;right:6%;top:50%;height:2px;background:#FF5A4F;box-shadow:0 0 10px #FF5A4F}
.escl .tx{position:absolute;left:10px;bottom:8px;right:90px;color:#fff;font:600 12.5px Inter,system-ui,sans-serif;text-shadow:0 1px 3px rgba(0,0,0,.6)}
.escl button{position:absolute;right:8px;bottom:8px;height:32px;padding:0 12px;border:0;border-radius:99px;background:rgba(255,255,255,.9);color:#111;font:700 13px Inter,system-ui,sans-serif;cursor:pointer}
.escl.ok .mk{border-color:#2fd27a}`;
let puesto2 = false;
export function escanerEnLinea(host, onCodigo, {texto = 'Apunta al código'} = {}){
  if (!puesto2) { const st = document.createElement('style'); st.textContent = CSS2; document.head.appendChild(st); puesto2 = true; }
  const el = document.createElement('div'); el.className = 'escl';
  el.innerHTML = `<video playsinline muted></video><div class="mk"></div><div class="tx">${texto}</div><button type="button">Cerrar</button>`;
  host.appendChild(el);
  const video = el.querySelector('video'), tx = el.querySelector('.tx');
  let stream = null, vivo = true, timer = 0, ultimo = '', ultimoT = 0;
  const parar = () => { vivo = false; clearTimeout(timer); stream && stream.getTracks().forEach(t => t.stop()); el.remove(); };
  el.querySelector('button').onclick = parar;
  (async () => {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
      if (!vivo) return stream.getTracks().forEach(t => t.stop());
      video.srcObject = stream; await video.play();
      const leer = await crearLector(video);
      const ciclo = async () => {
        if (!vivo) return;
        let v = null; try { v = await leer(); } catch (e) {}
        if (v && (v !== ultimo || Date.now() - ultimoT > 3000)) {   // el mismo código no se repite en 3 s
          ultimo = v; ultimoT = Date.now(); navigator.vibrate && navigator.vibrate(50);
          el.classList.add('ok'); setTimeout(() => el.classList.remove('ok'), 600);
          tx.textContent = '✓ ' + v; onCodigo(String(v).trim());
        }
        timer = setTimeout(ciclo, 200);
      };
      ciclo();
    } catch (e) { tx.textContent = 'No se pudo abrir la cámara (revisa el permiso).'; }
  })();
  return { parar };
}

export async function escanear({titulo = 'Escanear código', ayuda = 'Apunta al código de barras o QR de la etiqueta'} = {}){
  if (!puesto) { const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st); puesto = true; }
  const el = document.createElement('div'); el.className = 'esc';
  el.innerHTML = `<video playsinline muted></video><div class="marco"><div class="linea"></div></div>
    <div class="top"><b>${titulo}</b><span>${ayuda}</span></div>
    <div class="bot"><div class="err" hidden></div><div class="man"><input placeholder="…o escríbelo aquí" autocapitalize="characters" enterkeyhint="search"><button class="ok">Usar</button></div><button class="no">Cancelar</button></div>`;
  document.body.appendChild(el);
  const video = el.querySelector('video'), err = el.querySelector('.err');
  let stream = null, vivo = true, timer = 0;
  return new Promise(resolve => {
    const fin = v => { vivo = false; clearTimeout(timer); stream && stream.getTracks().forEach(t => t.stop()); el.remove(); resolve(v ? String(v).trim() : null); };
    el.querySelector('.no').onclick = () => fin(null);
    const usar = () => { const v = el.querySelector('input').value.trim(); if (v) fin(v); };
    el.querySelector('.ok').onclick = usar;
    el.querySelector('input').addEventListener('keydown', e => { if (e.key === 'Enter') usar(); });
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
        if (!vivo) return stream.getTracks().forEach(t => t.stop());
        video.srcObject = stream; await video.play();
      } catch (e) { err.hidden = false; err.textContent = 'No se pudo abrir la cámara (revisa el permiso). Puedes escribir el código abajo.'; return; }
      let leer;
      try { leer = await crearLector(video); } catch (e) { err.hidden = false; err.textContent = 'No se pudo cargar el lector. Escribe el código abajo.'; return; }
      const ciclo = async () => {
        if (!vivo) return;
        try { const v = await leer(); if (v) { navigator.vibrate && navigator.vibrate(60); return fin(v); } } catch (e) {}
        timer = setTimeout(ciclo, 180);
      };
      ciclo();
    })();
  });
}

/* Escanear un código (barras o QR) con la cámara del celular.
   escanear({titulo}) → Promise<string|null>  (null si se cancela)
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
      if ('BarcodeDetector' in window) {
        try { const det = new BarcodeDetector(); leer = async () => (await det.detect(video))[0]?.rawValue; } catch (e) {}
      }
      if (!leer) {
        try {
          const Z = await cargarZX();
          const hints = new Map(); hints.set(Z.DecodeHintType.TRY_HARDER, true);
          const lector = new Z.MultiFormatReader(); lector.setHints(hints);
          const c = document.createElement('canvas'), ctx = c.getContext('2d', { willReadFrequently: true });
          leer = async () => {
            const w = video.videoWidth, h = video.videoHeight; if (!w) return null;
            // solo la franja del centro (donde está el marco): más rápido y más certero
            const cw = Math.round(w * .8), ch = Math.round(h * .45);
            c.width = cw; c.height = ch; ctx.drawImage(video, (w - cw) / 2, (h - ch) / 2, cw, ch, 0, 0, cw, ch);
            try { const bmp = new Z.BinaryBitmap(new Z.HybridBinarizer(new Z.HTMLCanvasElementLuminanceSource(c))); return lector.decode(bmp).getText(); }
            catch (e) { return null; } finally { lector.reset(); }
          };
        } catch (e) { err.hidden = false; err.textContent = 'No se pudo cargar el lector. Escribe el código abajo.'; return; }
      }
      const ciclo = async () => {
        if (!vivo) return;
        try { const v = await leer(); if (v) { navigator.vibrate && navigator.vibrate(60); return fin(v); } } catch (e) {}
        timer = setTimeout(ciclo, 180);
      };
      ciclo();
    })();
  });
}

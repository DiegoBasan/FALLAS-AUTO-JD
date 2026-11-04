/* Sección "Instrucciones de la gente" para el inicio de Kasalis y de Línea.
   montarInstHome(el, app): pinta en `el` las instrucciones de esa app (las aprobadas y las tuyas) y el botón para hacer una nueva. */
import {api} from './cuenta.js';

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const CSS = `
.ih{display:flex;gap:10px;overflow-x:auto;scroll-snap-type:x mandatory;padding:2px 2px 6px;margin:0 -2px;scrollbar-width:none}
.ih::-webkit-scrollbar{display:none}
.ih a{flex:0 0 auto;width:min(46%,210px);scroll-snap-align:start;display:flex;flex-direction:column;background:var(--surface);border:1px solid var(--line);border-radius:20px;overflow:hidden;color:inherit;text-decoration:none}
.ih a:active{transform:scale(.98)}
.ih .cv{aspect-ratio:4/3;background:var(--surface2);position:relative;display:grid;place-items:center;color:var(--ink3)}
.ih .cv img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.ih .cv svg{width:30px;height:30px}
.ih .cv em{position:absolute;left:8px;top:8px;font-style:normal;font-size:10.5px;font-weight:700;padding:2px 8px;border-radius:99px;background:rgba(224,163,46,.92);color:#2a1d00}
.ih .m{padding:9px 11px 11px;display:grid;gap:2px}
.ih b{font-size:14px;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.ih small{font-size:11.5px;color:var(--ink2)}
.ih a.nueva{justify-content:center;align-items:center;gap:8px;border-style:dashed;border-width:2px;background:none;color:var(--ink2);font-weight:700;font-size:14px;min-height:150px;text-align:center;padding:12px}
.ih a.nueva span{width:42px;height:42px;border-radius:50%;display:grid;place-items:center;background:var(--invert);color:var(--invert-ink);font-size:24px;line-height:1}
.ih-top{display:flex;align-items:center;justify-content:space-between;gap:10px}
.ih-top a{font-size:13.5px;font-weight:700;color:var(--ink2);white-space:nowrap;text-decoration:none}
.ih-sub{font-size:13px;color:var(--ink2);margin:-6px 4px 10px}`;
let puesto = false;
const DOC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></svg>';

export async function montarInstHome(el, app, titulo){
  if(!el) return;
  if(!puesto){ const s = document.createElement('style'); s.textContent = CSS; document.head.appendChild(s); puesto = true; }
  const nueva = `<a class="nueva" href="/instrucciones/#nueva/${app}"><span>＋</span>Documentar un proceso</a>`;
  el.innerHTML = `<div class="ih-top">${titulo}<a href="/instrucciones/#lista/${app}">Ver todas ›</a></div><div class="ih-sub">Pasos con fotos hechos por la gente de piso.</div><div class="ih">${nueva}</div>`;
  let ds = [];
  try{ ds = (await api('instrucciones?app=' + app)).instrucciones; }catch(e){ return; }
  if(!el.isConnected) return;
  el.querySelector('.ih').innerHTML = ds.slice(0, 10).map(d => `<a href="/instrucciones/#i/${encodeURIComponent(d.id)}"><div class="cv">${d.portada ? `<img loading="lazy" src="/api/foto/${encodeURIComponent(d.portada)}" alt="">` : DOC}${d.estado === 'pendiente' ? '<em>En revisión</em>' : ''}</div>
    <div class="m"><b>${esc(d.titulo)}</b><small>${d.pasos} paso${d.pasos===1?'':'s'} · ${esc(d.nombre)}</small></div></a>`).join('') + nueva;
}

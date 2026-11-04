/* Flujo de resolución guiado (lo usan Fallas Kasalis y Fallas de línea).
   Un paso a la vez: el actual resaltado, los hechos con ✓ y los siguientes atenuados.
   Pasos con SÍ / NO saltan al paso que dice el texto ("paso 4") o terminan si dice "listo".
   Al terminar se guarda en el historial local (lo ve el inicio de JD Automation). */
import {tx, plain} from './txt.js';
const esc = tx;
const HKEY = 'jd_historial';
export function historial(){ try{ return JSON.parse(localStorage.getItem(HKEY)||'[]'); }catch(e){ return []; } }
function guardar(r){ try{ const h = historial(); h.unshift(r); localStorage.setItem(HKEY, JSON.stringify(h.slice(0, 50))); }catch(e){} }

const CSS = `
.gf{display:grid;gap:8px}
.gf .gs{display:grid;grid-template-columns:34px 1fr;gap:12px;padding:12px 14px;border-radius:20px;background:var(--surface,var(--chip,#fff));border:1px solid var(--line,rgba(0,0,0,.08));transition:opacity .2s,transform .2s;cursor:pointer}
.gf .gs .n{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;font-weight:800;font-size:14px;background:var(--surface2,var(--bg,#eee));color:var(--ink,#141416)}
.gf .gs b{display:block;font-size:15.5px;line-height:1.35;padding-top:6px}
.gf .gs .d{color:var(--ink2,#6b6b6b);font-size:13.5px;margin-top:3px;line-height:1.45}
.gf .gs.next{opacity:.5}
.gf .gs.next .d,.gf .gs.next .acts,.gf .gs.done .d,.gf .gs.done .acts{display:none}
.gf .gs.done{background:transparent;border-style:dashed}
.gf .gs.done .n{background:var(--gfc,#22a06b);color:#fff}
.gf .gs.done b{font-weight:600}
.gf .gs.skip{opacity:.45}
.gf .gs.skip .n{background:var(--line,#ccc);color:var(--ink2,#666)}
.gf .gs .ans{display:none;font-size:12.5px;color:var(--ink2,#6b6b6b);margin-top:3px}
.gf .gs.done .ans{display:block}
.gf .gs.cur{border:2px solid var(--gfa,var(--ink,#141416));box-shadow:0 10px 28px rgba(0,0,0,.08);cursor:default}
.gf .gs.cur .n{background:var(--gfa,var(--ink,#141416));color:#fff}
.gf .acts{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
.gf .acts button{flex:1 1 220px;min-height:44px;padding:8px 16px;border-radius:14px;border:1.5px solid var(--line,#d6d6da);background:transparent;color:inherit;font:inherit;font-weight:700;font-size:14px;cursor:pointer;text-align:left;display:flex;align-items:center;gap:8px;line-height:1.25}
.gf .acts button small{display:block;font-weight:500;font-size:12px;opacity:.8}
.gf .acts .si{border-color:rgba(34,160,107,.5);background:rgba(34,160,107,.1)}
.gf .acts .no{border-color:rgba(229,72,77,.45);background:rgba(229,72,77,.08)}
.gf .acts .ok{background:var(--ink,#141416);color:var(--bg,#fff);border-color:var(--ink,#141416)}
.gf .acts em{font-style:normal;font-size:11px;font-weight:800;padding:2px 7px;border-radius:6px;background:rgba(127,127,127,.18)}
.gf .end{padding:16px;border-radius:20px;background:rgba(34,160,107,.12);border:1.5px solid rgba(34,160,107,.4)}
.gf .end.fail{background:rgba(229,72,77,.08);border-color:rgba(229,72,77,.35)}
.gf .end b{font-size:16px;display:block}
.gf .end p{margin:4px 0 10px;font-size:13.5px;color:var(--ink2,#6b6b6b)}
.gf .end button,.gf .reset{min-height:40px;padding:0 14px;border-radius:99px;border:1.5px solid var(--line,#d6d6da);background:transparent;color:inherit;font:inherit;font-weight:700;cursor:pointer}
.gf .bar{display:flex;align-items:center;gap:10px;font-size:12.5px;font-weight:700;color:var(--ink2,#6b6b6b);margin:0 2px 2px}
.gf .bar i{flex:1;height:6px;border-radius:9px;background:var(--line,#e0e0e0);overflow:hidden}
.gf .bar i u{display:block;height:100%;background:var(--gfa,var(--ink,#141416));border-radius:9px;transition:width .3s}
`;
let styled = false;

const destino = (txt, i, n) => { if(!txt) return i+1; const m = String(txt).match(/paso\s*(\d+)/i); if(m) return Math.min(n, Math.max(1, +m[1])) - 1;
  if(/\b(listo|resuelto|empacar)\b/i.test(txt)) return 'fin'; return i+1; };
const corto = t => { const s = plain(t).split(/→|\./)[0].trim(); return s.length > 60 ? s.slice(0,57)+'…' : s; };

/* mount(el, falla, {app, accent, procHTML(step) → html, onDone}) */
export function mountFlow(el, f, o={}){
  if(!styled){ const s = document.createElement('style'); s.textContent = CSS; document.head.appendChild(s); styled = true; }
  const n = f.flujo.length; let cur = 0, done = {}, fin = null;
  el.style.setProperty('--gfa', o.accent || 'var(--ink)');
  function draw(){
    const pct = fin ? 100 : Math.round(cur/n*100);
    let h = `<div class="gf"><div class="bar"><span>${fin ? 'Terminado' : `Paso ${cur+1} de ${n}`}</span><i><u style="width:${pct}%"></u></i>${Object.keys(done).length||fin?'<button class="reset" data-gf="reset">Empezar de nuevo</button>':''}</div>`;
    f.flujo.forEach((s,i)=>{
      const st = fin ? (done[i] ? 'done' : 'next') : i===cur ? 'cur' : done[i] ? 'done' : 'next';
      let acts = '';
      if(st==='cur'){
        if(s.si || s.no){
          if(s.si) acts += `<button class="si" data-gf="si"><em>SÍ</em><span>${esc(s.si)}</span></button>`;
          acts += `<button class="no" data-gf="no"><em>NO</em><span>${esc(s.no || 'Sigue al siguiente paso')}</span></button>`;
          if(!s.si) acts += `<button class="si" data-gf="hecho">Hecho, siguiente</button>`;
        } else acts += `<button class="ok" data-gf="hecho">Hecho, siguiente →</button>`;
        acts += `<button data-gf="resolvio">✓ Con esto se resolvió</button>`;
      }
      const sk = done[i]==='Saltado';
      h += `<div class="gs ${st}${sk&&st==='done'?' skip':''}" data-gi="${i}"><div class="n">${sk ? '–' : done[i] ? '✓' : i+1}</div><div><b>${esc(s.p)}</b>${s.d?`<div class="d">${esc(s.d)}</div>`:''}
        <div class="ans">${esc(done[i]||'')}</div>${st==='cur' && o.procHTML ? o.procHTML(s) : ''}${acts?`<div class="acts">${acts}</div>`:''}</div></div>`;
    });
    if(fin) h += `<div class="end ${fin.ok?'':'fail'}"><b>${fin.ok ? '✓ Resuelto' : 'Sin resolver con este flujo'}</b><p>${esc(fin.txt)}</p>${fin.ok?'':'<button data-gf="reset">Revisar otra vez</button>'}</div>`;
    else if(cur >= n) h += `<div class="end fail"><b>Llegaste al final del flujo</b><p>Si sigue fallando, escálalo con ingeniería con lo que ya revisaste.</p><button data-gf="cerrar">Registrar como no resuelto</button></div>`;
    el.innerHTML = h + '</div>';
  }
  function terminar(ok, i){ fin = {ok, txt: ok ? `Se resolvió en el paso ${i+1}: ${plain(f.flujo[i].p)}` : 'Se revisaron todos los pasos.'};
    guardar({app:o.app||'', id:f.id, titulo:plain(f.titulo), fecha:new Date().toISOString(), ok, paso:i+1, solucion: ok ? plain(f.flujo[i].p) : ''}); o.onDone && o.onDone(fin); draw(); }
  el.addEventListener('click', e=>{
    const b = e.target.closest('[data-gf]');
    if(b){ e.stopPropagation(); const a = b.dataset.gf, s = f.flujo[cur];
      if(a==='reset'){ cur = 0; done = {}; fin = null; return draw(); }
      if(a==='cerrar') return terminar(false, n-1);
      if(a==='resolvio'){ done[cur] = '✓ Esto lo resolvió'; return terminar(true, cur); }
      const txt = a==='si' ? s.si : a==='no' ? s.no : null;
      done[cur] = a==='si' ? 'SÍ — '+corto(s.si) : a==='no' ? 'NO — '+(s.no?corto(s.no):'siguiente') : 'Hecho';
      const d = destino(txt, cur, n);
      if(d==='fin') return terminar(true, cur);
      for(let k=cur+1;k<d;k++) if(!done[k]) done[k] = 'Saltado';
      cur = d; draw(); el.querySelector('.gs.cur')?.scrollIntoView({behavior:'smooth', block:'center'}); return; }
    const g = e.target.closest('[data-gi]');
    if(g && !fin && !e.target.closest('button,a')){ const i = +g.dataset.gi; if(i!==cur){ cur = i; delete done[i]; draw(); } }
  });
  draw();
}

/* Flujo fijo: todos los pasos visibles con sus detalles (sin confirmar paso por paso).
   Paso: {p, d, si, no, proc, img:['fotos/x.jpg' | {src, cap}]} */
const CSS_FIJO = `
.ff{position:relative;display:grid;gap:10px;--ffa:var(--ink,#141416)}
.ff .fs{display:grid;grid-template-columns:34px 1fr;gap:12px;padding:12px 14px;border-radius:20px;background:var(--surface,#fff);border:1px solid var(--line,rgba(0,0,0,.08))}
.ff .fs .n{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;font-weight:800;font-size:14px;background:var(--ffa);color:#fff}
.ff .fs b.t{display:block;font-size:15.5px;line-height:1.35;padding-top:6px}
.ff .fs .d{color:var(--ink2,#6b6b6b);font-size:14px;margin-top:4px;line-height:1.5}
.ff .br{display:flex;gap:8px;align-items:flex-start;margin-top:8px;font-size:13.5px;line-height:1.45;padding:7px 10px;border-radius:12px}
.ff .br em{font-style:normal;font-size:11px;font-weight:800;padding:2px 7px;border-radius:6px;flex:0 0 auto;margin-top:1px}
.ff .br.si{background:rgba(34,160,107,.09)} .ff .br.si em{background:rgba(34,160,107,.9);color:#fff}
.ff .br.no{background:rgba(229,72,77,.07)} .ff .br.no em{background:rgba(229,72,77,.9);color:#fff}
.ff .ims{display:flex;gap:8px;overflow-x:auto;margin-top:10px;padding-bottom:2px}
.ff .ims figure{margin:0;flex:0 0 auto;max-width:min(320px,78vw)}
.ff .ims img{display:block;max-height:200px;max-width:100%;border-radius:12px;border:1px solid var(--line,#ddd);cursor:zoom-in;background:#fff}
.ff .pj{display:inline-flex;align-items:center;gap:3px;font-weight:800;color:inherit;text-decoration:none;border-bottom:2px solid currentColor;cursor:pointer;white-space:nowrap}
.ff .fs{scroll-margin-top:178px}
.gflow{min-width:0;max-width:100%}
.ffbar{max-width:100%;box-sizing:border-box;position:sticky;top:var(--ffTop,118px);z-index:5;display:flex;gap:6px;overflow-x:auto;padding:8px 2px;margin:0 0 6px;background:var(--bg,#f2f2f3);scrollbar-width:none}
.ffbar::-webkit-scrollbar{display:none}
.ffbar a{flex:0 0 auto;min-width:34px;height:34px;padding:0 8px;border-radius:99px;display:grid;place-items:center;font-weight:800;font-size:13px;background:var(--surface,#fff);border:1px solid var(--line,#ddd);color:inherit;text-decoration:none}
.ffbar a.on{background:var(--ffa);color:#fff;border-color:transparent}
.ff .ims figcaption{font-size:11.5px;color:var(--ink3,#999);margin-top:3px}
`;
let fijoCSS = false;
export function flowFijo(f, o={}){
  if(!fijoCSS && typeof document!=='undefined'){ const s = document.createElement('style'); s.textContent = CSS_FIJO; document.head.appendChild(s); fijoCSS = true;
    document.addEventListener('click', e=>{ const pj = e.target.closest('[data-paso]'); if(pj){ e.preventDefault(); const root = pj.closest('.gflow') || document;
        const t = root.querySelector(`.fs[data-n="${pj.dataset.paso}"]`); if(t){ t.scrollIntoView({behavior:'smooth', block:'start'}); t.animate([{boxShadow:'0 0 0 3px var(--ffa)'},{boxShadow:'0 0 0 0 transparent'}],{duration:1400}); } return; } });
    document.addEventListener('click', e=>{ const im = e.target.closest('.ff .ims img'); if(!im) return; const d = document.createElement('div');
      d.style.cssText='position:fixed;inset:0;z-index:60;background:rgba(0,0,0,.88);display:flex;align-items:center;justify-content:center;cursor:zoom-out';
      d.innerHTML = `<img src="${im.src}" style="max-width:100%;max-height:100%">`; d.onclick=()=>d.remove(); document.body.appendChild(d); }); }
  const base = o.base || location.href;
  const ims = s => (s.img||[]).length ? `<div class="ims">${s.img.map(x=>{ const it = typeof x==='string'?{src:x}:x; return `<figure><img loading="lazy" src="${new URL(it.src, base).href}" alt="">${it.cap?`<figcaption>${esc(it.cap)}</figcaption>`:''}</figure>`; }).join('')}</div>` : '';
  const visto = {};
  const salto = t => esc(t).replace(/\b([Pp]aso)\s*(\d+)/g, (m, w, n) => +n>=1 && +n<=f.flujo.length ? `<a class="pj" data-paso="${n}">${w} ${n} ↓</a>` : m);
  const guia = (s,i) => { if(!o.procHTML || !s.proc) return ''; if(visto[s.proc]!=null) return `<div class="br" style="background:var(--bg,#f2f2f3)">Cómo se hace: ver paso ${visto[s.proc]+1}</div>`; visto[s.proc] = i; return o.procHTML(s); };
  const bar = f.flujo.length > 5 ? `<nav class="ffbar" style="--ffa:${o.accent||'var(--ink)'}">${f.flujo.map((_,i)=>`<a data-paso="${i+1}">${i+1}</a>`).join('')}</nav>` : '';
  if(typeof window!=='undefined' && !window.__ffobs){ window.__ffobs = 1; addEventListener('scroll', ()=>{ document.querySelectorAll('.ffbar').forEach(b=>{ const fs = [...b.parentElement.querySelectorAll('.fs')]; let cur = 1; fs.forEach(x=>{ if(x.getBoundingClientRect().top < 160) cur = +x.dataset.n; }); b.querySelectorAll('a').forEach(a=>a.classList.toggle('on', +a.dataset.paso===cur)); }); }, {passive:true}); }
  return `${bar}<div class="ff" style="--ffa:${o.accent||'var(--ink)'}">${f.flujo.map((s,i)=>`<div class="fs" data-n="${i+1}"><div class="n">${i+1}</div><div>
    <b class="t">${esc(s.p)}</b>${s.d?`<div class="d">${esc(s.d)}</div>`:''}
    ${s.si?`<div class="br si"><em>SÍ</em><span>${salto(s.si)}</span></div>`:''}${s.no?`<div class="br no"><em>NO</em><span>${salto(s.no)}</span></div>`:''}
    ${ims(s)}${guia(s,i)}</div></div>`).join('')}</div>`;
}

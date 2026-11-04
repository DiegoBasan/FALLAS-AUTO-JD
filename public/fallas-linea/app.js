/* Fallas de línea — fallas y procesos de las estaciones que no son Kasalis (Gecko, Moose, Scorpion) y hornos.
   Mismo formato que Fallas Kasalis: flujo de resolución paso a paso + guías de procesos con fotos. */
import {MAQ, FALLAS, PROCESOS} from './data/lineas.js';
import {guideHTML} from '../shared/procs.js';
import {yo, track, mountAportes, ocultarFab, cuentaHTML, montarCuenta, puedeVer} from '../shared/cuenta.js';
let SES = {nivel:'operador', procNiveles:{}};
const visible = id => puedeVer(SES.procNiveles['linea:'+id] || 'operador', SES.nivel);
import {tx, LEYENDA, plain} from '../shared/txt.js';
import {flowFijo} from '../shared/flow.js';
const SI = {steps:'<path d="M9 6h11M9 12h11M9 18h11"/><path d="m3.5 6 1.5 1.5L7.5 5M3.5 12l1.5 1.5L7.5 11M3.5 18l1.5 1.5L7.5 17"/>', cause:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>', tip:'<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z"/>', book:'<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/>', wrench:'<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z"/>'};
const sh = (ic, t, main) => `<h3 class="${main?'sh':'lb'}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${SI[ic]}</svg>${t}</h3>`;

const $ = id => document.getElementById(id);
const esc = tx;
const BASE = new URL('./', import.meta.url);
const col = l => (MAQ[l]||MAQ.general).c;
let filtro = 'todas'; try{ filtro = localStorage.getItem('jd_linea_filtro') || 'todas'; }catch(e){}
const pasa = x => filtro==='todas' || x.linea===filtro || (x.lineas||[]).includes(filtro);

/* ---------- piezas ---------- */
const tags = x => [x.linea, ...(x.lineas||[])].filter((v,i,a)=>v && a.indexOf(v)===i).map(l=>`<span class="tag" style="--m:${col(l)}">${esc(MAQ[l]?.n||l)}</span>`).join('');
function card(f){ return `<div class="mode" style="--m:${col(f.linea)}" data-go="f/${f.id}"><div>${tags(f)}</div><b>${esc(plain(f.titulo))}</b><span>${esc(plain(f.corto))}</span></div>`; }
function procRow(id){ const p = PROCESOS[id]; if(!visible(id)) return ''; return `<div class="row" data-go="p/${id}" style="--m:${col(p.linea)}"><b style="font-size:12px"><span class="tag" style="--m:${col(p.linea)}">${esc(MAQ[p.linea]?.n||'')}</span></b><span>${esc(p.titulo)}<small>${esc(p.maquina||'')} · ${p.pasos.length ? p.pasos.length+' pasos' : 'en construcción'}</small></span><span class="faint">›</span></div>`; }
function renderFilters(){
  const keys = ['todas', ...Object.keys(MAQ)];
  $('filters').innerHTML = keys.map(k=> k==='kasalis'
    ? `<button data-href="${MAQ.kasalis.href}" style="--m:${MAQ.kasalis.c}"><i></i>Kasalis ↗</button>`
    : `<button data-f="${k}" class="${filtro===k?'on':''}" style="--m:${k==='todas'?'transparent':col(k)}">${k==='todas'?'':'<i></i>'}${k==='todas'?'Todas':esc(MAQ[k].n)}</button>`).join('');
}

/* ---------- vistas ---------- */
function homeView(){
  const fs = FALLAS.filter(pasa), ps = Object.keys(PROCESOS).filter(id=>pasa(PROCESOS[id]));
  const orden = [...new Set([...Object.keys(MAQ), ...fs.map(f=>f.linea)])].filter(l=>fs.some(f=>f.linea===l));
  const grupos = filtro==='todas' && orden.length>1
    ? orden.map(l=>`<h3 class="lb grp" style="--m:${col(l)}"><i></i>${esc(MAQ[l]?.n||l)} <span class="faint">${fs.filter(f=>f.linea===l).length}</span></h3><div class="modes">${fs.filter(f=>f.linea===l).map(card).join('')}</div>`).join('')
    : `<div class="modes">${fs.map(card).join('')}</div>`;
  return `${sh('wrench','¿Qué está fallando?',1)}${fs.length?grupos:'<div class="empty">Sin fallas registradas para esta línea todavía.</div>'}
    <hr class="sep">${sh('book','Procesos paso a paso',1)}${ps.length?`<div class="list">${ps.map(procRow).join('')}</div>`:'<div class="empty">Sin procesos para esta línea todavía.</div>'}`;
}
function fallaView(id){
  const f = FALLAS.find(x=>x.id===id); if(!f) return homeView();
  let h = `<div class="head" style="--m:${col(f.linea)}"><div class="k"><span class="tag">${esc(MAQ[f.linea]?.n||'')}</span> ${esc(f.maquina)}</div><h2>${esc(f.titulo)}</h2><p>${esc(f.corto)}</p></div>
    <div class="fv"><section>${sh('steps','Qué hacer, paso a paso',1)}<div class="gflow" data-fid="${f.id}"></div></section><aside>`;
  if(f.causas?.length) h += `${sh('cause','Causas vistas en piso → solución')}<div class="ca">${f.causas.map(([a,b])=>`<div class="r"><span>${esc(a)}</span><span>${esc(b)}</span></div>`).join('')}</div>`;
  if(f.tips?.length) h += `${sh('tip','Para recordar')}<div class="tips">${f.tips.map(t=>`<div>${esc(t)}</div>`).join('')}</div>`;
  return h + '</aside></div>' + LEYENDA;
}
function procesoView(id){
  const p = PROCESOS[id]; if(!p) return procesosTab();
  if(!visible(id)) return `<div class="card"><div class="hint muted">Este proceso es para otro nivel de acceso.</div></div>`;
  let h = `<div class="head" style="--m:${col(p.linea)}"><div class="k"><span class="tag">${esc(MAQ[p.linea]?.n||'')}</span> Proceso${p.maquina?' · '+esc(p.maquina):''}</div><h2>${esc(p.titulo)}</h2><p>${esc(p.cuando||'')}</p></div>`;
  h += `<div class="gflow-p" data-pid="${id}">${guideHTML(p, BASE, p.pasos.length ? 'Pasos' : 'Lo que ya sabemos')}</div>`;
  const usa = FALLAS.filter(f=>f.flujo.some(s=>s.proc===id));
  if(usa.length) h += `<h3 class="lb">Se usa en</h3>${usa.map(f=>`<div class="link" data-go="f/${f.id}"><span>${esc(f.titulo)}</span><span class="faint">›</span></div>`).join('')}`;
  return h + LEYENDA;
}
function procesosTab(){
  const groups = {};
  Object.keys(PROCESOS).filter(id=>pasa(PROCESOS[id])).forEach(id=>{ (groups[PROCESOS[id].linea] ||= []).push(id); });
  const order = Object.keys(MAQ).filter(k=>groups[k]);
  return order.length ? order.map(l=>`<h3 class="lb">${esc(MAQ[l].n)}</h3><div class="list">${groups[l].map(procRow).join('')}</div>`).join('') : '<div class="empty">Sin procesos para esta línea todavía.</div>';
}
function infoTab(){
  return `${cuentaHTML()}<h3 class="lb hide-app">Instalar en el iPhone</h3><div class="install hide-app">Abre esta página en <b>Safari</b> → Compartir → <b>Agregar a pantalla de inicio</b>.</div>
    <h3 class="lb">Colores</h3><div class="list">${Object.entries(MAQ).map(([k,m])=>`<div class="row" ${k==='kasalis'?`onclick="location.href='${m.href}'"`:`data-f2="${k}"`}><b><span class="tag" style="--m:${m.c}">${esc(m.n)}</span></b><span>${esc(m.d||'')}</span><span class="faint">${k==='kasalis'?'↗':''}</span></div>`).join('')}</div>
    <h3 class="lb">Qué hay aquí</h3><div class="install"><b>Fallas</b>: cada falla de las estaciones de línea y hornos con su flujo (primero checar esto, luego esto…).<br><b>Procesos</b>: guías paso a paso (cambio de DELO, hornos, recetas, fixturas…).<br>Las fallas de la Kasalis están en su propia app: <a href="${MAQ.kasalis.href}"><b>Fallas Kasalis ↗</b></a></div>`;
}
function searchView(q){
  const ql = q.toLowerCase();
  const fs = FALLAS.filter(f=>JSON.stringify(f).toLowerCase().includes(ql)), ps = Object.keys(PROCESOS).filter(id=>JSON.stringify(PROCESOS[id]).toLowerCase().includes(ql));
  return `<h3 class="lb">Fallas (${fs.length})</h3>${fs.length?`<div class="modes">${fs.map(card).join('')}</div>`:'<div class="empty">Ninguna.</div>'}
    <h3 class="lb">Procesos (${ps.length})</h3>${ps.length?`<div class="list">${ps.map(procRow).join('')}</div>`:'<div class="empty">Ninguno.</div>'}
    <div class="link" onclick="location.href='${MAQ.kasalis.href}#s/${encodeURIComponent(q)}'"><span>Buscar "${esc(q)}" en Fallas Kasalis</span><span class="faint">↗</span></div>`;
}

/* ---------- navegación ---------- */
let trk;
function route(){
  const raw = decodeURIComponent(location.hash.slice(1));
  let html, title = 'Fallas de línea', tab = 'fallas', sub = false;
  if(!raw) html = homeView();
  else if(raw==='procesos'){ html = procesosTab(); title = 'Procesos'; tab = 'procesos'; }
  else if(raw==='info'){ html = infoTab(); title = 'Más'; tab = 'info'; }
  else if(raw.startsWith('f/')){ const f = FALLAS.find(x=>x.id===raw.slice(2)); html = fallaView(raw.slice(2)); title = f?f.titulo:title; sub = true; }
  else if(raw.startsWith('p/')){ const p = PROCESOS[raw.slice(2)]; html = procesoView(raw.slice(2)); title = p?p.titulo:'Proceso'; sub = true; tab = 'procesos'; }
  else if(raw.startsWith('s/')){ const q = raw.slice(2); html = searchView(q); title = 'Buscar'; tab = ''; sub = true; if(document.activeElement!==$('q')) $('q').value = q; }
  else html = homeView();
  if(!raw.startsWith('s/') && document.activeElement!==$('q')) $('q').value = '';
  $('out').innerHTML = html; $('ttl').textContent = title;
  $('out').querySelectorAll('.gflow').forEach(el=>{ const f = FALLAS.find(x=>x.id===el.dataset.fid); if(f) el.innerHTML = flowFijo(f, {accent:col(f.linea), base:new URL('./', location.href).href, procHTML: st => st.proc && PROCESOS[st.proc] && visible(st.proc) ? guideHTML(PROCESOS[st.proc], BASE, PROCESOS[st.proc].titulo) : ''}); });
  let ap = null;
  const gf = $('out').querySelector('.gflow');
  if(gf){ const f = FALLAS.find(x=>x.id===gf.dataset.fid); ap = {el: gf, ref:'linea:'+f.id, app:'linea', fallaId:f.id, titulo: plain(f.titulo), pasos: f.flujo.map(x=>plain(x.p))}; }
  const gp = $('out').querySelector('.gflow-p');
  if(gp){ const p = PROCESOS[gp.dataset.pid]; ap = {el: gp, ref:'linea-p:'+gp.dataset.pid, app:'linea', fallaId:'p:'+gp.dataset.pid, titulo: plain(p.titulo), pasos: p.pasos.map(x=>plain(x.texto))}; }
  if(ap) mountAportes(ap.el, ap); else ocultarFab();
  if(raw==='info') montarCuenta($('out'));
  if(raw.startsWith('s/')){ clearTimeout(trk); const q = raw.slice(2), n = $('out').querySelectorAll('.row,.mode').length; trk = setTimeout(()=>track('busqueda', {q, n, ruta:'linea'}), 1500); }
  else track('vista', {ruta: 'linea/' + (raw || 'inicio'), titulo}); $('back').style.display = sub ? '' : 'none';
  $('filters').style.display = (tab==='fallas' || tab==='procesos') && !sub ? '' : 'none';
  document.querySelectorAll('.tabs a').forEach(a=>a.classList.toggle('on', a.dataset.tab===tab));
  $('clr').style.display = $('q').value ? 'block' : 'none';
  if(!raw.startsWith('s/')) window.scrollTo(0,0);
}
let depth = 0;
const go = h => { depth++; location.hash = h; };
document.addEventListener('click', e=>{
  const g = s => e.target.closest(s); let x;
  if(x = g('[data-go]')){ e.preventDefault(); go(x.dataset.go); return; }
  if(x = g('[data-href]')){ location.href = x.dataset.href; return; }
  if(x = g('[data-f]')){ filtro = x.dataset.f; try{ localStorage.setItem('jd_linea_filtro', filtro); }catch(err){} renderFilters(); route(); return; }
  if(x = g('[data-f2]')){ filtro = x.dataset.f2; try{ localStorage.setItem('jd_linea_filtro', filtro); }catch(err){} renderFilters(); location.hash = ''; }
});
$('back').onclick = ()=>{ if(depth>0){ depth--; history.back(); } else location.hash = ''; };
let tmr;
$('q').addEventListener('input', ()=>{ clearTimeout(tmr); const v = $('q').value.trim(); $('clr').style.display = v ? 'block' : 'none';
  tmr = setTimeout(()=>{ if(!v){ location.replace('#'); return; } const h = '#s/'+encodeURIComponent(v); if(location.hash.startsWith('#s/')) location.replace(h); else go(h.slice(1)); }, 250); });
$('q').addEventListener('keydown', e=>{ if(e.key==='Enter') $('q').blur(); });
$('clr').onclick = ()=>{ $('q').value = ''; location.hash = ''; };
document.querySelectorAll('.tabs a').forEach(a=>a.addEventListener('click', ()=>{ $('q').value = ''; depth = 0; }));
addEventListener('hashchange', route);
renderFilters();
yo().then(r=>{ SES = {nivel: r.yo.nivel, procNiveles: r.procNiveles || {}}; }).catch(()=>{}).finally(route);

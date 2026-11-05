/* Inventario de spare: buscar, agregar, retirar, dar entrada, editar, historial y configuración (gavetas, áreas, categorías, líneas).
   Datos en /api/inv/* (netlify/lib/inv.mts). */
import {track} from '/shared/cuenta.js';
const $ = id => document.getElementById(id);
const esc = s => String(s??'').replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const norm = s => String(s??'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
const fecha = iso => new Date(iso).toLocaleString('es-MX', {day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'});
const toast = t => { const d = document.createElement('div'); d.className = 'toast'; d.textContent = t; document.body.appendChild(d); setTimeout(()=>d.remove(), 2600); };
async function api(path, opt={}){
  const r = await fetch('/api/inv/'+path, {credentials:'same-origin', ...opt, headers:{'content-type':'application/json'}});
  if(r.status === 401){ location.href = '/login/?next=/inventario/'; throw new Error('Sesión vencida'); }
  const j = await r.json().catch(()=>({})); if(!r.ok) throw new Error(j.error || 'Error'); return j;
}
const op = (o) => api('op', {method:'POST', body: JSON.stringify(o)});

let S = {config:null, items:[], ultimos:[], permisos:{}}, vista = 'inicio', F = {area:'', linea:'', cat:'', gaveta:'', q:''}, lote = null;
const area = id => S.config.areas.find(a=>a.id===id) || {n:id||'Sin área', c:'#8A8A90'};
const gav = id => S.config.gavetas.find(g=>g.id===id);
const bajo = it => it.min > 0 && it.cant <= it.min;

/* ---------- dibujo de gavetas ---------- */
export function gavSVG(g, sel=0, {clic=false, alto=96} = {}){
  if(!g) return '';
  const n = g.niveles, on = 'var(--inv)';
  if(g.tipo === 'reja'){   // chaparra, ancha, de reja
    const W = 240, H = 130, x0 = 10, y0 = 12, w = W-20, h = H-30, rh = h/n;
    let s = `<svg class="niv" viewBox="0 0 ${W} ${H}" style="height:${alto}px"><defs><pattern id="reja${g.id}" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M0 0L8 8M8 0L0 8" stroke="#8A8F98" stroke-width=".8"/></pattern></defs>
      <rect x="${x0-4}" y="${y0-6}" width="${w+8}" height="${h+12}" rx="6" fill="#5F656E"/>`;
    for(let i=0;i<n;i++){ const y = y0 + i*rh, act = sel===i+1;
      s += `<rect class="n" data-niv="${i+1}" x="${x0}" y="${y+1.5}" width="${w}" height="${rh-3}" rx="3" fill="${act?on:'#C9CDD3'}"/><rect x="${x0}" y="${y+1.5}" width="${w}" height="${rh-3}" rx="3" fill="url(#reja${g.id})" opacity="${act?.25:.9}" pointer-events="none"/>
        <text x="${x0+8}" y="${y+rh/2+4}" font-size="11" font-weight="800" fill="${act?'#fff':'#3A3F47'}" pointer-events="none">${i+1}</text>`; }
    return s + `<rect x="${x0}" y="${H-14}" width="10" height="10" fill="#5F656E"/><rect x="${W-20}" y="${H-14}" width="10" height="10" fill="#5F656E"/></svg>`;
  }
  // alta, gris, de cajones
  const W = 130, H = 230, x0 = 12, y0 = 12, w = W-24, h = H-28, rh = h/n;
  let s = `<svg class="niv" viewBox="0 0 ${W} ${H}" style="height:${alto}px"><rect x="4" y="4" width="${W-8}" height="${H-12}" rx="8" fill="#8E949C"/>`;
  for(let i=0;i<n;i++){ const y = y0 + i*rh, act = sel===i+1;
    s += `<rect class="n" data-niv="${i+1}" x="${x0}" y="${y+2}" width="${w}" height="${rh-4}" rx="4" fill="${act?on:'#C5CAD1'}"/>
      <rect x="${W/2-14}" y="${y+rh/2-2.5}" width="28" height="5" rx="2.5" fill="${act?'#fff':'#6B7079'}" pointer-events="none"/>
      <text x="${x0+7}" y="${y+14}" font-size="11" font-weight="800" fill="${act?'#fff':'#3A3F47'}" pointer-events="none">${i+1}</text>`; }
  return s + `<rect x="10" y="${H-8}" width="14" height="6" fill="#6B7079"/><rect x="${W-24}" y="${H-8}" width="14" height="6" fill="#6B7079"/></svg>`;
}
const lugarTxt = it => { const g = gav(it.gaveta); return [g?.n || '', it.nivel ? `${g?.tipo==='reja'?'repisa':'cajón'} ${it.nivel}` : '', it.lugar].filter(Boolean).join(' · '); };

/* ---------- piezas ---------- */
const IC = {
  caja:'<path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z"/><path d="M3 7.5 12 12l9-4.5M12 12v9"/>',
};
const ico = k => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${IC[k]}</svg>`;
function itemHTML(it){
  const a = area(it.area);
  return `<div class="it${lote && lote.has(it.id)?' sel':''}" data-it="${esc(it.id)}" style="--c:${a.c}"><span class="ar">${ico('caja')}</span>
    <span><b>${esc(it.desc)}${bajo(it)?'<span class="bajo">BAJO</span>':''}</b><small><span class="pn">${esc(it.pn)}</span>${it.sn?` · SN ${esc(it.sn)}`:''} · ${esc(it.cat||'Sin categoría')}${it.marca?' · '+esc(it.marca):''}</small>
    <small>📍 ${esc(lugarTxt(it) || 'Sin lugar')}${it.lineas?.length?' · '+esc(it.lineas.join(', ')):''}</small></span>
    <span class="q2"><b>${it.cant}</b><br><span>pzas</span></span></div>`;
}
const MV = {alta:['＋','Alta'], entrada:['＋','Entrada'], retiro:['−','Retiro'], edicion:['✎','Edición'], baja:['✕','Baja'], deshacer:['↩','Deshecho'], config:['⚙','Configuración']};
function movHTML(m){
  const [k, t] = MV[m.tipo] || ['•', m.tipo];
  const d = m.delta ? ` <b style="display:inline;color:${m.delta>0?'#17744D':'#A35B00'}">${m.delta>0?'+':''}${m.delta}</b>` : '';
  return `<div class="mv" ${m.id?`data-it="${esc(m.id)}"`:''}><span class="k ${m.tipo}">${k}</span><span class="x"><b>${t}${d} · ${esc(m.desc||'')}</b>
    <span>${esc(m.pn||'')}${m.pn?' · ':''}${esc(m.nombre)}${m.destino?' → '+esc(m.destino):''}${m.deshecho?' · (deshecho)':''}${m.nota?' · '+esc(m.nota):''}</span></span><span class="t">${fecha(m.fecha)}</span></div>`;
}
function filtrar(lst){
  const q = norm(F.q).trim(), toks = q.split(/\s+/).filter(Boolean);
  return lst.filter(it => (!F.area || it.area===F.area) && (!F.linea || (it.lineas||[]).includes(F.linea)) && (!F.cat || it.cat===F.cat) && (!F.gaveta || it.gaveta===F.gaveta)
    && toks.every(t => norm([it.pn, it.sn, it.desc, it.cat, it.marca, it.equipo, it.lugar, it.notas, (it.lineas||[]).join(' '), area(it.area).n].join(' ')).includes(t)))
    .sort((a,b)=> (bajo(b)-bajo(a)) || a.desc.localeCompare(b.desc));
}
const chipsArea = () => `<div class="chips">${[{id:'',n:'Todo',c:'transparent'}, ...S.config.areas].map(a=>`<button data-area="${esc(a.id)}" class="${F.area===a.id?'on':''}" style="--c:${a.c}">${a.id?'<i></i>':''}${esc(a.n)}</button>`).join('')}</div>`;

/* ---------- vistas ---------- */
function vInicio(){
  const bajos = S.items.filter(bajo);
  const lst = filtrar(S.items);
  return `<div class="cols"><div class="card"><div class="q">${'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>'}<input id="qq" placeholder="Buscar: número de parte, SN, descripción, marca, gaveta…" value="${esc(F.q)}" autocomplete="off"></div>
      <div class="acc">${S.permisos.editar?'<button class="ag" data-a="alta"><i>＋</i><b>Agregar</b><small>Material nuevo</small></button>':''}
        <button class="re" data-a="retiro"><i>−</i><b>Retirar</b><small>Sacar piezas</small></button>
        ${S.permisos.editar?'<button class="en" data-a="entrada"><i>↥</i><b>Entrada</b><small>Sumar a uno existente</small></button>':''}</div>
      <button class="undo" data-a="deshacer">↩ Deshacer mi último retiro</button></div>
    <div class="card"><b style="font-size:16px">Últimos movimientos</b>${S.ultimos.length ? S.ultimos.slice(0,6).map(movHTML).join('') : '<div class="empty">Sin movimientos todavía.</div>'}
      <div style="margin-top:8px"><button class="btn" data-v="historial">Ver historial completo ›</button></div></div></div>
    ${bajos.length?`<div class="card" style="border-color:rgba(229,72,77,.4)"><b style="color:#C2292E">⚠ ${bajos.length} con poco stock</b><div class="lst" style="margin-top:8px">${bajos.slice(0,5).map(itemHTML).join('')}</div></div>`:''}
    <h3 class="lb">Material (${lst.length})</h3>${chipsArea()}<div class="lst">${lst.slice(0,60).map(itemHTML).join('') || vacio()}</div>
    ${lst.length>60?`<div style="margin-top:10px"><button class="btn" data-v="buscar">Ver los ${lst.length} en Búsqueda ›</button></div>`:''}`;
}
const vacio = () => `<div class="empty">${S.items.length ? 'Nada coincide con la búsqueda.' : 'Todavía no hay material. ' + (S.permisos.editar ? 'Toca <b>Agregar</b> para empezar.' : '')}</div>`;
function vBuscar(){
  const lst = filtrar(S.items), sel = (k, l, n) => `<select data-f="${k}"><option value="">${n}: todas</option>${l.map(x=>{ const v = typeof x==='string'?x:x.id, t = typeof x==='string'?x:x.n; return `<option value="${esc(v)}" ${F[k]===v?'selected':''}>${esc(t)}</option>`; }).join('')}</select>`;
  return `<div class="q" style="margin-bottom:10px"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input id="qq" placeholder="Buscar…" value="${esc(F.q)}" autocomplete="off"></div>
    <div class="filt">${sel('area', S.config.areas, 'Área')}${sel('linea', S.config.lineas, 'Línea')}${sel('cat', S.config.categorias, 'Categoría')}${sel('gaveta', S.config.gavetas, 'Gaveta')}</div>
    <div class="row2" style="margin-bottom:10px"><b style="flex:1">${lst.length} materiales · ${lst.reduce((a,b)=>a+b.cant,0)} piezas</b>
      <button class="btn" data-a="csv">⤓ Exportar CSV</button>${S.permisos.editar?`<button class="btn" data-a="lote">${lote?'Cancelar selección':'Editar en lote'}</button>`:''}</div>
    ${lote?`<div class="card row2" style="background:color-mix(in srgb,var(--inv) 8%,var(--surface))"><b style="flex:1">${lote.size} seleccionados · toca para marcar</b><button class="btn" data-a="lote-todo">Marcar todos</button><button class="btn dk" data-a="lote-ok" ${lote.size?'':'disabled'}>Cambiar…</button></div>`:''}
    <div class="lst">${lst.map(itemHTML).join('') || vacio()}</div>`;
}
let MOVS = null, MF = {tipo:'', q:''};
async function vHistorial(){
  if(!MOVS){ $('out').innerHTML = '<div class="empty">Cargando historial…</div>'; MOVS = (await api('movs?meses=3')).movs; }
  const q = norm(MF.q), lst = MOVS.filter(m => (!MF.tipo || m.tipo===MF.tipo) && (!q || norm([m.desc, m.pn, m.nombre, m.destino, m.nota].join(' ')).includes(q)));
  return `<div class="filt"><input class="in" id="mq" placeholder="Buscar en el historial (material, persona, destino)…" value="${esc(MF.q)}" style="flex:2 1 220px;border:1px solid var(--line);border-radius:12px;padding:9px 10px;font:inherit;font-size:14px;background:var(--surface);color:inherit">
    <select data-mf="tipo"><option value="">Todos los movimientos</option>${Object.entries(MV).map(([k,[,t]])=>`<option value="${k}" ${MF.tipo===k?'selected':''}>${t}</option>`).join('')}</select><button class="btn" data-a="csv-mov">⤓ CSV</button></div>
    <div class="card">${lst.map(movHTML).join('') || '<div class="empty">Sin movimientos.</div>'}</div><div class="faint" style="font-size:12.5px;margin:4px">Últimos 3 meses.</div>`;
}
function vConfig(){
  const c = S.config;
  return `<div class="cfg"><div class="card"><b style="font-size:16px">Gavetas</b><div class="faint" style="font-size:13px;margin:4px 0 10px">Tipo: alta (gris, de cajones) o reja (chaparra y ancha). Niveles = cajones o repisas.</div>
      <div id="cGav">${c.gavetas.map(gavFila).join('')}</div><button class="btn" data-a="c-gav">＋ Agregar gaveta</button>
      <div class="gav" style="margin-top:12px">${c.gavetas.map(g=>`<button type="button" disabled>${gavSVG(g,0,{alto:90})}${esc(g.n)}</button>`).join('')}</div></div>
    <div class="card"><b style="font-size:16px">Áreas (spare)</b><div id="cAr" style="margin-top:10px">${c.areas.map(arFila).join('')}</div><button class="btn" data-a="c-ar">＋ Agregar área</button></div>
    <div class="card"><b style="font-size:16px">Categorías</b> <span class="faint" style="font-size:13px">(una por renglón)</span><textarea id="cCat">${esc(c.categorias.join('\n'))}</textarea></div>
    <div class="card"><b style="font-size:16px">Líneas</b> <span class="faint" style="font-size:13px">(una por renglón)</span><textarea id="cLin" style="min-height:110px">${esc(c.lineas.join('\n'))}</textarea></div>
    <div class="card row2"><button class="btn dk" data-a="c-ok">Guardar configuración</button><a class="btn" href="/admin/#usuarios" style="text-decoration:none">👥 Usuarios y niveles ›</a>
      <span class="faint" style="font-size:12.5px">Retirar: cualquiera · Agregar / editar: técnico o más · Eliminar y configuración: admin</span></div></div>`;
}
const gavFila = g => `<div class="gl" data-gid="${esc(g.id)}"><input value="${esc(g.n)}" data-k="n" placeholder="Nombre"><select data-k="tipo"><option value="alta" ${g.tipo!=='reja'?'selected':''}>Alta gris</option><option value="reja" ${g.tipo==='reja'?'selected':''}>Reja</option></select><input type="number" min="1" max="12" value="${g.niveles}" data-k="niveles" title="Niveles"><button class="x" data-del-fila>✕</button></div>`;
const arFila = a => `<div class="al" data-aid="${esc(a.id)}"><input value="${esc(a.n)}" data-k="n" placeholder="Nombre del área"><input type="color" value="${esc(a.c)}" data-k="c"><button class="x" data-del-fila>✕</button></div>`;

async function pintar(){
  document.querySelectorAll('#seg button').forEach(b=>b.classList.toggle('on', b.dataset.v===vista));
  try{
    $('out').innerHTML = vista==='inicio' ? vInicio() : vista==='buscar' ? vBuscar() : vista==='historial' ? await vHistorial() : vConfig();
  }catch(e){ $('out').innerHTML = `<div class="empty">${esc(e.message)}</div>`; }
}
async function cargar(){ const r = await api('estado'); S = r; $('segCfg').hidden = !S.permisos.admin; }

/* ---------- hojas (formularios) ---------- */
function hoja(html, onClick){
  const el = document.createElement('div'); el.className = 'sh'; el.innerHTML = `<div class="pp">${html}</div>`;
  el.addEventListener('click', e => { if(e.target === el || e.target.closest('[data-x]')) return el.remove(); onClick && onClick(e, el); });
  document.body.appendChild(el); return el;
}
function verItem(id){
  const it = S.items.find(x=>x.id===id); if(!it) return toast('Ese material ya no existe.');
  const a = area(it.area), g = gav(it.gaveta);
  const el = hoja(`<div class="sub" style="color:${a.c};font-weight:800">${esc(a.n)}</div><h2>${esc(it.desc)}</h2>
    <div class="det"><span>No. de parte</span><b>${esc(it.pn)}${it.auto?' <small class="faint">(interno)</small>':''}</b>${it.sn?`<span>SN</span><b>${esc(it.sn)}</b>`:''}
      <span>Cantidad</span><b style="font-size:22px">${it.cant} pzas ${bajo(it)?'<span class="bajo">BAJO</span>':''}</b>${it.min?`<span>Mínimo</span><b>${it.min}</b>`:''}
      <span>Categoría</span><b>${esc(it.cat||'—')}</b><span>Línea</span><b>${esc((it.lineas||[]).join(', ')||'—')}</b>
      <span>Marca</span><b>${esc(it.marca||'—')}</b><span>Equipo</span><b>${esc(it.equipo||'—')}</b><span>Dónde</span><b>${esc(lugarTxt(it)||'—')}</b>
      ${it.notas?`<span>Notas</span><b style="font-weight:500">${esc(it.notas)}</b>`:''}<span>Último cambio</span><b style="font-weight:500">${esc(it.por)} · ${fecha(it.act)}</b></div>
    ${g?`<div style="text-align:center;margin:6px 0 4px">${gavSVG(g, it.nivel, {alto:150})}</div>`:''}
    <div class="acts" style="flex-wrap:wrap"><button class="ok" data-b="retiro">− Retirar</button>${S.permisos.editar?'<button data-b="entrada">＋ Entrada</button>':''}</div>
    <div class="acts" style="margin-top:8px;flex-wrap:wrap">${S.permisos.editar?'<button data-b="editar">✎ Editar</button>':''}<button data-b="hist">Historial</button>${S.permisos.admin?'<button data-b="eliminar" style="color:#C2292E">Eliminar</button>':''}</div>
    <div id="hItem"></div><div class="acts"><button data-x>Cerrar</button></div>`, async (e, el) => {
    const b = e.target.closest('[data-b]'); if(!b) return;
    if(b.dataset.b==='retiro'){ el.remove(); formCant(it, 'retiro'); }
    if(b.dataset.b==='entrada'){ el.remove(); formCant(it, 'entrada'); }
    if(b.dataset.b==='editar'){ el.remove(); formItem(it); }
    if(b.dataset.b==='hist'){ el.querySelector('#hItem').innerHTML = '<div class="faint" style="padding:8px">Cargando…</div>'; const {movs} = await api('movs?meses=12&item='+encodeURIComponent(it.id)); el.querySelector('#hItem').innerHTML = `<div class="card" style="margin-top:10px">${movs.map(movHTML).join('') || 'Sin movimientos.'}</div>`; }
    if(b.dataset.b==='eliminar' && confirm(`¿Eliminar "${it.desc}" del inventario? Queda registrado en el historial.`)){ try{ await op({op:'eliminar', id: it.id}); el.remove(); toast('Eliminado'); await refrescar(); }catch(err){ alert(err.message); } }
  });
}
function formCant(it, tipo){
  const ret = tipo === 'retiro';
  const el = hoja(`<h2>${ret?'Retirar':'Dar entrada'}</h2><div class="sub">${esc(it.desc)} · ${esc(it.pn)} · hay <b>${it.cant}</b></div>
    <label>Cantidad</label><div class="qty"><button type="button" data-d="-1">−</button><input id="fc" type="number" min="1" value="1" inputmode="numeric"><button type="button" data-d="1">＋</button></div>
    ${ret?`<label>¿Para dónde? (línea / equipo)</label><div class="pick" id="fl">${S.config.lineas.map(l=>`<button type="button" data-l="${esc(l)}">${esc(l)}</button>`).join('')}</div><input id="fd" placeholder="Equipo o estación (ej. Kasalis Moose, estación 3)" style="margin-top:8px" value="${esc(it.equipo||'')}">`:''}
    <label>Nota (opcional)</label><textarea id="fn" placeholder="${ret?'Para qué se usó…':'De dónde llegó, OC…'}"></textarea>
    <div class="err" id="fe"></div><div class="acts"><button data-x>Cancelar</button><button class="ok" id="fok">${ret?'Retirar':'Dar entrada'}</button></div>`, async (e, el) => {
    const d = e.target.closest('[data-d]'); if(d){ const i = el.querySelector('#fc'); i.value = Math.max(1, (+i.value||1) + (+d.dataset.d)); return; }
    const l = e.target.closest('[data-l]'); if(l){ l.classList.toggle('on'); return; }
    if(e.target.id === 'fok'){
      const cant = +el.querySelector('#fc').value, b = e.target;
      const lin = [...el.querySelectorAll('[data-l].on')].map(x=>x.dataset.l).join(', '), eq = el.querySelector('#fd')?.value.trim();
      b.disabled = true;
      try{ await op({op: tipo, id: it.id, cant, destino: [lin, eq].filter(Boolean).join(' · '), nota: el.querySelector('#fn').value}); el.remove(); toast(ret?`Retiraste ${cant}`:`Entrada de ${cant}`); await refrescar(); }
      catch(err){ el.querySelector('#fe').textContent = err.message; b.disabled = false; }
    }
  });
  el.querySelector('#fc').select();
}
function elegir(titulo, cb){
  const el = hoja(`<h2>${esc(titulo)}</h2><div class="sub">Busca el material</div><div class="q"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input id="eq" placeholder="Número de parte, SN, descripción…" autocomplete="off"></div>
    <div class="lst" id="el" style="margin-top:10px"></div><div class="acts"><button data-x>Cancelar</button></div>`, (e, el) => { const t = e.target.closest('[data-it]'); if(t){ el.remove(); cb(S.items.find(x=>x.id===t.dataset.it)); } });
  const pint = () => { const q = norm(el.querySelector('#eq').value).split(/\s+/).filter(Boolean);
    el.querySelector('#el').innerHTML = S.items.filter(it => q.every(t => norm([it.pn,it.sn,it.desc,it.marca,it.cat].join(' ')).includes(t))).slice(0,40).map(itemHTML).join('') || '<div class="empty">Nada coincide.</div>'; };
  el.querySelector('#eq').addEventListener('input', pint); pint(); el.querySelector('#eq').focus();
}
function formItem(it){
  const nuevo = !it, v = it || {area: F.area || S.config.areas[0]?.id, lineas: F.linea?[F.linea]:[], gaveta: S.config.gavetas[0]?.id, nivel:0, cant:1, min:0};
  let gSel = v.gaveta, nSel = v.nivel || 0, aSel = v.area, lSel = new Set(v.lineas||[]);
  const gavHTML = () => S.config.gavetas.map(g=>`<button type="button" data-g="${esc(g.id)}" class="${g.id===gSel?'on':''}">${gavSVG(g, g.id===gSel?nSel:0, {alto:110})}${esc(g.n)}</button>`).join('');
  const el = hoja(`<h2>${nuevo?'Agregar material':'Editar material'}</h2><div class="sub">${nuevo?'Si no tiene número de parte, déjalo vacío y se genera uno interno (AUT-00001…).':esc(v.pn)}</div>
    <label>Área</label><div class="pick" id="fa">${S.config.areas.map(a=>`<button type="button" data-a2="${esc(a.id)}" class="${a.id===aSel?'on':''}">${esc(a.n)}</button>`).join('')}</div>
    <div class="g2"><div><label>No. de parte</label><input id="i_pn" value="${esc(nuevo?'':v.pn)}" placeholder="Vacío = automático" autocapitalize="characters"></div><div><label>SN (opcional)</label><input id="i_sn" value="${esc(v.sn||'')}"></div></div>
    <label>Descripción</label><input id="i_desc" value="${esc(v.desc||'')}" placeholder="Qué es: ej. Sensor fotoeléctrico M18">
    <div class="g2">${nuevo?`<div><label>Cantidad</label><input id="i_cant" type="number" min="0" value="${v.cant}" inputmode="numeric"></div>`:''}<div><label>Mínimo (aviso)</label><input id="i_min" type="number" min="0" value="${v.min||0}" inputmode="numeric"></div></div>
    <label>Categoría</label><select id="i_cat"><option value="">— Elige —</option>${S.config.categorias.map(c=>`<option ${c===v.cat?'selected':''}>${esc(c)}</option>`).join('')}</select>
    <label>Línea(s)</label><div class="pick" id="fli">${S.config.lineas.map(l=>`<button type="button" data-li="${esc(l)}" class="${lSel.has(l)?'on':''}">${esc(l)}</button>`).join('')}</div>
    <div class="g2"><div><label>Marca</label><input id="i_marca" value="${esc(v.marca||'')}"></div><div><label>Equipo</label><input id="i_equipo" value="${esc(v.equipo||'')}" placeholder="Dónde se usa"></div></div>
    <label>¿En qué gaveta? <span style="text-transform:none;letter-spacing:0;font-weight:600">(toca el cajón o repisa)</span></label><div class="gav" id="fg">${gavHTML()}</div>
    <label>Lugar dentro (bin, caja, bolsa…)</label><input id="i_lugar" value="${esc(v.lugar||'')}" placeholder="Ej. bin azul 3, caja de pogos">
    <label>Notas</label><textarea id="i_notas">${esc(v.notas||'')}</textarea>
    <div class="err" id="fe"></div><div class="acts"><button data-x>Cancelar</button><button class="ok" id="fok">${nuevo?'Agregar':'Guardar'}</button></div>`, async (e, el) => {
    const a = e.target.closest('[data-a2]'); if(a){ aSel = a.dataset.a2; el.querySelectorAll('[data-a2]').forEach(x=>x.classList.toggle('on', x===a)); return; }
    const li = e.target.closest('[data-li]'); if(li){ li.classList.toggle('on'); lSel[li.classList.contains('on')?'add':'delete'](li.dataset.li); return; }
    const n = e.target.closest('[data-niv]'), g = e.target.closest('[data-g]');
    if(g){ const nuevoG = g.dataset.g !== gSel; gSel = g.dataset.g; nSel = n ? +n.dataset.niv : (nuevoG ? 0 : nSel); el.querySelector('#fg').innerHTML = gavHTML(); return; }
    if(e.target.id === 'fok'){
      const val = k => el.querySelector('#i_'+k)?.value;
      const datos = {pn: val('pn'), sn: val('sn'), desc: val('desc'), min: +val('min')||0, cat: val('cat'), area: aSel, lineas: [...lSel], marca: val('marca'), equipo: val('equipo'), gaveta: gSel, nivel: nSel, lugar: val('lugar'), notas: val('notas')};
      if(!datos.desc.trim()) return el.querySelector('#fe').textContent = 'Escribe la descripción.';
      e.target.disabled = true;
      try{
        if(nuevo){ const r = await op({op:'alta', item: {...datos, cant: +val('cant')||0}}); toast(`Agregado: ${r.item.pn}`); }
        else { await op({op:'editar', id: it.id, cambios: datos}); toast('Guardado'); }
        el.remove(); await refrescar();
      }catch(err){ el.querySelector('#fe').textContent = err.message; e.target.disabled = false; }
    }
  });
}
function formLote(){
  let gSel = '', nSel = 0;
  const el = hoja(`<h2>Editar ${lote.size} materiales</h2><div class="sub">Solo se cambia lo que elijas; lo demás se queda igual.</div>
    <label>Área</label><select id="l_area"><option value="">— Sin cambio —</option>${S.config.areas.map(a=>`<option value="${esc(a.id)}">${esc(a.n)}</option>`).join('')}</select>
    <label>Categoría</label><select id="l_cat"><option value="">— Sin cambio —</option>${S.config.categorias.map(c=>`<option>${esc(c)}</option>`).join('')}</select>
    <label>Línea(s)</label><select id="l_lin"><option value="">— Sin cambio —</option>${S.config.lineas.map(l=>`<option>${esc(l)}</option>`).join('')}</select>
    <label>Gaveta</label><div class="gav" id="lg">${S.config.gavetas.map(g=>`<button type="button" data-g="${esc(g.id)}">${gavSVG(g,0,{alto:90})}${esc(g.n)}</button>`).join('')}</div>
    <div class="err" id="fe"></div><div class="acts"><button data-x>Cancelar</button><button class="ok" id="fok">Aplicar</button></div>`, async (e, el) => {
    const g = e.target.closest('[data-g]'); if(g){ const n = e.target.closest('[data-niv]'); gSel = g.dataset.g; nSel = n ? +n.dataset.niv : 0;
      el.querySelector('#lg').innerHTML = S.config.gavetas.map(x=>`<button type="button" data-g="${esc(x.id)}" class="${x.id===gSel?'on':''}">${gavSVG(x, x.id===gSel?nSel:0, {alto:90})}${esc(x.n)}</button>`).join(''); return; }
    if(e.target.id === 'fok'){
      const c = {}; const a = el.querySelector('#l_area').value, ca = el.querySelector('#l_cat').value, li = el.querySelector('#l_lin').value;
      if(a) c.area = a; if(ca) c.cat = ca; if(li) c.lineas = [li]; if(gSel){ c.gaveta = gSel; c.nivel = nSel; }
      if(!Object.keys(c).length) return el.querySelector('#fe').textContent = 'Elige al menos un cambio.';
      try{ const r = await op({op:'lote', ids:[...lote], cambios:c}); el.remove(); lote = null; toast(`${r.n} actualizados`); await refrescar(); }catch(err){ el.querySelector('#fe').textContent = err.message; }
    }
  });
}

/* ---------- CSV ---------- */
function csv(nombre, filas){
  const s = filas.map(r=>r.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(',')).join('\r\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿'+s], {type:'text/csv;charset=utf-8'})); a.download = nombre; a.click();
}

/* ---------- eventos ---------- */
async function refrescar(){ await cargar(); MOVS = null; pintar(); }
let tq, tt;
document.addEventListener('input', e => {
  if(e.target.id === 'qq'){ F.q = e.target.value; clearTimeout(tq); tq = setTimeout(()=>{ const pos = e.target.selectionStart; if(vista==='inicio' && F.q) vista = 'buscar'; pintar().then(()=>{ const i = $('qq'); if(i){ i.focus(); i.setSelectionRange(pos,pos); } }); }, 200);
    clearTimeout(tt); tt = setTimeout(()=>{ if(F.q.trim()) track('busqueda', {q: F.q.trim(), n: filtrar(S.items).length, ruta:'inventario'}); }, 1500); }
  if(e.target.id === 'mq'){ MF.q = e.target.value; clearTimeout(tq); tq = setTimeout(()=>{ pintar().then(()=>{ const i = $('mq'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }); }, 250); }
});
document.addEventListener('change', e => {
  const f = e.target.closest('[data-f]'); if(f){ F[f.dataset.f] = f.value; pintar(); }
  const m = e.target.closest('[data-mf]'); if(m){ MF[m.dataset.mf] = m.value; pintar(); }
});
$('seg').onclick = e => { const b = e.target.closest('[data-v]'); if(b){ vista = b.dataset.v; lote = null; pintar(); track('vista', {ruta:'inventario/'+vista, titulo:'Inventario · '+b.textContent.trim()}); } };
$('out').addEventListener('click', async e => {
  const v = e.target.closest('[data-v]'); if(v){ vista = v.dataset.v; return pintar(); }
  const ar = e.target.closest('[data-area]'); if(ar){ F.area = ar.dataset.area; return pintar(); }
  const it = e.target.closest('[data-it]');
  if(it){ if(lote){ lote.has(it.dataset.it) ? lote.delete(it.dataset.it) : lote.add(it.dataset.it); return pintar(); } return verItem(it.dataset.it); }
  const a = e.target.closest('[data-a]'); if(!a) return;
  const k = a.dataset.a;
  if(k==='alta') formItem();
  if(k==='retiro') elegir('¿Qué vas a retirar?', x => formCant(x, 'retiro'));
  if(k==='entrada') elegir('¿A qué le das entrada?', x => formCant(x, 'entrada'));
  if(k==='deshacer'){ if(!confirm('¿Deshacer tu último retiro? Las piezas regresan al inventario.')) return; try{ const r = await op({op:'deshacer'}); toast(`Regresaron ${r.mov.delta} de ${r.item.desc}`); await refrescar(); }catch(err){ alert(err.message); } }
  if(k==='csv') csv(`inventario-${new Date().toISOString().slice(0,10)}.csv`, [['No. de parte','SN','Descripción','Cantidad','Mínimo','Categoría','Área','Línea(s)','Marca','Equipo','Gaveta','Nivel','Lugar','Notas','Último cambio','Por'],
    ...filtrar(S.items).map(i=>[i.pn,i.sn,i.desc,i.cant,i.min,i.cat,area(i.area).n,(i.lineas||[]).join(' / '),i.marca,i.equipo,gav(i.gaveta)?.n||'',i.nivel||'',i.lugar,i.notas,i.act,i.por])]);
  if(k==='csv-mov') csv(`movimientos-${new Date().toISOString().slice(0,10)}.csv`, [['Fecha','Tipo','No. de parte','Descripción','Cambio','Antes','Después','Persona','No. control','Destino','Nota'],
    ...MOVS.map(m=>[m.fecha,(MV[m.tipo]||[,m.tipo])[1],m.pn,m.desc,m.delta,m.antes,m.despues,m.nombre,m.num,m.destino,m.nota])]);
  if(k==='lote'){ lote = lote ? null : new Set(); pintar(); }
  if(k==='lote-todo'){ filtrar(S.items).forEach(i=>lote.add(i.id)); pintar(); }
  if(k==='lote-ok') formLote();
  if(k==='c-gav') $('cGav').insertAdjacentHTML('beforeend', gavFila({id:'', n:'', tipo:'alta', niveles:4}));
  if(k==='c-ar') $('cAr').insertAdjacentHTML('beforeend', arFila({id:'', n:'', c:'#5E6B78'}));
  if(k==='c-ok'){
    const lineas = t => t.split('\n').map(x=>x.trim()).filter(Boolean);
    const config = {
      gavetas: [...document.querySelectorAll('#cGav .gl')].map(r=>({id: r.dataset.gid || norm(r.querySelector('[data-k=n]').value).replace(/[^a-z0-9]+/g,'-'), n: r.querySelector('[data-k=n]').value, tipo: r.querySelector('[data-k=tipo]').value, niveles: +r.querySelector('[data-k=niveles]').value})),
      areas: [...document.querySelectorAll('#cAr .al')].map(r=>({id: r.dataset.aid || norm(r.querySelector('[data-k=n]').value).replace(/[^a-z0-9]+/g,'-'), n: r.querySelector('[data-k=n]').value, c: r.querySelector('[data-k=c]').value})),
      categorias: lineas($('cCat').value), lineas: lineas($('cLin').value)};
    try{ await api('config', {method:'POST', body: JSON.stringify({config})}); toast('Configuración guardada'); await refrescar(); }catch(err){ alert(err.message); }
  }
  const df = e.target.closest('[data-del-fila]'); if(df) df.parentElement.remove();
});

cargar().then(pintar).catch(e => $('out').innerHTML = `<div class="empty">${esc(e.message)}</div>`);
track('vista', {ruta:'inventario/inicio', titulo:'Inventario'});

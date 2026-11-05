/* Inventario de spare: buscar (texto, escáner o por foto), agregar con foto, retirar, dar entrada, editar, historial y configuración.
   Datos en /api/inv/* (netlify/lib/inv.mts). Fotos en /api/foto (comprimidas en el celular antes de subir). */
import {track} from '/shared/cuenta.js';
import {escanear} from '/shared/escaner.js';
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

let S = {config:null, items:[], ultimos:[], permisos:{}}, vista = 'inicio', F = {linea:'', cat:'', gaveta:'', q:''}, lote = null, modoBusq = 'lista', gavFoto = '';
const COL_LINEA = {gecko:'#8B5CF6', moose:'#F08C00', scorpion:'#2F6BFF', elk:'#12A594', spare:'#5E6B78', infurrow:'#8A8A90'};
const colItem = it => COL_LINEA[norm((it.lineas||[])[0])] || '#5E6B78';
const gav = id => S.config.gavetas.find(g=>g.id===id);
const fotoUrl = id => `/api/foto/${encodeURIComponent(id)}`;
/* foto: se reduce a 1024 px y JPEG 70 % (≈ 80-200 KB): legible para leer etiquetas y no ocupa casi nada */
async function comprimir(file){
  const img = await new Promise((ok, no)=>{ const i = new Image(); i.onload = ()=>ok(i); i.onerror = no; i.src = URL.createObjectURL(file); });
  const k = Math.min(1, 1024 / Math.max(img.width, img.height));
  const c = document.createElement('canvas'); c.width = Math.round(img.width*k); c.height = Math.round(img.height*k);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(img.src);
  return c.toDataURL('image/jpeg', .7);
}
async function subirFoto(dataUrl){
  const r = await fetch('/api/foto', {method:'POST', credentials:'same-origin', headers:{'content-type':'application/json'}, body: JSON.stringify({foto: dataUrl})});
  const j = await r.json().catch(()=>({})); if(!r.ok) throw new Error(j.error || 'No se pudo subir la foto'); return j.id;
}
function verFoto(src){ const d = document.createElement('div'); d.style.cssText = 'position:fixed;inset:0;z-index:96;background:rgba(0,0,0,.94);display:grid;place-items:center;padding:16px'; d.innerHTML = `<img src="${src}" style="max-width:100%;max-height:100%;border-radius:10px">`; d.onclick = () => d.remove(); document.body.appendChild(d); }
const bajo = it => it.min > 0 && it.cant <= it.min;

/* ---------- dibujo de gavetas (fijo, solo para reconocerlas) ---------- */
export function gavSVG(g, {alto=96} = {}){
  if(!g) return '';
  if(g.tipo === 'reja'){   // 3 repisas con varias cajas en cada una
    const W = 240, H = 150;
    const cajas = [[6,5,7,4,6],[5,7,5,6],[7,4,6,5,5]];
    const colores = ['#4A7BD0','#D0503F','#E2A43A','#3E9E6E','#7D6BC9','#4A7BD0','#E2A43A'];
    let s = `<svg viewBox="0 0 ${W} ${H}" style="height:${alto}px"><defs><pattern id="rj${g.id}" width="7" height="7" patternUnits="userSpaceOnUse"><path d="M0 0L7 7M7 0L0 7" stroke="#9AA0A8" stroke-width=".7"/></pattern></defs>
      <rect x="6" y="6" width="${W-12}" height="${H-18}" rx="6" fill="#5F656E"/><rect x="12" y="12" width="${W-24}" height="${H-30}" rx="3" fill="url(#rj${g.id})" opacity=".55"/>`;
    const rh = (H-30)/3;
    cajas.forEach((fila, r) => {
      const y = 12 + r*rh, tot = fila.reduce((a,b)=>a+b,0); let x = 16;
      fila.forEach((w0, k) => { const w = (W-32 - (fila.length-1)*4) * w0/tot, h = rh-12;
        s += `<rect x="${x}" y="${y+rh-6-h}" width="${w}" height="${h}" rx="3" fill="${colores[(r*3+k)%colores.length]}"/><rect x="${x+w*.3}" y="${y+rh-6-h+5}" width="${w*.4}" height="4" rx="2" fill="rgba(255,255,255,.55)"/>`; x += w + 4; });
      s += `<rect x="12" y="${y+rh-6}" width="${W-24}" height="4" fill="#7A8089"/>`;
    });
    return s + `<rect x="12" y="${H-12}" width="12" height="10" fill="#5F656E"/><rect x="${W-24}" y="${H-12}" width="12" height="10" fill="#5F656E"/></svg>`;
  }
  if(g.tipo === 'maquina'){   // Kasalis Scorpion: gabinete blanco con laterales rojos, pantallas, teclado y puertas abajo
    const W = 200, H = 240;
    return `<svg viewBox="0 0 ${W} ${H}" style="height:${alto}px">
      <rect x="10" y="8" width="180" height="226" rx="4" fill="#ECEDEF" stroke="#C9CDD3"/>
      <rect x="10" y="8" width="24" height="120" fill="#D8262C"/><rect x="166" y="8" width="24" height="120" fill="#D8262C"/>
      <rect x="40" y="16" width="34" height="24" rx="2" fill="#DDE6EE" stroke="#9AA4AE"/>
      <rect x="112" y="18" width="46" height="34" rx="2" fill="#2A2F36"/><rect x="115" y="21" width="40" height="28" fill="#6E8FB8"/>
      <rect x="76" y="54" width="54" height="40" rx="2" fill="#2A2F36"/><rect x="79" y="57" width="48" height="34" fill="#7FA3C9"/>
      <path d="M44 50 l10 0 l6 40 l-8 0z" fill="#B8BDC4"/><rect x="42" y="88" width="10" height="16" fill="#D8262C"/>
      <rect x="36" y="104" width="128" height="6" fill="#C9CDD3"/>
      <rect x="40" y="112" width="58" height="12" rx="2" fill="#4B5058"/><rect x="100" y="112" width="12" height="12" rx="2" fill="#3E9E6E"/>
      <rect x="150" y="96" width="5" height="22" rx="2" fill="#2A2F36"/>
      <rect x="18" y="132" width="164" height="96" rx="3" fill="#E2E4E7" stroke="#C9CDD3"/>
      <line x1="100" y1="134" x2="100" y2="226" stroke="#C9CDD3" stroke-width="2"/>
      <rect x="84" y="176" width="5" height="16" rx="2" fill="#8E949C"/><rect x="111" y="176" width="5" height="16" rx="2" fill="#8E949C"/>
      <rect x="66" y="142" width="40" height="22" fill="#fff" stroke="#C9CDD3"/><path d="M80 196 l8 -12 l8 12z" fill="#F2C230"/>
      <rect x="20" y="234" width="16" height="4" fill="#6B7079"/><rect x="164" y="234" width="16" height="4" fill="#6B7079"/></svg>`;
  }
  // piso: gris alta con 2 puertas verticales
  const W = 130, H = 230;
  return `<svg viewBox="0 0 ${W} ${H}" style="height:${alto}px"><rect x="4" y="4" width="${W-8}" height="${H-14}" rx="8" fill="#8E949C"/>
    <rect x="11" y="11" width="${(W-26)/2}" height="${H-28}" rx="4" fill="#C5CAD1"/><rect x="${15+(W-26)/2}" y="11" width="${(W-26)/2}" height="${H-28}" rx="4" fill="#C5CAD1"/>
    <rect x="${W/2-11}" y="${H/2-22}" width="5" height="34" rx="2.5" fill="#6B7079"/><rect x="${W/2+6}" y="${H/2-22}" width="5" height="34" rx="2.5" fill="#6B7079"/>
    <rect x="${W/2-14}" y="20" width="28" height="10" rx="2" fill="#E9EBEE"/>
    <rect x="10" y="${H-10}" width="14" height="8" fill="#6B7079"/><rect x="${W-24}" y="${H-10}" width="14" height="8" fill="#6B7079"/></svg>`;
}
const lugarTxt = it => [gav(it.gaveta)?.n || '', it.lugar].filter(Boolean).join(' · ');
const TIPO_GAV = {piso:'Gaveta de piso (2 puertas)', reja:'Reja con cajas (3 niveles)', maquina:'Máquina (Kasalis)'};

/* ---------- piezas ---------- */
const IC = {
  caja:'<path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z"/><path d="M3 7.5 12 12l9-4.5M12 12v9"/>',
};
const ico = k => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${IC[k]}</svg>`;
function itemHTML(it){
  return `<div class="it${lote && lote.has(it.id)?' sel':''}" data-it="${esc(it.id)}" style="--c:${colItem(it)}"><span class="ar">${it.foto?`<img loading="lazy" src="${fotoUrl(it.foto)}" alt="">`:ico('caja')}</span>
    <span><b>${esc(it.desc)}${bajo(it)?'<span class="bajo">BAJO</span>':''}</b><small><span class="pn">${esc(it.pn)}</span> · ${esc(it.cat||'Sin categoría')}${it.marca?' · '+esc(it.marca):''}</small>
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
  return lst.filter(it => (!F.linea || (it.lineas||[]).includes(F.linea)) && (!F.cat || it.cat===F.cat) && (!F.gaveta || it.gaveta===F.gaveta)
    && toks.every(t => norm([it.pn, it.desc, it.cat, it.marca, it.equipo, it.lugar, (it.lineas||[]).join(' '), gav(it.gaveta)?.n].join(' ')).includes(t)))
    .sort((a,b)=> (bajo(b)-bajo(a)) || a.desc.localeCompare(b.desc));
}
const chipsLinea = () => `<div class="chips">${['', ...S.config.lineas].map(l=>`<button data-linea="${esc(l)}" class="${F.linea===l?'on':''}" style="--c:${COL_LINEA[norm(l)]||'#5E6B78'}">${l?'<i></i>':''}${esc(l||'Todo')}</button>`).join('')}</div>`;
const ESC_IC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 8v8M10 8v8M13 8v8M17 8v8"/></svg>';
const caja = (id, ph) => `<div class="q">${'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>'}<input id="${id}" placeholder="${ph}" value="${esc(id==='qq'?F.q:'')}" autocomplete="off"><button class="scan" data-a="scan" data-para="${id}" aria-label="Escanear código">${ESC_IC}</button></div>`;

/* ---------- vistas ---------- */
function vInicio(){
  const bajos = S.items.filter(bajo);
  const lst = filtrar(S.items);
  return `<div class="cols"><div class="card">${caja('qq', 'Buscar: número de parte, descripción, marca…')}
      <div class="acc">${S.permisos.editar?'<button class="ag" data-a="alta"><i>＋</i><b>Agregar</b><small>Material nuevo</small></button>':''}
        <button class="re" data-a="retiro"><i>−</i><b>Retirar</b><small>Sacar piezas</small></button>
        ${S.permisos.editar?'<button class="en" data-a="entrada"><i>↥</i><b>Entrada</b><small>Sumar a uno existente</small></button>':''}</div>
      <button class="undo" data-a="deshacer">↩ Deshacer mi último retiro</button></div>
    <div class="card"><b style="font-size:16px">Últimos movimientos</b>${S.ultimos.length ? S.ultimos.slice(0,6).map(movHTML).join('') : '<div class="empty">Sin movimientos todavía.</div>'}
      <div style="margin-top:8px"><button class="btn" data-v="historial">Ver historial completo ›</button></div></div></div>
    ${bajos.length?`<div class="card" style="border-color:rgba(229,72,77,.4)"><b style="color:#C2292E">⚠ ${bajos.length} con poco stock</b><div class="lst" style="margin-top:8px">${bajos.slice(0,5).map(itemHTML).join('')}</div></div>`:''}
    <h3 class="lb">Material (${lst.length})</h3>${chipsLinea()}<div class="lst">${lst.slice(0,60).map(itemHTML).join('') || vacio()}</div>
    ${lst.length>60?`<div style="margin-top:10px"><button class="btn" data-v="buscar">Ver los ${lst.length} en Búsqueda ›</button></div>`:''}`;
}
const vacio = () => `<div class="empty">${S.items.length ? 'Nada coincide con la búsqueda.' : 'Todavía no hay material. ' + (S.permisos.editar ? 'Toca <b>Agregar</b> para empezar.' : '')}</div>`;
function vBuscar(){
  const modos = `<div class="pick" style="margin-bottom:12px"><button data-modo="lista" class="${modoBusq==='lista'?'on':''}">☰ Lista</button><button data-modo="foto" class="${modoBusq==='foto'?'on':''}">🖼 Por foto</button></div>`;
  if(modoBusq === 'foto') return modos + vFotos();
  const lst = filtrar(S.items), sel = (k, l, n) => `<select data-f="${k}"><option value="">${n}: todas</option>${l.map(x=>{ const v = typeof x==='string'?x:x.id, t = typeof x==='string'?x:x.n; return `<option value="${esc(v)}" ${F[k]===v?'selected':''}>${esc(t)}</option>`; }).join('')}</select>`;
  return `${modos}<div style="margin-bottom:10px">${caja('qq', 'Buscar…')}</div>
    <div class="filt">${sel('linea', S.config.lineas, 'Línea')}${sel('cat', S.config.categorias, 'Categoría')}${sel('gaveta', S.config.gavetas, 'Gaveta')}</div>
    <div class="row2" style="margin-bottom:10px"><b style="flex:1">${lst.length} materiales · ${lst.reduce((a,b)=>a+b.cant,0)} piezas</b>
      <button class="btn" data-a="csv">⤓ Exportar CSV</button>${S.permisos.editar?`<button class="btn" data-a="lote">${lote?'Cancelar selección':'Editar en lote'}</button>`:''}</div>
    ${lote?`<div class="card row2" style="background:color-mix(in srgb,var(--inv) 8%,var(--surface))"><b style="flex:1">${lote.size} seleccionados · toca para marcar</b><button class="btn" data-a="lote-todo">Marcar todos</button><button class="btn dk" data-a="lote-ok" ${lote.size?'':'disabled'}>Cambiar…</button></div>`:''}
    <div class="lst">${lst.map(itemHTML).join('') || vacio()}</div>`;
}
/* búsqueda visual: eliges la gaveta y ves las fotos de lo que hay ahí */
function vFotos(){
  if(!gavFoto) return `<div class="sub2">¿En qué gaveta lo buscas?</div><div class="gav">${S.config.gavetas.map(g=>{ const n = S.items.filter(i=>i.gaveta===g.id).length;
    return `<button type="button" data-gf="${esc(g.id)}">${gavSVG(g,{alto:110})}<span>${esc(g.n)}</span><small>${n} material${n===1?'':'es'}</small></button>`; }).join('')}</div>`;
  const g = gav(gavFoto), lst = S.items.filter(i=>i.gaveta===gavFoto).sort((a,b)=>(!!b.foto - !!a.foto) || a.desc.localeCompare(b.desc));
  return `<div class="row2" style="margin-bottom:10px"><button class="btn" data-gf="">‹ Gavetas</button><b style="flex:1">${esc(g?.n||'')} · ${lst.length}</b></div>
    <div class="mosaico">${lst.map(it=>`<button type="button" data-it="${esc(it.id)}">${it.foto?`<img loading="lazy" src="${fotoUrl(it.foto)}" alt="">`:`<span class="sinf">${ico('caja')}<em>Sin foto</em></span>`}<b>${esc(it.desc)}</b><small>${esc(it.pn)} · ${it.cant} pzas</small></button>`).join('') || '<div class="empty">No hay material en esta gaveta.</div>'}</div>`;
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
  if(!S.permisos.admin) return `<div class="card" style="max-width:420px"><b style="font-size:16px">Confirma tu contraseña de admin</b><div class="faint" style="font-size:13.5px;margin:6px 0 12px">Para cambiar la configuración o eliminar material.</div>
    <input id="admPin" type="password" autocomplete="current-password" style="width:100%;box-sizing:border-box;height:50px;border-radius:14px;border:1.5px solid var(--line);background:var(--bg);color:inherit;font:inherit;font-size:16px;padding:0 12px">
    <div class="err" id="admErr" style="color:#C2292E;font-size:14px;margin-top:8px"></div><button class="btn dk" data-a="adm-ok" style="margin-top:10px;width:100%;height:48px">Entrar como admin</button></div>`;
  return `<div class="cfg"><div class="card"><b style="font-size:16px">Gavetas y lugares</b><div class="faint" style="font-size:13px;margin:4px 0 10px">El dibujo es solo para reconocerla: de piso (2 puertas), reja con cajas o máquina.</div>
      <div id="cGav">${c.gavetas.map(gavFila).join('')}</div><button class="btn" data-a="c-gav">＋ Agregar gaveta</button>
      <div class="gav" style="margin-top:12px">${c.gavetas.map(g=>`<button type="button" disabled>${gavSVG(g,{alto:90})}${esc(g.n)}</button>`).join('')}</div></div>
    <div class="card"><b style="font-size:16px">Categorías</b> <span class="faint" style="font-size:13px">(una por renglón)</span><textarea id="cCat">${esc(c.categorias.join('\n'))}</textarea></div>
    <div class="card"><b style="font-size:16px">Líneas</b> <span class="faint" style="font-size:13px">(una por renglón)</span><textarea id="cLin" style="min-height:110px">${esc(c.lineas.join('\n'))}</textarea></div>
    <div class="card row2"><button class="btn dk" data-a="c-ok">Guardar configuración</button><a class="btn" href="/admin/#usuarios" style="text-decoration:none">👥 Usuarios y niveles ›</a>
      <span class="faint" style="font-size:12.5px">Retirar: cualquiera · Agregar / editar: técnico o más · Eliminar y configuración: admin</span></div></div>`;
}
const gavFila = g => `<div class="gl" data-gid="${esc(g.id)}"><input value="${esc(g.n)}" data-k="n" placeholder="Nombre"><select data-k="tipo">${Object.entries(TIPO_GAV).map(([k,t])=>`<option value="${k}" ${g.tipo===k?'selected':''}>${t}</option>`).join('')}</select><button class="xdel" data-del-fila>✕</button></div>`;

async function pintar(){
  document.querySelectorAll('#seg button').forEach(b=>b.classList.toggle('on', b.dataset.v===vista));
  try{
    $('out').innerHTML = vista==='inicio' ? vInicio() : vista==='buscar' ? vBuscar() : vista==='historial' ? await vHistorial() : vConfig();
  }catch(e){ $('out').innerHTML = `<div class="empty">${esc(e.message)}</div>`; }
}
async function cargar(){ const r = await api('estado'); S = r; $('segCfg').hidden = !S.permisos.nivelAdmin; }

/* ---------- hojas (formularios) ---------- */
function hoja(html, onClick){
  const el = document.createElement('div'); el.className = 'sh'; el.innerHTML = `<div class="pp">${html}</div>`;
  el.addEventListener('click', e => { if(e.target === el || e.target.closest('[data-x]')) return el.remove(); onClick && onClick(e, el); });
  document.body.appendChild(el); return el;
}
function verItem(id){
  const it = S.items.find(x=>x.id===id); if(!it) return toast('Ese material ya no existe.');
  const g = gav(it.gaveta);
  const el = hoja(`${it.foto?`<img class="fgr" src="${fotoUrl(it.foto)}" alt="" data-zoom>`:''}<div class="sub" style="color:${colItem(it)};font-weight:800">${esc((it.lineas||[]).join(' · ')||'Sin línea')}</div><h2>${esc(it.desc)}</h2>
    <div class="det"><span>No. de parte</span><b>${esc(it.pn)}${it.auto?' <small class="faint">(interno)</small>':''}</b>
      <span>Cantidad</span><b style="font-size:22px">${it.cant} pzas ${bajo(it)?'<span class="bajo">BAJO</span>':''}</b>${it.min?`<span>Mínimo</span><b>${it.min}</b>`:''}
      <span>Categoría</span><b>${esc(it.cat||'—')}</b><span>Línea</span><b>${esc((it.lineas||[]).join(', ')||'—')}</b>
      <span>Marca</span><b>${esc(it.marca||'—')}</b><span>Equipo</span><b>${esc(it.equipo||'—')}</b><span>Dónde</span><b>${esc(lugarTxt(it)||'—')}</b>
<span>Último cambio</span><b style="font-weight:500">${esc(it.por)} · ${fecha(it.act)}</b></div>
    ${g?`<div style="text-align:center;margin:6px 0 4px">${gavSVG(g, {alto:120})}<div class="faint" style="font-size:13px">${esc(g.n)}</div></div>`:''}
    <div class="acts" style="flex-wrap:wrap"><button class="ok" data-b="retiro">− Retirar</button>${S.permisos.editar?'<button data-b="entrada">＋ Entrada</button>':''}</div>
    <div class="acts" style="margin-top:8px;flex-wrap:wrap">${S.permisos.editar?'<button data-b="editar">✎ Editar</button>':''}<button data-b="hist">Historial</button>${S.permisos.admin?'<button data-b="eliminar" style="color:#C2292E">Eliminar</button>':''}</div>
    <div id="hItem"></div><div class="acts"><button data-x>Cerrar</button></div>`, async (e, el) => {
    if(e.target.closest('[data-zoom]')) return verFoto(fotoUrl(it.foto));
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
const porCodigo = v => { const c = norm(v).replace(/\s+/g,''); return S.items.find(i => norm(i.pn).replace(/\s+/g,'') === c); };
function elegir(titulo, cb){
  const el = hoja(`<h2>${esc(titulo)}</h2><div class="sub">Escanea la etiqueta o busca el material</div>${caja('eq', 'Número de parte, descripción…')}
    <div class="lst" id="el" style="margin-top:10px"></div><div class="acts"><button data-x>Cancelar</button></div>`, async (e, el) => {
      if(e.target.closest('[data-a="scan"]')){ const v = await escanear({titulo}); if(!v) return; const x = porCodigo(v);
        if(x){ el.remove(); return cb(x); } el.querySelector('#eq').value = v; pint(); return toast('No hay un número de parte igual; revisa la lista'); }
      const t = e.target.closest('[data-it]'); if(t){ el.remove(); cb(S.items.find(x=>x.id===t.dataset.it)); } });
  const pint = () => { const q = norm(el.querySelector('#eq').value).split(/\s+/).filter(Boolean);
    el.querySelector('#el').innerHTML = S.items.filter(it => q.every(t => norm([it.pn,it.desc,it.marca,it.cat].join(' ')).includes(t))).slice(0,40).map(itemHTML).join('') || '<div class="empty">Nada coincide.</div>'; };
  el.querySelector('#eq').addEventListener('input', pint); pint(); el.querySelector('#eq').focus();
}
function formItem(it){
  const nuevo = !it, v = it || {lineas: F.linea?[F.linea]:[], gaveta: F.gaveta || S.config.gavetas[0]?.id, cant:1, min:0};
  let gSel = v.gaveta, lSel = new Set(v.lineas||[]), foto = v.foto || '', fotoData = '';
  const gavHTML = () => S.config.gavetas.map(g=>`<button type="button" data-g="${esc(g.id)}" class="${g.id===gSel?'on':''}">${gavSVG(g,{alto:96})}${esc(g.n)}</button>`).join('');
  const fotoHTML = () => (fotoData || foto) ? `<div class="fprev"><img src="${fotoData || fotoUrl(foto)}" alt=""><button type="button" data-qf>Quitar foto</button></div>` : '';
  const el = hoja(`<h2>${nuevo?'Agregar material':'Editar material'}</h2><div class="sub">${nuevo?'Si no tiene número de parte, déjalo vacío y se genera uno interno (AUT-00001…).':esc(v.pn)}</div>
    <label>Foto (opcional)</label><div id="ff">${fotoHTML()}</div>
    <div class="row2"><label class="btn fbtn">📷 Tomar foto<input type="file" accept="image/*" capture="environment" hidden data-fin></label><label class="btn fbtn">🖼 Galería<input type="file" accept="image/*" hidden data-fin></label></div>
    <label>No. de parte</label><div class="q"><input id="i_pn" value="${esc(nuevo?'':v.pn)}" placeholder="Vacío = automático" autocapitalize="characters" style="padding-left:14px"><button class="scan" type="button" data-scanpn aria-label="Escanear">${ESC_IC}</button></div>
    <label>Descripción</label><input id="i_desc" value="${esc(v.desc||'')}" placeholder="Qué es: ej. Sensor fotoeléctrico M18">
    <div class="g2">${nuevo?`<div><label>Cantidad</label><input id="i_cant" type="number" min="0" value="${v.cant}" inputmode="numeric"></div>`:''}<div><label>Mínimo (aviso)</label><input id="i_min" type="number" min="0" value="${v.min||0}" inputmode="numeric"></div></div>
    <label>Categoría</label><select id="i_cat"><option value="">— Elige —</option>${S.config.categorias.map(c=>`<option ${c===v.cat?'selected':''}>${esc(c)}</option>`).join('')}</select>
    <label>Línea(s) <span style="text-transform:none;letter-spacing:0;font-weight:600">(puedes elegir varias)</span></label><div class="pick" id="fli">${S.config.lineas.map(l=>`<button type="button" data-li="${esc(l)}" class="${lSel.has(l)?'on':''}">${esc(l)}</button>`).join('')}</div>
    <div class="g2"><div><label>Marca</label><input id="i_marca" value="${esc(v.marca||'')}"></div><div><label>Equipo</label><input id="i_equipo" value="${esc(v.equipo||'')}" placeholder="Dónde se usa"></div></div>
    <label>¿Dónde se guarda?</label><div class="gav" id="fg">${gavHTML()}</div>
    <label>Lugar dentro (caja, bin, bolsa…)</label><input id="i_lugar" value="${esc(v.lugar||'')}" placeholder="Ej. caja azul, bolsa de pogos">
    <div class="err" id="fe"></div><div class="acts"><button data-x>Cancelar</button><button class="ok" id="fok">${nuevo?'Agregar':'Guardar'}</button></div>`, async (e, el) => {
    const li = e.target.closest('[data-li]'); if(li){ li.classList.toggle('on'); lSel[li.classList.contains('on')?'add':'delete'](li.dataset.li); return; }
    const g = e.target.closest('[data-g]'); if(g){ gSel = g.dataset.g; el.querySelector('#fg').innerHTML = gavHTML(); return; }
    if(e.target.closest('[data-qf]')){ foto = ''; fotoData = ''; el.querySelector('#ff').innerHTML = ''; return; }
    if(e.target.closest('[data-scanpn]')){ const c = await escanear({titulo:'Escanear número de parte'}); if(c) el.querySelector('#i_pn').value = c.toUpperCase(); return; }
    if(e.target.id === 'fok'){
      const val = k => el.querySelector('#i_'+k)?.value;
      const datos = {pn: val('pn'), desc: val('desc'), min: +val('min')||0, cat: val('cat'), lineas: [...lSel], marca: val('marca'), equipo: val('equipo'), gaveta: gSel, lugar: val('lugar'), foto};
      if(!datos.desc.trim()) return el.querySelector('#fe').textContent = 'Escribe la descripción.';
      const b = e.target; b.disabled = true;
      try{
        if(fotoData){ b.textContent = 'Subiendo foto…'; datos.foto = await subirFoto(fotoData); }
        b.textContent = 'Guardando…';
        if(nuevo){ const r = await op({op:'alta', item: {...datos, cant: +val('cant')||0}}); toast(`Agregado: ${r.item.pn}`); }
        else { await op({op:'editar', id: it.id, cambios: datos}); toast('Guardado'); }
        el.remove(); await refrescar();
      }catch(err){ el.querySelector('#fe').textContent = err.message; b.disabled = false; b.textContent = nuevo?'Agregar':'Guardar'; }
    }
  });
  el.querySelectorAll('[data-fin]').forEach(inp => inp.addEventListener('change', async e => {
    const f = e.target.files[0]; e.target.value = ''; if(!f) return;
    try{ fotoData = await comprimir(f); el.querySelector('#ff').innerHTML = fotoHTML(); }catch(err){ el.querySelector('#fe').textContent = 'No se pudo leer la foto.'; }
  }));
}
function formLote(){
  let gSel = '';
  const el = hoja(`<h2>Editar ${lote.size} materiales</h2><div class="sub">Solo se cambia lo que elijas; lo demás se queda igual.</div>
    <label>Categoría</label><select id="l_cat"><option value="">— Sin cambio —</option>${S.config.categorias.map(c=>`<option>${esc(c)}</option>`).join('')}</select>
    <label>Línea(s)</label><div class="pick" id="l_lin">${S.config.lineas.map(l=>`<button type="button" data-ll="${esc(l)}">${esc(l)}</button>`).join('')}</div>
    <label>¿Dónde se guarda?</label><div class="gav" id="lg">${S.config.gavetas.map(g=>`<button type="button" data-g="${esc(g.id)}">${gavSVG(g,{alto:80})}${esc(g.n)}</button>`).join('')}</div>
    <div class="err" id="fe"></div><div class="acts"><button data-x>Cancelar</button><button class="ok" id="fok">Aplicar</button></div>`, async (e, el) => {
    const ll = e.target.closest('[data-ll]'); if(ll){ ll.classList.toggle('on'); return; }
    const g = e.target.closest('[data-g]'); if(g){ gSel = gSel === g.dataset.g ? '' : g.dataset.g; el.querySelectorAll('[data-g]').forEach(x=>x.classList.toggle('on', x.dataset.g===gSel)); return; }
    if(e.target.id === 'fok'){
      const c = {}; const ca = el.querySelector('#l_cat').value, li = [...el.querySelectorAll('[data-ll].on')].map(x=>x.dataset.ll);
      if(ca) c.cat = ca; if(li.length) c.lineas = li; if(gSel) c.gaveta = gSel;
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
  if(e.target.id === 'qq'){ F.q = e.target.value; clearTimeout(tq); tq = setTimeout(()=>{ const pos = e.target.selectionStart; if(vista==='inicio' && F.q){ vista = 'buscar'; modoBusq = 'lista'; } pintar().then(()=>{ const i = $('qq'); if(i){ i.focus(); i.setSelectionRange(pos,pos); } }); }, 200);
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
  const ln = e.target.closest('[data-linea]'); if(ln){ F.linea = ln.dataset.linea; return pintar(); }
  const mo = e.target.closest('[data-modo]'); if(mo){ modoBusq = mo.dataset.modo; return pintar(); }
  const gf = e.target.closest('[data-gf]'); if(gf){ gavFoto = gf.dataset.gf; pintar(); return window.scrollTo(0,0); }
  const it = e.target.closest('[data-it]');
  if(it){ if(lote){ lote.has(it.dataset.it) ? lote.delete(it.dataset.it) : lote.add(it.dataset.it); return pintar(); } return verItem(it.dataset.it); }
  const a = e.target.closest('[data-a]'); if(!a) return;
  const k = a.dataset.a;
  if(k==='alta') formItem();
  if(k==='retiro') elegir('¿Qué vas a retirar?', x => formCant(x, 'retiro'));
  if(k==='entrada') elegir('¿A qué le das entrada?', x => formCant(x, 'entrada'));
  if(k==='deshacer'){ if(!confirm('¿Deshacer tu último retiro? Las piezas regresan al inventario.')) return; try{ const r = await op({op:'deshacer'}); toast(`Regresaron ${r.mov.delta} de ${r.item.desc}`); await refrescar(); }catch(err){ alert(err.message); } }
  if(k==='csv') csv(`inventario-${new Date().toISOString().slice(0,10)}.csv`, [['No. de parte','Descripción','Cantidad','Mínimo','Categoría','Línea(s)','Marca','Equipo','Gaveta','Lugar','Foto','Último cambio','Por'],
    ...filtrar(S.items).map(i=>[i.pn,i.desc,i.cant,i.min,i.cat,(i.lineas||[]).join(' / '),i.marca,i.equipo,gav(i.gaveta)?.n||'',i.lugar,i.foto?'sí':'',i.act,i.por])]);
  if(k==='csv-mov') csv(`movimientos-${new Date().toISOString().slice(0,10)}.csv`, [['Fecha','Tipo','No. de parte','Descripción','Cambio','Antes','Después','Persona','No. control','Destino','Nota'],
    ...MOVS.map(m=>[m.fecha,(MV[m.tipo]||[,m.tipo])[1],m.pn,m.desc,m.delta,m.antes,m.despues,m.nombre,m.num,m.destino,m.nota])]);
  if(k==='adm-ok'){ try{ const r = await fetch('/api/admin-login', {method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({num: S.permisos.num, pin: $('admPin').value})}); const j = await r.json(); if(!r.ok) throw new Error(j.error||'Error'); await refrescar(); toast('Modo admin activo'); }catch(err){ $('admErr').textContent = err.message; } return; }
  if(k==='lote'){ lote = lote ? null : new Set(); pintar(); }
  if(k==='lote-todo'){ filtrar(S.items).forEach(i=>lote.add(i.id)); pintar(); }
  if(k==='lote-ok') formLote();
  if(k==='c-gav') $('cGav').insertAdjacentHTML('beforeend', gavFila({id:'', n:'', tipo:'piso'}));
  if(k==='scan'){ const v = await escanear({}); if(!v) return; const x = porCodigo(v); F.q = v; if(vista==='inicio') vista = 'buscar'; modoBusq = 'lista'; await pintar(); if(x) verItem(x.id); else toast('Ningún número de parte igual; busqué el texto'); return; }
  if(k==='c-ok'){
    const lineas = t => t.split('\n').map(x=>x.trim()).filter(Boolean);
    const config = {
      gavetas: [...document.querySelectorAll('#cGav .gl')].map(r=>({id: r.dataset.gid || norm(r.querySelector('[data-k=n]').value).replace(/[^a-z0-9]+/g,'-'), n: r.querySelector('[data-k=n]').value, tipo: r.querySelector('[data-k=tipo]').value})),
      categorias: lineas($('cCat').value), lineas: lineas($('cLin').value)};
    try{ await api('config', {method:'POST', body: JSON.stringify({config})}); toast('Configuración guardada'); await refrescar(); }catch(err){ alert(err.message); }
  }
  const df = e.target.closest('[data-del-fila]'); if(df) df.parentElement.remove();
});

cargar().then(pintar).catch(e => $('out').innerHTML = `<div class="empty">${esc(e.message)}</div>`);
track('vista', {ruta:'inventario/inicio', titulo:'Inventario'});

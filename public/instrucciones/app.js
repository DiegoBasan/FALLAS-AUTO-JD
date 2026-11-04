/* Instrucciones: documentos paso a paso que hace la gente de piso (texto, notas y fotos).
   Rutas: #lista/<app> · #i/<id> (leer) · #editar/<id> · #nueva/<app>   (app = kasalis | linea)
   Se guardan en /api/instrucciones y pasan por revisión del admin como las aportaciones. */
import {api, yo, track, reducir, toast} from '/shared/cuenta.js';

const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const APPS = {kasalis: {n:'Kasalis', c:'#FF7F66', href:'/buscador-kasalis/'}, linea: {n:'Línea', c:'#2F6BFF', href:'/fallas-linea/'}};
const foto = id => `/api/foto/${encodeURIComponent(id)}`;
const fecha = s => s ? new Date(s).toLocaleDateString('es-MX', {day:'numeric', month:'short', year:'numeric'}) : '';
const EST = {pendiente:'En revisión', rechazada:'No aprobada'};
const I = {
  back:'<path d="m15 18-6-6 6-6"/>', up:'<path d="m18 15-6-6-6 6"/>', down:'<path d="m6 9 6 6 6-6"/>',
  del:'<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>', plus:'<path d="M12 5v14M5 12h14"/>',
  doc:'<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
};
const svg = (k, w=18) => `<svg width="${w}" height="${w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${I[k]}</svg>`;

let YO = null;
let ed = null;          // estado del editor
let sucio = false;      // hay cambios sin guardar

function setApp(app){
  $('root').classList.toggle('linea', app === 'linea');
  try{ sessionStorage.setItem('jd_inst_app', app); }catch(e){}
  window.JDNav && JDNav.set(app);
}
function header(html){ $('hdr').innerHTML = html; }
function editando(on){ document.body.classList.toggle('editing', on); $('addbar').hidden = !on; }

/* ---------- lista ---------- */
async function lista(app){
  setApp(app); editando(false);
  header(`<a class="round" href="${APPS[app].href}" aria-label="Regresar">${svg('back')}</a><div class="ht"><b>Instrucciones</b><span>${APPS[app].n} · hechas por la gente de piso</span></div>
    <a class="hbtn pri" href="#nueva/${app}">${svg('plus',16)}Nueva</a>`);
  $('out').innerHTML = `<div class="tools"><input id="buscar" type="search" placeholder="Buscar instrucción…" autocomplete="off" enterkeyhint="search"></div><div id="cards"><div class="vacio">Cargando…</div></div>`;
  let ds = [];
  try{ ds = (await api('instrucciones?app=' + app)).instrucciones; }catch(e){ $('cards').innerHTML = `<div class="vacio">No se pudo cargar (¿sin señal?).</div>`; return; }
  const pintar = q => {
    const f = ds.filter(d => !q || (d.titulo + ' ' + (d.desc||'') + ' ' + d.nombre).toLowerCase().includes(q));
    $('cards').innerHTML = f.length ? `<div class="cards">${f.map(tarjeta).join('')}</div>`
      : `<div class="vacio">${q ? 'Ninguna coincide.' : `Todavía no hay instrucciones de ${APPS[app].n}.<br>Documenta un proceso con pasos y fotos para que otros lo puedan seguir.`}<a class="hbtn pri" href="#nueva/${app}">${svg('plus',16)}Hacer la primera</a></div>`;
  };
  pintar('');
  $('buscar').oninput = e => pintar(e.target.value.trim().toLowerCase());
  track('vista', {ruta:'instrucciones/' + app, titulo:'Instrucciones ' + APPS[app].n});
}
export const tarjeta = d => `<a class="card2" href="/instrucciones/#i/${encodeURIComponent(d.id)}"><div class="cover">${d.portada ? `<img loading="lazy" src="${foto(d.portada)}" alt="">` : svg('doc', 34)}${EST[d.estado] ? `<span class="est ${d.estado}">${EST[d.estado]}</span>` : ''}</div>
  <div class="m"><b>${esc(d.titulo)}</b><small>${d.pasos} paso${d.pasos===1?'':'s'}${d.fotos ? ` · ${d.fotos} foto${d.fotos===1?'':'s'}` : ''}</small><small>${esc(d.nombre)}</small></div></a>`;

/* ---------- leer ---------- */
async function leer(id){
  editando(false);
  header(`<button class="round" id="atras" aria-label="Regresar">${svg('back')}</button><div class="ht"><b>Instrucción</b><span>Cargando…</span></div>`);
  $('atras').onclick = atras;
  let r;
  try{ r = await api('instrucciones/' + encodeURIComponent(id)); }catch(e){ $('out').innerHTML = `<div class="vacio">${esc(e.message)}</div>`; return; }
  const d = r.instruccion; setApp(d.app);
  header(`<button class="round" id="atras" aria-label="Regresar">${svg('back')}</button><div class="ht"><b>${esc(d.titulo)}</b><span>${APPS[d.app].n} · ${esc(d.nombre)}</span></div>
    ${r.puedeEditar ? `<a class="hbtn pri" href="#editar/${encodeURIComponent(d.id)}">Editar</a>` : ''}`);
  $('atras').onclick = atras;
  let n = 0;
  const cuerpo = d.bloques.map(b => b.t === 'paso' ? `<div class="rstep"><div class="num">${++n}</div><div class="rtext">${esc(b.txt)}</div></div>`
    : b.t === 'nota' ? `<div class="rnote">${esc(b.txt)}</div>`
    : `<figure class="rfig"><img loading="lazy" src="${foto(b.foto)}" alt="${esc(b.cap||'Foto')}">${b.cap ? `<figcaption>${esc(b.cap)}</figcaption>` : ''}</figure>`).join('');
  const admin = YO?.adm;
  const aviso = d.estado === 'aprobada' ? '' : `<div class="aviso">${d.estado === 'pendiente' ? '⏳ <b>En revisión.</b> Solo la ven tú y el administrador hasta que se confirme.' : `✋ <b>No aprobada.</b>${d.nota ? ' ' + esc(d.nota) : ''}`}
    ${admin ? `<div class="acts"><button class="hbtn pri" data-est="aprobada">✓ Aprobar</button><button class="hbtn" data-est="rechazada">Rechazar</button></div>` : ''}</div>`;
  $('out').innerHTML = `${aviso}<h1 class="rt">${esc(d.titulo)}</h1>${d.desc ? `<p class="rd">${esc(d.desc)}</p>` : ''}
    <div class="rmeta"><span class="tg">${APPS[d.app].n}</span><span>${esc(d.nombre)}</span><span>${fecha(d.actualizado || d.fecha)}</span></div>
    <div class="rbody">${cuerpo}</div>
    ${(admin || (d.num === YO?.num && d.estado !== 'aprobada')) ? `<div style="margin-top:28px"><button class="hbtn" id="borrar" style="color:var(--fail)">${svg('del',16)}Borrar instrucción</button></div>` : ''}`;
  $('out').querySelectorAll('.rfig img').forEach(img => img.onclick = () => visor(img.src));
  $('out').querySelectorAll('[data-est]').forEach(b => b.onclick = async () => {
    const nota = b.dataset.est === 'rechazada' ? (prompt('¿Por qué no se aprueba? (lo verá el autor)') ?? null) : '';
    if(nota === null) return;
    await api('instrucciones/estado', {method:'POST', body: JSON.stringify({id: d.id, estado: b.dataset.est, nota})}); toast(b.dataset.est === 'aprobada' ? 'Aprobada' : 'Marcada como no aprobada'); leer(d.id);
  });
  if($('borrar')) $('borrar').onclick = async () => {
    if(!confirm('¿Borrar esta instrucción y sus fotos? No se puede deshacer.')) return;
    await api('instrucciones/borrar', {method:'POST', body: JSON.stringify({id: d.id})}); toast('Borrada'); location.replace('#lista/' + d.app);
  };
  track('vista', {ruta:'instrucciones/i/' + d.id, titulo: d.titulo});
}
function visor(src){
  const el = document.createElement('div'); el.className = 'lb'; el.innerHTML = `<img src="${src}" alt="">`;
  el.onclick = () => el.remove(); document.body.appendChild(el);
}
function atras(){ if(history.length > 1 && document.referrer.startsWith(location.origin)) history.back(); else location.hash = '#lista/' + (document.documentElement.dataset.tab || 'kasalis'); }

/* ---------- editor ---------- */
let kk = 0;
const nuevoBloque = (t, extra={}) => ({k: ++kk, t, txt:'', ...extra});
const llaveBorrador = () => 'jd_inst_borrador_' + (ed.id || 'nueva-' + ed.app);
function guardarBorrador(){
  sucio = true;
  try{ localStorage.setItem(llaveBorrador(), JSON.stringify({titulo: ed.titulo, desc: ed.desc, app: ed.app,
    bloques: ed.bloques.filter(b => b.t !== 'foto' || b.foto).map(({t, txt, foto, cap}) => ({t, txt, foto, cap})), t: Date.now()})); }catch(e){}
}
function borrarBorrador(){ try{ localStorage.removeItem(llaveBorrador()); }catch(e){} }

async function editar(id, app){
  let recuperado = false;
  if(id){
    let r; try{ r = await api('instrucciones/' + encodeURIComponent(id)); }catch(e){ $('out').innerHTML = `<div class="vacio">${esc(e.message)}</div>`; return; }
    if(!r.puedeEditar){ location.replace('#i/' + id); return; }
    const d = r.instruccion;
    ed = {id: d.id, app: d.app, titulo: d.titulo, desc: d.desc || '', bloques: d.bloques.map(b => ({k: ++kk, ...b}))};
  } else ed = {id: null, app, titulo: '', desc: '', bloques: []};
  try{ const b = JSON.parse(localStorage.getItem(llaveBorrador()) || 'null');
    if(b && b.bloques){ Object.assign(ed, {titulo: b.titulo, desc: b.desc, app: b.app || ed.app, bloques: b.bloques.map(x => ({k: ++kk, ...x}))}); recuperado = true; } }catch(e){}
  if(!id && !ed.bloques.length) ed.bloques.push(nuevoBloque('paso'));
  sucio = recuperado;
  setApp(ed.app); editando(true);
  header(`<button class="hbtn" id="cancelar">Cancelar</button><div class="ht"><b>${id ? 'Editar instrucción' : 'Nueva instrucción'}</b><span id="hst">${recuperado ? 'Borrador recuperado' : 'Se guarda como borrador en este celular'}</span></div><button class="hbtn pri" id="guardar">Guardar</button>`);
  $('cancelar').onclick = () => { if(sucio && !confirm('¿Salir sin guardar? Tu borrador se queda en este celular.')) return; editando(false); id ? location.replace('#i/' + id) : history.length > 1 ? history.back() : location.replace(APPS[ed.app].href); };
  $('guardar').onclick = guardar;
  pintarEditor(recuperado);
  track('vista', {ruta:'instrucciones/editar', titulo: id ? 'Editar instrucción' : 'Nueva instrucción'});
}
function pintarEditor(recuperado){
  const pasos = {}; let n = 0; ed.bloques.forEach(b => { if(b.t === 'paso') pasos[b.k] = ++n; });
  const ins = i => `<div class="ins" data-i="${i}"><button class="insbtn" aria-label="Agregar aquí">+</button><div class="insm" hidden><button data-ins="txt">Texto</button><button data-ins="cam">📷 Cámara</button><button data-ins="lib">🖼 Galería</button></div></div>`;
  const blk = (b, i) => {
    const acts = `<div class="bact"><button data-mv="-1" ${i===0?'disabled':''} aria-label="Subir">${svg('up')}</button><button data-mv="1" ${i===ed.bloques.length-1?'disabled':''} aria-label="Bajar">${svg('down')}</button><button data-del aria-label="Borrar">${svg('del')}</button></div>`;
    if(b.t === 'foto') return `<div class="blk foto" data-k="${b.k}"><div class="bh"><span class="btag">Foto</span>${acts}</div>
      <div class="eimg"><img src="${b.prev || foto(b.foto)}" alt="">${b.sub ? `<div class="upst">${b.sub === 'error' ? 'No se subió <button data-retry>Reintentar</button>' : 'Subiendo…'}</div>` : ''}</div>
      <input class="cap" data-cap placeholder="Pie de foto (opcional): qué se ve" value="${esc(b.cap||'')}"></div>`;
    return `<div class="blk ${b.t}" data-k="${b.k}"><div class="bh"><span class="btag">${b.t === 'paso' ? 'Paso ' + pasos[b.k] : 'Nota'}</span><button class="chip" data-tg>${b.t === 'paso' ? 'Hacer nota' : 'Hacer paso'}</button>${acts}</div>
      <textarea data-txt rows="2" placeholder="${b.t === 'paso' ? 'Qué se hace en este paso…' : 'Algo importante: cuidado, valor, tip…'}">${esc(b.txt)}</textarea></div>`;
  };
  $('out').innerHTML = `<div class="ed">
    ${recuperado ? `<div class="recup">📝 Se recuperó lo que no habías guardado. <button id="descartar">Descartar borrador</button></div>` : ''}
    <input class="etitle" id="eTit" placeholder="Título: ej. Cambio de fixtura en Moose" value="${esc(ed.titulo)}" enterkeyhint="next">
    <textarea class="edesc" id="eDesc" rows="1" placeholder="¿Para qué es o cuándo se hace? (opcional)">${esc(ed.desc)}</textarea>
    <div class="seg2">${Object.entries(APPS).map(([k, a]) => `<button data-app="${k}" class="${ed.app===k?'on':''}"><i style="background:${a.c}"></i>${a.n}</button>`).join('')}</div>
    ${ed.bloques.length ? ed.bloques.map((b, i) => ins(i) + blk(b, i)).join('') + ins(ed.bloques.length) : `<div class="edvac">Agrega pasos, notas y fotos con la barra de abajo.</div>`}
    <div class="err" id="eErr"></div></div>`;
  $('out').querySelectorAll('textarea').forEach(crecer);
  if($('descartar')) $('descartar').onclick = () => { borrarBorrador(); sucio = false; location.reload(); };
}
const crecer = t => { t.style.height = 'auto'; t.style.height = t.scrollHeight + 2 + 'px'; };
const bloqueDe = el => { const w = el.closest('[data-k]'); return w && ed.bloques.find(b => b.k === +w.dataset.k); };

let insertarEn = null;   // posición donde va lo que se agregue (null = al final)
function agregar(tipo){
  if(tipo === 'txt'){
    const b = nuevoBloque('paso'); ed.bloques.splice(insertarEn ?? ed.bloques.length, 0, b); insertarEn = null;
    guardarBorrador(); pintarEditor();
    const t = $('out').querySelector(`[data-k="${b.k}"] textarea`); t && (t.focus(), t.scrollIntoView({block:'center', behavior:'smooth'}));
  } else $(tipo === 'cam' ? 'camIn' : 'libIn').click();
}
async function fotosElegidas(files){
  const pos = insertarEn ?? ed.bloques.length; insertarEn = null;
  const nuevos = [];
  for(const f of files){
    try{ const data = await reducir(f); nuevos.push(nuevoBloque('foto', {prev: data, sub: 'subiendo', cap: ''})); }catch(e){ toast('No se pudo leer una foto'); }
  }
  ed.bloques.splice(pos, 0, ...nuevos); pintarEditor();
  const ult = nuevos[nuevos.length - 1]; if(ult) $('out').querySelector(`[data-k="${ult.k}"]`)?.scrollIntoView({block:'center', behavior:'smooth'});
  await Promise.all(nuevos.map(subir));
}
async function subir(b){
  b.sub = 'subiendo'; marcarSubida(b);
  try{ const r = await api('foto', {method:'POST', body: JSON.stringify({foto: b.prev})}); b.foto = r.id; b.sub = null; guardarBorrador(); }
  catch(e){ b.sub = 'error'; }
  marcarSubida(b);
}
function marcarSubida(b){
  const w = $('out').querySelector(`[data-k="${b.k}"] .eimg`); if(!w) return;
  w.querySelector('.upst')?.remove();
  if(b.sub) w.insertAdjacentHTML('beforeend', `<div class="upst">${b.sub === 'error' ? 'No se subió <button data-retry>Reintentar</button>' : 'Subiendo…'}</div>`);
}
async function guardar(){
  ed.titulo = ($('eTit')?.value || '').trim(); ed.desc = ($('eDesc')?.value || '').trim();
  const e = $('eErr');
  if(!ed.titulo){ e.textContent = 'Ponle un título.'; $('eTit').focus(); return; }
  if(ed.bloques.some(b => b.sub === 'subiendo')){ e.textContent = 'Espera a que terminen de subir las fotos.'; return; }
  if(ed.bloques.some(b => b.sub === 'error')){ e.textContent = 'Hay fotos que no se subieron: toca Reintentar o bórralas.'; return; }
  const bloques = ed.bloques.map(({t, txt, foto, cap}) => t === 'foto' ? {t, foto, cap} : {t, txt: (txt||'').trim()}).filter(b => b.t === 'foto' ? b.foto : b.txt);
  if(!bloques.length){ e.textContent = 'Escribe al menos un paso o agrega una foto.'; return; }
  const btn = $('guardar'); btn.disabled = true; btn.textContent = 'Guardando…';
  try{
    const {instruccion: d} = await api('instrucciones', {method:'POST', body: JSON.stringify({id: ed.id, app: ed.app, titulo: ed.titulo, desc: ed.desc, bloques})});
    borrarBorrador(); sucio = false; editando(false);
    toast(d.estado === 'aprobada' ? 'Guardada' : '¡Gracias! Quedó en revisión.');
    location.replace('#i/' + d.id);
  }catch(err){ e.textContent = err.message; btn.disabled = false; btn.textContent = 'Guardar'; }
}

/* eventos del editor */
$('out').addEventListener('input', e => {
  if(!ed || !document.body.classList.contains('editing')) return;
  const t = e.target;
  if(t.id === 'eTit') ed.titulo = t.value;
  else if(t.id === 'eDesc'){ ed.desc = t.value; crecer(t); }
  else if(t.matches('[data-txt]')){ bloqueDe(t).txt = t.value; crecer(t); }
  else if(t.matches('[data-cap]')) bloqueDe(t).cap = t.value;
  guardarBorrador();
});
$('out').addEventListener('click', e => {
  if(!ed || !document.body.classList.contains('editing')) return;
  const t = e.target.closest('button'); if(!t) return;
  if(t.dataset.app){ ed.app = t.dataset.app; setApp(ed.app); guardarBorrador(); $('out').querySelectorAll('[data-app]').forEach(b => b.classList.toggle('on', b === t)); return; }
  if(t.classList.contains('insbtn')){ const w = t.closest('.ins'), abierto = w.classList.contains('open');
    $('out').querySelectorAll('.ins.open').forEach(x => { x.classList.remove('open'); x.querySelector('.insm').hidden = true; });
    if(!abierto){ w.classList.add('open'); w.querySelector('.insm').hidden = false; } return; }
  if(t.dataset.ins){ insertarEn = +t.closest('.ins').dataset.i; agregar(t.dataset.ins); return; }
  const b = bloqueDe(t); if(!b) return;
  const i = ed.bloques.indexOf(b);
  if(t.dataset.mv){ const j = i + +t.dataset.mv; if(j < 0 || j >= ed.bloques.length) return; [ed.bloques[i], ed.bloques[j]] = [ed.bloques[j], ed.bloques[i]]; guardarBorrador(); pintarEditor();
    $('out').querySelector(`[data-k="${b.k}"]`)?.scrollIntoView({block:'center', behavior:'smooth'}); return; }
  if(t.hasAttribute('data-tg')){ b.t = b.t === 'paso' ? 'nota' : 'paso'; guardarBorrador(); pintarEditor(); return; }
  if(t.hasAttribute('data-retry')){ subir(b); return; }
  if(t.hasAttribute('data-del')){
    const vacio = b.t === 'foto' ? false : !(b.txt || '').trim();
    if(!vacio && !t.classList.contains('sure')){ t.classList.add('sure'); t.textContent = '¿Borrar?'; setTimeout(() => { if(t.isConnected){ t.classList.remove('sure'); t.innerHTML = svg('del'); } }, 3000); return; }
    ed.bloques.splice(i, 1); guardarBorrador(); pintarEditor();
  }
});
$('addbar').addEventListener('click', e => { const b = e.target.closest('[data-add]'); if(b){ insertarEn = null; agregar(b.dataset.add); } });
['camIn', 'libIn'].forEach(id => $(id).addEventListener('change', e => { const fs = [...e.target.files]; e.target.value = ''; if(fs.length) fotosElegidas(fs); }));
addEventListener('beforeunload', e => { if(sucio && document.body.classList.contains('editing')){ e.preventDefault(); e.returnValue = ''; } });

/* ---------- rutas ---------- */
function route(){
  const h = decodeURIComponent(location.hash.slice(1));
  const [r, a] = [h.split('/')[0], h.slice(h.indexOf('/') + 1)];
  ed = null; window.scrollTo(0, 0);
  if(r === 'i' && a) return leer(a);
  if(r === 'editar' && a) return editar(a);
  if(r === 'nueva') return editar(null, APPS[a] ? a : 'kasalis');
  return lista(APPS[a] ? a : (document.documentElement.dataset.tab === 'linea' ? 'linea' : 'kasalis'));
}
addEventListener('hashchange', route);
yo().then(r => { YO = r.yo; }).catch(() => {}).finally(route);

/* Cuenta, actividad y aportaciones (lo usan Fallas Kasalis, Fallas de línea y el inicio).
   - yo(): quién está dentro (si la sesión venció, manda al login).
   - track(tipo, datos): registra entradas y búsquedas (para el panel del admin).
   - mountAportes(el, info): muestra las aportaciones de una falla/proceso y el botón para aportar.
   - misAportesHTML(), cuentaHTML(): secciones para la pestaña "Más". */
const esc = s => String(s??'').replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
export const NIVELES = ['operador','tecnico','ingeniero','admin'];
const NIVEL_TXT = {operador:'Operador', tecnico:'Técnico', ingeniero:'Ingeniero', admin:'Admin'};
export const rango = n => Math.max(0, NIVELES.indexOf(n||'operador'));
export const TIPOS = {comentario:['💬','Comentario'], foto:['📷','Foto'], correccion:['✏️','Corrección'], solucion:['💡','Otra solución'], duda:['❓','Duda']};

async function api(path, opt={}){
  const r = await fetch('/api/'+path, {credentials:'same-origin', ...opt, headers:{'content-type':'application/json', ...(opt.headers||{})}});
  if(r.status === 401){ location.href = '/login/?next=' + encodeURIComponent(location.pathname + location.hash); throw new Error('Sesión vencida'); }
  const j = await r.json().catch(()=>({})); if(!r.ok) throw new Error(j.error || 'Error'); return j;
}
let _yo;
export const yo = () => (_yo ||= api('yo').catch(e => { _yo = null; throw e; }));
export const puedeVer = (nivelReq, miNivel) => rango(miNivel) >= rango(nivelReq);

/* ---------- actividad ---------- */
let cola = [], tmr;
function flush(beacon){ if(!cola.length) return; const body = JSON.stringify({eventos: cola}); cola = [];
  if(beacon && navigator.sendBeacon) navigator.sendBeacon('/api/evento', new Blob([body], {type:'application/json'}));
  else fetch('/api/evento', {method:'POST', credentials:'same-origin', headers:{'content-type':'application/json'}, body, keepalive:true}).catch(()=>{}); }
export function track(tipo, d={}){ cola.push({t: Date.now(), tipo, ...d}); clearTimeout(tmr); tmr = setTimeout(()=>flush(), 15000); if(cola.length >= 20) flush(); }
addEventListener('visibilitychange', ()=>{ if(document.visibilityState === 'hidden') flush(true); });
addEventListener('pagehide', ()=>flush(true));

/* ---------- estilos ---------- */
const CSS = `
.ap{margin-top:10px;border-radius:14px;padding:10px 12px;font-size:14px;line-height:1.45;border:1.5px dashed rgba(224,163,46,.7);background:rgba(224,163,46,.08)}
.ap.aprobada{border:1.5px solid rgba(34,160,107,.55);background:rgba(34,160,107,.08)}
.ap.rechazada{border-color:var(--line,#ccc);background:transparent;opacity:.7}
.ap .h{display:flex;flex-wrap:wrap;gap:4px 8px;align-items:center;font-size:12px;color:var(--ink2,#777);margin-bottom:4px}
.ap .h b{font-size:11px;font-weight:800;letter-spacing:.03em;text-transform:uppercase;padding:2px 7px;border-radius:6px;background:rgba(224,163,46,.25);color:#8A5A00}
.ap.aprobada .h b{background:rgba(34,160,107,.2);color:#17744D}
.ap.rechazada .h b{background:rgba(127,127,127,.2);color:inherit}
[data-theme=dark] .ap .h b{color:#F3C56B} [data-theme=dark] .ap.aprobada .h b{color:#6FD7A6}
.ap .h a{color:inherit;font-weight:700;text-decoration:underline;cursor:pointer}
.ap img{display:block;max-width:100%;max-height:260px;border-radius:10px;margin-top:6px;cursor:zoom-in}
.ap .nota{margin-top:6px;font-size:12.5px;color:var(--ink2,#777)}
.ap .del{margin-top:6px;border:0;background:none;color:#C2292E;font:inherit;font-size:12.5px;font-weight:700;padding:0;cursor:pointer}
.ap-sec{margin-top:16px}
.ap-sec h4{margin:0 4px 6px;font-size:12px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:var(--ink2,#777)}
.ap-fab{position:fixed;right:16px;bottom:var(--fab-b,calc(env(safe-area-inset-bottom) + 136px));z-index:45;height:52px;padding:0 20px 0 16px;border-radius:99px;border:0;background:var(--ink,#141416);color:var(--bg,#fff);font:inherit;font-size:15px;font-weight:800;box-shadow:0 10px 28px rgba(0,0,0,.25);display:flex;align-items:center;gap:8px;cursor:pointer}
.ap-fab span{font-size:22px;line-height:1}
.ap-sh{position:fixed;inset:0;z-index:70;background:rgba(0,0,0,.45);display:flex;align-items:flex-end;justify-content:center}
.ap-sh .pp{background:var(--surface,#fff);color:var(--ink,#141416);width:min(620px,100%);max-height:92dvh;overflow:auto;border-radius:26px 26px 0 0;padding:16px 16px calc(72px + env(safe-area-inset-bottom))}
@media(min-width:800px){.ap-sh{align-items:center}.ap-sh .pp{border-radius:26px}}
.ap-sh h3{margin:0 0 2px;font-size:18px} .ap-sh .sub{color:var(--ink2,#777);font-size:13px;margin-bottom:12px}
.ap-sh label{display:block;font-size:12px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:var(--ink2,#777);margin:12px 2px 6px}
.ap-tipos{display:flex;flex-wrap:wrap;gap:6px}
.ap-tipos button{border:1.5px solid var(--line,#ddd);background:none;color:inherit;border-radius:99px;padding:8px 12px;font:inherit;font-size:14px;font-weight:700;cursor:pointer}
.ap-tipos button.on{background:var(--ink,#141416);color:var(--bg,#fff);border-color:transparent}
.ap-sh select,.ap-sh textarea{width:100%;box-sizing:border-box;border:1.5px solid var(--line,#ddd);border-radius:14px;padding:10px 12px;font:inherit;font-size:15px;background:var(--bg,#f6f6f7);color:inherit}
.ap-sh textarea{min-height:110px;resize:vertical}
.ap-sh .foto{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.ap-sh .foto label.btn{margin:0;display:inline-flex;align-items:center;gap:6px;border:1.5px solid var(--line,#ddd);border-radius:99px;padding:9px 14px;font-size:14px;font-weight:700;text-transform:none;letter-spacing:0;color:inherit;cursor:pointer}
.ap-sh .foto img{max-height:90px;border-radius:10px}
.ap-sh .acts{display:flex;gap:10px;margin-top:16px}
.ap-sh .acts button{flex:1;height:50px;border-radius:99px;border:1.5px solid var(--line,#ddd);background:none;color:inherit;font:inherit;font-size:15px;font-weight:800;cursor:pointer}
.ap-sh .acts .ok{background:var(--ink,#141416);color:var(--bg,#fff);border-color:transparent}
.ap-sh .acts button:disabled{opacity:.5}
.ap-sh .err{color:#C2292E;font-size:13.5px;margin-top:8px}
.ap-toast{position:fixed;left:50%;bottom:calc(var(--fab-b,140px) + 70px);transform:translateX(-50%);z-index:80;background:var(--ink,#141416);color:var(--bg,#fff);padding:12px 18px;border-radius:14px;font-weight:700;font-size:14px;box-shadow:0 10px 28px rgba(0,0,0,.25)}
.ap-lst{display:grid;gap:8px}
.ap-lst .ttl{font-weight:700;font-size:14px;margin-bottom:2px}
.ap-lst a.ttl{color:inherit}
`;
let styled = false;
function style(){ if(styled) return; const s = document.createElement('style'); s.textContent = CSS; document.head.appendChild(s); styled = true;
  document.addEventListener('click', e=>{ const im = e.target.closest('.ap img'); if(!im) return; const d = document.createElement('div');
    d.style.cssText = 'position:fixed;inset:0;z-index:90;background:rgba(0,0,0,.88);display:flex;align-items:center;justify-content:center;cursor:zoom-out';
    d.innerHTML = `<img src="${im.src}" style="max-width:100%;max-height:100%">`; d.onclick = ()=>d.remove(); document.body.appendChild(d); }); }
const toast = t => { const d = document.createElement('div'); d.className = 'ap-toast'; d.textContent = t; document.body.appendChild(d); setTimeout(()=>d.remove(), 2600); };
const fecha = iso => new Date(iso).toLocaleString('es-MX', {day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'});

/* ---------- tarjeta de una aportación ---------- */
export function apHTML(a, {miNum, conTitulo} = {}){
  const [ic, tl] = TIPOS[a.tipo] || TIPOS.comentario;
  const est = a.estado === 'aprobada' ? 'Confirmada' : a.estado === 'rechazada' ? 'Rechazada' : 'Aportación · pendiente';
  return `<div class="ap ${a.estado}" data-ap="${esc(a.id)}">${conTitulo ? `<div class="ttl">${esc(a.titulo)}${a.paso ? ` · paso ${a.paso}` : ''}</div>` : ''}
    <div class="h"><b>${est}</b><span>${ic} ${tl}</span><span>· <a data-de="${esc(a.num)}" data-nombre="${esc(a.nombre)}">${esc(a.nombre)}</a> · ${fecha(a.fecha)}</span></div>
    ${a.texto ? `<div>${esc(a.texto).replace(/\n/g, '<br>')}</div>` : ''}${a.foto ? `<img loading="lazy" src="/api/foto/${esc(a.foto)}" alt="Foto">` : ''}
    ${a.nota ? `<div class="nota">Nota del admin: ${esc(a.nota)}</div>` : ''}
    ${a.num === miNum && a.estado === 'pendiente' ? `<button class="del" data-del="${esc(a.id)}">Borrar mi aportación</button>` : ''}</div>`;
}

/* ---------- formulario ---------- */
async function reducir(file){
  const img = await new Promise((ok, no)=>{ const i = new Image(); i.onload = ()=>ok(i); i.onerror = no; i.src = URL.createObjectURL(file); });
  const max = 1600, k = Math.min(1, max / Math.max(img.width, img.height));
  const c = document.createElement('canvas'); c.width = Math.round(img.width*k); c.height = Math.round(img.height*k);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(img.src);
  return c.toDataURL('image/jpeg', .82);
}
export function abrirAportar(info, paso, onDone){
  style();
  let tipo = 'comentario', foto = null;
  const el = document.createElement('div'); el.className = 'ap-sh';
  el.innerHTML = `<div class="pp"><h3>Aportar</h3><div class="sub">${esc(info.titulo)}. Se guarda como <b>pendiente</b> hasta que el administrador la confirme.</div>
    <label>¿Qué quieres aportar?</label><div class="ap-tipos">${Object.entries(TIPOS).map(([k,[i,t]])=>`<button type="button" data-t="${k}" class="${k===tipo?'on':''}">${i} ${t}</button>`).join('')}</div>
    <label>¿De qué paso?</label><select id="apPaso"><option value="0">General (toda la falla)</option>${(info.pasos||[]).map((p,i)=>`<option value="${i+1}" ${paso===i+1?'selected':''}>Paso ${i+1}: ${esc(p.slice(0,70))}</option>`).join('')}</select>
    <label>Escribe</label><textarea id="apTxt" placeholder="Qué viste, qué funcionó, qué no cuadra o qué duda tienes…"></textarea>
    <label>Foto (opcional)</label><div class="foto"><label class="btn">📷 Tomar o elegir foto<input id="apFoto" type="file" accept="image/*" capture="environment" hidden></label><span id="apPrev"></span></div>
    <div class="err" id="apErr"></div>
    <div class="acts"><button type="button" data-x>Cancelar</button><button type="button" class="ok" id="apOk">Enviar aportación</button></div></div>`;
  const close = () => el.remove();
  el.addEventListener('click', async e=>{
    if(e.target === el || e.target.closest('[data-x]')) return close();
    const t = e.target.closest('[data-t]'); if(t){ tipo = t.dataset.t; el.querySelectorAll('[data-t]').forEach(b=>b.classList.toggle('on', b===t)); return; }
    if(e.target.closest('#apOk')){
      const b = el.querySelector('#apOk'), txt = el.querySelector('#apTxt').value.trim(), p = +el.querySelector('#apPaso').value;
      if(!txt && !foto){ el.querySelector('#apErr').textContent = 'Escribe algo o agrega una foto.'; return; }
      b.disabled = true; b.textContent = 'Enviando…';
      try{
        const {aportacion} = await api('aportaciones', {method:'POST', body: JSON.stringify({ref: info.ref, app: info.app, fallaId: info.fallaId, titulo: info.titulo, paso: p || null, pasoTxt: p ? info.pasos[p-1] : '', tipo: foto && tipo==='comentario' ? 'foto' : tipo, texto: txt, foto})});
        // aviso por correo (Netlify Forms; se activa en el panel de Netlify)
        const fd = new URLSearchParams({'form-name':'aportacion', quien: aportacion.nombre, falla: info.titulo, paso: p ? `Paso ${p}` : 'General', tipo: aportacion.tipo, texto: txt || '(foto)'});
        fetch('/', {method:'POST', headers:{'content-type':'application/x-www-form-urlencoded'}, body: fd.toString()}).catch(()=>{});
        close(); toast('¡Gracias! Tu aportación quedó pendiente de revisión.'); onDone && onDone(aportacion);
      }catch(err){ el.querySelector('#apErr').textContent = err.message; b.disabled = false; b.textContent = 'Enviar aportación'; }
    }
  });
  el.querySelector('#apFoto').addEventListener('change', async e=>{
    const f = e.target.files[0]; if(!f) return;
    try{ foto = await reducir(f); el.querySelector('#apPrev').innerHTML = `<img src="${foto}" alt="">`; if(tipo==='comentario'){ tipo = 'foto'; el.querySelectorAll('[data-t]').forEach(b=>b.classList.toggle('on', b.dataset.t==='foto')); } }
    catch{ el.querySelector('#apErr').textContent = 'No se pudo leer la foto.'; }
  });
  document.body.appendChild(el); el.querySelector('#apTxt').focus();
}

/* ---------- aportaciones de una falla / proceso ---------- */
let fab;
export async function mountAportes(el, info){
  style();
  const yo_ = await yo().catch(()=>null); const miNum = yo_?.yo?.num;
  const pintar = async () => {
    el.querySelectorAll('.ap, .ap-sec').forEach(x=>x.remove());
    let lst = []; try{ lst = (await api('aportaciones?ref=' + encodeURIComponent(info.ref))).aportaciones; }catch{}
    const gen = [];
    lst.forEach(a=>{ const st = a.paso && el.querySelector(`.fs[data-n="${a.paso}"] > div:last-child`); if(st) st.insertAdjacentHTML('beforeend', apHTML(a, {miNum})); else gen.push(a); });
    const host = el.querySelector('.ff') || el;
    host.insertAdjacentHTML('afterend', `<div class="ap-sec"><h4>Aportaciones de piso${lst.length ? ` (${lst.length})` : ''}</h4>${gen.map(a=>apHTML(a, {miNum})).join('') || (lst.length ? '' : '<div class="ap" style="border-style:dashed;background:none">Todavía nadie aporta aquí. ¿Ves algo que falte o no cuadre? Toca <b>＋ Aportar</b>.</div>')}</div>`);
  };
  await pintar();
  if(!fab){ fab = document.createElement('button'); fab.className = 'ap-fab'; fab.innerHTML = '<span>＋</span> Aportar'; document.body.appendChild(fab); }
  fab.hidden = false; fab.onclick = () => abrirAportar(info, 0, pintar);
  el.onclick = async e => {
    const d = e.target.closest('[data-del]'); if(d){ if(!confirm('¿Borrar tu aportación?')) return; try{ await api('aportaciones/borrar', {method:'POST', body: JSON.stringify({id: d.dataset.del})}); pintar(); }catch(err){ alert(err.message); } return; }
    const de = e.target.closest('[data-de]'); if(de){ verDe(de.dataset.de, de.dataset.nombre); }
  };
}
export const ocultarFab = () => { if(fab) fab.hidden = true; };

async function verDe(num, nombre){
  style();
  const el = document.createElement('div'); el.className = 'ap-sh';
  el.innerHTML = `<div class="pp"><h3>Aportaciones de ${esc(nombre)}</h3><div class="sub">Cargando…</div></div>`;
  el.onclick = e => { if(e.target === el) el.remove(); };
  document.body.appendChild(el);
  try{ const {aportaciones} = await api('aportaciones?de=' + encodeURIComponent(num));
    el.querySelector('.pp').innerHTML = `<h3>Aportaciones de ${esc(nombre)}</h3><div class="sub">${aportaciones.length} en total</div><div class="ap-lst">${aportaciones.map(a=>apHTML(a, {conTitulo:true})).join('')}</div><div class="acts" style="display:flex;margin-top:14px"><button style="flex:1;height:48px;border-radius:99px;border:1.5px solid var(--line);background:none;color:inherit;font:inherit;font-weight:800" onclick="this.closest('.ap-sh').remove()">Cerrar</button></div>`;
  }catch(err){ el.querySelector('.sub').textContent = err.message; }
}

/* ---------- pestaña "Más" ---------- */
export function cuentaHTML(){ return `<div id="cuentaBox" class="install">Cargando tu cuenta…</div><h3 class="lb">Mis aportaciones</h3><div id="misAp" class="ap-lst"></div>`; }
export async function montarCuenta(root){
  style();
  try{
    const {yo: u} = await yo();
    root.querySelector('#cuentaBox').innerHTML = `<b style="font-size:16px">${esc(u.nombre)}</b><div class="faint">No. ${esc(u.num)} · ${NIVEL_TXT[u.nivel]||u.nivel}</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">${u.nivel==='admin'?'<a class="btn" href="/admin/" style="text-decoration:none">🛠 Panel admin</a><button class="btn" id="cPin">Contraseña del panel</button>':''}<button class="btn" id="cOut">Salir</button></div>`;
    root.querySelector('#cOut').onclick = async ()=>{ await fetch('/api/logout', {method:'POST'}); location.href = '/login/'; };
    if(root.querySelector('#cPin')) root.querySelector('#cPin').onclick = async ()=>{ const a = prompt('Contraseña actual'); if(a===null) return; const n = prompt('Nueva contraseña (mínimo 4)'); if(!n) return;
      try{ await api('cambiar-pin', {method:'POST', body: JSON.stringify({actual:a, nueva:n})}); toast('Contraseña cambiada'); }catch(err){ alert(err.message); } };
    const {aportaciones} = await api('aportaciones?mias=1');
    root.querySelector('#misAp').innerHTML = aportaciones.map(a=>apHTML(a, {conTitulo:true, miNum:u.num})).join('') || '<div class="faint" style="padding:6px 4px">Todavía no has aportado. En cualquier falla toca <b>＋ Aportar</b>.</div>';
    root.querySelector('#misAp').onclick = async e => { const d = e.target.closest('[data-del]'); if(d && confirm('¿Borrar tu aportación?')){ await api('aportaciones/borrar', {method:'POST', body: JSON.stringify({id: d.dataset.del})}); montarCuenta(root); } };
  }catch(err){ root.querySelector('#cuentaBox').textContent = err.message; }
}

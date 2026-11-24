/* MRB · registro del scrap: qué fue, si es SFR (y de qué tipo), piezas escaneadas, modelo, línea y foto de la papeleta.
   Registrar: en celular el escáner es un recuadro chico con la cámara en vivo; en compu se usa el escáner USB (escribe + Enter).
   Métricas: piezas por día y turno, por tipo, motivo, SFR, modelo y persona. Datos en /api/mrb/* (netlify/lib/mrb.mts). */
import {track, yo} from '/shared/cuenta.js';
import {escanerEnLinea, esCelular} from '/shared/escaner.js';

const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const norm = s => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
const toast = t => { const d = document.createElement('div'); d.className = 'toast'; d.textContent = t; document.body.appendChild(d); setTimeout(() => d.remove(), 2400); };
const fotoUrl = id => `/api/foto/${encodeURIComponent(id)}`;
async function api(path, opt = {}){
  const r = await fetch('/api/mrb/' + path, {credentials:'same-origin', ...opt, headers:{'content-type':'application/json'}});
  if(r.status === 401){ location.href = '/login/?next=/mrb/'; throw new Error('Sesión vencida'); }
  const j = await r.json().catch(() => ({})); if(!r.ok) throw new Error(j.error || 'Error'); return j;
}
const TIPOS = ['Lente', 'Lens adapter', 'Sensor', 'Housing', 'Serializer', 'Otro'];
const LINEAS = ['Gecko', 'Moose', 'Scorpion', 'ELK', 'Kasalis'];
const TURNOS = {'420': 'L–J 6:00–18:00', '421': 'L–J 18:00–6:00', '422': 'V–D 6:00–18:00', 'N-FS': 'Noche V–D (sin turno definido)'};
const colTurno = t => `var(--t${t === 'N-FS' ? 'nfs' : t})`;
const nomTurno = t => t === 'N-FS' ? 'Noche fin de semana' : 'Turno ' + t;

let vista = 'registrar', REG = null, TURNO = null, YO = null;

/* ---------- foto de la papeleta: 1400 px JPEG 72 % (se lee la letra y pesa ~150-300 KB) ---------- */
async function comprimir(file){
  const img = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = URL.createObjectURL(file); });
  const k = Math.min(1, 1400 / Math.max(img.width, img.height));
  const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(img.src);
  return c.toDataURL('image/jpeg', .72);
}
async function subirFoto(dataUrl){
  const r = await fetch('/api/foto', {method:'POST', credentials:'same-origin', headers:{'content-type':'application/json'}, body: JSON.stringify({foto: dataUrl})});
  const j = await r.json().catch(() => ({})); if(!r.ok) throw new Error(j.error || 'No se pudo subir la foto'); return j.id;
}
function verFoto(src){ const d = document.createElement('div'); d.style.cssText = 'position:fixed;inset:0;z-index:96;background:rgba(0,0,0,.94);display:grid;place-items:center;padding:16px'; d.innerHTML = `<img src="${src}" style="max-width:100%;max-height:100%;border-radius:10px">`; d.onclick = () => d.remove(); document.body.appendChild(d); }

async function cargar(){
  const r = await api('registros?meses=6');
  REG = r.registros; TURNO = r.turnoAhora;
}
// sugerencias: lo más usado antes
const frecuentes = (campo, n = 6) => { const c = {}; (REG || []).forEach(r => { const v = (r[campo] || '').trim(); if(v) c[v] = (c[v] || 0) + 1; }); return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, n).map(x => x[0]); };

/* ---------- registrar ---------- */
let F = null, lector = null;
const nuevoForm = () => ({motivo:'', sfr:false, tipoSfr:'', modelo:'', linea:'', piezas:[], tipoPieza:'Lente', fotoData:''});
function vRegistrar(){
  F = F || nuevoForm();
  const t = TURNO || {turno:'—'};
  return `<div class="turno"><i style="background:${colTurno(t.turno)}"></i><span><b>${nomTurno(t.turno)}</b> · ${esc(TURNOS[t.turno] || '')} — se pone solo con la hora</span></div>
  <div class="card">
    <label class="l">1 · ¿Qué fue? ¿Por qué se va a scrap?</label>
    <textarea class="in" id="fMotivo" placeholder="Ej. falla de SFR en EOL, lente rayado, sensor con partículas…">${esc(F.motivo)}</textarea>
    ${frecuentes('motivo').length ? `<div class="sug">${frecuentes('motivo').map(m => `<button type="button" data-sug="motivo" data-v="${esc(m)}">${esc(m.length > 40 ? m.slice(0, 40) + '…' : m)}</button>`).join('')}</div>` : ''}
    <label class="l">2 · ¿Es por SFR?</label>
    <div class="pick"><button type="button" data-sfr="1" class="${F.sfr ? 'on' : ''}">Sí, SFR</button><button type="button" data-sfr="0" class="${!F.sfr ? 'on' : ''}">No</button></div>
    ${F.sfr ? `<label class="l">Tipo de SFR</label><input class="in" id="fTipoSfr" value="${esc(F.tipoSfr)}" placeholder="Escríbelo como sale (luego se pone la lista)">
      ${frecuentes('tipoSfr').length ? `<div class="sug">${frecuentes('tipoSfr').map(m => `<button type="button" data-sug="tipoSfr" data-v="${esc(m)}">${esc(m)}</button>`).join('')}</div>` : ''}` : ''}
  </div>
  <div class="card">
    <label class="l">3 · Escanea lo que se manda</label>
    <div class="pick" id="fTipos">${TIPOS.map(x => `<button type="button" data-tp="${x}" class="${F.tipoPieza === x ? 'on' : ''}">${x}</button>`).join('')}</div>
    <div class="hint">Elige qué pieza es y escanéala. Puedes escanear varias seguidas.</div>
    <div class="scanrow"><input class="in" id="fSerie" placeholder="${esCelular() ? 'Código o número de serie' : 'Escanea con el lector o escribe y da Enter'}" autocomplete="off" autocapitalize="characters" enterkeyhint="done">
      ${esCelular() ? `<button type="button" class="btn cam" id="fCam">📷 Escanear</button>` : `<button type="button" class="btn" id="fAdd">Agregar</button>`}</div>
    <div id="fLector"></div>
    <div class="pz" id="fPiezas" style="margin-top:10px">${piezasHTML()}</div>
  </div>
  <div class="card">
    <label class="l">4 · Modelo de la pieza</label>
    <input class="in" id="fModelo" value="${esc(F.modelo)}" placeholder="Ej. 76, 131, 95…" autocapitalize="characters">
    ${frecuentes('modelo').length ? `<div class="sug">${frecuentes('modelo').map(m => `<button type="button" data-sug="modelo" data-v="${esc(m)}">${esc(m)}</button>`).join('')}</div>` : ''}
    <label class="l">Línea <span style="text-transform:none;letter-spacing:0;font-weight:600">(opcional)</span></label>
    <div class="pick">${LINEAS.map(l => `<button type="button" data-lin="${l}" class="${F.linea === l ? 'on' : ''}">${l}</button>`).join('')}</div>
  </div>
  <div class="card">
    <label class="l">5 · Foto de la papeleta llena</label>
    <div id="fFoto">${F.fotoData ? `<div class="foto"><img src="${F.fotoData}" alt="Papeleta"><button type="button" id="fQuitar">Quitar</button></div>` : ''}</div>
    <div class="row"><button type="button" class="btn" data-foto="cam">📷 Tomar foto</button><button type="button" class="btn" data-foto="lib">🖼 Galería</button></div>
  </div>
  <div class="err" id="fErr"></div>
  <button class="go" id="fOk">Registrar scrap</button>`;
}
const piezasHTML = () => F.piezas.length ? F.piezas.map((p, i) => `<div class="pzr"><select data-pt="${i}">${TIPOS.map(x => `<option ${x === p.tipo ? 'selected' : ''}>${x}</option>`).join('')}</select><b>${esc(p.serie)}</b><button type="button" data-qp="${i}" aria-label="Quitar">✕</button></div>`).join('')
  : '<div class="hint" style="margin:0">Todavía no hay piezas escaneadas.</div>';
function agregarPieza(serie, {callado = false} = {}){
  serie = String(serie || '').trim(); if(!serie) return;
  if(F.piezas.some(p => p.serie === serie)){ if(!callado) toast('Esa pieza ya está en la lista'); return; }
  F.piezas.push({tipo: F.tipoPieza, serie}); $('fPiezas').innerHTML = piezasHTML();
}
async function registrar(){
  const e = $('fErr'), b = $('fOk'); e.textContent = '';
  F.motivo = $('fMotivo').value.trim(); F.modelo = $('fModelo').value.trim(); if(F.sfr) F.tipoSfr = $('fTipoSfr').value.trim();
  const pend = $('fSerie').value.trim(); if(pend){ agregarPieza(pend); $('fSerie').value = ''; }
  if(!F.motivo) return e.textContent = 'Escribe qué fue.';
  if(F.sfr && !F.tipoSfr) return e.textContent = 'Escribe el tipo de SFR.';
  if(!F.piezas.length) return e.textContent = 'Escanea al menos una pieza.';
  if(!F.modelo) return e.textContent = 'Pon el modelo de la pieza.';
  if(!F.fotoData) return e.textContent = 'Falta la foto de la papeleta llena.';
  b.disabled = true;
  try{
    b.textContent = 'Subiendo foto…'; const papeleta = await subirFoto(F.fotoData);
    b.textContent = 'Guardando…';
    const {registro} = await api('registro', {method:'POST', body: JSON.stringify({motivo:F.motivo, sfr:F.sfr, tipoSfr:F.tipoSfr, modelo:F.modelo, linea:F.linea, piezas:F.piezas, papeleta})});
    REG.unshift(registro); lector && lector.parar(); lector = null; F = null;
    toast(`Registrado: ${registro.piezas.length} pieza${registro.piezas.length === 1 ? '' : 's'} · ${nomTurno(registro.turno)}`);
    track('mrb', {ruta:'mrb/registro', n: registro.piezas.length});
    vista = 'registros'; pintar();
  }catch(err){ e.textContent = err.message; b.disabled = false; b.textContent = 'Registrar scrap'; }
}

/* ---------- registros ---------- */
const R = {q:'', turno:'', tipo:'', sfr:'', dias:'30'};
const enRango = (r, dias) => !dias || (Date.now() - r.t) <= dias * 864e5;
function filtrados(){
  const q = norm(R.q);
  return (REG || []).filter(r => enRango(r, +R.dias) && (!R.turno || r.turno === R.turno) && (!R.sfr || String(r.sfr) === R.sfr)
    && (!R.tipo || r.piezas.some(p => p.tipo === R.tipo))
    && (!q || norm([r.motivo, r.tipoSfr, r.modelo, r.nombre, r.linea, ...r.piezas.map(p => p.serie)].join(' ')).includes(q)));
}
const fechaTxt = r => new Date(r.t).toLocaleString('es-MX', {timeZone:'America/Chihuahua', day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'});
function vRegistros(){
  const sel = (k, opts) => `<select data-r="${k}">${opts.map(([v, t]) => `<option value="${v}" ${R[k] === v ? 'selected' : ''}>${t}</option>`).join('')}</select>`;
  const lst = filtrados(), piezas = lst.reduce((a, r) => a + r.piezas.length, 0);
  return `<div class="filt"><input id="rq" placeholder="Buscar: serie, modelo, motivo, persona…" value="${esc(R.q)}" style="flex:2 1 220px">
    ${sel('dias', [['7', 'Últimos 7 días'], ['30', 'Últimos 30 días'], ['90', 'Últimos 90 días'], ['', 'Todo']])}
    ${sel('turno', [['', 'Todos los turnos'], ...Object.keys(TURNOS).map(t => [t, nomTurno(t)])])}
    ${sel('tipo', [['', 'Todas las piezas'], ...TIPOS.map(t => [t, t])])}
    ${sel('sfr', [['', 'SFR y no SFR'], ['true', 'Solo SFR'], ['false', 'Sin SFR']])}</div>
    <div class="row" style="margin-bottom:10px"><b style="flex:1">${lst.length} registros · ${piezas} piezas</b><button class="btn" data-a="csv">⤓ CSV</button></div>
    ${lst.map(regHTML).join('') || '<div class="vacio">No hay registros con esos filtros.</div>'}`;
}
function regHTML(r){
  const borrar = YO && (YO.adm || (YO.num === r.num && Date.now() - r.t < 864e5));
  return `<div class="reg"><img loading="lazy" src="${fotoUrl(r.papeleta)}" alt="Papeleta" data-zoom="${esc(r.papeleta)}">
    <div><div class="h"><span class="tchip" style="--c:${colTurno(r.turno)}">${nomTurno(r.turno)}</span><span>${fechaTxt(r)}</span><span>${esc(r.nombre)}</span>${r.linea ? `<span>${esc(r.linea)}</span>` : ''}</div>
    <b class="m">${esc(r.motivo)}</b>
    <div class="h">${r.sfr ? `<span class="sfr">SFR${r.tipoSfr ? ' · ' + esc(r.tipoSfr) : ''}</span>` : ''}<span>Modelo <b style="color:var(--ink)">${esc(r.modelo || '—')}</b></span>${borrar ? `<button class="del" data-del="${esc(r.key)}">Borrar</button>` : ''}</div>
    <div class="pzs">${r.piezas.map(p => `<span>${esc(p.tipo)} <em>${esc(p.serie)}</em></span>`).join('')}</div></div></div>`;
}
function csv(){
  const filas = [['Fecha', 'Día de turno', 'Turno', 'Persona', 'No. control', 'Qué fue', 'SFR', 'Tipo SFR', 'Modelo', 'Línea', 'Pieza', 'Serie', 'Foto papeleta']];
  filtrados().forEach(r => r.piezas.forEach(p => filas.push([new Date(r.t).toLocaleString('es-MX', {timeZone:'America/Chihuahua'}), r.dia, r.turno, r.nombre, r.num, r.motivo, r.sfr ? 'Sí' : 'No', r.tipoSfr, r.modelo, r.linea, p.tipo, p.serie, location.origin + fotoUrl(r.papeleta)])));
  const s = filas.map(f => f.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + s], {type:'text/csv;charset=utf-8'})); a.download = `mrb-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
}

/* ---------- métricas ---------- */
const M = {dias:30};
const cuenta = (lst, fn) => { const c = {}; lst.forEach(r => [].concat(fn(r)).forEach(([k, n]) => { if(k) c[k] = (c[k] || 0) + n; })); return Object.entries(c).sort((a, b) => b[1] - a[1]); };
function barras(datos, {max = 8, color} = {}){
  if(!datos.length) return '<div class="hint">Sin datos en este periodo.</div>';
  let d = datos;
  if(d.length > max){ const resto = d.slice(max - 1).reduce((a, x) => a + x[1], 0); d = [...d.slice(0, max - 1), ['Otros', resto]]; }
  const tope = Math.max(...d.map(x => x[1]));
  return `<div class="hb">${d.map(([k, n]) => `<div class="r"><span title="${esc(k)}">${esc(k)}</span><div class="tr"><i style="width:${Math.max(2, n / tope * 100)}%;${color ? `--c:${color(k)}` : ''}"></i></div><b>${n}</b></div>`).join('')}</div>`;
}
function tabla(cols, filas){ return `<details class="tb"><summary>Ver tabla</summary><div class="tbl"><table><tr>${cols.map(c => `<th>${c}</th>`).join('')}</tr>${filas.map(f => `<tr>${f.map((v, i) => `<td class="${i ? 'n' : ''}">${esc(v)}</td>`).join('')}</tr>`).join('')}</table></div></details>`; }
function vMetricas(){
  const lst = (REG || []).filter(r => enRango(r, M.dias));
  const piezas = lst.reduce((a, r) => a + r.piezas.length, 0);
  const sfr = lst.filter(r => r.sfr).reduce((a, r) => a + r.piezas.length, 0);
  const porTipo = cuenta(lst, r => r.piezas.map(p => [p.tipo, 1]));
  const porTurno = cuenta(lst, r => [[r.turno, r.piezas.length]]);
  const top = porTipo[0];
  const periodo = `<div class="pick" style="margin-bottom:12px">${[[7, '7 días'], [30, '30 días'], [90, '90 días'], [180, '6 meses']].map(([d, t]) => `<button type="button" data-md="${d}" class="${M.dias === d ? 'on' : ''}">${t}</button>`).join('')}</div>`;
  if(!lst.length) return periodo + '<div class="vacio">Todavía no hay scrap registrado en este periodo.</div>';
  const dias = Math.max(1, Math.min(M.dias, Math.ceil((Date.now() - Math.min(...lst.map(r => r.t))) / 864e5)));
  return `${periodo}<div class="kpis">
      <div class="kpi"><span>Piezas a scrap</span><b>${piezas}</b><small>${lst.length} registros</small></div>
      <div class="kpi"><span>Promedio por día</span><b>${(piezas / dias).toFixed(1)}</b><small>en ${dias} día${dias === 1 ? '' : 's'}</small></div>
      <div class="kpi"><span>Por SFR</span><b>${piezas ? Math.round(sfr / piezas * 100) : 0}%</b><small>${sfr} piezas</small></div>
      <div class="kpi"><span>Pieza que más se tira</span><b style="font-size:21px">${esc(top ? top[0] : '—')}</b><small>${top ? top[1] + ' piezas' : ''}</small></div></div>
    <div class="graf">
      <div class="card ch ancho"><h3>Piezas por día y turno</h3><div class="sub">Cada barra es un día de turno (la noche cuenta para el día en que empezó)</div>
        <div class="leg">${Object.keys(TURNOS).filter(t => porTurno.some(x => x[0] === t)).map(t => `<span><i style="background:${colTurno(t)}"></i>${nomTurno(t)}</span>`).join('')}</div>
        ${tendencia(lst)}</div>
      <div class="card ch"><h3>Por turno</h3><div class="sub">Piezas</div>${barras(porTurno.map(([k, n]) => [nomTurno(k), n]), {color: k => colTurno(k === 'Noche fin de semana' ? 'N-FS' : k.replace('Turno ', ''))})}</div>
      <div class="card ch"><h3>Por tipo de pieza</h3><div class="sub">Piezas</div>${barras(porTipo)}</div>
      <div class="card ch"><h3>¿Qué fue? (motivos)</h3><div class="sub">Piezas por motivo</div>${barras(cuenta(lst, r => [[r.motivo.trim(), r.piezas.length]]))}</div>
      <div class="card ch"><h3>Tipos de SFR</h3><div class="sub">Piezas por SFR</div>${barras(cuenta(lst.filter(r => r.sfr), r => [[r.tipoSfr || 'Sin tipo', r.piezas.length]]))}</div>
      <div class="card ch"><h3>Por modelo</h3><div class="sub">Piezas</div>${barras(cuenta(lst, r => [[r.modelo || 'Sin modelo', r.piezas.length]]))}</div>
      <div class="card ch"><h3>¿Quién lo registró?</h3><div class="sub">Piezas por persona</div>${barras(cuenta(lst, r => [[r.nombre, r.piezas.length]]))}</div>
      <div class="card ch ancho"><h3>Por línea</h3><div class="sub">Piezas (solo los que pusieron línea)</div>${barras(cuenta(lst.filter(r => r.linea), r => [[r.linea, r.piezas.length]]))}</div>
    </div>`;
}
/* barras apiladas por día (turnos), un solo eje; tooltip al tocar o pasar el mouse */
function tendencia(lst){
  const hoy = new Date(Date.now() - 6 * 3600e3); hoy.setUTCHours(0, 0, 0, 0);
  const n = Math.min(M.dias, 90), dias = [...Array(n)].map((_, i) => new Date(hoy.getTime() - (n - 1 - i) * 864e5).toISOString().slice(0, 10));
  const T = Object.keys(TURNOS), val = {}; dias.forEach(d => val[d] = Object.fromEntries(T.map(t => [t, 0])));
  lst.forEach(r => { if(val[r.dia]) val[r.dia][r.turno] = (val[r.dia][r.turno] || 0) + r.piezas.length; });
  const tot = d => T.reduce((a, t) => a + val[d][t], 0), max = Math.max(1, ...dias.map(tot));
  const paso = max <= 5 ? 1 : max <= 10 ? 2 : max <= 25 ? 5 : max <= 50 ? 10 : Math.ceil(max / 5 / 10) * 10, tope = Math.ceil(max / paso) * paso;
  const W = Math.max(320, Math.min(720, ($('out').clientWidth || 720) - 34)), H = W < 500 ? 190 : 220, L = 28, B = 22, Tp = 8, cw = (W - L) / n, bw = Math.max(2, Math.min(26, cw - 3)), y = v => H - B - (v / tope) * (H - B - Tp);
  let s = `<svg class="trend" viewBox="0 0 ${W} ${H}" role="img" aria-label="Piezas a scrap por día y turno">`;
  for(let v = 0; v <= tope; v += paso) s += `<line class="grid" x1="${L}" x2="${W}" y1="${y(v)}" y2="${y(v)}"/><text x="${L - 6}" y="${y(v) + 4}" text-anchor="end">${v}</text>`;
  const cada = Math.ceil(n / (W < 500 ? 5 : 8));
  dias.forEach((d, i) => {
    const x = L + i * cw + (cw - bw) / 2; let acc = 0;
    const segs = T.filter(t => val[d][t]);
    segs.forEach((t, k) => { const v = val[d][t], y1 = y(acc + v), y0 = y(acc), h = Math.max(0, y0 - y1 - (k < segs.length - 1 ? 2 : 0));
      const top = k === segs.length - 1; s += top ? `<path d="M${x} ${y0} V${y1 + Math.min(4, h)} q0 -4 4 -4 H${x + bw - 4} q4 0 4 4 V${y0} Z" fill="${colTurno(t)}"/>` : `<rect x="${x}" y="${y1}" width="${bw}" height="${h}" fill="${colTurno(t)}"/>`; acc += v; });
    if((i % cada === 0 && n - 1 - i >= cada * .6) || i === n - 1) s += `<text x="${x + bw / 2}" y="${H - 6}" text-anchor="middle">${+d.slice(8)}/${+d.slice(5, 7)}</text>`;
    s += `<rect class="hit" x="${L + i * cw}" y="${Tp}" width="${cw}" height="${H - B - Tp}" data-dia="${d}"/>`;
  });
  s += `<line x1="${L}" x2="${W}" y1="${H - B}" y2="${H - B}" stroke="var(--ink3)" stroke-width="1"/></svg>`;
  window.__val = val;
  return s;
}
let tipEl = null;
function tip(e, d){
  const v = window.__val?.[d]; if(!v) return;
  tipEl = tipEl || Object.assign(document.createElement('div'), {className:'tip'}); document.body.appendChild(tipEl);
  const tot = Object.values(v).reduce((a, b) => a + b, 0);
  tipEl.innerHTML = `<b>${new Date(d + 'T12:00:00Z').toLocaleDateString('es-MX', {weekday:'short', day:'numeric', month:'short', timeZone:'UTC'})} · ${tot} pzas</b>${Object.entries(v).filter(([, n]) => n).map(([t, n]) => `<br>${nomTurno(t)}: ${n}`).join('')}`;
  const x = Math.min(innerWidth - 230, e.clientX + 12), y2 = Math.max(10, e.clientY - 70); tipEl.style.left = x + 'px'; tipEl.style.top = y2 + 'px';
}

/* ---------- pintar y eventos ---------- */
async function pintar(){
  document.querySelectorAll('#seg button').forEach(b => b.classList.toggle('on', b.dataset.v === vista));
  if(vista !== 'registrar' && lector){ lector.parar(); lector = null; }
  try{
    if(!REG) await cargar();
    $('out').innerHTML = vista === 'registrar' ? vRegistrar() : vista === 'registros' ? vRegistros() : vMetricas();
    if(vista === 'registrar' && !esCelular()) $('fSerie')?.focus();
  }catch(e){ $('out').innerHTML = `<div class="vacio">${esc(e.message)}</div>`; }
}
$('seg').onclick = e => { const b = e.target.closest('[data-v]'); if(b){ vista = b.dataset.v; pintar(); track('vista', {ruta:'mrb/' + vista, titulo:'MRB · ' + b.textContent.trim()}); } };
$('out').addEventListener('click', async e => {
  const t = e.target;
  const g = (sel) => t.closest(sel);
  let x;
  if(x = g('[data-sfr]')){ F.motivo = $('fMotivo').value; F.modelo = $('fModelo').value; F.sfr = x.dataset.sfr === '1'; return pintar(); }
  if(x = g('[data-sug]')){ const id = {motivo:'fMotivo', tipoSfr:'fTipoSfr', modelo:'fModelo'}[x.dataset.sug]; $(id).value = x.dataset.v; F[x.dataset.sug] = x.dataset.v; return; }
  if(x = g('[data-tp]')){ F.tipoPieza = x.dataset.tp; document.querySelectorAll('[data-tp]').forEach(b => b.classList.toggle('on', b === x)); return; }
  if(x = g('[data-lin]')){ F.linea = F.linea === x.dataset.lin ? '' : x.dataset.lin; document.querySelectorAll('[data-lin]').forEach(b => b.classList.toggle('on', b.dataset.lin === F.linea)); return; }
  if(x = g('[data-qp]')){ F.piezas.splice(+x.dataset.qp, 1); $('fPiezas').innerHTML = piezasHTML(); return; }
  if(g('#fAdd')){ agregarPieza($('fSerie').value); $('fSerie').value = ''; $('fSerie').focus(); return; }
  if(g('#fCam')){ if(lector){ lector.parar(); lector = null; return; } lector = escanerEnLinea($('fLector'), c => agregarPieza(c, {callado:true}), {texto:'Apunta al código de la pieza'});
    setTimeout(() => $('fLector')?.scrollIntoView({block:'center', behavior:'smooth'}), 150);
    const obs = new MutationObserver(() => { if(!$('fLector')?.children.length){ lector = null; obs.disconnect(); } }); obs.observe($('fLector'), {childList:true}); return; }
  if(x = g('[data-foto]')){ $(x.dataset.foto === 'cam' ? 'camIn' : 'libIn').click(); return; }
  if(g('#fQuitar')){ F.fotoData = ''; $('fFoto').innerHTML = ''; return; }
  if(g('#fOk')) return registrar();
  if(x = g('[data-zoom]')) return verFoto(fotoUrl(x.dataset.zoom));
  if(x = g('[data-del]')){ if(!confirm('¿Borrar este registro de scrap?')) return; try{ await api('borrar', {method:'POST', body: JSON.stringify({key: x.dataset.del})}); REG = REG.filter(r => r.key !== x.dataset.del); toast('Borrado'); pintar(); }catch(err){ alert(err.message); } return; }
  if(g('[data-a="csv"]')) return csv();
  if(x = g('[data-md]')){ M.dias = +x.dataset.md; return pintar(); }
  if(x = g('[data-dia]')) return tip(e, x.dataset.dia);
});
$('out').addEventListener('pointermove', e => { const x = e.target.closest('[data-dia]'); if(x && e.pointerType === 'mouse') tip(e, x.dataset.dia); else if(!x && tipEl) tipEl.remove(); });
$('out').addEventListener('keydown', e => { if(e.target.id === 'fSerie' && e.key === 'Enter'){ e.preventDefault(); agregarPieza(e.target.value); e.target.value = ''; } });
$('out').addEventListener('input', e => {
  if(e.target.id === 'fMotivo') F.motivo = e.target.value;
  if(e.target.id === 'fModelo') F.modelo = e.target.value;
  if(e.target.id === 'fTipoSfr') F.tipoSfr = e.target.value;
  if(e.target.id === 'rq'){ R.q = e.target.value; const pos = e.target.selectionStart; pintar().then(() => { const i = $('rq'); i.focus(); i.setSelectionRange(pos, pos); }); }
});
$('out').addEventListener('change', e => { const s = e.target.closest('[data-r]'); if(s){ R[s.dataset.r] = s.value; pintar(); }
  const pt = e.target.closest('[data-pt]'); if(pt) F.piezas[+pt.dataset.pt].tipo = pt.value; });
['camIn', 'libIn'].forEach(id => $(id).addEventListener('change', async e => {
  const f = e.target.files[0]; e.target.value = ''; if(!f) return;
  try{ F.fotoData = await comprimir(f); $('fFoto').innerHTML = `<div class="foto"><img src="${F.fotoData}" alt="Papeleta"><button type="button" id="fQuitar">Quitar</button></div>`; }
  catch(err){ $('fErr').textContent = 'No se pudo leer la foto.'; }
}));
document.addEventListener('pointerdown', e => { if(tipEl && !e.target.closest('[data-dia]')) tipEl.remove(); });
yo().then(r => { YO = r.yo; }).catch(() => {});
pintar();
track('vista', {ruta:'mrb/registrar', titulo:'MRB'});

/* Fallas Kasalis — app (instalable en el celular): modos de falla con flujo de resolución,
   búsqueda por código o palabra, manual y documentos relacionados. */
import {CODES, HINTS, englishName, originalName} from '../shared/kasalis.js';
import {DOCS} from './data/docs.js';
import {FALLAS} from './data/fallas.js';
import {PROCS, procInline, guideHTML} from '../shared/procs.js';
import {tx, LEYENDA, plain} from '../shared/txt.js';
import {flowFijo} from '../shared/flow.js';
import {DEBUG} from './data/debug.js';
import {yo, track, mountAportes, ocultarFab, cuentaHTML, montarCuenta, puedeVer} from '../shared/cuenta.js';
import {explicaHTML, EX_CSS} from '../shared/explica.js';
import {conImagenes} from './data/imagenes.js';
import {NOTAS, PROCEDIMIENTOS, FRECUENCIA, FRECUENCIA_FUENTE} from './data/notas.js';

const $ = id => document.getElementById(id);
const esc = tx;
const PLC = new Map(CODES.plc.map(r=>[r[0], {code:r[0], name:r[1], group:r[2]}]));
const KSV = new Map(); CODES.ksv.forEach(r=>{ if(!KSV.has(r[0])) KSV.set(r[0], {code:r[0], name:r[1], group:r[2], comment:r[3]}); });
const PROCESS = {screws:'Tornillos elevados (Final Assy)', leak:'Leak test FAIL', eol:'EOL FAIL'};
const fallasDe = key => FALLAS.filter(f=>f.codigos.includes(String(key)));
const codeName = k => { const n=+k; return (n<0 ? KSV.get(n) : PLC.get(n))?.name || ''; };

/* ---------- traducción de nombres de código ---------- */
const WORDS = {
  ALIGN:'alineación', ALIGN2:'alineación 2', DISP:'dispensado', ROTARY:'mesa rotatoria', TARGET:'target', SPARE:'estación spare', ROBOT:'robot', ENCLO:'gabinete',
  FT:'prueba final', PEAK:'en el pico de foco', EXTRA:'extra', EXTRA2:'extra 2', CURE:'durante curado UV', POSTCURE:'después del curado UV', UNGRIP:'al soltar el lente', RETEST:'en RETEST (post-horno)',
  MTF:'MTF', CTR:'centro óptico', SYM:'simetría', FC:'esquinas (field corners)', UT:'uniformidad / tilt', OTHER:'otra prueba', NOISE:'ruido', SAT:'saturación', DZ:'delta Z',
  GENERAL:'general', ERROR:'error', CAM:'cámara', OPEN:'abrir', CLOSE:'cerrar', DETECT:'detectar', LENS:'lente', GRIP:'gripper', PREFOCUS:'prefocus', REPEAT:'repetibilidad',
  TEST:'prueba', FAIL:'falla', CENTER:'centrado', SCAN:'barrido de foco', CLEAR:'limpiar', DEL:'borrar', FRAMES:'frames', Z:'Z', NOT:'no', MOVED:'se movió', PICKPOS:'posición de pick',
  INVALID:'inválida', HOME:'home', TIMEOUT:'tiempo excedido', GRAB:'capturar', VISIMG:'imagen de visión', PAT:'patrón de visión', LOAD:'cargar', SEARCH:'búsqueda', SAVE:'guardar',
  RESULTS:'resultados', INSP:'inspección', MAX:'máximo', ITER:'iteraciones', FOCAL:'focal', PLANE:'plano', NUM:'número', TEACH:'enseñar', CLOSED:'cerrado', POS:'posición', UVMEASURE:'medición UV',
  UPCAL:'calibración superior', DOWNCAL:'calibración inferior', ARRAY:'arreglo', PARS:'parámetros', INVAL:'inválidos', TZ:'θZ', TIME:'tiempo', HDOWN:'hold-down', CLAMP:'clamp',
  NO:'sin', UV:'UV', STEPS:'pasos', SAFETY:'seguridad', TGTZ:'Z del target', FORCE:'fuerza', REACH:'alcanzada', GAP:'gap', CAL:'calibración', FAILED:'falló', OFFSET:'offset',
  FINAL:'final', TRYS:'intentos', GET:'obtener', PICK:'pick', VACUUM:'vacío', ON:'encender', OFF:'apagar', STAB:'estabilidad', TF:'tip find', X:'X', Y:'Y', ACTIVE:'activo', BROKEN:'roto',
  FIND:'encontrar', LEFT:'izquierdo', RIGHT:'derecho', FID:'fiducial', SEQ:'secuencia', STEP:'paso', UNK:'desconocido', CYCLIC:'cíclico', MOVE:'movimiento', TIPFIND:'tip find', EXTEND:'extender', RETRACT:'retraer',
  HEAD1:'cabezal 1', HEAD2:'cabezal 2', DISPENSER:'dispensador', FAULT:'falla', POST:'post', FOCUS:'foco', LEVEL:'nivel de adhesivo', POTLIFE:'pot life (vida del adhesivo)', ST:'prueba de sensor',
  PART:'partículas', REG:'registro', PIXEL:'pixeles', DSTN:'distancia', DARK:'señal oscura', TIP:'punta', VIS:'visión', SENS:'sensor', TGT:'target', CUP:'copa de purga', VOL:'volumen', EXCEEDED:'excedido',
  BADPARAMS:'parámetros malos', USERTEST:'prueba de usuario', EXTLIB:'librería externa', LASER:'láser', AUTO:'auto', WEIGH:'pesado', DOME:'domo', LOWER:'bajar', RAISE:'subir', PRT:'partículas', OP:'operación',
  TOLERANCE:'tolerancia', DOT:'punto', PARAMS:'parámetros', BOTH:'ambos', PRESSURE:'presión', LOW:'baja', HIGH:'alta', PLACE:'colocación', LIN:'línea', ZERO:'cero', DLI:'DLI',
  LOCK:'bloqueo', ACCESS:'acceso', DOOR:'puerta', STN:'estación', UP:'arriba', MOTION:'movimiento', IN:'en', ALN:'alineación', DSP:'dispensado', DISABLED:'deshabilitada', NODEVICE:'sin dispositivo',
  PUSHER:'pusher', VAC:'vacío', DETECTED:'detectado', PREPICK:'pre-pick', NA:'n/a', SAFE:'seguro', POGOS:'pogo pins', LIFT:'lift', AXIS:'eje', FXT:'fixture', TBL:'mesa', COUNTR:'contrapeso',
  CYL:'cilindro', RETR:'retraer', EXT:'extender', CAMERA:'cámara', PROBE:'probe', GS:'golden sample', LCOS:'LCOS', DOMELIGHT:'luz de domo', ENABLED:'habilitada', LC:'LC', DURING:'durante', EXTERNAL:'externo',
  INVALID_POSITION:'posición inválida', ESTOP:'paro de emergencia', MAIN:'principal', AIR:'aire', MES:'MES', SEND:'enviar', DEVICE:'dispositivo', DATA:'datos', WAIT:'esperar', NEW:'nuevo', VALIDATION:'validación',
  CFG:'configuración', CONFIG:'configuración', IPC:'comunicación IPC', CONNECT:'conectar', LOST:'perdida', RESP:'respuesta', MP:'MasterProcess', WRITE:'escribir', INIT:'inicializar', PROCESSING:'proceso', ABORTED:'abortado',
  BACKLASH:'backlash', VPP:'VPP', EOT:'fin de carrera', LIVE:'live', VIEW:'vista', ENABLE:'habilitar', DISABLE:'deshabilitar', TONGUE:'lengüeta', MOTION_LIMIT:'límite de movimiento', LIMIT:'límite', SDCAL:'calibración SD',
};
function translate(name){ return name.split('_').map(t=>WORDS[t]||t.toLowerCase()).join(' '); }

/* ---------- dónde ocurre en la Kasalis ---------- */
function where(code, name){
  const n = name||''; let st = 'General / sistema';
  if(code>=101&&code<=199 || code>=1101&&code<=1199) st='Estación de ALINEACIÓN (+UV)';
  else if(code>=201&&code<=299) st='Estación de DISPENSADO';
  else if(code>=301&&code<=399) st='Gabinete / puertas';
  else if(code>=401&&code<=499) st='Mesa rotatoria';
  else if(code>=501&&code<=599) st='Módulo de target';
  else if(code>=601&&code<=699) st='Estación SPARE';
  else if(code>=701&&code<=799) st='Alineación 2';
  else if(code>=801&&code<=899) st='Robot';
  else if(code>=901&&code<=1099) st='Estaciones de prueba';
  else if(code>=31&&code<=99) st='Software / configuración / comunicación';
  let ph = 'BUILD y RETEST';
  if(/RETEST/.test(n)) ph='RETEST (prueba final después del horno)';
  else if(/UNGRIP/.test(n)) ph='BUILD · al soltar el lente (antes del horno)';
  else if(/POSTCURE|_CURE|UVCURE|UVMEASURE|NO_UV/.test(n)) ph='BUILD · curado UV';
  else if(/PEAK|SCAN|PREFOCUS|CENTER|GRDCTR|FOCAL/.test(n)) ph='BUILD · búsqueda de alineación';
  else if(/^DISP|ST_PART|ST_PIXEL|ST_DARK|ST_NOISE/.test(n)) ph='BUILD · dispensado / pruebas de sensor';
  else if(/GRIP|PICK|LENS/.test(n)) ph='BUILD · pick del lente';
  return {st, ph};
}

/* ---------- términos de búsqueda en documentos ---------- */
const TERMS = {PREFOCUS:['prefocus'],MTF:['MTF'],UV:['UV cure','UV'],UVMEASURE:['UV'],CURE:['cure'],GRIP:['gripper','grip'],CAM:['camera'],PAT:['pattern'],POTLIFE:['pot life','PotLife'],LEVEL:['Volume','volume'],
  PART:['particle'],PRT:['particle'],DARK:['dark signal'],NOISE:['noise'],PIXEL:['pixel'],TF:['tipfind','tip find'],TIPFIND:['tipfind'],CAL:['calibration'],HOME:['home'],VAC:['vacuum'],VACUUM:['vacuum'],
  POGOS:['pogo'],ROTARY:['rotary'],TARGET:['target'],CENTER:['center','centration'],CTR:['center'],SCAN:['scan','focus'],ESTOP:['emergency'],AIR:['air'],MES:['MES'],DOME:['dome'],LENS:['lens'],
  CLAMP:['clamp'],BACKLASH:['backlash'],VPP:['VPP','AlignVPPOffsetZ'],LASER:['laser'],DISPENSER:['dispense'],DISP:['dispense'],VIS:['post dispense','post-dispense'],INSP:['inspection'],SAFE:['safety'],
  RETEST:['retest','final test'],UNGRIP:['ungrip'],PEAK:['peak'],SYM:['symmetry'],FC:['corner'],TIP:['tip'],FID:['fiducial'],PRESSURE:['pressure'],WEIGH:['weigh'],DOOR:['door'],LIMIT:['limit switch'],PICK:['pick'],FOCUS:['focus'],SAT:['saturat'],PICKPOS:['pick position'],TEACH:['teach']};
const GENERIC = new Set(['ALIGN','DISP','FT','GENERAL','ERROR','FAIL','NOT','TEST','INVALID','OPEN','CLOSE','SAVE','RESULTS','MAX','ITER','OTHER','NO','ON','OFF','X','Y','Z','STN','ST','SEARCH','LOAD','GET','POS','IN','UP','EXTEND','RETRACT','TIMEOUT']);
function termsFor(name){
  const t = new Set();
  for(const tok of name.split('_')){ if(TERMS[tok]) TERMS[tok].forEach(x=>t.add(x)); else if(!GENERIC.has(tok) && tok.length>=4) t.add(tok.toLowerCase()); }
  return [...t];
}
function searchDocs(terms, codeNum){
  const res = [];
  const reCode = codeNum!=null ? new RegExp('(?<![\\w-])'+String(codeNum).replace('-','\\-')+'(?![\\w])') : null;
  for(const d of DOCS) d.pages.forEach((txt,i)=>{
    const low = txt.toLowerCase(); let score=0, first=-1, hit=null;
    for(const term of terms){ const tl=term.toLowerCase(); let k=low.indexOf(tl), c=0; while(k>=0 && c<20){ c++; if(first<0||k<first){ first=k; hit=term; } k=low.indexOf(tl,k+tl.length); } score += c*(term.length>4?2:1); }
    if(reCode && d.id!=='manual'){ const m = txt.match(reCode); if(m){ score += 12; if(first<0||m.index<first){ first=m.index; hit=String(codeNum); } } }
    if(score>0 && (txt.match(/\.{8,}/g)||[]).length>4) score *= .25;   // páginas de índice
    if(score>0) res.push({d, i, score, first, hit});
  });
  res.sort((a,b)=>b.score-a.score);
  return res.slice(0,8);
}
function snippet(txt, pos, terms){
  const a = Math.max(0,pos-160), b = Math.min(txt.length,pos+260);
  let s = (a?'…':'')+txt.slice(a,b).replace(/\s+/g,' ')+(b<txt.length?'…':'');
  s = esc(s);
  for(const t of terms.sort((x,y)=>y.length-x.length)){ if(t.length<2) continue; s = s.replace(new RegExp('('+t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','gi'),'<mark>$1</mark>'); }
  return s;
}
function docLink(d,i){ const f = '../'+encodeURI(d.file).replace(/#/g,'%23'); return d.kind==='pdf' ? `${f}#page=${i+1}` : f; }

/* ---------- piezas de UI ---------- */
const ICONS = {
  comunicacion:'<path d="M9 7V3m6 4V3M7 7h10v4a5 5 0 0 1-10 0zM12 16v5"/>',
  alineacion:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/>',
  retest:'<path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/>',
  despega:'<path d="M12 3c3 4 6 7 6 11a6 6 0 0 1-12 0c0-4 3-7 6-11z"/>',
  dispensado:'<path d="M10 2h4v6l3 3v3H7v-3l3-3zM12 14v4M10 22a2 2 0 0 0 4 0"/>',
  delo:'<path d="M5 8h14M7 8v11a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V8M9 8V4h6v4"/>',
  gripper:'<path d="M7 3v8l3 3v7M17 3v8l-3 3v7"/>',
  'pick-choca':'<path d="M7 3v8l3 3v7M17 3v8l-3 3v7"/><path d="M3 21h18"/>',
  particulas:'<circle cx="7" cy="8" r="2"/><circle cx="16" cy="6" r="1.5"/><circle cx="14" cy="15" r="2.5"/><circle cx="6" cy="17" r="1.2"/>',
  software:'<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>',
  vis233:'<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  progresion:'<path d="M4 12h11M11 6l6 6-6 6M20 5v14"/>',
  mecanico:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M4.2 4.2l2.1 2.1m11.4 11.4 2.1 2.1M2 12h3m14 0h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
};
const icon = id => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[id]||ICONS.mecanico}</svg>`;
const codeChips = (list, btn) => `<div class="codes">${list.map(c=> btn ? `<button data-go="c/${c}${+c<0?'|ksv':''}">${c}</button>` : `<i>${c}</i>`).join('')}</div>`;

/* iconos de sección: lo primario (qué hacer) arriba y grande; lo de apoyo en la columna lateral */
const SI = {steps:'<path d="M9 6h11M9 12h11M9 18h11"/><path d="m3.5 6 1.5 1.5L7.5 5M3.5 12l1.5 1.5L7.5 11M3.5 18l1.5 1.5L7.5 17"/>', cause:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>', tip:'<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z"/>', code:'<path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18"/>', info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.01"/>', doc:'<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><path d="M14 3v5h5"/>', book:'<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/>'};
const sh = (ic, t, main) => `<h3 class="${main?'sh':'lb'}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${SI[ic]}</svg>${t}</h3>`;
const gflow = f => `<div class="gflow" data-fid="${f.id}"></div>`;
function causesHTML(f){
  let h = '';
  if(f.causas.length) h += `${sh('cause','Causas vistas en piso → solución')}<div class="ca">${f.causas.map(([a,b])=>`<div class="r"><span>${esc(a)}</span><span>${esc(b)}</span></div>`).join('')}</div>`;
  if(f.tips.length) h += `${sh('tip','Para recordar')}<div class="tips">${f.tips.map(t=>`<div>${esc(t)}</div>`).join('')}</div>`;
  return h;
}
function notesHTML(key){
  const notas = NOTAS.filter(n=>(n.codigos||[]).map(String).includes(key));
  const procs = PROCEDIMIENTOS.filter(p=>(p.codigos||[]).map(String).includes(key) || notas.some(n=>n.procedimiento===p.id));
  let h='';
  if(notas.length) h += `<h3 class="lb">Notas</h3>${notas.map(n=>`<div class="card" style="margin-bottom:8px"><h4>${esc(n.titulo)}</h4>${n.causa?`<div class="muted">Causa: ${esc(n.causa)}</div>`:''}<ul>${(n.acciones||[]).map(a=>`<li>${esc(a)}</li>`).join('')}</ul></div>`).join('')}`;
  if(procs.length) h += `<h3 class="lb">Procedimientos con fotos</h3>${procs.map(p=>`<div class="flow" style="margin-bottom:8px"><div style="padding:10px 0 0;font-weight:600">${esc(p.titulo)}</div>${p.pasos.map((s,i)=>`<div class="st"><div class="n">${i+1}</div><div><b>${esc(s.texto)}</b>${s.foto?`<img loading="lazy" src="${esc(s.foto)}" alt="Paso ${i+1}" style="max-width:100%;border-radius:12px;margin-top:6px">`:''}</div></div>`).join('')}</div>`).join('')}`;
  return h;
}
function docsHTML(docs, terms){
  return docs.length ? docs.map(r=>`<div class="doc"><div class="t"><span>${esc(r.d.title)} · ${r.d.kind==='pdf'?'pág. '+(r.i+1):'sección '+(r.i+1)}</span><a href="${docLink(r.d,r.i)}" target="_blank">Abrir ↗</a></div><div class="s">${snippet(r.d.pages[r.i], r.first, terms)}</div></div>`).join('') : '<div class="muted">Sin coincidencias en el manual ni en los archivos.</div>';
}

/* ---------- vistas ---------- */
/* inicio: lo más común arriba y lo demás agrupado por estación de la mesa */
const COMUNES = ['comunicacion','alineacion','vis233','retest','despega'];
const ESTACIONES = [
  ['Alineación (+UV)', ['alineacion','prefocus','lensplace','pick-choca','despega','gripper','retest']],
  ['Dispensado', ['vis233','dispensado','delo','particulas']],
  ['Software / MES', ['software','progresion']],
  ['General', ['comunicacion','mecanico']],
];
const card = f => `<div class="mode" data-go="f/${f.id}"><div class="top-r"><div class="ic">${icon(f.id)}</div></div><b>${esc(plain(f.titulo))}</b><span>${esc(plain(f.corto))}</span>${codeChips(f.codigos.slice(0,4))}</div>`;
function homeView(){
  const byId = id => FALLAS.find(f=>f.id===id);
  const usados = new Set(ESTACIONES.flatMap(e=>e[1]));
  const resto = FALLAS.filter(f=>!usados.has(f.id));
  let h = `${sh('cause','Lo más común',1)}<div class="list top5">${COMUNES.map(byId).filter(Boolean).map(f=>`<div class="row" data-go="f/${f.id}"><b class="ic" style="width:36px;height:36px">${icon(f.id)}</b><span>${esc(f.titulo)}<small>${esc(f.codigos.slice(0,4).join(' · '))}</small></span><span class="faint">›</span></div>`).join('')}</div>`;
  h += `<hr class="sep">${sh('steps','Por estación',1)}<img class="mesa" src="fotos/manual/estaciones.jpg" alt="Estaciones de la mesa">`;
  ESTACIONES.forEach(([n, ids])=>{ const fs = ids.map(byId).filter(Boolean); if(fs.length) h += `<h3 class="lb">${esc(n)}</h3><div class="modes">${fs.map(card).join('')}</div>`; });
  if(resto.length) h += `<h3 class="lb">Otras</h3><div class="modes">${resto.map(card).join('')}</div>`;
  h += `<hr class="sep"><div class="link" data-go="tools/linea"><span>🧮 Explicar una línea ARC / VIS / PRE</span><span class="faint">›</span></div>`;
  h += `<details class="more"><summary>${sh('book','Guías del programa ('+Object.keys(PROCS).length+')')}</summary><div class="in">${procList(Object.keys(PROCS))}</div></details>${LEYENDA}`;
  return h;
}
let SES = {nivel:'operador', procNiveles:{}};
const visible = id => puedeVer(SES.procNiveles[id] || 'operador', SES.nivel);
function procList(ids){
  ids = ids.filter(visible);
  return `<div class="list">${ids.map(id=>{ const p = PROCS[id]; return `<div class="row" data-go="p/${id}"><b style="font-size:12px;color:var(--ink3)">${esc(p.estacion.split(' ')[0])}</b><span>${esc(p.titulo)}<small>${esc(p.permisos)}${p.pasos.length ? ' · '+p.pasos.length+' pasos' : ''}</small></span><span class="faint">›</span></div>`; }).join('')}</div>`;
}
function fallaView(id){
  const f = FALLAS.find(x=>x.id===id); if(!f) return homeView();
  return `<div class="head"><div class="k"><span class="tag">Kasalis</span> Modo de falla</div><h2>${esc(f.titulo)}</h2><p>${esc(f.corto)}</p>${codeChips(f.codigos, true)}</div>
    <div class="fv"><section>${sh('steps','Qué hacer, paso a paso',1)}${gflow(f)}${f.link?`<a class="link" href="${f.link.href}"><span>${esc(f.link.t)}</span><span class="faint">↗</span></a>`:''}${['vis233','dispensado'].includes(f.id)?`<div class="link" data-go="tools/linea"><span>🧮 Explicar la línea ARC / VIS de la máquina</span><span class="faint">›</span></div>`:''}</section>
    <aside>${causesHTML(f)}</aside></div>${LEYENDA}`;
}
function codeView(code, src){
  const c = src==='ksv' ? KSV.get(code) : PLC.get(code);
  const key = String(code);
  const tr = translate(c.name);
  const w = src==='ksv' ? {st:'KSvision (visión / cámara)', ph:'librería de visión'} : where(code, c.name);
  const fs = fallasDe(key);
  const terms = termsFor(c.name);
  const docs = searchDocs(terms, src==='plc'?code:null);
  const freq = FRECUENCIA[key];
  const other = src==='plc' ? KSV.get(-code) : PLC.get(-code);
  const toks = new Set(c.name.split('_').filter(t=>!GENERIC.has(t)));
  const pool = src==='ksv' ? [...KSV.values()] : [...PLC.values()];
  const rel = pool.filter(x=>x.code!==code && x.group===c.group).map(x=>({x, s:x.name.split('_').filter(t=>toks.has(t)).length + (Math.abs(x.code-code)<=2?.5:0)})).filter(o=>o.s>=1).sort((a,b)=>b.s-a.s).slice(0,8);
  let h = `<div class="head"><div class="k">${src==='ksv'?'KSvision':'PLC Pixid'} · ${esc(w.st)}</div>
    <div style="display:flex;gap:14px;align-items:center;margin-top:6px"><div class="big">${code}</div><div style="min-width:0"><h2 style="font-size:17px;margin:0;overflow-wrap:anywhere">${esc(c.name)}</h2>${HINTS[key]?'':`<p>${esc(tr.charAt(0).toUpperCase()+tr.slice(1))}</p>`}<p class="en">${esc(englishName(c.name))}${c.comment?' — '+esc(c.comment):''}</p></div></div>
    ${freq?`<p style="margin-top:10px;font-size:12.5px">${freq}× en logs</p>`:''}${HINTS[key]?`<div class="hint" style="margin-top:10px">${esc(HINTS[key])}</div>`:''}</div>`;
  h += `<div class="fv"><section>`;
  if(fs.length){
    const f = fs[0];
    h += `${sh('steps','Qué hacer, paso a paso',1)}<div class="faint" style="margin:-4px 4px 10px;font-size:12.5px">${esc(f.titulo)}</div>${gflow(f)}`;
  } else if(!HINTS[key]) h += `<div class="card"><div class="hint muted">Sin guía todavía. Revisa el manual abajo.</div></div>`;
  h += `</section><aside>`;
  if(fs.length){ h += causesHTML(fs[0]);
    fs.slice(1).forEach(o=>{ h += `<div class="link" data-go="f/${o.id}"><span>Este código también sale en: ${esc(o.titulo)}</span><span class="faint">›</span></div>`; }); }
  h += notesHTML(key);
  h += `<details class="more"><summary>Manual y documentos (${docs.length})</summary><div class="in">${docsHTML(docs, [...terms, String(code)])}</div></details>`;
  if(rel.length || other) h += `<details class="more"><summary>Códigos parecidos (${rel.length+(other?1:0)})</summary><div class="in rel">${other?`<button data-go="c/${other.code}|${src==='plc'?'ksv':'plc'}">${other.code} · ${esc(other.name)} (${src==='plc'?'KSvision':'PLC'})</button>`:''}${rel.map(o=>`<button data-go="c/${o.x.code}|${src}">${o.x.code} · ${esc(o.x.name)}</button>`).join('')}</div></details>`;
  return h + `</aside></div>${LEYENDA}`;
}
function procView(id){
  const p = PROCS[id]; if(!p) return homeView();
  if(!visible(id)) return `<div class="card"><div class="hint muted">Esta guía es para otro nivel de acceso.</div></div>`;
  const usa = FALLAS.filter(f=>f.flujo.some(s=>s.proc===id));
  return `<div class="head"><div class="k"><span class="tag">Kasalis</span> ${esc(p.estacion)} · ${esc(p.permisos)}</div><h2>${esc(p.titulo)}</h2><p>${esc(p.cuando)}</p></div>
    <div class="gflow-p" data-pid="${id}">${guideHTML(p, undefined, 'Pasos')}</div>${usa.length?`${sh('book','Se usa en')}${usa.map(f=>`<div class="link" data-go="f/${f.id}"><span>${esc(f.titulo)}</span><span class="faint">›</span></div>`).join('')}`:''}${LEYENDA}`;
}
function processView(key){
  return `<div class="head"><div class="k">Falla de proceso (no es código Kasalis)</div><h2>${esc(PROCESS[key])}</h2></div>
    <h3 class="lb">Qué revisar</h3><div class="card"><div class="hint">${esc(HINTS[key]||'')}</div></div>`;
}
function codesTab(){
  const withFlow = [...new Set(FALLAS.flatMap(f=>f.codigos))];
  const fr = Object.entries(FRECUENCIA).sort((a,b)=>b[1]-a[1]).slice(0,12);
  let h = '';
  if(fr.length) h += `<h3 class="lb">Más frecuentes en tus corridas</h3><div class="list">${fr.map(([k,v])=>`<div class="row" data-go="c/${k}"><b>${k}</b><span>${esc(codeName(k))}</span><span class="faint">${v}×</span></div>`).join('')}</div><div class="faint" style="font-size:12px;margin:6px 4px">${esc(FRECUENCIA_FUENTE)}</div>`;
  h += `<h3 class="lb">Códigos con flujo de resolución</h3><div class="list">${withFlow.map(k=>`<div class="row" data-go="c/${k}${+k<0?'|ksv':''}"><b>${k}</b><span>${esc(codeName(k))}<small class="en">${esc(englishName(codeName(k)))}</small><small>${esc(fallasDe(k).map(f=>f.titulo).join(' · '))}</small></span><span class="faint">›</span></div>`).join('')}</div>`;
  const other = Object.keys(HINTS).filter(k=>!withFlow.includes(k) && !PROCESS[k]);
  h += `<h3 class="lb">Otros códigos con guía</h3><div class="list">${other.map(k=>`<div class="row" data-go="c/${k}"><b>${k}</b><span>${esc(codeName(k))}</span><span class="faint">›</span></div>`).join('')}</div>`;
  h += `<h3 class="lb">Fallas de proceso</h3><div class="list">${Object.keys(PROCESS).map(k=>`<div class="row" data-go="s/${k}"><b style="font-size:13px">${k}</b><span>${esc(PROCESS[k])}</span><span class="faint">›</span></div>`).join('')}</div>`;
  return h;
}
/* ---------- debug: material en revisión, separado de lo que ya funciona ---------- */
const DBG_CSS = `<style>.dbg-ban{border:1.5px dashed var(--line);border-radius:16px;padding:10px 12px;font-size:13px;color:var(--ink2);margin-bottom:12px}
.dbg-sec{border-radius:16px;background:var(--surface);border:1px solid var(--line);margin-bottom:8px;overflow:hidden}
.dbg-sec summary{list-style:none;display:flex;gap:10px;align-items:center;padding:12px 14px;cursor:pointer;font-weight:700;font-size:15px}
.dbg-sec summary::-webkit-details-marker{display:none}
.dbg-sec summary i{font:700 12px ui-monospace,Menlo,monospace;font-style:normal;padding:3px 8px;border-radius:8px;background:var(--bg);color:var(--ink2);white-space:nowrap}
.dbg-sec summary span{flex:1;min-width:0}.dbg-sec summary span.faint{flex:0 0 auto}
.dbg-sec[open] summary{border-bottom:1px solid var(--line)}
.dbg-sec ul{margin:10px 14px 12px;padding-left:18px;font-size:14px;line-height:1.5}
.dbg-sec li{margin:4px 0}
.dbg-gif{margin:0 14px 14px;border-radius:12px;background:var(--bg);color:var(--ink3);font-size:12px;padding:14px;text-align:center}
.dbg-gif img{width:100%;border-radius:12px;display:block}</style>`;
function debugList(){
  return `${DBG_CSS}${sh('code','Debug · en revisión',1)}<div class="dbg-ban">Material que todavía no está confirmado en piso. No cambia las fallas ni las guías; cuando se confirme, se pasa a la app.</div>
    <div class="list">${DEBUG.map(d=>`<div class="row" data-go="debug/${d.id}"><b style="font-size:12px;color:var(--ink3)">${d.secciones.length}</b><span>${esc(d.titulo)}<small>${esc(d.estado)}</small></span><span class="faint">›</span></div>`).join('')}</div>`;
}
function debugView(id){
  const d = DEBUG.find(x=>x.id===id); if(!d) return debugList();
  return `${DBG_CSS}<div class="head"><div class="k">Debug · en revisión</div><h2>${esc(d.titulo)}</h2><p>${esc(d.fuente)}</p><p style="font-size:12.5px;margin-top:6px">${esc(d.estado)}</p></div>
    ${sh('steps','Desglose del video',1)}${d.secciones.map((x,i)=>`<details class="dbg-sec"${i===0?' open':''}><summary><i>${esc(x.t)}–${esc(x.fin)}</i><span>${esc(x.titulo)}</span><span class="faint">+</span></summary>
      <ul>${x.puntos.map(t=>`<li>${esc(t)}</li>`).join('')}</ul>
      <div class="dbg-gif">${x.gif?`<img loading="lazy" src="${esc(x.gif)}" alt="">`:`GIF pendiente · minuto ${esc(x.t)}`}</div></details>`).join('')}
    ${d.cruces?.length?`${sh('book','Cruce con lo que ya está en la app')}<div class="tips">${d.cruces.map(t=>`<div>${esc(t)}</div>`).join('')}</div>`:''}
    ${d.dudas?.length?`${sh('info','Dudas del video')}<div class="tips">${d.dudas.map(t=>`<div>${esc(t)}</div>`).join('')}</div>`:''}${LEYENDA}`;
}
const EJEMPLOS = {
  ARC:'ARC X=0.0,Y=-2.2,XR=2.2,YR=2.2,SA=270,IA=370,VS=5,VA=25,LI=0,LO=10,DR=10,SR=10,ST=200',
  VIS:'VIS LD=0,LL=100.0,EXP=80,SM=1,ST=50,SH=5,RL=10,RT=1,RR=90,RB=99,AMN=10,AMX=25,BMN=60,BMX=80,PMN=3000,PMX=8000',
  PRE:'PRE IN=1,PRF=1,LD=60,LL=0,EXP=30.0,XA=18.2,YA=2.5,ZA=43.8'};
function toolView(){
  let last = ''; try{ last = localStorage.getItem('jd_ex_linea')||''; }catch(e){}
  return `${EX_CSS}<div class="head"><div class="k">Herramienta</div><h2>Explicar una línea</h2><p>Pega la línea del archivo de dispensado (ARC, VIS o PRE) tal como está en la máquina.</p></div>
    <textarea id="exIn" class="ex-in" placeholder="ARC X=…,IA=…,LO=…">${esc(last)}</textarea>
    <div class="ex-ej">Ejemplos: ${Object.keys(EJEMPLOS).map(k=>`<button data-ej="${k}">${k}</button>`).join('')}</div>
    <div id="exOut">${last?explicaHTML(last):''}</div>${LEYENDA}`;
}
function infoTab(){
  let notas = ''; try{ notas = localStorage.getItem('jd_misnotas')||''; }catch(e){}
  return `${cuentaHTML()}<div class="link" data-go="debug"><span>🛠 Debug · material en revisión (${DEBUG.length})</span><span class="faint">›</span></div>
    ${sh('info','Cómo se usa',1)}<div class="install">
    1. Busca el <b>código</b> que sale en la pantalla (ej. 219) o toca la falla.<br>
    2. Sigue los pasos en orden y contesta <b>SÍ / NO</b>.<br>
    3. ¿Algo no cuadra o falta? Toca <b>＋ Aportar</b> en la falla.<br>
    ${LEYENDA.replace('class="leyenda"','class="leyenda" style="margin:8px 0 0"')}</div>
    ${sh('doc','Mis notas (solo en este celular)')}<div class="install"><textarea id="misnotas" rows="5" placeholder="Contraseñas, extensiones, recordatorios… No se suben a ningún lado." style="width:100%;box-sizing:border-box;border:1px solid var(--line);border-radius:12px;padding:10px;font:inherit;background:var(--surface);color:inherit">${esc(notas)}</textarea></div>
    <h3 class="lb hide-app">Instalar en el iPhone</h3><div class="install hide-app">Safari → <b>Compartir</b> → <b>Agregar a pantalla de inicio</b>. En Android: menú ⋮ → Instalar app.</div>
    <div class="link" onclick="location.href='/docs/'"><span>📄 Documentos: manual, códigos de error, parámetros</span><span class="faint">›</span></div>
    <div class="link" onclick="location.href='../index.html'"><span>Inicio JD Fallas</span><span class="faint">›</span></div>`;
}
function searchView(q){
  if(PROCESS[q.toLowerCase()]) return processView(q.toLowerCase());
  const n = /^-?\d+$/.test(q) ? parseInt(q,10) : null;
  if(n!=null){
    if(n>=0 && PLC.has(n)) return codeView(n,'plc');
    if(KSV.has(n)) return codeView(n,'ksv');
    if(KSV.has(-n)) return codeView(-n,'ksv');
  }
  const ql = q.toLowerCase(), qu = q.toUpperCase().replace(/\s+/g,'_');
  const fs = FALLAS.filter(f=>JSON.stringify(f).toLowerCase().includes(ql));
  const hits = [];
  for(const c of PLC.values()) if(c.name.includes(qu) || translate(c.name).includes(ql) || (HINTS[c.code]||'').toLowerCase().includes(ql)) hits.push({...c,src:'plc'});
  for(const c of KSV.values()) if(c.name.includes(qu) || (c.comment||'').toLowerCase().includes(ql)) hits.push({...c,src:'ksv'});
  const docs = searchDocs([q], null);
  const ps = Object.keys(PROCS).filter(id=>JSON.stringify(PROCS[id]).toLowerCase().includes(ql));
  let h = '';
  if(ps.length) h += `<h3 class="lb">Guías del programa (${ps.length})</h3>${procList(ps)}`;
  if(fs.length) h += `<h3 class="lb">Fallas (${fs.length})</h3><div class="modes">${fs.map(f=>`<div class="mode" data-go="f/${f.id}"><div class="ic">${icon(f.id)}</div><b>${esc(f.titulo)}</b><span>${esc(f.corto)}</span></div>`).join('')}</div>`;
  h += `<h3 class="lb">Códigos (${hits.length})</h3><div class="list">${hits.slice(0,50).map(c=>`<div class="row" data-go="c/${c.code}|${c.src}"><b>${c.code}</b><span>${esc(c.name)}<small>${esc(translate(c.name))}</small></span><span class="faint" style="font-size:11px">${c.src==='plc'?'PLC':'KSV'}</span></div>`).join('') || '<div class="empty">Ningún código coincide.</div>'}</div>`;
  h += `<details class="more"><summary>En el manual y documentos (${docs.length})</summary><div class="in">${docsHTML(docs,[q])}</div></details>`;
  return h;
}

/* ---------- navegación ---------- */
let trk;
function route(){
  const raw = decodeURIComponent(location.hash.slice(1));
  let html, title = 'Fallas Kasalis', tab = 'fallas', sub = false;
  if(!raw){ html = homeView(); }
  else if(raw==='codigos'){ html = codesTab(); title='Códigos'; tab='codigos'; }
  else if(raw==='info'){ html = infoTab(); title='Más'; tab='info'; }
  else if(raw==='tools/linea'){ html = toolView(); title='Explicar línea'; sub = true; }
  else if(raw==='debug'){ html = debugList(); title='Debug'; tab='info'; sub = true; }
  else if(raw.startsWith('debug/')){ html = debugView(raw.slice(6)); title='Debug'; tab='info'; sub = true; }
  else if(raw.startsWith('f/')){ const f=FALLAS.find(x=>x.id===raw.slice(2)); html = fallaView(raw.slice(2)); title = f?f.titulo:title; sub = true; }
  else if(raw.startsWith('p/')){ const p = PROCS[raw.slice(2)]; html = procView(raw.slice(2)); title = p ? 'Guía' : title; sub = true; }
  else if(raw.startsWith('s/')){ const q=raw.slice(2); html = searchView(q); title = 'Buscar'; tab=''; sub = true; if(document.activeElement!==$('q')) $('q').value=q; }
  else {
    const [c, s] = (raw.startsWith('c/') ? raw.slice(2) : raw).split('|');
    const n = parseInt(c,10); sub = true; tab='codigos';
    if(s==='ksv' && KSV.has(n)) html = codeView(n,'ksv');
    else if(n>=0 && PLC.has(n)) html = codeView(n,'plc');
    else if(KSV.has(n)) html = codeView(n,'ksv');
    else html = searchView(c);
    title = isNaN(n) ? 'Buscar' : 'Código ' + c;
  }
  if(!raw.startsWith('s/') && document.activeElement!==$('q')) $('q').value='';
  $('out').innerHTML = html; $('ttl').textContent = title;
  $('out').querySelectorAll('.gflow').forEach(el=>{ const f = FALLAS.find(x=>x.id===el.dataset.fid); if(f) el.innerHTML = flowFijo(conImagenes(f), {accent:'#FF7F66', base:new URL('./', location.href).href, procHTML: st => st.proc && visible(st.proc) ? procInline(st.proc) : ''}); });
  let ap = null;
  const gf = $('out').querySelector('.gflow');
  if(gf){ const f = FALLAS.find(x=>x.id===gf.dataset.fid); ap = {el: gf, ref:'kasalis:'+f.id, app:'kasalis', fallaId:f.id, titulo: plain(f.titulo), pasos: f.flujo.map(x=>plain(x.p))}; }
  const gp = $('out').querySelector('.gflow-p');
  if(gp){ const p = PROCS[gp.dataset.pid]; ap = {el: gp, ref:'kasalis-p:'+gp.dataset.pid, app:'kasalis', fallaId:'p:'+gp.dataset.pid, titulo: plain(p.titulo), pasos: p.pasos.map(x=>plain(x.texto))}; }
  if(ap) mountAportes(ap.el, ap); else ocultarFab();
  if(raw==='info') montarCuenta($('out'));
  if(raw.startsWith('s/')){ clearTimeout(trk); const q = raw.slice(2), n = $('out').querySelectorAll('.row,.mode,.doc').length; trk = setTimeout(()=>track('busqueda', {q, n, ruta:'kasalis'}), 1500); }
  else track('vista', {ruta: 'kasalis/' + (raw || 'inicio'), titulo: title});
  $('back').style.display = sub ? '' : 'none';
  document.querySelectorAll('.tabs a').forEach(a=>a.classList.toggle('on', a.dataset.tab===tab));
  $('clr').style.display = $('q').value ? 'block' : 'none';
  if(!raw.startsWith('s/')) window.scrollTo(0,0);
}
let depth = 0;
function go(h){ depth++; location.hash = h; }
$('out').addEventListener('click', e=>{
  const t = e.target.closest('[data-go]'); if(t){ e.preventDefault(); go(t.dataset.go); } });
$('back').onclick = ()=>{ if(depth>0){ depth--; history.back(); } else location.hash=''; };
let tmr;
$('q').addEventListener('input', ()=>{ clearTimeout(tmr); const v=$('q').value.trim(); $('clr').style.display = v?'block':'none';
  tmr = setTimeout(()=>{ if(!v){ location.replace('#'); return; } const h='#s/'+encodeURIComponent(v); if(location.hash.startsWith('#s/')) location.replace(h); else go(h.slice(1)); }, 250); });
$('q').addEventListener('keydown', e=>{ if(e.key==='Enter'){ $('q').blur(); } });
$('clr').onclick = ()=>{ $('q').value=''; $('clr').style.display='none'; location.hash=''; };
document.querySelectorAll('.tabs a').forEach(a=>a.addEventListener('click',()=>{ $('q').value=''; depth=0; }));
$('out').addEventListener('input', e=>{ if(e.target.id==='misnotas'){ try{ localStorage.setItem('jd_misnotas', e.target.value); }catch(_){} }
  if(e.target.id==='exIn'){ const v = e.target.value; try{ localStorage.setItem('jd_ex_linea', v); }catch(_){} $('exOut').innerHTML = v.trim() ? explicaHTML(v) : ''; } });
$('out').addEventListener('click', e=>{ const b = e.target.closest('[data-ej]'); if(b){ const t = $('exIn'); t.value = EJEMPLOS[b.dataset.ej]; t.dispatchEvent(new Event('input', {bubbles:true})); } });
addEventListener('hashchange', route);
yo().then(r=>{ SES = {nivel: r.yo.nivel, procNiveles: r.procNiveles || {}}; }).catch(()=>{}).finally(route);

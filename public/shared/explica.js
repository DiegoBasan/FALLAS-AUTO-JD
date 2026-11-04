/* Explicador de líneas del archivo de dispensado (KsDispense): pegas "ARC X=..,IA=..", te dice qué hace cada valor,
   avisa combinaciones raras y sugiere qué mover según el síntoma.
   Definiciones = encabezado del archivo de parámetros de la máquina (sin marca).
   Sugerencias: {{…}} = Claude; [[l:…]] = Téc. L. (retro real). */
import {tx} from './txt.js';

export const OPS = {
  ARC:{n:'Dispensado en arco', p:{
    HD:'Cabezal (1 o 2)', ID:'Índice (arreglos de cámaras)', IN:'Pre-inspección de referencia (PRE IN=…)',
    X:'Inicio del arco en X (mm, relativo a la punta calibrada)', Y:'Inicio del arco en Y (mm)',
    XR:'Radio en X (mm)', YR:'Radio en Y (mm)', SA:'Ángulo donde empieza (°)',
    IA:'Grados que recorre el arco dispensando (360 = vuelta completa; más de 360 = se encima)',
    VS:'Velocidad del movimiento (% de la máxima)', VA:'Aceleración / desaceleración (% de la máxima)',
    LI:'Lead in: distancia (mm) desde el inicio donde se prende el dispensado',
    LO:'Lead out: grados antes del final donde se apaga el dispensado (el movimiento sigue sin DELO)',
    DV:'Volumen a dispensar (ml). Si es mayor a 0, se ignora LO',
    DR:'Velocidad de dispensado (% de la máxima)', SW:'Espera (ms) después de apagar, antes del suck back',
    SR:'Suck back: velocidad (%) con que jala el DELO de regreso', ST:'Suck back: tiempo (ms)',
    ZO:'Offset en Z sobre la Z enseñada (mm)', ZR:'Cuánto sube en Z al terminar (mm)'}},
  VIS:{n:'Inspección post-dispensado', p:{
    HD:'Cabezal', FX:'Fixture (1 o 2)', ID:'Índice', IN:'Pre-inspección de referencia',
    LW:'Espera de luz (ms)', LD:'Luz DOAL (0–100 %, 0 = apagada)', LL:'Line light (0–100 %)',
    LM:'Apagar luces de target durante la inspección (1 = sí)', EXP:'Exposición de la cámara (ms)',
    SVS:'Guardar imagen original (0 nunca, 1 siempre, 2 al fallar, 3 según ksini)', SVR:'Guardar imagen de resultado (igual que SVS)',
    XO:'Offset X sobre la posición de pre-inspección (mm)', YO:'Offset Y (mm)', Y0:'Offset Y (mm)', ZO:'Offset Z (mm)', Z0:'Offset Z (mm)',
    SM:'Qué busca: 0 = objetos oscuros, 1 = objetos claros, 2 = solo toma foto',
    ST:'Umbral de brillo (0–100 %; -1 = automático con SH): lo más brillante que esto cuenta como DELO',
    SH:'Umbral del histograma para el modo automático (default 10)',
    RL:'Área de búsqueda: izquierda (% del ancho, 0 = orilla)', RT:'Área de búsqueda: arriba (% del alto)',
    RR:'Área de búsqueda: derecha (% del ancho, 100 = orilla)', RB:'Área de búsqueda: abajo (% del alto)',
    AMN:'Área mínima del DELO (% de la imagen)', AMX:'Área máxima del DELO (%)',
    BMN:'Área mínima de la caja que lo encierra (%)', BMX:'Área máxima de la caja (%)',
    PMN:'Perímetro mínimo (px)', PMX:'Perímetro máximo (px)',
    XMN:'Centro X mínimo de la caja (mm, relativo a la punta)', XMX:'Centro X máximo (mm)', YMN:'Centro Y mínimo (mm)', YMX:'Centro Y máximo (mm)',
    CSA:'Análisis de ancho del cordón (1 = activo)', CSR:'Muestreo del contorno (1 de cada N puntos)', CAW:'Mediciones a promediar',
    CMN:'Ancho mínimo del cordón (px)', CMX:'Ancho máximo (px)', CSO:'% arriba de CMX que revisa para exceso',
    CTW:'Ventana para la tangente (puntos)', CUT:'Mediciones delgadas seguidas para fallar', COT:'Mediciones gruesas seguidas para fallar',
    SS:'(sin descripción en el archivo)', SR:'(sin descripción en el archivo)'}},
  PRE:{n:'Pre-inspección (ubicar el lens adapter)', p:{
    HD:'Cabezal', ID:'Índice', IN:'Número de esta pre-inspección (los demás la usan como referencia)',
    PRF:'Pattern que usa', LW:'Espera de luz (ms)', LD:'Luz DOAL (%)', LL:'Line light (%)', EXP:'Exposición (ms)',
    XA:'Posición X absoluta (mm)', YA:'Posición Y absoluta (mm)', ZA:'Posición Z absoluta (mm)'}},
};

export function parse(txt){
  const m = String(txt||'').trim().replace(/^#\s*/, '').match(/^([A-Z]{2,4})\s+(.*)$/i);
  if(!m) return null;
  const op = m[1].toUpperCase(), v = {};
  m[2].split(/[,\s]+/).forEach(kv=>{ const [k, x] = kv.split('='); if(k && x!==undefined) v[k.trim().toUpperCase()] = x.trim(); });
  return {op, v};
}

/* combinaciones raras: [nivel, texto] */
export function avisos({op, v}){
  const n = k => v[k]===undefined ? null : parseFloat(v[k]); const a = [];
  if(op==='ARC'){
    if(n('DV')>0 && n('LO')>0) a.push(['warn', `DV = ${v.DV} > 0, así que LO = ${v.LO} se ignora: dispensa hasta llegar al volumen.`]);
    if(n('IA')!==null && n('IA')<360) a.push(['info', `IA = ${v.IA}°: no completa la vuelta (${360-n('IA')}° sin recorrer).`]);
    if(n('IA')>360) a.push(['info', `IA = ${v.IA}°: se encima ${n('IA')-360}° sobre el inicio.`]);
    if(n('IA')!==null && n('LO')>0 && !(n('DV')>0)) a.push(['info', `Con LO = ${v.LO}° dispensa en realidad ~${n('IA')-n('LO')}°; los últimos ${v.LO}° solo se mueve.`]);
    if(n('XR')!==null && n('YR')!==null && n('XR')!==n('YR')) a.push(['info', `XR ≠ YR: el arco es ovalado.`]);
  }
  if(op==='VIS'){
    const rl=n('RL')??0, rr=n('RR')??100, rt=n('RT')??0, rb=n('RB')??100;
    if(rl>=rr || rt>=rb) a.push(['warn', 'El área de búsqueda está al revés (RL ≥ RR o RT ≥ RB).']);
    if(rr<100 || rl>0 || rt>0 || rb<100) a.push(['info', `Solo busca en ${rl}–${rr} % del ancho y ${rt}–${rb} % del alto. Si el anillo sale cortado en línea recta, abrir ese lado.`]);
    if(n('AMN')!==null && n('AMX')!==null && n('AMN')>=n('AMX')) a.push(['warn', 'AMN ≥ AMX: ninguna pieza puede pasar el área.']);
    if(n('PMN')!==null && n('PMX')!==null && n('PMN')>=n('PMX')) a.push(['warn', 'PMN ≥ PMX: ninguna pieza puede pasar el perímetro.']);
    if(n('BMN')!==null && n('BMX')!==null && n('BMN')>=n('BMX')) a.push(['warn', 'BMN ≥ BMX: ninguna pieza puede pasar la caja.']);
    if(n('LD')>0) a.push(['info', '[[l:LD encendida: el sensor y la fixtura también brillan y se pueden contar como DELO (se bajó de 30 a 0).]]']);
    if(n('ST')===-1) a.push(['info', `ST = -1: umbral automático con SH = ${v.SH ?? 10}.`]);
    if(n('SM')===2) a.push(['warn', 'SM = 2: solo toma la foto, no inspecciona.']);
  }
  return a;
}

/* síntoma → qué mover */
export const SINTOMAS = {
  ARC:[
    ['Hace bola al final', '{{Subir LO un poco (apaga antes) o subir ST / SR del suck back para cortar el hilo. Si hay DV, bajarlo.}}'],
    ['Hace bola al inicio', '{{Subir LI (prende un poco después) o bajar DR.}}'],
    ['Queda hueco al final / no cierra', '{{Bajar LO o subir IA de 5 en 5 para que se encime; si hay DV, subirlo.}}'],
    ['Cordón delgado o cortado', '{{Subir DR o bajar VS (más lento = más DELO por mm). Purgar si hay burbujas.}}'],
    ['Cordón muy grueso', '{{Bajar DR o subir VS.}}'],
    ['Descentrado', 'Mover X / Y del arco hacia donde falta DELO, poco a poco.'],
  ],
  VIS:[
    ['Anillo cortado en línea recta', 'Abrir el área de búsqueda de ese lado: RR (derecha) / RB (abajo) hacia 100, RL / RT hacia 0.'],
    ['Se ve el anillo pero muy oscuro, no pasa', '{{Subir EXP, luego LL; si no alcanza, bajar ST de 5 en 5.}} [[l:No subir LD.]]'],
    ['Detecta de más (sensor / fixtura)', '[[l:Bajar LD (se bajó de 30 a 0).]] {{Subir ST o cerrar el área de búsqueda.}}'],
    ['Pasa un anillo incompleto', '[[l:Cerrar PMN / PMX (ej. 1000–9000 → 2000–5000): la mala falla y la buena sigue pasando.]]'],
    ['Falla la buena por área / perímetro', '{{Comparar con una pieza buena en el Laboratorio VIS y abrir AMN–AMX / PMN–PMX solo lo necesario.}}'],
  ],
  PRE:[
    ['No encuentra el lens adapter (222)', '{{Revisar luz (LD / LL) y EXP contra la foto de referencia; si cambió el modelo, revisar PRF y la posición XA / YA / ZA.}}'],
  ],
};

export function explicaHTML(txt){
  const r = parse(txt);
  if(!r) return `<div class="ex-empty">Pega una línea que empiece con ARC, VIS o PRE.</div>`;
  const op = OPS[r.op]; if(!op) return `<div class="ex-empty">"${tx(r.op)}" todavía no está en el explicador (hay ARC, VIS y PRE).</div>`;
  const filas = Object.entries(r.v).map(([k,x])=>`<tr><td><b>${tx(k)}</b></td><td class="v">${tx(x)}</td><td>${tx(op.p[k]||'Parámetro desconocido')}</td></tr>`).join('');
  const av = avisos(r).map(([n,t])=>`<div class="ex-av ${n}">${n==='warn'?'⚠︎':'ℹ︎'} ${tx(t)}</div>`).join('');
  const skip = new Set(['HD','ID','FX','Y0','Z0','SS', ...(r.op==='VIS'?['SR']:[])]);
  const faltan = Object.keys(op.p).filter(k=>!(k in r.v) && !skip.has(k));
  return `<h4 class="ex-h">${tx(r.op)} · ${tx(op.n)}</h4>${av}<table class="ex-t">${filas}</table>
    ${faltan.length?`<details class="ex-more"><summary>Parámetros que no trae la línea (${faltan.length})</summary><table class="ex-t">${faltan.map(k=>`<tr><td><b>${k}</b></td><td class="v">—</td><td>${tx(op.p[k])}</td></tr>`).join('')}</table></details>`:''}
    <h4 class="ex-h">¿Qué pasa con la pieza?</h4>${(SINTOMAS[r.op]||[]).map(([s,t])=>`<details class="ex-s"><summary>${tx(s)}</summary><div>${tx(t)}</div></details>`).join('')}`;
}

export const EX_CSS = `<style>
.ex-in{width:100%;box-sizing:border-box;min-height:84px;border:1px solid var(--line);border-radius:14px;padding:10px 12px;font:13px ui-monospace,Menlo,monospace;background:var(--surface);color:inherit}
.ex-ej{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0 4px}
.ex-ej button{border:1px solid var(--line);background:var(--surface);color:inherit;border-radius:99px;padding:6px 12px;font:inherit;font-size:12.5px;font-weight:700;cursor:pointer}
.ex-h{margin:16px 4px 8px;font-size:12px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:var(--ink2)}
.ex-t{width:100%;border-collapse:collapse;background:var(--surface);border-radius:14px;overflow:hidden;font-size:13.5px}
.ex-t td{padding:8px 10px;border-top:1px solid var(--line);vertical-align:top}
.ex-t tr:first-child td{border-top:0}
.ex-t td:first-child{width:52px;white-space:nowrap}
.ex-t td.v{width:70px;font:700 13px ui-monospace,Menlo,monospace;white-space:nowrap}
.ex-av{margin:6px 0;padding:9px 12px;border-radius:12px;font-size:13.5px;background:rgba(59,130,246,.09)}
.ex-av.warn{background:rgba(229,72,77,.1)}
.ex-more,.ex-s{margin-top:6px;background:var(--surface);border:1px solid var(--line);border-radius:14px}
.ex-more summary,.ex-s summary{padding:11px 14px;font-weight:700;font-size:14px;cursor:pointer}
.ex-s div{padding:0 14px 12px;font-size:14px;line-height:1.5}
.ex-empty{color:var(--ink2);font-size:13.5px;padding:10px 4px}
</style>`;

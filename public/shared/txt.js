/* Texto con marcas de fuente (de quién viene cada dato). Lo usan todas las apps de fallas.
     {{texto}}     → complemento de Claude (morado): no confirmado en piso
     [[d:texto]]   → Diego (café)
     [[m:texto]]   → técnico M. (azul)
     [[l:texto]]   → técnico L. (azul cielo)
     [[j:texto]]   → entrenador Kasalis (azul índigo)
     [[e:texto]]   → otros del equipo, chats (azul acero)
   Sin marca = manual / documentación. */
export const esc = s => String(s??'').replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
export const FUENTES = {
  c:{n:'Claude (complemento, sin confirmar)', c:'#7C4DDB', d:'#B79BFF'},
  d:{n:'Diego', c:'#8A5A2E', d:'#D2A06E'},
  m:{n:'Téc. M.', c:'#1E5FA8', d:'#7FB2F0'},
  l:{n:'Téc. L.', c:'#0B8AB0', d:'#6FD0EE'},
  j:{n:'Entrenador Kasalis', c:'#3949AB', d:'#9FA8F5'},
  e:{n:'Equipo (chats)', c:'#4A6E8F', d:'#A9C2D8'},
};
const INI = {d:'D', m:'M', l:'L', j:'J', e:'E'};
export const tx = s => esc(s)
  .replace(/\[\[([dmlje]):([\s\S]+?)\]\]/g, (_, k, t) => `${t}<i class="sd sd-${k}" title="${FUENTES[k].n}">${INI[k]}</i>`)
  .replace(/\{\{([\s\S]+?)\}\}/g, '<span class="src src-c" title="Complemento de Claude: no confirmado en piso">$1</span>');
export const plain = s => String(s??'').replace(/\{\{|\}\}/g, '').replace(/\[\[[dmlje]:|\]\]/g, '');
export const LEYENDA = `<div class="leyenda"><span><span class="src src-c">morado</span> = Claude, sin confirmar</span>${Object.keys(INI).map(k=>`<span><i class="sd sd-${k}">${INI[k]}</i> ${FUENTES[k].n}</span>`).join('')}<span>sin marca = manual</span></div>`;
if(typeof document!=='undefined' && !document.getElementById('srcCSS')){
  const st = document.createElement('style'); st.id = 'srcCSS';
  st.textContent = Object.entries(FUENTES).map(([k,f])=>`.src-${k}{color:${f.c}}[data-theme=dark] .src-${k},.head .src-${k}{color:${f.d}}`).join('\n') + `
.src-c{background:rgba(124,77,219,.11);border-radius:5px;padding:0 3px;box-decoration-break:clone;-webkit-box-decoration-break:clone}
[data-theme=dark] .src-c,.head .src-c{background:rgba(183,155,255,.16)}
.leyenda{font-size:12px;color:var(--ink2,#777);margin:18px 4px 4px;line-height:1.9;display:flex;flex-wrap:wrap;gap:4px 10px;align-items:center}
.leyenda .src{font-weight:700}
.sd{display:inline-grid;place-items:center;width:15px;height:15px;border-radius:50%;font:800 9px/1 system-ui,sans-serif;font-style:normal;color:#fff;margin:0 1px 0 4px;vertical-align:1px;cursor:help}
` + Object.entries(FUENTES).filter(([k])=>k!=='c').map(([k,f])=>`.sd-${k}{background:${f.c}}[data-theme=dark] .sd-${k}{background:${f.d};color:#111}`).join('\n');
  document.head.appendChild(st);
}

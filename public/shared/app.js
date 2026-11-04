/* Comportamiento de app (iPhone "Agregar a inicio" / Android "Instalar"):
   - barra de pestañas flotante estilo iOS 26 (cápsula de vidrio casi de lado a lado) igual en todas las secciones
   - service worker único (/sw.js) para que abra rápido y funcione sin señal
   - marca <html class="standalone"> cuando corre como app instalada
   Uso: <script src="/shared/app.js" defer></script>. Una página sin menú pone <body data-nonav>. */
(function(){
  var standalone = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
  if(standalone) document.documentElement.classList.add('standalone');
  if(/iPhone|iPad|iPod/.test(navigator.userAgent)) document.documentElement.classList.add('ios');

  if('serviceWorker' in navigator){
    addEventListener('load', function(){ navigator.serviceWorker.register('/sw.js', {scope:'/'}).catch(function(){}); });
    // al regresar la señal: bajar lo que haya cambiado o falte
    addEventListener('online', function(){ navigator.serviceWorker.ready.then(function(r){ r.active && r.active.postMessage('refrescar'); }); });
  }

  var I = {
    inicio:'<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
    kasalis:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/>',
    linea:'<rect x="2.5" y="9" width="5" height="6" rx="1.2"/><rect x="9.5" y="9" width="5" height="6" rx="1.2"/><rect x="16.5" y="9" width="5" height="6" rx="1.2"/><path d="M2 19h20"/>',
    docs:'<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
    cuenta:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'
  };
  var ITEMS = [
    ['inicio','Inicio','/','var(--ink)'],
    ['kasalis','Kasalis','/buscador-kasalis/','#FF7F66'],
    ['linea','Línea','/fallas-linea/','#2F6BFF'],
    ['docs','Docs','/docs/','#636366'],
    ['cuenta','Cuenta','/cuenta/','var(--accent)']
  ];
  function activo(){
    var p = location.pathname;
    if(p.indexOf('/buscador-kasalis')===0) return 'kasalis';
    if(p.indexOf('/fallas-linea')===0) return 'linea';
    if(p.indexOf('/docs')===0) return 'docs';
    if(p.indexOf('/cuenta')===0 || p.indexOf('/admin')===0) return 'cuenta';
    return 'inicio';
  }
  function montar(){
    if(document.body.hasAttribute('data-nonav') || document.querySelector('.gnav')) return;
    var on = activo(), nav = document.createElement('nav');
    nav.className = 'gnav'; nav.setAttribute('aria-label','Secciones');
    nav.innerHTML = ITEMS.map(function(it){
      return '<a href="'+it[2]+'" data-k="'+it[0]+'" style="--c:'+it[3]+'"'+(it[0]===on?' class="on" aria-current="page"':'')+'>'+
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">'+I[it[0]]+'</svg><span>'+it[1]+'</span></a>';
    }).join('');
    // tocar la sección en la que ya estás = regresar a su inicio (como en las apps)
    nav.addEventListener('click', function(e){
      var a = e.target.closest('a'); if(!a) return;
      if(a.classList.contains('on')){ e.preventDefault(); if(location.hash){ location.hash=''; } window.scrollTo({top:0, behavior:'smooth'}); }
    });
    document.body.appendChild(nav);
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montar); else montar();
})();

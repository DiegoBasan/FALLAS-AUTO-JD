/* Tema claro / oscuro compartido por todas las apps.
   Uso: <script src="../shared/theme.js"></script> en <head> (aplica el tema antes de pintar)
   y cualquier botón con [data-theme-toggle] alterna el tema. Emite el evento window 'jdtheme'. */
(function(){
  var KEY='jd_theme';
  function sys(){ try{ return matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'; }catch(e){ return 'light'; } }
  function get(){ try{ return localStorage.getItem(KEY) || sys(); }catch(e){ return sys(); } }
  function set(t){ document.documentElement.dataset.theme=t; try{ localStorage.setItem(KEY,t); }catch(e){} paint(); window.dispatchEvent(new CustomEvent('jdtheme',{detail:t})); }
  function toggle(){ set(get()==='dark'?'light':'dark'); }
  function paint(){ var d=get()==='dark'; document.querySelectorAll('[data-theme-toggle]').forEach(function(b){ b.innerHTML = d
      ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>'
      : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
    b.title = d ? 'Modo claro' : 'Modo oscuro'; }); }
  document.documentElement.dataset.theme=get();
  document.addEventListener('click',function(e){ var b=e.target.closest&&e.target.closest('[data-theme-toggle]'); if(b){ e.preventDefault(); toggle(); } });
  document.addEventListener('DOMContentLoaded',paint);
  window.JDTheme={get:get,set:set,toggle:toggle};
})();

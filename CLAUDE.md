# JD Fallas — contexto del proyecto

App (PWA, español) para que operadores, técnicos e ingenieros de las líneas de cámaras John Deere
resuelvan fallas: **Kasalis Pixid 500** (alineación activa) y estaciones de línea (**Gecko, Moose, Scorpion**, hornos).
Dueño / admin: Diego (ingeniero). Copia independiente de las apps `buscador-kasalis/` y `fallas-linea/` del repo
experimental `DiegoBasan/JD-AUTOMATION` (GitHub Pages). Este repo es privado y se publica en **Netlify**.

## Reglas de trabajo
- Push directo a `main` (Netlify despliega desde ahí). Mensajes de commit claros; sin identificadores de modelo.
- UI en español, "operator friendly": directo, sin show, pasos completos visibles, iconos y separadores, funciona en celular con guantes y en compu.
- Nunca inventar datos técnicos como si fueran de piso: lo que complementa Claude va marcado `{{…}}` (se ve en morado).
- Validar con Playwright (Chromium en /opt/pw-browsers) a 390 px y 1280 px antes de subir; subir versión de `CACHE` del `sw.js` de la app que cambie.

## Estructura
- `public/` — lo que se publica.
  - `index.html` inicio (a futuro: login).
  - `buscador-kasalis/` Fallas Kasalis: `app.js`, `data/fallas.js` (modos de falla con `flujo`, `causas`, `tips`), `data/procedimientos.js` (guías del programa), `data/imagenes.js` (fotos por paso, separadas de los textos), `data/debug.js` (material en revisión, p. ej. desglose de videos de entrenamiento), `data/docs.js` (texto del manual para búsqueda), `fotos/`.
  - `fallas-linea/` Fallas de línea: `data/lineas.js` (`MAQ` colores, `FALLAS`, `PROCESOS`).
  - `shared/` — `txt.js` (marcas de fuente), `flow.js` (flujo fijo `flowFijo`), `procs.js` (guías inline), `explica.js` (explicador de líneas ARC/VIS/PRE del KsDispense), `kasalis.js` + `kasalis-codes.js` (códigos PLC/KSvision y HINTS), `theme.js`, `ui.css`.
  - PDFs/txt del manual y parámetros (referencias de `docs.js`).
- `privado/` — **no se publica** (fuera de `public/`). Guía de diseño de fixtura Pixid 300 (Kasalis Proprietary & Confidential) y sus imágenes. Servir solo detrás del login.
- `netlify.toml` — publish `public`, funciones en `netlify/functions`.

## Marcas de fuente en los textos (shared/txt.js)
`{{…}}` Claude (morado, sin confirmar) · `[[d:…]]` Diego · `[[m:…]]` Téc. M. (Manuel) · `[[l:…]]` Téc. L. (Luis) ·
`[[j:…]]` entrenador Kasalis (Jacob) · `[[e:…]]` equipo (chats) · sin marca = manual/documentación.
Se muestran como un puntito con la inicial al final del dato; leyenda al pie de cada pantalla.

## Colores por máquina
Kasalis `#FF7F66` · Gecko `#8B5CF6` · Moose `#F08C00` · Scorpion `#2F6BFF` · Hornos `#8A8A90` · General `#5E6B78`.

## Cuentas, aportaciones y admin (YA FUNCIONA)
- `netlify/edge-functions/puerta.ts`: todo el sitio pide sesión (cookie firmada `jdf_s`), salvo `/login/` y `/api/*`. `/admin/` solo nivel admin.
- `netlify/functions/api.mts` (todo bajo `/api/*`): login / crear contraseña la primera vez / logout / cambiar contraseña, aportaciones (crear, listar por `ref`, mías, de un usuario; admin: aprobar, rechazar, borrar), fotos, actividad (vistas y búsquedas por usuario y por día), stats, usuarios, accesos por nivel, tema ntfy.
- `netlify/lib/auth.mts` (HMAC + PBKDF2, Web Crypto) y `netlify/lib/secreto.mts` (llave de sesión y tema ntfy generados por el servidor y guardados en Blobs `config`; nunca en el código).
- Blobs: `usuarios`, `aportaciones` (clave `<ref>/<id>`, ref = `kasalis:<falla>`, `kasalis-p:<guía>`, `linea:<falla>`, `linea-p:<proceso>`), `fotos`, `actividad` (`<YYYY-MM-DD>/<num>`), `config`.
- Admin inicial: número 4019461 (Diego), ya activado. Niveles: operador, tecnico, ingeniero, admin. Cada usuario nuevo crea su contraseña la primera vez.
- Cliente: `public/shared/cuenta.js` (sesión, `track`, botón flotante ＋ Aportar, tarjetas de aportación, "Mis aportaciones"). Panel: `public/admin/index.html` (Aportaciones · Actividad · Usuarios · Accesos por nivel · Notificaciones).
- Notificaciones: push con ntfy (tema en el panel → Notificaciones) y correo con Netlify Forms (formulario oculto `aportacion` en `public/index.html`; activar en Netlify → Notifications).
- Plan gratis de Netlify: inyecta el aviso "Powered by Netlify" abajo a la derecha (no se puede ocultar en ese plan). La barra de pestañas deja una franja libre para él.
- Deploy: hoy se publica con el comando del MCP de Netlify (`deploy-site`) con `NODE_USE_ENV_PROXY=1`. Cuando el repo esté en GitHub, conectarlo en Netlify para publicar al hacer push.

## Ideas siguientes
- Integrar aportaciones confirmadas al contenido base (pasar a `fallas.js` con la marca del autor).
- Borrar usuarios, exportar actividad a CSV, búsqueda en el panel.

## Pendientes de contenido
- Videos de entrenamiento (Jacob): Diego los sube a Google Drive; hacer GIFs por sección del desglose en `data/debug.js`.
- Validar si el manual que mande Diego es el mismo Rev 022.
- Fotos que faltan: Parameters/LensPlaceZ, config Moose con `#`, switch MIU + icono warmstart, Index station + Open camera, alineación manual/ZPlace, parámetros prefocus, modo Engineer, mantenimiento de dispensado, UVCureTime, place X/Y/Z, teach Z, purga, ARC, enfoque VIS.
- Notas de Manuel de más fallas (242, 606 más allá de comunicación).
- Dudas abiertas: ZPlace (¿cuánto más arriba?), orden MIU vs módulo de pogos, nombres exactos MTFExpected*, frecuencia del mantenimiento de dispensado, ajuste de VIS de la junta de entrenamiento.

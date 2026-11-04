/* =====================================================================
   GUÍAS DEL PROGRAMA KASALIS (paso a paso con fotos de pantalla)
   ---------------------------------------------------------------------
   Se abren desde el flujo de resolución ("Cómo hacerlo en el programa").
   {
     titulo, estacion, cuando,           // cuándo se usa
     permisos: 'Operador' | 'Ingeniería', // quién puede hacerlo
     codigos: ['108','131'],
     sabemos: ['regla o valor ya conocido', …],   // de experiencia en piso (sin pantallas)
     pasos: [                                       // vacío = faltan fotos
       { foto: 'fotos/ajustar-place/01.jpg',        // relativa a buscador-kasalis/
         texto: 'Pica en Setup',                     // qué hacer en esta pantalla
         marcas: [{x:42, y:18, t:'Setup'}],          // dónde picar: % del ancho/alto de la foto
         valor: 'valor a escribir',                  // opcional: valor a escribir / revisar
         ojo: 'No cierres sin guardar' },            // opcional: advertencia
     ],
     necesito: ['captura que falta', …],            // lo que hay que fotografiar para completar la guía
   }
   Sin contraseñas, usuarios ni rutas de red en las fotos (repo público).
   ===================================================================== */
export const PROCS = {
  'ajustar-place': {
    titulo:'Ajustar place X, Y, Z del plato', estacion:'Alineación', permisos:'Ingeniería', codigos:['108','131','137','195'],
    cuando:'[[e:Fallas de alineación seguidas en un plato]] {{y la golden también falla en ese plato}}.',
    sabemos:['[[e:Con 5 fallas de alineación seguidas ya se ajusta.]]','[[e:Se ajustan las 3 posiciones del plato; si no basta, también theta X / Y.]]','[[e:Se ajusta por plato (ELK plato 4 ha sido el más frecuente).]]','[[e:Mientras se ajusta, se puede correr con el otro plato.]]','[[e:Cada cambio en la Kasalis genera serial number break.]]'],
    pasos:[], necesito:['Pantalla principal con el botón para entrar a setup / teach','Selección de estación (Alineación) y de plato / fixtura','Pantalla de posiciones place X, Y, Z (y theta)','Cómo se mueve el eje (jog) y cómo se guarda','Cómo se prueba el cambio y se regresa a producción'],
  },
  'teach-z': {
    titulo:'Teach Z / punto de inicio del scan', estacion:'Alineación', permisos:'Ingeniería', codigos:['108','131'],
    cuando:'[[d:El scan arranca abajo del foco real o la Z de alineación varía entre piezas.]]',
    sabemos:['[[d:La Z de inicio depende del modelo de lente.]]','[[d:Cambiar interposer no lo corrige.]]'],
    pasos:[], necesito:['Dónde está el parámetro de Z de inicio / teach','Cómo se enseña la Z con una pieza buena','Cómo se guarda y se valida'],
  },
  'aeo-roi': {
    titulo:'Align Extra Offset (AEO) y ROI', estacion:'Alineación', permisos:'Ingeniería (con autorización)', codigos:['131','161'],
    cuando:'[[l:Ajuste fino de SFR]] {{cuando la máquina y el lente están bien}}.',
    sabemos:['[[l:El valor de AEO depende del modelo: probar primero con pocas piezas.]]','[[l:El cambio de ROI lo hace ingeniería por SFR.]]','[[e:Requiere autorización.]]'],
    pasos:[], necesito:['Dónde está el AEO','Dónde se editan las ROI','Cómo se guarda'],
  },
  'uv-cure-time': {
    titulo:'Revisar UVCureTime', estacion:'Alineación (UV)', permisos:'Ingeniería', codigos:['155','143','149'],
    cuando:'[[d:El lente se mueve al soltarlo o el DELO no cura.]]',
    sabemos:['[[d:El valor está en milisegundos: 15000–19500.]]','[[d:Estuvo en 1950 (≈2 s) y causaba 155.]]'],
    pasos:[], necesito:['Dónde está UVCureTime en el programa','Cómo se edita y guarda'],
  },
  'activar-dispense': {
    titulo:'Activar la opción "dispense"', estacion:'Dispensado', permisos:'Ingeniería', codigos:['230','233'],
    cuando:'[[e:La máquina hace el ciclo pero no sale DELO.]]',
    sabemos:['[[e:Pasó que la opción de dispensar estaba desactivada.]]'],
    pasos:[], necesito:['Dónde está la opción dispense','Cómo se activa y se guarda'],
  },
  'purga': {
    titulo:'Purga / prime del dispensador', estacion:'Dispensado', permisos:'Operador', codigos:['233','230'],
    cuando:'[[d:Burbujas, trazo bajo, después de cambiar cartucho de DELO]] {{o motor}}.',
    sabemos:['PurgeTimeDispenseHead1 = 10000 ms al 50 %.','Prime: 5 ciclos de 10000 ms al 50 %, suck back 50 ms.','[[e:Después: pesar 3 dispensados y foto.]]'],
    pasos:[], necesito:['Botón de purga / prime','A dónde va el cabezal (copa de purga)','Cómo se confirma'],
  },
  'altura-aguja': {
    titulo:'Ajustar altura de la aguja (Z de dispensado)', estacion:'Dispensado', permisos:'Ingeniería', codigos:['233'],
    cuando:'[[m:La aguja raspa el lens adapter]] [[e:o el trazo sale mal al inicio.]]',
    sabemos:['[[m:Baja = raspa el lens adapter]]; [[e:alta = trazo malo o DELO mal puesto al inicio.]]','En la línea ARC: ZO = offset de Z y ZR = retracción al final.'],
    pasos:[], necesito:['Dónde se enseña la Z de dispensado / tip find','Cómo se cambia ZO','Cómo se valida con una pieza'],
  },
  'offset-dispensado': {
    titulo:'Centrar offset X / Y del dispensado', estacion:'Dispensado', permisos:'Ingeniería', codigos:['233'],
    cuando:'[[d:El círculo sale desfasado respecto al lens adapter.]]',
    sabemos:['[[d:Los valores de X / Y dependen del modelo: mover poco a poco y validar.]]'],
    pasos:[], necesito:['Dónde se cambian X / Y del arco o el offset','Cómo se prueba'],
  },
  'enfoque-vis': {
    titulo:'Enfocar y ajustar brillo de la cámara de inspección (VIS)', estacion:'Dispensado', permisos:'Ingeniería', codigos:['233'],
    cuando:'[[d:El dispensado está bien (centrado y completo) pero la VIS sigue dando 233.]]',
    sabemos:['[[d:Comparar contra la foto de referencia de logs pasados: pieza buena del mismo modelo.]]','[[d:Al cambiar Moose ↔ ELK el lens queda más bajo: hay que re-enfocar.]]','[[l:Las line lights (barras LED) deben apuntar al lens adapter (se ajustan con tornillos).]]','[[l:Validar con una pieza incompleta: debe fallar.]]','[[l:LD (DOAL)]] {{rebota en lo plano:}} [[l:con LD alto el sensor se ve blanco]] {{y se detecta como material}}[[l:. Se bajó de 30 a 0.]]','[[d:Probar umbral y rangos con fotos reales en el Laboratorio VIS (Kasalis 3D) antes de tocar la máquina.]]'],
    pasos:[], necesito:['Dónde se guardan / abren las imágenes de la VIS en los logs','Foto de referencia buena por modelo (Moose, Scorpion, Gecko)','Cómo ver la imagen en vivo para enfocar','Dónde se ajusta el brillo / exposición (si es por programa)'],
  },
  'editar-arc': {
    titulo:'Editar la línea ARC (DR, LI, LO, cambio de modelo)', estacion:'Dispensado', permisos:'Ingeniería', codigos:['233','235'],
    cuando:'[[d:"Bola" al inicio o final del arco]], [[e:poco o mucho DELO, o cambio de modelo (95 ↔ 133).]]',
    sabemos:['[[e:Comentar la línea anterior con #, no borrarla.]]','[[e:Al cambiar a 133 se cambia una línea comentada; al regresar al 95 se regresa.]]','[[e:Guardar con "save and close" y revisar que sea la carpeta correcta.]]','[[e:Después: pesar 3 dispensados y foto.]]'],
    pasos:[], necesito:['Dónde está el archivo de dispensado / cómo se abre','Cómo se guarda y se recarga en el programa'],
  },
  'inicializar': {
    titulo:'Inicializar la estación / equipo', estacion:'General', permisos:'Operador', codigos:['102','231','104'],
    cuando:'[[e:Comunicación intermitente]], [[m:gripper ladeado]]{{, estación que no llega a home}}.',
    sabemos:['[[e:Reiniciar MIU / inicializar el equipo ayudó en comunicación de dispensado.]]','[[d:Después de reiniciar la MIU: abrir warmstart y luego Kasalis antes de inicializar.]]'],
    pasos:[], necesito:['Botón de inicializar (equipo y por estación)','Qué esperar en pantalla mientras inicializa'],
  },
  'login-popup': {
    titulo:'Popup al iniciar el programa (certificación)', estacion:'Software', permisos:'Ingeniería', codigos:[],
    cuando:'[[e:Después de un apagado sale un popup y no deja entrar.]]',
    sabemos:['[[e:Se inicia sesión con credenciales de ingeniería.]]','[[d:Ctrl+Shift+Esc abre el Administrador de tareas.]]','[[d:La ELK no tiene VNC.]]'],
    pasos:[], necesito:['El popup','Dónde se inicia sesión (tapar usuario y contraseña en la foto)'],
  },
  'cargar-programa': {
    titulo:'Revisar / cargar el programa del modelo', estacion:'Software', permisos:'Ingeniería', codigos:['10','12'],
    cuando:'[[e:Cambio de modelo]] o [[m:el programa se cambió solo (piezas sin step de horno).]]',
    sabemos:['[[e:Moose / ELK / Scorpion usan plato, dispensador, ejecutable y archivo TARS build/retest propios.]]','[[m:Si se cambió solo: re-ingresar las piezas desde la carpeta de respaldo de seriales.]]','[[l:Hacer respaldo antes de cargar un programa nuevo.]]'],
    pasos:[], necesito:['Dónde se ve el programa cargado','Cómo se cambia de modelo','Dónde está el respaldo'],
  },
  'segregar-lente': {
    titulo:'Programa de segregación de lente (Scorpion 95)', estacion:'Alineación', permisos:'Ingeniería', codigos:['131','108'],
    cuando:'[[d:Scorpion 95: muchas fallas de lente seguidas y la golden pasa.]]',
    sabemos:['[[d:Solo existe para Scorpion 95.]]','[[m:Escanea el ID del lente y prueba si alinea.]]','[[m:Un lente segregado como malo da 131.]]','[[d:Al terminar, revisar que no queden logs de segregación en D:\\TARS\\Valid (si quedan, las piezas no progresan en MES).]]','[[e:Durante la segregación no se mandan datos a MES (solo se escanea el lente).]]','[[m:Para regresar a producción: quitar el "1" de la ruta "valid1" para que apunte a "valid", cambiar al programa de BUILD, pasar una pieza y validar el historial en MES.]]'],
    pasos:[], necesito:['Cómo se entra al modo de segregación','Qué se escanea y qué resultado muestra','Cómo se regresa a producción'],
  },
  'logs-segregacion': {
    titulo:'Borrar logs de segregación atorados', estacion:'Software / MES', permisos:'Ingeniería', codigos:[],
    cuando:'[[d:Las piezas pasan la Kasalis pero no progresan en MES (sin step BUILD), sobre todo después de usar el programa de segregación del 95.]]',
    sabemos:['[[d:Si quedan logs de segregación en la carpeta, el preparser no puede mover los logs buenos.]]','[[d:Al borrarlos, las demás piezas progresan solas.]]','[[d:Borrar solo los logs de segregación, no los de producción.]]'],
    pasos:[
      {foto:'fotos/progresion/01-ruta-valid.png', texto:'[[d:Abrir el Explorador y entrar a This PC › Data (D:) › TARS › Valid]]', marcas:[{x:38,y:5,t:'D:\\TARS\\Valid'}], valor:'D:\\TARS\\Valid', ojo:'[[d:Así se ve ya limpia (vacía). Si hay logs de segregación, borrar solo esos.]]'},
    ],
    necesito:['Cómo se ve la carpeta con logs de segregación atorados (para distinguirlos)','Confirmación en MES de que ya progresaron'],
  },
  'cambio-delo': {
    titulo:'Cambio de DELO en la Kasalis', estacion:'Dispensado', permisos:'Operador / técnico', codigos:['235','236'],
    cuando:'[[d:DELO acabado]] (235), pot life vencido (236) o cambio de material.',
    sabemos:['[[e:Ambientar 1.5 h antes de usarlo (el de MRO llega congelado).]]','[[e:Si cambia de cuarto: 30 min de refri y luego ambientar.]]','[[e:Registrar cada DELO en la base de datos.]]'],
    pasos:[
      {texto:'[[d:Cerrar el aire y validar 0 PSI.]]'},
      {texto:'[[d:Cambiar el cartucho y asegurar las conexiones.]]'},
      {texto:'[[d:Apretar el opresor.]]', ojo:'[[d:Saltarse el aire o el opresor ya tiró DELO dos veces.]]'},
      {texto:'[[d:Encender el aire gradual y revisar fugas.]]'},
      {texto:'[[e:Purgar, pesar 3 dispensados y tomar foto.]]'},
    ],
    necesito:['Fotos del dispensador (opresor, válvula de aire) y de la pantalla de purga'],
  },
  'reiniciar-miu': {
    titulo:'Reiniciar MIU + warmstart', estacion:'General', permisos:'Técnico', codigos:['102','231','604'],
    cuando:'[[d:Falla de comunicación que no se quita con pieza, interposer, plato ni pogos.]] [[m:Hacerlo antes de desconectar pogos.]]',
    sabemos:['[[d:Cada estación tiene su propia MIU (módulo de comunicación) con un switch al lado.]]','[[l:Los microcortos en los pogos tiran las MIU; el warmstart reinicia la Kasalis y las MIU vuelven a jalar.]]'],
    pasos:[
      {texto:'[[d:Cerrar el programa de Kasalis.]]'},
      {texto:'[[d:Apagar la MIU de la estación con su switch y volverla a prender.]]'},
      {texto:'[[d:Abrir el programa warmstart (está en el escritorio).]]'},
      {texto:'[[d:Abrir el programa de Kasalis, inicializar y correr.]]'},
    ],
    necesito:['Foto del switch de la MIU','Foto del icono de warmstart en el escritorio'],
  },
  'probar-comunicacion': {
    titulo:'Probar comunicación por estación', estacion:'General', permisos:'Técnico', codigos:['102','231','604'],
    cuando:'[[m:Para saber si falla una sola estación o el interposer.]]',
    sabemos:['[[m:Falla en todas las estaciones → interposer. Falla en una → esa estación.]]'],
    pasos:[
      {texto:'[[m:Cargar una pieza que ya pasó como buena]] [[d:en el interposer.]]'},
      {texto:'[[d:Botón Index station para mandarla manualmente a la siguiente estación.]]'},
      {texto:'[[d:En la pestaña de esa estación (Align, o la que se quiera probar), botón Open camera.]]'},
      {texto:'[[d:Debe mostrar la imagen del lado derecho.]] [[m:Repetir en cada estación.]]'},
    ],
    necesito:['Foto del botón Index station','Foto del botón Open camera con imagen'],
  },
  'lens-place-z': {
    titulo:'Bajar LensPlaceZ (196 / -910)', estacion:'Alineación', permisos:'Técnico / ingeniería', codigos:['196','-910'],
    cuando:'[[d:"Adjusted lens place z position exceeds max limit from nominal."]]',
    sabemos:['[[d:Bajar 0.02 cada iteración hasta que deje alinear manual.]]','[[d:Ejemplo Moose: 23.5770 → 23.5570.]]'],
    pasos:[
      {texto:'[[d:Botón Parameters.]]'},
      {texto:'[[d:Buscar LensPlaceZ y bajarlo 0.02.]]', valor:'[[d:−0.02 por intento]]'},
      {texto:'[[d:Intentar alinear manual la pieza; si no deja, bajar otros 0.02.]]'},
    ],
    necesito:['Foto de Parameters con LensPlaceZ'],
  },
  'zplace-manual': {
    titulo:'Alinear manual y ajustar ZPlace', estacion:'Alineación', permisos:'Ingeniería', codigos:['108','131'],
    cuando:'[[j:Fallas de alineación (visto en la junta de entrenamiento Kasalis).]]',
    sabemos:['[[j:Con el mejor enfoque en manual, tomar el valor de Z.]]','[[j:Ponerlo en Parámetros › ZPlace un poco más arriba.]]','{{Cuánto más arriba: pendiente de confirmar.}}'],
    pasos:[], necesito:['Pantalla de alineación manual','Parámetro ZPlace','Cuánto se sube'],
  },
  'prefocus': {
    titulo:'Parámetros de prefocus', estacion:'Alineación', permisos:'Ingeniería', codigos:['105'],
    cuando:'[[j:La falla está en el prefocus (pasos grandes al inicio de la alineación).]]',
    sabemos:['[[j:Valores de prefocus: MTFExpectedPeak, MTFExpectedFWHM, MTFExpectedThreshold, GradientThreshold, GradientStep.]]','[[j:Ajustar primero GradientThreshold y luego GradientStep.]]','[[j:GradientStep = distancia en pixeles. GradientThreshold = solo cuentan los cambios mayores a este valor (quita ruido).]]'],
    pasos:[], necesito:['Pantalla donde están estos parámetros','Guía de ajuste del entrenador (documento Brenner)'],
  },
  'modo-engineer': {
    titulo:'Entrar en modo Engineer', estacion:'Software', permisos:'Operador / técnico / ingeniería', codigos:[],
    cuando:'[[d:Se usa siempre: habilita el menú de movimientos y funciones que también ocupan los operadores.]]',
    sabemos:['[[d:Lo usan operador, técnico e ingeniería.]]','La contraseña no se publica aquí: guárdala en "Mis notas" (solo en tu celular).'],
    pasos:[], necesito:['Foto de dónde se entra a modo Engineer'],
  },
  'cambio-build-retest': {
    titulo:'Cambiar entre BUILD y RETEST', estacion:'Software', permisos:'Técnico / ingeniería', codigos:[],
    cuando:'[[d:Cada que se cambia de RETEST a BUILD (o al revés), o para darle step de RETEST a una pieza.]]',
    sabemos:['[[d:Los programas BUILD y RETEST se cambian manual.]]','[[d:En el config de Moose: cambiar las líneas con # (comentar las que no son).]]','[[d:Para dar step de RETEST: cambiar al programa de RETEST y volver a pasar la pieza por la Kasalis.]]'],
    pasos:[], necesito:['Foto del config de Moose con las líneas comentadas','Foto de dónde se cambia el programa'],
  },
  'mantenimiento-dispensado': {
    titulo:'Mantenimiento de la estación de dispensado', estacion:'Dispensado', permisos:'Técnico', codigos:[],
    cuando:'{{Mantenimiento preventivo de la estación de dispensado (frecuencia: pendiente).}}',
    sabemos:[],
    pasos:[
      {texto:'[[d:Quitar el DELO si tiene uno puesto y desconectar el cable del dispensador.]]'},
      {texto:'[[d:Desmontar el dispensador de la fixtura.]]'},
      {texto:'[[d:Revisar el codo que conecta al DELO: que no esté dañado, sin fugas ni roscas dañadas. Cambiarlo si hace falta.]]'},
      {texto:'[[d:Revisar el conector neumático rojo del DELO: sin daño ni fugas. Reemplazarlo si hace falta.]]'},
      {texto:'[[d:Mangueras: que no se ahorquen, no estén raspadas ni dañadas. Que las válvulas corten bien el aire.]]'},
      {texto:'[[d:Que el regulador suba y baje bien la presión al variarlo.]]'},
      {texto:'[[d:Ruteo de cables: todos pasan por la oruga protectora. Que al entrar o salir no se doblen bruscamente; volver a rutear los doblados.]]'},
      {texto:'[[d:Limpiar toda la estación de dispensado: placas, piezas, fixturas y estructura.]]'},
      {texto:'[[d:Limpiar la grasa vieja de los 3 ejes del tornillo sin fin del gantry y poner grasa nueva en el grasero.]]'},
      {texto:'[[d:Mover manualmente con el programa cada eje, de forma uniforme, para lubricar todo el eje.]]'},
      {texto:'[[d:Limpiar el lente de la cámara de inspección y el espejo que checa las partículas.]]'},
      {texto:'[[d:Validar que el enfoque y la apertura del lente estén en las marcas; si no, ajustarlos manual.]]'},
      {texto:'[[d:Desarmar el dispensador, separando en un lugar seguro todas las piezas y tornillos. Limpiar cada pieza con toallas blancas y alcohol.]]'},
      {texto:'[[d:Con el motor fuera, conectarle el cable y activarlo desde las IOs del programa: debe girar a velocidad constante, sin pausas ni trabas.]]'},
      {texto:'[[d:Volver a armar el dispensador limpio: ningún tornillo barrido, el rotor gira correcto, y cambiar la punta por una nueva.]]'},
    ],
    necesito:['Fotos de cada paso (codo, conector rojo, oruga, grasero, marcas de enfoque/apertura, IOs del motor)','Cada cuánto se hace'],
  },
  'candado': {
    titulo:'Candado 3-5-10 (bloqueo por fallas)', estacion:'Alineación', permisos:'Ingeniería', codigos:[],
    cuando:'[[e:La máquina se bloquea por fallas de alineación seguidas.]]',
    sabemos:['[[e:Desbloquear requiere cuenta con permisos.]]','[[m:Si se traba, cerrar sesión lo soluciona.]]'],
    pasos:[], necesito:['La pantalla del bloqueo','Cómo se desbloquea / cierra sesión'],
  },
};

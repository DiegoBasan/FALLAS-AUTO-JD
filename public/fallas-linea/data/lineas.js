/* =====================================================================
   FALLAS Y PROCESOS DE LÍNEA (todo lo que no es Kasalis)
   ---------------------------------------------------------------------
   MAQ: color por línea / máquina (franja de arriba en cada tarjeta).
   FALLAS: {id, linea, lineas?, maquina, titulo, corto, flujo:[{p,d,si,no,proc}], causas:[[causa,solución]], tips:[]}
   PROCESOS: {id: {titulo, linea, lineas?, maquina, permisos, cuando,
                   pasos:[{texto, valor?, ojo?, foto?, marcas?:[{x,y,t}]}],   // foto relativa a fallas-linea/
                   sabemos:[], necesito:[]}}
   Valores que cambian de modelo a modelo se toman de la hoja / receta, no se dejan fijos aquí.
   ===================================================================== */
export const MAQ = {
  kasalis:  {n:'Kasalis',  c:'#FF7F66', d:'Active alignment (app aparte)', href:'../buscador-kasalis/'},
  gecko:    {n:'Gecko',    c:'#8B5CF6', d:'Estaciones de la línea Gecko'},
  moose:    {n:'Moose',    c:'#F08C00', d:'Estaciones de la línea Moose'},
  scorpion: {n:'Scorpion', c:'#2F6BFF', d:'Estaciones de la línea Scorpion'},
  horno:    {n:'Hornos',   c:'#8A8A90', d:'Hornos y curado'},
  general:  {n:'General',  c:'#5E6B78', d:'MES, materiales y lo que aplica a todas'},
};

/* Fallas recopiladas de los chats de soporte (jul–oct 2026). */
export const FALLAS = [
 {
  "id": "moose-final-assy-atornillado",
  "linea": "moose",
  "maquina": "Final Assy (atornillado)",
  "titulo": "Final Assy (atornillado)",
  "corto": "[[e:Tornillos elevados que el equipo pasa como buenos, o tornillos que bajan completo pero el…]]",
  "sintoma": "[[e:Tornillos elevados que el equipo pasa como buenos, o tornillos que bajan completo pero el equipo los falla por ángulo; reintentos (hasta 3) por tornillo; housings barridos.]]",
  "flujo": [
   {
    "p": "[[e:Tomar foto del tornillo elevado para dimensionar]]"
   },
   {
    "p": "[[e:Bajar el tornillo manualmente para sentir si el barreno está duro]]"
   },
   {
    "p": "[[e:Revisar historial del housing (nuevo vs reutilizado) y segregar]]"
   },
   {
    "p": "[[e:Verificar que esté cargado el programa correcto (no retrabajo)]]"
   },
   {
    "p": "[[e:En el controlador abrir el programa activo, ir a la última etapa y revisar límites de ángulo y el mensaje de falla]]"
   },
   {
    "p": "[[e:Ajustar velocidad/ángulo de forma controlada y validar con housing nuevo]]"
   },
   {
    "p": "[[e:Si es material, entregar evidencia a Calidad y no asumir el Andon]]"
   },
   {
    "p": "Ver el proceso",
    "proc": "limites-atornillado"
   }
  ],
  "causas": [
   [
    "[[e:Velocidad/torque de atornillado insuficiente (tornillo no asienta)]]",
    "[[e:Subir un poco la velocidad del torque y/o el torque; subir el ángulo mínimo si salen elevados aprobados]]"
   ],
   [
    "[[e:Housing reutilizado/retrabajado con rosca dañada (cambia el ángulo final)]]",
    "[[e:Segregar nuevo vs reutilizado; correr lo nuevo con el programa normal y lo reutilizado con su programa propio; revisar historial del housing]]"
   ],
   [
    "[[e:Housing nuevo con barreno cerrado o incompleto]]",
    "[[e:Bajar el tornillo manual: si cuesta mucho, entregar housing a Calidad (revisión en microscopio); no es falla del equipo, no cerrar Andon como Auto]]"
   ],
   [
    "[[e:Operador presiona/se recarga en el segundo intento y barre los barrenos]]",
    "[[e:Detener, re-entrenar al operador (no apalancar); involucrar a Entrenamiento y tomar video de la operación]]"
   ],
   [
    "[[e:Programa de retrabajo cargado en lugar del original]]",
    "[[e:Regresar al programa original; el de retrabajo requiere credenciales de Calidad]]"
   ],
   [
    "[[e:Bujes de la fixtura descentrados / esquina del buje golpea la pieza]]",
    "[[e:Acomodar/centrar o girar el buje y validar con piezas]]"
   ],
   [
    "[[e:Límite de ángulo mínimo del paso 3 demasiado alto para el material actual (ej. 2300 con piezas buenas en ~1600-1980)]]",
    "[[e:Hacer prueba bajando el mínimo con aviso a Calidad, vigilando que no pasen elevados; el mínimo de la etapa final de apriete es 1050]]"
   ]
  ],
  "tips": [
   "Frecuencia: {{Muy recurrente (casi diario en julio; repuntes en septiembre al mezclar housing reutilizado o con personal nuevo).}}",
   "Visto en chats: 2026-07-08 a 2026-09-26"
  ]
 },
 {
  "id": "moose-bracket-atornillado",
  "linea": "moose",
  "maquina": "Bracket (atornillado)",
  "titulo": "Bracket (atornillado)",
  "corto": "[[e:Tornillos que no bajan o quedan elevados]]",
  "sintoma": "[[e:Tornillos que no bajan o quedan elevados; muy duros al bajarlos manualmente; pasan al segundo o tercer intento.]]",
  "flujo": [
   {
    "p": "[[e:Lote de tornillos con exceso de fijador (locktite) en la bolsa]]",
    "d": "[[e:Revisar/segregar la bolsa de tornillos]]"
   },
   {
    "p": "[[e:Velocidad de atornillado alta]]",
    "d": "[[e:Disminuir la velocidad del torque]]"
   },
   {
    "p": "[[l:Atornillador con calibración vencida]]",
    "d": "[[e:Programar calibración del atornillador y cambiar etiqueta (entrada al cuarto limpio con protocolo)]]"
   },
   {
    "p": "[[e:Pieza mal puesta (falla de visión)]]",
    "d": "[[e:Recolocar pieza y repetir]]"
   }
  ],
  "causas": [
   [
    "[[e:Lote de tornillos con exceso de fijador (locktite) en la bolsa]]",
    "[[e:Revisar/segregar la bolsa de tornillos]]"
   ],
   [
    "[[e:Velocidad de atornillado alta]]",
    "[[e:Disminuir la velocidad del torque]]"
   ],
   [
    "[[l:Atornillador con calibración vencida]]",
    "[[e:Programar calibración del atornillador y cambiar etiqueta (entrada al cuarto limpio con protocolo)]]"
   ],
   [
    "[[e:Pieza mal puesta (falla de visión)]]",
    "[[e:Recolocar pieza y repetir]]"
   ]
  ],
  "tips": [
   "Frecuencia: {{Recurrente en julio; luego esporádico.}}",
   "Visto en chats: 2026-07-08 a 2026-08-06"
  ]
 },
 {
  "id": "moose-front-assy-atornillado-sensores",
  "linea": "moose",
  "maquina": "Front Assy (atornillado/sensores)",
  "titulo": "Front Assy (atornillado/sensores)",
  "corto": "[[e:El tornillo baja bien pero la estación lo marca malo por ángulo]]",
  "sintoma": "[[e:El tornillo baja bien pero la estación lo marca malo por ángulo; se salta un tornillo; tornillo 1 no agarra torque; tornillo atorado en la fixtura.]]",
  "flujo": [
   {
    "p": "[[e:Ángulo mínimo demasiado alto]]",
    "d": "[[m:Ajustar ángulo mínimo (ej. de 3750° a 3700°; bajar mínimo del step 3)]]"
   },
   {
    "p": "[[e:Sensor de presencia se queda sensado: al terminar tornillo 1 el 2 ya aparece sensado y salta al 3]]",
    "d": "[[e:Ajustar/reparar el sensor de tornillo]]"
   },
   {
    "p": "[[m:Programa trabado (no toma torque en tornillo 1)]]",
    "d": "[[e:Cerrar y abrir el programa; si persiste, avisar a Auto]]"
   },
   {
    "p": "[[m:Tornillo atorado en el imán inferior de la fixtura (tope para la foto de visión)]]",
    "d": "[[m:Retirar el tornillo y limpiar el imán]]"
   },
   {
    "p": "[[e:Pieza no detectada en fixtura (Front Scorpion)]]",
    "d": "[[e:Bajar un poco el sensor de presencia]]"
   }
  ],
  "causas": [
   [
    "[[e:Ángulo mínimo demasiado alto]]",
    "[[m:Ajustar ángulo mínimo (ej. de 3750° a 3700°; bajar mínimo del step 3)]]"
   ],
   [
    "[[e:Sensor de presencia se queda sensado: al terminar tornillo 1 el 2 ya aparece sensado y salta al 3]]",
    "[[e:Ajustar/reparar el sensor de tornillo]]"
   ],
   [
    "[[m:Programa trabado (no toma torque en tornillo 1)]]",
    "[[e:Cerrar y abrir el programa; si persiste, avisar a Auto]]"
   ],
   [
    "[[m:Tornillo atorado en el imán inferior de la fixtura (tope para la foto de visión)]]",
    "[[m:Retirar el tornillo y limpiar el imán]]"
   ],
   [
    "[[e:Pieza no detectada en fixtura (Front Scorpion)]]",
    "[[e:Bajar un poco el sensor de presencia]]"
   ]
  ],
  "tips": [
   "Frecuencia: {{Ocasional.}}",
   "Visto en chats: 2026-07-14 a 2026-09-22"
  ]
 },
 {
  "id": "scorpion-final-assy-atornillado",
  "linea": "scorpion",
  "maquina": "Final Assy (atornillado)",
  "titulo": "Final Assy (atornillado)",
  "corto": "[[e:Tornillos no bajan por completo / quedan elevados]]",
  "sintoma": "[[e:Tornillos no bajan por completo / quedan elevados; Andon por torque.]]",
  "flujo": [
   {
    "p": "[[e:Punta del atornillador mal colocada (no gira)]]",
    "d": "[[d:Asentar bien la punta en el adaptador y probar]]"
   },
   {
    "p": "[[e:Housing defectuoso o reutilizado (algunos con más de 5 vueltas de retrabajo) / barrenos cerrados]]",
    "d": "[[e:Segregar y entregar a Calidad; usar material en buen estado; no es de Auto]]"
   },
   {
    "p": "[[e:Velocidad de atornillado baja]]",
    "d": "[[e:Aumentar un poco la velocidad]]"
   },
   {
    "p": "[[e:Torques sin soporte al arranque]]",
    "d": "[[e:Validar torques al inicio del turno]]"
   }
  ],
  "causas": [
   [
    "[[e:Punta del atornillador mal colocada (no gira)]]",
    "[[d:Asentar bien la punta en el adaptador y probar]]"
   ],
   [
    "[[e:Housing defectuoso o reutilizado (algunos con más de 5 vueltas de retrabajo) / barrenos cerrados]]",
    "[[e:Segregar y entregar a Calidad; usar material en buen estado; no es de Auto]]"
   ],
   [
    "[[e:Velocidad de atornillado baja]]",
    "[[e:Aumentar un poco la velocidad]]"
   ],
   [
    "[[e:Torques sin soporte al arranque]]",
    "[[e:Validar torques al inicio del turno]]"
   ]
  ],
  "tips": [
   "Frecuencia: {{Recurrente.}}",
   "Visto en chats: 2026-07-13 a 2026-09-17"
  ]
 },
 {
  "id": "scorpion-final-assy-vision-acura",
  "linea": "scorpion",
  "maquina": "Final Assy (visión / Acura)",
  "titulo": "Final Assy (visión / Acura)",
  "corto": "[[d:La visión no hace trigger de la primera inspección (manual sí pasa)]]",
  "sintoma": "[[e:La visión no hace trigger de la primera inspección (manual sí pasa); falla visión de etiquetas regulatorias; falla visión del O-ring.]]",
  "flujo": [
   {
    "p": "[[e:Comunicación de la app Acura con la cámara VS]]",
    "d": "[[e:Reabrir la app/reiniciar; pendiente optimizar la clase de comunicación de la cámara]]"
   },
   {
    "p": "[[e:La visión no cambió de receta al cambiar de modelo]]",
    "d": "[[e:Forzar el cambio de receta de visión y validar con primera pieza]]"
   },
   {
    "p": "[[e:Cuadros de búsqueda desajustados (O-ring/etiqueta)]]",
    "d": "[[e:Ajustar cuadros de búsqueda]]"
   }
  ],
  "causas": [
   [
    "[[e:Comunicación de la app Acura con la cámara VS]]",
    "[[e:Reabrir la app/reiniciar; pendiente optimizar la clase de comunicación de la cámara]]"
   ],
   [
    "[[e:La visión no cambió de receta al cambiar de modelo]]",
    "[[e:Forzar el cambio de receta de visión y validar con primera pieza]]"
   ],
   [
    "[[e:Cuadros de búsqueda desajustados (O-ring/etiqueta)]]",
    "[[e:Ajustar cuadros de búsqueda]]"
   ]
  ],
  "tips": [
   "Frecuencia: {{Recurrente (llegaron a cargar 1 h de tiempo muerto por visión).}}",
   "Visto en chats: 2026-07-13 a 2026-09-15"
  ]
 },
 {
  "id": "general-impresion-de-etiquetas-contador-",
  "linea": "general",
  "maquina": "Impresión de etiquetas / contador de seriales",
  "titulo": "Impresión de etiquetas / contador de seriales",
  "corto": "[[e:No salen etiquetas en Final]]",
  "sintoma": "[[e:No salen etiquetas en Final; la estación se detiene por error de 'ligado' que en realidad es de etiqueta; etiquetas sin nombre de modelo o con formato distinto.]]",
  "flujo": [
   {
    "p": "[[e:Imprimir una etiqueta manual para ver el error exacto]]"
   },
   {
    "p": "[[e:Confirmar con Calidad/MES si es contador o programa]]"
   },
   {
    "p": "[[e:No cambiar código de la app sin acuerdo]]"
   },
   {
    "p": "[[e:Redireccionar el Andon a MES si no es de Auto]]"
   }
  ],
  "causas": [
   [
    "[[e:Programa configurado con número de impresora anterior]]",
    "[[e:Cambiar en el programa a la impresora en uso (ej. 66 → 178)]]"
   ],
   [
    "[[e:Contador de etiquetas de MES desfasado o detenido (genera seriales ya usados o se agota el rango)]]",
    "[[e:Escalar a MES/Calidad; validar rango disponible; se requirió solicitar apertura de rango al funcional]]"
   ],
   [
    "[[e:Cambio de etiqueta/serial en MES no reflejado en el programa]]",
    "[[e:Actualizar programa de la estación (campo del modelo) y reimprimir; segregar lo impreso mal]]"
   ],
   [
    "[[e:Impresora de FVT sin red]]",
    "[[e:Conectar el cable de internet]]"
   ]
  ],
  "tips": [
   "Frecuencia: {{Ocasional pero con paros largos (hasta varias horas).}}",
   "Visto en chats: 2026-07-20 a 2026-10-09"
  ]
 },
 {
  "id": "general-mes-ligado-y-progresion",
  "linea": "general",
  "maquina": "MES – ligado y progresión",
  "titulo": "MES – ligado y progresión",
  "corto": "[[d:La estación no deja pasar la pieza: 'no encuentra que el serial padre tenga ligado el…]]",
  "sintoma": "[[e:La estación no deja pasar la pieza: 'no encuentra que el serial padre tenga ligado el housing/serializer', 'pieza ya ligada', error de número de ensamble, falta step de Build, progresión de otro modelo.]]",
  "flujo": [
   {
    "p": "[[e:Escanear la pieza y leer el mensaje exacto]]"
   },
   {
    "p": "[[e:Revisar historial en MES (Build, retest, ligados)]]"
   },
   {
    "p": "[[e:Si es tema de Calidad (ligado/mutación), apartar y entregar; no cerrar Andon como Auto]]"
   },
   {
    "p": "[[e:Si es programa, documentar y corregir]]"
   }
  ],
  "causas": [
   [
    "[[e:Serial capturado sin sufijo -SUB]]",
    "[[d:Corregir el serial; validar formulario MES]]"
   ],
   [
    "[[e:Diferencia mayúsculas/minúsculas en el serial]]",
    "[[e:Programa modificado para no distinguir mayúsculas/minúsculas]]"
   ],
   [
    "[[m:Pieza no desligada por Calidad tras desarme (lens adapter / tablilla)]]",
    "[[m:Calidad debe desligar el lens adapter del sensor; apartar la pieza para revisión con MES]]"
   ],
   [
    "[[e:Pieza construida en modo manual sin step de Build, o con número de ensamble del lens adapter en vez del de Kasalis]]",
    "[[e:Dar Build manual para que cambie al ensamble correcto]]"
   ],
   [
    "[[e:Calidad no mutó / no dio su proceso a piezas devueltas (queda progresión de otro modelo)]]",
    "[[e:Regresar a Calidad para mutar; es manejo de material, no del equipo]]"
   ],
   [
    "[[e:Pieza con revisión anterior (serial MOGC en vez de MOHC)]]",
    "[[e:Separar; no procesar]]"
   ],
   [
    "[[e:Nodo de red ethernet de la estación (no da el step aunque los seriales estén bien)]]",
    "[[d:Revisar conexión/nodo con IT]]"
   ]
  ],
  "tips": [
   "Frecuencia: {{Frecuente.}}",
   "Visto en chats: 2026-07-08 a 2026-10-08"
  ]
 },
 {
  "id": "general-lens-adapter-estacion",
  "linea": "general",
  "maquina": "Lens Adapter (estación)",
  "titulo": "Lens Adapter (estación)",
  "corto": "[[d:El programa se traba al terminar la pieza, pantalla en blanco o se queda esperando retiro]]",
  "sintoma": "[[e:El programa se traba al terminar la pieza, pantalla en blanco o se queda esperando retiro; no marca como atornillado y sigue pidiendo atornillar; no da progresión; el flujo de inicialización no avanza.]]",
  "flujo": [
   {
    "p": "[[e:Sensor intermitente o fibra óptica mal colocada]]",
    "d": "[[e:Revisar/reinstalar fibra y ajustar sensores (incluye sensor del pisador en Gecko y sensor del tornillo 3)]]"
   },
   {
    "p": "[[e:Programa/PLC trabado tras tiempo sin piezas]]",
    "d": "[[e:Cerrar y abrir el programa; si no, reiniciar programa y PLC]]"
   },
   {
    "p": "[[e:Punta del atornillador rota o barrida (barre el tornillo al final)]]",
    "d": "[[m:Revisar y cambiar la punta (la de Back Assy comparte la misma punta)]]"
   },
   {
    "p": "[[e:Checkpoint de vida de plasma: el lens adapter vencido no avanza; límite de horas fijo en código]]",
    "d": "[[e:Replasmear material vencido; el límite de horas se hizo configurable (12 → 16 h de ventana)]]"
   },
   {
    "p": "Ver el proceso",
    "proc": "receta-lens-adapter"
   }
  ],
  "causas": [
   [
    "[[e:Sensor intermitente o fibra óptica mal colocada]]",
    "[[e:Revisar/reinstalar fibra y ajustar sensores (incluye sensor del pisador en Gecko y sensor del tornillo 3)]]"
   ],
   [
    "[[e:Programa/PLC trabado tras tiempo sin piezas]]",
    "[[e:Cerrar y abrir el programa; si no, reiniciar programa y PLC]]"
   ],
   [
    "[[e:Punta del atornillador rota o barrida (barre el tornillo al final)]]",
    "[[m:Revisar y cambiar la punta (la de Back Assy comparte la misma punta)]]"
   ],
   [
    "[[e:Checkpoint de vida de plasma: el lens adapter vencido no avanza; límite de horas fijo en código]]",
    "[[e:Replasmear material vencido; el límite de horas se hizo configurable (12 → 16 h de ventana)]]"
   ]
  ],
  "tips": [
   "Frecuencia: {{Recurrente (varias veces por semana en julio-agosto).}}",
   "Visto en chats: 2026-07-15 a 2026-10-07"
  ]
 },
 {
  "id": "general-back-assy",
  "linea": "general",
  "maquina": "Back Assy",
  "titulo": "Back Assy",
  "corto": "[[e:Cilindros/clamps entran y salen antes del atornillado o no cierran bien]]",
  "sintoma": "[[e:Cilindros/clamps entran y salen antes del atornillado o no cierran bien; la fixtura se atora al girarla; punta quebrada.]]",
  "flujo": [
   {
    "p": "[[d:Ajuste mecánico del cilindro / nivel de la fixtura]]",
    "d": "[[e:Ajustar el tornillo que nivela la fixtura para que bloquee bien]]"
   },
   {
    "p": "[[e:Altura del tornillo tope incorrecta (no clampea bien al girar)]]",
    "d": "[[e:Ajustar la altura del tornillo tope]]"
   },
   {
    "p": "[[e:Operador cierra el cilindro antes de bajar la tapa por completo]]",
    "d": "[[e:Re-entrenar]]"
   },
   {
    "p": "[[e:Punta del atornillador quebrada]]",
    "d": "[[m:Reponer punta desde la gaveta y descontar en inventario]]"
   }
  ],
  "causas": [
   [
    "[[d:Ajuste mecánico del cilindro / nivel de la fixtura]]",
    "[[e:Ajustar el tornillo que nivela la fixtura para que bloquee bien]]"
   ],
   [
    "[[e:Altura del tornillo tope incorrecta (no clampea bien al girar)]]",
    "[[e:Ajustar la altura del tornillo tope]]"
   ],
   [
    "[[e:Operador cierra el cilindro antes de bajar la tapa por completo]]",
    "[[e:Re-entrenar]]"
   ],
   [
    "[[e:Punta del atornillador quebrada]]",
    "[[m:Reponer punta desde la gaveta y descontar en inventario]]"
   ]
  ],
  "tips": [
   "Frecuencia: {{Ocasional.}}",
   "Visto en chats: 2026-08-06 a 2026-09-15"
  ]
 },
 {
  "id": "general-leak-test",
  "linea": "general",
  "maquina": "Leak Test",
  "titulo": "Leak Test",
  "corto": "[[e:Fallas de fuga que detienen la línea por regla 3-5-10 (candado que solo libera Pruebas).]]",
  "sintoma": "[[e:Fallas de fuga que detienen la línea por regla 3-5-10 (candado que solo libera Pruebas).]]",
  "flujo": [
   {
    "p": "[[e:Diagnóstico de la primera falla en ≤15 min (si es otro modo de falla, otros 15)]]"
   },
   {
    "p": "[[e:Revisar valor de delta P: falla por O-ring normalmente <50; fuga gruesa suele ser cristal]]"
   },
   {
    "p": "[[e:Cambiar O-ring / front y reprobar]]"
   },
   {
    "p": "[[e:Si apunta a O-ring, escalar a Calidad para O-ring validado]]"
   },
   {
    "p": "[[e:Pruebas retira el candado; continuar en batches de 10 con pantallazo de yield]]"
   },
   {
    "p": "Ver el proceso",
    "proc": "contencion-leak"
   }
  ],
  "causas": [
   [
    "[[e:O-ring con bajo peso, poros o craqueleado (principal contribuyente)]]",
    "[[e:Usar O-ring certificado; Calidad pesa y segrega (usar >0.38-0.39 g); correr bolsita por bolsita y regresar los malos a su bolsa para RTV]]"
   ],
   [
    "[[e:O-ring estirado/dañado por manipulación]]",
    "[[e:Revisar método de ensamble]]"
   ],
   [
    "[[e:Porosidad del back housing]]",
    "[[e:Segregar back housing (inspección en microscopio) y validar lote]]"
   ],
   [
    "[[e:Fuga por el cristal del front housing (fuga gruesa)]]",
    "[[e:Entregar a Calidad; validar curado del front window (ASSELEC) y pesos/altura de dispensado]]"
   ],
   [
    "[[e:Película de desecante obstruyendo el tornillo]]",
    "[[e:Limpiar/retirar la película]]"
   ],
   [
    "[[e:Mal armado de la pieza (falso)]]",
    "[[e:Desarmar, rearmar y reprobar; si pasa, se descarta el equipo]]"
   ],
   [
    "[[e:Lente suelto detectado en leak]]",
    "[[e:Abrir QRQC; revisar plasma del lote y buscar piezas hermanas; bloquear embarque]]"
   ]
  ],
  "tips": [
   "Frecuencia: {{Muy frecuente (agosto-septiembre), ligado a lotes de O-ring y housing.}}",
   "Visto en chats: 2026-08-04 a 2026-09-24"
  ]
 },
 {
  "id": "general-eol-fallas-de-sfr",
  "linea": "general",
  "maquina": "EOL – fallas de SFR",
  "titulo": "EOL – fallas de SFR",
  "corto": "[[d:Piezas que pasan Build y Retest en Kasalis fallan SFR en EOL (valores cerca del límite…]]",
  "sintoma": "[[d:Piezas que pasan Build y Retest en Kasalis fallan SFR en EOL (valores cerca del límite inferior); acumulación de scrap.]]",
  "flujo": [
   {
    "p": "[[e:Verificar golden en EOL]]"
   },
   {
    "p": "[[e:Revisar tendencia del modo de falla en Test Performance (descontar retesteadas)]]"
   },
   {
    "p": "[[d:Comparar con logs de Kasalis]]"
   },
   {
    "p": "[[e:Retestear piezas al borde; no desarmar sin dirección]]"
   },
   {
    "p": "[[e:Abrir QRQC si se acumulan]]"
   }
  ],
  "causas": [
   [
    "[[d:Límites de Kasalis más holgados que EOL (MTF 80-85% vs límite SFR ~0.26); piezas al borde pasan Kasalis y fallan en EOL]]",
    "[[e:Evaluar alinear límites; probar en EOL piezas falladas en retest para definir hasta dónde se puede ajustar]]"
   ],
   [
    "[[e:Lote de lente malo]]",
    "[[e:Segregar lente con programa de verificación; cambiar de lote]]"
   ],
   [
    "[[e:Exceso de DELO dispensado]]",
    "[[e:Pesar y ajustar % de glue dentro del rango del modelo]]"
   ],
   [
    "[[e:Porta-interposer impreso en 3D ligeramente levantado]]",
    "[[e:Regresar al porta-interposer original]]"
   ],
   [
    "[[e:Parámetro AEO (95°): mejor desempeño en -15 que en -17]]",
    "[[l:Correr lote de 10, validar en EOL y fijar el valor]]"
   ],
   [
    "[[e:Tornillos del front sin apretar bien (rearmado recupera piezas)]]",
    "[[e:Reapretar ligeramente y reprobar antes de desarmar]]"
   ],
   [
    "[[e:Cambio en la EOL (todas las piezas fallaban)]]",
    "[[e:Revertir/validar el cambio con Pruebas]]"
   ]
  ],
  "tips": [
   "Frecuencia: {{Muy frecuente (decenas por turno en picos).}}",
   "Visto en chats: 2026-07-15 a 2026-10-07"
  ]
 },
 {
  "id": "general-eol-fvt-robot-de-calibracion-com",
  "linea": "general",
  "maquina": "EOL / FVT / Robot de calibración (comunicación y sistema)",
  "titulo": "EOL / FVT / Robot de calibración (comunicación y sistema)",
  "corto": "[[e:Fallas de comunicación en EOL]]",
  "sintoma": "[[e:Fallas de comunicación en EOL; error en EOL; FVT no funciona; robot sin programa abierto; no se da step de calibración.]]",
  "flujo": [
   {
    "p": "[[e:Mala conexión entre tablillas (abrir y cerrar la cámara la hace pasar)]]",
    "d": "[[e:Revisar método de ensamble y fixtura; punto limpio con Auto, MFG, Calidad y Pruebas]]"
   },
   {
    "p": "[[e:Cable dañado/suelto]]",
    "d": "[[e:Cambiar o reconectar el cable]]"
   },
   {
    "p": "[[e:Programa de EOL (candado por script de revisión de sensor)]]",
    "d": "[[e:Pruebas modifica el programa]]"
   },
   {
    "p": "[[e:Monos probadas sin dogbone]]",
    "d": "[[e:Probar monos a nivel dogbone con sus 3 tornillos y después retirarlos]]"
   },
   {
    "p": "[[e:Step de calibración administrado por el funcional no se refleja]]",
    "d": "[[e:Restablecer con el funcional y recalibrar]]"
   }
  ],
  "causas": [
   [
    "[[e:Mala conexión entre tablillas (abrir y cerrar la cámara la hace pasar)]]",
    "[[e:Revisar método de ensamble y fixtura; punto limpio con Auto, MFG, Calidad y Pruebas]]"
   ],
   [
    "[[e:Cable dañado/suelto]]",
    "[[e:Cambiar o reconectar el cable]]"
   ],
   [
    "[[e:Programa de EOL (candado por script de revisión de sensor)]]",
    "[[e:Pruebas modifica el programa]]"
   ],
   [
    "[[e:Monos probadas sin dogbone]]",
    "[[e:Probar monos a nivel dogbone con sus 3 tornillos y después retirarlos]]"
   ],
   [
    "[[e:Step de calibración administrado por el funcional no se refleja]]",
    "[[e:Restablecer con el funcional y recalibrar]]"
   ]
  ],
  "tips": [
   "Frecuencia: {{Ocasional.}}",
   "Visto en chats: 2026-08-18 a 2026-10-06"
  ]
 },
 {
  "id": "horno-hornos-curado-post-kasalis-dogbone",
  "linea": "horno",
  "maquina": "Hornos (curado post-Kasalis, dogbone, housing, lente)",
  "titulo": "Hornos (curado post-Kasalis, dogbone, housing, lente)",
  "corto": "[[e:App del horno se traba]]",
  "sintoma": "[[e:App del horno se traba; tiempo en 1 min y temperaturas incorrectas; horno no conecta con la PC; proceso abortado por temperatura; ASSELEC no baja temperatura; housing sin proceso entra al horno.]]",
  "flujo": [
   {
    "p": "[[e:Verificar que esté abierto el shortcut/app correcto del modelo]]"
   },
   {
    "p": "[[e:Revisar receta, tiempo y temperatura antes de iniciar]]"
   },
   {
    "p": "[[e:Meter carga completa e identificada]]"
   },
   {
    "p": "[[e:Al salir esperar enfriamiento (~20 min) y luego retest]]"
   },
   {
    "p": "Ver el proceso",
    "proc": "horno-housing"
   },
   {
    "p": "[[e:Cargas y tiempos]]",
    "proc": "horno-cargas"
   }
  ],
  "causas": [
   [
    "[[e:App del horno trabada]]",
    "[[e:Cerrar y volver a abrir la aplicación]]"
   ],
   [
    "[[e:Abierta una aplicación/shortcut de otro modelo (ej. Moose en el horno de dogbone)]]",
    "[[e:Cerrar la app incorrecta y abrir el shortcut correcto del horno; eliminar el duplicado]]"
   ],
   [
    "[[e:Receta del horno incorrecta]]",
    "[[e:Seleccionar la receta del modelo antes de meter la carga]]"
   ],
   [
    "[[e:Horno apagado físicamente tras apagado general ('no configurado para leer y escribir comando')]]",
    "[[e:Encender el horno desde su display y reiniciar la app]]"
   ],
   [
    "[[m:Temperatura inestable del horno ASSELEC]]",
    "[[m:Esperar estabilización; escalar a ME si no baja]]"
   ],
   [
    "[[e:Horno de housing sin checkpoint de proceso ASSELEC]]",
    "[[e:Detener y agregar validación de proceso]]"
   ],
   [
    "[[m:Tablilla con conector dañado al caerse al sacar las charolas]]",
    "[[e:Mejorar la charola para fijar las piezas; manipular con cuidado]]"
   ]
  ],
  "tips": [
   "Frecuencia: {{Recurrente.}}",
   "Visto en chats: 2026-07-09 a 2026-09-30"
  ]
 },
 {
  "id": "general-dispensador-de-desecante",
  "linea": "general",
  "maquina": "Dispensador de desecante",
  "titulo": "Dispensador de desecante",
  "corto": "[[e:No deja recargar desecante (indica que aún tiene) o no funciona tras mudanza de cuarto.]]",
  "sintoma": "[[e:No deja recargar desecante (indica que aún tiene) o no funciona tras mudanza de cuarto.]]",
  "flujo": [
   {
    "p": "[[e:Sensor de nivel desajustado]]",
    "d": "[[e:Ajustar el sensor]]"
   },
   {
    "p": "[[e:Cables desconectados al mover el equipo]]",
    "d": "[[e:Identificar y reconectar cables (mandar foto); mientras tanto, cortar manual]]"
   }
  ],
  "causas": [
   [
    "[[e:Sensor de nivel desajustado]]",
    "[[e:Ajustar el sensor]]"
   ],
   [
    "[[e:Cables desconectados al mover el equipo]]",
    "[[e:Identificar y reconectar cables (mandar foto); mientras tanto, cortar manual]]"
   ]
  ],
  "tips": [
   "Frecuencia: {{Esporádico.}}",
   "Visto en chats: 2026-07-13 a 2026-08-24"
  ]
 },
 {
  "id": "scorpion-dogbone-estacion-vision-y-recet",
  "linea": "scorpion",
  "maquina": "Dogbone (estación, visión y receta)",
  "titulo": "Dogbone (estación, visión y receta)",
  "corto": "[[m:Falla la visión al colocar la cámara derecha]]",
  "sintoma": "[[e:Falla la visión al colocar la cámara derecha; programa pide girar el nido pero marca 'nido fuera de posición'; checkpoint truena con nuevo número de parte; zoom movido.]]",
  "flujo": [
   {
    "p": "[[m:Cuadro de búsqueda desajustado]]",
    "d": "[[m:Mover/ajustar el cuadro de búsqueda]]"
   },
   {
    "p": "[[m:No se cargó el programa del modelo (ej. 133.4)]]",
    "d": "[[m:Cargar el programa correspondiente al modelo]]"
   },
   {
    "p": "[[e:Falso en conector rápido del sensor de posición del nido]]",
    "d": "[[e:Revisar y reasentar el conector rápido]]"
   },
   {
    "p": "[[e:Nuevo ensamble/número de parte requiere otro checkpoint (variable de serial monocular izquierdo); material progresado a final para empaque en vez de dogbone]]",
    "d": "[[e:Crear receta desde cero con datos de MES; Calidad muta el material a la progresión correcta; plan B ligar manual]]"
   },
   {
    "p": "[[e:Fórmula de validación de serial no aceptaba H/V]]",
    "d": "[[e:Modificar la validación para aceptar H y V]]"
   },
   {
    "p": "[[d:Placas de fixtura de 100 mm rotuladas al revés (horizontal/vertical)]]",
    "d": "[[e:Guiarse por la información de MES o el dibujo, no por la etiqueta de la fixtura]]"
   },
   {
    "p": "Ver el proceso",
    "proc": "receta-dogbone"
   }
  ],
  "causas": [
   [
    "[[m:Cuadro de búsqueda desajustado]]",
    "[[m:Mover/ajustar el cuadro de búsqueda]]"
   ],
   [
    "[[m:No se cargó el programa del modelo (ej. 133.4)]]",
    "[[m:Cargar el programa correspondiente al modelo]]"
   ],
   [
    "[[e:Falso en conector rápido del sensor de posición del nido]]",
    "[[e:Revisar y reasentar el conector rápido]]"
   ],
   [
    "[[e:Nuevo ensamble/número de parte requiere otro checkpoint (variable de serial monocular izquierdo); material progresado a final para empaque en vez de dogbone]]",
    "[[e:Crear receta desde cero con datos de MES; Calidad muta el material a la progresión correcta; plan B ligar manual]]"
   ],
   [
    "[[e:Fórmula de validación de serial no aceptaba H/V]]",
    "[[e:Modificar la validación para aceptar H y V]]"
   ],
   [
    "[[d:Placas de fixtura de 100 mm rotuladas al revés (horizontal/vertical)]]",
    "[[e:Guiarse por la información de MES o el dibujo, no por la etiqueta de la fixtura]]"
   ]
  ],
  "tips": [
   "Frecuencia: {{Ocasional.}}",
   "Visto en chats: 2026-07-23 a 2026-10-04"
  ]
 },
 {
  "id": "general-estaciones-elk-final-front",
  "linea": "general",
  "maquina": "Estaciones ELK (Final/Front)",
  "titulo": "Estaciones ELK (Final/Front)",
  "corto": "[[e:Sensor de posición de atornillado no detecta]]",
  "sintoma": "[[e:Sensor de posición de atornillado no detecta; fixtura dura en el riel; piezas golpeadas por un tornillo; riel bloqueado; falla de red.]]",
  "flujo": [
   {
    "p": "[[e:Sensor de posición/clamp desajustado]]",
    "d": "[[e:Ajustar sensor y reiniciar programa trabado]]"
   },
   {
    "p": "[[e:Guías lineales secas / mesa con movimiento]]",
    "d": "[[e:Pasar trapo con WD-40 por las guías lineales]]"
   },
   {
    "p": "[[e:Buje golpea la pieza]]",
    "d": "[[e:Girar el buje]]"
   },
   {
    "p": "[[e:Tornillo inferior del riel aflojado]]",
    "d": "[[m:Reapretar (espacio reducido)]]"
   },
   {
    "p": "[[m:Cable ethernet movido por el movimiento de la estación]]",
    "d": "[[e:Reacomodar y asegurar el ethernet]]"
   },
   {
    "p": "[[e:Retest no actualizado (6%) para el modelo]]",
    "d": "[[e:Actualizar el decremento de retest para todos los modelos]]"
   }
  ],
  "causas": [
   [
    "[[e:Sensor de posición/clamp desajustado]]",
    "[[e:Ajustar sensor y reiniciar programa trabado]]"
   ],
   [
    "[[e:Guías lineales secas / mesa con movimiento]]",
    "[[e:Pasar trapo con WD-40 por las guías lineales]]"
   ],
   [
    "[[e:Buje golpea la pieza]]",
    "[[e:Girar el buje]]"
   ],
   [
    "[[e:Tornillo inferior del riel aflojado]]",
    "[[m:Reapretar (espacio reducido)]]"
   ],
   [
    "[[m:Cable ethernet movido por el movimiento de la estación]]",
    "[[e:Reacomodar y asegurar el ethernet]]"
   ],
   [
    "[[e:Retest no actualizado (6%) para el modelo]]",
    "[[e:Actualizar el decremento de retest para todos los modelos]]"
   ]
  ],
  "tips": [
   "Frecuencia: {{Ocasional.}}",
   "Visto en chats: 2026-07-17 a 2026-10-01"
  ]
 },
 {
  "id": "gecko-celda-gecko-st-03-04-leds-final-mo",
  "linea": "gecko",
  "maquina": "Celda Gecko (St 03/04, Leds, Final, Moisture, Lens adapter)",
  "titulo": "Celda Gecko (St 03/04, Leds, Final, Moisture, Lens adapter)",
  "corto": "[[e:Tornillos elevados/capados]]",
  "sintoma": "[[e:Tornillos elevados/capados; visión falla tras retirar tornillo; Final Gecko con Acura que se cierra cada ~2 piezas; Leds sale de secuencia tras reintento; torques con calibración vencida.]]",
  "flujo": [
   {
    "p": "[[e:Barreno del housing malo]]",
    "d": "[[e:Separar housing y desligar sensor/serializer para volver a pasar]]"
   },
   {
    "p": "[[e:Leds: al fallar atornillado y reintentar, la visión sale de secuencia e inspecciona con otro programa]]",
    "d": "[[e:Debug de la secuencia de reintento]]"
   },
   {
    "p": "[[e:Leds: visión del conector del serializer por comunicación con la cámara]]",
    "d": "[[e:Volver a abrir el Acura]]"
   },
   {
    "p": "[[e:Final Gecko: interacción con servidor/dominio fuera de try cierra la app]]",
    "d": "[[e:Correr desde el código para ver la línea; revisar campos MES (serial vacío); verificar licencia; reiniciar]]"
   },
   {
    "p": "[[e:Moisture: etiqueta mal puesta]]",
    "d": "[[e:Recolocar etiqueta]]"
   },
   {
    "p": "[[e:Torques 5, 6 y 7 con calibración vencida]]",
    "d": "[[e:Calibrar o correr con desviación firmada (se puede armar pero no embarcar sin desviación)]]"
   },
   {
    "p": "[[e:Alarma típica de Gecko al inicializar]]",
    "d": "[[e:Presionar reset (se puede desactivar)]]"
   },
   {
    "p": "[[e:St 04 sin opción de skip]]",
    "d": "[[e:Agregar opción de skip en debug]]"
   }
  ],
  "causas": [
   [
    "[[e:Barreno del housing malo]]",
    "[[e:Separar housing y desligar sensor/serializer para volver a pasar]]"
   ],
   [
    "[[e:Leds: al fallar atornillado y reintentar, la visión sale de secuencia e inspecciona con otro programa]]",
    "[[e:Debug de la secuencia de reintento]]"
   ],
   [
    "[[e:Leds: visión del conector del serializer por comunicación con la cámara]]",
    "[[e:Volver a abrir el Acura]]"
   ],
   [
    "[[e:Final Gecko: interacción con servidor/dominio fuera de try cierra la app]]",
    "[[e:Correr desde el código para ver la línea; revisar campos MES (serial vacío); verificar licencia; reiniciar]]"
   ],
   [
    "[[e:Moisture: etiqueta mal puesta]]",
    "[[e:Recolocar etiqueta]]"
   ],
   [
    "[[e:Torques 5, 6 y 7 con calibración vencida]]",
    "[[e:Calibrar o correr con desviación firmada (se puede armar pero no embarcar sin desviación)]]"
   ],
   [
    "[[e:Alarma típica de Gecko al inicializar]]",
    "[[e:Presionar reset (se puede desactivar)]]"
   ],
   [
    "[[e:St 04 sin opción de skip]]",
    "[[e:Agregar opción de skip en debug]]"
   ]
  ],
  "tips": [
   "Frecuencia: {{En cada corrida de Gecko.}}",
   "Visto en chats: 2026-07-28 a 2026-09-24"
  ]
 },
 {
  "id": "moose-final-assy-software-app",
  "linea": "moose",
  "maquina": "Final Assy (software/app)",
  "titulo": "Final Assy (software/app)",
  "corto": "[[e:App de final congelada]]",
  "sintoma": "[[e:App de final congelada; error de vacío y de paro de emergencia; estaciones reportan en MES la misma hora de inicio y fin.]]",
  "flujo": [
   {
    "p": "[[e:Errores retenidos en la PC]]",
    "d": "[[e:Reiniciar la PC]]"
   },
   {
    "p": "[[e:App de atornillado trabada]]",
    "d": "[[e:Cerrar y abrir la app]]"
   },
   {
    "p": "[[e:Registro de tiempos en MES]]",
    "d": "[[e:Revisar el reporte de hora inicio/fin con MES]]"
   }
  ],
  "causas": [
   [
    "[[e:Errores retenidos en la PC]]",
    "[[e:Reiniciar la PC]]"
   ],
   [
    "[[e:App de atornillado trabada]]",
    "[[e:Cerrar y abrir la app]]"
   ],
   [
    "[[e:Registro de tiempos en MES]]",
    "[[e:Revisar el reporte de hora inicio/fin con MES]]"
   ]
  ],
  "tips": [
   "Frecuencia: {{Ocasional.}}",
   "Visto en chats: 2026-07-30 a 2026-09-18"
  ]
 },
 {
  "id": "general-plasma-lavado-de-lens-adapter-is",
  "linea": "general",
  "maquina": "Plasma / lavado de Lens Adapter (ISO5)",
  "titulo": "Plasma / lavado de Lens Adapter (ISO5)",
  "corto": "[[e:Lens adapter sin step de plasma en sistema]]",
  "sintoma": "[[e:Lens adapter sin step de plasma en sistema; charolas validadas sin historial; lentes despegados (DELO queda en el lente, lens adapter limpio); plasma vencido.]]",
  "flujo": [
   {
    "p": "[[e:No se cerró el ciclo en la app de plasma (no permite dar OK)]]",
    "d": "[[e:Cerrar el ciclo/dar OK en la app de plasma]]"
   },
   {
    "p": "[[e:Error del servidor de la app de plasma]]",
    "d": "[[e:Esperar restablecimiento del servidor y reintentar]]"
   },
   {
    "p": "[[e:Charola puesta boca abajo / no plasmeada]]",
    "d": "[[e:Volver a plasmear la charola]]"
   },
   {
    "p": "[[e:Plasma deficiente (despegue)]]",
    "d": "[[e:Validar charolas con dyne pen, push test de muestras, bloquear embarque hasta liberación]]"
   },
   {
    "p": "[[e:Plasma vencido]]",
    "d": "[[e:Lavar y replasmear según proceso definido; respetar horarios de plasma]]"
   }
  ],
  "causas": [
   [
    "[[e:No se cerró el ciclo en la app de plasma (no permite dar OK)]]",
    "[[e:Cerrar el ciclo/dar OK en la app de plasma]]"
   ],
   [
    "[[e:Error del servidor de la app de plasma]]",
    "[[e:Esperar restablecimiento del servidor y reintentar]]"
   ],
   [
    "[[e:Charola puesta boca abajo / no plasmeada]]",
    "[[e:Volver a plasmear la charola]]"
   ],
   [
    "[[e:Plasma deficiente (despegue)]]",
    "[[e:Validar charolas con dyne pen, push test de muestras, bloquear embarque hasta liberación]]"
   ],
   [
    "[[e:Plasma vencido]]",
    "[[e:Lavar y replasmear según proceso definido; respetar horarios de plasma]]"
   ]
  ],
  "tips": [
   "Frecuencia: {{Recurrente.}}",
   "Visto en chats: 2026-08-18 a 2026-10-08"
  ]
 },
 {
  "id": "general-asselec-dispensado-horneado-fron",
  "linea": "general",
  "maquina": "ASSELEC (dispensado/horneado front window)",
  "titulo": "ASSELEC (dispensado/horneado front window)",
  "corto": "[[e:Dispensado incompleto (falta glue)]]",
  "sintoma": "[[e:Dispensado incompleto (falta glue); dispensando mal; fugas por cristal en leak test; el glue expira si no se consume.]]",
  "flujo": [
   {
    "p": "[[e:Dispensado sin validar tras setup largo]]",
    "d": "[[e:Revisar pieza por pieza que no falte glue; liberar con pesos y altura de dispensado]]"
   },
   {
    "p": "[[e:Piezas no curadas el día que se dispensaron]]",
    "d": "[[e:Verificar curado por serial antes de ensamble]]"
   },
   {
    "p": "[[e:Glue (2 tubos) por expirar en fin de semana]]",
    "d": "[[e:Correr full para consumirlo]]"
   },
   {
    "p": "[[e:DELO del equipo no identificado]]",
    "d": "[[e:El número de DELO está en el check list de la ASSELEC]]"
   }
  ],
  "causas": [
   [
    "[[e:Dispensado sin validar tras setup largo]]",
    "[[e:Revisar pieza por pieza que no falte glue; liberar con pesos y altura de dispensado]]"
   ],
   [
    "[[e:Piezas no curadas el día que se dispensaron]]",
    "[[e:Verificar curado por serial antes de ensamble]]"
   ],
   [
    "[[e:Glue (2 tubos) por expirar en fin de semana]]",
    "[[e:Correr full para consumirlo]]"
   ],
   [
    "[[e:DELO del equipo no identificado]]",
    "[[e:El número de DELO está en el check list de la ASSELEC]]"
   ]
  ],
  "tips": [
   "Frecuencia: {{Ocasional.}}",
   "Visto en chats: 2026-08-20 a 2026-09-21"
  ]
 },
 {
  "id": "general-cuarto-limpio-temperatura-humeda",
  "linea": "general",
  "maquina": "Cuarto limpio (temperatura, humedad, partículas)",
  "titulo": "Cuarto limpio (temperatura, humedad, partículas)",
  "corto": "[[e:Paro por temperatura o humedad fuera de rango, goteras, alarma de condensación, liberación…]]",
  "sintoma": "[[e:Paro por temperatura o humedad fuera de rango, goteras, alarma de condensación, liberación tardía por partículas.]]",
  "flujo": [
   {
    "p": "[[e:Climatización fuera de parámetros (rango: 18-25 °C, 40-60% HR)]]",
    "d": "[[e:Escalar a Facilities/climas; enviar fotos de lecturas cada 15 min]]"
   },
   {
    "p": "[[e:Medidor equivocado]]",
    "d": "[[e:Usar el medidor blanco (el azul es obsoleto/no calibrado)]]"
   },
   {
    "p": "[[e:Gotera en el cuarto]]",
    "d": "[[e:Desconectar y cubrir equipos con plástico; segregar material mojado a MRB; esperar estabilización y medir partículas]]"
   },
   {
    "p": "[[e:Liberación de partículas tardía (un solo medidor)]]",
    "d": "[[e:Programar soporte de Calidad antes del arranque]]"
   }
  ],
  "causas": [
   [
    "[[e:Climatización fuera de parámetros (rango: 18-25 °C, 40-60% HR)]]",
    "[[e:Escalar a Facilities/climas; enviar fotos de lecturas cada 15 min]]"
   ],
   [
    "[[e:Medidor equivocado]]",
    "[[e:Usar el medidor blanco (el azul es obsoleto/no calibrado)]]"
   ],
   [
    "[[e:Gotera en el cuarto]]",
    "[[e:Desconectar y cubrir equipos con plástico; segregar material mojado a MRB; esperar estabilización y medir partículas]]"
   ],
   [
    "[[e:Liberación de partículas tardía (un solo medidor)]]",
    "[[e:Programar soporte de Calidad antes del arranque]]"
   ]
  ],
  "tips": [
   "Frecuencia: {{Frecuente en temporada de lluvia.}}",
   "Visto en chats: 2026-08-11 a 2026-09-10"
  ]
 },
 {
  "id": "general-router-depanelizado-de-pcb",
  "linea": "general",
  "maquina": "Router (depanelizado de PCB)",
  "titulo": "Router (depanelizado de PCB)",
  "corto": "[[e:Tablillas con cobre expuesto tras el corte]]",
  "sintoma": "[[e:Tablillas con cobre expuesto tras el corte; scrap.]]",
  "flujo": [
   {
    "p": "[[e:Pallet/plato de router no sujeta la PCB]]",
    "d": "[[e:Contención: poner dots en la tablilla y validar cada hora; acción sistémica pendiente con ME]]"
   }
  ],
  "causas": [
   [
    "[[e:Pallet/plato de router no sujeta la PCB]]",
    "[[e:Contención: poner dots en la tablilla y validar cada hora; acción sistémica pendiente con ME]]"
   ]
  ],
  "tips": [
   "Frecuencia: 4 eventos en el mes.",
   "Visto en chats: 2026-10-08 a 2026-10-10"
  ]
 }
];

export const PROCESOS = {
  'horno-housing': {
    titulo:'Hornear housing (cargar parámetros en el programa del horno)', linea:'horno', lineas:['scorpion','moose','gecko'], maquina:'Horno', permisos:'Operador / técnico',
    cuando:'[[d:Cuando piden hornear housing (Scorpion, Moose…) y el horno tiene otro programa.]]',
    pasos:[
      {texto:'[[d:Tomar la hoja de parámetros del horno y buscar el ensamble: ahí vienen la temperatura de curado, el mínimo / máximo y el tiempo.]]', ojo:'[[d:Siempre usar la hoja del ensamble que vas a hornear: los valores cambian de ensamble a ensamble.]]'},
      {texto:'[[d:Detener el programa con el botón Detener.]]'},
      {texto:'[[d:Ir a la pestaña Parámetros y picar "Modificar parámetros".]]'},
      {texto:'[[d:Capturar los parámetros de la hoja: temperatura de curado, mínimo, máximo y tiempo.]]', valor:'[[d:Ejemplo de la hoja (housing Scorpion): 160 °C · mín 155 · máx 165 · 1 h 30 min]]'},
      {texto:'[[d:Picar "Cargar cambios". Pide contraseña.]]', valor:'[[d:Contraseña: admin]]'},
      {texto:'[[d:Iniciar el programa.]]'},
    ],
    sabemos:['{{Confirmar en pantalla que quedaron los valores de la hoja antes de cargar piezas.}}'],
    necesito:['Fotos de cada pantalla (Detener, pestaña Parámetros, Modificar parámetros, Cargar cambios, Iniciar)'],
  },
  'horno-manual': {
    titulo:'Configurar el horno directo en el horno (manual)', linea:'horno', maquina:'Horno', permisos:'Técnico',
    cuando:'[[d:Cuando hay que poner los parámetros directamente en el control del horno.]]',
    pasos:[], sabemos:['[[d:Los parámetros salen de la hoja de parámetros del horno por ensamble.]]'],
    necesito:['Pasos y fotos del control del horno'],
  },
  'cambio-delo': {
    titulo:'Cambio de cartucho de DELO', linea:'general', lineas:['gecko','moose','scorpion'], maquina:'Dispensadores', permisos:'Operador / técnico',
    cuando:'[[d:DELO acabado]], pot life vencido o cambio de material.',
    pasos:[
      {texto:'[[d:Cerrar el aire y validar que el manómetro marque 0 PSI.]]'},
      {texto:'[[d:Cambiar el cartucho y asegurar las conexiones.]]'},
      {texto:'[[d:Apretar el opresor.]]', ojo:'[[d:Saltarse el aire o el opresor ya tiró DELO dos veces.]]'},
      {texto:'[[d:Encender el aire de forma gradual y revisar que no haya fugas.]]'},
      {texto:'[[e:Purgar, pesar 3 dispensados y tomar foto.]]'},
    ],
    sabemos:['[[e:El DELO se ambienta 1.5 h antes de usarlo (el de MRO llega congelado).]]','[[e:Si cambia de cuarto: 30 min de refri y luego ambientar.]]','[[e:Registrar cada DELO en la base de datos; la caducidad corre desde que se abre.]]','{{No reusar envases.}}'],
    necesito:['Fotos del dispensador de cada estación (dónde está el opresor y la válvula de aire)'],
  },
  'cambio-fixtura': {
    titulo:'Cambio de fixtura', linea:'general', lineas:['gecko','moose','scorpion'], maquina:'Estaciones', permisos:'Técnico',
    cuando:'[[d:Cambio de modelo]]{{ o fixtura dañada}}.',
    pasos:[], sabemos:[], necesito:['Pasos y fotos del cambio de fixtura por estación'],
  },
  "receta-dogbone": {"titulo": "Cambio de receta / nuevo número de parte en Dogbone", "linea": "scorpion", "maquina": "Dogbone", "permisos": "Técnico", "cuando": "[[e:Nuevo número de parte o cambio de receta en Dogbone.]]", "pasos": [{"texto": "[[d:Confirmar con Producción y Calidad el modelo y PFA a correr (revisar en MES, no por el nombre de la fixtura)]]"}, {"texto": "[[e:Buscar en el apartado de MES de las recetas la que corresponde al PFA del campo 'camera s/n']]"}, {"texto": "[[d:Si no existe, crear la receta con los campos que pase Calidad/MES (incluido el número de etiqueta en el apartado de impresión/pruebas)]]"}, {"texto": "[[e:Ajustar visiones y flujo para el nuevo modelo]]"}, {"texto": "[[e:Imprimir una etiqueta de prueba y verificar el PFA impreso; que Calidad la libere]]"}, {"texto": "[[e:Si truena el checkpoint de ligado, revisar la variable del serial de la cámara y que el material tenga la progresión correcta (Calidad muta)]]"}, {"texto": "[[d:No dejar el checkpoint bypasseado: reactivarlo al terminar]]"}], "sabemos": ["[[d:Las placas de fixtura de 100 mm horizontal/vertical están invertidas]]", "[[e:Plan B: ligado manual por Calidad]]"], "necesito": ["Fotos de cada paso"]},
  "receta-lens-adapter": {"titulo": "Cambio de fixtura y receta en Lens Adapter", "linea": "general", "maquina": "Lens adapter", "permisos": "Técnico", "cuando": "[[e:Cambio de modelo en la estación de lens adapter.]]", "pasos": [{"texto": "[[e:Cambiar la fixtura del modelo en la estación de Lens Adapter]]"}, {"texto": "[[e:Seleccionar la receta correcta del modelo]]"}, {"texto": "[[e:Al cambiar revisión de lens adapter (ej. Rev A→B), cerrar y abrir la app (también en ISO5) para que tome el cambio]]"}, {"texto": "[[e:Validar con primera pieza el ligado y la progresión]]"}], "sabemos": ["[[e:No mezclar revisiones de lens adapter; la nueva revisión requiere alta previa en MES (BOM)]]", "[[e:Lens adapter de Scorpion no se liga]]"], "necesito": ["Fotos de cada paso"]},
  "contencion-leak": {"titulo": "Contención por fallas de fuga en Leak Test", "linea": "general", "maquina": "Leak test", "permisos": "Técnico", "cuando": "[[e:Fallas de fuga seguidas (regla 3-5-10).]]", "pasos": [{"texto": "[[e:Detener por regla 3-5-10; abrir Andon y QRQC]]"}, {"texto": "[[e:Diagnosticar en ≤15 min la primera pieza]]"}, {"texto": "[[e:Validar el equipo: leak test limpio y pasar golden good y bad (Pruebas)]]"}, {"texto": "[[e:Verificar que los torques funcionen correctamente (Automatización)]]"}, {"texto": "[[e:Auditar que el método de ensamble sea el documentado (Manufactura/Calidad)]]"}, {"texto": "[[e:Calidad pesa y segrega O-ring]] {{(>0.38 g)}} [[e:y valida front/back housing]]"}, {"texto": "[[e:Reanudar con validación de 20 piezas y luego batches de 10 con pantallazo de yield]]"}], "sabemos": ["[[e:Falla por O-ring suele dar delta P <50; fuga gruesa suele ser cristal]]", "[[e:No acumular material sin diagnóstico]]"], "necesito": ["Fotos de cada paso"]},
  "limites-atornillado": {"titulo": "Ajuste de límites de atornillado en Final", "linea": "moose", "maquina": "Final Assy", "permisos": "Técnico", "cuando": "[[m:Tornillos elevados que pasan o buenos que fallan por ángulo.]]", "pasos": [{"texto": "[[e:Abrir en el controlador el programa activo (el primero, en azul)]]"}, {"texto": "[[e:Ir a la última etapa (etapa 3 / apriete final)]]"}, {"texto": "[[e:Revisar límites de ángulo y el mensaje de falla (flecha a la izquierda)]]"}, {"texto": "[[e:Comparar el ángulo de una pieza buena vs una fallada]]"}, {"texto": "[[e:Ajustar velocidad o ángulo mínimo de forma controlada e informar a Calidad]]"}, {"texto": "[[e:Validar con housing nuevo; para housing reutilizado usar su programa]]"}], "sabemos": ["[[e:Bajar demasiado el ángulo puede dejar pasar elevados]]"], "necesito": ["Fotos de cada paso"]},
  "apagado-encendido": {"titulo": "Apagado y encendido de equipos (corte eléctrico / fin de semana)", "linea": "general", "maquina": "Todas", "permisos": "Técnico", "cuando": "[[e:Corte eléctrico o fin de semana.]]", "pasos": [{"texto": "[[e:Apagar primero las computadoras]]"}, {"texto": "[[e:Apagar el switch principal (main switch) de cada máquina y gabinete]]"}, {"texto": "[[e:Incluir hornos, refrigeradores, impresora 3D y equipos fuera del cuarto limpio; desconectar si se requiere]]"}, {"texto": "[[d:No dejar material productivo dentro del cuarto limpio]]"}, {"texto": "[[e:Al encender: prender gabinetes y máquinas, luego PCs; encender el horno desde su display y abrir su app]]"}, {"texto": "[[d:Iniciar sesión con credenciales; si una app se traba usar el administrador de tareas (Ctrl+Shift+Esc) para cerrarla]]"}, {"texto": "[[e:Liberar partículas, temperatura y humedad antes de arrancar]]"}, {"texto": "[[e:Validar primera pieza con Calidad; Pruebas enciende Leak Test/EOL y retira candados]]"}], "sabemos": ["[[e:Arrancar en batches pequeños (5-10 piezas) tras un paro largo]]"], "necesito": ["Fotos de cada paso"]},
  "horno-cargas": {"titulo": "Cargas y tiempos del horno de curado (post-Kasalis)", "linea": "horno", "maquina": "Horno", "permisos": "Técnico", "cuando": "[[e:Curado después de la Kasalis.]]", "pasos": [{"texto": "[[e:Abrir el shortcut/app del horno correspondiente al modelo]]"}, {"texto": "[[e:Meter cargas completas (estándar 30 piezas; Moose se llegó a definir en 60 o lo construido en 2 horas)]]"}, {"texto": "[[e:Registrar hora de entrada; el ciclo dura aprox. 1.5-2 h (varía ~8 min)]]"}, {"texto": "[[e:Al salir, dejar enfriar ~20 min]]"}, {"texto": "[[e:Dar retest en Kasalis y entregar a Front]]"}], "sabemos": ["[[e:Evitar cargas parciales salvo orden de Producción]]", "[[m:Contemplar horno + enfriamiento + retest en la planeación de material]]"], "necesito": ["Fotos de cada paso"]},
  "andones": {"titulo": "Cierre y reporte de Andones", "linea": "general", "maquina": "Todas", "permisos": "Técnico", "cuando": "[[e:Al cerrar un andon.]]", "pasos": [{"texto": "[[e:Reportar en el grupo cada Andon cerrado con formato: Línea / Estación / Descripción / causa / tiempo]]"}, {"texto": "[[e:Cerrar el Andon solo cuando se conozca la causa raíz y corresponda a Auto]]"}, {"texto": "[[e:No cerrar Andones por falta de material, material defectuoso, MES o Calidad: redireccionar]]"}, {"texto": "[[e:Por incumplimiento de rate, cerrar por hora y proporcional (~2 min por unidad faltante)]]"}, {"texto": "[[e:Registrar paros y microparos en la app de paros de línea]]"}], "sabemos": ["[[e:Se auditan semanalmente]]"], "necesito": ["Fotos de cada paso"]},
};

/* =====================================================================
   NOTAS DE TROUBLESHOOTING Y PROCEDIMIENTOS (llenar con tu experiencia)
   ---------------------------------------------------------------------
   NOTAS: lo que haces cuando sale una falla.
   {
     codigos: [105, 107],              // códigos PLC (o 'screws', 'leak', 'eol')
     titulo: 'Prefocus falla después de cambio de lente',
     causa:  'Target sucio / lente mal tomado',
     acciones: ['Limpiar target central con ...', 'Re-enseñar pick position ...'],
     resultado: 'Se resolvió en 10 min',      // opcional
     autor: 'Diego', fecha: '2026-10-12',     // opcional
     procedimiento: 'reteach-pick'            // opcional: id de un PROCEDIMIENTO con fotos
   }

   PROCEDIMIENTOS: secuencias de pantallas / fotos del programa Pixid
   {
     id: 'reteach-pick',
     titulo: 'Re-enseñar posición de pick del lente',
     codigos: [104, 114, 196],
     pasos: [
       {texto: 'Entrar a Setup > Align > Teach', foto: 'fotos/reteach-pick/01.jpg'},
       {texto: 'Cambiar parámetro X a ...',     foto: 'fotos/reteach-pick/02.jpg'},
     ]
   }
   Las fotos van en buscador-kasalis/fotos/<id>/
   ===================================================================== */
export const NOTAS = [];
export const PROCEDIMIENTOS = [];

/* Frecuencia de fallas desde logs de corridas: {codigo: veces}. Se llenará con el log real. */
export const FRECUENCIA = {};
export const FRECUENCIA_FUENTE = '';

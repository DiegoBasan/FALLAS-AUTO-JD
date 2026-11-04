/* Imágenes por paso del flujo: { idFalla: { índicePaso: [{src, cap}] } }  (índice desde 0).
   Separado de fallas.js para poder agregar fotos sin tocar los textos. Rutas relativas a buscador-kasalis/.
   fotos/manual/* = imágenes del manual Pixid 500. */
const M = (n, cap) => ({src:`fotos/manual/${n}.jpg`, cap: cap + ' · manual'});
export const IMG = {
  comunicacion:{
    1:[M('estaciones','Las 4 estaciones de la mesa')],
    2:[M('disp-camera-open','Disp Camera Open (dispensado)'), M('tab-align','Align Camera Open (alineación)')],
    3:[M('interposer-conector','Conector de pogo del interposer')],
    6:[M('pogos-1','Pogo pins'), M('pogos-2','Pogo pins: revisar que ninguno se quede abajo')],
    7:[M('io-pogos','IO: subir / bajar pogos por estación')],
  },
  alineacion:{ 4:[M('align-status','Process Status: ajuste TX / TY')], 6:[M('tab-align','Pestaña Align')] },
  despega:{ 0:[M('uv-guias','Las 4 guías de UV'), M('uv-medidor','Medidor de intensidad UV')] },
  vis233:{
    0:[M('vis-anillo','VIS: cordón detectado (verde)')],
    3:[M('luces-dispensado','Cámara de inspección, line light, DOAL y PD light')],
    4:[M('luces-dispensado','Cámara de inspección, line light, DOAL y PD light')],
    5:[M('vis-pmn','Detecta el hueco porque el perímetro es menor que PMN')],
  },
  dispensado:{
    0:[M('tab-dispense','Pestaña Dispense'), M('error-222','Error de visión del dispensado')],
    1:[M('prime-copa','Prime / purga en la copa')],
    2:[M('punta-aguja','Punta de la aguja y superficie de dispensado')],
    5:[M('vis-pmn','La VIS detecta el hueco del círculo')],
  },
  delo:{ 1:[M('dispensador','Dispensador'), M('dispensador-partes','Partes del dispensador')], 4:[M('prime-copa','Prime en la copa')] },
  particulas:{ 0:[M('particulas','Partículas detectadas (verde)')] },
};
export const conImagenes = f => IMG[f.id] ? {...f, flujo: f.flujo.map((s,i)=> IMG[f.id][i] ? {...s, img:[...(s.img||[]), ...IMG[f.id][i]]} : s)} : f;

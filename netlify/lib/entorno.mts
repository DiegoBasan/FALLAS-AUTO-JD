/* Datos de prueba separados: en cualquier deploy que NO sea producción (deploy de rama / preview / netlify dev)
   los datos se guardan en stores con "-prueba" al final, para probar sin tocar lo real.
   Se comparten siempre: "usuarios" (para entrar con el mismo número) y "config" (llave de sesión, ntfy, accesos). */
import { getStore } from "@netlify/blobs";
let sufijo = "";
export function fijarEntorno(ctx?: string) { sufijo = ctx && ctx !== "production" ? "-prueba" : ""; }
export const esPrueba = () => sufijo !== "";
export const store = (name: string) => getStore({ name: name === "usuarios" || name === "config" ? name : name + sufijo, consistency: "strong" });

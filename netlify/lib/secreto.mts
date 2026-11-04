/* Secretos generados por el propio servidor y guardados en Blobs (nunca en el código ni en el chat). */
import { getStore } from "@netlify/blobs";
import { b64u } from "./auth.mts";
const cache: Record<string, string> = {};
export async function secreto(nombre: "sesion" | "ntfy"): Promise<string> {
  if (cache[nombre]) return cache[nombre];
  const env = nombre === "sesion" ? Netlify.env.get("SESSION_SECRET") : Netlify.env.get("NTFY_TOPIC");
  if (env) return (cache[nombre] = env);
  const st = getStore({ name: "config", consistency: "strong" });
  const key = `secreto-${nombre}`;
  let v = await st.get(key);
  if (!v) {
    const nuevo = nombre === "sesion" ? b64u(crypto.getRandomValues(new Uint8Array(32))) : `jdfallas-${b64u(crypto.getRandomValues(new Uint8Array(12))).toLowerCase().replace(/[^a-z0-9]/g, "")}`;
    await st.set(key, nuevo, { onlyIfNew: true });
    v = await st.get(key);
  }
  return (cache[nombre] = v as string);
}

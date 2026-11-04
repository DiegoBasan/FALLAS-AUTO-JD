/* Sesión (cookie firmada HMAC) y contraseñas (PBKDF2). Solo Web Crypto: funciona igual en Functions y Edge. */
const enc = new TextEncoder();
export const COOKIE = "jdf_s";
export const NIVELES = ["operador", "tecnico", "ingeniero", "admin"] as const;
export type Nivel = (typeof NIVELES)[number];
export const rango = (n?: string) => Math.max(0, NIVELES.indexOf((n || "operador") as Nivel));

export const b64u = (buf: ArrayBuffer | Uint8Array) => {
  const b = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = ""; b.forEach(c => (s += String.fromCharCode(c)));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
export const unb64u = (s: string) => {
  const t = s.replace(/-/g, "+").replace(/_/g, "/"); const bin = atob(t + "===".slice((t.length + 3) % 4));
  return Uint8Array.from(bin, c => c.charCodeAt(0));
};

async function hmacKey(secret: string) {
  return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}
/* adm: true solo cuando un admin confirmó su contraseña (el resto entra solo con su número). */
export type Sesion = { num: string; nombre: string; nivel: Nivel; exp: number; adm?: boolean };
export const esAdmin = (s: Sesion | null) => !!s && s.nivel === "admin" && s.adm === true;

export async function firmar(s: Sesion, secret: string) {
  const body = b64u(enc.encode(JSON.stringify(s)));
  const sig = await crypto.subtle.sign("HMAC", await hmacKey(secret), enc.encode(body));
  return `${body}.${b64u(sig)}`;
}
export async function verificar(token: string | undefined, secret: string): Promise<Sesion | null> {
  if (!token || !secret) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  try {
    const ok = await crypto.subtle.verify("HMAC", await hmacKey(secret), unb64u(sig), enc.encode(body));
    if (!ok) return null;
    const s = JSON.parse(new TextDecoder().decode(unb64u(body))) as Sesion;
    return s.exp > Date.now() ? s : null;
  } catch { return null; }
}

/* PBKDF2-SHA256, 120k iteraciones. Formato: "pbkdf2$<iter>$<salt>$<hash>" */
export async function hashPin(pin: string, saltB64?: string, iter = 120000) {
  const salt = saltB64 ? unb64u(saltB64) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", enc.encode(pin), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: iter }, key, 256);
  return `pbkdf2$${iter}$${b64u(salt)}$${b64u(bits)}`;
}
export async function checkPin(pin: string, stored?: string) {
  if (!stored) return false;
  const [, iter, salt, hash] = stored.split("$");
  const again = await hashPin(pin, salt, Number(iter));
  const a = again.split("$")[3], b = hash || "";
  if (a.length !== b.length) return false;
  let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

/* Puerta: todo el sitio requiere sesión, salvo la página de login, la API (que valida por su cuenta)
   y lo que el celular pide para instalar la app (manifest, iconos, service worker).
   /admin solo para admin con contraseña confirmada. */
import type { Config, Context } from "@netlify/edge-functions";
import { COOKIE, verificar, esAdmin } from "../lib/auth.mts";
import { secreto } from "../lib/secreto.mts";

export default async (req: Request, context: Context) => {
  const url = new URL(req.url);
  const s = await verificar(context.cookies.get(COOKIE), await secreto("sesion"));
  if (!s) {
    const next = encodeURIComponent(url.pathname + url.search + url.hash);
    return Response.redirect(new URL(`/login/?next=${next}`, url), 302);
  }
  if (url.pathname.startsWith("/admin") && !esAdmin(s)) {
    // admin que entró solo con su número: confirmar contraseña; los demás regresan al inicio
    if (s.nivel === "admin") return Response.redirect(new URL(`/login/?admin=1&next=${encodeURIComponent(url.pathname)}`, url), 302);
    return Response.redirect(new URL("/", url), 302);
  }
  return context.next();
};

export const config: Config = {
  path: "/*",
  excludedPath: ["/login", "/login/*", "/api/*", "/shared/theme.js", "/shared/ui.css", "/favicon.ico", "/.netlify/*",
    "/manifest.webmanifest", "/icons/*", "/sw.js", "/apple-touch-icon.png"],
};

/* Puerta: todo el sitio requiere sesión, salvo la página de login y la API (que valida por su cuenta).
   /admin solo para nivel admin. */
import type { Config, Context } from "@netlify/edge-functions";
import { COOKIE, verificar } from "../lib/auth.mts";
import { secreto } from "../lib/secreto.mts";

export default async (req: Request, context: Context) => {
  const url = new URL(req.url);
  const s = await verificar(context.cookies.get(COOKIE), await secreto("sesion"));
  if (!s) {
    const next = encodeURIComponent(url.pathname + url.search + url.hash);
    return Response.redirect(new URL(`/login/?next=${next}`, url), 302);
  }
  if (url.pathname.startsWith("/admin") && s.nivel !== "admin") return Response.redirect(new URL("/", url), 302);
  return context.next();
};

export const config: Config = {
  path: "/*",
  excludedPath: ["/login", "/login/*", "/api/*", "/shared/theme.js", "/shared/ui.css", "/favicon.ico", "/.netlify/*"],
};

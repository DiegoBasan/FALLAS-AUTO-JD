/* API de JD Fallas. Todo bajo /api/*.
   Stores (Netlify Blobs, site-wide):
     usuarios     <num> → {num, nombre, nivel, pin?, activo, creado}
     aportaciones <id>  → {id, ref, app, fallaId, titulo, paso, pasoTxt, tipo, texto, foto?, num, nombre, fecha, estado, nota?, revisado?}
     fotos        <id>  → imagen (jpeg)
     actividad    <YYYY-MM-DD>/<num> → {num, nombre, eventos:[{t, tipo, ruta?, titulo?, q?, n?}]}
     config       procNiveles → {procId: nivel}
*/
import type { Config, Context } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import { COOKIE, NIVELES, rango, firmar, verificar, hashPin, checkPin, type Sesion, type Nivel } from "../lib/auth.mts";
import { secreto } from "../lib/secreto.mts";
const ADMIN_NUM = () => Netlify.env.get("ADMIN_NUM") || ""; // solo para recrear el primer admin si se pierde (variable de entorno)

const DIAS_SESION = 30;
const TIPOS = ["comentario", "foto", "correccion", "solucion", "duda"];
const st = (name: string) => getStore({ name, consistency: "strong" });
const json = (d: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(d), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers } });
const err = (msg: string, status = 400) => json({ error: msg }, status);

const limpio = (s: unknown, max = 4000) => String(s ?? "").replace(/\u0000/g, "").trim().slice(0, max);
const id = () => `${Date.now().toString(36)}-${crypto.getRandomValues(new Uint32Array(1))[0].toString(36)}`;
const hoy = (d = new Date()) => new Date(d.getTime() - 6 * 3600e3).toISOString().slice(0, 10); // día en hora de México (UTC-6)

type Usuario = { num: string; nombre: string; nivel: Nivel; pin?: string; activo: boolean; creado: string };

async function getUsuario(num: string): Promise<Usuario | null> {
  const u = (await st("usuarios").get(num, { type: "json" })) as Usuario | null;
  if (u) return u;
  if (ADMIN_NUM() && num === ADMIN_NUM()) {   // reservado: aparece sin contraseña y la primera que se capture queda
    const admin: Usuario = { num, nombre: "Diego", nivel: "admin", activo: true, creado: new Date().toISOString() };
    await st("usuarios").setJSON(num, admin, { onlyIfNew: true });
    return (await st("usuarios").get(num, { type: "json" })) as Usuario;
  }
  return null;
}
const publico = (u: Usuario) => ({ num: u.num, nombre: u.nombre, nivel: u.nivel, activo: u.activo, creado: u.creado, tienePin: !!u.pin });

async function abrirSesion(u: Usuario, context: Context) {
  const s: Sesion = { num: u.num, nombre: u.nombre, nivel: u.nivel, exp: Date.now() + DIAS_SESION * 864e5 };
  context.cookies.set({ name: COOKIE, value: await firmar(s, await secreto("sesion")), path: "/", httpOnly: true, secure: true, sameSite: "Lax", expires: new Date(s.exp) });
  return s;
}

async function notificar(a: any, url: string) {
  const topic = await secreto("ntfy");
  const tipo = { comentario: "Comentario", foto: "Foto", correccion: "Corrección", solucion: "Otra solución", duda: "Duda" }[a.tipo as string] || a.tipo;
  try {
    await fetch(`https://ntfy.sh/${topic}`, {
      method: "POST",
      headers: { Title: `Aportacion: ${tipo} - ${a.nombre}`.normalize("NFD").replace(/[̀-ͯ]/g, ""), Tags: "memo", Click: `${url}/admin/` },
      body: `${a.titulo}${a.paso ? ` · paso ${a.paso}` : ""}\n${a.texto || "(foto)"}`.slice(0, 900),
    });
  } catch { /* la notificación no debe tumbar la aportación */ }
}

export default async (req: Request, context: Context) => {
  const url = new URL(req.url);
  const ruta = url.pathname.replace(/^\/api\/?/, "").replace(/\/$/, "");
  const [r0, r1, r2] = ruta.split("/");
  const M = req.method;
  const body = async () => { try { return await req.json(); } catch { return {}; } };

  /* ---------- sin sesión ---------- */
  if (r0 === "login" && M === "POST") {
    const { num, pin } = await body();
    const n = limpio(num, 20);
    const u = await getUsuario(n);
    if (!u || !u.activo) return err("Número de control no registrado. Pide tu alta al administrador.", 401);
    if (!u.pin) return json({ crearPin: true, nombre: u.nombre });
    if (!(await checkPin(limpio(pin, 100), u.pin))) return err("Contraseña incorrecta.", 401);
    const s = await abrirSesion(u, context);
    return json({ ok: true, yo: { num: s.num, nombre: s.nombre, nivel: s.nivel } });
  }
  if (r0 === "pin" && M === "POST") {   // primera vez: el usuario crea su contraseña
    const { num, pin } = await body();
    const n = limpio(num, 20), p = limpio(pin, 100);
    const u = await getUsuario(n);
    if (!u || !u.activo) return err("Número de control no registrado.", 401);
    if (u.pin) return err("Este usuario ya tiene contraseña.", 409);
    if (p.length < 4) return err("La contraseña debe tener al menos 4 caracteres.");
    u.pin = await hashPin(p);
    await st("usuarios").setJSON(n, u);
    const s = await abrirSesion(u, context);
    return json({ ok: true, yo: { num: s.num, nombre: s.nombre, nivel: s.nivel } });
  }
  if (r0 === "logout") { context.cookies.delete({ name: COOKIE, path: "/" }); return json({ ok: true }); }

  /* ---------- con sesión ---------- */
  const s = await verificar(context.cookies.get(COOKIE), await secreto("sesion"));
  if (!s) return err("Sesión vencida. Vuelve a entrar.", 401);
  const admin = s.nivel === "admin";

  if (r0 === "yo") {
    const cfg = (await st("config").get("procNiveles", { type: "json" })) || {};
    return json({ yo: { num: s.num, nombre: s.nombre, nivel: s.nivel, rango: rango(s.nivel) }, procNiveles: cfg });
  }

  if (r0 === "cambiar-pin" && M === "POST") {
    const { actual, nueva } = await body();
    const u = await getUsuario(s.num);
    if (!u || !(await checkPin(limpio(actual, 100), u.pin))) return err("La contraseña actual no coincide.", 401);
    if (limpio(nueva, 100).length < 4) return err("La nueva contraseña debe tener al menos 4 caracteres.");
    u.pin = await hashPin(limpio(nueva, 100));
    await st("usuarios").setJSON(u.num, u);
    return json({ ok: true });
  }

  /* aportaciones */
  if (r0 === "aportaciones") {
    const store = st("aportaciones");
    if (M === "GET" && !r1) {
      const ref = url.searchParams.get("ref");
      const mias = url.searchParams.get("mias");
      const de = url.searchParams.get("de");
      const prefix = ref ? `${ref.replace(/[^\w:.-]/g, "")}/` : undefined;
      const { blobs } = await store.list(prefix ? { prefix } : {});
      const items = (await Promise.all(blobs.map(b => store.get(b.key, { type: "json" })))).filter(Boolean) as any[];
      let out = items;
      if (mias) out = out.filter(a => a.num === s.num);
      else if (de) out = out.filter(a => a.num === de);
      else if (!admin) out = out.filter(a => a.estado !== "rechazada" || a.num === s.num);
      out.sort((a, b) => b.fecha.localeCompare(a.fecha));
      return json({ aportaciones: out });
    }
    if (M === "POST" && !r1) {
      const d = await body();
      const tipo = TIPOS.includes(d.tipo) ? d.tipo : "comentario";
      const ref = limpio(d.ref, 120).replace(/[^\w:.-]/g, "");
      if (!ref) return err("Falta a qué falla o proceso pertenece.");
      const texto = limpio(d.texto, 4000);
      let foto: string | undefined;
      if (d.foto && typeof d.foto === "string" && d.foto.startsWith("data:image/")) {
        const b64 = d.foto.split(",")[1] || "";
        const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
        if (bytes.length > 3_500_000) return err("La foto es muy pesada (máx. 3.5 MB).");
        foto = id();
        await st("fotos").set(foto, new Blob([bytes], { type: d.foto.slice(5, d.foto.indexOf(";")) || "image/jpeg" }));
      }
      if (!texto && !foto) return err("Escribe algo o agrega una foto.");
      const a = {
        id: `${ref}/${id()}`, ref, app: limpio(d.app, 20), fallaId: limpio(d.fallaId, 80), titulo: limpio(d.titulo, 160),
        paso: Number.isInteger(d.paso) && d.paso > 0 ? d.paso : null, pasoTxt: limpio(d.pasoTxt, 200),
        tipo, texto, foto, num: s.num, nombre: s.nombre, fecha: new Date().toISOString(), estado: "pendiente",
      };
      await store.setJSON(a.id, a);
      context.waitUntil(notificar(a, url.origin));
      return json({ ok: true, aportacion: a }, 201);
    }
    if (M === "POST" && r1 === "estado") {      // admin: aprobar / rechazar
      if (!admin) return err("Solo el administrador.", 403);
      const { id: aid, estado, nota } = await body();
      if (!["pendiente", "aprobada", "rechazada"].includes(estado)) return err("Estado inválido.");
      const a = (await store.get(String(aid), { type: "json" })) as any;
      if (!a) return err("No existe.", 404);
      a.estado = estado; a.nota = limpio(nota, 1000); a.revisado = { por: s.nombre, fecha: new Date().toISOString() };
      await store.setJSON(a.id, a);
      return json({ ok: true, aportacion: a });
    }
    if (M === "POST" && r1 === "borrar") {      // el autor (si sigue pendiente) o el admin
      const { id: aid } = await body();
      const a = (await store.get(String(aid), { type: "json" })) as any;
      if (!a) return err("No existe.", 404);
      if (!admin && !(a.num === s.num && a.estado === "pendiente")) return err("No puedes borrar esta aportación.", 403);
      await store.delete(a.id); if (a.foto) await st("fotos").delete(a.foto);
      return json({ ok: true });
    }
  }

  if (r0 === "foto" && r1) {
    const f = await st("fotos").getWithMetadata(r1, { type: "blob" });
    if (!f) return new Response("No existe", { status: 404 });
    return new Response(f.data as Blob, { headers: { "content-type": (f.data as Blob).type || "image/jpeg", "cache-control": "private, max-age=86400" } });
  }

  /* actividad: entradas y búsquedas (un registro por usuario y por día) */
  if (r0 === "evento" && M === "POST") {
    const { eventos } = await body();
    const ev = (Array.isArray(eventos) ? eventos : []).slice(0, 50).map((e: any) => ({
      t: Number(e.t) || Date.now(), tipo: limpio(e.tipo, 20), ruta: limpio(e.ruta, 160), titulo: limpio(e.titulo, 160), q: limpio(e.q, 120), n: Number.isFinite(e.n) ? e.n : undefined,
    })).filter((e: any) => e.tipo);
    if (!ev.length) return json({ ok: true });
    const key = `${hoy()}/${s.num}`, store = st("actividad");
    const cur = ((await store.get(key, { type: "json" })) as any) || { num: s.num, nombre: s.nombre, eventos: [] };
    cur.nombre = s.nombre; cur.eventos.push(...ev); if (cur.eventos.length > 2000) cur.eventos = cur.eventos.slice(-2000);
    await store.setJSON(key, cur);
    return json({ ok: true });
  }

  /* ---------- solo admin ---------- */
  if (!admin && ["stats", "usuarios", "config", "ntfy"].includes(r0) && !(r0 === "config" && M === "GET")) return err("Solo el administrador.", 403);

  if (r0 === "ntfy") return json({ topic: await secreto("ntfy") });

  if (r0 === "stats") {
    const dias = Math.min(90, Math.max(1, Number(url.searchParams.get("dias")) || 7));
    const store = st("actividad");
    const fechas = [...Array(dias)].map((_, i) => hoy(new Date(Date.now() - i * 864e5)));
    const regs: any[] = [];
    for (const f of fechas) {
      const { blobs } = await store.list({ prefix: `${f}/` });
      const vals = await Promise.all(blobs.map(b => store.get(b.key, { type: "json" })));
      vals.forEach((v: any, i) => v && regs.push({ fecha: f, ...v }));
    }
    const porDia: Record<string, { usuarios: number; vistas: number; busquedas: number }> = {};
    fechas.forEach(f => (porDia[f] = { usuarios: 0, vistas: 0, busquedas: 0 }));
    const busq: Record<string, { n: number; sinResultado: number }> = {}, vistas: Record<string, { titulo: string; n: number }> = {};
    const porUsuario: Record<string, { nombre: string; dias: number; vistas: number; busquedas: number; ultimo: number }> = {};
    for (const r of regs) {
      const d = porDia[r.fecha]; d.usuarios++;
      const pu = (porUsuario[r.num] ||= { nombre: r.nombre, dias: 0, vistas: 0, busquedas: 0, ultimo: 0 }); pu.dias++;
      for (const e of r.eventos) {
        pu.ultimo = Math.max(pu.ultimo, e.t);
        if (e.tipo === "vista") { d.vistas++; pu.vistas++; const k = e.ruta || "inicio"; (vistas[k] ||= { titulo: e.titulo || k, n: 0 }).n++; }
        if (e.tipo === "busqueda" && e.q) { d.busquedas++; pu.busquedas++; const k = e.q.toLowerCase(); const b = (busq[k] ||= { n: 0, sinResultado: 0 }); b.n++; if (e.n === 0) b.sinResultado++; }
      }
    }
    const top = <T,>(o: Record<string, T>, f: (v: T) => number, n = 20) => Object.entries(o).sort((a, b) => f(b[1]) - f(a[1])).slice(0, n);
    return json({
      dias, porDia,
      busquedas: top(busq, v => v.n).map(([q, v]) => ({ q, ...v })),
      sinResultado: top(busq, v => v.sinResultado).filter(([, v]) => v.sinResultado > 0).map(([q, v]) => ({ q, ...v })),
      vistas: top(vistas, v => v.n).map(([ruta, v]) => ({ ruta, ...v })),
      usuarios: top(porUsuario, v => v.ultimo, 200).map(([num, v]) => ({ num, ...v })),
    });
  }

  if (r0 === "usuarios") {
    const store = st("usuarios");
    if (M === "GET") {
      const { blobs } = await store.list();
      const us = (await Promise.all(blobs.map(b => store.get(b.key, { type: "json" })))).filter(Boolean) as Usuario[];
      return json({ usuarios: us.map(publico).sort((a, b) => a.nombre.localeCompare(b.nombre)) });
    }
    if (M === "POST") {
      const d = await body();
      const num = limpio(d.num, 20).replace(/\s/g, "");
      if (!/^\w{3,20}$/.test(num)) return err("Número de control inválido.");
      const prev = await getUsuario(num);
      const u: Usuario = prev || { num, nombre: "", nivel: "operador", activo: true, creado: new Date().toISOString() };
      if (d.nombre !== undefined) u.nombre = limpio(d.nombre, 80) || u.nombre || num;
      if (d.nivel !== undefined && NIVELES.includes(d.nivel)) u.nivel = d.nivel;
      if (d.activo !== undefined) u.activo = !!d.activo;
      if (d.resetPin) delete u.pin;
      if (!u.nombre) u.nombre = num;
      if (num === s.num && (u.nivel !== "admin" || !u.activo)) return err("No puedes quitarte el acceso de admin a ti mismo.");
      await store.setJSON(num, u);
      return json({ ok: true, usuario: publico(u) });
    }
  }

  if (r0 === "config") {
    const store = st("config");
    if (M === "GET") return json({ procNiveles: (await store.get("procNiveles", { type: "json" })) || {} });
    if (M === "POST") {
      const { procNiveles } = await body();
      const limpioCfg: Record<string, string> = {};
      Object.entries(procNiveles || {}).forEach(([k, v]) => { if (NIVELES.includes(v as Nivel) && v !== "operador") limpioCfg[limpio(k, 80)] = v as string; });
      await store.setJSON("procNiveles", limpioCfg);
      return json({ ok: true, procNiveles: limpioCfg });
    }
  }

  return err("Ruta no encontrada.", 404);
};

export const config: Config = { path: "/api/*" };

/* Inventario de spare (JD Fallas → /inventario/). Todo bajo /api/inv/*.
   Blobs, store "inventario" (consistencia fuerte):
     doc      → { seq, items: { <id>: Item } }   (un solo documento; se escribe con etag para no pisar cambios)
     config   → { categorias, lineas, gavetas }   (gaveta = {id, n, tipo: piso | reja | maquina}; dibujo fijo, sin niveles)
     importado → marca de la importación única del Excel anterior (ya no se puede repetir)
     m/<YYYY-MM>/<t36>-<r>  → movimiento (alta, entrada, retiro, edicion, baja, deshacer)
   Permisos: ver y retirar = cualquiera con cuenta · agregar / entrada / editar = técnico o más · eliminar y configuración = admin. */
import { getStore } from "@netlify/blobs";
import { rango, type Sesion } from "./auth.mts";

type Item = {
  id: string; pn: string; auto: boolean; desc: string; cant: number; min: number;
  cat: string; lineas: string[]; marca: string; equipo: string;
  gaveta: string; lugar: string; foto: string; creado: string; act: string; por: string;
};
type Doc = { seq: number; items: Record<string, Item> };

const TIPOS_GAV = ["piso", "reja", "maquina"];
const IMPORT_HASH = "2767db6fd1a9e4ff3d7bd6ec0726c430362f7ffd55b453c30f69f5d05510879c";
export const CONFIG_BASE = {
  categorias: ["Sensores", "Neumática", "Control (PLC / drivers)", "Cables", "PC / cómputo", "Fixtura", "Torque", "Keyence / visión",
    "Pogos e interposers", "Dispensado (DELO, agujas, motor)", "UV / óptica", "Mecánica (tornillería, rodamientos)", "Otros"],
  lineas: ["Gecko", "ELK", "Scorpion", "Moose", "Infurrow", "Spare"],
  gavetas: [
    { id: "g1", n: "Gaveta Piso", tipo: "piso" },
    { id: "g2", n: "Gaveta de reja", tipo: "reja" },
    { id: "kasalis-scorpion", n: "Kasalis Scorpion", tipo: "maquina" },
  ],
};

const st = () => getStore({ name: "inventario", consistency: "strong" });
const json = (d: unknown, status = 200) => new Response(JSON.stringify(d), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
const err = (m: string, s = 400) => json({ error: m }, s);
const txt = (v: unknown, max = 300) => String(v ?? "").replace(/\u0000/g, "").trim().slice(0, max);
const num = (v: unknown, def = 0) => { const n = Math.round(Number(v)); return Number.isFinite(n) ? n : def; };
const rid = () => crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
const mes = (d = new Date()) => new Date(d.getTime() - 6 * 3600e3).toISOString().slice(0, 7);

async function leerDoc(): Promise<{ doc: Doc; etag?: string }> {
  const r = await st().getWithMetadata("doc", { type: "json" });
  return r ? { doc: r.data as Doc, etag: r.etag } : { doc: { seq: 0, items: {} } };
}
/* lee-modifica-escribe con etag; reintenta si alguien escribió al mismo tiempo */
async function mutar<T>(fn: (doc: Doc) => T | Promise<T>): Promise<T> {
  for (let i = 0; i < 6; i++) {
    const { doc, etag } = await leerDoc();
    const out = await fn(doc);
    // INV_SIN_ETAG=1 solo para probar con `netlify dev` (el simulador local de Blobs no respeta onlyIfMatch)
    const r = Netlify.env.get("INV_SIN_ETAG") === "1" ? await st().setJSON("doc", doc)
      : etag ? await st().setJSON("doc", doc, { onlyIfMatch: etag }) : await st().setJSON("doc", doc, { onlyIfNew: true });
    if (r.modified) return out;
    await new Promise(res => setTimeout(res, 80 + Math.random() * 200));
  }
  throw new Error("Otra persona estaba guardando al mismo tiempo. Intenta otra vez.");
}
async function getConfig(): Promise<typeof CONFIG_BASE> {
  const c = (await st().get("config", { type: "json" })) as any;
  if (!c) return CONFIG_BASE;
  // configuraciones viejas (con áreas y gavetas "alta" por niveles) se leen con el formato nuevo
  return { categorias: c.categorias || CONFIG_BASE.categorias, lineas: c.lineas || CONFIG_BASE.lineas,
    gavetas: (c.gavetas || CONFIG_BASE.gavetas).map((g: any) => ({ id: g.id, n: g.n, tipo: TIPOS_GAV.includes(g.tipo) ? g.tipo : "piso" })) };
}

async function movimiento(m: Record<string, unknown>, s: Sesion) {
  const t = Date.now(), key = `m/${mes()}/${t.toString(36)}-${rid()}`;
  const mv = { key, t, fecha: new Date(t).toISOString(), num: s.num, nombre: s.nombre, ...m };
  await st().setJSON(key, mv);
  return mv;
}
async function movs({ meses = 2, item, limite = 500 }: { meses?: number; item?: string; limite?: number }) {
  const out: any[] = [];
  for (let i = 0; i < meses && out.length < limite; i++) {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    const { blobs } = await st().list({ prefix: `m/${mes(d)}/` });
    const keys = blobs.map(b => b.key).sort().reverse();
    const vals = await Promise.all(keys.slice(0, limite * 2).map(k => st().get(k, { type: "json" })));
    for (const v of vals as any[]) if (v && (!item || v.id === item)) out.push(v);
  }
  return out.sort((a, b) => b.t - a.t).slice(0, limite);
}

function limpiarItem(d: any, cfg: typeof CONFIG_BASE, base?: Item): Omit<Item, "id" | "pn" | "auto" | "creado" | "act" | "por"> {
  const g = cfg.gavetas.find(x => x.id === d.gaveta);
  return {
    desc: txt(d.desc ?? base?.desc, 300), cant: Math.max(0, num(d.cant ?? base?.cant)),
    min: Math.max(0, num(d.min ?? base?.min)), cat: txt(d.cat ?? base?.cat, 80),
    lineas: (Array.isArray(d.lineas) ? d.lineas : base?.lineas || []).map((x: unknown) => txt(x, 30)).filter(Boolean).slice(0, 10),
    marca: txt(d.marca ?? base?.marca, 80), equipo: txt(d.equipo ?? base?.equipo, 120),
    gaveta: g ? g.id : txt(base?.gaveta, 40), lugar: txt(d.lugar ?? base?.lugar, 120),
    foto: txt(d.foto ?? base?.foto, 60).replace(/[^\w-]/g, ""),
  };
}
const CAMPOS: (keyof Item)[] = ["pn", "desc", "cant", "min", "cat", "lineas", "marca", "equipo", "gaveta", "lugar", "foto"];

export async function inv(req: Request, ruta: string[], s: Sesion, admin: boolean): Promise<Response> {
  const [a] = ruta; const M = req.method;
  const puede = (n: "operador" | "tecnico") => admin || rango(s.nivel) >= rango(n);
  const body = async () => { try { return await req.json(); } catch { return {}; } };
  try {
    if (a === "estado" && M === "GET") {
      const [{ doc }, config, ultimos] = await Promise.all([leerDoc(), getConfig(), movs({ meses: 2, limite: 15 })]);
      return json({ config, items: Object.values(doc.items), ultimos, permisos: { editar: puede("tecnico"), admin, nivelAdmin: s.nivel === "admin", num: s.num } });
    }
    if (a === "movs" && M === "GET") {
      const u = new URL(req.url);
      return json({ movs: await movs({ meses: Math.min(24, num(u.searchParams.get("meses"), 3) || 3), item: u.searchParams.get("item") || undefined, limite: 2000 }) });
    }
    if (a === "config") {
      if (M === "GET") return json({ config: await getConfig() });
      if (!admin) return err("Solo el administrador.", 403);
      const d = await body(), c = d.config || {};
      const cfg = {
        categorias: (c.categorias || []).map((x: unknown) => txt(x, 60)).filter(Boolean),
        lineas: (c.lineas || []).map((x: unknown) => txt(x, 30)).filter(Boolean),
        gavetas: (c.gavetas || []).map((x: any) => ({ id: txt(x.id, 30).replace(/[^\w-]/g, "") || "g" + rid(), n: txt(x.n, 80), tipo: TIPOS_GAV.includes(x.tipo) ? x.tipo : "piso" })).filter((x: any) => x.n),
      };
      if (!cfg.gavetas.length) return err("Debe quedar al menos una gaveta.");
      await st().setJSON("config", cfg);
      await movimiento({ tipo: "config", desc: "Configuración actualizada" }, s);
      return json({ ok: true, config: cfg });
    }
    /* Importación ÚNICA del inventario anterior (Excel): borra el material, historial y configuración de ejemplo y carga los materiales.
       Pide una clave cuyo hash está aquí (la clave no está en el repo) y solo se puede hacer una vez. */
    if (a === "importar" && M === "POST") {
      const d = await body();
      const h = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(d.clave || "")))), b => b.toString(16).padStart(2, "0")).join("");
      if (h !== IMPORT_HASH) return err("No autorizado.", 403);
      if (await st().get("importado")) return err("La importación ya se hizo.", 409);
      const cfg = CONFIG_BASE;
      const items: Record<string, Item> = {}, now = new Date().toISOString();
      for (const x of (Array.isArray(d.items) ? d.items : []).slice(0, 2000)) {
        const pn = txt(x.pn, 80).toUpperCase(); if (!pn) continue;
        const id = `${Date.now().toString(36)}${rid()}`;
        items[id] = { id, pn, auto: false, ...limpiarItem(x, cfg), creado: now, act: now, por: "Importado del Excel" };
      }
      // borrar lo de ejemplo: movimientos y fotos no hay; doc y config se reemplazan
      const { blobs } = await st().list({ prefix: "m/" });
      await Promise.all(blobs.map(b => st().delete(b.key)));
      await st().setJSON("config", cfg);
      await st().setJSON("doc", { seq: 0, items });
      await st().setJSON("importado", { fecha: now, n: Object.keys(items).length, por: s.nombre });
      await movimiento({ tipo: "config", desc: `Se importaron ${Object.keys(items).length} materiales del inventario anterior (Excel)` }, s);
      return json({ ok: true, n: Object.keys(items).length, borrados: blobs.length });
    }
    if (a === "op" && M === "POST") {
      const d = await body(); const op = d.op; const cfg = await getConfig();
      if (op === "retiro") {
        const cant = num(d.cant); if (cant < 1) return err("Cantidad inválida.");
        const r = await mutar(doc => {
          const it = doc.items[d.id]; if (!it) throw new Error("No existe ese material.");
          if (it.cant < cant) throw new Error(`Solo hay ${it.cant}.`);
          const antes = it.cant; it.cant -= cant; it.act = new Date().toISOString(); it.por = s.nombre;
          return { it: { ...it }, antes };
        });
        const mv = await movimiento({ tipo: "retiro", id: d.id, pn: r.it.pn, desc: r.it.desc, delta: -cant, antes: r.antes, despues: r.it.cant, destino: txt(d.destino, 120), nota: txt(d.nota, 500) }, s);
        return json({ ok: true, item: r.it, mov: mv });
      }
      if (op === "deshacer") {
        const mios = (await movs({ meses: 2, limite: 300 })).filter(m => m.num === s.num && m.tipo === "retiro" && !m.deshecho);
        const m = mios[0]; if (!m) return err("No tienes retiros para deshacer.");
        const r = await mutar(doc => { const it = doc.items[m.id]; if (!it) throw new Error("Ese material ya no existe."); const antes = it.cant; it.cant += -m.delta; it.act = new Date().toISOString(); it.por = s.nombre; return { it: { ...it }, antes }; });
        await st().setJSON(m.key, { ...m, deshecho: true });
        const mv = await movimiento({ tipo: "deshacer", id: m.id, pn: r.it.pn, desc: r.it.desc, delta: -m.delta, antes: r.antes, despues: r.it.cant, nota: `Deshizo el retiro del ${new Date(m.t).toLocaleString("es-MX", { timeZone: "America/Chihuahua" })}` }, s);
        return json({ ok: true, item: r.it, mov: mv });
      }
      if (!puede("tecnico")) return err("Tu nivel solo permite retirar material.", 403);
      if (op === "alta") {
        const base = limpiarItem(d.item || {}, cfg);
        if (!base.desc) return err("Escribe la descripción.");
        const r = await mutar(doc => {
          let pn = txt(d.item?.pn, 80).toUpperCase(), auto = false;
          if (!pn) { doc.seq = (doc.seq || 0) + 1; pn = `AUT-${String(doc.seq).padStart(5, "0")}`; auto = true; }
          if (Object.values(doc.items).some(x => x.pn.toUpperCase() === pn)) throw new Error(`Ya existe ${pn}. Usa "Entrada" para sumar cantidad.`);
          const now = new Date().toISOString(), id = `${Date.now().toString(36)}${rid()}`;
          const it: Item = { id, pn, auto, ...base, creado: now, act: now, por: s.nombre };
          doc.items[id] = it; return it;
        });
        const mv = await movimiento({ tipo: "alta", id: r.id, pn: r.pn, desc: r.desc, delta: r.cant, antes: 0, despues: r.cant, nota: txt(d.nota, 500) }, s);
        return json({ ok: true, item: r, mov: mv }, 201);
      }
      if (op === "entrada") {
        const cant = num(d.cant); if (cant < 1) return err("Cantidad inválida.");
        const r = await mutar(doc => { const it = doc.items[d.id]; if (!it) throw new Error("No existe ese material."); const antes = it.cant; it.cant += cant; it.act = new Date().toISOString(); it.por = s.nombre; return { it: { ...it }, antes }; });
        const mv = await movimiento({ tipo: "entrada", id: d.id, pn: r.it.pn, desc: r.it.desc, delta: cant, antes: r.antes, despues: r.it.cant, nota: txt(d.nota, 500) }, s);
        return json({ ok: true, item: r.it, mov: mv });
      }
      if (op === "editar") {
        const r = await mutar(doc => {
          const it = doc.items[d.id]; if (!it) throw new Error("No existe ese material.");
          const viejo = { ...it }; const nuevo = limpiarItem(d.cambios || {}, cfg, it);
          const pn = txt(d.cambios?.pn ?? it.pn, 80).toUpperCase() || it.pn;
          Object.assign(it, nuevo, { pn, auto: pn === it.pn ? it.auto : false, act: new Date().toISOString(), por: s.nombre });
          const cambios = CAMPOS.filter(k => JSON.stringify(viejo[k]) !== JSON.stringify(it[k])).map(k => ({ campo: k, antes: viejo[k], despues: it[k] }));
          return { it: { ...it }, cambios, antes: viejo.cant };
        });
        if (!r.cambios.length) return json({ ok: true, item: r.it });
        const mv = await movimiento({ tipo: "edicion", id: d.id, pn: r.it.pn, desc: r.it.desc, delta: r.it.cant - r.antes, antes: r.antes, despues: r.it.cant, cambios: r.cambios, nota: txt(d.nota, 500) }, s);
        return json({ ok: true, item: r.it, mov: mv });
      }
      if (op === "lote") {
        const ids: string[] = (d.ids || []).slice(0, 500), c = d.cambios || {};
        const r = await mutar(doc => { let n = 0; for (const id of ids) { const it = doc.items[id]; if (!it) continue;
          Object.assign(it, limpiarItem({ ...it, ...c }, cfg, it), { act: new Date().toISOString(), por: s.nombre }); n++; } return n; });
        await movimiento({ tipo: "edicion", desc: `Edición en lote de ${r} materiales`, cambios: Object.keys(c).map(k => ({ campo: k, despues: c[k] })) }, s);
        return json({ ok: true, n: r });
      }
      if (op === "eliminar") {
        if (!admin) return err("Solo el administrador puede eliminar.", 403);
        const r = await mutar(doc => { const it = doc.items[d.id]; if (!it) throw new Error("No existe ese material."); delete doc.items[d.id]; return it; });
        const mv = await movimiento({ tipo: "baja", id: r.id, pn: r.pn, desc: r.desc, delta: -r.cant, antes: r.cant, despues: 0, nota: txt(d.nota, 500) }, s);
        return json({ ok: true, mov: mv });
      }
      return err("Operación desconocida.");
    }
    return err("Ruta no encontrada.", 404);
  } catch (e: any) { return err(e?.message || "Error"); }
}

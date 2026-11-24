/* MRB: registro del scrap que se manda (qué fue, SFR, piezas escaneadas, modelo, foto de la papeleta). Todo bajo /api/mrb/*.
   Blobs, store "mrb" (consistencia fuerte):
     r/<YYYY-MM>/<t36>-<r>  → registro { key, t, fecha, dia, turno, num, nombre, motivo, sfr, tipoSfr, modelo, linea, piezas:[{tipo, serie}], papeleta }
   El turno se calcula en el servidor con la hora de la planta (UTC-6):
     420 = lunes a jueves 6:00–18:00 · 421 = lunes a jueves 18:00–6:00 · 422 = viernes a domingo 6:00–18:00
     noche de viernes a domingo (18:00–6:00) = "N-FS" (sin turno definido todavía).
   `dia` = fecha del turno (un turno de noche que pasa de medianoche cuenta para el día en que empezó).
   Permisos: registrar y ver = cualquiera con cuenta · borrar = el autor (primeras 24 h) o el admin. */
import { getStore } from "@netlify/blobs";
import type { Sesion } from "./auth.mts";

const st = () => getStore({ name: "mrb", consistency: "strong" });
const json = (d: unknown, status = 200) => new Response(JSON.stringify(d), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
const err = (m: string, s = 400) => json({ error: m }, s);
const txt = (v: unknown, max = 300) => String(v ?? "").replace(/\u0000/g, "").trim().slice(0, max);
const rid = () => crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
const OFFSET = 6 * 3600e3;   // planta: UTC-6 todo el año
const local = (t: number) => new Date(t - OFFSET);   // usar los métodos getUTC* sobre esta fecha
export const TIPOS_PIEZA = ["Lente", "Lens adapter", "Sensor", "Housing", "Serializer", "Otro"];

export function turnoDe(t: number): { turno: string; dia: string } {
  const d = local(t), h = d.getUTCHours();
  const inicio = h < 6 ? new Date(d.getTime() - 864e5) : d;   // antes de las 6 am es la noche del día anterior
  const dow = inicio.getUTCDay();   // 0 dom … 6 sáb
  const semana = dow >= 1 && dow <= 4;   // lunes a jueves
  const dia = inicio.toISOString().slice(0, 10);
  if (h >= 6 && h < 18) return { turno: semana ? "420" : "422", dia };
  return { turno: semana ? "421" : "N-FS", dia };
}
const mesDe = (t: number) => local(t).toISOString().slice(0, 7);

export async function mrb(req: Request, ruta: string[], s: Sesion, admin: boolean): Promise<Response> {
  const [a] = ruta; const M = req.method;
  const body = async () => { try { return await req.json(); } catch { return {}; } };
  try {
    if (a === "registro" && M === "POST") {
      const d = await body();
      const motivo = txt(d.motivo, 500);
      if (!motivo) return err("Escribe qué fue (por qué se va a scrap).");
      const piezas = (Array.isArray(d.piezas) ? d.piezas : []).slice(0, 100)
        .map((p: any) => ({ tipo: TIPOS_PIEZA.includes(p?.tipo) ? p.tipo : "Otro", serie: txt(p?.serie, 80) }))
        .filter((p: any) => p.serie);
      if (!piezas.length) return err("Escanea al menos una pieza.");
      const papeleta = txt(d.papeleta, 60).replace(/[^\w-]/g, "");
      if (!papeleta) return err("Falta la foto de la papeleta.");
      // PRUEBA_LOCAL=1 (solo con `netlify dev`) deja fijar la hora para probar métricas; en producción siempre es la hora del servidor
      const t = Netlify.env.get("PRUEBA_LOCAL") === "1" && Number(d.t) ? Number(d.t) : Date.now(), { turno, dia } = turnoDe(t);
      const key = `r/${mesDe(t)}/${t.toString(36)}-${rid()}`;
      const r = { key, t, fecha: new Date(t).toISOString(), dia, turno, num: s.num, nombre: s.nombre, motivo,
        sfr: !!d.sfr, tipoSfr: d.sfr ? txt(d.tipoSfr, 120) : "", modelo: txt(d.modelo, 80).toUpperCase(), linea: txt(d.linea, 30), piezas, papeleta };
      await st().setJSON(key, r);
      return json({ ok: true, registro: r }, 201);
    }
    if (a === "registros" && M === "GET") {
      const u = new URL(req.url);
      const meses = Math.min(24, Math.max(1, Number(u.searchParams.get("meses")) || 3));
      const out: any[] = [];
      for (let i = 0; i < meses; i++) {
        const d = local(Date.now()); d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() - i);
        const { blobs } = await st().list({ prefix: `r/${d.toISOString().slice(0, 7)}/` });
        const vals = await Promise.all(blobs.map(b => st().get(b.key, { type: "json" })));
        vals.forEach(v => v && out.push(v));
      }
      out.sort((x, y) => y.t - x.t);
      return json({ registros: out, turnoAhora: turnoDe(Date.now()), tipos: TIPOS_PIEZA });
    }
    if (a === "turno" && M === "GET") return json(turnoDe(Date.now()));
    if (a === "borrar" && M === "POST") {
      const { key } = await body();
      const r = (await st().get(txt(key, 120), { type: "json" })) as any;
      if (!r) return err("No existe.", 404);
      if (!admin && !(r.num === s.num && Date.now() - r.t < 864e5)) return err("Solo quien lo registró (en las primeras 24 h) o el administrador pueden borrarlo.", 403);
      await st().delete(r.key);
      return json({ ok: true });
    }
    return err("Ruta no encontrada.", 404);
  } catch (e: any) { return err(e?.message || "Error"); }
}

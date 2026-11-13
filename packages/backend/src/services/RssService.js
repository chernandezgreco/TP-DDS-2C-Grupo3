import { ProyectoModel, ColectivoModel } from "../models/indexModel.js";
import { TerminosService } from "./TerminosService.js";
export const escaparXml = (value) =>
  String(value ?? "")
    .replace(
      /[<>&"']/g,
      (c) =>
        ({
          "<": "&lt;",
          ">": "&gt;",
          "&": "&amp;",
          '"': "&quot;",
          "'": "&apos;",
        })[c],
    )
    .split("")
    .filter((c) => {
      const code = c.charCodeAt(0);
      return code >= 32 || [9, 10, 13].includes(code);
    })
    .join("");
function baseApp() {
  const url = new URL(process.env.PUBLIC_APP_URL || "http://localhost:3000");
  if (!["http:", "https:"].includes(url.protocol))
    throw new Error("PUBLIC_APP_URL debe ser HTTP o HTTPS");
  return url.href.replace(/\/$/, "");
}
export class RssService {
  static async generar(tipo) {
    const proyectos = tipo === "proyectos",
      model = proyectos ? ProyectoModel : ColectivoModel;
    const filtro = proyectos
      ? await TerminosService.filtroProyectosPublicos()
      : { "moderacionTerminos.suspendido": { $ne: true } };
    const docs = await model.find(filtro).sort({ _id: -1 }).limit(100).lean();
    const base = baseApp();
    const items = docs
      .map(
        (d) =>
          `<item><title>${escaparXml(d.titulo || d.nombre)}</title><link>${escaparXml(`${base}/#${tipo}/${d._id}`)}</link><guid isPermaLink="false">urn:codigo-a-voluntad:${tipo}:${d._id}</guid><description>${escaparXml(d.descripcion)}</description><pubDate>${new Date(d.createdAt || d._id.getTimestamp()).toUTCString()}</pubDate></item>`,
      )
      .join("");
    return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Código a Voluntad - Nuevos ${tipo}</title><link>${escaparXml(base)}</link><description>Novedades públicas de la comunidad</description><language>es-ar</language>${items}</channel></rss>`;
  }
}

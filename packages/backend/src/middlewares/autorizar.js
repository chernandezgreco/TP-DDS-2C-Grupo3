import {
  ProyectoModel,
  ColaboracionModel,
  PostulacionModel,
} from "../models/indexModel.js";
import { requiereAdministracion } from "./requiereAdministracion.js";
const read = (req) => ["GET", "HEAD", "OPTIONS"].includes(req.method);
export async function autorizar(req, res, next) {
  try {
    const path = req.path;
    if (path.startsWith("/admin/")) return next(); // Las rutas administrativas validan su Bearer propio.
    if (!read(req)) {
      const origin = req.get("Origin");
      const allowed = (process.env.ALLOWED_ORIGINS || "http://localhost:3000")
        .split(",")
        .map((x) => x.trim());
      if (
        origin &&
        !allowed.includes(origin) &&
        origin !== `${req.protocol}://${req.get("host")}`
      )
        return res
          .status(403)
          .json({ error: "Origen de solicitud no autorizado." });
    }
    if (path === "/habilidades" && !read(req))
      return requiereAdministracion(req, res, next);
    const sensitive =
      /\/notificaciones$|\/proyectos-potenciales$|\/colaboradoras-potenciales$|\/postulaciones\//.test(
        path,
      );
    if (read(req) && !sensitive) return next();
    if (!req.actor)
      return res.status(401).json({ error: "Iniciá sesión para continuar." });
    const deny = () =>
      res
        .status(403)
        .json({ error: "No tenés permiso para realizar esta acción." });
    const parts = path.split("/").filter(Boolean);
    if (parts[0] === "colectivos") {
      if (parts[1] === "colaboraciones") {
        const c = await ColaboracionModel.findById(parts[2]);
        const p = c && (await ProyectoModel.findById(c.proyectoId));
        return req.actor.type === "colectivos" &&
          p?.colectivoId === req.actor.id
          ? next()
          : deny();
      }
      if (req.actor.type !== "colectivos" || parts[1] !== req.actor.id)
        return deny();
      if (parts[2] === "proyectos" && parts[3]) {
        const p = await ProyectoModel.findById(parts[3]);
        if (!p || p.colectivoId !== req.actor.id) return deny();
        if (parts[4] === "postulaciones" && parts[5] && !read(req)) {
          const post = await PostulacionModel.findById(parts[5]);
          if (!post || post.proyectoId !== parts[3]) return deny();
        }
      }
      return next();
    }
    if (parts[0] === "colaboradoras")
      return req.actor.type === "colaboradoras" && parts[1] === req.actor.id
        ? next()
        : deny();
    if (parts[0] === "proyectos") {
      if (parts[2] === "postularse")
        return req.actor.type === "colaboradoras" &&
          req.body?.colaboradoraId === req.actor.id
          ? next()
          : deny();
      const p = await ProyectoModel.findById(parts[1]);
      return req.actor.type === "colectivos" && p?.colectivoId === req.actor.id
        ? next()
        : deny();
    }
    if (parts[0] === "notificaciones")
      return req.actor.type === "colectivos" &&
        req.body?.colectivoId === req.actor.id
        ? next()
        : deny();
    return deny();
  } catch (e) {
    next(e);
  }
}

import { Router } from "express";
import { z } from "zod";
import { validar } from "../middlewares/validar.js";
import { requiereAdministracion } from "../middlewares/requiereAdministracion.js";
import { TerminosService } from "../services/TerminosService.js";
import { RssService } from "../services/RssService.js";
const router = Router();
router.get("/terminos/actual", async (req, res) =>
  res.json(await TerminosService.actual()),
);
router.get("/admin/terminos/estado", requiereAdministracion, async (req, res) =>
  res.json(await TerminosService.estado()),
);
router.post(
  "/admin/terminos",
  requiereAdministracion,
  validar(
    z
      .object({
        titulo: z.string().trim().min(1).max(200),
        contenido: z.string().trim().min(1).max(50000),
      })
      .strict(),
  ),
  async (req, res) =>
    res.status(201).json(await TerminosService.publicar(req.body)),
);
router.post(
  "/admin/terminos/revisiones",
  requiereAdministracion,
  validar(
    z
      .object({
        recurso: z.enum(["proyectos", "colectivos"]),
        recursoId: z.string().regex(/^[a-f\d]{24}$/i),
        suspendido: z.boolean(),
        motivo: z.string().trim().min(1).max(2000),
      })
      .strict(),
  ),
  async (req, res) => res.json(await TerminosService.revisar(req.body)),
);
for (const tipo of ["proyectos", "colectivos"])
  router.get(`/rss/${tipo}.xml`, async (req, res) =>
    res
      .type("application/rss+xml")
      .set("Cache-Control", "public, max-age=60")
      .send(await RssService.generar(tipo)),
  );
export default router;

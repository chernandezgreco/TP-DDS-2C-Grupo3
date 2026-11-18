import { Router } from "express";
import { requiereSesion } from "../middlewares/requiereSesion.js";
import { crearLimiteExportacion } from "../middlewares/limiteExportacion.js";
import { validarQuery } from "../middlewares/validar.js";
import { exportacionQuerySchema } from "../schemas/PortabilidadSchema.js";
import { PortabilidadController } from "../controllers/PortabilidadController.js";

// Fábrica: cada app tiene su propio contador del límite de exportaciones
export function crearRutasPortabilidad(opcionesLimite) {
  const router = Router();

  router.get(
    "/mi/exportacion",
    requiereSesion,
    // se valida antes de contar: un formato inválido no consume la cuota de descargas
    validarQuery(exportacionQuerySchema),
    crearLimiteExportacion(opcionesLimite),
    PortabilidadController.exportarMisDatos,
  );

  return router;
}

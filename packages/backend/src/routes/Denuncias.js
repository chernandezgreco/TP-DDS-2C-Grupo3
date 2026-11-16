import { Router } from "express";
import { validar } from "../middlewares/validar.js";
import { requiereAdministracion } from "../middlewares/requiereAdministracion.js";
import {
  actualizarEstadoDenuncia,
  crearDenuncia,
  listarDenuncias,
} from "../controllers/DenunciaController.js";
import {
  actualizarEstadoDenunciaSchema,
  crearDenunciaSchema,
} from "../schemas/DenunciaSchema.js";

const router = Router();

router.post("/denuncias", validar(crearDenunciaSchema), crearDenuncia);
router.get("/admin/denuncias", requiereAdministracion, listarDenuncias);
router.patch(
  "/admin/denuncias/:id/estado",
  requiereAdministracion,
  validar(actualizarEstadoDenunciaSchema),
  actualizarEstadoDenuncia,
);

export default router;

import { Router } from "express";
import { ColaboradoraController } from "../controllers/ColaboradoraController.js";
import { validar } from "../middlewares/validar.js";
import { crearColaboradoraSchema, medioContactoSchema, preferenciasSchema } from "../schemas/ColaboradoraSchema.js";
import { NotificacionController } from "../controllers/NotificacionController.js";

const router = Router();
router.post("/", validar(crearColaboradoraSchema), ColaboradoraController.crear);
router.get("/", ColaboradoraController.listar);
router.post("/:id/medios-contacto", validar(medioContactoSchema), ColaboradoraController.agregarMedioContacto);
router.patch("/:id/preferencias", validar(preferenciasSchema), ColaboradoraController.actualizarPreferencias);
router.get("/:id/notificaciones", NotificacionController.listarDeColaboradora);

export default router;

import { Router } from "express";
import { NotificacionController } from "../controllers/NotificacionController.js";
import { validar } from "../middlewares/validar.js";
import { crearNotificacionSchema } from "../schemas/NotificacionSchema.js";

const router = Router();
router.post("/", validar(crearNotificacionSchema), NotificacionController.crear);

export default router;

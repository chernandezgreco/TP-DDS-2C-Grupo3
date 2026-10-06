import { Router } from "express";
import { HabilidadController } from "../controllers/HabilidadController.js";
import { validar } from "../middlewares/validar.js";
import { crearHabilidadSchema } from "../schemas/HabilidadSchema.js";

const router = Router();
router.post("/", validar(crearHabilidadSchema), HabilidadController.crear);
router.get("/", HabilidadController.listar);

export default router;

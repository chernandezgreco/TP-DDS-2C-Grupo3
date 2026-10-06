import { Router } from "express";
import { ProyectoController } from "../controllers/ProyectoController.js";
import { validar } from "../middlewares/validar.js";
import { anotarColaboradoraSchema } from "../schemas/ProyectoSchema.js";

const router = Router();

router.get("/", ProyectoController.listar);
router.post("/:proyectoId/colaboraciones", validar(anotarColaboradoraSchema), ProyectoController.anotarColaboradora);
router.get("/:proyectoId/colaboradoras", ProyectoController.listarColaboradoras);

export default router;

import { Router } from "express";
import { ColectivoController } from "../controllers/ColectivoController.js";
import { ProyectoController } from "../controllers/ProyectoController.js";
import { validar } from "../middlewares/validar.js";
import { crearColectivoSchema } from "../schemas/ColectivoSchema.js";
import { crearProyectoSchema, cerrarProyectoSchema } from "../schemas/ProyectoSchema.js";

const router = Router();
router.post("/", validar(crearColectivoSchema), ColectivoController.crear);
router.get("/", ColectivoController.listar);

router.post("/:colectivoId/proyectos", validar(crearProyectoSchema), ProyectoController.crear);
router.patch("/:colectivoId/proyectos/:proyectoId", validar(cerrarProyectoSchema), ProyectoController.cerrar);

export default router;

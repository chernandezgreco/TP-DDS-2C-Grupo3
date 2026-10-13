import { Router } from "express";
import { PerfilesController } from "../controllers/PerfilesController.js";
import { validar } from "../middlewares/validar.js";
import { actualizarPerfilSchema, crearPerfilSchema } from "../schemas/PerfilSchema.js";

// Se monta en /api/proyectos/:proyectoId/perfiles
const router = Router({ mergeParams: true });

router.get("/", PerfilesController.listar);
router.post("/", validar(crearPerfilSchema), PerfilesController.crear);
router.get("/:perfilId", PerfilesController.obtener);
router.put("/:perfilId", validar(actualizarPerfilSchema), PerfilesController.actualizar);
router.delete("/:perfilId", PerfilesController.eliminar);
router.get("/:perfilId/colaboradoras-potenciales", PerfilesController.buscarColaboradorasPotenciales);

export default router;

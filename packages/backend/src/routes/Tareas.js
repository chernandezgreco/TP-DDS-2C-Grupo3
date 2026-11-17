import { Router } from "express";
import { TareaController } from "../controllers/TareaController.js";
import { validar } from "../middlewares/validar.js";
import { actualizarTareaSchema, crearTareaSchema } from "../schemas/TareaSchema.js";

const router = Router({ mergeParams: true });

router.post("/", validar(crearTareaSchema), TareaController.crear);
router.get("/", TareaController.listar);
router.get("/:tareaId", TareaController.obtener);
router.put("/:tareaId", validar(actualizarTareaSchema), TareaController.actualizar);
router.delete("/:tareaId", TareaController.eliminar);

export default router;

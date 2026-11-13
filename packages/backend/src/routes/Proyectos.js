import { Router } from "express";
import { ProyectoController } from "../controllers/ProyectoController.js";
import { validar } from "../middlewares/validar.js";
import { anotarPostulacionaSchema } from "../schemas/ProyectoSchema.js";

const router = Router();

router.get("/", ProyectoController.listar);
router.get("/:proyectoId", ProyectoController.obtener);
//3era
router.post(
  "/:proyectoId/postularse",
  validar(anotarPostulacionaSchema),
  ProyectoController.anotarPostulacion,
);
router.get(
  "/:proyectoId/colaboradoras",
  ProyectoController.listarColaboradoras,
);

export default router;

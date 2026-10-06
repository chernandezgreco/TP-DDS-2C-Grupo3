import { Router } from "express";
import { ColaboradoraController } from "../controllers/ColaboradoraController.js";
import { validar } from "../middlewares/validar.js";
import { crearColaboradoraSchema } from "../schemas/ColaboradoraSchema.js";

const router = Router();
router.post("/", validar(crearColaboradoraSchema), ColaboradoraController.crear);
router.get("/", ColaboradoraController.listar);

export default router;

import { Router } from "express";
import { ColaboracionController } from "../controllers/ColaboracionController.js";

const router = Router();

router.get("/", ColaboracionController.listar);
router.get("/:colaboracionId", ColaboracionController.obtenerPorId);

export default router;

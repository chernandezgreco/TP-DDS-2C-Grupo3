import { Router } from "express";
import {
  callbackLinkedIn,
  conectarLinkedIn,
  desconectarLinkedIn,
  estadoLinkedIn,
  importarPerfilLinkedIn,
  publicarLogroLinkedIn,
} from "../controllers/LinkedInController.js";

const router = Router();

router.get("/integraciones/linkedin", estadoLinkedIn);
router.get("/integraciones/linkedin/conectar", conectarLinkedIn);
router.get("/integraciones/linkedin/callback", callbackLinkedIn);
router.post("/integraciones/linkedin/importar", importarPerfilLinkedIn);
router.post("/integraciones/linkedin/publicar-logro", ...publicarLogroLinkedIn);
router.delete("/integraciones/linkedin", desconectarLinkedIn);

export default router;

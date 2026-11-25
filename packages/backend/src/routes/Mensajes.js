import { Router } from "express";
import { NotificacionController } from "../controllers/NotificacionController.js";
import { validar } from "../middlewares/validar.js";
import { marcarMensajesVistosSchema } from "../schemas/NotificacionSchema.js";

// Se monta después de autorizar: ahí ya se exige sesión para /mi/* y se controla el origen de los POST.
// Sólo las colaboradoras reciben mensajes de colectivos.
const soloColaboradoras = (req, res, next) =>
  req.actor?.type === "colaboradoras"
    ? next()
    : res.status(403).json({ error: "Sólo las colaboradoras reciben mensajes." });

const router = Router();
router.get("/mi/mensajes/no-leidos", soloColaboradoras, NotificacionController.contarMisNoLeidas);
router.post(
  "/mi/mensajes/vistos",
  soloColaboradoras,
  validar(marcarMensajesVistosSchema),
  NotificacionController.marcarMisVistas,
);

export default router;

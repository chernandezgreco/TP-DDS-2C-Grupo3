import { Router } from "express";
import { LogroController } from "../controllers/LogroController.js";
import { validar } from "../middlewares/validar.js";
import {
    actualizarLogroSchema,
    crearLogroSchema,
} from "../schemas/LogroSchema.js";

const router = Router({ mergeParams: true });

router.post(
    "/",
    validar(crearLogroSchema),
    LogroController.crear,
);

router.get(
    "/",
    LogroController.listar,
);

router.get(
    "/:logroId",
    LogroController.obtener,
);

router.put(
    "/:logroId",
    validar(actualizarLogroSchema),
    LogroController.actualizar,
);

router.delete(
    "/:logroId",
    LogroController.eliminar,
);

export default router;
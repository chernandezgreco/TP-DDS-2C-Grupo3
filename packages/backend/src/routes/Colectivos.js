import { Router } from "express";
import { ColectivoController } from "../controllers/ColectivoController.js";
import { ProyectoController } from "../controllers/ProyectoController.js";
import { validar } from "../middlewares/validar.js";
import { crearColectivoSchema } from "../schemas/ColectivoSchema.js";
import { crearProyectoSchema, cerrarProyectoSchema } from "../schemas/ProyectoSchema.js";
import { ColaboracionController } from "../controllers/ColaboracionController.js";
import { PostulacionController } from "../controllers/PostulacionController.js";

const router = Router();
router.post("/", validar(crearColectivoSchema), ColectivoController.crear);
router.get("/", ColectivoController.listar);

router.post("/:colectivoId/proyectos", validar(crearProyectoSchema), ProyectoController.crear);
router.patch("/:colectivoId/proyectos/:proyectoId", validar(cerrarProyectoSchema), ProyectoController.cerrar);

router.patch("/:colectivoId/proyectos/:proyectoId/busqueda", ProyectoController.cambiarBusqueda);
//3era
router.get("/:colectivoId/proyectos/:proyectoId/postulaciones/pendientes", PostulacionController.listarPendientes);
router.get("/:colectivoId/proyectos/:proyectoId/postulaciones/procesadas", PostulacionController.listarProcesadas);

//router.get("/:colectivoId/proyectos/:proyectoId/postulaciones", PostulacionController.listarPostulaciones);


router.patch("/:colectivoId/proyectos/:proyectoId/postulaciones/:postulacionId", PostulacionController.cambiarEstado);


router.delete("/colaboraciones/:colaboracionId", ColaboracionController.darDeBaja);

export default router;
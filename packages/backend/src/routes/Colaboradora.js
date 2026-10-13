import { Router } from "express";
import { ColaboradoraController } from "../controllers/ColaboradoraController.js";
import { ProyectoController } from "../controllers/ProyectoController.js";
import { NotificacionController } from "../controllers/NotificacionController.js";
import { validar } from "../middlewares/validar.js";
import {
    agregarHabilidadSchema,
    crearColaboradoraSchema,
    medioContactoSchema,
    preferenciasSchema,
} from "../schemas/ColaboradoraSchema.js";

const router = Router();
router.post("/", validar(crearColaboradoraSchema), ColaboradoraController.crear);
router.get("/", ColaboradoraController.listar);
router.get("/:id", ColaboradoraController.obtener);
router.post("/:id/habilidades", validar(agregarHabilidadSchema), ColaboradoraController.agregarHabilidad);
router.post("/:id/medios-contacto", validar(medioContactoSchema), ColaboradoraController.agregarMedioContacto);
router.patch("/:id/preferencias", validar(preferenciasSchema), ColaboradoraController.actualizarPreferencias);
router.get("/:id/notificaciones", NotificacionController.listarDeColaboradora);
router.get("/:id/proyectos-potenciales", ProyectoController.buscarProyectosPotenciales);

export default router;

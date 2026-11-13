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
  actualizarColaboradoraSchema,
  contactosSchema,
} from "../schemas/ColaboradoraSchema.js";
import { ColaboracionController } from "../controllers/ColaboracionController.js";

const router = Router();
router.put(
  "/:id/medios-contacto",
  validar(contactosSchema),
  ColaboradoraController.actualizarContactos,
);
router.post(
  "/",
  validar(crearColaboradoraSchema),
  ColaboradoraController.crear,
);
router.get("/", ColaboradoraController.listar);
router.get("/:id", ColaboradoraController.obtener);
router.patch(
  "/:id",
  validar(actualizarColaboradoraSchema),
  ColaboradoraController.actualizar,
);
router.post(
  "/:id/habilidades",
  validar(agregarHabilidadSchema),
  ColaboradoraController.agregarHabilidad,
);
router.post(
  "/:id/medios-contacto",
  validar(medioContactoSchema),
  ColaboradoraController.agregarMedioContacto,
);
router.patch(
  "/:id/preferencias",
  validar(preferenciasSchema),
  ColaboradoraController.actualizarPreferencias,
);
router.get("/:id/notificaciones", NotificacionController.listarDeColaboradora);
router.get(
  "/:id/proyectos-potenciales",
  ProyectoController.buscarProyectosPotenciales,
);
//3era
router.delete(
  "/:colaboradoraId/proyectos/:proyectoId/baja",
  ColaboracionController.darDeBajaPersonal,
);
export default router;

import { TareaService } from "../services/TareaService.js";

// Los errores los traduce a status HTTP el middleware manejarErrores
export class TareaController {
    static async crear(req, res) {
        res.status(201).json(await TareaService.crear(req.params.proyectoId, req.body));
    }

    static async listar(req, res) {
        res.json(await TareaService.listar(req.params.proyectoId, req.actor));
    }

    static async obtener(req, res) {
        res.json(await TareaService.obtener(req.params.proyectoId, req.params.tareaId, req.actor));
    }

    static async actualizar(req, res) {
        res.json(await TareaService.actualizar(req.params.proyectoId, req.params.tareaId, req.body));
    }

    static async eliminar(req, res) {
        res.json(await TareaService.eliminar(req.params.proyectoId, req.params.tareaId));
    }
}

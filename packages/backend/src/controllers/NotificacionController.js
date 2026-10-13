import { NotificacionService } from "../services/NotificacionService.js";

export class NotificacionController {
    static async crear(req, res) {
        res.status(201).json(await NotificacionService.crear(req.body));
    }

    static async listarDeColaboradora(req, res) {
        res.json(await NotificacionService.listarDeColaboradora(req.params.id));
    }
}

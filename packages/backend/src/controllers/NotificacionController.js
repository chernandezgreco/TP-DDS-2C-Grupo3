import { NotificacionService } from "../services/NotificacionService.js";

export class NotificacionController {
    static crear(req, res) {
        res.status(201).json(NotificacionService.crear(req.body));
    }

    static listarDeColaboradora(req, res) {
        res.json(NotificacionService.listarDeColaboradora(req.params.id));
    }
}

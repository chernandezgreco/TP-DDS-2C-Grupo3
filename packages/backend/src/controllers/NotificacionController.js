import { NotificacionService } from "../services/NotificacionService.js";

export class NotificacionController {
    static async crear(req, res) {
        res.status(201).json(await NotificacionService.crear(req.body));
    }

    static async listarDeColaboradora(req, res) {
        res.json(await NotificacionService.listarDeColaboradora(req.params.id));
    }

    // las rutas /mi/mensajes operan siempre sobre la colaboradora de la sesión
    static async contarMisNoLeidas(req, res) {
        res.json({ cantidad: await NotificacionService.contarNoLeidas(req.actor.id) });
    }

    static async marcarMisVistas(req, res) {
        res.json(await NotificacionService.marcarVistas(req.actor.id, req.body.hasta));
    }
}

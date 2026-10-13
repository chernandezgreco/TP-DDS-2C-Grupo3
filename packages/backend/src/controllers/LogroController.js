import { LogroService } from "../services/LogroService.js";

export class LogroController {
    static async crear(req, res) {
        const logro = await LogroService.crear(
            req.params.proyectoId,
            req.body,
        );

        return res.status(201).json(logro);
    }

    static async listar(req, res) {
        const logros = await LogroService.listar(
            req.params.proyectoId,
        );

        return res.json(logros);
    }

    static async obtener(req, res) {
        const logro = await LogroService.obtener(
            req.params.proyectoId,
            req.params.logroId,
        );

        return res.json(logro);
    }

    static async actualizar(req, res) {
        const logro = await LogroService.actualizar(
            req.params.proyectoId,
            req.params.logroId,
            req.body,
        );

        return res.json(logro);
    }

    static async eliminar(req, res) {
        const logro = await LogroService.eliminar(
            req.params.proyectoId,
            req.params.logroId,
        );

        return res.json(logro);
    }
}
import { LogroService } from "../services/LogroService.js";

export class LogroController {
    static crear(req, res) {
        const logro = LogroService.crear(
            req.params.proyectoId,
            req.body,
        );

        return res.status(201).json(logro);
    }

    static listar(req, res) {
        const logros = LogroService.listar(
            req.params.proyectoId,
        );

        return res.json(logros);
    }

    static obtener(req, res) {
        const logro = LogroService.obtener(
            req.params.proyectoId,
            req.params.logroId,
        );

        return res.json(logro);
    }

    static actualizar(req, res) {
        const logro = LogroService.actualizar(
            req.params.proyectoId,
            req.params.logroId,
            req.body,
        );

        return res.json(logro);
    }

    static eliminar(req, res) {
        const logro = LogroService.eliminar(
            req.params.proyectoId,
            req.params.logroId,
        );

        return res.json(logro);
    }
}
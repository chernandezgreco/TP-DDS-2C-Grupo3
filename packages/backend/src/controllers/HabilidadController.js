import { HabilidadService } from "../services/HabilidadService.js";

export class HabilidadController {
    static async crear(req, res) {
        res.status(201).json(await HabilidadService.crearHabilidad(req.body));
    }

    static async listar(req, res) {
        res.json(await HabilidadService.listar());
    }
}

import { HabilidadService } from "../services/HabilidadService.js";

export class HabilidadController {
    static crear(req, res) {
        res.status(201).json(HabilidadService.crearHabilidad(req.body));
    }

    static listar(req, res) {
        res.json(HabilidadService.listar());
    }
}

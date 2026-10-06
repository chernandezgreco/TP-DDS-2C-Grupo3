import { ColectivoService } from "../services/ColectivosService.js";

export class ColectivoController {
    static crear(req, res) {
        res.status(201).json(ColectivoService.crearColectivo(req.body));
    }

    static listar(req, res) {
        res.json(ColectivoService.listar());
    }
}

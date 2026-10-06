import { ColaboracionService } from "../services/ColaboracionService.js";

export class ColaboracionController {
    static listar(req, res) {
        res.json(ColaboracionService.listar());
    }

    static obtenerPorId(req, res) {
        res.json(ColaboracionService.obtenerPorId(req.params.colaboracionId));
    }
}

import { ColaboracionService } from "../services/ColaboracionService.js";

export class ColaboracionController {
    static async listar(req, res) {
        res.json(await ColaboracionService.listar());
    }

    static async obtenerPorId(req, res) {
        res.json(await ColaboracionService.obtenerPorId(req.params.colaboracionId));
    }
}

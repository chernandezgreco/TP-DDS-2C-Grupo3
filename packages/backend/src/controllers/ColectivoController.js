import { ColectivoService } from "../services/ColectivosService.js";

export class ColectivoController {
    static async crear(req, res) {
        res.status(201).json(await ColectivoService.crearColectivo(req.body));
    }

    static async listar(req, res) {
        res.json(await ColectivoService.listar());
    }
}

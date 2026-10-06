import { ColaboradoraService } from "../services/ColaboradoraService.js";

export class ColaboradoraController {
    static crear(req, res) {
        res.status(201).json(ColaboradoraService.crearColaboradora(req.body));
    }

    static listar(req, res) {
        res.json(ColaboradoraService.listar());
    }
}

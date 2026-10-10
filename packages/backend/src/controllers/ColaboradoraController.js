import { ColaboradoraService } from "../services/ColaboradoraService.js";

export class ColaboradoraController {
    static crear(req, res) {
        res.status(201).json(ColaboradoraService.crearColaboradora(req.body));
    }

    static listar(req, res) {
        res.json(ColaboradoraService.listar());
    }

    static agregarMedioContacto(req, res) {
        res.status(201).json(ColaboradoraService.agregarMedioContacto(req.params.id, req.body));
    }

    static actualizarPreferencias(req, res) {
        res.json(ColaboradoraService.actualizarPreferencias(req.params.id, req.body));
    }
}

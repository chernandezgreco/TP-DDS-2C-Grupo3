import { ColaboradoraService } from "../services/ColaboradoraService.js";

export class ColaboradoraController {
    static async crear(req, res) {
        res.status(201).json(await ColaboradoraService.crearColaboradora(req.body));
    }

    static async listar(req, res) {
        res.json(await ColaboradoraService.listar());
    }

    static async obtener(req, res) {
        res.json(await ColaboradoraService.obtenerPorId(req.params.id));
    }

    static async agregarHabilidad(req, res) {
        res.status(201).json(await ColaboradoraService.agregarHabilidad(req.params.id, req.body));
    }

    static async agregarMedioContacto(req, res) {
        res.status(201).json(await ColaboradoraService.agregarMedioContacto(req.params.id, req.body));
    }

    static async actualizarPreferencias(req, res) {
        res.json(await ColaboradoraService.actualizarPreferencias(req.params.id, req.body));
    }
}

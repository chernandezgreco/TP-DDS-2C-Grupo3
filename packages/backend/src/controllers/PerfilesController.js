import { PerfilesService } from "../services/PerfilesService.js";

export class PerfilesController {
    static async listar(req, res) {
        res.json(await PerfilesService.listar(req.params.proyectoId));
    }

    static async obtener(req, res) {
        res.json(await PerfilesService.obtener(req.params.proyectoId, req.params.perfilId));
    }

    static async crear(req, res) {
        res.status(201).json(await PerfilesService.crear(req.params.proyectoId, req.body));
    }

    static async actualizar(req, res) {
        res.json(await PerfilesService.actualizar(req.params.proyectoId, req.params.perfilId, req.body));
    }

    static async eliminar(req, res) {
        res.json(await PerfilesService.eliminar(req.params.proyectoId, req.params.perfilId));
    }

    static async buscarColaboradorasPotenciales(req, res) {
        res.json(await PerfilesService.buscarColaboradorasPotenciales(req.params.proyectoId, req.params.perfilId));
    }
}

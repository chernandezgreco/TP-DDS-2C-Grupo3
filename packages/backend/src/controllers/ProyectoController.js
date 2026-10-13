import { ProyectoService } from "../services/ProyectoService.js";

// Los errores los traduce a status HTTP el middleware manejarErrores
export class ProyectoController {
    static async listar(req, res) {
        res.json(await ProyectoService.listar());
    }

    static async obtener(req, res) {
        res.json(await ProyectoService.obtenerPorId(req.params.proyectoId));
    }

    static async crear(req, res) {
        res.status(201).json(await ProyectoService.crearProyecto(req.body, req.params.colectivoId));
    }

    static async cerrar(req, res) {
        res.json(await ProyectoService.cerrarProyecto(req.params.colectivoId, req.params.proyectoId));
    }

    static async anotarColaboradora(req, res) {
        res.status(201).json(await ProyectoService.anotarColaboradora(req.params.proyectoId, req.body));
    }

    static async listarColaboradoras(req, res) {
        res.json(await ProyectoService.listarColaboradoras(req.params.proyectoId));
    }

    static async buscarProyectosPotenciales(req, res) {
        res.json(await ProyectoService.buscarProyectosPotenciales(req.params.id));
    }
}

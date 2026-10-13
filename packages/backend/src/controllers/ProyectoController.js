import { ProyectoService } from "../services/ProyectoService.js";

export class ProyectoController {
    static async listar(req, res) {
        try {
            const proyectos = await ProyectoService.listar();
            res.json(proyectos);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async crear(req, res) {
        try {
            const proyecto = await ProyectoService.crearProyecto(req.body, req.params.colectivoId);
            res.status(201).json(proyecto);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    static async cerrar(req, res) {
        try {
            const proyecto = await ProyectoService.cerrarProyecto(req.params.colectivoId, req.params.proyectoId);
            res.json({ message: "Proyecto cerrado con éxito", proyecto });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    static async anotarColaboradora(req, res) {
        try {
            const colaboracion = await ProyectoService.anotarColaboradora(req.params.proyectoId, req.body.colaboradoraId, req.body.anonimidad);
            res.status(201).json(colaboracion);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    static async listarColaboradoras(req, res) {
        try {
            const colaboradoras = await ProyectoService.listarColaboradoras(req.params.proyectoId);
            res.json(colaboradoras);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async listarPerfiles(req, res) {
        try {
            const { id: proyectoId } = req.params;
            const perfiles = await ProyectoService.listarPerfilesPorProyecto(proyectoId);
            return res.status(200).json(perfiles);
        } catch (error) {
            return res.status(404).json({ error: error.message });
        }
    }
}

import { ProyectoService } from "../services/ProyectoService.js";

export class ProyectoController {
    static listar(req, res) {
        res.json(ProyectoService.listar());
    }

    static crear(req, res) {
        const proyecto = ProyectoService.crearProyecto(req.body, req.params.colectivoId);
        res.status(201).json(proyecto);
    }

    static cerrar(req, res) {
        const proyecto = ProyectoService.cerrarProyecto(req.params.colectivoId, req.params.proyectoId);
        res.json({ message: "Proyecto cerrado con éxito", proyecto });
    }

    static anotarColaboradora(req, res) {
        const colaboracion = ProyectoService.anotarColaboradora(req.params.proyectoId, req.body.colaboradoraId, req.body.anonimidad);
        res.status(201).json(colaboracion);
    }

    static listarColaboradoras(req, res) {
        res.json(ProyectoService.listarColaboradoras(req.params.proyectoId));
    }

   
}

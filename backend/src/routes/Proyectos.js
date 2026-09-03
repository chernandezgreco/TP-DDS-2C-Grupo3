import { Router } from "express";
import { ProyectoService } from "../services/ProyectoService.js";

const router = Router();

router.post("/", (req, res) => {
    try {
        const proyecto = ProyectoService.crearProyecto(req.body);
        res.status(201).json(proyecto);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.get("/", (req, res) => {
    try {
        const proyectos = ProyectoService.listar();
        res.json(proyectos);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.post("/:id/colaborar", (req, res) => {
    try {
        const { colaboradoraId } = req.body;
        const colaboracion = ProyectoService.anotarColaboradora(req.params.id, colaboradoraId);
        res.status(201).json(colaboracion);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.patch("/:id/cerrar", (req, res) => {
    try {
        const proyecto = ProyectoService.cerrarProyecto(req.params.id);
        res.json({ message: "Proyecto cerrado con éxito", proyecto });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

export default router;
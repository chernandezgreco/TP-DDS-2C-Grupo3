import { Router } from "express";
import { ProyectoService } from "../services/ProyectoService.js";

const router = Router();

router.get("/", (req, res) => {
    try {
        const proyectos = ProyectoService.listar();
        res.json(proyectos);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.post("/:proyectoId/colaboraciones", (req, res) => {
    try {
        const { colaboradoraId } = req.body ?? {};
        const colaboracion = ProyectoService.anotarColaboradora(
            req.params.proyectoId,
            colaboradoraId
        );
        res.status(201).json(colaboracion);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.get("/:proyectoId/colaboradoras", (req, res) => {
    try {
        const colaboradoras = ProyectoService.listarColaboradoras(req.params.proyectoId);
        res.json(colaboradoras);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

export default router;

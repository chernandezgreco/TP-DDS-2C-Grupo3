import { Router } from "express";
import { ColaboracionService } from "../services/ColaboracionService.js";

const router = Router();

router.get("/", (req, res) => {
    try {
        const colaboraciones = ColaboracionService.listar();
        res.json(colaboraciones);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.get("/:id", (req, res) => {
    try {
        const colaboracion = ColaboracionService.obtenerPorId(req.params.id);
        res.json(colaboracion);
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
});

export default router;
import { Router } from "express";
import { ColectivoService } from "../services/ColectivosService.js";
import { ProyectoService } from "../services/ProyectoService.js"; 

const router = Router();
router.post("/", (req, res) => {
    try { res.status(201).json(ColectivoService.crearColectivo(req.body)); }
    catch (e) { res.status(400).json({ error: e.message }); }
});
router.get("/", (req, res) => res.json(ColectivoService.listar()));

router.post("/:id/crearProyecto", (req, res) => {
    try {
        const proyecto = ProyectoService.crearProyecto(req.body,req.params.id);
        res.status(201).json(proyecto);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.patch("/:idColectivo/:idProyecto/cerrar", (req, res) => {
    try {
        const proyecto = ProyectoService.cerrarProyecto(req.params.idColectivo,req.params.idProyecto);
        res.json({ message: "Proyecto cerrado con éxito", proyecto });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});













export default router;

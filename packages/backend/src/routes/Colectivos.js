import { Router } from "express";
import { ColectivoService } from "../services/ColectivosService.js";
import { ProyectoService } from "../services/ProyectoService.js"; 

const router = Router();
router.post("/", (req, res) => {
    try { res.status(201).json(ColectivoService.crearColectivo(req.body)); }
    catch (e) { res.status(400).json({ error: e.message }); }
});
router.get("/", (req, res) => res.json(ColectivoService.listar()));

router.post("/:colectivoId/proyectos", (req, res) => {
    try {
        ProyectoService.cumpleHabilidades(req.body?.habilidadesRequeridas);
        const proyecto = ProyectoService.crearProyecto(req.body, req.params.colectivoId);
        res.status(201).json(proyecto);
   
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.patch("/:colectivoId/proyectos/:proyectoId", (req, res) => {
    try {
        if (req.body?.estado !== "FINALIZADO") {
            throw new Error("El estado debe ser FINALIZADO");
        }

        const proyecto = ProyectoService.cerrarProyecto(
            req.params.colectivoId,
            req.params.proyectoId
        );
        res.json({ message: "Proyecto cerrado con éxito", proyecto });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});













export default router;

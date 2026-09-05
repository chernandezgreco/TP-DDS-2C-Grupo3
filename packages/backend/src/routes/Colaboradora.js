import { Router } from "express";
import { ColaboradoraService } from "../services/ColaboradoraService.js";
import { ProyectoService } from "../services/ProyectoService.js";
const router = Router();
router.post("/", (req, res) => {
    try { res.status(201).json(ColaboradoraService.crearColaboradora(req.body)); }
    catch (e) { res.status(400).json({ error: e.message }); }
});
router.get("/", (req, res) => res.json(ColaboradoraService.listar()));
export default router;

router.post("/:idColaboradora/:idProyecto/Colaborar", (req, res) => {
        try { res.status(201).json(ProyectoService.anotarColaboradora(req.params.idProyecto,req.params.idColaboradora)); }
    catch (e) { res.status(400).json({ error: e.message }); }

});
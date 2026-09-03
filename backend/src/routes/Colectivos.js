import { Router } from "express";
import { ColectivoService } from "../services/ColectivosService.js";
const router = Router();
router.post("/", (req, res) => {
    try { res.status(201).json(ColectivoService.crearColectivo(req.body)); }
    catch (e) { res.status(400).json({ error: e.message }); }
});
router.get("/", (req, res) => res.json(ColectivoService.listar()));
export default router;
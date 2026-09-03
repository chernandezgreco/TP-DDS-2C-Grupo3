import { Router } from "express";
import { HabilidadService } from "../services/HabilidadService.js";
const router = Router();
router.post("/", (req, res) => {
    try { res.status(201).json(HabilidadService.crearHabilidad(req.body)); }
    catch (e) { res.status(400).json({ error: e.message }); }
});
router.get("/", (req, res) => res.json(HabilidadService.listar()));
export default router;
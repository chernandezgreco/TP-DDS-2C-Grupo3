import { Router } from "express";
import { ColaboradoraService } from "../services/ColaboradoraService.js";
const router = Router();
router.post("/", (req, res) => {
    try { res.status(201).json(ColaboradoraService.crearColaboradora(req.body)); }
    catch (e) { res.status(400).json({ error: e.message }); }
});
router.get("/", (req, res) => res.json(ColaboradoraService.listar()));
export default router;
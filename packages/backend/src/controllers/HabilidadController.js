import { HabilidadService } from "../services/HabilidadService.js";

export class HabilidadController {
    static async crear(req, res) {
        try {
            const nuevaHabilidad = await HabilidadService.crearHabilidad(req.body);
            res.status(201).json(nuevaHabilidad);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    static async listar(req, res) {
        try {
            const habilidades = await HabilidadService.listar();
            res.json(habilidades);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}
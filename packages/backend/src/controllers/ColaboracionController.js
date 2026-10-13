import { ColaboracionService } from "../services/ColaboracionService.js";

export class ColaboracionController {
    static async listar(req, res) {
        try {
            const colaboraciones = await ColaboracionService.listar();
            res.json(colaboraciones);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async obtenerPorId(req, res) {
        try {
            const colaboracion = await ColaboracionService.obtenerPorId(req.params.colaboracionId);
            if (!colaboracion) {
                return res.status(404).json({ error: "Colaboración no encontrada" });
            }
            res.json(colaboracion);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}
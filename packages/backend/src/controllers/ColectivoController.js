import { ColectivoService } from "../services/ColectivosService.js";

export class ColectivoController {
    static async crear(req, res) {
        try {
            const nuevoColectivo = await ColectivoService.crearColectivo(req.body);
            res.status(201).json(nuevoColectivo);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    static async listar(req, res) {
        try {
            const colectivos = await ColectivoService.listar();
            res.json(colectivos);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}
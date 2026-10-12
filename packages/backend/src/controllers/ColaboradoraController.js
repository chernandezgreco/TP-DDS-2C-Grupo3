import { ColaboradoraService } from "../services/ColaboradoraService.js";

export class ColaboradoraController {
    static async crear(req, res) {
        try {
            const nuevaColaboradora = await ColaboradoraService.crearColaboradora(req.body);
            res.status(201).json(nuevaColaboradora);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    static async listar(req, res) {
        try {
            const colaboradoras = await ColaboradoraService.listar();
            res.json(colaboradoras);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async agregarMedioContacto(req, res) {
        res.status(201).json(await ColaboradoraService.agregarMedioContacto(req.params.id, req.body));
    }

    static async actualizarPreferencias(req, res) {
        res.json(await ColaboradoraService.actualizarPreferencias(req.params.id, req.body));
    }
}

import { ColaboracionService } from "../services/ColaboracionService.js";

export class ColaboracionController {
    static async listar(req, res) {
        res.json(await ColaboracionService.listar());
    }

    static async obtenerPorId(req, res) {
        res.json(await ColaboracionService.obtenerPorId(req.params.colaboracionId));
    }
    static async darDeBaja(req, res, next) {
        try {
            const { colaboracionId } = req.params;
            const resultado = await ColaboracionService.darDeBaja(colaboracionId);
            return res.status(200).json(resultado);
        } catch (error) {
            next(error);
        }
    }
    static async darDeBajaPersonal(req, res, next) {
        try {
            const { proyectoId, colaboradoraId } = req.params;
            
            const resultado = await ColaboracionService.darDeBajaPorColaborador(proyectoId, colaboradoraId);
            
            return res.status(200).json(resultado);
        } catch (error) {
            next(error);
        }
    }
}

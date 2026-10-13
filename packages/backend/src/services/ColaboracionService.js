import { ColaboracionModel } from "../models/indexModel.js";
import { NotFoundError } from "../domain/errores.js";

export class ColaboracionService {
    static async listar() {
        return await ColaboracionModel.find();
    }

    static async obtenerPorId(id) {
        const colaboracion = await ColaboracionModel.findById(id);
        if (!colaboracion) {
            throw new NotFoundError("Colaboración no encontrada", { colaboracionId: id });
        }
        return colaboracion;
    }  
}
import { db } from "../data/db.js";
import { Colaboracion } from "../domain/Colaboracion/Colaboracion.js";

export class ColaboracionService {
    static listar() {
        return db.colaboraciones;
    }

    static obtenerPorId(id) {
        const colaboracion = db.colaboraciones.find(c => c.id === id);
        if (!colaboracion) {
            throw new Error("Colaboración no encontrada");
        }
        return colaboracion;
    }
}
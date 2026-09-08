import { db } from "../data/db.js";
import { Habilidad } from "../domain/Habilidad/Habilidad.js";

export class HabilidadService {
    static crearHabilidad(data) {
        if (!data || typeof data !== "object") {
            throw new Error("Los datos de la habilidad son obligatorios");
        }
        if (typeof data.titulo !== "string" || !data.titulo.trim()) {
            throw new Error("El título de la habilidad es obligatorio");
        }
        if (typeof data.descripcion !== "string" || !data.descripcion.trim()) {
            throw new Error("La descripción de la habilidad es obligatoria");
        }

        const codigo = data.titulo.toLowerCase().trim().replace(/\s+/g, '-');
        const habilidadExistente = db.habilidades.some(habilidad => habilidad.codigo === codigo);

        if (habilidadExistente) {
            throw new Error("La habilidad ya existe");
        }

        const nueva = new Habilidad(codigo, data.titulo, data.descripcion);
        db.habilidades.push(nueva);
        return nueva;
    }
    static listar() { return db.habilidades; }
}

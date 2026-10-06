import { db } from "../data/db.js";
import { Habilidad } from "../domain/Habilidad/Habilidad.js";
import { ConflictError } from "../domain/errores.js";

export class HabilidadService {
    static crearHabilidad(data) {
        const codigo = data.titulo.toLowerCase().trim().replace(/\s+/g, '-');
        const nueva = new Habilidad(codigo, data.titulo, data.descripcion);

        const habilidadExistente = db.habilidades.find(habilidad => habilidad.codigo === nueva.codigo);

        if (habilidadExistente) {
            throw new ConflictError("La habilidad ya existe", { habilidadExistente });
        }

        db.habilidades.push(nueva);
        return nueva;
    }
    static listar() { return db.habilidades; }
}

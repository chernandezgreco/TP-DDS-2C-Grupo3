import { db } from "../data/db.js";
import { Habilidad } from "../domain/Habilidad/Habilidad.js";

export class HabilidadService {
    static crearHabilidad(data) {
        const codigo = data.titulo.toLowerCase().trim().replace(/\s+/g, '-');
        const nueva = new Habilidad(codigo, data.titulo, data.descripcion);
        db.habilidades.push(nueva);
        return nueva;
    }
    static listar() { return db.habilidades; }
}
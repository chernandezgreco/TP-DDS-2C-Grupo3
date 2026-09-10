import { db } from "../data/db.js";
import { Colectivo } from "../domain/Colectivo/Colectivo.js";
import { v4 as uuidv4 } from "uuid";

export class ColectivoService {
    static crearColectivo(data) {
        if (!data || typeof data !== "object") {
            throw new Error("Los datos del colectivo son obligatorios");
        }
        if (typeof data.nombre !== "string" || !data.nombre.trim()) {
            throw new Error("El nombre del colectivo es obligatorio");
        }
        if (typeof data.descripcion !== "string" || !data.descripcion.trim()) {
            throw new Error("La descripción del colectivo es obligatoria");
        }
        if (typeof data.tipo !== "string" || !data.tipo.trim()) {
            throw new Error("El tipo de colectivo es obligatorio");
        }

        const nuevo = new Colectivo(uuidv4(), data.nombre, data.descripcion, data.ubicacion, data.tipo);
        db.colectivos.push(nuevo);
        return nuevo;
    }
    static listar() { return db.colectivos;
     }


}

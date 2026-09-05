import { db } from "../data/db.js";
import { Colectivo } from "../domain/Colectivo/Colectivo.js";
import { Proyecto } from "../domain/Proyecto/Proyecto.js";
import { v4 as uuidv4 } from "uuid";

export class ColectivoService {
    static crearColectivo(data) {
        const nuevo = new Colectivo(uuidv4(), data.nombre, data.descripcion, data.ubicacion, data.tipo);
        db.colectivos.push(nuevo);
        return nuevo;
    }
    static listar() { return db.colectivos;
     }


}
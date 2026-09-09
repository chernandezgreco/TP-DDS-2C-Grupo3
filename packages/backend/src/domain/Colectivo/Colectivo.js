import { TipoColectivo } from "./TipoColectivo.js";

export class Colectivo {
    constructor(id, nombre, descripcion, ubicacion, tipo) {
        if (!Object.values(TipoColectivo).includes(tipo)) {
            throw new Error("El tipo de colectivo no es válido");
        }

        this.id = id;
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.ubicacion = ubicacion;
        this.tipo = tipo;
    }
}

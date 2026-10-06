import { TipoColectivo } from "./TipoColectivo.js";
import { esTextoNoVacio } from "../validaciones.js";
import { DomainError } from "../errores.js";

export class Colectivo {
    constructor(id, nombre, descripcion, ubicacion, tipo) {
        if (!esTextoNoVacio(nombre)) {
            throw new DomainError("El nombre del colectivo es obligatorio", { campo: "nombre" });
        }
        if (!esTextoNoVacio(descripcion)) {
            throw new DomainError("La descripción del colectivo es obligatoria", { campo: "descripcion" });
        }
        if (!Object.values(TipoColectivo).includes(tipo)) {
            throw new DomainError("El tipo de colectivo no es válido", {
                campo: "tipo",
                valor: tipo,
                tiposValidos: Object.values(TipoColectivo),
            });
        }

        this.id = id;
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.ubicacion = ubicacion;
        this.tipo = tipo;
    }
}

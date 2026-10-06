import { esTextoNoVacio } from "../validaciones.js";
import { DomainError } from "../errores.js";

export class Habilidad {
    constructor(codigo, titulo, descripcion) {
        if (!esTextoNoVacio(titulo)) {
            throw new DomainError("El título de la habilidad es obligatorio", { campo: "titulo" });
        }
        if (!esTextoNoVacio(descripcion)) {
            throw new DomainError("La descripción de la habilidad es obligatoria", { campo: "descripcion" });
        }

        this.codigo = codigo;
        this.titulo = titulo;
        this.descripcion = descripcion;
    }
}

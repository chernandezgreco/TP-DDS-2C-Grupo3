import { esTextoNoVacio } from "../validaciones.js";
import { DomainError } from "../errores.js";

export class Notificacion {
    constructor(id, colaboradoraId, colectivoId, proyectoId, texto, fecha = new Date()) {
        if (!esTextoNoVacio(texto)) {
            throw new DomainError("El texto de la notificación es obligatorio", { campo: "texto" });
        }

        this.id = id;
        this.colaboradoraId = colaboradoraId;
        this.colectivoId = colectivoId;
        this.proyectoId = proyectoId;
        this.texto = texto.trim();
        this.fecha = fecha;
    }
}

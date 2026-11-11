import { EstadoPostulacion } from "./EstadoPostulacion.js";
import { DomainError } from "../errores.js";

export class Postulacion {
    constructor(id, proyectoId, perfilId, colaboradoraId, estado = EstadoPostulacion.PENDIENTE, fechaCreacion = new Date()) {
        if (!Object.values(EstadoPostulacion).includes(estado)) {
            throw new DomainError("El estado de la postulacion no es válido", {
                estado,
                estadosValidos: Object.values(EstadoPostulacion),
            });
        }

        this.id = id;
        this.proyectoId = proyectoId;
        this.perfilId = perfilId;
        this.colaboradoraId = colaboradoraId;
        this.estado = estado;
        this.fechaCreacion = fechaCreacion;
    }
    aceptar() {
    
    if (this.estado === "ACEPTADA") {
        throw new DomainError("Esta postulación ya fue aceptada anteriormente.");
    }
    
    
    if (this.estado === "RECHAZADA") {
        throw new DomainError("No se puede aceptar una postulación que ya fue rechazada.");
    }

    if (this.estado !== "PENDIENTE") {
        throw new DomainError("Solo se pueden aceptar postulaciones pendientes.");
    }

    this.estado = "ACEPTADA";
}

    rechazar() {
        if (this.estado !== "PENDIENTE") {
            throw new DomainError("Solo se pueden rechazar postulaciones pendientes");
        }
        this.estado = "RECHAZADA";
    }
}

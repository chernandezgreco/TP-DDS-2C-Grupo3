import { EstadoColaboracion } from "./EstadoColaboracion.js";
import { DomainError } from "../errores.js";

export class Colaboracion {
    constructor(id, proyectoId, perfilId, colaboradoraId, estado = EstadoColaboracion.PENDIENTE, fechaCreacion = new Date()) {
        if (!Object.values(EstadoColaboracion).includes(estado)) {
            throw new DomainError("El estado de la colaboración no es válido", {
                estado,
                estadosValidos: Object.values(EstadoColaboracion),
            });
        }

        this.id = id;
        this.proyectoId = proyectoId;
        this.perfilId = perfilId;
        this.colaboradoraId = colaboradoraId;
        this.estado = estado;
        this.fechaCreacion = fechaCreacion;
    }
}

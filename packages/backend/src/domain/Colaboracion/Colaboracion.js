import { EstadoColaboracion } from "./EstadoColaboracion.js";
import { ConflictError, DomainError } from "../errores.js";

export class Colaboracion {
    constructor(id, proyectoId, perfilId, colaboradoraId, estado = EstadoColaboracion.ACTIVA, fechaCreacion = new Date(), fechaBaja = null) {
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
        this.fechaBaja = fechaBaja;
    }

    estaActiva() {
        return this.estado === EstadoColaboracion.ACTIVA;
    }

    // la baja es permanente: se conserva el registro como historial y no hay forma de reactivarlo
    darDeBaja(fecha = new Date()) {
        if (!this.estaActiva()) {
            throw new ConflictError("La colaboración ya fue dada de baja", { colaboracionId: this.id });
        }
        this.estado = EstadoColaboracion.TERMINADA;
        this.fechaBaja = fecha;
    }
}

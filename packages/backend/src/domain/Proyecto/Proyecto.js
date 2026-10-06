import { Compromiso } from "../Compromiso/Compromiso.js";
import { ModalidadColaboracion } from "../ModalidadColaboracion/ModalidadColaboracion.js";
import { EstadoProyecto } from "./EstadoProyecto.js";
import { esTextoNoVacio } from "../validaciones.js";
import { DomainError } from "../errores.js";

export class Proyecto {
    constructor(id, titulo, descripcion, habilidadesRequeridas, compromiso, modalidad, colectivoId) {
        if (!esTextoNoVacio(titulo)) {
            throw new DomainError("El título del proyecto es obligatorio", { campo: "titulo" });
        }
        if (!esTextoNoVacio(descripcion)) {
            throw new DomainError("La descripción del proyecto es obligatoria", { campo: "descripcion" });
        }
        if (!Array.isArray(habilidadesRequeridas) || habilidadesRequeridas.length === 0) {
            throw new DomainError("El proyecto debe requerir al menos una habilidad", { campo: "habilidadesRequeridas" });
        }

        if (!(compromiso instanceof Compromiso)) {
            throw new DomainError("El compromiso del proyecto no es válido", { campo: "compromiso" });
        }

        if (!(modalidad instanceof ModalidadColaboracion)) {
            throw new DomainError("La modalidad de colaboración del proyecto no es válida", { campo: "modalidad" });
        }

        this.id = id;
        this.titulo = titulo;
        this.descripcion = descripcion;
        this.habilidadesRequeridas = habilidadesRequeridas;
        this.compromiso = compromiso;
        this.modalidad = modalidad;
        this.colectivoId = colectivoId;
        this.estado = EstadoProyecto.ACTIVO;
    }

    updateEstado(newEstado) {
    if (!(newEstado in EstadoProyecto)) {
        throw new DomainError(`Estado inválido: ${newEstado}`, {
            estado: newEstado,
            estadosValidos: Object.values(EstadoProyecto),
        });
    }

    this.estado = EstadoProyecto[newEstado];
    }

    estaActivo() {
        return this.estado === EstadoProyecto.ACTIVO;
    }
}

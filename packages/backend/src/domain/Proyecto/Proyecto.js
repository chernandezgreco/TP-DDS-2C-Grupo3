import { Compromiso } from "../Compromiso/Compromiso.js";
import { ModalidadColaboracion } from "../ModalidadColaboracion/ModalidadColaboracion.js";
import { EstadoProyecto } from "./EstadoProyecto.js";
import { esTextoNoVacio } from "../validaciones.js";
import { Perfil } from "../Perfiles/Perfiles.js"; 
import { DomainError } from "../errores.js";

export class Proyecto {
    constructor(id, titulo, descripcion, colectivoId,perfiles = []) {
        
        if (!esTextoNoVacio(titulo)) {
            throw new DomainError("El título del proyecto es obligatorio", { campo: "titulo" });
        }
        if (!esTextoNoVacio(descripcion)) {
            throw new DomainError("La descripción del proyecto es obligatoria", { campo: "descripcion" });
        }


        this.id = id;
        this.titulo = titulo;
        this.descripcion = descripcion;
        this.colectivoId = colectivoId;
        this.estado = EstadoProyecto.ACTIVO;
        this.perfiles = perfiles; 
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

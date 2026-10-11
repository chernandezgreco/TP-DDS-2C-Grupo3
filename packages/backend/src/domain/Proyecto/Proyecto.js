import { Compromiso } from "../Compromiso/Compromiso.js";
import { ModalidadColaboracion } from "../ModalidadColaboracion/ModalidadColaboracion.js";
import { EstadoProyecto } from "./EstadoProyecto.js";
import { esTextoNoVacio } from "../validaciones.js";
import { Perfil } from "../Perfiles/Perfiles.js"; 
import {
    ConflictError,
    DomainError,
    NotFoundError,
} from "../errores.js";
import { Logro } from "../Logro/Logro.js";

export class Proyecto {
    constructor(id, titulo, descripcion, colectivoId, perfiles = [], logros = []) {
        
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
        this.logros = logros;
        this.perfiles = perfiles; 
    }

    agregarLogro(logro) {
        if (!(logro instanceof Logro)) {
            throw new DomainError("El logro no es válido", {
                campo: "logro",
            });
        }

        const logroExistente = this.logros.some(
            (logroActual) => logroActual.id === logro.id,
        );

        if (logroExistente) {
            throw new ConflictError("El logro ya existe en el proyecto", {
                logroId: logro.id,
            });
        }

        this.logros.push(logro);
        return logro;
    }

    obtenerLogro(logroId) {
        const logro = this.logros.find(
            (logroActual) => logroActual.id === logroId,
        );

        if (!logro) {
            throw new NotFoundError("Logro no encontrado", {
                logroId,
            });
        }

        return logro;
    }

    actualizarLogro(logroId, datosActualizados) {
        const logro = this.obtenerLogro(logroId);
        return logro.actualizar(datosActualizados);
    }

    eliminarLogro(logroId) {
        const logro = this.obtenerLogro(logroId);

        this.logros = this.logros.filter(
            (logroActual) => logroActual.id !== logroId,
        );

        return logro;
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

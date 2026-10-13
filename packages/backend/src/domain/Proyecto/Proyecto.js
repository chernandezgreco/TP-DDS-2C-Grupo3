import { EstadoProyecto } from "./EstadoProyecto.js";
import { esTextoNoVacio } from "../validaciones.js";
import { Perfil } from "../Perfil/Perfil.js";
import { Logro } from "../Logro/Logro.js";
import {
    ConflictError,
    DomainError,
    NotFoundError,
} from "../errores.js";

export class Proyecto {
    constructor(id, titulo, descripcion, colectivoId, perfiles = [], logros = [], estado = EstadoProyecto.ACTIVO) {
        if (!esTextoNoVacio(titulo)) {
            throw new DomainError("El título del proyecto es obligatorio", { campo: "titulo" });
        }
        if (!esTextoNoVacio(descripcion)) {
            throw new DomainError("La descripción del proyecto es obligatoria", { campo: "descripcion" });
        }
        if (!perfiles.every((perfil) => perfil instanceof Perfil)) {
            throw new DomainError("Los perfiles del proyecto no son válidos", { campo: "perfiles" });
        }
        if (!Object.values(EstadoProyecto).includes(estado)) {
            throw new DomainError(`Estado inválido: ${estado}`, {
                estado,
                estadosValidos: Object.values(EstadoProyecto),
            });
        }

        this.id = id;
        this.titulo = titulo;
        this.descripcion = descripcion;
        this.colectivoId = colectivoId;
        this.estado = estado;
        this.perfiles = [...perfiles];
        this.logros = logros;
    }

    perteneceA(colectivoId) {
        return this.colectivoId === colectivoId;
    }

    estaActivo() {
        return this.estado === EstadoProyecto.ACTIVO;
    }

    cerrar() {
        if (!this.estaActivo()) {
            throw new ConflictError("El proyecto ya está finalizado", { proyectoId: this.id });
        }

        this.estado = EstadoProyecto.FINALIZADO;
    }

    // --- Perfiles ---

    agregarPerfil(perfil) {
        if (!(perfil instanceof Perfil)) {
            throw new DomainError("El perfil no es válido", { campo: "perfil" });
        }
        if (this.perfiles.some((perfilActual) => perfilActual.id === perfil.id)) {
            throw new ConflictError("El perfil ya existe en el proyecto", { perfilId: perfil.id });
        }

        this.perfiles.push(perfil);
        return perfil;
    }

    obtenerPerfil(perfilId) {
        const perfil = this.perfiles.find((perfilActual) => perfilActual.id === perfilId);

        if (!perfil) {
            throw new NotFoundError("Perfil no encontrado", { perfilId });
        }

        return perfil;
    }

    actualizarPerfil(perfilId, datosActualizados) {
        return this.obtenerPerfil(perfilId).actualizar(datosActualizados);
    }

    eliminarPerfil(perfilId) {
        const perfil = this.obtenerPerfil(perfilId);
        this.perfiles = this.perfiles.filter((perfilActual) => perfilActual.id !== perfilId);
        return perfil;
    }

    perfilesPara(colaboradora) {
        return this.perfiles.filter((perfil) => perfil.admiteA(colaboradora));
    }

    // el perfil en el que queda anotada la colaboradora: el que eligió o el primero que le corresponde
    perfilParaAnotar(colaboradora, perfilId) {
        if (!this.estaActivo()) {
            throw new ConflictError("El proyecto se encuentra finalizado y no admite nuevas colaboraciones", { proyectoId: this.id });
        }

        if (perfilId) {
            const perfil = this.obtenerPerfil(perfilId);
            if (!perfil.admiteA(colaboradora)) {
                throw new DomainError("La colaboradora no tiene ninguna de las habilidades requeridas por el perfil", {
                    perfilId,
                    habilidadesRequeridas: perfil.habilidadesRequeridas,
                });
            }
            return perfil;
        }

        const [perfil] = this.perfilesPara(colaboradora);
        if (!perfil) {
            throw new DomainError("La colaboradora no tiene ninguna de las habilidades requeridas por los perfiles del proyecto", {
                proyectoId: this.id,
            });
        }
        return perfil;
    }

    // --- Logros ---

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
}

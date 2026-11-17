import { EstadoTarea } from "./EstadoTarea.js";
import { esTextoNoVacio } from "../validaciones.js";
import { ConflictError, DomainError } from "../errores.js";

export const MAX_TAREAS_POR_PROYECTO = 100;
export const MAX_LARGO_NOMBRE = 100;
export const MAX_LARGO_DESCRIPCION = 500;
export const MAX_DURACION_EN_DIAS = 1095;
export const FECHA_MINIMA = new Date("2020-01-01T00:00:00.000Z");
export const FECHA_MAXIMA = new Date("2050-12-31T00:00:00.000Z");

const MS_POR_DIA = 24 * 60 * 60 * 1000;

// a qué estados se puede pasar desde cada uno; CERRADA es terminal y no se elige a mano
const TRANSICIONES = {
    [EstadoTarea.PENDIENTE]: [EstadoTarea.EN_CURSO, EstadoTarea.FINALIZADA],
    [EstadoTarea.EN_CURSO]: [EstadoTarea.PENDIENTE, EstadoTarea.FINALIZADA],
    [EstadoTarea.FINALIZADA]: [EstadoTarea.EN_CURSO],
    [EstadoTarea.CERRADA]: [],
};

const esFechaValida = (valor) =>
    valor instanceof Date && Number.isFinite(valor.getTime());

const validarFecha = (valor, campo, etiqueta) => {
    if (!esFechaValida(valor)) {
        throw new DomainError(`La fecha de ${etiqueta} de la tarea no es válida`, { campo });
    }
    if (valor < FECHA_MINIMA || valor > FECHA_MAXIMA) {
        throw new DomainError(
            `La fecha de ${etiqueta} de la tarea debe estar entre 2020 y 2050`,
            { campo },
        );
    }
};

const formatearDia = (fecha) => fecha.toISOString().slice(0, 10);

const validarTransicion = (actual, nuevo) => {
    if (!Object.values(EstadoTarea).includes(nuevo)) {
        throw new DomainError(`Estado inválido: ${nuevo}`, {
            campo: "estado",
            estado: nuevo,
            estadosValidos: Object.values(EstadoTarea),
        });
    }
    if (nuevo === actual) {
        return;
    }
    if (nuevo === EstadoTarea.CERRADA) {
        throw new DomainError("El estado CERRADA lo asigna el sistema al finalizar el proyecto", {
            campo: "estado",
        });
    }
    if (!TRANSICIONES[actual].includes(nuevo)) {
        throw new ConflictError(`No se puede pasar una tarea de ${actual} a ${nuevo}`, {
            estadoActual: actual,
            estadoNuevo: nuevo,
        });
    }
};

export class Tarea {
    constructor(
        id,
        proyectoId,
        nombre,
        descripcion,
        fechaInicio,
        fechaFin,
        responsableId = null,
        estado = EstadoTarea.PENDIENTE,
        fechaCreacion = new Date(),
    ) {
        if (!esTextoNoVacio(proyectoId)) {
            throw new DomainError("El proyecto de la tarea es obligatorio", {
                campo: "proyectoId",
            });
        }
        if (!esTextoNoVacio(nombre)) {
            throw new DomainError("El nombre de la tarea es obligatorio", { campo: "nombre" });
        }
        if (nombre.trim().length > MAX_LARGO_NOMBRE) {
            throw new DomainError(
                `El nombre de la tarea no puede superar los ${MAX_LARGO_NOMBRE} caracteres`,
                { campo: "nombre" },
            );
        }
        if (descripcion !== undefined && descripcion !== null && typeof descripcion !== "string") {
            throw new DomainError("La descripción de la tarea debe ser un texto", {
                campo: "descripcion",
            });
        }
        if ((descripcion ?? "").trim().length > MAX_LARGO_DESCRIPCION) {
            throw new DomainError(
                `La descripción de la tarea no puede superar los ${MAX_LARGO_DESCRIPCION} caracteres`,
                { campo: "descripcion" },
            );
        }

        validarFecha(fechaInicio, "fechaInicio", "inicio");
        validarFecha(fechaFin, "fechaFin", "fin");
        if (fechaFin < fechaInicio) {
            throw new DomainError("La fecha de fin no puede ser anterior a la de inicio", {
                campo: "fechaFin",
            });
        }
        if ((fechaFin - fechaInicio) / MS_POR_DIA + 1 > MAX_DURACION_EN_DIAS) {
            throw new DomainError(
                `La tarea no puede durar más de ${MAX_DURACION_EN_DIAS} días`,
                { campo: "fechaFin" },
            );
        }

        if (responsableId !== null && responsableId !== undefined && !esTextoNoVacio(responsableId)) {
            throw new DomainError("El responsable de la tarea no es válido", {
                campo: "responsableId",
            });
        }
        if (!Object.values(EstadoTarea).includes(estado)) {
            throw new DomainError(`Estado inválido: ${estado}`, {
                campo: "estado",
                estado,
                estadosValidos: Object.values(EstadoTarea),
            });
        }

        this.id = id;
        this.proyectoId = proyectoId;
        this.nombre = nombre.trim();
        this.descripcion = descripcion?.trim() || null;
        this.fechaInicio = fechaInicio;
        this.fechaFin = fechaFin;
        this.responsableId = responsableId ?? null;
        this.estado = estado;
        this.fechaCreacion = fechaCreacion;
    }

    // días de calendario, contando el de inicio y el de fin; no se guarda para que no se desincronice de las fechas
    duracionEnDias() {
        return Math.round((this.fechaFin - this.fechaInicio) / MS_POR_DIA) + 1;
    }

    estaFinalizada() {
        return this.estado === EstadoTarea.FINALIZADA;
    }

    cambiarEstado(nuevoEstado) {
        validarTransicion(this.estado, nuevoEstado);
        this.estado = nuevoEstado;
        return this;
    }

    // la tarea queda como estaba si ya terminó; devuelve si hubo cambio
    cerrar() {
        if (this.estado === EstadoTarea.FINALIZADA || this.estado === EstadoTarea.CERRADA) {
            return false;
        }
        this.estado = EstadoTarea.CERRADA;
        return true;
    }

    // la misma tarea vista con otro responsable (por ejemplo, enmascarado para quien no puede ver quién es)
    conResponsable(responsableId) {
        return new Tarea(
            this.id,
            this.proyectoId,
            this.nombre,
            this.descripcion,
            this.fechaInicio,
            this.fechaFin,
            responsableId,
            this.estado,
            this.fechaCreacion,
        );
    }

    // undefined mantiene el valor; null limpia la descripción y el responsable
    actualizar(datos = {}) {
        if (!datos || typeof datos !== "object" || Array.isArray(datos)) {
            throw new DomainError("Los datos de la tarea no son válidos");
        }

        const nuevoEstado = datos.estado === undefined ? this.estado : datos.estado;
        validarTransicion(this.estado, nuevoEstado);

        // se arma una tarea nueva para validar todo junto antes de modificar esta
        const actualizada = new Tarea(
            this.id,
            this.proyectoId,
            datos.nombre === undefined ? this.nombre : datos.nombre,
            datos.descripcion === undefined ? this.descripcion : datos.descripcion,
            datos.fechaInicio === undefined ? this.fechaInicio : datos.fechaInicio,
            datos.fechaFin === undefined ? this.fechaFin : datos.fechaFin,
            datos.responsableId === undefined ? this.responsableId : datos.responsableId,
            nuevoEstado,
            this.fechaCreacion,
        );

        this.nombre = actualizada.nombre;
        this.descripcion = actualizada.descripcion;
        this.fechaInicio = actualizada.fechaInicio;
        this.fechaFin = actualizada.fechaFin;
        this.responsableId = actualizada.responsableId;
        this.estado = actualizada.estado;

        return this;
    }

    toJSON() {
        return {
            id: this.id,
            proyectoId: this.proyectoId,
            nombre: this.nombre,
            descripcion: this.descripcion,
            fechaInicio: formatearDia(this.fechaInicio),
            fechaFin: formatearDia(this.fechaFin),
            duracion: this.duracionEnDias(),
            responsableId: this.responsableId,
            estado: this.estado,
            fechaCreacion: this.fechaCreacion,
        };
    }
}

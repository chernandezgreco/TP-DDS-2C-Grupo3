import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import { ProyectoModel } from "../models/indexModel.js";
import { Logro } from "../domain/Logro/Logro.js";
import { Proyecto } from "../domain/Proyecto/Proyecto.js";
import { NotFoundError } from "../domain/errores.js";

const obtenerProyecto = async (proyectoId) => {
    if (!mongoose.isObjectIdOrHexString(proyectoId)) {
        throw new NotFoundError("Proyecto no encontrado", { proyectoId });
    }

    const documento = await ProyectoModel.findById(proyectoId);

    if (!documento) {
        throw new NotFoundError("Proyecto no encontrado", { proyectoId });
    }

    const logros = documento.logros.map(
        (logro) =>
            new Logro(
                logro.id,
                logro.descripcion,
                logro.porcentajeCompletitud,
                logro.enlaceSistema,
                logro.enlaceFuentePublica,
                logro.fechaCreacion,
            ),
    );

    const proyecto = new Proyecto(
        documento._id.toString(),
        documento.titulo,
        documento.descripcion,
        documento.colectivoId,
        documento.perfiles,
        logros,
    );

    proyecto.estado = documento.estado;

    return { documento, proyecto };
};

const guardarLogros = async (documento, proyecto) => {
    documento.logros = proyecto.logros.map((logro) => ({
        id: logro.id,
        descripcion: logro.descripcion,
        porcentajeCompletitud: logro.porcentajeCompletitud,
        enlaceSistema: logro.enlaceSistema,
        enlaceFuentePublica: logro.enlaceFuentePublica,
        fechaCreacion: logro.fechaCreacion,
    }));

    await documento.save();
};

export class LogroService {
    static async crear(proyectoId, datos) {
        const { documento, proyecto } = await obtenerProyecto(proyectoId);

        const logro = new Logro(
            uuidv4(),
            datos.descripcion,
            datos.porcentajeCompletitud,
            datos.enlaceSistema,
            datos.enlaceFuentePublica,
        );

        proyecto.agregarLogro(logro);
        await guardarLogros(documento, proyecto);

        return logro;
    }

    static async listar(proyectoId) {
        const { proyecto } = await obtenerProyecto(proyectoId);
        return proyecto.logros;
    }

    static async obtener(proyectoId, logroId) {
        const { proyecto } = await obtenerProyecto(proyectoId);
        return proyecto.obtenerLogro(logroId);
    }

    static async actualizar(proyectoId, logroId, datosActualizados) {
        const { documento, proyecto } = await obtenerProyecto(proyectoId);

        const logro = proyecto.actualizarLogro(logroId, datosActualizados);
        await guardarLogros(documento, proyecto);

        return logro;
    }

    static async eliminar(proyectoId, logroId) {
        const { documento, proyecto } = await obtenerProyecto(proyectoId);

        const logro = proyecto.eliminarLogro(logroId);
        await guardarLogros(documento, proyecto);

        return logro;
    }
}
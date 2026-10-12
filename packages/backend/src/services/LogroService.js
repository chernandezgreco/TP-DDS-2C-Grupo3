import { v4 as uuidv4 } from "uuid";
import { db } from "../data/db.js";
import { Logro } from "../domain/Logro/Logro.js";
import { NotFoundError } from "../domain/errores.js";

const obtenerProyecto = (proyectoId) => {
    const proyecto = db.proyectos.find(
        (proyectoActual) => proyectoActual.id === proyectoId,
    );

    if (!proyecto) {
        throw new NotFoundError("Proyecto no encontrado", {
            proyectoId,
        });
    }

    return proyecto;
};

export class LogroService {
    static crear(proyectoId, datos) {
        const proyecto = obtenerProyecto(proyectoId);

        const logro = new Logro(
            uuidv4(),
            datos.descripcion,
            datos.porcentajeCompletitud,
            datos.enlaceSistema,
            datos.enlaceFuentePublica,
        );

        return proyecto.agregarLogro(logro);
    }

    static listar(proyectoId) {
        const proyecto = obtenerProyecto(proyectoId);
        return proyecto.logros;
    }

    static obtener(proyectoId, logroId) {
        const proyecto = obtenerProyecto(proyectoId);
        return proyecto.obtenerLogro(logroId);
    }

    static actualizar(proyectoId, logroId, datosActualizados) {
        const proyecto = obtenerProyecto(proyectoId);
        return proyecto.actualizarLogro(logroId, datosActualizados);
    }

    static eliminar(proyectoId, logroId) {
        const proyecto = obtenerProyecto(proyectoId);
        return proyecto.eliminarLogro(logroId);
    }
}
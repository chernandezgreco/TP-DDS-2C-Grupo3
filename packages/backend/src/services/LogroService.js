import { v4 as uuidv4 } from "uuid";
import { Logro } from "../domain/Logro/Logro.js";
import { ProyectoService } from "./ProyectoService.js";

export class LogroService {
    static async crear(proyectoId, datos) {
        const proyecto = await ProyectoService.obtenerPorId(proyectoId);

        const logro = new Logro(
            uuidv4(),
            datos.descripcion,
            datos.porcentajeCompletitud,
            datos.enlaceSistema,
            datos.enlaceFuentePublica,
        );

        proyecto.agregarLogro(logro);
        await ProyectoService.guardar(proyecto);

        return logro;
    }

    static async listar(proyectoId) {
        const proyecto = await ProyectoService.obtenerPorId(proyectoId);
        return proyecto.logros;
    }

    static async obtener(proyectoId, logroId) {
        const proyecto = await ProyectoService.obtenerPorId(proyectoId);
        return proyecto.obtenerLogro(logroId);
    }

    static async actualizar(proyectoId, logroId, datosActualizados) {
        const proyecto = await ProyectoService.obtenerPorId(proyectoId);

        const logro = proyecto.actualizarLogro(logroId, datosActualizados);
        await ProyectoService.guardar(proyecto);

        return logro;
    }

    static async eliminar(proyectoId, logroId) {
        const proyecto = await ProyectoService.obtenerPorId(proyectoId);

        const logro = proyecto.eliminarLogro(logroId);
        await ProyectoService.guardar(proyecto);

        return logro;
    }
}

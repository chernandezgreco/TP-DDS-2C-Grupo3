import { TareaModel } from "../models/indexModel.js";
import { Tarea, MAX_TAREAS_POR_PROYECTO } from "../domain/Tarea/Tarea.js";
import { ConflictError, DomainError, NotFoundError } from "../domain/errores.js";
import { ColaboracionService } from "./ColaboracionService.js";
import { ProyectoService } from "./ProyectoService.js";
import { esIdValido } from "./ids.js";
import { serializar } from "./serializar.js";

// mismo valor que usan las colaboraciones anónimas (ColaboracionController): el front lo muestra como contribución anónima
export const RESPONSABLE_ANONIMO = "Anonimo";

const aDominio = (doc) =>
    new Tarea(
        doc._id.toString(),
        doc.proyectoId,
        doc.nombre,
        doc.descripcion,
        doc.fechaInicio,
        doc.fechaFin,
        doc.responsableId,
        doc.estado,
        doc.fechaCreacion,
    );

const aDocumento = (tarea) => ({
    proyectoId: tarea.proyectoId,
    nombre: tarea.nombre,
    descripcion: tarea.descripcion,
    fechaInicio: tarea.fechaInicio,
    fechaFin: tarea.fechaFin,
    responsableId: tarea.responsableId,
    estado: tarea.estado,
});

// el proyecto de la URL es el único que cuenta: una tarea de otro proyecto es una tarea que no existe
const buscarDoc = async (proyectoId, tareaId) => {
    const doc = esIdValido(tareaId) ? await TareaModel.findOne({ _id: tareaId, proyectoId }) : null;
    if (!doc) {
        throw new NotFoundError("Tarea no encontrada", { tareaId });
    }
    return doc;
};

const validarProyectoEditable = (proyecto) => {
    if (!proyecto.estaActivo()) {
        throw new ConflictError("No se pueden modificar las tareas de un proyecto finalizado", {
            proyectoId: proyecto.id,
        });
    }
};

const validarResponsable = async (proyectoId, responsableId) => {
    if (!(await ColaboracionService.esColaboradoraActiva(proyectoId, responsableId))) {
        throw new DomainError("El responsable debe ser una colaboradora del proyecto", {
            campo: "responsableId",
            responsableId,
        });
    }
};

export class TareaService {
    static async crear(proyectoId, datos) {
        return await serializar(`proyecto:${proyectoId}`, async () => {
            const proyecto = await ProyectoService.obtenerPorId(proyectoId);
            validarProyectoEditable(proyecto);

            // el estado inicial siempre es PENDIENTE: el dominio lo define, no el pedido
            const tarea = new Tarea(
                null,
                proyectoId,
                datos.nombre,
                datos.descripcion,
                datos.fechaInicio,
                datos.fechaFin,
                datos.responsableId,
            );

            if ((await TareaModel.countDocuments({ proyectoId })) >= MAX_TAREAS_POR_PROYECTO) {
                throw new ConflictError(
                    `Un proyecto no puede tener más de ${MAX_TAREAS_POR_PROYECTO} tareas`,
                    { proyectoId },
                );
            }
            if (tarea.responsableId) {
                await validarResponsable(proyectoId, tarea.responsableId);
            }

            return aDominio(await TareaModel.create(aDocumento(tarea)));
        });
    }

    static async listar(proyectoId, actor) {
        const proyecto = await ProyectoService.obtenerPorId(proyectoId);

        const docs = await TareaModel.find({ proyectoId }).sort({ fechaInicio: 1, fechaFin: 1, _id: 1 });

        return await this.ocultarResponsablesAnonimos(docs.map(aDominio), proyecto, actor);
    }

    static async obtener(proyectoId, tareaId, actor) {
        const proyecto = await ProyectoService.obtenerPorId(proyectoId);
        const tarea = aDominio(await buscarDoc(proyectoId, tareaId));

        const [visible] = await this.ocultarResponsablesAnonimos([tarea], proyecto, actor);
        return visible;
    }

    static async actualizar(proyectoId, tareaId, datos) {
        return await serializar(`proyecto:${proyectoId}`, async () => {
            const proyecto = await ProyectoService.obtenerPorId(proyectoId);
            validarProyectoEditable(proyecto);

            const tarea = aDominio(await buscarDoc(proyectoId, tareaId));
            const responsableAnterior = tarea.responsableId;

            tarea.actualizar(datos);

            // el front reenvía el responsable aunque no cambie: solo se valida si es otro, así editar fechas
            // sigue funcionando cuando la responsable ya se dio de baja
            if (tarea.responsableId && tarea.responsableId !== responsableAnterior) {
                await validarResponsable(proyectoId, tarea.responsableId);
            }

            await TareaModel.updateOne({ _id: tareaId, proyectoId }, aDocumento(tarea), {
                runValidators: true,
            });
            return tarea;
        });
    }

    static async eliminar(proyectoId, tareaId) {
        return await serializar(`proyecto:${proyectoId}`, async () => {
            const proyecto = await ProyectoService.obtenerPorId(proyectoId);
            validarProyectoEditable(proyecto);

            const doc = esIdValido(tareaId)
                ? await TareaModel.findOneAndDelete({ _id: tareaId, proyectoId })
                : null;
            if (!doc) {
                throw new NotFoundError("Tarea no encontrada", { tareaId });
            }
            return aDominio(doc);
        });
    }

    // Las tareas sin terminar quedan cerradas junto con el proyecto; las finalizadas se conservan.
    // No toma el turno del proyecto porque lo llama ProyectoService, que ya lo tiene al finalizar.
    static async cerrarDeProyecto(proyectoId) {
        const docs = await TareaModel.find({ proyectoId });

        const cerradas = docs.map(aDominio).filter((tarea) => tarea.cerrar());
        if (cerradas.length > 0) {
            await TareaModel.bulkWrite(
                cerradas.map((tarea) => ({
                    updateOne: { filter: { _id: tarea.id }, update: { $set: { estado: tarea.estado } } },
                })),
            );
        }
        return cerradas.length;
    }

    // Igual que cerrarDeProyecto: el turno del proyecto lo toma ProyectoService al eliminarlo.
    static async eliminarDeProyecto(proyectoId) {
        await TareaModel.deleteMany({ proyectoId });
    }

    // la privacidad de las colaboraciones anónimas manda: solo ven al responsable el colectivo dueño del proyecto,
    // la propia responsable o cualquiera si la colaboradora figura en el proyecto sin anonimato
    static async ocultarResponsablesAnonimos(tareas, proyecto, actor) {
        const conResponsable = tareas.filter((tarea) => tarea.responsableId);
        if (conResponsable.length === 0 || (actor?.type === "colectivos" && proyecto.perteneceA(actor.id))) {
            return tareas;
        }

        const colaboraciones = await ColaboracionService.listarDeProyecto(proyecto.id);
        const publicas = new Set(
            colaboraciones
                .filter((colaboracion) => !colaboracion.anonimidad)
                .map((colaboracion) => colaboracion.colaboradoraId),
        );

        return tareas.map((tarea) =>
            !tarea.responsableId ||
            publicas.has(tarea.responsableId) ||
            (actor?.type === "colaboradoras" && actor.id === tarea.responsableId)
                ? tarea
                : tarea.conResponsable(RESPONSABLE_ANONIMO),
        );
    }
}

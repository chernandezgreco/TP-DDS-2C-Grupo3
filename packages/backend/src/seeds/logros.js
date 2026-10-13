import { ProyectoModel } from "../models/indexModel.js";
import { Logro } from "../domain/Logro/Logro.js";
import { NotFoundError } from "../domain/errores.js";

export const LOGROS_INICIALES = [
    {
        id: "7209f904-0156-42f7-b401-14ff19894660",
        descripcion: "Diseño inicial del sistema terminado",
        porcentajeCompletitud: 25,
        enlaceSistema: null,
        enlaceFuentePublica:
            "https://github.com/chernandezgreco/TP-DDS-2C-Grupo3",
        fechaCreacion: new Date("2026-10-01T12:00:00Z"),
    },
    {
        id: "95cbab52-671d-4c59-a4a3-b7966537619e",
        descripcion: "Primera versión de la API implementada",
        porcentajeCompletitud: 50,
        enlaceSistema: null,
        enlaceFuentePublica:
            "https://github.com/chernandezgreco/TP-DDS-2C-Grupo3",
        fechaCreacion: new Date("2026-10-10T12:00:00Z"),
    },
];

export const cargarLogrosIniciales = async (proyectoId) => {
    const proyecto = await ProyectoModel.findById(proyectoId);

    if (!proyecto) {
        throw new NotFoundError("Proyecto no encontrado", { proyectoId });
    }

    for (const datos of LOGROS_INICIALES) {
        const logro = new Logro(
            datos.id,
            datos.descripcion,
            datos.porcentajeCompletitud,
            datos.enlaceSistema,
            datos.enlaceFuentePublica,
            datos.fechaCreacion,
        );

        await ProyectoModel.updateOne(
            {
                _id: proyectoId,
                "logros.id": { $ne: logro.id },
            },
            {
                $push: {
                    logros: {
                        id: logro.id,
                        descripcion: logro.descripcion,
                        porcentajeCompletitud: logro.porcentajeCompletitud,
                        enlaceSistema: logro.enlaceSistema,
                        enlaceFuentePublica: logro.enlaceFuentePublica,
                        fechaCreacion: logro.fechaCreacion,
                    },
                },
            },
            { runValidators: true },
        );
    }
};
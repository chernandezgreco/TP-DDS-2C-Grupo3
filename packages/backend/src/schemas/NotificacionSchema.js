import { z } from "zod";
import { sanitizarTexto } from "../utils/sanitizar.js";

export const crearNotificacionSchema = z.object(
    {
        colaboradoraId: z.string({ error: "El id de la colaboradora es obligatorio" }),
        colectivoId: z.string({ error: "El id del colectivo es obligatorio" }),
        proyectoId: z.string({ error: "El id del proyecto es obligatorio" }),
        texto: z
            .string({
                error: "El texto de la notificación es obligatorio",
            })
            .transform(sanitizarTexto)
            .pipe(
                z.string().trim().min(1, {
                    error: "El texto de la notificación es obligatorio",
                }),
            ),
    },
    { error: "Los datos de la notificación son obligatorios" }
);

// hasta = fecha (ISO 8601) del mensaje más nuevo que se mostró en la bandeja
export const marcarMensajesVistosSchema = z.object(
    {
        hasta: z.iso
            .datetime({ offset: true, error: "hasta debe ser una fecha ISO 8601" })
            .transform((fecha) => new Date(fecha)),
    },
    { error: "Indicá hasta qué mensaje viste" },
);

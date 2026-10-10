import { z } from "zod";

export const crearNotificacionSchema = z.object(
    {
        colaboradoraId: z.string({ error: "El id de la colaboradora es obligatorio" }),
        colectivoId: z.string({ error: "El id del colectivo es obligatorio" }),
        proyectoId: z.string({ error: "El id del proyecto es obligatorio" }),
        texto: z.string({ error: "El texto de la notificación es obligatorio" }),
    },
    { error: "Los datos de la notificación son obligatorios" }
);

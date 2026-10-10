import { z } from "zod";

export const crearProyectoSchema = z.object(
    {
        titulo: z.string({ error: "El título del proyecto es obligatorio" }),
        descripcion: z.string({ error: "La descripción del proyecto es obligatoria" }),
        perfiles: z.array(z.any(), { error: "Los perfiles del proyecto son obligatorios" }) // <-- Agregamos esto para que Zod lo deje pasar
    },
    { error: "Los datos del proyecto son obligatorios" }
);

export const cerrarProyectoSchema = z.object(
    {
        estado: z.literal("FINALIZADO", { error: "El estado debe ser FINALIZADO" }),
    },
    { error: "El estado debe ser FINALIZADO" }
);

export const anotarColaboradoraSchema = z.object(
    {
        colaboradoraId: z.string({ error: "El id de la colaboradora es obligatorio" }),
        anonimidad: z.boolean().optional()
    },
    { error: "El id de la colaboradora es obligatorio" }
);
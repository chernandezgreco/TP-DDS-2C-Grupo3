import { z } from "zod";

export const crearHabilidadSchema = z.object(
    {
        titulo: z.string({ error: "El título de la habilidad es obligatorio" }),
        descripcion: z.string({ error: "La descripción de la habilidad es obligatoria" }),
    },
    { error: "Los datos de la habilidad son obligatorios" }
);

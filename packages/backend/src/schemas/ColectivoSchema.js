import { z } from "zod";

export const crearColectivoSchema = z.object(
    {
        nombre: z.string({ error: "El nombre del colectivo es obligatorio" }),
        descripcion: z.string({ error: "La descripción del colectivo es obligatoria" }),
        tipo: z.string({ error: "El tipo de colectivo es obligatorio" }),
        ubicacion: z.string({ error: "La ubicación del colectivo debe ser un texto" }).optional(),
    },
    { error: "Los datos del colectivo son obligatorios" }
);

import { z } from "zod";

export const crearColaboradoraSchema = z.object(
    {
        nombreFantasia: z.string({ error: "El nombre de fantasía es obligatorio" }),
        github: z.string({ error: "La cuenta de GitHub o GitLab es obligatoria" }),
        habilidades: z.array(
            z.string({ error: "La Colaboradora no cumple con las habilidades dadas de alta" }),
            { error: "La colaboradora debe tener al menos una habilidad" }
        ),
        nombreApellido: z.string({ error: "El nombre y apellido debe ser un texto" }).optional(),
        pronombres: z.string({ error: "Los pronombres deben ser un texto" }).optional(),
        presentacion: z.string({ error: "La presentación debe ser un texto" }).optional(),
    },
    { error: "Los datos de la colaboradora son obligatorios" }
);

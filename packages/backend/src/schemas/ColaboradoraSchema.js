import { z } from "zod";
import { TipoMedioContacto } from "../domain/Colaboradora/TipoMedioContacto.js";

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

export const medioContactoSchema = z.object(
    {
        tipo: z.enum(Object.values(TipoMedioContacto), { error: "El tipo debe ser EMAIL, WHATSAPP o SMS" }),
        valor: z.string({ error: "El valor del medio de contacto es obligatorio" }),
    },
    { error: "Los datos del medio de contacto son obligatorios" }
);

export const preferenciasSchema = z.object(
    {
        aceptaMensajeria: z.boolean({ error: "aceptaMensajeria debe ser verdadero o falso" }),
    },
    { error: "Las preferencias son obligatorias" }
);

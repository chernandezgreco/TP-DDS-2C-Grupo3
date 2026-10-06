import { z } from "zod";

export const crearProyectoSchema = z.object(
    {
        titulo: z.string({ error: "El título del proyecto es obligatorio" }),
        descripcion: z.string({ error: "La descripción del proyecto es obligatoria" }),
        compromiso: z.object(
            {
                cantidadHoras: z.number({ error: "La cantidad de horas debe ser un número entero positivo" }),
                tipo: z.string({ error: "El tipo de compromiso no es válido" }),
            },
            { error: "El compromiso del proyecto es obligatorio" }
        ),
        modalidad: z.object(
            {
                gratuita: z.boolean({ error: "Las modalidades de colaboración deben ser booleanas" }).optional(),
                incentivoEconomico: z.boolean({ error: "Las modalidades de colaboración deben ser booleanas" }).optional(),
                contratacionEventual: z.boolean({ error: "Las modalidades de colaboración deben ser booleanas" }).optional(),
            },
            { error: "La modalidad de colaboración del proyecto es obligatoria" }
        ),
        habilidadesRequeridas: z.array(
            z.string({ error: "El Proyecto no cumple con las habilidades dadas de alta" }),
            { error: "El proyecto debe requerir al menos una habilidad" }
        ),
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
    },
    { error: "El id de la colaboradora es obligatorio" }
);

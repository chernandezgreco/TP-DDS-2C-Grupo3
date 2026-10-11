import { z } from "zod";

export const crearProyectoSchema = z.object(
    {
        titulo: z.string({ error: "El título del proyecto es obligatorio" }),
        descripcion: z.string({ error: "La descripción del proyecto es obligatoria" }),
        perfiles: z.array(
            z.object({
                descripcionPerfil: z.string({ error: "La descripción del perfil es obligatoria" }),
                compromiso: z.object({
                    cantidadHoras: z.number().int().positive({ error: "La cantidad de horas debe ser un número entero positivo" }),
                    tipo: z.enum(["TOTALES", "SEMANALES", "MENSUALES"], { error: "El tipo de compromiso no es válido" })
                }, { error: "El compromiso es obligatorio y debe ser un objeto válido" }),
                habilidadesRequeridas: z.array(z.string(), { error: "Las habilidades requeridas deben ser un array de textos" }),
                habilidadesOpcionales: z.array(z.string()).optional(),
                modalidad: z.object({
                    gratuita: z.boolean({ error: "El campo gratuita debe ser un booleano" }),
                    incentivoEconomico: z.boolean({ error: "El campo incentivoEconomico debe ser un booleano" }),
                    contratacionEventual: z.boolean({ error: "El campo contratacionEventual debe ser un booleano" }),
                }, { error: "La modalidad es obligatoria y debe ser un objeto válido" })
            }),
            { error: "Los perfiles del proyecto son obligatorios" }
        )
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
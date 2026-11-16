import { z } from "zod";
import { sanitizarTexto } from "../utils/sanitizar.js";
import { esUrlWebValida } from "../utils/enlaces.js";

const esUrlValida = (valor) =>
    valor === "" || esUrlWebValida(valor);

const enlaceSistemaSchema = z
    .string()
    .refine(esUrlValida, {
        message: "El enlace al sistema no es válido",
    })
    .nullable()
    .optional();

const enlaceFuentePublicaSchema = z
    .string()
    .refine(esUrlValida, {
        message: "El enlace a la fuente pública no es válido",
    })
    .nullable()
    .optional();

export const crearLogroSchema = z.object(
    {
        descripcion: z
            .string({
                error: "La descripción del logro es obligatoria",
            })
            .transform(sanitizarTexto)
            .pipe(
                z.string().trim().min(1, {
                    error: "La descripción del logro es obligatoria",
                }),
            ),

        porcentajeCompletitud: z
            .number({
                error: "El porcentaje de completitud es obligatorio",
            })
            .min(0, {
                error: "El porcentaje de completitud debe estar entre 0 y 100",
            })
            .max(100, {
                error: "El porcentaje de completitud debe estar entre 0 y 100",
            }),

        enlaceSistema: enlaceSistemaSchema,
        enlaceFuentePublica: enlaceFuentePublicaSchema,
    },
    {
        error: "Los datos del logro son obligatorios",
    },
);

export const actualizarLogroSchema = z
    .object({
        descripcion: crearLogroSchema.shape.descripcion.optional(),

        porcentajeCompletitud: z
            .number()
            .min(0, {
                error: "El porcentaje de completitud debe estar entre 0 y 100",
            })
            .max(100, {
                error: "El porcentaje de completitud debe estar entre 0 y 100",
            })
            .optional(),

        enlaceSistema: enlaceSistemaSchema,
        enlaceFuentePublica: enlaceFuentePublicaSchema,
    })
    .refine(
        (datos) => Object.keys(datos).length > 0,
        {
            message: "Debe informar al menos un campo para actualizar",
        },
    );
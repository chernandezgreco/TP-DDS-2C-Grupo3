import { z } from "zod";
import { sanitizarTexto } from "../utils/sanitizar.js";
import { etiquetasSchema } from "./EtiquetasSchema.js";

export const crearColectivoSchema = z.object(
  {
    nombre: z
      .string({ error: "El nombre del colectivo es obligatorio" })
      .transform(sanitizarTexto)
      .pipe(
        z.string().trim().min(1, {
          error: "El nombre del colectivo es obligatorio",
        }),
      ),

    descripcion: z
      .string({
        error: "La descripción del colectivo es obligatoria",
      })
      .transform(sanitizarTexto)
      .pipe(
        z.string().trim().min(1, {
          error: "La descripción del colectivo es obligatoria",
        }),
      ),

    tipo: z.string({
      error: "El tipo de colectivo es obligatorio",
    }),

    ubicacion: z
      .string({
        error: "La ubicación del colectivo debe ser un texto",
      })
      .transform(sanitizarTexto)
      .pipe(z.string().trim())
      .optional(),

    etiquetas: etiquetasSchema,
  },
  { error: "Los datos del colectivo son obligatorios" },
);

export const actualizarColectivoSchema = crearColectivoSchema
  .partial()
  .strict()
  .refine((datos) => Object.keys(datos).length > 0, {
    message: "Debe informar un cambio",
  });
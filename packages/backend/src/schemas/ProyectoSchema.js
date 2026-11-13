import { z } from "zod";
import { crearPerfilSchema } from "./PerfilSchema.js";

export const crearProyectoSchema = z.object(
  {
    titulo: z.string({ error: "El título del proyecto es obligatorio" }),
    descripcion: z.string({
      error: "La descripción del proyecto es obligatoria",
    }),
    perfiles: z
      .array(crearPerfilSchema, {
        error: "Los perfiles del proyecto deben ser una lista",
      })
      .optional(),
  },
  { error: "Los datos del proyecto son obligatorios" },
);

export const actualizarProyectoSchema = z
  .object({
    titulo: z.string().trim().min(1).optional(),
    descripcion: z.string().trim().min(1).optional(),
  })
  .strict()
  .refine((datos) => Object.keys(datos).length > 0, {
    message: "Debe informar un cambio",
  });

export const cerrarProyectoSchema = z.object(
  {
    estado: z.literal("FINALIZADO", { error: "El estado debe ser FINALIZADO" }),
  },
  { error: "El estado debe ser FINALIZADO" },
);

export const anotarColaboradoraSchema = z.object(
  {
    colaboradoraId: z.string({
      error: "El id de la colaboradora es obligatorio",
    }),
    perfilId: z
      .string({ error: "El id del perfil debe ser un texto" })
      .optional(),
    anonimidad: z
      .boolean({ error: "anonimidad debe ser verdadero o falso" })
      .optional(),
  },
  { error: "El id de la colaboradora es obligatorio" },
);

export const anotarPostulacionaSchema = z.object(
  {
    colaboradoraId: z.string({
      error: "El id de la colaboradora es obligatorio",
    }),
    perfilId: z
      .string({ error: "El id del perfil debe ser un texto" })
      .optional(),
    anonimidad: z
      .boolean({ error: "anonimidad debe ser verdadero o falso" })
      .optional(),
  },
  { error: "El id de la colaboradora es obligatorio" },
);

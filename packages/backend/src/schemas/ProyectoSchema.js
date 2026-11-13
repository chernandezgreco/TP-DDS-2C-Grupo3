import { z } from "zod";
import { crearPerfilSchema } from "./PerfilSchema.js";

export const usoIASchema = z
  .object({
    descripcion: z.string().trim().min(1).max(500),
    justificacion: z.string().trim().min(1).max(2000),
    grado: z.enum(["BAJO", "MEDIO", "ALTO"]),
  })
  .strict();
export const camposAdicionalesProyecto = {
  requiereIA: z.boolean().nullable().optional(),
  usosIA: z.array(usoIASchema).max(50).optional(),
  versionTerminosAceptada: z.string().trim().min(1),
};

export const crearProyectoSchema = z.object(
  {
    ...camposAdicionalesProyecto,
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
    ...camposAdicionalesProyecto,
    titulo: z.string().trim().min(1).optional(),
    descripcion: z.string().trim().min(1).optional(),
  })
  .strict()
  .refine(
    (datos) => Object.keys(datos).some((k) => k !== "versionTerminosAceptada"),
    {
      message: "Debe informar un cambio",
    },
  );

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

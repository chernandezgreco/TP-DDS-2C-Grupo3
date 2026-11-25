import { z } from "zod";
import { TipoMedioContacto } from "../domain/Colaboradora/TipoMedioContacto.js";
import { sanitizarTexto } from "../utils/sanitizar.js";
import { esCuentaCodigoValida } from "../utils/enlaces.js";

// un item de experiencia por habilidad; la descripcion es opcional y se sanitiza
export const itemExperienciaSchema = z
  .object({
    codigo: z.string().trim().min(1),
    nivel: z.enum(["INICIAL", "INTERMEDIO", "AVANZADO"]),
    anios: z.number().min(0).max(60),
    descripcion: z
      .string()
      .transform(sanitizarTexto)
      .pipe(z.string().trim().max(500, { error: "La descripción admite hasta 500 caracteres" }))
      .optional(),
  })
  .strict();

export const crearColaboradoraSchema = z.object(
  {
      nombreFantasia: z
      .string({ error: "El nombre de fantasía es obligatorio" })
      .transform(sanitizarTexto)
      .pipe(
        z.string().trim().min(1, {
          error: "El nombre de fantasía es obligatorio",
        }),
      ),
       github: z
      .string({
        error: "La cuenta de GitHub o GitLab es obligatoria",
      })
      .transform(sanitizarTexto)
      .pipe(
        z.string().trim().min(1, {
          error: "La cuenta de GitHub o GitLab es obligatoria",
        }),
      )
      .refine(esCuentaCodigoValida, {
        message: "Ingresá un usuario o un enlace HTTP/HTTPS válido",
      }),
    habilidades: z.array(
      z.string({
        error: "La Colaboradora no cumple con las habilidades dadas de alta",
      }),
      { error: "La colaboradora debe tener al menos una habilidad" },
    ),
    experienciaHabilidades: z.array(itemExperienciaSchema).max(100).optional(),
      nombreApellido: z
      .string({ error: "El nombre y apellido debe ser un texto" })
      .transform(sanitizarTexto)
      .pipe(z.string().trim())
      .optional(),

    pronombres: z
      .string({ error: "Los pronombres deben ser un texto" })
      .transform(sanitizarTexto)
      .pipe(z.string().trim())
      .optional(),

    presentacion: z
      .string({ error: "La presentación debe ser un texto" })
      .transform(sanitizarTexto)
      .pipe(z.string().trim())
      .optional(),
  },
  { error: "Los datos de la colaboradora son obligatorios" },
);

export const agregarHabilidadSchema = z.object(
  {
    codigo: z.string({ error: "El código de la habilidad es obligatorio" }),
  },
  { error: "El código de la habilidad es obligatorio" },
);

export const medioContactoSchema = z.object(
  {
    tipo: z.enum(Object.values(TipoMedioContacto), {
      error: "El tipo debe ser EMAIL, WHATSAPP, SMS o TELEGRAM",
    }),
    valor: z.string({ error: "El valor del medio de contacto es obligatorio" }),
  },
  { error: "Los datos del medio de contacto son obligatorios" },
);

export const preferenciasSchema = z.object(
  {
    aceptaMensajeria: z.boolean({
      error: "aceptaMensajeria debe ser verdadero o falso",
    }),
  },
  { error: "Las preferencias son obligatorias" },
);

export const actualizarColaboradoraSchema = crearColaboradoraSchema
  .partial()
  .strict()
  .refine((datos) => Object.keys(datos).length > 0, {
    message: "Debe informar un cambio",
  });

export const contactosSchema = z
  .object({ mediosContacto: z.array(medioContactoSchema).max(20) })
  .strict();

export const experienciaHabilidadesSchema = z
  .object({
    experienciaHabilidades: z.array(itemExperienciaSchema).max(100),
  })
  .strict();

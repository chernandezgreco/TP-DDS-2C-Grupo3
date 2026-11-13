import { z } from "zod";
import { TipoCompromiso } from "../domain/Compromiso/TipoCompromiso.js";

const compromisoSchema = z.object(
  {
    cantidadHoras: z
      .number({ error: "La cantidad de horas debe ser un número" })
      .int({ error: "La cantidad de horas debe ser un número entero positivo" })
      .positive({
        error: "La cantidad de horas debe ser un número entero positivo",
      }),
    tipo: z.enum(Object.values(TipoCompromiso), {
      error: "El tipo de compromiso no es válido",
    }),
  },
  { error: "El compromiso es obligatorio y debe ser un objeto válido" },
);

const modalidadSchema = z.object(
  {
    gratuita: z.boolean({ error: "El campo gratuita debe ser un booleano" }),
    incentivoEconomico: z.boolean({
      error: "El campo incentivoEconomico debe ser un booleano",
    }),
    contratacionEventual: z.boolean({
      error: "El campo contratacionEventual debe ser un booleano",
    }),
  },
  { error: "La modalidad es obligatoria y debe ser un objeto válido" },
);

export const habilidadesRequeridasSchema = z
  .array(z.string({ message: "La habilidad debe ser un texto" }), {
    message: "Las habilidades requeridas son obligatorias",
  })
  .min(1, { message: "El perfil debe tener al menos una habilidad requerida" });

const habilidadesOpcionalesSchema = z.array(z.string(), {
  error: "Las habilidades opcionales deben ser una lista de códigos",
});

const cantidadLimiteSchema = z.number().int().positive().nullable().optional();
const fechaLimiteSchema = z
  .string()
  .refine(
    (v) => /^\d{8}$/.test(v) || /^\d{4}-\d{2}-\d{2}$/.test(v),
    "Fecha inválida",
  )
  .transform((v) =>
    v.length === 8 ? `${v.slice(4, 8)}-${v.slice(2, 4)}-${v.slice(0, 2)}` : v,
  )
  .refine(
    (v) =>
      !Number.isNaN(Date.parse(v)) &&
      new Date(v).toISOString().slice(0, 10) === v,
    "Fecha inválida",
  )
  .transform((v) => new Date(v + "T23:59:59.999Z"))
  .nullable()
  .optional();

export const crearPerfilSchema = z.object(
  {
    descripcionPerfil: z.string({
      error: "La descripción del perfil es obligatoria",
    }),
    fechaLimite: fechaLimiteSchema,
    cantidadLimite: cantidadLimiteSchema,
    habilidadesRequeridas: habilidadesRequeridasSchema,
    habilidadesOpcionales: habilidadesOpcionalesSchema.optional(),
    compromiso: compromisoSchema,
    modalidad: modalidadSchema,
  },
  { error: "Los datos del perfil son obligatorios" },
);

export const actualizarPerfilSchema = z
  .object(
    {
      fechaLimite: fechaLimiteSchema,
      cantidadLimite: cantidadLimiteSchema,
      descripcionPerfil: z
        .string({ error: "La descripción del perfil debe ser un texto" })
        .optional(),
      habilidadesRequeridas: habilidadesRequeridasSchema.optional(),
      habilidadesOpcionales: habilidadesOpcionalesSchema.optional(),
      compromiso: compromisoSchema.optional(),
      modalidad: modalidadSchema.optional(),
    },
    { error: "Los datos del perfil son obligatorios" },
  )
  .refine((datos) => Object.keys(datos).length > 0, {
    message: "Debe informar al menos un campo para actualizar",
  });

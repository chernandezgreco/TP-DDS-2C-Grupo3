import { z } from "zod";

export const crearDenunciaSchema = z
  .object({
    tipoEntidadDenunciada: z.enum(["colectivo", "proyecto"]),
    entidadDenunciadaId: z.string().regex(/^[0-9a-fA-F]{24}$/, "ID de entidad inválido"),
    motivo: z.string().trim().min(3).max(100),
    descripcion: z.string().trim().min(10).max(1000),
  })
  .strict();

export const actualizarEstadoDenunciaSchema = z
  .object({
    estado: z.enum(["pendiente", "en_revision", "resuelta", "desestimada"]),
  })
  .strict();

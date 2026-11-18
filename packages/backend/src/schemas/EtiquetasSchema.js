import { z } from "zod";
import { sanitizarTexto } from "../utils/sanitizar.js";

// Solo valida la forma del pedido. Las reglas de cada etiqueta (normalización, largo,
// cantidad después de quitar repetidas) las aplica el dominio en domain/etiquetas.js.
// Sin .default(): si no se envían, la edición conserva las etiquetas actuales.
export const etiquetasSchema = z
  .array(
    z
      .string({ error: "Cada etiqueta debe ser un texto" })
      .transform(sanitizarTexto)
      .pipe(
        z.string().trim().max(60, {
          error: "Cada etiqueta puede tener hasta 60 caracteres",
        }),
      ),
    { error: "Las etiquetas deben ser una lista" },
  )
  .max(20, { error: "Se enviaron demasiadas etiquetas" })
  .optional();

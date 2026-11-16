import { z } from "zod";
import { sanitizarTexto } from "../utils/sanitizar.js";

export const crearHabilidadSchema = z.object(
    {
        titulo: z
            .string({
                error: "El título de la habilidad es obligatorio",
            })
            .transform(sanitizarTexto)
            .pipe(
                z.string().trim().min(1, {
                    error: "El título de la habilidad es obligatorio",
                }),
            ),

        descripcion: z
            .string({
                error: "La descripción de la habilidad es obligatoria",
            })
            .transform(sanitizarTexto)
            .pipe(
                z.string().trim().min(1, {
                    error: "La descripción de la habilidad es obligatoria",
                }),
            ),
    },
    { error: "Los datos de la habilidad son obligatorios" },
);
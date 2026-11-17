import { z } from "zod";
import { EstadoTarea } from "../domain/Tarea/EstadoTarea.js";
import { sanitizarTexto } from "../utils/sanitizar.js";

// la fecha de una tarea es un día de calendario: llega como YYYY-MM-DD y se guarda a medianoche UTC, sin corrimientos de zona horaria
const fechaSchema = (mensaje) =>
    z.iso.date({ error: mensaje }).transform((dia) => new Date(`${dia}T00:00:00.000Z`));

// como en el resto de los recursos, los textos pasan por sanitizarTexto antes de validarse (sin etiquetas HTML)
const nombreSchema = z
    .string({ error: "El nombre de la tarea es obligatorio" })
    .transform(sanitizarTexto)
    .pipe(z.string().trim().min(1, { error: "El nombre de la tarea es obligatorio" }));

const descripcionSchema = z
    .string({ error: "La descripción de la tarea debe ser un texto" })
    .transform(sanitizarTexto)
    .nullable();

// el front manda "" cuando no se elige a nadie
const responsableSchema = z
    .string({ error: "El responsable debe ser un texto" })
    .trim()
    .nullable()
    .transform((valor) => (valor === "" ? null : valor));

const estadoSchema = z.enum(Object.values(EstadoTarea), {
    error: "El estado de la tarea no es válido",
});

// Los campos desconocidos (id, proyectoId, duracion...) se descartan: el front reenvía la tarea completa al editarla.
export const crearTareaSchema = z.object(
    {
        nombre: nombreSchema,
        descripcion: descripcionSchema.optional(),
        fechaInicio: fechaSchema("La fecha de inicio debe tener el formato AAAA-MM-DD"),
        fechaFin: fechaSchema("La fecha de fin debe tener el formato AAAA-MM-DD"),
        responsableId: responsableSchema.optional(),
    },
    { error: "Los datos de la tarea son obligatorios" },
);

export const actualizarTareaSchema = z
    .object(
        {
            nombre: nombreSchema.optional(),
            descripcion: descripcionSchema.optional(),
            fechaInicio: fechaSchema("La fecha de inicio debe tener el formato AAAA-MM-DD").optional(),
            fechaFin: fechaSchema("La fecha de fin debe tener el formato AAAA-MM-DD").optional(),
            responsableId: responsableSchema.optional(),
            estado: estadoSchema.optional(),
        },
        { error: "Los datos de la tarea son obligatorios" },
    )
    .refine((datos) => Object.keys(datos).length > 0, {
        message: "Debe informar al menos un campo para actualizar",
    });

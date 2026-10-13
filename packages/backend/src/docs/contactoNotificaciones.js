import { z } from "zod";
import { medioContactoSchema, preferenciasSchema } from "../schemas/ColaboradoraSchema.js";
import { crearNotificacionSchema } from "../schemas/NotificacionSchema.js";

// El body se genera solo a partir del schema de Zod
const cuerpo = (schema) => {
    const { $schema, ...resto } = z.toJSONSchema(schema, { io: "input" });
    return { required: true, content: { "application/json": { schema: resto } } };
};

const idColaboradora = {
    name: "id",
    in: "path",
    required: true,
    description: "Id de la colaboradora",
    schema: { type: "string" },
};

const respuestaError = (descripcion) => ({
    description: descripcion,
    content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
});

const medio = {
    type: "object",
    properties: {
        tipo: { type: "string", enum: ["EMAIL", "WHATSAPP", "SMS"] },
        valor: { type: "string", example: "santi@mail.com" },
    },
};

const notificacion = {
    type: "object",
    properties: {
        id: { type: "string" },
        colaboradoraId: { type: "string" },
        colectivoId: { type: "string" },
        proyectoId: { type: "string" },
        texto: { type: "string" },
        fecha: { type: "string", format: "date-time" },
    },
};

export const schemasContacto = {
    MedioContacto: medio,
    Notificacion: notificacion,
};

export const pathsContacto = {
    "/api/colaboradoras/{id}/medios-contacto": {
        post: {
            tags: ["Contacto y notificaciones"],
            summary: "Agrega un medio de contacto a la colaboradora",
            parameters: [idColaboradora],
            requestBody: cuerpo(medioContactoSchema),
            responses: {
                201: {
                    description: "Lista de medios de contacto de la colaboradora",
                    content: {
                        "application/json": {
                            schema: { type: "array", items: { $ref: "#/components/schemas/MedioContacto" } },
                        },
                    },
                },
                400: respuestaError("Tipo o valor inválido (email o teléfono mal formado)"),
                404: respuestaError("Colaboradora no encontrada"),
                409: respuestaError("La colaboradora ya tiene ese medio de contacto"),
            },
        },
    },
    "/api/colaboradoras/{id}/preferencias": {
        patch: {
            tags: ["Contacto y notificaciones"],
            summary: "Cambia si la colaboradora acepta mensajería externa",
            parameters: [idColaboradora],
            requestBody: cuerpo(preferenciasSchema),
            responses: {
                200: { description: "Colaboradora actualizada (sin los medios de contacto)" },
                400: respuestaError("aceptaMensajeria no es un booleano"),
                404: respuestaError("Colaboradora no encontrada"),
            },
        },
    },
    "/api/colaboradoras/{id}/notificaciones": {
        get: {
            tags: ["Contacto y notificaciones"],
            summary: "Lista las notificaciones internas de la colaboradora",
            parameters: [idColaboradora],
            responses: {
                200: {
                    description: "Notificaciones de la colaboradora",
                    content: {
                        "application/json": {
                            schema: { type: "array", items: { $ref: "#/components/schemas/Notificacion" } },
                        },
                    },
                },
                404: respuestaError("Colaboradora no encontrada"),
            },
        },
    },
    "/api/notificaciones": {
        post: {
            tags: ["Contacto y notificaciones"],
            summary: "Envía una notificación de un colectivo a una colaboradora",
            description:
                "Guarda la notificación interna y la replica por cada medio de contacto. " +
                "La colaboradora tiene que aceptar mensajería y tener al menos un medio.",
            requestBody: cuerpo(crearNotificacionSchema),
            responses: {
                201: {
                    description: "Notificación creada y medios por los que se envió",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    notificacion: { $ref: "#/components/schemas/Notificacion" },
                                    mediosUsados: { type: "array", items: { $ref: "#/components/schemas/MedioContacto" } },
                                },
                            },
                        },
                    },
                },
                400: respuestaError("Datos inválidos o el proyecto no es del colectivo"),
                404: respuestaError("Colaboradora, colectivo o proyecto inexistente"),
                409: respuestaError("La colaboradora no acepta mensajería o no tiene medios de contacto"),
            },
        },
    },
};

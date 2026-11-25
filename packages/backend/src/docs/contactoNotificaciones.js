import { medioContactoSchema, preferenciasSchema } from "../schemas/ColaboradoraSchema.js";
import { crearNotificacionSchema, marcarMensajesVistosSchema } from "../schemas/NotificacionSchema.js";
import { cuerpo } from "./comun.js";

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
        tipo: { type: "string", enum: ["EMAIL", "WHATSAPP", "SMS", "TELEGRAM"] },
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
            summary: "Lista las notificaciones internas de la colaboradora, de la más nueva a la más vieja",
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
    "/api/mi/mensajes/no-leidos": {
        get: {
            tags: ["Contacto y notificaciones"],
            summary: "Cuenta los mensajes no leídos de la colaboradora de la sesión",
            description:
                "No leídos son las notificaciones con fecha posterior a la última marca de lectura. " +
                "Devuelve sólo el número para que el front pueda consultarlo seguido (contador del menú).",
            security: [{ SessionCookie: [] }],
            responses: {
                200: {
                    description: "Cantidad de mensajes no leídos",
                    content: {
                        "application/json": {
                            schema: { type: "object", properties: { cantidad: { type: "integer", example: 2 } } },
                        },
                    },
                },
                401: respuestaError("Se requiere sesión válida"),
                403: respuestaError("La cuenta de la sesión no es de una colaboradora"),
            },
        },
    },
    "/api/mi/mensajes/vistos": {
        post: {
            tags: ["Contacto y notificaciones"],
            summary: "Marca como leídos los mensajes hasta una fecha",
            description:
                "hasta es la fecha del mensaje más nuevo que se mostró en la bandeja (no la hora actual), " +
                "para no marcar uno que llegó mientras estaba abierta. La marca sólo avanza: " +
                "una fecha anterior a la guardada no la cambia. No acepta fechas futuras.",
            requestBody: cuerpo(marcarMensajesVistosSchema),
            responses: {
                200: {
                    description: "Marca de lectura vigente",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: { mensajesVistosHasta: { type: "string", format: "date-time" } },
                            },
                        },
                    },
                },
                400: respuestaError("hasta falta, no es una fecha ISO 8601 o es futura"),
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
                                    mediosFallidos: { type: "array", items: { $ref: "#/components/schemas/MedioContacto" }, description: "Medios cuyo envío falló; la notificación interna se guarda igual" },
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

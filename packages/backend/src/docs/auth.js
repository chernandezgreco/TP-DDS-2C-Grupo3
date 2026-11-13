import { parametro, error, respuesta } from "./comun.js";
const actor = {
  type: "object",
  properties: {
    id: { type: "string" },
    type: { type: "string", enum: ["colectivos", "colaboradoras"] },
    email: { type: "string", format: "email" },
  },
};
const credentials = {
  type: "object",
  required: ["email", "password"],
  properties: {
    email: { type: "string", format: "email" },
    password: {
      type: "string",
      minLength: 10,
      maxLength: 128,
      writeOnly: true,
    },
  },
};
const body = (schema) => ({
  required: true,
  content: { "application/json": { schema } },
});
const sessionResponse = respuesta("Sesión actual", {
  type: "object",
  properties: {
    actor: { ...actor, nullable: true },
    perfil: { type: "object" },
  },
});
export const pathsAuth = {
  "/api/auth/registro": {
    post: {
      tags: ["Autenticación"],
      summary: "Registra cuenta y perfil e inicia sesión",
      requestBody: body({
        ...credentials,
        required: ["email", "password", "tipo", "perfil"],
        properties: {
          ...credentials.properties,
          tipo: { type: "string", enum: ["colectivos", "colaboradoras"] },
          perfil: {
            oneOf: [
              { $ref: "#/components/schemas/Colectivo" },
              { $ref: "#/components/schemas/Colaboradora" },
            ],
          },
        },
      }),
      responses: {
        201: sessionResponse,
        400: error("Datos de registro inválidos"),
        409: error("Correo ya registrado"),
        429: error("Demasiados intentos"),
      },
    },
  },
  "/api/auth/login": {
    post: {
      tags: ["Autenticación"],
      summary: "Inicia sesión con cookie HttpOnly",
      requestBody: body(credentials),
      responses: {
        200: sessionResponse,
        401: error("Credenciales incorrectas"),
        429: error("Demasiados intentos"),
      },
    },
  },
  "/api/auth/sesion": {
    get: {
      tags: ["Autenticación"],
      summary: "Obtiene sesión; actor null si no hay sesión válida",
      responses: { 200: sessionResponse },
    },
  },
  "/api/auth/logout": {
    post: {
      tags: ["Autenticación"],
      summary: "Invalida la sesión y elimina su cookie",
      responses: { 204: { description: "Sesión cerrada" } },
    },
  },
  "/api/mi/postulaciones": {
    get: {
      tags: ["Postulaciones"],
      security: [{ SessionCookie: [] }],
      summary: "Postulaciones de la colaboradora autenticada",
      responses: {
        200: respuesta("Mis postulaciones", {
          type: "array",
          items: { type: "object" },
        }),
        401: error("Se requiere sesión de colaboradora"),
      },
    },
  },
  "/api/colaboradoras/{id}/contactos": {
    parameters: [parametro("id", "Id de la colaboradora")],
    get: {
      tags: ["Contacto"],
      security: [{ SessionCookie: [] }],
      summary:
        "Consulta contactos propios o de una colaboración aceptada del colectivo",
      responses: {
        200: respuesta("Contactos autorizados", {
          type: "array",
          items: {
            type: "object",
            properties: { tipo: { type: "string" }, valor: { type: "string" } },
          },
        }),
        401: error("Se requiere sesión"),
        403: error("Sin colaboración aceptada con acceso"),
        404: error("Persona no encontrada"),
      },
    },
  },
  "/api/colaboradoras/{id}/medios-contacto": {
    put: {
      tags: ["Contacto"],
      security: [{ SessionCookie: [] }],
      summary:
        "Reemplaza los contactos propios; permite editarlos o eliminarlos",
      requestBody: body({
        type: "object",
        required: ["mediosContacto"],
        properties: {
          mediosContacto: {
            type: "array",
            maxItems: 20,
            items: {
              type: "object",
              required: ["tipo", "valor"],
              properties: {
                tipo: { type: "string", enum: ["EMAIL", "WHATSAPP", "SMS"] },
                valor: { type: "string" },
              },
            },
          },
        },
      }),
      responses: {
        200: respuesta("Contactos actualizados", {
          type: "array",
          items: { type: "object" },
        }),
        400: error("Contactos inválidos o duplicados"),
        401: error("Se requiere sesión"),
        403: error("Sólo su titular puede modificar contactos"),
      },
    },
  },
};

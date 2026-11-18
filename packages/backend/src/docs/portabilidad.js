import { error } from "./comun.js";

const metadatos = {
  type: "object",
  properties: {
    plataforma: { type: "string", example: "Código a Voluntad" },
    versionFormato: { type: "string", example: "1.0" },
    generadoEn: { type: "string", format: "date-time" },
    titular: {
      type: "object",
      properties: {
        tipo: { type: "string", enum: ["colectivos", "colaboradoras"] },
        perfilId: { type: "string" },
      },
    },
    secciones: { type: "array", items: { type: "string" } },
    excluido: {
      type: "array",
      items: { type: "string" },
      description: "Datos que la plataforma guarda pero nunca exporta",
    },
  },
};

const exportacionJson = {
  type: "object",
  description:
    "metadatos más una sección por cada tipo de dato. Colaboradora: cuenta, perfil " +
    "(con sus medios de contacto), habilidades, experienciaHabilidades, postulaciones, " +
    "colaboraciones, notificacionesRecibidas, tareasAsignadas, denunciasRealizadas, linkedin. " +
    "Colectivo: cuenta, perfil, proyectos (con perfiles y logros), tareas, " +
    "postulacionesRecibidas, colaboraciones, notificacionesEnviadas, revisionesTerminos, " +
    "denunciasRealizadas, linkedin.",
  properties: { metadatos },
  additionalProperties: true,
};

export const pathsPortabilidad = {
  "/api/mi/exportacion": {
    get: {
      tags: ["Portabilidad"],
      summary: "Descarga todos los datos personales de la cuenta de la sesión",
      description:
        "Portabilidad de datos personales. La identidad sale de la cookie de sesión: " +
        "no se pueden pedir datos de otra cuenta. Nunca incluye contraseña, sesiones, " +
        "tokens de integraciones ni las denuncias recibidas. En la " +
        "exportación de un colectivo, las colaboradoras figuran sólo con id y nombre de " +
        "fantasía, sin medios de contacto (minimización de datos). Límite: 5 descargas " +
        "exitosas cada 15 minutos por cuenta.",
      security: [{ SessionCookie: [] }],
      parameters: [
        {
          name: "formato",
          in: "query",
          required: false,
          description:
            "json (por defecto) o csv. El CSV usa formato largo: columnas seccion, registro, campo, valor. " +
            "Los valores que empiezan con =, +, - o @ llevan un apóstrofo adelante para que la planilla " +
            "no los ejecute como fórmula (protección contra inyección CSV); el JSON conserva el valor original.",
          schema: { type: "string", enum: ["json", "csv"], default: "json" },
        },
      ],
      responses: {
        200: {
          description:
            "Archivo descargable (Content-Disposition: attachment). Sin caché.",
          headers: {
            "Content-Disposition": {
              schema: { type: "string" },
              description:
                'attachment; filename="codigo-a-voluntad-datos-colaboradora-AAAA-MM-DD.json"',
            },
          },
          content: {
            "application/json": { schema: exportacionJson },
            "text/csv": {
              schema: {
                type: "string",
                example:
                  "seccion,registro,campo,valor\r\nperfil,1,nombreFantasia,Ana\r\n",
              },
            },
          },
        },
        400: error("Formato inválido"),
        401: error("Se requiere una sesión válida"),
        404: error("El perfil de la cuenta no existe"),
        429: error("Se alcanzó el límite de descargas de la cuenta"),
      },
    },
  },
};

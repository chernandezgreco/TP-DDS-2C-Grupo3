import { cuerpo, error, respuesta } from "./comun.js";
import { z } from "zod";
const condicion = z.object({
  titulo: z.string().min(1),
  contenido: z.string().min(1),
});
const revision = z.object({
  recurso: z.enum(["proyectos", "colectivos"]),
  recursoId: z.string(),
  suspendido: z.boolean(),
  motivo: z.string().min(1),
});
const ok = { type: "object" };
const admin = {
  security: [{ AdminApiKey: [] }],
  responses: {
    200: respuesta("Resultado", ok),
    401: error("Credencial administrativa inválida"),
    503: error("ADMIN_API_KEY no configurada"),
  },
};
export const pathsAdicionales = {
  "/api/terminos/actual": {
    get: {
      tags: ["Términos"],
      summary: "Obtiene la versión vigente",
      responses: {
        200: respuesta("Condiciones vigentes", {
          type: "object",
          properties: {
            version: { type: "string" },
            titulo: { type: "string" },
            contenido: { type: "string" },
          },
        }),
      },
    },
  },
  "/api/admin/terminos/estado": {
    get: {
      ...admin,
      tags: ["Términos"],
      summary: "Evalúa aceptación vigente y consulta historial de revisiones",
    },
  },
  "/api/admin/terminos": {
    post: {
      ...admin,
      tags: ["Términos"],
      summary: "Publica una versión inmutable de condiciones",
      requestBody: cuerpo(condicion),
      responses: {
        ...admin.responses,
        201: respuesta("Nueva versión", ok),
        400: error("Contenido inválido"),
      },
    },
  },
  "/api/admin/terminos/revisiones": {
    post: {
      ...admin,
      tags: ["Términos"],
      summary: "Suspende o rehabilita proyecto o colectivo por incumplimiento",
      requestBody: cuerpo(revision),
      responses: {
        ...admin.responses,
        400: error("Evaluación inválida"),
        404: error("Recurso inexistente"),
      },
    },
  },
};
for (const tipo of ["proyectos", "colectivos"])
  pathsAdicionales[`/api/rss/${tipo}.xml`] = {
    get: {
      tags: ["RSS"],
      summary: `Nuevos ${tipo}: hasta 100 novedades públicas`,
      responses: {
        200: {
          description: "Feed RSS 2.0 sin datos de contacto",
          content: { "application/rss+xml": { schema: { type: "string" } } },
        },
      },
    },
  };
export const propiedadesAdicionalesProyecto = {
  requiereIA: {
    type: "boolean",
    nullable: true,
    description:
      "false: declara no requerir IA; true: requiere IA; null: sin declarar (datos anteriores)",
  },
  usosIA: {
    type: "array",
    items: {
      type: "object",
      properties: {
        descripcion: { type: "string" },
        justificacion: { type: "string" },
        grado: { type: "string", enum: ["BAJO", "MEDIO", "ALTO"] },
      },
    },
  },
  aceptacionTerminos: {
    type: "object",
    properties: {
      version: { type: "string" },
      fecha: { type: "string", format: "date-time" },
    },
  },
};

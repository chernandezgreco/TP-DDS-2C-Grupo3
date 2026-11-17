import { parametro, error, respuesta, cuerpo } from "./comun.js";
import { crearDenunciaSchema, actualizarEstadoDenunciaSchema } from "../schemas/DenunciaSchema.js";
import { experienciaHabilidadesSchema } from "../schemas/ColaboradoraSchema.js";

// Documentacion de los endpoints agregados en la 3ra entrega:
// denuncias, integracion con LinkedIn, experiencia por habilidad, bajas y postulaciones.

const sesion = [{ SessionCookie: [] }];
const admin = [{ AdminApiKey: [] }];
const objeto = { type: "object" };
const estadosDenuncia = ["pendiente", "en_revision", "resuelta", "desestimada"];

const denuncia = {
  type: "object",
  properties: {
    id: { type: "string" },
    tipoEntidadDenunciada: { type: "string", enum: ["colectivo", "proyecto"] },
    entidadDenunciadaId: { type: "string" },
    motivo: { type: "string" },
    descripcion: { type: "string" },
    estado: { type: "string", enum: estadosDenuncia },
  },
};

const colaboracion = {
  type: "object",
  properties: {
    id: { type: "string" },
    proyectoId: { type: "string" },
    colaboradoraId: { type: "string" },
    estado: { type: "string", enum: ["ACTIVA", "TERMINADA"] },
    fechaBaja: { type: "string", format: "date-time", nullable: true },
  },
};

const sinSesion = error("Se requiere una sesión válida");
const redirige = (descripcion) => ({ description: descripcion });

export const pathsAmpliaciones = {
  "/api/denuncias": {
    post: {
      tags: ["Denuncias"],
      security: sesion,
      summary: "Denuncia a un colectivo o proyecto en el que la persona participó",
      description:
        "Sólo pueden denunciar las personas colaboradoras que participaron (aunque ya hayan dejado el proyecto). " +
        "Denunciar un colectivo exige haber participado en alguno de sus proyectos; denunciar un proyecto, en ese proyecto. " +
        "La identidad sale de la sesión, nunca del cuerpo.",
      requestBody: cuerpo(crearDenunciaSchema),
      responses: {
        201: respuesta("Denuncia registrada", denuncia),
        400: error("Datos inválidos"),
        401: sinSesion,
        403: error("No participó en la entidad denunciada o la cuenta no es de una colaboradora"),
        404: error("La entidad denunciada no existe"),
      },
    },
  },
  "/api/admin/denuncias": {
    get: {
      tags: ["Denuncias"],
      security: admin,
      summary: "Lista las denuncias (administración)",
      parameters: [
        { name: "estado", in: "query", required: false, schema: { type: "string", enum: estadosDenuncia } },
      ],
      responses: {
        200: respuesta("Denuncias", { type: "array", items: denuncia }),
        401: error("Credencial administrativa inválida"),
        503: error("ADMIN_API_KEY no configurada"),
      },
    },
  },
  "/api/admin/denuncias/{id}/estado": {
    parameters: [parametro("id", "Id de la denuncia")],
    patch: {
      tags: ["Denuncias"],
      security: admin,
      summary: "Cambia el estado de una denuncia (administración)",
      requestBody: cuerpo(actualizarEstadoDenunciaSchema),
      responses: {
        200: respuesta("Denuncia actualizada", denuncia),
        400: error("Estado inválido"),
        401: error("Credencial administrativa inválida"),
        404: error("La denuncia no existe"),
      },
    },
  },
  "/api/integraciones/linkedin": {
    get: {
      tags: ["LinkedIn"],
      security: sesion,
      summary: "Estado de la conexión con LinkedIn de la cuenta",
      responses: {
        200: respuesta("Estado de la conexión", objeto),
        401: sinSesion,
      },
    },
    delete: {
      tags: ["LinkedIn"],
      security: sesion,
      summary: "Desconecta LinkedIn y borra los datos guardados de la conexión",
      responses: {
        204: { description: "Desconectado. Sin cuerpo de respuesta." },
        401: sinSesion,
      },
    },
  },
  "/api/integraciones/linkedin/conectar": {
    get: {
      tags: ["LinkedIn"],
      security: sesion,
      summary: "Inicia la autorización OAuth con LinkedIn",
      description: "Redirige (302) a la pantalla de autorización de LinkedIn.",
      responses: {
        302: redirige("Redirección a LinkedIn"),
        401: sinSesion,
        503: error("La integración con LinkedIn no está configurada"),
      },
    },
  },
  "/api/integraciones/linkedin/callback": {
    get: {
      tags: ["LinkedIn"],
      summary: "Retorno de LinkedIn tras autorizar",
      description:
        "Lo invoca LinkedIn, no el frontend. Siempre redirige (302) a la aplicación con `?linkedin=conectado` o `?linkedin=error`.",
      parameters: [
        { name: "code", in: "query", schema: { type: "string" } },
        { name: "state", in: "query", schema: { type: "string" } },
      ],
      responses: { 302: redirige("Redirección a la aplicación") },
    },
  },
  "/api/integraciones/linkedin/importar": {
    post: {
      tags: ["LinkedIn"],
      security: sesion,
      summary: "Importa datos del perfil de LinkedIn al perfil de la colaboradora",
      responses: {
        200: respuesta("Perfil actualizado con los datos importados", objeto),
        401: sinSesion,
        403: error("La cuenta no es de una colaboradora o no conectó LinkedIn"),
      },
    },
  },
  "/api/integraciones/linkedin/publicar-logro": {
    post: {
      tags: ["LinkedIn"],
      security: sesion,
      summary: "Publica un logro en LinkedIn",
      description: "Sólo si la persona tiene una colaboración activa en el proyecto del logro.",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["proyectoId", "logroId"],
              additionalProperties: false,
              properties: {
                proyectoId: { type: "string", pattern: "^[a-f0-9]{24}$", description: "ObjectId de Mongo" },
                logroId: { type: "string", pattern: "^[a-f0-9]{24}$", description: "ObjectId de Mongo" },
              },
            },
          },
        },
      },
      responses: {
        201: respuesta("Logro publicado", objeto),
        400: error("Datos inválidos"),
        401: sinSesion,
        403: error("No participa activamente en el proyecto"),
        404: error("Proyecto o logro inexistente"),
      },
    },
  },
  "/api/colaboradoras/{id}/experiencia-habilidades": {
    parameters: [parametro("id", "Id de la colaboradora")],
    put: {
      tags: ["Colaboradoras"],
      security: sesion,
      summary: "Reemplaza la experiencia (nivel, años y descripción opcional) por habilidad",
      description:
        "Sólo para habilidades que ya están en el perfil, sin repetir ninguna. La descripción es opcional, " +
        "admite hasta 500 caracteres y se sanitiza.",
      requestBody: cuerpo(experienciaHabilidadesSchema),
      responses: {
        200: respuesta("Colaboradora actualizada", { $ref: "#/components/schemas/Colaboradora" }),
        400: error("Datos inválidos, habilidad repetida o ajena al perfil"),
        401: sinSesion,
        403: error("No se puede editar un perfil ajeno"),
        404: error("La colaboradora no existe"),
      },
    },
  },
  "/api/colectivos/{id}/cuenta": {
    parameters: [parametro("id", "Id del colectivo")],
    delete: {
      tags: ["Colectivos"],
      security: sesion,
      summary: "Elimina la cuenta del colectivo",
      description:
        "Sólo puede ejecutarlo el propio colectivo. Borra credenciales y sesiones y deja de buscar colaboradoras " +
        "en sus proyectos. La acción es permanente.",
      responses: {
        204: { description: "Cuenta eliminada. Sin cuerpo de respuesta." },
        401: sinSesion,
        403: error("No se puede eliminar una cuenta ajena"),
        404: error("La cuenta o el colectivo no existen"),
      },
    },
  },
  "/api/colectivos/colaboraciones/{colaboracionId}": {
    parameters: [parametro("colaboracionId", "Id de la colaboración")],
    delete: {
      tags: ["Colaboraciones"],
      security: sesion,
      summary: "El colectivo da de baja una colaboración",
      description:
        "Baja lógica: la colaboración queda TERMINADA con su fecha y se conserva como historial. " +
        "Libera el cupo y corta el acceso a los datos de contacto.",
      responses: {
        200: respuesta("Colaboración dada de baja", colaboracion),
        401: sinSesion,
        403: error("La colaboración es de otro colectivo"),
        404: error("La colaboración no existe"),
        409: error("La colaboración ya fue dada de baja"),
      },
    },
  },
  "/api/colaboradoras/{colaboradoraId}/proyectos/{proyectoId}/baja": {
    parameters: [
      parametro("colaboradoraId", "Id de la colaboradora"),
      parametro("proyectoId", "Id del proyecto"),
    ],
    delete: {
      tags: ["Colaboraciones"],
      security: sesion,
      summary: "La colaboradora se da de baja de un proyecto",
      description: "Baja lógica: la participación queda en el historial como TERMINADA.",
      responses: {
        200: respuesta("Colaboración dada de baja", colaboracion),
        401: sinSesion,
        403: error("No se puede dar de baja a otra persona"),
        404: error("No tiene una colaboración activa en el proyecto"),
      },
    },
  },
  "/api/proyectos/{proyectoId}/postularse": {
    parameters: [parametro("proyectoId", "Id del proyecto")],
    post: {
      tags: ["Postulaciones"],
      security: sesion,
      summary: "La colaboradora se postula a un perfil del proyecto",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["colaboradoraId"],
              properties: {
                colaboradoraId: { type: "string" },
                perfilId: { type: "string" },
                anonimidad: { type: "boolean" },
              },
            },
          },
        },
      },
      responses: {
        200: respuesta("Postulación registrada", objeto),
        400: error("No tiene ninguna habilidad requerida por el perfil"),
        401: sinSesion,
        409: error("Proyecto cerrado, vencido, sin búsqueda activa o sin cupo"),
      },
    },
  },
  "/api/colectivos/{colectivoId}/proyectos/{proyectoId}/busqueda": {
    parameters: [parametro("colectivoId", "Id del colectivo"), parametro("proyectoId", "Id del proyecto")],
    patch: {
      tags: ["Proyectos"],
      security: sesion,
      summary: "Abre o cierra la búsqueda de colaboradoras",
      description: "Cerrar siempre se puede. Reabrir no, si el proyecto está finalizado o ya venció (409).",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["estaBuscando"],
              properties: { estaBuscando: { type: "boolean" } },
            },
          },
        },
      },
      responses: {
        200: respuesta("Búsqueda actualizada", objeto),
        400: error("estaBuscando debe ser booleano"),
        401: sinSesion,
        409: error("El proyecto está finalizado o vencido"),
      },
    },
  },
  "/api/colectivos/{colectivoId}/proyectos/{proyectoId}/postulaciones/pendientes": {
    parameters: [parametro("colectivoId", "Id del colectivo"), parametro("proyectoId", "Id del proyecto")],
    get: {
      tags: ["Postulaciones"],
      summary: "Postulaciones pendientes de decisión",
      responses: { 200: respuesta("Postulaciones", { type: "array", items: objeto }) },
    },
  },
  "/api/colectivos/{colectivoId}/proyectos/{proyectoId}/postulaciones/procesadas": {
    parameters: [parametro("colectivoId", "Id del colectivo"), parametro("proyectoId", "Id del proyecto")],
    get: {
      tags: ["Postulaciones"],
      summary: "Postulaciones ya aceptadas o rechazadas",
      responses: { 200: respuesta("Postulaciones", { type: "array", items: objeto }) },
    },
  },
  "/api/colectivos/{colectivoId}/proyectos/{proyectoId}/postulaciones/{postulacionId}": {
    parameters: [
      parametro("colectivoId", "Id del colectivo"),
      parametro("proyectoId", "Id del proyecto"),
      parametro("postulacionId", "Id de la postulación"),
    ],
    patch: {
      tags: ["Postulaciones"],
      security: sesion,
      summary: "El colectivo acepta o rechaza una postulación",
      description: "Al aceptar se crea la colaboración y se hacen visibles los contactos de la persona.",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["estado"],
              properties: { estado: { type: "string", enum: ["ACEPTADA", "RECHAZADA"] } },
            },
          },
        },
      },
      responses: {
        200: respuesta("Postulación actualizada", objeto),
        400: error("Estado inválido"),
        401: sinSesion,
        409: error("La postulación ya fue resuelta o no hay cupo"),
      },
    },
  },
};

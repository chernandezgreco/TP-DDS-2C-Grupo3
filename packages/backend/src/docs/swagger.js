import { pathsAuth } from "./auth.js";
import {
  pathsAdicionales,
  propiedadesAdicionalesProyecto,
} from "./adicionales.js";
import { pathsEdicion } from "./edicion.js";
import { pathsCatalogo, schemasCatalogo } from "./catalogo.js";
import { pathsProyectos, schemasProyectos } from "./proyectos.js";
import { pathsContacto, schemasContacto } from "./contactoNotificaciones.js";
import { pathsLogros, schemasLogros } from "./logros.js";
import { pathsAmpliaciones } from "./ampliaciones.js";
import { pathsTareas, schemasTareas } from "./tareas.js";
import { pathsPortabilidad } from "./portabilidad.js";

// Cada modulo suma sus paths y schemas acá
export const especificacion = {
  openapi: "3.0.3",
  info: {
    title: "Código a Voluntad - API",
    version: "3.0.0",
    description:
      "API del backend del TP de Desarrollo de Software (grupo 3), tercera entrega. " +
      "Las rutas de escritura y las privadas usan la cookie de sesión cav_session: " +
      "registrarse o iniciar sesión con /api/auth/registro o /api/auth/login desde esta misma página " +
      "y el navegador la envía sola. Las rutas administrativas usan Authorization: Bearer <ADMIN_API_KEY>.",
  },
  paths: {
    ...pathsCatalogo,
    ...pathsProyectos,
    ...pathsContacto,
    ...pathsLogros,
    ...pathsTareas,
    ...pathsPortabilidad,
  },
  components: {
    schemas: {
      Error: {
        type: "object",
        properties: {
          error: { type: "string" },
          detalle: { type: "object" },
        },
      },
      ...schemasCatalogo,
      ...schemasProyectos,
      ...schemasContacto,
      ...schemasLogros,
      ...schemasTareas,
    },
  },
};

// Las operaciones nuevas se agregan sin reemplazar GET/PATCH existentes.
for (const [path, operations] of Object.entries(pathsEdicion)) {
  especificacion.paths[path] = { ...especificacion.paths[path], ...operations };
}

Object.assign(especificacion.paths, pathsAdicionales);
for (const [path, item] of Object.entries(pathsAmpliaciones))
  especificacion.paths[path] = { ...especificacion.paths[path], ...item };
especificacion.components.securitySchemes = {
  AdminApiKey: {
    type: "http",
    scheme: "bearer",
    description:
      "Credencial administrativa de servidor; nunca incluir en el bundle ni en URLs.",
  },
};
Object.assign(
  especificacion.components.schemas.Proyecto.properties,
  propiedadesAdicionalesProyecto,
);
for (const item of Object.values(especificacion.paths))
  for (const method of ["get", "post", "put", "patch", "delete"]) {
    if (item[method]?.responses)
      item[method].responses[429] = {
        description: "Se excedió la cuota de solicitudes por IP",
        headers: {
          "Retry-After": {
            schema: { type: "integer" },
            description: "Segundos hasta el reinicio de cuota",
          },
        },
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
          },
        },
      };
  }

especificacion.components.securitySchemes.SessionCookie = {
  type: "apiKey",
  in: "cookie",
  name: "cav_session",
};
for (const [path, item] of Object.entries(pathsAuth))
  especificacion.paths[path] = { ...especificacion.paths[path], ...item };
for (const [path, item] of Object.entries(especificacion.paths)) {
  if (path.startsWith("/api/admin/") || path.startsWith("/api/auth/")) continue;
  for (const method of ["post", "put", "patch", "delete"])
    if (item[method]) {
      item[method].security =
        path === "/api/habilidades"
          ? [{ AdminApiKey: [] }]
          : [{ SessionCookie: [] }];
      item[method].responses[401] = {
        description: "Se requiere sesión válida",
      };
      item[method].responses[403] = {
        description: "La cuenta no tiene permiso para esta operación",
      };
    }
}
for (const path of ["/api/colectivos", "/api/colaboradoras"]) {
  if (especificacion.paths[path]?.post) {
    especificacion.paths[path].post.deprecated = true;
    especificacion.paths[path].post.description =
      "El alta con credenciales se realiza mediante POST /api/auth/registro.";
  }
}

// Lecturas privadas: no son escrituras, pero igual exigen sesión y ser el titular o el colectivo dueño
for (const path of [
  "/api/proyectos/{proyectoId}/perfiles/{perfilId}/colaboradoras-potenciales",
  "/api/colaboradoras/{id}/proyectos-potenciales",
  "/api/colaboradoras/{id}/notificaciones",
  "/api/colectivos/{colectivoId}/proyectos/{proyectoId}/postulaciones/pendientes",
  "/api/colectivos/{colectivoId}/proyectos/{proyectoId}/postulaciones/procesadas",
]) {
  const operacion = especificacion.paths[path]?.get;
  if (!operacion) continue;
  operacion.security = [{ SessionCookie: [] }];
  operacion.responses[401] = { description: "Se requiere sesión válida" };
  operacion.responses[403] = {
    description: "La cuenta no es la titular ni el colectivo dueño",
  };
}

// Si una ruta tiene {parametros} que ninguna operacion declara, se agregan para que Swagger UI pida el valor
for (const [path, item] of Object.entries(especificacion.paths)) {
  const enRuta = [...path.matchAll(/\{(\w+)\}/g)].map(([, nombre]) => nombre);
  for (const method of ["get", "post", "put", "patch", "delete"]) {
    const operacion = item[method];
    if (!operacion) continue;
    const declarados = [...(item.parameters ?? []), ...(operacion.parameters ?? [])]
      .filter((parametro) => parametro.in === "path")
      .map((parametro) => parametro.name);
    const faltantes = enRuta.filter((nombre) => !declarados.includes(nombre));
    if (faltantes.length)
      operacion.parameters = [
        ...(operacion.parameters ?? []),
        ...faltantes.map((nombre) => ({
          name: nombre,
          in: "path",
          required: true,
          schema: { type: "string" },
        })),
      ];
  }
}

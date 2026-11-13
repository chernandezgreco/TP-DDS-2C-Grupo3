import { actualizarProyectoSchema } from "../schemas/ProyectoSchema.js";
import { actualizarColectivoSchema } from "../schemas/ColectivoSchema.js";
import { actualizarColaboradoraSchema } from "../schemas/ColaboradoraSchema.js";
import { cuerpo, parametro, respuesta, ref, error } from "./comun.js";
const update = (tag, schema, resource) => ({
  tags: [tag],
  summary: `Edita datos de ${resource}`,
  description: "Pendiente integrar autenticación y autorización de sesión.",
  requestBody: cuerpo(schema),
  responses: {
    200: respuesta("Datos actualizados", ref(resource)),
    400: error("Cambios inválidos"),
    404: error("Recurso inexistente o ajeno"),
  },
});
export const pathsEdicion = {
  "/api/colectivos/{id}": {
    parameters: [parametro("id", "Id del colectivo")],
    patch: update("Colectivos", actualizarColectivoSchema, "Colectivo"),
  },
  "/api/colaboradoras/{id}": {
    patch: update(
      "Colaboradoras",
      actualizarColaboradoraSchema,
      "Colaboradora",
    ),
  },
  "/api/colectivos/{colectivoId}/proyectos/{proyectoId}": {
    put: update("Proyectos", actualizarProyectoSchema, "Proyecto"),
    delete: {
      tags: ["Proyectos"],
      summary: "Elimina un proyecto sin historial",
      description:
        "Si tiene postulaciones, colaboraciones o logros, debe finalizarse para conservar el historial.",
      responses: {
        204: { description: "Proyecto eliminado" },
        400: error("El proyecto tiene historial"),
        404: error("Proyecto inexistente o ajeno"),
      },
    },
  },
};

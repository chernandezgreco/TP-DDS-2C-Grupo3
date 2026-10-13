import { anotarColaboradoraSchema, cerrarProyectoSchema, crearProyectoSchema } from "../schemas/ProyectoSchema.js";
import { actualizarPerfilSchema, crearPerfilSchema } from "../schemas/PerfilSchema.js";
import { TipoCompromiso } from "../domain/Compromiso/TipoCompromiso.js";
import { EstadoProyecto } from "../domain/Proyecto/EstadoProyecto.js";
import { EstadoColaboracion } from "../domain/Colaboracion/EstadoColaboracion.js";
import { cuerpo, error, lista, parametro, ref, respuesta } from "./comun.js";

// Proyectos, perfiles, colaboraciones y búsquedas

const proyectoId = parametro("proyectoId", "Id del proyecto", "650000000000000000000201");
const colectivoId = parametro("colectivoId", "Id del colectivo", "650000000000000000000101");
const perfilId = parametro("perfilId", "UUID del perfil (se obtiene al listar los perfiles del proyecto)");
const colaboradoraId = parametro("id", "Id de la colaboradora", "650000000000000000000301");
const colaboracionId = parametro("colaboracionId", "Id de la colaboración");

export const schemasProyectos = {
    Perfil: {
        type: "object",
        properties: {
            id: { type: "string", format: "uuid" },
            descripcionPerfil: { type: "string", example: "Tester" },
            habilidadesRequeridas: lista({ type: "string", example: "testing-e2e-con-cypress" }),
            habilidadesOpcionales: lista({ type: "string", example: "soapui" }),
            compromiso: {
                type: "object",
                properties: {
                    cantidadHoras: { type: "integer", example: 5 },
                    tipo: { type: "string", enum: Object.values(TipoCompromiso) },
                },
            },
            modalidad: {
                type: "object",
                properties: {
                    gratuita: { type: "boolean" },
                    incentivoEconomico: { type: "boolean" },
                    contratacionEventual: { type: "boolean" },
                },
            },
        },
    },
    Proyecto: {
        type: "object",
        properties: {
            id: { type: "string" },
            titulo: { type: "string", example: "Web de donaciones" },
            descripcion: { type: "string" },
            colectivoId: { type: "string" },
            estado: { type: "string", enum: Object.values(EstadoProyecto) },
            perfiles: lista(ref("Perfil")),
            logros: lista(ref("Logro")),
        },
    },
    Colaboracion: {
        type: "object",
        properties: {
            id: { type: "string" },
            proyectoId: { type: "string" },
            perfilId: { type: "string", format: "uuid" },
            colaboradoraId: { type: "string", description: "\"Anonimo\" si la colaboración es anónima" },
            estado: { type: "string", enum: Object.values(EstadoColaboracion) },
            fechaCreacion: { type: "string", format: "date-time" },
        },
    },
    ProyectoPotencial: {
        type: "object",
        properties: {
            proyecto: ref("Proyecto"),
            perfilesCompatibles: lista(ref("Perfil")),
        },
    },
};

export const pathsProyectos = {
    "/api/colectivos/{colectivoId}/proyectos": {
        parameters: [colectivoId],
        post: {
            tags: ["Proyectos"],
            summary: "Crea un proyecto del colectivo, opcionalmente con sus perfiles",
            requestBody: cuerpo(crearProyectoSchema),
            responses: {
                201: respuesta("Proyecto creado", ref("Proyecto")),
                400: error("Datos inválidos o habilidades que no están dadas de alta"),
                404: error("Colectivo inexistente"),
            },
        },
    },
    "/api/colectivos/{colectivoId}/proyectos/{proyectoId}": {
        parameters: [colectivoId, proyectoId],
        patch: {
            tags: ["Proyectos"],
            summary: "Cierra el proyecto: deja de admitir colaboraciones",
            requestBody: cuerpo(cerrarProyectoSchema),
            responses: {
                200: respuesta("Proyecto finalizado", ref("Proyecto")),
                404: error("Proyecto inexistente o de otro colectivo"),
                409: error("El proyecto ya estaba finalizado"),
            },
        },
    },
    "/api/proyectos": {
        get: {
            tags: ["Proyectos"],
            summary: "Lista los proyectos",
            responses: { 200: respuesta("Proyectos", lista(ref("Proyecto"))) },
        },
    },
    "/api/proyectos/{proyectoId}": {
        parameters: [proyectoId],
        get: {
            tags: ["Proyectos"],
            summary: "Obtiene un proyecto con sus perfiles y logros",
            responses: {
                200: respuesta("Proyecto", ref("Proyecto")),
                404: error("Proyecto inexistente"),
            },
        },
    },
    "/api/proyectos/{proyectoId}/perfiles": {
        parameters: [proyectoId],
        get: {
            tags: ["Perfiles"],
            summary: "Lista los perfiles del proyecto",
            responses: {
                200: respuesta("Perfiles", lista(ref("Perfil"))),
                404: error("Proyecto inexistente"),
            },
        },
        post: {
            tags: ["Perfiles"],
            summary: "Agrega un perfil al proyecto",
            requestBody: cuerpo(crearPerfilSchema),
            responses: {
                201: respuesta("Perfil creado", ref("Perfil")),
                400: error("Datos inválidos o habilidades que no están dadas de alta"),
                404: error("Proyecto inexistente"),
            },
        },
    },
    "/api/proyectos/{proyectoId}/perfiles/{perfilId}": {
        parameters: [proyectoId, perfilId],
        get: {
            tags: ["Perfiles"],
            summary: "Obtiene un perfil",
            responses: {
                200: respuesta("Perfil", ref("Perfil")),
                404: error("Proyecto o perfil inexistente"),
            },
        },
        put: {
            tags: ["Perfiles"],
            summary: "Actualiza los campos informados del perfil",
            requestBody: cuerpo(actualizarPerfilSchema),
            responses: {
                200: respuesta("Perfil actualizado", ref("Perfil")),
                400: error("Datos inválidos o ningún campo informado"),
                404: error("Proyecto o perfil inexistente"),
            },
        },
        delete: {
            tags: ["Perfiles"],
            summary: "Elimina el perfil",
            responses: {
                200: respuesta("Perfil eliminado", ref("Perfil")),
                404: error("Proyecto o perfil inexistente"),
            },
        },
    },
    "/api/proyectos/{proyectoId}/perfiles/{perfilId}/colaboradoras-potenciales": {
        parameters: [proyectoId, perfilId],
        get: {
            tags: ["Búsquedas"],
            summary: "Busca colaboradoras para un perfil",
            description: "Devuelve las colaboradoras con al menos una habilidad requerida por el perfil, "
                + "ordenadas por cuántas habilidades del perfil (requeridas u opcionales) tienen.",
            responses: {
                200: respuesta("Colaboradoras potenciales", lista(ref("Colaboradora"))),
                404: error("Proyecto o perfil inexistente"),
            },
        },
    },
    "/api/colaboradoras/{id}/proyectos-potenciales": {
        parameters: [colaboradoraId],
        get: {
            tags: ["Búsquedas"],
            summary: "Busca proyectos para una colaboradora",
            description: "Devuelve los proyectos activos con al menos un perfil cuyas habilidades requeridas "
                + "incluyen alguna de la colaboradora, junto con esos perfiles.",
            responses: {
                200: respuesta("Proyectos potenciales", lista(ref("ProyectoPotencial"))),
                404: error("Colaboradora inexistente"),
            },
        },
    },
    "/api/proyectos/{proyectoId}/colaboraciones": {
        parameters: [proyectoId],
        post: {
            tags: ["Colaboraciones"],
            summary: "Anota a una colaboradora en el proyecto",
            description: "La colaboradora necesita al menos una habilidad requerida del perfil. "
                + "Si no se indica perfilId, queda en el primer perfil que le corresponde.",
            requestBody: cuerpo(anotarColaboradoraSchema),
            responses: {
                201: respuesta("Colaboración creada", ref("Colaboracion")),
                400: error("No tiene ninguna habilidad requerida"),
                404: error("Proyecto, perfil o colaboradora inexistente"),
                409: error("Proyecto finalizado o colaboradora ya anotada en ese perfil"),
            },
        },
    },
    "/api/proyectos/{proyectoId}/colaboradoras": {
        parameters: [proyectoId],
        get: {
            tags: ["Colaboraciones"],
            summary: "Lista las colaboradoras anotadas en el proyecto",
            responses: {
                200: respuesta("Colaboradoras", lista(ref("Colaboradora"))),
                404: error("Proyecto inexistente"),
            },
        },
    },
    "/api/colaboraciones": {
        get: {
            tags: ["Colaboraciones"],
            summary: "Lista todas las colaboraciones",
            responses: { 200: respuesta("Colaboraciones", lista(ref("Colaboracion"))) },
        },
    },
    "/api/colaboraciones/{colaboracionId}": {
        parameters: [colaboracionId],
        get: {
            tags: ["Colaboraciones"],
            summary: "Obtiene una colaboración",
            responses: {
                200: respuesta("Colaboración", ref("Colaboracion")),
                404: error("Colaboración inexistente"),
            },
        },
    },
};

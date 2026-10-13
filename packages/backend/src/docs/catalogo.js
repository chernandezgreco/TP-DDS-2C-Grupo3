import { crearColectivoSchema } from "../schemas/ColectivoSchema.js";
import { crearHabilidadSchema } from "../schemas/HabilidadSchema.js";
import { agregarHabilidadSchema, crearColaboradoraSchema } from "../schemas/ColaboradoraSchema.js";
import { TipoColectivo } from "../domain/Colectivo/TipoColectivo.js";
import { cuerpo, error, lista, parametro, ref, respuesta } from "./comun.js";

// Colectivos, habilidades y colaboradoras

const idColaboradora = parametro("id", "Id de la colaboradora", "650000000000000000000301");

export const schemasCatalogo = {
    Colectivo: {
        type: "object",
        properties: {
            id: { type: "string" },
            nombre: { type: "string", example: "Fundación Manos Unidas" },
            descripcion: { type: "string" },
            ubicacion: { type: "string", example: "Avellaneda, Buenos Aires" },
            tipo: { type: "string", enum: Object.values(TipoColectivo) },
        },
    },
    Habilidad: {
        type: "object",
        properties: {
            codigo: { type: "string", description: "Título normalizado; es como se referencia la habilidad", example: "diseño-ux" },
            titulo: { type: "string", example: "Diseño UX" },
            descripcion: { type: "string" },
        },
    },
    Colaboradora: {
        type: "object",
        description: "Los medios de contacto nunca se incluyen en las respuestas",
        properties: {
            id: { type: "string" },
            nombreFantasia: { type: "string", example: "Ada" },
            github: { type: "string", example: "github.com/ada-dev" },
            nombreApellido: { type: "string" },
            habilidades: lista({ type: "string", example: "react" }),
            pronombres: { type: "string" },
            presentacion: { type: "string" },
            aceptaMensajeria: { type: "boolean" },
        },
    },
};

export const pathsCatalogo = {
    "/api/colectivos": {
        post: {
            tags: ["Colectivos"],
            summary: "Inscribe un colectivo",
            requestBody: cuerpo(crearColectivoSchema),
            responses: {
                201: respuesta("Colectivo creado", ref("Colectivo")),
                400: error("Datos inválidos (por ejemplo, un tipo inexistente)"),
            },
        },
        get: {
            tags: ["Colectivos"],
            summary: "Lista los colectivos",
            responses: { 200: respuesta("Colectivos", lista(ref("Colectivo"))) },
        },
    },
    "/api/habilidades": {
        post: {
            tags: ["Habilidades"],
            summary: "Da de alta una habilidad; el código se genera a partir del título",
            requestBody: cuerpo(crearHabilidadSchema),
            responses: {
                201: respuesta("Habilidad creada", ref("Habilidad")),
                400: error("Datos inválidos"),
                409: error("Ya existe una habilidad con ese código"),
            },
        },
        get: {
            tags: ["Habilidades"],
            summary: "Lista las habilidades",
            responses: { 200: respuesta("Habilidades", lista(ref("Habilidad"))) },
        },
    },
    "/api/colaboradoras": {
        post: {
            tags: ["Colaboradoras"],
            summary: "Registra una colaboradora",
            requestBody: cuerpo(crearColaboradoraSchema),
            responses: {
                201: respuesta("Colaboradora creada", ref("Colaboradora")),
                400: error("Datos inválidos o habilidades que no están dadas de alta"),
            },
        },
        get: {
            tags: ["Colaboradoras"],
            summary: "Lista las colaboradoras",
            responses: { 200: respuesta("Colaboradoras", lista(ref("Colaboradora"))) },
        },
    },
    "/api/colaboradoras/{id}": {
        parameters: [idColaboradora],
        get: {
            tags: ["Colaboradoras"],
            summary: "Obtiene una colaboradora",
            responses: {
                200: respuesta("Colaboradora", ref("Colaboradora")),
                404: error("Colaboradora inexistente"),
            },
        },
    },
    "/api/colaboradoras/{id}/habilidades": {
        parameters: [idColaboradora],
        post: {
            tags: ["Colaboradoras"],
            summary: "Agrega una habilidad a la colaboradora",
            requestBody: cuerpo(agregarHabilidadSchema),
            responses: {
                201: respuesta("Colaboradora actualizada", ref("Colaboradora")),
                400: error("La habilidad no está dada de alta"),
                404: error("Colaboradora inexistente"),
                409: error("La colaboradora ya tiene esa habilidad"),
            },
        },
    },
};

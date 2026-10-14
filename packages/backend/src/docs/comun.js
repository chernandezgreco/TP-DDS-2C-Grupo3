import { z } from "zod";

// Piezas compartidas por los módulos de documentación

// El body se genera solo a partir del schema de Zod, en el dialecto de OpenAPI 3.0
export const cuerpo = (schema) => {
    const jsonSchema = z.toJSONSchema(schema, { io: "input", target: "openapi-3.0" });
    delete jsonSchema.$schema;
    return { required: true, content: { "application/json": { schema: jsonSchema } } };
};

export const ref = (nombre) => ({ $ref: `#/components/schemas/${nombre}` });

export const lista = (schema) => ({ type: "array", items: schema });

export const respuesta = (description, schema) => ({
    description,
    content: { "application/json": { schema } },
});

export const error = (description) => respuesta(description, ref("Error"));

export const parametro = (name, description, example) => ({
    name,
    in: "path",
    required: true,
    description,
    schema: { type: "string", example },
});

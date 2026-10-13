import { z } from "zod";

// Piezas compartidas por los módulos de documentación

// El body se genera solo a partir del schema de Zod
export const cuerpo = (schema) => {
    const { $schema, ...resto } = z.toJSONSchema(schema, { io: "input" });
    return { required: true, content: { "application/json": { schema: resto } } };
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

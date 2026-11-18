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

// Etiquetas de proyectos y colectivos (ver domain/etiquetas.js)
export const esquemaEtiquetas = lista({
    type: "string",
    pattern: "^[a-z0-9]+(-[a-z0-9]+)*$",
    minLength: 2,
    maxLength: 30,
    example: "educacion-popular",
});
esquemaEtiquetas.maxItems = 10;
esquemaEtiquetas.description =
    "Etiquetas libres, normalizadas: minúsculas, sin acentos y con guiones en lugar de espacios " +
    "(\"Educación Popular\" se guarda como \"educacion-popular\"). Hasta 10, sin repetir.";

export const parametroEtiquetas = {
    name: "etiquetas",
    in: "query",
    required: false,
    description:
        "Filtra por etiquetas separadas por coma (o repitiendo el parámetro). " +
        "Se normalizan igual que al cargarlas y el resultado debe tener todas.",
    schema: { type: "string", example: "salud,educacion" },
};

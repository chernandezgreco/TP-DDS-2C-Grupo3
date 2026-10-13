const referenciaLogro = { $ref: "#/components/schemas/Logro" };

const respuesta = (description, schema) => ({
    description,
    content: {
        "application/json": { schema },
    },
});

const error = (description) =>
    respuesta(description, { $ref: "#/components/schemas/Error" });

const proyectoId = {
    name: "proyectoId",
    in: "path",
    required: true,
    description: "Identificador MongoDB del proyecto",
    schema: {
        type: "string",
        example: "507f1f77bcf86cd799439011",
    },
};

const logroId = {
    name: "logroId",
    in: "path",
    required: true,
    description: "UUID del logro",
    schema: { type: "string", format: "uuid" },
};

const camposLogro = {
    descripcion: {
        type: "string",
        minLength: 1,
        description: "Texto obligatorio, sin espacios en blanco únicamente",
        example: "Primera versión publicada",
    },
    porcentajeCompletitud: {
        type: "number",
        minimum: 0,
        maximum: 100,
        example: 25,
    },
    enlaceSistema: {
        type: "string",
        nullable: true,
        description: "URL válida; null o texto vacío permiten quitar el enlace",
        example: "https://sistema.example.com",
    },
    enlaceFuentePublica: {
        type: "string",
        nullable: true,
        description: "URL del código fuente público; admite null o texto vacío",
        example: "https://github.com/grupo/proyecto",
    },
};

export const schemasLogros = {
    Logro: {
        type: "object",
        required: [
            "id",
            "descripcion",
            "porcentajeCompletitud",
            "enlaceSistema",
            "enlaceFuentePublica",
            "fechaCreacion",
        ],
        properties: {
            id: { type: "string", format: "uuid" },
            ...camposLogro,
            fechaCreacion: { type: "string", format: "date-time" },
        },
    },
    CrearLogro: {
        type: "object",
        required: ["descripcion", "porcentajeCompletitud"],
        properties: camposLogro,
    },
    ActualizarLogro: {
        type: "object",
        minProperties: 1,
        description: "Informar al menos un campo reconocido. Los omitidos se conservan.",
        properties: camposLogro,
    },
};

const cuerpo = (nombreSchema) => ({
    required: true,
    content: {
        "application/json": {
            schema: { $ref: `#/components/schemas/${nombreSchema}` },
        },
    },
});

export const pathsLogros = {
    "/api/proyectos/{proyectoId}/logros": {
        parameters: [proyectoId],
        post: {
            tags: ["Logros"],
            summary: "Crea un logro dentro del proyecto",
            requestBody: cuerpo("CrearLogro"),
            responses: {
                201: respuesta("Logro creado", referenciaLogro),
                400: error("Datos inválidos"),
                404: error("Proyecto inexistente o identificador inválido"),
            },
        },
        get: {
            tags: ["Logros"],
            summary: "Lista los logros del proyecto",
            responses: {
                200: respuesta("Logros del proyecto; puede ser una lista vacía", {
                    type: "array",
                    items: referenciaLogro,
                }),
                404: error("Proyecto inexistente o identificador inválido"),
            },
        },
    },
    "/api/proyectos/{proyectoId}/logros/{logroId}": {
        parameters: [proyectoId, logroId],
        get: {
            tags: ["Logros"],
            summary: "Obtiene un logro del proyecto",
            responses: {
                200: respuesta("Logro encontrado", referenciaLogro),
                404: error("Proyecto o logro inexistente"),
            },
        },
        put: {
            tags: ["Logros"],
            summary: "Actualiza los campos informados de un logro",
            requestBody: cuerpo("ActualizarLogro"),
            responses: {
                200: respuesta("Logro actualizado", referenciaLogro),
                400: error("Datos inválidos o ningún campo reconocido"),
                404: error("Proyecto o logro inexistente"),
            },
        },
        delete: {
            tags: ["Logros"],
            summary: "Elimina un logro del proyecto",
            responses: {
                200: respuesta("Logro eliminado", referenciaLogro),
                404: error("Proyecto o logro inexistente"),
            },
        },
    },
};
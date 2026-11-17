const referenciaTarea = { $ref: "#/components/schemas/Tarea" };

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

const tareaId = {
    name: "tareaId",
    in: "path",
    required: true,
    description: "Identificador MongoDB de la tarea",
    schema: {
        type: "string",
        example: "507f1f77bcf86cd799439012",
    },
};

const estados = ["PENDIENTE", "EN_CURSO", "FINALIZADA", "CERRADA"];

const camposEditables = {
    nombre: {
        type: "string",
        minLength: 1,
        maxLength: 100,
        example: "Diseñar pantallas",
    },
    descripcion: {
        type: "string",
        nullable: true,
        maxLength: 500,
        description: "Opcional; null o texto vacío la dejan sin descripción",
        example: "Mockups del listado y del formulario",
    },
    fechaInicio: {
        type: "string",
        format: "date",
        description: "Día de calendario (AAAA-MM-DD) entre 2020 y 2050",
        example: "2026-11-02",
    },
    fechaFin: {
        type: "string",
        format: "date",
        description: "Día de calendario, igual o posterior al de inicio; la tarea no puede durar más de 1095 días",
        example: "2026-11-06",
    },
    responsableId: {
        type: "string",
        nullable: true,
        description:
            "Id de una colaboradora del proyecto, o null/texto vacío si todavía no hay responsable. Para quien no puede ver a una colaboradora anónima se devuelve \"Anonimo\".",
        example: "650000000000000000000301",
    },
};

export const schemasTareas = {
    Tarea: {
        type: "object",
        required: [
            "id",
            "proyectoId",
            "nombre",
            "descripcion",
            "fechaInicio",
            "fechaFin",
            "duracion",
            "responsableId",
            "estado",
            "fechaCreacion",
        ],
        properties: {
            id: { type: "string", example: "507f1f77bcf86cd799439012" },
            proyectoId: { type: "string", example: "507f1f77bcf86cd799439011" },
            ...camposEditables,
            duracion: {
                type: "integer",
                readOnly: true,
                description: "Días de calendario contando el de inicio y el de fin; se calcula, no se guarda",
                example: 5,
            },
            estado: {
                type: "string",
                enum: estados,
                description:
                    "CERRADA la asigna el sistema al finalizar el proyecto con la tarea sin terminar; no se puede elegir",
                example: "PENDIENTE",
            },
            fechaCreacion: { type: "string", format: "date-time" },
        },
    },
    CrearTarea: {
        type: "object",
        required: ["nombre", "fechaInicio", "fechaFin"],
        description: "El estado inicial siempre es PENDIENTE; si se envía otro se ignora.",
        properties: camposEditables,
    },
    ActualizarTarea: {
        type: "object",
        minProperties: 1,
        description:
            "Informar al menos un campo. Los omitidos se conservan y los campos desconocidos (id, proyectoId, duracion...) se ignoran. Transiciones de estado permitidas: PENDIENTE↔EN_CURSO, PENDIENTE→FINALIZADA, EN_CURSO↔FINALIZADA y FINALIZADA→EN_CURSO.",
        properties: {
            ...camposEditables,
            estado: {
                type: "string",
                enum: ["PENDIENTE", "EN_CURSO", "FINALIZADA"],
                example: "EN_CURSO",
            },
        },
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

const sinSesion = error("No inició sesión");
const sinPermiso = error(
    "No es el colectivo dueño del proyecto. También se responde 403 si el identificador tiene formato válido pero el proyecto no existe",
);
const proyectoFinalizado = error("El proyecto está finalizado");

export const pathsTareas = {
    "/api/proyectos/{proyectoId}/tareas": {
        parameters: [proyectoId],
        post: {
            tags: ["Tareas"],
            summary: "Crea una tarea del proyecto (solo el colectivo dueño)",
            requestBody: cuerpo("CrearTarea"),
            responses: {
                201: respuesta("Tarea creada", referenciaTarea),
                400: error("Datos inválidos, responsable que no colabora en el proyecto o proyecto suspendido"),
                401: sinSesion,
                403: sinPermiso,
                404: error("Identificador de proyecto con formato inválido"),
                409: error("El proyecto está finalizado o ya tiene el máximo de 100 tareas"),
            },
        },
        get: {
            tags: ["Tareas"],
            summary: "Lista las tareas del proyecto, ordenadas por fecha de inicio",
            description:
                "Es público. Para el Gantt: cada tarea trae fechaInicio, fechaFin y duracion. Si el responsable es una colaboradora anónima, solo lo ven el colectivo dueño y ella misma; el resto recibe \"Anonimo\".",
            responses: {
                200: respuesta("Tareas del proyecto; puede ser una lista vacía", {
                    type: "array",
                    items: referenciaTarea,
                }),
                400: error("Proyecto suspendido por incumplimiento de términos"),
                404: error("Proyecto inexistente o identificador inválido"),
            },
        },
    },
    "/api/proyectos/{proyectoId}/tareas/{tareaId}": {
        parameters: [proyectoId, tareaId],
        get: {
            tags: ["Tareas"],
            summary: "Obtiene una tarea del proyecto",
            responses: {
                200: respuesta("Tarea encontrada", referenciaTarea),
                404: error("Proyecto o tarea inexistente, o la tarea es de otro proyecto"),
            },
        },
        put: {
            tags: ["Tareas"],
            summary: "Edita o reprograma una tarea (solo el colectivo dueño)",
            requestBody: cuerpo("ActualizarTarea"),
            responses: {
                200: respuesta("Tarea actualizada", referenciaTarea),
                400: error("Datos inválidos, estado CERRADA o responsable que no colabora en el proyecto"),
                401: sinSesion,
                403: sinPermiso,
                404: error("Tarea inexistente, identificador inválido o tarea de otro proyecto"),
                409: error("El proyecto está finalizado o la transición de estado no está permitida"),
            },
        },
        delete: {
            tags: ["Tareas"],
            summary: "Elimina una tarea (solo el colectivo dueño)",
            responses: {
                200: respuesta("Tarea eliminada", referenciaTarea),
                401: sinSesion,
                403: sinPermiso,
                404: error("Tarea inexistente, identificador inválido o tarea de otro proyecto"),
                409: proyectoFinalizado,
            },
        },
    },
};

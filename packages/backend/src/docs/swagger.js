import { pathsContacto, schemasContacto } from "./contactoNotificaciones.js";

// Cada modulo suma sus paths y schemas acá
export const especificacion = {
    openapi: "3.0.3",
    info: {
        title: "Código a Voluntad - API",
        version: "2.0.0",
        description: "API del backend del TP de Desarrollo de Software (grupo 3)",
    },
    paths: { ...pathsContacto },
    components: {
        schemas: {
            Error: {
                type: "object",
                properties: {
                    error: { type: "string" },
                    detalle: { type: "object" },
                },
            },
            ...schemasContacto,
        },
    },
};

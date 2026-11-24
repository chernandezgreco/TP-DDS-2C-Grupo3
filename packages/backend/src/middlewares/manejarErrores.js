import {
    DomainError,
    NotFoundError,
    ConflictError,
    ForbiddenError,
    UnavailableError,
} from "../domain/errores.js";

// El orden importa: las subclases van antes que DomainError
const STATUS = new Map([
    [ForbiddenError, 403],
    [UnavailableError, 503],
    [NotFoundError, 404],
    [ConflictError, 409],
    [DomainError, 400],
]);

// eslint-disable-next-line no-unused-vars
export const manejarErrores = (err, req, res, next) => {
    if (err.type === "entity.parse.failed") {
        return res.status(400).json({ error: "El body no es un JSON válido" });
    }

    if (err.type === "entity.too.large") {
        return res.status(413).json({ error: "El body supera el tamaño permitido" });
    }

    // Mongoose puede devolver duplicados aun cuando el servicio ya hizo una
    // consulta previa: el índice único es la última defensa ante carreras.
    if (err.code === 11000) {
        return res.status(409).json({ error: "Ya existe un registro con esos datos." });
    }

    if (err.name === "ValidationError") {
        return res.status(400).json({
            error: "Los datos no cumplen las reglas del servidor.",
            detalle: { campos: Object.keys(err.errors || {}) },
        });
    }

    if (err.name === "VersionError") {
        return res.status(409).json({ error: "El recurso cambió durante la operación. Volvé a cargarlo." });
    }

    if (err.name === "CastError") {
        return res.status(404).json({ error: "El id no es válido", detalle: { valor: err.value } });
    }

    for (const [Tipo, status] of STATUS) {
        if (err instanceof Tipo) {
            return res.status(status).json({ error: err.message, detalle: err.detalle });
        }
    }

    if (process.env.NODE_ENV === "production") {
        console.error("Error interno", {
            method: req.method,
            path: req.path,
            name: err.name,
        });
    } else {
        console.error(err);
    }
    res.status(500).json({ error: "Error interno del servidor" });
};

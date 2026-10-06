import { DomainError, NotFoundError, ConflictError } from "../domain/errores.js";

// El orden importa: las subclases van antes que DomainError
const STATUS = new Map([
    [NotFoundError, 404],
    [ConflictError, 409],
    [DomainError, 400],
]);

// eslint-disable-next-line no-unused-vars
export const manejarErrores = (err, req, res, next) => {
    if (err.type === "entity.parse.failed") {
        return res.status(400).json({ error: "El body no es un JSON válido" });
    }

    for (const [Tipo, status] of STATUS) {
        if (err instanceof Tipo) {
            return res.status(status).json({ error: err.message, detalle: err.detalle });
        }
    }

    console.error(err);
    res.status(500).json({ error: "Error interno del servidor" });
};

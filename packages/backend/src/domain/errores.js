// Errores del negocio. No saben nada de HTTP: el status lo decide middlewares/manejarErrores.js

// Se rompió una regla del negocio o el pedido es inválido
export class DomainError extends Error {
    constructor(mensaje, detalle) {
        super(mensaje);
        this.name = this.constructor.name;
        this.detalle = detalle;
    }
}

// El recurso pedido no existe
export class NotFoundError extends DomainError {}

// El pedido choca con el estado actual (ya existe, ya está anotada)
export class ConflictError extends DomainError {}

import { DomainError } from "../domain/errores.js";

const errorDeValidacion = (resultado) => {
    const issue = resultado.error.issues[0];
    const campo = issue.path.join(".");
    return new DomainError(issue.message, campo ? { campo } : undefined);
};

export const validar = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
        return next(errorDeValidacion(result));
    }
    req.body = result.data;
    next();
};

// En Express 5 req.query es de sólo lectura: los parámetros validados quedan en req.consulta
export const validarQuery = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
        return next(errorDeValidacion(result));
    }
    req.consulta = result.data;
    next();
};

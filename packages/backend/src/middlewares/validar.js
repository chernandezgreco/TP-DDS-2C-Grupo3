import { DomainError } from "../domain/errores.js";

export const validar = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
        const issue = result.error.issues[0];
        const campo = issue.path.join(".");
        return next(new DomainError(issue.message, campo ? { campo } : undefined));
    }
    req.body = result.data;
    next();
};

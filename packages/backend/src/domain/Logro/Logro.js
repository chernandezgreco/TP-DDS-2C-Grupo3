import { DomainError } from "../errores.js";
import { esTextoNoVacio } from "../validaciones.js";

const esUrlValida = (valor) => {
    if (valor === null || valor === undefined || valor === "") {
        return true;
    }

    try {
        new URL(valor);
        return true;
    } catch {
        return false;
    }
};

export class Logro {
    constructor(
        id,
        descripcion,
        porcentajeCompletitud,
        enlaceSistema = null,
        enlaceFuentePublica = null,
        fechaCreacion = new Date(),
    ) {
        if (!esTextoNoVacio(descripcion)) {
            throw new DomainError("La descripción del logro es obligatoria", {
                campo: "descripcion",
            });
        }

        if (
            typeof porcentajeCompletitud !== "number" ||
            !Number.isFinite(porcentajeCompletitud) ||
            porcentajeCompletitud < 0 ||
            porcentajeCompletitud > 100
        ) {
            throw new DomainError(
                "El porcentaje de completitud debe estar entre 0 y 100",
                { campo: "porcentajeCompletitud" },
            );
        }

        if (!esUrlValida(enlaceSistema)) {
            throw new DomainError("El enlace al sistema no es válido", {
                campo: "enlaceSistema",
            });
        }

        if (!esUrlValida(enlaceFuentePublica)) {
            throw new DomainError("El enlace a la fuente pública no es válido", {
                campo: "enlaceFuentePublica",
            });
        }

        this.id = id;
        this.descripcion = descripcion.trim();
        this.porcentajeCompletitud = porcentajeCompletitud;
        this.enlaceSistema = enlaceSistema || null;
        this.enlaceFuentePublica = enlaceFuentePublica || null;
        this.fechaCreacion = fechaCreacion;
    }
}
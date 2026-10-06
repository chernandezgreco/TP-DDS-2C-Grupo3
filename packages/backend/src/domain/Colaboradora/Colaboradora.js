import { esTextoNoVacio } from "../validaciones.js";
import { ConflictError, DomainError } from "../errores.js";

export class Colaboradora {
    constructor(id, nombreFantasia, github, nombreApellido, habilidades, pronombres, presentacion) {
        if (!esTextoNoVacio(nombreFantasia)) {
            throw new DomainError("El nombre de fantasía es obligatorio", { campo: "nombreFantasia" });
        }
        if (!esTextoNoVacio(github)) {
            throw new DomainError("La cuenta de GitHub o GitLab es obligatoria", { campo: "github" });
        }
        if (!Array.isArray(habilidades) || habilidades.length === 0) {
            throw new DomainError("La colaboradora debe tener al menos una habilidad", { campo: "habilidades" });
        }

        this.id = id;
        this.nombreFantasia = nombreFantasia;
        this.github = github;
        this.nombreApellido = nombreApellido;
        this.habilidades = [...habilidades];
        this.pronombres = pronombres;
        this.presentacion = presentacion;
    }

    agregarHabilidad(codigoHabilidad) {
        if (this.habilidades.includes(codigoHabilidad)) {
            throw new ConflictError("La colaboradora ya tiene esta habilidad", {
                colaboradora: { id: this.id, nombreFantasia: this.nombreFantasia, habilidades: this.habilidades },
                habilidad: codigoHabilidad,
            });
        }

        this.habilidades.push(codigoHabilidad);
    }

    cumpleAlgunaHabilidad(habilidadesRequeridas) {
        return this.habilidades.some((codigo) => habilidadesRequeridas.includes(codigo));
    }
}

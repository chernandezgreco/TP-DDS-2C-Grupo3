export class Colaboradora {
    constructor(id, nombreFantasia, github, nombreApellido, habilidades, pronombres, presentacion) {
        this.id = id;
        this.nombreFantasia = nombreFantasia;
        this.github = github;
        this.nombreApellido = nombreApellido;
        this.habilidades = Array.isArray(habilidades) ? [...habilidades] : [];
        this.pronombres = pronombres;
        this.presentacion = presentacion;
    }

    agregarHabilidad(codigoHabilidad) {
        if (typeof codigoHabilidad !== "string" || !codigoHabilidad.trim()) {
            throw new Error("El código de la habilidad es obligatorio");
        }

        const codigo = codigoHabilidad.trim();

        if (this.habilidades.includes(codigo)) {
            throw new Error("La colaboradora ya tiene esta habilidad");
        }

        this.habilidades.push(codigo);
    }

    cumpleAlgunaHabilidad(habilidadesRequeridas) {
        if (!Array.isArray(habilidadesRequeridas) || habilidadesRequeridas.length === 0) {
            return false;
        }

        return this.habilidades.some((codigo) => habilidadesRequeridas.includes(codigo));
    }
}

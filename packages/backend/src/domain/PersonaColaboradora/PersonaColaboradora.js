export class PersonaColaboradora {
    constructor(id, nombreFantasia, cuentaGithubGitlab, nombreApellido, pronombres, presentacion, habilidades = []) {
        this.id = id;
        this.nombreFantasia = nombreFantasia;
        this.cuentaGithubGitlab = cuentaGithubGitlab;
        this.nombreApellido = nombreApellido;
        this.pronombres = pronombres;
        this.presentacion = presentacion;
        this.habilidades = habilidades; // Array de IDs de habilidades o objetos Habilidad
    }

    cumpleAlgunaHabilidad(habilidadesRequeridas) {
        return this.habilidades.some(hId => habilidadesRequeridas.includes(hId));
    }
}
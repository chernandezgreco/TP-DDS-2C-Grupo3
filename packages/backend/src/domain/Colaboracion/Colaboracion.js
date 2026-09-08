export class Colaboracion {
    constructor(id, proyectoId, colaboradoraId, fechaInscripcion = new Date()) {
        this.id = id;
        this.proyectoId = proyectoId;
        this.colaboradoraId = colaboradoraId;
        this.fechaInscripcion = fechaInscripcion;
    }
}

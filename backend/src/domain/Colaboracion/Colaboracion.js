export class Colaboracion {
    constructor(id, proyectoId, colaboradoraId, fecha = new Date()) {
        this.id = id;
        this.proyectoId = proyectoId;
        this.colaboradoraId = colaboradoraId;
        this.fecha = fecha;
    }
}
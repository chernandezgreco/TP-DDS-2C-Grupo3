export class Proyecto {
    constructor(id, colectivoId, titulo, descripcion, habilidadesRequeridas = [], compromiso, modalidad) {
        this.id = id;
        this.colectivoId = colectivoId;
        this.titulo = titulo;
        this.descripcion = descripcion;
        this.habilidadesRequeridas = habilidadesRequeridas;
        this.compromiso = compromiso;
        this.modalidad = modalidad;
        this.estado = 'ACTIVO'; // ACTIVO o FINALIZADO
        this.colaboraciones = [];
    }

    cerrar() {
        this.estado = 'FINALIZADO';
    }

    estaActivo() {
        return this.estado === 'ACTIVO';
    }
}
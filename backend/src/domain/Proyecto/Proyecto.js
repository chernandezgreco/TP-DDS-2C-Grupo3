export class Proyecto {
    constructor(id, titulo, descripcion, habilidadesRequeridas, compromiso, modalidad, colectivoId) {
        this.id = id;
        this.titulo = titulo;
        this.descripcion = descripcion;
        this.habilidadesRequeridas = habilidadesRequeridas;
        this.compromiso = compromiso;
        this.modalidad = modalidad;
        this.colectivoId = colectivoId;
        this.estado = 'ABIERTO'; 
    }

    cerrar() {
        this.estado = 'CERRADO';
    }

    estaAbierto() {
        return this.estado === 'ABIERTO';
    }
}
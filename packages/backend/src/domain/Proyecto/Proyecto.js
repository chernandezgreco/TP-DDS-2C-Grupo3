import { Compromiso } from "../Compromiso/Compromiso.js";
import { ModalidadColaboracion } from "../ModalidadColaboracion/ModalidadColaboracion.js";
import { EstadoProyecto } from "./EstadoProyecto.js";

export class Proyecto {
    constructor(id, titulo, descripcion, habilidadesRequeridas, compromiso, modalidad, colectivoId) {
        if (!(compromiso instanceof Compromiso)) {
            throw new Error("El compromiso del proyecto no es válido");
        }

        if (!(modalidad instanceof ModalidadColaboracion)) {
            throw new Error("La modalidad de colaboración del proyecto no es válida");
        }

        this.id = id;
        this.titulo = titulo;
        this.descripcion = descripcion;
        this.habilidadesRequeridas = habilidadesRequeridas;
        this.compromiso = compromiso;
        this.modalidad = modalidad;
        this.colectivoId = colectivoId;
        this.estado = EstadoProyecto.ACTIVO;
    }

    cerrar() {
        if (this.estado === EstadoProyecto.FINALIZADO) {
            return;
        }

        this.estado = EstadoProyecto.FINALIZADO;
    }

    estaActivo() {
        return this.estado === EstadoProyecto.ACTIVO;
    }
}

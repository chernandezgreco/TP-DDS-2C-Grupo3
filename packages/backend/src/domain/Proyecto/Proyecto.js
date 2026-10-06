import { EstadoProyecto } from "./EstadoProyecto.js";
import { Perfil } from "../Perfiles/Perfiles.js"; 

export class Proyecto {
    constructor(id, titulo, descripcion, colectivoId, perfiles = []) {
        this.id = id;
        this.titulo = titulo;
        this.descripcion = descripcion;
        this.colectivoId = colectivoId;
        this.estado = EstadoProyecto.ACTIVO;
        this.perfiles = perfiles; 
    }

    agregarPerfil(perfil) {
        if (!(perfil instanceof Perfil)) {
            throw new Error("El perfil no es válido");
        }
        this.perfiles.push(perfil);
    }

    eliminarPerfil(perfilId) {
        this.perfiles = this.perfiles.filter(p => p.id !== perfilId);
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
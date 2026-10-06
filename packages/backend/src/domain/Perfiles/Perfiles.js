import { Compromiso } from "../Compromiso/Compromiso.js";
import { ModalidadColaboracion } from "../ModalidadColaboracion/ModalidadColaboracion.js";

export class Perfil {
    constructor(id, descripcionPerfil, habilidadesRequeridas, habilidadesOpcionales, compromiso, modalidad) {
        if (!(compromiso instanceof Compromiso)) {
            throw new Error("El compromiso del perfil no es válido");
        }

        if (!(modalidad instanceof ModalidadColaboracion)) {
            throw new Error("La modalidad de colaboración del perfil no es válida");
        }

        this.id = id;
        this.descripcionPerfil = descripcionPerfil;
        this.habilidadesRequeridas = habilidadesRequeridas || []; 
        this.habilidadesOpcionales = habilidadesOpcionales || []; 
        this.compromiso = compromiso; 
        this.modalidad = modalidad;
    }
}
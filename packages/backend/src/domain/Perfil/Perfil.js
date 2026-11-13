import { Compromiso } from "../Compromiso/Compromiso.js";
import { ModalidadColaboracion } from "../ModalidadColaboracion/ModalidadColaboracion.js";
import { esTextoNoVacio } from "../validaciones.js";
import { DomainError } from "../errores.js";

export class Perfil {
    constructor(id, descripcionPerfil, fechaLimite, cantidadLimite, habilidadesRequeridas, habilidadesOpcionales = [], compromiso, modalidad, postulaciones = []) {
        if (!esTextoNoVacio(descripcionPerfil)) {
            throw new DomainError("La descripción del perfil es obligatoria", { campo: "descripcionPerfil" });
        }
        if (!Array.isArray(habilidadesRequeridas) || habilidadesRequeridas.length === 0) {
            throw new DomainError("El perfil debe tener al menos una habilidad requerida", { campo: "habilidadesRequeridas" });
        }
        if (!Array.isArray(habilidadesOpcionales)) {
            throw new DomainError("Las habilidades opcionales deben ser una lista", { campo: "habilidadesOpcionales" });
        }
        if (!(compromiso instanceof Compromiso)) {
            throw new DomainError("El compromiso del perfil no es válido", { campo: "compromiso" });
        }
        if (!(modalidad instanceof ModalidadColaboracion)) {
            throw new DomainError("La modalidad de colaboración del perfil no es válida", { campo: "modalidad" });
        }

    this.id = id;
    this.descripcionPerfil = descripcionPerfil.trim();
    this.fechaLimite = fechaLimite; 
    this.cantidadLimite = cantidadLimite;
    this.habilidadesRequeridas = [...habilidadesRequeridas];
    this.habilidadesOpcionales = [...habilidadesOpcionales];
    this.compromiso = compromiso;
    this.modalidad = modalidad;
    this.postulaciones = postulaciones ?? []; 
  }

estaAbierto(cantidadPostulacionesActuales = (this.postulaciones?.length ?? 0), fechaActual = new Date()) {
        const superaCantidad = this.cantidadLimite !== null && cantidadPostulacionesActuales >= this.cantidadLimite;
        const venceFecha = this.fechaLimite && fechaActual > new Date(this.fechaLimite);

        return !superaCantidad && !venceFecha;
    }

    validarPuedeAnotar(cantidadPostulacionesActuales = (this.postulaciones?.length ?? 0), fechaActual = new Date()) {
        if (this.cantidadLimite !== null && cantidadPostulacionesActuales >= this.cantidadLimite) {
            throw new DomainError("Se ha alcanzado el límite máximo de postulaciones para este perfil", { campo: "cantidadLimite" });
        }
        
        if (this.fechaLimite && fechaActual > new Date(this.fechaLimite)) {
            throw new DomainError("La fecha límite para postularse a este perfil ha expirado", { campo: "fechaLimite" });
        }
    }
    admiteA(colaboradora) {
    // Si la colaboradora tiene sus habilidades como un array (ej: ["JavaScript", "NodeJS"])
    const habilidadesColaboradora = colaboradora.habilidades ?? [];

    // Verificamos si cumple con las habilidades requeridas del perfil
    const cumpleRequeridas = this.habilidadesRequeridas.every(hReq => 
        habilidadesColaboradora.includes(hReq)
    );

    return cumpleRequeridas;
  }

    // cuantas habilidades del perfil (requeridas u opcionales) tiene la colaboradora
    afinidadCon(colaboradora) {
        return [...this.habilidadesRequeridas, ...this.habilidadesOpcionales]
            .filter((codigo) => colaboradora.habilidades.includes(codigo))
            .length;
    }

    todasLasHabilidades() {
        return [...new Set([...this.habilidadesRequeridas, ...this.habilidadesOpcionales])];
    }

    // arma un perfil nuevo con los cambios para que valide todo junto, y recien ahi los aplica
    actualizar(datos = {}) {
        const compromiso = datos.compromiso
            ? new Compromiso(datos.compromiso.cantidadHoras, datos.compromiso.tipo)
            : this.compromiso;
        const modalidad = datos.modalidad
            ? new ModalidadColaboracion(datos.modalidad.gratuita, datos.modalidad.incentivoEconomico, datos.modalidad.contratacionEventual)
            : this.modalidad;

        const actualizado = new Perfil(
            this.id,
            datos.descripcionPerfil ?? this.descripcionPerfil,
            this.fechaLimite,
            this.cantidadLimite,
            datos.habilidadesRequeridas ?? this.habilidadesRequeridas,
            datos.habilidadesOpcionales ?? this.habilidadesOpcionales,
            compromiso,
            modalidad
        );

        Object.assign(this, actualizado);
        return this;
    }
}

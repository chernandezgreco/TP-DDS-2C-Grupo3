import { Compromiso } from "../Compromiso/Compromiso.js";
import { ModalidadColaboracion } from "../ModalidadColaboracion/ModalidadColaboracion.js";
import { esTextoNoVacio } from "../validaciones.js";
import { DomainError } from "../errores.js";

export class Perfil {
    constructor(id, descripcionPerfil, habilidadesRequeridas, habilidadesOpcionales = [], compromiso, modalidad) {
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
        this.habilidadesRequeridas = [...habilidadesRequeridas];
        this.habilidadesOpcionales = [...habilidadesOpcionales];
        this.compromiso = compromiso;
        this.modalidad = modalidad;
    }

    // alcanza con que la colaboradora tenga al menos una de las habilidades requeridas
    admiteA(colaboradora) {
        return colaboradora.cumpleAlgunaHabilidad(this.habilidadesRequeridas);
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
            datos.habilidadesRequeridas ?? this.habilidadesRequeridas,
            datos.habilidadesOpcionales ?? this.habilidadesOpcionales,
            compromiso,
            modalidad
        );

        Object.assign(this, actualizado);
        return this;
    }
}

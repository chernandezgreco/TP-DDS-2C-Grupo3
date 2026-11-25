import { esTextoNoVacio } from "../validaciones.js";
import { ConflictError, DomainError } from "../errores.js";
import { esCuentaCodigoValida } from "../../utils/enlaces.js";

export class Colaboradora {
    constructor(
        id,
        nombreFantasia,
        github,
        nombreApellido,
        habilidades,
        pronombres,
        presentacion,
        mediosContacto = [],
        aceptaMensajeria = false,
        experienciaHabilidades = [],
        linkedinFoto = "",
        cuentaEliminadaAt = null,
        mensajesVistosHasta = null,
    ) {
        if (!esTextoNoVacio(nombreFantasia)) {
            throw new DomainError("El nombre de fantasía es obligatorio", { campo: "nombreFantasia" });
        }
        if (!cuentaEliminadaAt && !esCuentaCodigoValida(github)) {
            throw new DomainError(
                "La cuenta de GitHub o GitLab no es válida",
                { campo: "github" },
            );
        }
        if (
            !Array.isArray(habilidades) ||
            (!cuentaEliminadaAt && habilidades.length === 0)
        ) {
            throw new DomainError("La colaboradora debe tener al menos una habilidad", { campo: "habilidades" });
        }

        this.id = id;
        this.nombreFantasia = nombreFantasia;
        this.github = github;
        this.nombreApellido = nombreApellido;
        this.habilidades = [...habilidades];
        this.pronombres = pronombres;
        this.presentacion = presentacion;
        this.mediosContacto = [...mediosContacto];
        this.aceptaMensajeria = aceptaMensajeria;
        this.experienciaHabilidades = [...experienciaHabilidades];
        this.linkedinFoto = linkedinFoto;
        this.cuentaEliminadaAt = cuentaEliminadaAt;
        // fecha del mensaje más nuevo que ya vio; los posteriores cuentan como no leídos
        this.mensajesVistosHasta = mensajesVistosHasta;
    }

    anonimizar(fecha = new Date()) {
        this.nombreFantasia = "Persona eliminada";
        this.github = null;
        this.nombreApellido = undefined;
        this.habilidades = [];
        this.pronombres = undefined;
        this.presentacion = undefined;
        this.mediosContacto = [];
        this.aceptaMensajeria = false;
        this.experienciaHabilidades = [];
        this.linkedinFoto = "";
        this.mensajesVistosHasta = null;
        this.cuentaEliminadaAt = fecha;

        return this;
    }

    agregarHabilidad(codigoHabilidad) {
        if (this.habilidades.includes(codigoHabilidad)) {
            throw new ConflictError("La colaboradora ya tiene esta habilidad", {
                colaboradora: { id: this.id, nombreFantasia: this.nombreFantasia, habilidades: this.habilidades },
                habilidad: codigoHabilidad,
            });
        }

        this.habilidades.push(codigoHabilidad);
    }

    cumpleAlgunaHabilidad(habilidadesRequeridas) {
        return this.habilidades.some((codigo) => habilidadesRequeridas.includes(codigo));
    }

    agregarMedioContacto(medio) {
        if (this.mediosContacto.some((existente) => existente.esIgualA(medio))) {
            throw new ConflictError("La colaboradora ya tiene este medio de contacto", { tipo: medio.tipo });
        }

        this.mediosContacto.push(medio);
    }

    cambiarAceptaMensajeria(acepta) {
        if (typeof acepta !== "boolean") {
            throw new DomainError("aceptaMensajeria debe ser verdadero o falso", { campo: "aceptaMensajeria" });
        }

        this.aceptaMensajeria = acepta;
    }

    puedeSerContactada() {
        return !this.cuentaEliminadaAt && this.aceptaMensajeria;
    }

    // la marca sólo avanza: un aviso viejo que llega tarde no vuelve a mostrar como nuevos mensajes ya vistos
    marcarMensajesVistos(hasta, ahora = new Date()) {
        if (!(hasta instanceof Date) || Number.isNaN(hasta.getTime())) {
            throw new DomainError("La fecha de los mensajes vistos no es válida", { campo: "hasta" });
        }
        if (hasta > ahora) {
            throw new DomainError("La fecha de los mensajes vistos no puede ser futura", { campo: "hasta" });
        }
        if (!this.mensajesVistosHasta || hasta > this.mensajesVistosHasta) {
            this.mensajesVistosHasta = hasta;
        }
    }

    // los medios de contacto y la marca de lectura son internos: no salen en ninguna respuesta JSON
    // (la marca dejaría ver en el perfil público cuándo estuvo activa)
    toJSON() {
        return { ...this, mediosContacto: undefined, mensajesVistosHasta: undefined };
    }
}

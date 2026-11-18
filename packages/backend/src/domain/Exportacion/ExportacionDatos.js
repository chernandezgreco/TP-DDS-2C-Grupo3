import { DomainError } from "../errores.js";
import { esTextoNoVacio } from "../validaciones.js";
import { FormatoExportacion } from "./FormatoExportacion.js";

export const VERSION_FORMATO = "1.0";

const TIPOS_TITULAR = Object.freeze({
    colectivos: "colectivo",
    colaboradoras: "colaboradora",
});

// Lo que la plataforma guarda pero nunca entrega: secretos de acceso y datos de terceros
export const DATOS_EXCLUIDOS = Object.freeze([
    "Contraseña y sal de la cuenta",
    "Sesiones activas",
    "Tokens de integraciones externas (LinkedIn)",
    "Denuncias recibidas por la cuenta o sus proyectos (las gestiona la administración y protegen a quien denuncia)",
    "Medios de contacto de otras personas",
]);

const SIN_REGISTROS = "(sin registros)";

// Fechas a ISO 8601 e ids a texto; descarta los campos sin valor
const normalizar = (valor) => JSON.parse(JSON.stringify(valor ?? null));

const esObjetoPlano = (valor) =>
    valor !== null && typeof valor === "object" && !Array.isArray(valor);

const aTexto = (valor) => (valor === null || valor === undefined ? "" : String(valor));

// Recorre un registro y devuelve [campo, valor] por cada dato hoja: perfiles[1].descripcionPerfil
const aplanar = (valor, prefijo = "") => {
    if (Array.isArray(valor)) {
        if (valor.length === 0) return [[prefijo, ""]];
        return valor.flatMap((item, i) => aplanar(item, `${prefijo}[${i + 1}]`));
    }
    if (esObjetoPlano(valor)) {
        const entradas = Object.entries(valor);
        if (entradas.length === 0) return [[prefijo, ""]];
        return entradas.flatMap(([clave, item]) =>
            aplanar(item, prefijo ? `${prefijo}.${clave}` : clave),
        );
    }
    return [[prefijo, aTexto(valor)]];
};

// Copia de los datos personales de una cuenta, lista para entregarse a su titular
export class ExportacionDatos {
    constructor({ tipoTitular, perfilId, secciones, generadoEn = new Date() }) {
        if (!Object.keys(TIPOS_TITULAR).includes(tipoTitular)) {
            throw new DomainError("El tipo de titular de la exportación no es válido", {
                campo: "tipoTitular",
            });
        }
        if (!esTextoNoVacio(perfilId)) {
            throw new DomainError("La exportación necesita el perfil de su titular", {
                campo: "perfilId",
            });
        }
        if (!esObjetoPlano(secciones)) {
            throw new DomainError("Las secciones de la exportación deben ser un objeto", {
                campo: "secciones",
            });
        }
        if ("metadatos" in secciones) {
            throw new DomainError("La sección metadatos es reservada", { campo: "secciones" });
        }

        this.tipoTitular = tipoTitular;
        this.perfilId = perfilId;
        this.generadoEn = generadoEn;
        this.secciones = normalizar(secciones);
    }

    // Minimización de datos: de otra persona sólo se entrega cómo identificarla, nunca sus contactos
    static referenciaColaboradora(id, colaboradora) {
        return {
            id: aTexto(id),
            nombreFantasia: colaboradora?.nombreFantasia ?? null,
        };
    }

    metadatos() {
        return {
            plataforma: "Código a Voluntad",
            versionFormato: VERSION_FORMATO,
            generadoEn: this.generadoEn.toISOString(),
            titular: { tipo: this.tipoTitular, perfilId: this.perfilId },
            secciones: Object.keys(this.secciones),
            excluido: [...DATOS_EXCLUIDOS],
        };
    }

    nombreArchivo(formato) {
        if (!Object.values(FormatoExportacion).includes(formato)) {
            throw new DomainError("El formato debe ser json o csv", { campo: "formato" });
        }
        const dia = this.generadoEn.toISOString().slice(0, 10);
        return `codigo-a-voluntad-datos-${TIPOS_TITULAR[this.tipoTitular]}-${dia}.${formato}`;
    }

    // Formato largo: una fila por dato, con la sección y el número de registro al que pertenece
    filas() {
        return Object.entries(this.toJSON()).flatMap(([seccion, contenido]) => {
            const registros = Array.isArray(contenido) ? contenido : [contenido];
            if (contenido === null || registros.length === 0) {
                return [{ seccion, registro: "", campo: SIN_REGISTROS, valor: "" }];
            }
            return registros.flatMap((registro, i) =>
                aplanar(registro).map(([campo, valor]) => ({
                    seccion,
                    registro: String(i + 1),
                    campo,
                    valor,
                })),
            );
        });
    }

    toJSON() {
        return { metadatos: this.metadatos(), ...this.secciones };
    }
}

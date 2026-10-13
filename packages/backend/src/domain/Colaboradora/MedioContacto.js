import { esTextoNoVacio } from "../validaciones.js";
import { DomainError } from "../errores.js";
import { TipoMedioContacto } from "./TipoMedioContacto.js";

const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FORMATO_TELEFONO = /^\+?\d{8,15}$/;

export class MedioContacto {
    constructor(tipo, valor) {
        const tiposValidos = Object.values(TipoMedioContacto);
        if (!tiposValidos.includes(tipo)) {
            throw new DomainError("El tipo de medio de contacto no es válido", { campo: "tipo", tiposValidos });
        }
        if (!esTextoNoVacio(valor)) {
            throw new DomainError("El valor del medio de contacto es obligatorio", { campo: "valor" });
        }

        const esEmail = tipo === TipoMedioContacto.EMAIL;
        // en telefonos se aceptan espacios y guiones
        const limpio = esEmail ? valor.trim() : valor.replace(/[\s-]/g, "");
        const formato = esEmail ? FORMATO_EMAIL : FORMATO_TELEFONO;
        if (!formato.test(limpio)) {
            throw new DomainError(`El valor no tiene un formato válido para ${tipo}`, { campo: "valor" });
        }

        this.tipo = tipo;
        this.valor = limpio;
    }

    esIgualA(otro) {
        return this.tipo === otro.tipo && this.valor === otro.valor;
    }
}

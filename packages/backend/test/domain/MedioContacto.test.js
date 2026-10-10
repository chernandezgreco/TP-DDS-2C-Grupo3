import { describe, test, expect } from "@jest/globals";
import { MedioContacto } from "../../src/domain/Colaboradora/MedioContacto.js";
import { TipoMedioContacto } from "../../src/domain/Colaboradora/TipoMedioContacto.js";
import { DomainError } from "../../src/domain/errores.js";

describe("MedioContacto", () => {
    test("crea un email válido", () => {
        const medio = new MedioContacto(TipoMedioContacto.EMAIL, "ana@mail.com");

        expect(medio.tipo).toBe(TipoMedioContacto.EMAIL);
        expect(medio.valor).toBe("ana@mail.com");
    });

    test("saca espacios y guiones de los teléfonos", () => {
        const medio = new MedioContacto(TipoMedioContacto.WHATSAPP, "+54 9 11 5761-2305");

        expect(medio.valor).toBe("+5491157612305");
    });

    test("rechaza un tipo que no existe", () => {
        expect(() => new MedioContacto("FAX", "12345678")).toThrow(DomainError);
    });

    test("rechaza un valor vacío", () => {
        expect(() => new MedioContacto(TipoMedioContacto.EMAIL, "  ")).toThrow(DomainError);
    });

    test("rechaza un email mal formado", () => {
        expect(() => new MedioContacto(TipoMedioContacto.EMAIL, "ana-mail.com")).toThrow(DomainError);
    });

    test("rechaza un teléfono con letras", () => {
        expect(() => new MedioContacto(TipoMedioContacto.SMS, "11abc5761")).toThrow(DomainError);
    });

    test("dos medios con mismo tipo y valor son iguales", () => {
        const uno = new MedioContacto(TipoMedioContacto.SMS, "1157612305");
        const otro = new MedioContacto(TipoMedioContacto.SMS, "11 5761-2305");
        const distinto = new MedioContacto(TipoMedioContacto.WHATSAPP, "1157612305");

        expect(uno.esIgualA(otro)).toBe(true);
        expect(uno.esIgualA(distinto)).toBe(false);
    });
});

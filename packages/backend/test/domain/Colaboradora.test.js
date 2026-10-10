import { describe, test, expect, beforeEach } from "@jest/globals";
import { Colaboradora } from "../../src/domain/Colaboradora/Colaboradora.js";
import { MedioContacto } from "../../src/domain/Colaboradora/MedioContacto.js";
import { TipoMedioContacto } from "../../src/domain/Colaboradora/TipoMedioContacto.js";
import { ConflictError, DomainError } from "../../src/domain/errores.js";

describe("Colaboradora: medios de contacto y mensajería", () => {
    let colaboradora;
    const email = () => new MedioContacto(TipoMedioContacto.EMAIL, "ana@mail.com");

    beforeEach(() => {
        colaboradora = new Colaboradora("c1", "Ana", "github.com/ana", "Ana Pérez", ["react"], "ella", "hola");
    });

    test("arranca sin medios y sin aceptar mensajería", () => {
        expect(colaboradora.mediosContacto).toEqual([]);
        expect(colaboradora.puedeSerContactada()).toBe(false);
    });

    test("agrega un medio de contacto", () => {
        colaboradora.agregarMedioContacto(email());

        expect(colaboradora.mediosContacto).toHaveLength(1);
    });

    test("no deja agregar dos veces el mismo medio", () => {
        colaboradora.agregarMedioContacto(email());

        expect(() => colaboradora.agregarMedioContacto(email())).toThrow(ConflictError);
        expect(colaboradora.mediosContacto).toHaveLength(1);
    });

    test("acepta o rechaza la mensajería", () => {
        colaboradora.cambiarAceptaMensajeria(true);
        expect(colaboradora.puedeSerContactada()).toBe(true);

        colaboradora.cambiarAceptaMensajeria(false);
        expect(colaboradora.puedeSerContactada()).toBe(false);
    });

    test("rechaza una preferencia que no es booleana", () => {
        expect(() => colaboradora.cambiarAceptaMensajeria("si")).toThrow(DomainError);
    });

    test("los medios de contacto no salen en el JSON", () => {
        colaboradora.agregarMedioContacto(email());
        colaboradora.cambiarAceptaMensajeria(true);

        const json = JSON.parse(JSON.stringify(colaboradora));

        expect(json.mediosContacto).toBeUndefined();
        expect(json.aceptaMensajeria).toBe(true);
        expect(json.nombreFantasia).toBe("Ana");
    });
});

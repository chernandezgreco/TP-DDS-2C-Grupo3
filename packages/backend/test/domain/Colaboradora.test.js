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

    test("se puede reconstruir con medios y preferencia ya guardados", () => {
        const reconstruida = new Colaboradora("c2", "Bea", "github.com/bea", "Bea Gómez", ["react"], "ella", "hola", [email()], true);

        expect(reconstruida.mediosContacto).toHaveLength(1);
        expect(reconstruida.puedeSerContactada()).toBe(true);
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

describe("Colaboradora: marca de mensajes vistos", () => {
    const ahora = new Date("2026-11-24T15:00:00.000Z");
    const antes = new Date("2026-11-24T12:00:00.000Z");
    const despues = new Date("2026-11-24T14:00:00.000Z");
    let colaboradora;

    beforeEach(() => {
        colaboradora = new Colaboradora("c1", "Ana", "github.com/ana", "Ana Pérez", ["react"], "ella", "hola");
    });

    test("arranca sin marca", () => {
        expect(colaboradora.mensajesVistosHasta).toBeNull();
    });

    test("guarda la primera marca", () => {
        colaboradora.marcarMensajesVistos(antes, ahora);

        expect(colaboradora.mensajesVistosHasta).toEqual(antes);
    });

    test("la marca avanza con una fecha posterior", () => {
        colaboradora.marcarMensajesVistos(antes, ahora);
        colaboradora.marcarMensajesVistos(despues, ahora);

        expect(colaboradora.mensajesVistosHasta).toEqual(despues);
    });

    test("una fecha anterior no hace retroceder la marca", () => {
        colaboradora.marcarMensajesVistos(despues, ahora);
        colaboradora.marcarMensajesVistos(antes, ahora);

        expect(colaboradora.mensajesVistosHasta).toEqual(despues);
    });

    test("rechaza fechas futuras o inválidas", () => {
        expect(() => colaboradora.marcarMensajesVistos(new Date("2026-11-25T00:00:00.000Z"), ahora)).toThrow(DomainError);
        expect(() => colaboradora.marcarMensajesVistos(new Date("no es fecha"), ahora)).toThrow(DomainError);
        expect(() => colaboradora.marcarMensajesVistos("2026-11-24", ahora)).toThrow(DomainError);
        expect(colaboradora.mensajesVistosHasta).toBeNull();
    });

    test("la marca no sale en el JSON y se borra al anonimizar", () => {
        colaboradora.marcarMensajesVistos(antes, ahora);

        expect(JSON.parse(JSON.stringify(colaboradora)).mensajesVistosHasta).toBeUndefined();
        expect(colaboradora.anonimizar(ahora).mensajesVistosHasta).toBeNull();
    });
});

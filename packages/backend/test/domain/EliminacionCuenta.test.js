import { describe, test, expect } from "@jest/globals";
import { Colaboradora } from "../../src/domain/Colaboradora/Colaboradora.js";
import { DomainError } from "../../src/domain/errores.js";

const crearColaboradora = () =>
    new Colaboradora(
        "colaboradora-1",
        "Ana",
        "github.com/ana",
        "Ana Pérez",
        ["react"],
        "ella",
        "Desarrolladora frontend",
        [{ tipo: "EMAIL", valor: "ana@example.com" }],
        true,
        [{ codigo: "react", nivel: "AVANZADO", anios: 5 }],
        "https://example.com/foto",
    );

describe("Eliminación de la cuenta personal", () => {
    test("anonimiza los datos personales y conserva el identificador", () => {
        const colaboradora = crearColaboradora();
        const fecha = new Date("2026-11-16T12:00:00Z");

        colaboradora.anonimizar(fecha);

        expect(colaboradora).toMatchObject({
            id: "colaboradora-1",
            nombreFantasia: "Persona eliminada",
            github: null,
            habilidades: [],
            mediosContacto: [],
            aceptaMensajeria: false,
            experienciaHabilidades: [],
            linkedinFoto: "",
            cuentaEliminadaAt: fecha,
        });

        expect(colaboradora.nombreApellido).toBeUndefined();
        expect(colaboradora.pronombres).toBeUndefined();
        expect(colaboradora.presentacion).toBeUndefined();
        expect(colaboradora.puedeSerContactada()).toBe(false);
    });

    test("un perfil eliminado no puede ser contactado aunque conserve una preferencia antigua", () => {
        const colaboradora = crearColaboradora();

        colaboradora.anonimizar();
        colaboradora.aceptaMensajeria = true;

        expect(colaboradora.puedeSerContactada()).toBe(false);
    });

    test("permite reconstruir un perfil eliminado sin GitHub ni habilidades", () => {
        const fecha = new Date("2026-11-16T12:00:00Z");

        const colaboradora = new Colaboradora(
            "colaboradora-1",
            "Persona eliminada",
            null,
            undefined,
            [],
            undefined,
            undefined,
            [],
            false,
            [],
            "",
            fecha,
        );

        expect(colaboradora.cuentaEliminadaAt).toEqual(fecha);
        expect(colaboradora.id).toBe("colaboradora-1");
    });

    test("los perfiles activos siguen requiriendo GitHub y habilidades", () => {
        expect(
            () => new Colaboradora("c1", "Ana", null, undefined, ["react"]),
        ).toThrow(DomainError);

        expect(
            () => new Colaboradora("c1", "Ana", "ana", undefined, []),
        ).toThrow(DomainError);
    });
});
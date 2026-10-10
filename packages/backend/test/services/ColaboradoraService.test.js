import { describe, test, expect, beforeEach } from "@jest/globals";
import { db } from "../../src/data/db.js";
import { Colaboradora } from "../../src/domain/Colaboradora/Colaboradora.js";
import { ConflictError, DomainError, NotFoundError } from "../../src/domain/errores.js";
import { ColaboradoraService } from "../../src/services/ColaboradoraService.js";

describe("ColaboradoraService: medios de contacto y preferencias", () => {
    beforeEach(() => {
        db.colaboradoras.length = 0;
        db.colaboradoras.push(new Colaboradora("col1", "Ana", "github.com/ana", "Ana Pérez", ["react"], "ella", "hola"));
    });

    test("agrega un medio y devuelve la lista de medios", () => {
        const medios = ColaboradoraService.agregarMedioContacto("col1", { tipo: "EMAIL", valor: "ana@mail.com" });

        expect(medios).toHaveLength(1);
        expect(medios[0].valor).toBe("ana@mail.com");
    });

    test("no agrega un medio repetido", () => {
        const medio = { tipo: "EMAIL", valor: "ana@mail.com" };
        ColaboradoraService.agregarMedioContacto("col1", medio);

        expect(() => ColaboradoraService.agregarMedioContacto("col1", medio)).toThrow(ConflictError);
    });

    test("no agrega un medio inválido", () => {
        expect(() => ColaboradoraService.agregarMedioContacto("col1", { tipo: "EMAIL", valor: "mal" })).toThrow(DomainError);
    });

    test("falla si la colaboradora no existe", () => {
        expect(() => ColaboradoraService.agregarMedioContacto("nadie", { tipo: "EMAIL", valor: "a@b.com" })).toThrow(NotFoundError);
        expect(() => ColaboradoraService.actualizarPreferencias("nadie", { aceptaMensajeria: true })).toThrow(NotFoundError);
    });

    test("actualiza si acepta mensajería", () => {
        const colaboradora = ColaboradoraService.actualizarPreferencias("col1", { aceptaMensajeria: true });

        expect(colaboradora.puedeSerContactada()).toBe(true);
    });
});

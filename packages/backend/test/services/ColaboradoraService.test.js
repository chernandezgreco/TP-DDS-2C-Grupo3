import { describe, test, expect, beforeAll, beforeEach, afterAll } from "@jest/globals";
import { ColaboradoraModel } from "../../src/models/indexModel.js";
import { ConflictError, DomainError, NotFoundError } from "../../src/domain/errores.js";
import { ColaboradoraService } from "../../src/services/ColaboradoraService.js";
import {
    conectarBaseDePrueba,
    desconectarBaseDePrueba,
    idInexistente,
    limpiarBaseDePrueba,
} from "../helpers/baseDePrueba.js";

describe("ColaboradoraService: medios de contacto y preferencias", () => {
    let id;

    beforeAll(conectarBaseDePrueba, 120000);
    afterAll(desconectarBaseDePrueba);

    beforeEach(async () => {
        await limpiarBaseDePrueba();
        const doc = await ColaboradoraModel.create({
            nombreFantasia: "Ana",
            github: "github.com/ana",
            nombreApellido: "Ana Pérez",
            habilidades: ["react"],
        });
        id = doc._id.toString();
    });

    test("agrega un medio y devuelve la lista de medios", async () => {
        const medios = await ColaboradoraService.agregarMedioContacto(id, { tipo: "EMAIL", valor: "ana@mail.com" });

        expect(medios).toHaveLength(1);
        expect(medios[0].valor).toBe("ana@mail.com");
    });

    test("el medio queda guardado en la base", async () => {
        await ColaboradoraService.agregarMedioContacto(id, { tipo: "EMAIL", valor: "ana@mail.com" });

        const colaboradora = await ColaboradoraService.obtenerPorId(id);

        expect(colaboradora.mediosContacto).toHaveLength(1);
        expect(colaboradora.mediosContacto[0].tipo).toBe("EMAIL");
    });

    test("no agrega un medio repetido", async () => {
        const medio = { tipo: "EMAIL", valor: "ana@mail.com" };
        await ColaboradoraService.agregarMedioContacto(id, medio);

        await expect(ColaboradoraService.agregarMedioContacto(id, medio)).rejects.toThrow(ConflictError);
    });

    test("no agrega un medio inválido", async () => {
        await expect(ColaboradoraService.agregarMedioContacto(id, { tipo: "EMAIL", valor: "mal" })).rejects.toThrow(DomainError);
    });

    test("falla si la colaboradora no existe", async () => {
        await expect(ColaboradoraService.agregarMedioContacto(idInexistente(), { tipo: "EMAIL", valor: "a@b.com" })).rejects.toThrow(NotFoundError);
        await expect(ColaboradoraService.actualizarPreferencias(idInexistente(), { aceptaMensajeria: true })).rejects.toThrow(NotFoundError);
    });

    test("por defecto no acepta mensajería", async () => {
        const colaboradora = await ColaboradoraService.obtenerPorId(id);

        expect(colaboradora.puedeSerContactada()).toBe(false);
    });

    test("actualiza si acepta mensajería y queda guardado", async () => {
        await ColaboradoraService.actualizarPreferencias(id, { aceptaMensajeria: true });

        const colaboradora = await ColaboradoraService.obtenerPorId(id);

        expect(colaboradora.puedeSerContactada()).toBe(true);
    });
});

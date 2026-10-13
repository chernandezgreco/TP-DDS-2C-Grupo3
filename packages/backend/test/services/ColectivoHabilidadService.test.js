import { describe, test, expect, beforeAll, beforeEach, afterAll } from "@jest/globals";
import { ColaboradoraModel, ColectivoModel, HabilidadModel } from "../../src/models/indexModel.js";
import { ConflictError, DomainError, NotFoundError } from "../../src/domain/errores.js";
import { ColectivoService } from "../../src/services/ColectivosService.js";
import { HabilidadService } from "../../src/services/HabilidadService.js";
import { ColaboradoraService } from "../../src/services/ColaboradoraService.js";
import {
    conectarBaseDePrueba,
    desconectarBaseDePrueba,
    idInexistente,
    limpiarBaseDePrueba,
} from "../helpers/baseDePrueba.js";

beforeAll(conectarBaseDePrueba, 120000);
afterAll(desconectarBaseDePrueba);
beforeEach(limpiarBaseDePrueba);

describe("ColectivoService", () => {
    const datos = { nombre: "Verde", descripcion: "Cuidamos plazas", tipo: "ONG", ubicacion: "CABA" };

    test("crea y lista colectivos", async () => {
        const colectivo = await ColectivoService.crearColectivo(datos);

        expect(colectivo.id).toEqual(expect.any(String));
        expect(await ColectivoService.listar()).toEqual([colectivo]);
    });

    test("valida con el dominio antes de guardar", async () => {
        await expect(ColectivoService.crearColectivo({ ...datos, tipo: "EMPRESA" })).rejects.toThrow(DomainError);
        expect(await ColectivoModel.countDocuments()).toBe(0);
    });

    test("obtiene un colectivo o falla con NotFound", async () => {
        const colectivo = await ColectivoService.crearColectivo(datos);

        expect(await ColectivoService.obtenerPorId(colectivo.id)).toEqual(colectivo);
        await expect(ColectivoService.obtenerPorId(idInexistente())).rejects.toThrow(NotFoundError);
        await expect(ColectivoService.obtenerPorId("no-es-un-id")).rejects.toThrow(NotFoundError);
    });
});

describe("HabilidadService", () => {
    test("crea la habilidad con el título normalizado como código", async () => {
        const habilidad = await HabilidadService.crearHabilidad({ titulo: "Desarrollo Web React", descripcion: "Interfaces" });

        expect(habilidad.codigo).toBe("desarrollo-web-react");
        expect(await HabilidadService.listar()).toEqual([habilidad]);
    });

    test("no permite dos habilidades con el mismo código", async () => {
        await HabilidadService.crearHabilidad({ titulo: "React", descripcion: "Interfaces" });

        await expect(HabilidadService.crearHabilidad({ titulo: "react", descripcion: "Otra" })).rejects.toThrow(ConflictError);
    });

    test("valida con el dominio antes de guardar", async () => {
        await expect(HabilidadService.crearHabilidad({ titulo: "  ", descripcion: "x" })).rejects.toThrow(DomainError);
        expect(await HabilidadModel.countDocuments()).toBe(0);
    });

    test("validarExistentes informa las habilidades que faltan", async () => {
        await HabilidadService.crearHabilidad({ titulo: "React", descripcion: "Interfaces" });

        await expect(HabilidadService.validarExistentes(["react"])).resolves.toBeUndefined();
        await expect(HabilidadService.validarExistentes(["react", "cobol"])).rejects.toMatchObject({
            detalle: { habilidadesInexistentes: ["cobol"] },
        });
    });
});

describe("ColaboradoraService: alta y habilidades", () => {
    beforeEach(async () => {
        await HabilidadModel.create([
            { codigo: "react", titulo: "React", descripcion: "Interfaces" },
            { codigo: "nodejs", titulo: "NodeJS", descripcion: "Backend" },
        ]);
    });

    const datos = { nombreFantasia: "Ana", github: "github.com/ana", habilidades: ["react"] };

    test("crea una colaboradora con habilidades existentes", async () => {
        const colaboradora = await ColaboradoraService.crearColaboradora(datos);

        expect(colaboradora.habilidades).toEqual(["react"]);
        expect(await ColaboradoraModel.countDocuments()).toBe(1);
    });

    test("no la crea si alguna habilidad no existe", async () => {
        await expect(ColaboradoraService.crearColaboradora({ ...datos, habilidades: ["cobol"] })).rejects.toThrow(DomainError);
        expect(await ColaboradoraModel.countDocuments()).toBe(0);
    });

    test("agrega una habilidad y no permite repetirla", async () => {
        const { id } = await ColaboradoraService.crearColaboradora(datos);

        await ColaboradoraService.agregarHabilidad(id, { codigo: "nodejs" });

        expect((await ColaboradoraService.obtenerPorId(id)).habilidades).toEqual(["react", "nodejs"]);
        await expect(ColaboradoraService.agregarHabilidad(id, { codigo: "nodejs" })).rejects.toThrow(ConflictError);
    });

    test("busca por habilidades", async () => {
        const ana = await ColaboradoraService.crearColaboradora(datos);
        await ColaboradoraService.crearColaboradora({ ...datos, nombreFantasia: "Bea", habilidades: ["nodejs"] });

        const encontradas = await ColaboradoraService.buscarPorHabilidades(["react"]);

        expect(encontradas.map((c) => c.id)).toEqual([ana.id]);
    });
});

import { describe, test, expect, beforeAll, beforeEach, afterAll } from "@jest/globals";
import { ColaboradoraModel, HabilidadModel, ProyectoModel } from "../../src/models/indexModel.js";
import { DomainError, NotFoundError } from "../../src/domain/errores.js";
import { Perfil } from "../../src/domain/Perfil/Perfil.js";
import { PerfilesService } from "../../src/services/PerfilesService.js";
import {
    conectarBaseDePrueba,
    desconectarBaseDePrueba,
    idInexistente,
    limpiarBaseDePrueba,
} from "../helpers/baseDePrueba.js";
import { datosPerfil } from "../helpers/datos.js";

describe("PerfilesService", () => {
    let proyectoId;

    beforeAll(conectarBaseDePrueba, 120000);
    afterAll(desconectarBaseDePrueba);

    beforeEach(async () => {
        await limpiarBaseDePrueba();
        await HabilidadModel.create([
            { codigo: "react", titulo: "React", descripcion: "Interfaces" },
            { codigo: "javascript", titulo: "JavaScript", descripcion: "JS" },
            { codigo: "nodejs", titulo: "NodeJS", descripcion: "Backend" },
        ]);
        proyectoId = (await ProyectoModel.create({ titulo: "Plazas", descripcion: "App de plazas", colectivoId: idInexistente() })).id;
    });

    describe("CRUD", () => {
        test("crea un perfil con id y lo guarda en el proyecto", async () => {
            const perfil = await PerfilesService.crear(proyectoId, datosPerfil());
            const doc = await ProyectoModel.findById(proyectoId);

            expect(perfil).toBeInstanceOf(Perfil);
            expect(doc.perfiles).toHaveLength(1);
            expect(doc.perfiles[0].id).toBe(perfil.id);
            expect(doc.perfiles[0].compromiso.tipo).toBe("SEMANALES");
        });

        test("lista y obtiene los perfiles guardados", async () => {
            const perfil = await PerfilesService.crear(proyectoId, datosPerfil());

            expect(await PerfilesService.listar(proyectoId)).toEqual([perfil]);
            expect(await PerfilesService.obtener(proyectoId, perfil.id)).toEqual(perfil);
        });

        test("actualiza los campos informados y queda guardado", async () => {
            const perfil = await PerfilesService.crear(proyectoId, datosPerfil());

            await PerfilesService.actualizar(proyectoId, perfil.id, { descripcionPerfil: "Frontend senior", modalidad: { gratuita: false, incentivoEconomico: true, contratacionEventual: false } });

            const guardado = await PerfilesService.obtener(proyectoId, perfil.id);
            expect(guardado.descripcionPerfil).toBe("Frontend senior");
            expect(guardado.modalidad.incentivoEconomico).toBe(true);
            expect(guardado.habilidadesRequeridas).toEqual(["react"]);
        });

        test("elimina un perfil", async () => {
            const perfil = await PerfilesService.crear(proyectoId, datosPerfil());

            await PerfilesService.eliminar(proyectoId, perfil.id);

            expect(await PerfilesService.listar(proyectoId)).toEqual([]);
        });

        test("no guarda un perfil con habilidades inexistentes", async () => {
            await expect(PerfilesService.crear(proyectoId, datosPerfil({ habilidadesRequeridas: ["cobol"] }))).rejects.toThrow(DomainError);
            await expect(PerfilesService.listar(proyectoId)).resolves.toEqual([]);
        });

        test("no actualiza con habilidades inexistentes", async () => {
            const perfil = await PerfilesService.crear(proyectoId, datosPerfil());

            await expect(PerfilesService.actualizar(proyectoId, perfil.id, { habilidadesRequeridas: ["cobol"] })).rejects.toThrow(DomainError);
            expect((await PerfilesService.obtener(proyectoId, perfil.id)).habilidadesRequeridas).toEqual(["react"]);
        });

        test("no crea un perfil sin habilidades requeridas", async () => {
            await expect(PerfilesService.crear(proyectoId, datosPerfil({ habilidadesRequeridas: [] }))).rejects.toThrow(DomainError);
        });

        test("un perfil o proyecto inexistente es NotFound", async () => {
            await expect(PerfilesService.obtener(proyectoId, "no-existe")).rejects.toThrow(NotFoundError);
            await expect(PerfilesService.eliminar(proyectoId, "no-existe")).rejects.toThrow(NotFoundError);
            await expect(PerfilesService.listar(idInexistente())).rejects.toThrow(NotFoundError);
        });

        test("no rompe los logros del proyecto", async () => {
            await ProyectoModel.findByIdAndUpdate(proyectoId, { logros: [{ id: "logro-1", descripcion: "Primer logro", porcentajeCompletitud: 10 }] });

            await PerfilesService.crear(proyectoId, datosPerfil());

            expect((await ProyectoModel.findById(proyectoId)).logros).toHaveLength(1);
        });
    });

    describe("buscar colaboradoras potenciales", () => {
        const crearColaboradora = async (nombre, habilidades) =>
            (await ColaboradoraModel.create({ nombreFantasia: nombre, github: `github.com/${nombre}`, habilidades })).id;

        test("devuelve las que tienen alguna habilidad requerida, ordenadas por afinidad", async () => {
            const perfil = await PerfilesService.crear(proyectoId, datosPerfil({ habilidadesRequeridas: ["react", "nodejs"], habilidadesOpcionales: ["javascript"] }));
            const soloReact = await crearColaboradora("ana", ["react"]);
            const completa = await crearColaboradora("bea", ["react", "nodejs", "javascript"]);
            await crearColaboradora("cata", ["javascript"]);

            const resultado = await PerfilesService.buscarColaboradorasPotenciales(proyectoId, perfil.id);

            expect(resultado.map((c) => c.id)).toEqual([completa, soloReact]);
        });

        test("no expone los medios de contacto", async () => {
            const perfil = await PerfilesService.crear(proyectoId, datosPerfil());
            const id = await crearColaboradora("ana", ["react"]);
            await ColaboradoraModel.findByIdAndUpdate(id, { mediosContacto: [{ tipo: "EMAIL", valor: "ana@mail.com" }] });

            const [colaboradora] = await PerfilesService.buscarColaboradorasPotenciales(proyectoId, perfil.id);

            expect(JSON.parse(JSON.stringify(colaboradora)).mediosContacto).toBeUndefined();
        });

        test("falla si el perfil no existe", async () => {
            await expect(PerfilesService.buscarColaboradorasPotenciales(proyectoId, "no-existe")).rejects.toThrow(NotFoundError);
        });
    });
});

import { describe, test, expect, beforeAll, beforeEach, afterAll } from "@jest/globals";
import { ColaboracionModel, ColaboradoraModel, ColectivoModel, HabilidadModel, ProyectoModel } from "../../src/models/indexModel.js";
import { ConflictError, DomainError, NotFoundError } from "../../src/domain/errores.js";
import { Proyecto } from "../../src/domain/Proyecto/Proyecto.js";
import { Perfil } from "../../src/domain/Perfil/Perfil.js";
import { ProyectoService } from "../../src/services/ProyectoService.js";
import {
    conectarBaseDePrueba,
    desconectarBaseDePrueba,
    idInexistente,
    limpiarBaseDePrueba,
} from "../helpers/baseDePrueba.js";
import { datosPerfil } from "../helpers/datos.js";

const crearColaboradora = async (nombre, habilidades) =>
    (await ColaboradoraModel.create({ nombreFantasia: nombre, github: `github.com/${nombre}`, habilidades })).id;

describe("ProyectoService", () => {
    let colectivoId;

    beforeAll(conectarBaseDePrueba, 120000);
    afterAll(desconectarBaseDePrueba);

    beforeEach(async () => {
        await limpiarBaseDePrueba();
        await HabilidadModel.create([
            { codigo: "react", titulo: "React", descripcion: "Interfaces" },
            { codigo: "javascript", titulo: "JavaScript", descripcion: "JS" },
            { codigo: "nodejs", titulo: "NodeJS", descripcion: "Backend" },
        ]);
        colectivoId = (await ColectivoModel.create({ nombre: "Verde", descripcion: "Cuidamos plazas", tipo: "ONG" })).id;
    });

    const crearProyecto = (perfiles = [datosPerfil(), datosPerfil({ descripcionPerfil: "Backend", habilidadesRequeridas: ["nodejs"], habilidadesOpcionales: [] })]) =>
        ProyectoService.crearProyecto({ titulo: "Plazas", descripcion: "App de plazas", perfiles }, colectivoId);

    describe("crear", () => {
        test("crea el proyecto con sus perfiles y lo guarda", async () => {
            const proyecto = await crearProyecto();
            const doc = await ProyectoModel.findById(proyecto.id);

            expect(proyecto).toBeInstanceOf(Proyecto);
            expect(proyecto.perfiles[0]).toBeInstanceOf(Perfil);
            expect(proyecto.perfiles[0].id).toEqual(expect.any(String));
            expect(doc.perfiles.map((p) => p.id)).toEqual(proyecto.perfiles.map((p) => p.id));
            expect(doc.estado).toBe("ACTIVO");
        });

        test("falla si el colectivo no existe", async () => {
            await expect(ProyectoService.crearProyecto({ titulo: "t", descripcion: "d" }, idInexistente())).rejects.toThrow(NotFoundError);
        });

        test("falla si un perfil usa una habilidad que no existe", async () => {
            await expect(crearProyecto([datosPerfil({ habilidadesRequeridas: ["cobol"] })])).rejects.toThrow(DomainError);
            expect(await ProyectoModel.countDocuments()).toBe(0);
        });

        test("las habilidades se referencian por código, no por título", async () => {
            await expect(crearProyecto([datosPerfil({ habilidadesRequeridas: ["React"] })])).rejects.toThrow(DomainError);
        });
    });

    describe("obtener y listar", () => {
        test("obtiene un proyecto guardado", async () => {
            const creado = await crearProyecto();

            expect(await ProyectoService.obtenerPorId(creado.id)).toEqual(creado);
        });

        test("un id inexistente o inválido es NotFound", async () => {
            await expect(ProyectoService.obtenerPorId(idInexistente())).rejects.toThrow(NotFoundError);
            await expect(ProyectoService.obtenerPorId("no-es-un-id")).rejects.toThrow(NotFoundError);
        });

        test("lista los proyectos como objetos de dominio", async () => {
            await crearProyecto();

            const proyectos = await ProyectoService.listar();

            expect(proyectos).toHaveLength(1);
            expect(proyectos[0]).toBeInstanceOf(Proyecto);
        });
    });

    describe("cerrar", () => {
        test("finaliza el proyecto y queda guardado", async () => {
            const { id } = await crearProyecto();

            await ProyectoService.cerrarProyecto(colectivoId, id);

            expect((await ProyectoModel.findById(id)).estado).toBe("FINALIZADO");
        });

        test("falla si el proyecto es de otro colectivo", async () => {
            const { id } = await crearProyecto();

            await expect(ProyectoService.cerrarProyecto(idInexistente(), id)).rejects.toThrow(NotFoundError);
        });

        test("no se puede cerrar dos veces", async () => {
            const { id } = await crearProyecto();
            await ProyectoService.cerrarProyecto(colectivoId, id);

            await expect(ProyectoService.cerrarProyecto(colectivoId, id)).rejects.toThrow(ConflictError);
        });
    });

    describe("anotar colaboradora", () => {
        test("crea la colaboración en el primer perfil que le corresponde", async () => {
            const proyecto = await crearProyecto();
            const colaboradoraId = await crearColaboradora("ana", ["nodejs"]);

            const colaboracion = await ProyectoService.anotarColaboradora(proyecto.id, { colaboradoraId });

            expect(colaboracion.perfilId).toBe(proyecto.perfiles[1].id);
            expect(colaboracion.colaboradoraId).toBe(colaboradoraId);
            expect(await ColaboracionModel.countDocuments()).toBe(1);
        });

        test("respeta el perfil elegido", async () => {
            const proyecto = await crearProyecto();
            const colaboradoraId = await crearColaboradora("ana", ["react", "nodejs"]);

            const colaboracion = await ProyectoService.anotarColaboradora(proyecto.id, { colaboradoraId, perfilId: proyecto.perfiles[1].id });

            expect(colaboracion.perfilId).toBe(proyecto.perfiles[1].id);
        });

        test("alcanza con una de las habilidades requeridas", async () => {
            const proyecto = await crearProyecto([datosPerfil({ habilidadesRequeridas: ["react", "nodejs"] })]);
            const colaboradoraId = await crearColaboradora("ana", ["nodejs"]);

            await expect(ProyectoService.anotarColaboradora(proyecto.id, { colaboradoraId })).resolves.toBeDefined();
        });

        test("falla si no tiene ninguna habilidad requerida", async () => {
            const proyecto = await crearProyecto();
            const colaboradoraId = await crearColaboradora("ana", ["javascript"]);

            await expect(ProyectoService.anotarColaboradora(proyecto.id, { colaboradoraId })).rejects.toThrow(DomainError);
        });

        test("no se puede anotar dos veces en el mismo perfil", async () => {
            const proyecto = await crearProyecto();
            const colaboradoraId = await crearColaboradora("ana", ["react"]);
            await ProyectoService.anotarColaboradora(proyecto.id, { colaboradoraId });

            await expect(ProyectoService.anotarColaboradora(proyecto.id, { colaboradoraId })).rejects.toThrow(ConflictError);
        });

        test("un proyecto finalizado no admite colaboraciones", async () => {
            const proyecto = await crearProyecto();
            await ProyectoService.cerrarProyecto(colectivoId, proyecto.id);
            const colaboradoraId = await crearColaboradora("ana", ["react"]);

            await expect(ProyectoService.anotarColaboradora(proyecto.id, { colaboradoraId })).rejects.toThrow(ConflictError);
        });

        test("falla si la colaboradora no existe", async () => {
            const proyecto = await crearProyecto();

            await expect(ProyectoService.anotarColaboradora(proyecto.id, { colaboradoraId: idInexistente() })).rejects.toThrow(NotFoundError);
        });
    });

    describe("listar colaboradoras", () => {
        test("devuelve las colaboradoras anotadas sin sus medios de contacto", async () => {
            const proyecto = await crearProyecto();
            const colaboradoraId = await crearColaboradora("ana", ["react"]);
            await ColaboradoraModel.findByIdAndUpdate(colaboradoraId, { mediosContacto: [{ tipo: "EMAIL", valor: "ana@mail.com" }] });
            await ProyectoService.anotarColaboradora(proyecto.id, { colaboradoraId });

            const colaboradoras = await ProyectoService.listarColaboradoras(proyecto.id);

            expect(colaboradoras.map((c) => c.id)).toEqual([colaboradoraId]);
            expect(JSON.parse(JSON.stringify(colaboradoras[0])).mediosContacto).toBeUndefined();
        });
    });

    describe("buscar proyectos potenciales", () => {
        test("devuelve los proyectos activos con algún perfil que admite a la colaboradora", async () => {
            const conReact = await crearProyecto([datosPerfil()]);
            await crearProyecto([datosPerfil({ habilidadesRequeridas: ["nodejs"] })]);
            const colaboradoraId = await crearColaboradora("ana", ["react"]);

            const resultado = await ProyectoService.buscarProyectosPotenciales(colaboradoraId);

            expect(resultado.map((r) => r.proyecto.id)).toEqual([conReact.id]);
            expect(resultado[0].perfilesCompatibles.map((p) => p.id)).toEqual([conReact.perfiles[0].id]);
        });

        test("no incluye proyectos finalizados", async () => {
            const proyecto = await crearProyecto([datosPerfil()]);
            await ProyectoService.cerrarProyecto(colectivoId, proyecto.id);
            const colaboradoraId = await crearColaboradora("ana", ["react"]);

            await expect(ProyectoService.buscarProyectosPotenciales(colaboradoraId)).resolves.toEqual([]);
        });

        test("una habilidad opcional sola no alcanza", async () => {
            await crearProyecto([datosPerfil({ habilidadesRequeridas: ["react"], habilidadesOpcionales: ["javascript"] })]);
            const colaboradoraId = await crearColaboradora("ana", ["javascript"]);

            await expect(ProyectoService.buscarProyectosPotenciales(colaboradoraId)).resolves.toEqual([]);
        });
    });
});

import {
    describe,
    test,
    expect,
    beforeAll,
    beforeEach,
    afterAll,
} from "@jest/globals";
import { ProyectoModel } from "../../src/models/indexModel.js";
import { DomainError, NotFoundError } from "../../src/domain/errores.js";
import { LogroService } from "../../src/services/LogroService.js";
import {
    conectarBaseDePrueba,
    desconectarBaseDePrueba,
    limpiarBaseDePrueba,
    idInexistente,
} from "../helpers/baseDePrueba.js";

describe("LogroService con MongoDB", () => {
    let proyectoId;

    beforeAll(conectarBaseDePrueba, 120000);
    afterAll(desconectarBaseDePrueba);

    beforeEach(async () => {
        await limpiarBaseDePrueba();

        const proyecto = await ProyectoModel.create({
            titulo: "Proyecto de prueba",
            descripcion: "Descripción del proyecto",
            colectivoId: idInexistente(),
            perfiles: [],
        });

        proyectoId = proyecto._id.toString();
    });

    const crearLogro = () =>
        LogroService.crear(proyectoId, {
            descripcion: "Primer logro",
            porcentajeCompletitud: 25,
            enlaceSistema: "https://sistema.example.com",
            enlaceFuentePublica: "https://github.com/grupo/proyecto",
        });

    test("crea un logro y lo guarda en Mongo", async () => {
        const logro = await crearLogro();
        const documento = await ProyectoModel.findById(proyectoId);

        expect(logro.id).toEqual(expect.any(String));
        expect(documento.logros).toHaveLength(1);
        expect(documento.logros[0].id).toBe(logro.id);
        expect(documento.logros[0].descripcion).toBe("Primer logro");
        expect(documento.logros[0].porcentajeCompletitud).toBe(25);
        expect(documento.logros[0].enlaceSistema).toBe(logro.enlaceSistema);
        expect(documento.logros[0].enlaceFuentePublica).toBe(
            logro.enlaceFuentePublica,
        );
        expect(documento.logros[0].fechaCreacion).toEqual(
            logro.fechaCreacion,
        );
    });

    test("lista los logros guardados", async () => {
        const logro = await crearLogro();
        const logros = await LogroService.listar(proyectoId);

        expect(logros).toHaveLength(1);
        expect(logros[0]).toEqual(logro);
    });

    test("un proyecto sin logros devuelve una lista vacía", async () => {
        await expect(LogroService.listar(proyectoId)).resolves.toEqual([]);
    });

    test("obtiene un logro guardado por su id", async () => {
        const logro = await crearLogro();
        const encontrado = await LogroService.obtener(proyectoId, logro.id);

        expect(encontrado).toEqual(logro);
    });

    test("actualiza y persiste sin modificar los campos omitidos", async () => {
        const logro = await crearLogro();

        await LogroService.actualizar(proyectoId, logro.id, {
            porcentajeCompletitud: 75,
            enlaceSistema: null,
        });

        const documento = await ProyectoModel.findById(proyectoId);
        const guardado = documento.logros[0];

        expect(guardado.id).toBe(logro.id);
        expect(guardado.porcentajeCompletitud).toBe(75);
        expect(guardado.enlaceSistema).toBeNull();
        expect(guardado.descripcion).toBe(logro.descripcion);
        expect(guardado.enlaceFuentePublica).toBe(logro.enlaceFuentePublica);
        expect(guardado.fechaCreacion).toEqual(logro.fechaCreacion);
    });

    test("elimina el logro de Mongo", async () => {
        const logro = await crearLogro();
        const eliminado = await LogroService.eliminar(proyectoId, logro.id);
        const documento = await ProyectoModel.findById(proyectoId);

        expect(eliminado).toEqual(logro);
        expect(documento.logros).toHaveLength(0);
    });

    test("rechaza un proyecto inexistente", async () => {
        await expect(
            LogroService.listar(idInexistente()),
        ).rejects.toThrow(NotFoundError);
    });

    test("rechaza un identificador de proyecto inválido", async () => {
        await expect(
            LogroService.listar("proyecto-invalido"),
        ).rejects.toThrow(NotFoundError);
    });

    test("rechaza obtener, actualizar o eliminar un logro inexistente", async () => {
        await expect(
            LogroService.obtener(proyectoId, "logro-inexistente"),
        ).rejects.toThrow(NotFoundError);

        await expect(
            LogroService.actualizar(proyectoId, "logro-inexistente", {
                porcentajeCompletitud: 50,
            }),
        ).rejects.toThrow(NotFoundError);

        await expect(
            LogroService.eliminar(proyectoId, "logro-inexistente"),
        ).rejects.toThrow(NotFoundError);
    });

    test("una creación inválida no guarda ningún logro", async () => {
        await expect(
            LogroService.crear(proyectoId, {
                descripcion: "",
                porcentajeCompletitud: 200,
            }),
        ).rejects.toThrow(DomainError);

        const documento = await ProyectoModel.findById(proyectoId);
        expect(documento.logros).toHaveLength(0);
    });

    test("una actualización inválida conserva los datos guardados", async () => {
        const logro = await crearLogro();

        await expect(
            LogroService.actualizar(proyectoId, logro.id, {
                descripcion: "Descripción cambiada",
                porcentajeCompletitud: 200,
            }),
        ).rejects.toThrow(DomainError);

        const guardado = await LogroService.obtener(proyectoId, logro.id);
        expect(guardado).toEqual(logro);
    });

    test("no permite acceder a un logro desde otro proyecto", async () => {
        const logro = await crearLogro();
        const otroProyecto = await ProyectoModel.create({
            titulo: "Otro proyecto",
            descripcion: "Proyecto independiente",
            colectivoId: idInexistente(),
        });

        await expect(
            LogroService.obtener(otroProyecto._id.toString(), logro.id),
        ).rejects.toThrow(NotFoundError);
    });
});
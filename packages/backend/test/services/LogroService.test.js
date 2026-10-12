import assert from "node:assert/strict";
import {
    afterEach,
    beforeEach,
    describe,
    test,
} from "node:test";
import { db } from "../../src/data/db.js";
import {
    DomainError,
    NotFoundError,
} from "../../src/domain/errores.js";
import { Proyecto } from "../../src/domain/Proyecto/Proyecto.js";
import { LogroService } from "../../src/services/LogroService.js";

describe("LogroService", () => {
    let proyectosOriginales;
    let proyecto;

    beforeEach(() => {
        proyectosOriginales = db.proyectos;

        proyecto = new Proyecto(
            "proyecto-test",
            "Proyecto de prueba",
            "Descripción del proyecto",
            "colectivo-test",
        );

        db.proyectos = [proyecto];
    });

    afterEach(() => {
        db.proyectos = proyectosOriginales;
    });

    test("crea un logro dentro del proyecto", () => {
        const logro = LogroService.crear(
            proyecto.id,
            {
                descripcion: "Primer logro",
                porcentajeCompletitud: 25,
                enlaceSistema: "https://sistema.example.com",
                enlaceFuentePublica: null,
            },
        );

        assert.ok(logro.id);
        assert.equal(logro.descripcion, "Primer logro");
        assert.equal(logro.porcentajeCompletitud, 25);
        assert.equal(proyecto.logros.length, 1);
        assert.equal(proyecto.logros[0], logro);
    });

    test("lista los logros del proyecto", () => {
        const logro = LogroService.crear(
            proyecto.id,
            {
                descripcion: "Primer logro",
                porcentajeCompletitud: 25,
            },
        );

        const logros = LogroService.listar(proyecto.id);

        assert.equal(logros.length, 1);
        assert.equal(logros[0], logro);
    });

    test("obtiene un logro por id", () => {
        const logro = LogroService.crear(
            proyecto.id,
            {
                descripcion: "Primer logro",
                porcentajeCompletitud: 25,
            },
        );

        const encontrado = LogroService.obtener(
            proyecto.id,
            logro.id,
        );

        assert.equal(encontrado, logro);
    });

    test("actualiza un logro", () => {
        const logro = LogroService.crear(
            proyecto.id,
            {
                descripcion: "Primer logro",
                porcentajeCompletitud: 25,
                enlaceSistema: "https://sistema.example.com",
            },
        );

        const actualizado = LogroService.actualizar(
            proyecto.id,
            logro.id,
            {
                porcentajeCompletitud: 75,
                enlaceSistema: null,
            },
        );

        assert.equal(actualizado, logro);
        assert.equal(logro.porcentajeCompletitud, 75);
        assert.equal(logro.enlaceSistema, null);
    });

    test("elimina un logro", () => {
        const logro = LogroService.crear(
            proyecto.id,
            {
                descripcion: "Primer logro",
                porcentajeCompletitud: 25,
            },
        );

        const eliminado = LogroService.eliminar(
            proyecto.id,
            logro.id,
        );

        assert.equal(eliminado, logro);
        assert.equal(proyecto.logros.length, 0);
    });

    test("rechaza un proyecto inexistente", () => {
        assert.throws(
            () => LogroService.listar("proyecto-inexistente"),
            NotFoundError,
        );
    });

    test("rechaza un logro inexistente", () => {
        assert.throws(
            () => LogroService.obtener(
                proyecto.id,
                "logro-inexistente",
            ),
            NotFoundError,
        );
    });

    test("rechaza datos de logro inválidos", () => {
        assert.throws(
            () => LogroService.crear(
                proyecto.id,
                {
                    descripcion: "",
                    porcentajeCompletitud: 200,
                },
            ),
            DomainError,
        );

        assert.equal(proyecto.logros.length, 0);
    });
});
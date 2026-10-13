import assert from "node:assert/strict";
import { DomainError, NotFoundError } from "../../src/domain/errores.js";
import { Logro } from "../../src/domain/Logro/Logro.js";
import { Proyecto } from "../../src/domain/Proyecto/Proyecto.js";

describe("Logro", () => {
    test("crea un logro válido", () => {
        const fecha = new Date("2026-10-11T12:00:00Z");

        const logro = new Logro(
            "logro-1",
            " Primera versión publicada ",
            25,
            "https://sistema.example.com",
            "https://github.com/example/proyecto",
            fecha,
        );

        assert.equal(logro.id, "logro-1");
        assert.equal(logro.descripcion, "Primera versión publicada");
        assert.equal(logro.porcentajeCompletitud, 25);
        assert.equal(logro.enlaceSistema, "https://sistema.example.com");
        assert.equal(
            logro.enlaceFuentePublica,
            "https://github.com/example/proyecto",
        );
        assert.equal(logro.fechaCreacion, fecha);
    });

    test("acepta porcentajes en los límites", () => {
        const logroInicial = new Logro("logro-1", "Inicio", 0);
        const logroFinal = new Logro("logro-2", "Finalización", 100);

        assert.equal(logroInicial.porcentajeCompletitud, 0);
        assert.equal(logroFinal.porcentajeCompletitud, 100);
    });

    test("rechaza una descripción vacía", () => {
        assert.throws(
            () => new Logro("logro-1", "   ", 20),
            DomainError,
        );
    });

    test("rechaza porcentajes inválidos", () => {
        const porcentajesInvalidos = [-1, 101, NaN, "50"];

        for (const porcentaje of porcentajesInvalidos) {
            assert.throws(
                () => new Logro("logro-1", "Descripción", porcentaje),
                DomainError,
            );
        }
    });

    test("rechaza enlaces inválidos", () => {
        assert.throws(
            () => new Logro(
                "logro-1",
                "Descripción",
                20,
                "enlace-inválido",
            ),
            DomainError,
        );

        assert.throws(
            () => new Logro(
                "logro-1",
                "Descripción",
                20,
                null,
                "fuente-inválida",
            ),
            DomainError,
        );
    });

    test("actualiza solamente los campos informados", () => {
        const fecha = new Date("2026-10-11T12:00:00Z");

        const logro = new Logro(
            "logro-1",
            "Descripción inicial",
            20,
            "https://sistema.example.com",
            null,
            fecha,
        );

        logro.actualizar({
            porcentajeCompletitud: 60,
            enlaceSistema: null,
        });

        assert.equal(logro.id, "logro-1");
        assert.equal(logro.descripcion, "Descripción inicial");
        assert.equal(logro.porcentajeCompletitud, 60);
        assert.equal(logro.enlaceSistema, null);
        assert.equal(logro.fechaCreacion, fecha);
    });

    test("no modifica el logro cuando la actualización es inválida", () => {
        const logro = new Logro(
            "logro-1",
            "Descripción inicial",
            20,
        );

        const estadoAnterior = JSON.stringify(logro);

        assert.throws(
            () => logro.actualizar({
                descripcion: "Descripción modificada",
                porcentajeCompletitud: 200,
            }),
            DomainError,
        );

        assert.equal(JSON.stringify(logro), estadoAnterior);
    });
});

describe("Proyecto y logros", () => {
    const crearProyecto = () => new Proyecto(
        "proyecto-1",
        "Proyecto",
        "Descripción del proyecto",
        "colectivo-1",
    );

    test("agrega, obtiene y elimina un logro", () => {
        const proyecto = crearProyecto();
        const logro = new Logro("logro-1", "Primer logro", 25);

        proyecto.agregarLogro(logro);

        assert.equal(proyecto.obtenerLogro("logro-1"), logro);
        assert.equal(proyecto.logros.length, 1);

        const eliminado = proyecto.eliminarLogro("logro-1");

        assert.equal(eliminado, logro);
        assert.equal(proyecto.logros.length, 0);
    });

    test("actualiza un logro del proyecto", () => {
        const proyecto = crearProyecto();
        const logro = new Logro("logro-1", "Primer logro", 25);

        proyecto.agregarLogro(logro);
        proyecto.actualizarLogro("logro-1", {
            porcentajeCompletitud: 75,
        });

        assert.equal(logro.porcentajeCompletitud, 75);
    });

    test("rechaza un logro inexistente", () => {
        const proyecto = crearProyecto();

        assert.throws(
            () => proyecto.obtenerLogro("no-existe"),
            NotFoundError,
        );
    });

    test("rechaza dos logros con el mismo id", () => {
        const proyecto = crearProyecto();

        proyecto.agregarLogro(
            new Logro("logro-1", "Primer logro", 25),
        );

        assert.throws(
            () => proyecto.agregarLogro(
                new Logro("logro-1", "Logro duplicado", 50),
            ),
            DomainError,
        );
    });
});
import { describe, test, expect } from "@jest/globals";
import { Proyecto } from "../../src/domain/Proyecto/Proyecto.js";
import {
    ConflictError,
    DomainError,
} from "../../src/domain/errores.js";

const crearProyecto = (fechaCierre = null) =>
    new Proyecto(
        "proyecto-1",
        "Proyecto de prueba",
        "Descripción",
        "colectivo-1",
        [],
        [],
        true,
        "ACTIVO",
        fechaCierre,
    );

describe("Cierre automático de proyectos", () => {
    test("un proyecto sin fecha no debe cerrarse automáticamente", () => {
        const proyecto = crearProyecto();

        expect(proyecto.fechaCierre).toBeNull();
        expect(proyecto.debeCerrarse()).toBe(false);
    });

    test.each([
        [-1, false],
        [0, true],
        [1, true],
    ])(
        "evalúa el vencimiento con diferencia de %s milisegundos",
        (diferencia, esperado) => {
            const fecha = new Date("2030-11-19T18:00:00Z");
            const proyecto = crearProyecto(fecha);
            const ahora = new Date(fecha.getTime() + diferencia);

            expect(proyecto.debeCerrarse(ahora)).toBe(esperado);
        },
    );

    test("el cierre finaliza el proyecto y desactiva la búsqueda", () => {
        const fecha = new Date("2030-11-19T18:00:00Z");
        const proyecto = crearProyecto(fecha);

        proyecto.cerrar();

        expect(proyecto.estado).toBe("FINALIZADO");
        expect(proyecto.estaBuscando).toBe(false);
        expect(proyecto.fechaCierre).toEqual(fecha);
    });

    test("un proyecto finalizado no vuelve a necesitar cierre", () => {
        const fecha = new Date("2030-11-19T18:00:00Z");
        const proyecto = crearProyecto(fecha);

        proyecto.cerrar();

        expect(
            proyecto.debeCerrarse(new Date(fecha.getTime() + 1000)),
        ).toBe(false);
    });

    test.each([
        new Date("fecha inválida"),
        "2030-11-19",
        42,
    ])("rechaza una fecha de dominio inválida: %s", (fecha) => {
        expect(() => crearProyecto(fecha)).toThrow(DomainError);
    });

    test("el vencimiento bloquea postulaciones antes de ejecutar la tarea", () => {
        const proyecto = crearProyecto(
            new Date(Date.now() - 1000),
        );

        expect(proyecto.estado).toBe("ACTIVO");
        expect(
            () => proyecto.validarSePuedeAnotar(),
        ).toThrow(ConflictError);
    });

    test("modificar la fecha original no cambia la programación", () => {
        const fecha = new Date("2030-11-19T18:00:00Z");
        const proyecto = crearProyecto(fecha);

        fecha.setUTCFullYear(2040);

        expect(proyecto.fechaCierre).toEqual(
            new Date("2030-11-19T18:00:00Z"),
        );
    });
});

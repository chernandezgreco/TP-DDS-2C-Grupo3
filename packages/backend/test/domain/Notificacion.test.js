import { describe, test, expect } from "@jest/globals";
import { Notificacion } from "../../src/domain/Notificacion/Notificacion.js";
import { DomainError } from "../../src/domain/errores.js";

describe("Notificacion", () => {
    test("guarda los datos que recibe", () => {
        const fecha = new Date("2026-10-10");
        const notificacion = new Notificacion("n1", "col1", "colectivo1", "proy1", "Te necesitamos", fecha);

        expect(notificacion.colaboradoraId).toBe("col1");
        expect(notificacion.colectivoId).toBe("colectivo1");
        expect(notificacion.proyectoId).toBe("proy1");
        expect(notificacion.texto).toBe("Te necesitamos");
        expect(notificacion.fecha).toBe(fecha);
    });

    test("usa la fecha de hoy si no le pasan una", () => {
        const notificacion = new Notificacion("n1", "col1", "colectivo1", "proy1", "Hola");

        expect(notificacion.fecha).toBeInstanceOf(Date);
    });

    test("saca los espacios del texto", () => {
        const notificacion = new Notificacion("n1", "col1", "colectivo1", "proy1", "  Hola  ");

        expect(notificacion.texto).toBe("Hola");
    });

    test("rechaza un texto vacío", () => {
        expect(() => new Notificacion("n1", "col1", "colectivo1", "proy1", "   ")).toThrow(DomainError);
    });
});

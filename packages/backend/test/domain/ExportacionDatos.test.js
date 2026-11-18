import { describe, test, expect } from "@jest/globals";
import {
    ExportacionDatos,
    DATOS_EXCLUIDOS,
    VERSION_FORMATO,
} from "../../src/domain/Exportacion/ExportacionDatos.js";
import { DomainError } from "../../src/domain/errores.js";

const generadoEn = new Date("2026-11-17T15:00:00.000Z");

const unaExportacion = (secciones = {}, extra = {}) =>
    new ExportacionDatos({
        tipoTitular: "colaboradoras",
        perfilId: "abc123",
        secciones,
        generadoEn,
        ...extra,
    });

describe("ExportacionDatos", () => {
    test("rechaza un tipo de titular desconocido", () => {
        expect(() => unaExportacion({}, { tipoTitular: "admin" })).toThrow(DomainError);
    });

    test("rechaza una exportación sin perfil", () => {
        expect(() => unaExportacion({}, { perfilId: "" })).toThrow(DomainError);
    });

    test("rechaza secciones que no son un objeto", () => {
        expect(() => unaExportacion([])).toThrow(DomainError);
    });

    test("no permite pisar la sección de metadatos", () => {
        expect(() => unaExportacion({ metadatos: {} })).toThrow(DomainError);
    });

    test("encabeza el JSON con metadatos de versión, titular y exclusiones", () => {
        const json = unaExportacion({ perfil: { nombreFantasia: "Ana" } }).toJSON();

        expect(json.metadatos).toEqual({
            plataforma: "Código a Voluntad",
            versionFormato: VERSION_FORMATO,
            generadoEn: "2026-11-17T15:00:00.000Z",
            titular: { tipo: "colaboradoras", perfilId: "abc123" },
            secciones: ["perfil"],
            excluido: [...DATOS_EXCLUIDOS],
        });
        expect(json.perfil).toEqual({ nombreFantasia: "Ana" });
    });

    test("normaliza las fechas a ISO 8601", () => {
        const json = unaExportacion({
            cuenta: { fechaAlta: new Date("2026-01-02T03:04:05.000Z") },
        }).toJSON();

        expect(json.cuenta.fechaAlta).toBe("2026-01-02T03:04:05.000Z");
    });

    test("no comparte referencias con los datos recibidos", () => {
        const secciones = { perfil: { nombreFantasia: "Ana" } };
        const exportacion = unaExportacion(secciones);
        secciones.perfil.nombreFantasia = "Otra";

        expect(exportacion.toJSON().perfil.nombreFantasia).toBe("Ana");
    });

    test("la referencia a otra colaboradora sólo tiene id y nombre de fantasía", () => {
        const referencia = ExportacionDatos.referenciaColaboradora("c1", {
            nombreFantasia: "Luna",
            mediosContacto: [{ tipo: "EMAIL", valor: "luna@example.com" }],
            nombreApellido: "Luna Gómez",
        });

        expect(referencia).toEqual({ id: "c1", nombreFantasia: "Luna" });
    });

    test("la referencia a una colaboradora inexistente conserva el id", () => {
        expect(ExportacionDatos.referenciaColaboradora("c9", undefined)).toEqual({
            id: "c9",
            nombreFantasia: null,
        });
    });

    test("arma el nombre del archivo con el tipo de titular, el día y el formato", () => {
        expect(unaExportacion().nombreArchivo("json")).toBe(
            "codigo-a-voluntad-datos-colaboradora-2026-11-17.json",
        );
        expect(
            unaExportacion({}, { tipoTitular: "colectivos" }).nombreArchivo("csv"),
        ).toBe("codigo-a-voluntad-datos-colectivo-2026-11-17.csv");
    });

    test("rechaza un formato de archivo desconocido", () => {
        expect(() => unaExportacion().nombreArchivo("xml")).toThrow(DomainError);
    });

    describe("filas en formato largo", () => {
        const filasDe = (secciones) =>
            unaExportacion(secciones).filas().filter((f) => f.seccion !== "metadatos");

        test("un objeto es un único registro con un campo por dato", () => {
            expect(filasDe({ perfil: { nombreFantasia: "Ana", aceptaMensajeria: true } })).toEqual([
                { seccion: "perfil", registro: "1", campo: "nombreFantasia", valor: "Ana" },
                { seccion: "perfil", registro: "1", campo: "aceptaMensajeria", valor: "true" },
            ]);
        });

        test("cada elemento de una lista es un registro numerado desde 1", () => {
            const filas = filasDe({
                postulaciones: [{ estado: "PENDIENTE" }, { estado: "ACEPTADA" }],
            });

            expect(filas).toEqual([
                { seccion: "postulaciones", registro: "1", campo: "estado", valor: "PENDIENTE" },
                { seccion: "postulaciones", registro: "2", campo: "estado", valor: "ACEPTADA" },
            ]);
        });

        test("los datos anidados usan rutas con punto y posiciones entre corchetes", () => {
            const filas = filasDe({
                proyectos: [
                    {
                        perfiles: [{ descripcionPerfil: "Tester", habilidadesRequeridas: ["cypress"] }],
                    },
                ],
            });

            expect(filas.map((f) => [f.campo, f.valor])).toEqual([
                ["perfiles[1].descripcionPerfil", "Tester"],
                ["perfiles[1].habilidadesRequeridas[1]", "cypress"],
            ]);
        });

        test("una sección vacía o nula aparece igual, marcada sin registros", () => {
            const filas = filasDe({ postulaciones: [], linkedin: null });

            expect(filas).toEqual([
                { seccion: "postulaciones", registro: "", campo: "(sin registros)", valor: "" },
                { seccion: "linkedin", registro: "", campo: "(sin registros)", valor: "" },
            ]);
        });

        test("los valores nulos y las listas vacías quedan como celdas vacías", () => {
            const filas = filasDe({ perfil: { pronombres: null, mediosContacto: [] } });

            expect(filas).toEqual([
                { seccion: "perfil", registro: "1", campo: "pronombres", valor: "" },
                { seccion: "perfil", registro: "1", campo: "mediosContacto", valor: "" },
            ]);
        });

        test("incluye los metadatos como primera sección", () => {
            const [primera] = unaExportacion({ perfil: {} }).filas();

            expect(primera).toEqual({
                seccion: "metadatos",
                registro: "1",
                campo: "plataforma",
                valor: "Código a Voluntad",
            });
        });
    });
});

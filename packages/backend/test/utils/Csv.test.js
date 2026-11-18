import { describe, test, expect } from "@jest/globals";
import { aCsv, escaparCeldaCsv } from "../../src/utils/csv.js";

describe("escaparCeldaCsv", () => {
    test("deja igual un texto simple", () => {
        expect(escaparCeldaCsv("Ana Pérez")).toBe("Ana Pérez");
    });

    test("convierte nulos en celdas vacías", () => {
        expect(escaparCeldaCsv(null)).toBe("");
        expect(escaparCeldaCsv(undefined)).toBe("");
    });

    test("encierra entre comillas los textos con comas o saltos de línea", () => {
        expect(escaparCeldaCsv("uno, dos")).toBe('"uno, dos"');
        expect(escaparCeldaCsv("línea 1\nlínea 2")).toBe('"línea 1\nlínea 2"');
    });

    test("duplica las comillas internas", () => {
        expect(escaparCeldaCsv('dijo "hola"')).toBe('"dijo ""hola"""');
    });

    test.each(["=HYPERLINK(\"http://x\")", "+1+1", "-2+3", "@SUM(A1)", "\tcmd"])(
        "neutraliza la fórmula %p anteponiendo un apóstrofo",
        (valor) => {
            expect(escaparCeldaCsv(valor).replace(/^"/, "").startsWith("'")).toBe(true);
        },
    );

    test("neutraliza y además entrecomilla una fórmula con comas", () => {
        expect(escaparCeldaCsv("=SUM(A1,B1)")).toBe("\"'=SUM(A1,B1)\"");
    });
});

describe("aCsv", () => {
    test("arranca con BOM, separa con comas y termina cada fila con CRLF", () => {
        const csv = aCsv(["seccion", "valor"], [["perfil", "Ana"], ["perfil", "a,b"]]);

        expect(csv).toBe('\uFEFFseccion,valor\r\nperfil,Ana\r\nperfil,"a,b"\r\n');
    });

    test("sin filas devuelve sólo el encabezado", () => {
        expect(aCsv(["a", "b"], [])).toBe("\uFEFFa,b\r\n");
    });
});

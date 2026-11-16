import { describe, test, expect } from "@jest/globals";
import { sanitizarTexto } from "../../src/utils/sanitizar.js";
import {
    esUrlWebValida,
    esCuentaCodigoValida,
} from "../../src/utils/enlaces.js";

describe("Sanitización de textos", () => {
    test.each([
        [
            "Hola <script>alert(1)</script>mundo",
            "Hola mundo",
        ],
        [
            '<img src="x" onerror="alert(1)">Texto',
            "Texto",
        ],
        [
            '<iframe src="https://example.com"></iframe>Texto',
            "Texto",
        ],
        [
            '<a href="javascript:alert(1)">Enlace</a>',
            "Enlace",
        ],
        [
            "<b>A & B</b>",
            "A & B",
        ],
        [
            "<b>&lt;script&gt;alert(1)&lt;/script&gt;</b>",
            "",
        ],
        [
            "<script>alert(1)</script>",
            "",
        ],
    ])("limpia %s", (entrada, esperado) => {
        expect(sanitizarTexto(entrada)).toBe(esperado);
    });

    test.each([
        "**Negrita** y *cursiva*",
        "# Título\n\n- Primero\n- Segundo",
        "[Repositorio](https://github.com/grupo/proyecto)",
        "A & B, 2 < 3",
        "Texto con ñ y tildes: programación",
        "",
    ])("conserva el texto permitido: %s", (texto) => {
        expect(sanitizarTexto(texto)).toBe(texto);
    });

    test.each([null, undefined, 42, false])(
        "deja los valores no textuales para que los valide el esquema",
        (valor) => {
            expect(sanitizarTexto(valor)).toBe(valor);
        },
    );
});

describe("Enlaces web", () => {
    test.each([
        "https://example.com",
        "http://localhost:8000",
        "https://github.com/grupo/proyecto",
    ])("acepta %s", (url) => {
        expect(esUrlWebValida(url)).toBe(true);
    });

    test.each([
        "javascript:alert(1)",
        "data:text/html,<script>alert(1)</script>",
        "file:///archivo",
        "ftp://example.com",
        "https://usuario:clave@example.com",
        "//example.com",
        "texto",
        "",
        null,
    ])("rechaza %s", (url) => {
        expect(esUrlWebValida(url)).toBe(false);
    });
});

describe("Cuenta de GitHub o GitLab", () => {
    test.each([
        "ana",
        "ana-dev",
        "github.com/ana",
        "gitlab.com/grupo/ana",
        "https://github.com/ana",
    ])("acepta %s", (cuenta) => {
        expect(esCuentaCodigoValida(cuenta)).toBe(true);
    });

    test.each([
        "javascript:alert(1)",
        "data:text/html,hola",
        "https://usuario:clave@github.com/ana",
        "<script>alert(1)</script>",
        "",
    ])("rechaza %s", (cuenta) => {
        expect(esCuentaCodigoValida(cuenta)).toBe(false);
    });
});
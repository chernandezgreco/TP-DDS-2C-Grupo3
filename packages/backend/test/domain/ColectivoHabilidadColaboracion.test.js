import { describe, test, expect } from "@jest/globals";
import { Colectivo } from "../../src/domain/Colectivo/Colectivo.js";
import { TipoColectivo } from "../../src/domain/Colectivo/TipoColectivo.js";
import { Habilidad } from "../../src/domain/Habilidad/Habilidad.js";
import { Colaboracion } from "../../src/domain/Colaboracion/Colaboracion.js";
import { EstadoColaboracion } from "../../src/domain/Colaboracion/EstadoColaboracion.js";
import { DomainError } from "../../src/domain/errores.js";

describe("Colectivo", () => {
    test("se crea con un tipo válido y ubicación opcional", () => {
        const colectivo = new Colectivo("c1", "Verde", "Cuidamos plazas", undefined, TipoColectivo.ONG);

        expect(colectivo.tipo).toBe("ONG");
        expect(colectivo.ubicacion).toBeUndefined();
    });

    test("exige nombre y descripción", () => {
        expect(() => new Colectivo("c1", "", "d", "CABA", "ONG")).toThrow(DomainError);
        expect(() => new Colectivo("c1", "Verde", "", "CABA", "ONG")).toThrow(DomainError);
    });

    test("rechaza un tipo que no existe", () => {
        expect(() => new Colectivo("c1", "Verde", "d", "CABA", "EMPRESA")).toThrow(DomainError);
    });
});

describe("Habilidad", () => {
    test("el código es el título normalizado", () => {
        expect(Habilidad.codigoPara("Desarrollo Web React")).toBe("desarrollo-web-react");
        expect(Habilidad.codigoPara("  NodeJS ")).toBe("nodejs");
    });

    test("exige título y descripción", () => {
        expect(() => new Habilidad("x", " ", "d")).toThrow(DomainError);
        expect(() => new Habilidad("x", "X", "")).toThrow(DomainError);
    });
});

describe("Colaboracion", () => {
    test("arranca pendiente", () => {
        const colaboracion = new Colaboracion("col-1", "proyecto-1", "perfil-1", "colaboradora-1");

        expect(colaboracion.estado).toBe(EstadoColaboracion.PENDIENTE);
        expect(colaboracion.fechaCreacion).toBeInstanceOf(Date);
    });

    test("rechaza un estado inválido", () => {
        expect(() => new Colaboracion("col-1", "p", "pf", "c", "CUALQUIERA")).toThrow(DomainError);
    });
});

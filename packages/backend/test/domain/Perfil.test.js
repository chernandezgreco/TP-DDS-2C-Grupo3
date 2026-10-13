import { describe, test, expect } from "@jest/globals";
import { Perfil } from "../../src/domain/Perfil/Perfil.js";
import { Compromiso } from "../../src/domain/Compromiso/Compromiso.js";
import { ModalidadColaboracion } from "../../src/domain/ModalidadColaboracion/ModalidadColaboracion.js";
import { DomainError } from "../../src/domain/errores.js";
import { unPerfil, unaColaboradora } from "../helpers/datos.js";

const compromiso = () => new Compromiso(5, "SEMANALES");
const modalidad = () => new ModalidadColaboracion(true, false, false);

describe("Perfil", () => {
    test("se crea con sus habilidades, compromiso y modalidad", () => {
        const perfil = unPerfil("p1", ["react", "nodejs"], ["javascript"]);

        expect(perfil.id).toBe("p1");
        expect(perfil.habilidadesRequeridas).toEqual(["react", "nodejs"]);
        expect(perfil.habilidadesOpcionales).toEqual(["javascript"]);
        expect(perfil.compromiso.cantidadHoras).toBe(5);
    });

    test("exige una descripción", () => {
        expect(() => new Perfil("p1", "  ", ["react"], [], compromiso(), modalidad())).toThrow(DomainError);
    });

    test("exige al menos una habilidad requerida", () => {
        expect(() => new Perfil("p1", "Frontend", [], [], compromiso(), modalidad())).toThrow(DomainError);
    });

    test("exige un compromiso y una modalidad válidos", () => {
        expect(() => new Perfil("p1", "Frontend", ["react"], [], { cantidadHoras: 5 }, modalidad())).toThrow(DomainError);
        expect(() => new Perfil("p1", "Frontend", ["react"], [], compromiso(), {})).toThrow(DomainError);
    });

    test("admite a una colaboradora con al menos una de las habilidades requeridas", () => {
        const perfil = unPerfil("p1", ["react", "nodejs"]);

        expect(perfil.admiteA(unaColaboradora(["nodejs"]))).toBe(true);
        expect(perfil.admiteA(unaColaboradora(["python"]))).toBe(false);
    });

    test("una habilidad opcional sola no alcanza para ser admitida", () => {
        const perfil = unPerfil("p1", ["react"], ["javascript"]);

        expect(perfil.admiteA(unaColaboradora(["javascript"]))).toBe(false);
    });

    test("la afinidad cuenta habilidades requeridas y opcionales", () => {
        const perfil = unPerfil("p1", ["react"], ["javascript", "nodejs"]);

        expect(perfil.afinidadCon(unaColaboradora(["react", "javascript"]))).toBe(2);
        expect(perfil.afinidadCon(unaColaboradora(["python"]))).toBe(0);
    });

    test("actualiza solo los campos informados", () => {
        const perfil = unPerfil();

        perfil.actualizar({ descripcionPerfil: "Frontend senior", compromiso: { cantidadHoras: 10, tipo: "MENSUALES" } });

        expect(perfil.descripcionPerfil).toBe("Frontend senior");
        expect(perfil.compromiso).toBeInstanceOf(Compromiso);
        expect(perfil.compromiso.cantidadHoras).toBe(10);
        expect(perfil.habilidadesRequeridas).toEqual(["react"]);
    });

    test("una actualización inválida no cambia nada", () => {
        const perfil = unPerfil();
        const antes = JSON.stringify(perfil);

        expect(() => perfil.actualizar({ descripcionPerfil: "Nuevo", habilidadesRequeridas: [] })).toThrow(DomainError);
        expect(JSON.stringify(perfil)).toBe(antes);
    });
});

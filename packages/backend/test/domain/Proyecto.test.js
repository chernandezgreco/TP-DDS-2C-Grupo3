import { describe, test, expect } from "@jest/globals";
import { Proyecto } from "../../src/domain/Proyecto/Proyecto.js";
import { EstadoProyecto } from "../../src/domain/Proyecto/EstadoProyecto.js";
import { ConflictError, DomainError, NotFoundError } from "../../src/domain/errores.js";
import { unPerfil, unaColaboradora } from "../helpers/datos.js";

const unProyecto = (perfiles = []) => new Proyecto("proyecto-1", "Web", "Sitio de donaciones", "colectivo-1", perfiles);

describe("Proyecto", () => {
    test("arranca activo", () => {
        expect(unProyecto().estado).toBe(EstadoProyecto.ACTIVO);
        expect(unProyecto().estaActivo()).toBe(true);
    });

    test("exige título y descripción", () => {
        expect(() => new Proyecto("p", "", "d", "c")).toThrow(DomainError);
        expect(() => new Proyecto("p", "t", " ", "c")).toThrow(DomainError);
    });

    test("solo acepta perfiles de dominio", () => {
        expect(() => unProyecto([{ descripcionPerfil: "suelto" }])).toThrow(DomainError);
    });

    test("rechaza un estado inválido", () => {
        expect(() => new Proyecto("p", "t", "d", "c", [], [], "PAUSADO")).toThrow(DomainError);
    });

    test("sabe a qué colectivo pertenece", () => {
        expect(unProyecto().perteneceA("colectivo-1")).toBe(true);
        expect(unProyecto().perteneceA("otro")).toBe(false);
    });
});

describe("Proyecto: cierre", () => {
    test("se cierra y queda finalizado", () => {
        const proyecto = unProyecto();

        proyecto.cerrar();

        expect(proyecto.estado).toBe(EstadoProyecto.FINALIZADO);
        expect(proyecto.estaActivo()).toBe(false);
    });

    test("no se puede cerrar dos veces", () => {
        const proyecto = unProyecto();
        proyecto.cerrar();

        expect(() => proyecto.cerrar()).toThrow(ConflictError);
    });
});

describe("Proyecto: perfiles", () => {
    test("agrega, obtiene y elimina un perfil", () => {
        const proyecto = unProyecto();
        const perfil = unPerfil("perfil-1");

        proyecto.agregarPerfil(perfil);
        expect(proyecto.obtenerPerfil("perfil-1")).toBe(perfil);

        expect(proyecto.eliminarPerfil("perfil-1")).toBe(perfil);
        expect(proyecto.perfiles).toHaveLength(0);
    });

    test("actualiza un perfil", () => {
        const proyecto = unProyecto([unPerfil("perfil-1")]);

        proyecto.actualizarPerfil("perfil-1", { descripcionPerfil: "Backend" });

        expect(proyecto.obtenerPerfil("perfil-1").descripcionPerfil).toBe("Backend");
    });

    test("rechaza un perfil inexistente", () => {
        expect(() => unProyecto().obtenerPerfil("no-existe")).toThrow(NotFoundError);
    });

    test("rechaza dos perfiles con el mismo id", () => {
        const proyecto = unProyecto([unPerfil("perfil-1")]);

        expect(() => proyecto.agregarPerfil(unPerfil("perfil-1"))).toThrow(ConflictError);
    });

    test("rechaza algo que no es un perfil", () => {
        expect(() => unProyecto().agregarPerfil({ id: "x" })).toThrow(DomainError);
    });

    test("devuelve los perfiles que admiten a una colaboradora", () => {
        const front = unPerfil("front", ["react"]);
        const back = unPerfil("back", ["nodejs"]);
        const proyecto = unProyecto([front, back]);

        expect(proyecto.perfilesPara(unaColaboradora(["nodejs"]))).toEqual([back]);
    });
});

describe("Proyecto: perfil para anotarse", () => {
    const front = () => unPerfil("front", ["react"]);
    const back = () => unPerfil("back", ["nodejs"]);

    test("sin perfil elegido, asigna el primero que le corresponde", () => {
        const proyecto = unProyecto([front(), back()]);

        expect(proyecto.perfilParaAnotar(unaColaboradora(["nodejs"])).id).toBe("back");
    });

    test("respeta el perfil elegido si la colaboradora cumple", () => {
        const proyecto = unProyecto([front(), back()]);

        expect(proyecto.perfilParaAnotar(unaColaboradora(["react", "nodejs"]), "back").id).toBe("back");
    });

    test("falla si no cumple con el perfil elegido", () => {
        const proyecto = unProyecto([front(), back()]);

        expect(() => proyecto.perfilParaAnotar(unaColaboradora(["react"]), "back")).toThrow(DomainError);
    });

    test("falla si no cumple con ningún perfil", () => {
        const proyecto = unProyecto([front()]);

        expect(() => proyecto.perfilParaAnotar(unaColaboradora(["python"]))).toThrow(DomainError);
    });

    test("falla si el perfil elegido no existe", () => {
        expect(() => unProyecto([front()]).perfilParaAnotar(unaColaboradora(["react"]), "no-existe")).toThrow(NotFoundError);
    });

    test("un proyecto finalizado no admite colaboraciones", () => {
        const proyecto = unProyecto([front()]);
        proyecto.cerrar();

        expect(() => proyecto.perfilParaAnotar(unaColaboradora(["react"]))).toThrow(ConflictError);
    });
});

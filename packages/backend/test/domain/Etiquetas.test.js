import { describe, test, expect } from "@jest/globals";
import {
  normalizarEtiqueta,
  normalizarEtiquetas,
} from "../../src/domain/etiquetas.js";
import { Proyecto } from "../../src/domain/Proyecto/Proyecto.js";
import { EstadoProyecto } from "../../src/domain/Proyecto/EstadoProyecto.js";
import { Colectivo } from "../../src/domain/Colectivo/Colectivo.js";
import { DomainError } from "../../src/domain/errores.js";

const errorDe = (fn) => {
  try {
    fn();
  } catch (error) {
    return error;
  }
  throw new Error("no lanzó error");
};

describe("normalizarEtiqueta", () => {
  test.each([
    ["Educación Popular", "educacion-popular"],
    ["  SALUD  ", "salud"],
    ["diseño", "diseno"],
    ["node.js", "node-js"],
    ["--Software   libre--", "software-libre"],
    ["educacion-popular", "educacion-popular"],
  ])("%s -> %s", (entrada, esperada) => {
    expect(normalizarEtiqueta(entrada)).toBe(esperada);
  });

  test("aplicarla dos veces da lo mismo que una", () => {
    const una = normalizarEtiqueta("Género y Diversidad!");
    expect(normalizarEtiqueta(una)).toBe(una);
  });
});

describe("normalizarEtiquetas", () => {
  test("sin etiquetas devuelve una lista vacía", () => {
    expect(normalizarEtiquetas()).toEqual([]);
    expect(normalizarEtiquetas([])).toEqual([]);
  });

  test("quita las repetidas después de normalizar, conservando el orden", () => {
    expect(
      normalizarEtiquetas(["Salud", "educación", "salud ", "Educacion"]),
    ).toEqual(["salud", "educacion"]);
  });

  test("cuenta el máximo de 10 después de quitar repetidas", () => {
    const diez = Array.from({ length: 10 }, (_, i) => `tema${i}`);
    expect(normalizarEtiquetas([...diez, "TEMA0", "Tema1"])).toHaveLength(10);
  });

  test("rechaza más de 10 etiquetas distintas", () => {
    const once = Array.from({ length: 11 }, (_, i) => `tema${i}`);
    const error = errorDe(() => normalizarEtiquetas(once));
    expect(error).toBeInstanceOf(DomainError);
    expect(error.detalle).toEqual({ campo: "etiquetas", cantidad: 11 });
  });

  test.each([["a"], ["c++"], ["!!!"], ["x".repeat(31)]])(
    "rechaza %s por su largo una vez normalizada",
    (etiqueta) => {
      const error = errorDe(() => normalizarEtiquetas([etiqueta]));
      expect(error).toBeInstanceOf(DomainError);
      expect(error.detalle).toEqual({ campo: "etiquetas", valor: etiqueta });
    },
  );

  test("acepta 30 caracteres", () => {
    expect(normalizarEtiquetas(["x".repeat(30)])).toEqual(["x".repeat(30)]);
  });

  test("rechaza algo que no es una lista de textos", () => {
    expect(() => normalizarEtiquetas("salud")).toThrow(DomainError);
    expect(() => normalizarEtiquetas([42])).toThrow(DomainError);
    expect(() => normalizarEtiquetas(null)).toThrow(DomainError);
  });
});

describe("etiquetas en el dominio", () => {
  test("un proyecto arranca sin etiquetas", () => {
    expect(new Proyecto("p", "Web", "Sitio", "c").etiquetas).toEqual([]);
  });

  test("un proyecto guarda sus etiquetas normalizadas", () => {
    const proyecto = new Proyecto(
      "p",
      "Web",
      "Sitio",
      "c",
      [],
      [],
      true,
      EstadoProyecto.ACTIVO,
      null,
      ["Educación", "educacion", "Software Libre"],
    );
    expect(proyecto.etiquetas).toEqual(["educacion", "software-libre"]);
  });

  test("un proyecto no acepta etiquetas inválidas", () => {
    expect(
      () =>
        new Proyecto("p", "Web", "Sitio", "c", [], [], true, EstadoProyecto.ACTIVO, null, ["x"]),
    ).toThrow(DomainError);
  });

  test("un colectivo arranca sin etiquetas y guarda las suyas normalizadas", () => {
    expect(new Colectivo("c", "Asamblea", "Barrio", "CABA", "ASAMBLEA").etiquetas).toEqual([]);
    expect(
      new Colectivo("c", "Asamblea", "Barrio", "CABA", "ASAMBLEA", ["Cultura", "Barrio"]).etiquetas,
    ).toEqual(["cultura", "barrio"]);
  });

  test("un colectivo no acepta etiquetas inválidas", () => {
    expect(
      () => new Colectivo("c", "Asamblea", "Barrio", "CABA", "ASAMBLEA", ["?"]),
    ).toThrow(DomainError);
  });
});

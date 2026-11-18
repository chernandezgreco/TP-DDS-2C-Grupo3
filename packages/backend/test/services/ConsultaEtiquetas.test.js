import { describe, test, expect } from "@jest/globals";
import {
  etiquetasDeConsulta,
  filtroEtiquetas,
} from "../../src/services/consultaEtiquetas.js";
import { DomainError } from "../../src/domain/errores.js";

describe("etiquetasDeConsulta", () => {
  test("sin el parámetro no filtra", () => {
    expect(etiquetasDeConsulta(undefined)).toEqual([]);
    expect(etiquetasDeConsulta("")).toEqual([]);
    expect(etiquetasDeConsulta(",, ,")).toEqual([]);
  });

  test("separa por coma y normaliza", () => {
    expect(etiquetasDeConsulta("Salud, Educación ,salud")).toEqual([
      "salud",
      "educacion",
    ]);
  });

  test("acepta la clave repetida", () => {
    expect(etiquetasDeConsulta(["salud", "educacion,web"])).toEqual([
      "salud",
      "educacion",
      "web",
    ]);
  });

  test("una etiqueta inválida es un error del pedido", () => {
    expect(() => etiquetasDeConsulta("x")).toThrow(DomainError);
  });
});

describe("filtroEtiquetas", () => {
  test("exige todas las etiquetas pedidas", () => {
    expect(filtroEtiquetas(["salud", "web"])).toEqual({
      etiquetas: { $all: ["salud", "web"] },
    });
  });

  test("sin etiquetas no agrega condiciones", () => {
    expect(filtroEtiquetas([])).toEqual({});
  });
});

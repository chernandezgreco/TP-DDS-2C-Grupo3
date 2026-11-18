import {
  normalizarEtiqueta,
  problemaEtiqueta,
  sinAcentos,
  textoDeEtiquetas,
  etiquetasEnUso,
} from "./etiquetas";

// mismos casos que packages/backend/test/domain/Etiquetas.test.js: la copia tiene que dar lo mismo
test.each([
  ["Educación Popular", "educacion-popular"],
  ["  SALUD  ", "salud"],
  ["diseño", "diseno"],
  ["node.js", "node-js"],
  ["--Software   libre--", "software-libre"],
  ["educacion-popular", "educacion-popular"],
])("normaliza %s como %s", (entrada, esperada) => {
  expect(normalizarEtiqueta(entrada)).toBe(esperada);
});

test("avisa por qué no se puede agregar una etiqueta", () => {
  expect(problemaEtiqueta("c")).toMatch(/entre 2 y 30/);
  expect(problemaEtiqueta("x".repeat(31))).toMatch(/entre 2 y 30/);
  const diez = Array.from({ length: 10 }, (_, i) => `tema${i}`);
  expect(problemaEtiqueta("otra", diez)).toMatch(/hasta 10/);
  expect(problemaEtiqueta("tema0", diez)).toBeNull();
  expect(problemaEtiqueta("salud", [])).toBeNull();
});

test("la búsqueda de texto ignora mayúsculas y acentos pero conserva los espacios", () => {
  expect(sinAcentos("Educación Popular")).toBe("educacion popular");
});

test("las etiquetas con guiones también se encuentran con espacios", () => {
  expect(textoDeEtiquetas(["software-libre"])).toContain("software libre");
  expect(textoDeEtiquetas()).toBe("");
});

test("junta las etiquetas en uso sin repetir y ordenadas", () => {
  expect(
    etiquetasEnUso([
      { etiquetas: ["web", "salud"] },
      { etiquetas: ["salud"] },
      {},
    ]),
  ).toEqual(["salud", "web"]);
});

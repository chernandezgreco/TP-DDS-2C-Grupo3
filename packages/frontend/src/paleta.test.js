// Controla la paleta definida en App.css: que el modo daltónico sólo redefina variables existentes,
// que no quede ninguna variable sin definir y que los textos cumplan contraste AA (WCAG 1.4.3).
import fs from "fs";
import path from "path";

const css = fs.readFileSync(path.join(__dirname, "App.css"), "utf8");

const bloque = (selector) => {
  const inicio = css.indexOf(`${selector} {`);
  if (inicio < 0) throw new Error(`No se encontró ${selector} en App.css`);
  return css.slice(inicio, css.indexOf("}", inicio));
};
const variables = (texto) =>
  Object.fromEntries(
    [...texto.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map(([, n, v]) => [
      n,
      v.trim(),
    ]),
  );

// el :root normal está repartido (paleta general + estados de tareas): se juntan todos
const normal = Object.assign(
  {},
  ...[...css.matchAll(/(^|\n):root \{([^}]*)\}/g)].map((m) => variables(m[2])),
);
const daltonico = variables(bloque(':root[data-vision="daltonico"]'));

const luminancia = (hex) => {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contraste = (a, b) => {
  const [x, y] = [luminancia(a), luminancia(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

const matiz = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  if (!d) return null; // gris puro: sin matiz
  const h =
    max === r
      ? ((g - b) / d) % 6
      : max === g
        ? (b - r) / d + 2
        : (r - g) / d + 4;
  return (h * 60 + 360) % 360;
};
const esVerde = (hex) => {
  const h = matiz(hex);
  return h !== null && h >= 60 && h <= 175;
};

test("en modo daltónico no queda ningún verde, ni siquiera los fondos claros", () => {
  const paleta = { ...normal, ...daltonico };
  const verdes = Object.entries(paleta).filter(
    ([, v]) => /^#[0-9a-f]{6}/i.test(v) && esVerde(v.slice(0, 7)),
  );
  expect(verdes).toEqual([]);
});

test("fuera de la paleta no hay colores verdes escritos a mano (deben ser variables)", () => {
  const fueraDeRoot = css.replace(/(^|\n):root[^{]*\{[^}]*\}/g, "");
  // acepta #rgb, #rrggbb y #rrggbbaa (con transparencia)
  const aSeisDigitos = (h) =>
    h.length === 4
      ? `#${[...h.slice(1)].map((c) => c + c).join("")}`
      : h.slice(0, 7);
  const sueltos = [
    ...fueraDeRoot.matchAll(/#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3})\b/gi),
  ]
    .map((m) => m[0])
    .filter((h) => esVerde(aSeisDigitos(h)));
  expect(sueltos).toEqual([]);
});

test("los tonos de la interfaz conservan la luminancia: los contrastes son iguales en ambos modos", () => {
  const tonos = Object.keys(normal).filter((n) => n.startsWith("--ui-"));
  expect(tonos.length).toBeGreaterThan(0);
  for (const n of tonos) {
    const [a, b] = [normal[n], daltonico[n]].map((v) => v.slice(0, 7));
    expect(contraste(a, b)).toBeLessThan(1.02);
  }
});

test("el modo daltónico sólo redefine variables que existen en la paleta normal", () => {
  const desconocidas = Object.keys(daltonico).filter((n) => !(n in normal));
  expect(desconocidas).toEqual([]);
});

test("toda variable de color usada en App.css está definida", () => {
  const usadas = new Set(
    [...css.matchAll(/var\((--[\w-]+)\s*\)/g)].map((m) => m[1]),
  );
  const sinDefinir = [...usadas].filter((n) => !(n in normal));
  expect(sinDefinir).toEqual([]);
});

const paresDeTexto = [
  ["--color-exito-texto", "--color-exito-fondo"],
  ["--color-error-texto", "--color-error-fondo"],
  ["--color-peligro-texto", "--color-peligro-fondo"],
  ["--badge-texto", "--badge-fondo"],
  ["--nav-activo-texto", "--nav-activo-fondo"],
];

describe.each([
  ["normal", normal],
  ["daltónica", { ...normal, ...daltonico }],
])("paleta %s", (_, paleta) => {
  test.each(paresDeTexto)("%s sobre %s cumple AA (4.5:1)", (texto, fondo) => {
    expect(contraste(paleta[texto], paleta[fondo])).toBeGreaterThanOrEqual(4.5);
  });

  // el principal es fondo de botones (texto blanco) y color de links sobre el fondo de página y el bloque de inicio
  test.each([
    "#ffffff",
    "--ui-body-fondo",
    "--ui-hero-fondo",
    "--nav-activo-fondo",
  ])("el color principal cumple AA (4.5:1) contra %s", (fondo) => {
    const otro = fondo.startsWith("#") ? fondo : paleta[fondo].slice(0, 7);
    expect(contraste(paleta["--color-principal"], otro)).toBeGreaterThanOrEqual(
      4.5,
    );
  });

  test.each(["pendiente", "en-curso", "finalizada", "cerrada"])(
    "el borde del estado %s se distingue del fondo blanco (3:1)",
    (estado) => {
      expect(
        contraste(paleta[`--estado-${estado}-borde`], "#ffffff"),
      ).toBeGreaterThanOrEqual(3);
    },
  );
});

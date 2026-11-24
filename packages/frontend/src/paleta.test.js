// Controla las paletas definidas en App.css: que cada modo de color sólo redefina variables existentes,
// que no quede ninguna variable sin definir, que los textos cumplan contraste AA (WCAG 1.4.3), que los
// bordes de controles lleguen a 3:1 (WCAG 1.4.11) y que cada modo separe sus pares críticos para la
// visión a la que apunta (simulación de Machado, Oliveira y Fernandes, 2009).
import fs from "fs";
import path from "path";
import { MODOS_COLOR } from "./vision";
import { MODOS as MODOS_SELECTOR } from "./BotonModoDaltonico";

const css = fs.readFileSync(path.join(__dirname, "App.css"), "utf8");

const variables = (texto) =>
  Object.fromEntries(
    [...texto.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map(([, n, v]) => [
      n,
      v.trim(),
    ]),
  );

// el :root normal puede estar repartido: se juntan todos los bloques
const normal = Object.assign(
  {},
  ...[...css.matchAll(/(^|\n):root \{([^}]*)\}/g)].map((m) => variables(m[2])),
);

// cada modo junta, en orden, los bloques `:root[data-vision="..."]` que lo nombran:
// el bloque compartido por todos y después el propio del modo
const bloquesDeVision = [
  ...css.matchAll(
    /(^|\n)((?::root\[data-vision="[\w-]+"\],?\s*)+)\{([^}]*)\}/g,
  ),
].map((m) => ({
  modos: [...m[2].matchAll(/data-vision="([\w-]+)"/g)].map((x) => x[1]),
  vars: variables(m[3]),
}));
const redefinicionesDe = (modo) =>
  Object.assign(
    {},
    ...bloquesDeVision.filter((b) => b.modos.includes(modo)).map((b) => b.vars),
  );

const modosAlternativos = MODOS_COLOR.filter((m) => m !== "normal");
// protanopia y deuteranopia no distinguen rojo de verde; tritanopia sí ve el verde
const modosRojoVerde = ["protanopia", "deuteranopia"];

// La capa con significado apunta a las rampas con var(--...): para medir hay que resolver la cadena
// con las variables del modo, igual que el navegador.
const resolver = (paleta, valor, vistos = new Set()) => {
  const ref = /^var\((--[\w-]+)\)$/.exec(valor);
  if (!ref) return valor;
  if (vistos.has(ref[1]) || !(ref[1] in paleta)) return undefined;
  vistos.add(ref[1]);
  return resolver(paleta, paleta[ref[1]], vistos);
};
const paletaDe = (modo) => {
  const crudas = modo === "normal" ? normal : { ...normal, ...redefinicionesDe(modo) };
  return Object.fromEntries(
    Object.keys(crudas).map((n) => [n, resolver(crudas, crudas[n])]),
  );
};
const hex = (paleta, nombre) =>
  nombre.startsWith("#") ? nombre : paleta[nombre].slice(0, 7);

// el selector muestra las cuatro combinaciones a la vez, así que no puede leerlas de las variables
// (sólo hay un modo aplicado por vez): sus muestras tienen que coincidir con App.css
test.each(MODOS_COLOR)("las muestras del selector coinciden con la paleta %s", (modo) => {
  const paleta = paletaDe(modo);
  const { muestras } = MODOS_SELECTOR.find((m) => m.valor === modo);
  expect(muestras).toEqual([
    hex(paleta, "--color-principal"),
    hex(paleta, "--color-acento-fondo"),
  ]);
});

test("cada modo de color alternativo tiene su paleta en App.css", () => {
  for (const modo of modosAlternativos) {
    expect(Object.keys(redefinicionesDe(modo)).length).toBeGreaterThan(0);
  }
});

const lineal = (hexa) =>
  [1, 3, 5]
    .map((i) => parseInt(hexa.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
const luminancia = (hexa) => {
  const [r, g, b] = lineal(hexa);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contraste = (a, b) => {
  const [x, y] = [luminancia(a), luminancia(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

const matiz = (hexa) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hexa.slice(i, i + 2), 16));
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
const esVerde = (hexa) => {
  const h = matiz(hexa);
  return h !== null && h >= 60 && h <= 175;
};

test("toda variable de color usada en App.css está definida", () => {
  const usadas = new Set(
    [...css.matchAll(/var\((--[\w-]+)\s*\)/g)].map((m) => m[1]),
  );
  const sinDefinir = [...usadas].filter((n) => !(n in normal));
  expect(sinDefinir).toEqual([]);
});

test.each(MODOS_COLOR)("en modo %s toda variable resuelve a un color", (modo) => {
  const paleta = paletaDe(modo);
  const rotas = Object.entries(paleta).filter(([, v]) => v === undefined);
  expect(rotas).toEqual([]);
});

test.each(modosRojoVerde)("en modo %s no queda ningún verde, ni siquiera los fondos claros", (modo) => {
  const paleta = paletaDe(modo);
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

test.each(modosAlternativos)("en modo %s la escala de grises conserva la luminancia de la paleta normal", (modo) => {
  const base = paletaDe("normal");
  const alternativa = paletaDe(modo);
  const grises = Object.keys(base).filter((n) => n.startsWith("--gris-"));
  expect(grises.length).toBeGreaterThanOrEqual(9);
  for (const n of grises) {
    expect(contraste(hex(base, n), hex(alternativa, n))).toBeLessThan(1.02);
  }
});

test.each(modosAlternativos)("el modo %s sólo redefine variables que existen en la paleta normal", (modo) => {
  const desconocidas = Object.keys(redefinicionesDe(modo)).filter((n) => !(n in normal));
  expect(desconocidas).toEqual([]);
});

const paresDeTexto = [
  ["--color-exito-texto", "--color-exito-fondo"],
  ["--color-error-texto", "--color-error-fondo"],
  ["--color-peligro-texto", "--color-peligro-fondo"],
  ["--color-peligro-texto", "--superficie"],
  ["--color-info-texto", "--color-info-fondo"],
  ["--color-acento", "--color-acento-fondo"],
  ["--color-acento", "--color-acento-suave"],
  ["--badge-texto", "--badge-fondo"],
  ["--nav-activo-texto", "--nav-activo-fondo"],
  ["--color-principal-activo", "--color-principal-suave"],
  ["--texto", "--superficie-suave"],
  ["--texto", "--color-acento-suave"],
  ["--texto-secundario", "--fondo-pagina"],
  ["--texto-secundario", "--superficie-suave"],
  ["--texto-secundario", "--hero-fondo"],
  ["--hero-titulo", "--hero-fondo"],
  ["--texto-titulo", "--fondo-pagina"],
];

describe.each(MODOS_COLOR)("paleta %s", (modo) => {
  const paleta = paletaDe(modo);

  test.each(paresDeTexto)("%s sobre %s cumple AA (4.5:1)", (texto, fondo) => {
    expect(contraste(hex(paleta, texto), hex(paleta, fondo))).toBeGreaterThanOrEqual(4.5);
  });

  // el principal es fondo de botones (texto blanco) y color de links sobre el fondo de página y el bloque de inicio
  test.each([
    "#ffffff",
    "--fondo-pagina",
    "--hero-fondo",
    "--nav-activo-fondo",
  ])("el color principal cumple AA (4.5:1) contra %s", (fondo) => {
    expect(
      contraste(hex(paleta, "--color-principal"), hex(paleta, fondo)),
    ).toBeGreaterThanOrEqual(4.5);
  });

  test.each(["--color-principal-hover", "--color-principal-activo", "--color-peligro-texto"])(
    "el texto blanco sobre %s cumple AA (4.5:1)",
    (fondo) => {
      expect(contraste("#ffffff", hex(paleta, fondo))).toBeGreaterThanOrEqual(4.5);
    },
  );

  test("el borde de los controles se distingue del fondo (3:1)", () => {
    expect(contraste(hex(paleta, "--borde-control"), "#ffffff")).toBeGreaterThanOrEqual(3);
    expect(
      contraste(hex(paleta, "--borde-control"), hex(paleta, "--fondo-pagina")),
    ).toBeGreaterThanOrEqual(3);
  });

  test.each(["pendiente", "en-curso", "finalizada", "cerrada"])(
    "el borde del estado %s se distingue del fondo blanco (3:1)",
    (estado) => {
      expect(
        contraste(hex(paleta, `--estado-${estado}-borde`), "#ffffff"),
      ).toBeGreaterThanOrEqual(3);
    },
  );
});

// ---- Distinguibilidad con daltonismo ----
// Matrices de Machado, Oliveira y Fernandes (2009) con severidad total, aplicadas en RGB lineal.
const MATRICES = {
  protanopia: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
  deuteranopia: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881],
  ],
  tritanopia: [
    [1.255528, -0.076749, -0.178779],
    [-0.078411, 0.930809, 0.147602],
    [0.004733, 0.691367, 0.3039],
  ],
};
const lab = ([r, g, b]) => {
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const x = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047;
  const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883;
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
};
const simular = (hexa, vision) => {
  const v = lineal(hexa);
  if (vision === "normal") return v;
  return MATRICES[vision].map((fila) =>
    Math.min(1, Math.max(0, fila.reduce((s, k, i) => s + k * v[i], 0))),
  );
};
const distancia = (a, b, vision) => {
  const [p, q] = [lab(simular(a, vision)), lab(simular(b, vision))];
  return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
};

// pares que no pueden confundirse: éxito y error, la marca y su acento, y los estados de tarea entre sí
const paresCriticos = [
  ["--color-exito-texto", "--color-error-texto"],
  ["--color-principal", "--color-acento-fondo"],
  ["--color-acento-fondo", "--color-error-texto"],
  ["--estado-en-curso-borde", "--estado-finalizada-borde"],
  ["--estado-en-curso-borde", "--estado-cerrada-borde"],
  ["--estado-finalizada-borde", "--estado-cerrada-borde"],
];

describe.each(MODOS_COLOR)("modo %s, visto por quien lo elige", (modo) => {
  const paleta = paletaDe(modo);
  test.each(paresCriticos)("%s y %s se distinguen (ΔE ≥ 20)", (a, b) => {
    expect(distancia(hex(paleta, a), hex(paleta, b), modo)).toBeGreaterThanOrEqual(20);
  });
});

// la paleta estándar no debería volverse ilegible para quien todavía no eligió un modo
test.each(Object.keys(MATRICES))(
  "con la paleta estándar, éxito y error no se confunden del todo con %s (ΔE ≥ 10)",
  (vision) => {
    const paleta = paletaDe("normal");
    expect(
      distancia(
        hex(paleta, "--color-exito-texto"),
        hex(paleta, "--color-error-texto"),
        vision,
      ),
    ).toBeGreaterThanOrEqual(10);
  },
);

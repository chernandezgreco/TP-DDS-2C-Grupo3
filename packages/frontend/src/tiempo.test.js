import { tiempoRelativo } from "./tiempo";

const AHORA = Date.parse("2026-11-24T18:00:00Z");
const DIA = 24 * 60 * 60;
const hace = (segundos) => new Date(AHORA - segundos * 1000).toISOString();

test.each([
  ["el instante actual", 0, "ahora"],
  ["30 segundos", 30, "hace 30 segundos"],
  ["59 segundos", 59, "hace 59 segundos"],
  ["un minuto", 60, "hace 1 minuto"],
  ["5 minutos", 300, "hace 5 minutos"],
  ["una hora", 3600, "hace 1 hora"],
  ["2 horas", 7200, "hace 2 horas"],
  ["un día", DIA, "ayer"],
  ["3 días", 3 * DIA, "hace 3 días"],
  ["un mes aproximado", 31 * DIA, "el mes pasado"],
  ["2 meses aproximados", 61 * DIA, "hace 2 meses"],
  ["un año aproximado", 400 * DIA, "el año pasado"],
  ["2 años aproximados", 800 * DIA, "hace 2 años"],
  ["un minuto futuro", -60, "dentro de 1 minuto"],
  ["un día futuro", -DIA, "mañana"],
])("muestra la unidad correcta para %s", (_caso, segundos, esperado) => {
  expect(tiempoRelativo(hace(segundos), AHORA)).toBe(esperado);
});

test("informa una fecha inválida", () => {
  expect(tiempoRelativo("no-es-una-fecha", AHORA)).toBe("Fecha desconocida");
});

test("usa el instante actual cuando no se proporciona uno", () => {
  const reloj = jest.spyOn(Date, "now").mockReturnValue(AHORA);
  try {
    expect(tiempoRelativo(hace(300))).toBe("hace 5 minutos");
  } finally {
    reloj.mockRestore();
  }
});

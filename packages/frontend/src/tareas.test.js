import {
  estadosPermitidos,
  diaComoNumero,
  etiquetaDia,
  formatearDia,
  hoyComoNumero,
  tareaAPayload,
  textoDuracion,
} from "./tareas";

test("formatea el día sin pasar por Date, así que ninguna zona horaria lo corre", () => {
  expect(formatearDia("2026-11-02")).toBe("02/11/2026");
  expect(formatearDia("2026-01-31")).toBe("31/01/2026");
});

test("los números de día permiten restar fechas y cruzan meses y años", () => {
  expect(diaComoNumero("2026-11-06") - diaComoNumero("2026-11-02")).toBe(4);
  expect(diaComoNumero("2026-12-03") - diaComoNumero("2026-11-28")).toBe(5);
  expect(diaComoNumero("2027-01-01") - diaComoNumero("2026-12-31")).toBe(1);
  expect(diaComoNumero("2028-03-01") - diaComoNumero("2028-02-28")).toBe(2);
});

test("la etiqueta de una marca de la escala es día y mes", () => {
  expect(etiquetaDia(diaComoNumero("2026-11-02"))).toBe("02/11");
  expect(etiquetaDia(diaComoNumero("2026-12-31"))).toBe("31/12");
});

test("hoy es el día de calendario local", () => {
  const ahora = new Date();
  const esperado = diaComoNumero(
    `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, "0")}-${String(ahora.getDate()).padStart(2, "0")}`,
  );
  expect(hoyComoNumero()).toBe(esperado);
});

test("la duración se escribe en singular y plural", () => {
  expect(textoDuracion(1)).toBe("1 día");
  expect(textoDuracion(5)).toBe("5 días");
});

test("cada estado permite quedarse y pasar sólo a los que acepta el servidor, y CERRADA no se elige nunca", () => {
  expect(estadosPermitidos("PENDIENTE")).toEqual(["PENDIENTE", "EN_CURSO", "FINALIZADA"]);
  expect(estadosPermitidos("EN_CURSO")).toEqual(["EN_CURSO", "PENDIENTE", "FINALIZADA"]);
  expect(estadosPermitidos("FINALIZADA")).toEqual(["FINALIZADA", "EN_CURSO"]);
  expect(estadosPermitidos("CERRADA")).toEqual(["CERRADA"]);
  for (const estado of ["PENDIENTE", "EN_CURSO", "FINALIZADA"])
    expect(estadosPermitidos(estado)).not.toContain("CERRADA");
});

describe("tareaAPayload", () => {
  const completa = {
    id: "t1",
    proyectoId: "p1",
    nombre: "Diseño",
    descripcion: "Mockups",
    fechaInicio: "2026-11-02",
    fechaFin: "2026-11-06",
    duracion: 5,
    responsableId: "c1",
    estado: "EN_CURSO",
    fechaCreacion: "2026-10-01T00:00:00.000Z",
  };

  test("manda sólo los campos que se pueden editar", () => {
    expect(tareaAPayload(completa)).toEqual({
      nombre: "Diseño",
      descripcion: "Mockups",
      fechaInicio: "2026-11-02",
      fechaFin: "2026-11-06",
      responsableId: "c1",
      estado: "EN_CURSO",
    });
  });

  test("sin responsable ni descripción manda null", () => {
    const payload = tareaAPayload({ ...completa, responsableId: "", descripcion: "" });
    expect(payload.responsableId).toBeNull();
    expect(payload.descripcion).toBeNull();
  });

  test("al crear no manda estado", () => {
    const { estado, ...sinEstado } = completa;
    expect(tareaAPayload(sinEstado)).not.toHaveProperty("estado");
  });
});

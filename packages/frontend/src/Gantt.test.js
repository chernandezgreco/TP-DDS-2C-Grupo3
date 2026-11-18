import React from "react";
import { render, screen } from "@testing-library/react";
import Gantt from "./Gantt";
import { diaComoNumero } from "./tareas";

const tarea = (cambios) => ({
  id: "t1",
  nombre: "Diseño",
  fechaInicio: "2026-11-02",
  fechaFin: "2026-11-06",
  duracion: 5,
  estado: "PENDIENTE",
  responsableId: null,
  ...cambios,
});

const dos = [
  tarea({ id: "t1", nombre: "Diseño" }),
  tarea({
    id: "t2",
    nombre: "Desarrollo",
    fechaInicio: "2026-11-09",
    fechaFin: "2026-11-13",
    duracion: 5,
    estado: "EN_CURSO",
  }),
];

test("no dibuja nada si no hay tareas", () => {
  const { container } = render(<Gantt tareas={[]} hoy={0} />);
  expect(container).toBeEmptyDOMElement();
});

test("es sólo visual: queda oculto para lectores de pantalla porque la tabla ya tiene la información", () => {
  render(<Gantt tareas={dos} hoy={0} />);
  expect(screen.getByTestId("gantt")).toHaveAttribute("aria-hidden", "true");
});

test("posiciona cada barra según su inicio y su duración dentro del rango total", () => {
  render(<Gantt tareas={dos} hoy={0} />);
  // del 2 al 13 de noviembre son 12 días
  const primera = screen.getByTestId("barra-0");
  const segunda = screen.getByTestId("barra-1");
  expect(parseFloat(primera.style.left)).toBeCloseTo(0);
  expect(parseFloat(primera.style.width)).toBeCloseTo((5 / 12) * 100);
  expect(parseFloat(segunda.style.left)).toBeCloseTo((7 / 12) * 100);
  expect(parseFloat(segunda.style.width)).toBeCloseTo((5 / 12) * 100);
});

test("una tarea de un solo día ocupa un día", () => {
  render(
    <Gantt
      tareas={[tarea({ fechaInicio: "2026-11-02", fechaFin: "2026-11-02", duracion: 1 })]}
      hoy={0}
    />,
  );
  expect(parseFloat(screen.getByTestId("barra-0").style.width)).toBeCloseTo(100);
});

test("cada estado tiene su clase, su texto y su ícono, no sólo color", () => {
  render(
    <Gantt
      tareas={[
        tarea({ id: "a", nombre: "A", estado: "PENDIENTE" }),
        tarea({ id: "b", nombre: "B", estado: "EN_CURSO" }),
        tarea({ id: "c", nombre: "C", estado: "FINALIZADA" }),
        tarea({ id: "d", nombre: "D", estado: "CERRADA" }),
      ]}
      hoy={0}
    />,
  );
  expect(screen.getByTestId("barra-0")).toHaveClass("estado-pendiente");
  expect(screen.getByTestId("barra-1")).toHaveClass("estado-en-curso");
  expect(screen.getByTestId("barra-2")).toHaveClass("estado-finalizada");
  expect(screen.getByTestId("barra-3")).toHaveClass("estado-cerrada");
  for (const texto of ["Pendiente", "En curso", "Finalizada", "Cerrada con el proyecto"])
    expect(screen.getByText(texto, { exact: false })).toBeInTheDocument();
});

test("la escala marca cada día en un rango corto", () => {
  render(<Gantt tareas={dos} hoy={0} />);
  expect(screen.getByText("02/11")).toBeInTheDocument();
  expect(screen.getByText("03/11")).toBeInTheDocument();
  expect(screen.getByText("13/11")).toBeInTheDocument();
});

test("en un rango intermedio la escala marca cada dos días para que las fechas no se pisen", () => {
  render(
    <Gantt
      tareas={[tarea({ fechaInicio: "2026-11-02", fechaFin: "2026-11-21", duracion: 20 })]}
      hoy={0}
    />,
  );
  expect(screen.getByText("02/11")).toBeInTheDocument();
  expect(screen.getByText("04/11")).toBeInTheDocument();
  expect(screen.queryByText("03/11")).not.toBeInTheDocument();
});

test("un plan de tres meses ocupa unos 6 px por día, para que entre en una pantalla de escritorio", () => {
  const { container } = render(
    <Gantt
      tareas={[tarea({ fechaInicio: "2026-10-01", fechaFin: "2026-12-31", duracion: 92 })]}
      hoy={0}
    />,
  );
  // del 1/10 al 31/12 son 92 días: 92 x 6 px
  expect(container.querySelector(".gantt-grid").style.getPropertyValue("--gantt-ancho")).toBe("552px");
});

test("en un plan de tres meses las marcas semanales quedan separadas por al menos 42 px", () => {
  const { container } = render(
    <Gantt
      tareas={[tarea({ fechaInicio: "2026-10-01", fechaFin: "2026-12-31", duracion: 92 })]}
      hoy={0}
    />,
  );
  const ancho = parseInt(container.querySelector(".gantt-grid").style.getPropertyValue("--gantt-ancho"), 10);
  // 92 días en 552 px = 6 px por día; una marca cada 7 días
  expect(ancho / 92 * 7).toBeGreaterThanOrEqual(42);
  expect(container.querySelectorAll(".gantt-tick").length).toBe(Math.ceil(92 / 7));
});

test("un plan corto no se achica por debajo del mínimo legible", () => {
  const { container } = render(<Gantt tareas={dos} hoy={0} />);
  expect(container.querySelector(".gantt-grid").style.getPropertyValue("--gantt-ancho")).toBe("480px");
});

test("la escala marca cada semana en un rango largo", () => {
  render(
    <Gantt
      tareas={[tarea({ fechaInicio: "2026-11-02", fechaFin: "2027-01-10", duracion: 70 })]}
      hoy={0}
    />,
  );
  expect(screen.getByText("02/11")).toBeInTheDocument();
  expect(screen.getByText("09/11")).toBeInTheDocument();
  expect(screen.queryByText("03/11")).not.toBeInTheDocument();
});

test("marca el día de hoy sólo si cae dentro del rango", () => {
  const { container, rerender } = render(
    <Gantt tareas={dos} hoy={diaComoNumero("2026-11-10")} />,
  );
  expect(container.querySelectorAll(".gantt-hoy")).toHaveLength(2);
  rerender(<Gantt tareas={dos} hoy={diaComoNumero("2026-12-25")} />);
  expect(container.querySelectorAll(".gantt-hoy")).toHaveLength(0);
});

test("con 100 tareas dibuja una barra por tarea", () => {
  const muchas = Array.from({ length: 100 }, (_, i) =>
    tarea({ id: `t${i}`, nombre: `Tarea ${i}`, fechaInicio: "2026-11-02", fechaFin: "2026-11-06" }),
  );
  render(<Gantt tareas={muchas} hoy={0} />);
  expect(screen.getAllByTestId(/^barra-/)).toHaveLength(100);
});

test("con tareas fuera de orden la escala arranca en la más temprana y termina en la más tardía", () => {
  render(
    <Gantt
      tareas={[
        tarea({ id: "tarde", nombre: "Tarde", fechaInicio: "2026-11-20", fechaFin: "2026-11-24", duracion: 5 }),
        tarea({ id: "temprano", nombre: "Temprano", fechaInicio: "2026-11-02", fechaFin: "2026-11-03", duracion: 2 }),
      ]}
      hoy={0}
    />,
  );
  // del 2 al 24 son 23 días
  expect(parseFloat(screen.getByTestId("barra-1").style.left)).toBeCloseTo(0);
  expect(parseFloat(screen.getByTestId("barra-0").style.left)).toBeCloseTo((18 / 23) * 100);
  expect(parseFloat(screen.getByTestId("barra-0").style.width)).toBeCloseTo((5 / 23) * 100);
});

test("un rango de tres años no se rompe: la escala marca cada 30 días y la barra de un día sigue visible", () => {
  const { container } = render(
    <Gantt
      tareas={[
        tarea({ id: "larga", fechaInicio: "2026-01-01", fechaFin: "2028-12-30", duracion: 1095 }),
        tarea({ id: "corta", nombre: "Corta", fechaInicio: "2027-06-15", fechaFin: "2027-06-15", duracion: 1 }),
      ]}
      hoy={0}
    />,
  );
  const marcas = container.querySelectorAll(".gantt-tick");
  expect(marcas.length).toBe(Math.ceil(1095 / 30));
  expect(parseFloat(screen.getByTestId("barra-1").style.width)).toBeGreaterThan(0);
  expect(screen.getByTestId("barra-1").style.width).not.toContain("NaN");
});

test("la barra describe la tarea, sus fechas y a su responsable", () => {
  render(
    <Gantt
      tareas={[tarea({ responsableId: "c1" })]}
      nombreResponsable={() => "Cami"}
      hoy={0}
    />,
  );
  expect(screen.getByTestId("barra-0")).toHaveAttribute(
    "title",
    "Diseño: 02/11 al 06/11 (5 días) · Pendiente · Cami",
  );
});

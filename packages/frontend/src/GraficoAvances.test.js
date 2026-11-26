import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import GraficoAvances, { prepararAvances } from "./GraficoAvances";

const logros = [
  { id: "b", descripcion: "Segunda etapa", porcentajeCompletitud: 60, fechaCreacion: "2026-11-25T15:00:00Z" },
  { id: "a", descripcion: "Primera etapa", porcentajeCompletitud: 25, fechaCreacion: "2026-11-20T15:00:00Z" },
];

test("ordena por fecha sin sumar porcentajes ni modificar los logros originales", () => {
  expect(prepararAvances(logros).map((l) => [l.id, l.porcentajeCompletitud])).toEqual([["a", 25], ["b", 60]]);
  expect(logros[0].id).toBe("b");
});

test("muestra el último avance y permite consultar otro logro con el teclado mediante el selector", () => {
  render(<GraficoAvances logros={logros} />);
  expect(screen.getByText("60% del proyecto")).toBeInTheDocument();
  expect(screen.getByText("Segunda etapa")).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Logro a consultar"), { target: { value: "a" } });
  expect(screen.getByText("25% del proyecto")).toBeInTheDocument();
  expect(screen.getByText("Primera etapa")).toBeInTheDocument();
});

test("no inventa una curva con un solo logro y conserva los valores extremos", () => {
  const { container, rerender } = render(<GraficoAvances logros={[{ ...logros[0], porcentajeCompletitud: 0 }]} />);
  expect(screen.getByText("0% del proyecto")).toBeInTheDocument();
  expect(container.querySelector("polyline")).toBeNull();
  rerender(<GraficoAvances logros={[{ ...logros[0], porcentajeCompletitud: 100 }]} />);
  expect(screen.getByText("100% del proyecto")).toBeInTheDocument();
});

test("informa cuando no hay datos y cuando una fecha no se puede representar", () => {
  const { rerender } = render(<GraficoAvances logros={[]} />);
  expect(screen.getByText(/Todavía no hay logros/)).toBeInTheDocument();
  rerender(<GraficoAvances logros={[{ ...logros[0], fechaCreacion: "incorrecta" }]} />);
  expect(screen.getByRole("status")).toHaveTextContent(/sin fecha o porcentaje válido/);
});

test("admite logros con la misma fecha y muestra una disminución tal como fue registrada", () => {
  const datos = [{ ...logros[0], porcentajeCompletitud: 80 }, { ...logros[1], fechaCreacion: logros[0].fechaCreacion, porcentajeCompletitud: 50 }];
  const { container } = render(<GraficoAvances logros={datos} />);
  expect(screen.getByText("50% del proyecto")).toBeInTheDocument();
  expect(container.querySelector("polyline").getAttribute("points")).not.toMatch(/NaN|Infinity/);
  expect(screen.getAllByRole("option")).toHaveLength(2);
});

test("actualiza el detalle si se edita o elimina el logro seleccionado", () => {
  const { rerender } = render(<GraficoAvances logros={logros} />);
  fireEvent.change(screen.getByLabelText("Logro a consultar"), { target: { value: "a" } });
  rerender(<GraficoAvances logros={[logros[0], { ...logros[1], porcentajeCompletitud: 35 }]} />);
  expect(screen.getByText("35% del proyecto")).toBeInTheDocument();
  rerender(<GraficoAvances logros={[logros[0]]} />);
  expect(screen.getByText("60% del proyecto")).toBeInTheDocument();
});

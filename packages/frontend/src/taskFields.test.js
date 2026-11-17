import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ResourceForm, collectiveFields, taskFields } from "./forms";
import { tareaAPayload } from "./tareas";

const responsables = [
  ["c1", "Ada"],
  ["c2", "Grace"],
];

test("el responsable es opcional y la opción vacía dice Sin responsable", () => {
  render(
    <ResourceForm fields={taskFields(responsables)} onSubmit={() => {}} onCancel={() => {}} />,
  );
  const select = screen.getByLabelText("Responsable (opcional)");
  expect(select).not.toBeRequired();
  expect([...select.options].map((o) => o.textContent)).toEqual([
    "Sin responsable",
    "Ada",
    "Grace",
  ]);
});

test("al crear no se elige estado; al editar sí, y no se puede elegir CERRADA", () => {
  const { unmount } = render(
    <ResourceForm fields={taskFields(responsables)} onSubmit={() => {}} onCancel={() => {}} />,
  );
  expect(screen.queryByLabelText("Estado")).not.toBeInTheDocument();
  unmount();
  render(
    <ResourceForm
      fields={taskFields(responsables, { conEstado: true })}
      onSubmit={() => {}}
      onCancel={() => {}}
    />,
  );
  expect([...screen.getByLabelText("Estado").options].map((o) => o.textContent)).toEqual([
    "Seleccionar…",
    "Pendiente",
    "En curso",
    "Finalizada",
  ]);
});

test.each([
  ["PENDIENTE", ["Pendiente", "En curso", "Finalizada"]],
  ["EN_CURSO", ["Pendiente", "En curso", "Finalizada"]],
  ["FINALIZADA", ["En curso", "Finalizada"]],
])("al editar una tarea %s sólo ofrece los estados a los que puede pasar", (estadoActual, esperados) => {
  render(
    <ResourceForm
      fields={taskFields(responsables, { conEstado: true, estadoActual })}
      initial={{ estado: estadoActual }}
      onSubmit={() => {}}
      onCancel={() => {}}
    />,
  );
  const opciones = [...screen.getByLabelText("Estado").options].map((o) => o.textContent);
  expect(opciones).toEqual(["Seleccionar…", ...esperados]);
  expect(opciones).not.toContain("Cerrada con el proyecto");
});

test("las fechas se limitan al rango que acepta el servidor", () => {
  render(
    <ResourceForm fields={taskFields(responsables)} onSubmit={() => {}} onCancel={() => {}} />,
  );
  for (const etiqueta of ["Fecha de inicio", "Fecha de fin"]) {
    const campo = screen.getByLabelText(etiqueta);
    expect(campo).toHaveAttribute("type", "date");
    expect(campo).toBeRequired();
    expect(campo).toHaveAttribute("min", "2020-01-01");
    expect(campo).toHaveAttribute("max", "2050-12-31");
  }
});

test("muestra las fechas guardadas de una tarea y manda un payload sin los campos que no se editan", async () => {
  const enviar = jest.fn();
  render(
    <ResourceForm
      fields={taskFields(responsables, { conEstado: true })}
      initial={{
        id: "t1",
        proyectoId: "p1",
        duracion: 5,
        nombre: "Diseño",
        descripcion: null,
        fechaInicio: "2026-11-02",
        fechaFin: "2026-11-06",
        responsableId: "c2",
        estado: "EN_CURSO",
      }}
      onSubmit={enviar}
      onCancel={() => {}}
    />,
  );
  expect(screen.getByLabelText("Fecha de inicio")).toHaveValue("2026-11-02");
  expect(screen.getByLabelText("Fecha de fin")).toHaveValue("2026-11-06");
  expect(screen.getByLabelText("Responsable (opcional)")).toHaveValue("c2");
  fireEvent.change(screen.getByLabelText("Responsable (opcional)"), { target: { value: "" } });
  fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
  await waitFor(() => expect(enviar).toHaveBeenCalled());
  expect(tareaAPayload(enviar.mock.calls[0][0])).toEqual({
    nombre: "Diseño",
    descripcion: null,
    fechaInicio: "2026-11-02",
    fechaFin: "2026-11-06",
    responsableId: null,
    estado: "EN_CURSO",
  });
});

test("los demás select siguen mostrando Seleccionar… como antes", () => {
  render(<ResourceForm fields={collectiveFields} onSubmit={() => {}} onCancel={() => {}} />);
  expect(screen.getByLabelText("Tipo").options[0].textContent).toBe("Seleccionar…");
});

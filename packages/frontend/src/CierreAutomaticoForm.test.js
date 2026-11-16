import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import {
  ResourceForm,
  projectFields,
  fechaCierreParaFormulario,
} from "./forms";

const terms = {
  version: "1.0",
  contenido: "Condiciones de participación",
};

function mostrarFormulario(initial = {}) {
  const enviar = jest.fn();

  render(
    <ResourceForm
      fields={projectFields}
      initial={{
        titulo: "Proyecto",
        descripcion: "Descripción",
        requiereIA: false,
        usosIA: [],
        ...initial,
      }}
      terms={terms}
      project
      onSubmit={enviar}
      onCancel={() => {}}
    />,
  );

  fireEvent.click(screen.getByLabelText(/Leí y acepto/));

  return enviar;
}

test("convierte la hora local seleccionada a un instante ISO", async () => {
  const enviar = mostrarFormulario();
  const valorLocal = "2099-11-19T18:30";

  fireEvent.change(screen.getByLabelText(/Cierre automático/), {
    target: { value: valorLocal },
  });
  fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

  await waitFor(() =>
    expect(enviar).toHaveBeenCalledWith(
      expect.objectContaining({
        fechaCierre: new Date(valorLocal).toISOString(),
      }),
    ),
  );
});

test("omite la fecha si no cambió para conservar su precisión original", async () => {
  const enviar = mostrarFormulario({
    fechaCierre: "2099-11-19T18:30:42.123Z",
  });

  fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

  await waitFor(() => expect(enviar).toHaveBeenCalledTimes(1));

  expect(enviar.mock.calls[0][0]).not.toHaveProperty("fechaCierre");
});

test("vaciar una fecha existente envía null para quitar la programación", async () => {
  const enviar = mostrarFormulario({
    fechaCierre: "2099-11-19T18:30:00Z",
  });

  fireEvent.change(screen.getByLabelText(/Cierre automático/), {
    target: { value: "" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

  await waitFor(() =>
    expect(enviar).toHaveBeenCalledWith(
      expect.objectContaining({ fechaCierre: null }),
    ),
  );
});

test("rechaza una fecha pasada sin enviar el formulario", async () => {
  const enviar = mostrarFormulario();

  fireEvent.change(screen.getByLabelText(/Cierre automático/), {
    target: { value: "2020-01-01T12:00" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "La fecha de cierre debe ser válida y futura.",
  );
  expect(enviar).not.toHaveBeenCalled();
});

test("muestra un instante ISO usando la hora local", () => {
  const fechaLocal = new Date(2099, 10, 19, 18, 30);

  expect(
    fechaCierreParaFormulario(fechaLocal.toISOString()),
  ).toBe("2099-11-19T18:30");
});

test("no incorpora fechaCierre a formularios de otros recursos", async () => {
  const enviar = jest.fn();

  render(
    <ResourceForm
      fields={[
        {
          name: "nombre",
          label: "Nombre",
          type: "text",
          required: true,
        },
      ]}
      initial={{ nombre: "Comunidad" }}
      onSubmit={enviar}
      onCancel={() => {}}
    />,
  );

  fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

  await waitFor(() => expect(enviar).toHaveBeenCalledTimes(1));

  expect(enviar.mock.calls[0][0]).not.toHaveProperty("fechaCierre");
});
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ResourceForm, projectFields } from "./forms";
const terms = { version: "v1", contenido: "## Condiciones\nCódigo abierto." };
test("valida la declaración de IA y envía usos y aceptación explícita", async () => {
  const submit = jest.fn();
  render(
    <ResourceForm
      fields={projectFields}
      initial={{
        titulo: "Proyecto",
        descripcion: "**Impacto**",
        requiereIA: true,
        usosIA: [],
      }}
      terms={terms}
      project
      onSubmit={submit}
      onCancel={() => {}}
    />,
  );
  fireEvent.click(screen.getByLabelText(/Leí y acepto/));
  fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Agregá al menos un uso",
  );
  expect(submit).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: /Agregar uso de IA/ }));
  fireEvent.change(screen.getByLabelText("Descripción del uso"), {
    target: { value: "Asistente de código" },
  });
  fireEvent.change(screen.getByLabelText("Justificación"), {
    target: { value: "Ayuda con documentación" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
  await waitFor(() =>
    expect(submit).toHaveBeenCalledWith(
      expect.objectContaining({
        requiereIA: true,
        usosIA: [
          {
            descripcion: "Asistente de código",
            justificacion: "Ayuda con documentación",
            grado: "BAJO",
          },
        ],
        versionTerminosAceptada: "v1",
      }),
    ),
  );
});
test("al declarar que no usa IA elimina usos anteriores", () => {
  render(
    <ResourceForm
      fields={projectFields}
      initial={{
        requiereIA: true,
        usosIA: [
          { descripcion: "Anterior", justificacion: "Ejemplo", grado: "ALTO" },
        ],
      }}
      terms={terms}
      project
      onSubmit={() => {}}
      onCancel={() => {}}
    />,
  );
  fireEvent.change(screen.getByLabelText(/¿El proyecto requiere/), {
    target: { value: "false" },
  });
  expect(screen.queryByDisplayValue("Anterior")).not.toBeInTheDocument();
});

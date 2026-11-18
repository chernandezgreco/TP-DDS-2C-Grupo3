import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ResourceForm, collectiveFields } from "./forms";

const formulario = (props = {}) => {
  const onSubmit = jest.fn();
  render(
    <ResourceForm
      fields={collectiveFields}
      onSubmit={onSubmit}
      onCancel={() => {}}
      {...props}
    />,
  );
  return onSubmit;
};

const completarColectivo = () => {
  fireEvent.change(screen.getByLabelText("Nombre"), {
    target: { value: "Asamblea" },
  });
  fireEvent.change(screen.getByLabelText("Descripción"), {
    target: { value: "Barrio" },
  });
  fireEvent.change(screen.getByLabelText("Tipo"), {
    target: { value: "ASAMBLEA" },
  });
};

const nueva = () => screen.getByLabelText("Nueva etiqueta");
const escribir = (texto) =>
  fireEvent.change(nueva(), { target: { value: texto } });
const guardar = () =>
  fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

test("el campo está agrupado y nombrado, sin quedar dentro de un label", () => {
  formulario();
  const grupo = screen.getByRole("group", { name: "Etiquetas (opcional)" });
  expect(grupo.closest("label")).toBeNull();
});

test("Enter y coma agregan la etiqueta normalizada sin enviar el formulario", () => {
  const onSubmit = formulario();
  escribir("Educación Popular");
  expect(
    screen.getByText(/Se guardará como #educacion-popular/),
  ).toBeInTheDocument();
  fireEvent.keyDown(nueva(), { key: "Enter" });
  escribir("Salud");
  fireEvent.keyDown(nueva(), { key: "," });

  expect(screen.getByText("#educacion-popular")).toBeInTheDocument();
  expect(screen.getByText("#salud")).toBeInTheDocument();
  expect(nueva()).toHaveValue("");
  expect(onSubmit).not.toHaveBeenCalled();
});

test("al pegar varias separadas por coma se agregan todas menos la que sigue escribiéndose", () => {
  formulario();
  escribir("salud, educación, cult");
  expect(screen.getByText("#salud")).toBeInTheDocument();
  expect(screen.getByText("#educacion")).toBeInTheDocument();
  expect(nueva()).toHaveValue(" cult");
});

test("Backspace con el campo vacío quita la última y el botón quita una en particular", () => {
  formulario({ initial: { etiquetas: ["salud", "web", "barrio"] } });
  fireEvent.keyDown(nueva(), { key: "Backspace" });
  expect(screen.queryByText("#barrio")).not.toBeInTheDocument();
  fireEvent.click(
    screen.getByRole("button", { name: "Quitar etiqueta salud" }),
  );
  expect(screen.queryByText("#salud")).not.toBeInTheDocument();
  expect(screen.getByText("#web")).toBeInTheDocument();
});

test("una etiqueta inválida se avisa y no se agrega", () => {
  formulario();
  escribir("c++");
  fireEvent.keyDown(nueva(), { key: "Enter" });
  expect(screen.getByRole("alert")).toHaveTextContent(/entre 2 y 30/);
  expect(screen.queryByText("#c")).not.toBeInTheDocument();
});

test("sin tocar las etiquetas no se envían", async () => {
  const onSubmit = formulario();
  completarColectivo();
  guardar();
  await waitFor(() => expect(onSubmit).toHaveBeenCalled());
  expect(onSubmit.mock.calls[0][0]).not.toHaveProperty("etiquetas");
});

test("al guardar se suma lo que quedó escrito sin confirmar", async () => {
  const onSubmit = formulario({ initial: { etiquetas: ["salud"] } });
  completarColectivo();
  escribir("Cultura");
  guardar();
  await waitFor(() =>
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ etiquetas: ["salud", "cultura"] }),
    ),
  );
});

test("lo escrito sin confirmar que no es válido frena el envío", () => {
  const onSubmit = formulario();
  completarColectivo();
  escribir("x");
  guardar();
  expect(screen.getByRole("alert")).toHaveTextContent(/entre 2 y 30/);
  expect(onSubmit).not.toHaveBeenCalled();
});

test("sugiere las etiquetas en uso que todavía no se cargaron", () => {
  formulario({
    initial: { etiquetas: ["salud"] },
    sugerenciasEtiquetas: ["salud", "web"],
  });
  const opciones = Array.from(
    document.getElementById(nueva().getAttribute("list")).options,
  ).map((o) => o.value);
  expect(opciones).toEqual(["web"]);
});

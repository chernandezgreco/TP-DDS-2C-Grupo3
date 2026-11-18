import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PortabilidadDatos, {
  nombreArchivoExportacion,
  mensajeDeError,
} from "./PortabilidadDatos";
import { api } from "./api";

jest.mock("./api", () => ({
  api: { get: jest.fn() },
}));

let clicks;

beforeEach(() => {
  jest.clearAllMocks();
  clicks = [];
  URL.createObjectURL = jest.fn(() => "blob:exportacion");
  URL.revokeObjectURL = jest.fn();
  jest
    .spyOn(HTMLAnchorElement.prototype, "click")
    .mockImplementation(function () {
      clicks.push({ href: this.href, download: this.download });
    });
});

afterEach(() => {
  jest.restoreAllMocks();
});

test("descarga los datos en JSON por defecto con el nombre de archivo esperado", async () => {
  const blob = new Blob(["{}"], { type: "application/json" });
  api.get.mockResolvedValue(blob);
  render(<PortabilidadDatos actorType="colaboradoras" />);

  fireEvent.click(screen.getByRole("button", { name: "Descargar mis datos" }));

  expect(await screen.findByText(/Descarga lista/)).toBeInTheDocument();
  expect(api.get).toHaveBeenCalledWith("/mi/exportacion", {
    params: { formato: "json" },
    responseType: "blob",
  });
  expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
  expect(clicks).toHaveLength(1);
  expect(clicks[0].download).toMatch(
    /^codigo-a-voluntad-datos-colaboradora-\d{4}-\d{2}-\d{2}\.json$/,
  );
  // se revoca después, para no cancelar la descarga en curso
  expect(URL.revokeObjectURL).not.toHaveBeenCalled();
  await waitFor(
    () => expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:exportacion"),
    { timeout: 2000 },
  );
});

test("pide el CSV cuando se elige ese formato", async () => {
  api.get.mockResolvedValue(new Blob(["a,b"]));
  render(<PortabilidadDatos actorType="colectivos" />);

  fireEvent.change(screen.getByLabelText("Formato"), { target: { value: "csv" } });
  fireEvent.click(screen.getByRole("button", { name: "Descargar mis datos" }));

  await waitFor(() => expect(clicks).toHaveLength(1));
  expect(api.get).toHaveBeenCalledWith("/mi/exportacion", {
    params: { formato: "csv" },
    responseType: "blob",
  });
  expect(clicks[0].download).toMatch(/datos-colectivo-.*\.csv$/);
});

test("muestra un estado de carga y deshabilita el botón mientras genera el archivo", async () => {
  let resolver;
  api.get.mockReturnValue(new Promise((r) => (resolver = r)));
  render(<PortabilidadDatos actorType="colaboradoras" />);

  fireEvent.click(screen.getByRole("button", { name: "Descargar mis datos" }));

  const boton = screen.getByRole("button", { name: "Preparando archivo…" });
  expect(boton).toBeDisabled();
  expect(screen.getByText("Generando tu archivo…")).toBeInTheDocument();

  resolver(new Blob(["{}"]));
  expect(await screen.findByRole("button", { name: "Descargar mis datos" })).toBeEnabled();
});

test("explica el límite de descargas cuando la API responde 429", async () => {
  api.get.mockRejectedValue(Object.assign(new Error("x"), { status: 429 }));
  render(<PortabilidadDatos actorType="colaboradoras" />);

  fireEvent.click(screen.getByRole("button", { name: "Descargar mis datos" }));

  expect(await screen.findByRole("alert")).toHaveTextContent(/límite de descargas/);
  expect(clicks).toHaveLength(0);
});

test("la región de estado existe antes de que haya mensajes y no hay alertas", () => {
  render(<PortabilidadDatos actorType="colaboradoras" />);
  expect(screen.getByRole("status")).toHaveTextContent("");
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

test("al elegir CSV avisa cómo se protegen las fórmulas", () => {
  render(<PortabilidadDatos actorType="colaboradoras" />);
  expect(screen.queryByText(/apóstrofo/)).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Formato"), { target: { value: "csv" } });
  expect(screen.getByText(/apóstrofo/)).toBeInTheDocument();
});

test("el colectivo ve que los contactos de las colaboradoras no se exportan", () => {
  render(<PortabilidadDatos actorType="colectivos" />);
  expect(screen.getByText(/sus contactos no se exportan/)).toBeInTheDocument();
});

test("nombreArchivoExportacion y mensajeDeError", () => {
  const fecha = new Date("2026-11-17T12:00:00.000Z");
  expect(nombreArchivoExportacion("colectivos", "csv", fecha)).toBe(
    "codigo-a-voluntad-datos-colectivo-2026-11-17.csv",
  );
  expect(mensajeDeError({ status: 500 })).toMatch(/No se pudo generar/);
  expect(mensajeDeError({ status: 401 })).toMatch(/sesión venció/);
});

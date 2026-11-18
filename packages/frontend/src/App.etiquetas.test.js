import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import App from "./App";
import { api } from "./api";

jest.mock("./api", () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
  idOf: (x) => x?.id || x?._id,
}));

const proyecto = (id, titulo, etiquetas) => ({
  id,
  titulo,
  descripcion: "Software comunitario",
  colectivoId: "o1",
  estado: "ACTIVO",
  estaBuscando: true,
  perfiles: [],
  etiquetas,
});
const biblioteca = proyecto("p1", "Biblioteca comunitaria", [
  "educacion",
  "software-libre",
]);
const comedor = proyecto("p2", "Stock del comedor", ["alimentacion"]);
const colectivos = [
  {
    id: "o1",
    nombre: "Biblioteca Sur",
    tipo: "ONG",
    descripcion: "Libros",
    etiquetas: ["cultura"],
  },
  {
    id: "o2",
    nombre: "Comedor Norte",
    tipo: "ONG",
    descripcion: "Comida",
    etiquetas: ["alimentacion"],
  },
];

// respuestas del backend para cada filtro por etiquetas
const filtrados = {
  "/proyectos?etiquetas=educacion": [biblioteca],
  "/proyectos?etiquetas=educacion%2Csoftware-libre": [biblioteca],
  "/colectivos?etiquetas=cultura": [colectivos[0]],
};

beforeEach(() => {
  window.location.hash = "";
  jest.clearAllMocks();
  api.get.mockImplementation(async (path) => {
    if (path in filtrados) return filtrados[path];
    return (
      {
        "/auth/sesion": { actor: null },
        "/proyectos": [biblioteca, comedor],
        "/colectivos": colectivos,
        "/colaboradoras": [],
        "/habilidades": [],
        "/colaboraciones": [],
      }[path] || []
    );
  });
});

test("las tarjetas muestran las etiquetas y al elegir una se filtra con el backend", async () => {
  render(<App />);
  await screen.findByText("Stock del comedor");

  fireEvent.click(
    screen.getByRole("button", { name: "Filtrar por etiqueta educacion" }),
  );

  await waitFor(() =>
    expect(api.get).toHaveBeenCalledWith("/proyectos?etiquetas=educacion"),
  );
  await waitFor(() =>
    expect(screen.queryByText("Stock del comedor")).not.toBeInTheDocument(),
  );
  expect(screen.getByText("Biblioteca comunitaria")).toBeInTheDocument();
  expect(
    within(
      screen.getByRole("group", { name: "Filtro por etiquetas" }),
    ).getByText("#educacion"),
  ).toBeInTheDocument();
});

test("se pueden sumar etiquetas al filtro y quitarlas", async () => {
  render(<App />);
  await screen.findByText("Stock del comedor");

  fireEvent.click(
    screen.getByRole("button", { name: "Filtrar por etiqueta educacion" }),
  );
  fireEvent.click(
    await screen.findByRole("button", {
      name: "Filtrar por etiqueta software-libre",
    }),
  );
  await waitFor(() =>
    expect(api.get).toHaveBeenCalledWith(
      "/proyectos?etiquetas=educacion%2Csoftware-libre",
    ),
  );

  fireEvent.click(screen.getByRole("button", { name: "Limpiar etiquetas" }));

  expect(await screen.findByText("Stock del comedor")).toBeInTheDocument();
  expect(
    screen.queryByRole("group", { name: "Filtro por etiquetas" }),
  ).not.toBeInTheDocument();
});

test("quitar la única etiqueta del filtro vuelve a mostrar todo", async () => {
  render(<App />);
  await screen.findByText("Stock del comedor");
  fireEvent.click(
    screen.getByRole("button", { name: "Filtrar por etiqueta alimentacion" }),
  );
  fireEvent.click(
    await screen.findByRole("button", {
      name: "Quitar etiqueta alimentacion del filtro",
    }),
  );
  expect(await screen.findByText("Biblioteca comunitaria")).toBeInTheDocument();
  expect(screen.getByText("Stock del comedor")).toBeInTheDocument();
});

test("el buscador de texto también encuentra por etiqueta, sin importar los acentos", async () => {
  render(<App />);
  await screen.findByText("Stock del comedor");
  const buscador = screen.getByRole("textbox", {
    name: "Buscar por nombre o habilidad",
  });

  fireEvent.change(buscador, { target: { value: "Alimentación" } });
  expect(screen.getByText("Stock del comedor")).toBeInTheDocument();
  expect(screen.queryByText("Biblioteca comunitaria")).not.toBeInTheDocument();

  fireEvent.change(buscador, { target: { value: "software libre" } });
  expect(screen.getByText("Biblioteca comunitaria")).toBeInTheDocument();
  expect(screen.queryByText("Stock del comedor")).not.toBeInTheDocument();
});

test("en la página de colectivos se filtra por sus propias etiquetas", async () => {
  window.location.hash = "#colectivos";
  render(<App />);
  await screen.findByText("Comedor Norte");

  fireEvent.click(
    screen.getByRole("button", { name: "Filtrar por etiqueta cultura" }),
  );

  await waitFor(() =>
    expect(api.get).toHaveBeenCalledWith("/colectivos?etiquetas=cultura"),
  );
  await waitFor(() =>
    expect(screen.queryByText("Comedor Norte")).not.toBeInTheDocument(),
  );
  expect(screen.getByText("Biblioteca Sur")).toBeInTheDocument();
});

test("el perfil de un colectivo muestra sus etiquetas y permite filtrar por ellas", async () => {
  window.location.hash = "#colectivos";
  render(<App />);
  await screen.findByText("Comedor Norte");
  fireEvent.click(screen.getAllByRole("button", { name: /Ver perfil/ })[0]);

  fireEvent.click(
    await screen.findByRole("button", { name: "Filtrar por etiqueta cultura" }),
  );

  await waitFor(() =>
    expect(api.get).toHaveBeenCalledWith("/colectivos?etiquetas=cultura"),
  );
  expect(
    await screen.findByRole("group", { name: "Filtro por etiquetas" }),
  ).toBeInTheDocument();
});

test("el detalle de un proyecto muestra sus etiquetas y elegir una vuelve al listado filtrado", async () => {
  render(<App />);
  await screen.findByText("Stock del comedor");
  fireEvent.click(screen.getAllByRole("button", { name: /Ver proyecto/ })[0]);
  await screen.findByText("← Volver al listado");

  fireEvent.click(
    screen.getByRole("button", { name: "Filtrar por etiqueta educacion" }),
  );

  await waitFor(() =>
    expect(screen.queryByText("← Volver al listado")).not.toBeInTheDocument(),
  );
  await waitFor(() =>
    expect(screen.queryByText("Stock del comedor")).not.toBeInTheDocument(),
  );
});

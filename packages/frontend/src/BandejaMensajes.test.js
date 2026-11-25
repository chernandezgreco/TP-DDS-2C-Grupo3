import React from "react";
import { render, screen, waitFor, within, fireEvent } from "@testing-library/react";
import BandejaMensajes from "./BandejaMensajes";
import { api } from "./api";

jest.mock("./api", () => ({
  api: { get: jest.fn(), post: jest.fn() },
  idOf: (x) => x?.id || x?._id,
}));

const colectivos = [
  { id: "o1", nombre: "Biblioteca Sur" },
  { id: "o2", nombre: "Huerta Norte" },
];
const proyectos = [{ id: "p1", titulo: "Web de donaciones" }];
const hace = (minutos) => new Date(Date.now() - minutos * 60000).toISOString();

// como los devuelve el back: del más nuevo al más viejo
const mensajes = [
  { id: "m1", colectivoId: "o1", proyectoId: "p1", texto: "¿Te sumás?", fecha: hace(1) },
  { id: "m2", colectivoId: "o2", proyectoId: "p9", texto: "Hola desde la huerta", fecha: hace(30) },
  { id: "m3", colectivoId: "o1", proyectoId: "p1", texto: "Primer mensaje", fecha: hace(300) },
];

const mostrar = ({ noLeidos = 0, cantidadNoLeidos = 0, lista = mensajes } = {}) => {
  api.get.mockImplementation(async (path) =>
    path === "/mi/mensajes/no-leidos" ? { cantidad: noLeidos } : lista,
  );
  api.post.mockResolvedValue({});
  const onLeidos = jest.fn();
  render(
    <BandejaMensajes
      actorId="c1"
      cantidadNoLeidos={cantidadNoLeidos}
      onLeidos={onLeidos}
      colectivos={colectivos}
      proyectos={proyectos}
    />,
  );
  return { onLeidos };
};

beforeEach(() => jest.clearAllMocks());

test("agrupa los mensajes por colectivo: cada remitente aparece una sola vez", async () => {
  mostrar();

  const grupos = await screen.findAllByRole("heading", { level: 3 });
  expect(grupos.map((h) => h.textContent)).toEqual(["Biblioteca Sur", "Huerta Norte"]);

  const biblioteca = grupos[0].closest("li");
  expect(within(biblioteca).getByText("2 mensajes")).toBeInTheDocument();
  expect(within(biblioteca).getByText("¿Te sumás?")).toBeInTheDocument();
  expect(within(biblioteca).getByText("Primer mensaje")).toBeInTheDocument();
  // cada mensaje conserva su "hace cuánto" y el proyecto cuando se conoce
  expect(within(biblioteca).getAllByText(/^hace /)).toHaveLength(2);
  expect(within(biblioteca).getAllByText("Sobre Web de donaciones")).toHaveLength(2);
});

test("resalta los no leídos y los marca vistos hasta el mensaje más nuevo mostrado", async () => {
  const { onLeidos } = mostrar({ noLeidos: 2 });

  await waitFor(() =>
    expect(api.post).toHaveBeenCalledWith("/mi/mensajes/vistos", { hasta: mensajes[0].fecha }),
  );
  expect(onLeidos).toHaveBeenCalled();
  // los dos más nuevos son los no leídos
  expect(screen.getAllByText("Nuevo")).toHaveLength(2);
  expect(screen.getByText("¿Te sumás?").closest("li")).toHaveClass("es-nuevo");
  expect(screen.getByText("Hola desde la huerta").closest("li")).toHaveClass("es-nuevo");
  expect(screen.getByText("Primer mensaje").closest("li")).not.toHaveClass("es-nuevo");
  expect(screen.getByText("2 mensajes · 1 nuevo")).toBeInTheDocument();
});

test("sin mensajes nuevos no vuelve a marcar", async () => {
  const { onLeidos } = mostrar({ noLeidos: 0 });

  await screen.findByText("¿Te sumás?");
  await waitFor(() => expect(onLeidos).toHaveBeenCalled());
  expect(api.post).not.toHaveBeenCalled();
  expect(screen.queryByText("Nuevo")).not.toBeInTheDocument();
});

test("avisa cuando no hay mensajes", async () => {
  mostrar({ lista: [] });

  expect(await screen.findByText("No tenés mensajes.")).toBeInTheDocument();
});

test("mientras actualiza el botón no se deshabilita: el ícono gira y otro clic no repite el pedido", async () => {
  mostrar();
  await screen.findByText("¿Te sumás?");

  // los pedidos quedan pendientes hasta llamar a terminar()
  const pendientes = [];
  const terminar = () => pendientes.forEach((resolver) => resolver());
  api.get.mockClear();
  api.get.mockImplementation(
    (path) =>
      new Promise((resolve) => {
        pendientes.push(() => resolve(path === "/mi/mensajes/no-leidos" ? { cantidad: 0 } : mensajes));
      }),
  );
  const boton = screen.getByRole("button", { name: "Actualizar" });
  fireEvent.click(boton);

  expect(boton).not.toBeDisabled();
  expect(boton).toHaveAttribute("aria-busy", "true");
  expect(boton.querySelector(".icono")).toHaveClass("girando");

  fireEvent.click(boton);
  expect(api.get).toHaveBeenCalledTimes(2); // la lista y el número, una sola vez

  terminar();
  await waitFor(() => expect(boton).toHaveAttribute("aria-busy", "false"));
  expect(boton.querySelector(".icono")).not.toHaveClass("girando");
});

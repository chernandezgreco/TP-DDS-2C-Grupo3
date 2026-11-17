import React from "react";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import App from "./App";
import { api } from "./api";

jest.mock("./api", () => ({
  api: { get: jest.fn(), post: jest.fn(), put: jest.fn(), patch: jest.fn(), delete: jest.fn() },
  idOf: (x) => x?.id || x?._id,
}));

const proyecto = (estado = "ACTIVO") => ({
  id: "p1",
  titulo: "Biblioteca comunitaria",
  descripcion: "Una biblioteca abierta",
  colectivoId: "o1",
  estado,
  estaBuscando: true,
  perfiles: [],
});
const tarea = {
  id: "t1",
  proyectoId: "p1",
  nombre: "Diseño de pantallas",
  descripcion: null,
  fechaInicio: "2026-11-02",
  fechaFin: "2026-11-06",
  duracion: 5,
  responsableId: "c1",
  estado: "PENDIENTE",
  fechaCreacion: "2026-10-01T00:00:00.000Z",
};

let sesion;
let estadoProyecto;
beforeEach(() => {
  sesion = null;
  estadoProyecto = "ACTIVO";
  window.location.hash = "";
  jest.clearAllMocks();
  api.get.mockImplementation(async (path) => {
    const respuestas = {
      "/auth/sesion": { actor: sesion },
      "/mi/postulaciones": [],
      "/terminos/actual": { version: "1.0", contenido: "Código abierto" },
      "/proyectos": [proyecto(estadoProyecto)],
      "/proyectos/p1": proyecto(estadoProyecto),
      "/proyectos/p1/tareas": [tarea],
      "/colectivos": [{ id: "o1", nombre: "Biblioteca Sur" }],
      "/colaboradoras": [
        { id: "c1", nombreFantasia: "Cami", habilidades: ["react"] },
        { id: "c2", nombreFantasia: "Ada", habilidades: ["react"] },
      ],
      "/habilidades": [{ codigo: "react", titulo: "React" }],
      "/colaboraciones": [
        { id: "k1", proyectoId: "p1", perfilId: "f1", colaboradoraId: "c1" },
        { id: "k2", proyectoId: "p1", perfilId: "f1", colaboradoraId: "c2" },
        { id: "k3", proyectoId: "otro", perfilId: "f9", colaboradoraId: "c3" },
      ],
    };
    return respuestas[path] ?? [];
  });
  api.post.mockResolvedValue({});
  api.put.mockResolvedValue({});
});

const abrirProyecto = async () => {
  await screen.findByText("Biblioteca comunitaria");
  fireEvent.click(screen.getByRole("button", { name: /Ver proyecto/ }));
  return await screen.findByRole("heading", { name: "Planificación y tareas" });
};

test("un visitante ve la planificación sin controles de edición", async () => {
  render(<App />);
  await abrirProyecto();
  const tabla = await screen.findByRole("table", { name: "Detalle de las tareas del proyecto" });
  expect(within(tabla).getByText("Cami")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /Agregar tarea/ })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /Editar la tarea/ })).not.toBeInTheDocument();
});

test("el colectivo dueño crea una tarea eligiendo a una colaboradora del proyecto", async () => {
  sesion = { type: "colectivos", id: "o1", email: "org@example.com" };
  render(<App />);
  await abrirProyecto();
  fireEvent.click(screen.getByRole("button", { name: "+ Agregar tarea" }));
  const dialogo = await screen.findByRole("dialog", { name: "Agregar tarea" });
  const responsable = within(dialogo).getByLabelText("Responsable (opcional)");
  expect([...responsable.options].map((o) => o.textContent)).toEqual(["Sin responsable", "Ada", "Cami"]);
  fireEvent.change(within(dialogo).getByLabelText("Nombre de la tarea"), { target: { value: "Armar la API" } });
  fireEvent.change(within(dialogo).getByLabelText("Fecha de inicio"), { target: { value: "2026-11-09" } });
  fireEvent.change(within(dialogo).getByLabelText("Fecha de fin"), { target: { value: "2026-11-20" } });
  fireEvent.change(responsable, { target: { value: "c2" } });
  fireEvent.click(within(dialogo).getByRole("button", { name: "Guardar" }));
  await waitFor(() =>
    expect(api.post).toHaveBeenCalledWith("/proyectos/p1/tareas", {
      nombre: "Armar la API",
      descripcion: null,
      fechaInicio: "2026-11-09",
      fechaFin: "2026-11-20",
      responsableId: "c2",
    }),
  );
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
});

test("crear sin responsable manda null", async () => {
  sesion = { type: "colectivos", id: "o1", email: "org@example.com" };
  render(<App />);
  await abrirProyecto();
  fireEvent.click(screen.getByRole("button", { name: "+ Agregar tarea" }));
  const dialogo = await screen.findByRole("dialog", { name: "Agregar tarea" });
  fireEvent.change(within(dialogo).getByLabelText("Nombre de la tarea"), { target: { value: "Sin dueña" } });
  fireEvent.change(within(dialogo).getByLabelText("Fecha de inicio"), { target: { value: "2026-11-09" } });
  fireEvent.change(within(dialogo).getByLabelText("Fecha de fin"), { target: { value: "2026-11-09" } });
  fireEvent.click(within(dialogo).getByRole("button", { name: "Guardar" }));
  await waitFor(() =>
    expect(api.post).toHaveBeenCalledWith(
      "/proyectos/p1/tareas",
      expect.objectContaining({ nombre: "Sin dueña", responsableId: null }),
    ),
  );
});

test("el dueño edita una tarea y sólo se envían los campos editables", async () => {
  sesion = { type: "colectivos", id: "o1", email: "org@example.com" };
  render(<App />);
  await abrirProyecto();
  fireEvent.click(await screen.findByRole("button", { name: "Editar la tarea Diseño de pantallas" }));
  const dialogo = await screen.findByRole("dialog", { name: "Editar tarea" });
  expect(within(dialogo).getByLabelText("Fecha de inicio")).toHaveValue("2026-11-02");
  expect(within(dialogo).getByLabelText("Responsable (opcional)")).toHaveValue("c1");
  fireEvent.change(within(dialogo).getByLabelText("Estado"), { target: { value: "EN_CURSO" } });
  fireEvent.change(within(dialogo).getByLabelText("Fecha de fin"), { target: { value: "2026-11-12" } });
  fireEvent.click(within(dialogo).getByRole("button", { name: "Guardar" }));
  await waitFor(() =>
    expect(api.put).toHaveBeenCalledWith("/proyectos/p1/tareas/t1", {
      nombre: "Diseño de pantallas",
      descripcion: null,
      fechaInicio: "2026-11-02",
      fechaFin: "2026-11-12",
      responsableId: "c1",
      estado: "EN_CURSO",
    }),
  );
});

test("al guardar, la lista de tareas se vuelve a pedir", async () => {
  sesion = { type: "colectivos", id: "o1", email: "org@example.com" };
  render(<App />);
  await abrirProyecto();
  await screen.findByRole("table");
  const antes = api.get.mock.calls.filter(([ruta]) => ruta === "/proyectos/p1/tareas").length;
  fireEvent.click(screen.getByRole("button", { name: "Editar la tarea Diseño de pantallas" }));
  const dialogo = await screen.findByRole("dialog", { name: "Editar tarea" });
  fireEvent.change(within(dialogo).getByLabelText("Estado"), { target: { value: "FINALIZADA" } });
  fireEvent.click(within(dialogo).getByRole("button", { name: "Guardar" }));
  await waitFor(() =>
    expect(api.get.mock.calls.filter(([ruta]) => ruta === "/proyectos/p1/tareas").length).toBeGreaterThan(antes),
  );
});

test("con el proyecto finalizado no se abre ningún formulario", async () => {
  sesion = { type: "colectivos", id: "o1", email: "org@example.com" };
  estadoProyecto = "FINALIZADO";
  render(<App />);
  await abrirProyecto();
  await screen.findByRole("table");
  for (const nombre of ["+ Agregar tarea", "Editar la tarea Diseño de pantallas"]) {
    const boton = screen.getByRole("button", { name: nombre });
    expect(boton).toHaveAttribute("aria-disabled", "true");
    fireEvent.click(boton);
  }
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(api.post).not.toHaveBeenCalled();
  expect(api.put).not.toHaveBeenCalled();
});

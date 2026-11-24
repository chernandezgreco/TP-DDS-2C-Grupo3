import React from "react";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import TareasProyecto from "./TareasProyecto";
import { api } from "./api";
import { MENSAJE_PROYECTO_FINALIZADO, tareaAPayload } from "./tareas";

jest.mock("./api", () => ({
  api: { get: jest.fn(), post: jest.fn(), put: jest.fn(), patch: jest.fn(), delete: jest.fn() },
  idOf: (x) => x?.id || x?._id,
}));

const colaboradoras = [
  { id: "c1", nombreFantasia: "Ada" },
  { id: "c2", nombreFantasia: "Grace" },
  { id: "c3", nombreFantasia: "Linus" },
];
const colaboraciones = [
  { id: "k1", proyectoId: "p1", colaboradoraId: "c2" },
  { id: "k2", proyectoId: "p1", colaboradoraId: "c1" },
  { id: "k3", proyectoId: "p1", colaboradoraId: "c1" },
  { id: "k4", proyectoId: "p1", colaboradoraId: "Anonimo" },
];
const tarea = (cambios) => ({
  id: "t1",
  proyectoId: "p1",
  nombre: "Diseño de pantallas",
  descripcion: null,
  fechaInicio: "2026-11-02",
  fechaFin: "2026-11-06",
  duracion: 5,
  responsableId: null,
  estado: "PENDIENTE",
  fechaCreacion: "2026-10-01T00:00:00.000Z",
  ...cambios,
});

const mostrar = (props = {}) => {
  const edit = jest.fn();
  const run = jest.fn(async (fn) => {
    await fn();
    return true;
  });
  const proyecto = props.proyecto || { id: "p1", estado: "ACTIVO" };
  const utilidades = render(
    <TareasProyecto
      pid="p1"
      proyecto={proyecto}
      isOwner={false}
      colaboradoras={colaboradoras}
      colaboraciones={colaboraciones}
      edit={edit}
      run={run}
      busy={false}
      {...props}
    />,
  );
  return { edit, run, ...utilidades };
};

beforeEach(() => {
  jest.clearAllMocks();
  api.get.mockResolvedValue([]);
});

test("muestra el Gantt y la tabla con responsable, fechas, duración y estado", async () => {
  api.get.mockResolvedValue([
    tarea({ responsableId: "c1", estado: "EN_CURSO", descripcion: "Mockups" }),
  ]);
  mostrar();
  const tabla = await screen.findByRole("table", {
    name: "Detalle de las tareas del proyecto",
  });
  const fila = within(tabla).getByRole("row", { name: /Diseño de pantallas/ });
  expect(within(fila).getByText("Ada")).toBeInTheDocument();
  expect(within(fila).getByText("02/11/2026")).toBeInTheDocument();
  expect(within(fila).getByText("06/11/2026")).toBeInTheDocument();
  expect(within(fila).getByText("5 días")).toBeInTheDocument();
  expect(within(fila).getByText("En curso", { exact: false })).toBeInTheDocument();
  expect(within(fila).getByText("Mockups")).toBeInTheDocument();
  expect(screen.getByTestId("gantt")).toBeInTheDocument();
  expect(api.get).toHaveBeenCalledWith("/proyectos/p1/tareas");
});

test("cada dato de la tabla trae su rótulo y la tabla conserva su semántica para apilarse en celular", async () => {
  api.get.mockResolvedValue([tarea({ responsableId: "c1" })]);
  mostrar({ isOwner: true });
  const tabla = await screen.findByRole("table", { name: "Detalle de las tareas del proyecto" });
  const fila = within(tabla).getByRole("row", { name: /Diseño de pantallas/ });
  const celdas = within(fila).getAllByRole("cell");
  expect(celdas.map((c) => c.getAttribute("data-label"))).toEqual([
    "Responsable",
    "Inicio",
    "Fin",
    "Duración",
    "Estado",
    null,
  ]);
  expect(within(tabla).getAllByRole("columnheader").map((c) => c.textContent)).toEqual([
    "Tarea",
    "Responsable",
    "Inicio",
    "Fin",
    "Duración",
    "Estado",
    "Acciones",
  ]);
  expect(within(fila).getByRole("rowheader")).toHaveTextContent("Diseño de pantallas");
});

test("sin tareas lo dice y no dibuja el Gantt", async () => {
  mostrar();
  expect(await screen.findByText(/Todavía no hay tareas planificadas/)).toBeInTheDocument();
  expect(screen.queryByTestId("gantt")).not.toBeInTheDocument();
});

test("mientras carga avisa, y si falla permite reintentar", async () => {
  api.get.mockRejectedValueOnce(new Error("Servidor no disponible"));
  mostrar();
  expect(await screen.findByRole("alert")).toHaveTextContent("Servidor no disponible");
  api.get.mockResolvedValueOnce([tarea()]);
  fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
  expect(await screen.findByRole("table")).toBeInTheDocument();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

describe("quien no es el colectivo dueño", () => {
  test("ve las tareas pero no tiene ningún control de edición", async () => {
    api.get.mockResolvedValue([tarea()]);
    mostrar({ isOwner: false });
    await screen.findByRole("table");
    expect(screen.queryByRole("button", { name: /Agregar tarea/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Editar/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Eliminar/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Acciones" })).not.toBeInTheDocument();
  });
});

describe("responsables", () => {
  test("sin responsable, anónima o que ya no participa se muestran distinto", async () => {
    api.get.mockResolvedValue([
      tarea({ id: "a", nombre: "Sin nadie", responsableId: null }),
      tarea({ id: "b", nombre: "De alguien anónimo", responsableId: "Anonimo" }),
      tarea({ id: "c", nombre: "De alguien que se fue", responsableId: "desconocida" }),
    ]);
    mostrar();
    const tabla = await screen.findByRole("table");
    const celda = (nombre) =>
      within(within(tabla).getByRole("row", { name: new RegExp(nombre) })).getAllByRole("cell")[0];
    expect(celda("Sin nadie")).toHaveTextContent("Sin responsable");
    expect(celda("De alguien anónimo")).toHaveTextContent("Contribución anónima");
    expect(celda("De alguien que se fue")).toHaveTextContent("Colaboradora que ya no participa");
  });

  test("al agregar, sólo se ofrece a quienes colaboran en el proyecto, sin repetir ni anónimas", async () => {
    const { edit } = mostrar({ isOwner: true });
    await screen.findByText(/Todavía no hay tareas/);
    fireEvent.click(screen.getByRole("button", { name: "Agregar tarea" }));
    expect(edit).toHaveBeenCalledTimes(1);
    const [nombre, campos, ruta, metodo, valores, extra] = edit.mock.calls[0];
    expect(nombre).toBe("Agregar tarea");
    expect(ruta).toBe("/proyectos/p1/tareas");
    expect(metodo).toBe("post");
    expect(valores).toEqual({});
    expect(extra.transform).toBe(tareaAPayload);
    const responsable = campos.find((c) => c.name === "responsableId");
    expect(responsable.options).toEqual([
      ["c1", "Ada"],
      ["c2", "Grace"],
    ]);
    expect(campos.some((c) => c.name === "estado")).toBe(false);
  });

  test("al editar se puede cambiar el estado y se conserva a quien ya no participa", async () => {
    api.get.mockResolvedValue([tarea({ responsableId: "c3", estado: "EN_CURSO" })]);
    const { edit } = mostrar({ isOwner: true });
    fireEvent.click(await screen.findByRole("button", { name: "Editar la tarea Diseño de pantallas" }));
    const [nombre, campos, ruta, metodo, valores, extra] = edit.mock.calls[0];
    expect(nombre).toBe("Editar tarea");
    expect(ruta).toBe("/proyectos/p1/tareas/t1");
    expect(metodo).toBe("put");
    expect(valores.id).toBe("t1");
    expect(extra.transform).toBe(tareaAPayload);
    expect(campos.some((c) => c.name === "estado")).toBe(true);
    // desde EN_CURSO se puede quedar, volver a pendiente o finalizar; nunca elegir CERRADA
    expect(campos.find((c) => c.name === "estado").options.map(([valor]) => valor)).toEqual([
      "PENDIENTE",
      "EN_CURSO",
      "FINALIZADA",
    ]);
    expect(campos.find((c) => c.name === "responsableId").options).toContainEqual([
      "c3",
      "Linus (ya no participa)",
    ]);
  });
});

describe("eliminar", () => {
  test("pide confirmación, borra y vuelve a pedir la lista", async () => {
    api.get.mockResolvedValueOnce([tarea()]).mockResolvedValueOnce([]);
    api.delete.mockResolvedValue({});
    jest.spyOn(window, "confirm").mockReturnValue(true);
    const { run } = mostrar({ isOwner: true });
    fireEvent.click(await screen.findByRole("button", { name: "Eliminar la tarea Diseño de pantallas" }));
    await waitFor(() => expect(api.delete).toHaveBeenCalledWith("/proyectos/p1/tareas/t1"));
    expect(run).toHaveBeenCalledWith(expect.any(Function), "Tarea eliminada.");
    expect(await screen.findByText(/Todavía no hay tareas planificadas/)).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledTimes(2);
  });

  test("si no se confirma no se borra nada", async () => {
    api.get.mockResolvedValue([tarea()]);
    jest.spyOn(window, "confirm").mockReturnValue(false);
    const { run } = mostrar({ isOwner: true });
    fireEvent.click(await screen.findByRole("button", { name: "Eliminar la tarea Diseño de pantallas" }));
    expect(api.delete).not.toHaveBeenCalled();
    expect(run).not.toHaveBeenCalled();
  });
});

describe("proyecto finalizado", () => {
  const finalizado = { id: "p1", estado: "FINALIZADO" };

  test("los controles quedan deshabilitados con el motivo y no abren nada", async () => {
    api.get.mockResolvedValue([tarea({ estado: "CERRADA" })]);
    jest.spyOn(window, "confirm").mockReturnValue(true);
    const { edit, run } = mostrar({ isOwner: true, proyecto: finalizado });
    await screen.findByRole("table");
    const controles = [
      screen.getByRole("button", { name: "Agregar tarea" }),
      screen.getByRole("button", { name: "Editar la tarea Diseño de pantallas" }),
      screen.getByRole("button", { name: "Eliminar la tarea Diseño de pantallas" }),
    ];
    for (const control of controles) {
      expect(control).toHaveAttribute("aria-disabled", "true");
      expect(control).toHaveAttribute("title", MENSAJE_PROYECTO_FINALIZADO);
      fireEvent.click(control);
    }
    expect(edit).not.toHaveBeenCalled();
    expect(run).not.toHaveBeenCalled();
    expect(api.delete).not.toHaveBeenCalled();
    expect(screen.getByRole("note")).toHaveTextContent(MENSAJE_PROYECTO_FINALIZADO);
  });

  test("el motivo del bloqueo queda asociado a cada control para teclado y lectores de pantalla", async () => {
    api.get.mockResolvedValue([tarea({ estado: "CERRADA" })]);
    mostrar({ isOwner: true, proyecto: finalizado });
    await screen.findByRole("table");
    const nota = screen.getByRole("note");
    for (const control of screen.getAllByRole("button")) {
      expect(control).toHaveAttribute("aria-describedby", nota.id);
    }
    expect(nota).toHaveTextContent(MENSAJE_PROYECTO_FINALIZADO);
  });

  test("las tareas cerradas se siguen viendo con su estado", async () => {
    api.get.mockResolvedValue([tarea({ estado: "CERRADA" })]);
    mostrar({ proyecto: finalizado });
    const tabla = await screen.findByRole("table");
    expect(within(tabla).getByText("Cerrada con el proyecto", { exact: false })).toBeInTheDocument();
  });

  test("un proyecto activo no muestra el aviso ni deshabilita nada", async () => {
    api.get.mockResolvedValue([tarea()]);
    mostrar({ isOwner: true });
    await screen.findByRole("table");
    expect(screen.queryByRole("note")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Agregar tarea" })).not.toHaveAttribute("aria-disabled");
  });
});

test("vuelve a pedir las tareas cuando el proyecto se recarga, por ejemplo al finalizarlo", async () => {
  api.get.mockResolvedValueOnce([tarea()]).mockResolvedValueOnce([tarea({ estado: "CERRADA" })]);
  const { rerender, edit, run } = mostrar();
  const tabla = await screen.findByRole("table");
  expect(within(tabla).getByText("Pendiente", { exact: false })).toBeInTheDocument();
  rerender(
    <TareasProyecto
      pid="p1"
      proyecto={{ id: "p1", estado: "FINALIZADO" }}
      isOwner={false}
      colaboradoras={colaboradoras}
      colaboraciones={colaboraciones}
      edit={edit}
      run={run}
      busy={false}
    />,
  );
  await waitFor(() =>
    expect(
      within(screen.getByRole("table")).getByText("Cerrada con el proyecto", { exact: false }),
    ).toBeInTheDocument(),
  );
  expect(api.get).toHaveBeenCalledTimes(2);
});

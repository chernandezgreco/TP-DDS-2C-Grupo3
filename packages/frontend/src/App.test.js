import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
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
const project = {
  id: "p1",
  titulo: "Biblioteca comunitaria",
  descripcion: "Una biblioteca abierta",
  colectivoId: "o1",
  estado: "ACTIVO",
  estaBuscando: true,
  perfiles: [
    {
      id: "f1",
      descripcionPerfil: "Frontend React",
      habilidadesRequeridas: ["react"],
      habilidadesOpcionales: [],
      compromiso: { cantidadHoras: 5, tipo: "SEMANALES" },
      modalidad: { gratuita: true },
    },
  ],
};
let sessionActor=null;
beforeEach(() => {
  sessionActor=null;
  window.location.hash = "";
  jest.clearAllMocks();
  api.get.mockImplementation(
    async (path) =>
      ({
        "/auth/sesion":{actor:sessionActor},
        "/mi/postulaciones":[],
        "/terminos/actual": { version: "1.0", contenido: "Código abierto" },
        "/proyectos": [project],
        "/proyectos/p1": project,
        "/colectivos": [{ id: "o1", nombre: "Biblioteca Sur" }],
        "/colaboradoras": [
          { id: "c1", nombreFantasia: "Cami", habilidades: ["react"] },
        ],
        "/habilidades": [{ codigo: "react", titulo: "React" }],
        "/colaboraciones": [],
      })[path] || [],
  );
  api.post.mockResolvedValue({});
});
test("permite explorar y postularse desde una sesión de colaboradora", async () => {
  sessionActor={type:"colaboradoras",id:"c1",email:"cami@example.com"};
  render(<App />);
  await screen.findByText("Biblioteca comunitaria");
  fireEvent.click(screen.getByRole("button", { name: /Ver proyecto/ }));
  expect(screen.getByText("Frontend React")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /Postularme/ }));
  await waitFor(() =>
    expect(api.post).toHaveBeenCalledWith("/proyectos/p1/postularse", {
      colaboradoraId: "c1",
      perfilId: "f1",
      anonimidad: false,
    }),
  );
  expect(
    await screen.findByText(/Postulación enviada para revisión/),
  ).toBeInTheDocument();
});
test("informa el error al fallar la API y permite reintentar", async () => {
  api.get.mockRejectedValue(new Error("Servidor no disponible"));
  render(<App />);
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Servidor no disponible",
  );
  expect(
    screen.getByRole("button", { name: "Reintentar carga" }),
  ).toBeInTheDocument();
});
test("filtra proyectos sin modificar el catálogo recibido", async () => {
  render(<App />);
  await screen.findByText("Biblioteca comunitaria");
  fireEvent.change(
    screen.getByRole("textbox", { name: "Buscar por nombre o habilidad" }),
    { target: { value: "sin coincidencias" } },
  );
  expect(screen.queryByText("Biblioteca comunitaria")).not.toBeInTheDocument();
  expect(screen.getByText("Todavía no hay resultados")).toBeInTheDocument();
});

test("edita un proyecto enviando sólo sus campos editables", async () => {
  api.put.mockResolvedValue({});
  sessionActor={type:"colectivos",id:"o1",email:"org@example.com"};
  render(<App />);
  await screen.findByText("Biblioteca comunitaria");
  fireEvent.click(screen.getByRole("button", { name: /Ver proyecto/ }));
  fireEvent.click(screen.getByRole("button", { name: "Editar proyecto" }));
  fireEvent.change(await screen.findByLabelText("Título"), {
    target: { value: "Biblioteca renovada" },
  });
  fireEvent.change(screen.getByLabelText(/¿El proyecto requiere/), {
    target: { value: "false" },
  });
  fireEvent.click(screen.getByLabelText(/Leí y acepto/));
  fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
  await waitFor(() =>
    expect(api.put).toHaveBeenCalledWith("/colectivos/o1/proyectos/p1", {
      titulo: "Biblioteca renovada",
      descripcion: "Una biblioteca abierta",
      requiereIA: false,
      usosIA: [],
      versionTerminosAceptada: "1.0",
    }),
  );
  await waitFor(() =>
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
  );
});

test('un visitante debe iniciar sesión y no puede elegir la identidad de otra persona',async()=>{
 render(<App/>);await screen.findByText('Biblioteca comunitaria');
 expect(screen.queryByText('Elegir perfil')).not.toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Iniciar sesión / Registrarme'}));
 expect(screen.getByRole('dialog')).toBeInTheDocument();expect(screen.getByLabelText('Correo de acceso')).toBeInTheDocument();
});
afterEach(() => {
  jest.restoreAllMocks();
});

test("cancelar la eliminación no envía ninguna solicitud", async () => {
  sessionActor = {
    type: "colaboradoras",
    id: "c1",
    email: "cami@example.com",
  };
  window.location.hash = "#espacio";

  const confirmar = jest.spyOn(window, "confirm").mockReturnValue(false);

  render(<App />);

  const boton = await screen.findByRole("button", {
    name: "Eliminar mi cuenta",
  });

  fireEvent.click(boton);

  expect(confirmar).toHaveBeenCalledTimes(1);
  expect(api.delete).not.toHaveBeenCalled();
  expect(boton).toBeInTheDocument();
});

test("confirmar la eliminación borra la cuenta y cierra la sesión local", async () => {
  sessionActor = {
    type: "colaboradoras",
    id: "c1",
    email: "cami@example.com",
  };
  window.location.hash = "#espacio";

  jest.spyOn(window, "confirm").mockReturnValue(true);
  api.delete.mockResolvedValueOnce(undefined);

  render(<App />);

  fireEvent.click(
    await screen.findByRole("button", {
      name: "Eliminar mi cuenta",
    }),
  );

  await waitFor(() => {
    expect(api.delete).toHaveBeenCalledWith("/colaboradoras/c1/cuenta");
  });

  expect(
    await screen.findByText(/Cuenta eliminada\. Tus participaciones/),
  ).toBeInTheDocument();

  expect(
    screen.queryByRole("button", { name: "Eliminar mi cuenta" }),
  ).not.toBeInTheDocument();

  expect(
    screen.getByRole("button", { name: "Iniciar sesión / Registrarme" }),
  ).toBeInTheDocument();
});

test("si la eliminación falla muestra el error y conserva la sesión", async () => {
  sessionActor = {
    type: "colaboradoras",
    id: "c1",
    email: "cami@example.com",
  };
  window.location.hash = "#espacio";

  jest.spyOn(window, "confirm").mockReturnValue(true);
  api.delete.mockRejectedValueOnce(
    new Error("No se pudo eliminar la cuenta"),
  );

  render(<App />);

  fireEvent.click(
    await screen.findByRole("button", {
      name: "Eliminar mi cuenta",
    }),
  );

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "No se pudo eliminar la cuenta",
  );

  expect(
    screen.getByRole("button", { name: "Eliminar mi cuenta" }),
  ).toBeInTheDocument();
});

test("muestra los mensajes sin leer en el avatar, el menú y la navegación", async () => {
  sessionActor = { type: "colaboradoras", id: "c1", email: "cami@example.com" };
  const respuestas = api.get.getMockImplementation();
  api.get.mockImplementation(async (path) =>
    path === "/mi/mensajes/no-leidos" ? { cantidad: 3 } : respuestas(path),
  );

  render(<App />);

  const menu = await screen.findByRole("button", {
    name: "Abrir menú de Cami (3 mensajes sin leer)",
  });
  expect(screen.getByRole("link", { name: /Mensajes 3 mensajes sin leer/ })).toBeInTheDocument();
  fireEvent.click(menu);
  expect(
    screen.getAllByRole("link", { name: /Mensajes 3 mensajes sin leer/ }),
  ).toHaveLength(2);
});

test("un colectivo no consulta mensajes sin leer", async () => {
  sessionActor = { type: "colectivos", id: "o1", email: "biblio@example.com" };

  render(<App />);

  await screen.findByRole("button", { name: "Abrir menú de Biblioteca Sur" });
  expect(api.get).not.toHaveBeenCalledWith("/mi/mensajes/no-leidos");
});

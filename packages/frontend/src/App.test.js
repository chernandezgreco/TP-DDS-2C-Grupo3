import React from "react";
import { render, screen, fireEvent, waitFor, act, within } from "@testing-library/react";
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

test.each([
  ["envío correcto", { mediosUsados: ["WHATSAPP"] }, "Mensaje enviado.", false],
  [
    "canal externo fallido",
    { mediosFallidos: ["WHATSAPP"] },
    "Mensaje guardado en la bandeja interna. No se pudo enviar por WhatsApp.",
    true,
  ],
  [
    "canal externo simulado",
    { mediosUsados: ["SMS"], mediosSimulados: ["SMS"] },
    "Mensaje guardado en la bandeja interna. Envío simulado por SMS; no se realizó un envío real por esos canales.",
    true,
  ],
])("contactar desde el perfil informa %s y cierra el formulario", async (_caso, resultado, esperado, advertencia) => {
  sessionActor = { type: "colectivos", id: "o1", email: "biblio@example.com" };
  api.post.mockResolvedValue(resultado);
  const respuestas = api.get.getMockImplementation();
  api.get.mockImplementation(async (path) =>
    path === "/proyectos/p1/perfiles/f1/colaboradoras-potenciales"
      ? [{ id: "c1", nombreFantasia: "Cami", presentacion: "Hola" }]
      : respuestas(path),
  );

  render(<App />);
  await screen.findByText("Biblioteca comunitaria");
  fireEvent.click(screen.getByRole("button", { name: /Ver proyecto/ }));
  fireEvent.click(await screen.findByRole("button", { name: "Buscar colaboradoras" }));
  fireEvent.click(await screen.findByRole("button", { name: "Enviar mensaje" }));
  fireEvent.change(await screen.findByLabelText(/Mensaje/), { target: { value: "¿Te sumás?" } });

  expect(screen.queryByRole("button", { name: "Guardar" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Enviar" }));

  await waitFor(() =>
    expect(api.post).toHaveBeenCalledWith("/notificaciones", {
      colaboradoraId: "c1",
      colectivoId: "o1",
      proyectoId: "p1",
      texto: "¿Te sumás?",
    }),
  );
  const aviso = await screen.findByText(esperado);
  expect(aviso.closest(".notice-toast")).toHaveClass(advertencia ? "notice-warning" : "success");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

describe("enviar mensaje desde la card de una colaboradora", () => {
  const conColaboradoras = (colaboradoras) => {
    const respuestas = api.get.getMockImplementation();
    api.get.mockImplementation(async (path) =>
      path === "/colaboradoras" ? colaboradoras : respuestas(path),
    );
  };
  const cami = { id: "c1", nombreFantasia: "Cami", habilidades: ["react"], aceptaMensajeria: true };

  test.each([
    ["envío correcto", {}, "Mensaje enviado."],
    [
      "fallo externo",
      { mediosFallidos: ["SMS"] },
      "Mensaje guardado en la bandeja interna. No se pudo enviar por SMS.",
    ],
  ])("un colectivo le escribe desde la card con %s", async (_caso, resultado, esperado) => {
    sessionActor = { type: "colectivos", id: "o1", email: "biblio@example.com" };
    api.post.mockResolvedValue(resultado);
    conColaboradoras([cami]);
    window.location.hash = "colaboradoras";

    render(<App />);
    fireEvent.click(await screen.findByRole("button", { name: "Enviar mensaje a Cami" }));

    // con un único proyecto compatible ya viene elegido
    expect(await screen.findByLabelText("Proyecto")).toHaveValue("p1");
    fireEvent.change(screen.getByLabelText(/Mensaje/), { target: { value: "¿Te sumás a la biblioteca?" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith("/notificaciones", {
        colaboradoraId: "c1",
        colectivoId: "o1",
        proyectoId: "p1",
        texto: "¿Te sumás a la biblioteca?",
      }),
    );
    expect(await screen.findByText(esperado)).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  test("si falla la API conserva el formulario sin confirmar que el mensaje se guardó", async () => {
    sessionActor = { type: "colectivos", id: "o1", email: "biblio@example.com" };
    conColaboradoras([cami]);
    api.post.mockRejectedValue(new Error("No se pudo guardar el mensaje."));
    window.location.hash = "colaboradoras";

    render(<App />);
    fireEvent.click(await screen.findByRole("button", { name: "Enviar mensaje a Cami" }));
    fireEvent.change(await screen.findByLabelText(/Mensaje/), { target: { value: "¿Te sumás?" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));

    expect((await screen.findAllByText("No se pudo guardar el mensaje.")).length).toBeGreaterThan(0);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.queryByText("Mensaje enviado.")).not.toBeInTheDocument();
    expect(screen.queryByText(/Mensaje guardado en la bandeja interna/)).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("button", { name: "Enviar" })).not.toBeDisabled());
  });

  test("no aparece si la colaboradora no acepta mensajes o ningún proyecto busca sus habilidades", async () => {
    sessionActor = { type: "colectivos", id: "o1", email: "biblio@example.com" };
    conColaboradoras([
      { ...cami, aceptaMensajeria: false },
      { id: "c2", nombreFantasia: "Lu", habilidades: ["diseno-ux"], aceptaMensajeria: true },
    ]);
    window.location.hash = "colaboradoras";

    render(<App />);
    await screen.findByText("Lu");
    expect(screen.queryByRole("button", { name: /Enviar mensaje/ })).not.toBeInTheDocument();
  });

  test("una colaboradora no ve la opción", async () => {
    sessionActor = { type: "colaboradoras", id: "c9", email: "otra@example.com" };
    conColaboradoras([cami]);
    window.location.hash = "colaboradoras";

    render(<App />);
    await screen.findByText("Cami");
    expect(screen.queryByRole("button", { name: /Enviar mensaje/ })).not.toBeInTheDocument();
  });
});

describe("carga inicial", () => {
  // deja /auth/sesion pendiente hasta llamar a responderSesion
  const sesionPendiente = () => {
    let responderSesion;
    const respuestas = api.get.getMockImplementation();
    api.get.mockImplementation((path) =>
      path === "/auth/sesion"
        ? new Promise((resolve) => {
            responderSesion = (actor) => resolve({ actor });
          })
        : respuestas(path),
    );
    return (actor) => responderSesion(actor);
  };

  test("pide la sesión y los datos a la vez, sin esperar la respuesta de la sesión", async () => {
    sesionPendiente();

    render(<App />);

    await waitFor(() => expect(api.get).toHaveBeenCalledWith("/proyectos"));
    expect(api.get).toHaveBeenCalledWith("/auth/sesion");
    expect(api.get).toHaveBeenCalledWith("/colectivos");
  });

  test("mientras comprueba la sesión no pide iniciarla; si no hay sesión, recién ahí lo pide", async () => {
    const responderSesion = sesionPendiente();
    window.location.hash = "mensajes";

    render(<App />);

    expect(await screen.findByText("Comprobando tu sesión…")).toBeInTheDocument();
    expect(screen.queryByText(/Iniciá sesión para ver/)).not.toBeInTheDocument();
    expect(screen.queryByText("Cargando mensajes…")).not.toBeInTheDocument();

    act(() => responderSesion(null));

    expect(await screen.findByText(/Iniciá sesión para ver/)).toBeInTheDocument();
    expect(screen.queryByText("Comprobando tu sesión…")).not.toBeInTheDocument();
  });
});


test.each(["menu lateral", "logo"])("vuelve al listado desde un proyecto al pulsar %s en la misma seccion", async (origen) => {
  window.history.replaceState(null, "", "#proyectos");
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)); });
  const { container } = render(<App />);
  await screen.findByText("Biblioteca comunitaria");
  fireEvent.click(screen.getByRole("button", { name: /Ver proyecto/ }));
  await waitFor(() => expect(screen.getByText("Frontend React")).toBeInTheDocument());
  const enlace = origen === "logo"
    ? container.querySelector("a.brand")
    : within(screen.getByRole("navigation", { name: /principal/ })).getByRole("link", { name: "Explorar proyectos" });
  await act(async () => { fireEvent.click(enlace); });
  expect(screen.queryByText("Frontend React")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Ver proyecto/ })).toBeInTheDocument();
  expect(window.location.hash).toBe("#proyectos");
});

test.each(["menu lateral", "menu del usuario"])("restaura Mi espacio desde una postulacion usando %s", async (origen) => {
  sessionActor = { type: "colaboradoras", id: "c1", email: "cami@example.com" };
  window.history.replaceState(null, "", "#espacio");
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)); });
  const obtener = api.get.getMockImplementation();
  api.get.mockImplementation((path) => path === "/mi/postulaciones"
    ? Promise.resolve([{ id: "post1", proyectoId: "p1", estado: "PENDIENTE" }])
    : obtener(path));
  render(<App />);
  fireEvent.click(await screen.findByRole("button", { name: /Ver proyecto/ }));
  await waitFor(() => expect(screen.getByText("Frontend React")).toBeInTheDocument());
  let enlace;
  if (origen === "menu del usuario") {
    fireEvent.click(screen.getByRole("button", { name: /Abrir men/ }));
    enlace = screen.getAllByRole("link", { name: "Mi espacio" }).find((link) => link.closest(".user-menu-panel"));
  } else {
    enlace = within(screen.getByRole("navigation", { name: /principal/ })).getByRole("link", { name: "Mi espacio" });
  }
  await act(async () => { fireEvent.click(enlace); });
  expect(screen.queryByText("Frontend React")).not.toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Mi perfil y mis proyectos" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Abrir men/ })).toHaveAttribute("aria-expanded", "false");
  expect(window.location.hash).toBe("#espacio");
});

describe("gráfico de avance acumulado", () => {
  const avances = [
    { id: "l2", descripcion: "Integración lista", porcentajeCompletitud: 60, fechaCreacion: "2026-11-25T15:00:00Z" },
    { id: "l1", descripcion: "Diseño terminado", porcentajeCompletitud: 25, fechaCreacion: "2026-11-20T15:00:00Z" },
  ];

  async function abrirProyecto() {
    render(<App />);
    await screen.findByRole("button", { name: /Ver proyecto/ });
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: /Ver proyecto/ })); });
  }

  test("despliega el gráfico, permite ocultarlo y vuelve cerrado al salir del proyecto", async () => {
    const obtener = api.get.getMockImplementation();
    api.get.mockImplementation((path) => path === "/proyectos/p1/logros" ? Promise.resolve(avances) : obtener(path));
    await abrirProyecto();
    expect(screen.queryByRole("region", { name: "Gráfico de avances del proyecto" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Ver avances" }));
    expect(screen.getByText("60% del proyecto")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ocultar gráfico" })).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(screen.getByRole("button", { name: "Ocultar gráfico" }));
    expect(screen.queryByRole("region", { name: "Gráfico de avances del proyecto" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Ver avances" }));
    await act(async () => { fireEvent.click(within(screen.getByRole("navigation", { name: /principal/ })).getByRole("link", { name: "Explorar proyectos" })); });
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: /Ver proyecto/ })); });
    expect(screen.getByRole("button", { name: "Ver avances" })).toHaveAttribute("aria-expanded", "false");
  });

  test("muestra la carga pendiente y luego el estado vacío", async () => {
    let responder;
    const obtener = api.get.getMockImplementation();
    api.get.mockImplementation((path) => path === "/proyectos/p1/logros" ? new Promise((resolve) => { responder = resolve; }) : obtener(path));
    await abrirProyecto();
    fireEvent.click(screen.getByRole("button", { name: "Ver avances" }));
    expect(screen.getByText("Cargando avances…")).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Gráfico de avances del proyecto" })).not.toBeInTheDocument();
    await act(async () => { responder([]); });
    expect(screen.getByText(/Todavía no hay logros con fecha/)).toBeInTheDocument();
  });

  test("informa un error de carga y permite reintentar sin salir del proyecto", async () => {
    const obtener = api.get.getMockImplementation();
    let intentos = 0;
    api.get.mockImplementation((path) => {
      if (path !== "/proyectos/p1/logros") return obtener(path);
      intentos += 1;
      return intentos === 1 ? Promise.reject(new Error("Sin conexión")) : Promise.resolve(avances);
    });
    await abrirProyecto();
    fireEvent.click(screen.getByRole("button", { name: "Ver avances" }));
    expect(screen.getByText(/No se pudieron cargar los avances/)).toBeInTheDocument();
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Reintentar avances" })); });
    expect(screen.getByText("60% del proyecto")).toBeInTheDocument();
    expect(screen.queryByText(/No se pudieron cargar los avances/)).not.toBeInTheDocument();
  });
});

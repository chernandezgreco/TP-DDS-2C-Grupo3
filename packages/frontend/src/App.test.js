import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import App from "./App";
import { api } from "./api";
jest.mock("./api", () => ({
  api: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
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
beforeEach(() => {
  window.location.hash = "";
  jest.clearAllMocks();
  api.get.mockImplementation(
    async (path) =>
      ({
        "/proyectos": [project],
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
test("permite explorar, elegir colaboradora y enviar una postulación al perfil", async () => {
  render(<App />);
  await screen.findByText("Biblioteca comunitaria");
  fireEvent.click(screen.getByRole("button", { name: /Elegir perfil/ }));
  fireEvent.change(screen.getByLabelText("Colaboradora"), {
    target: { value: "c1" },
  });
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

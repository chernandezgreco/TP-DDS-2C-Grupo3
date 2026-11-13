import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AuthPanel from "./AuthPanel";
import { api } from "./api";
jest.mock("./api", () => ({ api: { post: jest.fn() } }));
beforeEach(() => jest.clearAllMocks());
test("ingresa con credenciales y entrega la identidad devuelta por el servidor", async () => {
  const onSuccess = jest.fn();
  api.post.mockResolvedValue({ actor: { id: "1", type: "colectivos" } });
  render(<AuthPanel skills={[]} onSuccess={onSuccess} onCancel={() => {}} />);
  fireEvent.change(screen.getByLabelText("Correo de acceso"), {
    target: { value: "org@example.com" },
  });
  fireEvent.change(screen.getByLabelText(/Contraseña \(/), {
    target: { value: "Clave-muy-larga-123" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Ingresar" }));
  await waitFor(() =>
    expect(api.post).toHaveBeenCalledWith("/auth/login", {
      email: "org@example.com",
      password: "Clave-muy-larga-123",
    }),
  );
  expect(onSuccess).toHaveBeenCalledWith({
    actor: { id: "1", type: "colectivos" },
  });
});
test("no registra cuentas cuando las contraseñas son distintas", async () => {
  render(
    <AuthPanel
      skills={[]}
      initialMode="registro"
      initialType="colectivos"
      onSuccess={() => {}}
      onCancel={() => {}}
    />,
  );
  fireEvent.change(screen.getByLabelText("Correo de acceso"), {
    target: { value: "org@example.com" },
  });
  fireEvent.change(screen.getByLabelText(/Contraseña \(/), {
    target: { value: "Clave-muy-larga-123" },
  });
  fireEvent.change(screen.getByLabelText("Repetir contraseña"), {
    target: { value: "Otra-clave-larga" },
  });
  fireEvent.change(screen.getByLabelText("Nombre"), {
    target: { value: "Organización" },
  });
  fireEvent.change(screen.getByLabelText("Descripción"), {
    target: { value: "Causa social" },
  });
  fireEvent.change(screen.getByLabelText("Tipo"), { target: { value: "ONG" } });
  fireEvent.click(screen.getByRole("button", { name: "Crear mi cuenta" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Las contraseñas no coinciden",
  );
  expect(api.post).not.toHaveBeenCalled();
});

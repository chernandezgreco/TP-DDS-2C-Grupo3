import React, { useState } from "react";
import PropTypes from "prop-types";
import { act, fireEvent, render, screen } from "@testing-library/react";
import AvisoFlotante, { DURACION_AVISO_MS } from "./AvisoFlotante";

// como en la app: el estado vive en quien lo usa y onCerrar es una función nueva en cada render
function ConAviso({ inicial = "Cambios guardados." }) {
  const [mensaje, setMensaje] = useState(inicial);
  const [, setRenders] = useState(0);
  return (
    <>
      <button onClick={() => setRenders((n) => n + 1)}>Re-render</button>
      <button onClick={() => setMensaje("Sesión cerrada.")}>Otro aviso</button>
      <AvisoFlotante mensaje={mensaje} onCerrar={() => setMensaje("")} />
    </>
  );
}

ConAviso.propTypes = { inicial: PropTypes.string };

const avanzar =(ms) => act(() => jest.advanceTimersByTime(ms));

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

test("se muestra en el contenedor fijo de avisos y se anuncia como estado", () => {
  render(<ConAviso />);

  const region = screen.getByRole("status");
  expect(region).toHaveTextContent("Cambios guardados.");
  expect(document.getElementById("avisos-flotantes")).toContainElement(region);
});

test("se cierra solo a los 15 segundos, no antes", () => {
  render(<ConAviso />);

  avanzar(DURACION_AVISO_MS - 100);
  expect(screen.getByText(/Cambios guardados/)).toBeInTheDocument();
  avanzar(100);
  expect(screen.queryByText(/Cambios guardados/)).not.toBeInTheDocument();
});

test("la cruz lo cierra en el momento", () => {
  render(<ConAviso />);

  fireEvent.click(screen.getByRole("button", { name: "Cerrar mensaje" }));

  expect(screen.queryByText(/Cambios guardados/)).not.toBeInTheDocument();
});

test("un re-render de quien lo usa no reinicia la cuenta", () => {
  render(<ConAviso />);

  avanzar(10000);
  fireEvent.click(screen.getByText("Re-render"));
  avanzar(5000);

  expect(screen.queryByText(/Cambios guardados/)).not.toBeInTheDocument();
});

test("con el puntero encima no se cierra, y al salir vuelve a contar 15 segundos", () => {
  render(<ConAviso />);
  const aviso = screen.getByText(/Cambios guardados/).parentElement;

  fireEvent.mouseEnter(aviso);
  avanzar(DURACION_AVISO_MS * 2);
  expect(screen.getByText(/Cambios guardados/)).toBeInTheDocument();

  fireEvent.mouseLeave(aviso);
  avanzar(DURACION_AVISO_MS);
  expect(screen.queryByText(/Cambios guardados/)).not.toBeInTheDocument();
});

test("un aviso nuevo reemplaza al anterior y tiene sus propios 15 segundos", () => {
  render(<ConAviso />);

  avanzar(10000);
  fireEvent.click(screen.getByText("Otro aviso"));
  expect(screen.queryByText(/Cambios guardados/)).not.toBeInTheDocument();
  avanzar(10000);
  expect(screen.getByText(/Sesión cerrada/)).toBeInTheDocument();
  avanzar(5000);
  expect(screen.queryByText(/Sesión cerrada/)).not.toBeInTheDocument();
});

test("sin mensaje no muestra nada", () => {
  render(<ConAviso inicial="" />);

  expect(screen.getByRole("status")).toBeEmptyDOMElement();
});

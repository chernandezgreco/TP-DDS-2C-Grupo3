import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BotonModoDaltonico from "./BotonModoDaltonico";
import { CLAVE_MODO_DALTONICO } from "./vision";

const raiz = document.documentElement;
const disparador = () => screen.getByRole("button", { name: /^Modo daltónico/ });
const abrir = () => userEvent.click(disparador());
const opcion = (nombre) => screen.getByRole("radio", { name: nombre });

beforeEach(() => {
  window.localStorage.clear();
  delete raiz.dataset.vision;
});

test("el botón abre un panel con las cuatro combinaciones y sus muestras de color", () => {
  render(<BotonModoDaltonico />);
  expect(disparador()).toHaveAttribute("aria-expanded", "false");
  expect(screen.queryByRole("radio")).not.toBeInTheDocument();

  abrir();
  expect(disparador()).toHaveAttribute("aria-expanded", "true");
  expect(screen.getByRole("group", { name: "Elegí la combinación que veas mejor" })).toBeInTheDocument();
  expect(screen.getAllByRole("radio")).toHaveLength(4);
  expect(opcion("Colores originales")).toBeChecked();
  // cada opción muestra su par para comparar, no sólo la elegida
  expect(document.querySelectorAll(".vision-muestras span")).toHaveLength(8);
});

test("permite elegir una combinación, la muestra en el botón y vuelve a los colores originales", () => {
  render(<BotonModoDaltonico />);
  abrir();

  userEvent.click(opcion("Azul y ámbar (protanopia)"));
  expect(opcion("Azul y ámbar (protanopia)")).toBeChecked();
  expect(raiz).toHaveAttribute("data-vision", "protanopia");
  expect(window.localStorage.getItem(CLAVE_MODO_DALTONICO)).toBe("protanopia");
  expect(disparador()).toHaveAccessibleName("Modo daltónico: azul y ámbar");
  // el panel sigue abierto para poder comparar
  expect(screen.getAllByRole("radio")).toHaveLength(4);

  userEvent.click(opcion("Colores originales"));
  expect(raiz).not.toHaveAttribute("data-vision");
  expect(window.localStorage.getItem(CLAVE_MODO_DALTONICO)).toBeNull();
  expect(disparador()).toHaveAccessibleName("Modo daltónico");
});

test.each([
  ["protanopia", "azul y ámbar"],
  ["deuteranopia", "violeta y ámbar"],
  ["tritanopia", "carmín y verde azulado"],
])("recuerda el modo %s y lo muestra en el botón", (modo, corto) => {
  window.localStorage.setItem(CLAVE_MODO_DALTONICO, modo);
  render(<BotonModoDaltonico />);
  expect(raiz).toHaveAttribute("data-vision", modo);
  expect(disparador()).toHaveAccessibleName(`Modo daltónico: ${corto}`);
});

test("se puede usar sólo con teclado y Escape devuelve el foco al botón", () => {
  render(<BotonModoDaltonico />);
  userEvent.tab();
  expect(disparador()).toHaveFocus();
  userEvent.keyboard("{Enter}");
  expect(disparador()).toHaveAttribute("aria-expanded", "true");

  userEvent.tab();
  expect(opcion("Colores originales")).toHaveFocus();
  // jsdom no mueve la selección con las flechas; el cambio de radio se simula directo
  fireEvent.click(opcion("Violeta y ámbar (deuteranopia)"));
  expect(raiz).toHaveAttribute("data-vision", "deuteranopia");

  userEvent.keyboard("{Escape}");
  expect(screen.queryByRole("radio")).not.toBeInTheDocument();
  expect(disparador()).toHaveFocus();
});

test("se cierra con Listo y al tocar afuera", () => {
  render(
    <>
      <p>Afuera</p>
      <BotonModoDaltonico />
    </>,
  );
  abrir();
  userEvent.click(screen.getByRole("button", { name: "Listo" }));
  expect(screen.queryByRole("radio")).not.toBeInTheDocument();
  expect(disparador()).toHaveFocus();

  abrir();
  fireEvent.mouseDown(screen.getByText("Afuera"));
  expect(screen.queryByRole("radio")).not.toBeInTheDocument();
});

test("al montarse no escribe la preferencia: sólo se guarda cuando la persona la cambia", () => {
  const guardar = jest.spyOn(Storage.prototype, "setItem");
  const borrar = jest.spyOn(Storage.prototype, "removeItem");
  render(<BotonModoDaltonico />);
  abrir();
  expect(guardar).not.toHaveBeenCalled();
  expect(borrar).not.toHaveBeenCalled();
  jest.restoreAllMocks();
});

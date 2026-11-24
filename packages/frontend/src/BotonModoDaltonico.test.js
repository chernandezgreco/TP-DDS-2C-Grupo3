import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BotonModoDaltonico from "./BotonModoDaltonico";
import { CLAVE_MODO_DALTONICO } from "./vision";

const raiz = document.documentElement;
const selector = () => screen.getByRole("combobox", { name: "Paleta de color" });

beforeEach(() => {
  window.localStorage.clear();
  delete raiz.dataset.vision;
});

test("permite elegir una paleta y volver a la paleta estándar", () => {
  render(<BotonModoDaltonico />);
  expect(selector()).toHaveValue("normal");

  fireEvent.change(selector(), { target: { value: "protanopia" } });
  expect(selector()).toHaveValue("protanopia");
  expect(raiz).toHaveAttribute("data-vision", "protanopia");
  expect(window.localStorage.getItem(CLAVE_MODO_DALTONICO)).toBe("protanopia");

  fireEvent.change(selector(), { target: { value: "normal" } });
  expect(selector()).toHaveValue("normal");
  expect(raiz).not.toHaveAttribute("data-vision");
  expect(window.localStorage.getItem(CLAVE_MODO_DALTONICO)).toBeNull();
});

test.each(["protanopia", "deuteranopia", "tritanopia"])("recuerda el modo %s", (modo) => {
  window.localStorage.setItem(CLAVE_MODO_DALTONICO, modo);
  render(<BotonModoDaltonico />);
  expect(selector()).toHaveValue(modo);
  expect(raiz).toHaveAttribute("data-vision", modo);
});

test("se puede usar sólo con teclado", () => {
  render(<BotonModoDaltonico />);
  userEvent.tab();
  expect(selector()).toHaveFocus();
  userEvent.selectOptions(selector(), "deuteranopia");
  expect(selector()).toHaveValue("deuteranopia");
});

test("al montarse no escribe la preferencia: sólo se guarda cuando la persona la cambia", () => {
  const guardar = jest.spyOn(Storage.prototype, "setItem");
  const borrar = jest.spyOn(Storage.prototype, "removeItem");
  render(<BotonModoDaltonico />);
  expect(guardar).not.toHaveBeenCalled();
  expect(borrar).not.toHaveBeenCalled();
  jest.restoreAllMocks();
});

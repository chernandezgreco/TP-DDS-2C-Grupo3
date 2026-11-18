import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BotonModoDaltonico from "./BotonModoDaltonico";
import { CLAVE_MODO_DALTONICO } from "./vision";

const raiz = document.documentElement;
const boton = () => screen.getByRole("button", { name: "Modo daltónico" });

beforeEach(() => {
  window.localStorage.clear();
  delete raiz.dataset.vision;
});

test("activa y desactiva la paleta daltónica anunciando el estado", () => {
  render(<BotonModoDaltonico />);
  expect(boton()).toHaveAttribute("aria-pressed", "false");

  fireEvent.click(boton());
  expect(boton()).toHaveAttribute("aria-pressed", "true");
  expect(raiz).toHaveAttribute("data-vision", "daltonico");
  expect(window.localStorage.getItem(CLAVE_MODO_DALTONICO)).toBe("1");

  fireEvent.click(boton());
  expect(boton()).toHaveAttribute("aria-pressed", "false");
  expect(raiz).not.toHaveAttribute("data-vision");
  expect(window.localStorage.getItem(CLAVE_MODO_DALTONICO)).toBeNull();
});

test("recuerda la elección al volver a entrar", () => {
  window.localStorage.setItem(CLAVE_MODO_DALTONICO, "1");
  render(<BotonModoDaltonico />);
  expect(boton()).toHaveAttribute("aria-pressed", "true");
  expect(raiz).toHaveAttribute("data-vision", "daltonico");
});

test("se puede usar sólo con teclado: Tab para llegar, Enter y Espacio para alternar", () => {
  render(<BotonModoDaltonico />);
  userEvent.tab();
  expect(boton()).toHaveFocus();
  userEvent.keyboard("{Enter}");
  expect(boton()).toHaveAttribute("aria-pressed", "true");
  userEvent.keyboard(" ");
  expect(boton()).toHaveAttribute("aria-pressed", "false");
});

test("al montarse no escribe la preferencia: sólo se guarda cuando la persona la cambia", () => {
  const guardar = jest.spyOn(Storage.prototype, "setItem");
  const borrar = jest.spyOn(Storage.prototype, "removeItem");
  render(<BotonModoDaltonico />);
  expect(guardar).not.toHaveBeenCalled();
  expect(borrar).not.toHaveBeenCalled();
  jest.restoreAllMocks();
});

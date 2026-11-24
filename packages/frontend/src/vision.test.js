import {
  CLAVE_MODO_DALTONICO,
  aplicarModoDaltonico,
  guardarModoDaltonico,
  iniciarModoDaltonico,
  leerModoDaltonico,
} from "./vision";

const raiz = document.documentElement;

beforeEach(() => {
  window.localStorage.clear();
  delete raiz.dataset.vision;
});
afterEach(() => jest.restoreAllMocks());

test("sin preferencia guardada el modo daltónico arranca apagado", () => {
  expect(leerModoDaltonico()).toBe(false);
  iniciarModoDaltonico();
  expect(raiz).not.toHaveAttribute("data-vision");
});

test("guardar y aplicar activan la paleta de protanopia en <html>", () => {
  guardarModoDaltonico(true);
  expect(window.localStorage.getItem(CLAVE_MODO_DALTONICO)).toBe("protanopia");
  iniciarModoDaltonico();
  expect(raiz).toHaveAttribute("data-vision", "protanopia");
});

test("al desactivarlo se borra la preferencia y se quita el atributo", () => {
  guardarModoDaltonico(true);
  aplicarModoDaltonico(true);
  guardarModoDaltonico(false);
  aplicarModoDaltonico(false);
  expect(window.localStorage.getItem(CLAVE_MODO_DALTONICO)).toBeNull();
  expect(raiz).not.toHaveAttribute("data-vision");
});

test("si el almacenamiento está bloqueado no rompe: usa la paleta normal", () => {
  const bloqueado = () => {
    throw new Error("SecurityError");
  };
  jest.spyOn(Storage.prototype, "getItem").mockImplementation(bloqueado);
  jest.spyOn(Storage.prototype, "setItem").mockImplementation(bloqueado);
  jest.spyOn(Storage.prototype, "removeItem").mockImplementation(bloqueado);
  expect(leerModoDaltonico()).toBe(false);
  expect(() => guardarModoDaltonico(true)).not.toThrow();
  expect(() => guardarModoDaltonico(false)).not.toThrow();
});

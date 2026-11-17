import { afterAll, beforeAll, expect, test } from "@jest/globals";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { crearApp } from "../../src/app.js";

let server, url, carpeta;

beforeAll(async () => {
  carpeta = fs.mkdtempSync(path.join(os.tmpdir(), "front-"));
  fs.writeFileSync(path.join(carpeta, "index.html"), "<html>SPA</html>");
  await new Promise((resolve) => {
    server = crearApp({ carpetaFront: carpeta }).listen(0, resolve);
  });
  url = `http://127.0.0.1:${server.address().port}`;
});

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
  fs.rmSync(carpeta, { recursive: true, force: true });
});

test("la raiz y las pantallas del front devuelven el index", async () => {
  const raiz = await fetch(url + "/");
  const pantalla = await fetch(url + "/proyectos/algo");
  expect(await raiz.text()).toContain("SPA");
  expect(await pantalla.text()).toContain("SPA");
});

test("health y la API no se pisan con el index", async () => {
  const health = await fetch(url + "/health");
  expect((await health.json()).status).toBe("OK");
  const docs = await fetch(url + "/api-docs.json");
  expect(docs.headers.get("content-type")).toContain("application/json");
});

test("sin carpeta del front la raiz responde el mensaje del backend", async () => {
  const sinFront = await new Promise((resolve) => {
    const s = crearApp({ carpetaFront: path.join(carpeta, "no-existe") }).listen(0, () => resolve(s));
  });
  const res = await fetch(`http://127.0.0.1:${sinFront.address().port}/`);
  expect((await res.json()).mensaje).toContain("Bienvenido");
  await new Promise((resolve) => sinFront.close(resolve));
});

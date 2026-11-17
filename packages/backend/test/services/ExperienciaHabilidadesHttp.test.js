import { beforeAll, beforeEach, afterAll, test, expect } from "@jest/globals";
import { crearApp } from "../../src/app.js";
import { HabilidadModel } from "../../src/models/indexModel.js";
import {
  conectarBaseDePrueba,
  limpiarBaseDePrueba,
  desconectarBaseDePrueba,
} from "../helpers/baseDePrueba.js";

let server, url;

async function req(path, { method = "GET", body, cookie } = {}) {
  const response = await fetch(url + "/api" + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  return {
    status: response.status,
    data: text ? JSON.parse(text) : null,
    cookie: response.headers.get("set-cookie")?.split(";")[0],
  };
}

const registrar = () =>
  req("/auth/registro", {
    method: "POST",
    body: {
      email: "experiencia@example.com",
      password: "Una-clave-larga-123",
      tipo: "colaboradoras",
      perfil: { nombreFantasia: "Colaboradora", github: "cami", habilidades: ["react"] },
    },
  });

const guardar = (persona, experienciaHabilidades) =>
  req(`/colaboradoras/${persona.data.actor.id}/experiencia-habilidades`, {
    method: "PUT",
    cookie: persona.cookie,
    body: { experienciaHabilidades },
  });

beforeAll(async () => {
  await conectarBaseDePrueba();
  const app = crearApp();
  await new Promise((resolve) => {
    server = app.listen(0, "127.0.0.1", resolve);
  });
  url = `http://127.0.0.1:${server.address().port}`;
}, 60000);

beforeEach(async () => {
  await limpiarBaseDePrueba();
  await HabilidadModel.create({ codigo: "react", titulo: "React", descripcion: "Interfaces" });
});

afterAll(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  await desconectarBaseDePrueba();
});

test("la descripción de la experiencia es opcional, se guarda y se sanitiza", async () => {
  const persona = await registrar();

  const sinDescripcion = await guardar(persona, [{ codigo: "react", nivel: "INICIAL", anios: 1 }]);
  expect(sinDescripcion.status).toBe(200);

  const conDescripcion = await guardar(persona, [
    { codigo: "react", nivel: "AVANZADO", anios: 4, descripcion: "  Armé un panel <script>alert(1)</script>interno  " },
  ]);
  expect(conDescripcion.status).toBe(200);

  const perfil = await req(`/colaboradoras/${persona.data.actor.id}`, { cookie: persona.cookie });
  const item = perfil.data.experienciaHabilidades[0];
  expect(item.descripcion).toBe("Armé un panel interno");
  expect(item.descripcion).not.toContain("<");
});

test("rechaza descripciones largas, campos desconocidos y habilidades ajenas", async () => {
  const persona = await registrar();
  const base = { codigo: "react", nivel: "INTERMEDIO", anios: 2 };

  expect((await guardar(persona, [{ ...base, descripcion: "x".repeat(501) }])).status).toBe(400);
  expect((await guardar(persona, [{ ...base, extra: "no" }])).status).toBe(400);
  expect((await guardar(persona, [{ ...base, codigo: "python" }])).status).toBe(400);
});

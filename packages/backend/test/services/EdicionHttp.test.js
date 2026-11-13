import { beforeAll, afterAll, beforeEach, test, expect } from "@jest/globals";
import express from "express";
import colectivosRoutes from "../../src/routes/Colectivos.js";
import colaboradorasRoutes from "../../src/routes/Colaboradora.js";
import { manejarErrores } from "../../src/middlewares/manejarErrores.js";
import { ColectivoService } from "../../src/services/ColectivosService.js";
import { ColaboradoraService } from "../../src/services/ColaboradoraService.js";
import { ProyectoService } from "../../src/services/ProyectoService.js";
import {
  HabilidadModel,
  PostulacionModel,
  ProyectoModel,
} from "../../src/models/indexModel.js";
import {
  conectarBaseDePrueba,
  limpiarBaseDePrueba,
  desconectarBaseDePrueba,
} from "../helpers/baseDePrueba.js";
let server, url;
const colectivo = () =>
  ColectivoService.crearColectivo({
    nombre: "Comunidad",
    descripcion: "Software comunitario",
    tipo: "ONG",
  });
async function request(path, method, body) {
  const response = await fetch(url + path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return {
    status: response.status,
    data: response.status === 204 ? null : await response.json(),
  };
}
beforeAll(async () => {
  await conectarBaseDePrueba();
  const app = express();
  app.use(express.json());
  app.use("/colectivos", colectivosRoutes);
  app.use("/colaboradoras", colaboradorasRoutes);
  app.use(manejarErrores);
  await new Promise((resolve) => {
    server = app.listen(0, "127.0.0.1", resolve);
  });
  url = `http://127.0.0.1:${server.address().port}`;
}, 60000);
beforeEach(limpiarBaseDePrueba);
afterAll(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  await desconectarBaseDePrueba();
});
test("edita un colectivo por HTTP y persiste sin aceptar campos ajenos", async () => {
  const c = await colectivo();
  let result = await request("/colectivos/" + c.id, "PATCH", {
    nombre: "Nuevo nombre",
  });
  expect(result.status).toBe(200);
  expect((await ColectivoService.obtenerPorId(c.id)).nombre).toBe(
    "Nuevo nombre",
  );
  expect(
    (await request("/colectivos/" + c.id, "PATCH", { nombre: "   " })).status,
  ).toBe(400);
  expect(
    (await request("/colectivos/" + c.id, "PATCH", { id: "otro" })).status,
  ).toBe(400);
  expect((await request("/colectivos/" + c.id, "PATCH", {})).status).toBe(400);
});
test("editar datos personales conserva contactos y preferencias privadas", async () => {
  await HabilidadModel.create({
    codigo: "react",
    titulo: "React",
    descripcion: "Interfaces",
  });
  const c = await ColaboradoraService.crearColaboradora({
    nombreFantasia: "Cami",
    github: "cami",
    habilidades: ["react"],
  });
  await ColaboradoraService.agregarMedioContacto(c.id, {
    tipo: "EMAIL",
    valor: "cami@example.com",
  });
  await ColaboradoraService.actualizarPreferencias(c.id, {
    aceptaMensajeria: true,
  });
  const result = await request("/colaboradoras/" + c.id, "PATCH", {
    nombreFantasia: "Camila",
  });
  expect(result.status).toBe(200);
  expect(result.data.mediosContacto).toBeUndefined();
  const actual = await ColaboradoraService.obtenerPorId(c.id);
  expect(actual.mediosContacto).toHaveLength(1);
  expect(actual.aceptaMensajeria).toBe(true);
  expect(
    (
      await request("/colaboradoras/" + c.id, "PATCH", {
        habilidades: ["inexistente"],
      })
    ).status,
  ).toBe(400);
});
test("edita proyecto, rechaza otro colectivo y persiste pausa de búsqueda", async () => {
  const c = await colectivo(),
    otro = await colectivo();
  const p = await ProyectoService.crearProyecto(
    { titulo: "Inicial", descripcion: "Descripción" },
    c.id,
  );
  const path = `/colectivos/${c.id}/proyectos/${p.id}`;
  expect((await request(path, "PUT", { titulo: "Actualizado" })).status).toBe(
    200,
  );
  expect((await ProyectoService.obtenerPorId(p.id)).titulo).toBe("Actualizado");
  expect(
    (
      await request(`/colectivos/${otro.id}/proyectos/${p.id}`, "PUT", {
        titulo: "Ajeno",
      })
    ).status,
  ).toBe(404);
  expect((await request(path, "PUT", { colectivoId: otro.id })).status).toBe(
    400,
  );
  expect(
    (await request(path + "/busqueda", "PATCH", { estaBuscando: false }))
      .status,
  ).toBe(200);
  expect((await ProyectoService.obtenerPorId(p.id)).estaBuscando).toBe(false);
});
test("elimina proyectos sin historial y preserva los que tienen postulaciones", async () => {
  const c = await colectivo();
  const p = await ProyectoService.crearProyecto(
    { titulo: "Inicial", descripcion: "Descripción" },
    c.id,
  );
  const path = `/colectivos/${c.id}/proyectos/${p.id}`;
  await PostulacionModel.create({
    proyectoId: p.id,
    perfilId: "perfil",
    colaboradoraId: "persona",
  });
  expect((await request(path, "DELETE")).status).toBe(400);
  expect(await ProyectoModel.exists({ _id: p.id })).toBeTruthy();
  const vacio = await ProyectoService.crearProyecto(
    { titulo: "Borrable", descripcion: "Sin historial" },
    c.id,
  );
  expect(
    (await request(`/colectivos/${c.id}/proyectos/${vacio.id}`, "DELETE"))
      .status,
  ).toBe(204);
  expect(await ProyectoModel.exists({ _id: vacio.id })).toBeNull();
});

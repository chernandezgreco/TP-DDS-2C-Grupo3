import { PostulacionService } from "../../src/services/PostulacionService.js";
import { PostulacionModel } from "../../src/models/indexModel.js";
import { beforeAll, beforeEach, afterAll, test, expect } from "@jest/globals";
import express from "express";
import adicionales from "../../src/routes/Adicionales.js";
import proyectos from "../../src/routes/Proyectos.js";
import colectivos from "../../src/routes/Colectivos.js";
import { manejarErrores } from "../../src/middlewares/manejarErrores.js";
import { crearLimitePublico } from "../../src/middlewares/limitePublico.js";
import { ProyectoService } from "../../src/services/ProyectoService.js";
import { ColectivoService } from "../../src/services/ColectivosService.js";
import { TerminosService } from "../../src/services/TerminosService.js";
import {
  ProyectoModel,
  ColectivoModel,
  ColaboracionModel,
} from "../../src/models/indexModel.js";
import { RevisionTerminosModel } from "../../src/models/AdicionalesModel.js";
import {
  conectarBaseDePrueba,
  limpiarBaseDePrueba,
  desconectarBaseDePrueba,
} from "../helpers/baseDePrueba.js";
let server, url, organization;
const adminKey = "clave-administrativa-solo-para-tests-123456";
const oldKey = process.env.ADMIN_API_KEY;
async function req(path, { method = "GET", body, admin = false } = {}) {
  const result = await fetch(url + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(admin ? { Authorization: "Bearer " + adminKey } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await result.text();
  return {
    status: result.status,
    text,
    headers: result.headers,
    data: result.headers.get("content-type")?.includes("application/json")
      ? JSON.parse(text)
      : null,
  };
}
const create = (data = {}) =>
  ProyectoService.crearProyecto(
    {
      titulo: "Comunidad",
      descripcion: "Proyecto abierto",
      versionTerminosAceptada: "1.0",
      ...data,
    },
    organization.id,
  );
beforeAll(async () => {
  process.env.ADMIN_API_KEY = adminKey;
  await conectarBaseDePrueba();
  const app = express();
  app.use(express.json());
  app.use("/api", adicionales);
  app.use("/api/proyectos", proyectos);
  app.use("/api/colectivos", colectivos);
  app.use(
    "/limite",
    crearLimitePublico({ limit: 2, windowMs: 60000 }),
    (req, res) => res.json({ ok: true }),
  );
  app.use(manejarErrores);
  await new Promise((resolve) => {
    server = app.listen(0, "127.0.0.1", resolve);
  });
  url = `http://127.0.0.1:${server.address().port}`;
}, 60000);
beforeEach(async () => {
  await limpiarBaseDePrueba();
  organization = await ColectivoService.crearColectivo({
    nombre: "ONG de prueba",
    descripcion: "Comunidad",
    tipo: "ONG",
  });
});
afterAll(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  await desconectarBaseDePrueba();
  if (oldKey === undefined) delete process.env.ADMIN_API_KEY;
  else process.env.ADMIN_API_KEY = oldKey;
});
test("creación HTTP exige aceptar la versión vigente y registra fecha", async () => {
  const path = `/api/colectivos/${organization.id}/proyectos`;
  expect(
    (
      await req(path, {
        method: "POST",
        body: { titulo: "Proyecto", descripcion: "Descripción" },
      })
    ).status,
  ).toBe(400);
  expect(
    (
      await req(path, {
        method: "POST",
        body: {
          titulo: "Proyecto",
          descripcion: "Descripción",
          versionTerminosAceptada: "vieja",
        },
      })
    ).status,
  ).toBe(400);
  const result = await req(path, {
    method: "POST",
    body: {
      titulo: "Proyecto",
      descripcion: "Descripción",
      versionTerminosAceptada: "1.0",
    },
  });
  expect(result.status).toBe(201);
  expect(result.data.aceptacionTerminos.version).toBe("1.0");
  expect(result.data.aceptacionTerminos.fecha).toBeTruthy();
});
test("admin publica condiciones; versiones anteriores quedan pendientes de aceptación", async () => {
  const p = await create();
  expect(
    (
      await req("/api/admin/terminos", {
        method: "POST",
        body: { titulo: "Otra", contenido: "Nuevas condiciones" },
      })
    ).status,
  ).toBe(401);
  const published = await req("/api/admin/terminos", {
    method: "POST",
    admin: true,
    body: { titulo: "Nueva versión", contenido: "## Reglas\nMás detalle" },
  });
  expect(published.status).toBe(201);
  expect((await req("/api/terminos/actual")).data.version).toBe(
    published.data.version,
  );
  const state = (await req("/api/admin/terminos/estado", { admin: true })).data;
  expect(state.proyectos.find((x) => x._id === p.id).terminosVigentes).toBe(
    false,
  );
  await expect(create()).rejects.toThrow("versión vigente");
  await ProyectoService.actualizar(organization.id, p.id, {
    titulo: "Actualizado",
    versionTerminosAceptada: published.data.version,
  });
  expect(
    (await ProyectoService.obtenerPorId(p.id)).aceptacionTerminos.version,
  ).toBe(published.data.version);
});
test("suspender y rehabilitar proyecto conserva datos y aplica a lecturas, postulaciones y RSS", async () => {
  const p = await create({ titulo: "Proyecto suspendible" });
  await ColaboracionModel.create({
    proyectoId: p.id,
    perfilId: "perfil",
    colaboradoraId: "persona",
  });
  const decision = {
    recurso: "proyectos",
    recursoId: p.id,
    suspendido: true,
    motivo: "Incumplimiento documentado",
  };
  expect(
    (
      await req("/api/admin/terminos/revisiones", {
        method: "POST",
        admin: true,
        body: decision,
      })
    ).status,
  ).toBe(200);
  expect(await ProyectoModel.exists({ _id: p.id })).toBeTruthy();
  expect(await ColaboracionModel.countDocuments({ proyectoId: p.id })).toBe(1);
  expect((await req("/api/proyectos")).data).toHaveLength(0);
  expect((await req("/api/proyectos/" + p.id)).status).toBe(400);
  const pending = await PostulacionModel.create({
    proyectoId: p.id,
    perfilId: "perfil-nuevo",
    colaboradoraId: "otra-persona",
  });
  await expect(
    PostulacionService.cambiarEstadoPostulacion(pending.id, "ACEPTADA"),
  ).rejects.toThrow("suspendido");
  expect((await PostulacionModel.findById(pending.id)).estado).toBe(
    "PENDIENTE",
  );

  expect(
    (
      await req(`/api/proyectos/${p.id}/postularse`, {
        method: "POST",
        body: { colaboradoraId: "persona" },
      })
    ).status,
  ).toBe(400);
  expect((await req("/api/rss/proyectos.xml")).text).not.toContain(
    "Proyecto suspendible",
  );
  await req("/api/admin/terminos/revisiones", {
    method: "POST",
    admin: true,
    body: {
      ...decision,
      suspendido: false,
      motivo: "Incumplimiento subsanado",
    },
  });
  expect((await req("/api/proyectos")).data).toHaveLength(1);
  expect(await RevisionTerminosModel.countDocuments()).toBe(2);
});
test("suspensión de colectivo oculta sus proyectos y no borra la organización", async () => {
  await create();
  await TerminosService.revisar({
    recurso: "colectivos",
    recursoId: organization.id,
    suspendido: true,
    motivo: "Proyecto con fines de lucro",
  });
  expect(await ColectivoModel.exists({ _id: organization.id })).toBeTruthy();
  expect(await ColectivoService.listar()).toHaveLength(0);
  expect(await ProyectoService.listar()).toHaveLength(0);
  expect((await req("/api/rss/colectivos.xml")).text).not.toContain(
    "ONG de prueba",
  );
});
test("huella valida usos, persiste cambios y prioriza sin IA sobre uso o falta de declaración", async () => {
  await expect(create({ requiereIA: true, usosIA: [] })).rejects.toThrow(
    "al menos un uso",
  );
  const usage = {
    descripcion: "Documentación",
    justificacion: "Asistencia a voluntarios",
    grado: "BAJO",
  };
  await expect(create({ requiereIA: false, usosIA: [usage] })).rejects.toThrow(
    "sólo pueden",
  );
  const ia = await create({
    titulo: "Con IA",
    requiereIA: true,
    usosIA: [usage],
  });
  await create({ titulo: "No declarado" });
  const sin = await create({ titulo: "Sin IA", requiereIA: false });
  const list = await ProyectoService.listar();
  expect(list.map((p) => p.titulo)).toEqual([
    "Sin IA",
    "Con IA",
    "No declarado",
  ]);
  expect(
    (await ProyectoService.obtenerPorId(ia.id)).usosIA[0].justificacion,
  ).toBe(usage.justificacion);
  await ProyectoService.actualizar(organization.id, sin.id, {
    descripcion: "Cambio textual",
    versionTerminosAceptada: "1.0",
  });
  expect((await ProyectoService.obtenerPorId(sin.id)).requiereIA).toBe(false);
  const path = `/api/colectivos/${organization.id}/proyectos`;
  expect(
    (
      await req(path, {
        method: "POST",
        body: {
          titulo: "Mal uso",
          descripcion: "Mal grado",
          versionTerminosAceptada: "1.0",
          requiereIA: true,
          usosIA: [{ ...usage, grado: "EXTREMO" }],
        },
      })
    ).status,
  ).toBe(400);
});
test("RSS es XML público, escapa contenido y genera links y GUID estables", async () => {
  const p = await create({
    titulo: "Agua & <software>",
    descripcion: 'Descripción con <script> y "comillas"',
  });
  const feed = await req("/api/rss/proyectos.xml");
  expect(feed.status).toBe(200);
  expect(feed.headers.get("content-type")).toContain("application/rss+xml");
  expect(feed.text).toContain("Agua &amp; &lt;software&gt;");
  expect(feed.text).not.toContain("<script>");
  expect(feed.text).toContain(`urn:codigo-a-voluntad:proyectos:${p.id}`);
  expect(feed.text).toContain(`#proyectos/${p.id}`);
  expect(feed.text).toContain("<pubDate>");
  expect(feed.text).not.toContain("mediosContacto");
  expect((await req("/api/rss/colectivos.xml")).text).toContain(
    "ONG de prueba",
  );
});
test("límite público responde 429 y Retry-After al exceder la cuota", async () => {
  expect((await req("/limite")).status).toBe(200);
  expect((await req("/limite")).status).toBe(200);
  const blocked = await req("/limite");
  expect(blocked.status).toBe(429);
  expect(Number(blocked.headers.get("retry-after"))).toBeGreaterThan(0);
  expect((await req("/limite", { method: "POST", body: {} })).status).toBe(429);
  expect(blocked.headers.get("ratelimit")).toBeTruthy();
});

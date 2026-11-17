import { beforeAll, beforeEach, afterAll, test, expect } from "@jest/globals";
import { crearApp } from "../../src/app.js";
import {
  HabilidadModel,
  ColaboracionModel,
  DenunciaModel,
} from "../../src/models/indexModel.js";
import {
  conectarBaseDePrueba,
  limpiarBaseDePrueba,
  desconectarBaseDePrueba,
} from "../helpers/baseDePrueba.js";

let server, url;
const password = "Una-clave-larga-123";
const adminKey = "k".repeat(40);
const claveAnterior = process.env.ADMIN_API_KEY;
const idInexistente = "000000000000000000000000";

async function req(path, { method = "GET", body, cookie, admin } = {}) {
  const response = await fetch(url + "/api" + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
      ...(admin ? { Authorization: "Bearer " + adminKey } : {}),
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

const org = (email) =>
  req("/auth/registro", {
    method: "POST",
    body: {
      email,
      password,
      tipo: "colectivos",
      perfil: { nombre: email, descripcion: "Causa comunitaria", tipo: "ONG" },
    },
  });

const person = (email) =>
  req("/auth/registro", {
    method: "POST",
    body: {
      email,
      password,
      tipo: "colaboradoras",
      perfil: {
        nombreFantasia: "Colaboradora",
        github: "cami",
        habilidades: ["react"],
      },
    },
  });

const crearProyecto = async (colectivo) =>
  (
    await req(`/colectivos/${colectivo.data.actor.id}/proyectos`, {
      method: "POST",
      cookie: colectivo.cookie,
      body: {
        titulo: "Proyecto",
        descripcion: "Software abierto",
        versionTerminosAceptada: "1.0",
        perfiles: [
          {
            descripcionPerfil: "Frontend",
            habilidadesRequeridas: ["react"],
            habilidadesOpcionales: [],
            compromiso: { cantidadHoras: 5, tipo: "SEMANALES" },
            modalidad: {
              gratuita: true,
              incentivoEconomico: false,
              contratacionEventual: false,
            },
            cantidadLimite: 5,
            fechaLimite: null,
          },
        ],
      },
    })
  ).data;

const postular = (proyecto, colaboradora, anonimidad = false) =>
  req(`/proyectos/${proyecto.id}/postularse`, {
    method: "POST",
    cookie: colaboradora.cookie,
    body: {
      colaboradoraId: colaboradora.data.actor.id,
      perfilId: proyecto.perfiles[0].id,
      anonimidad,
    },
  });

const decidir = (colectivo, proyecto, postulacionId, estado) =>
  req(
    `/colectivos/${colectivo.data.actor.id}/proyectos/${proyecto.id}/postulaciones/${postulacionId}`,
    { method: "PATCH", cookie: colectivo.cookie, body: { estado } },
  );

const participar = async (colectivo, proyecto, colaboradora, anonimidad) => {
  const postulacion = await postular(proyecto, colaboradora, anonimidad);
  expect(postulacion.status).toBe(200);
  expect((await decidir(colectivo, proyecto, postulacion.data.id, "ACEPTADA")).status).toBe(200);
};

const denunciar = (cookie, tipoEntidadDenunciada, entidadDenunciadaId) =>
  req("/denuncias", {
    method: "POST",
    cookie,
    body: {
      tipoEntidadDenunciada,
      entidadDenunciadaId,
      motivo: "Acoso o discurso de odio",
      descripcion: "Descripción suficientemente larga de lo ocurrido.",
    },
  });

beforeAll(async () => {
  process.env.ADMIN_API_KEY = adminKey;
  await conectarBaseDePrueba();
  const app = crearApp();
  await new Promise((resolve) => {
    server = app.listen(0, "127.0.0.1", resolve);
  });
  url = `http://127.0.0.1:${server.address().port}`;
}, 60000);

beforeEach(async () => {
  await limpiarBaseDePrueba();
  await HabilidadModel.create({
    codigo: "react",
    titulo: "React",
    descripcion: "Interfaces",
  });
});

afterAll(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  await desconectarBaseDePrueba();
  if (claveAnterior === undefined) delete process.env.ADMIN_API_KEY;
  else process.env.ADMIN_API_KEY = claveAnterior;
});

test("una participante actual puede denunciar al colectivo", async () => {
  const a = await org("den-actual@example.com");
  const c = await person("den-actual-c@example.com");
  await participar(a, await crearProyecto(a), c);

  const r = await denunciar(c.cookie, "colectivo", a.data.actor.id);

  expect(r.status).toBe(201);
  const guardada = await DenunciaModel.findOne();
  expect(guardada.denunciantePerfilId).toBe(c.data.actor.id);
  expect(String(guardada.entidadDenunciadaId)).toBe(a.data.actor.id);
});

test("una participante pasada, dada de baja, puede denunciar", async () => {
  const a = await org("den-pasada@example.com");
  const c = await person("den-pasada-c@example.com");
  const p = await crearProyecto(a);
  await participar(a, p, c);
  await req(`/colaboradoras/${c.data.actor.id}/proyectos/${p.id}/baja`, {
    method: "DELETE",
    cookie: c.cookie,
  });
  expect((await ColaboracionModel.findOne()).estado).toBe("TERMINADA");

  expect((await denunciar(c.cookie, "colectivo", a.data.actor.id)).status).toBe(201);
});

test("la participación anónima también habilita a denunciar", async () => {
  const a = await org("den-anonima@example.com");
  const c = await person("den-anonima-c@example.com");
  await participar(a, await crearProyecto(a), c, true);

  expect((await denunciar(c.cookie, "colectivo", a.data.actor.id)).status).toBe(201);
});

test("una postulación pendiente o rechazada no acredita participación", async () => {
  const a = await org("den-postulacion@example.com");
  const pendiente = await person("den-pendiente@example.com");
  const rechazada = await person("den-rechazada@example.com");
  const p = await crearProyecto(a);
  await postular(p, pendiente);
  const aRechazar = await postular(p, rechazada);
  await decidir(a, p, aRechazar.data.id, "RECHAZADA");

  expect((await denunciar(pendiente.cookie, "colectivo", a.data.actor.id)).status).toBe(403);
  expect((await denunciar(rechazada.cookie, "colectivo", a.data.actor.id)).status).toBe(403);
  expect(await DenunciaModel.countDocuments()).toBe(0);
});

test("participar con otro colectivo no habilita a denunciar a este", async () => {
  const a = await org("den-colectivo-a@example.com");
  const b = await org("den-colectivo-b@example.com");
  const c = await person("den-otro-c@example.com");
  await participar(b, await crearProyecto(b), c);

  expect((await denunciar(c.cookie, "colectivo", b.data.actor.id)).status).toBe(201);
  expect((await denunciar(c.cookie, "colectivo", a.data.actor.id)).status).toBe(403);
});

test("para denunciar un proyecto hay que haber participado en ese proyecto", async () => {
  const a = await org("den-proyecto@example.com");
  const c = await person("den-proyecto-c@example.com");
  const p1 = await crearProyecto(a);
  const p2 = await crearProyecto(a);
  await participar(a, p1, c);

  expect((await denunciar(c.cookie, "proyecto", p1.id)).status).toBe(201);
  expect((await denunciar(c.cookie, "proyecto", p2.id)).status).toBe(403);
  // al colectivo sí puede denunciarlo: participó en uno de sus proyectos
  expect((await denunciar(c.cookie, "colectivo", a.data.actor.id)).status).toBe(201);
});

test("errores: sin sesión 401, ajena 403, colectivo 403 y entidad inexistente 404", async () => {
  // se reutilizan las mismas cuentas: el registro tiene un límite de 20 por proceso
  const a = await org("den-errores@example.com");
  const ajena = await person("den-errores-c@example.com");
  const p = await crearProyecto(a);

  expect((await denunciar(undefined, "colectivo", a.data.actor.id)).status).toBe(401);
  // una persona ajena que solo conoce el id no puede denunciar
  expect((await denunciar(ajena.cookie, "colectivo", a.data.actor.id)).status).toBe(403);
  expect((await denunciar(ajena.cookie, "proyecto", p.id)).status).toBe(403);
  // un colectivo no puede denunciar: solo participantes
  expect((await denunciar(a.cookie, "colectivo", a.data.actor.id)).status).toBe(403);
  expect((await denunciar(ajena.cookie, "colectivo", idInexistente)).status).toBe(404);
  expect((await denunciar(ajena.cookie, "proyecto", idInexistente)).status).toBe(404);
  expect(await DenunciaModel.countDocuments()).toBe(0);
});

test("el listado y la revisión son solo de administración", async () => {
  const a = await org("den-admin@example.com");
  const c = await person("den-admin-c@example.com");
  await participar(a, await crearProyecto(a), c);
  const creada = await denunciar(c.cookie, "colectivo", a.data.actor.id);

  // una cuenta común, aunque haya denunciado, no puede listar ni resolver
  expect((await req("/admin/denuncias", { cookie: c.cookie })).status).toBe(401);
  expect(
    (
      await req(`/admin/denuncias/${creada.data._id}/estado`, {
        method: "PATCH",
        cookie: c.cookie,
        body: { estado: "resuelta" },
      })
    ).status,
  ).toBe(401);

  const listado = await req("/admin/denuncias", { admin: true });
  expect(listado.status).toBe(200);
  expect(listado.data).toHaveLength(1);
  const revision = await req(`/admin/denuncias/${creada.data._id}/estado`, {
    method: "PATCH",
    admin: true,
    body: { estado: "resuelta" },
  });
  expect(revision.status).toBe(200);
  expect(revision.data.estado).toBe("resuelta");
});

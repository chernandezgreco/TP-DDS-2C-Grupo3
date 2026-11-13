import { beforeAll, beforeEach, afterAll, test, expect } from "@jest/globals";
import { crearApp } from "../../src/app.js";
import { CuentaModel, SesionModel } from "../../src/models/AuthModel.js";
import {
  HabilidadModel,
  ColaboracionModel,
  ProyectoModel,
  PostulacionModel,
} from "../../src/models/indexModel.js";
import {
  conectarBaseDePrueba,
  limpiarBaseDePrueba,
  desconectarBaseDePrueba,
} from "../helpers/baseDePrueba.js";
let server, url;
const password = "Una-clave-larga-123";
async function req(path, { method = "GET", body, cookie, origin } = {}) {
  const response = await fetch(url + "/api" + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
      ...(origin ? { Origin: origin } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  return {
    status: response.status,
    data: text ? JSON.parse(text) : null,
    cookie: response.headers.get("set-cookie")?.split(";")[0],
    headers: response.headers,
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
const createProject = async (organization) =>
  (
    await req(`/colectivos/${organization.data.actor.id}/proyectos`, {
      method: "POST",
      cookie: organization.cookie,
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
            cantidadLimite: 1,
            fechaLimite: null,
          },
        ],
      },
    })
  ).data;
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
  await HabilidadModel.create({
    codigo: "react",
    titulo: "React",
    descripcion: "Interfaces",
  });
});
afterAll(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  await desconectarBaseDePrueba();
});
test("registro crea sesión HttpOnly y guarda hash, no contraseña ni token en claro", async () => {
  const a = await org("uno@example.com");
  expect(a.status).toBe(201);
  expect(a.cookie).toContain("cav_session=");
  expect(a.headers.get("set-cookie")).toContain("HttpOnly");
  const saved = await CuentaModel.findOne({ email: "uno@example.com" }).select(
    "+passwordHash",
  );
  expect(saved.passwordHash).not.toBe(password);
  expect(saved.passwordHash).toHaveLength(128);
  const session = await SesionModel.findOne();
  expect(a.cookie).not.toContain(session.tokenHash);
  expect((await req("/auth/sesion", { cookie: a.cookie })).data.actor.id).toBe(
    a.data.actor.id,
  );
  expect((await req("/auth/sesion")).data.actor).toBeNull();
});
test("login verifica credenciales, normaliza correo y logout invalida la sesión", async () => {
  const a = await org("login@example.com");
  expect(
    (
      await req("/auth/login", {
        method: "POST",
        body: { email: "login@example.com", password: "Clave-incorrecta" },
      })
    ).status,
  ).toBe(401);
  const login = await req("/auth/login", {
    method: "POST",
    body: { email: "LOGIN@example.com", password },
  });
  expect(login.status).toBe(200);
  expect(
    (await req("/auth/logout", { method: "POST", cookie: login.cookie }))
      .status,
  ).toBe(204);
  expect(
    (await req("/auth/sesion", { cookie: login.cookie })).data.actor,
  ).toBeNull();
  expect(a.data).not.toHaveProperty("passwordHash");
});
test("rutas privadas rechazan visitantes y otros colectivos aunque conozcan los ids", async () => {
  const a = await org("propietario@example.com"),
    b = await org("otro@example.com");
  const p = await createProject(a);
  const path = `/colectivos/${a.data.actor.id}/proyectos/${p.id}`;
  expect(
    (
      await req(path, {
        method: "PUT",
        body: { titulo: "Ataque", versionTerminosAceptada: "1.0" },
      })
    ).status,
  ).toBe(401);
  expect(
    (
      await req(path, {
        method: "PUT",
        cookie: b.cookie,
        body: { titulo: "Ataque", versionTerminosAceptada: "1.0" },
      })
    ).status,
  ).toBe(403);
  expect(
    (
      await req(path, {
        method: "PUT",
        cookie: a.cookie,
        origin: "https://sitio-ajeno.example",
        body: { titulo: "Ataque", versionTerminosAceptada: "1.0" },
      })
    ).status,
  ).toBe(403);
  expect((await ProyectoModel.findById(p.id)).titulo).toBe("Proyecto");
});
test("postulación anónima conserva identidad interna, contactos requieren aceptación y baja elimina acceso", async () => {
  const a = await org("contactos@example.com"),
    c = await person("persona@example.com");
  const p = await createProject(a);
  const cid = c.data.actor.id;
  expect(
    (
      await req(`/colaboradoras/${cid}/medios-contacto`, {
        method: "POST",
        cookie: c.cookie,
        body: { tipo: "EMAIL", valor: "privado@example.com" },
      })
    ).status,
  ).toBe(201);
  expect(
    (await req(`/colaboradoras/${cid}/contactos`, { cookie: a.cookie })).status,
  ).toBe(403);
  expect(
    (
      await req(`/colaboradoras/${cid}/medios-contacto`, {
        method: "PUT",
        cookie: c.cookie,
        body: {
          mediosContacto: [{ tipo: "EMAIL", valor: "editado@example.com" }],
        },
      })
    ).status,
  ).toBe(200);
  expect(
    (await req(`/colaboradoras/${cid}/contactos`, { cookie: c.cookie })).data[0]
      .valor,
  ).toBe("editado@example.com");

  const post = await req(`/proyectos/${p.id}/postularse`, {
    method: "POST",
    cookie: c.cookie,
    body: { colaboradoraId: cid, perfilId: p.perfiles[0].id, anonimidad: true },
  });
  expect(post.status).toBe(200);
  expect((await PostulacionModel.findById(post.data.id)).colaboradoraId).toBe(
    cid,
  );
  const accepted = await req(
    `/colectivos/${a.data.actor.id}/proyectos/${p.id}/postulaciones/${post.data.id}`,
    { method: "PATCH", cookie: a.cookie, body: { estado: "ACEPTADA" } },
  );
  expect(accepted.status).toBe(200);
  const contacts = await req(`/colaboradoras/${cid}/contactos`, {
    cookie: a.cookie,
  });
  expect(contacts.status).toBe(200);
  expect(contacts.data[0].valor).toBe("editado@example.com");
  const publicList = await req("/colaboraciones");
  expect(publicList.data[0].colaboradoraId).toBe("Anonimo");
  expect((await req(`/proyectos/${p.id}/colaboradoras`)).data).toHaveLength(0);
  expect(
    (await req("/mi/postulaciones", { cookie: c.cookie })).data[0].estado,
  ).toBe("ACEPTADA");
  expect(
    (
      await req(`/colaboradoras/${cid}/proyectos/${p.id}/baja`, {
        method: "DELETE",
        cookie: c.cookie,
      })
    ).status,
  ).toBe(200);
  expect(await ColaboracionModel.countDocuments({ proyectoId: p.id })).toBe(0);
  expect(
    (await req(`/colaboradoras/${cid}/contactos`, { cookie: a.cookie })).status,
  ).toBe(403);
});
test("el cupo limita aceptaciones y no la cantidad de postulaciones pendientes", async () => {
  const a = await org("cupos@example.com"),
    c = await person("cupo1@example.com"),
    d = await person("cupo2@example.com");
  const p = await createProject(a);
  const posts = [];
  for (const candidate of [c, d]) {
    const r = await req(`/proyectos/${p.id}/postularse`, {
      method: "POST",
      cookie: candidate.cookie,
      body: {
        colaboradoraId: candidate.data.actor.id,
        perfilId: p.perfiles[0].id,
      },
    });
    expect(r.status).toBe(200);
    posts.push(r.data.id);
  }
  const path = (id) =>
    `/colectivos/${a.data.actor.id}/proyectos/${p.id}/postulaciones/${id}`;
  const responses = await Promise.all(
    posts.map((id) =>
      req(path(id), {
        method: "PATCH",
        cookie: a.cookie,
        body: { estado: "ACEPTADA" },
      }),
    ),
  );
  expect(responses.map((r) => r.status).sort()).toEqual([200, 409]);
  expect(await ColaboracionModel.countDocuments({ proyectoId: p.id })).toBe(1);
});

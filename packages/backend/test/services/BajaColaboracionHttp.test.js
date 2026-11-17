import { beforeAll, beforeEach, afterAll, test, expect } from "@jest/globals";
import { crearApp } from "../../src/app.js";
import {
  HabilidadModel,
  ColaboracionModel,
} from "../../src/models/indexModel.js";
import {
  conectarBaseDePrueba,
  limpiarBaseDePrueba,
  desconectarBaseDePrueba,
} from "../helpers/baseDePrueba.js";

let server, url;
const password = "Una-clave-larga-123";

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

const crearProyecto = async (colectivo, cantidadLimite = 1) =>
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
            cantidadLimite,
            fechaLimite: null,
          },
        ],
      },
    })
  ).data;

// la colaboradora se postula y el colectivo la acepta: devuelve el id de la colaboración creada
const aceptar = async (colectivo, proyecto, colaboradora, anonimidad = false) => {
  const postulacion = await req(`/proyectos/${proyecto.id}/postularse`, {
    method: "POST",
    cookie: colaboradora.cookie,
    body: {
      colaboradoraId: colaboradora.data.actor.id,
      perfilId: proyecto.perfiles[0].id,
      anonimidad,
    },
  });
  expect(postulacion.status).toBe(200);
  const decision = await req(
    `/colectivos/${colectivo.data.actor.id}/proyectos/${proyecto.id}/postulaciones/${postulacion.data.id}`,
    { method: "PATCH", cookie: colectivo.cookie, body: { estado: "ACEPTADA" } },
  );
  expect(decision.status).toBe(200);
  return (
    await ColaboracionModel.findOne({
      proyectoId: proyecto.id,
      colaboradoraId: colaboradora.data.actor.id,
    })
  ).id;
};

const bajaDelColectivo = (colectivo, colaboracionId) =>
  req(`/colectivos/colaboraciones/${colaboracionId}`, {
    method: "DELETE",
    cookie: colectivo.cookie,
  });

const bajaPersonal = (colaboradora, proyectoId) =>
  req(
    `/colaboradoras/${colaboradora.data.actor.id}/proyectos/${proyectoId}/baja`,
    { method: "DELETE", cookie: colaboradora.cookie },
  );

const contactos = (colectivo, colaboradora) =>
  req(`/colaboradoras/${colaboradora.data.actor.id}/contactos`, {
    cookie: colectivo.cookie,
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

test("la baja del colectivo conserva el registro como historial y corta el acceso a contactos", async () => {
  const a = await org("baja-colectivo@example.com");
  const c = await person("baja-colectivo-c@example.com");
  const p = await crearProyecto(a);
  const colaboracionId = await aceptar(a, p, c);
  expect((await contactos(a, c)).status).toBe(200);

  expect((await bajaDelColectivo(a, colaboracionId)).status).toBe(200);

  const doc = await ColaboracionModel.findById(colaboracionId);
  expect(doc.estado).toBe("TERMINADA");
  expect(doc.fechaBaja).toBeInstanceOf(Date);
  expect((await contactos(a, c)).status).toBe(403);
});

test("la baja de la colaboradora conserva el registro y no cuenta como activa", async () => {
  const a = await org("baja-personal@example.com");
  const c = await person("baja-personal-c@example.com");
  const p = await crearProyecto(a);
  const colaboracionId = await aceptar(a, p, c);

  expect((await bajaPersonal(c, p.id)).status).toBe(200);

  expect((await ColaboracionModel.findById(colaboracionId)).estado).toBe(
    "TERMINADA",
  );
  // ya no ocupa el perfil
  expect((await req(`/proyectos/${p.id}/colaboradoras`)).data).toHaveLength(0);
  // no queda nada activo de lo que darse de baja
  expect((await bajaPersonal(c, p.id)).status).toBe(404);
});

test("el listado muestra solo las activas y el historial se pide por estado", async () => {
  const a = await org("listado@example.com");
  const c = await person("listado-c@example.com");
  const p = await crearProyecto(a);
  const colaboracionId = await aceptar(a, p, c);
  expect((await req("/colaboraciones")).data).toHaveLength(1);

  await bajaDelColectivo(a, colaboracionId);

  expect((await req("/colaboraciones")).data).toHaveLength(0);
  const historial = await req("/colaboraciones?estado=TERMINADA");
  expect(historial.data).toHaveLength(1);
  expect(historial.data[0].estado).toBe("TERMINADA");
  expect(historial.data[0].proyectoId).toBe(p.id);
  expect((await req("/colaboraciones?estado=TODAS")).data).toHaveLength(1);
  expect((await req("/colaboraciones?estado=INVENTADO")).status).toBe(400);
});

test("el historial respeta la anonimidad frente a terceros", async () => {
  const a = await org("anonimo@example.com");
  const c = await person("anonimo-c@example.com");
  const p = await crearProyecto(a);
  const colaboracionId = await aceptar(a, p, c, true);
  await bajaPersonal(c, p.id);

  const visitante = await req("/colaboraciones?estado=TERMINADA");
  expect(visitante.data[0].colaboradoraId).toBe("Anonimo");
  const propietario = await req("/colaboraciones?estado=TERMINADA", {
    cookie: a.cookie,
  });
  expect(propietario.data[0].colaboradoraId).toBe(c.data.actor.id);
  expect((await ColaboracionModel.findById(colaboracionId)).colaboradoraId).toBe(
    c.data.actor.id,
  );
});

test("una baja repetida es un conflicto y no reactiva la colaboración", async () => {
  const a = await org("repetida@example.com");
  const c = await person("repetida-c@example.com");
  const p = await crearProyecto(a);
  const colaboracionId = await aceptar(a, p, c);

  expect((await bajaDelColectivo(a, colaboracionId)).status).toBe(200);
  expect((await bajaDelColectivo(a, colaboracionId)).status).toBe(409);
  expect((await ColaboracionModel.findById(colaboracionId)).estado).toBe(
    "TERMINADA",
  );
});

test("un tercero no puede dar de baja una colaboración ajena", async () => {
  const a = await org("duenio@example.com");
  const otro = await org("otro-colectivo@example.com");
  const c = await person("ajena-c@example.com");
  const intrusa = await person("ajena-intrusa@example.com");
  const p = await crearProyecto(a);
  const colaboracionId = await aceptar(a, p, c);

  expect((await bajaDelColectivo(otro, colaboracionId)).status).toBe(403);
  expect(
    (
      await req(`/colectivos/colaboraciones/${colaboracionId}`, {
        method: "DELETE",
        cookie: intrusa.cookie,
      })
    ).status,
  ).toBe(403);
  // la colaboradora ajena tampoco puede bajar a otra por su ruta personal
  expect(
    (
      await req(`/colaboradoras/${c.data.actor.id}/proyectos/${p.id}/baja`, {
        method: "DELETE",
        cookie: intrusa.cookie,
      })
    ).status,
  ).toBe(403);
  expect((await ColaboracionModel.findById(colaboracionId)).estado).toBe(
    "ACTIVA",
  );
});

test("una colaboración dada de baja libera el cupo", async () => {
  const a = await org("cupo@example.com");
  const c = await person("cupo-1@example.com");
  const d = await person("cupo-2@example.com");
  const p = await crearProyecto(a, 1);
  const postular = (colaboradora) =>
    req(`/proyectos/${p.id}/postularse`, {
      method: "POST",
      cookie: colaboradora.cookie,
      body: {
        colaboradoraId: colaboradora.data.actor.id,
        perfilId: p.perfiles[0].id,
      },
    });
  const decidir = (postulacionId) =>
    req(
      `/colectivos/${a.data.actor.id}/proyectos/${p.id}/postulaciones/${postulacionId}`,
      { method: "PATCH", cookie: a.cookie, body: { estado: "ACEPTADA" } },
    );
  // las dos se postulan con el cupo todavía libre; el cupo limita las aceptaciones
  const primera = await postular(c);
  const segunda = await postular(d);
  expect(primera.status).toBe(200);
  expect(segunda.status).toBe(200);

  expect((await decidir(primera.data.id)).status).toBe(200);
  expect((await decidir(segunda.data.id)).status).toBe(409);

  const colaboracion = await ColaboracionModel.findOne({ proyectoId: p.id });
  await bajaDelColectivo(a, colaboracion.id);

  expect((await decidir(segunda.data.id)).status).toBe(200);
  expect(
    await ColaboracionModel.countDocuments({
      proyectoId: p.id,
      estado: "ACTIVA",
    }),
  ).toBe(1);
});

test("el acceso a contactos se conserva solo mientras haya otra colaboración activa con ese colectivo", async () => {
  const a = await org("dos-proyectos@example.com");
  const c = await person("dos-proyectos-c@example.com");
  const p1 = await crearProyecto(a);
  const p2 = await crearProyecto(a);
  const colab1 = await aceptar(a, p1, c);
  await aceptar(a, p2, c);

  await bajaDelColectivo(a, colab1);
  expect((await contactos(a, c)).status).toBe(200);

  await bajaPersonal(c, p2.id);
  expect((await contactos(a, c)).status).toBe(403);
});

import { beforeAll, beforeEach, afterAll, describe, test, expect } from "@jest/globals";
import { crearApp } from "../../src/app.js";
import { HabilidadModel, ColaboracionModel, ProyectoModel, TareaModel } from "../../src/models/indexModel.js";
import { conectarBaseDePrueba, desconectarBaseDePrueba } from "../helpers/baseDePrueba.js";

let server, url;
const password = "Una-clave-larga-123";

async function req(path, { method = "GET", body, cookie } = {}) {
    const response = await fetch(url + "/api" + path, {
        method,
        headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
        body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await response.text();
    return {
        status: response.status,
        data: text ? JSON.parse(text) : null,
        cookie: response.headers.get("set-cookie")?.split(";")[0],
    };
}

const registrarColectivo = (email) =>
    req("/auth/registro", {
        method: "POST",
        body: {
            email,
            password,
            tipo: "colectivos",
            perfil: { nombre: email, descripcion: "Causa comunitaria", tipo: "ONG" },
        },
    });

const registrarColaboradora = (email) =>
    req("/auth/registro", {
        method: "POST",
        body: {
            email,
            password,
            tipo: "colaboradoras",
            perfil: { nombreFantasia: "Colaboradora", github: "cami", habilidades: ["react"] },
        },
    });

const crearProyecto = async (colectivo) =>
    (
        await req(`/colectivos/${colectivo.data.actor.id}/proyectos`, {
            method: "POST",
            cookie: colectivo.cookie,
            body: { titulo: "Proyecto", descripcion: "Software abierto", versionTerminosAceptada: "1.0" },
        })
    ).data;

const tarea = (cambios = {}) => ({
    nombre: "Diseñar pantallas",
    descripcion: "Mockups",
    fechaInicio: "2026-11-02",
    fechaFin: "2026-11-06",
    ...cambios,
});

describe("API de tareas", () => {
    let dueno, otro, persona, personaId, proyecto, base;

    beforeAll(async () => {
        // el límite de tasa público (120 por minuto) se agotaría con tantas pruebas seguidas
        process.env.PUBLIC_RATE_LIMIT = "100000";
        await conectarBaseDePrueba();
        await new Promise((resolve) => {
            server = crearApp().listen(0, "127.0.0.1", resolve);
        });
        url = `http://127.0.0.1:${server.address().port}`;

        // el registro tiene su propio límite (20 por 15 minutos): las cuentas se crean una sola vez para todas las pruebas
        await HabilidadModel.create({ codigo: "react", titulo: "React", descripcion: "Interfaces" });
        dueno = await registrarColectivo("dueno@example.com");
        otro = await registrarColectivo("otro@example.com");
        persona = await registrarColaboradora("persona@example.com");
        personaId = persona.data.actor.id;
    }, 60000);

    beforeEach(async () => {
        await Promise.all([ProyectoModel.deleteMany({}), TareaModel.deleteMany({}), ColaboracionModel.deleteMany({})]);
        proyecto = await crearProyecto(dueno);
        base = `/proyectos/${proyecto.id}/tareas`;
    });

    afterAll(async () => {
        delete process.env.PUBLIC_RATE_LIMIT;
        if (server) await new Promise((resolve) => server.close(resolve));
        await desconectarBaseDePrueba();
    });

    const crear = (cambios, cookie = dueno.cookie) => req(base, { method: "POST", cookie, body: tarea(cambios) });

    describe("permisos", () => {
        test("cualquiera puede ver las tareas, sin iniciar sesión", async () => {
            await crear();

            const lista = await req(base);
            const una = await req(`${base}/${lista.data[0].id}`);

            expect(lista.status).toBe(200);
            expect(lista.data).toHaveLength(1);
            expect(una.status).toBe(200);
        });

        test("un visitante no puede crear, editar ni borrar", async () => {
            const creada = (await crear()).data;

            expect((await req(base, { method: "POST", body: tarea() })).status).toBe(401);
            expect((await req(`${base}/${creada.id}`, { method: "PUT", body: { nombre: "Ataque" } })).status).toBe(401);
            expect((await req(`${base}/${creada.id}`, { method: "DELETE" })).status).toBe(401);
            expect((await TareaModel.findById(creada.id)).nombre).toBe("Diseñar pantallas");
        });

        test("otro colectivo no puede crear, editar ni borrar", async () => {
            const creada = (await crear()).data;

            expect((await crear({}, otro.cookie)).status).toBe(403);
            expect((await req(`${base}/${creada.id}`, { method: "PUT", cookie: otro.cookie, body: { nombre: "Ataque" } })).status).toBe(403);
            expect((await req(`${base}/${creada.id}`, { method: "DELETE", cookie: otro.cookie })).status).toBe(403);
            expect(await TareaModel.countDocuments()).toBe(1);
        });

        test("una colaboradora no puede modificar tareas", async () => {
            expect((await crear({}, persona.cookie)).status).toBe(403);
        });

        test("el dueño de un proyecto no puede tocar una tarea de otro proyecto usando el id del suyo", async () => {
            const proyectoAjeno = await crearProyecto(otro);
            const ajena = (
                await req(`/proyectos/${proyectoAjeno.id}/tareas`, { method: "POST", cookie: otro.cookie, body: tarea({ nombre: "Ajena" }) })
            ).data;

            const intento = await req(`${base}/${ajena.id}`, { method: "PUT", cookie: dueno.cookie, body: { nombre: "Pisada" } });
            const borrado = await req(`${base}/${ajena.id}`, { method: "DELETE", cookie: dueno.cookie });

            expect(intento.status).toBe(404);
            expect(borrado.status).toBe(404);
            expect((await TareaModel.findById(ajena.id)).nombre).toBe("Ajena");
        });
    });

    describe("crear", () => {
        test("responde 201 con la tarea: fechas como día, duración y estado pendiente", async () => {
            const respuesta = await crear();

            expect(respuesta.status).toBe(201);
            expect(respuesta.data).toMatchObject({
                proyectoId: proyecto.id,
                nombre: "Diseñar pantallas",
                fechaInicio: "2026-11-02",
                fechaFin: "2026-11-06",
                duracion: 5,
                responsableId: null,
                estado: "PENDIENTE",
            });
            expect(respuesta.data.id).toEqual(expect.any(String));
        });

        test("ignora el estado que venga en el pedido", async () => {
            expect((await crear({ estado: "FINALIZADA" })).data.estado).toBe("PENDIENTE");
        });

        test("un responsable vacío significa sin responsable", async () => {
            const respuesta = await crear({ responsableId: "" });

            expect(respuesta.status).toBe(201);
            expect(respuesta.data.responsableId).toBeNull();
        });

        test.each([
            ["sin nombre", { nombre: undefined }],
            ["nombre vacío", { nombre: "   " }],
            ["sin fecha de inicio", { fechaInicio: undefined }],
            ["fecha inexistente", { fechaInicio: "2026-02-30" }],
            ["fecha con otro formato", { fechaInicio: "02/11/2026" }],
            ["fecha con hora", { fechaFin: "2026-11-06T10:00:00Z" }],
            ["fin anterior al inicio", { fechaInicio: "2026-11-10", fechaFin: "2026-11-01" }],
            ["fecha fuera de rango", { fechaInicio: "1999-01-01", fechaFin: "1999-01-02" }],
            ["responsable que no colabora", { responsableId: "507f1f77bcf86cd799439011" }],
        ])("rechaza con 400 un pedido con %s", async (_caso, cambios) => {
            const respuesta = await crear(cambios);

            expect(respuesta.status).toBe(400);
            expect(respuesta.data.error).toEqual(expect.any(String));
            expect(await TareaModel.countDocuments()).toBe(0);
        });

        test("un proyecto inexistente no es de ningún colectivo: se rechaza con 403", async () => {
            const respuesta = await req("/proyectos/507f1f77bcf86cd799439011/tareas", {
                method: "POST",
                cookie: dueno.cookie,
                body: tarea(),
            });

            expect(respuesta.status).toBe(403);
        });

        test("pedir las tareas de un proyecto inexistente responde 404", async () => {
            expect((await req("/proyectos/507f1f77bcf86cd799439011/tareas")).status).toBe(404);
            expect((await req("/proyectos/no-es-un-id/tareas")).status).toBe(404);
        });
    });

    describe("sanitización de textos", () => {
        test("el nombre y la descripción se guardan sin etiquetas HTML, como en el resto de los recursos", async () => {
            const respuesta = await crear({
                nombre: "<img src=x onerror=alert(1)>Diseño",
                descripcion: "<script>alert(1)</script>Mockups <b>principales</b>",
            });

            expect(respuesta.status).toBe(201);
            expect(respuesta.data.nombre).toBe("Diseño");
            expect(respuesta.data.descripcion).toBe("Mockups principales");
            const guardada = await TareaModel.findById(respuesta.data.id);
            expect(guardada.nombre).toBe("Diseño");
            expect(guardada.descripcion).toBe("Mockups principales");
        });

        test("un nombre que es solo HTML queda vacío y se rechaza", async () => {
            const respuesta = await crear({ nombre: "<script></script>" });

            expect(respuesta.status).toBe(400);
            expect(await TareaModel.countDocuments()).toBe(0);
        });

        test("también se sanitiza al editar", async () => {
            const creada = (await crear()).data;

            const respuesta = await req(`${base}/${creada.id}`, {
                method: "PUT",
                cookie: dueno.cookie,
                body: { nombre: "<iframe src=x></iframe>Nuevo nombre", descripcion: "<script>x</script>" },
            });

            expect(respuesta.status).toBe(200);
            expect(respuesta.data.nombre).toBe("Nuevo nombre");
            expect(respuesta.data.descripcion).toBeNull();
        });

        test("un texto normal con símbolos no se altera", async () => {
            const respuesta = await crear({ nombre: "Armar API & base de datos", descripcion: "a < b y c > d" });

            expect(respuesta.status).toBe(201);
            expect(respuesta.data.nombre).toBe("Armar API & base de datos");
        });
    });

    describe("editar", () => {
        test("reprograma con un PUT parcial", async () => {
            const creada = (await crear()).data;

            const respuesta = await req(`${base}/${creada.id}`, {
                method: "PUT",
                cookie: dueno.cookie,
                body: { fechaFin: "2026-11-12", estado: "EN_CURSO" },
            });

            expect(respuesta.status).toBe(200);
            expect(respuesta.data).toMatchObject({ fechaInicio: "2026-11-02", fechaFin: "2026-11-12", duracion: 11, estado: "EN_CURSO" });
        });

        test("acepta que el front reenvíe la tarea completa, ignorando los campos que no se editan", async () => {
            const creada = (await crear()).data;

            const respuesta = await req(`${base}/${creada.id}`, {
                method: "PUT",
                cookie: dueno.cookie,
                body: { ...creada, nombre: "Nuevo nombre", id: "otro", proyectoId: "otro", duracion: 99 },
            });

            expect(respuesta.status).toBe(200);
            expect(respuesta.data).toMatchObject({ id: creada.id, proyectoId: proyecto.id, nombre: "Nuevo nombre", duracion: 5 });
        });

        test("rechaza un cuerpo sin campos editables", async () => {
            const creada = (await crear()).data;

            expect((await req(`${base}/${creada.id}`, { method: "PUT", cookie: dueno.cookie, body: {} })).status).toBe(400);
        });

        test("no se puede elegir CERRADA ni volver atrás desde FINALIZADA", async () => {
            const creada = (await crear()).data;
            const put = (estado) => req(`${base}/${creada.id}`, { method: "PUT", cookie: dueno.cookie, body: { estado } });

            expect((await put("CERRADA")).status).toBe(400);
            expect((await put("FINALIZADA")).status).toBe(200);
            expect((await put("PENDIENTE")).status).toBe(409);
            expect((await put("INVENTADO")).status).toBe(400);
        });

        test("un cuerpo que no es un objeto se rechaza con un mensaje en español", async () => {
            const creada = (await crear()).data;

            const respuesta = await req(`${base}/${creada.id}`, { method: "PUT", cookie: dueno.cookie, body: [] });

            expect(respuesta.status).toBe(400);
            expect(respuesta.data.error).toBe("Los datos de la tarea son obligatorios");
        });

        test.each([
            ["nombre numérico", { nombre: 5 }],
            ["responsable que es un objeto", { responsableId: { $ne: null } }],
            ["responsable numérico", { responsableId: 7 }],
            ["descripción que no es texto", { descripcion: 10 }],
            ["fecha numérica", { fechaFin: 20261106 }],
            ["estado inventado", { estado: "HECHA" }],
        ])("rechaza con 400 una edición con %s", async (_caso, cambios) => {
            const creada = (await crear()).data;

            const respuesta = await req(`${base}/${creada.id}`, { method: "PUT", cookie: dueno.cookie, body: cambios });

            expect(respuesta.status).toBe(400);
            expect((await TareaModel.findById(creada.id)).nombre).toBe("Diseñar pantallas");
        });

        test("responde 404 si la tarea no existe o el id es inválido", async () => {
            const put = (id) => req(`${base}/${id}`, { method: "PUT", cookie: dueno.cookie, body: { nombre: "x" } });

            expect((await put("507f1f77bcf86cd799439011")).status).toBe(404);
            expect((await put("no-es-un-id")).status).toBe(404);
        });
    });

    describe("eliminar", () => {
        test("responde 200 con la tarea borrada y después ya no existe", async () => {
            const creada = (await crear()).data;

            const respuesta = await req(`${base}/${creada.id}`, { method: "DELETE", cookie: dueno.cookie });

            expect(respuesta.status).toBe(200);
            expect(respuesta.data.id).toBe(creada.id);
            expect((await req(`${base}/${creada.id}`)).status).toBe(404);
        });
    });

    describe("proyecto finalizado", () => {
        const finalizar = () =>
            req(`/colectivos/${dueno.data.actor.id}/proyectos/${proyecto.id}`, {
                method: "PATCH",
                cookie: dueno.cookie,
                body: { estado: "FINALIZADO" },
            });

        test("las tareas sin terminar quedan cerradas y ya no se pueden modificar", async () => {
            const pendiente = (await crear({ nombre: "Pendiente" })).data;
            const hecha = (await crear({ nombre: "Hecha" })).data;
            await req(`${base}/${hecha.id}`, { method: "PUT", cookie: dueno.cookie, body: { estado: "FINALIZADA" } });

            expect((await finalizar()).status).toBe(200);

            const lista = (await req(base)).data;
            expect(Object.fromEntries(lista.map((t) => [t.nombre, t.estado]))).toEqual({ Pendiente: "CERRADA", Hecha: "FINALIZADA" });
            expect((await crear()).status).toBe(409);
            expect((await req(`${base}/${pendiente.id}`, { method: "PUT", cookie: dueno.cookie, body: { nombre: "x" } })).status).toBe(409);
            expect((await req(`${base}/${pendiente.id}`, { method: "DELETE", cookie: dueno.cookie })).status).toBe(409);
        });

        test("el proyecto sigue respondiendo igual y sin las tareas", async () => {
            await crear();

            await finalizar();
            const respuesta = await req(`/proyectos/${proyecto.id}`);

            expect(respuesta.status).toBe(200);
            expect(respuesta.data.estado).toBe("FINALIZADO");
            expect(respuesta.data).not.toHaveProperty("tareas");
        });
    });

    describe("eliminar el proyecto", () => {
        test("borra sus tareas", async () => {
            await crear();

            const borrado = await req(`/colectivos/${dueno.data.actor.id}/proyectos/${proyecto.id}`, {
                method: "DELETE",
                cookie: dueno.cookie,
            });

            expect(borrado.status).toBe(204);
            expect(await TareaModel.countDocuments()).toBe(0);
        });
    });

    describe("responsable y anonimato", () => {
        test("una colaboradora con colaboración pública es visible para todos", async () => {
            await ColaboracionModel.create({ proyectoId: proyecto.id, perfilId: "p1", colaboradoraId: personaId, anonimidad: false });

            const respuesta = await crear({ responsableId: personaId });

            expect(respuesta.status).toBe(201);
            expect((await req(base)).data[0].responsableId).toBe(personaId);
        });

        test("una colaboradora anónima solo la ven el dueño y ella misma", async () => {
            await ColaboracionModel.create({ proyectoId: proyecto.id, perfilId: "p1", colaboradoraId: personaId, anonimidad: true });
            await crear({ responsableId: personaId });

            const visitante = (await req(base)).data[0].responsableId;
            const delDueno = (await req(base, { cookie: dueno.cookie })).data[0].responsableId;
            const otroColectivo = (await req(base, { cookie: otro.cookie })).data[0].responsableId;
            const propia = (await req(base, { cookie: persona.cookie })).data[0].responsableId;

            expect(visitante).toBe("Anonimo");
            expect(otroColectivo).toBe("Anonimo");
            expect(delDueno).toBe(personaId);
            expect(propia).toBe(personaId);
        });
    });
});

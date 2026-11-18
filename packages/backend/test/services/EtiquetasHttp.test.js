import { beforeAll, beforeEach, afterAll, describe, test, expect } from "@jest/globals";
import { crearApp } from "../../src/app.js";
import { ColectivoModel, ProyectoModel } from "../../src/models/indexModel.js";
import { ProyectoService } from "../../src/services/ProyectoService.js";
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

const registrarColectivo = (email, extra = {}) =>
    req("/auth/registro", {
        method: "POST",
        body: {
            email,
            password,
            tipo: "colectivos",
            perfil: { nombre: email, descripcion: "Causa comunitaria", tipo: "ONG", ...extra },
        },
    });

const titulos = (respuesta) => respuesta.data.map((p) => p.titulo).sort();

describe("API de etiquetas", () => {
    let dueno, otro, duenoId, otroId;

    const crearProyecto = (titulo, etiquetas, cuenta = dueno) =>
        req(`/colectivos/${cuenta.data.actor.id}/proyectos`, {
            method: "POST",
            cookie: cuenta.cookie,
            body: {
                titulo,
                descripcion: "Software abierto",
                versionTerminosAceptada: "1.0",
                ...(etiquetas === undefined ? {} : { etiquetas }),
            },
        });

    const editarProyecto = (proyectoId, cambios) =>
        req(`/colectivos/${duenoId}/proyectos/${proyectoId}`, {
            method: "PUT",
            cookie: dueno.cookie,
            body: { versionTerminosAceptada: "1.0", ...cambios },
        });

    const editarColectivo = (cambios) =>
        req(`/colectivos/${duenoId}`, { method: "PATCH", cookie: dueno.cookie, body: cambios });

    const etiquetasGuardadas = async (proyectoId) =>
        [...(await ProyectoModel.findById(proyectoId)).etiquetas];

    beforeAll(async () => {
        // el límite de tasa público (120 por minuto) se agotaría con tantas pruebas seguidas
        process.env.PUBLIC_RATE_LIMIT = "100000";
        await conectarBaseDePrueba();
        await new Promise((resolve) => {
            server = crearApp().listen(0, "127.0.0.1", resolve);
        });
        url = `http://127.0.0.1:${server.address().port}`;

        // el registro tiene su propio límite: las cuentas se crean una sola vez para todas las pruebas
        dueno = await registrarColectivo("dueno@example.com", { etiquetas: ["Educación", "Barrio", "educacion"] });
        otro = await registrarColectivo("otro@example.com");
        duenoId = dueno.data.actor.id;
        otroId = otro.data.actor.id;
    }, 60000);

    beforeEach(async () => {
        await ProyectoModel.deleteMany({});
        await ColectivoModel.updateOne({ _id: duenoId }, { $set: { etiquetas: ["educacion", "barrio"] } });
        await ColectivoModel.updateOne({ _id: otroId }, { $set: { etiquetas: [] } });
    });

    afterAll(async () => {
        delete process.env.PUBLIC_RATE_LIMIT;
        if (server) await new Promise((resolve) => server.close(resolve));
        await desconectarBaseDePrueba();
    });

    describe("colectivos", () => {
        test("el registro guarda las etiquetas normalizadas y sin repetir", async () => {
            expect(dueno.status).toBe(201);
            expect([...(await ColectivoModel.findById(duenoId)).etiquetas]).toEqual(["educacion", "barrio"]);
        });

        test("el listado muestra las etiquetas de cada colectivo", async () => {
            const lista = await req("/colectivos");
            expect(lista.data.find((c) => c.id === duenoId).etiquetas).toEqual(["educacion", "barrio"]);
            expect(lista.data.find((c) => c.id === otroId).etiquetas).toEqual([]);
        });

        test("editar otro dato conserva las etiquetas", async () => {
            const respuesta = await editarColectivo({ nombre: "Nuevo nombre" });
            expect(respuesta.status).toBe(200);
            expect(respuesta.data.etiquetas).toEqual(["educacion", "barrio"]);
        });

        test("se pueden editar solo las etiquetas, y la lista enviada reemplaza a la anterior", async () => {
            const respuesta = await editarColectivo({ etiquetas: ["Salud"] });
            expect(respuesta.status).toBe(200);
            expect(respuesta.data.etiquetas).toEqual(["salud"]);
        });

        test("enviar una lista vacía quita todas las etiquetas", async () => {
            expect((await editarColectivo({ etiquetas: [] })).data.etiquetas).toEqual([]);
        });

        test("una etiqueta inválida responde 400 y no cambia nada", async () => {
            const respuesta = await editarColectivo({ etiquetas: ["ok", "c++"] });
            expect(respuesta.status).toBe(400);
            expect(respuesta.data.detalle.campo).toBe("etiquetas");
            expect([...(await ColectivoModel.findById(duenoId)).etiquetas]).toEqual(["educacion", "barrio"]);
        });

        test("otro colectivo no puede cambiarlas", async () => {
            const respuesta = await req(`/colectivos/${duenoId}`, {
                method: "PATCH",
                cookie: otro.cookie,
                body: { etiquetas: ["ataque"] },
            });
            expect(respuesta.status).toBe(403);
        });

        test("se filtran por etiquetas, exigiendo todas", async () => {
            const nombres = async (consulta) =>
                (await req(`/colectivos${consulta}`)).data.map((c) => c.id);

            expect(await nombres("?etiquetas=Educación")).toEqual([duenoId]);
            expect(await nombres("?etiquetas=educacion,barrio")).toEqual([duenoId]);
            expect(await nombres("?etiquetas=educacion,salud")).toEqual([]);
            expect((await nombres("?etiquetas=")).sort()).toEqual([duenoId, otroId].sort());
        });

        test("un colectivo suspendido no aparece aunque tenga la etiqueta", async () => {
            await ColectivoModel.updateOne({ _id: duenoId }, { $set: { "moderacionTerminos.suspendido": true } });
            try {
                expect((await req("/colectivos?etiquetas=educacion")).data).toEqual([]);
            } finally {
                await ColectivoModel.updateOne({ _id: duenoId }, { $set: { "moderacionTerminos.suspendido": false } });
            }
        });
    });

    describe("proyectos", () => {
        test("se crean con etiquetas normalizadas; sin enviarlas quedan vacías", async () => {
            const con = await crearProyecto("Con", ["Software Libre", "software-libre", "Salud"]);
            const sin = await crearProyecto("Sin");

            expect(con.status).toBe(201);
            expect(con.data.etiquetas).toEqual(["software-libre", "salud"]);
            expect(sin.data.etiquetas).toEqual([]);
        });

        test("al crear, una etiqueta inválida responde 400", async () => {
            const respuesta = await crearProyecto("Mal", ["x"]);
            expect(respuesta.status).toBe(400);
            expect(respuesta.data.detalle.campo).toBe("etiquetas");
            expect(await ProyectoModel.countDocuments()).toBe(0);
        });

        test("al crear, más de 10 etiquetas distintas responde 400", async () => {
            const once = Array.from({ length: 11 }, (_, i) => `tema${i}`);
            expect((await crearProyecto("Muchas", once)).status).toBe(400);
        });

        test("editar el título conserva las etiquetas", async () => {
            const proyecto = (await crearProyecto("Web", ["salud"])).data;

            const respuesta = await editarProyecto(proyecto.id, { titulo: "Web nueva" });

            expect(respuesta.status).toBe(200);
            expect(respuesta.data.etiquetas).toEqual(["salud"]);
        });

        test("la lista enviada reemplaza a la anterior y una lista vacía las quita", async () => {
            const proyecto = (await crearProyecto("Web", ["salud", "web"])).data;

            expect((await editarProyecto(proyecto.id, { etiquetas: ["Educación"] })).data.etiquetas).toEqual([
                "educacion",
            ]);
            expect((await editarProyecto(proyecto.id, { etiquetas: [] })).data.etiquetas).toEqual([]);
        });

        test("agregar un logro no toca las etiquetas", async () => {
            const proyecto = (await crearProyecto("Web", ["salud"])).data;

            const logro = await req(`/proyectos/${proyecto.id}/logros`, {
                method: "POST",
                cookie: dueno.cookie,
                body: { descripcion: "Primera versión", porcentajeCompletitud: 10 },
            });

            expect(logro.status).toBe(201);
            expect(await etiquetasGuardadas(proyecto.id)).toEqual(["salud"]);
        });

        test("guardar una copia vieja del proyecto no pisa etiquetas editadas mientras tanto", async () => {
            const proyecto = (await crearProyecto("Web", ["salud"])).data;
            const copiaVieja = await ProyectoService.obtenerPorId(proyecto.id);

            await editarProyecto(proyecto.id, { etiquetas: ["salud", "educacion"] });
            await ProyectoService.guardar(copiaVieja);

            expect(await etiquetasGuardadas(proyecto.id)).toEqual(["salud", "educacion"]);
        });

        test("se filtran por etiquetas, exigiendo todas", async () => {
            await crearProyecto("Salud y web", ["salud", "web"]);
            await crearProyecto("Solo salud", ["salud"]);
            await crearProyecto("Sin etiquetas");

            expect(titulos(await req("/proyectos?etiquetas=salud"))).toEqual(["Salud y web", "Solo salud"]);
            expect(titulos(await req("/proyectos?etiquetas=salud,web"))).toEqual(["Salud y web"]);
            expect(titulos(await req("/proyectos?etiquetas=salud&etiquetas=web"))).toEqual(["Salud y web"]);
            expect(titulos(await req("/proyectos?etiquetas=SALUD"))).toEqual(["Salud y web", "Solo salud"]);
            expect(titulos(await req("/proyectos?etiquetas=salud,educacion"))).toEqual([]);
        });

        test("sin etiquetas en la consulta se listan todos", async () => {
            await crearProyecto("Uno", ["salud"]);
            await crearProyecto("Dos");

            expect(titulos(await req("/proyectos"))).toEqual(["Dos", "Uno"]);
            expect(titulos(await req("/proyectos?etiquetas="))).toEqual(["Dos", "Uno"]);
        });

        test("una etiqueta inválida en la consulta responde 400", async () => {
            const respuesta = await req("/proyectos?etiquetas=x");
            expect(respuesta.status).toBe(400);
            expect(respuesta.data.detalle.campo).toBe("etiquetas");
        });

        test("no aparecen proyectos suspendidos ni de colectivos suspendidos", async () => {
            const propio = (await crearProyecto("Suspendido", ["salud"])).data;
            await crearProyecto("De colectivo suspendido", ["salud"], otro);
            await crearProyecto("Visible", ["salud"]);
            await ProyectoModel.updateOne({ _id: propio.id }, { $set: { "moderacionTerminos.suspendido": true } });
            await ColectivoModel.updateOne({ _id: otroId }, { $set: { "moderacionTerminos.suspendido": true } });

            try {
                expect(titulos(await req("/proyectos?etiquetas=salud"))).toEqual(["Visible"]);
            } finally {
                await ColectivoModel.updateOne({ _id: otroId }, { $set: { "moderacionTerminos.suspendido": false } });
            }
        });
    });
});

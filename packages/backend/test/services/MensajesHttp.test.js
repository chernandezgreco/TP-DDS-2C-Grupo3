import { beforeAll, beforeEach, afterAll, describe, test, expect } from "@jest/globals";
import { crearApp } from "../../src/app.js";
import { HabilidadModel, ColaboradoraModel, NotificacionModel } from "../../src/models/indexModel.js";
import { NotificacionService } from "../../src/services/NotificacionService.js";
import { conectarBaseDePrueba, limpiarBaseDePrueba, desconectarBaseDePrueba } from "../helpers/baseDePrueba.js";

let server;
let url;
const password = "ClaveSegura123";

async function solicitar(path, method = "GET", body, cookie, headers = {}) {
    const respuesta = await fetch(url + "/api" + path, {
        method,
        headers: {
            "Content-Type": "application/json",
            ...(cookie ? { Cookie: cookie } : {}),
            ...headers,
        },
        body: body === undefined ? undefined : JSON.stringify(body),
    });
    const texto = await respuesta.text();
    return {
        status: respuesta.status,
        data: texto ? JSON.parse(texto) : null,
        cookie: respuesta.headers.get("set-cookie")?.split(";")[0],
    };
}

async function registrar(email, tipo, perfil) {
    const r = await solicitar("/auth/registro", "POST", { email, password, tipo, perfil });
    expect(r.status).toBe(201);
    return { id: r.data.actor.id, cookie: r.cookie };
}

const registrarColaboradora = (email, nombreFantasia) =>
    registrar(email, "colaboradoras", {
        nombreFantasia,
        github: `github.com/${nombreFantasia.toLowerCase()}`,
        habilidades: ["react"],
    });

const minutos = (n) => new Date(Date.now() + n * 60000);

// los mensajes se cargan directo en la base para controlar sus fechas
const recibir = (colaboradoraId, fecha, texto = "Hola") =>
    NotificacionModel.create({ colaboradoraId, colectivoId: "colectivo-1", proyectoId: "proyecto-1", texto, fecha });

const noLeidos = async (cookie) => {
    const r = await solicitar("/mi/mensajes/no-leidos", "GET", undefined, cookie);
    expect(r.status).toBe(200);
    return r.data.cantidad;
};

const marcarVistos = (cookie, hasta) => solicitar("/mi/mensajes/vistos", "POST", { hasta }, cookie);

beforeAll(async () => {
    await conectarBaseDePrueba();
    await new Promise((resolve) => {
        server = crearApp().listen(0, "127.0.0.1", resolve);
    });
    url = `http://127.0.0.1:${server.address().port}`;
}, 120000);

beforeEach(async () => {
    await limpiarBaseDePrueba();
    await HabilidadModel.create({ codigo: "react", titulo: "React", descripcion: "Interfaces" });
});

afterAll(async () => {
    if (server) await new Promise((resolve) => server.close(resolve));
    await desconectarBaseDePrueba();
});

describe("acceso", () => {
    test("sin sesión responde 401", async () => {
        expect((await solicitar("/mi/mensajes/no-leidos")).status).toBe(401);
        expect((await marcarVistos(undefined, new Date().toISOString())).status).toBe(401);
    });

    test("un colectivo recibe 403: sólo las colaboradoras reciben mensajes", async () => {
        const colectivo = await registrar("colectivo@example.com", "colectivos", {
            nombre: "Colectivo",
            descripcion: "Organización de prueba",
            tipo: "ONG",
        });
        expect((await solicitar("/mi/mensajes/no-leidos", "GET", undefined, colectivo.cookie)).status).toBe(403);
        expect((await marcarVistos(colectivo.cookie, new Date().toISOString())).status).toBe(403);
    });

    test("rechaza marcar vistos desde un origen no permitido", async () => {
        const ana = await registrarColaboradora("ana@example.com", "Ana");
        const r = await solicitar(
            "/mi/mensajes/vistos",
            "POST",
            { hasta: new Date().toISOString() },
            ana.cookie,
            { Origin: "https://otro-sitio.example" },
        );
        expect(r.status).toBe(403);
    });
});

describe("contador de no leídos", () => {
    let ana;

    beforeEach(async () => {
        ana = await registrarColaboradora("ana@example.com", "Ana");
        // la marca queda una hora atrás para poder cargar mensajes en el pasado
        await ColaboradoraModel.updateOne({ _id: ana.id }, { $set: { mensajesVistosHasta: minutos(-60) } });
    });

    test("una cuenta nueva arranca sin mensajes no leídos", async () => {
        const bea = await registrarColaboradora("bea@example.com", "Bea");
        expect(await noLeidos(bea.cookie)).toBe(0);
    });

    test("cuenta sólo los mensajes propios posteriores a la marca", async () => {
        const bea = await registrarColaboradora("bea@example.com", "Bea");
        await recibir(ana.id, minutos(-90), "anterior a la marca");
        await recibir(ana.id, minutos(-30));
        await recibir(ana.id, minutos(-20));
        await recibir(bea.id, minutos(-10), "de otra colaboradora");

        expect(await noLeidos(ana.cookie)).toBe(2);
    });

    test("marcar vistos baja el contador y un mensaje posterior lo vuelve a subir", async () => {
        await recibir(ana.id, minutos(-30));
        const ultimo = minutos(-20);
        await recibir(ana.id, ultimo);

        const r = await marcarVistos(ana.cookie, ultimo.toISOString());
        expect(r.status).toBe(200);
        expect(r.data.mensajesVistosHasta).toBe(ultimo.toISOString());
        expect(await noLeidos(ana.cookie)).toBe(0);

        await recibir(ana.id, minutos(-5));
        expect(await noLeidos(ana.cookie)).toBe(1);
    });

    test("marca hasta la fecha recibida: un mensaje que llegó después sigue sin leer", async () => {
        const mostrado = minutos(-30);
        await recibir(ana.id, mostrado);
        await recibir(ana.id, minutos(-10), "llegó con la bandeja abierta");

        await marcarVistos(ana.cookie, mostrado.toISOString());
        expect(await noLeidos(ana.cookie)).toBe(1);
    });

    test("una fecha anterior a la marca no la hace retroceder", async () => {
        await recibir(ana.id, minutos(-30));
        await marcarVistos(ana.cookie, minutos(-20).toISOString());

        const r = await marcarVistos(ana.cookie, minutos(-50).toISOString());
        expect(r.status).toBe(200);
        expect(await noLeidos(ana.cookie)).toBe(0);
    });

    test("rechaza con 400 una fecha faltante, inválida o futura", async () => {
        expect((await solicitar("/mi/mensajes/vistos", "POST", {}, ana.cookie)).status).toBe(400);
        expect((await marcarVistos(ana.cookie, "ayer")).status).toBe(400);
        expect((await marcarVistos(ana.cookie, minutos(60).toISOString())).status).toBe(400);
    });
});

describe("bandeja y perfil", () => {
    test("la bandeja lista los mensajes del más nuevo al más viejo", async () => {
        const ana = await registrarColaboradora("ana@example.com", "Ana");
        await recibir(ana.id, minutos(-30), "segundo");
        await recibir(ana.id, minutos(-60), "primero");
        await recibir(ana.id, minutos(-10), "tercero");

        const r = await solicitar(`/colaboradoras/${ana.id}/notificaciones`, "GET", undefined, ana.cookie);
        expect(r.data.map((m) => m.texto)).toEqual(["tercero", "segundo", "primero"]);
    });

    test("la marca de lectura no aparece en el perfil público", async () => {
        const ana = await registrarColaboradora("ana@example.com", "Ana");
        const r = await solicitar(`/colaboradoras/${ana.id}`);
        expect(r.status).toBe(200);
        expect(r.data).not.toHaveProperty("mensajesVistosHasta");
    });
});

describe("migración de arranque", () => {
    test("las colaboradoras sin marca empiezan con todo leído y no se vuelve a aplicar", async () => {
        const ana = await registrarColaboradora("ana@example.com", "Ana");
        // simula una colaboradora creada antes de que existiera la marca
        await ColaboradoraModel.updateOne({ _id: ana.id }, { $unset: { mensajesVistosHasta: 1 } });
        await recibir(ana.id, minutos(-30));

        expect(await NotificacionService.inicializarMensajesVistos()).toBe(1);
        expect(await noLeidos(ana.cookie)).toBe(0);
        expect(await NotificacionService.inicializarMensajesVistos()).toBe(0);
    });
});

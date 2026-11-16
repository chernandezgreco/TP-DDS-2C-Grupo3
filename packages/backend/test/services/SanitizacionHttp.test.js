import {
    beforeAll,
    beforeEach,
    afterAll,
    test,
    expect,
} from "@jest/globals";
import { crearApp } from "../../src/app.js";
import {
    HabilidadModel,
    ColaboradoraModel,
} from "../../src/models/indexModel.js";
import { CuentaModel } from "../../src/models/AuthModel.js";
import {
    conectarBaseDePrueba,
    limpiarBaseDePrueba,
    desconectarBaseDePrueba,
} from "../helpers/baseDePrueba.js";

let server;
let url;

const password = "ClaveSegura<script>original</script>123";

async function solicitar(path, method, body, cookie) {
    const respuesta = await fetch(url + "/api" + path, {
        method,
        headers: {
            "Content-Type": "application/json",
            ...(cookie ? { Cookie: cookie } : {}),
        },
        body: JSON.stringify(body),
    });

    return {
        status: respuesta.status,
        data: await respuesta.json(),
        cookie: respuesta.headers.get("set-cookie")?.split(";")[0],
    };
}

const registrar = (cambios = {}) =>
    solicitar("/auth/registro", "POST", {
        email: "sanitizacion@example.com",
        password,
        tipo: "colaboradoras",
        perfil: {
            nombreFantasia: "<b>Ana</b>",
            github: "github.com/ana",
            habilidades: ["react"],
            presentacion: "**Frontend** <script>alert(1)</script>voluntaria",
            ...cambios,
        },
    });

beforeAll(async () => {
    await conectarBaseDePrueba();

    await new Promise((resolve) => {
        server = crearApp().listen(0, "127.0.0.1", resolve);
    });

    url = `http://127.0.0.1:${server.address().port}`;
}, 120000);

beforeEach(async () => {
    await limpiarBaseDePrueba();

    await HabilidadModel.create({
        codigo: "react",
        titulo: "React",
        descripcion: "Interfaces",
    });
});

afterAll(async () => {
    if (server) {
        await new Promise((resolve) => server.close(resolve));
    }

    await desconectarBaseDePrueba();
});

test("el registro guarda los textos limpios y conserva Markdown", async () => {
    const resultado = await registrar();

    expect(resultado.status).toBe(201);

    const guardada = await ColaboradoraModel.findById(
        resultado.data.actor.id,
    );

    expect(guardada.nombreFantasia).toBe("Ana");
    expect(guardada.presentacion).toBe("**Frontend** voluntaria");
    expect(resultado.data.perfil.presentacion).toBe(guardada.presentacion);
});

test("la sanitización no modifica la contraseña", async () => {
    expect((await registrar()).status).toBe(201);

    const login = (clave) =>
        solicitar("/auth/login", "POST", {
            email: "sanitizacion@example.com",
            password: clave,
        });

    expect((await login(password)).status).toBe(200);
    expect((await login("ClaveSegura123")).status).toBe(401);
});

test("rechaza un nombre que queda vacío y no crea la cuenta", async () => {
    const resultado = await registrar({
        nombreFantasia: "<script>alert(1)</script>",
    });

    expect(resultado.status).toBe(400);
    expect(await CuentaModel.countDocuments()).toBe(0);
    expect(await ColaboradoraModel.countDocuments()).toBe(0);
});

test("la edición persiste texto limpio y rechaza enlaces peligrosos", async () => {
    const registro = await registrar();
    expect(registro.status).toBe(201);

    const id = registro.data.actor.id;
    const editar = (datos) =>
        solicitar(
            `/colaboradoras/${id}`,
            "PATCH",
            datos,
            registro.cookie,
        );

    const actualizada = await editar({
        presentacion: '<img src="x" onerror="alert(1)">Nueva presentación',
    });

    expect(actualizada.status).toBe(200);
    expect((await ColaboradoraModel.findById(id)).presentacion).toBe(
        "Nueva presentación",
    );

    const rechazada = await editar({
        presentacion: "Este cambio no debe guardarse",
        github: "javascript:alert(1)",
    });

    expect(rechazada.status).toBe(400);

    const guardada = await ColaboradoraModel.findById(id);
    expect(guardada.github).toBe("github.com/ana");
    expect(guardada.presentacion).toBe("Nueva presentación");
});
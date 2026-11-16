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
    ColaboracionModel,
    PostulacionModel,
    NotificacionModel,
} from "../../src/models/indexModel.js";
import { CuentaModel, SesionModel } from "../../src/models/AuthModel.js";
import {
    LinkedInConnectionModel,
    LinkedInOAuthStateModel,
} from "../../src/models/LinkedInModel.js";
import {
    conectarBaseDePrueba,
    limpiarBaseDePrueba,
    desconectarBaseDePrueba,
} from "../helpers/baseDePrueba.js";

let server;
let url;
const password = "ClaveSegura123";

async function solicitar(path, method = "GET", body, cookie) {
    const respuesta = await fetch(url + "/api" + path, {
        method,
        headers: {
            "Content-Type": "application/json",
            ...(cookie ? { Cookie: cookie } : {}),
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

async function registrar(email = "ana@example.com") {
    const resultado = await solicitar("/auth/registro", "POST", {
        email,
        password,
        tipo: "colaboradoras",
        perfil: {
            nombreFantasia: "Ana",
            github: "github.com/ana",
            nombreApellido: "Ana Pérez",
            habilidades: ["react"],
            pronombres: "ella",
            presentacion: "Desarrolladora frontend",
        },
    });

    expect(resultado.status).toBe(201);
    return resultado;
}

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

test("rechaza visitantes y cuentas ajenas sin modificar el perfil", async () => {
    const propia = await registrar();
    const otra = await registrar("bea@example.com");
    const id = propia.data.actor.id;
    const ruta = `/colaboradoras/${id}/cuenta`;

    expect((await solicitar(ruta, "DELETE")).status).toBe(401);

    expect(
        (await solicitar(ruta, "DELETE", undefined, otra.cookie)).status,
    ).toBe(403);

    expect((await ColaboradoraModel.findById(id)).nombreFantasia).toBe("Ana");
    expect(await CuentaModel.countDocuments()).toBe(2);
});

test("elimina los datos privados y las sesiones conservando el historial", async () => {
    const registro = await registrar();
    const id = registro.data.actor.id;
    const cuenta = await CuentaModel.findOne({ perfilId: id });

    const segundaSesion = await solicitar("/auth/login", "POST", {
        email: "ana@example.com",
        password,
    });
    expect(segundaSesion.status).toBe(200);

    await ColaboradoraModel.updateOne(
        { _id: id },
        {
            $set: {
                mediosContacto: [{ tipo: "EMAIL", valor: "ana@example.com" }],
                aceptaMensajeria: true,
                linkedinFoto: "https://example.com/foto",
                experienciaHabilidades: [
                    { codigo: "react", nivel: "AVANZADO", anios: 5 },
                ],
            },
        },
    );

    await LinkedInConnectionModel.create({
        cuentaId: cuenta._id,
        memberId: "linkedin-test",
        nombre: "Ana Pérez",
        tokenCifrado: "token-de-prueba",
        tokenIv: "iv-de-prueba",
        tokenTag: "tag-de-prueba",
        tokenExpira: new Date(Date.now() + 3600000),
    });

    await LinkedInOAuthStateModel.create({
        cuentaId: cuenta._id,
        stateHash: "estado-de-prueba",
        expira: new Date(Date.now() + 3600000),
    });

    await PostulacionModel.create([
        {
            proyectoId: "proyecto-test",
            perfilId: "perfil-pendiente",
            colaboradoraId: id,
        },
        {
            proyectoId: "proyecto-test",
            perfilId: "perfil-aceptado",
            colaboradoraId: id,
            estado: "ACEPTADA",
        },
    ]);

    const colaboracion = await ColaboracionModel.create({
        proyectoId: "proyecto-test",
        perfilId: "perfil-aceptado",
        colaboradoraId: id,
    });

    await NotificacionModel.create({
        colaboradoraId: id,
        colectivoId: "colectivo-test",
        proyectoId: "proyecto-test",
        texto: "Mensaje privado",
    });

    const resultado = await solicitar(
        `/colaboradoras/${id}/cuenta`,
        "DELETE",
        undefined,
        registro.cookie,
    );

    expect(resultado.status).toBe(204);
    expect(resultado.data).toBeNull();
    expect(resultado.cookie).toBe("cav_session=");

    const guardada = await ColaboradoraModel.findById(id);
    expect(guardada.nombreFantasia).toBe("Persona eliminada");
    expect(guardada.github).toBeNull();
    expect(guardada.nombreApellido).toBeUndefined();
    expect(guardada.pronombres).toBeUndefined();
    expect(guardada.presentacion).toBeUndefined();
    expect(guardada.habilidades).toHaveLength(0);
    expect(guardada.mediosContacto).toHaveLength(0);
    expect(guardada.experienciaHabilidades).toHaveLength(0);
    expect(guardada.linkedinFoto).toBe("");
    expect(guardada.aceptaMensajeria).toBe(false);
    expect(guardada.cuentaEliminadaAt).toBeInstanceOf(Date);

    expect(await CuentaModel.findById(cuenta._id)).toBeNull();
    expect(await SesionModel.countDocuments({ cuentaId: cuenta._id })).toBe(0);
    expect(await LinkedInConnectionModel.countDocuments()).toBe(0);
    expect(await LinkedInOAuthStateModel.countDocuments()).toBe(0);
    expect(await NotificacionModel.countDocuments({ colaboradoraId: id })).toBe(0);

    expect(await ColaboracionModel.findById(colaboracion._id)).not.toBeNull();
    expect(
        await PostulacionModel.countDocuments({
            colaboradoraId: id,
            estado: "RECHAZADA",
        }),
    ).toBe(1);
    expect(
        await PostulacionModel.countDocuments({
            colaboradoraId: id,
            estado: "ACEPTADA",
        }),
    ).toBe(1);

    const listado = await solicitar("/colaboradoras");
    expect(listado.data.some((persona) => persona.id === id)).toBe(false);

    for (const cookie of [registro.cookie, segundaSesion.cookie]) {
        const sesion = await solicitar(
            "/auth/sesion",
            "GET",
            undefined,
            cookie,
        );
        expect(sesion.data.actor).toBeNull();
    }

    const login = await solicitar("/auth/login", "POST", {
        email: "ana@example.com",
        password,
    });
    expect(login.status).toBe(401);
});

test("bloquea login y sesiones si el perfil está eliminado aunque queden credenciales", async () => {
    const registro = await registrar();
    const id = registro.data.actor.id;

    await ColaboradoraModel.updateOne(
        { _id: id },
        { $set: { cuentaEliminadaAt: new Date() } },
    );

    expect(await CuentaModel.countDocuments({ perfilId: id })).toBe(1);

    const login = await solicitar("/auth/login", "POST", {
        email: "ana@example.com",
        password,
    });
    expect(login.status).toBe(401);

    const sesion = await solicitar(
        "/auth/sesion",
        "GET",
        undefined,
        registro.cookie,
    );
    expect(sesion.data.actor).toBeNull();
});
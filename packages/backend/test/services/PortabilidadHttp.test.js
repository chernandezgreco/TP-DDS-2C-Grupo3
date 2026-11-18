import { beforeAll, beforeEach, afterAll, describe, test, expect } from "@jest/globals";
import { crearApp } from "../../src/app.js";
import {
    HabilidadModel,
    ColectivoModel,
    ColaboradoraModel,
    ProyectoModel,
    PostulacionModel,
    ColaboracionModel,
    NotificacionModel,
    TareaModel,
} from "../../src/models/indexModel.js";
import { CuentaModel } from "../../src/models/AuthModel.js";
import { LinkedInConnectionModel } from "../../src/models/LinkedInModel.js";
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
    let data = null;
    try {
        data = texto ? JSON.parse(texto) : null;
    } catch {
        data = null;
    }
    return {
        status: respuesta.status,
        texto,
        data,
        headers: respuesta.headers,
        cookie: respuesta.headers.get("set-cookie")?.split(";")[0],
    };
}

const exportar = (cookie, formato) =>
    solicitar(`/mi/exportacion${formato ? `?formato=${formato}` : ""}`, "GET", undefined, cookie);

async function registrarColaboradora(email, nombreFantasia, extra = {}) {
    const r = await solicitar("/auth/registro", "POST", {
        email,
        password,
        tipo: "colaboradoras",
        perfil: {
            nombreFantasia,
            github: `github.com/${nombreFantasia.toLowerCase()}`,
            nombreApellido: `${nombreFantasia} Apellido`,
            habilidades: ["react"],
            ...extra,
        },
    });
    expect(r.status).toBe(201);
    return { id: r.data.actor.id, cookie: r.cookie };
}

async function registrarColectivo(email, nombre) {
    const r = await solicitar("/auth/registro", "POST", {
        email,
        password,
        tipo: "colectivos",
        perfil: { nombre, descripcion: "Organización de prueba", tipo: "ONG" },
    });
    expect(r.status).toBe(201);
    return { id: r.data.actor.id, cookie: r.cookie };
}

const perfilProyecto = {
    descripcionPerfil: "Tester",
    habilidadesRequeridas: ["react"],
    compromiso: { cantidadHoras: 5, tipo: "MENSUALES" },
    modalidad: { gratuita: true, incentivoEconomico: false, contratacionEventual: false },
};

async function crearProyecto(colectivoId, titulo) {
    const proyecto = await ProyectoModel.create({
        titulo,
        descripcion: "Descripción",
        colectivoId,
        perfiles: [perfilProyecto],
    });
    return { proyectoId: proyecto.id, perfilId: String(proyecto.perfiles[0]._id) };
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
    await HabilidadModel.create({ codigo: "react", titulo: "React", descripcion: "Interfaces" });
});

afterAll(async () => {
    if (server) await new Promise((resolve) => server.close(resolve));
    await desconectarBaseDePrueba();
});

describe("acceso", () => {
    test("sin sesión responde 401", async () => {
        const r = await exportar();
        expect(r.status).toBe(401);
        expect(r.data.error).toMatch(/Iniciá sesión/);
    });

    test("cualquier ruta /mi/ exige sesión aunque sea una lectura", async () => {
        expect((await solicitar("/mi/otra-cosa")).status).toBe(401);
    });

    test("rechaza un formato desconocido con 400", async () => {
        const ana = await registrarColaboradora("ana@example.com", "Ana");
        const r = await exportar(ana.cookie, "xml");
        expect(r.status).toBe(400);
        expect(r.data.error).toBe("El formato debe ser json o csv");
    });

    test("limita las descargas por cuenta y responde 429 al superarlo", async () => {
        const ana = await registrarColaboradora("ana@example.com", "Ana");
        const bea = await registrarColaboradora("bea@example.com", "Bea");
        // los pedidos rechazados no consumen la cuota
        for (let i = 0; i < 3; i++) {
            expect((await exportar(ana.cookie, "xml")).status).toBe(400);
        }
        for (let i = 0; i < 5; i++) {
            expect((await exportar(ana.cookie)).status).toBe(200);
        }
        const excedida = await exportar(ana.cookie);
        expect(excedida.status).toBe(429);
        expect(excedida.data.error).toMatch(/límite de descargas/);
        // el contador es por cuenta, no global
        expect((await exportar(bea.cookie)).status).toBe(200);
    });
});

describe("colaboradora", () => {
    test("descarga un JSON con sus datos y sin secretos", async () => {
        const ana = await registrarColaboradora("ana@example.com", "Ana", {
            pronombres: "ella",
            presentacion: "Frontend",
        });
        await ColaboradoraModel.updateOne(
            { _id: ana.id },
            { $set: { mediosContacto: [{ tipo: "EMAIL", valor: "ana.contacto@example.com" }] } },
        );
        const colectivo = await registrarColectivo("ong@example.com", "ONG Norte");
        const { proyectoId, perfilId } = await crearProyecto(colectivo.id, "App de turnos");
        await PostulacionModel.create({ proyectoId, perfilId, colaboradoraId: ana.id });
        await ColaboracionModel.create({ proyectoId, perfilId, colaboradoraId: ana.id, anonimidad: true });
        await NotificacionModel.create({
            colaboradoraId: ana.id,
            colectivoId: colectivo.id,
            proyectoId,
            texto: "Te buscamos",
        });
        await TareaModel.create({
            proyectoId,
            nombre: "Diseñar pantallas",
            fechaInicio: new Date("2026-11-02T00:00:00.000Z"),
            fechaFin: new Date("2026-11-06T00:00:00.000Z"),
            responsableId: ana.id,
        });
        const cuenta = await CuentaModel.findOne({ perfilId: ana.id });
        await LinkedInConnectionModel.create({
            cuentaId: cuenta._id,
            memberId: "li-123",
            nombre: "Ana LinkedIn",
            tokenCifrado: "TOKEN-SECRETO-CIFRADO",
            tokenIv: "IV-SECRETO",
            tokenTag: "TAG-SECRETO",
            tokenExpira: new Date("2027-01-01T00:00:00.000Z"),
        });

        const r = await exportar(ana.cookie);

        expect(r.status).toBe(200);
        expect(r.headers.get("content-type")).toMatch(/^application\/json/);
        expect(r.headers.get("cache-control")).toBe("no-store");
        expect(r.headers.get("content-disposition")).toMatch(
            /^attachment; filename="codigo-a-voluntad-datos-colaboradora-\d{4}-\d{2}-\d{2}\.json"$/,
        );

        const datos = r.data;
        expect(datos.metadatos.titular).toEqual({ tipo: "colaboradoras", perfilId: ana.id });
        expect(datos.cuenta).toMatchObject({ email: "ana@example.com", tipo: "colaboradoras" });
        expect(datos.perfil).toMatchObject({
            nombreFantasia: "Ana",
            pronombres: "ella",
            mediosContacto: [{ tipo: "EMAIL", valor: "ana.contacto@example.com" }],
        });
        expect(datos.habilidades).toEqual([{ codigo: "react", titulo: "React" }]);
        expect(datos.postulaciones).toHaveLength(1);
        expect(datos.postulaciones[0]).toMatchObject({
            proyecto: "App de turnos",
            colectivo: "ONG Norte",
            perfil: "Tester",
            estado: "PENDIENTE",
        });
        expect(datos.colaboraciones[0]).toMatchObject({ anonimidad: true, fechaBaja: null });
        expect(datos.notificacionesRecibidas[0]).toMatchObject({
            texto: "Te buscamos",
            colectivo: "ONG Norte",
        });
        expect(datos.tareasAsignadas[0]).toMatchObject({
            nombre: "Diseñar pantallas",
            proyecto: "App de turnos",
            fechaInicio: "2026-11-02T00:00:00.000Z",
        });
        expect(datos.linkedin).toMatchObject({ memberId: "li-123", nombre: "Ana LinkedIn" });

        const cuentaConSecretos = await CuentaModel.findById(cuenta._id).select("+passwordHash +salt");
        for (const secreto of [
            cuentaConSecretos.passwordHash,
            cuentaConSecretos.salt,
            "TOKEN-SECRETO-CIFRADO",
            "IV-SECRETO",
            "TAG-SECRETO",
            password,
        ]) {
            expect(r.texto).not.toContain(secreto);
        }
        expect(r.texto).not.toMatch(/passwordHash|tokenHash|tokenCifrado|"salt"/);
    });

    test("no incluye datos de otra colaboradora", async () => {
        const ana = await registrarColaboradora("ana@example.com", "Ana");
        const bea = await registrarColaboradora("bea@example.com", "Bea");
        const colectivo = await registrarColectivo("ong@example.com", "ONG Norte");
        const { proyectoId, perfilId } = await crearProyecto(colectivo.id, "App de turnos");
        await PostulacionModel.create({ proyectoId, perfilId, colaboradoraId: bea.id });
        await NotificacionModel.create({
            colaboradoraId: bea.id,
            colectivoId: colectivo.id,
            proyectoId,
            texto: "Mensaje para Bea",
        });

        const r = await exportar(ana.cookie);

        expect(r.status).toBe(200);
        expect(r.data.postulaciones).toEqual([]);
        expect(r.data.notificacionesRecibidas).toEqual([]);
        expect(r.texto).not.toContain("bea@example.com");
        expect(r.texto).not.toContain("Mensaje para Bea");
    });

    test("descarga un CSV en formato largo, con BOM y fórmulas neutralizadas", async () => {
        const ana = await registrarColaboradora("ana@example.com", "Ana", {
            presentacion: "=HYPERLINK(\"http://malicioso\")",
        });

        const r = await exportar(ana.cookie, "csv");

        expect(r.status).toBe(200);
        expect(r.headers.get("content-type")).toMatch(/^text\/csv; charset=utf-8/);
        expect(r.headers.get("content-disposition")).toMatch(/\.csv"$/);
        const lineas = r.texto.replace(/^\uFEFF/, "").split("\r\n");
        expect(lineas[0]).toBe("seccion,registro,campo,valor");
        expect(lineas).toContain("perfil,1,nombreFantasia,Ana");
        expect(lineas).toContain("cuenta,1,email,ana@example.com");
        expect(lineas).toContain("postulaciones,,(sin registros),");
        expect(r.texto).toContain("perfil,1,presentacion,\"'=HYPERLINK(\"\"http://malicioso\"\")\"");
    });
});

describe("colectivo", () => {
    test("exporta sus proyectos y referencia a las colaboradoras sin sus contactos", async () => {
        const colectivo = await registrarColectivo("ong@example.com", "ONG Norte");
        const otro = await registrarColectivo("otra@example.com", "ONG Sur");
        const luna = await registrarColaboradora("luna@example.com", "Luna");
        await ColaboradoraModel.updateOne(
            { _id: luna.id },
            {
                $set: {
                    mediosContacto: [
                        { tipo: "EMAIL", valor: "luna.privado@example.com" },
                        { tipo: "WHATSAPP", valor: "+5491100000000" },
                    ],
                },
            },
        );
        const { proyectoId, perfilId } = await crearProyecto(colectivo.id, "App de turnos");
        await crearProyecto(otro.id, "Proyecto ajeno");
        await PostulacionModel.create({ proyectoId, perfilId, colaboradoraId: luna.id, estado: "ACEPTADA" });
        await ColaboracionModel.create({ proyectoId, perfilId, colaboradoraId: luna.id });
        await NotificacionModel.create({
            colaboradoraId: luna.id,
            colectivoId: colectivo.id,
            proyectoId,
            texto: "Hola Luna",
        });

        const r = await exportar(colectivo.cookie);

        expect(r.status).toBe(200);
        expect(r.headers.get("content-disposition")).toMatch(/datos-colectivo-/);
        const datos = r.data;
        expect(datos.perfil).toMatchObject({ nombre: "ONG Norte", tipo: "ONG" });
        expect(datos.proyectos.map((p) => p.titulo)).toEqual(["App de turnos"]);
        expect(datos.proyectos[0].perfiles[0]).toMatchObject({
            descripcionPerfil: "Tester",
            compromiso: { cantidadHoras: 5, tipo: "MENSUALES" },
        });
        expect(datos.postulacionesRecibidas[0].colaboradora).toEqual({
            id: luna.id,
            nombreFantasia: "Luna",
        });
        expect(datos.colaboraciones[0].colaboradora).toEqual({ id: luna.id, nombreFantasia: "Luna" });
        expect(datos.notificacionesEnviadas[0]).toMatchObject({
            texto: "Hola Luna",
            colaboradora: { id: luna.id, nombreFantasia: "Luna" },
        });

        // minimización: nada de los datos de contacto ni de identidad civil de la colaboradora
        expect(r.texto).not.toContain("luna.privado@example.com");
        expect(r.texto).not.toContain("+5491100000000");
        expect(r.texto).not.toContain("luna@example.com");
        expect(r.texto).not.toContain("Luna Apellido");
        expect(r.texto).not.toContain("Proyecto ajeno");
    });

    test("incluye las etiquetas del colectivo y de sus proyectos, también en CSV", async () => {
        const colectivo = await registrarColectivo("etiquetas@example.com", "ONG Etiquetada");
        const { proyectoId } = await crearProyecto(colectivo.id, "Huerta");
        await ColectivoModel.updateOne({ _id: colectivo.id }, { $set: { etiquetas: ["barrio", "cultura"] } });
        await ProyectoModel.updateOne({ _id: proyectoId }, { $set: { etiquetas: ["huerta-comunitaria"] } });

        const json = await exportar(colectivo.cookie);
        const csv = await exportar(colectivo.cookie, "csv");

        expect(json.data.perfil.etiquetas).toEqual(["barrio", "cultura"]);
        expect(json.data.proyectos[0].etiquetas).toEqual(["huerta-comunitaria"]);
        expect(csv.texto).toContain("huerta-comunitaria");
        expect(csv.texto).toContain("cultura");
    });
});

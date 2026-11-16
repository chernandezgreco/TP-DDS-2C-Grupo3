import {
    beforeAll,
    beforeEach,
    afterAll,
    test,
    expect,
} from "@jest/globals";
import {
    ProyectoModel,
    ColectivoModel,
    ColaboradoraModel,
    PostulacionModel,
    ColaboracionModel,
} from "../../src/models/indexModel.js";
import { ProyectoService } from "../../src/services/ProyectoService.js";
import { PostulacionService } from "../../src/services/PostulacionService.js";
import { Logro } from "../../src/domain/Logro/Logro.js";
import { ConflictError } from "../../src/domain/errores.js";
import {
    conectarBaseDePrueba,
    limpiarBaseDePrueba,
    desconectarBaseDePrueba,
} from "../helpers/baseDePrueba.js";

let colectivo;
let colaboradora;

const perfil = {
    id: "perfil-1",
    descripcionPerfil: "Frontend",
    habilidadesRequeridas: ["react"],
    habilidadesOpcionales: [],
    compromiso: { cantidadHoras: 5, tipo: "SEMANALES" },
    modalidad: {
        gratuita: true,
        incentivoEconomico: false,
        contratacionEventual: false,
    },
};

const crearProyecto = (fechaCierre = null) =>
    ProyectoModel.create({
        titulo: "Proyecto",
        descripcion: "Prueba de cierre",
        colectivoId: colectivo.id,
        perfiles: [perfil],
        fechaCierre,
    });

beforeAll(conectarBaseDePrueba, 120000);
afterAll(desconectarBaseDePrueba);

beforeEach(async () => {
    await limpiarBaseDePrueba();

    colectivo = await ColectivoModel.create({
        nombre: "Comunidad",
        descripcion: "Causa social",
        tipo: "ONG",
    });

    colaboradora = await ColaboradoraModel.create({
        nombreFantasia: "Ana",
        github: "ana",
        habilidades: ["react"],
    });
});

test("cierra vencidos y exactos, conserva futuros y proyectos sin fecha", async () => {
    const ahora = new Date();
    const vencido = await crearProyecto(new Date(ahora.getTime() - 1000));
    const exacto = await crearProyecto(ahora);
    const futuro = await crearProyecto(new Date(ahora.getTime() + 86400000));
    const sinFecha = await crearProyecto();

    const resultado = await ProyectoService.cerrarVencidos(ahora);

    expect(resultado.cerrados).toBe(2);
    expect(resultado.errores).toHaveLength(0);

    for (const proyecto of [vencido, exacto]) {
        const guardado = await ProyectoModel.findById(proyecto.id);
        expect(guardado.estado).toBe("FINALIZADO");
        expect(guardado.estaBuscando).toBe(false);
    }

    for (const proyecto of [futuro, sinFecha]) {
        expect((await ProyectoModel.findById(proyecto.id)).estado).toBe("ACTIVO");
    }

    expect((await ProyectoService.cerrarVencidos(ahora)).cerrados).toBe(0);
});

test("rechaza pendientes y conserva aceptaciones y colaboraciones", async () => {
    const proyecto = await crearProyecto(new Date(Date.now() - 1000));
    const otra = await ColaboradoraModel.create({
        nombreFantasia: "Bea",
        github: "bea",
        habilidades: ["react"],
    });

    await PostulacionModel.create([
        {
            proyectoId: proyecto.id,
            perfilId: perfil.id,
            colaboradoraId: colaboradora.id,
        },
        {
            proyectoId: proyecto.id,
            perfilId: perfil.id,
            colaboradoraId: otra.id,
            estado: "ACEPTADA",
        },
    ]);

    const participacion = await ColaboracionModel.create({
        proyectoId: proyecto.id,
        perfilId: perfil.id,
        colaboradoraId: otra.id,
    });

    await ProyectoService.cerrarVencidos();

    expect(await PostulacionModel.countDocuments({ estado: "PENDIENTE" })).toBe(0);
    expect(await PostulacionModel.countDocuments({ estado: "RECHAZADA" })).toBe(1);
    expect(await PostulacionModel.countDocuments({ estado: "ACEPTADA" })).toBe(1);
    expect(await ColaboracionModel.findById(participacion.id)).not.toBeNull();
});

test("el vencimiento impide postularse, aceptar y reprogramar antes de la revisión", async () => {
    const proyecto = await crearProyecto(new Date(Date.now() - 1000));
    const pendiente = await PostulacionModel.create({
        proyectoId: proyecto.id,
        perfilId: perfil.id,
        colaboradoraId: colaboradora.id,
    });

    await expect(
        ProyectoService.anotarPostulacion(proyecto.id, {
            colaboradoraId: colaboradora.id,
            perfilId: perfil.id,
        }),
    ).rejects.toThrow(ConflictError);

    await expect(
        PostulacionService.cambiarEstadoPostulacion(pendiente.id, "ACEPTADA"),
    ).rejects.toThrow(ConflictError);

    await expect(
        ProyectoService.actualizar(colectivo.id, proyecto.id, {
            fechaCierre: new Date(Date.now() + 86400000),
            versionTerminosAceptada: "1.0",
        }),
    ).rejects.toThrow(ConflictError);

    expect(await ColaboracionModel.countDocuments()).toBe(0);
    expect((await ProyectoModel.findById(proyecto.id)).estado).toBe("ACTIVO");
});

test("guardar una copia anterior no reabre un proyecto cerrado", async () => {
    const fecha = new Date(Date.now() + 86400000);
    const proyecto = await crearProyecto(fecha);
    const copia = await ProyectoService.obtenerPorId(proyecto.id);

    await ProyectoService.cerrarProyecto(colectivo.id, proyecto.id);

    copia.agregarLogro(new Logro("logro-1", "Hito publicado", 50));
    await ProyectoService.guardar(copia);

    const guardado = await ProyectoModel.findById(proyecto.id);
    expect(guardado.estado).toBe("FINALIZADO");
    expect(guardado.estaBuscando).toBe(false);
    expect(guardado.fechaCierre).toEqual(fecha);
    expect(guardado.logros).toHaveLength(1);
});

test("dos revisiones simultáneas cierran el proyecto una sola vez", async () => {
    await crearProyecto(new Date(Date.now() - 1000));

    const resultados = await Promise.all([
        ProyectoService.cerrarVencidos(),
        ProyectoService.cerrarVencidos(),
    ]);

    expect(resultados.reduce((total, r) => total + r.cerrados, 0)).toBe(1);
    expect(resultados.every((r) => r.errores.length === 0)).toBe(true);
});

test("un documento inconsistente no impide cerrar otros proyectos", async () => {
    await ProyectoModel.collection.insertOne({
        titulo: "Documento inconsistente",
        descripcion: "Prueba",
        colectivoId: colectivo.id,
        estado: "ACTIVO",
        fechaCierre: new Date(Date.now() - 1000),
        perfiles: [{}],
        logros: [],
    });

    const valido = await crearProyecto(new Date(Date.now() - 1000));
    const resultado = await ProyectoService.cerrarVencidos();

    expect(resultado.cerrados).toBe(1);
    expect(resultado.errores).toHaveLength(1);
    expect((await ProyectoModel.findById(valido.id)).estado).toBe("FINALIZADO");
});

test("permite configurar, conservar y quitar la programación", async () => {
    const proyecto = await crearProyecto();
    const fecha = new Date(Date.now() + 86400000);

    await ProyectoService.actualizar(colectivo.id, proyecto.id, {
        fechaCierre: fecha,
        versionTerminosAceptada: "1.0",
    });
    expect((await ProyectoModel.findById(proyecto.id)).fechaCierre).toEqual(fecha);

    await ProyectoService.actualizar(colectivo.id, proyecto.id, {
        titulo: "Nuevo título",
        versionTerminosAceptada: "1.0",
    });
    expect((await ProyectoModel.findById(proyecto.id)).fechaCierre).toEqual(fecha);

    await ProyectoService.actualizar(colectivo.id, proyecto.id, {
        fechaCierre: null,
        versionTerminosAceptada: "1.0",
    });
    expect((await ProyectoModel.findById(proyecto.id)).fechaCierre).toBeNull();
});
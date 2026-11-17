import { describe, test, expect, beforeAll, beforeEach, afterAll, afterEach, jest } from "@jest/globals";
// TareaService se importa primero a propósito: ProyectoService y TareaService se importan entre sí
import { TareaService, RESPONSABLE_ANONIMO } from "../../src/services/TareaService.js";
import { ProyectoService } from "../../src/services/ProyectoService.js";
import { LogroService } from "../../src/services/LogroService.js";
import { ColaboracionService } from "../../src/services/ColaboracionService.js";
import { ColaboracionModel, ProyectoModel, TareaModel } from "../../src/models/indexModel.js";
import { Tarea, MAX_TAREAS_POR_PROYECTO } from "../../src/domain/Tarea/Tarea.js";
import { EstadoTarea } from "../../src/domain/Tarea/EstadoTarea.js";
import { ConflictError, DomainError, NotFoundError } from "../../src/domain/errores.js";
import {
    conectarBaseDePrueba,
    desconectarBaseDePrueba,
    idInexistente,
    limpiarBaseDePrueba,
} from "../helpers/baseDePrueba.js";

const dia = (texto) => new Date(`${texto}T00:00:00.000Z`);

const datosTarea = (cambios = {}) => ({
    nombre: "Diseñar pantallas",
    descripcion: "Mockups principales",
    fechaInicio: dia("2026-11-02"),
    fechaFin: dia("2026-11-06"),
    ...cambios,
});

describe("TareaService con MongoDB", () => {
    let colectivoId;
    let proyectoId;

    beforeAll(conectarBaseDePrueba, 120000);
    afterAll(desconectarBaseDePrueba);

    const crearProyecto = async (colectivo = colectivoId) =>
        (
            await ProyectoModel.create({
                titulo: "Proyecto de prueba",
                descripcion: "Descripción del proyecto",
                colectivoId: colectivo,
                perfiles: [],
            })
        )._id.toString();

    const colaborar = (proyecto, colaboradoraId, anonimidad = false) =>
        ColaboracionModel.create({ proyectoId: proyecto, perfilId: "perfil-1", colaboradoraId, anonimidad });

    afterEach(() => jest.restoreAllMocks());

    beforeEach(async () => {
        await limpiarBaseDePrueba();
        colectivoId = idInexistente();
        proyectoId = await crearProyecto();
    });

    describe("crear", () => {
        test("guarda la tarea pendiente y sin responsable", async () => {
            const tarea = await TareaService.crear(proyectoId, datosTarea());
            const doc = await TareaModel.findById(tarea.id);

            expect(tarea).toBeInstanceOf(Tarea);
            expect(tarea.estado).toBe(EstadoTarea.PENDIENTE);
            expect(tarea.responsableId).toBeNull();
            expect(doc.proyectoId).toBe(proyectoId);
            expect(doc.nombre).toBe("Diseñar pantallas");
            expect(doc.fechaInicio).toEqual(dia("2026-11-02"));
        });

        test("siempre nace pendiente aunque el pedido traiga otro estado", async () => {
            const tarea = await TareaService.crear(proyectoId, datosTarea({ estado: EstadoTarea.FINALIZADA }));

            expect(tarea.estado).toBe(EstadoTarea.PENDIENTE);
        });

        test("acepta como responsable a una colaboradora del proyecto", async () => {
            const colaboradoraId = idInexistente();
            await colaborar(proyectoId, colaboradoraId);

            const tarea = await TareaService.crear(proyectoId, datosTarea({ responsableId: colaboradoraId }));

            expect(tarea.responsableId).toBe(colaboradoraId);
        });

        test("rechaza como responsable a alguien que no colabora en el proyecto", async () => {
            await expect(
                TareaService.crear(proyectoId, datosTarea({ responsableId: idInexistente() })),
            ).rejects.toThrow(DomainError);
            expect(await TareaModel.countDocuments()).toBe(0);
        });

        test("rechaza como responsable a quien colabora en otro proyecto", async () => {
            const colaboradoraId = idInexistente();
            await colaborar(await crearProyecto(), colaboradoraId);

            await expect(
                TareaService.crear(proyectoId, datosTarea({ responsableId: colaboradoraId })),
            ).rejects.toThrow(DomainError);
        });

        test("falla si el proyecto no existe o el id no es válido", async () => {
            await expect(TareaService.crear(idInexistente(), datosTarea())).rejects.toThrow(NotFoundError);
            await expect(TareaService.crear("no-es-un-id", datosTarea())).rejects.toThrow(NotFoundError);
        });

        test("no guarda nada si el dominio rechaza los datos", async () => {
            await expect(
                TareaService.crear(proyectoId, datosTarea({ fechaInicio: dia("2026-11-10"), fechaFin: dia("2026-11-01") })),
            ).rejects.toThrow(DomainError);
            expect(await TareaModel.countDocuments()).toBe(0);
        });

        test("no deja crear tareas en un proyecto finalizado", async () => {
            await ProyectoService.cerrarProyecto(colectivoId, proyectoId);

            await expect(TareaService.crear(proyectoId, datosTarea())).rejects.toThrow(ConflictError);
            expect(await TareaModel.countDocuments()).toBe(0);
        });

        test("respeta el máximo de tareas por proyecto", async () => {
            await TareaModel.insertMany(
                Array.from({ length: MAX_TAREAS_POR_PROYECTO }, (_, i) => ({
                    proyectoId,
                    nombre: `Tarea ${i}`,
                    fechaInicio: dia("2026-11-02"),
                    fechaFin: dia("2026-11-03"),
                })),
            );

            await expect(TareaService.crear(proyectoId, datosTarea())).rejects.toThrow(ConflictError);
            expect(await TareaModel.countDocuments()).toBe(MAX_TAREAS_POR_PROYECTO);
        });
    });

    describe("listar", () => {
        test("devuelve las tareas del proyecto ordenadas por fecha de inicio y de fin", async () => {
            await TareaService.crear(proyectoId, datosTarea({ nombre: "C", fechaInicio: dia("2026-11-20"), fechaFin: dia("2026-11-22") }));
            await TareaService.crear(proyectoId, datosTarea({ nombre: "B", fechaInicio: dia("2026-11-02"), fechaFin: dia("2026-11-09") }));
            await TareaService.crear(proyectoId, datosTarea({ nombre: "A", fechaInicio: dia("2026-11-02"), fechaFin: dia("2026-11-04") }));

            const tareas = await TareaService.listar(proyectoId);

            expect(tareas.map((t) => t.nombre)).toEqual(["A", "B", "C"]);
        });

        test("no mezcla las tareas de otros proyectos", async () => {
            await TareaService.crear(proyectoId, datosTarea());
            const otro = await crearProyecto();
            await TareaService.crear(otro, datosTarea({ nombre: "De otro proyecto" }));

            const tareas = await TareaService.listar(proyectoId);

            expect(tareas).toHaveLength(1);
            expect(tareas[0].proyectoId).toBe(proyectoId);
        });

        test("devuelve una lista vacía si el proyecto no tiene tareas", async () => {
            await expect(TareaService.listar(proyectoId)).resolves.toEqual([]);
        });

        test("falla si el proyecto no existe", async () => {
            await expect(TareaService.listar(idInexistente())).rejects.toThrow(NotFoundError);
        });
    });

    describe("privacidad del responsable", () => {
        let anonima;
        let publica;
        let tareaAnonima;
        let tareaPublica;

        beforeEach(async () => {
            anonima = idInexistente();
            publica = idInexistente();
            await colaborar(proyectoId, anonima, true);
            await colaborar(proyectoId, publica, false);
            tareaAnonima = await TareaService.crear(proyectoId, datosTarea({ nombre: "Anónima", responsableId: anonima }));
            tareaPublica = await TareaService.crear(
                proyectoId,
                datosTarea({ nombre: "Pública", fechaInicio: dia("2026-11-09"), fechaFin: dia("2026-11-10"), responsableId: publica }),
            );
        });

        const responsables = (tareas) => Object.fromEntries(tareas.map((t) => [t.nombre, t.responsableId]));

        test("un visitante no ve a la colaboradora anónima pero sí a la pública", async () => {
            const tareas = await TareaService.listar(proyectoId, undefined);

            expect(responsables(tareas)).toEqual({ Anónima: RESPONSABLE_ANONIMO, Pública: publica });
        });

        test("el colectivo dueño del proyecto ve a todos", async () => {
            const tareas = await TareaService.listar(proyectoId, { type: "colectivos", id: colectivoId });

            expect(responsables(tareas)).toEqual({ Anónima: anonima, Pública: publica });
        });

        test("otro colectivo no ve a la anónima", async () => {
            const tareas = await TareaService.listar(proyectoId, { type: "colectivos", id: idInexistente() });

            expect(responsables(tareas).Anónima).toBe(RESPONSABLE_ANONIMO);
        });

        test("la propia colaboradora anónima se ve a sí misma, pero otra colaboradora no la ve", async () => {
            const propia = await TareaService.listar(proyectoId, { type: "colaboradoras", id: anonima });
            const ajena = await TareaService.listar(proyectoId, { type: "colaboradoras", id: publica });

            expect(responsables(propia).Anónima).toBe(anonima);
            expect(responsables(ajena).Anónima).toBe(RESPONSABLE_ANONIMO);
        });

        test("una colaboradora anónima en un perfil y pública en otro se muestra", async () => {
            await ColaboracionModel.create({ proyectoId, perfilId: "perfil-2", colaboradoraId: anonima, anonimidad: false });

            const tareas = await TareaService.listar(proyectoId);

            expect(responsables(tareas).Anónima).toBe(anonima);
        });

        test("si la responsable se dio de baja, un visitante no ve quién era", async () => {
            await ColaboracionModel.deleteMany({ colaboradoraId: publica });

            const visitante = await TareaService.listar(proyectoId);
            const dueno = await TareaService.listar(proyectoId, { type: "colectivos", id: colectivoId });

            expect(responsables(visitante).Pública).toBe(RESPONSABLE_ANONIMO);
            expect(responsables(dueno).Pública).toBe(publica);
        });

        test("al darse de baja de verdad su colaboración queda terminada: se oculta, se sigue pudiendo editar y no se la puede asignar de nuevo", async () => {
            const colaboracion = await ColaboracionModel.findOne({ colaboradoraId: publica });
            await ColaboracionService.darDeBaja(colaboracion.id);

            const visitante = await TareaService.listar(proyectoId);
            const dueno = await TareaService.listar(proyectoId, { type: "colectivos", id: colectivoId });
            expect(responsables(visitante).Pública).toBe(RESPONSABLE_ANONIMO);
            expect(responsables(dueno).Pública).toBe(publica);

            // el front reenvía el mismo responsable al editar otra cosa: sigue funcionando
            await TareaService.actualizar(proyectoId, tareaPublica.id, { responsableId: publica, fechaFin: dia("2026-11-12") });
            expect((await TareaModel.findById(tareaPublica.id)).fechaFin).toEqual(dia("2026-11-12"));

            // pero no se la puede elegir como responsable de otra tarea
            await expect(
                TareaService.actualizar(proyectoId, tareaAnonima.id, { responsableId: publica }),
            ).rejects.toThrow(DomainError);
        });

        test("obtener una tarea aplica la misma regla", async () => {
            const visitante = await TareaService.obtener(proyectoId, tareaAnonima.id);
            const dueno = await TareaService.obtener(proyectoId, tareaAnonima.id, { type: "colectivos", id: colectivoId });
            const publicaVista = await TareaService.obtener(proyectoId, tareaPublica.id);

            expect(visitante.responsableId).toBe(RESPONSABLE_ANONIMO);
            expect(dueno.responsableId).toBe(anonima);
            expect(publicaVista.responsableId).toBe(publica);
        });

        test("ocultar al responsable no modifica lo guardado", async () => {
            await TareaService.listar(proyectoId);

            expect((await TareaModel.findById(tareaAnonima.id)).responsableId).toBe(anonima);
        });

        test("las tareas sin responsable no se tocan", async () => {
            const sin = await TareaService.crear(proyectoId, datosTarea({ nombre: "Sin responsable" }));

            expect((await TareaService.obtener(proyectoId, sin.id)).responsableId).toBeNull();
        });
    });

    describe("obtener", () => {
        test("devuelve la tarea", async () => {
            const creada = await TareaService.crear(proyectoId, datosTarea());

            const tarea = await TareaService.obtener(proyectoId, creada.id);

            expect(tarea.nombre).toBe("Diseñar pantallas");
        });

        test("una tarea de otro proyecto no existe para este", async () => {
            const otro = await crearProyecto();
            const ajena = await TareaService.crear(otro, datosTarea());

            await expect(TareaService.obtener(proyectoId, ajena.id)).rejects.toThrow(NotFoundError);
        });

        test("falla con ids inexistentes o inválidos", async () => {
            await expect(TareaService.obtener(proyectoId, idInexistente())).rejects.toThrow(NotFoundError);
            await expect(TareaService.obtener(proyectoId, "no-es-un-id")).rejects.toThrow(NotFoundError);
            await expect(TareaService.obtener(idInexistente(), idInexistente())).rejects.toThrow(NotFoundError);
        });
    });

    describe("actualizar", () => {
        let tarea;

        beforeEach(async () => {
            tarea = await TareaService.crear(proyectoId, datosTarea());
        });

        test("reprograma, persiste y conserva lo que no se informó", async () => {
            await TareaService.actualizar(proyectoId, tarea.id, { fechaFin: dia("2026-11-12") });
            const doc = await TareaModel.findById(tarea.id);

            expect(doc.fechaFin).toEqual(dia("2026-11-12"));
            expect(doc.fechaInicio).toEqual(dia("2026-11-02"));
            expect(doc.nombre).toBe("Diseñar pantallas");
            expect(doc.proyectoId).toBe(proyectoId);
        });

        test("cambia el estado respetando las transiciones", async () => {
            await TareaService.actualizar(proyectoId, tarea.id, { estado: EstadoTarea.FINALIZADA });
            expect((await TareaModel.findById(tarea.id)).estado).toBe(EstadoTarea.FINALIZADA);

            await expect(
                TareaService.actualizar(proyectoId, tarea.id, { estado: EstadoTarea.PENDIENTE }),
            ).rejects.toThrow(ConflictError);
            expect((await TareaModel.findById(tarea.id)).estado).toBe(EstadoTarea.FINALIZADA);
        });

        test("no deja elegir CERRADA a mano", async () => {
            await expect(
                TareaService.actualizar(proyectoId, tarea.id, { estado: EstadoTarea.CERRADA }),
            ).rejects.toThrow(DomainError);
            expect((await TareaModel.findById(tarea.id)).estado).toBe(EstadoTarea.PENDIENTE);
        });

        test("asigna, cambia y quita al responsable", async () => {
            const ada = idInexistente();
            const grace = idInexistente();
            await colaborar(proyectoId, ada);
            await colaborar(proyectoId, grace);

            await TareaService.actualizar(proyectoId, tarea.id, { responsableId: ada });
            expect((await TareaModel.findById(tarea.id)).responsableId).toBe(ada);

            await TareaService.actualizar(proyectoId, tarea.id, { responsableId: grace });
            expect((await TareaModel.findById(tarea.id)).responsableId).toBe(grace);

            await TareaService.actualizar(proyectoId, tarea.id, { responsableId: null });
            expect((await TareaModel.findById(tarea.id)).responsableId).toBeNull();
        });

        test("rechaza como nuevo responsable a quien no colabora en el proyecto", async () => {
            await expect(
                TareaService.actualizar(proyectoId, tarea.id, { responsableId: idInexistente() }),
            ).rejects.toThrow(DomainError);
            expect((await TareaModel.findById(tarea.id)).responsableId).toBeNull();
        });

        test("editar una tarea cuyo responsable se dio de baja sigue funcionando si el responsable no cambia", async () => {
            const ada = idInexistente();
            await colaborar(proyectoId, ada);
            await TareaService.actualizar(proyectoId, tarea.id, { responsableId: ada });
            await ColaboracionModel.deleteMany({ colaboradoraId: ada });

            // el front reenvía el mismo responsable junto con el resto de los campos
            await TareaService.actualizar(proyectoId, tarea.id, { responsableId: ada, fechaFin: dia("2026-11-09") });

            const doc = await TareaModel.findById(tarea.id);
            expect(doc.fechaFin).toEqual(dia("2026-11-09"));
            expect(doc.responsableId).toBe(ada);
        });

        test("no modifica lo guardado si los datos son inválidos", async () => {
            await expect(
                TareaService.actualizar(proyectoId, tarea.id, { nombre: "Nuevo nombre", fechaFin: dia("2026-10-01") }),
            ).rejects.toThrow(DomainError);

            const doc = await TareaModel.findById(tarea.id);
            expect(doc.nombre).toBe("Diseñar pantallas");
            expect(doc.fechaFin).toEqual(dia("2026-11-06"));
        });

        test("no puede tocar una tarea de otro proyecto, aunque se use el id de un proyecto propio", async () => {
            const otro = await crearProyecto();
            const ajena = await TareaService.crear(otro, datosTarea({ nombre: "Ajena" }));

            await expect(TareaService.actualizar(proyectoId, ajena.id, { nombre: "Pisada" })).rejects.toThrow(NotFoundError);
            expect((await TareaModel.findById(ajena.id)).nombre).toBe("Ajena");
        });

        test("falla con ids inexistentes o inválidos", async () => {
            await expect(TareaService.actualizar(proyectoId, idInexistente(), { nombre: "x" })).rejects.toThrow(NotFoundError);
            await expect(TareaService.actualizar(proyectoId, "no-es-un-id", { nombre: "x" })).rejects.toThrow(NotFoundError);
            await expect(TareaService.actualizar(idInexistente(), tarea.id, { nombre: "x" })).rejects.toThrow(NotFoundError);
        });

        test("no deja editar tareas de un proyecto finalizado", async () => {
            await ProyectoService.cerrarProyecto(colectivoId, proyectoId);

            await expect(TareaService.actualizar(proyectoId, tarea.id, { nombre: "Otro" })).rejects.toThrow(ConflictError);
        });
    });

    describe("eliminar", () => {
        test("borra la tarea y la devuelve", async () => {
            const tarea = await TareaService.crear(proyectoId, datosTarea());

            const borrada = await TareaService.eliminar(proyectoId, tarea.id);

            expect(borrada.id).toBe(tarea.id);
            expect(await TareaModel.countDocuments()).toBe(0);
        });

        test("no borra una tarea de otro proyecto", async () => {
            const otro = await crearProyecto();
            const ajena = await TareaService.crear(otro, datosTarea());

            await expect(TareaService.eliminar(proyectoId, ajena.id)).rejects.toThrow(NotFoundError);
            expect(await TareaModel.countDocuments()).toBe(1);
        });

        test("falla con ids inexistentes o inválidos", async () => {
            await expect(TareaService.eliminar(proyectoId, idInexistente())).rejects.toThrow(NotFoundError);
            await expect(TareaService.eliminar(proyectoId, "no-es-un-id")).rejects.toThrow(NotFoundError);
        });

        test("no deja borrar tareas de un proyecto finalizado", async () => {
            const tarea = await TareaService.crear(proyectoId, datosTarea());
            await ProyectoService.cerrarProyecto(colectivoId, proyectoId);

            await expect(TareaService.eliminar(proyectoId, tarea.id)).rejects.toThrow(ConflictError);
            expect(await TareaModel.countDocuments()).toBe(1);
        });
    });

    describe("al finalizar el proyecto", () => {
        test("las tareas sin terminar quedan cerradas y las finalizadas se conservan", async () => {
            const pendiente = await TareaService.crear(proyectoId, datosTarea({ nombre: "Pendiente" }));
            const enCurso = await TareaService.crear(proyectoId, datosTarea({ nombre: "En curso" }));
            const finalizada = await TareaService.crear(proyectoId, datosTarea({ nombre: "Finalizada" }));
            await TareaService.actualizar(proyectoId, enCurso.id, { estado: EstadoTarea.EN_CURSO });
            await TareaService.actualizar(proyectoId, finalizada.id, { estado: EstadoTarea.FINALIZADA });

            await ProyectoService.cerrarProyecto(colectivoId, proyectoId);

            const estado = async (tarea) => (await TareaModel.findById(tarea.id)).estado;
            expect(await estado(pendiente)).toBe(EstadoTarea.CERRADA);
            expect(await estado(enCurso)).toBe(EstadoTarea.CERRADA);
            expect(await estado(finalizada)).toBe(EstadoTarea.FINALIZADA);
        });

        test("las tareas de otros proyectos no se tocan", async () => {
            const otro = await crearProyecto();
            const ajena = await TareaService.crear(otro, datosTarea());

            await ProyectoService.cerrarProyecto(colectivoId, proyectoId);

            expect((await TareaModel.findById(ajena.id)).estado).toBe(EstadoTarea.PENDIENTE);
        });

        test("las tareas siguen visibles después de finalizar", async () => {
            await TareaService.crear(proyectoId, datosTarea());

            await ProyectoService.cerrarProyecto(colectivoId, proyectoId);

            const tareas = await TareaService.listar(proyectoId);
            expect(tareas).toHaveLength(1);
            expect(tareas[0].estado).toBe(EstadoTarea.CERRADA);
        });

        test("cerrar de nuevo las tareas no cambia nada", async () => {
            await TareaService.crear(proyectoId, datosTarea());

            expect(await TareaService.cerrarDeProyecto(proyectoId)).toBe(1);
            expect(await TareaService.cerrarDeProyecto(proyectoId)).toBe(0);
        });

        test("una tarea creada justo mientras se finaliza no queda pendiente en un proyecto finalizado", async () => {
            const resultados = await Promise.allSettled([
                ProyectoService.cerrarProyecto(colectivoId, proyectoId),
                TareaService.crear(proyectoId, datosTarea()),
            ]);

            expect(resultados[0].status).toBe("fulfilled");
            expect(await TareaModel.countDocuments({ proyectoId, estado: EstadoTarea.PENDIENTE })).toBe(0);
        });

        test("si el proyecto ya estaba finalizado no se vuelve a tocar nada", async () => {
            await ProyectoService.cerrarProyecto(colectivoId, proyectoId);

            await expect(ProyectoService.cerrarProyecto(colectivoId, proyectoId)).rejects.toThrow(ConflictError);
        });

        test("si falla el cierre de las tareas el proyecto sigue activo y volver a finalizar lo completa", async () => {
            const tarea = await TareaService.crear(proyectoId, datosTarea());
            jest.spyOn(TareaService, "cerrarDeProyecto").mockRejectedValueOnce(new Error("falla simulada"));

            await expect(ProyectoService.cerrarProyecto(colectivoId, proyectoId)).rejects.toThrow("falla simulada");
            expect((await ProyectoModel.findById(proyectoId)).estado).toBe("ACTIVO");
            expect((await TareaModel.findById(tarea.id)).estado).toBe(EstadoTarea.PENDIENTE);

            await ProyectoService.cerrarProyecto(colectivoId, proyectoId);

            expect((await ProyectoModel.findById(proyectoId)).estado).toBe("FINALIZADO");
            expect((await TareaModel.findById(tarea.id)).estado).toBe(EstadoTarea.CERRADA);
        });

        test("el cierre automático de proyectos vencidos también cierra las tareas sin terminar", async () => {
            const pendiente = await TareaService.crear(proyectoId, datosTarea({ nombre: "Pendiente" }));
            const hecha = await TareaService.crear(proyectoId, datosTarea({ nombre: "Hecha" }));
            await TareaService.actualizar(proyectoId, hecha.id, { estado: EstadoTarea.FINALIZADA });
            await ProyectoModel.updateOne({ _id: proyectoId }, { $set: { fechaCierre: new Date("2026-01-01T00:00:00.000Z") } });

            const resultado = await ProyectoService.cerrarVencidos(new Date("2026-06-01T00:00:00.000Z"));

            expect(resultado.cerrados).toBe(1);
            expect((await ProyectoModel.findById(proyectoId)).estado).toBe("FINALIZADO");
            expect((await TareaModel.findById(pendiente.id)).estado).toBe(EstadoTarea.CERRADA);
            expect((await TareaModel.findById(hecha.id)).estado).toBe(EstadoTarea.FINALIZADA);
        });

        test("un proyecto que no venció no toca sus tareas", async () => {
            const tarea = await TareaService.crear(proyectoId, datosTarea());
            await ProyectoModel.updateOne({ _id: proyectoId }, { $set: { fechaCierre: new Date("2027-01-01T00:00:00.000Z") } });

            const resultado = await ProyectoService.cerrarVencidos(new Date("2026-06-01T00:00:00.000Z"));

            expect(resultado.cerrados).toBe(0);
            expect((await TareaModel.findById(tarea.id)).estado).toBe(EstadoTarea.PENDIENTE);
        });
    });

    describe("al eliminar el proyecto", () => {
        test("se borran sus tareas y las de otros proyectos quedan", async () => {
            await TareaService.crear(proyectoId, datosTarea());
            await TareaService.crear(proyectoId, datosTarea({ nombre: "Otra" }));
            const otro = await crearProyecto();
            await TareaService.crear(otro, datosTarea());

            await ProyectoService.eliminar(colectivoId, proyectoId);

            expect(await TareaModel.countDocuments({ proyectoId })).toBe(0);
            expect(await TareaModel.countDocuments({ proyectoId: otro })).toBe(1);
        });

        test("una tarea que se está creando mientras se elimina el proyecto no queda huérfana", async () => {
            // se demora el guardado de la tarea para que, sin el turno compartido, el borrado del proyecto termine antes
            const guardar = TareaModel.create.bind(TareaModel);
            jest.spyOn(TareaModel, "create").mockImplementation(async (...args) => {
                await new Promise((resolve) => setTimeout(resolve, 150));
                return guardar(...args);
            });

            const creando = TareaService.crear(proyectoId, datosTarea());
            await new Promise((resolve) => setTimeout(resolve, 30));
            const eliminando = ProyectoService.eliminar(colectivoId, proyectoId);
            await Promise.allSettled([creando, eliminando]);

            expect(await ProyectoModel.countDocuments({ _id: proyectoId })).toBe(0);
            expect(await TareaModel.countDocuments({ proyectoId })).toBe(0);
        });

        test("una tarea que se crea justo después de eliminar el proyecto se rechaza", async () => {
            await ProyectoService.eliminar(colectivoId, proyectoId);

            await expect(TareaService.crear(proyectoId, datosTarea())).rejects.toThrow(NotFoundError);
            expect(await TareaModel.countDocuments({ proyectoId })).toBe(0);
        });

        test("un proyecto con historial no se elimina y sus tareas se conservan", async () => {
            await TareaService.crear(proyectoId, datosTarea());
            await colaborar(proyectoId, idInexistente());

            await expect(ProyectoService.eliminar(colectivoId, proyectoId)).rejects.toThrow(DomainError);

            expect(await ProyectoModel.countDocuments({ _id: proyectoId })).toBe(1);
            expect(await TareaModel.countDocuments({ proyectoId })).toBe(1);
        });
    });

    describe("límite de tareas en paralelo", () => {
        test("crear más tareas de las permitidas a la vez nunca supera el máximo", async () => {
            const resultados = await Promise.allSettled(
                Array.from({ length: MAX_TAREAS_POR_PROYECTO + 20 }, (_, i) =>
                    TareaService.crear(proyectoId, datosTarea({ nombre: `Tarea ${i}` })),
                ),
            );

            expect(resultados.filter((r) => r.status === "fulfilled")).toHaveLength(MAX_TAREAS_POR_PROYECTO);
            expect(await TareaModel.countDocuments({ proyectoId })).toBe(MAX_TAREAS_POR_PROYECTO);
        });
    });

    describe("no afecta al proyecto ni a otros servicios", () => {
        test("el proyecto no trae las tareas en su respuesta", async () => {
            await TareaService.crear(proyectoId, datosTarea());

            const proyecto = await ProyectoService.obtenerPorId(proyectoId);
            const listado = await ProyectoService.listar();

            expect(JSON.parse(JSON.stringify(proyecto))).not.toHaveProperty("tareas");
            expect(JSON.parse(JSON.stringify(listado[0]))).not.toHaveProperty("tareas");
        });

        test("modificar logros del proyecto no borra las tareas", async () => {
            await TareaService.crear(proyectoId, datosTarea());

            await LogroService.crear(proyectoId, { descripcion: "Primer logro", porcentajeCompletitud: 10 });

            expect(await TareaModel.countDocuments({ proyectoId })).toBe(1);
            expect((await ProyectoModel.findById(proyectoId)).logros).toHaveLength(1);
        });
    });
});

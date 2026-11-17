import { describe, test, expect } from "@jest/globals";
import {
    Tarea,
    MAX_DURACION_EN_DIAS,
    MAX_LARGO_DESCRIPCION,
    MAX_LARGO_NOMBRE,
} from "../../src/domain/Tarea/Tarea.js";
import { EstadoTarea } from "../../src/domain/Tarea/EstadoTarea.js";
import { ConflictError, DomainError } from "../../src/domain/errores.js";

const dia = (texto) => new Date(`${texto}T00:00:00.000Z`);

const crearTarea = (cambios = {}) => {
    const datos = {
        id: "t1",
        proyectoId: "p1",
        nombre: "Diseñar pantallas",
        descripcion: "Mockups de las pantallas principales",
        fechaInicio: dia("2026-11-02"),
        fechaFin: dia("2026-11-06"),
        responsableId: null,
        estado: EstadoTarea.PENDIENTE,
        ...cambios,
    };
    return new Tarea(
        datos.id,
        datos.proyectoId,
        datos.nombre,
        datos.descripcion,
        datos.fechaInicio,
        datos.fechaFin,
        datos.responsableId,
        datos.estado,
    );
};

describe("Tarea", () => {
    describe("creación", () => {
        test("se crea pendiente y sin responsable por defecto", () => {
            const tarea = new Tarea("t1", "p1", "Armar API", "", dia("2026-11-02"), dia("2026-11-03"));

            expect(tarea.estado).toBe(EstadoTarea.PENDIENTE);
            expect(tarea.responsableId).toBeNull();
            expect(tarea.descripcion).toBeNull();
        });

        test("recorta los espacios del nombre y la descripción", () => {
            const tarea = crearTarea({ nombre: "  Armar API  ", descripcion: "  detalle  " });

            expect(tarea.nombre).toBe("Armar API");
            expect(tarea.descripcion).toBe("detalle");
        });

        test.each([["vacío", ""], ["solo espacios", "   "], ["no texto", 5]])(
            "rechaza un nombre %s",
            (_caso, nombre) => {
                expect(() => crearTarea({ nombre })).toThrow(DomainError);
            },
        );

        test("rechaza un nombre demasiado largo", () => {
            expect(() => crearTarea({ nombre: "a".repeat(MAX_LARGO_NOMBRE + 1) })).toThrow(DomainError);
            expect(() => crearTarea({ nombre: "a".repeat(MAX_LARGO_NOMBRE) })).not.toThrow();
        });

        test("rechaza una descripción demasiado larga o que no es texto", () => {
            expect(() => crearTarea({ descripcion: "a".repeat(MAX_LARGO_DESCRIPCION + 1) })).toThrow(DomainError);
            expect(() => crearTarea({ descripcion: 10 })).toThrow(DomainError);
        });

        test("rechaza un proyecto vacío", () => {
            expect(() => crearTarea({ proyectoId: "" })).toThrow(DomainError);
        });

        test("rechaza un responsable que no es texto no vacío", () => {
            expect(() => crearTarea({ responsableId: "  " })).toThrow(DomainError);
            expect(() => crearTarea({ responsableId: 7 })).toThrow(DomainError);
        });

        test("rechaza un estado inválido", () => {
            expect(() => crearTarea({ estado: "HECHA" })).toThrow(DomainError);
        });
    });

    describe("fechas", () => {
        test("rechaza fechas que no son Date válidas", () => {
            expect(() => crearTarea({ fechaInicio: "2026-11-02" })).toThrow(DomainError);
            expect(() => crearTarea({ fechaFin: new Date("no es fecha") })).toThrow(DomainError);
            expect(() => crearTarea({ fechaInicio: undefined })).toThrow(DomainError);
        });

        test("rechaza una fecha de fin anterior a la de inicio", () => {
            expect(() => crearTarea({ fechaInicio: dia("2026-11-10"), fechaFin: dia("2026-11-09") })).toThrow(
                DomainError,
            );
        });

        test("permite una tarea de un solo día", () => {
            const tarea = crearTarea({ fechaInicio: dia("2026-11-10"), fechaFin: dia("2026-11-10") });

            expect(tarea.duracionEnDias()).toBe(1);
        });

        test("rechaza fechas fuera del rango permitido", () => {
            expect(() => crearTarea({ fechaInicio: dia("2019-12-31"), fechaFin: dia("2020-01-02") })).toThrow(
                DomainError,
            );
            expect(() => crearTarea({ fechaInicio: dia("2050-12-30"), fechaFin: dia("2051-01-02") })).toThrow(
                DomainError,
            );
        });

        test("rechaza una duración mayor a la máxima y acepta la máxima", () => {
            const inicio = dia("2026-01-01");
            const fin = new Date(inicio.getTime() + (MAX_DURACION_EN_DIAS - 1) * 86400000);

            expect(() => crearTarea({ fechaInicio: inicio, fechaFin: fin })).not.toThrow();
            expect(() =>
                crearTarea({ fechaInicio: inicio, fechaFin: new Date(fin.getTime() + 86400000) }),
            ).toThrow(DomainError);
        });
    });

    describe("duración", () => {
        test("cuenta el día de inicio y el de fin", () => {
            expect(crearTarea().duracionEnDias()).toBe(5);
        });

        test("se recalcula al reprogramar", () => {
            const tarea = crearTarea();

            tarea.actualizar({ fechaFin: dia("2026-11-12") });

            expect(tarea.duracionEnDias()).toBe(11);
        });

        test("cruza el cambio de mes sin errores", () => {
            const tarea = crearTarea({ fechaInicio: dia("2026-11-28"), fechaFin: dia("2026-12-03") });

            expect(tarea.duracionEnDias()).toBe(6);
        });
    });

    describe("estados", () => {
        test.each([
            [EstadoTarea.PENDIENTE, EstadoTarea.EN_CURSO],
            [EstadoTarea.PENDIENTE, EstadoTarea.FINALIZADA],
            [EstadoTarea.EN_CURSO, EstadoTarea.PENDIENTE],
            [EstadoTarea.EN_CURSO, EstadoTarea.FINALIZADA],
            [EstadoTarea.FINALIZADA, EstadoTarea.EN_CURSO],
        ])("permite pasar de %s a %s", (desde, hacia) => {
            const tarea = crearTarea({ estado: desde });

            tarea.cambiarEstado(hacia);

            expect(tarea.estado).toBe(hacia);
        });

        test("no se puede volver de FINALIZADA a PENDIENTE", () => {
            const tarea = crearTarea({ estado: EstadoTarea.FINALIZADA });

            expect(() => tarea.cambiarEstado(EstadoTarea.PENDIENTE)).toThrow(ConflictError);
            expect(tarea.estado).toBe(EstadoTarea.FINALIZADA);
        });

        test("pasar al mismo estado no hace nada", () => {
            const tarea = crearTarea({ estado: EstadoTarea.EN_CURSO });

            expect(() => tarea.cambiarEstado(EstadoTarea.EN_CURSO)).not.toThrow();
            expect(tarea.estado).toBe(EstadoTarea.EN_CURSO);
        });

        test("no se puede elegir CERRADA a mano", () => {
            const tarea = crearTarea();

            expect(() => tarea.cambiarEstado(EstadoTarea.CERRADA)).toThrow(DomainError);
            expect(() => tarea.actualizar({ estado: EstadoTarea.CERRADA })).toThrow(DomainError);
            expect(tarea.estado).toBe(EstadoTarea.PENDIENTE);
        });

        test("una tarea CERRADA no cambia de estado", () => {
            const tarea = crearTarea({ estado: EstadoTarea.CERRADA });

            expect(() => tarea.cambiarEstado(EstadoTarea.EN_CURSO)).toThrow(ConflictError);
            expect(() => tarea.cambiarEstado(EstadoTarea.FINALIZADA)).toThrow(ConflictError);
        });

        test("un estado desconocido es un error de dominio", () => {
            expect(() => crearTarea().cambiarEstado("HECHA")).toThrow(DomainError);
        });
    });

    describe("cerrar", () => {
        test.each([EstadoTarea.PENDIENTE, EstadoTarea.EN_CURSO])("una tarea %s pasa a CERRADA", (estado) => {
            const tarea = crearTarea({ estado });

            expect(tarea.cerrar()).toBe(true);
            expect(tarea.estado).toBe(EstadoTarea.CERRADA);
        });

        test("una tarea FINALIZADA se conserva", () => {
            const tarea = crearTarea({ estado: EstadoTarea.FINALIZADA });

            expect(tarea.cerrar()).toBe(false);
            expect(tarea.estado).toBe(EstadoTarea.FINALIZADA);
        });

        test("cerrar una tarea ya cerrada no cambia nada", () => {
            const tarea = crearTarea({ estado: EstadoTarea.CERRADA });

            expect(tarea.cerrar()).toBe(false);
        });
    });

    describe("actualizar", () => {
        test("modifica solo lo informado y conserva el resto", () => {
            const tarea = crearTarea({ responsableId: "c1" });

            tarea.actualizar({ nombre: "Rediseñar pantallas" });

            expect(tarea.nombre).toBe("Rediseñar pantallas");
            expect(tarea.descripcion).toBe("Mockups de las pantallas principales");
            expect(tarea.responsableId).toBe("c1");
            expect(tarea.fechaInicio).toEqual(dia("2026-11-02"));
        });

        test("permite reprogramar una sola fecha validándola contra la otra", () => {
            const tarea = crearTarea();

            expect(() => tarea.actualizar({ fechaInicio: dia("2026-11-20") })).toThrow(DomainError);
            expect(tarea.fechaInicio).toEqual(dia("2026-11-02"));

            tarea.actualizar({ fechaInicio: dia("2026-11-04") });
            expect(tarea.fechaInicio).toEqual(dia("2026-11-04"));
        });

        test("null limpia el responsable y la descripción", () => {
            const tarea = crearTarea({ responsableId: "c1" });

            tarea.actualizar({ responsableId: null, descripcion: null });

            expect(tarea.responsableId).toBeNull();
            expect(tarea.descripcion).toBeNull();
        });

        test("un texto vacío limpia la descripción", () => {
            const tarea = crearTarea();

            tarea.actualizar({ descripcion: "   " });

            expect(tarea.descripcion).toBeNull();
        });

        test("cambia el estado respetando las transiciones", () => {
            const tarea = crearTarea();

            tarea.actualizar({ estado: EstadoTarea.EN_CURSO });

            expect(tarea.estado).toBe(EstadoTarea.EN_CURSO);
        });

        test("repetir el estado actual no falla", () => {
            const tarea = crearTarea({ estado: EstadoTarea.FINALIZADA });

            expect(() => tarea.actualizar({ estado: EstadoTarea.FINALIZADA, nombre: "Nuevo nombre" })).not.toThrow();
            expect(tarea.nombre).toBe("Nuevo nombre");
        });

        test("si algo es inválido no modifica nada", () => {
            const tarea = crearTarea({ responsableId: "c1" });
            const antes = JSON.stringify(tarea);

            expect(() =>
                tarea.actualizar({ nombre: "Nombre válido", fechaFin: dia("2026-10-01"), responsableId: null }),
            ).toThrow(DomainError);
            expect(() => tarea.actualizar({ nombre: "Otro", estado: "HECHA" })).toThrow(DomainError);

            expect(JSON.stringify(tarea)).toBe(antes);
        });

        test("una transición inválida no deja cambios a medias", () => {
            const tarea = crearTarea({ estado: EstadoTarea.FINALIZADA });
            const antes = JSON.stringify(tarea);

            expect(() => tarea.actualizar({ nombre: "Otro nombre", estado: EstadoTarea.PENDIENTE })).toThrow(
                ConflictError,
            );

            expect(JSON.stringify(tarea)).toBe(antes);
        });

        test("no modifica el id ni el proyecto", () => {
            const tarea = crearTarea();

            tarea.actualizar({ id: "otro", proyectoId: "otro", nombre: "Nuevo" });

            expect(tarea.id).toBe("t1");
            expect(tarea.proyectoId).toBe("p1");
        });

        test("rechaza datos que no son un objeto", () => {
            const tarea = crearTarea();

            expect(() => tarea.actualizar(null)).toThrow(DomainError);
            expect(() => tarea.actualizar([])).toThrow(DomainError);
        });
    });

    describe("conResponsable", () => {
        test("devuelve otra tarea igual con otro responsable sin tocar la original", () => {
            const tarea = crearTarea({ responsableId: "c1" });

            const enmascarada = tarea.conResponsable("Anonimo");

            expect(enmascarada).not.toBe(tarea);
            expect(enmascarada.responsableId).toBe("Anonimo");
            expect(enmascarada.nombre).toBe(tarea.nombre);
            expect(tarea.responsableId).toBe("c1");
        });
    });

    describe("toJSON", () => {
        test("expone las fechas como día, la duración calculada y no las pierde al serializar", () => {
            const tarea = crearTarea({ responsableId: "c1" });

            const json = JSON.parse(JSON.stringify(tarea));

            expect(json).toEqual({
                id: "t1",
                proyectoId: "p1",
                nombre: "Diseñar pantallas",
                descripcion: "Mockups de las pantallas principales",
                fechaInicio: "2026-11-02",
                fechaFin: "2026-11-06",
                duracion: 5,
                responsableId: "c1",
                estado: EstadoTarea.PENDIENTE,
                fechaCreacion: tarea.fechaCreacion.toISOString(),
            });
        });
    });
});

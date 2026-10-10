import { describe, test, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { db } from "../../src/data/db.js";
import { Colaboradora } from "../../src/domain/Colaboradora/Colaboradora.js";
import { MedioContacto } from "../../src/domain/Colaboradora/MedioContacto.js";
import { TipoMedioContacto } from "../../src/domain/Colaboradora/TipoMedioContacto.js";
import { Colectivo } from "../../src/domain/Colectivo/Colectivo.js";
import { TipoColectivo } from "../../src/domain/Colectivo/TipoColectivo.js";
import { Proyecto } from "../../src/domain/Proyecto/Proyecto.js";
import { ConflictError, DomainError, NotFoundError } from "../../src/domain/errores.js";
import { NotificacionService } from "../../src/services/NotificacionService.js";

describe("NotificacionService", () => {
    let colaboradora;
    let datos;
    let consola;

    beforeEach(() => {
        db.colectivos.length = 0;
        db.proyectos.length = 0;
        db.colaboradoras.length = 0;
        db.notificaciones.length = 0;

        db.colectivos.push(new Colectivo("colectivo1", "Verde", "Cuidamos plazas", "CABA", TipoColectivo.ONG));
        db.colectivos.push(new Colectivo("colectivo2", "Azul", "Cuidamos rios", "CABA", TipoColectivo.ONG));
        db.proyectos.push(new Proyecto("proy1", "Plazas", "App de plazas", "colectivo1", []));

        colaboradora = new Colaboradora("col1", "Ana", "github.com/ana", "Ana Pérez", ["react"], "ella", "hola");
        colaboradora.agregarMedioContacto(new MedioContacto(TipoMedioContacto.EMAIL, "ana@mail.com"));
        colaboradora.agregarMedioContacto(new MedioContacto(TipoMedioContacto.SMS, "1157612305"));
        colaboradora.cambiarAceptaMensajeria(true);
        db.colaboradoras.push(colaboradora);

        datos = { colaboradoraId: "col1", colectivoId: "colectivo1", proyectoId: "proy1", texto: "Te necesitamos" };
        consola = jest.spyOn(console, "log").mockImplementation(() => {});
    });

    afterEach(() => {
        consola.mockRestore();
    });

    test("crea la notificación y la guarda", () => {
        const { notificacion } = NotificacionService.crear(datos);

        expect(notificacion.colaboradoraId).toBe("col1");
        expect(db.notificaciones).toEqual([notificacion]);
    });

    test("la replica por cada medio de contacto", () => {
        const { mediosUsados } = NotificacionService.crear(datos);

        expect(mediosUsados).toEqual([TipoMedioContacto.EMAIL, TipoMedioContacto.SMS]);
        expect(consola).toHaveBeenCalledTimes(2);
        expect(consola).toHaveBeenCalledWith(expect.stringContaining("[EMAIL] a ana@mail.com"));
        expect(consola).toHaveBeenCalledWith(expect.stringContaining("[SMS] a 1157612305"));
    });

    test("si no tiene medios igual crea la interna y no envía nada", () => {
        colaboradora.mediosContacto.length = 0;

        const { notificacion, mediosUsados } = NotificacionService.crear(datos);

        expect(notificacion).toBeDefined();
        expect(mediosUsados).toEqual([]);
        expect(consola).not.toHaveBeenCalled();
    });

    test("no notifica a quien no acepta mensajería", () => {
        colaboradora.cambiarAceptaMensajeria(false);

        expect(() => NotificacionService.crear(datos)).toThrow(ConflictError);
        expect(db.notificaciones).toHaveLength(0);
        expect(consola).not.toHaveBeenCalled();
    });

    test("falla si la colaboradora no existe", () => {
        expect(() => NotificacionService.crear({ ...datos, colaboradoraId: "nadie" })).toThrow(NotFoundError);
    });

    test("falla si el colectivo no existe", () => {
        expect(() => NotificacionService.crear({ ...datos, colectivoId: "nadie" })).toThrow(NotFoundError);
    });

    test("falla si el proyecto no existe", () => {
        expect(() => NotificacionService.crear({ ...datos, proyectoId: "nadie" })).toThrow(NotFoundError);
    });

    test("falla si el proyecto es de otro colectivo", () => {
        expect(() => NotificacionService.crear({ ...datos, colectivoId: "colectivo2" })).toThrow(DomainError);
    });

    test("lista solo las notificaciones de la colaboradora", () => {
        const otra = new Colaboradora("col2", "Bea", "github.com/bea", "Bea Gómez", ["react"], "ella", "hola");
        otra.cambiarAceptaMensajeria(true);
        db.colaboradoras.push(otra);

        NotificacionService.crear(datos);
        NotificacionService.crear({ ...datos, colaboradoraId: "col2" });

        const lista = NotificacionService.listarDeColaboradora("col1");

        expect(lista).toHaveLength(1);
        expect(lista[0].colaboradoraId).toBe("col1");
    });

    test("listar falla si la colaboradora no existe", () => {
        expect(() => NotificacionService.listarDeColaboradora("nadie")).toThrow(NotFoundError);
    });
});

import { describe, test, expect, beforeAll, beforeEach, afterEach, afterAll, jest } from "@jest/globals";
import { ColaboradoraModel, ColectivoModel, NotificacionModel, ProyectoModel } from "../../src/models/indexModel.js";
import { TipoMedioContacto } from "../../src/domain/Colaboradora/TipoMedioContacto.js";
import { ConflictError, DomainError, NotFoundError } from "../../src/domain/errores.js";
import { NotificacionService } from "../../src/services/NotificacionService.js";
import {
    conectarBaseDePrueba,
    desconectarBaseDePrueba,
    idInexistente,
    limpiarBaseDePrueba,
} from "../helpers/baseDePrueba.js";

const crearColaboradora = (nombre, extra = {}) =>
    ColaboradoraModel.create({
        nombreFantasia: nombre,
        github: `github.com/${nombre}`,
        nombreApellido: `${nombre} Pérez`,
        habilidades: ["react"],
        aceptaMensajeria: true,
        mediosContacto: [],
        ...extra,
    });

describe("NotificacionService", () => {
    let colaboradora;
    let colectivo;
    let otroColectivo;
    let proyecto;
    let datos;
    let consola;

    beforeAll(conectarBaseDePrueba, 120000);
    afterAll(desconectarBaseDePrueba);

    beforeEach(async () => {
        await limpiarBaseDePrueba();

        colectivo = await ColectivoModel.create({ nombre: "Verde", descripcion: "Cuidamos plazas", tipo: "ONG", ubicacion: "CABA" });
        otroColectivo = await ColectivoModel.create({ nombre: "Azul", descripcion: "Cuidamos rios", tipo: "ONG", ubicacion: "CABA" });
        proyecto = await ProyectoModel.create({ titulo: "Plazas", descripcion: "App de plazas", colectivoId: colectivo.id });
        colaboradora = await crearColaboradora("Ana", {
            mediosContacto: [
                { tipo: TipoMedioContacto.EMAIL, valor: "ana@mail.com" },
                { tipo: TipoMedioContacto.SMS, valor: "1157612305" },
            ],
        });

        datos = { colaboradoraId: colaboradora.id, colectivoId: colectivo.id, proyectoId: proyecto.id, texto: "Te necesitamos" };
        consola = jest.spyOn(console, "log").mockImplementation(() => {});
    });

    afterEach(() => {
        consola.mockRestore();
    });

    test("crea la notificación y la guarda en la base", async () => {
        const { notificacion } = await NotificacionService.crear(datos);

        expect(notificacion.colaboradoraId).toBe(colaboradora.id);
        expect(await NotificacionModel.countDocuments()).toBe(1);
    });

    test("la replica por cada medio de contacto", async () => {
        const { mediosUsados } = await NotificacionService.crear(datos);

        expect(mediosUsados).toEqual([TipoMedioContacto.EMAIL, TipoMedioContacto.SMS]);
        expect(consola).toHaveBeenCalledTimes(2);
        expect(consola).toHaveBeenCalledWith(expect.stringContaining("[EMAIL] a ana@mail.com"));
        expect(consola).toHaveBeenCalledWith(expect.stringContaining("[SMS] a 1157612305"));
    });

    test("si no tiene medios igual crea la interna y no envía nada", async () => {
        const sinMedios = await crearColaboradora("Sin");

        const { notificacion, mediosUsados } = await NotificacionService.crear({ ...datos, colaboradoraId: sinMedios.id });

        expect(notificacion).toBeDefined();
        expect(mediosUsados).toEqual([]);
        expect(consola).not.toHaveBeenCalled();
    });

    test("no notifica a quien no acepta mensajería", async () => {
        const noAcepta = await crearColaboradora("Nora", { aceptaMensajeria: false });

        await expect(NotificacionService.crear({ ...datos, colaboradoraId: noAcepta.id })).rejects.toThrow(ConflictError);
        expect(await NotificacionModel.countDocuments()).toBe(0);
        expect(consola).not.toHaveBeenCalled();
    });

    test("no guarda ni envía si el texto está vacío", async () => {
        await expect(NotificacionService.crear({ ...datos, texto: "   " })).rejects.toThrow(DomainError);
        expect(await NotificacionModel.countDocuments()).toBe(0);
        expect(consola).not.toHaveBeenCalled();
    });

    test("falla si la colaboradora no existe", async () => {
        await expect(NotificacionService.crear({ ...datos, colaboradoraId: idInexistente() })).rejects.toThrow(NotFoundError);
    });

    test("falla si el colectivo no existe", async () => {
        await expect(NotificacionService.crear({ ...datos, colectivoId: idInexistente() })).rejects.toThrow(NotFoundError);
    });

    test("falla si el proyecto no existe", async () => {
        await expect(NotificacionService.crear({ ...datos, proyectoId: idInexistente() })).rejects.toThrow(NotFoundError);
    });

    test("falla si el proyecto es de otro colectivo", async () => {
        await expect(NotificacionService.crear({ ...datos, colectivoId: otroColectivo.id })).rejects.toThrow(DomainError);
    });

    test("lista solo las notificaciones de la colaboradora", async () => {
        const otra = await crearColaboradora("Bea");

        await NotificacionService.crear(datos);
        await NotificacionService.crear({ ...datos, colaboradoraId: otra.id });

        const lista = await NotificacionService.listarDeColaboradora(colaboradora.id);

        expect(lista).toHaveLength(1);
        expect(lista[0].colaboradoraId).toBe(colaboradora.id);
    });

    test("listar falla si la colaboradora no existe", async () => {
        await expect(NotificacionService.listarDeColaboradora(idInexistente())).rejects.toThrow(NotFoundError);
    });
});

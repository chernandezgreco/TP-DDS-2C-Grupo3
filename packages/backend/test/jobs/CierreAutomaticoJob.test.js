import {
    beforeEach,
    afterEach,
    test,
    expect,
    jest,
} from "@jest/globals";
import { iniciarCierreAutomatico } from "../../src/jobs/cierreAutomatico.js";
import { ProyectoService } from "../../src/services/ProyectoService.js";

let revisar;

beforeEach(() => {
    jest.useFakeTimers();

    revisar = jest
        .spyOn(ProyectoService, "cerrarVencidos")
        .mockResolvedValue({ cerrados: 0, errores: [] });

    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
});

test("revisa al iniciar y cada minuto; detener cancela futuras revisiones", async () => {
    const detener = await iniciarCierreAutomatico();

    expect(revisar).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(59999);
    expect(revisar).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(1);
    expect(revisar).toHaveBeenCalledTimes(2);

    detener();

    await jest.advanceTimersByTimeAsync(60000);
    expect(revisar).toHaveBeenCalledTimes(2);
});

test("no inicia otra revisión mientras la anterior sigue ejecutándose", async () => {
    let terminar;

    revisar
        .mockResolvedValueOnce({ cerrados: 0, errores: [] })
        .mockImplementationOnce(
            () =>
                new Promise((resolve) => {
                    terminar = resolve;
                }),
        );

    const detener = await iniciarCierreAutomatico({
        intervaloMs: 1000,
    });

    await jest.advanceTimersByTimeAsync(1000);
    expect(revisar).toHaveBeenCalledTimes(2);

    await jest.advanceTimersByTimeAsync(3000);
    expect(revisar).toHaveBeenCalledTimes(2);

    terminar({ cerrados: 0, errores: [] });

    await jest.advanceTimersByTimeAsync(1000);
    expect(revisar).toHaveBeenCalledTimes(3);

    detener();
});

test("registra una falla y vuelve a intentar en la siguiente revisión", async () => {
    revisar.mockRejectedValueOnce(
        new Error("Mongo no disponible"),
    );

    const detener = await iniciarCierreAutomatico({
        intervaloMs: 1000,
    });

    expect(console.error).toHaveBeenCalledWith(
        "Falló la revisión de cierres automáticos:",
        "Mongo no disponible",
    );

    await jest.advanceTimersByTimeAsync(1000);
    expect(revisar).toHaveBeenCalledTimes(2);

    detener();
});

test("informa los errores individuales de proyectos", async () => {
    revisar.mockResolvedValueOnce({
        cerrados: 1,
        errores: [
            {
                proyectoId: "proyecto-1",
                error: new Error("Documento inválido"),
            },
        ],
    });

    const detener = await iniciarCierreAutomatico();

    expect(console.error).toHaveBeenCalledWith(
        "No se pudo cerrar el proyecto proyecto-1:",
        "Documento inválido",
    );

    detener();
});

test.each([0, -1, 500, 1000.5, NaN])(
    "rechaza un intervalo inválido: %s",
    async (intervaloMs) => {
        await expect(
            iniciarCierreAutomatico({ intervaloMs }),
        ).rejects.toThrow(/intervalo/);

        expect(revisar).not.toHaveBeenCalled();
    },
);
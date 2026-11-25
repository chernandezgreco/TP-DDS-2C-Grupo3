import { describe, test, expect, jest, beforeEach, afterEach } from "@jest/globals";
import { iniciarMantenerDespierto } from "../../src/jobs/mantenerDespierto.js";

describe("iniciarMantenerDespierto", () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.restoreAllMocks();
    });

    test("sin url publica no programa nada", () => {
        const hacerPedido = jest.fn();

        const detener = iniciarMantenerDespierto({ url: undefined, intervaloMs: 1000, hacerPedido });
        jest.advanceTimersByTime(5000);

        expect(hacerPedido).not.toHaveBeenCalled();
        detener();
    });

    test("con url le pega al health en cada intervalo", () => {
        const hacerPedido = jest.fn().mockResolvedValue({ ok: true });

        const detener = iniciarMantenerDespierto({ url: "https://app.onrender.com", intervaloMs: 1000, hacerPedido });
        jest.advanceTimersByTime(3000);

        expect(hacerPedido).toHaveBeenCalledTimes(3);
        expect(hacerPedido.mock.calls[0][0]).toBe("https://app.onrender.com/health");
        detener();
    });

    test("al detenerlo no hace mas pedidos", () => {
        const hacerPedido = jest.fn().mockResolvedValue({ ok: true });

        const detener = iniciarMantenerDespierto({ url: "https://app.onrender.com", intervaloMs: 1000, hacerPedido });
        detener();
        jest.advanceTimersByTime(5000);

        expect(hacerPedido).not.toHaveBeenCalled();
    });

    test("si el pedido falla solo lo registra y sigue", async () => {
        const errores = jest.spyOn(console, "error").mockImplementation(() => {});
        const hacerPedido = jest.fn().mockRejectedValue(new Error("sin red"));

        const detener = iniciarMantenerDespierto({ url: "https://app.onrender.com", intervaloMs: 1000, hacerPedido });
        await jest.advanceTimersByTimeAsync(2000);

        expect(hacerPedido).toHaveBeenCalledTimes(2);
        expect(errores).toHaveBeenCalledWith("No se pudo pinguear el servidor:", "sin red");
        detener();
    });
});

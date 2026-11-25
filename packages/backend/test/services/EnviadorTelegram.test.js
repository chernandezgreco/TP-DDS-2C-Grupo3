import { describe, test, expect, jest, beforeEach, afterEach } from "@jest/globals";
import { EnviadorTelegram } from "../../src/services/enviadores/EnviadorTelegram.js";

const medio = { valor: "123456789" };
const notificacion = { texto: "Te necesitamos en el proyecto Plazas" };

describe("EnviadorTelegram", () => {
    let entorno;

    beforeEach(() => {
        entorno = { ...process.env };
        delete process.env.TELEGRAM_BOT_TOKEN;
    });

    afterEach(() => {
        process.env = entorno;
        jest.restoreAllMocks();
    });

    test("con el token configurado manda el mensaje al chat de la persona", async () => {
        process.env.TELEGRAM_BOT_TOKEN = "token-de-prueba";
        const hacerPedido = jest.fn().mockResolvedValue({ ok: true, status: 200 });

        const resultado = await new EnviadorTelegram(hacerPedido).enviar(medio, notificacion);

        expect(resultado).toEqual({ simulado: false });
        const [url, opciones] = hacerPedido.mock.calls[0];
        expect(url).toBe("https://api.telegram.org/bottoken-de-prueba/sendMessage");
        const cuerpo = JSON.parse(opciones.body);
        expect(cuerpo.chat_id).toBe("123456789");
        expect(cuerpo.text).toContain(notificacion.texto);
        expect(cuerpo.parse_mode).toBeUndefined();
    });

    test("sin token simula el envio sin loguear el chat ni el texto", async () => {
        const hacerPedido = jest.fn();
        const consola = jest.spyOn(console, "info").mockImplementation(() => {});

        const resultado = await new EnviadorTelegram(hacerPedido).enviar(medio, notificacion);

        expect(resultado).toEqual({ simulado: true });
        expect(hacerPedido).not.toHaveBeenCalled();
        const logueado = consola.mock.calls.flat().join(" ");
        expect(logueado).toContain("[TELEGRAM SIMULADO]");
        expect(logueado).not.toContain("123456789");
        expect(logueado).not.toContain(notificacion.texto);
    });

    test("en produccion sin token falla en vez de simular", async () => {
        process.env.NODE_ENV = "production";

        await expect(new EnviadorTelegram(jest.fn()).enviar(medio, notificacion)).rejects.toMatchObject({ code: "TELEGRAM_CONFIG" });
    });

    test("si Telegram rechaza el mensaje se propaga el codigo HTTP sin el token", async () => {
        process.env.TELEGRAM_BOT_TOKEN = "token-de-prueba";
        const hacerPedido = jest.fn().mockResolvedValue({ ok: false, status: 403 });

        const error = await new EnviadorTelegram(hacerPedido).enviar(medio, notificacion).catch((e) => e);

        expect(error.code).toBe("TELEGRAM_HTTP_403");
        expect(error.message).not.toContain("token-de-prueba");
    });

    test("si no hay conexion se propaga un error de red", async () => {
        process.env.TELEGRAM_BOT_TOKEN = "token-de-prueba";
        const hacerPedido = jest.fn().mockRejectedValue(new TypeError("fetch failed"));

        await expect(new EnviadorTelegram(hacerPedido).enviar(medio, notificacion)).rejects.toMatchObject({ code: "TELEGRAM_RED" });
    });
});

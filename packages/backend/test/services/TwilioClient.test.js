import { describe, test, expect, jest, beforeEach, afterEach } from "@jest/globals";
import { enviarConTwilio } from "../../src/services/enviadores/TwilioClient.js";

const medio = { valor: "+5491112345678" };
const notificacion = { texto: "Te necesitamos en el proyecto Plazas" };

describe("enviarConTwilio", () => {
    let entorno;

    beforeEach(() => {
        entorno = { ...process.env };
        delete process.env.TWILIO_SEND_REAL;
        jest.spyOn(console, "info").mockImplementation(() => {});
    });

    afterEach(() => {
        process.env = entorno;
        jest.restoreAllMocks();
    });

    test("sin TWILIO_SEND_REAL simula y no llama a Twilio, tambien en produccion", async () => {
        process.env.NODE_ENV = "production";
        const pedido = jest.spyOn(globalThis, "fetch");

        const resultado = await enviarConTwilio("SMS", medio, notificacion);

        expect(resultado).toEqual({ simulado: true });
        expect(pedido).not.toHaveBeenCalled();
    });

    test("habilitado pero sin credenciales falla con error de configuracion", async () => {
        process.env.TWILIO_SEND_REAL = "true";
        delete process.env.TWILIO_ACCOUNT_SID;

        await expect(enviarConTwilio("SMS", medio, notificacion)).rejects.toMatchObject({ code: "TWILIO_CONFIG" });
    });

    test("habilitado manda el SMS a la API de Twilio", async () => {
        Object.assign(process.env, {
            TWILIO_SEND_REAL: "true",
            TWILIO_ACCOUNT_SID: "AC123",
            TWILIO_AUTH_TOKEN: "token",
            TWILIO_SMS_FROM: "+15005550006",
        });
        const pedido = jest.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: true,
            json: async () => ({ sid: "SM1" }),
        });

        const resultado = await enviarConTwilio("SMS", medio, notificacion);

        expect(resultado).toEqual({ simulado: false, messageSid: "SM1" });
        const [url, opciones] = pedido.mock.calls[0];
        expect(url).toContain("/Accounts/AC123/Messages.json");
        expect(opciones.body.get("To")).toBe("+5491112345678");
        expect(opciones.body.get("Body")).toBe(notificacion.texto);
    });
});

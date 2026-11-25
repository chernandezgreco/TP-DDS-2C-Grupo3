import { describe, test, expect, jest, beforeEach, afterEach } from "@jest/globals";
import { EnviadorEmail } from "../../src/services/enviadores/EnviadorEmail.js";

const medio = { valor: "ana@mail.com" };
const notificacion = { texto: "Te necesitamos en el proyecto Plazas" };
const respuestaOk = { ok: true, status: 202 };

describe("EnviadorEmail", () => {
    let entorno;

    beforeEach(() => {
        entorno = { ...process.env };
        delete process.env.SENDGRID_API_KEY;
        delete process.env.EMAIL_FROM;
    });

    afterEach(() => {
        process.env = entorno;
        jest.restoreAllMocks();
    });

    test("con la clave configurada manda el mail a SendGrid como texto plano", async () => {
        process.env.SENDGRID_API_KEY = "clave-de-prueba";
        process.env.EMAIL_FROM = "plataforma@codigoavoluntad.org";
        const hacerPedido = jest.fn().mockResolvedValue(respuestaOk);

        const resultado = await new EnviadorEmail(hacerPedido).enviar(medio, notificacion);

        expect(resultado).toEqual({ simulado: false });
        expect(hacerPedido).toHaveBeenCalledTimes(1);
        const [url, opciones] = hacerPedido.mock.calls[0];
        expect(url).toBe("https://api.sendgrid.com/v3/mail/send");
        expect(opciones.headers.Authorization).toBe("Bearer clave-de-prueba");
        const cuerpo = JSON.parse(opciones.body);
        expect(cuerpo.personalizations[0].to[0].email).toBe("ana@mail.com");
        expect(cuerpo.from.email).toBe("plataforma@codigoavoluntad.org");
        expect(cuerpo.content).toEqual([{ type: "text/plain", value: notificacion.texto }]);
    });

    test("sin clave simula el envio sin loguear destinatario ni texto", async () => {
        const hacerPedido = jest.fn();
        const consola = jest.spyOn(console, "info").mockImplementation(() => {});

        const resultado = await new EnviadorEmail(hacerPedido).enviar(medio, notificacion);

        expect(resultado).toEqual({ simulado: true });
        expect(hacerPedido).not.toHaveBeenCalled();
        expect(consola).toHaveBeenCalledWith(expect.stringContaining("[EMAIL SIMULADO]"));
        const logueado = consola.mock.calls.flat().join(" ");
        expect(logueado).not.toContain("ana@mail.com");
        expect(logueado).not.toContain(notificacion.texto);
    });

    test("en produccion sin clave falla en vez de simular", async () => {
        process.env.NODE_ENV = "production";

        await expect(new EnviadorEmail(jest.fn()).enviar(medio, notificacion)).rejects.toMatchObject({ code: "EMAIL_CONFIG" });
    });

    test("con clave pero sin remitente falla y no llama a SendGrid", async () => {
        process.env.SENDGRID_API_KEY = "clave-de-prueba";
        const hacerPedido = jest.fn();

        await expect(new EnviadorEmail(hacerPedido).enviar(medio, notificacion)).rejects.toMatchObject({ code: "EMAIL_CONFIG" });
        expect(hacerPedido).not.toHaveBeenCalled();
    });

    test("si SendGrid rechaza el mail se propaga el error con el codigo HTTP", async () => {
        process.env.SENDGRID_API_KEY = "clave-de-prueba";
        process.env.EMAIL_FROM = "plataforma@codigoavoluntad.org";
        const hacerPedido = jest.fn().mockResolvedValue({ ok: false, status: 403 });

        await expect(new EnviadorEmail(hacerPedido).enviar(medio, notificacion)).rejects.toMatchObject({ code: "EMAIL_HTTP_403" });
    });

    test("si no hay conexion se propaga un error de red", async () => {
        process.env.SENDGRID_API_KEY = "clave-de-prueba";
        process.env.EMAIL_FROM = "plataforma@codigoavoluntad.org";
        const hacerPedido = jest.fn().mockRejectedValue(new TypeError("fetch failed"));

        await expect(new EnviadorEmail(hacerPedido).enviar(medio, notificacion)).rejects.toMatchObject({ code: "EMAIL_RED" });
    });
});

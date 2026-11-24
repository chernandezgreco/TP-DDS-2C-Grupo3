import { describe, test, expect, jest, afterEach } from "@jest/globals";
import { EnviadorEmail } from "../../src/services/enviadores/EnviadorEmail.js";

const medio = { valor: "ana@mail.com" };
const notificacion = { texto: "Te necesitamos en el proyecto Plazas" };

describe("EnviadorEmail", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    test("con un transporte configurado manda el mail como texto plano", async () => {
        const transporte = { sendMail: jest.fn().mockResolvedValue({}) };
        process.env.EMAIL_FROM = "plataforma@codigoavoluntad.org";

        await new EnviadorEmail(transporte).enviar(medio, notificacion);

        expect(transporte.sendMail).toHaveBeenCalledTimes(1);
        const enviado = transporte.sendMail.mock.calls[0][0];
        expect(enviado.to).toBe("ana@mail.com");
        expect(enviado.from).toBe("plataforma@codigoavoluntad.org");
        expect(enviado.text).toBe(notificacion.texto);
        expect(enviado.html).toBeUndefined();
        delete process.env.EMAIL_FROM;
    });

    test("sin SMTP_HOST ni transporte simula el envio sin loguear destinatario ni texto", async () => {
        delete process.env.SMTP_HOST;
        const consola = jest.spyOn(console, "info").mockImplementation(() => {});

        const resultado = await new EnviadorEmail().enviar(medio, notificacion);

        expect(resultado).toEqual({ simulado: true });
        expect(consola).toHaveBeenCalledWith(expect.stringContaining("[EMAIL SIMULADO]"));
        const logueado = consola.mock.calls.flat().join(" ");
        expect(logueado).not.toContain("ana@mail.com");
        expect(logueado).not.toContain(notificacion.texto);
    });

    test("en producción sin SMTP_HOST falla en vez de simular", async () => {
        delete process.env.SMTP_HOST;
        const entorno = process.env.NODE_ENV;
        process.env.NODE_ENV = "production";
        try {
            await expect(new EnviadorEmail().enviar(medio, notificacion)).rejects.toMatchObject({ code: "SMTP_CONFIG" });
        } finally {
            process.env.NODE_ENV = entorno;
        }
    });

    test("con transporte pero sin remitente configurado falla", async () => {
        delete process.env.EMAIL_FROM;
        delete process.env.SMTP_USER;
        const transporte = { sendMail: jest.fn() };

        await expect(new EnviadorEmail(transporte).enviar(medio, notificacion)).rejects.toMatchObject({ code: "SMTP_CONFIG" });
        expect(transporte.sendMail).not.toHaveBeenCalled();
    });

    test("si el servidor de correo falla, el error se propaga a quien llama", async () => {
        process.env.EMAIL_FROM = "plataforma@codigoavoluntad.org";
        const transporte = { sendMail: jest.fn().mockRejectedValue(new Error("SMTP caido")) };

        await expect(new EnviadorEmail(transporte).enviar(medio, notificacion)).rejects.toThrow("SMTP caido");
        delete process.env.EMAIL_FROM;
    });
});

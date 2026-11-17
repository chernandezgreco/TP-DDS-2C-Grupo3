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

    test("sin SMTP_HOST ni transporte simula el envio por consola", async () => {
        delete process.env.SMTP_HOST;
        const consola = jest.spyOn(console, "log").mockImplementation(() => {});

        await new EnviadorEmail().enviar(medio, notificacion);

        expect(consola).toHaveBeenCalledWith(expect.stringContaining("[EMAIL] a ana@mail.com"));
    });

    test("si el servidor de correo falla, el error se propaga a quien llama", async () => {
        const transporte = { sendMail: jest.fn().mockRejectedValue(new Error("SMTP caido")) };

        await expect(new EnviadorEmail(transporte).enviar(medio, notificacion)).rejects.toThrow("SMTP caido");
    });
});

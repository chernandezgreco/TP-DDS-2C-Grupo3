import { describe, test, expect, beforeAll, beforeEach, afterEach, afterAll, jest } from "@jest/globals";
import mongoose from "mongoose";
import { createCipheriv, randomBytes } from "node:crypto";
import { ProyectoModel } from "../../src/models/indexModel.js";
import { LinkedInConnectionModel } from "../../src/models/LinkedInModel.js";
import { NotFoundError } from "../../src/domain/errores.js";
import { LinkedInService } from "../../src/services/LinkedInService.js";
import {
    conectarBaseDePrueba,
    desconectarBaseDePrueba,
    limpiarBaseDePrueba,
} from "../helpers/baseDePrueba.js";

const clave = randomBytes(32);

const cifrar = (token) => {
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", clave, iv);
    const cifrado = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
    return {
        tokenCifrado: cifrado.toString("base64"),
        tokenIv: iv.toString("base64"),
        tokenTag: cipher.getAuthTag().toString("base64"),
    };
};

describe("LinkedInService.publicarLogro", () => {
    const colectivoId = new mongoose.Types.ObjectId().toString();
    const actor = { type: "colectivos", id: colectivoId };
    let cuentaId;
    let proyectoId;
    let logroId;
    let envio;

    beforeAll(conectarBaseDePrueba, 120000);
    afterAll(desconectarBaseDePrueba);

    beforeEach(async () => {
        await limpiarBaseDePrueba();
        process.env.LINKEDIN_TOKEN_ENCRYPTION_KEY = clave.toString("base64");

        cuentaId = new mongoose.Types.ObjectId();
        await LinkedInConnectionModel.create({
            cuentaId,
            memberId: "miembro-1",
            ...cifrar("token-de-prueba"),
            tokenExpira: new Date(Date.now() + 3600000),
        });

        // Se inserta como lo guardaba la versión anterior: los logros sólo tienen `_id`, sin el campo `id`.
        proyectoId = new mongoose.Types.ObjectId();
        logroId = new mongoose.Types.ObjectId();
        await ProyectoModel.collection.insertOne({
            _id: proyectoId,
            titulo: "Plazas",
            descripcion: "App de plazas",
            colectivoId,
            perfiles: [],
            logros: [
                {
                    _id: logroId,
                    descripcion: "Primera versión publicada",
                    porcentajeCompletitud: 40,
                    fechaCreacion: new Date(),
                },
            ],
        });

        envio = jest.spyOn(globalThis, "fetch").mockResolvedValue(
            new Response("{}", { status: 201, headers: { "x-restli-id": "urn:li:share:1" } }),
        );
    });

    afterEach(() => {
        envio.mockRestore();
        delete process.env.LINKEDIN_TOKEN_ENCRYPTION_KEY;
    });

    test("encuentra un logro guardado antes de persistir `id` y lo publica", async () => {
        const resultado = await LinkedInService.publicarLogro(cuentaId, actor, {
            proyectoId: proyectoId.toString(),
            logroId: logroId.toString(),
        });

        expect(resultado).toEqual({ publicado: true, id: "urn:li:share:1" });
        expect(envio).toHaveBeenCalledTimes(1);
        const cuerpo = JSON.parse(envio.mock.calls[0][1].body);
        expect(cuerpo.commentary).toContain("Primera versión publicada");
    });

    test("un logro que no existe en el proyecto da 404 y no llama a LinkedIn", async () => {
        await expect(
            LinkedInService.publicarLogro(cuentaId, actor, {
                proyectoId: proyectoId.toString(),
                logroId: new mongoose.Types.ObjectId().toString(),
            }),
        ).rejects.toThrow(NotFoundError);
        expect(envio).not.toHaveBeenCalled();
    });
});

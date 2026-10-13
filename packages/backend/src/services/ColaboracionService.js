import { ColaboracionModel } from "../models/indexModel.js";
import { Colaboracion } from "../domain/Colaboracion/Colaboracion.js";
import { ConflictError, NotFoundError } from "../domain/errores.js";
import { esIdValido } from "./ids.js";

const aDominio = (doc) =>
    new Colaboracion(doc._id.toString(), doc.proyectoId, doc.perfilId, doc.colaboradoraId, doc.estado, doc.fechaCreacion);

export class ColaboracionService {
    static async listar() {
        const docs = await ColaboracionModel.find();

        return docs.map(aDominio);
    }

    static async obtenerPorId(id) {
        const doc = esIdValido(id) ? await ColaboracionModel.findById(id) : null;
        if (!doc) {
            throw new NotFoundError("Colaboración no encontrada", { colaboracionId: id });
        }

        return aDominio(doc);
    }

    static async listarDeProyecto(proyectoId) {
        const docs = await ColaboracionModel.find({ proyectoId });

        return docs.map(aDominio);
    }

    static async crear(proyectoId, perfilId, colaboradoraId, anonimidad = false) {
        const existente = await ColaboracionModel.findOne({ proyectoId, perfilId, colaboradoraId });
        if (existente) {
            throw new ConflictError("La colaboradora ya se encuentra anotada en este perfil del proyecto", {
                colaboracionId: existente._id.toString(),
            });
        }

        // TODO anonimidad: hoy se pierde quién se anotó; pendiente de rediseño
        const colaboradoraRegistrada = anonimidad ? "Anonimo" : colaboradoraId;

        // el dominio valida antes de guardar
        const borrador = new Colaboracion(null, proyectoId, perfilId, colaboradoraRegistrada);
        const doc = await ColaboracionModel.create({
            proyectoId: borrador.proyectoId,
            perfilId: borrador.perfilId,
            colaboradoraId: borrador.colaboradoraId,
            estado: borrador.estado,
            fechaCreacion: borrador.fechaCreacion,
        });

        return aDominio(doc);
    }
}

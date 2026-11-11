import { PostulacionModel } from "../models/indexModel.js";
import { Postulacion } from "../domain/Postulacion/Postulacion.js";
import { ConflictError, NotFoundError } from "../domain/errores.js";
import { ColaboracionService } from "../services/ColaboracionService.js";
import { esIdValido } from "./ids.js";

const aDominio = (doc) =>
    new Postulacion(doc._id.toString(), doc.proyectoId, doc.perfilId, doc.colaboradoraId, doc.estado, doc.fechaCreacion);

export class PostulacionService {
    static async listar() {
        const docs = await PostulacionModel.find();

        return docs.map(aDominio);
    }

    static async obtenerPorId(id) {
        const doc = esIdValido(id) ? await PostulacionModel.findById(id) : null;
        if (!doc) {
            throw new NotFoundError("Postulacion no encontrada", { postulacionID: id });
        }

        return aDominio(doc);
    }

    static async listarDeProyecto(proyectoId) {
        const docs = await PostulacionModel.find({ proyectoId });

        return docs.map(aDominio);
    }

   
    static async listarDePerfil(perfilId) {
        const docs = await PostulacionModel.find({ perfilId });

        return docs.map(aDominio);
    }
   

    static async crear(proyectoId, perfilId, colaboradoraId, anonimidad = false) {
        const existente = await PostulacionModel.findOne({ proyectoId, perfilId, colaboradoraId });
        if (existente) {
            throw new ConflictError("La colaboradora ya se encuentra anotada en este perfil del proyecto", {
                postulacionID: existente._id.toString(),
            });
        }

        const colaboradoraRegistrada = anonimidad ? "Anonimo" : colaboradoraId;

        const borrador = new Postulacion(null, proyectoId, perfilId, colaboradoraRegistrada);
        const doc = await PostulacionModel.create({
            proyectoId: borrador.proyectoId,
            perfilId: borrador.perfilId,
            colaboradoraId: borrador.colaboradoraId,
            estado: borrador.estado,
            fechaCreacion: borrador.fechaCreacion,
        });

        return aDominio(doc);
    }

    static async cambiarEstadoPostulacion(postulacionId, nuevoEstado) {
        const postulacionDoc = await PostulacionModel.findById(postulacionId);
        if (!postulacionDoc) {
            throw new NotFoundError("Postulación no encontrada", { postulacionId });
        }

        const postulacion = aDominio(postulacionDoc);

        let colaboracionCreada = null;

        if (nuevoEstado === "ACEPTADA") {
            postulacion.aceptar();
            colaboracionCreada = await ColaboracionService.crear(
                postulacion.proyectoId,
                postulacion.perfilId,
                postulacion.colaboradoraId
            );
        }else if (nuevoEstado === "RECHAZADA") {
            postulacion.rechazar();
        } else {
            throw new DomainError("Estado inválido", { nuevoEstado });
        }

        postulacionDoc.estado = postulacion.estado;
        await postulacionDoc.save();

        return {
            postulacion,
            colaboracion: colaboracionCreada
        };
    }
    static async listarPorProyecto(proyectoId) {
       
        const documentos = await PostulacionModel.find({ proyectoId });
        
        
        return documentos.map(doc => aDominio(doc)); 
    }

    static async listarPorProyectoYEstado(proyectoId, estados) {
        const filtroEstado = Array.isArray(estados) ? { $in: estados } : estados;

        const documentos = await PostulacionModel.find({ 
            proyectoId, 
            estado: filtroEstado 
        });

        return documentos.map(doc => aDominio(doc));
    }
}
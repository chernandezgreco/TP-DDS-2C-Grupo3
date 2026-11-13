import { serializar } from "./serializar.js";
import { ProyectoService } from "./ProyectoService.js";
import { ColaboracionModel } from "../models/indexModel.js";
import { TerminosService } from "./TerminosService.js";
import { PostulacionModel } from "../models/indexModel.js";
import { Postulacion } from "../domain/Postulacion/Postulacion.js";
import {
  ConflictError,
  NotFoundError,
  DomainError,
} from "../domain/errores.js";
import { ColaboracionService } from "../services/ColaboracionService.js";
import { esIdValido } from "./ids.js";

const aDominio = (doc) =>
  Object.assign(
    new Postulacion(
      doc._id.toString(),
      doc.proyectoId,
      doc.perfilId,
      doc.colaboradoraId,
      doc.estado,
      doc.fechaCreacion,
    ),
    { anonimidad: doc.anonimidad || false },
  );

export class PostulacionService {
  static async listar() {
    const docs = await PostulacionModel.find();

    return docs.map(aDominio);
  }

  static async obtenerPorId(id) {
    const doc = esIdValido(id) ? await PostulacionModel.findById(id) : null;
    if (!doc) {
      throw new NotFoundError("Postulacion no encontrada", {
        postulacionID: id,
      });
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
    const existente = await PostulacionModel.findOne({
      proyectoId,
      perfilId,
      colaboradoraId,
    });
    if (existente) {
      throw new ConflictError(
        "La colaboradora ya se encuentra anotada en este perfil del proyecto",
        {
          postulacionID: existente._id.toString(),
        },
      );
    }

    const colaboradoraRegistrada = colaboradoraId;

    const borrador = new Postulacion(
      null,
      proyectoId,
      perfilId,
      colaboradoraRegistrada,
    );
    const doc = await PostulacionModel.create({
      anonimidad,
      proyectoId: borrador.proyectoId,
      perfilId: borrador.perfilId,
      colaboradoraId: borrador.colaboradoraId,
      estado: borrador.estado,
      fechaCreacion: borrador.fechaCreacion,
    });

    return aDominio(doc);
  }

  static async cambiarEstadoPostulacion(postulacionId, nuevoEstado) {
    const actual = await this.obtenerPorId(postulacionId);
    return serializar(actual.proyectoId + ":" + actual.perfilId, () =>
      this.procesarCambio(postulacionId, nuevoEstado),
    );
  }
  static async procesarCambio(postulacionId, nuevoEstado) {
    const postulacionDoc = await PostulacionModel.findById(postulacionId);
    if (!postulacionDoc) {
      throw new NotFoundError("Postulación no encontrada", { postulacionId });
    }

    const postulacion = aDominio(postulacionDoc);

    let colaboracionCreada = null;

    if (nuevoEstado === "ACEPTADA") {
      await TerminosService.validarProyectoDisponible(postulacion.proyectoId);
      const proyecto = await ProyectoService.obtenerPorId(
        postulacion.proyectoId,
      );
      if (!proyecto.estaActivo())
        throw new DomainError("El proyecto está finalizado.");
      const perfil = proyecto.obtenerPerfil(postulacion.perfilId);
      const ocupadas = await ColaboracionModel.countDocuments({
        proyectoId: postulacion.proyectoId,
        perfilId: postulacion.perfilId,
      });
      if (perfil.cantidadLimite != null && ocupadas >= perfil.cantidadLimite)
        throw new ConflictError(
          "El perfil ya alcanzó su cupo de colaboraciones.",
        );
      postulacion.aceptar();
      colaboracionCreada = await ColaboracionService.crear(
        postulacion.proyectoId,
        postulacion.perfilId,
        postulacion.colaboradoraId,
        postulacion.anonimidad,
      );
    } else if (nuevoEstado === "RECHAZADA") {
      postulacion.rechazar();
    } else {
      throw new DomainError("Estado inválido", { nuevoEstado });
    }

    postulacionDoc.estado = postulacion.estado;
    try {
      await postulacionDoc.save();
    } catch (error) {
      if (colaboracionCreada)
        await ColaboracionModel.deleteOne({ _id: colaboracionCreada.id });
      throw error;
    }

    return {
      postulacion,
      colaboracion: colaboracionCreada,
    };
  }
  static async listarPorProyecto(proyectoId) {
    const documentos = await PostulacionModel.find({ proyectoId });

    return documentos.map((doc) => aDominio(doc));
  }

  static async listarPorProyectoYEstado(proyectoId, estados) {
    const filtroEstado = Array.isArray(estados) ? { $in: estados } : estados;

    const documentos = await PostulacionModel.find({
      proyectoId,
      estado: filtroEstado,
    });

    return documentos.map((doc) => aDominio(doc));
  }
}

import { ColaboracionModel } from "../models/indexModel.js";
import { Colaboracion } from "../domain/Colaboracion/Colaboracion.js";
import { EstadoColaboracion } from "../domain/Colaboracion/EstadoColaboracion.js";
import {
  ConflictError,
  DomainError,
  NotFoundError,
} from "../domain/errores.js";
import { esIdValido } from "./ids.js";

const aDominio = (doc) =>
  Object.assign(
    new Colaboracion(
      doc._id.toString(),
      doc.proyectoId,
      doc.perfilId,
      doc.colaboradoraId,
      doc.estado,
      doc.fechaCreacion,
      doc.fechaBaja ?? null,
    ),
    { anonimidad: doc.anonimidad || false },
  );

const TODAS = "TODAS";

// pasa el dominio a TERMINADA y lo guarda; el filtro por estado evita que dos bajas simultáneas se pisen
const terminar = async (colaboracion) => {
  colaboracion.darDeBaja();
  const resultado = await ColaboracionModel.updateOne(
    { _id: colaboracion.id, estado: EstadoColaboracion.ACTIVA },
    { $set: { estado: colaboracion.estado, fechaBaja: colaboracion.fechaBaja } },
  );
  if (resultado.modifiedCount === 0) {
    throw new ConflictError("La colaboración ya fue dada de baja", {
      colaboracionId: colaboracion.id,
    });
  }
};

export class ColaboracionService {
  // por defecto solo las activas (lo que antes era "todas", porque la baja borraba); TERMINADA es el historial
  static async listar(estado = EstadoColaboracion.ACTIVA) {
    const estadosValidos = [...Object.values(EstadoColaboracion), TODAS];
    if (!estadosValidos.includes(estado)) {
      throw new DomainError("El estado de colaboración no es válido", {
        estado,
        estadosValidos,
      });
    }
    const docs = await ColaboracionModel.find(
      estado === TODAS ? {} : { estado },
    );

    return docs.map(aDominio);
  }

  static async obtenerPorId(id) {
    const doc = esIdValido(id) ? await ColaboracionModel.findById(id) : null;
    if (!doc) {
      throw new NotFoundError("Colaboración no encontrada", {
        colaboracionId: id,
      });
    }

    return aDominio(doc);
  }

  static async listarDeProyecto(proyectoId) {
    const docs = await ColaboracionModel.find({
      proyectoId,
      estado: EstadoColaboracion.ACTIVA,
    });

    return docs.map(aDominio);
  }

  static async esColaboradoraActiva(proyectoId, colaboradoraId) {
    return Boolean(
      await ColaboracionModel.exists({
        proyectoId,
        colaboradoraId,
        estado: EstadoColaboracion.ACTIVA,
      }),
    );
  }

  static async crear(proyectoId, perfilId, colaboradoraId, anonimidad = false) {
    const existente = await ColaboracionModel.findOne({
      proyectoId,
      perfilId,
      colaboradoraId,
    });
    if (existente) {
      throw new ConflictError(
        "La colaboradora ya se encuentra anotada en este perfil del proyecto",
        {
          colaboracionId: existente._id.toString(),
        },
      );
    }

    // se guarda siempre la persona real; la anonimidad solo la oculta en las vistas públicas
    const colaboradoraRegistrada = colaboradoraId;

    // el dominio valida antes de guardar
    const borrador = new Colaboracion(
      null,
      proyectoId,
      perfilId,
      colaboradoraRegistrada,
    );
    const doc = await ColaboracionModel.create({
      anonimidad,
      proyectoId: borrador.proyectoId,
      perfilId: borrador.perfilId,
      colaboradoraId: borrador.colaboradoraId,
      estado: borrador.estado,
      fechaCreacion: borrador.fechaCreacion,
    });

    return aDominio(doc);
  }

  static async darDeBaja(colaboracionId) {
    await terminar(await this.obtenerPorId(colaboracionId));
    return { mensaje: "Colaboración dada de baja exitosamente" };
  }

  // la persona se baja de todas sus colaboraciones activas en el proyecto (puede estar en más de un perfil)
  static async darDeBajaPorColaborador(proyectoId, colaboradoraId) {
    const docs = await ColaboracionModel.find({
      proyectoId,
      colaboradoraId,
      estado: EstadoColaboracion.ACTIVA,
    });

    if (docs.length === 0) {
      throw new NotFoundError(
        "No se encontró una colaboración activa para este proyecto y colaborador",
        { proyectoId, colaboradoraId },
      );
    }

    await Promise.all(docs.map((doc) => terminar(aDominio(doc))));

    return { mensaje: "Te has dado de baja del proyecto exitosamente" };
  }
}

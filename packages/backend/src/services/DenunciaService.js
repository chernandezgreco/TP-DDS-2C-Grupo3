import {
  ColaboracionModel,
  ColectivoModel,
  DenunciaModel,
  ProyectoModel,
} from "../models/indexModel.js";
import {
  DomainError,
  ForbiddenError,
  NotFoundError,
} from "../domain/errores.js";

const estados = ["pendiente", "en_revision", "resuelta", "desestimada"];

export class DenunciaService {
  // ids de los proyectos en los que hay que haber participado para denunciar:
  // el propio proyecto, o cualquiera del colectivo si se denuncia al colectivo
  static async proyectosQueHabilitan(datos) {
    const noEncontrada = () =>
      new NotFoundError("No se encontró la entidad denunciada.");

    if (datos.tipoEntidadDenunciada === "proyecto") {
      const proyecto = await ProyectoModel.findById(
        datos.entidadDenunciadaId,
      ).select("_id");
      if (!proyecto) throw noEncontrada();
      return [proyecto.id];
    }

    const colectivo = await ColectivoModel.findById(datos.entidadDenunciadaId);
    if (!colectivo) throw noEncontrada();
    const proyectos = await ProyectoModel.find({
      colectivoId: colectivo.id,
    }).select("_id");
    return proyectos.map((proyecto) => proyecto.id);
  }

  static async crear(actor, cuenta, datos) {
    // la identidad sale de la sesión, nunca del body
    if (actor?.type !== "colaboradoras") {
      throw new ForbiddenError(
        "Sólo las personas colaboradoras que participaron en un proyecto pueden denunciar.",
      );
    }

    const proyectoIds = await this.proyectosQueHabilitan(datos);

    // una colaboración existe solo si la postulación fue aceptada (activa o dada de baja):
    // una postulación pendiente o rechazada no acredita participación
    const participo = await ColaboracionModel.exists({
      proyectoId: { $in: proyectoIds },
      colaboradoraId: actor.id,
    });
    if (!participo) {
      throw new ForbiddenError(
        "Sólo podés denunciar a una organización o proyecto en los que participaste.",
      );
    }

    const denuncia = await DenunciaModel.create({
      cuentaDenuncianteId: cuenta._id,
      denuncianteTipo: actor.type,
      denunciantePerfilId: actor.id,
      ...datos,
    });
    return denuncia.toObject();
  }

  static async listar(estado) {
    if (estado && !estados.includes(estado)) {
      throw new DomainError("El estado de denuncia no es válido.", {
        estadosValidos: estados,
      });
    }
    const filtro = estado ? { estado } : {};
    return DenunciaModel.find(filtro)
      .populate("cuentaDenuncianteId", "email tipo perfilId")
      .sort({ fechaCreacion: -1 })
      .lean();
  }

  static async actualizarEstado(id, estado) {
    if (!estados.includes(estado)) {
      throw new DomainError("El estado de denuncia no es válido.", {
        estadosValidos: estados,
      });
    }
    const denuncia = await DenunciaModel.findByIdAndUpdate(
      id,
      { estado },
      { new: true, runValidators: true },
    )
      .populate("cuentaDenuncianteId", "email tipo perfilId")
      .lean();
    if (!denuncia) throw new NotFoundError("Denuncia no encontrada.");
    return denuncia;
  }
}

import {
  ColectivoModel,
  DenunciaModel,
  ProyectoModel,
} from "../models/indexModel.js";
import { DomainError, NotFoundError } from "../domain/errores.js";

const estados = ["pendiente", "en_revision", "resuelta", "desestimada"];

export class DenunciaService {
  static async crear(actor, cuenta, datos) {
    const ModeloEntidad =
      datos.tipoEntidadDenunciada === "colectivo"
        ? ColectivoModel
        : ProyectoModel;
    const entidad = await ModeloEntidad.findById(datos.entidadDenunciadaId);
    if (!entidad) throw new NotFoundError("No se encontró la entidad denunciada.");

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

import { ColectivoModel } from "../models/indexModel.js";
import { Colectivo } from "../domain/Colectivo/Colectivo.js";
import { NotFoundError } from "../domain/errores.js";
import { esIdValido } from "./ids.js";

const aDominio = (doc) =>
  new Colectivo(
    doc._id.toString(),
    doc.nombre,
    doc.descripcion,
    doc.ubicacion,
    doc.tipo,
  );

export class ColectivoService {
  static async crearColectivo(data) {
    // el dominio valida antes de guardar
    const borrador = new Colectivo(
      null,
      data.nombre,
      data.descripcion,
      data.ubicacion,
      data.tipo,
    );

    const nuevoColectivoDoc = await ColectivoModel.create({
      nombre: borrador.nombre,
      descripcion: borrador.descripcion,
      ubicacion: borrador.ubicacion,
      tipo: borrador.tipo,
    });

    return aDominio(nuevoColectivoDoc);
  }

  static async actualizar(id, datos) {
    const actual = await this.obtenerPorId(id);
    const valores = { ...actual, ...datos };
    const validado = new Colectivo(
      id,
      valores.nombre,
      valores.descripcion,
      valores.ubicacion,
      valores.tipo,
    );
    const doc = await ColectivoModel.findByIdAndUpdate(
      id,
      {
        $set: {
          nombre: validado.nombre,
          descripcion: validado.descripcion,
          ubicacion: validado.ubicacion,
          tipo: validado.tipo,
        },
      },
      { new: true, runValidators: true },
    );
    if (!doc) throw new NotFoundError("Colectivo no encontrado");
    return aDominio(doc);
  }

  static async listar() {
    const colectivosDocs = await ColectivoModel.find({
      "moderacionTerminos.suspendido": { $ne: true },
    });

    return colectivosDocs.map(aDominio);
  }

  static async obtenerPorId(id) {
    const doc = esIdValido(id) ? await ColectivoModel.findById(id) : null;
    if (!doc) {
      throw new NotFoundError("Colectivo no encontrado", { colectivoId: id });
    }

    if (doc.moderacionTerminos?.suspendido)
      throw new NotFoundError(
        "Colectivo suspendido por incumplimiento de términos.",
      );
    return aDominio(doc);
  }
}

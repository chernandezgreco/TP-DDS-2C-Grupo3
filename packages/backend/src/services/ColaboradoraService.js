import { ColaboradoraModel } from "../models/indexModel.js";
import { Colaboradora } from "../domain/Colaboradora/Colaboradora.js";
import { MedioContacto } from "../domain/Colaboradora/MedioContacto.js";
import { NotFoundError } from "../domain/errores.js";
import { HabilidadService } from "./HabilidadService.js";
import { esIdValido } from "./ids.js";

// arma la colaboradora de dominio a partir del documento de Mongo
const aDominio = (doc) =>
  new Colaboradora(
    doc._id.toString(),
    doc.nombreFantasia,
    doc.github,
    doc.nombreApellido,
    doc.habilidades,
    doc.pronombres,
    doc.presentacion,
    doc.mediosContacto.map(
      (medio) => new MedioContacto(medio.tipo, medio.valor),
    ),
    doc.aceptaMensajeria,
  );

export class ColaboradoraService {
  static async crearColaboradora(data) {
    // el dominio valida antes de guardar
    const borrador = new Colaboradora(
      null,
      data.nombreFantasia,
      data.github,
      data.nombreApellido,
      data.habilidades,
      data.pronombres,
      data.presentacion,
    );
    await HabilidadService.validarExistentes(borrador.habilidades);

    const nuevaColaboradoraDoc = await ColaboradoraModel.create({
      nombreFantasia: borrador.nombreFantasia,
      github: borrador.github,
      nombreApellido: borrador.nombreApellido,
      habilidades: borrador.habilidades,
      pronombres: borrador.pronombres,
      presentacion: borrador.presentacion,
    });

    return aDominio(nuevaColaboradoraDoc);
  }

  static async actualizar(id, datos) {
    const actual = await this.obtenerPorId(id);
    const valores = { ...actual, ...datos };
    const validada = new Colaboradora(
      id,
      valores.nombreFantasia,
      valores.github,
      valores.nombreApellido,
      valores.habilidades,
      valores.pronombres,
      valores.presentacion,
      actual.mediosContacto,
      actual.aceptaMensajeria,
    );
    await HabilidadService.validarExistentes(validada.habilidades);
    const doc = await ColaboradoraModel.findByIdAndUpdate(
      id,
      {
        $set: {
          nombreFantasia: validada.nombreFantasia,
          github: validada.github,
          nombreApellido: validada.nombreApellido,
          habilidades: validada.habilidades,
          pronombres: validada.pronombres,
          presentacion: validada.presentacion,
        },
      },
      { new: true, runValidators: true },
    );
    if (!doc) throw new NotFoundError("Colaboradora no encontrada");
    return aDominio(doc);
  }

  static async listar() {
    const colaboradorasDocs = await ColaboradoraModel.find();

    return colaboradorasDocs.map(aDominio);
  }

  static async agregarMedioContacto(idColaboradora, data) {
    const colaboradora = await this.obtenerPorId(idColaboradora);

    colaboradora.agregarMedioContacto(new MedioContacto(data.tipo, data.valor));
    await ColaboradoraModel.findByIdAndUpdate(idColaboradora, {
      mediosContacto: colaboradora.mediosContacto.map((medio) => ({
        tipo: medio.tipo,
        valor: medio.valor,
      })),
    });

    return colaboradora.mediosContacto;
  }

  static async actualizarContactos(idColaboradora, datos) {
    const colaboradora = await this.obtenerPorId(idColaboradora);
    colaboradora.mediosContacto = [];
    for (const medio of datos.mediosContacto)
      colaboradora.agregarMedioContacto(
        new MedioContacto(medio.tipo, medio.valor),
      );
    await ColaboradoraModel.findByIdAndUpdate(
      idColaboradora,
      {
        $set: {
          mediosContacto: colaboradora.mediosContacto.map((m) => ({
            tipo: m.tipo,
            valor: m.valor,
          })),
        },
      },
      { runValidators: true },
    );
    return colaboradora.mediosContacto;
  }
  static async actualizarPreferencias(idColaboradora, data) {
    const colaboradora = await this.obtenerPorId(idColaboradora);

    colaboradora.cambiarAceptaMensajeria(data.aceptaMensajeria);
    await ColaboradoraModel.findByIdAndUpdate(idColaboradora, {
      aceptaMensajeria: colaboradora.aceptaMensajeria,
    });

    return colaboradora;
  }

  static async agregarHabilidad(idColaboradora, data) {
    const colaboradora = await this.obtenerPorId(idColaboradora);
    await HabilidadService.validarExistentes([data.codigo]);

    colaboradora.agregarHabilidad(data.codigo);
    await ColaboradoraModel.findByIdAndUpdate(idColaboradora, {
      habilidades: colaboradora.habilidades,
    });

    return colaboradora;
  }

  static async obtenerPorId(id) {
    const doc = esIdValido(id) ? await ColaboradoraModel.findById(id) : null;
    if (!doc) {
      throw new NotFoundError("Colaboradora no encontrada", {
        colaboradoraId: id,
      });
    }

    return aDominio(doc);
  }

  // ignora los ids que no son de Mongo (por ejemplo las colaboraciones anónimas)
  static async listarPorIds(ids) {
    const docs = await ColaboradoraModel.find({
      _id: { $in: ids.filter(esIdValido) },
    });

    return docs.map(aDominio);
  }

  // colaboradoras que tienen al menos una de las habilidades indicadas
  static async buscarPorHabilidades(codigos) {
    const docs = await ColaboradoraModel.find({
      habilidades: { $in: codigos },
    });

    return docs.map(aDominio);
  }
}

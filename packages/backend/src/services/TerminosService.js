import { randomUUID } from "node:crypto";
import {
  TerminosModel,
  RevisionTerminosModel,
} from "../models/AdicionalesModel.js";
import { ProyectoModel, ColectivoModel } from "../models/indexModel.js";
import { DomainError, NotFoundError } from "../domain/errores.js";
export class TerminosService {
  static async actual() {
    const actual = await TerminosModel.findOne()
      .sort({ createdAt: -1, _id: -1 })
      .lean();
    if (actual) return actual;
    // Texto funcional inicial del TP, versionado e independiente de los seeds.
    return TerminosModel.findOneAndUpdate(
      { version: "1.0" },
      {
        $setOnInsert: {
          titulo: "Términos de Código a Voluntad",
          contenido:
            "# Condiciones de participación\n\n- Los colectivos deben perseguir una causa social y no utilizar la plataforma para fines de lucro.\n- Los proyectos deben publicar su código fuente y respetar las licencias de sus dependencias.\n- No se permiten discursos de odio, acoso ni contenido ilegal.\n- Los datos de contacto se utilizarán únicamente para coordinar colaboraciones aceptadas.\n- Los colectivos deben describir con honestidad compromisos, incentivos y uso de IA.\n- El equipo administrador puede suspender proyectos o colectivos que incumplan estas condiciones y registrar el motivo.\n\nLas nuevas versiones deberán aceptarse al crear o actualizar un proyecto.",
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    )
      .lean()
      .catch(async (error) => {
        if (error.code === 11000)
          return TerminosModel.findOne()
            .sort({ createdAt: -1, _id: -1 })
            .lean();
        throw error;
      });
  }
  static async validarAceptacion(version) {
    const actual = await this.actual();
    if (version !== actual.version)
      throw new DomainError(
        "Debés aceptar la versión vigente de los términos y condiciones.",
        { versionVigente: actual.version },
      );
    return { version: actual.version, fecha: new Date() };
  }
  static async publicar(datos) {
    return TerminosModel.create({ ...datos, version: randomUUID() });
  }
  static async revisar({ recurso, recursoId, suspendido, motivo }) {
    const model = recurso === "proyectos" ? ProyectoModel : ColectivoModel;
    const terminos = await this.actual();
    const doc = await model.findByIdAndUpdate(
      recursoId,
      {
        $set: {
          moderacionTerminos: {
            suspendido,
            motivo,
            version: terminos.version,
            fecha: new Date(),
          },
        },
      },
      { new: true },
    );
    if (!doc) throw new NotFoundError("Recurso no encontrado");
    await RevisionTerminosModel.create({
      recurso,
      recursoId,
      suspendido,
      motivo,
      versionTerminos: terminos.version,
    });
    return doc;
  }
  static async colectivosSuspendidos() {
    return (
      await ColectivoModel.find({
        "moderacionTerminos.suspendido": true,
      }).select("_id")
    ).map((d) => d._id.toString());
  }
  static async filtroProyectosPublicos() {
    return {
      "moderacionTerminos.suspendido": { $ne: true },
      colectivoId: { $nin: await this.colectivosSuspendidos() },
    };
  }
  static async validarProyectoDisponible(proyectoId) {
    const proyecto = await ProyectoModel.findById(proyectoId);
    if (!proyecto) throw new NotFoundError("Proyecto no encontrado");
    const colectivo = await ColectivoModel.findById(proyecto.colectivoId);
    if (
      proyecto.moderacionTerminos?.suspendido ||
      colectivo?.moderacionTerminos?.suspendido
    )
      throw new DomainError(
        "Proyecto suspendido por incumplimiento de términos.",
      );
  }
  static async estado() {
    const actual = await this.actual();
    const [proyectos, colectivos, revisiones] = await Promise.all([
      ProyectoModel.find()
        .select("titulo colectivoId aceptacionTerminos moderacionTerminos")
        .lean(),
      ColectivoModel.find().select("nombre moderacionTerminos").lean(),
      RevisionTerminosModel.find().sort({ createdAt: -1 }).limit(100).lean(),
    ]);
    return {
      versionVigente: actual.version,
      proyectos: proyectos.map((p) => ({
        ...p,
        terminosVigentes: p.aceptacionTerminos?.version === actual.version,
      })),
      colectivos,
      revisiones,
    };
  }
}

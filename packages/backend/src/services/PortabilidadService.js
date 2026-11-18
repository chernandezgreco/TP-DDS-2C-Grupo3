import {
  ColaboracionModel,
  ColaboradoraModel,
  ColectivoModel,
  DenunciaModel,
  HabilidadModel,
  NotificacionModel,
  PostulacionModel,
  ProyectoModel,
  TareaModel,
} from "../models/indexModel.js";
import { RevisionTerminosModel } from "../models/AdicionalesModel.js";
import { LinkedInConnectionModel } from "../models/LinkedInModel.js";
import { ExportacionDatos } from "../domain/Exportacion/ExportacionDatos.js";
import { NotFoundError } from "../domain/errores.js";
import { esIdValido } from "./ids.js";

// Cada sección se arma con una lista explícita de campos: si un modelo suma un dato
// sensible, no se filtra a la exportación hasta que alguien decida incluirlo.

const texto = (valor) => (valor === null || valor === undefined ? null : String(valor));

const unicos = (valores) => [...new Set(valores.filter(Boolean).map(String))];

// documentos por id; ignora ids que no son ObjectId para no romper con datos históricos
async function indexarPorId(Model, ids, campos) {
  const validos = unicos(ids).filter((id) => esIdValido(id));
  if (validos.length === 0) return new Map();
  const docs = await Model.find({ _id: { $in: validos } })
    .select(campos)
    .lean();
  return new Map(docs.map((doc) => [String(doc._id), doc]));
}

const descripcionDePerfil = (proyecto, perfilId) =>
  proyecto?.perfiles?.find((perfil) => String(perfil._id) === String(perfilId))
    ?.descripcionPerfil ?? null;

const moderacion = (m) =>
  m
    ? {
        suspendido: m.suspendido ?? false,
        motivo: m.motivo ?? null,
        version: m.version ?? null,
        fecha: m.fecha ?? null,
      }
    : null;

const datosCuenta = (cuenta) => ({
  email: cuenta.email,
  tipo: cuenta.tipo,
  fechaAlta: cuenta.createdAt ?? null,
  ultimaModificacion: cuenta.updatedAt ?? null,
});

async function denunciasRealizadas(cuenta) {
  const denuncias = await DenunciaModel.find({ cuentaDenuncianteId: cuenta._id })
    .sort({ fechaCreacion: 1 })
    .lean();
  return denuncias.map((d) => ({
    id: texto(d._id),
    tipoEntidadDenunciada: d.tipoEntidadDenunciada,
    entidadDenunciadaId: texto(d.entidadDenunciadaId),
    motivo: d.motivo,
    descripcion: d.descripcion,
    estado: d.estado,
    fechaCreacion: d.fechaCreacion,
  }));
}

// los tokens cifrados tienen select:false; igual se eligen los campos uno por uno
async function conexionLinkedIn(cuenta) {
  const conexion = await LinkedInConnectionModel.findOne({ cuentaId: cuenta._id }).lean();
  if (!conexion) return null;
  return {
    memberId: conexion.memberId,
    nombre: conexion.nombre,
    nombrePila: conexion.nombrePila,
    apellido: conexion.apellido,
    foto: conexion.foto,
    conectadaDesde: conexion.createdAt ?? null,
    ultimaActualizacion: conexion.updatedAt ?? null,
    autorizacionVence: conexion.tokenExpira ?? null,
  };
}

export class PortabilidadService {
  static async exportar(cuenta) {
    const secciones =
      cuenta.tipo === "colectivos"
        ? await this.seccionesDeColectivo(cuenta)
        : await this.seccionesDeColaboradora(cuenta);

    return new ExportacionDatos({
      tipoTitular: cuenta.tipo,
      perfilId: String(cuenta.perfilId),
      secciones,
    });
  }

  static async seccionesDeColaboradora(cuenta) {
    const id = String(cuenta.perfilId);
    const perfil = esIdValido(id)
      ? await ColaboradoraModel.findById(id).lean()
      : null;
    if (!perfil) throw new NotFoundError("No se encontró el perfil de la cuenta.");

    const [postulaciones, colaboraciones, notificaciones, tareas, habilidades] =
      await Promise.all([
        PostulacionModel.find({ colaboradoraId: id }).sort({ fechaCreacion: 1 }).lean(),
        ColaboracionModel.find({ colaboradoraId: id }).sort({ fechaCreacion: 1 }).lean(),
        NotificacionModel.find({ colaboradoraId: id }).sort({ fecha: 1 }).lean(),
        TareaModel.find({ responsableId: id }).sort({ fechaInicio: 1 }).lean(),
        HabilidadModel.find({ codigo: { $in: perfil.habilidades ?? [] } })
          .select("codigo titulo")
          .lean(),
      ]);

    const proyectos = await indexarPorId(
      ProyectoModel,
      [...postulaciones, ...colaboraciones, ...notificaciones, ...tareas].map(
        (x) => x.proyectoId,
      ),
      "titulo colectivoId perfiles._id perfiles.descripcionPerfil",
    );
    const colectivos = await indexarPorId(
      ColectivoModel,
      [
        ...[...proyectos.values()].map((p) => p.colectivoId),
        ...notificaciones.map((n) => n.colectivoId),
      ],
      "nombre",
    );
    const tituloDe = (proyectoId) => proyectos.get(String(proyectoId))?.titulo ?? null;
    const colectivoDe = (proyectoId) =>
      colectivos.get(String(proyectos.get(String(proyectoId))?.colectivoId))?.nombre ?? null;
    const titulos = new Map(habilidades.map((h) => [h.codigo, h.titulo]));

    const participacion = (x) => ({
      id: texto(x._id),
      proyectoId: x.proyectoId,
      proyecto: tituloDe(x.proyectoId),
      colectivo: colectivoDe(x.proyectoId),
      perfilId: x.perfilId,
      perfil: descripcionDePerfil(proyectos.get(String(x.proyectoId)), x.perfilId),
      estado: x.estado,
      anonimidad: x.anonimidad ?? false,
      fechaCreacion: x.fechaCreacion,
    });

    return {
      cuenta: datosCuenta(cuenta),
      perfil: {
        id,
        nombreFantasia: perfil.nombreFantasia,
        nombreApellido: perfil.nombreApellido ?? null,
        github: perfil.github ?? null,
        pronombres: perfil.pronombres ?? null,
        presentacion: perfil.presentacion ?? null,
        linkedinFoto: perfil.linkedinFoto || null,
        aceptaMensajeria: perfil.aceptaMensajeria ?? false,
        // los contactos propios sí se entregan: son de la titular
        mediosContacto: (perfil.mediosContacto ?? []).map((m) => ({
          tipo: m.tipo,
          valor: m.valor,
        })),
      },
      habilidades: (perfil.habilidades ?? []).map((codigo) => ({
        codigo,
        titulo: titulos.get(codigo) ?? null,
      })),
      experienciaHabilidades: (perfil.experienciaHabilidades ?? []).map((e) => ({
        codigo: e.codigo,
        nivel: e.nivel,
        anios: e.anios,
        descripcion: e.descripcion ?? "",
      })),
      postulaciones: postulaciones.map(participacion),
      colaboraciones: colaboraciones.map((c) => ({
        ...participacion(c),
        fechaBaja: c.fechaBaja ?? null,
      })),
      notificacionesRecibidas: notificaciones.map((n) => ({
        id: texto(n._id),
        fecha: n.fecha,
        texto: n.texto,
        proyectoId: n.proyectoId,
        proyecto: tituloDe(n.proyectoId),
        colectivoId: n.colectivoId,
        colectivo: colectivos.get(String(n.colectivoId))?.nombre ?? null,
      })),
      tareasAsignadas: tareas.map((t) => ({
        id: texto(t._id),
        proyectoId: t.proyectoId,
        proyecto: tituloDe(t.proyectoId),
        nombre: t.nombre,
        descripcion: t.descripcion ?? null,
        fechaInicio: t.fechaInicio,
        fechaFin: t.fechaFin,
        estado: t.estado,
      })),
      denunciasRealizadas: await denunciasRealizadas(cuenta),
      linkedin: await conexionLinkedIn(cuenta),
    };
  }

  static async seccionesDeColectivo(cuenta) {
    const id = String(cuenta.perfilId);
    const perfil = esIdValido(id)
      ? await ColectivoModel.findById(id).lean()
      : null;
    if (!perfil) throw new NotFoundError("No se encontró el perfil de la cuenta.");

    const proyectos = await ProyectoModel.find({ colectivoId: id }).lean();
    const proyectoIds = proyectos.map((p) => String(p._id));
    const porId = new Map(proyectos.map((p) => [String(p._id), p]));

    const [postulaciones, colaboraciones, notificaciones, tareas, revisiones] =
      await Promise.all([
        PostulacionModel.find({ proyectoId: { $in: proyectoIds } })
          .sort({ fechaCreacion: 1 })
          .lean(),
        ColaboracionModel.find({ proyectoId: { $in: proyectoIds } })
          .sort({ fechaCreacion: 1 })
          .lean(),
        NotificacionModel.find({ colectivoId: id }).sort({ fecha: 1 }).lean(),
        TareaModel.find({ proyectoId: { $in: proyectoIds } })
          .sort({ fechaInicio: 1 })
          .lean(),
        RevisionTerminosModel.find({
          $or: [
            { recurso: "colectivos", recursoId: id },
            { recurso: "proyectos", recursoId: { $in: proyectoIds } },
          ],
        })
          .sort({ createdAt: 1 })
          .lean(),
      ]);

    // de las colaboradoras sólo se consulta el nombre de fantasía: sus contactos no salen
    const colaboradoras = await indexarPorId(
      ColaboradoraModel,
      [
        ...postulaciones.map((p) => p.colaboradoraId),
        ...colaboraciones.map((c) => c.colaboradoraId),
        ...notificaciones.map((n) => n.colaboradoraId),
        ...tareas.map((t) => t.responsableId),
      ],
      "nombreFantasia",
    );
    const referencia = (colaboradoraId) =>
      colaboradoraId
        ? ExportacionDatos.referenciaColaboradora(
            colaboradoraId,
            colaboradoras.get(String(colaboradoraId)),
          )
        : null;
    const tituloDe = (proyectoId) => porId.get(String(proyectoId))?.titulo ?? null;

    const participacion = (x) => ({
      id: texto(x._id),
      proyectoId: x.proyectoId,
      proyecto: tituloDe(x.proyectoId),
      perfilId: x.perfilId,
      perfil: descripcionDePerfil(porId.get(String(x.proyectoId)), x.perfilId),
      colaboradora: referencia(x.colaboradoraId),
      estado: x.estado,
      anonimidad: x.anonimidad ?? false,
      fechaCreacion: x.fechaCreacion,
    });

    return {
      cuenta: datosCuenta(cuenta),
      perfil: {
        id,
        nombre: perfil.nombre,
        descripcion: perfil.descripcion,
        tipo: perfil.tipo,
        ubicacion: perfil.ubicacion ?? null,
        moderacionTerminos: moderacion(perfil.moderacionTerminos),
      },
      proyectos: proyectos.map((p) => ({
        id: texto(p._id),
        titulo: p.titulo,
        descripcion: p.descripcion,
        estado: p.estado,
        estaBuscando: p.estaBuscando ?? null,
        fechaCierre: p.fechaCierre ?? null,
        requiereIA: p.requiereIA ?? null,
        usosIA: (p.usosIA ?? []).map((u) => ({
          descripcion: u.descripcion,
          justificacion: u.justificacion,
          grado: u.grado,
        })),
        aceptacionTerminos: p.aceptacionTerminos?.version
          ? { version: p.aceptacionTerminos.version, fecha: p.aceptacionTerminos.fecha ?? null }
          : null,
        moderacionTerminos: moderacion(p.moderacionTerminos),
        perfiles: (p.perfiles ?? []).map((perfilProyecto) => ({
          id: texto(perfilProyecto._id),
          descripcionPerfil: perfilProyecto.descripcionPerfil,
          habilidadesRequeridas: perfilProyecto.habilidadesRequeridas ?? [],
          habilidadesOpcionales: perfilProyecto.habilidadesOpcionales ?? [],
          compromiso: perfilProyecto.compromiso
            ? {
                cantidadHoras: perfilProyecto.compromiso.cantidadHoras,
                tipo: perfilProyecto.compromiso.tipo,
              }
            : null,
          modalidad: perfilProyecto.modalidad
            ? {
                gratuita: perfilProyecto.modalidad.gratuita,
                incentivoEconomico: perfilProyecto.modalidad.incentivoEconomico,
                contratacionEventual: perfilProyecto.modalidad.contratacionEventual,
              }
            : null,
          cantidadLimite: perfilProyecto.cantidadLimite ?? null,
          fechaLimite: perfilProyecto.fechaLimite ?? null,
        })),
        logros: (p.logros ?? []).map((l) => ({
          id: texto(l._id),
          descripcion: l.descripcion,
          porcentajeCompletitud: l.porcentajeCompletitud,
          enlaceSistema: l.enlaceSistema ?? null,
          enlaceFuentePublica: l.enlaceFuentePublica ?? null,
          fechaCreacion: l.fechaCreacion ?? null,
        })),
      })),
      tareas: tareas.map((t) => ({
        id: texto(t._id),
        proyectoId: t.proyectoId,
        proyecto: tituloDe(t.proyectoId),
        nombre: t.nombre,
        descripcion: t.descripcion ?? null,
        fechaInicio: t.fechaInicio,
        fechaFin: t.fechaFin,
        estado: t.estado,
        responsable: referencia(t.responsableId),
      })),
      postulacionesRecibidas: postulaciones.map(participacion),
      colaboraciones: colaboraciones.map((c) => ({
        ...participacion(c),
        fechaBaja: c.fechaBaja ?? null,
      })),
      notificacionesEnviadas: notificaciones.map((n) => ({
        id: texto(n._id),
        fecha: n.fecha,
        texto: n.texto,
        proyectoId: n.proyectoId,
        proyecto: tituloDe(n.proyectoId),
        colaboradora: referencia(n.colaboradoraId),
      })),
      revisionesTerminos: revisiones.map((r) => ({
        id: texto(r._id),
        recurso: r.recurso,
        recursoId: r.recursoId,
        suspendido: r.suspendido,
        motivo: r.motivo,
        versionTerminos: r.versionTerminos,
        fecha: r.createdAt ?? null,
      })),
      denunciasRealizadas: await denunciasRealizadas(cuenta),
      linkedin: await conexionLinkedIn(cuenta),
    };
  }
}

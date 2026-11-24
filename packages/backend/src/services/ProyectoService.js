import { TerminosService } from "./TerminosService.js";
import {
  ProyectoModel,
  ColaboracionModel,
  PostulacionModel,
} from "../models/indexModel.js";
import { Proyecto } from "../domain/Proyecto/Proyecto.js";
import { EstadoProyecto } from "../domain/Proyecto/EstadoProyecto.js";
import { Perfil } from "../domain/Perfil/Perfil.js";
import { Compromiso } from "../domain/Compromiso/Compromiso.js";
import { ModalidadColaboracion } from "../domain/ModalidadColaboracion/ModalidadColaboracion.js";
import { Logro } from "../domain/Logro/Logro.js";
import { EstadoColaboracion } from "../domain/Colaboracion/EstadoColaboracion.js";
import { NotFoundError, ConflictError } from "../domain/errores.js";
import { ColectivoService } from "./ColectivosService.js";
import { ColaboradoraService } from "./ColaboradoraService.js";
import { ColaboracionService } from "./ColaboracionService.js";
import { HabilidadService } from "./HabilidadService.js";
import { esIdValido, nuevoId } from "./ids.js";
import { PostulacionService } from "./PostulacionService.js";
import { TareaService } from "./TareaService.js";
import { DomainError } from "../domain/errores.js";
import { serializar } from "./serializar.js";
import { etiquetasDeConsulta, filtroEtiquetas } from "./consultaEtiquetas.js";

// --- Conversión entre Mongo y dominio. Es el único lugar que conoce la forma del documento ---

export const crearPerfil = (id, datos) =>
  new Perfil(
    id,
    datos.descripcionPerfil,
    datos.fechaLimite,
    datos.cantidadLimite,
    datos.habilidadesRequeridas,
    datos.habilidadesOpcionales,
    new Compromiso(datos.compromiso.cantidadHoras, datos.compromiso.tipo),
    new ModalidadColaboracion(
      datos.modalidad.gratuita,
      datos.modalidad.incentivoEconomico,
      datos.modalidad.contratacionEventual,
    ),
  );

const aDominio = (doc) =>
  Object.assign(
    new Proyecto(
      doc._id.toString(),
      doc.titulo,
      doc.descripcion,
      doc.colectivoId,
      doc.perfiles.map((perfil) =>
        crearPerfil(perfil.id || perfil._id.toString(), perfil),
      ),
      doc.logros.map(
        (logro) =>
          new Logro(
            logro.id || logro._id.toString(),
            logro.descripcion,
            logro.porcentajeCompletitud,
            logro.enlaceSistema,
            logro.enlaceFuentePublica,
            logro.fechaCreacion,
          ),
      ),
      doc.estaBuscando ?? true,
      doc.estado,
      doc.fechaCierre ?? null,
      [...(doc.etiquetas ?? [])],
    ),
    {
      requiereIA: doc.requiereIA ?? null,
      usosIA:
        doc.usosIA?.map((u) => ({
          descripcion: u.descripcion,
          justificacion: u.justificacion,
          grado: u.grado,
        })) || [],
      aceptacionTerminos: doc.aceptacionTerminos?.version
        ? {
            version: doc.aceptacionTerminos.version,
            fecha: doc.aceptacionTerminos.fecha,
          }
        : undefined,
      moderacionTerminos: doc.moderacionTerminos
        ? {
            suspendido: doc.moderacionTerminos.suspendido,
            motivo: doc.moderacionTerminos.motivo,
            version: doc.moderacionTerminos.version,
            fecha: doc.moderacionTerminos.fecha,
          }
        : undefined,
    },
  );

export const aDocumento = (proyecto) => ({
  requiereIA: proyecto.requiereIA ?? null,
  usosIA: proyecto.usosIA || [],
  aceptacionTerminos: proyecto.aceptacionTerminos,
  moderacionTerminos: proyecto.moderacionTerminos,
  titulo: proyecto.titulo,
  descripcion: proyecto.descripcion,
  colectivoId: proyecto.colectivoId,
  estado: proyecto.estado,
  estaBuscando: proyecto.estaBuscando,
  fechaCierre: proyecto.fechaCierre,
  etiquetas: proyecto.etiquetas,
  perfiles: proyecto.perfiles.map((perfil) => ({
    _id: esIdValido(perfil.id) ? perfil.id : undefined,
    id: perfil.id,
    descripcionPerfil: perfil.descripcionPerfil,
    fechaLimite: perfil.fechaLimite,
    cantidadLimite: perfil.cantidadLimite,
    habilidadesRequeridas: perfil.habilidadesRequeridas,
    habilidadesOpcionales: perfil.habilidadesOpcionales,
    compromiso: {
      cantidadHoras: perfil.compromiso.cantidadHoras,
      tipo: perfil.compromiso.tipo,
    },
    modalidad: {
      gratuita: perfil.modalidad.gratuita,
      incentivoEconomico: perfil.modalidad.incentivoEconomico,
      contratacionEventual: perfil.modalidad.contratacionEventual,
    },
  })),
  logros: proyecto.logros.map((logro) => ({
    _id: esIdValido(logro.id) ? logro.id : undefined,
    id: logro.id,
    descripcion: logro.descripcion,
    porcentajeCompletitud: logro.porcentajeCompletitud,
    enlaceSistema: logro.enlaceSistema,
    enlaceFuentePublica: logro.enlaceFuentePublica,
    fechaCreacion: logro.fechaCreacion,
  })),
});

export function validarHuellaIA(datos) {
  const usos = datos.usosIA || [];
  if (datos.requiereIA === true && !usos.length)
    throw new DomainError(
      "Indicá al menos un uso de IA con su justificación y grado estimado.",
    );
  if (datos.requiereIA !== true && usos.length)
    throw new DomainError(
      "Los usos sólo pueden cargarse en proyectos que requieren IA.",
    );
}
export const ordenarPorHuellaIA = (proyectos) =>
  [...proyectos].sort(
    (a, b) =>
      (a.requiereIA === false ? 0 : a.requiereIA === true ? 1 : 2) -
      (b.requiereIA === false ? 0 : b.requiereIA === true ? 1 : 2),
  );
export class ProyectoService {
  static async actualizar(colectivoId, proyectoId, datos) {
    return serializar(`proyecto:${proyectoId}`, async () => {
      const actual = await this.obtenerPorId(proyectoId);

      if (!actual.perteneceA(colectivoId)) {
        throw new NotFoundError(
          "El proyecto no pertenece a este colectivo",
        );
      }

      if (
        datos.fechaCierre !== undefined &&
        (!actual.estaActivo() || actual.debeCerrarse())
      ) {
        throw new ConflictError(
          "No se puede reprogramar un proyecto finalizado o vencido",
        );
      }

      const aceptacionTerminos = await TerminosService.validarAceptacion(
        datos.versionTerminosAceptada,
      );

      const adicionales = {
        requiereIA:
          datos.requiereIA === undefined
            ? actual.requiereIA
            : datos.requiereIA,
        usosIA: datos.usosIA ?? actual.usosIA,
      };

      validarHuellaIA(adicionales);

      const validado = new Proyecto(
        actual.id,
        datos.titulo ?? actual.titulo,
        datos.descripcion ?? actual.descripcion,
        actual.colectivoId,
        actual.perfiles,
        actual.logros,
        actual.estaBuscando,
        actual.estado,
        datos.fechaCierre === undefined
          ? actual.fechaCierre
          : datos.fechaCierre,
        datos.etiquetas ?? actual.etiquetas,
      );

      const doc = await ProyectoModel.findOneAndUpdate(
        { _id: proyectoId, colectivoId },
        {
          $set: {
            titulo: validado.titulo,
            descripcion: validado.descripcion,
            fechaCierre: validado.fechaCierre,
            etiquetas: validado.etiquetas,
            ...adicionales,
            aceptacionTerminos,
          },
        },
        { new: true, runValidators: true },
      );

      if (!doc) {
        throw new NotFoundError("Proyecto no encontrado");
      }

      return aDominio(doc);
    });
  }

  static async eliminar(colectivoId, proyectoId) {
    // mismo turno que las altas de tareas: ninguna tarea nueva queda huérfana mientras se borra el proyecto
    return await serializar(`proyecto:${proyectoId}`, async () => {
      const proyecto = await this.obtenerPorId(proyectoId);
      if (!proyecto.perteneceA(colectivoId))
        throw new NotFoundError("El proyecto no pertenece a este colectivo");
      const [colaboracion, postulacion] = await Promise.all([
        ColaboracionModel.exists({ proyectoId }),
        PostulacionModel.exists({ proyectoId }),
      ]);
      if (colaboracion || postulacion || proyecto.logros.length) {
        throw new DomainError(
          "Este proyecto tiene historial. Finalizalo para conservar sus postulaciones, colaboraciones y logros.",
        );
      }
      const resultado = await ProyectoModel.deleteOne({
        _id: proyectoId,
        colectivoId,
      });
      if (!resultado.deletedCount)
        throw new NotFoundError("Proyecto no encontrado");
      await TareaService.eliminarDeProyecto(proyectoId);
    });
  }

  // consulta.etiquetas: el valor crudo de ?etiquetas= (si hay varias, deben estar todas)
  static async listar(consulta = {}) {
    const etiquetas = etiquetasDeConsulta(consulta.etiquetas);
    const docs = await ProyectoModel.find({
      ...(await TerminosService.filtroProyectosPublicos()),
      ...filtroEtiquetas(etiquetas),
    });

    return ordenarPorHuellaIA(docs.map(aDominio));
  }

  static async obtenerPorId(id) {
    const doc = esIdValido(id) ? await ProyectoModel.findById(id) : null;
    if (!doc) {
      throw new NotFoundError("Proyecto no encontrado", { proyectoId: id });
    }

    if (
      doc.moderacionTerminos?.suspendido ||
      (await TerminosService.colectivosSuspendidos()).includes(doc.colectivoId)
    )
      throw new DomainError(
        "Proyecto suspendido por incumplimiento de términos.",
      );
    return aDominio(doc);
  }

  static async guardar(proyecto) {
    const datos = aDocumento(proyecto);

    delete datos.estado;
    delete datos.estaBuscando;
    delete datos.fechaCierre;
    // las etiquetas solo cambian al crear o editar el proyecto (actualizar);
    // así agregar un perfil o un logro no pisa una edición hecha mientras tanto
    delete datos.etiquetas;

    const resultado = await ProyectoModel.updateOne(
      { _id: proyecto.id },
      { $set: datos },
      { runValidators: true },
    );

    if (resultado.matchedCount === 0) {
      throw new NotFoundError("Proyecto no encontrado", {
        proyectoId: proyecto.id,
      });
    }

    return proyecto;
  }

  static async crearProyecto(data, colectivoId) {
    const aceptacionTerminos = await TerminosService.validarAceptacion(
      data.versionTerminosAceptada,
    );
    validarHuellaIA(data);
    const colectivo = await ColectivoService.obtenerPorId(colectivoId);

    // Si data viene envuelto en un body o req, o asegurando que perfiles exista
    const perfilesData = data.perfiles || data.body?.perfiles || [];

    const perfiles = perfilesData.map((perfil) =>
      crearPerfil(nuevoId(), perfil),
    );
    const borrador = new Proyecto(
      null,
      data.titulo,
      data.descripcion,
      colectivo.id,
      perfiles,
      [],
      true,
      EstadoProyecto.ACTIVO,
      data.fechaCierre ?? null,
      data.etiquetas,
    );

    await HabilidadService.validarExistentes(
      perfiles.flatMap((perfil) => perfil.todasLasHabilidades()),
    );

    Object.assign(borrador, {
      requiereIA: data.requiereIA ?? null,
      usosIA: data.usosIA || [],
      aceptacionTerminos,
    });
    const doc = await ProyectoModel.create(aDocumento(borrador));

    return aDominio(doc);
  }
  static async cambiarEstadoBusqueda(proyectoId, nuevoEstado) {
    const proyecto = await this.obtenerPorId(proyectoId);

    proyecto.cambiarEstadoBusqueda(nuevoEstado);

    const docActualizado = await ProyectoModel.findByIdAndUpdate(
      proyectoId,
      { estaBuscando: proyecto.estaBuscando },
      { new: true },
    );

    if (!docActualizado) {
      throw new NotFoundError("Proyecto no encontrado", { proyectoId });
    }

    return aDominio(docActualizado);
  }

  static async finalizar(proyecto) {
    proyecto.cerrar();

    await PostulacionModel.updateMany(
      {
        proyectoId: proyecto.id,
        estado: "PENDIENTE",
      },
      {
        $set: { estado: "RECHAZADA" },
      },
    );

    // Las tareas sin terminar se cierran antes de marcar el proyecto: si algo falla acá el proyecto sigue activo
    // y repetir el cierre (manual o el del job automático) lo completa, porque cerrar tareas se puede repetir.
    // Los dos caminos de cierre ya llaman a finalizar con el turno del proyecto tomado.
    await TareaService.cerrarDeProyecto(proyecto.id);

    const resultado = await ProyectoModel.updateOne(
      {
        _id: proyecto.id,
        estado: EstadoProyecto.ACTIVO,
      },
      {
        $set: {
          estado: proyecto.estado,
          estaBuscando: false,
        },
      },
    );

    if (resultado.matchedCount === 0) {
      throw new ConflictError(
        "El proyecto ya no está disponible para finalizar",
        { proyectoId: proyecto.id },
      );
    }

    return proyecto;
  }

  static async cerrarProyecto(colectivoId, proyectoId) {
    return serializar(`proyecto:${proyectoId}`, async () => {
      const proyecto = await this.obtenerPorId(proyectoId);

      if (!proyecto.perteneceA(colectivoId)) {
        throw new NotFoundError(
          "El proyecto no pertenece a este colectivo",
          { proyectoId, colectivoId },
        );
      }

      return this.finalizar(proyecto);
    });
  }

  static async cerrarVencidos(fechaActual = new Date()) {
    if (
      !(fechaActual instanceof Date) ||
      !Number.isFinite(fechaActual.getTime())
    ) {
      throw new DomainError("La fecha de revisión no es válida");
    }

    const candidatos = await ProyectoModel.find({
      estado: EstadoProyecto.ACTIVO,
      fechaCierre: {
        $ne: null,
        $lte: fechaActual,
      },
    })
      .select("_id")
      .lean();

    let cerrados = 0;
    const errores = [];

    for (const candidato of candidatos) {
      const proyectoId = candidato._id.toString();

      try {
        const cerrado = await serializar(
          `proyecto:${proyectoId}`,
          async () => {
            const documento =
              await ProyectoModel.findById(proyectoId);

            if (!documento) {
              return false;
            }

            const proyecto = aDominio(documento);

            if (!proyecto.debeCerrarse(fechaActual)) {
              return false;
            }

            await this.finalizar(proyecto);
            return true;
          },
        );

        if (cerrado) {
          cerrados++;
        }
      } catch (error) {
        errores.push({ proyectoId, error });
      }
    }

    return { cerrados, errores };
  }

  static async anotarPostulacion(
    proyectoId,
    { colaboradoraId, perfilId, anonimidad },
  ) {
    return serializar(`proyecto:${proyectoId}`, async () => {
      const proyecto = await this.obtenerPorId(proyectoId);

      proyecto.validarSePuedeAnotar();

      const colaboradora =
        await ColaboradoraService.obtenerPorId(colaboradoraId);

      const perfil = proyecto.perfilParaAnotar(
        colaboradora,
        perfilId,
      );

      const ocupadas = await ColaboracionModel.countDocuments({
        proyectoId: proyecto.id,
        perfilId: perfil.id,
        estado: EstadoColaboracion.ACTIVA,
      });

      perfil.validarPuedeAnotar(ocupadas);

      return PostulacionService.crear(
        proyecto.id,
        perfil.id,
        colaboradora.id,
        anonimidad,
      );
    });
  }

  static async anotarColaboradora(
    proyectoId,
    { colaboradoraId, perfilId, anonimidad },
  ) {
    const proyecto = await this.obtenerPorId(proyectoId);
    const colaboradora = await ColaboradoraService.obtenerPorId(colaboradoraId);

    const perfil = proyecto.perfilParaAnotar(colaboradora, perfilId);

    return await ColaboracionService.crear(
      proyecto.id,
      perfil.id,
      colaboradora.id,
      anonimidad,
    );
  }

  static async listarColaboradoras(proyectoId, actor) {
    const proyecto = await this.obtenerPorId(proyectoId);

    const colaboraciones = await ColaboracionService.listarDeProyecto(
      proyecto.id,
    );
    const idsColaboradoras = colaboraciones
      .filter(
        (c) =>
          !c.anonimidad ||
          (actor?.type === "colectivos" && actor.id === proyecto.colectivoId) ||
          actor?.id === c.colaboradoraId,
      )
      .map((c) => c.colaboradoraId);

    return await ColaboradoraService.listarPorIds(idsColaboradoras);
  }

  // proyectos activos con al menos un perfil cuyas habilidades requeridas tiene la colaboradora
  static async buscarProyectosPotenciales(colaboradoraId) {
    const colaboradora = await ColaboradoraService.obtenerPorId(colaboradoraId);

    const docs = await ProyectoModel.find({
      ...(await TerminosService.filtroProyectosPublicos()),
      estado: EstadoProyecto.ACTIVO,
      "perfiles.habilidadesRequeridas": { $in: colaboradora.habilidades },
    });

    return ordenarPorHuellaIA(docs.map(aDominio))
      .map((proyecto) => ({
        proyecto,
        perfilesCompatibles: proyecto.perfilesPara(colaboradora),
      }))
      .filter(({ perfilesCompatibles }) => perfilesCompatibles.length > 0);
  }
}

import { v4 as uuidv4 } from "uuid";
import { ProyectoModel } from "../models/indexModel.js";
import { Proyecto } from "../domain/Proyecto/Proyecto.js";
import { EstadoProyecto } from "../domain/Proyecto/EstadoProyecto.js";
import { Perfil } from "../domain/Perfil/Perfil.js";
import { Compromiso } from "../domain/Compromiso/Compromiso.js";
import { ModalidadColaboracion } from "../domain/ModalidadColaboracion/ModalidadColaboracion.js";
import { Logro } from "../domain/Logro/Logro.js";
import { NotFoundError } from "../domain/errores.js";
import { ColectivoService } from "./ColectivosService.js";
import { ColaboradoraService } from "./ColaboradoraService.js";
import { ColaboracionService } from "./ColaboracionService.js";
import { HabilidadService } from "./HabilidadService.js";
import { esIdValido } from "./ids.js";

// --- Conversión entre Mongo y dominio. Es el único lugar que conoce la forma del documento ---

export const crearPerfil = (id, datos) =>
    new Perfil(
        id,
        datos.descripcionPerfil,
        datos.habilidadesRequeridas,
        datos.habilidadesOpcionales,
        new Compromiso(datos.compromiso.cantidadHoras, datos.compromiso.tipo),
        new ModalidadColaboracion(datos.modalidad.gratuita, datos.modalidad.incentivoEconomico, datos.modalidad.contratacionEventual)
    );

const aDominio = (doc) =>
    new Proyecto(
        doc._id.toString(),
        doc.titulo,
        doc.descripcion,
        doc.colectivoId,
        doc.perfiles.map((perfil) => crearPerfil(perfil.id, perfil)),
        doc.logros.map((logro) => new Logro(
            logro.id,
            logro.descripcion,
            logro.porcentajeCompletitud,
            logro.enlaceSistema,
            logro.enlaceFuentePublica,
            logro.fechaCreacion,
        )),
        doc.estado
    );

export const aDocumento = (proyecto) => ({
    titulo: proyecto.titulo,
    descripcion: proyecto.descripcion,
    colectivoId: proyecto.colectivoId,
    estado: proyecto.estado,
    perfiles: proyecto.perfiles.map((perfil) => ({
        id: perfil.id,
        descripcionPerfil: perfil.descripcionPerfil,
        habilidadesRequeridas: perfil.habilidadesRequeridas,
        habilidadesOpcionales: perfil.habilidadesOpcionales,
        compromiso: { cantidadHoras: perfil.compromiso.cantidadHoras, tipo: perfil.compromiso.tipo },
        modalidad: {
            gratuita: perfil.modalidad.gratuita,
            incentivoEconomico: perfil.modalidad.incentivoEconomico,
            contratacionEventual: perfil.modalidad.contratacionEventual,
        },
    })),
    logros: proyecto.logros.map((logro) => ({
        id: logro.id,
        descripcion: logro.descripcion,
        porcentajeCompletitud: logro.porcentajeCompletitud,
        enlaceSistema: logro.enlaceSistema,
        enlaceFuentePublica: logro.enlaceFuentePublica,
        fechaCreacion: logro.fechaCreacion,
    })),
});

export class ProyectoService {
    static async listar() {
        const docs = await ProyectoModel.find();

        return docs.map(aDominio);
    }

    static async obtenerPorId(id) {
        const doc = esIdValido(id) ? await ProyectoModel.findById(id) : null;
        if (!doc) {
            throw new NotFoundError("Proyecto no encontrado", { proyectoId: id });
        }

        return aDominio(doc);
    }

    static async guardar(proyecto) {
        await ProyectoModel.updateOne({ _id: proyecto.id }, aDocumento(proyecto), { runValidators: true });
        return proyecto;
    }

    static async crearProyecto(data, colectivoId) {
        const colectivo = await ColectivoService.obtenerPorId(colectivoId);

        // el dominio valida antes de guardar
        const perfiles = (data.perfiles ?? []).map((perfil) => crearPerfil(uuidv4(), perfil));
        const borrador = new Proyecto(null, data.titulo, data.descripcion, colectivo.id, perfiles);
        await HabilidadService.validarExistentes(perfiles.flatMap((perfil) => perfil.todasLasHabilidades()));

        const doc = await ProyectoModel.create(aDocumento(borrador));

        return aDominio(doc);
    }

    static async cerrarProyecto(colectivoId, proyectoId) {
        const proyecto = await this.obtenerPorId(proyectoId);

        if (!proyecto.perteneceA(colectivoId)) {
            throw new NotFoundError("El proyecto no pertenece a este colectivo", { proyectoId, colectivoId });
        }

        proyecto.cerrar();
        return await this.guardar(proyecto);
    }

    static async anotarColaboradora(proyectoId, { colaboradoraId, perfilId, anonimidad }) {
        const proyecto = await this.obtenerPorId(proyectoId);
        const colaboradora = await ColaboradoraService.obtenerPorId(colaboradoraId);

        const perfil = proyecto.perfilParaAnotar(colaboradora, perfilId);

        return await ColaboracionService.crear(proyecto.id, perfil.id, colaboradora.id, anonimidad);
    }

    static async listarColaboradoras(proyectoId) {
        const proyecto = await this.obtenerPorId(proyectoId);

        const colaboraciones = await ColaboracionService.listarDeProyecto(proyecto.id);
        const idsColaboradoras = colaboraciones.map((colaboracion) => colaboracion.colaboradoraId);

        return await ColaboradoraService.listarPorIds(idsColaboradoras);
    }

    // proyectos activos con al menos un perfil cuyas habilidades requeridas tiene la colaboradora
    static async buscarProyectosPotenciales(colaboradoraId) {
        const colaboradora = await ColaboradoraService.obtenerPorId(colaboradoraId);

        const docs = await ProyectoModel.find({
            estado: EstadoProyecto.ACTIVO,
            "perfiles.habilidadesRequeridas": { $in: colaboradora.habilidades },
        });

        return docs
            .map(aDominio)
            .map((proyecto) => ({ proyecto, perfilesCompatibles: proyecto.perfilesPara(colaboradora) }))
            .filter(({ perfilesCompatibles }) => perfilesCompatibles.length > 0);
    }
}

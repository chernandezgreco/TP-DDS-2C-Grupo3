import { db } from "../data/db.js";
import { Colaboracion } from "../domain/Colaboracion/Colaboracion.js";
import { Compromiso } from "../domain/Compromiso/Compromiso.js";
import { ModalidadColaboracion } from "../domain/ModalidadColaboracion/ModalidadColaboracion.js";
import { Proyecto } from "../domain/Proyecto/Proyecto.js";
import { ConflictError, DomainError, NotFoundError } from "../domain/errores.js";
import { v4 as uuidv4 } from "uuid";

export class ProyectoService {

    static listar() {
        return db.proyectos;
    }

    static anotarColaboradora(proyectoId, colaboradoraId) {
        const proyecto = this.obtenerPorId(proyectoId);
        const colaboradora = db.colaboradoras.find(c => c.id === colaboradoraId);

        if (!colaboradora) {
            throw new DomainError("Colaboradora no encontrada", { colaboradoraId });
        }

        if (!proyecto.estaActivo()) {
            throw new DomainError("El proyecto se encuentra finalizado y no admite nuevas colaboraciones", {
                proyecto: { id: proyecto.id, titulo: proyecto.titulo, estado: proyecto.estado },
            });
        }

        const colaboracionExistente = db.colaboraciones.some(colaboracion =>
            colaboracion.proyectoId === proyectoId &&
            colaboracion.colaboradoraId === colaboradoraId
        );

        if (colaboracionExistente) {
            throw new ConflictError("La colaboradora ya se encuentra anotada en el proyecto", {
                proyectoId,
                colaboradora: { id: colaboradora.id, nombreFantasia: colaboradora.nombreFantasia },
            });
        }

        const tieneHabilidad = colaboradora.cumpleAlgunaHabilidad(
            proyecto.habilidadesRequeridas
        );

        if (!tieneHabilidad) {
            throw new DomainError("La colaboradora no cuenta con ninguna de las habilidades requeridas", {
                habilidadesRequeridas: proyecto.habilidadesRequeridas,
                habilidadesColaboradora: colaboradora.habilidades,
            });
        }

        const nuevaColaboracion = new Colaboracion(uuidv4(), proyectoId, colaboradoraId);

        db.colaboraciones.push(nuevaColaboracion);
        return nuevaColaboracion;
    }

    static  crearProyecto(data,IdColectivo){
        const compromiso = new Compromiso(
            data.compromiso.cantidadHoras,
            data.compromiso.tipo
        );
        const modalidad = new ModalidadColaboracion(
            data.modalidad.gratuita,
            data.modalidad.incentivoEconomico,
            data.modalidad.contratacionEventual
        );

        const nuevo = new Proyecto(
            uuidv4(),
            data.titulo,
            data.descripcion,
            data.habilidadesRequeridas,
            compromiso,
            modalidad,
            IdColectivo
        );

        this.cumpleHabilidades(nuevo.habilidadesRequeridas);

        const colectivo = db.colectivos.find(colectivo => colectivo.id === IdColectivo);

        if (!colectivo) {
            throw new NotFoundError("Colectivo no encontrado", { colectivoId: IdColectivo });
        }

        db.proyectos.push(nuevo);
        return nuevo;
    }

static cerrarProyecto(colectivoId, proyectoId) {
    const proyecto = this.obtenerPorId(proyectoId);

    // Validar que el proyecto pertenezca al colectivo
    if (proyecto.colectivoId !== colectivoId) {
        throw new NotFoundError("El proyecto no pertenece a este colectivo", { proyectoId, colectivoId });
    }

    proyecto.updateEstado("FINALIZADO")
    return proyecto;
}

    static listarColaboradoras(proyectoId) {
        this.obtenerPorId(proyectoId);

        const idsColaboradoras = db.colaboraciones
            .filter(c => c.proyectoId === proyectoId)
            .map(c => c.colaboradoraId);

        return db.colaboradoras.filter(c => idsColaboradoras.includes(c.id));
    }

    static obtenerPorId(id) {
    const proyecto = db.proyectos.find(c => c.id === id);
    if (!proyecto) {
        throw new NotFoundError("Proyecto no encontrado", { proyectoId: id });
    }
    return proyecto;
    }

    static cumpleHabilidades(Habilidades){
        const inexistentes = Habilidades.filter(CodigoHabilidad => !db.habilidades.some(habilidad => habilidad.codigo === CodigoHabilidad));
        if (inexistentes.length > 0) {
             throw new DomainError("El Proyecto no cumple con las habilidades dadas de alta", { habilidadesInexistentes: inexistentes });
        }
        return true;
    }
}

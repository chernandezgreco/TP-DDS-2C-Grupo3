import { db } from "../data/db.js";
import { Colaboracion } from "../domain/Colaboracion/Colaboracion.js";
import { Compromiso } from "../domain/Compromiso/Compromiso.js";
import { ModalidadColaboracion } from "../domain/ModalidadColaboracion/ModalidadColaboracion.js";
import { Proyecto } from "../domain/Proyecto/Proyecto.js";
import { v4 as uuidv4 } from "uuid";

export class ProyectoService {

    static listar() {
        return db.proyectos;
    }

    static anotarColaboradora(proyectoId, colaboradoraId) {
        const proyecto = db.proyectos.find(p => p.id === proyectoId);
        const colaboradora = db.colaboradoras.find(c => c.id === colaboradoraId);

        if (!proyecto || !colaboradora) {
            throw new Error("Proyecto o colaboradora no encontrados");
        }

        if (!proyecto.estaActivo()) {
            throw new Error("El proyecto se encuentra finalizado y no admite nuevas colaboraciones");
        }

        const colaboracionExistente = db.colaboraciones.some(colaboracion =>
            colaboracion.proyectoId === proyectoId &&
            colaboracion.colaboradoraId === colaboradoraId
        );

        if (colaboracionExistente) {
            throw new Error("La colaboradora ya se encuentra anotada en el proyecto");
        }

        const tieneHabilidad = colaboradora.cumpleAlgunaHabilidad(
            proyecto.habilidadesRequeridas
        );

        if (!tieneHabilidad) {
            throw new Error("La colaboradora no cuenta con ninguna de las habilidades requeridas");
        }

        const nuevaColaboracion = new Colaboracion(uuidv4(), proyectoId, colaboradoraId);

        db.colaboraciones.push(nuevaColaboracion);
        return nuevaColaboracion;
    }

    static  crearProyecto(data,IdColectivo){
        if (!data || typeof data !== "object") {
            throw new Error("Los datos del proyecto son obligatorios");
        }
        if (typeof data.titulo !== "string" || !data.titulo.trim()) {
            throw new Error("El título del proyecto es obligatorio");
        }
        if (typeof data.descripcion !== "string" || !data.descripcion.trim()) {
            throw new Error("La descripción del proyecto es obligatoria");
        }
        if (!data.compromiso || typeof data.compromiso !== "object") {
            throw new Error("El compromiso del proyecto es obligatorio");
        }
        if (!data.modalidad || typeof data.modalidad !== "object") {
            throw new Error("La modalidad de colaboración del proyecto es obligatoria");
        }

        const colectivo = db.colectivos.find(colectivo => colectivo.id === IdColectivo);

        if (!colectivo) {
            throw new Error("Colectivo no encontrado");
        }

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
        db.proyectos.push(nuevo);
        return nuevo;
    }

static cerrarProyecto(colectivoId, proyectoId) {
    const proyecto = db.proyectos.find(p => p.id === proyectoId);

    if (!proyecto) throw new Error("Proyecto no encontrado");

    // Validar que el proyecto pertenezca al colectivo
    if (proyecto.colectivoId !== colectivoId) {
        throw new Error("No autorizado: Este proyecto no pertenece a tu colectivo");
    }

    proyecto.cerrar();
    return proyecto;
}

    static listarColaboradoras(proyectoId) {
        const proyecto = db.proyectos.find(p => p.id === proyectoId);
        if (!proyecto) {
            throw new Error("Proyecto no encontrado");
        }

        const idsColaboradoras = db.colaboraciones
            .filter(c => c.proyectoId === proyectoId)
            .map(c => c.colaboradoraId);

        return db.colaboradoras.filter(c => idsColaboradoras.includes(c.id));
    }

    static obtenerPorId(id) {
    const proyecto = db.proyectos.find(c => c.id === id);
    if (!proyecto) {
        throw new Error("proyecto no encontrado");
    }
    return proyecto;
    }

    static cumpleHabilidades(Habilidades){
        if (!Array.isArray(Habilidades) || Habilidades.length === 0) {
            throw new Error("El proyecto debe requerir al menos una habilidad");
        }

        const habilidades = Habilidades.every(CodigoHabilidad => db.habilidades.find(habilidad=> habilidad.codigo === CodigoHabilidad))
        if(!habilidades){
             throw new Error("El Proyecto no cumple con las habilidades dadas de alta");
        }
        return habilidades;
    }
}

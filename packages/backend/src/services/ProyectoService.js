import { db } from "../data/db.js";
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

        if (!proyecto.estaAbierto()) {
            throw new Error("El proyecto se encuentra cerrado y no admite nuevas colaboraciones");
        }

        const tieneHabilidad = colaboradora.habilidades.some(hab =>
            proyecto.habilidadesRequeridas.includes(hab)
        );

        if (!tieneHabilidad) {
            throw new Error("La colaboradora no cuenta con ninguna de las habilidades requeridas");
        }

        const nuevaColaboracion = {
            id: uuidv4(),
            proyectoId,
            colaboradoraId,
            fecha: new Date()
        };

        db.colaboraciones.push(nuevaColaboracion);
        return nuevaColaboracion;
    }

    static  crearProyecto(data,IdColectivo){
        const nuevo = new Proyecto(
            uuidv4(),
            data.titulo,
            data.descripcion,
            data.habilidadesRequeridas,
            data.compromiso,
            data.modalidad,
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
}
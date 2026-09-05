import { memoryDB } from '../data/memoryDB.js';
import { colectivoService } from './colectivoService.js';
import { colaboradoraService } from './colaboradoraService.js';
import { Proyecto } from '../domain/Proyecto.js';

export const proyectoService = {
    crear: (colectivoId, data) => {
        const colectivo = colectivoService.buscarPorId(colectivoId);
        if (!colectivo) throw new Error("Colectivo no encontrado");

        const nuevoProyecto = new Proyecto(
            Date.now().toString(),
            colectivoId,
            data.titulo,
            data.descripcion,
            data.habilidadIds || [],
            data.compromiso,
            data.modalidad
        );

        memoryDB.proyectos.push(nuevoProyecto);
        return nuevoProyecto;
    },

    listar: () => memoryDB.proyectos,

    anotarColaborador: (proyectoId, personaId) => {
        const proyecto = memoryDB.proyectos.find(p => p.id === proyectoId);
        if (!proyecto) throw new Error("Proyecto no encontrado");
        if (!proyecto.estaActivo()) throw new Error("El proyecto no se encuentra activo");

        const persona = colaboradoraService.buscarPorId(personaId);
        if (!persona) throw new Error("Persona colaboradora no encontrada");

        // Validación obligatoria: Cumplir al menos una habilidad requerida
        const cumpleHabilidad = persona.habilidadIds.some(hId =>
            proyecto.habilidadesRequeridas.includes(hId)
        );

        if (!cumpleHabilidad) {
            throw new Error("La persona colaboradora no cuenta con ninguna de las habilidades requeridas para este proyecto");
        }

        const colaboracion = {
            id: Date.now().toString(),
            personaId,
            fechaInscripcion: new Date()
        };

        proyecto.colaboraciones.push(colaboracion);
        return colaboracion;
    },

    cerrarProyecto: (proyectoId) => {
        const proyecto = memoryDB.proyectos.find(p => p.id === proyectoId);
        if (!proyecto) throw new Error("Proyecto no encontrado");
        proyecto.cerrar(); // Cierre manual[cite: 1]
        return proyecto;
    }
};
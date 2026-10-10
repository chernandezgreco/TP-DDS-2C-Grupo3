import { db } from '../data/db.js';
import { Perfil } from '../domain/Perfiles/Perfiles.js';
import { Compromiso } from '../domain/Compromiso/Compromiso.js';
import { ModalidadColaboracion } from '../domain/ModalidadColaboracion/ModalidadColaboracion.js';
import { v4 as uuidv4 } from "uuid";

export const PerfilesService = {
    agregarPerfilAProyecto(proyectoId, datosPerfil) {
        const proyecto = db.proyectos.find(p => p.id === proyectoId);
        if (!proyecto) throw new Error('Proyecto no encontrado');

       
        const compromiso = new Compromiso(
            datosPerfil.compromiso.cantidadHoras,
            datosPerfil.compromiso.tipo
        );

        
        const modalidad = new ModalidadColaboracion(
            datosPerfil.modalidad.gratuita,
            datosPerfil.modalidad.incentivoEconomico,
            datosPerfil.modalidad.contratacionEventual
        );

       
        const nuevoPerfil = new Perfil(
            uuidv4(),
            datosPerfil.descripcionPerfil,
            datosPerfil.habilidadesRequeridas,
            datosPerfil.habilidadesOpcionales,
            compromiso,
            modalidad
        );

        if (!proyecto.perfiles) {
            proyecto.perfiles = [];
        }

        proyecto.perfiles.push(nuevoPerfil);
        return nuevoPerfil;
    },

    actualizarPerfil(proyectoId, perfilId, datosActualizados) {
        const proyecto = db.proyectos.find(p => p.id === proyectoId);
        if (!proyecto) throw new Error('Proyecto no encontrado');

        const perfil = proyecto.perfiles.find(p => p.id === perfilId);
        if (!perfil) throw new Error('Perfil no encontrado');

        Object.assign(perfil, datosActualizados);
        return perfil;
    },

    eliminarPerfil(proyectoId, perfilId) {
        const proyecto = db.proyectos.find(p => p.id === proyectoId);
        if (!proyecto) throw new Error('Proyecto no encontrado');

        proyecto.perfiles = proyecto.perfiles.filter(p => p.id !== perfilId);
        return { mensaje: 'Perfil eliminado correctamente' };
    }
};
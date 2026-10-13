import { ProyectoModel } from "../models/indexModel.js";
import { Perfil } from "../domain/Perfiles/Perfiles.js";
import { Compromiso } from "../domain/Compromiso/Compromiso.js";
import { ModalidadColaboracion } from "../domain/ModalidadColaboracion/ModalidadColaboracion.js";
import { v4 as uuidv4 } from "uuid";

export const PerfilesService = {
    async agregarPerfilAProyecto(proyectoId, datosPerfil) {
        const proyecto = await ProyectoModel.findById(proyectoId);
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

        const nuevoPerfilId = uuidv4();
        const nuevoPerfil = new Perfil(
            nuevoPerfilId,
            datosPerfil.descripcionPerfil,
            datosPerfil.habilidadesRequeridas,
            datosPerfil.habilidadesOpcionales,
            compromiso,
            modalidad
        );

        if (!proyecto.perfiles) {
            proyecto.perfiles = [];
        }

        proyecto.perfiles.push({
            id: nuevoPerfilId,
            descripcionPerfil: datosPerfil.descripcionPerfil,
            habilidadesRequeridas: datosPerfil.habilidadesRequeridas,
            habilidadesOpcionales: datosPerfil.habilidadesOpcionales,
            compromiso: datosPerfil.compromiso,
            modalidad: datosPerfil.modalidad
        });

        await proyecto.save();
        return nuevoPerfil;
    },

    async actualizarPerfil(proyectoId, perfilId, datosActualizados) {
        const proyecto = await ProyectoModel.findById(proyectoId);
        if (!proyecto) throw new Error('Proyecto no encontrado');

        const perfil = proyecto.perfiles.find(p => p.id === perfilId);
        if (!perfil) throw new Error('Perfil no encontrado');

        Object.assign(perfil, datosActualizados);
        await proyecto.save();
        return perfil;
    },

    async eliminarPerfil(proyectoId, perfilId) {
        const proyecto = await ProyectoModel.findById(proyectoId);
        if (!proyecto) throw new Error('Proyecto no encontrado');

        proyecto.perfiles = proyecto.perfiles.filter(p => p.id !== perfilId);
        await proyecto.save();
        return { mensaje: 'Perfil eliminado correctamente' };
    }
};
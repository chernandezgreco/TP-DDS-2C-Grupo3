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

static crearProyecto(data, IdColectivo) {
        if (!data || typeof data !== "object") {
            throw new Error("Los datos del proyecto son obligatorios");
        }
        if (typeof data.titulo !== "string" || !data.titulo.trim()) {
            throw new Error("El título del proyecto es obligatorio");
        }
        if (typeof data.descripcion !== "string" || !data.descripcion.trim()) {
            throw new Error("La descripción del proyecto es obligatoria");
        }

        const colectivo = db.colectivos.find(c => c.id === IdColectivo);
        if (!colectivo) {
            throw new Error("Colectivo no encontrado");
        }

        const perfiles = Array.isArray(data.perfiles) ? data.perfiles : [];

        const nuevo = new Proyecto(
            uuidv4(),          
            data.titulo,       
            data.descripcion,  
            IdColectivo,       
            perfiles           
        );

        db.proyectos.push(nuevo);
        return nuevo;
    }

static cerrarProyecto(colectivoId, proyectoId) {
    const proyecto = db.proyectos.find(p => p.id === proyectoId);

    if (!proyecto) throw new Error("Proyecto no encontrado");

    
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
    static actualizarPerfil(proyectoId, perfilId, datosActualizados) {
    const proyecto = db.proyectos.find(p => p.id === proyectoId);
    if (!proyecto) throw new Error('Proyecto no encontrado');

    const perfil = proyecto.perfiles.find(p => p.id === perfilId);
    if (!perfil) throw new Error('Perfil no encontrado');

    if (datosActualizados.descripcionPerfil) {
      perfil.descripcionPerfil = datosActualizados.descripcionPerfil;
    }
    if (datosActualizados.habilidadesRequeridas) {
      perfil.habilidadesRequeridas = datosActualizados.habilidadesRequeridas;
    }
    if (datosActualizados.habilidadesOpcionales) {
      perfil.habilidadesOpcionales = datosActualizados.habilidadesOpcionales;
    }
    if (datosActualizados.compromiso) {
      perfil.compromiso = new Compromiso(datosActualizados.compromiso);
    }
    if (datosActualizados.modalidad) {
      perfil.modalidad = new ModalidadColaboracion(datosActualizados.modalidad);
    }

    return perfil;
  }


  static eliminarPerfil(proyectoId, perfilId) {
    const proyecto = db.proyectos.find(p => p.id === proyectoId);
    if (!proyecto) throw new Error('Proyecto no encontrado');

    const existePerfil = proyecto.perfiles.some(p => p.id === perfilId);
    if (!existePerfil) throw new Error('Perfil no encontrado');

    proyecto.perfiles = proyecto.perfiles.filter(p => p.id !== perfilId);
    
    return { mensaje: 'Perfil eliminado correctamente' };
  }

  static agregarPerfilAProyecto(idProyecto, dataPerfil) {
        
        const proyecto = db.proyectos.find(p => p.id === idProyecto);
        if (!proyecto) {
            throw new Error("Proyecto no encontrado");
        }

       
        if (!dataPerfil || typeof dataPerfil !== "object") {
            throw new Error("Los datos del perfil son obligatorios");
        }
        if (typeof dataPerfil.descripcionPerfil !== "string" || !dataPerfil.descripcionPerfil.trim()) {
            throw new Error("La descripción del perfil es obligatoria");
        }

        
        const compromiso = new Compromiso(
            dataPerfil.compromiso.cantidadHoras,
            dataPerfil.compromiso.tipo
        );

      
        const modalidad = new ModalidadColaboracion(
            dataPerfil.modalidad.gratuita,
            dataPerfil.modalidad.incentivoEconomico,
            dataPerfil.modalidad.contratacionEventual
        );

       
        const nuevoPerfil = new Perfil(
            uuidv4(),
            dataPerfil.descripcionPerfil,
            dataPerfil.habilidadesRequeridas || [],
            dataPerfil.habilidadesOpcionales || [],
            compromiso,
            modalidad
        );

        
        if (!Array.isArray(proyecto.perfiles)) {
            proyecto.perfiles = [];
        }
        proyecto.perfiles.push(nuevoPerfil);

        return nuevoPerfil;
    }
}



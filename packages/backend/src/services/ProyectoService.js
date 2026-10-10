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

static anotarColaboradora(proyectoId,colaboradoraId, anonimidad) {
    const proyecto = db.proyectos.find(p => p.id === proyectoId);
    const colaboradora = db.colaboradoras.find(c => c.id === colaboradoraId);

    if (!proyecto || !colaboradora) {
        throw new Error("Proyecto o colaboradora no encontrados");
    }

    if (!proyecto.estaActivo()) {
        throw new Error("El proyecto se encuentra finalizado y no admite nuevas colaboraciones");
    }

    const perfilAsignado = proyecto.perfiles.find(perfil => {
    const habilidadesReq = perfil.habilidadesRequeridas || [];
    const habilidadesColab = colaboradora.habilidades || [];
    
    const colabLower = habilidadesColab.map(h => h.toLowerCase());
    
    return habilidadesReq.every(req => 
        colabLower.includes(req.toLowerCase())
    );
});

if (!perfilAsignado) {
    throw new Error("La colaboradora no cumple con las habilidades requeridas de ningún perfil disponible en este proyecto");
}

    const colaboracionExistente = db.colaboraciones.some(colaboracion =>
        colaboracion.proyectoId === proyectoId &&
        colaboracion.perfilId === perfilAsignado.id &&
        colaboracion.colaboradoraId === colaboradoraId
    );

    if (colaboracionExistente) {
        throw new Error("La colaboradora ya se encuentra anotada en este perfil del proyecto");
    }

    const idColaboradoraFinal = anonimidad ? "Anonimo" : colaboradoraId;
    console.log("Valor de anonimidad:", anonimidad)
    const nuevaColaboracion = new Colaboracion(uuidv4(), proyectoId, idColaboradoraFinal, new Date());

    

    db.colaboraciones.push(nuevaColaboracion);
    return nuevaColaboracion;
}

static crearProyecto(data, IdColectivo) {
        console.log("--- DEBUG PROYECTO SERVICE ---");
        console.log("Data que llega al servicio:", data);
        console.log("Perfiles dentro de data:", data.perfiles);
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
            data.perfiles           
        );

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

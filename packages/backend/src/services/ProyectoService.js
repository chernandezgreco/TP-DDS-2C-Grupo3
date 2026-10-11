import { db } from "../data/db.js";
import { Colaboracion } from "../domain/Colaboracion/Colaboracion.js";
import { Compromiso } from "../domain/Compromiso/Compromiso.js";
import { ModalidadColaboracion } from "../domain/ModalidadColaboracion/ModalidadColaboracion.js";
import { Proyecto } from "../domain/Proyecto/Proyecto.js";
import { ConflictError, DomainError, NotFoundError } from "../domain/errores.js";
import { v4 as uuidv4 } from "uuid";
import { ProyectoModel } from "../models/indexModel.js"; 
import { HabilidadModel } from "../models/indexModel.js"; 
import { ColectivoModel } from "../models/indexModel.js";
import { ColaboradoraModel } from "../models/indexModel.js";
import { ColaboracionModel } from "../models/indexModel.js";

export class ProyectoService {

    static async listar() {
        return await ProyectoModel.find({});
    }

    static async anotarColaboradora(proyectoId, colaboradoraId, anonimidad) {
        const proyecto = await ProyectoModel.findById(proyectoId);
        const colaboradora = await ColaboradoraModel.findById(colaboradoraId);

        if (!proyecto || !colaboradora) {
            throw new Error("Proyecto o colaboradora no encontrados");
        }

        if (proyecto.estado !== "ACTIVO") {
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

        const colaboracionExistente = await ColaboradoraModel.findOne({
            proyectoId: proyectoId,
            perfilId: perfilAsignado.id,
            colaboradoraId: colaboradoraId
        });

        if (colaboracionExistente) {
            throw new Error("La colaboradora ya se encuentra anotada en este perfil del proyecto");
        }

        const idColaboradoraFinal = anonimidad ? "Anonimo" : colaboradoraId;
        console.log("Valor de anonimidad:", anonimidad);

        const nuevaColaboracion = new ColaboracionModel({
            id: uuidv4(),
            proyectoId,
            perfilId: perfilAsignado.id,
            colaboradoraId: idColaboradoraFinal,
            estado: "PENDIENTE",
            fechaCreacion: new Date()
        });

        await nuevaColaboracion.save();
        return nuevaColaboracion;
    }

    static async crearProyecto(data, IdColectivo) {
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

        const colectivo = await ColectivoModel.findById(IdColectivo);
        if (!colectivo) {
            throw new Error("Colectivo no encontrado");
        }

        const perfiles = Array.isArray(data.perfiles) ? data.perfiles : [];

        for (const perfil of perfiles) {
            const habilidadesReq = perfil.habilidadesRequeridas || [];

            for (const habNombre of habilidadesReq) {
                const habilidadExiste = await HabilidadModel.findOne({
                    $or: [
                        { titulo: { $regex: new RegExp(`^${habNombre}$`, "i") } },
                        { codigo: { $regex: new RegExp(`^${habNombre}$`, "i") } }
                    ]
                });

                if (!habilidadExiste) {
                    throw new Error(`La habilidad requerida '${habNombre}' no está dada de alta en el sistema.`);
                }
            }
        }

        const perfilesConId = perfiles.map(perfil => {
            const nuevoPerfil = { ...perfil };
            nuevoPerfil.id = uuidv4();
            return nuevoPerfil;
        });

        console.log("--- PERFILES CON ID GENERADO ---", perfilesConId);

        const nuevoProyecto = new ProyectoModel({
            id: uuidv4(),          
            titulo: data.titulo,       
            descripcion: data.descripcion,  
            colectivoId: IdColectivo,       
            perfiles: perfilesConId,
            estado: "ACTIVO"
        });

        await nuevoProyecto.save();
        return nuevoProyecto;
    }

    static async cerrarProyecto(colectivoId, proyectoId) {
        const proyecto = await this.obtenerPorId(proyectoId);

        if (proyecto.colectivoId !== colectivoId) {
            throw new NotFoundError("El proyecto no pertenece a este colectivo", { proyectoId, colectivoId });
        }

        proyecto.estado = "FINALIZADO";
        await proyecto.save();
        return proyecto;
    }

    static async listarColaboradoras(proyectoId) {
        await this.obtenerPorId(proyectoId);

        const colaboraciones = await ColaboracionModel.find({ proyectoId: proyectoId });
        const idsColaboradoras = colaboraciones.map(c => c.colaboradoraId);

        return await ColaboradoraModel.find({ id: { $in: idsColaboradoras } });
    }

    static async obtenerPorId(id) {
        const proyecto = await ProyectoModel.findOne({ id: id });
        if (!proyecto) {
            throw new NotFoundError("Proyecto no encontrado", { proyectoId: id });
        }
        return proyecto;
    }

    static async cumpleHabilidades(Habilidades) {
        const habilidadesEnDb = await HabilidadModel.find({});
        const inexistentes = Habilidades.filter(CodigoHabilidad => 
            !habilidadesEnDb.some(habilidad => habilidad.codigo === CodigoHabilidad)
        );

        if (inexistentes.length > 0) {
            throw new DomainError("El Proyecto no cumple con las habilidades dadas de alta", { habilidadesInexistentes: inexistentes });
        }
        return true;
    }

    static async actualizarPerfil(proyectoId, perfilId, datosActualizados) {
        const proyecto = await ProyectoModel.findOne({ id: proyectoId });
        if (!proyecto) throw new Error('Proyecto no encontrado');

        const perfil = proyecto.perfiles.id(perfilId) || proyecto.perfiles.find(p => p.id === perfilId);
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
            perfil.compromiso = datosActualizados.compromiso;
        }
        if (datosActualizados.modalidad) {
            perfil.modalidad = datosActualizados.modalidad;
        }

        await proyecto.save();
        return perfil;
    }

    static async eliminarPerfil(proyectoId, perfilId) {
        const proyecto = await ProyectoModel.findOne({ id: proyectoId });
        if (!proyecto) throw new Error('Proyecto no encontrado');

        const existePerfil = proyecto.perfiles.some(p => p.id === perfilId);
        if (!existePerfil) throw new Error('Perfil no encontrado');

        proyecto.perfiles = proyecto.perfiles.filter(p => p.id !== perfilId);
        await proyecto.save();
        
        return { mensaje: 'Perfil eliminado correctamente' };
    }

    static async agregarPerfilAProyecto(idProyecto, dataPerfil) {
        const proyecto = await ProyectoModel.findOne({ id: idProyecto });
        if (!proyecto) {
            throw new Error("Proyecto no encontrado");
        }

        if (!dataPerfil || typeof dataPerfil !== "object") {
            throw new Error("Los datos del perfil son obligatorios");
        }
        if (typeof dataPerfil.descripcionPerfil !== "string" || !dataPerfil.descripcionPerfil.trim()) {
            throw new Error("La descripción del perfil es obligatoria");
        }

        const nuevoPerfil = {
            id: uuidv4(),
            descripcionPerfil: dataPerfil.descripcionPerfil,
            habilidadesRequeridas: dataPerfil.habilidadesRequeridas || [],
            habilidadesOpcionales: dataPerfil.habilidadesOpcionales || [],
            compromiso: dataPerfil.compromiso,
            modalidad: dataPerfil.modalidad
        };

        if (!Array.isArray(proyecto.perfiles)) {
            proyecto.perfiles = [];
        }
        proyecto.perfiles.push(nuevoPerfil);

        await proyecto.save();
        return nuevoPerfil;
    }

    static async listarPerfilesPorProyecto(proyectoId) {
        const proyecto = await ProyectoModel.findOne({ id: proyectoId });
        
        if (!proyecto) {
            throw new Error("Proyecto no encontrado");
        }

        return proyecto.perfiles || [];
    }
}

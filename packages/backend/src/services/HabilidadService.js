import { HabilidadModel } from "../models/indexModel.js";
import { Habilidad } from "../domain/Habilidad/Habilidad.js";
import { ConflictError } from "../domain/errores.js";

export class HabilidadService {
    static async crearHabilidad(data) {
        const codigo = data.titulo.toLowerCase().trim().replace(/\s+/g, '-');
        // el dominio valida antes de guardar
        const borrador = new Habilidad(codigo, data.titulo, data.descripcion);

        const habilidadExistente = await HabilidadModel.findOne({ codigo });

        if (habilidadExistente) {
            throw new ConflictError("La habilidad ya existe", { habilidadExistente });
        }

        const nuevaHabilidadDoc = await HabilidadModel.create({
            codigo: borrador.codigo,
            titulo: borrador.titulo,
            descripcion: borrador.descripcion
        });

        return new Habilidad(
            nuevaHabilidadDoc.codigo,
            nuevaHabilidadDoc.titulo,
            nuevaHabilidadDoc.descripcion
        );
    }

    static async listar() {
        const habilidadesDocs = await HabilidadModel.find();
        
        return habilidadesDocs.map(doc => 
            new Habilidad(doc.codigo, doc.titulo, doc.descripcion)
        );
    }
}
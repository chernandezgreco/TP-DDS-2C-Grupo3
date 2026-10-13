import { HabilidadModel } from "../models/indexModel.js";
import { Habilidad } from "../domain/Habilidad/Habilidad.js";
import { ConflictError, DomainError } from "../domain/errores.js";

const aDominio = (doc) => new Habilidad(doc.codigo, doc.titulo, doc.descripcion);

export class HabilidadService {
    static async crearHabilidad(data) {
        // el dominio valida antes de guardar
        const borrador = new Habilidad(Habilidad.codigoPara(data.titulo), data.titulo, data.descripcion);

        const habilidadExistente = await HabilidadModel.findOne({ codigo: borrador.codigo });

        if (habilidadExistente) {
            throw new ConflictError("La habilidad ya existe", { habilidadExistente: aDominio(habilidadExistente) });
        }

        const nuevaHabilidadDoc = await HabilidadModel.create({
            codigo: borrador.codigo,
            titulo: borrador.titulo,
            descripcion: borrador.descripcion
        });

        return aDominio(nuevaHabilidadDoc);
    }

    static async listar() {
        const habilidadesDocs = await HabilidadModel.find();

        return habilidadesDocs.map(aDominio);
    }

    // las habilidades se referencian siempre por su código
    static async validarExistentes(codigos) {
        const existentes = await HabilidadModel.find({ codigo: { $in: codigos } });
        const codigosExistentes = existentes.map((habilidad) => habilidad.codigo);
        const inexistentes = codigos.filter((codigo) => !codigosExistentes.includes(codigo));

        if (inexistentes.length > 0) {
            throw new DomainError("Hay habilidades que no están dadas de alta", { habilidadesInexistentes: inexistentes });
        }
    }
}

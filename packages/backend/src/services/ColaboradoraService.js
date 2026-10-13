import { ColaboradoraModel, HabilidadModel } from "../models/indexModel.js";
import { Colaboradora } from "../domain/Colaboradora/Colaboradora.js";
import { MedioContacto } from "../domain/Colaboradora/MedioContacto.js";
import { DomainError, NotFoundError } from "../domain/errores.js";

// arma la colaboradora de dominio a partir del documento de Mongo
const aDominio = (doc) =>
    new Colaboradora(
        doc._id.toString(),
        doc.nombreFantasia,
        doc.github,
        doc.nombreApellido,
        doc.habilidades,
        doc.pronombres,
        doc.presentacion,
        doc.mediosContacto.map((medio) => new MedioContacto(medio.tipo, medio.valor)),
        doc.aceptaMensajeria
    );

export class ColaboradoraService {
    static async crearColaboradora(data) {
        await this.cumpleHabilidades(data.habilidades);

        const nuevaColaboradoraDoc = await ColaboradoraModel.create({
            nombreFantasia: data.nombreFantasia,
            github: data.github,
            nombreApellido: data.nombreApellido,
            habilidades: data.habilidades,
            pronombres: data.pronombres,
            presentacion: data.presentacion
        });

        return aDominio(nuevaColaboradoraDoc);
    }

    static async listar() {
        const colaboradorasDocs = await ColaboradoraModel.find();

        return colaboradorasDocs.map(aDominio);
    }

    static async agregarMedioContacto(idColaboradora, data) {
        const colaboradora = await this.obtenerPorId(idColaboradora);

        colaboradora.agregarMedioContacto(new MedioContacto(data.tipo, data.valor));
        await ColaboradoraModel.findByIdAndUpdate(idColaboradora, {
            mediosContacto: colaboradora.mediosContacto.map((medio) => ({ tipo: medio.tipo, valor: medio.valor }))
        });

        return colaboradora.mediosContacto;
    }

    static async actualizarPreferencias(idColaboradora, data) {
        const colaboradora = await this.obtenerPorId(idColaboradora);

        colaboradora.cambiarAceptaMensajeria(data.aceptaMensajeria);
        await ColaboradoraModel.findByIdAndUpdate(idColaboradora, {
            aceptaMensajeria: colaboradora.aceptaMensajeria
        });

        return colaboradora;
    }

    static async agregarHabilidad(idColaboradora, data) {
        const colaboradora = await this.obtenerPorId(idColaboradora);

        if (!data || typeof data.codigo !== "string" || !data.codigo.trim()) {
            throw new DomainError("El código de la habilidad es obligatorio", { campo: "codigo" });
        }

        const codigoHabilidad = data.codigo.trim();
        const habilidad = await HabilidadModel.findOne({ codigo: codigoHabilidad });
        if (!habilidad) throw new DomainError("La habilidad no existe", { codigo: codigoHabilidad });

        if (!colaboradora.habilidades.includes(codigoHabilidad)) {
            colaboradora.habilidades.push(codigoHabilidad);
            await ColaboradoraModel.findByIdAndUpdate(idColaboradora, {
                habilidades: colaboradora.habilidades
            });
        }

        return colaboradora;
    }

    static async cumpleAlgunaHabilidad(habilidadesBuscadas, idColaboradora) {
        const doc = await ColaboradoraModel.findById(idColaboradora);
        if (!doc) return false;

        return aDominio(doc).cumpleAlgunaHabilidad(habilidadesBuscadas);
    }

    static async obtenerPorId(id) {
        const doc = await ColaboradoraModel.findById(id);
        if (!doc) {
            throw new NotFoundError("Colaboradora no encontrada", { colaboradoraId: id });
        }

        return aDominio(doc);
    }

    static async cumpleHabilidades(Habilidades) {
        const habilidadesExistentes = await HabilidadModel.find({
            codigo: { $in: Habilidades }
        });

        const codigosExistentes = habilidadesExistentes.map(h => h.codigo);
        const inexistentes = Habilidades.filter(CodigoHabilidad => !codigosExistentes.includes(CodigoHabilidad));

        if (inexistentes.length > 0) {
            throw new DomainError("La Colaboradora no cumple con las habilidades dadas de alta", { habilidadesInexistentes: inexistentes });
        }

        return true;
    }
}

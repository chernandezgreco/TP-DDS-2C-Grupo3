import { ColectivoModel } from "../models/indexModel.js";
import { Colectivo } from "../domain/Colectivo/Colectivo.js";
import { NotFoundError } from "../domain/errores.js";
import { esIdValido } from "./ids.js";

const aDominio = (doc) =>
    new Colectivo(doc._id.toString(), doc.nombre, doc.descripcion, doc.ubicacion, doc.tipo);

export class ColectivoService {
    static async crearColectivo(data) {
        // el dominio valida antes de guardar
        const borrador = new Colectivo(null, data.nombre, data.descripcion, data.ubicacion, data.tipo);

        const nuevoColectivoDoc = await ColectivoModel.create({
            nombre: borrador.nombre,
            descripcion: borrador.descripcion,
            ubicacion: borrador.ubicacion,
            tipo: borrador.tipo
        });

        return aDominio(nuevoColectivoDoc);
    }

    static async listar() {
        const colectivosDocs = await ColectivoModel.find();

        return colectivosDocs.map(aDominio);
    }

    static async obtenerPorId(id) {
        const doc = esIdValido(id) ? await ColectivoModel.findById(id) : null;
        if (!doc) {
            throw new NotFoundError("Colectivo no encontrado", { colectivoId: id });
        }

        return aDominio(doc);
    }
}

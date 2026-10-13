import { ColectivoModel } from "../models/indexModel.js";
import { Colectivo } from "../domain/Colectivo/Colectivo.js";

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

        return new Colectivo(
            nuevoColectivoDoc._id.toString(), 
            nuevoColectivoDoc.nombre, 
            nuevoColectivoDoc.descripcion, 
            nuevoColectivoDoc.ubicacion, 
            nuevoColectivoDoc.tipo
        );
    }

    static async listar() {
        
        const colectivosDocs = await ColectivoModel.find();
        
       
        return colectivosDocs.map(doc => 
            new Colectivo(doc._id.toString(), doc.nombre, doc.descripcion, doc.ubicacion, doc.tipo)
        );
    }
}
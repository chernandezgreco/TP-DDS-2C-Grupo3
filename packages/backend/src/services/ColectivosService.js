import { ColectivoModel } from "../models/indexModel.js";
import { Colectivo } from "../domain/Colectivo/Colectivo.js";

export class ColectivoService {
    static async crearColectivo(data) {
    
        const nuevoColectivoDoc = await ColectivoModel.create({
            nombre: data.nombre,
            descripcion: data.descripcion,
            ubicacion: data.ubicacion,
            tipo: data.tipo
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
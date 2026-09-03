import { db } from "../data/db.js";
import { Colaboradora } from "../domain/Colaboradora/Colaboradora.js";
import { v4 as uuidv4 } from "uuid";

export class ColaboradoraService {
    static crearColaboradora(data) {
        const nueva = new Colaboradora(uuidv4(), data.nombreFantasia, data.github, data.nombreApellido, data.habilidades, data.pronombres, data.presentacion);
        db.colaboradoras.push(nueva);
        return nueva;
    }
    static listar() { return db.colaboradoras; }
}
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

        static agregarHabilidad(idColaboradora,data) {
    const colaboradora = db.colaboradores.find(c => c.id === idColaboradora);
    const habilidad = db.habilidades.find(p => p.codigo === data.codigo);
        if (!colaboradora) throw new Error("Colaboradora no encontrada");
            if (!habilidad) {
                HabilidadService.crearHabilidad(data)
        }
    const yaLaTiene = colaboradora.habilidades.some(h => h.id === habilidad.id);
        if (yaLaTiene) throw new Error("La colaboradora ya tiene esta habilidad");
    colaboradora.habilidades.push(data)    

    }

    static cumpleAlgunaHabilidad(habilidadesBuscadas, idColaboradora) {
    const colaboradora = db.colaboradores.find(c => c.id === idColaboradora);
        if (!colaboradora) 
            return false; 
        return colaboradora.habilidades.some(h => habilidadesBuscadas.some(hb => hb.codigo === h.codigo)
    );
    }
}

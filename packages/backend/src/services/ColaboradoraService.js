import { db } from "../data/db.js";
import { Colaboradora } from "../domain/Colaboradora/Colaboradora.js";
import { v4 as uuidv4 } from "uuid";

export class ColaboradoraService {
    static crearColaboradora(data) {
        if (!data || typeof data !== "object") {
            throw new Error("Los datos de la colaboradora son obligatorios");
        }
        if (typeof data.nombreFantasia !== "string" || !data.nombreFantasia.trim()) {
            throw new Error("El nombre de fantasía es obligatorio");
        }
        if (typeof data.github !== "string" || !data.github.trim()) {
            throw new Error("La cuenta de GitHub o GitLab es obligatoria");
        }

        const nueva = new Colaboradora(uuidv4(), data.nombreFantasia, data.github, data.nombreApellido, data.habilidades, data.pronombres, data.presentacion);
        db.colaboradoras.push(nueva);
        return nueva;
    }
    static listar() { return db.colaboradoras; }

    static agregarHabilidad(idColaboradora,data) {
    const colaboradora = db.colaboradoras.find(c => c.id === idColaboradora);
    const habilidad = db.habilidades.find(p => p.codigo === data.codigo);
        if (!colaboradora) throw new Error("Colaboradora no encontrada");
            
    const yaLaTiene = colaboradora.habilidades.some(h => h.id === habilidad.id);
        if (yaLaTiene) throw new Error("La colaboradora ya tiene esta habilidad");
    colaboradora.habilidades.push(data)    

    }

    static cumpleAlgunaHabilidad(habilidadesBuscadas, idColaboradora) {
    const colaboradora = db.colaboradoras.find(c => c.id === idColaboradora);
        if (!colaboradora) 
            return false; 
        return colaboradora.habilidades.some(h => habilidadesBuscadas.some(hb => hb.codigo === h.codigo)
    );
    }

    static obtenerPorId(id) {
    const colaboradora = db.colaboradoras.find(c => c.id === id);
    if (!colaboradora) {
        throw new Error("Colaboradora no encontrada");
       }
    return colaboradora;
    }

    static cumpleHabilidades(Habilidades){
        if (!Array.isArray(Habilidades) || Habilidades.length === 0) {
            throw new Error("La colaboradora debe tener al menos una habilidad");
        }

        const habilidades = Habilidades.every(CodigoHabilidad => db.habilidades.find(habilidad=> habilidad.codigo === CodigoHabilidad))
        if(!habilidades){
             throw new Error("La Colaboradora no cumple con las habilidades dadas de alta");
        }
        return habilidades;
    }
}

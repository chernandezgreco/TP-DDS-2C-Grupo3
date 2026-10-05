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

        this.cumpleHabilidades(data.habilidades);

        const nueva = new Colaboradora(uuidv4(), data.nombreFantasia, data.github, data.nombreApellido, data.habilidades, data.pronombres, data.presentacion);
        db.colaboradoras.push(nueva);
        return nueva;
    }
    static listar() { return db.colaboradoras; }

    static agregarHabilidad(idColaboradora,data) {
        const colaboradora = db.colaboradoras.find(c => c.id === idColaboradora);
        if (!colaboradora) throw new Error("Colaboradora no encontrada");

        if (!data || typeof data.codigo !== "string" || !data.codigo.trim()) {
            throw new Error("El código de la habilidad es obligatorio");
        }

        const habilidad = db.habilidades.find(h => h.codigo === data.codigo.trim());
        if (!habilidad) throw new Error("La habilidad no existe");

        colaboradora.agregarHabilidad(habilidad.codigo);
        return colaboradora;
    }

    static cumpleAlgunaHabilidad(habilidadesBuscadas, idColaboradora) {
        const colaboradora = db.colaboradoras.find(c => c.id === idColaboradora);
        if (!colaboradora) return false;

        return colaboradora.cumpleAlgunaHabilidad(habilidadesBuscadas);
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

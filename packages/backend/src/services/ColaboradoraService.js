import { db } from "../data/db.js";
import { Colaboradora } from "../domain/Colaboradora/Colaboradora.js";
import { DomainError, NotFoundError } from "../domain/errores.js";
import { v4 as uuidv4 } from "uuid";

export class ColaboradoraService {
    static crearColaboradora(data) {
        const nueva = new Colaboradora(uuidv4(), data.nombreFantasia, data.github, data.nombreApellido, data.habilidades, data.pronombres, data.presentacion);

        this.cumpleHabilidades(nueva.habilidades);

        db.colaboradoras.push(nueva);
        return nueva;
    }
    static listar() { return db.colaboradoras; }

    static agregarHabilidad(idColaboradora,data) {
        const colaboradora = this.obtenerPorId(idColaboradora);

        if (!data || typeof data.codigo !== "string" || !data.codigo.trim()) {
            throw new DomainError("El código de la habilidad es obligatorio", { campo: "codigo" });
        }

        const habilidad = db.habilidades.find(h => h.codigo === data.codigo.trim());
        if (!habilidad) throw new DomainError("La habilidad no existe", { codigo: data.codigo });

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
        throw new NotFoundError("Colaboradora no encontrada", { colaboradoraId: id });
       }
    return colaboradora;
    }

    static cumpleHabilidades(Habilidades){
        const inexistentes = Habilidades.filter(CodigoHabilidad => !db.habilidades.some(habilidad => habilidad.codigo === CodigoHabilidad));
        if (inexistentes.length > 0) {
             throw new DomainError("La Colaboradora no cumple con las habilidades dadas de alta", { habilidadesInexistentes: inexistentes });
        }
        return true;
    }
}

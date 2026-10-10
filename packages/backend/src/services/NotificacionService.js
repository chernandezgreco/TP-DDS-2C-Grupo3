import { db } from "../data/db.js";
import { Notificacion } from "../domain/Notificacion/Notificacion.js";
import { TipoMedioContacto } from "../domain/Colaboradora/TipoMedioContacto.js";
import { ConflictError, DomainError, NotFoundError } from "../domain/errores.js";
import { ColaboradoraService } from "./ColaboradoraService.js";
import { ProyectoService } from "./ProyectoService.js";
import { EnviadorEmail } from "./enviadores/EnviadorEmail.js";
import { EnviadorWhatsapp } from "./enviadores/EnviadorWhatsapp.js";
import { EnviadorSms } from "./enviadores/EnviadorSms.js";
import { v4 as uuidv4 } from "uuid";

// un enviador por tipo de medio, todos con el mismo metodo enviar()
const ENVIADORES = {
    [TipoMedioContacto.EMAIL]: new EnviadorEmail(),
    [TipoMedioContacto.WHATSAPP]: new EnviadorWhatsapp(),
    [TipoMedioContacto.SMS]: new EnviadorSms(),
};

export class NotificacionService {
    static crear(data) {
        const colaboradora = ColaboradoraService.obtenerPorId(data.colaboradoraId);
        const colectivo = db.colectivos.find((c) => c.id === data.colectivoId);
        if (!colectivo) {
            throw new NotFoundError("Colectivo no encontrado", { colectivoId: data.colectivoId });
        }
        const proyecto = ProyectoService.obtenerPorId(data.proyectoId);
        if (proyecto.colectivoId !== colectivo.id) {
            throw new DomainError("El proyecto no pertenece a este colectivo", { proyectoId: proyecto.id, colectivoId: colectivo.id });
        }
        if (!colaboradora.puedeSerContactada()) {
            throw new ConflictError("La colaboradora no acepta mensajes internos", { colaboradoraId: colaboradora.id });
        }

        const notificacion = new Notificacion(uuidv4(), colaboradora.id, colectivo.id, proyecto.id, data.texto);
        db.notificaciones.push(notificacion);

        colaboradora.mediosContacto.forEach((medio) => ENVIADORES[medio.tipo].enviar(medio, notificacion));
        const mediosUsados = colaboradora.mediosContacto.map((medio) => medio.tipo);

        return { notificacion, mediosUsados };
    }

    static listarDeColaboradora(colaboradoraId) {
        const colaboradora = ColaboradoraService.obtenerPorId(colaboradoraId);
        return db.notificaciones.filter((n) => n.colaboradoraId === colaboradora.id);
    }
}

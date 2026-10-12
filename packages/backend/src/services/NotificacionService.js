import { Notificacion } from "../domain/Notificacion/Notificacion.js";
import { TipoMedioContacto } from "../domain/Colaboradora/TipoMedioContacto.js";
import { ConflictError, DomainError, NotFoundError } from "../domain/errores.js";
import { ColectivoModel, NotificacionModel } from "../models/indexModel.js";
import { ColaboradoraService } from "./ColaboradoraService.js";
import { ProyectoService } from "./ProyectoService.js";
import { EnviadorEmail } from "./enviadores/EnviadorEmail.js";
import { EnviadorWhatsapp } from "./enviadores/EnviadorWhatsapp.js";
import { EnviadorSms } from "./enviadores/EnviadorSms.js";

// un enviador por tipo de medio, todos con el mismo metodo enviar()
const ENVIADORES = {
    [TipoMedioContacto.EMAIL]: new EnviadorEmail(),
    [TipoMedioContacto.WHATSAPP]: new EnviadorWhatsapp(),
    [TipoMedioContacto.SMS]: new EnviadorSms(),
};

const aDominio = (doc) =>
    new Notificacion(doc._id.toString(), doc.colaboradoraId, doc.colectivoId, doc.proyectoId, doc.texto, doc.fecha);

export class NotificacionService {
    static async crear(data) {
        const colaboradora = await ColaboradoraService.obtenerPorId(data.colaboradoraId);
        const colectivo = await ColectivoModel.findById(data.colectivoId);
        if (!colectivo) {
            throw new NotFoundError("Colectivo no encontrado", { colectivoId: data.colectivoId });
        }
        const proyecto = await ProyectoService.obtenerPorId(data.proyectoId);
        if (proyecto.colectivoId !== colectivo.id) {
            throw new DomainError("El proyecto no pertenece a este colectivo", { proyectoId: proyecto.id, colectivoId: colectivo.id });
        }
        if (!colaboradora.puedeSerContactada()) {
            throw new ConflictError("La colaboradora no acepta mensajes internos", { colaboradoraId: colaboradora.id });
        }

        // el dominio valida el texto antes de guardar
        const borrador = new Notificacion(null, colaboradora.id, colectivo.id, proyecto.id, data.texto);
        const doc = await NotificacionModel.create({
            colaboradoraId: borrador.colaboradoraId,
            colectivoId: borrador.colectivoId,
            proyectoId: borrador.proyectoId,
            texto: borrador.texto,
            fecha: borrador.fecha,
        });
        const notificacion = aDominio(doc);

        colaboradora.mediosContacto.forEach((medio) => ENVIADORES[medio.tipo].enviar(medio, notificacion));
        const mediosUsados = colaboradora.mediosContacto.map((medio) => medio.tipo);

        return { notificacion, mediosUsados };
    }

    static async listarDeColaboradora(colaboradoraId) {
        const colaboradora = await ColaboradoraService.obtenerPorId(colaboradoraId);
        const docs = await NotificacionModel.find({ colaboradoraId: colaboradora.id });
        return docs.map(aDominio);
    }
}

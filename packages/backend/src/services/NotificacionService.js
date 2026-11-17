import { Notificacion } from "../domain/Notificacion/Notificacion.js";
import { TipoMedioContacto } from "../domain/Colaboradora/TipoMedioContacto.js";
import { ConflictError, DomainError } from "../domain/errores.js";
import { NotificacionModel } from "../models/indexModel.js";
import { ColaboradoraService } from "./ColaboradoraService.js";
import { ColectivoService } from "./ColectivosService.js";
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
        const colectivo = await ColectivoService.obtenerPorId(data.colectivoId);
        const proyecto = await ProyectoService.obtenerPorId(data.proyectoId);
        if (!proyecto.perteneceA(colectivo.id)) {
            throw new DomainError("El proyecto no pertenece a este colectivo", { proyectoId: proyecto.id, colectivoId: colectivo.id });
        }
        // solo se invita a quien tiene alguna habilidad requerida por un perfil del proyecto
        if (!proyecto.esCompatibleCon(colaboradora)) {
            throw new DomainError("La colaboradora no tiene ninguna habilidad requerida por los perfiles del proyecto", {
                colaboradoraId: colaboradora.id,
                proyectoId: proyecto.id,
            });
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

        // un medio que falla no tumba la notificacion interna, que ya quedo guardada
        const resultados = await Promise.allSettled(
            colaboradora.mediosContacto.map(async (medio) => ENVIADORES[medio.tipo].enviar(medio, notificacion)),
        );
        const mediosUsados = colaboradora.mediosContacto
            .filter((medio, indice) => resultados[indice].status === "fulfilled")
            .map((medio) => medio.tipo);
        const mediosFallidos = colaboradora.mediosContacto
            .filter((medio, indice) => resultados[indice].status === "rejected")
            .map((medio) => medio.tipo);
        // se registra el motivo (codigo o mensaje del error) para poder diagnosticarlo en los logs
        resultados.forEach(
            (resultado, indice) =>
                resultado.status === "rejected" &&
                console.error(
                    `No se pudo enviar la notificación por ${colaboradora.mediosContacto[indice].tipo}: ${resultado.reason?.code ?? resultado.reason?.message}`,
                ),
        );

        return { notificacion, mediosUsados, mediosFallidos };
    }

    static async listarDeColaboradora(colaboradoraId) {
        const colaboradora = await ColaboradoraService.obtenerPorId(colaboradoraId);
        const docs = await NotificacionModel.find({ colaboradoraId: colaboradora.id });
        return docs.map(aDominio);
    }
}

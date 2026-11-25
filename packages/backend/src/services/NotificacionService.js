import { Notificacion } from "../domain/Notificacion/Notificacion.js";
import { TipoMedioContacto } from "../domain/Colaboradora/TipoMedioContacto.js";
import { ConflictError, DomainError } from "../domain/errores.js";
import { ColaboradoraModel, NotificacionModel } from "../models/indexModel.js";
import { ColaboradoraService } from "./ColaboradoraService.js";
import { ColectivoService } from "./ColectivosService.js";
import { ProyectoService } from "./ProyectoService.js";
import { EnviadorEmail } from "./enviadores/EnviadorEmail.js";
import { EnviadorWhatsapp } from "./enviadores/EnviadorWhatsapp.js";
import { EnviadorSms } from "./enviadores/EnviadorSms.js";
import { EnviadorTelegram } from "./enviadores/EnviadorTelegram.js";

// un enviador por tipo de medio, todos con el mismo metodo enviar()
const ENVIADORES = {
    [TipoMedioContacto.EMAIL]: new EnviadorEmail(),
    [TipoMedioContacto.WHATSAPP]: new EnviadorWhatsapp(),
    [TipoMedioContacto.SMS]: new EnviadorSms(),
    [TipoMedioContacto.TELEGRAM]: new EnviadorTelegram(),
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
        const mediosSimulados = colaboradora.mediosContacto
            .filter((medio, indice) =>
                resultados[indice].status === "fulfilled" && resultados[indice].value?.simulado,
            )
            .map((medio) => medio.tipo);
        const mediosFallidos = colaboradora.mediosContacto
            .filter((medio, indice) => resultados[indice].status === "rejected")
            .map((medio) => medio.tipo);
        // No se registran texto, teléfono, email ni mensajes de proveedores en los logs.
        resultados.forEach(
            (resultado, indice) =>
                resultado.status === "rejected" &&
                console.error(
                    `No se pudo enviar la notificación por ${colaboradora.mediosContacto[indice].tipo}: ${resultado.reason?.code ?? "FALLO_DE_ENVIO"}`,
                ),
        );

        return { notificacion, mediosUsados, mediosSimulados, mediosFallidos };
    }

    static async listarDeColaboradora(colaboradoraId) {
        const colaboradora = await ColaboradoraService.obtenerPorId(colaboradoraId);
        const docs = await NotificacionModel.find({ colaboradoraId: colaboradora.id }).sort({ fecha: -1 });
        return docs.map(aDominio);
    }

    // sólo el número: el front lo consulta seguido para el contador de no leídos
    static async contarNoLeidas(colaboradoraId) {
        const colaboradora = await ColaboradoraService.obtenerPorId(colaboradoraId);
        const filtro = { colaboradoraId: colaboradora.id };
        if (colaboradora.mensajesVistosHasta) {
            filtro.fecha = { $gt: colaboradora.mensajesVistosHasta };
        }
        return NotificacionModel.countDocuments(filtro);
    }

    // hasta = fecha del mensaje más nuevo que el front mostró, no la hora actual:
    // así un mensaje que llega mientras la bandeja está abierta no queda marcado sin haberse visto
    static async marcarVistas(colaboradoraId, hasta) {
        const colaboradora = await ColaboradoraService.obtenerPorId(colaboradoraId);
        colaboradora.marcarMensajesVistos(hasta);
        // $max deja la marca sólo si avanza, aunque lleguen dos avisos a la vez
        await ColaboradoraModel.updateOne(
            { _id: colaboradora.id },
            { $max: { mensajesVistosHasta: colaboradora.mensajesVistosHasta } },
        );
        return { mensajesVistosHasta: colaboradora.mensajesVistosHasta };
    }

    // migración de arranque: las colaboradoras anteriores a la marca empiezan con todo leído.
    // Es idempotente: sólo toca documentos que todavía no tienen el campo.
    static async inicializarMensajesVistos(ahora = new Date()) {
        const { modifiedCount } = await ColaboradoraModel.updateMany(
            { mensajesVistosHasta: { $exists: false } },
            { $set: { mensajesVistosHasta: ahora } },
        );
        return modifiedCount;
    }
}

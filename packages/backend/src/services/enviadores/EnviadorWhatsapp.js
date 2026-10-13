export class EnviadorWhatsapp {
    enviar(medio, notificacion) {
        console.log(`[WHATSAPP] a ${medio.valor}: ${notificacion.texto}`);
    }
}

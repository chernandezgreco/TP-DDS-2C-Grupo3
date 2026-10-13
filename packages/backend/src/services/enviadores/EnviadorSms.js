export class EnviadorSms {
    enviar(medio, notificacion) {
        console.log(`[SMS] a ${medio.valor}: ${notificacion.texto}`);
    }
}

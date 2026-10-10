export class EnviadorEmail {
    enviar(medio, notificacion) {
        console.log(`[EMAIL] a ${medio.valor}: ${notificacion.texto}`);
    }
}

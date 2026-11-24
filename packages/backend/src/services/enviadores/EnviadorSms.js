import { enviarConTwilio } from "./TwilioClient.js";

export class EnviadorSms {
  enviar(medio, notificacion) {
    return enviarConTwilio("SMS", medio, notificacion);
  }
}

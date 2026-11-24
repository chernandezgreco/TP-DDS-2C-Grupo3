import { enviarConTwilio } from "./TwilioClient.js";

export class EnviadorWhatsapp {
  enviar(medio, notificacion) {
    return enviarConTwilio("WHATSAPP", medio, notificacion);
  }
}

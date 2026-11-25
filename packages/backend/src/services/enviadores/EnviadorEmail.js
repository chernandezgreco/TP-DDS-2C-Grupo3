const ASUNTO = "Nueva notificación de Código a Voluntad";
const URL_SENDGRID = "https://api.sendgrid.com/v3/mail/send";
const TIEMPO_MAXIMO_MS = 8000;

const errorEmail = (mensaje, code) => Object.assign(new Error(mensaje), { code });

// Strategy del medio EMAIL: mismo metodo enviar() que SMS y WhatsApp
// va por la API HTTPS de SendGrid (Twilio) y no por SMTP, porque Render gratis bloquea esos puertos
export class EnviadorEmail {
    // en los tests se le pasa un fetch falso
    constructor(hacerPedido = fetch) {
        this.hacerPedido = hacerPedido;
    }

    async enviar(medio, notificacion) {
        const { SENDGRID_API_KEY, EMAIL_FROM } = process.env;
        if (!SENDGRID_API_KEY) {
            if (process.env.NODE_ENV === "production") {
                throw errorEmail("El envío de email no está configurado en producción.", "EMAIL_CONFIG");
            }
            console.info("[EMAIL SIMULADO] envío real desactivado.");
            return { simulado: true };
        }
        if (!EMAIL_FROM) {
            throw errorEmail("Falta configurar EMAIL_FROM para enviar correo.", "EMAIL_CONFIG");
        }

        let respuesta;
        try {
            respuesta = await this.hacerPedido(URL_SENDGRID, {
                method: "POST",
                headers: { Authorization: `Bearer ${SENDGRID_API_KEY}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                    personalizations: [{ to: [{ email: medio.valor }] }],
                    from: { email: EMAIL_FROM, name: "Código a Voluntad" },
                    subject: ASUNTO,
                    // solo texto plano: el contenido nunca se interpreta como HTML
                    content: [{ type: "text/plain", value: notificacion.texto }],
                }),
                signal: AbortSignal.timeout(TIEMPO_MAXIMO_MS),
            });
        } catch (causa) {
            const code = causa?.name === "TimeoutError" ? "EMAIL_TIMEOUT" : "EMAIL_RED";
            throw errorEmail("No se pudo conectar con SendGrid.", code);
        }
        // SendGrid contesta 202 cuando acepta el mail
        if (!respuesta.ok) {
            throw errorEmail(`SendGrid rechazó el envío (HTTP ${respuesta.status}).`, `EMAIL_HTTP_${respuesta.status}`);
        }
        return { simulado: false };
    }
}

const URL_TELEGRAM = "https://api.telegram.org";
const TIEMPO_MAXIMO_MS = 8000;

const errorTelegram = (mensaje, code) => Object.assign(new Error(mensaje), { code });

// Strategy del medio TELEGRAM: mismo metodo enviar() que los otros, manda con la API HTTPS del bot
export class EnviadorTelegram {
    // en los tests se le pasa un fetch falso
    constructor(hacerPedido = fetch) {
        this.hacerPedido = hacerPedido;
    }

    async enviar(medio, notificacion) {
        const { TELEGRAM_BOT_TOKEN } = process.env;
        if (!TELEGRAM_BOT_TOKEN) {
            if (process.env.NODE_ENV === "production") {
                throw errorTelegram("El envío por Telegram no está configurado en producción.", "TELEGRAM_CONFIG");
            }
            console.info("[TELEGRAM SIMULADO] envío real desactivado.");
            return { simulado: true };
        }

        let respuesta;
        try {
            respuesta = await this.hacerPedido(`${URL_TELEGRAM}/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                // sin parse_mode: el texto va tal cual, Telegram no lo interpreta como HTML
                body: JSON.stringify({
                    chat_id: medio.valor,
                    text: `Nueva notificación de Código a Voluntad:\n\n${notificacion.texto}`,
                }),
                signal: AbortSignal.timeout(TIEMPO_MAXIMO_MS),
            });
        } catch (causa) {
            const code = causa?.name === "TimeoutError" ? "TELEGRAM_TIMEOUT" : "TELEGRAM_RED";
            throw errorTelegram("No se pudo conectar con Telegram.", code);
        }
        // un 403 suele ser que la persona nunca le escribio /start al bot
        if (!respuesta.ok) {
            throw errorTelegram(`Telegram rechazó el envío (HTTP ${respuesta.status}).`, `TELEGRAM_HTTP_${respuesta.status}`);
        }
        return { simulado: false };
    }
}

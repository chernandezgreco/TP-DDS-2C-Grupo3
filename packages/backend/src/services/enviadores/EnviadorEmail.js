import nodemailer from "nodemailer";

const ASUNTO = "Nueva notificación de Código a Voluntad";
const TIEMPO_MAXIMO_MS = 8000;

// arma el transporte SMTP con las variables de entorno; sin SMTP_HOST devuelve null (envio simulado)
const crearTransporteDesdeEntorno = () => {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
    if (!SMTP_HOST) {
        return null;
    }
    const puerto = Number(SMTP_PORT) || 587;
    return nodemailer.createTransport({
        host: SMTP_HOST,
        port: puerto,
        secure: puerto === 465,
        auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
        // topes cortos: si el hosting bloquea el puerto SMTP, el envio falla rapido
        // en vez de dejar colgado el pedido (por defecto nodemailer espera 2 minutos)
        connectionTimeout: TIEMPO_MAXIMO_MS,
        greetingTimeout: TIEMPO_MAXIMO_MS,
        socketTimeout: TIEMPO_MAXIMO_MS,
    });
};

// Strategy del medio EMAIL: mismo metodo enviar() que SMS y WhatsApp, pero este manda el mail de verdad
export class EnviadorEmail {
    // el transporte se puede inyectar (tests); si no, se crea la primera vez que se envia
    constructor(transporte) {
        this.transporte = transporte;
        this.transporteResuelto = transporte !== undefined;
    }

    obtenerTransporte() {
        if (!this.transporteResuelto) {
            this.transporte = crearTransporteDesdeEntorno();
            this.transporteResuelto = true;
        }
        return this.transporte;
    }

    async enviar(medio, notificacion) {
        const transporte = this.obtenerTransporte();
        if (!transporte) {
            if (process.env.NODE_ENV === "production") {
                const error = new Error("El envío de email no está configurado en producción.");
                error.code = "SMTP_CONFIG";
                throw error;
            }
            console.info("[EMAIL SIMULADO] envío real desactivado.");
            return { simulado: true };
        }
        const remitente = process.env.EMAIL_FROM || process.env.SMTP_USER;
        if (!remitente) {
            const error = new Error("Falta configurar EMAIL_FROM o SMTP_USER para enviar correo.");
            error.code = "SMTP_CONFIG";
            throw error;
        }
        // solo "text": el contenido nunca se interpreta como HTML
        await transporte.sendMail({
            from: remitente,
            to: medio.valor,
            subject: ASUNTO,
            text: notificacion.texto,
        });
        return { simulado: false };
    }
}

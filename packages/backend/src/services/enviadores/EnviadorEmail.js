import nodemailer from "nodemailer";

const ASUNTO = "Nueva notificación de Código a Voluntad";

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
            console.log(`[EMAIL] a ${medio.valor}: ${notificacion.texto}`);
            return;
        }
        // solo "text": el contenido nunca se interpreta como HTML
        await transporte.sendMail({
            from: process.env.EMAIL_FROM || process.env.SMTP_USER,
            to: medio.valor,
            subject: ASUNTO,
            text: notificacion.texto,
        });
    }
}

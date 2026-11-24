const TIEMPO_LIMITE_MS = 8000;
const TELEFONO_E164 = /^\+\d{8,15}$/;

const errorConfiguracion = (mensaje) => {
  const error = new Error(mensaje);
  error.code = "TWILIO_CONFIG";
  return error;
};

const enmascarar = (telefono) =>
  telefono.length > 4 ? `***${telefono.slice(-4)}` : "destinatario";

function cargarConfiguracion(tipo) {
  const { TWILIO_SEND_REAL, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = process.env;
  if (TWILIO_SEND_REAL !== "true") {
    if (process.env.NODE_ENV === "production") {
      throw errorConfiguracion(
        "Los envíos SMS/WhatsApp reales no están habilitados en producción.",
      );
    }
    return null;
  }

  const from =
    tipo === "WHATSAPP"
      ? process.env.TWILIO_WHATSAPP_FROM
      : process.env.TWILIO_SMS_FROM;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !from) {
    throw errorConfiguracion(
      `Falta configurar TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN o el remitente de ${tipo}.`,
    );
  }
  return { accountSid: TWILIO_ACCOUNT_SID, authToken: TWILIO_AUTH_TOKEN, from };
}

function direccionWhatsApp(valor) {
  const telefono = valor.startsWith("whatsapp:")
    ? valor.slice("whatsapp:".length)
    : valor;
  if (!TELEFONO_E164.test(telefono)) {
    throw errorConfiguracion(
      "WhatsApp requiere teléfonos en formato internacional E.164, por ejemplo +5491112345678.",
    );
  }
  return `whatsapp:${telefono}`;
}

function direccionSms(valor) {
  if (!TELEFONO_E164.test(valor)) {
    throw errorConfiguracion(
      "SMS requiere un teléfono en formato internacional E.164, por ejemplo +5491112345678.",
    );
  }
  return valor;
}

export async function enviarConTwilio(tipo, medio, notificacion) {
  const config = cargarConfiguracion(tipo);
  if (!config) {
    console.info(
      `[${tipo} SIMULADO] envío real desactivado; destinatario ${enmascarar(medio.valor)}.`,
    );
    return { simulado: true };
  }

  const destino =
    tipo === "WHATSAPP"
      ? direccionWhatsApp(medio.valor)
      : direccionSms(medio.valor);
  const remitente =
    tipo === "WHATSAPP"
      ? direccionWhatsApp(config.from)
      : direccionSms(config.from);
  const url = `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(config.accountSid)}/Messages.json`;
  const auth = Buffer.from(`${config.accountSid}:${config.authToken}`).toString("base64");

  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: destino, From: remitente, Body: notificacion.texto }),
      signal: AbortSignal.timeout(TIEMPO_LIMITE_MS),
    });
  } catch (cause) {
    const error = new Error("No se pudo conectar con Twilio.");
    error.code = cause?.name === "TimeoutError" ? "TWILIO_TIMEOUT" : "TWILIO_NETWORK";
    throw error;
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(
      payload.code
        ? `Twilio rechazó el envío (código ${payload.code}).`
        : `Twilio rechazó el envío (HTTP ${response.status}).`,
    );
    error.code = payload.code ? `TWILIO_${payload.code}` : `TWILIO_HTTP_${response.status}`;
    throw error;
  }

  return { simulado: false, messageSid: payload.sid || null };
}

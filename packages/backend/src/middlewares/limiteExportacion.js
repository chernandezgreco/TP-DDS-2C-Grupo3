import { rateLimit } from "express-rate-limit";

// Exportar recorre varias colecciones: se limita por cuenta, además del límite público por IP
export function crearLimiteExportacion({
  limit = Number(process.env.EXPORT_RATE_LIMIT || 5),
  windowMs = Number(process.env.EXPORT_RATE_WINDOW_MS || 900000),
} = {}) {
  if (
    !Number.isInteger(limit) ||
    limit < 1 ||
    !Number.isInteger(windowMs) ||
    windowMs < 1
  )
    throw new Error("Configuración de límite de exportación inválida");
  return rateLimit({
    limit,
    windowMs,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    // sólo cuentan las descargas exitosas: un error del servidor no deja a la cuenta sin cuota
    skipFailedRequests: true,
    // va después de requiereSesion: siempre hay cuenta
    keyGenerator: (req) => `cuenta:${req.cuenta._id}`,
    message: {
      error:
        "Alcanzaste el límite de descargas de tus datos. Esperá unos minutos y volvé a intentar.",
    },
  });
}

import { rateLimit } from "express-rate-limit";
export function crearLimitePublico({
  limit = Number(process.env.PUBLIC_RATE_LIMIT || 120),
  windowMs = Number(process.env.PUBLIC_RATE_WINDOW_MS || 60000),
} = {}) {
  if (
    !Number.isInteger(limit) ||
    limit < 1 ||
    !Number.isInteger(windowMs) ||
    windowMs < 1
  )
    throw new Error("Configuración de límite de tasa inválida");
  return rateLimit({
    limit,
    windowMs,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    skip: (req) => req.method === "OPTIONS",
    message: {
      error: "Demasiadas solicitudes. Esperá antes de volver a intentar.",
    },
  });
}

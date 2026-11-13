import { timingSafeEqual } from "node:crypto";
// Credencial sólo de servidor. No se deriva de un id enviado por el cliente.
export function requiereAdministracion(req, res, next) {
  const expected = process.env.ADMIN_API_KEY;
  if (!expected || expected.length < 32)
    return res.status(503).json({
      error:
        "Administración no configurada: se requiere ADMIN_API_KEY de al menos 32 caracteres.",
    });
  const supplied =
    /^Bearer (.+)$/.exec(req.get("Authorization") || "")?.[1] || "";
  const a = Buffer.from(supplied),
    b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b))
    return res
      .status(401)
      .json({ error: "Credencial administrativa inválida." });
  next();
}

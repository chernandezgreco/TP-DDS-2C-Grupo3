import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { promisify } from "node:util";
import { CuentaModel, SesionModel } from "../models/AuthModel.js";
import { ColectivoModel, ColaboradoraModel } from "../models/indexModel.js";
import { ColectivoService } from "./ColectivosService.js";
import { ColaboradoraService } from "./ColaboradoraService.js";
import { ConflictError } from "../domain/errores.js";
const scrypt = promisify(scryptCallback);
const digest = (token) => createHash("sha256").update(token).digest("hex");
export class AuthService {
  static async registrar({ email, password, tipo, perfil }) {
    if (await CuentaModel.exists({ email }))
      throw new ConflictError("Ese correo ya está registrado.");
    const salt = randomBytes(16).toString("hex");
    const passwordHash = (await scrypt(password, salt, 64)).toString("hex");
    const persona =
      tipo === "colectivos"
        ? await ColectivoService.crearColectivo(perfil)
        : await ColaboradoraService.crearColaboradora(perfil);
    try {
      return await CuentaModel.create({
        email,
        passwordHash,
        salt,
        tipo,
        perfilId: persona.id,
      });
    } catch (error) {
      await (
        tipo === "colectivos" ? ColectivoModel : ColaboradoraModel
      ).deleteOne({ _id: persona.id });
      if (error.code === 11000)
        throw new ConflictError("Ese correo ya está registrado.");
      throw error;
    }
  }
  static async ingresar(email, password) {
    const cuenta = await CuentaModel.findOne({ email }).select(
      "+passwordHash +salt",
    );
    // Calcula también para correos inexistentes; evita un atajo de verificación.
    const actual = await scrypt(
      password,
      cuenta?.salt || "salt-de-comprobacion-inexistente",
      64,
    );
    if (
      !cuenta ||
      !timingSafeEqual(actual, Buffer.from(cuenta.passwordHash, "hex"))
    )
      return null;
    return cuenta;
  }
  static async crearSesion(cuenta) {
    const token = randomBytes(32).toString("hex");
    await SesionModel.create({
      tokenHash: digest(token),
      cuentaId: cuenta._id,
      expira: new Date(Date.now() + 7 * 86400000),
    });
    return token;
  }
  static async resolver(token) {
    if (!/^[a-f\d]{64}$/.test(token || "")) return null;
    const sesion = await SesionModel.findOne({
      tokenHash: digest(token),
      expira: { $gt: new Date() },
    });
    if (!sesion) return null;
    const cuenta = await CuentaModel.findById(sesion.cuentaId);
    if (!cuenta) return null;
    const model =
      cuenta.tipo === "colectivos" ? ColectivoModel : ColaboradoraModel;
    const perfil = await model.findById(cuenta.perfilId);
    if (!perfil || perfil.moderacionTerminos?.suspendido) return null;
    return cuenta;
  }
  static async cerrar(token) {
    if (token) await SesionModel.deleteOne({ tokenHash: digest(token) });
  }
  static async perfil(cuenta) {
    return cuenta.tipo === "colectivos"
      ? ColectivoService.obtenerPorId(cuenta.perfilId)
      : ColaboradoraService.obtenerPorId(cuenta.perfilId);
  }
  static resumen(cuenta) {
    return { id: cuenta.perfilId, type: cuenta.tipo, email: cuenta.email };
  }
}
export const cookieToken = (req) =>
  (req.headers.cookie || "")
    .split(";")
    .map((v) => v.trim())
    .find((v) => v.startsWith("cav_session="))
    ?.slice("cav_session=".length);
export const cookieOpciones = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: 7 * 86400000,
});
export async function resolverSesion(req, res, next) {
  try {
    req.cuenta = await AuthService.resolver(cookieToken(req));
    req.actor = req.cuenta ? AuthService.resumen(req.cuenta) : null;
    next();
  } catch (e) {
    next(e);
  }
}

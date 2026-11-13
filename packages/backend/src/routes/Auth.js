import { Router } from "express";
import { z } from "zod";
import { rateLimit } from "express-rate-limit";
import { validar } from "../middlewares/validar.js";
import {
  AuthService,
  cookieToken,
  cookieOpciones,
} from "../services/AuthService.js";
import { crearColectivoSchema } from "../schemas/ColectivoSchema.js";
import { crearColaboradoraSchema } from "../schemas/ColaboradoraSchema.js";
import { ColaboradoraService } from "../services/ColaboradoraService.js";
import {
  ProyectoModel,
  ColaboracionModel,
  PostulacionModel,
} from "../models/indexModel.js";
const router = Router();
router.use("/auth", (req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});
const credentials = {
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(10).max(128),
};
const limiter = rateLimit({
  windowMs: 900000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Demasiados intentos de acceso. Esperá 15 minutos." },
});
const originGuard = (req, res, next) => {
  const origin = req.get("Origin");
  if (
    origin &&
    !(process.env.ALLOWED_ORIGINS || "http://localhost:3000")
      .split(",")
      .map((x) => x.trim())
      .includes(origin) &&
    origin !== `${req.protocol}://${req.get("host")}`
  )
    return res.status(403).json({ error: "Origen no autorizado." });
  next();
};
router.post(
  "/auth/registro",
  originGuard,
  limiter,
  validar(
    z.discriminatedUnion("tipo", [
      z
        .object({
          ...credentials,
          tipo: z.literal("colectivos"),
          perfil: crearColectivoSchema,
        })
        .strict(),
      z
        .object({
          ...credentials,
          tipo: z.literal("colaboradoras"),
          perfil: crearColaboradoraSchema,
        })
        .strict(),
    ]),
  ),
  async (req, res) => {
    const cuenta = await AuthService.registrar(req.body);
    const token = await AuthService.crearSesion(cuenta);
    res
      .cookie("cav_session", token, cookieOpciones())
      .status(201)
      .json({
        actor: AuthService.resumen(cuenta),
        perfil: await AuthService.perfil(cuenta),
      });
  },
);
router.post(
  "/auth/login",
  originGuard,
  limiter,
  validar(z.object(credentials).strict()),
  async (req, res) => {
    const cuenta = await AuthService.ingresar(
      req.body.email,
      req.body.password,
    );
    if (!cuenta)
      return res
        .status(401)
        .json({ error: "Correo o contraseña incorrectos." });
    const perfil = await AuthService.perfil(cuenta);
    const token = await AuthService.crearSesion(cuenta);
    res
      .cookie("cav_session", token, cookieOpciones())
      .json({ actor: AuthService.resumen(cuenta), perfil });
  },
);
router.get("/auth/sesion", async (req, res) =>
  res.json(
    req.cuenta
      ? { actor: req.actor, perfil: await AuthService.perfil(req.cuenta) }
      : { actor: null },
  ),
);
router.post("/auth/logout", originGuard, async (req, res) => {
  await AuthService.cerrar(cookieToken(req));
  res
    .clearCookie("cav_session", { ...cookieOpciones(), maxAge: undefined })
    .status(204)
    .end();
});
router.get("/mi/postulaciones", async (req, res) => {
  if (!req.actor || req.actor.type !== "colaboradoras")
    return res.status(401).json({ error: "Iniciá sesión como colaboradora." });
  res.json(
    await PostulacionModel.find({ colaboradoraId: req.actor.id }).lean(),
  );
});
router.get("/colaboradoras/:id/contactos", async (req, res) => {
  if (!req.actor)
    return res
      .status(401)
      .json({ error: "Iniciá sesión para consultar contactos." });
  const own =
    req.actor.type === "colaboradoras" && req.actor.id === req.params.id;
  if (!own) {
    if (req.actor.type !== "colectivos")
      return res
        .status(403)
        .json({ error: "No tenés acceso a estos contactos." });
    const proyectos = await ProyectoModel.find({
      colectivoId: req.actor.id,
    }).select("_id");
    const accepted = await ColaboracionModel.exists({
      proyectoId: { $in: proyectos.map((p) => p.id) },
      colaboradoraId: req.params.id,
    });
    if (!accepted)
      return res
        .status(403)
        .json({
          error:
            "Los contactos se comparten únicamente después de aceptar una postulación.",
        });
  }
  const p = await ColaboradoraService.obtenerPorId(req.params.id);
  res.json(p.mediosContacto);
});
export default router;

import { z } from "zod";
import { LinkedInService } from "../services/LinkedInService.js";
import { validar } from "../middlewares/validar.js";

const publicUrl = () => process.env.PUBLIC_APP_URL || "http://localhost:3000";

function requireSession(req, res) {
  if (!req.actor || !req.cuenta) {
    res.status(401).json({ error: "Iniciá sesión para usar la integración con LinkedIn." });
    return false;
  }
  return true;
}

function returnToApp(res, status) {
  const target = new URL(publicUrl());
  target.searchParams.set("linkedin", status);
  target.hash = "espacio";
  res.redirect(target.toString());
}

export const estadoLinkedIn = async (req, res, next) => {
  try {
    if (!requireSession(req, res)) return;
    res.json(await LinkedInService.estado(req.cuenta._id));
  } catch (error) {
    next(error);
  }
};

export const conectarLinkedIn = async (req, res, next) => {
  try {
    if (!requireSession(req, res)) return;
    res.redirect(await LinkedInService.crearUrlAutorizacion(req.cuenta._id));
  } catch (error) {
    next(error);
  }
};

export const callbackLinkedIn = async (req, res) => {
  if (req.query.error || !req.query.code || !req.query.state) {
    returnToApp(res, "error");
    return;
  }
  try {
    await LinkedInService.completarAutorizacion(
      String(req.query.code),
      String(req.query.state),
    );
    returnToApp(res, "conectado");
  } catch {
    returnToApp(res, "error");
  }
};

export const importarPerfilLinkedIn = async (req, res, next) => {
  try {
    if (!requireSession(req, res)) return;
    res.json(await LinkedInService.importarPerfil(req.cuenta._id, req.actor));
  } catch (error) {
    next(error);
  }
};

export const desconectarLinkedIn = async (req, res, next) => {
  try {
    if (!requireSession(req, res)) return;
    await LinkedInService.desconectar(req.cuenta._id);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
};

const publicarLogroSchema = z
  .object({
    proyectoId: z.string().regex(/^[0-9a-fA-F]{24}$/),
    logroId: z.string().trim().min(1),
  })
  .strict();

export const publicarLogroLinkedIn = [
  validar(publicarLogroSchema),
  async (req, res, next) => {
    try {
      if (!requireSession(req, res)) return;
      res.status(201).json(
        await LinkedInService.publicarLogro(req.cuenta._id, req.actor, req.body),
      );
    } catch (error) {
      next(error);
    }
  },
];

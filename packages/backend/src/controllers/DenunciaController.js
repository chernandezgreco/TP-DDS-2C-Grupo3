import { DenunciaService } from "../services/DenunciaService.js";

export const crearDenuncia = async (req, res, next) => {
  try {
    const denuncia = await DenunciaService.crear(req.actor, req.cuenta, req.body);
    res.status(201).json(denuncia);
  } catch (error) {
    next(error);
  }
};

export const listarDenuncias = async (req, res, next) => {
  try {
    res.json(await DenunciaService.listar(req.query.estado));
  } catch (error) {
    next(error);
  }
};

export const actualizarEstadoDenuncia = async (req, res, next) => {
  try {
    res.json(await DenunciaService.actualizarEstado(req.params.id, req.body.estado));
  } catch (error) {
    next(error);
  }
};

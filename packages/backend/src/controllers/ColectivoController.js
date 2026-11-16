import { ColectivoService } from "../services/ColectivosService.js";
import { cookieOpciones } from "../services/AuthService.js";

export class ColectivoController {
  static async actualizar(req, res) {
    res.json(await ColectivoService.actualizar(req.params.id, req.body));
  }

  static async crear(req, res) {
    res.status(201).json(await ColectivoService.crearColectivo(req.body));
  }

  static async listar(req, res) {
    res.json(await ColectivoService.listar());
  }

  static async eliminarCuenta(req, res, next) {
    try {
      await ColectivoService.eliminarCuenta(req.params.id, req.cuenta._id);
      res
        .clearCookie("cav_session", { ...cookieOpciones(), maxAge: undefined })
        .status(204)
        .end();
    } catch (error) {
      next(error);
    }
  }
}

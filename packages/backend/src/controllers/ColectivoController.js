import { ColectivoService } from "../services/ColectivosService.js";

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
}

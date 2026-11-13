import { ProyectoModel } from "../models/indexModel.js";
import { ColaboracionService } from "../services/ColaboracionService.js";

async function visibles(items, actor) {
  const own =
    actor?.type === "colectivos"
      ? (await ProyectoModel.find({ colectivoId: actor.id }).select("_id")).map(
          (p) => p.id,
        )
      : [];
  return items.map((c) => ({
    ...c,
    colaboradoraId:
      c.anonimidad &&
      c.colaboradoraId !== actor?.id &&
      !own.includes(c.proyectoId)
        ? "Anonimo"
        : c.colaboradoraId,
  }));
}
export class ColaboracionController {
  static async listar(req, res) {
    res.json(await visibles(await ColaboracionService.listar(), req.actor));
  }

  static async obtenerPorId(req, res) {
    res.json(
      (
        await visibles(
          [await ColaboracionService.obtenerPorId(req.params.colaboracionId)],
          req.actor,
        )
      )[0],
    );
  }
  static async darDeBaja(req, res, next) {
    try {
      const { colaboracionId } = req.params;
      const resultado = await ColaboracionService.darDeBaja(colaboracionId);
      return res.status(200).json(resultado);
    } catch (error) {
      next(error);
    }
  }
  static async darDeBajaPersonal(req, res, next) {
    try {
      const { proyectoId, colaboradoraId } = req.params;

      const resultado = await ColaboracionService.darDeBajaPorColaborador(
        proyectoId,
        colaboradoraId,
      );

      return res.status(200).json(resultado);
    } catch (error) {
      next(error);
    }
  }
}

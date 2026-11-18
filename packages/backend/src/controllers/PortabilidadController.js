import { PortabilidadService } from "../services/PortabilidadService.js";
import { FormatoExportacion } from "../domain/Exportacion/FormatoExportacion.js";
import { aCsv } from "../utils/csv.js";

const ENCABEZADOS_CSV = ["seccion", "registro", "campo", "valor"];

export class PortabilidadController {
  // la identidad sale de la sesión: no hay forma de pedir los datos de otra cuenta
  static async exportarMisDatos(req, res) {
    const { formato } = req.consulta;
    const exportacion = await PortabilidadService.exportar(req.cuenta);

    res.set({
      "Cache-Control": "no-store",
      "Content-Disposition": `attachment; filename="${exportacion.nombreArchivo(formato)}"`,
      "X-Content-Type-Options": "nosniff",
    });

    if (formato === FormatoExportacion.CSV) {
      const filas = exportacion
        .filas()
        .map(({ seccion, registro, campo, valor }) => [seccion, registro, campo, valor]);
      return res.type("text/csv; charset=utf-8").send(aCsv(ENCABEZADOS_CSV, filas));
    }

    res
      .type("application/json; charset=utf-8")
      .send(JSON.stringify(exportacion, null, 2));
  }
}

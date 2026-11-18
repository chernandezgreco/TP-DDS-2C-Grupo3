import { z } from "zod";
import { FormatoExportacion } from "../domain/Exportacion/FormatoExportacion.js";

export const exportacionQuerySchema = z.object({
    formato: z
        .enum(Object.values(FormatoExportacion), {
            error: "El formato debe ser json o csv",
        })
        .default(FormatoExportacion.JSON),
});

import authRoutes from "./routes/Auth.js";
import { resolverSesion } from "./services/AuthService.js";
import { autorizar } from "./middlewares/autorizar.js";
import "dotenv/config";
import adicionalesRoutes from "./routes/Adicionales.js";
import { crearLimitePublico } from "./middlewares/limitePublico.js";
import express from "express";
import cors from "cors";

import proyectosRoutes from "./routes/Proyectos.js";
import colectivosRoutes from "./routes/Colectivos.js";
import colaboradorasRoutes from "./routes/Colaboradora.js";
import habilidadesRoutes from "./routes/Habilidades.js";
import colaboracionesRoutes from "./routes/Colaboracion.js";
import logrosRoutes from "./routes/Logros.js";
import notificacionesRoutes from "./routes/Notificaciones.js";
import perfilesRoutes from "./routes/Perfiles.js";
import swaggerUi from "swagger-ui-express";
import { especificacion } from "./docs/swagger.js";
import { manejarErrores } from "./middlewares/manejarErrores.js";

export function crearApp() {
  const app = express();
  app.use(express.json());
  app.use(
    cors({
      credentials: true,
      origin: process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
        : ["http://localhost:3000"],
    }),
  );

  // Endpoint de Health Check (Requerimiento de la 1ra entrega)
  app.get("/health", (req, res) => {
    res.status(200).json({ status: "OK", timestamp: new Date() });
  });

  app.use("/api", crearLimitePublico());
  app.use("/api", resolverSesion);
  app.use("/api", authRoutes);
  app.use("/api", autorizar);
  app.use("/api", adicionalesRoutes);
  app.use("/api/proyectos/:proyectoId/logros", logrosRoutes);
  app.use("/api/proyectos/:proyectoId/perfiles", perfilesRoutes);
  app.use("/api/proyectos", proyectosRoutes);
  app.use("/api/colectivos", colectivosRoutes);
  app.use("/api/colaboradoras", colaboradorasRoutes);
  app.use("/api/habilidades", habilidadesRoutes);
  app.use("/api/colaboraciones", colaboracionesRoutes);
  app.use("/api/notificaciones", notificacionesRoutes);

  app.get("/api-docs.json", (req, res) => res.json(especificacion));
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(especificacion));

  app.get("/", (req, res) => {
    res.json({ mensaje: "Bienvenido al backend de Código a Voluntad" });
  });

  // Tiene que ir después de todas las rutas: traduce los errores a status HTTP
  app.use(manejarErrores);

  return app;
}

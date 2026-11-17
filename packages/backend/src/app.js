import authRoutes from "./routes/Auth.js";
import { resolverSesion } from "./services/AuthService.js";
import { autorizar } from "./middlewares/autorizar.js";
import "dotenv/config";
import adicionalesRoutes from "./routes/Adicionales.js";
import { crearLimitePublico } from "./middlewares/limitePublico.js";
import express from "express";
import cors from "cors";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

import proyectosRoutes from "./routes/Proyectos.js";
import colectivosRoutes from "./routes/Colectivos.js";
import colaboradorasRoutes from "./routes/Colaboradora.js";
import habilidadesRoutes from "./routes/Habilidades.js";
import colaboracionesRoutes from "./routes/Colaboracion.js";
import logrosRoutes from "./routes/Logros.js";
import tareasRoutes from "./routes/Tareas.js";
import notificacionesRoutes from "./routes/Notificaciones.js";
import perfilesRoutes from "./routes/Perfiles.js";
import denunciasRoutes from "./routes/Denuncias.js";
import linkedinRoutes from "./routes/LinkedIn.js";
import swaggerUi from "swagger-ui-express";
import { especificacion } from "./docs/swagger.js";
import { manejarErrores } from "./middlewares/manejarErrores.js";

// Carpeta del front compilado (npm run build). En produccion el backend lo sirve
// para que front y API vivan bajo el mismo origen (la cookie de sesion es lax).
const CARPETA_FRONT_POR_DEFECTO = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../frontend/build",
);

export function crearApp({
  carpetaFront = process.env.FRONTEND_BUILD_DIR || CARPETA_FRONT_POR_DEFECTO,
} = {}) {
  const app = express();
  // Detras del proxy de Render, sin esto req.ip seria siempre la IP del proxy
  // y el limite por IP contaria a todos los usuarios juntos.
  if (process.env.NODE_ENV === "production") app.set("trust proxy", 1);
  app.use(express.json());
  app.use(
    cors({
      credentials: true,
      origin: process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
        : ["http://localhost:3000"],
    }),
  );


  app.get("/health", (req, res) => {
    res.status(200).json({ status: "OK", timestamp: new Date() });
  });

  app.use("/api", crearLimitePublico());
  app.use("/api", resolverSesion);
  app.use("/api", authRoutes);
  app.use("/api", autorizar);
  app.use("/api", adicionalesRoutes);
  app.use("/api", denunciasRoutes);
  app.use("/api", linkedinRoutes);
  app.use("/api/proyectos/:proyectoId/logros", logrosRoutes);
  app.use("/api/proyectos/:proyectoId/perfiles", perfilesRoutes);
  app.use("/api/proyectos/:proyectoId/tareas", tareasRoutes);
  app.use("/api/proyectos", proyectosRoutes);
  app.use("/api/colectivos", colectivosRoutes);
  app.use("/api/colaboradoras", colaboradorasRoutes);
  app.use("/api/habilidades", habilidadesRoutes);
  app.use("/api/colaboraciones", colaboracionesRoutes);
  app.use("/api/notificaciones", notificacionesRoutes);

  app.get("/api-docs.json", (req, res) => res.json(especificacion));
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(especificacion));

  if (fs.existsSync(path.join(carpetaFront, "index.html"))) {
    app.use(express.static(carpetaFront));
    // La SPA maneja sus pantallas: cualquier GET que no sea API ni docs devuelve el index.
    app.get(/^\/(?!api|api-docs|health).*/, (req, res) =>
      res.sendFile(path.join(carpetaFront, "index.html")),
    );
  } else {
    app.get("/", (req, res) => {
      res.json({ mensaje: "Bienvenido al backend de Código a Voluntad" });
    });
  }

  
  app.use(manejarErrores);

  return app;
}

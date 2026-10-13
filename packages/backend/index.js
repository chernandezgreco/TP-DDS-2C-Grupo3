import "dotenv/config";
import express from "express";
import cors from "cors";

import proyectosRoutes from "./src/routes/Proyectos.js";
import colectivosRoutes from "./src/routes/Colectivos.js";
import colaboradorasRoutes from "./src/routes/Colaboradora.js";
import habilidadesRoutes from "./src/routes/Habilidades.js";
import colaboracionesRoutes from "./src/routes/Colaboracion.js";
import logrosRoutes from "./src/routes/Logros.js";
import notificacionesRoutes from "./src/routes/Notificaciones.js";
import perfilesRoutes from "./src/routes/Perfiles.js";
import { conectarMongo } from "./src/config/mongo.js";
import swaggerUi from "swagger-ui-express";
import { especificacion } from "./src/docs/swagger.js";
import { manejarErrores } from "./src/middlewares/manejarErrores.js";



const app = express();
app.use(express.json());
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
      : true,
  })
);

// Endpoint de Health Check (Requerimiento de la 1ra entrega)
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date() });
});

app.use("/api/proyectos/:proyectoId/logros", logrosRoutes);
app.use("/api/proyectos/:proyectoId/perfiles", perfilesRoutes);
app.use("/api/proyectos", proyectosRoutes);
app.use("/api/colectivos", colectivosRoutes);
app.use("/api/colaboradoras", colaboradorasRoutes);
app.use("/api/habilidades", habilidadesRoutes);
app.use("/api/colaboraciones", colaboracionesRoutes);
app.use("/api/notificaciones", notificacionesRoutes);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(especificacion));

app.get("/", (req, res) => {
  res.json({ mensaje: "Bienvenido al backend de Código a Voluntad" });
});

// Tiene que ir después de todas las rutas: traduce los errores a status HTTP
app.use(manejarErrores);

const PORT = process.env.PORT || process.env.SERVER_PORT || 8000;

await conectarMongo();

app.listen(PORT, () => {
  console.log(`Backend escuchando en puerto ${PORT}`);
});

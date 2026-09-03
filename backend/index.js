import "dotenv/config";
import express from "express";
import cors from "cors";

import proyectosRoutes from "./src/routes/proyectos.js";
import colectivosRoutes from "./src/routes/Colectivos.js";
import colaboradorasRoutes from "./src/routes/Colaboradora.js";
import habilidadesRoutes from "./src/routes/Habilidades.js";
import colaboracionesRoutes from "./src/routes/colaboracion.js";



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

app.use("/api/proyectos", proyectosRoutes);
app.use("/api/colectivos", colectivosRoutes);
app.use("/api/colaboradoras", colaboradorasRoutes);
app.use("/api/habilidades", habilidadesRoutes);
app.use("/api/colaboracion", colaboracionesRoutes);

const PORT = process.env.SERVER_PORT || 3000;

app.listen(PORT, () => {
    console.log(`Backend escuchando en puerto ${PORT}`);
});


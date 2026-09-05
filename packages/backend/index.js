import express from "express";
import cors from "cors";
import "dotenv/config";
import apiRoutes from "./routes/api.js"; // Importa tus rutas

const app = express();
app.use(express.json());
app.use(
    cors({
        origin: process.env.ALLOWED_ORIGINS
            ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
            : true,
    }),
);

// Monta las rutas de la API bajo el prefijo /api
app.use("/api", apiRoutes);

app.get("/hello", (req, res) => {
    res.json({ message: "hello world" });
});

app.listen(process.env.SERVER_PORT, () => {
    console.log(`Backend escuchando en puerto ${process.env.SERVER_PORT}`);
});
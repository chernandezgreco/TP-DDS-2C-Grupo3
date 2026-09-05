import "dotenv/config";
import express from "express";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
      : true,
  }),
);

app.get("/hello", (req, res) => {
  res.json({ message: "hello world" });
});

// Health check: requerido por la cátedra para la 1ra entrega.
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date() });
});

// Render (y la mayoría de los hosts) inyectan su propio puerto en process.env.PORT.
// En local seguimos usando SERVER_PORT (definido en .env) para no romper lo que ya tenían.
const PORT = process.env.PORT || process.env.SERVER_PORT || 3000;

app.listen(PORT, () => {
  console.log(`Backend escuchando en puerto ${PORT}`);
});

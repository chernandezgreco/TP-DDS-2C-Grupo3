import "dotenv/config";
import { crearApp } from "./src/app.js";
import { conectarMongo } from "./src/config/mongo.js";
await conectarMongo();
const PORT = process.env.PORT || process.env.SERVER_PORT || 8000;
crearApp().listen(PORT, () =>
  console.log(`Backend escuchando en puerto ${PORT}`),
);

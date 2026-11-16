import "dotenv/config";
import { crearApp } from "./src/app.js";
import { conectarMongo } from "./src/config/mongo.js";
import { iniciarCierreAutomatico } from "./src/jobs/cierreAutomatico.js";

await conectarMongo();
await iniciarCierreAutomatico();

const PORT = process.env.PORT || process.env.SERVER_PORT || 8000;

crearApp().listen(PORT, () =>
    console.log(`Backend escuchando en puerto ${PORT}`),
);
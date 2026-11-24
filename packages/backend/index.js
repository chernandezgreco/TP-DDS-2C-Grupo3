import "dotenv/config";
import mongoose from "mongoose";
import { crearApp } from "./src/app.js";
import { conectarMongo } from "./src/config/mongo.js";
import { iniciarCierreAutomatico } from "./src/jobs/cierreAutomatico.js";

await conectarMongo();
const detenerCierreAutomatico = await iniciarCierreAutomatico();

const PORT = process.env.PORT || process.env.SERVER_PORT || 8000;

const server = crearApp().listen(PORT, () =>
  console.log(`Backend escuchando en puerto ${PORT}`),
);

let cerrando = false;
const cerrarServidor = (signal) => {
  if (cerrando) return;
  cerrando = true;
  console.log(`Recibida señal ${signal}; cerrando backend...`);
  detenerCierreAutomatico();

  const limite = setTimeout(() => server.closeAllConnections?.(), 10000);
  limite.unref();
  server.close(async (error) => {
    clearTimeout(limite);
    if (error) {
      console.error("No se pudo cerrar el servidor correctamente:", error.message);
      process.exitCode = 1;
    }
    try {
      await mongoose.disconnect();
    } catch (disconnectError) {
      console.error("No se pudo cerrar la conexión con MongoDB:", disconnectError.message);
      process.exitCode = 1;
    }
  });
};

process.on("SIGINT", () => cerrarServidor("SIGINT"));
process.on("SIGTERM", () => cerrarServidor("SIGTERM"));

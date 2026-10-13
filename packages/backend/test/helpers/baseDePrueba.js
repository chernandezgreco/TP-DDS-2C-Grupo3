import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

// Mongo real en memoria. Si existe MONGO_URI_TEST se usa esa base en su lugar.
let servidor;

export const conectarBaseDePrueba = async () => {
    let uri = process.env.MONGO_URI_TEST;
    if (!uri) {
        servidor = await MongoMemoryServer.create();
        uri = servidor.getUri();
    }

    // un nombre distinto por proceso para que los archivos de test no se pisen
    await mongoose.connect(uri, { dbName: `test_${process.pid}` });
};

export const limpiarBaseDePrueba = async () => {
    const colecciones = Object.values(mongoose.connection.collections);
    await Promise.all(colecciones.map((coleccion) => coleccion.deleteMany({})));
};

export const desconectarBaseDePrueba = async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
    if (servidor) {
        await servidor.stop();
    }
};

export const idInexistente = () => new mongoose.Types.ObjectId().toString();

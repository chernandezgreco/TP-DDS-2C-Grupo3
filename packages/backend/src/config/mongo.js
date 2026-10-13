import mongoose from "mongoose";

export const conectarMongo = async () => {
    const uri = process.env.MONGO_URI;
    if (!uri) {
        throw new Error("Falta la variable de entorno MONGO_URI");
    }

    await mongoose.connect(uri);
    console.log("Conectado a MongoDB");
};

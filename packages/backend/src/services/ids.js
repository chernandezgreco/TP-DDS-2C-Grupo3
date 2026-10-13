import mongoose from "mongoose";

// un id que no tiene formato de Mongo no puede existir: los services lo tratan como "no encontrado"
export const esIdValido = (id) => mongoose.isObjectIdOrHexString(id);

import mongoose from "mongoose";

// un id que no tiene formato de Mongo no puede existir: los services lo tratan como "no encontrado"
// genera un ObjectId de Mongo (como texto) para subdocumentos que necesitamos identificar antes de guardar
export const nuevoId = () => new mongoose.Types.ObjectId().toString();

export const esIdValido = (id) => mongoose.isObjectIdOrHexString(id);

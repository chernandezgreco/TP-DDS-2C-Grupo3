import mongoose from "mongoose";
const terminosSchema = new mongoose.Schema(
  {
    version: { type: String, required: true, unique: true },
    titulo: { type: String, required: true },
    contenido: { type: String, required: true },
  },
  { timestamps: true },
);
export const TerminosModel = mongoose.model("Terminos", terminosSchema);
const revisionSchema = new mongoose.Schema(
  {
    recurso: {
      type: String,
      enum: ["proyectos", "colectivos"],
      required: true,
    },
    recursoId: { type: String, required: true },
    suspendido: { type: Boolean, required: true },
    motivo: { type: String, required: true },
    versionTerminos: { type: String, required: true },
  },
  { timestamps: true },
);
export const RevisionTerminosModel = mongoose.model(
  "RevisionTerminos",
  revisionSchema,
);

import mongoose from "mongoose";
const cuentaSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true, select: false },
    salt: { type: String, required: true, select: false },
    tipo: {
      type: String,
      enum: ["colectivos", "colaboradoras"],
      required: true,
    },
    perfilId: { type: String, required: true },
  },
  { timestamps: true },
);
export const CuentaModel = mongoose.model("Cuenta", cuentaSchema);
const sesionSchema = new mongoose.Schema({
  tokenHash: { type: String, required: true, unique: true },
  cuentaId: { type: mongoose.Schema.Types.ObjectId, required: true },
  expira: { type: Date, required: true, index: { expires: 0 } },
});
export const SesionModel = mongoose.model("Sesion", sesionSchema);

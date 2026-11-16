import mongoose from "mongoose";

const oauthStateSchema = new mongoose.Schema({
  stateHash: { type: String, required: true, unique: true },
  cuentaId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Cuenta" },
  expira: { type: Date, required: true, index: { expires: 0 } },
});

const connectionSchema = new mongoose.Schema(
  {
    cuentaId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true,
      ref: "Cuenta",
    },
    memberId: { type: String, required: true },
    nombre: { type: String, default: "" },
    nombrePila: { type: String, default: "" },
    apellido: { type: String, default: "" },
    foto: { type: String, default: "" },
    tokenCifrado: { type: String, required: true, select: false },
    tokenIv: { type: String, required: true, select: false },
    tokenTag: { type: String, required: true, select: false },
    tokenExpira: { type: Date, required: true },
  },
  { timestamps: true },
);

export const LinkedInOAuthStateModel = mongoose.model(
  "LinkedInOAuthState",
  oauthStateSchema,
);
export const LinkedInConnectionModel = mongoose.model(
  "LinkedInConnection",
  connectionSchema,
);

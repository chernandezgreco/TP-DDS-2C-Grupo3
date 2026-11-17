import mongoose from "mongoose";
import { TipoColectivo } from "../domain/Colectivo/TipoColectivo.js";
import { TipoCompromiso } from "../domain/Compromiso/TipoCompromiso.js";
import { EstadoProyecto } from "../domain/Proyecto/EstadoProyecto.js";
import { TipoMedioContacto } from "../domain/Colaboradora/TipoMedioContacto.js";
import { EstadoColaboracion } from "../domain/Colaboracion/EstadoColaboracion.js";
import { EstadoPostulacion } from "../domain/Postulacion/EstadoPostulacion.js";
import { EstadoTarea } from "../domain/Tarea/EstadoTarea.js";

// --- 1. HABILIDAD ---
const habilidadSchema = new mongoose.Schema({
  codigo: { type: String, required: true, unique: true },
  titulo: { type: String, required: true },
  descripcion: { type: String, required: true },
});
export const HabilidadModel = mongoose.model("Habilidad", habilidadSchema);

// --- 2. COLECTIVO ---
const moderacionTerminos = new mongoose.Schema(
  {
    suspendido: { type: Boolean, default: false },
    motivo: String,
    version: String,
    fecha: Date,
  },
  { _id: false },
);
const colectivoSchema = new mongoose.Schema({
  moderacionTerminos: {
    type: moderacionTerminos,
    default: () => ({ suspendido: false }),
  },
  nombre: { type: String, required: true },
  descripcion: { type: String, required: true },
  tipo: { type: String, enum: Object.values(TipoColectivo), required: true },
  ubicacion: { type: String },
  cuentaEliminadaAt: { type: Date, default: null },
});
export const ColectivoModel = mongoose.model("Colectivo", colectivoSchema);

// --- 3. PROYECTO ---
const perfilSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    descripcionPerfil: { type: String, required: true },
    fechaLimite: { type: Date, default: null },
    cantidadLimite: { type: Number, min: 1, default: null },

    habilidadesRequeridas: [{ type: String, required: true }],
    habilidadesOpcionales: [{ type: String }],
    compromiso: {
      cantidadHoras: { type: Number, required: true },
      tipo: {
        type: String,
        enum: Object.values(TipoCompromiso),
        required: true,
      },
    },
    modalidad: {
      gratuita: { type: Boolean, required: true },
      incentivoEconomico: { type: Boolean, required: true },
      contratacionEventual: { type: Boolean, required: true },
    },
  },
  { _id: false },
);

const logroSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    descripcion: { type: String, required: true, trim: true },
    porcentajeCompletitud: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    enlaceSistema: { type: String, default: null },
    enlaceFuentePublica: { type: String, default: null },
    fechaCreacion: { type: Date, default: Date.now },
  },
  { _id: false },
);

const proyectoSchema = new mongoose.Schema({
  requiereIA: { type: Boolean, default: null },
  usosIA: {
    type: [
      new mongoose.Schema(
        {
          descripcion: { type: String, required: true },
          justificacion: { type: String, required: true },
          grado: {
            type: String,
            enum: ["BAJO", "MEDIO", "ALTO"],
            required: true,
          },
        },
        { _id: false },
      ),
    ],
    default: [],
  },
  aceptacionTerminos: { version: String, fecha: Date },
  moderacionTerminos: {
    type: moderacionTerminos,
    default: () => ({ suspendido: false }),
  },
  estaBuscando: { type: Boolean, default: true },
  titulo: { type: String, required: true },
  descripcion: { type: String, required: true },
  colectivoId: { type: String, required: true },
  estado: {
    type: String,
    enum: Object.values(EstadoProyecto),
    default: EstadoProyecto.ACTIVO,
  },
  perfiles: { type: [perfilSchema], default: [] },
  logros: { type: [logroSchema], default: [] },
});
export const ProyectoModel = mongoose.model("Proyecto", proyectoSchema);

// --- 4. COLABORADORA ---
const colaboradoraSchema = new mongoose.Schema({
  nombreFantasia: { type: String, required: true },
  github: { type: String, required: true },
  nombreApellido: { type: String },
  linkedinFoto: { type: String, default: "" },
  habilidades: [{ type: String }],
  experienciaHabilidades: {
    type: [
      new mongoose.Schema(
        {
          codigo: { type: String, required: true },
          nivel: { type: String, enum: ["INICIAL", "INTERMEDIO", "AVANZADO"], required: true },
          anios: { type: Number, min: 0, max: 60, required: true },
        },
        { _id: false },
      ),
    ],
    default: [],
  },
  pronombres: { type: String },
  presentacion: { type: String },
  aceptaMensajeria: { type: Boolean, default: false },
  mediosContacto: [
    {
      _id: false,
      tipo: {
        type: String,
        enum: Object.values(TipoMedioContacto),
        required: true,
      },
      valor: { type: String, required: true },
    },
  ],
});
export const ColaboradoraModel = mongoose.model(
  "Colaboradora",
  colaboradoraSchema,
);

// --- 5. COLABORACIÓN ---
const colaboracionSchema = new mongoose.Schema({
  anonimidad: { type: Boolean, default: false },
  proyectoId: { type: String, required: true },
  perfilId: { type: String, required: true },
  colaboradoraId: { type: String, required: true },
  estado: {
    type: String,
    enum: Object.values(EstadoColaboracion),
    default: EstadoColaboracion.ACTIVA,
  },
  fechaCreacion: { type: Date, default: Date.now },
});
export const ColaboracionModel = mongoose.model(
  "Colaboracion",
  colaboracionSchema,
);

// --- 6. NOTIFICACION ---
const notificacionSchema = new mongoose.Schema({
  colaboradoraId: { type: String, required: true },
  colectivoId: { type: String, required: true },
  proyectoId: { type: String, required: true },
  texto: { type: String, required: true },
  fecha: { type: Date, default: Date.now },
});
export const NotificacionModel = mongoose.model(
  "Notificacion",
  notificacionSchema,
);

// --- 5. COLABORACIÓN ---
const postulacionSchema = new mongoose.Schema({
  anonimidad: { type: Boolean, default: false },
  proyectoId: { type: String, required: true },
  perfilId: { type: String, required: true },
  colaboradoraId: { type: String, required: true },
  estado: {
    type: String,
    enum: Object.values(EstadoPostulacion),
    default: EstadoPostulacion.PENDIENTE,
  },
  fechaCreacion: { type: Date, default: Date.now },
});
export const PostulacionModel = mongoose.model(
  "Postulacion",
  postulacionSchema,
);

const denunciaSchema = new mongoose.Schema({
  cuentaDenuncianteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Cuenta",
    required: true,
  },
  denuncianteTipo: {
    type: String,
    enum: ["colectivos", "colaboradoras"],
    required: true,
  },
  denunciantePerfilId: {
    type: String,
    required: true,
  },
  tipoEntidadDenunciada: {
    type: String,
    enum: ["colectivo", "proyecto"],
    required: true,
  },
  entidadDenunciadaId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  motivo: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  descripcion: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000,
  },
  estado: {
    type: String,
    enum: ["pendiente", "en_revision", "resuelta", "desestimada"],
    default: "pendiente",
  },
  fechaCreacion: {
    type: Date,
    default: Date.now,
  },
});
export const DenunciaModel = mongoose.model(
  "Denuncia",
  denunciaSchema,
);

// --- TAREA (colección propia: el proyecto no las contiene, se consultan por proyectoId) ---
const tareaSchema = new mongoose.Schema({
  proyectoId: { type: String, required: true },
  nombre: { type: String, required: true, trim: true },
  descripcion: { type: String, default: null },
  fechaInicio: { type: Date, required: true },
  fechaFin: { type: Date, required: true },
  responsableId: { type: String, default: null },
  estado: {
    type: String,
    enum: Object.values(EstadoTarea),
    default: EstadoTarea.PENDIENTE,
  },
  fechaCreacion: { type: Date, default: Date.now },
});
tareaSchema.index({ proyectoId: 1, fechaInicio: 1 });
export const TareaModel = mongoose.model("Tarea", tareaSchema);

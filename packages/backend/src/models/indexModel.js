import mongoose from "mongoose";
import { TipoColectivo } from "../domain/Colectivo/TipoColectivo.js";
import { TipoCompromiso } from "../domain/Compromiso/TipoCompromiso.js";
import { EstadoProyecto } from "../domain/Proyecto/EstadoProyecto.js";
import { TipoMedioContacto } from "../domain/Colaboradora/TipoMedioContacto.js";
import { EstadoColaboracion } from "../domain/Colaboracion/EstadoColaboracion.js";

// --- 1. HABILIDAD ---
const habilidadSchema = new mongoose.Schema({
    codigo: { type: String, required: true, unique: true },
    titulo: { type: String, required: true },
    descripcion: { type: String, required: true }
});
export const HabilidadModel = mongoose.model("Habilidad", habilidadSchema);


// --- 2. COLECTIVO ---
const colectivoSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    descripcion: { type: String, required: true },
    tipo: { type: String, enum: Object.values(TipoColectivo), required: true },
    ubicacion: { type: String }
});
export const ColectivoModel = mongoose.model("Colectivo", colectivoSchema);


// --- 3. PROYECTO ---
const perfilSchema = new mongoose.Schema({
    id: { type: String, required: true },
    descripcionPerfil: { type: String, required: true },
    compromiso: {
        cantidadHoras: { type: Number, required: true },
        tipo: { type: String, enum: Object.values(TipoCompromiso), required: true }
    },
    habilidadesRequeridas: [{ type: String, required: true }],
    habilidadesOpcionales: [{ type: String }],
    modalidad: {
        gratuita: { type: Boolean, required: true },
        incentivoEconomico: { type: Boolean, required: true },
        contratacionEventual: { type: Boolean, required: true }
    }
}, { _id: false });

const logroSchema = new mongoose.Schema(
    {
        id: { type: String, required: true },
        descripcion: { type: String, required: true, trim: true },
        porcentajeCompletitud: {
            type: Number,
            required: true,
            min: 0,
            max: 100
        },
        enlaceSistema: { type: String, default: null },
        enlaceFuentePublica: { type: String, default: null },
        fechaCreacion: { type: Date, default: Date.now }
    },
    { _id: false }
);

const proyectoSchema = new mongoose.Schema({
    titulo: { type: String, required: true },
    descripcion: { type: String, required: true },
    colectivoId: { type: String, required: true },
    estado: { type: String, enum: Object.values(EstadoProyecto), default: EstadoProyecto.ACTIVO },
    perfiles: { type: [perfilSchema], default: [] },
    logros: { type: [logroSchema], default: [] }
});
export const ProyectoModel = mongoose.model("Proyecto", proyectoSchema);


// --- 4. COLABORADORA ---
const colaboradoraSchema = new mongoose.Schema({
    nombreFantasia: { type: String, required: true },
    github: { type: String, required: true },
    nombreApellido: { type: String },
    habilidades: [{ type: String }],
    pronombres: { type: String },
    presentacion: { type: String },
    aceptaMensajeria: { type: Boolean, default: false },
    mediosContacto: [
        {
            _id: false,
            tipo: { type: String, enum: Object.values(TipoMedioContacto), required: true },
            valor: { type: String, required: true }
        }
    ]
});
export const ColaboradoraModel = mongoose.model("Colaboradora", colaboradoraSchema);


// --- 5. COLABORACIÓN ---
const colaboracionSchema = new mongoose.Schema({
    proyectoId: { type: String, required: true },
    perfilId: { type: String, required: true },
    colaboradoraId: { type: String, required: true },
    estado: { type: String, enum: Object.values(EstadoColaboracion), default: EstadoColaboracion.PENDIENTE },
    fechaCreacion: { type: Date, default: Date.now }
});
export const ColaboracionModel = mongoose.model("Colaboracion", colaboracionSchema);


// --- 6. NOTIFICACION ---
const notificacionSchema = new mongoose.Schema({
    colaboradoraId: { type: String, required: true },
    colectivoId: { type: String, required: true },
    proyectoId: { type: String, required: true },
    texto: { type: String, required: true },
    fecha: { type: Date, default: Date.now }
});
export const NotificacionModel = mongoose.model("Notificacion", notificacionSchema);

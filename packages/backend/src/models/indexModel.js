import mongoose from "mongoose";

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
    descripcion: { type: String },
    tipo: { type: String },
    ubicacion: { type: String }
});
export const ColectivoModel = mongoose.model("Colectivo", colectivoSchema);


// --- 3. PROYECTO ---
const perfilSchema = new mongoose.Schema({
    descripcionPerfil: { type: String, required: true },
    compromiso: {
        cantidadHoras: { type: Number, required: true },
        tipo: { type: String, enum: ["TOTALES", "SEMANALES", "MENSUALES"], required: true }
    },
    habilidadesRequeridas: [{ type: String, required: true }],
    habilidadesOpcionales: [{ type: String }],
    modalidad: {
        gratuita: { type: Boolean, required: true },
        incentivoEconomico: { type: Boolean, required: true },
        contratacionEventual: { type: Boolean, required: true }
    }
});

const proyectoSchema = new mongoose.Schema({
    titulo: { type: String, required: true },
    descripcion: { type: String, required: true },
    colectivoId: { type: String, required: true },
    estado: { type: String, default: "ACTIVO" },
    perfiles: [perfilSchema]
});
export const ProyectoModel = mongoose.model("Proyecto", proyectoSchema);


// --- 4. COLABORADORA ---
const colaboradoraSchema = new mongoose.Schema({
    nombreFantasia: { type: String },
    github: { type: String },
    nombreApellido: { type: String, required: true },
    habilidades: [{ type: String }],
    pronombres: { type: String },
    presentacion: { type: String },
    aceptaMensajeria: { type: Boolean, default: false },
    mediosContacto: [
        {
            _id: false,
            tipo: { type: String, enum: ["EMAIL", "WHATSAPP", "SMS"], required: true },
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
    estado: { type: String, default: "PENDIENTE" },
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

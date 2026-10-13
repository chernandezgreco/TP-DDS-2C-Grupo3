// Script semilla: borra las colecciones y carga los datos iniciales.
// Uso: npm run seed (toma MONGO_URI del .env). Cuidado: pisa todo lo que haya en esa base.
import "dotenv/config";
import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import { conectarMongo } from "../config/mongo.js";
import {
    ColaboracionModel,
    ColaboradoraModel,
    ColectivoModel,
    HabilidadModel,
    NotificacionModel,
    ProyectoModel,
} from "../models/indexModel.js";
import { Habilidad } from "../domain/Habilidad/Habilidad.js";
import { Colectivo } from "../domain/Colectivo/Colectivo.js";
import { Colaboradora } from "../domain/Colaboradora/Colaboradora.js";
import { MedioContacto } from "../domain/Colaboradora/MedioContacto.js";
import { Proyecto } from "../domain/Proyecto/Proyecto.js";
import { Colaboracion } from "../domain/Colaboracion/Colaboracion.js";
import { Notificacion } from "../domain/Notificacion/Notificacion.js";
import { aDocumento, crearPerfil } from "../services/ProyectoService.js";
import { cargarLogrosIniciales } from "./logros.js";
import { COLABORACIONES, COLABORADORAS, COLECTIVOS, HABILIDADES, IDS, NOTIFICACIONES, PROYECTOS } from "./datos.js";

// cada entidad se arma con su clase de dominio, así los datos semilla pasan por las mismas validaciones

const habilidades = HABILIDADES.map((h) => new Habilidad(Habilidad.codigoPara(h.titulo), h.titulo, h.descripcion));

const colectivos = COLECTIVOS.map((c) => new Colectivo(c.id, c.nombre, c.descripcion, c.ubicacion, c.tipo));

const colaboradoras = COLABORADORAS.map((c) => new Colaboradora(
    c.id,
    c.nombreFantasia,
    c.github,
    c.nombreApellido,
    c.habilidades,
    c.pronombres,
    c.presentacion,
    c.mediosContacto.map((m) => new MedioContacto(m.tipo, m.valor)),
    c.aceptaMensajeria
));

const proyectos = PROYECTOS.map((p) => new Proyecto(
    p.id,
    p.titulo,
    p.descripcion,
    p.colectivoId,
    p.perfiles.map((perfil) => crearPerfil(uuidv4(), perfil))
));

// las colaboraciones se arman con los proyectos activos; recién después se cierran los finalizados
const colaboraciones = COLABORACIONES.map(({ proyectoId, colaboradoraId }) => {
    const proyecto = proyectos.find((p) => p.id === proyectoId);
    const colaboradora = colaboradoras.find((c) => c.id === colaboradoraId);
    const perfil = proyecto.perfilParaAnotar(colaboradora);
    return new Colaboracion(null, proyecto.id, perfil.id, colaboradora.id);
});

PROYECTOS.filter((p) => p.finalizado).forEach((p) => proyectos.find((proyecto) => proyecto.id === p.id).cerrar());

const notificaciones = NOTIFICACIONES.map((n) => new Notificacion(null, n.colaboradoraId, n.colectivoId, n.proyectoId, n.texto));

// referencias: todas las habilidades usadas tienen que existir
const codigos = habilidades.map((h) => h.codigo);
const usadas = [
    ...colaboradoras.flatMap((c) => c.habilidades),
    ...proyectos.flatMap((p) => p.perfiles.flatMap((perfil) => perfil.todasLasHabilidades())),
];
const inexistentes = usadas.filter((codigo) => !codigos.includes(codigo));
if (inexistentes.length > 0) {
    throw new Error(`Los datos semilla usan habilidades que no existen: ${[...new Set(inexistentes)].join(", ")}`);
}

await conectarMongo();
console.log(`Cargando datos semilla en la base "${mongoose.connection.name}"...`);

await Promise.all([
    HabilidadModel.deleteMany({}),
    ColectivoModel.deleteMany({}),
    ColaboradoraModel.deleteMany({}),
    ProyectoModel.deleteMany({}),
    ColaboracionModel.deleteMany({}),
    NotificacionModel.deleteMany({}),
]);

await HabilidadModel.insertMany(habilidades.map((h) => ({ codigo: h.codigo, titulo: h.titulo, descripcion: h.descripcion })));

await ColectivoModel.insertMany(colectivos.map((c) => ({
    _id: c.id,
    nombre: c.nombre,
    descripcion: c.descripcion,
    ubicacion: c.ubicacion,
    tipo: c.tipo,
})));

await ColaboradoraModel.insertMany(colaboradoras.map((c) => ({
    _id: c.id,
    nombreFantasia: c.nombreFantasia,
    github: c.github,
    nombreApellido: c.nombreApellido,
    habilidades: c.habilidades,
    pronombres: c.pronombres,
    presentacion: c.presentacion,
    aceptaMensajeria: c.aceptaMensajeria,
    mediosContacto: c.mediosContacto.map((m) => ({ tipo: m.tipo, valor: m.valor })),
})));

await ProyectoModel.insertMany(proyectos.map((p) => ({ _id: p.id, ...aDocumento(p) })));

await ColaboracionModel.insertMany(colaboraciones.map((c) => ({
    proyectoId: c.proyectoId,
    perfilId: c.perfilId,
    colaboradoraId: c.colaboradoraId,
    estado: c.estado,
    fechaCreacion: c.fechaCreacion,
})));

await NotificacionModel.insertMany(notificaciones.map((n) => ({
    colaboradoraId: n.colaboradoraId,
    colectivoId: n.colectivoId,
    proyectoId: n.proyectoId,
    texto: n.texto,
    fecha: n.fecha,
})));

await cargarLogrosIniciales(IDS.proyectos.webDonaciones);

console.log(
    `Listo: ${habilidades.length} habilidades, ${colectivos.length} colectivos, ${colaboradoras.length} colaboradoras, ` +
    `${proyectos.length} proyectos, ${colaboraciones.length} colaboraciones, ${notificaciones.length} notificaciones y logros iniciales.`
);

await mongoose.disconnect();

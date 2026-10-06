import { Habilidad } from "../domain/Habilidad/Habilidad.js";
import { Colectivo } from "../domain/Colectivo/Colectivo.js";
import { TipoColectivo } from "../domain/Colectivo/TipoColectivo.js";
import { Colaboradora } from "../domain/Colaboradora/Colaboradora.js";
import { Proyecto } from "../domain/Proyecto/Proyecto.js";
import { Compromiso } from "../domain/Compromiso/Compromiso.js";
import { TipoCompromiso } from "../domain/Compromiso/TipoCompromiso.js";
import { ModalidadColaboracion } from "../domain/ModalidadColaboracion/ModalidadColaboracion.js";
import { Colaboracion } from "../domain/Colaboracion/Colaboracion.js";

// Datos ficticios para probar los endpoints. Los IDs son fijos para poder usarlos directo en las requests.

const habilidades = [
    new Habilidad("javascript", "JavaScript", "Desarrollo con JavaScript"),
    new Habilidad("react", "React", "Desarrollo de interfaces con React"),
    new Habilidad("nodejs", "NodeJS", "Desarrollo backend con Node y Express"),
    new Habilidad("diseno-ux", "Diseño UX", "Investigación y diseño de experiencia de usuario"),
    new Habilidad("bases-de-datos", "Bases de datos", "Modelado y consultas SQL/NoSQL"),
    new Habilidad("python", "Python", "Desarrollo con Python y análisis de datos"),
];

const colectivos = [
    new Colectivo("colectivo-1", "Fundación Manos Unidas", "Asistencia alimentaria en barrios del conurbano", "Avellaneda, Buenos Aires", TipoColectivo.FUNDACION),
    new Colectivo("colectivo-2", "Asamblea Villa Crespo", "Asamblea vecinal que organiza actividades culturales", "Villa Crespo, CABA", TipoColectivo.ASAMBLEA),
    new Colectivo("colectivo-3", "ONG Código Abierto", "Enseñanza de programación a jóvenes", "Rosario, Santa Fe", TipoColectivo.ONG),
];

const colaboradoras = [
    new Colaboradora("colaboradora-1", "Ada", "github.com/ada-dev", "Ada Gómez", ["javascript", "react"], "ella", "Frontend dev con ganas de ayudar"),
    new Colaboradora("colaboradora-2", "Grace", "github.com/grace-h", "Grace Pérez", ["nodejs", "bases-de-datos"], "ella", "Backend dev, me gustan las APIs"),
    new Colaboradora("colaboradora-3", "Lu", "gitlab.com/lu-ux", "Lucía Fernández", ["diseno-ux"], "elle", "Diseñadora UX/UI"),
    new Colaboradora("colaboradora-4", "Pyto", "github.com/pyto", "Martina Ríos", ["python"], "ella", "Data scientist"),
    new Colaboradora("colaboradora-5", "Full", "github.com/fullstack-sol", "Sol Martínez", ["javascript", "react", "nodejs"], "ella", "Fullstack"),
];

const proyectoFinalizado = new Proyecto(
    "proyecto-4",
    "Encuesta vecinal",
    "Análisis de datos de la encuesta del barrio",
    ["python"],
    new Compromiso(20, TipoCompromiso.TOTALES),
    new ModalidadColaboracion(true, false, false),
    "colectivo-2"
);
proyectoFinalizado.updateEstado("FINALIZADO");

const proyectos = [
    new Proyecto(
        "proyecto-1",
        "Web de donaciones",
        "Sitio para recibir y organizar donaciones de alimentos",
        ["javascript", "react"],
        new Compromiso(5, TipoCompromiso.SEMANALES),
        new ModalidadColaboracion(true, false, false),
        "colectivo-1"
    ),
    new Proyecto(
        "proyecto-2",
        "API de inventario",
        "Backend para controlar el stock del comedor",
        ["nodejs", "bases-de-datos"],
        new Compromiso(20, TipoCompromiso.MENSUALES),
        new ModalidadColaboracion(false, true, false),
        "colectivo-1"
    ),
    new Proyecto(
        "proyecto-3",
        "Plataforma de cursos",
        "Plataforma para los cursos de programación",
        ["react", "nodejs", "diseno-ux"],
        new Compromiso(100, TipoCompromiso.TOTALES),
        new ModalidadColaboracion(true, true, true),
        "colectivo-3"
    ),
    proyectoFinalizado,
];

const colaboraciones = [
    new Colaboracion("colaboracion-1", "proyecto-1", "colaboradora-1", new Date("2026-09-01")),
    new Colaboracion("colaboracion-2", "proyecto-2", "colaboradora-2", new Date("2026-09-10")),
    new Colaboracion("colaboracion-3", "proyecto-3", "colaboradora-5", new Date("2026-09-15")),
    new Colaboracion("colaboracion-4", "proyecto-4", "colaboradora-4", new Date("2026-08-01")),
];

export const db = {
    colectivos,
    proyectos,
    habilidades,
    colaboradoras,
    colaboraciones
};
